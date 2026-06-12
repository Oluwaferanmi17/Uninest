import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/listings
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search");
    const university = searchParams.get("university");

    const type = searchParams.get("type");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const amenities = searchParams.get("amenities");
    const myListings = searchParams.get("myListings");
    const available = searchParams.get("available");
    const sort = searchParams.get("sort") || "newest";

    const session = await getServerSession(authOptions);

    const query = search || university;

    const universityAliases: Record<string, string[]> = {
      unilag: ["University of Lagos", "UNILAG", "Akoka"],

      ui: ["University of Ibadan", "UI"],

      oau: ["Obafemi Awolowo University", "OAU", "Ile-Ife"],

      lasu: ["Lagos State University", "LASU"],

      futa: ["Federal University of Technology Akure", "FUTA"],

      uniben: ["University of Benin", "UNIBEN"],

      unn: ["University of Nigeria Nsukka", "UNN"],

      abu: ["Ahmadu Bello University", "ABU"],

      cu: ["Covenant University", "CU", "Covenant"],

      futo: ["Federal University of Technology Owerri", "FUTO"],

      unilorin: ["University of Ilorin", "UNILORIN"],

      lasustech: [
        "Lagos State University of Science and Technology",
        "LASUSTECH",
      ],
    };

    const where: any = {};

    // My listings
    if (myListings === "true" && session) {
      where.hostId = (session.user as any).id;
    }

    // Availability
    if (available === "true") {
      where.isAvailable = true;
    }

    // Search
    if (query) {
      const normalizedQuery = query.toLowerCase().trim();

      const aliasMatches = universityAliases[normalizedQuery] || [];

      where.OR = [
        {
          title: {
            contains: query,
            mode: "insensitive",
          },
        },

        {
          description: {
            contains: query,
            mode: "insensitive",
          },
        },

        {
          address: {
            contains: query,
            mode: "insensitive",
          },
        },

        {
          nearestUniversity: {
            contains: query,
            mode: "insensitive",
          },
        },

        {
          amenities: {
            contains: query,
          },
        },

        ...aliasMatches.map((name) => ({
          nearestUniversity: {
            contains: name,
            mode: "insensitive",
          },
        })),
      ];
    }

    // Property type
    if (type) {
      where.propertyType = type;
    }

    // Price range
    if (minPrice || maxPrice) {
      where.pricePerSemester = {};

      if (minPrice) {
        where.pricePerSemester.gte = Number(minPrice);
      }

      if (maxPrice) {
        where.pricePerSemester.lte = Number(maxPrice);
      }
    }

    // Amenities filter
    if (amenities) {
      const amenityList = amenities.split(",");

      where.AND = [
        ...(where.AND || []),

        ...amenityList.map((amenity) => ({
          amenities: {
            contains: amenity,
          },
        })),
      ];
    }

    // Sorting
    let orderBy: any = {
      createdAt: "desc",
    };

    if (sort === "price_asc") {
      orderBy = {
        pricePerSemester: "asc",
      };
    }

    if (sort === "price_desc") {
      orderBy = {
        pricePerSemester: "desc",
      };
    }

    const listings = await prisma.listing.findMany({
      where,
      orderBy,

      include: {
        images: {
          orderBy: {
            order: "asc",
          },
          take: 5,
        },

        host: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },

        reviews: {
          select: {
            rating: true,
          },
        },

        _count: {
          select: {
            reviews: true,
            bookings: true,
          },
        },
      },
    });

    const listingsWithRatings = listings.map((listing) => {
      const averageRating =
        listing.reviews.length > 0
          ? listing.reviews.reduce((sum, review) => sum + review.rating, 0) /
            listing.reviews.length
          : 0;

      const { reviews, ...rest } = listing;

      let parsedAmenities: string[] = [];

      try {
        parsedAmenities = JSON.parse(rest.amenities);
      } catch {
        parsedAmenities = [];
      }

      return {
        ...rest,
        amenities: parsedAmenities,
        averageRating: Math.round(averageRating * 10) / 10,
      };
    });

    // Rating sort
    if (sort === "rating") {
      listingsWithRatings.sort((a, b) => b.averageRating - a.averageRating);
    }

    return NextResponse.json({
      listings: listingsWithRatings,
    });
  } catch (error) {
    console.error("Listings fetch error:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch listings",
      },
      {
        status: 500,
      },
    );
  }
}
