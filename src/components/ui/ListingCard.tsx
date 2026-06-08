"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Badge from "./Badge";
import StarRating from "./StarRating";
import { formatCurrency } from "@/lib/utils";

interface ListingCardProps {
  id: string;
  title: string;
  address: string;
  nearestUniversity: string;
  distanceToCampus: string;
  pricePerSemester: number;
  propertyType: string;
  images: { url: string }[];
  rating?: number;
  reviewCount?: number;
  isVerified?: boolean;
  priceBadge?: { label: string; variant: "fair" | "below" | "above" };
  amenities?: string[];
  isAvailable?: boolean;
}

export default function ListingCard({
  id,
  title,
  address,
  nearestUniversity,
  distanceToCampus,
  pricePerSemester,
  propertyType,
  images,
  rating = 0,
  reviewCount = 0,
  isVerified = false,
  priceBadge,
  isAvailable = true,
}: ListingCardProps) {
  const [currentImage, setCurrentImage] = useState(0);

  const propertyTypeLabels: Record<string, string> = {
    SELF_CON: "Self Contain",
    ROOM_AND_PARLOUR: "Room & Parlour",
    FLAT: "Flat",
    HOSTEL: "Hostel",
    SHARED_ROOM: "Shared Room",
  };

  return (
    <Link href={`/listings/${id}`} className="block group">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-1 transition-all duration-300">
        {/* Image Section */}
        <div className="relative h-52 overflow-hidden">
          {images.length > 0 ? (
            <Image
              src={images[currentImage]?.url || "/images/placeholder.jpg"}
              alt={title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
            </div>
          )}

          {/* Image dots */}
          {images.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.slice(0, 5).map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentImage(i);
                  }}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    i === currentImage
                      ? "bg-white w-4"
                      : "bg-white/60 hover:bg-white/80"
                  }`}
                />
              ))}
            </div>
          )}

          {/* Badges overlay */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
            {isVerified && (
              <Badge variant="verified" size="sm" icon={
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              }>
                Verified
              </Badge>
            )}
            {priceBadge && (
              <Badge variant={priceBadge.variant} size="sm">
                {priceBadge.label}
              </Badge>
            )}
          </div>

          {!isAvailable && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="bg-white text-gray-900 px-4 py-2 rounded-full font-semibold text-sm">
                Not Available
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 line-clamp-1 group-hover:text-primary transition-colors">
              {title}
            </h3>
            <Badge variant="default" size="sm">
              {propertyTypeLabels[propertyType] || propertyType}
            </Badge>
          </div>

          <p className="text-sm text-gray-500 mb-2 line-clamp-1">{address}</p>

          {/* University proximity */}
          <div className="flex items-center gap-1.5 text-sm text-primary/80 mb-3">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="truncate">
              {distanceToCampus} from {nearestUniversity}
            </span>
          </div>

          {/* Rating & Price */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-50">
            <div className="flex items-center gap-1.5">
              <StarRating rating={rating} size="sm" />
              {reviewCount > 0 && (
                <span className="text-xs text-gray-500">
                  ({reviewCount})
                </span>
              )}
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-primary">
                {formatCurrency(pricePerSemester)}
              </p>
              <p className="text-xs text-gray-400">per semester</p>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
