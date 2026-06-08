"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import EmptyState from "@/components/ui/EmptyState";
import Footer from "@/components/ui/Footer";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Booking {
  id: string;
  moveInDate: string;
  status: string;
  paymentStatus: string;
  amount: number;
  semester: string;
  createdAt: string;
  listing: {
    id: string;
    title: string;
    address: string;
    nearestUniversity: string;
    images: { url: string }[];
  };
  host: {
    name: string;
    phone: string | null;
  };
}

export default function StudentBookingsPage() {
  const { data: session } = useSession();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"active" | "past">("active");

  useEffect(() => {
    async function fetchBookings() {
      try {
        const response = await fetch("/api/bookings");
        const data = await response.json();
        setBookings(data.bookings || []);
      } catch {
        console.error("Failed to fetch bookings");
      } finally {
        setLoading(false);
      }
    }
    fetchBookings();
  }, []);

  const activeBookings = bookings.filter((b) =>
    ["PENDING", "CONFIRMED"].includes(b.status)
  );
  const pastBookings = bookings.filter((b) =>
    ["REJECTED", "CANCELLED"].includes(b.status)
  );

  const currentBookings = activeTab === "active" ? activeBookings : pastBookings;

  const statusColors: Record<string, string> = {
    PENDING: "warning",
    CONFIRMED: "success",
    REJECTED: "danger",
    CANCELLED: "default",
  };

  const paymentStatusColors: Record<string, string> = {
    PENDING: "warning",
    PAID: "success",
    REFUNDED: "info",
  };

  if (loading) return <PageLoader />;

  return (
    <>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Bookings</h1>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
          {[
            { key: "active" as const, label: `Active (${activeBookings.length})` },
            { key: "past" as const, label: `Past (${pastBookings.length})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab.key
                  ? "bg-white text-primary shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {currentBookings.length === 0 ? (
          <EmptyState
            title={activeTab === "active" ? "No active bookings" : "No past bookings"}
            description={
              activeTab === "active"
                ? "Browse listings to find your next student home!"
                : "Your completed bookings will appear here."
            }
            action={
              activeTab === "active" ? (
                <Link href="/listings">
                  <Button>Browse Listings</Button>
                </Link>
              ) : undefined
            }
          />
        ) : (
          <div className="space-y-4">
            {currentBookings.map((booking) => (
              <Card key={booking.id} hover>
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Image */}
                  <div className="w-full md:w-40 h-32 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 overflow-hidden flex-shrink-0">
                    {booking.listing.images?.[0] ? (
                      <img
                        src={booking.listing.images[0].url}
                        alt={booking.listing.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-10 h-10 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link
                          href={`/listings/${booking.listing.id}`}
                          className="text-lg font-semibold text-gray-900 hover:text-primary transition-colors"
                        >
                          {booking.listing.title}
                        </Link>
                        <p className="text-sm text-gray-500 mt-0.5">
                          {booking.listing.address}
                        </p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Badge variant={statusColors[booking.status] as any}>
                          {booking.status}
                        </Badge>
                        <Badge variant={paymentStatusColors[booking.paymentStatus] as any}>
                          {booking.paymentStatus}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                      <div>
                        <p className="text-gray-400">Amount</p>
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(booking.amount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400">Semester</p>
                        <p className="font-medium text-gray-700">{booking.semester}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Move-in</p>
                        <p className="font-medium text-gray-700">
                          {formatDate(booking.moveInDate)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400">Host</p>
                        <p className="font-medium text-gray-700">{booking.host.name}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}
