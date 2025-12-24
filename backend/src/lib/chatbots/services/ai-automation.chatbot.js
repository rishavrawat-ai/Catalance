export const service = "AI Automation";
export const openingMessage =
  "Hi! Let's automate your workflows with AI. Tell me what you want to automate.";

export const serviceDetails = `Sub-types: AI Chatbots, Workflow Automation, Lead Scoring
Deliverables: Automation logic, tool integrations, testing & deployment
Pricing: Basic â‚¹30,000â€“â‚¹80,000 | Advanced â‚¹1,50,000â€“â‚¹5,00,000
Timelines: Full automation system 3â€“6 weeks | Partial scope: Single workflow automation 7â€“10 days (â‚¹25,000â€“â‚¹60,000), AI bot logic only 10â€“15 days (â‚¹40,000â€“â‚¹1,00,000)
Timeline policy: timelines are in working days; 10â€“20% buffer included; delays due to missing client inputs pause the timeline.`;

export const questions = [
  {
    id: "Q1",
    nextId: "Q2",
    key: "automation_process",
    answerType: "text",
    patterns: ["process", "automate", "workflow"],
    templates: ["What process do you want to automate?"],
    suggestions: null,
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
    key: "integrations",
    answerType: "text",
    patterns: ["tools", "platforms", "integrations"],
    templates: ["Which tools or platforms should integrate?"],
    suggestions: null,
  },
  {
    id: "Q4",
    nextId: "Q5",
    key: "automation_type",
    answerType: "single_select",
    patterns: ["one-time", "ongoing", "workflows"],
    templates: ["Is this one-time automation or ongoing workflows?"],
    suggestions: ["One-time automation", "Ongoing workflows"],
  },
  {
    id: "Q5",
    nextId: "Q6",
    key: "complexity",
    answerType: "single_select",
    patterns: ["complexity", "basic", "advanced"],
    templates: ["What is the complexity level?"],
    suggestions: ["Basic", "Advanced"],
  },
  {
    id: "Q6",
    nextId: "Q7",
    key: "timeline",
    answerType: "text",
    patterns: ["timeline", "deadline"],
    templates: ["What is your timeline?"],
    suggestions: null,
  },
  {
    id: "Q7",
    nextId: null,
    key: "budget",
    answerType: "text",
    patterns: ["budget", "range", "cost"],
    templates: ["What is your budget range?"],
    suggestions: null,
  },
];

const chatbot = { service, openingMessage, questions, serviceDetails };
export default chatbot;



