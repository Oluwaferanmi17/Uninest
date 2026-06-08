import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/host/stats
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;

    if (userRole !== "HOST") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Total listings
    const totalListings = await prisma.listing.count({
      where: { hostId: userId },
    });

    // Active bookings
    const activeBookings = await prisma.booking.count({
      where: { hostId: userId, status: { in: ["PENDING", "CONFIRMED"] } },
    });

    // Total earnings (from paid bookings)
    const paidBookings = await prisma.booking.findMany({
      where: { hostId: userId, paymentStatus: "PAID" },
      select: { amount: true },
    });
    const totalEarnings = paidBookings.reduce((sum, b) => sum + b.amount, 0);

    // Unread messages
    const conversations = await prisma.conversation.findMany({
      where: { hostId: userId },
      select: { id: true },
    });
    const conversationIds = conversations.map((c) => c.id);
    const unreadMessages = await prisma.message.count({
      where: {
        conversationId: { in: conversationIds },
        senderId: { not: userId },
        isRead: false,
      },
    });

    // Recent bookings
    const recentBookings = await prisma.booking.findMany({
      where: { hostId: userId },
      include: {
        student: { select: { name: true } },
        listing: { select: { title: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    return NextResponse.json({
      totalListings,
      activeBookings,
      totalEarnings,
      unreadMessages,
      recentBookings,
    });
  } catch (error) {
    console.error("Host stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
