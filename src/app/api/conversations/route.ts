import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/conversations
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;

    const where =
      userRole === "HOST" ? { hostId: userId } : { studentId: userId };

    const conversations = await prisma.conversation.findMany({
      where,
      include: {
        listing: {
          select: { id: true, title: true, images: { take: 1 } },
        },
        student: {
          select: { id: true, name: true, avatar: true },
        },
        host: {
          select: { id: true, name: true, avatar: true },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
          select: { body: true, createdAt: true, senderId: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error("Conversations fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}

// POST /api/conversations — create or get existing
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { listingId, hostId } = body;

    if (!listingId || !hostId) {
      return NextResponse.json(
        { error: "Listing ID and Host ID are required" },
        { status: 400 }
      );
    }

    const studentId = (session.user as any).id;

    // Check if conversation already exists
    const existing = await prisma.conversation.findFirst({
      where: { listingId, studentId, hostId },
    });

    if (existing) {
      return NextResponse.json(existing);
    }

    // Create new conversation
    const conversation = await prisma.conversation.create({
      data: { listingId, studentId, hostId },
    });

    return NextResponse.json(conversation, { status: 201 });
  } catch (error) {
    console.error("Create conversation error:", error);
    return NextResponse.json(
      { error: "Failed to create conversation" },
      { status: 500 }
    );
  }
}
