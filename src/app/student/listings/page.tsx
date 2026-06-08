"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";

interface StudentListing {
  id: string;
  title: string;
  address: string;
  pricePerSemester: number;
  propertyType: string;
  isAvailable: boolean;
  isVerified: boolean;
  images: { url: string }[];
  _count: { bookings: number; reviews: number };
}

const propertyTypeLabels: Record<string, string> = {
  SELF_CON: "Self Contain",
  ROOM_AND_PARLOUR: "Room & Parlour",
  FLAT: "Flat",
  HOSTEL: "Hostel",
  SHARED_ROOM: "Shared Room",
};

export default function StudentListingsPage() {
  const [listings, setListings] = useState<StudentListing[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchListings = async () => {
    try {
      const response = await fetch("/api/listings?myListings=true");
      const data = await response.json();
      setListings(data.listings || []);
    } catch {
      console.error("Failed to fetch listings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const toggleAvailability = async (listingId: string, currentState: boolean) => {
    try {
      const response = await fetch(`/api/listings/${listingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable: !currentState }),
      });
      if (response.ok) {
        setListings((prev) =>
          prev.map((l) =>
            l.id === listingId ? { ...l, isAvailable: !currentState } : l
          )
        );
        toast.success(
          !currentState ? "Listing is now available" : "Listing marked unavailable"
        );
      }
    } catch {
      toast.error("Failed to update listing");
    }
  };

  const handleDelete = async (listingId: string) => {
    if (!confirm("Are you sure you want to delete this listing?")) return;
    try {
      const response = await fetch(`/api/listings/${listingId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setListings((prev) => prev.filter((l) => l.id !== listingId));
        toast.success("Listing deleted");
      }
    } catch {
      toast.error("Failed to delete listing");
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Spare Rooms</h1>
        <Link href="/student/listings/new">
          <Button>
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            List a Room
          </Button>
        </Link>
      </div>

      {listings.length === 0 ? (
        <EmptyState
          title="No listings yet"
          description="Have a spare room or space? List it to find a roommate and share costs."
          action={
            <Link href="/student/listings/new">
              <Button>Create Your First Listing</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {listings.map((listing) => (
            <Card key={listing.id} className="!p-0 overflow-hidden">
              <div className="flex">
                {/* Image */}
                <div className="w-32 h-full bg-gradient-to-br from-primary/10 to-accent/10 flex-shrink-0">
                  {listing.images?.[0] ? (
                    <img
                      src={listing.images[0].url}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center min-h-[120px]">
                      <svg className="w-8 h-8 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{listing.title}</h3>
                      <p className="text-xs text-gray-500">{listing.address}</p>
                    </div>
                    <div className="flex gap-1.5">
                      {listing.isVerified && <Badge variant="verified" size="sm">Verified</Badge>}
                      <Badge variant={listing.isAvailable ? "success" : "default"} size="sm">
                        {listing.isAvailable ? "Available" : "Unavailable"}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
                    <span>{propertyTypeLabels[listing.propertyType]}</span>
                    <span>•</span>
                    <span>{listing._count.bookings} bookings</span>
                    <span>•</span>
                    <span>{listing._count.reviews} reviews</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="font-bold text-primary">
                      {formatCurrency(listing.pricePerSemester)}
                      <span className="text-xs font-normal text-gray-400">/semester</span>
                    </p>

                    <div className="flex items-center gap-2">
                      {/* Toggle */}
                      <button
                        onClick={() => toggleAvailability(listing.id, listing.isAvailable)}
                        className={`relative w-10 h-5 rounded-full transition-colors ${
                          listing.isAvailable ? "bg-green-500" : "bg-gray-300"
                        }`}
                      >
                        <div
                          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                            listing.isAvailable ? "translate-x-5" : "translate-x-0.5"
                          }`}
                        />
                      </button>

                      <Link
                        href={`/student/listings/${listing.id}/edit`}
                        className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </Link>

                      <button
                        onClick={() => handleDelete(listing.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
