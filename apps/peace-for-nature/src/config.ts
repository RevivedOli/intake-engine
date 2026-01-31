import type { AppConfig } from "funnel-core";

const config: AppConfig = {
  theme: {
    primaryColor: "#2d5a4a",
    background: "#0d1f18",
    fontFamily: "var(--font-sans)",
    layout: "centered",
  },
  steps: ["hero", "questions", "contact", "result"],
  hero: {
    title: "Peace for Nature",
    body: [
      "Answer a few questions to see how we can help you support nature.",
    ],
    ctaLabel: "Get started",
  },
  contactFields: [
    { id: "email", type: "email", label: "Email address", required: true },
  ],
  defaultThankYouMessage: "Thank you for your interest.",
};

export default config;
