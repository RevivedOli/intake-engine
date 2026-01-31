import type { AppConfig } from "@/types";

const config: AppConfig = {
  theme: {
    primaryColor: "#4a6b5a",
    background: "#0f1412",
    fontFamily: "var(--font-sans)",
    layout: "centered",
  },
  steps: ["questions", "contact", "result"],
  contactFields: [
    { id: "email", type: "email", label: "Email", required: true },
    { id: "name", type: "text", label: "Full name", required: false },
  ],
  defaultThankYouMessage: "Thank you. We'll be in touch.",
};

export default config;
