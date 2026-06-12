import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { verifyTransaction } from "@/lib/paystack";

// POST /api/payment/verify
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { reference } = body;

    if (!reference) {
      return NextResponse.json(
        { error: "Payment reference is required" },
        { status: 400 }
      );
    }

    const result = await verifyTransaction(reference);

    if (result.status && result.data.status === "success") {
      // Update booking payment status
      const booking = await prisma.booking.findFirst({
        where: { paymentReference: reference },
        include: {
          listing: {
            select: {
              id: true,
              title: true,
              address: true,
              nearestUniversity: true,
              images: { take: 1, orderBy: { order: "asc" } },
            },
          },
          student: {
            select: { name: true, email: true, phone: true },
          },
          host: {
            select: { name: true, phone: true },
          },
        },
      });

      if (!booking) {
        return NextResponse.json(
          { error: "Booking not found for this payment reference" },
          { status: 404 }
        );
      }

      const userId = (session.user as any).id;
      if (booking.studentId !== userId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const updatedBooking =
        booking.paymentStatus === "PAID"
          ? booking
          : await prisma.booking.update({
              where: { id: booking.id },
              data: { paymentStatus: "PAID" },
              include: {
                listing: {
                  select: {
                    id: true,
                    title: true,
                    address: true,
                    nearestUniversity: true,
                    images: { take: 1, orderBy: { order: "asc" } },
                  },
                },
                student: {
                  select: { name: true, email: true, phone: true },
                },
                host: {
                  select: { name: true, phone: true },
                },
              },
            });

      return NextResponse.json({
        status: "success",
        message: "Payment verified successfully",
        receiptNumber: reference,
        verifiedAt: new Date().toISOString(),
        booking: updatedBooking,
      });
    }

    return NextResponse.json(
      { error: "Payment verification failed" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Payment verify error:", error);
    return NextResponse.json(
      { error: "Failed to verify payment" },
      { status: 500 }
    );
  }
}
