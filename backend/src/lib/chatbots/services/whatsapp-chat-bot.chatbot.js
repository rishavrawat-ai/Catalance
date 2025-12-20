export const service = "WhatsApp Chat Bot";
export const openingMessage =
  "Hi! Let’s build a WhatsApp bot for your business. What’s your name?";

export const serviceDetails = `Sub-types: Lead Capture Bot, Sales Bot, Support Bot
Deliverables: Bot flow design, API integration, dashboard access
Pricing: Setup ₹15,000–₹50,000 | Monthly ₹3,000–₹15,000 (API extra)
Timelines: Full bot setup 7–14 days | Partial scope: Bot flow design only 3–5 days (₹5,000–₹15,000), API integration only 5–7 days (₹8,000–₹25,000)
Timeline policy: timelines are in working days; 10–20% buffer included; delays due to missing client inputs pause the timeline.`;

export const questions = [
  {
    key: "name",
    patterns: ["name", "call you"],
    templates: ["What’s your name?"],
    suggestions: null,
  },
  {
    key: "business",
    patterns: ["business", "company", "brand"],
    templates: ["Nice to meet you, {name}! What’s your business/brand name?"],
    suggestions: null,
  },
  {
    key: "bot_type",
    patterns: ["lead", "sales", "support", "bot type"],
    templates: ["What type of WhatsApp bot do you need?"],
    suggestions: ["Lead Capture Bot", "Sales Bot", "Support Bot"],
  },
  {
    key: "features",
    patterns: ["features", "flow", "faq", "handoff", "tracking"],
    templates: ["What should the bot handle? (Select all that apply)"],
    suggestions: [
      "Lead capture",
      "FAQs",
      "Product/service info",
      "Order updates",
      "Order tracking",
      "Human handoff to agent",
      "Broadcast messages",
      "Other",
    ],
    multiSelect: true,
  },
  {
    key: "integrations",
    patterns: ["integrations", "api", "crm", "dashboard"],
    templates: ["Any integrations required? (Select all that apply)"],
    suggestions: ["CRM", "Google Sheets", "Shopify", "Payment links", "Other", "None"],
    multiSelect: true,
  },
  {
    key: "budget",
    patterns: ["budget", "cost", "price"],
    templates: ["What’s your budget for setup (and monthly, if needed)?"],
    suggestions: ["Setup ₹15,000–₹50,000", "Setup ₹50,000+", "Not sure yet"],
  },
  {
    key: "timeline",
    patterns: ["timeline", "when", "deadline"],
    templates: ["When do you want the bot ready?"],
    suggestions: ["7–14 days", "2–4 weeks", "Flexible"],
  },
];

const chatbot = { service, openingMessage, questions, serviceDetails };
export default chatbot;

