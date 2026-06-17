import { Resend } from "resend";

export type CustomerOrderEmailData = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  shipping_address_line1: string;
  shipping_address_line2: string | null;
  shipping_city: string;
  shipping_state: string;
  shipping_country: string;
  payment_method: string;
  total: number;
  subtotal: number;
  shipping_cost: number;
  discount_amount: number;
  coupon_code: string | null;
  notes: string | null;
  created_at: string;
  items: Array<{
    product_name: string;
    quantity: number;
    unit_price: number;
    product_image_url?: string | null;
  }>;
};

export type SendCustomerOrderEmailOptions = {
  storefrontUrl: string;
};

const DEFAULT_FROM =
  "Dakshinkali Electro <noreply@dakshinkali.shop>";
const PRODUCTION_STOREFRONT_URL = "https://dakshinkali.shop";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatNpr(amount: number) {
  if (!Number.isFinite(amount) || amount < 0) return "NPR 0";
  return `NPR ${Math.round(amount).toLocaleString("en-NP")}`;
}

function paymentMethodLabel(method: string): string {
  switch (method) {
    case "cash_on_delivery":
      return "Cash on Delivery";
    case "fonepay_qr":
      return "Fonepay / QR Payment";
    case "esewa":
      return "eSewa";
    case "khalti":
      return "Khalti";
    case "bank_transfer":
      return "Fonepay / QR Payment";
    default:
      return method || "Payment Pending";
  }
}

function normalizeText(value: string | null | undefined, fallback = "—") {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
}

function formatAddress(order: CustomerOrderEmailData) {
  const parts = [
    order.shipping_address_line1,
    order.shipping_address_line2,
    order.shipping_city,
    order.shipping_state,
    order.shipping_country || "Nepal",
  ]
    .map((part) => normalizeText(part, ""))
    .filter(Boolean);

  return parts.join(", ");
}

function getPrimaryProductName(order: CustomerOrderEmailData) {
  return normalizeText(order.items[0]?.product_name, "your order");
}

function normalizeStorefrontUrl(storefrontUrl: string) {
  const trimmed = storefrontUrl.trim().replace(/\/+$/, "");
  if (!trimmed || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(trimmed)) {
    return PRODUCTION_STOREFRONT_URL;
  }
  return trimmed;
}

function normalizeImageUrl(imageUrl: string | null | undefined, storefrontUrl: string) {
  const trimmed = imageUrl?.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;

  const baseUrl = normalizeStorefrontUrl(storefrontUrl);
  return `${baseUrl}${trimmed.startsWith("/") ? "" : "/"}${trimmed}`;
}

function inferGreeting(customerName: string) {
  const name = normalizeText(customerName, "Customer");
  const firstName = name.split(/\s+/)[0]?.toLowerCase() ?? "";
  const feminineNames = new Set([
    "aarti",
    "anjali",
    "asmita",
    "bimala",
    "gita",
    "kavita",
    "laxmi",
    "manisha",
    "mina",
    "nisha",
    "pratima",
    "puja",
    "rita",
    "sangita",
    "sita",
    "sunita",
  ]);
  const masculineNames = new Set([
    "amit",
    "bibek",
    "bikash",
    "dipesh",
    "krishna",
    "prakash",
    "rajesh",
    "ramesh",
    "sulov",
    "suman",
    "suresh",
  ]);

  if (feminineNames.has(firstName)) return `Dear Ms ${name},`;
  if (masculineNames.has(firstName)) return `Dear Mr ${name},`;
  return `Dear ${name},`;
}

function buildOrderSummaryRows(order: CustomerOrderEmailData) {
  const rows = [
    ["Order Number", order.order_number],
    ["Deliver To", order.customer_name],
    ["Address", formatAddress(order)],
    ["Payment Option", paymentMethodLabel(order.payment_method)],
    ["Subtotal", formatNpr(order.subtotal)],
    ["Shipping", formatNpr(order.shipping_cost)],
  ];

  if (order.discount_amount > 0) {
    rows.push(["Discount", formatNpr(order.discount_amount)]);
  }

  if (order.coupon_code?.trim()) {
    rows.push(["Coupon", order.coupon_code.trim()]);
  }

  rows.push(["Total", formatNpr(order.total)]);

  return rows
    .map(
      ([label, value]) => `<tr>
        <td style="padding:8px 12px;color:#6b7280;font-size:13px;border-bottom:1px solid #eee;width:150px;">${escapeHtml(label)}</td>
        <td style="padding:8px 12px;color:#111827;font-size:14px;border-bottom:1px solid #eee;font-weight:${label === "Total" ? "700" : "500"};">${escapeHtml(value)}</td>
      </tr>`,
    )
    .join("");
}

