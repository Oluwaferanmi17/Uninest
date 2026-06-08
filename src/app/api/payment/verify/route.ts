import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyTransaction } from "@/lib/paystack";

// POST /api/payment/verify
export async function POST(request: Request) {
  try {
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
      });

      if (booking) {
        await prisma.booking.update({
          where: { id: booking.id },
          data: { paymentStatus: "PAID" },
        });
      }

      return NextResponse.json({
        status: "success",
        message: "Payment verified successfully",
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
