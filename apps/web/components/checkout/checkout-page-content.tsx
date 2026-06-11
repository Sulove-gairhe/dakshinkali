"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@dakshinkali/auth";
import { useCart, formatPrice } from "@/components/cart-provider";
import { ShippingAddressForm, AddressFormData } from "./shipping-address-form";
import { PaymentMethodSelector, PaymentMethod } from "./payment-method-selector";
import { OrderSummary } from "./order-summary";
import {
  CheckCircle2,
  MapPin,
  CreditCard,
  Loader2,
  ShieldCheck,
  ArrowLeft,
  Package,
  Calendar,
  AlertCircle
} from "lucide-react";
import Link from "next/link";

type WizardStep = 1 | 2 | 3;

type SubmittedOrderDetails = {
  orderNumber: string;
  total: number;
  paymentMethod: string;
  email: string;
  name: string;
  address: string;
};

const isUUID = (val: string) => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
};

function getProofUploadErrorMessage(error: {
  message?: string;
  statusCode?: string | number;
}) {
  const message = error.message ?? "";
  const statusCode = String(error.statusCode ?? "");

  if (
    statusCode === "404" ||
    /bucket not found/i.test(message) ||
    /storage bucket/i.test(message)
  ) {
    return "Payment proof storage is not set up yet. Please apply the order-proofs storage migration, then try placing the order again.";
  }

  if (/mime type|not allowed/i.test(message)) {
    return "This proof file type is not allowed. Please upload a PNG, JPEG, WebP, or PDF file.";
  }

  if (/size|payload too large|too large/i.test(message)) {
    return "Payment proof file is too large. Please upload a file under 5MB.";
  }

  return message || "Payment proof could not be uploaded. Please try again.";
}

function getCheckoutErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message || "Something went wrong while placing your order. Please try again.";
  }

  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    const message = typeof record.message === "string" ? record.message : "";
    const details = typeof record.details === "string" ? record.details : "";
    const hint = typeof record.hint === "string" ? record.hint : "";
    const code = typeof record.code === "string" ? record.code : "";
    const combined = [message, details, hint].filter(Boolean).join(" ");

    if (/proof_|admin_notification_status|payment_status|pending_admin_approval/i.test(combined)) {
      return "Order proof fields are not set up yet. Please apply the latest order proof migrations, then try again.";
    }

    if (/coupon is no longer valid|usage limit/i.test(combined)) {
      return "This coupon is no longer valid or has reached its usage limit. Please remove it and try again.";
    }

    if (/row-level security|violates row-level security|permission denied/i.test(combined)) {
      return "Checkout permission is not configured for orders yet. Please apply the latest order RLS migrations, then try again.";
    }

    if (message) return message;
    if (details) return details;
    if (hint) return hint;
    if (code) return `Checkout failed with database error ${code}.`;
  }

  return "Something went wrong while placing your order. Please try again.";
}

function notifyAdminOfNewOrder(orderId: string, apiUrl: string | undefined): void {
  const secret =
    process.env.NEXT_PUBLIC_ORDER_NOTIFY_SECRET ||
    (process.env.NODE_ENV !== "production" ? "dev-order-notify-secret" : undefined);

  if (!apiUrl || !secret) {
    return;
  }

  void fetch(`${apiUrl}/api/v1/internal/orders/${orderId}/notify`, {
    method: "POST",
    headers: {
      "X-Order-Notify-Secret": secret,
    },
  }).catch(() => undefined);
}

