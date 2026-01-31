import type { AppConfig } from "funnel-core";

const config: AppConfig = {
  theme: {
    primaryColor: "#c0c0c0",
    background: "#0a0a0a",
    fontFamily: "var(--font-serif)",
    layout: "centered",
  },
  steps: ["hero", "questions", "contact", "result"],
  hero: {
    logoUrl: "/images/lionsden/logo.png",
    title: "WORK WITH ME",
    body: [
      "After 13 years in the corporate world, £2B+ in sales closed, and mastering attention systems like no one else in the UK, I help salespeople and business owners land clients and grow their brand.",
      "Take these 6 questions to see if this could be a fit for you.",
    ],
    ctaLabel: "",
    footerText: "200+ people have filled this out",
    imageUrl: "/images/lionsden/authority-1.jpg",
  },
  contactImageUrl: "/images/lionsden/family-5.jpg",
  contactFields: [
    {
      id: "email",
      type: "email",
      label: "Email address",
      required: true,
      placeholder: "you@example.com",
    },
    {
      id: "whatsapp",
      type: "tel",
      label: "WhatsApp number",
      required: true,
      placeholder: "07400 123456",
    },
  ],
  contactIntro: "Enter your details to receive free training.",
  defaultThankYouMessage: "Thanks. Check your WhatsApp.",
};

export default config;
