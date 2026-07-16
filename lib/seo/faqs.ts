export type FaqItem = { question: string; answer: string };

export const FAQS: FaqItem[] = [
  {
    question: "What is LexRam?",
    answer:
      "LexRam is an AI-powered legal platform built for Indian advocates. It does statute-first legal research on the Supreme Court corpus and drafts bail applications, writ petitions, notices and other court papers with verified citations.",
  },
  {
    question: "Who can use LexRam?",
    answer:
      "LexRam is for licensed legal professionals in India — advocates enrolled with a State Bar Council, law firms, in-house corporate legal teams, and legal academics.",
  },
  {
    question: "Is my data secure with LexRam?",
    answer:
      "Yes. Documents are encrypted in transit and at rest. We never train our models on your data without explicit consent and we comply with applicable data-protection regulations.",
  },
  {
    question: "Does LexRam provide legal advice?",
    answer:
      "No. LexRam is an assistant for legal professionals. All outputs are drafts and research aids that must be reviewed by a qualified advocate before use.",
  },
  {
    question: "What areas of law does LexRam cover?",
    answer:
      "Every area of Indian law: Constitutional, Criminal (BNS / BNSS / BSA), Civil, Corporate, Family, Property, Tax, Labour, IPR and more — across every level of court from Magistrate to the Supreme Court.",
  },
  {
    question: "Can I try LexRam before subscribing?",
    answer:
      "Yes. We offer a free trial so you can run real research queries and generate a draft before you pay anything.",
  },
  {
    question: "How do I get started?",
    answer:
      "Click Start free, verify your phone with a 6-digit OTP, and you can begin researching immediately.",
  },
  {
    question: "What support options are available?",
    answer:
      "Email support@lexram.ai, in-app chat, and priority phone support for paid plans.",
  },
];

export const FAQS_FINANCE: FaqItem[] = [
  {
    question: "How does pricing work?",
    answer:
      "You buy credits and consume them as you use Research, Drafting, and the AI Assistant. No subscription lock-in.",
  },
  {
    question: "Do credits expire?",
    answer:
      "Credits do not expire while your account is active.",
  },
  {
    question: "What payment methods are supported?",
    answer:
      "UPI, net-banking, credit and debit cards via Cashfree.",
  },
  {
    question: "Can I get a refund?",
    answer:
      "Yes — see our Refund Policy. Unused credits are refundable within 7 days of purchase.",
  },
];
