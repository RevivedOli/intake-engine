import type { Question } from "@/types";

export const questions: Question[] = [
  {
    id: "q1",
    type: "single",
    question: "What describes you best?",
    options: [
      "Brand owner",
      "Business owner building a personal brand",
      "Salesperson",
      "Director",
    ],
  },
  {
    id: "q2",
    type: "single",
    question: "Which area do you need the most help with right now?",
    options: [
      "Revenue generation",
      "Strategies",
      "Personal development",
      "Family",
    ],
  },
  {
    id: "q3",
    type: "single",
    question: "What is your biggest frustration right now?",
    options: ["Time", "Money", "Knowledge", "Network"],
  },
  {
    id: "q4",
    type: "single",
    question: "How long have you been following my account?",
    options: [
      "Less than 1 month",
      "Up to 6 months",
      "More than 6 months",
    ],
  },
  {
    id: "q5",
    type: "multi",
    question: "Where are you based?",
    options: ["UK", "USA", "Europe", "Other"],
  },
  {
    id: "q6",
    type: "text",
    question: "Have you worked with online coaches or business partners before?",
  },
];
