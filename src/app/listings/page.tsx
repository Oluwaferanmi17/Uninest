"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ListingCard from "@/components/ui/ListingCard";
import SearchBar from "@/components/ui/SearchBar";
import Select from "@/components/ui/Select";
import Footer from "@/components/ui/Footer";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import { PROPERTY_TYPES, AMENITIES } from "@/lib/constants";

interface Listing {
  id: string;
  title: string;
  address: string;
  nearestUniversity: string;
  distanceToCampus: string;
  pricePerSemester: number;
  propertyType: string;
  isAvailable: boolean;
  isVerified: boolean;
  amenities: string[];
  images: { url: string }[];
  _count?: { reviews: number };
  averageRating?: number;
}

function ListingsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    university: searchParams.get("university") || "",
    propertyType: searchParams.get("type") || "",
    minPrice: searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxPrice") || "",
    sort: searchParams.get("sort") || "newest",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.university) params.set("university", filters.university);
      if (filters.propertyType) params.set("type", filters.propertyType);
      if (filters.minPrice) params.set("minPrice", filters.minPrice);
      if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
      if (filters.sort) params.set("sort", filters.sort);
      if (selectedAmenities.length > 0)
        params.set("amenities", selectedAmenities.join(","));

      const response = await fetch(`/api/listings?${params.toString()}`);
      const data = await response.json();
      setListings(data.listings || []);
    } catch {
      console.error("Failed to fetch listings");
    } finally {
      setLoading(false);
    }
  }, [filters, selectedAmenities]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const toggleAmenity = (amenityId: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenityId)
        ? prev.filter((a) => a !== amenityId)
        : [...prev, amenityId]
    );
  };

  return (
    <>
      <div className="min-h-screen">
        {/* Search Header */}
        <div className="bg-white border-b border-gray-100 py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              <div className="flex-1 w-full">
                <SearchBar
                  defaultValue={filters.university}
                  placeholder="Search by university..."
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl text-sm font-medium text-gray-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filters
                {(filters.propertyType || filters.minPrice || filters.maxPrice || selectedAmenities.length > 0) && (
                  <span className="w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center">
                    {[filters.propertyType, filters.minPrice, filters.maxPrice].filter(Boolean).length + (selectedAmenities.length > 0 ? 1 : 0)}
                  </span>
                )}
              </button>
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <div className="mt-4 p-6 bg-gray-50 rounded-2xl animate-slideDown">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Select
                    label="Property Type"
                    placeholder="All types"
                    value={filters.propertyType}
                    onChange={(e) =>
                      setFilters({ ...filters, propertyType: e.target.value })
                    }
                    options={[
                      { value: "", label: "All Types" },
                      ...PROPERTY_TYPES.map((t) => ({
                        value: t.value,
                        label: t.label,
                      })),
                    ]}
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Min Price (₦)
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={filters.minPrice}
                      onChange={(e) =>
                        setFilters({ ...filters, minPrice: e.target.value })
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Max Price (₦)
                    </label>
                    <input
                      type="number"
                      placeholder="500000"
                      value={filters.maxPrice}
                      onChange={(e) =>
                        setFilters({ ...filters, maxPrice: e.target.value })
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                  <Select
                    label="Sort By"
                    value={filters.sort}
                    onChange={(e) =>
                      setFilters({ ...filters, sort: e.target.value })
                    }
                    options={[
                      { value: "newest", label: "Newest First" },
                      { value: "price_asc", label: "Price: Low to High" },
                      { value: "price_desc", label: "Price: High to Low" },
                      { value: "rating", label: "Highest Rated" },
                    ]}
                  />
                </div>

                {/* Amenities */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amenities
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {AMENITIES.map((amenity) => (
                      <button
                        key={amenity.id}
                        onClick={() => toggleAmenity(amenity.id)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                          selectedAmenities.includes(amenity.id)
                            ? "bg-primary text-white border-primary"
                            : "bg-white text-gray-600 border-gray-200 hover:border-primary/30"
                        }`}
                      >
                        {amenity.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button size="sm" onClick={fetchListings}>
                    Apply Filters
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFilters({
                        university: "",
                        propertyType: "",
                        minPrice: "",
                        maxPrice: "",
                        sort: "newest",
                      });
                      setSelectedAmenities([]);
                    }}
                  >
                    Clear All
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Results count */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-gray-500">
              {loading ? "Searching..." : `${listings.length} listing${listings.length !== 1 ? "s" : ""} found`}
              {filters.university && (
                <span className="text-primary font-medium">
                  {" "}near &quot;{filters.university}&quot;
                </span>
              )}
            </p>
          </div>

          {loading ? (
            <PageLoader />
          ) : listings.length === 0 ? (
            <EmptyState
              title="No listings found"
              description="Try adjusting your search or filters to find available accommodations."
              action={
                <Button
                  variant="outline"
                  onClick={() => {
                    setFilters({
                      university: "",
                      propertyType: "",
                      minPrice: "",
                      maxPrice: "",
                      sort: "newest",
                    });
                    setSelectedAmenities([]);
                    router.push("/listings");
                  }}
                >
                  Clear Filters
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  id={listing.id}
                  title={listing.title}
                  address={listing.address}
                  nearestUniversity={listing.nearestUniversity}
                  distanceToCampus={listing.distanceToCampus}
                  pricePerSemester={listing.pricePerSemester}
                  propertyType={listing.propertyType}
                  images={listing.images}
                  rating={listing.averageRating || 0}
                  reviewCount={listing._count?.reviews || 0}
                  isVerified={listing.isVerified}
                  isAvailable={listing.isAvailable}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}

export default function ListingsPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <ListingsContent />
    </Suspense>
  );
}
