import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/listings — fetch listings with filters
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const university = searchParams.get("university");
    const type = searchParams.get("type");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const sort = searchParams.get("sort") || "newest";
    const amenities = searchParams.get("amenities");
    const myListings = searchParams.get("myListings");

    const session = await getServerSession(authOptions);

    // Build where clause
    const where: any = {};

    if (myListings === "true" && session) {
      where.hostId = (session.user as any).id;
    }

    if (university) {
      where.nearestUniversity = { contains: university, mode: "insensitive" };
    }

    if (type) {
      where.propertyType = type;
    }

    if (minPrice || maxPrice) {
      where.pricePerSemester = {};
      if (minPrice) where.pricePerSemester.gte = Number(minPrice);
      if (maxPrice) where.pricePerSemester.lte = Number(maxPrice);
    }

    if (amenities) {
      const amenityList = amenities.split(",");
      where.AND = amenityList.map((a: string) => ({
        amenities: { contains: a }
      }));
    }

    // Build orderBy
    let orderBy: any = { createdAt: "desc" };
    if (sort === "price_asc") orderBy = { pricePerSemester: "asc" };
    if (sort === "price_desc") orderBy = { pricePerSemester: "desc" };

    const listings = await prisma.listing.findMany({
      where,
      orderBy,
      include: {
        images: { orderBy: { order: "asc" }, take: 5 },
        host: { select: { id: true, name: true, avatar: true } },
        reviews: { select: { rating: true } },
        _count: { select: { reviews: true, bookings: true } },
      },
    });

    // Calculate average ratings and parse amenities
    const listingsWithRatings = listings.map((listing) => {
      const avgRating =
        listing.reviews.length > 0
          ? listing.reviews.reduce((sum, r) => sum + r.rating, 0) /
            listing.reviews.length
          : 0;
      const { reviews, ...rest } = listing;
      let parsedAmenities = [];
      try { parsedAmenities = JSON.parse(rest.amenities); } catch(e) {}
      return { ...rest, amenities: parsedAmenities, averageRating: Math.round(avgRating * 10) / 10 };
    });

    // Sort by rating if requested
    if (sort === "rating") {
      listingsWithRatings.sort((a, b) => b.averageRating - a.averageRating);
    }

    return NextResponse.json({ listings: listingsWithRatings });
  } catch (error) {
    console.error("Listings fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch listings" },
      { status: 500 }
    );
  }
}

// POST /api/listings — create a new listing
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    // Allow both HOST and STUDENT to create listings (Students can list spare rooms)

    const body = await request.json();
    const {
      title,
      description,
      propertyType,
      numberOfRooms,
      address,
      nearestUniversity,
      distanceToCampus,
      pricePerSemester,
      amenities,
    } = body;

    if (!title || !description || !address || !nearestUniversity || !pricePerSemester) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const listing = await prisma.listing.create({
      data: {
        title,
        description,
        propertyType: propertyType || "SELF_CON",
        numberOfRooms: numberOfRooms || 1,
        address,
        nearestUniversity,
        distanceToCampus: distanceToCampus || "N/A",
        pricePerSemester: Number(pricePerSemester),
        amenities: JSON.stringify(amenities || []),
        hostId: (session.user as any).id,
      },
      include: {
        images: true,
      },
    });

    return NextResponse.json(listing, { status: 201 });
  } catch (error) {
    console.error("Create listing error:", error);
    return NextResponse.json(
      { error: "Failed to create listing" },
      { status: 500 }
    );
  }
}
