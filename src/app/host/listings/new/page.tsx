"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import { PROPERTY_TYPES, AMENITIES, NIGERIAN_UNIVERSITIES } from "@/lib/constants";
import toast from "react-hot-toast";

export default function CreateListingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
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
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateForm = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const toggleAmenity = (id: string) => {
    setForm((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(id)
        ? prev.amenities.filter((a) => a !== id)
        : [...prev.amenities, id],
    }));
  };

  const validateStep = () => {
    const newErrors: Record<string, string> = {};
    if (step === 1) {
      if (!form.title) newErrors.title = "Title is required";
      if (!form.description) newErrors.description = "Description is required";
    } else if (step === 2) {
      if (!form.address) newErrors.address = "Address is required";
      if (!form.nearestUniversity) newErrors.nearestUniversity = "Select nearest university";
      if (!form.distanceToCampus) newErrors.distanceToCampus = "Distance is required";
    } else if (step === 3) {
      if (!form.pricePerSemester) newErrors.pricePerSemester = "Price is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep()) setStep((s) => Math.min(s + 1, 4));
  };

  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setLoading(true);
    try {
      const response = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          numberOfRooms: Number(form.numberOfRooms),
          pricePerSemester: Number(form.pricePerSemester),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || "Failed to create listing");
        return;
      }

      toast.success("Listing created successfully!");
      router.push("/host/listings");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { num: 1, label: "Basic Info" },
    { num: 2, label: "Location" },
    { num: 3, label: "Pricing" },
    { num: 4, label: "Amenities" },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Create New Listing</h1>
      <p className="text-gray-500 mb-8">
        Fill in the details to list your property on UniNest.
      </p>

      {/* Progress Steps */}
      <div className="flex items-center gap-2 mb-8">
        {steps.map((s, i) => (
          <React.Fragment key={s.num}>
            <button
              onClick={() => s.num < step && setStep(s.num)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                step === s.num
                  ? "bg-primary text-white shadow-sm"
                  : step > s.num
                  ? "bg-primary/10 text-primary cursor-pointer"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                step > s.num ? "bg-primary text-white" : ""
              }`}>
                {step > s.num ? "✓" : s.num}
              </span>
              <span className="hidden sm:inline">{s.label}</span>
            </button>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 ${step > s.num ? "bg-primary" : "bg-gray-200"}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      <Card>
        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-5">
            <Input
              label="Property Title"
              placeholder="e.g. Spacious Self-Con Near UNILAG"
              value={form.title}
              onChange={(e) => updateForm("title", e.target.value)}
              error={errors.title}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) => updateForm("description", e.target.value)}
                rows={5}
                placeholder="Describe your property in detail..."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              />
              {errors.description && (
                <p className="mt-1.5 text-sm text-red-500">{errors.description}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Property Type"
                value={form.propertyType}
                onChange={(e) => updateForm("propertyType", e.target.value)}
                options={PROPERTY_TYPES.map((t) => ({
                  value: t.value,
                  label: t.label,
                }))}
              />
              <Input
                label="Number of Rooms"
                type="number"
                min="1"
                value={String(form.numberOfRooms)}
                onChange={(e) => updateForm("numberOfRooms", e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Step 2: Location */}
        {step === 2 && (
          <div className="space-y-5">
            <Input
              label="Full Address"
              placeholder="e.g. 15 Akoka Road, Yaba, Lagos"
              value={form.address}
              onChange={(e) => updateForm("address", e.target.value)}
              error={errors.address}
            />
            <Select
              label="Nearest University"
              placeholder="Select university"
              value={form.nearestUniversity}
              onChange={(e) => updateForm("nearestUniversity", e.target.value)}
              options={NIGERIAN_UNIVERSITIES.map((uni) => ({
                value: uni,
                label: uni,
              }))}
              error={errors.nearestUniversity}
            />
            <Input
              label="Distance to Campus"
              placeholder="e.g. 5 mins walk"
              value={form.distanceToCampus}
              onChange={(e) => updateForm("distanceToCampus", e.target.value)}
              error={errors.distanceToCampus}
              helperText='Use a format like "5 mins walk" or "10 mins drive"'
            />
          </div>
        )}

        {/* Step 3: Pricing */}
        {step === 3 && (
          <div className="space-y-5">
            <Input
              label="Price per Semester (₦)"
              type="number"
              placeholder="e.g. 250000"
              value={form.pricePerSemester}
              onChange={(e) => updateForm("pricePerSemester", e.target.value)}
              error={errors.pricePerSemester}
              helperText="Enter the total price for one semester (~6 months)"
            />
            <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-700">
              <p className="font-medium mb-1">💡 Pricing Tips</p>
              <ul className="list-disc list-inside space-y-1 text-blue-600">
                <li>Research similar properties in your area</li>
                <li>Include utility costs in your price</li>
                <li>Fair-priced listings get more bookings</li>
              </ul>
            </div>
          </div>
        )}

        {/* Step 4: Amenities */}
        {step === 4 && (
          <div className="space-y-5">
            <p className="text-sm text-gray-600 mb-2">
              Select all amenities available at your property.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {AMENITIES.map((amenity) => (
                <button
                  key={amenity.id}
                  onClick={() => toggleAmenity(amenity.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                    form.amenities.includes(amenity.id)
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-gray-100 text-gray-600 hover:border-gray-200"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${
                      form.amenities.includes(amenity.id)
                        ? "border-primary bg-primary"
                        : "border-gray-300"
                    }`}
                  >
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
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
          {step > 1 ? (
            <Button variant="ghost" onClick={prevStep}>
              ← Back
            </Button>
          ) : (
            <div />
          )}
          {step < 4 ? (
            <Button onClick={nextStep}>
              Next →
            </Button>
          ) : (
            <Button onClick={handleSubmit} loading={loading}>
              Publish Listing
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