function buildItemsRows(order: CustomerOrderEmailData, storefrontUrl: string) {
  return order.items
    .map((item) => {
      const productName = normalizeText(item.product_name, "Product");
      const quantity = Number.isFinite(item.quantity) ? item.quantity : 0;
      const unitPrice = Number.isFinite(item.unit_price) ? item.unit_price : 0;
      const lineTotal = quantity * unitPrice;
      const imageUrl = normalizeImageUrl(item.product_image_url, storefrontUrl);
      const image = imageUrl
        ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(productName)}" width="60" height="60" style="display:block;width:60px;height:60px;max-width:60px;max-height:60px;border-radius:8px;border:1px solid #e5e7eb;">`
        : `<div style="width:60px;height:60px;background:#f3f4f6;border:1px solid #e5e7eb;border-radius:8px;"></div>`;

      return `<tr>
        <td style="padding:10px 12px;border-bottom:1px solid #eee;width:72px;">${image}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #eee;color:#111827;font-size:14px;font-weight:500;">${escapeHtml(productName)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #eee;text-align:center;color:#111827;font-size:14px;">${quantity}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #eee;text-align:right;color:#111827;font-size:14px;">${formatNpr(unitPrice)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #eee;text-align:right;color:#111827;font-size:14px;font-weight:600;">${formatNpr(lineTotal)}</td>
      </tr>`;
    })
    .join("");
}

function buildCustomerOrderEmailText(
  order: CustomerOrderEmailData,
  options: SendCustomerOrderEmailOptions,
) {
  const storefrontUrl = normalizeStorefrontUrl(options.storefrontUrl);
  const itemsText = order.items
    .map((item) => {
      const quantity = Number.isFinite(item.quantity) ? item.quantity : 0;
      const unitPrice = Number.isFinite(item.unit_price) ? item.unit_price : 0;
      return `- ${normalizeText(item.product_name, "Product")} x ${quantity} @ ${formatNpr(unitPrice)} = ${formatNpr(quantity * unitPrice)}`;
    })
    .join("\n");

  const discountLine =
    order.discount_amount > 0
      ? `Discount: ${formatNpr(order.discount_amount)}\n`
      : "";
  const couponLine = order.coupon_code?.trim()
    ? `Coupon: ${order.coupon_code.trim()}\n`
    : "";

  return `${inferGreeting(order.customer_name)}

Thank you for shopping with Dakshinkali Electronics Centre. Your order has been successfully confirmed.

Order Number: ${order.order_number}
Deliver To: ${normalizeText(order.customer_name)}
Address: ${formatAddress(order)}
Payment Option: ${paymentMethodLabel(order.payment_method)}
Subtotal: ${formatNpr(order.subtotal)}
Shipping: ${formatNpr(order.shipping_cost)}
${discountLine}${couponLine}Total: ${formatNpr(order.total)}

Items:
${itemsText || "No items"}

Our dispatch team will process your order within 24 hours.
Delivery will be completed within 2-3 business days.
Keep your phone reachable for delivery confirmation.

Continue Shopping: ${storefrontUrl}/
View Order History: ${storefrontUrl}/account

Dakshinkali Electronics Centre
Newroad, Pokhara, Nepal
support@dakshinkali.shop`;
}

