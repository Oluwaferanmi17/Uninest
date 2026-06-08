"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { formatRelativeTime, formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";

interface Listing {
  id: string;
  title: string;
  propertyType: string;
  pricePerSemester: number;
  nearestUniversity: string;
  isVerified: boolean;
  createdAt: string;
  host: {
    name: string;
    email: string;
  };
  _count: {
    bookings: number;
    reviews: number;
  };
}

export default function AdminListingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (session && (session.user as any).role !== "ADMIN") {
      router.push("/");
    }
  }, [session, status, router]);

  const fetchListings = async () => {
    try {
      const response = await fetch("/api/admin/listings");
      if (response.ok) {
        const data = await response.json();
        setListings(data.listings || []);
      }
    } catch (error) {
      console.error("Failed to fetch listings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session && (session.user as any).role === "ADMIN") {
      fetchListings();
    }
  }, [session]);

  const toggleVerification = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch("/api/admin/listings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: id, isVerified: !currentStatus }),
      });

      if (response.ok) {
        toast.success(`Listing ${!currentStatus ? "Verified" : "Unverified"}`);
        fetchListings(); // Refresh data
      } else {
        toast.error("Failed to update listing status");
      }
    } catch (error) {
      toast.error("Error updating listing");
    }
  };

  if (status === "loading" || loading) {
    return <PageLoader />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Manage Listings</h1>
        <p className="text-gray-500 mt-2">View and verify property listings</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Property</th>
                <th className="px-6 py-4">Host</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {listings.map((listing) => (
                <tr key={listing.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-gray-900 truncate max-w-[200px]">
                      {listing.title}
                    </p>
                    <p className="text-gray-500 text-xs mt-0.5">{listing.propertyType.replace(/_/g, " ")}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-gray-900">{listing.host.name}</p>
                    <p className="text-gray-500 text-xs">{listing.host.email}</p>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {listing.nearestUniversity}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {formatCurrency(listing.pricePerSemester)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        listing.isVerified
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {listing.isVerified ? "Verified" : "Unverified"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => toggleVerification(listing.id, listing.isVerified)}
                      className={`text-sm font-medium ${
                        listing.isVerified ? "text-red-600 hover:text-red-700" : "text-primary hover:text-primary-dark"
                      }`}
                    >
                      {listing.isVerified ? "Revoke Verification" : "Verify Listing"}
                    </button>
                  </td>
                </tr>
              ))}
              {listings.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No listings found on the platform.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