export function CheckoutPageContent() {
  const router = useRouter();
  const { user, profile, loading, isAuthenticated, session, supabase } = useAuth();
  const {
    items,
    subtotal,
    appliedCoupon,
    applyCoupon,
    clearCart,
    clearCoupon,
  } = useCart();

  // Wizard state
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successDetails, setSuccessDetails] = useState<SubmittedOrderDetails | null>(null);

  // Form states
  const [formData, setFormData] = useState<AddressFormData>({
    fullName: "",
    email: "",
    phone: "",
    provinceCity: "",
    fullAddress: "",
    landmark: "",
    deliveryNotes: "",
  });

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [fonepayFile, setFonepayFile] = useState<File | null>(null);
  const [addressErrors, setAddressErrors] = useState<Partial<Record<keyof AddressFormData, string>>>({});
  const [paymentErrors, setPaymentErrors] = useState<Partial<Record<string, string>>>({});

  const handleChangeFonepayFile = (file: File | null) => {
    setFonepayFile(file);
    setPaymentErrors((prev) => ({ ...prev, fonepayFile: undefined }));
  };

  // Prefill user details once profile is loaded
  useEffect(() => {
    if (!profile) return;
    const timer = window.setTimeout(() => {
      setFormData((prev) => ({
        ...prev,
        fullName: profile.full_name || "",
        email: profile.email || "",
      }));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [profile]);

  // Auth Guard redirect
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace(`/login?redirectTo=${encodeURIComponent("/checkout")}`);
    }
  }, [loading, isAuthenticated, router]);

  // Redirect if cart is empty (unless order was already successfully placed)
  useEffect(() => {
    if (!loading && items.length === 0 && !successDetails && isAuthenticated) {
      router.replace("/cart");
    }
  }, [loading, items.length, successDetails, isAuthenticated, router]);

  if (loading || !isAuthenticated) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center bg-background text-muted-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-sm font-semibold tracking-wide animate-pulse">Preparing your checkout...</p>
      </div>
    );
  }

  // Handle Order Submission
  const handleSubmitOrder = async () => {
    if (!user) {
      setSubmitError("You must be logged in to place an order.");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);

    const API_URL = process.env.NEXT_PUBLIC_API_URL;
    const deliveryFee = 150;
    let validatedCoupon = appliedCoupon;
    if (appliedCoupon) {
      try {
        validatedCoupon = await applyCoupon(appliedCoupon.code);
      } catch (error) {
        setSubmitError(
          error instanceof Error
            ? error.message
            : "Coupon could not be validated. Please review your cart.",
        );
        setSubmitting(false);
        return;
      }
    }

    const discountAmount = validatedCoupon?.discountAmount ?? 0;
    const discountedSubtotal = Math.max(0, subtotal - discountAmount);
    const totalAmount = discountedSubtotal + deliveryFee;
    const isFonepay = paymentMethod === "fonepay";
    const mappedPaymentMethod = isFonepay ? "fonepay_qr" : "cash_on_delivery";
    const initialOrderStatus = "pending_admin_approval";
    const initialPaymentStatus = isFonepay ? "pending_verification" : "pending";
    const orderNotes = formData.deliveryNotes || null;
    let orderSuccess = false;
    let orderNumberGenerated = "";
    let createdOrderId = "";
    let proofPayload: Record<string, string | number | null> = {};

    if (isFonepay && fonepayFile && supabase) {
      try {
        const ext = fonepayFile.name.split(".").pop() || "proof";
        const storagePath = `orders/${user.id}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("order-proofs")
          .upload(storagePath, fonepayFile, {
            contentType: fonepayFile.type,
            upsert: false,
          });

        if (uploadError) {
          throw new Error(getProofUploadErrorMessage(uploadError));
        }

        const { data: urlData } = supabase.storage
          .from("order-proofs")
          .getPublicUrl(storagePath);

        proofPayload = {
          proof_file_url: urlData.publicUrl,
          proof_file_name: fonepayFile.name,
          proof_file_type: fonepayFile.type,
          proof_file_size: fonepayFile.size,
          proof_uploaded_at: new Date().toISOString(),
          proof_storage_provider: "supabase",
          proof_storage_path: storagePath,
          proof_cleanup_status: "pending",
          admin_notification_status: "pending",
        };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : null;
        setSubmitError(
          message ||
            "Payment proof could not be uploaded. Please try again.",
        );
        setSubmitting(false);
        return;
      }
    }

    // Orders are written directly so the admin approval queue receives the
    // correct status and payment proof fields immediately.
    if (!orderSuccess && supabase) {
      try {
        orderNumberGenerated = `DK-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

        const { data: newOrder, error: orderError } = await supabase
          .from("orders")
          .insert({
            user_id: user.id,
            order_number: orderNumberGenerated,
            status: initialOrderStatus,
            customer_email: formData.email,
            customer_name: formData.fullName,
            customer_phone: formData.phone,
            shipping_address_line1: formData.fullAddress,
            shipping_address_line2: formData.landmark || null,
            shipping_city: formData.provinceCity,
            shipping_state: formData.provinceCity,
            shipping_postal_code: "44600",
            shipping_country: "Nepal",
            subtotal: discountedSubtotal,
            shipping_cost: deliveryFee,
            tax: 0,
            total: totalAmount,
            coupon_code: validatedCoupon?.code ?? null,
            discount_amount: discountAmount,
            original_subtotal: subtotal,
            payment_method: mappedPaymentMethod,
            payment_status: initialPaymentStatus,
            notes: orderNotes,
            ...proofPayload,
          })
          .select("id")
          .single();

        if (orderError) throw orderError;
        if (!newOrder) throw new Error("Something went wrong placing your order. Please try again.");

        createdOrderId = newOrder.id;

        const orderItemsToInsert = items.map(item => ({
          order_id: newOrder.id,
          product_id: isUUID(item.id) ? item.id : null,
          product_name: item.name,
          product_image_url: item.image,
          product_slug: item.slug,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          total_price: item.unitPrice * item.quantity
        }));

        const { error: itemsError } = await supabase
          .from("order_items")
          .insert(orderItemsToInsert);

        if (itemsError) throw itemsError;

        const { error: historyError } = await supabase
          .from("order_status_history")
          .insert({
            order_id: newOrder.id,
            status: initialOrderStatus,
            notes: isFonepay
              ? "Order created - waiting for payment verification"
              : "Order created - waiting for COD approval",
            changed_by: user.id
          });

        if (historyError) throw historyError;

        const { data: cartData } = await supabase
          .from("carts")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (cartData?.id) {
          await supabase
            .from("cart_items")
            .delete()
            .eq("cart_id", cartData.id);
        }

        if (API_URL && session?.access_token) {
          await fetch(`${API_URL}/api/v1/cart`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          }).catch(() => undefined);
        }

        orderSuccess = true;
      } catch (err: unknown) {
        setSubmitError(getCheckoutErrorMessage(err));
      }
    }

    if (!orderSuccess && !submitError && !supabase) {
      setSubmitError("Checkout is not connected right now. Please try again.");
    }

    if (orderSuccess) {
      if (createdOrderId) {
        notifyAdminOfNewOrder(createdOrderId, API_URL);
      }

      setSuccessDetails({
        orderNumber: orderNumberGenerated,
        total: totalAmount,
        paymentMethod: isFonepay ? "Fonepay QR Payment" : "Cash on Delivery",
        email: formData.email,
        name: formData.fullName,
        address: `${formData.fullAddress}, ${formData.provinceCity}`,
      });
      clearCart();
      clearCoupon();
    }

    setSubmitting(false);
  };

  // Render Success Confirmation View
  if (successDetails) {
    const isFonepay = successDetails.paymentMethod === "Fonepay QR Payment";

    return (
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 text-center animate-in zoom-in-95 duration-500">
        <div className="flex flex-col items-center justify-center p-8 bg-card border border-border rounded-3xl shadow-2xl backdrop-blur-md">
          <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-6 border border-primary/20">
            <CheckCircle2 className="h-10 w-10 text-primary" />
          </div>

          <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
            Order Confirmed!
          </h1>
          <p className="mt-2 text-muted-foreground text-sm max-w-md">
            Thank you for shopping with Dakshinkali Electronics. Your order has been successfully logged.
          </p>

          <div className="mt-8 px-6 py-4 bg-muted/40 rounded-2xl border border-border/60 text-left w-full space-y-3.5">
            <div className="flex justify-between items-center text-sm border-b border-border/50 pb-2">
              <span className="text-muted-foreground font-semibold">Order Number</span>
              <span className="font-mono font-bold text-foreground text-base tracking-wider bg-background px-2.5 py-1 rounded-lg border border-border">
                {successDetails.orderNumber}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Deliver To</span>
              <span className="font-bold text-foreground text-right">{successDetails.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Address</span>
              <span className="font-medium text-foreground text-right max-w-xs line-clamp-2">{successDetails.address}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Payment Option</span>
              <span className="font-bold text-foreground">{successDetails.paymentMethod}</span>
            </div>
            <div className="flex justify-between text-sm border-t border-border/50 pt-2">
              <span className="font-bold text-foreground">Total Paid/COD</span>
              <span className="font-black text-primary text-lg">{formatPrice(successDetails.total)}</span>
            </div>
          </div>

          <div className="mt-8 flex gap-4 items-center justify-start text-xs text-muted-foreground bg-primary/5 border border-primary/20 p-4 rounded-xl w-full text-left">
            <Package className="h-6 w-6 text-primary shrink-0" />
            <div className="leading-relaxed">
              <span className="font-bold text-foreground block">Order Timeline:</span>
              {isFonepay ? (
                <>
                  Your payment proof has been received and is pending admin verification.
                  Once verified, your order will be dispatched from our Pokhara warehouse
                  within 24 hours. Delivery typically takes 2-3 business days.
                </>
              ) : (
                <>
                  Our dispatch team will process your order within 24 hours.
                  Delivery will be completed within 2-3 business days. Keep your phone reachable.
                </>
              )}
            </div>
          </div>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 w-full justify-center">
            <Link
              href="/"
              className="px-6 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-bold shadow-md text-center block sm:w-48 cursor-pointer"
            >
              Continue Shopping
            </Link>
            <Link
              href="/account"
              className="px-6 py-3 rounded-xl border border-border bg-background hover:bg-muted text-foreground transition-colors text-sm font-bold text-center block sm:w-48 cursor-pointer"
            >
              View Order History
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      {/* Visual Progress Steps */}
      <div className="mb-10 max-w-xl mx-auto">
        {/* Step circles + connecting line */}
        <div className="relative flex items-center justify-between">
          {/* Full muted background line — sits behind circles */}
          <div
            className="absolute left-0 right-0 h-0.5 bg-border"
            style={{ top: "50%", transform: "translateY(-50%)" }}
          />
          {/* Active progress line — grows left-to-right based on step */}
          <div
            className="absolute left-0 h-0.5 bg-primary transition-all duration-500"
            style={{
              top: "50%",
              transform: "translateY(-50%)",
              width: `${((currentStep - 1) / 2) * 100}%`,
            }}
          />

          {/* Step 1 */}
          <button
            type="button"
            onClick={() => currentStep > 1 && setCurrentStep(1)}
            disabled={currentStep === 1 || submitting}
            className={`relative z-10 h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2 ${
              currentStep >= 1
                ? "bg-primary border-primary text-primary-foreground scale-110 shadow-md shadow-primary/20"
                : "bg-background border-border text-muted-foreground"
            }`}
          >
            1
          </button>

          {/* Step 2 */}
          <button
            type="button"
            onClick={() => currentStep > 2 && setCurrentStep(2)}
            disabled={currentStep <= 2 || submitting}
            className={`relative z-10 h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2 ${
              currentStep >= 2
                ? "bg-primary border-primary text-primary-foreground scale-110 shadow-md shadow-primary/20"
                : "bg-background border-border text-muted-foreground"
            }`}
          >
            2
          </button>

          {/* Step 3 */}
          <span
            className={`relative z-10 h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2 ${
              currentStep === 3
                ? "bg-primary border-primary text-primary-foreground scale-110 shadow-md shadow-primary/20"
                : "bg-background border-border text-muted-foreground"
            }`}
          >
            3
          </span>
        </div>
        <div className="flex justify-between mt-2.5 text-xs font-semibold text-muted-foreground px-1">
          <span className={currentStep >= 1 ? "text-primary font-bold" : ""}>Shipping</span>
          <span className={currentStep >= 2 ? "text-primary font-bold" : ""}>Payment</span>
          <span className={currentStep === 3 ? "text-primary font-bold" : ""}>Review</span>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(320px,3.5fr)]">
        {/* Left Side: Step Forms */}
        <div className="space-y-6">
          {submitError && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex gap-3 items-start animate-in fade-in duration-300">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div className="text-sm text-destructive font-medium leading-relaxed">
                {submitError}
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <ShippingAddressForm
              formData={formData}
              setFormData={setFormData}
              errors={addressErrors}
              setErrors={setAddressErrors}
              onNext={() => setCurrentStep(2)}
            />
          )}

          {currentStep === 2 && (
            <PaymentMethodSelector
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              fonepayFile={fonepayFile}
              onChangeFonepayFile={handleChangeFonepayFile}
              errors={paymentErrors}
              setErrors={setPaymentErrors}
              onBack={() => setCurrentStep(1)}
              onNext={() => setCurrentStep(3)}
            />
          )}

          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-card rounded-2xl border border-border p-6 shadow-md space-y-6">
                <h2 className="text-xl font-bold text-foreground pb-3 border-b border-border/60">
                  Review Your Order
                </h2>

                <div className="grid gap-6 sm:grid-cols-2">
                  {/* Address Summary */}
                  <div className="p-4 bg-white border border-border/60 rounded-xl shadow-sm relative group">
                    <div className="flex items-center gap-2 mb-3">
                      <MapPin className="h-4 w-4 text-primary" />
                      <h3 className="font-bold text-sm text-foreground">Shipping Address</h3>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1.5 leading-relaxed">
                      <p className="font-semibold text-foreground">{formData.fullName}</p>
                      <p>{formData.phone}</p>
                      <p>{formData.fullAddress}</p>
                      <p>{formData.provinceCity}</p>
                      {formData.landmark && <p><span className="text-foreground/80 font-medium">Landmark:</span> {formData.landmark}</p>}
                    </div>
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => setCurrentStep(1)}
                      className="absolute top-4 right-4 text-xs font-bold text-primary hover:underline cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>

                  {/* Payment Summary */}
                  <div className="p-4 bg-white border border-border/60 rounded-xl shadow-sm relative group">
                    <div className="flex items-center gap-2 mb-3">
                      <CreditCard className="h-4 w-4 text-primary" />
                      <h3 className="font-bold text-sm text-foreground">Payment Option</h3>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1.5 leading-relaxed">
                      <p className="font-semibold text-foreground">
                        {paymentMethod === "cod" ? "Cash on Delivery" : "Fonepay QR Payment"}
                      </p>
                      {paymentMethod === "fonepay" && fonepayFile ? (
                        <p className="bg-primary/5 border border-primary/20 px-2 py-1 rounded inline-block text-primary font-medium text-xs">
                          Proof: {fonepayFile.name}
                        </p>
                      ) : (
                        <p>Pay with cash upon delivery</p>
                      )}
                    </div>
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => setCurrentStep(2)}
                      className="absolute top-4 right-4 text-xs font-bold text-primary hover:underline cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>
                </div>

                {formData.deliveryNotes && (
                  <div className="p-4 bg-white border border-border/60 rounded-xl shadow-sm">
                    <h3 className="font-bold text-sm text-foreground mb-1.5">Delivery Notes</h3>
                    <p className="text-xs text-muted-foreground italic leading-relaxed">
                      &ldquo;{formData.deliveryNotes}&rdquo;
                    </p>
                  </div>
                )}

                {/* Delivery Timeline */}
                <div className="p-4 bg-secondary/30 border border-secondary-foreground/10 rounded-xl flex gap-3 items-start">
                  <Calendar className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div className="text-xs text-muted-foreground leading-relaxed">
                    <span className="font-bold text-foreground">Estimated Delivery:</span>{" "}
                    {paymentMethod === "fonepay" ? (
                      <>
                        After admin verifies your payment proof, your order will be dispatched
                        from our Pokhara warehouse within 24 hours. Delivery typically takes
                        2-3 business days across Nepal.
                      </>
                    ) : (
                      <>
                        Your order will be dispatched within 24 hours from our Pokhara warehouse.
                        Delivery typically takes 2-3 business days across Nepal.
                      </>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl flex gap-3 items-start">
                  <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div className="text-xs text-muted-foreground leading-relaxed">
                    <span className="font-bold text-foreground">Security Guarantee:</span> Your details are safe and secure with us. By submitting, you agree to place this order with Dakshinkali Electronics.
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setCurrentStep(2)}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-border bg-background hover:bg-muted transition-colors text-sm font-bold text-foreground cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Payment
                </button>
                <button
                  type="button"
                  onClick={handleSubmitOrder}
                  disabled={submitting}
                  className="px-8 py-3.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-bold shadow-md cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Placing Order...
                    </>
                  ) : (
                    "Place Order"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Sticky Order Summary */}
        <div className="lg:sticky lg:top-28 h-fit">
          <OrderSummary />
        </div>
      </div>
    </section>
  );
}
