// Shared chat-channel constants used by LiveChat (floating button) and
// AdvisorDialog (QR codes). Centralised so updating the WhatsApp number or
// Telegram handle only touches one file.

export const WHATSAPP_NUMBER = "+4412345678";
export const TELEGRAM_URL = "https://t.me/B2BHub_inbox_bot";

export const WHATSAPP_HREF = `https://wa.me/${WHATSAPP_NUMBER.replace(/[^0-9]/g, "")}`;

// External portals
export const SELF_REGISTRATION_URL = "https://b2bhub.ltd/dashboard";

// Advisor avatar — professional blonde woman headshot from Unsplash.
// Used inside the header "Talk to advisor" button, the mobile compact advisor
// button, the desktop AdvisorDialog title, and the MobileMenu advisor tile.
// Swap the photo id below to update everywhere at once.
export const ADVISOR_AVATAR =
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&h=160&fit=crop&crop=faces&q=85";
export const ADVISOR_NAME = "Anna";