function buildCustomerOrderEmailHtml(
  order: CustomerOrderEmailData,
  options: SendCustomerOrderEmailOptions,
) {
  const storefrontUrl = normalizeStorefrontUrl(options.storefrontUrl);
  const continueShoppingUrl = `${storefrontUrl}/`;
  const orderHistoryUrl = `${storefrontUrl}/account`;
  const primaryProductName = getPrimaryProductName(order);
  const itemsRows = buildItemsRows(order, storefrontUrl);

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <tr><td style="background:#111827;padding:20px 24px;">
          <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">Order confirmed - ${escapeHtml(primaryProductName)}</h1>
          <p style="margin:6px 0 0;color:#9ca3af;font-size:14px;">Order #${escapeHtml(order.order_number)}</p>
        </td></tr>
        <tr><td style="padding:24px;">
          <p style="margin:0 0 16px;color:#111827;font-size:15px;font-weight:500;">${escapeHtml(inferGreeting(order.customer_name))}</p>
          <div style="margin-bottom:16px;padding:16px;background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;">
            <p style="margin:0;color:#111827;font-size:15px;line-height:1.5;">Thank you for shopping with Dakshinkali Electronics Centre. Your order has been successfully confirmed.</p>
            <p style="margin:10px 0 0;color:#111827;font-size:18px;font-weight:700;">#${escapeHtml(order.order_number)}</p>
          </div>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;border:1px solid #eee;border-radius:8px;overflow:hidden;">
            <tbody>${buildOrderSummaryRows(order)}</tbody>
          </table>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;border:1px solid #eee;border-radius:8px;overflow:hidden;">
            <thead>
              <tr style="background:#f9fafb;">
                <th style="padding:8px 12px;text-align:left;font-size:12px;color:#6b7280;" colspan="2">Item</th>
                <th style="padding:8px 12px;text-align:center;font-size:12px;color:#6b7280;">Qty</th>
                <th style="padding:8px 12px;text-align:right;font-size:12px;color:#6b7280;">Unit Price</th>
                <th style="padding:8px 12px;text-align:right;font-size:12px;color:#6b7280;">Line Total</th>
              </tr>
            </thead>
            <tbody>${itemsRows || '<tr><td colspan="5" style="padding:12px;color:#9ca3af;">No items</td></tr>'}</tbody>
          </table>
          <div style="margin:16px 0;padding:12px;background:#f9fafb;border-radius:8px;">
            <p style="margin:0 0 6px;color:#111827;font-size:14px;font-weight:700;">Order timeline</p>
            <p style="margin:0;color:#374151;font-size:14px;line-height:1.6;">Our dispatch team will process your order within 24 hours.<br>Delivery will be completed within 2-3 business days.<br>Keep your phone reachable for delivery confirmation.</p>
          </div>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
            <tr>
              <td style="padding-right:8px;width:50%;">
                <a href="${escapeHtml(continueShoppingUrl)}" style="display:block;padding:12px 16px;background:#111827;color:#ffffff;text-decoration:none;text-align:center;border-radius:8px;font-weight:600;font-size:14px;">Continue Shopping</a>
              </td>
              <td style="padding-left:8px;width:50%;">
                <a href="${escapeHtml(orderHistoryUrl)}" style="display:block;padding:12px 16px;background:#2563eb;color:#ffffff;text-decoration:none;text-align:center;border-radius:8px;font-weight:600;font-size:14px;">View Order History</a>
              </td>
            </tr>
          </table>
          <p style="margin:24px 0 0;color:#6b7280;font-size:13px;line-height:1.5;">Dakshinkali Electronics Centre<br>Newroad, Pokhara, Nepal<br>support@dakshinkali.shop</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendCustomerOrderEmail(
  order: CustomerOrderEmailData,
  options: SendCustomerOrderEmailOptions,
): Promise<void> {
  const recipient = order.customer_email?.trim();

  if (!recipient) {
    console.log("[CUSTOMER_EMAIL_SKIP]", {
      order_number: order.order_number,
      reason: "missing customer_email",
    });
    return;
  }

  try {
    console.log("[CUSTOMER_EMAIL_ATTEMPT]", {
      to: recipient,
      order_number: order.order_number,
    });

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY is required.");
    }

    const resend = new Resend(apiKey);
    const primaryProductName = getPrimaryProductName(order);
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM ?? DEFAULT_FROM,
      to: recipient,
      subject: `Order Confirmed - ${primaryProductName} | Dakshinkali Electronics Centre`,
      text: buildCustomerOrderEmailText(order, options),
      html: buildCustomerOrderEmailHtml(order, options),
    });

    if (error) {
      throw new Error(error.message);
    }

    console.log("[CUSTOMER_EMAIL_SUCCESS]");
  } catch (error) {
    console.log(
      "[CUSTOMER_EMAIL_ERROR]",
      error instanceof Error ? error.message : String(error),
    );
  }
}
