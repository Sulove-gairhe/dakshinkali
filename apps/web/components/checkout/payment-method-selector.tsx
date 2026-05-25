"use client";

import { Bike, QrCode, ArrowLeft } from "lucide-react";
import { FonepayQrCard } from "./fonepay-qr-card";
import { FormEvent } from "react";

export type PaymentMethod = "cod" | "fonepay";

interface PaymentMethodSelectorProps {
  paymentMethod: PaymentMethod;
  setPaymentMethod: (method: PaymentMethod) => void;
  fonepayFile: File | null;
  onChangeFonepayFile: (file: File | null) => void;
  errors: Partial<Record<string, string>>;
  setErrors: (errors: Partial<Record<string, string>>) => void;
  onBack: () => void;
  onNext: () => void;
}

export function PaymentMethodSelector({
  paymentMethod,
  setPaymentMethod,
  fonepayFile,
  onChangeFonepayFile,
  errors,
  setErrors,
  onBack,
  onNext,
}: PaymentMethodSelectorProps) {

  const handleNext = (e: FormEvent) => {
    e.preventDefault();

    if (paymentMethod === "fonepay") {
      if (!fonepayFile) {
        setErrors({
          ...errors,
          fonepayFile: "Payment proof file is required for Fonepay QR payment",
        });
        return;
      }
    }

    setErrors({ ...errors, fonepayFile: undefined });
    onNext();
  };

  const handleMethodSelect = (method: PaymentMethod) => {
    setPaymentMethod(method);
    setErrors({ ...errors, fonepayFile: undefined });
  };

  return (
    <form onSubmit={handleNext} className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-card rounded-2xl border border-border p-6 shadow-md space-y-5">
        <h2 className="text-xl font-bold text-foreground pb-3 border-b border-border/60 flex items-center gap-2">
          Select Payment Option
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div
            onClick={() => handleMethodSelect("cod")}
            className={`group flex flex-col p-5 rounded-xl border-2 transition-all cursor-pointer ${
              paymentMethod === "cod"
                ? "border-primary bg-primary/5 shadow-md"
                : "border-border/80 hover:border-primary/50 hover:bg-muted/30"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-lg transition-colors ${
                paymentMethod === "cod"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
              }`}>
                <Bike className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-foreground">Cash on Delivery</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Pay upon delivery</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
              Simple and trustworthy. You can inspect the package and pay our delivery rider in cash right at your doorstep.
            </p>
          </div>

          <div
            onClick={() => handleMethodSelect("fonepay")}
            className={`group flex flex-col p-5 rounded-xl border-2 transition-all cursor-pointer ${
              paymentMethod === "fonepay"
                ? "border-primary bg-primary/5 shadow-md"
                : "border-border/80 hover:border-primary/50 hover:bg-muted/30"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-lg transition-colors ${
                paymentMethod === "fonepay"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
              }`}>
                <QrCode className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-foreground">Fonepay QR Payment</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Scan & Pay instantly</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
              Scan our official Fonepay QR merchant code from your banking app or digital wallet and upload the transaction ID.
            </p>
          </div>
        </div>

        {paymentMethod === "fonepay" && (
          <FonepayQrCard
            file={fonepayFile}
            onChangeFile={onChangeFonepayFile}
            error={errors.fonepayFile}
          />
        )}
      </div>

      <div className="flex justify-between items-center">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-border bg-background hover:bg-muted transition-colors text-sm font-bold text-foreground cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Address
        </button>
        <button
          type="submit"
          className="px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-bold shadow-md cursor-pointer"
        >
          Continue to Review
        </button>
      </div>
    </form>
  );
}
