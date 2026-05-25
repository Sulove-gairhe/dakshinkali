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

// =============================================================================
// Admin Notification — Skeleton Stub
// =============================================================================
// TODO: Implement actual admin notification when a Fonepay payment proof is
//       submitted. Integration options:
//       - Send email via Resend / SendGrid to admin@dakshinkali.com
//       - Create an in-app notification record in a `notifications` table
//       - Trigger a webhook to a monitoring service
//
// Current behaviour: logs to console only. No email/SMS is actually sent.
// =============================================================================
function notifyAdminOfPayment(orderNumber: string, customerEmail: string): void {
  console.info(
    `[notify-admin] SKELETON — Payment proof submitted for order ${orderNumber} by ${customerEmail}. ` +
    `TODO: Send admin notification (email/SMS/in-app).`,
  );
}

export function CheckoutPageContent() {
  const router = useRouter();
  const { user, profile, loading, isAuthenticated, session, supabase } = useAuth();
  const { items, itemCount, subtotal, clearCart } = useCart();

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
    if (profile) {
      setFormData((prev) => ({
        ...prev,
        fullName: profile.full_name || "",
        email: profile.email || "",
      }));
    }
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
        <p className="text-sm font-semibold tracking-wide animate-pulse">Securing checkout session...</p>
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
    const totalAmount = subtotal + deliveryFee;
    const isFonepay = paymentMethod === "fonepay";
    // TODO: After applying supabase/migrations/20260526000000_add_proof_columns_complete.sql
    //       via Supabase Dashboard SQL Editor, change to:
    //   isFonepay ? "fonepay_qr" : "cash_on_delivery"
    const mappedPaymentMethod = isFonepay ? "bank_transfer" : "cash_on_delivery";

    // Build notes: embed proof metadata as JSON (schema-safe fallback until migration is applied)
    let notesContent: string | null = formData.deliveryNotes || null;
    if (isFonepay && fonepayFile) {
      const proofMeta = JSON.stringify({
        _type: "fonepay_proof",
        fileName: fonepayFile.name,
        fileType: fonepayFile.type,
        fileSize: fonepayFile.size,
        uploadedAt: new Date().toISOString(),
      });
      notesContent = notesContent
        ? `${notesContent}\n---\n${proofMeta}`
        : proofMeta;
    }
    const orderNotes = notesContent;

    // Check if cart contains static/storefront products that cannot go through backend DB verification
    const hasStaticProducts = items.some(item => !isUUID(item.id));
    let orderSuccess = false;
    let orderNumberGenerated = "";

    // 1. Attempt Backend API sync & order placement (if all products are dynamic UUIDs)
    if (!hasStaticProducts && API_URL && session?.access_token) {
      try {
        // Sync cart to DB first
        // a. Clear DB Cart
        await fetch(`${API_URL}/api/v1/cart`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        // b. Add each item to DB Cart
        for (const item of items) {
          await fetch(`${API_URL}/api/v1/cart/items`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              productId: item.id,
              quantity: item.quantity,
            }),
          });
        }

        // c. Place the order via API
        const orderResponse = await fetch(`${API_URL}/api/v1/orders`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            customerEmail: formData.email,
            customerName: formData.fullName,
            customerPhone: formData.phone,
            shippingAddress: {
              line1: formData.fullAddress,
              line2: formData.landmark || null,
              city: formData.provinceCity,
              state: formData.provinceCity,
              postalCode: "44600",
              country: "Nepal",
            },
            paymentMethod: mappedPaymentMethod,
            notes: orderNotes,
          }),
        });

        if (orderResponse.ok) {
          const orderData = await orderResponse.json();
          orderNumberGenerated = orderData.orderNumber;
          orderSuccess = true;
        }
      } catch (err) {
        console.warn("Backend order submission failed, falling back to direct Supabase client insert:", err);
      }
    }

    // 2. Direct Supabase client insert (Fallback or for Static Products)
    if (!orderSuccess && supabase) {
      try {
        orderNumberGenerated = `DK-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

        // a. Insert order
        const { data: newOrder, error: orderError } = await supabase
          .from("orders")
          .insert({
            user_id: user.id,
            order_number: orderNumberGenerated,
            status: "pending",
            customer_email: formData.email,
            customer_name: formData.fullName,
            customer_phone: formData.phone,
            shipping_address_line1: formData.fullAddress,
            shipping_address_line2: formData.landmark || null,
            shipping_city: formData.provinceCity,
            shipping_state: formData.provinceCity,
            shipping_postal_code: "44600",
            shipping_country: "Nepal",
            subtotal: subtotal,
            shipping_cost: deliveryFee,
            tax: 0,
            total: totalAmount,
            payment_method: mappedPaymentMethod,
            payment_status: "pending",
            // Proof metadata is stored in notes as JSON (schema-safe fallback).
            // TODO: After applying supabase/migrations/20260526000000_add_proof_columns_complete.sql
            //       via Supabase Dashboard SQL Editor:
            //   - Set status -> "pending_admin_approval" for Fonepay
            //   - Set payment_status -> "pending_verification" for Fonepay
            //   - Move proof metadata into dedicated columns: proof_file_name, proof_file_type,
            //     proof_file_size, proof_file_url, proof_storage_path, proof_storage_provider,
            //     proof_uploaded_at, proof_cleanup_status, admin_notification_status
            notes: orderNotes,
          })
          .select("id")
          .single();

        if (orderError) throw orderError;
        if (!newOrder) throw new Error("Order creation failed - no data returned");

        // b. Insert items
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

        // c. Insert status history
        const { error: historyError } = await supabase
          .from("order_status_history")
          .insert({
            order_id: newOrder.id,
            status: "pending",
            notes: isFonepay
              ? "Order created - awaiting admin payment verification (proof metadata in notes field)"
              : "Order created",
            changed_by: user.id
          });

        if (historyError) throw historyError;

        // d. Clear DB cart if it exists
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

        orderSuccess = true;
      } catch (err: any) {
        const errDetail = err ? JSON.stringify(err, Object.getOwnPropertyNames(err)) : "null";
        console.error("Direct Supabase insert failed:", err, "detail:", errDetail);
        setSubmitError(err?.message || errDetail || "An unexpected error occurred while placing your order. Please try again.");
      }
    }

    if (orderSuccess) {
      // Notify admin for Fonepay orders (skeleton stub)
      if (isFonepay) {
        notifyAdminOfPayment(orderNumberGenerated, formData.email);
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
                    <span className="font-bold text-foreground">Security Guarantee:</span> Your details are protected by our end-to-end secure database schema and RLS policies. By submitting, you agree to place this order with Dakshinkali Electronics.
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
