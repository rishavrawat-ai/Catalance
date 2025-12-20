export const service = "AI Automation";
export const openingMessage =
  "Hi! Let’s automate your workflows with AI. What’s your name?";

export const serviceDetails = `Sub-types: AI Chatbots, Workflow Automation, Lead Scoring
Deliverables: Automation logic, tool integrations, testing & deployment
Pricing: Basic ₹30,000–₹80,000 | Advanced ₹1,50,000–₹5,00,000
Timelines: Full automation system 3–6 weeks | Partial scope: Single workflow automation 7–10 days (₹25,000–₹60,000), AI bot logic only 10–15 days (₹40,000–₹1,00,000)
Timeline policy: timelines are in working days; 10–20% buffer included; delays due to missing client inputs pause the timeline.`;

export const questions = [
  {
    key: "name",
    patterns: ["name", "call you"],
    templates: ["What’s your name?"],
    suggestions: null,
  },
  {
    key: "company",
    patterns: ["company", "business", "brand"],
    templates: ["Nice to meet you, {name}! What’s your company name?"],
    suggestions: null,
  },
  {
    key: "automation_type",
    patterns: ["chatbot", "automation", "lead scoring", "ai"],
    templates: ["What type of AI automation do you need?"],
    suggestions: ["AI Chatbots", "Workflow Automation", "Lead Scoring", "Not sure yet"],
  },
  {
    key: "use_case",
    patterns: ["use case", "workflow", "process", "automate"],
    templates: ["Briefly describe what you want to automate (1–2 sentences)."],
    suggestions: null,
  },
  {
    key: "integrations",
    patterns: ["integrations", "tools", "apps", "api"],
    templates: ["Which tools should it connect with? (Select all that apply)"],
    suggestions: ["WhatsApp", "Email", "CRM", "Google Sheets", "Slack", "Other", "None"],
    multiSelect: true,
  },
  {
    key: "budget",
    patterns: ["budget", "cost", "price"],
    templates: ["What’s your budget range?"],
    suggestions: ["₹30,000–₹80,000", "₹1,50,000–₹5,00,000", "Not sure yet"],
  },
  {
    key: "timeline",
    patterns: ["timeline", "deadline", "when"],
    templates: ["When do you want this delivered?"],
    suggestions: ["7–10 days", "3–6 weeks", "Flexible"],
  },
];

const chatbot = { service, openingMessage, questions, serviceDetails };
export default chatbot;

