"use client";

import { User, Mail, Phone, MapPin, Building, Calendar, FileText } from "lucide-react";
import { FormEvent } from "react";

export type AddressFormData = {
  fullName: string;
  email: string;
  phone: string;
  provinceCity: string;
  fullAddress: string;
  landmark: string;
  deliveryNotes: string;
};

interface ShippingAddressFormProps {
  formData: AddressFormData;
  setFormData: (data: AddressFormData) => void;
  errors: Partial<Record<keyof AddressFormData, string>>;
  setErrors: (errors: Partial<Record<keyof AddressFormData, string>>) => void;
  onNext: () => void;
}

export function ShippingAddressForm({
  formData,
  setFormData,
  errors,
  setErrors,
  onNext,
}: ShippingAddressFormProps) {
  
  const validate = () => {
    const newErrors: Partial<Record<keyof AddressFormData, string>> = {};
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else {
      // Basic Nepalese phone format validation (98/97/96 followed by 8 digits, or landlines)
      const phoneRegex = /^(9[678]\d{8}|0\d{7,8})$/;
      if (!phoneRegex.test(formData.phone.replace(/[\s-]/g, ""))) {
        newErrors.phone = "Please enter a valid Nepalese phone number (e.g. 98XXXXXXXX)";
      }
    }
    
    if (!formData.provinceCity.trim()) {
      newErrors.provinceCity = "Province, City, or Area is required";
    }
    
    if (!formData.fullAddress.trim()) {
      newErrors.fullAddress = "Full street address is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onNext();
    }
  };

  const handleChange = (key: keyof AddressFormData, value: string) => {
    setFormData({
      ...formData,
      [key]: value,
    });
    // Clear error for this field
    if (errors[key]) {
      setErrors({
        ...errors,
        [key]: undefined,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-card rounded-2xl border border-border p-6 shadow-md space-y-5">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2 pb-3 border-b border-border/60">
          <MapPin className="h-5 w-5 text-primary" />
          Shipping Information
        </h2>

        <div className="grid gap-5 sm:grid-cols-2">
          {/* Full Name */}
          <div className="space-y-2">
            <label htmlFor="fullName" className="text-sm font-semibold text-foreground">
              Full Name <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <User className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="fullName"
                type="text"
                value={formData.fullName}
                onChange={(e) => handleChange("fullName", e.target.value)}
                placeholder="e.g. Dakshinkali Customer"
                className={`h-11 w-full rounded-lg border bg-background pr-3 pl-10 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 ${
                  errors.fullName ? "border-destructive focus:border-destructive focus:ring-destructive/20" : "border-border"
                }`}
              />
            </div>
            {errors.fullName && <p className="text-xs text-destructive font-medium">{errors.fullName}</p>}
          </div>

          {/* Email (Read-Only) */}
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-semibold text-foreground">
              Email Address <span className="text-muted-foreground">(Read-Only)</span>
            </label>
            <div className="relative">
              <Mail className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="email"
                type="email"
                value={formData.email}
                readOnly
                disabled
                className="h-11 w-full rounded-lg border border-border bg-muted/60 pr-3 pl-10 text-sm cursor-not-allowed text-muted-foreground"
              />
            </div>
          </div>

          {/* Phone Number */}
          <div className="space-y-2">
            <label htmlFor="phone" className="text-sm font-semibold text-foreground">
              Phone Number <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="e.g. 98XXXXXXXX"
                className={`h-11 w-full rounded-lg border bg-background pr-3 pl-10 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 ${
                  errors.phone ? "border-destructive focus:border-destructive focus:ring-destructive/20" : "border-border"
                }`}
              />
            </div>
            {errors.phone && <p className="text-xs text-destructive font-medium">{errors.phone}</p>}
          </div>

          {/* Province / City / Area */}
          <div className="space-y-2">
            <label htmlFor="provinceCity" className="text-sm font-semibold text-foreground">
              Province / City / Area <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <Building className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="provinceCity"
                type="text"
                value={formData.provinceCity}
                onChange={(e) => handleChange("provinceCity", e.target.value)}
                placeholder="e.g. Bagmati, Kathmandu"
                className={`h-11 w-full rounded-lg border bg-background pr-3 pl-10 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 ${
                  errors.provinceCity ? "border-destructive focus:border-destructive focus:ring-destructive/20" : "border-border"
                }`}
              />
            </div>
            {errors.provinceCity && <p className="text-xs text-destructive font-medium">{errors.provinceCity}</p>}
          </div>
        </div>

        {/* Full Address */}
        <div className="space-y-2">
          <label htmlFor="fullAddress" className="text-sm font-semibold text-foreground">
            Full Street Address <span className="text-destructive">*</span>
          </label>
          <div className="relative">
            <MapPin className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
            <textarea
              id="fullAddress"
              rows={3}
              value={formData.fullAddress}
              onChange={(e) => handleChange("fullAddress", e.target.value)}
              placeholder="e.g. House No. 45, Gairidhara Marg, Ward No. 1"
              className={`w-full rounded-lg border bg-background pr-3 pl-10 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none ${
                errors.fullAddress ? "border-destructive focus:border-destructive focus:ring-destructive/20" : "border-border"
              }`}
            />
          </div>
          {errors.fullAddress && <p className="text-xs text-destructive font-medium">{errors.fullAddress}</p>}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {/* Landmark */}
          <div className="space-y-2">
            <label htmlFor="landmark" className="text-sm font-semibold text-foreground">
              Landmark <span className="text-muted-foreground">(Optional)</span>
            </label>
            <div className="relative">
              <Building className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="landmark"
                type="text"
                value={formData.landmark}
                onChange={(e) => handleChange("landmark", e.target.value)}
                placeholder="e.g. Opposite to Police Station"
                className="h-11 w-full rounded-lg border border-border bg-background pr-3 pl-10 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Delivery Notes */}
          <div className="space-y-2">
            <label htmlFor="deliveryNotes" className="text-sm font-semibold text-foreground">
              Delivery Notes <span className="text-muted-foreground">(Optional)</span>
            </label>
            <div className="relative">
              <FileText className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="deliveryNotes"
                type="text"
                value={formData.deliveryNotes}
                onChange={(e) => handleChange("deliveryNotes", e.target.value)}
                placeholder="e.g. Call before delivery, deliver on weekend"
                className="h-11 w-full rounded-lg border border-border bg-background pr-3 pl-10 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-bold shadow-md cursor-pointer"
        >
          Continue to Payment
        </button>
      </div>
    </form>
  );
}
