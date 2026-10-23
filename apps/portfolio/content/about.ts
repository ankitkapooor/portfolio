/**
 * About content, taken from the owner's résumé (October 2026). Every figure
 * here is the owner's own claim from that document; nothing is estimated.
 * The phone number on the résumé is deliberately not published.
 */

export const headline = {
  role: "MBA candidate, USC Marshall · Former ML Team Lead",
  location: "Los Angeles, CA",
};

/** Three proof points for the hero, each traceable to an experience bullet. */
export const highlights = [
  { value: "15", label: "person gen-AI team built from scratch" },
  { value: "10×", label: "faster medical coding per chart" },
  { value: "91%", label: "CPT test accuracy on surgical charts" },
] as const;

export const intro = [
  "I spent three years building AI for U.S. healthcare revenue cycle, first as a machine learning engineer and then leading the team. The decisions that mattered most weren't about models. They were about which charts to automate, which client problem to solve first, and what the product had to prove before anyone would trust it.",
  "That's why I'm doing an MBA at USC Marshall, and it's what the projects on this site are for: working products that pair the engineering with the strategy behind it, built on real public data with the assumptions in the open.",
];

export type Role = {
  period: string;
  title: string;
  org: string;
  place: string;
  context?: string;
  points: readonly string[];
};

export const experience: readonly Role[] = [
  {
    period: "2026 — Present",
    title: "AVP of Technology",
    org: "Marshall Graduate Student Association",
    place: "USC Marshall",
    points: [
      "Leading initiatives to raise AI and technology literacy across the MBA cohort.",
      "Working with Marshall administration to improve the student experience.",
    ],
  },
  {
    period: "Mar 2023 — Jul 2026",
    title: "Machine Learning Engineer → Team Lead",
    org: "Ascent Business Solutions",
    place: "Nagpur, India",
    context: "Medical coding and revenue-cycle services for U.S. providers",
    points: [
      "Built and managed a 15-person generative AI team from scratch, partnering with HR on hiring, to deliver a portfolio of concurrent healthcare revenue-cycle products.",
      "Cut coding time per chart 10× at up to 91% CPT test accuracy by focusing the auto-coding product on orthopedic and urology surgery charts over easier radiology charts, for their larger implementation scope.",
      "Shipped a Clinical Documentation Improvement product for U.S. hospitals that checked chart completeness against payer documentation requirements and flagged errors likely to trigger claim denials.",
      "Turned workflow bottlenecks into product requirements with medical-coding, operations, and client teams.",
    ],
  },
  {
    period: "Oct 2022 — Mar 2023",
    title: "Conversational AI Engineer Trainee",
    org: "Bradsol",
    place: "Hyderabad, India",
    points: [
      "Led a four-person team that turned client requirements into an HR conversational-AI chatbot built on Kore.ai.",
      "Proposed generative-AI synthetic training data, which was adopted to improve the chatbot's free-form conversation.",
    ],
  },
];

export const education = [
  {
    school: "University of Southern California, Marshall School of Business",
    degree: "Master of Business Administration",
    period: "Expected May 2028",
    detail: "High-Tech Association · Competitive Strategy · Organizational Behavior and Leadership",
  },
  {
    school: "Birla Institute of Technology & Science, Pilani — Dubai",
    degree: "Bachelor of Engineering (Hons.), Computer Science",
    period: "2022",
    detail: null,
  },
] as const;

export const publication = {
  title: "Implementing Natural Language Generation Through Industry-Specific Chatbots",
  venue: "SCRS, 2023",
  note: "Co-author. Built a GPT-2 medical-query chatbot trained on about 45,000 conversational exchanges.",
};

export const skills = [
  {
    label: "Product & strategy",
    items: ["AI product strategy", "Competitive strategy", "Market-entry analysis", "Financial modeling", "Experimentation"],
  },
  {
    label: "Technical & AI",
    items: ["Python", "SQL", "PostgreSQL", "FastAPI", "Docker", "OpenAI API", "AWS Bedrock", "NLP"],
  },
  {
    label: "Agentic tools",
    items: ["Claude Code", "Codex", "Cursor", "OpenClaw"],
  },
] as const;

export const languages = ["English", "Hindi", "Punjabi"] as const;
export const interests = ["Weightlifting", "Film criticism", "Hip-hop"] as const;
