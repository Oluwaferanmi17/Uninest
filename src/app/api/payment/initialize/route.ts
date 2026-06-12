import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { initializeTransaction, generateReference } from "@/lib/paystack";

// POST /api/payment/initialize
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { bookingId } = body;

    if (!bookingId) {
      return NextResponse.json(
        { error: "Booking ID is required" },
        { status: 400 }
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { listing: true },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    const userId = (session.user as any).id;
    if (booking.studentId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (booking.status !== "CONFIRMED") {
      return NextResponse.json(
        { error: "Payment is only available after landlord approval" },
        { status: 400 }
      );
    }

    if (booking.paymentStatus === "PAID") {
      return NextResponse.json(
        { error: "This booking has already been paid for" },
        { status: 400 }
      );
    }

    const reference = generateReference();
    const callbackBase = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const callbackUrl = new URL("/student/bookings", callbackBase);
    callbackUrl.searchParams.set("reference", reference);

    const result = await initializeTransaction({
      email: session.user?.email || "",
      amount: booking.amount,
      reference,
      callback_url: callbackUrl.toString(),
      metadata: {
        bookingId: booking.id,
        listingId: booking.listingId,
        studentId: booking.studentId,
      },
    });

    if (result.status) {
      // Save reference to booking
      await prisma.booking.update({
        where: { id: bookingId },
        data: { paymentReference: reference },
      });

      return NextResponse.json({
        authorization_url: result.data.authorization_url,
        reference,
      });
    }

    return NextResponse.json(
      { error: "Failed to initialize payment" },
      { status: 500 }
    );
  } catch (error) {
    console.error("Payment init error:", error);
    return NextResponse.json(
      { error: "Failed to initialize payment" },
      { status: 500 }
    );
  }
}
