// Shared chat-channel constants used by LiveChat (floating button) and
// AdvisorDialog (QR codes). Centralised so updating the WhatsApp number or
// Telegram handle only touches one file.

export const WHATSAPP_NUMBER = "+4412345678";
export const TELEGRAM_URL = "https://t.me/B2BHub_inbox_bot";

export const WHATSAPP_HREF = `https://wa.me/${WHATSAPP_NUMBER.replace(/[^0-9]/g, "")}`;

// External portals
export const SELF_REGISTRATION_URL = "https://b2bhub.ltd/dashboard";
