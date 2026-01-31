import type { AppConfig } from "@/types";

const config: AppConfig = {
  theme: {
    primaryColor: "#a47f4c",
    background: "#1a2e28",
    fontFamily: "var(--font-sans)",
    layout: "centered",
  },
  steps: ["hero", "questions", "contact", "result"],
  hero: {
    title: "WORK WITH ME",
    body: [
      "I'm a father first, a founder second - and the handful of companies I work with personally get the same level of care and attention I'd give my own business.",
      "If you're an established owner looking to modernise with AI, reduce costs, and scale with smarter systems, this is your chance to bring me into the heart of your operations.",
      "I get more requests than I could ever take on, so I choose the businesses where I know I can make a real impact.",
      "If you want to be considered, apply below and I'll look at it myself.",
    ],
    ctaLabel: "👇 Request an application review.",
    footerText: "2175 people have filled this out",
  },
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
