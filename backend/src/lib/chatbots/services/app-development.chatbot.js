export const service = "App Development";
export const openingMessage =
  "Hey! ðŸ“± Ready to build your app? Tell me what you have in mind!";

export const serviceDetails = `Sub-types: Android App, iOS App, Cross-platform (Flutter / React Native), App Maintenance
Deliverables: UI screens & user flow, frontend + backend development, API integration, testing & deployment, App Store / Play Store submission
Pricing: MVP App â‚¹2,00,000â€“â‚¹4,00,000 | Advanced App â‚¹5,00,000â€“â‚¹12,00,000 | Maintenance â‚¹15,000â€“â‚¹40,000/month
Timelines: Full project 8â€“14 weeks (buffer included) | Partial scope: UI Design 2â€“3 weeks (â‚¹40,000â€“â‚¹1,00,000), Backend 4â€“6 weeks (â‚¹1,00,000â€“â‚¹3,00,000), Feature enhancement 1â€“3 weeks (â‚¹30,000â€“â‚¹1,50,000)
Timeline policy: timelines are in working days; 10â€“20% buffer included; delays due to missing client inputs pause the timeline.`;

export const questions = [
  {
    id: "Q1",
    nextId: "Q2",
    key: "platform",
    answerType: "single_select",
    patterns: ["app type", "platform", "android", "ios", "both"],
    templates: ["What type of app do you want to build?"],
    suggestions: ["Android", "iOS", "Both (Android + iOS)"],
  },
  {
    id: "Q2",
    nextId: "Q3",
    key: "brief",
    answerType: "text",
    patterns: ["brief", "summary", "overview", "requirements"],
    templates: ["Please share a short brief of what you need (2-3 lines)."],
    suggestions: null,
  },
  {
    id: "Q3",
    nextId: "Q4",
    key: "project_stage",
    answerType: "single_select",
    patterns: ["new app", "upgrade", "existing"],
    templates: ["Is this a new app or an upgrade to an existing one?"],
    suggestions: ["New app", "Upgrade existing app"],
  },
  {
    id: "Q4",
    nextId: "Q5",
    key: "design_assets",
    answerType: "single_select",
    patterns: ["wireframes", "designs", "figma"],
    templates: ["Do you have wireframes or designs ready?"],
    suggestions: ["Yes", "No", "In progress"],
  },
  {
    id: "Q5",
    nextId: "Q6",
    key: "core_features",
    answerType: "multi_select",
    patterns: ["features", "login", "payments", "chat"],
    templates: ["What core features do you need?"],
    suggestions: [
      "Login/Auth",
      "Payments",
      "Chat/Messaging",
      "Push Notifications",
      "Maps/Location",
      "User Profiles",
      "Other",
    ],
    multiSelect: true,
  },
  {
    id: "Q6",
    nextId: "Q7",
    key: "backend",
    answerType: "single_select",
    patterns: ["admin panel", "backend", "api"],
    templates: ["Do you need admin panel and backend?"],
    suggestions: ["Yes", "No", "Not sure"],
  },
  {
    id: "Q7",
    nextId: "Q8",
    key: "integrations",
    answerType: "multi_select",
    patterns: ["integrations", "payment", "maps", "notifications"],
    templates: ["Do you need API integrations?"],
    suggestions: [
      "Payments",
      "Maps",
      "Notifications",
      "Social Login",
      "Analytics",
      "Other",
      "None",
    ],
    multiSelect: true,
  },
  {
    id: "Q8",
    nextId: "Q9",
    key: "timeline",
    answerType: "text",
    patterns: ["timeline", "deadline", "when"],
    templates: ["What is your preferred timeline?"],
    suggestions: null,
  },
  {
    id: "Q9",
    nextId: "Q10",
    key: "scope",
    answerType: "single_select",
    patterns: ["full app", "partial", "design only", "backend only"],
    templates: [
      "Is this a full app or partial work (design, backend, or features only)?",
    ],
    suggestions: ["Full app", "Design only", "Backend only", "Features only"],
  },
  {
    id: "Q10",
    nextId: null,
    key: "budget",
    answerType: "text",
    patterns: ["budget", "range", "cost"],
    templates: ["What is your estimated budget range?"],
    suggestions: null,
  },
];

const chatbot = { service, openingMessage, questions, serviceDetails };
export default chatbot;

