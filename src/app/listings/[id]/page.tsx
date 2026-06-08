"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import StarRating from "@/components/ui/StarRating";
import Avatar from "@/components/ui/Avatar";
import Modal from "@/components/ui/Modal";
import Card from "@/components/ui/Card";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import Footer from "@/components/ui/Footer";
import { formatCurrency, formatDate, calculatePriceBadge } from "@/lib/utils";
import { AMENITIES } from "@/lib/constants";
import toast from "react-hot-toast";

interface ListingDetail {
  id: string;
  title: string;
  description: string;
  propertyType: string;
  numberOfRooms: number;
  address: string;
  nearestUniversity: string;
  distanceToCampus: string;
  pricePerSemester: number;
  isAvailable: boolean;
  isVerified: boolean;
  amenities: string[];
  createdAt: string;
  host: {
    id: string;
    name: string;
    avatar: string | null;
    businessName: string | null;
    phone: string | null;
    aboutMe: string | null;
    createdAt: string;
  };
  images: { id: string; url: string }[];
  reviews: {
    id: string;
    rating: number;
    comment: string;
    createdAt: string;
    student: { name: string; avatar: string | null };
  }[];
  _count: { reviews: number; bookings: number };
  averageRating: number;
  averageAreaPrice?: number;
}

const propertyTypeLabels: Record<string, string> = {
  SELF_CON: "Self Contain",
  ROOM_AND_PARLOUR: "Room & Parlour",
  FLAT: "Flat",
  HOSTEL: "Hostel",
  SHARED_ROOM: "Shared Room",
};

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchListing() {
      try {
        const response = await fetch(`/api/listings/${params.id}`);
        if (!response.ok) throw new Error("Listing not found");
        const data = await response.json();
        setListing(data);
      } catch {
        toast.error("Listing not found");
        router.push("/listings");
      } finally {
        setLoading(false);
      }
    }
    fetchListing();
  }, [params.id, router]);

  const handleBooking = async () => {
    if (!session) {
      toast.error("Please sign in to book this property");
      router.push("/login");
      return;
    }
    setShowPaymentModal(true);
  };

  const handlePayment = async () => {
    if (!listing) return;
    setSubmitting(true);
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: listing.id,
          moveInDate: new Date().toISOString(),
          semester: "2025/2026 First Semester",
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || "Booking failed");
        return;
      }

      toast.success("Booking request sent! The landlord will confirm shortly.");
      setShowPaymentModal(false);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartChat = async () => {
    if (!session) {
      toast.error("Please sign in to chat");
      router.push("/login");
      return;
    }
    if (!listing) return;

    try {
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: listing.id,
          hostId: listing.host.id,
        }),
      });
      const data = await response.json();
      router.push(`/chat?conversation=${data.id}`);
    } catch {
      toast.error("Could not start chat");
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listing) return;
    setSubmitting(true);
    try {
      const response = await fetch(`/api/listings/${listing.id}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reviewForm),
      });

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || "Failed to submit review");
        return;
      }

      toast.success("Review submitted!");
      setShowReviewModal(false);
      // Refresh listing data
      const updatedResponse = await fetch(`/api/listings/${params.id}`);
      const updatedData = await updatedResponse.json();
      setListing(updatedData);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <PageLoader />;
  if (!listing) return null;

  const priceBadge = listing.averageAreaPrice
    ? calculatePriceBadge(listing.pricePerSemester, listing.averageAreaPrice)
    : null;

  const amenityDetails = listing.amenities.map((a) => {
    const found = AMENITIES.find((am) => am.id === a);
    return found || { id: a, label: a, icon: "" };
  });

  const userRole = (session?.user as any)?.role;

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/listings" className="hover:text-primary transition-colors">
            Listings
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-medium truncate">{listing.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div className="space-y-3">
              <div className="relative h-[400px] rounded-2xl overflow-hidden bg-gradient-to-br from-primary/10 to-accent/10">
                {listing.images.length > 0 ? (
                  <Image
                    src={listing.images[selectedImage]?.url}
                    alt={listing.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-20 h-20 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                )}
              </div>
              {listing.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {listing.images.map((img, i) => (
                    <button
                      key={img.id}
                      onClick={() => setSelectedImage(i)}
                      className={`relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-colors ${
                        i === selectedImage
                          ? "border-primary"
                          : "border-transparent hover:border-gray-200"
                      }`}
                    >
                      <Image src={img.url} alt="" fill className="object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Title & Badges */}
            <div>
              <div className="flex flex-wrap items-start gap-2 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  {listing.title}
                </h1>
                <div className="flex gap-2">
                  {listing.isVerified && (
                    <Badge variant="verified">✓ Verified</Badge>
                  )}
                  {priceBadge && (
                    <Badge
                      variant={
                        priceBadge.label === "Fair Price"
                          ? "fair"
                          : priceBadge.label === "Below Average"
                          ? "below"
                          : "above"
                      }
                    >
                      {priceBadge.label}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  {listing.address}
                </span>
                <span className="flex items-center gap-1 text-primary font-medium">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {listing.distanceToCampus} from {listing.nearestUniversity}
                </span>
                <Badge variant="default">
                  {propertyTypeLabels[listing.propertyType] || listing.propertyType}
                </Badge>
              </div>
            </div>

            {/* Description */}
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Description</h2>
              <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                {listing.description}
              </p>
            </Card>

            {/* Details */}
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Property Details</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-sm text-gray-500">Type</p>
                  <p className="font-semibold text-gray-900">
                    {propertyTypeLabels[listing.propertyType]}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-sm text-gray-500">Rooms</p>
                  <p className="font-semibold text-gray-900">{listing.numberOfRooms}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-sm text-gray-500">Listed</p>
                  <p className="font-semibold text-gray-900">{formatDate(listing.createdAt)}</p>
                </div>
              </div>
            </Card>

            {/* Amenities */}
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Amenities</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {amenityDetails.map((amenity) => (
                  <div
                    key={amenity.id}
                    className="flex items-center gap-2.5 p-3 bg-green-50 rounded-xl"
                  >
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700">
                      {amenity.label}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Reviews */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Reviews ({listing._count.reviews})
                </h2>
                {session && userRole === "STUDENT" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowReviewModal(true)}
                  >
                    Write Review
                  </Button>
                )}
              </div>

              {listing.reviews.length > 0 ? (
                <div className="space-y-4">
                  {listing.reviews.map((review) => (
                    <div
                      key={review.id}
                      className="border-b border-gray-50 last:border-0 pb-4 last:pb-0"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <Avatar
                          src={review.student.avatar}
                          name={review.student.name}
                          size="sm"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {review.student.name}
                          </p>
                          <p className="text-xs text-gray-400">
                            {formatDate(review.createdAt)}
                          </p>
                        </div>
                        <StarRating rating={review.rating} size="sm" />
                      </div>
                      <p className="text-sm text-gray-600 ml-11">
                        {review.comment}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-6">
                  No reviews yet. Be the first to review!
                </p>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Price Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sticky top-20">
              <div className="text-center mb-6">
                <p className="text-3xl font-bold text-primary">
                  {formatCurrency(listing.pricePerSemester)}
                </p>
                <p className="text-sm text-gray-500 mt-1">per semester (~6 months)</p>
                {listing.averageRating > 0 && (
                  <div className="flex items-center justify-center gap-2 mt-3">
                    <StarRating rating={listing.averageRating} size="sm" />
                    <span className="text-sm text-gray-600">
                      {listing.averageRating.toFixed(1)} ({listing._count.reviews} reviews)
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {listing.isAvailable ? (
                  <>
                    <Button fullWidth onClick={handleBooking}>
                      💳 Pay with Paystack
                    </Button>
                    <Button variant="outline" fullWidth onClick={handleStartChat}>
                      💬 Chat with Landlord
                    </Button>
                  </>
                ) : (
                  <div className="bg-red-50 text-red-700 text-center py-3 rounded-xl font-medium">
                    Currently Unavailable
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400 text-center">
                  Secure payment powered by Paystack
                </p>
              </div>
            </div>

            {/* Host Card */}
            <Card>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                Listed by
              </h3>
              <div className="flex items-center gap-3 mb-4">
                <Avatar
                  src={listing.host.avatar}
                  name={listing.host.name}
                  size="lg"
                />
                <div>
                  <p className="font-semibold text-gray-900">{listing.host.name}</p>
                  {listing.host.businessName && (
                    <p className="text-sm text-gray-500">{listing.host.businessName}</p>
                  )}
                  <p className="text-xs text-gray-400">
                    Member since {formatDate(listing.host.createdAt)}
                  </p>
                </div>
              </div>
              {listing.host.aboutMe && (
                <p className="text-sm text-gray-600 mb-4">{listing.host.aboutMe}</p>
              )}
              <Button
                variant="outline"
                fullWidth
                size="sm"
                onClick={handleStartChat}
              >
                Contact Host
              </Button>
            </Card>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Confirm Booking"
        size="sm"
      >
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-xl p-4">
            <h4 className="font-semibold text-gray-900 mb-2">{listing.title}</h4>
            <p className="text-sm text-gray-500">{listing.address}</p>
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Price per semester</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(listing.pricePerSemester)}
                </span>
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-400">
            By confirming, you agree to our terms. Payment will be processed via
            Paystack. The landlord will confirm your booking within 24 hours.
          </p>

          <div className="flex gap-3">
            <Button
              variant="ghost"
              fullWidth
              onClick={() => setShowPaymentModal(false)}
            >
              Cancel
            </Button>
            <Button fullWidth loading={submitting} onClick={handlePayment}>
              Confirm & Pay
            </Button>
          </div>
        </div>
      </Modal>

      {/* Review Modal */}
      <Modal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        title="Write a Review"
        size="sm"
      >
        <form onSubmit={handleSubmitReview} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rating
            </label>
            <StarRating
              rating={reviewForm.rating}
              interactive
              size="lg"
              onChange={(rating) => setReviewForm({ ...reviewForm, rating })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Your review
            </label>
            <textarea
              value={reviewForm.comment}
              onChange={(e) =>
                setReviewForm({ ...reviewForm, comment: e.target.value })
              }
              rows={4}
              placeholder="Share your experience..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              required
            />
          </div>
          <Button type="submit" fullWidth loading={submitting}>
            Submit Review
          </Button>
        </form>
      </Modal>

      <Footer />
    </>
  );
}
