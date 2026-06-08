import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/listings/[id]
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const listing = await prisma.listing.findUnique({
      where: { id: params.id },
      include: {
        images: { orderBy: { order: "asc" } },
        host: {
          select: {
            id: true,
            name: true,
            avatar: true,
            businessName: true,
            phone: true,
            aboutMe: true,
            createdAt: true,
          },
        },
        reviews: {
          include: {
            student: { select: { name: true, avatar: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        _count: { select: { reviews: true, bookings: true } },
      },
    });

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    // Calculate average rating
    const averageRating =
      listing.reviews.length > 0
        ? listing.reviews.reduce((sum, r) => sum + r.rating, 0) /
          listing.reviews.length
        : 0;

    // Calculate average area price for price badge
    const areaListings = await prisma.listing.findMany({
      where: {
        nearestUniversity: listing.nearestUniversity,
        id: { not: listing.id },
      },
      select: { pricePerSemester: true },
    });

    const averageAreaPrice =
      areaListings.length > 0
        ? areaListings.reduce((sum, l) => sum + l.pricePerSemester, 0) /
          areaListings.length
        : listing.pricePerSemester;

    let parsedAmenities = [];
    try { parsedAmenities = JSON.parse(listing.amenities); } catch(e) {}

    return NextResponse.json({
      ...listing,
      amenities: parsedAmenities,
      averageRating: Math.round(averageRating * 10) / 10,
      averageAreaPrice,
    });
  } catch (error) {
    console.error("Listing fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch listing" },
      { status: 500 }
    );
  }
}

// PUT /api/listings/[id]
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const listing = await prisma.listing.findUnique({
      where: { id: params.id },
    });

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    if (listing.hostId !== (session.user as any).id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    if (body.amenities && Array.isArray(body.amenities)) {
      body.amenities = JSON.stringify(body.amenities);
    }

    const updated = await prisma.listing.update({
      where: { id: params.id },
      data: body,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update listing error:", error);
    return NextResponse.json(
      { error: "Failed to update listing" },
      { status: 500 }
    );
  }
}

// DELETE /api/listings/[id]
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const listing = await prisma.listing.findUnique({
      where: { id: params.id },
    });

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    if (listing.hostId !== (session.user as any).id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.listing.delete({ where: { id: params.id } });

    return NextResponse.json({ message: "Listing deleted" });
  } catch (error) {
    console.error("Delete listing error:", error);
    return NextResponse.json(
      { error: "Failed to delete listing" },
      { status: 500 }
    );
  }
}
