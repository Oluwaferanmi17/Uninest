import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const [totalUsers, totalListings, totalBookings, totalConversations] = await Promise.all([
      prisma.user.count(),
      prisma.listing.count(),
      prisma.booking.count(),
      prisma.conversation.count(),
    ]);

    const usersByRole = await prisma.user.groupBy({
      by: ["role"],
      _count: {
        role: true,
      },
    });

    const studentsCount = usersByRole.find((u) => u.role === "STUDENT")?._count.role || 0;
    const hostsCount = usersByRole.find((u) => u.role === "HOST")?._count.role || 0;
    const adminsCount = usersByRole.find((u) => u.role === "ADMIN")?._count.role || 0;

    return NextResponse.json({
      totalUsers,
      totalListings,
      totalBookings,
      totalConversations,
      studentsCount,
      hostsCount,
      adminsCount,
    });
  } catch (error) {
    console.error("Admin stats fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch platform stats" },
      { status: 500 }
    );
  }
}
