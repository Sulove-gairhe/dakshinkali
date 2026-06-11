import { getSmtpConfigFromEnv, sendSmtpMail } from "./smtp";

export type AdminOrderEmailItem = {
  productName: string;
  quantity: number;
  unitPrice: number;
};

export type AdminOrderEmailInput = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  shippingAddressLine1: string;
  shippingAddressLine2: string | null;
  shippingCity: string;
  shippingState: string;
  shippingPostalCode: string;
  shippingCountry: string;
  subtotal: number;
  discountAmount: number;
  couponCode: string | null;
  total: number;
  notes: string | null;
  items: AdminOrderEmailItem[];
};

export type AdminOrderEmailLabels = {
  paymentMethod: string;
  orderStatus: string;
  paymentStatus: string;
};

export type SendAdminOrderEmailOptions = {
  adminUrl: string;
  labels: AdminOrderEmailLabels;
};

function getAdminOrderRecipient() {
  return (
    process.env.ADMIN_EMAIL_TO ||
    process.env.ADMIN_EMAIL_OTP_RECIPIENT ||
    process.env.ADMIN_EMAIL_FROM ||
    (process.env.NODE_ENV === "production" ? null : "admin@dakshinkali.shop")
  );
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatNpr(amount: number) {
  if (!Number.isFinite(amount) || amount < 0) return "Rs. —";
  return `Rs. ${Math.round(amount).toLocaleString("en-NP")}`;
}

function formatShippingAddress(order: AdminOrderEmailInput) {
  const lines = [order.shippingAddressLine1];
  if (order.shippingAddressLine2?.trim()) {
    lines.push(order.shippingAddressLine2);
  }
  lines.push(
    `${order.shippingCity}, ${order.shippingState} ${order.shippingPostalCode}`,
    order.shippingCountry || "Nepal",
  );
  return lines.filter(Boolean).join("\n");
}

function buildOrderEmailText(
  order: AdminOrderEmailInput,
  options: SendAdminOrderEmailOptions,
) {
  const { adminUrl, labels } = options;
  const itemsText = order.items
    .map(
      (item) =>
        `- ${item.productName} × ${item.quantity} @ ${formatNpr(item.unitPrice)}`,
    )
    .join("\n");

  const discountLine =
    order.discountAmount > 0
      ? `Discount${order.couponCode ? ` (${order.couponCode})` : ""}: -${formatNpr(order.discountAmount)}\n`
      : "";

  return `New order received

Order: #${order.orderNumber}
Order ID: ${order.id}

Customer: ${order.customerName}
Email: ${order.customerEmail || "—"}
Phone: ${order.customerPhone || "—"}

Delivery address:
${formatShippingAddress(order)}

Items:
${itemsText || "—"}

Subtotal: ${formatNpr(order.subtotal)}
${discountLine}Total: ${formatNpr(order.total)}

Payment method: ${labels.paymentMethod}
Order status: ${labels.orderStatus}
Payment status: ${labels.paymentStatus}

${order.notes?.trim() ? `Customer note:\n${order.notes.trim()}\n\n` : ""}View order: ${adminUrl}/admin/orders/${order.id}
Approval queue: ${adminUrl}/admin/orders/approval`;
}

function buildOrderEmailHtml(
  order: AdminOrderEmailInput,
  options: SendAdminOrderEmailOptions,
) {
  const { adminUrl, labels } = options;
  const orderUrl = `${adminUrl}/admin/orders/${order.id}`;
  const approvalUrl = `${adminUrl}/admin/orders/approval`;

  const itemsRows = order.items
    .map(
      (item) => `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;">${escapeHtml(item.productName)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;">${formatNpr(item.unitPrice)}</td>
      </tr>`,
    )
    .join("");

  const discountRow =
    order.discountAmount > 0
      ? `<tr>
        <td colspan="2" style="padding:8px 12px;color:#666;">Discount${order.couponCode ? ` (${escapeHtml(order.couponCode)})` : ""}</td>
        <td style="padding:8px 12px;text-align:right;color:#16a34a;">-${formatNpr(order.discountAmount)}</td>
      </tr>`
      : "";

  const notesBlock = order.notes?.trim()
    ? `<div style="margin-top:16px;padding:12px;background:#f9fafb;border-radius:8px;">
        <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;">Customer note</p>
        <p style="margin:0;color:#374151;white-space:pre-wrap;">${escapeHtml(order.notes.trim())}</p>
      </div>`
    : "";

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <tr><td style="background:#111827;padding:20px 24px;">
          <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">New order received</h1>
          <p style="margin:6px 0 0;color:#9ca3af;font-size:14px;">Order #${escapeHtml(order.orderNumber)}</p>
        </td></tr>
        <tr><td style="padding:24px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
            <tr>
              <td style="padding:6px 0;color:#6b7280;font-size:13px;width:120px;">Customer</td>
              <td style="padding:6px 0;color:#111827;font-size:14px;font-weight:500;">${escapeHtml(order.customerName)}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#6b7280;font-size:13px;">Email</td>
              <td style="padding:6px 0;color:#111827;font-size:14px;">${escapeHtml(order.customerEmail || "—")}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#6b7280;font-size:13px;">Phone</td>
              <td style="padding:6px 0;color:#111827;font-size:14px;">${escapeHtml(order.customerPhone || "—")}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#6b7280;font-size:13px;vertical-align:top;">Address</td>
              <td style="padding:6px 0;color:#111827;font-size:14px;white-space:pre-line;">${escapeHtml(formatShippingAddress(order))}</td>
            </tr>
          </table>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;border:1px solid #eee;border-radius:8px;overflow:hidden;">
            <thead>
              <tr style="background:#f9fafb;">
                <th style="padding:8px 12px;text-align:left;font-size:12px;color:#6b7280;">Item</th>
                <th style="padding:8px 12px;text-align:center;font-size:12px;color:#6b7280;">Qty</th>
                <th style="padding:8px 12px;text-align:right;font-size:12px;color:#6b7280;">Price</th>
              </tr>
            </thead>
            <tbody>${itemsRows || '<tr><td colspan="3" style="padding:12px;color:#9ca3af;">No items</td></tr>'}</tbody>
            <tfoot>
              <tr>
                <td colspan="2" style="padding:8px 12px;color:#666;">Subtotal</td>
                <td style="padding:8px 12px;text-align:right;">${formatNpr(order.subtotal)}</td>
              </tr>
              ${discountRow}
              <tr style="background:#f9fafb;">
                <td colspan="2" style="padding:10px 12px;font-weight:700;">Total</td>
                <td style="padding:10px 12px;text-align:right;font-weight:700;">${formatNpr(order.total)}</td>
              </tr>
            </tfoot>
          </table>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
            <tr>
              <td style="padding:4px 0;color:#6b7280;font-size:13px;">Payment</td>
              <td style="padding:4px 0;color:#111827;font-size:14px;">${escapeHtml(labels.paymentMethod)}</td>
            </tr>
            <tr>
              <td style="padding:4px 0;color:#6b7280;font-size:13px;">Order status</td>
              <td style="padding:4px 0;color:#111827;font-size:14px;">${escapeHtml(labels.orderStatus)}</td>
            </tr>
            <tr>
              <td style="padding:4px 0;color:#6b7280;font-size:13px;">Payment status</td>
              <td style="padding:4px 0;color:#111827;font-size:14px;">${escapeHtml(labels.paymentStatus)}</td>
            </tr>
          </table>
          ${notesBlock}
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
            <tr>
              <td style="padding-right:8px;width:50%;">
                <a href="${orderUrl}" style="display:block;padding:12px 16px;background:#111827;color:#ffffff;text-decoration:none;text-align:center;border-radius:8px;font-weight:600;font-size:14px;">View Order</a>
              </td>
              <td style="padding-left:8px;width:50%;">
                <a href="${approvalUrl}" style="display:block;padding:12px 16px;background:#2563eb;color:#ffffff;text-decoration:none;text-align:center;border-radius:8px;font-weight:600;font-size:14px;">Go to Approval Queue</a>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendAdminOrderEmail(
  order: AdminOrderEmailInput,
  options: SendAdminOrderEmailOptions,
) {
  const provider = (process.env.ADMIN_EMAIL_PROVIDER || "mock").toLowerCase();
  const isProduction = process.env.NODE_ENV === "production";
  const recipient = getAdminOrderRecipient();

  if (!recipient) {
    throw new Error("Admin order email recipient is not configured.");
  }

  const subject = `New order #${order.orderNumber}`;
  const text = buildOrderEmailText(order, options);
  const html = buildOrderEmailHtml(order, options);

  if (provider === "resend") {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.ADMIN_EMAIL_FROM;
    if (!apiKey || !from) {
      throw new Error("RESEND_API_KEY and ADMIN_EMAIL_FROM are required.");
    }
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: recipient, subject, text, html }),
    });
    if (!response.ok) {
      throw new Error(`Resend failed with HTTP ${response.status}`);
    }
    return;
  }

  if (provider === "smtp") {
    const smtp = getSmtpConfigFromEnv();
    if (!smtp) {
      throw new Error("SMTP_HOST, SMTP_USER, SMTP_PASS, and SMTP_FROM are required.");
    }
    await sendSmtpMail({
      ...smtp,
      to: recipient,
      subject,
      text,
      html,
    });
    return;
  }

  if (
    provider === "mock" &&
    (!isProduction || process.env.ALLOW_MOCK_EMAIL_IN_PRODUCTION === "true")
  ) {
    console.log("[ADMIN_ORDER_EMAIL_MOCK]", {
      recipient,
      orderId: order.id,
      orderNumber: order.orderNumber,
    });
    return;
  }

  throw new Error("Admin email provider is not configured.");
}
