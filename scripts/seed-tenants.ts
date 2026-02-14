/**
 * Seed tenants and domains from the four existing clients.
 * Run once after schema creation: npx tsx scripts/seed-tenants.ts
 * Requires DATABASE_URL or NEON_DATABASE_URL in env.
 */

import { neon } from "@neondatabase/serverless";

const connectionString =
  process.env.DATABASE_URL ?? process.env.NEON_DATABASE_URL;
if (!connectionString) {
  console.error("Set DATABASE_URL or NEON_DATABASE_URL");
  process.exit(1);
}

const sql = neon(connectionString);

const tenants: Array<{
  name: string;
  slug: string;
  config: Record<string, unknown>;
  questions: Array<Record<string, unknown>>;
}> = [
  {
    name: "Elliot Wise",
    slug: "elliot-wise",
    config: {
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
    },
    questions: [
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
        question:
          "Have you worked with online coaches or business partners before?",
      },
    ],
  },
  {
    name: "Lions Den University",
    slug: "lionsden",
    config: {
      theme: {
        primaryColor: "#c0c0c0",
        background: "#0a0a0a",
        fontFamily: "'Poppins', sans-serif",
        layout: "centered",
      },
      steps: ["hero", "questions", "contact", "result"],
      hero: {
        logoUrl: "/images/lionsden/logo.png",
        title: "WORK WITH ME",
        body: [
          "After 13 years in the corporate world, £3B+ in sales closed, and mastering attention systems like no one else in the UK, I help salespeople and business owners land clients and grow their brand.",
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
    },
    questions: [
      {
        id: "q1",
        type: "single",
        question: "What describes you best?",
        imageUrl: "/images/lionsden/podcast-1.jpeg",
        options: [
          "Brand owner",
          "Building a personal brand",
          "Salesperson",
          "Director",
        ],
      },
      {
        id: "q2",
        type: "single",
        question: "Which area do you need the most help with right now?",
        imageUrl: "/images/lionsden/family-1.jpg",
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
        imageUrl: "/images/lionsden/social-1.jpg",
        options: ["Time", "Money", "Knowledge", "Network"],
      },
      {
        id: "q4",
        type: "single",
        question: "How long have you been following my account?",
        imageUrl: "/images/lionsden/family-4.jpg",
        options: [
          "Less than 1 month",
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
    ],
  },
  {
    name: "Lionstone",
    slug: "lionstone",
    config: {
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
    },
    questions: [
      {
        id: "role",
        type: "single",
        question: "What best describes you?",
        options: ["Investor", "Founder", "Advisor", "Other"],
      },
    ],
  },
  {
    name: "Peace for Nature",
    slug: "peace-for-nature",
    config: {
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
        {
          id: "email",
          type: "email",
          label: "Email address",
          required: true,
        },
      ],
      defaultThankYouMessage: "Thank you for your interest.",
    },
    questions: [
      {
        id: "interest",
        type: "single",
        question: "What is your main interest?",
        options: [
          "Conservation",
          "Education",
          "Community",
          "All of the above",
        ],
      },
    ],
  },
];

async function main() {
  for (const t of tenants) {
    const configJson = JSON.stringify(t.config);
    const questionsJson = JSON.stringify(t.questions);
    const rows = await sql`
      INSERT INTO tenants (name, config, questions)
      VALUES (${t.name}, ${configJson}::jsonb, ${questionsJson}::jsonb)
      RETURNING id
    `;
    const id = (rows[0] as { id: string })?.id;
    if (!id) {
      throw new Error(`Failed to insert tenant ${t.slug}`);
    }
    await sql`
      INSERT INTO domains (tenant_id, domain, is_primary)
      VALUES (${id}, ${t.slug + ".local"}, true)
    `;
    console.log(`Seeded ${t.name} (${t.slug}.local) -> ${id}`);
  }
  const first = await sql`SELECT id FROM tenants ORDER BY created_at ASC LIMIT 1`;
  const firstId = (first[0] as { id: string })?.id;
  if (firstId) {
    await sql`
      INSERT INTO domains (tenant_id, domain, is_primary)
      VALUES (${firstId}, 'localhost', false)
      ON CONFLICT (domain) DO NOTHING
    `;
    console.log("Added localhost -> first tenant for local dev");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
