import type { Question } from "funnel-core";

export const questions: Question[] = [
  {
    id: "q1",
    type: "single",
    question: "What describes you best?",
    imageUrl: "/images/lionsden/podcast-1.jpeg",
    options: [
      "Salesperson",
      "Brand owner",
      "Business owner",
      "Building a personal brand",
    ],
  },
  {
    id: "q2",
    type: "single",
    question: "Which area do you need the most help with right now?",
    imageUrl: "/images/lionsden/family-1.jpg",
    options: [
      "Strategic Planning",
      "Team Management",
      "Personal development",
      "Leads / Sales Systems",
      "Family and relationships",
    ],
  },
  {
    id: "q3",
    type: "single",
    question: "What is your biggest frustration right now?",
    imageUrl: "/images/lionsden/social-1.jpg",
    options: [
      "Time", 
      "Money", 
      "Network",
      "Knowledge"
    ],
  },
  {
    id: "q4",
    type: "single",
    question: "How long have you been following my account?",
    imageUrl: "/images/lionsden/family-4.jpg",
    options: [
      "< 1 month",
      "Up to 6 months",
      "More than 6 months",
    ],
  },
  {
    id: "q5",
    type: "single",
    question: "Where are you based?",
    imageUrl: "/images/lionsden/podcast-2.jpg",
    options: ["UK", "USA", "Europe", "Other"],
  },
];
