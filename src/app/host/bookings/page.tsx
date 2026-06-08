"use client";

import React, { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import EmptyState from "@/components/ui/EmptyState";
import { formatCurrency, formatDate } from "@/lib/utils";
import toast from "react-hot-toast";

interface Booking {
  id: string;
  student: { name: string; email: string; phone: string | null };
  listing: { title: string };
  amount: number;
  moveInDate: string;
  status: string;
  paymentStatus: string;
  semester: string;
  createdAt: string;
}

export default function HostBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

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

  const handleUpdateStatus = async (bookingId: string, status: string) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (response.ok) {
        setBookings((prev) =>
          prev.map((b) => (b.id === bookingId ? { ...b, status } : b))
        );
        toast.success(`Booking ${status.toLowerCase()}`);
      }
    } catch {
      toast.error("Failed to update booking");
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Booking Management</h1>

      {bookings.length === 0 ? (
        <EmptyState
          title="No bookings yet"
          description="Bookings from students will appear here."
        />
      ) : (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left py-3.5 px-5 font-semibold text-gray-600">Student</th>
                  <th className="text-left py-3.5 px-5 font-semibold text-gray-600">Property</th>
                  <th className="text-left py-3.5 px-5 font-semibold text-gray-600">Amount</th>
                  <th className="text-left py-3.5 px-5 font-semibold text-gray-600">Move-in</th>
                  <th className="text-left py-3.5 px-5 font-semibold text-gray-600">Booked</th>
                  <th className="text-left py-3.5 px-5 font-semibold text-gray-600">Status</th>
                  <th className="text-left py-3.5 px-5 font-semibold text-gray-600">Payment</th>
                  <th className="text-right py-3.5 px-5 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="py-3.5 px-5">
                      <p className="font-medium text-gray-900">{booking.student.name}</p>
                      <p className="text-xs text-gray-400">{booking.student.email}</p>
                    </td>
                    <td className="py-3.5 px-5 text-gray-600 max-w-[180px] truncate">
                      {booking.listing.title}
                    </td>
                    <td className="py-3.5 px-5 font-medium text-gray-900">
                      {formatCurrency(booking.amount)}
                    </td>
                    <td className="py-3.5 px-5 text-gray-600">
                      {formatDate(booking.moveInDate)}
                    </td>
                    <td className="py-3.5 px-5 text-gray-500">
                      {formatDate(booking.createdAt)}
                    </td>
                    <td className="py-3.5 px-5">
                      <Badge
                        variant={
                          booking.status === "CONFIRMED" ? "success" :
                          booking.status === "PENDING" ? "warning" :
                          booking.status === "REJECTED" ? "danger" : "default"
                        }
                      >
                        {booking.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-5">
                      <Badge
                        variant={
                          booking.paymentStatus === "PAID" ? "success" :
                          booking.paymentStatus === "PENDING" ? "warning" : "info"
                        }
                      >
                        {booking.paymentStatus}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-5">
                      {booking.status === "PENDING" && (
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => handleUpdateStatus(booking.id, "CONFIRMED")}
                            className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-semibold hover:bg-green-100 transition-colors"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(booking.id, "REJECTED")}
                            className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-xs font-semibold hover:bg-red-100 transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
