export const service = "CRM & ERP Solutions";
export const openingMessage =
  "Hi! Let’s streamline your operations with the right CRM/ERP setup. What’s your name?";

export const serviceDetails = `Sub-types: CRM Setup, ERP Customization, Workflow Automation
Deliverables: System configuration, training & documentation, integrations
Pricing: CRM ₹50,000–₹2,00,000 | ERP ₹2,00,000–₹10,00,000+
Timelines: Full setup 4–10 weeks | Partial scope: CRM setup only 2–3 weeks (₹50,000–₹1,50,000), Automation only 2–4 weeks (₹40,000–₹2,00,000)
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
    key: "solution_type",
    patterns: ["crm", "erp", "automation", "workflow"],
    templates: ["What do you need help with?"],
    suggestions: ["CRM Setup", "ERP Customization", "Workflow Automation", "Not sure yet"],
  },
  {
    key: "modules",
    patterns: ["modules", "features", "pipeline", "inventory", "billing"],
    templates: ["Which modules/features are needed? (Select all that apply)"],
    suggestions: [
      "Sales pipeline",
      "Leads",
      "Customer support",
      "Inventory/Stock",
      "Invoicing/Billing",
      "Reports/Analytics",
      "User roles/permissions",
      "Other",
    ],
    multiSelect: true,
  },
  {
    key: "integrations",
    patterns: ["integrations", "integrate", "api", "tools"],
    templates: ["Any integrations required? (Select all that apply)"],
    suggestions: ["Email", "WhatsApp", "Payment gateway", "Google Sheets", "Other", "None"],
    multiSelect: true,
  },
  {
    key: "users",
    patterns: ["users", "team", "logins", "seats"],
    templates: ["How many users will use the system?"],
    suggestions: ["1–5", "6–20", "21–50", "50+"],
  },
  {
    key: "budget",
    patterns: ["budget", "cost", "price"],
    templates: ["What’s your budget range for this project?"],
    suggestions: ["₹50,000–₹2,00,000", "₹2,00,000–₹5,00,000", "₹5,00,000+", "Not sure yet"],
  },
  {
    key: "timeline",
    patterns: ["timeline", "deadline", "when"],
    templates: ["When do you need this delivered?"],
    suggestions: ["2–3 weeks", "4–10 weeks", "Flexible"],
  },
];

const chatbot = { service, openingMessage, questions, serviceDetails };
export default chatbot;

