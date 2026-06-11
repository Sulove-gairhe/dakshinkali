export { sendSmtpMail, getSmtpConfigFromEnv } from "./src/smtp";
export type { SmtpMailInput } from "./src/smtp";
export { sendAdminOrderEmail } from "./src/order-email";
export type {
  AdminOrderEmailInput,
  AdminOrderEmailItem,
  AdminOrderEmailLabels,
  SendAdminOrderEmailOptions,
} from "./src/order-email";
