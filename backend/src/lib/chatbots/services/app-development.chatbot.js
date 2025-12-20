export const service = "App Development";
export const openingMessage =
  "Hey! 📱 Ready to build your app? Tell me what you have in mind!";

export const serviceDetails = `Sub-types: Android App, iOS App, Cross-platform (Flutter / React Native), App Maintenance
Deliverables: UI screens & user flow, frontend + backend development, API integration, testing & deployment, App Store / Play Store submission
Pricing: MVP App ₹2,00,000–₹4,00,000 | Advanced App ₹5,00,000–₹12,00,000 | Maintenance ₹15,000–₹40,000/month
Timelines: Full project 8–14 weeks (buffer included) | Partial scope: UI Design 2–3 weeks (₹40,000–₹1,00,000), Backend 4–6 weeks (₹1,00,000–₹3,00,000), Feature enhancement 1–3 weeks (₹30,000–₹1,50,000)
Timeline policy: timelines are in working days; 10–20% buffer included; delays due to missing client inputs pause the timeline.`;

export const questions = [
  {
    key: "name",
    patterns: ["name", "call you"],
    templates: ["What’s your name?"],
    suggestions: null,
  },
  {
    key: "project_name",
    patterns: ["app name", "project", "company", "brand"],
    templates: ["Nice to meet you, {name}! What’s the app/project name?"],
    suggestions: null,
  },
  {
    key: "platform",
    patterns: ["android", "ios", "flutter", "react native", "cross-platform"],
    templates: ["Which platforms do you want to support?"],
    suggestions: [
      "Android",
      "iOS",
      "Android + iOS (Cross-platform)",
      "Not sure yet",
    ],
  },
  {
    key: "description",
    patterns: ["idea", "build", "app", "mvp"],
    templates: [
      "In 1 sentence, what should the app do? (Who is it for + main goal)",
    ],
    suggestions: null,
  },
  {
    key: "core_features",
    patterns: ["features", "functionality", "modules"],
    templates: ["List the top 3–6 must-have features (bullets are fine)."],
    suggestions: null,
  },
  {
    key: "design_assets",
    patterns: ["design", "ui", "figma", "screens"],
    templates: ["Do you already have UI designs (Figma) or need UI/UX help?"],
    suggestions: [
      "Yes, I have designs",
      "Need UI/UX design",
      "Have some references",
      "Not sure yet",
    ],
  },
  {
    key: "backend",
    patterns: ["backend", "admin", "api", "database"],
    templates: ["Do you need a backend/admin panel as well?"],
    suggestions: ["Yes", "No / app only", "Not sure yet"],
  },
  {
    key: "integrations",
    patterns: ["payment", "notifications", "maps", "login", "analytics"],
    templates: ["Any key integrations? (Select all that apply)"],
    suggestions: [
      "Payments",
      "Push Notifications",
      "Maps",
      "Social Login",
      "Chat",
      "Analytics",
      "Other",
      "None",
    ],
    multiSelect: true,
  },
  {
    key: "budget",
    patterns: ["budget", "cost", "price"],
    templates: ["What’s your budget range?"],
    suggestions: ["₹2,00,000–₹4,00,000 (MVP)", "₹5,00,000–₹12,00,000", "Flexible"],
  },
  {
    key: "timeline",
    patterns: ["timeline", "deadline", "when"],
    templates: ["When do you want the first version ready?"],
    suggestions: ["4–6 weeks", "8–14 weeks", "Flexible"],
  },
];

const chatbot = { service, openingMessage, questions, serviceDetails };
export default chatbot;
