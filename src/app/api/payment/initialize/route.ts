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

    const reference = generateReference();

    const result = await initializeTransaction({
      email: session.user?.email || "",
      amount: booking.amount,
      reference,
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
