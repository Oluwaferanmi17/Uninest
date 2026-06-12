"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import EmptyState from "@/components/ui/EmptyState";
import Footer from "@/components/ui/Footer";
import { formatCurrency, formatDate } from "@/lib/utils";
import toast from "react-hot-toast";

interface Booking {
  id: string;
  moveInDate: string;
  status: string;
  paymentStatus: string;
  amount: number;
  semester: string;
  createdAt: string;
  paymentReference?: string | null;
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"active" | "past">("active");
  const [payingBookingId, setPayingBookingId] = useState<string | null>(null);
  const [receiptBooking, setReceiptBooking] = useState<Booking | null>(null);
  const [receiptReference, setReceiptReference] = useState<string | null>(null);
  const [receiptVerifiedAt, setReceiptVerifiedAt] = useState<string | null>(null);
  const verifyingReference = useRef<string | null>(null);

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

  useEffect(() => {
    const reference = searchParams.get("reference");
    if (!reference || verifyingReference.current === reference) return;

    verifyingReference.current = reference;

    async function verifyPayment() {
      try {
        const response = await fetch("/api/payment/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reference }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Payment verification failed");
        }

        setBookings((prev) =>
          prev.map((booking) =>
            booking.id === data.booking.id
              ? { ...booking, paymentStatus: "PAID", paymentReference: reference }
              : booking
          )
        );
        setReceiptBooking(data.booking);
        setReceiptReference(data.receiptNumber || reference);
        setReceiptVerifiedAt(data.verifiedAt || new Date().toISOString());
        toast.success("Payment confirmed. Your receipt is ready.");
        router.replace("/student/bookings");
      } catch (error) {
        console.error(error);
        toast.error(
          error instanceof Error ? error.message : "Unable to verify payment"
        );
      }
    }

    verifyPayment();
  }, [router, searchParams]);

  const handlePayBooking = async (booking: Booking) => {
    setPayingBookingId(booking.id);
    try {
      const response = await fetch("/api/payment/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: booking.id }),
      });

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Unable to start payment");
        return;
      }

      window.location.href = data.authorization_url;
    } catch {
      toast.error("Something went wrong while starting payment");
    } finally {
      setPayingBookingId(null);
    }
  };

  const openReceipt = (booking: Booking) => {
    setReceiptBooking(booking);
    setReceiptReference(
      booking.paymentReference || `RCP-${booking.id.slice(0, 8).toUpperCase()}`
    );
    setReceiptVerifiedAt(new Date().toISOString());
  };

  const closeReceipt = () => {
    setReceiptBooking(null);
    setReceiptReference(null);
    setReceiptVerifiedAt(null);
  };

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

                    <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="text-sm">
                        {booking.status === "CONFIRMED" && booking.paymentStatus === "PENDING" && (
                          <p className="text-amber-600 font-medium">
                            Landlord approved your booking. You can continue to payment now.
                          </p>
                        )}
                        {booking.paymentStatus === "PAID" && (
                          <p className="text-green-700 font-medium">
                            Payment completed. Your receipt is available.
                          </p>
                        )}
                        {booking.status === "PENDING" && (
                          <p className="text-gray-500">
                            Waiting for the landlord to approve this booking.
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {booking.status === "CONFIRMED" && booking.paymentStatus === "PENDING" && (
                          <Button
                            size="sm"
                            onClick={() => handlePayBooking(booking)}
                            loading={payingBookingId === booking.id}
                          >
                            Continue to Pay
                          </Button>
                        )}
                        {booking.paymentStatus === "PAID" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openReceipt(booking)}
                          >
                            View Receipt
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={Boolean(receiptBooking)}
        onClose={closeReceipt}
        title="Payment Receipt"
        size="lg"
      >
        {receiptBooking && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-500">Receipt Number</p>
                  <p className="text-lg font-bold text-gray-900">
                    {receiptReference || receiptBooking.paymentReference || `RCP-${receiptBooking.id.slice(0, 8).toUpperCase()}`}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Paid on{" "}
                    {formatDate(receiptVerifiedAt || receiptBooking.createdAt)}
                  </p>
                </div>
                <Badge variant="success">PAID</Badge>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-gray-100 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">
                  Booking Details
                </p>
                <div className="space-y-2 text-sm">
                  <p><span className="text-gray-500">Property:</span> {receiptBooking.listing.title}</p>
                  <p><span className="text-gray-500">Amount:</span> {formatCurrency(receiptBooking.amount)}</p>
                  <p><span className="text-gray-500">Semester:</span> {receiptBooking.semester}</p>
                  <p><span className="text-gray-500">Move-in:</span> {formatDate(receiptBooking.moveInDate)}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">
                  Parties
                </p>
                <div className="space-y-2 text-sm">
                  <p><span className="text-gray-500">Student:</span> {session?.user?.name}</p>
                  <p><span className="text-gray-500">Host:</span> {receiptBooking.host.name}</p>
                  <p><span className="text-gray-500">Property:</span> {receiptBooking.listing.address}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
              <Button variant="ghost" onClick={closeReceipt}>
                Close
              </Button>
              <Button
                variant="outline"
                onClick={() => window.print()}
              >
                Print Receipt
              </Button>
            </div>
          </div>
        )}
      </Modal>
      <Footer />
    </>
  );
}
