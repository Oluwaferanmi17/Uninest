"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { PROPERTY_TYPES, AMENITIES, NIGERIAN_UNIVERSITIES } from "@/lib/constants";
import toast from "react-hot-toast";

export default function EditListingPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    propertyType: "SELF_CON",
    numberOfRooms: 1,
    address: "",
    nearestUniversity: "",
    distanceToCampus: "",
    pricePerSemester: "",
    amenities: [] as string[],
    isAvailable: true,
  });

  useEffect(() => {
    async function fetchListing() {
      try {
        const response = await fetch(`/api/listings/${params.id}`);
        if (!response.ok) throw new Error();
        const data = await response.json();
        setForm({
          title: data.title || "",
          description: data.description || "",
          propertyType: data.propertyType || "SELF_CON",
          numberOfRooms: data.numberOfRooms || 1,
          address: data.address || "",
          nearestUniversity: data.nearestUniversity || "",
          distanceToCampus: data.distanceToCampus || "",
          pricePerSemester: String(data.pricePerSemester || ""),
          amenities: data.amenities || [],
          isAvailable: data.isAvailable ?? true,
        });
      } catch {
        toast.error("Failed to load listing");
        router.push("/host/listings");
      } finally {
        setLoading(false);
      }
    }
    fetchListing();
  }, [params.id, router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await fetch(`/api/listings/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          numberOfRooms: Number(form.numberOfRooms),
          pricePerSemester: Number(form.pricePerSemester),
        }),
      });
      if (!response.ok) throw new Error();
      toast.success("Listing updated!");
      router.push("/host/listings");
    } catch {
      toast.error("Failed to update listing");
    } finally {
      setSaving(false);
    }
  };

  const toggleAmenity = (id: string) => {
    setForm((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(id)
        ? prev.amenities.filter((a) => a !== id)
        : [...prev.amenities, id],
    }));
  };

  if (loading) return <PageLoader />;

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Edit Listing</h1>
      <p className="text-gray-500 mb-8">Update your property details.</p>

      <form onSubmit={handleSave}>
        <Card className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
          <div className="space-y-4">
            <Input
              label="Property Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Property Type"
                value={form.propertyType}
                onChange={(e) => setForm({ ...form, propertyType: e.target.value })}
                options={PROPERTY_TYPES.map((t) => ({ value: t.value, label: t.label }))}
              />
              <Input
                label="Number of Rooms"
                type="number"
                min="1"
                value={String(form.numberOfRooms)}
                onChange={(e) => setForm({ ...form, numberOfRooms: Number(e.target.value) })}
              />
            </div>
          </div>
        </Card>

        <Card className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Location</h2>
          <div className="space-y-4">
            <Input
              label="Address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
            <Select
              label="Nearest University"
              value={form.nearestUniversity}
              onChange={(e) => setForm({ ...form, nearestUniversity: e.target.value })}
              options={NIGERIAN_UNIVERSITIES.map((u) => ({ value: u, label: u }))}
            />
            <Input
              label="Distance to Campus"
              value={form.distanceToCampus}
              onChange={(e) => setForm({ ...form, distanceToCampus: e.target.value })}
            />
          </div>
        </Card>

        <Card className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Pricing</h2>
          <Input
            label="Price per Semester (₦)"
            type="number"
            value={form.pricePerSemester}
            onChange={(e) => setForm({ ...form, pricePerSemester: e.target.value })}
          />
        </Card>

        <Card className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Amenities</h2>
          <div className="grid grid-cols-2 gap-3">
            {AMENITIES.map((amenity) => (
              <button
                key={amenity.id}
                type="button"
                onClick={() => toggleAmenity(amenity.id)}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                  form.amenities.includes(amenity.id)
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-gray-100 text-gray-600 hover:border-gray-200"
                }`}
              >
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${
                  form.amenities.includes(amenity.id) ? "border-primary bg-primary" : "border-gray-300"
                }`}>
                  {form.amenities.includes(amenity.id) && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className="text-sm font-medium">{amenity.label}</span>
              </button>
            ))}
          </div>
        </Card>

        <div className="flex items-center gap-4">
          <Button type="submit" loading={saving}>
            Save Changes
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push("/host/listings")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
