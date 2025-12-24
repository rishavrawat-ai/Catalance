import OpenAI from "openai";
import { env } from "../config/env.js";
import fs from "fs";
import path from "path";
import {
  DEFAULT_QUESTIONS,
  SERVICE_QUESTION_SETS,
} from "../constants/serviceQuestions.js";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../utils/async-handler.js";
import { AppError } from "../utils/app-error.js";
import {
  ensureConversation,
  createConversation as createInMemoryConversation,
  getConversation,
  listMessages,
  addMessage,
} from "../lib/chat-store.js";
import { sendNotificationToUser } from "../lib/notification-util.js";
import {
  buildConversationState,
  processUserAnswer,
  getNextHumanizedQuestion,
  shouldGenerateProposal,
  generateProposalFromState,
  generateRoadmapFromState,
} from "../lib/conversation-state.js";
import { getChatbot } from "../lib/chatbots/index.js";
import { translateAssistantReply } from "../lib/i18n.js";


const MIN_WEBSITE_PRICE = 10000;
const MIN_WEBSITE_PRICE_DISPLAY = "INR 10,000";
const MAX_COMPLETION_TOKENS = 900;
const i18nModel = env.OPENROUTER_MODEL || "openai/gpt-4o";
const i18nTranslateFallbackModel = env.OPENROUTER_MODEL_FALLBACK || "meta-llama/llama-3.2-3b-instruct:free";
// Stack-specific minimum viable budgets (in INR) to steer users toward realistic options.
const STACK_BUDGET_FLOORS = {
  "React/Next.js": 60000,
  "Node.js": 60000,
  Laravel: 40000,
  WordPress: 15000,
  "Web Application/SaaS": 75000,
  "E-Commerce Platform": 75000,
};

// Project-specific minimum timelines and pricing
const PROJECT_REQUIREMENTS = {
  "Landing Page": {
    minDays: 7,
    displayTime: "1 week",
    minBudget: 10000,
    displayBudget: "₹10,000",
    alternatives: []
  },
  "WordPress": {
    minDays: 15,
    displayTime: "15-20 days",
    minBudget: 20000,
    displayBudget: "₹20,000",
    alternatives: ["Landing Page (₹10,000, 1 week)"]
  },
  "Shopify": {
    minDays: 15,
    displayTime: "15-20 days",
    minBudget: 30000,
    displayBudget: "₹30,000",
    alternatives: ["WordPress (₹20,000, 15-20 days)", "Landing Page (₹10,000, 1 week)"]
  },
  "3D WordPress": {
    minDays: 20,
    displayTime: "20-25 days",
    minBudget: 45000,
    displayBudget: "₹45,000",
    alternatives: ["WordPress (₹20,000, 15-20 days)", "Shopify (₹30,000, 15-20 days)"]
  },
  "3D Shopify": {
    minDays: 20,
    displayTime: "20-25 days",
    minBudget: 45000,
    displayBudget: "₹45,000",
    alternatives: ["Shopify (₹30,000, 15-20 days)", "WordPress (₹20,000, 15-20 days)"]
  },
  "Webflow": {
    minDays: 20,
    displayTime: "20-28 days",
    minBudget: 80000,
    displayBudget: "₹80,000",
    alternatives: ["WordPress (₹20,000, 15-20 days)", "Shopify (₹30,000, 15-20 days)"]
  },
  "Framer": {
    minDays: 20,
    displayTime: "20-28 days",
    minBudget: 80000,
    displayBudget: "₹80,000",
    alternatives: ["WordPress (₹20,000, 15-20 days)", "Shopify (₹30,000, 15-20 days)"]
  },
  "Custom E-commerce": {
    minDays: 30,
    displayTime: "30-60 days",
    minBudget: 150000,
    displayBudget: "₹1,50,000",
    alternatives: ["Shopify (₹30,000, 15-20 days)", "WordPress + WooCommerce (₹30,000, 20 days)"]
  },
  "E-Commerce Platform": {
    minDays: 30,
    displayTime: "30-60 days",
    minBudget: 75000,
    displayBudget: "₹75,000",
    alternatives: ["Shopify (₹30,000, 15-20 days)", "WordPress + WooCommerce (₹30,000, 20 days)"]
  },
  "App": {
    minDays: 60,
    displayTime: "2 months",
    minBudget: 200000,
    displayBudget: "₹2,00,000",
    alternatives: ["Web App (₹75,000, 45-60 days)", "Landing Page + PWA (₹40,000, 3 weeks)"]
  },
  "Mobile App": {
    minDays: 60,
    displayTime: "2 months",
    minBudget: 200000,
    displayBudget: "₹2,00,000",
    alternatives: ["Web App (₹75,000, 45-60 days)", "Landing Page + PWA (₹40,000, 3 weeks)"]
  },
  "Mobile Application": {
    minDays: 60,
    displayTime: "2 months",
    minBudget: 200000,
    displayBudget: "₹2,00,000",
    alternatives: ["Web App (₹75,000, 45-60 days)", "Landing Page + PWA (₹40,000, 3 weeks)"]
  },
  "Web Application/SaaS": {
    minDays: 45,
    displayTime: "45-60 days",
    minBudget: 75000,
    displayBudget: "₹75,000",
    alternatives: ["WordPress + Plugins (₹35,000, 20 days)", "Landing Page + Forms (₹15,000, 1 week)"]
  },
  "SaaS": {
    minDays: 45,
    displayTime: "45-60 days",
    minBudget: 75000,
    displayBudget: "₹75,000",
    alternatives: ["WordPress + Plugins (₹35,000, 20 days)", "Landing Page + Forms (₹15,000, 1 week)"]
  },
  "Website": {
    minDays: 15,
    displayTime: "15-20 days",
    minBudget: 20000,
    displayBudget: "₹20,000",
    alternatives: ["Landing Page (₹10,000, 1 week)"]
  },
  "React/Next.js": {
    minDays: 30,
    displayTime: "30-45 days",
    minBudget: 60000,
    displayBudget: "₹60,000",
    alternatives: ["WordPress (₹20,000, 15-20 days)", "Webflow (₹80,000, 20-28 days)"]
  },
  "Node.js": {
    minDays: 30,
    displayTime: "30-45 days",
    minBudget: 60000,
    displayBudget: "₹60,000",
    alternatives: ["Laravel (₹40,000, 25-30 days)", "WordPress (₹20,000, 15-20 days)"]
  },
  "Laravel": {
    minDays: 25,
    displayTime: "25-30 days",
    minBudget: 40000,
    displayBudget: "₹40,000",
    alternatives: ["WordPress (₹20,000, 15-20 days)"]
  },
};

const normalizeOrigin = (value = "") => value.trim().replace(/\/$/, "");
const parseOrigins = (value = "") =>
  value.split(",").map(normalizeOrigin).filter(Boolean);

const allowedOrigins = [
  ...parseOrigins(env.CORS_ORIGIN || ""),
  normalizeOrigin(env.LOCAL_CORS_ORIGIN || ""),
  normalizeOrigin(env.VERCEL_CORS_ORIGIN || ""),
].filter(Boolean);

const defaultReferer =
  allowedOrigins[0] ||
  normalizeOrigin(
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : ""
  ) ||
  "http://localhost:5173";

const normalizeService = (service = "") => {
  const safe = (service || "").toString().trim();
  return safe.length ? safe : null;
};



const serializeMessage = (message) => ({
  ...message,
  attachment: message.attachment, // Include attachment
  createdAt:
    message.createdAt instanceof Date
      ? message.createdAt.toISOString()
      : message.createdAt,
});

const toHistoryMessage = (message) => ({
  role: message.role === "assistant" ? "assistant" : "user",
  content: message.content,
});

const getServiceDetails = (service) => {
  const chatbot = getChatbot(service);
  const chatbotDetails = (chatbot?.serviceDetails || chatbot?.details || "").toString().trim();
  if (chatbotDetails) return chatbotDetails;

  const services = {
    "Development & Tech":
      "Websites, mobile apps, SaaS platforms, and e-commerce solutions.",
    "Digital Marketing":
      "SEO, PPC, social media management, and content marketing strategies.",
    "Video Services":
      "Video editing, promotional content, CGI, UGC, and animation.",
    "Creative & Design": "Branding, UI/UX, graphics, and motion design.",
    "Lead Generation":
      "Targeted lists, outreach campaigns, and funnel building.",
    "Writing & Content":
      "SEO blogs, copywriting, technical writing, and scripts.",
    "Customer Support":
      "Multi-channel support, helpdesk setup, and 24/7 options.",
    "Administrative Services":
      "Virtual assistance, data management, and scheduling.",
    "Audio Services": "Voiceover, podcast production, mixing & mastering.",
    "Lifestyle & Personal":
      "Coaching, fitness, personal styling, and wellness.",
  };
  return services[service] || "Custom services based on your requirements.";
};

const needsWebsitePolicy = (service = "") =>
  service.toLowerCase().includes("web");

const getWebsitePolicy = (service) =>
  needsWebsitePolicy(service)
    ? `Website projects policy:
- Hosting and domain must be purchased and owned by the client (Hostinger/domain handled on the client side).
- Minimum website project price: ${MIN_WEBSITE_PRICE_DISPLAY}. If budget is lower, propose a reduced scope or phased delivery.`
    : "";

const formatStackBudgetFloors = () =>
  Object.entries(STACK_BUDGET_FLOORS)
    .map(([stack, amount]) => `${stack}: INR ${amount.toLocaleString("en-IN")}`)
    .join(" | ");

// ============ SMART MESSAGE PARSING ============

// Extract project info from a single comprehensive message
const extractInfoFromMessage = (message) => {
  const text = (message || "").toLowerCase();
  const extracted = {
    budget: null,
    timeline: null,
    techStack: null,
    projectType: null,
    description: message,
    hasEnoughInfo: false
  };

  // Extract budget (e.g., "65K", "₹50,000", "50000", "1 lakh")
  const budgetPatterns = [
    /(\d+)\s*k\b/i,                    // 65K, 65k
    /₹?\s*(\d{1,3}(?:,?\d{3})*)/,     // ₹50,000 or 50000
    /(\d+)\s*lakh/i,                   // 1 lakh
    /budget\s*(?:is|of|:)?\s*(\d+)/i   // budget is 65
  ];

  for (const pattern of budgetPatterns) {
    const match = text.match(pattern);
    if (match) {
      let amount = parseInt(match[1].replace(/,/g, ""));
      if (text.includes("lakh")) amount *= 100000;
      else if (/\d+\s*k\b/i.test(text)) amount *= 1000;
      extracted.budget = `₹${amount.toLocaleString("en-IN")}`;
      break;
    }
  }

  // Extract timeline (e.g., "2 months", "6 weeks", "3 weeks")
  const timelineMatch = text.match(/(\d+)\s*(month|week|day)s?/i);
  if (timelineMatch) {
    extracted.timeline = `${timelineMatch[1]} ${timelineMatch[2]}${parseInt(timelineMatch[1]) > 1 ? 's' : ''}`;
  }

  // Extract tech stack
  const techKeywords = {
    "react": "React/Next.js",
    "next.js": "React/Next.js",
    "nextjs": "React/Next.js",
    "node": "Node.js",
    "express": "Node.js",
    "laravel": "Laravel/PHP",
    "php": "Laravel/PHP",
    "wordpress": "WordPress",
    "python": "Python/Django",
    "django": "Python/Django"
  };

  for (const [keyword, stack] of Object.entries(techKeywords)) {
    if (text.includes(keyword)) {
      extracted.techStack = stack;
      break;
    }
  }

  // Extract project type
  const projectTypes = {
    "e-commerce": "E-Commerce",
    "ecommerce": "E-Commerce",
    "online store": "E-Commerce",
    "shop": "E-Commerce",
    "saas": "SaaS/Web App",
    "dashboard": "SaaS/Web App",
    "app": "SaaS/Web App",
    "website": "Website",
    "landing page": "Website",
    "portfolio": "Website",
    "mobile": "Mobile App"
  };

  for (const [keyword, type] of Object.entries(projectTypes)) {
    if (text.includes(keyword)) {
      extracted.projectType = type;
      break;
    }
  }

  // Check if we have enough info to generate proposal
  // Need at least: project description + (budget OR timeline)
  const hasProjectContext = text.length > 30; // Reasonably detailed message
  const hasBudgetOrTimeline = extracted.budget || extracted.timeline;
  extracted.hasEnoughInfo = hasProjectContext && hasBudgetOrTimeline;

  return extracted;
};

// Get default features based on project type - these are auto-included
const getDefaultFeatures = (projectType) => {
  const common = ["Responsive Design", "SEO Basics"];

  const byType = {
    "E-Commerce": [...common, "User Authentication", "Payment Gateway (Stripe/PayPal)", "Shopping Cart", "Checkout Flow", "Order Management", "Product Catalog"],
    "SaaS/Web App": [...common, "User Authentication", "Dashboard", "User Management", "Data Analytics"],
    "Website": [...common, "Contact Form", "Mobile Optimization"],
    "Mobile App": ["User Authentication", "Push Notifications", "Offline Support"],
  };

  return byType[projectType] || common;
};

// Generate proposal directly from extracted info
const generateDirectProposal = (info, service) => {
  const defaultFeatures = getDefaultFeatures(info.projectType);

  // Get pricing from PROJECT_REQUIREMENTS
  const projectReq = PROJECT_REQUIREMENTS[info.projectType] ||
    PROJECT_REQUIREMENTS[info.techStack] ||
    PROJECT_REQUIREMENTS["Website"];
  const estimatedPrice = projectReq?.displayBudget || "To be discussed";
  const estimatedTimeline = projectReq?.displayTime || info.timeline || "To be discussed";

  return `[PROPOSAL_DATA]
PROJECT PROPOSAL

Project Type: ${info.projectType || service || "Custom Project"}
Tech Stack: ${info.techStack || "To be determined based on requirements"}

Summary:
${info.description}

Features Included:
${defaultFeatures.map(f => `- ${f}`).join("\n")}

Estimated Price: ${estimatedPrice}
Timeline: ${estimatedTimeline}
Client Budget: ${info.budget || "To be discussed"}

Scope of Work:
Phase 1: Discovery & Planning - Requirements gathering and technical architecture
Phase 2: UI/UX Design - Wireframing, mockups, and design review  
Phase 3: Development - Core functionality and integrations
Phase 4: Testing & Launch - QA and deployment

Next Steps:
1. Confirm scope and pricing
2. Sign agreement and pay 50% deposit
3. Kickoff meeting to begin work

To customize this proposal, please use the Edit Proposal option.
[/PROPOSAL_DATA]`;
};

// ============ END SMART MESSAGE PARSING ============

// Ensure proposals always include the closing tag so the UI can parse them,
// even if the model truncates the response.
const normalizeProposalTags = (content = "") => {
  if (
    !content.includes("[PROPOSAL_DATA]") ||
    content.includes("[/PROPOSAL_DATA]")
  ) {
    return content;
  }
  return `${content.trim()}\n[/PROPOSAL_DATA]`;
};

// Clean AI response to remove any internal reasoning and duplicate questions
const cleanAIResponse = (content = "") => {
  if (!content) return content;

  // Check if this is a proposal (don't clean proposals)
  if (content.includes("[PROPOSAL_DATA]")) {
    return content;
  }

  // Patterns that indicate internal reasoning/thinking
  const reasoningPatterns = [
    /We should[^.?!]*[.?!]?\s*/gi,
    /We need to[^.?!]*[.?!]?\s*/gi,
    /We have[^.?!]*[.?!]?\s*/gi,
    /We haven't[^.?!]*[.?!]?\s*/gi,
    /We are[^.?!]*[.?!]?\s*/gi,
    /We might[^.?!]*[.?!]?\s*/gi,
    /Let's[^.?!]*[.?!]?\s*/gi,
    /Good\.?\s*/gi,
    /However[^.?!]*[.?!]?\s*/gi,
    /But we[^.?!]*[.?!]?\s*/gi,
    /The next in order[^.?!]*[.?!]?\s*/gi,
    /The user hasn't[^.?!]*[.?!]?\s*/gi,
    /I should[^.?!]*[.?!]?\s*/gi,
    /I need to[^.?!]*[.?!]?\s*/gi,
    /Now[^.?!]*ask[^.?!]*[.?!]?\s*/gi,
    /Moving on[^.?!]*[.?!]?\s*/gi,
    /Next[^.?!]*[.?!]?\s*/gi,
    /Great[^.?!]*[.?!]?\s*/gi,
    /Thanks[^.?!]*[.?!]?\s*/gi,
    /Thank you[^.?!]*[.?!]?\s*/gi,
    /Perfect[^.?!]*[.?!]?\s*/gi,
    /Okay[^.?!]*[.?!]?\s*/gi,
    /Alright[^.?!]*[.?!]?\s*/gi,
    /Got it[^.?!]*[.?!]?\s*/gi,
    /Understood[^.?!]*[.?!]?\s*/gi,
  ];

  let cleaned = content;

  // Remove reasoning patterns
  for (const pattern of reasoningPatterns) {
    cleaned = cleaned.replace(pattern, "");
  }

  // Extract suggestion tags first (we'll add them back)
  const suggestionMatch = cleaned.match(/\[SUGGESTIONS:\s*[^\]]+\]/i);
  const multiSelectMatch = cleaned.match(/\[MULTI_SELECT:\s*[^\]]+\]/i);
  const suggestions = suggestionMatch ? suggestionMatch[0] : "";
  const multiSelect = multiSelectMatch ? multiSelectMatch[0] : "";

  // Remove suggestion tags temporarily
  cleaned = cleaned.replace(/\[SUGGESTIONS:\s*[^\]]+\]/gi, "").replace(/\[MULTI_SELECT:\s*[^\]]+\]/gi, "");

  // Find all questions (sentences ending with ?)
  const questionRegex = /[^.?!]*\?/g;
  const allQuestions = cleaned.match(questionRegex) || [];

  // Get unique questions only
  const seenQuestions = new Set();
  const uniqueQuestions = [];

  for (const q of allQuestions) {
    const trimmed = q.trim();
    const normalized = trimmed.toLowerCase();
    if (trimmed && !seenQuestions.has(normalized)) {
      seenQuestions.add(normalized);
      uniqueQuestions.push(trimmed);
    }
  }

  // Take only the FIRST unique question (we want one question at a time)
  let result = "";
  if (uniqueQuestions.length > 0) {
    result = uniqueQuestions[0];
  } else {
    // No questions found, look for any non-empty sentence
    const sentences = cleaned.split(/[.!]/).filter(s => s.trim());
    if (sentences.length > 0) {
      result = sentences[0].trim();
    }
  }

  // Add back the suggestion/multiselect if present
  if (multiSelect) {
    result = result + "\n" + multiSelect;
  } else if (suggestions) {
    result = result + "\n" + suggestions;
  }

  // Clean up whitespace
  result = result.replace(/\n{3,}/g, "\n\n").trim();

  // If response is empty or just whitespace after cleaning, return empty
  // The frontend will handle showing nothing
  if (!result.trim()) {
    return "";
  }

  return result;
};

const stripEmojis = (value = "") => {
  const text = (value || "").toString();
  return text
    .replace(/[\p{Extended_Pictographic}]/gu, "")
    .replace(/[\uFE0F\uFE0E]/g, "")
    .replace(/[\u200D]/g, "")
    .replace(/[\u{1F3FB}-\u{1F3FF}]/gu, "");
};

const getCounterQuestion = () => `Counter question (ask first):
- Ask: "To get started, please share 1) a brief project summary, 2) must-have features, 3) expected timeline."
- Offer suggestions:
  - Landing page + lead form; timeline 2-4 weeks
  - Business site (4-6 pages) + contact; timeline 1 month
  - E-commerce (catalog + checkout); timeline 1-2 months
  - Custom: I'll describe my needs`;

const devTechFlow = `Conversation format (Development & Tech):
- No intros or preamble. Output only the next question (or brief confirmation + next question).
- Ask one question at a time in this order and keep answers short:
  1) Could you please provide your first name?
  2) What is the name of your company or project?
  3) Where are you located? (options: North America, Europe, Asia, Remote/Global, Other)
  4) What specific type of development service do you require? (options: Website, Web Application/SaaS, Mobile Application, E-Commerce Platform, Custom Software)
  5) Is this a new project or an existing one that requires updates? (options: New Project, Existing (Update), Existing (Rewrite), Consultation)
  6) Please provide a brief summary of the project (what it does, target audience, 2-3 sentences).
  7) What are the essential features or pages required? Tailor this to their project type (e-commerce: product catalog/cart/checkout; SaaS: auth/dashboard; 3D site: 3D models/interactions). Output options as [MULTI_SELECT: ...] with only relevant items.
  8) Do you have existing designs, wireframes, or concepts ready? (options: Yes (Full Designs), Partial Designs, Wireframes Only, No (I need design services))
  9) Would you like us to handle the UI/UX design? (options: Yes (Full Design), UI Polish Only, No (I have designs))
  10) Do you have a preferred technology stack or platform? (Output options as [MULTI_SELECT: React/Next.js | Node.js | PHP/Laravel | WordPress | Python/Django | No Preference])
  11) Do you require any specific integrations? (Output options as [MULTI_SELECT: Stripe/PayPal | Google Maps | Social Login | CRM | Analytics | None])
  12) Will you require ongoing maintenance or support after the launch? (options: Yes (Monthly), Yes (Ad-hoc), No (Handover only))
  13) What is your estimated budget? Ask for one INR amount. (Note to AI: When generating the final proposal, you MUST convert values like "60k" or "1 lakh" into full numbers like "60000" or "100000" without "k" or "lakh"). If their budget is below what their chosen stack typically needs, suggest a cheaper stack or phased approach with a one-line reason before moving on.
 14) What is your target go-live date or timeframe? Keep it simple and plain text (e.g., "by May 30" or "within 6 weeks"). (options: 2-4 weeks, 1-2 months, 2-3 months, Flexible)
  15) Do you require SEO, analytics, or marketing tools? (Output options as [MULTI_SELECT: Basic SEO | Full Marketing | Analytics Setup | None])
  16) Are there any AI features, chatbots, or automation requirements? (Output options as [MULTI_SELECT: AI Chatbot | Content Gen | Data Analysis | None])
  17) Do you have any special requests or constraints? (options: NDA Required, Fast Turnaround, Specific Timezone, None)
  18) Please provide links to previous projects, repositories, or references (optional). (options: I have links, No references)
- Be concise (1-2 sentences), respond promptly, and proceed to the next question.
- Do NOT loop or restart; once key items (summary, features/pages, stack/platform, budget, timeline) are answered, move to proposal generation.`;

const proposalTemplate = `When you have enough answers, generate a proposal in this exact structure. If any field or section is missing info, omit that line/section entirely (do NOT write placeholders like "Not provided" or leave bracket tokens like [Portfolio]). If there are no portfolio links or special requests, drop those sections. IMPORTANT: For "Budget", convert any short forms like "60k" to "60000" and "1.5L" to "150000". Do NOT use "k" or "lakh" in the [Budget] field.
[PROPOSAL_DATA]
PROJECT PROPOSAL
Project Title: [Service]
Prepared for: [Name] - [Company/Project]
Selected Tech Stack: [Tech Stack]
Recommended Package & Estimate: [Recommended Package & Estimate]

Executive Summary
[Name] has requested [Service] services. Target delivery: [Timeline]. Budget: [Budget].

Scope of Work
Phase 1: Discovery & Planning - Requirements gathering, defining core features, and technical architecture setup. (Tech Stack: [Tech Stack])
Phase 2: UI/UX Design - Wireframing, mockup creation, and client review to finalize the user experience.
Phase 3: Development & Integration - Building the core software/website functionality (e.g., [Service Type]) and integrating necessary APIs.
Phase 4: Testing & Deployment - Comprehensive QA across target devices and final launch.

Features & Services Included
[List specific features and services discussed, e.g., User Auth, Dashboard, specific pages, etc.]

Deliverables
Website Development Functional Beta/Staging link for review.
Final, clean, and commented Source Code Repository.
Technical documentation & deployment guide.

Timeline
[Timeline]

Budget & Estimate
Based on the provided budget ([Budget]), we'll prepare a detailed package and recommend the best options that fit this range.

Portfolio & Relevant Experience
Client-provided portfolio / references:
[Portfolio]

Special Requests / Notes
[Special Requests]

Next Steps
Confirm package & scope.
Sign proposal & pay deposit (deposit amount depends on chosen package).
Kickoff meeting to gather assets & finalize schedule.
Generated from questionnaire answers - edit if you'd like to add more specifics before saving.
[/PROPOSAL_DATA]`;

const getQuestionsForService = (service = "") =>
  SERVICE_QUESTION_SETS[service] || DEFAULT_QUESTIONS;

const getInstructions = (service = "") => {
  try {
    // Try service-specific instructions first
    if (service) {
      // Convert service name to filename slug (e.g., "Video Services" -> "video-services")
      const serviceSlug = service.toLowerCase()
        .replace(/&/g, '-')
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
      const servicePath = path.join(process.cwd(), "src", "data", "services", `${serviceSlug}.md`);
      if (fs.existsSync(servicePath)) {
        console.log(`Loading service-specific instructions for: ${service} from ${servicePath}`);
        return fs.readFileSync(servicePath, "utf-8");
      }
    }
    // Fallback to general instructions
    const filePath = path.join(process.cwd(), "src", "data", "instructions.md");
    return fs.readFileSync(filePath, "utf-8");
  } catch (error) {
    console.error("Error reading instructions file:", error);
    return "";
  }
};

const summarizeContext = (messages = []) => {
  if (!messages.length) return "";

  // SIMPLE APPROACH: Check what the LAST assistant question was about
  // If it was about timeline and user answered, generate proposal

  // Find the last assistant message
  let lastAssistantMsg = null;
  let lastAssistantIndex = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "assistant") {
      lastAssistantMsg = messages[i];
      lastAssistantIndex = i;
      break;
    }
  }

  // Check if user has answered after the last assistant message
  const userAnsweredLast = lastAssistantIndex >= 0 &&
    messages.length > lastAssistantIndex + 1 &&
    messages[messages.length - 1].role === "user";

  // Determine what the last question was about
  const lastContent = (lastAssistantMsg?.content || "").toLowerCase();

  // Check if last question was about late-stage topics (budget or timeline)
  const wasAboutTimeline = lastContent.includes("timeline") ||
    lastContent.includes("go-live") ||
    lastContent.includes("timeframe");
  const wasAboutBudget = lastContent.includes("budget") || lastContent.includes("inr");

  // Count how many assistant messages we have (rough estimate of progress)
  const assistantCount = messages.filter(m => m.role === "assistant").length;

  // PROPOSAL TRIGGER CONDITIONS:
  // 1. Last question was about timeline AND user just answered
  // 2. OR: We've had many exchanges (8+) and last question was budget/timeline
  let shouldGenerateProposal = false;
  if (userAnsweredLast && wasAboutTimeline) {
    shouldGenerateProposal = true;
  } else if (userAnsweredLast && wasAboutBudget && assistantCount >= 10) {
    // If budget was asked late in conversation and answered, also trigger
    shouldGenerateProposal = true;
  }

  // Extract the LATEST budget and timeline from user messages
  let latestBudget = null;
  let latestTimeline = null;

  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.role === "user") {
      const content = (msg.content || "").toLowerCase();
      // Check for budget patterns
      if (!latestBudget) {
        const budgetMatch = content.match(/(\d+)\s*k\b/i) ||
          content.match(/₹?\s*(\d{1,3}(?:,?\d{3})*)/);
        if (budgetMatch) {
          let amount = parseInt(budgetMatch[1].replace(/,/g, ""));
          if (/\d+\s*k\b/i.test(content)) amount *= 1000;
          if (content.includes("lakh")) amount *= 100000;
          latestBudget = `₹${amount.toLocaleString("en-IN")}`;
        }
      }
      // Check for timeline patterns
      if (!latestTimeline) {
        const timeMatch = content.match(/(\d+)\s*(month|week|day)s?/i);
        if (timeMatch) {
          latestTimeline = `${timeMatch[1]} ${timeMatch[2]}${parseInt(timeMatch[1]) > 1 ? 's' : ''}`;
        }
      }
    }
    if (latestBudget && latestTimeline) break;
  }

  // Show recent messages for context
  const recent = messages.slice(-6);
  const lines = recent.map((msg) => {
    const prefix = msg.role === "assistant" ? "Bot" : "User";
    return `${prefix}: ${msg.content}`;
  });

  const nextAction = shouldGenerateProposal
    ? "GENERATE PROPOSAL NOW - user answered timeline question"
    : "Continue with next question in the flow";

  return `CONVERSATION PROGRESS: ${assistantCount} questions asked.
LAST QUESTION TOPIC: ${wasAboutTimeline ? "TIMELINE" : wasAboutBudget ? "BUDGET" : "other"}
USER ANSWERED: ${userAnsweredLast ? "YES" : "NO"}
NEXT ACTION: ${nextAction}
${latestBudget ? `CONFIRMED BUDGET: ${latestBudget}` : ""}
${latestTimeline ? `CONFIRMED TIMELINE: ${latestTimeline}` : ""}

Recent:
${lines.join("\n")}

IMPORTANT: Use CONFIRMED BUDGET and CONFIRMED TIMELINE values in the proposal, not older values from earlier in conversation.`;
};

const buildSystemPrompt = (service) => {
  const servicePolicy = getWebsitePolicy(service);
  const counterQuestion = getCounterQuestion();
  const questions = getQuestionsForService(service);
  const instructions = getInstructions(service);
  const questionLines = questions
    .map((q, idx) => `${idx + 1}) ${q.text}`)
    .join("\n");

  // Format budget and timeline requirements
  const requirementsInfo = `
MINIMUM PROJECT REQUIREMENTS (Budget & Timeline):
| Project Type | Min Budget | Min Timeline |
|--------------|------------|--------------|
| Landing Page | ₹10,000 | 1 week |
| WordPress | ₹20,000 | 15-20 days |
| Shopify | ₹30,000 | 15-20 days |
| 3D WordPress/Shopify | ₹45,000 | 20-25 days |
| Webflow/Framer | ₹80,000 | 20-28 days |
| E-Commerce Platform | ₹75,000 | 30-60 days |
| Custom E-commerce | ₹1,50,000 | 30-60 days |
| Web App/SaaS | ₹75,000 | 45-60 days |
| Mobile App | ₹2,00,000 | 2 months |
| React/Next.js | ₹60,000 | 30-45 days |
| Laravel | ₹40,000 | 25-30 days |

BUDGET TOO LOW - If user's budget is below minimum:
DO NOT generate proposal. Instead respond:
"Your budget of [user budget] is below the minimum required for a [project type] project (minimum: [min budget]).

You have two options:
1. Increase your budget to at least [min budget]
2. Consider a more affordable alternative"
[SUGGESTIONS: Increase Budget | WordPress (₹20,000) | Shopify (₹30,000) | Landing Page (₹10,000)]

AFTER USER SELECTS "Increase Budget":
If the user's last message is "Increase Budget" or contains "increase", ask:
"What's your new budget in INR?"
Wait for their answer before proceeding to timeline.
DO NOT ask about timeline until you have a valid budget >= minimum.

TIMELINE TOO SHORT - If user's timeline is below minimum:
DO NOT generate proposal. Instead respond:
"Your timeline of [user timeline] is shorter than what's required for a quality [project type] project (minimum: [min timeline]).

You have two options:
1. Extend your timeline to at least [min timeline]
2. Consider a faster alternative"
[SUGGESTIONS: Extend Timeline | WordPress (15-20 days) | Landing Page (1 week)]

AFTER USER SELECTS "Extend Timeline":
If the user's last message is "Extend Timeline" or contains "extend", ask:
"What's your new timeline?"
Wait for their answer before generating proposal.`;

  return `You are a consultant helping with "${service}" projects. Your job is to gather requirements by asking questions ONE AT A TIME.

ABSOLUTE RULES:
1. Output ONLY ONE question per response. Nothing else. No combining questions.
2. NEVER go backwards. If you asked about budget, don't ask about name again.
3. NEVER repeat yourself. Check history before every response.
4. NO internal thoughts. No "We should...", "Let's...", "Good." - just the question.
5. Keep it SHORT. One sentence question maximum.
6. VALIDATE BUDGET AND TIMELINE before generating proposal.

YOUR QUESTION FLOW (follow in order, skip if answered):
Step 1: "What's your first name?"
Step 2: "What's your company or project name?"
Step 3: "In one line, what are you building?"
Step 4: "Which category fits best?" [SUGGESTIONS: Website | SaaS/Web App | Mobile App | E-Commerce | Other]
Step 5: "Is this new or existing?" [SUGGESTIONS: New Project | Existing Project]
Step 6: "What are the essential features?" [MULTI_SELECT: based on their project type]
Step 7: "Do you have designs?" [SUGGESTIONS: Yes | No | Partial]
Step 8: "Preferred tech stack?" [SUGGESTIONS: React/Next.js | Node.js | Laravel | WordPress | No preference]
Step 9: "Any integrations needed?" [SUGGESTIONS: Payments | Auth | Analytics | CRM | None]
Step 10: "What's your budget in INR?"
Step 11: "What's your timeline?"
Step 12: VALIDATE budget/timeline, then generate proposal OR suggest alternatives
${requirementsInfo}

HOW TO TRACK PROGRESS:
- Look at the conversation history
- Find which questions were already asked AND answered
- Ask the NEXT unanswered question
- BEFORE generating proposal: Check if budget >= minimum AND timeline >= minimum
- If either is too low, show alternatives instead of proposal

FORMAT:
- Question text on first line
- [SUGGESTIONS: ...] or [MULTI_SELECT: ...] on second line if applicable
- Nothing else

Service: ${service}
${getServiceDetails(service)}
${servicePolicy ? `${servicePolicy}` : ""}

CRITICAL - WHEN TO GENERATE PROPOSAL:
If the context says "NEXT ACTION: GENERATE PROPOSAL NOW", first validate:
1. Is budget >= minimum for their project type?
2. Is timeline >= minimum for their project type?

VERY IMPORTANT - BUDGET HANDLING:
- Look at the "CONFIRMED BUDGET" field in the context - this is the MOST RECENT budget the user provided
- If user said they want to increase budget, then said a new amount like "20k", use "20k" (₹20,000), NOT any earlier amount
- The CONFIRMED BUDGET is always the correct one to use in the proposal
- NEVER show an old/rejected budget in the proposal

If YES to both, generate proposal with PRICE included:

[PROPOSAL_DATA]
PROJECT PROPOSAL

Project: [Project Name]
For: [Name] - [Company]
Tech Stack: [Tech Stack]

Summary: [Brief description of what they're building]

Features Included:
- [List features they mentioned]

Estimated Price: [Price based on project type]
Timeline: [Their timeline from CONFIRMED TIMELINE]
Budget: [Their CONFIRMED BUDGET - must be the LATEST value they provided, NOT any earlier rejected values]

Scope of Work:
Phase 1: Discovery & Planning
Phase 2: UI/UX Design
Phase 3: Development & Integration
Phase 4: Testing & Deployment

Next Steps:
1. Review and confirm this proposal
2. Sign agreement and pay deposit
3. Kickoff meeting to begin work

To customize this proposal, please use the Edit Proposal option.
[/PROPOSAL_DATA]

If NO (budget or timeline too low), DO NOT generate proposal. Instead, show the budget/timeline message with alternatives.`;
};

// AI-powered proposal rewriting function
const rewriteProposalWithAI = async (rawProposal, apiKey) => {
  try {
    const openai = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: apiKey,
      defaultHeaders: {
        "HTTP-Referer": defaultReferer,
        "X-Title": "Freelancer Platform",
      },
    });

    // Extract the project overview section to rewrite
    const overviewMatch = rawProposal.match(
      /PROJECT OVERVIEW\s*\n(?:(?:[=\-_*]|[\u2500-\u257F])+\s*\n)?([\s\S]*?)\n\s*Website Type:/i
    );
    if (!overviewMatch) {
      return rawProposal; // Return unchanged if pattern not found
    }

    const originalOverview = overviewMatch[1].trim();

    // Use AI to rewrite the description
    const rewriteResponse = await openai.chat.completions.create({
      model: env.OPENROUTER_MODEL || "openai/gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a professional proposal writer. Rewrite the following project description to be:
1. Professional and formal
2. Fix any spelling or grammar errors
3. Keep it concise (2-3 sentences max)
4. Keep the project/brand name if mentioned
5. Do NOT add any extra details; only clean up what's given

Return ONLY the rewritten description, nothing else.`
        },
        {
          role: "user",
          content: originalOverview
        }
      ],
      max_tokens: 200,
      temperature: 0.3,
    });

    const rewrittenOverview = rewriteResponse?.choices?.[0]?.message?.content?.trim();

    if (rewrittenOverview) {
      // Replace the original overview with the rewritten one
      return rawProposal.replace(originalOverview, rewrittenOverview);
    }

    return rawProposal;
  } catch (error) {
    console.error("Error rewriting proposal with AI:", error.message);
    return rawProposal; // Return original if AI fails
  }
};

export const generateChatReplyWithState = async ({
  message,
  service,
  history,
  contextHint = "",
  state: existingState = null,
}) => {
  const apiKey = env.OPENROUTER_API_KEY?.trim();

  if (!apiKey) {
    throw new Error(
      "LLM API key not configured. Set OPENROUTER_API_KEY in backend/.env."
    );
  }

  const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: apiKey,
    defaultHeaders: {
      "HTTP-Referer": defaultReferer,
      "X-Title": "Freelancer Platform",
    },
  });

  const safeHistory = Array.isArray(history) ? history.slice(-50) : [];
  const normalizedMessage = (message || "").trim();
  const historyForStateMachine = (() => {
    if (!safeHistory.length) return safeHistory;
    const last = safeHistory[safeHistory.length - 1];
    if (
      last?.role === "user" &&
      (last.content || "").trim() === normalizedMessage
    ) {
      return safeHistory.slice(0, -1);
    }
    return safeHistory;
  })();

  const baseState =
    existingState && typeof existingState === "object"
      ? existingState
      : buildConversationState(historyForStateMachine, service);
  const updatedState = processUserAnswer(baseState, normalizedMessage);

  const stateWithLocale = {
    ...updatedState,
    i18n: {
      locale: "en",
      lockedToStart: true,
      preferredLocale: null,
      lastOptions: null,
    },
  };

  const isRoadmapOrEstimateRequest = (value = "") => {
    const text = (value || "").toString().toLowerCase();
    if (!text) return false;

    // Strong signals for "give me a plan/roadmap/cost breakdown".
    const patterns = [
      /\broadmap\b/,
      /\bmilestones?\b/,
      /\btimeline\s*(?:breakdown|plan)\b/,
      /\bcost\s*(?:breakdown|estimate)\b/,
      /\bprice\s*(?:breakdown|estimate)\b/,
      /\b(?:total\s+)?cost\b/,
      /\bestimate\b/,
      /\bquote\b/,
      /\bdeliverables?\b/,
      /\bwhat\s+all\s+will\s+be\s+included\b/,
      /\bplan\s+to\s+complete\b/,
      /\bphases?\b/,
    ];

    return patterns.some((re) => re.test(text));
  };

  const answerServiceQuestionWithAI = async () => {
    const known = Object.entries(stateWithLocale.collectedData || {})
      .filter(([, v]) => v && v !== "[skipped]")
      .slice(0, 12)
      .map(([k, v]) => `${k}: ${String(v).slice(0, 160)}`)
      .join("\n");

    const messages = [
      {
        role: "system",
        content:
          `You are a helpful assistant for the service "${service || "General"}" on a freelancer platform. ` +
          `Answer the user's question in 1-5 concise sentences. ` +
          `Answer the user's question concisely (bullets allowed, keep it under ~12 lines). ` +
          `If the user asks for a roadmap/cost/timeline breakdown, provide a compact milestone plan with rough effort split. ` +
          `If the requested scope looks unrealistic for the stated budget/timeline, say so plainly and suggest 2-3 options (reduce scope, phased delivery, or adjust budget/stack). ` +
          `Do NOT use markdown tables. ` +
          `Do NOT invent specific tech/integrations the user did not mention; if unknown, present as options. ` +
          `Do NOT ask follow-up questions and do NOT include any extra questions in your answer. ` +
          `Do not output any bracket tags like [SUGGESTIONS] or [PROPOSAL_DATA].`,
      },
      {
        role: "system",
        content: `Service context: ${getServiceDetails(service || "")}`,
      },
      {
        role: "system",
        content: `Known requirements so far (may be incomplete):\n${known || "None yet."}`,
      },
      {
        role: "user",
        content: normalizedMessage,
      },
    ];

    let completion;
    try {
      completion = await openai.chat.completions.create({
        model: env.OPENROUTER_MODEL,
        messages,
        max_tokens: 220,
        temperature: 0.2,
      });
    } catch (error) {
      if (error?.status === 429 && env.OPENROUTER_MODEL_FALLBACK) {
        completion = await openai.chat.completions.create({
          model: env.OPENROUTER_MODEL_FALLBACK,
          messages,
          max_tokens: 220,
          temperature: 0.2,
        });
      } else {
        throw error;
      }
    }

    return (
      completion?.choices?.[0]?.message?.content
        ?.trim()
        ?.replace(/\*\*/g, "") || ""
    );
  };

  let aiAnswer = "";
  const wantsRoadmap =
    Boolean(stateWithLocale?.meta?.wasQuestion) &&
    isRoadmapOrEstimateRequest(normalizedMessage);
  if (wantsRoadmap) {
    aiAnswer = generateRoadmapFromState(stateWithLocale);
  } else if (stateWithLocale?.meta?.wasQuestion) {
    try {
      aiAnswer = await answerServiceQuestionWithAI();
    } catch (error) {
      console.error("Service Q&A failed:", error?.message || error);
      aiAnswer = "";
    }
  }

  let baseReply = "";
  let nextQuestion = "";
  if (shouldGenerateProposal(stateWithLocale)) {
    const rawProposal = generateProposalFromState(stateWithLocale);
    const rewritten = await rewriteProposalWithAI(rawProposal, apiKey);
    baseReply = aiAnswer ? `${aiAnswer}\n\n${rewritten}` : rewritten;
  } else {
    nextQuestion = getNextHumanizedQuestion(stateWithLocale);
    baseReply = nextQuestion
      ? aiAnswer
        ? `${aiAnswer}\n\n${nextQuestion}`
        : nextQuestion
      : aiAnswer || "Could you share a bit more detail?";
  }

  let reply = baseReply;
  let lastOptions = null;
  const locale =
    stateWithLocale?.i18n?.preferredLocale ||
    stateWithLocale?.i18n?.locale ||
    "en";
  if (locale && locale !== "en") {
    try {
      const translated = await translateAssistantReply(openai, baseReply, {
        targetLocale: locale,
        model: i18nModel,
        fallbackModel: i18nTranslateFallbackModel,
      });
      reply = translated.reply || baseReply;
      lastOptions =
        translated.lastOptions?.map &&
          Object.keys(translated.lastOptions.map).length
          ? translated.lastOptions
          : null;
    } catch (error) {
      console.error("Reply translation failed:", error?.message || error);
    }
  }

  return { reply: stripEmojis(reply), state: stateWithLocale };
};

export const generateChatReply = async (args) => {
  const { reply } = await generateChatReplyWithState(args);
  return reply;
};

export const chatController = async (req, res) => {
  try {
    const { message, service, history } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    console.log("Sending request to OpenRouter...");
    const safeHistory = Array.isArray(history) ? history : [];
    const botResponse = await generateChatReply({
      message,
      service,
      history: safeHistory,
      contextHint: summarizeContext(safeHistory),
    });

    // Strip markdown bolding from the response
    const cleanResponse = botResponse.replace(/\*\*/g, "");

    res.json({ response: cleanResponse });
  } catch (error) {
    console.error("Chat error:", error);
    if (error?.response) {
      console.error("OpenAI API Error Data:", error.response.data);
      console.error("OpenAI API Error Status:", error.response.status);
    }
    res.status(500).json({
      error: "Unable to generate a response right now. Please try again.",
    });
  }
};

// List conversations for the authenticated user (from DB) with latest message.
export const listUserConversations = asyncHandler(async (req, res) => {
  const userId = req.user?.sub;
  if (!userId) {
    throw new AppError("Unauthorized", 401);
  }

  // Check if user is a Project Manager
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, fullName: true }
  });

  const isProjectManager = currentUser?.role === "PROJECT_MANAGER";

  // For Project Managers: Find conversations where they've sent messages
  if (isProjectManager) {
    // Find all conversations where this PM has sent messages
    const pmMessages = await prisma.chatMessage.findMany({
      where: {
        OR: [
          { senderId: userId },
          { senderRole: "PROJECT_MANAGER" }
        ]
      },
      select: { conversationId: true },
      distinct: ['conversationId']
    });

    const conversationIds = pmMessages.map(m => m.conversationId).filter(Boolean);

    // Also get all project conversations (PM can see all)
    const allProjectConversations = await prisma.chatConversation.findMany({
      where: {
        OR: [
          { id: { in: conversationIds } },
          { service: { startsWith: "CHAT:" } }
        ]
      },
      orderBy: { updatedAt: "desc" },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        _count: {
          select: { messages: true },
        },
      },
      take: 50
    });

    // Filter to only show conversations with messages
    const conversationsWithMessages = allProjectConversations.filter(
      c => c._count?.messages > 0
    );

    // Build meta from service key
    const data = conversationsWithMessages.map((conversation) => {
      // Parse service key: CHAT:projectId:clientId:freelancerId
      const parts = (conversation.service || "").split(":");
      let projectTitle = conversation.projectTitle || "Project Chat";

      return {
        id: conversation.id,
        service: conversation.service,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        createdById: conversation.createdById,
        projectTitle: projectTitle,
        lastMessage: conversation.messages?.[0]
          ? serializeMessage(conversation.messages[0])
          : null,
        messageCount: conversation._count?.messages || 0
      };
    });

    res.json({ data });
    return;
  }

  // Regular flow for Clients/Freelancers
  // Gather proposals for projects owned by this user (accepted) to derive project-specific chat threads.
  const proposals = await prisma.proposal.findMany({
    where: {
      project: { ownerId: userId },
      freelancerId: { not: userId },
      status: { in: ["ACCEPTED"] }, // ProposalStatus enum values
    },
    include: { freelancer: true, project: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  // Build a lookup of serviceKey -> meta from proposals
  const serviceMeta = new Map();
  const serviceKeys = [];
  for (const proposal of proposals) {
    const projectId = proposal.project?.id;
    if (!projectId) continue;

    const ownerId = proposal.project?.ownerId;
    const freelancerId = proposal.freelancerId;

    // Use consistent key format: CHAT:PROJECT_ID:CLIENT_ID:FREELANCER_ID
    const serviceKey = `CHAT:${projectId}:${ownerId}:${freelancerId}`;

    serviceKeys.push(serviceKey);
    serviceMeta.set(serviceKey, {
      projectId,
      freelancerName:
        proposal.freelancer?.fullName ||
        proposal.freelancer?.name ||
        proposal.freelancer?.email ||
        "Freelancer",
      projectTitle: proposal.project?.title || "Project Chat",
    });
  }

  // Pull conversations that match the project+freelancer service keys.
  const conversations = serviceKeys.length
    ? await prisma.chatConversation.findMany({
      where: { service: { in: serviceKeys } },
      orderBy: { updatedAt: "desc" },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        _count: {
          select: { messages: true },
        },
      },
    })
    : [];

  // Ensure a conversation exists for each service key.
  const byService = new Map();

  // Helper to determine which conversation is "better"
  const isBetterConversation = (current, candidate) => {
    const currentHasMessages =
      current.messages.length > 0 || (current._count?.messages || 0) > 0;
    const candidateHasMessages =
      candidate.messages.length > 0 || (candidate._count?.messages || 0) > 0;

    if (candidateHasMessages && !currentHasMessages) return true;
    if (!candidateHasMessages && currentHasMessages) return false;

    // If both have messages or both don't, prefer the newer one (updatedAt)
    return new Date(candidate.updatedAt) > new Date(current.updatedAt);
  };

  for (const convo of conversations) {
    if (convo.service) {
      if (!byService.has(convo.service)) {
        byService.set(convo.service, convo);
      } else {
        const current = byService.get(convo.service);
        if (isBetterConversation(current, convo)) {
          byService.set(convo.service, convo);
        }
      }
    }
  }

  for (const key of serviceKeys) {
    if (!byService.has(key)) {
      // Create if missing. Note: createdById is just for record keeping,
      // it doesn't restrict who can see it (that's done by service key logic).
      const convo = await prisma.chatConversation.create({
        data: { service: key, createdById: userId },
      });
      byService.set(key, { ...convo, messages: [] });
    }
  }

  // Build response sorted by updatedAt desc.
  const data = Array.from(byService.values())
    .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0))
    .map((conversation) => {
      const meta = serviceMeta.get(conversation.service) || {};
      return {
        id: conversation.id,
        service: conversation.service,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        createdById: conversation.createdById,
        freelancerName: meta.freelancerName || "Freelancer",
        projectTitle:
          meta.projectTitle || conversation.service || "Conversation",
        lastMessage: conversation.messages?.[0]
          ? serializeMessage(conversation.messages[0])
          : null,
      };
    });

  res.json({ data });
});

export const createConversation = asyncHandler(async (req, res) => {
  const createdById = req.user?.sub || null;
  const serviceKey = normalizeService(req.body?.service);
  const projectTitle = req.body?.projectTitle || null;
  const ephemeral =
    req.body?.mode === "assistant" || req.body?.ephemeral === true;

  if (!ephemeral && !createdById) {
    throw new AppError("Authentication required", 401);
  }

  if (ephemeral) {
    const conversation = createInMemoryConversation({
      service: serviceKey,
      createdById,
    });
    res.status(201).json({ data: conversation });
    return;
  }

  // Always start a fresh persisted conversation to avoid reusing old threads on refresh.
  // For client/freelancer chat we should keep one thread per service + creator
  // so history stays intact across refreshes.
  let conversation = null;

  if (serviceKey) {
    const candidates = await prisma.chatConversation.findMany({
      where: { service: serviceKey },
      include: {
        _count: { select: { messages: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    // Pick the one with messages, or the newest one
    conversation = candidates.find((c) => c._count.messages > 0) || candidates[0];

    // BACKWARDS COMPATIBILITY: If no conversation found with new format,
    // try to find one with the old format (CHAT:CLIENT_ID:FREELANCER_ID)
    if (!conversation && serviceKey.startsWith("CHAT:")) {
      const parts = serviceKey.split(":");
      // New format: CHAT:PROJECT_ID:CLIENT_ID:FREELANCER_ID (4 parts)
      // Old format: CHAT:CLIENT_ID:FREELANCER_ID (3 parts)
      if (parts.length === 4) {
        const [, projectId, clientId, freelancerId] = parts;
        const legacyKey = `CHAT:${clientId}:${freelancerId}`;

        const legacyCandidates = await prisma.chatConversation.findMany({
          where: { service: legacyKey },
          include: {
            _count: { select: { messages: true } },
          },
          orderBy: { updatedAt: "desc" },
        });

        const legacyConvo = legacyCandidates.find((c) => c._count.messages > 0) || legacyCandidates[0];

        if (legacyConvo) {
          // Update the legacy conversation to use the new service key
          conversation = await prisma.chatConversation.update({
            where: { id: legacyConvo.id },
            data: {
              service: serviceKey,
              projectTitle: projectTitle || legacyConvo.projectTitle
            },
          });
        }
      }
    }
  }

  if (!conversation) {
    conversation = await prisma.chatConversation.create({
      data: {
        service: serviceKey,
        projectTitle,
        createdById,
      },
    });
  }

  res.status(201).json({ data: conversation });
});

export const getConversationMessages = asyncHandler(async (req, res) => {
  const conversationId = req.params?.id;

  // Prefer in-memory conversation if present (AI chat), otherwise fall back to DB.
  const memoryConversation = getConversation(conversationId);
  if (memoryConversation) {
    const messages = listMessages(conversationId, 100);
    res.json({
      data: {
        conversation: memoryConversation,
        messages,
      },
    });
    return;
  }

  if (!req.user?.sub) {
    throw new AppError("Authentication required", 401);
  }

  const conversation = await prisma.chatConversation.findUnique({
    where: { id: conversationId },
  });

  if (!conversation) {
    throw new AppError("Conversation not found", 404);
  }

  const messages = await prisma.chatMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    take: 5000,
  });

  res.json({
    data: {
      conversation,
      messages,
    },
  });
});

export const addConversationMessage = asyncHandler(async (req, res) => {
  const conversationId = req.params?.id;
  const {
    content,
    service,
    projectTitle,
    senderId,
    senderRole,
    senderName,
    skipAssistant = false,
    history: clientHistory,
  } = req.body || {};

  if (!content) {
    throw new AppError("Message content is required", 400);
  }

  const serviceKey = normalizeService(service);
  const useEphemeral =
    !skipAssistant ||
    req.body?.mode === "assistant" ||
    req.body?.ephemeral === true;

  if (!useEphemeral && !req.user?.sub) {
    throw new AppError("Authentication required", 401);
  }

  // Assistant chat path: keep everything in memory/local only.
  if (useEphemeral) {
    const conversation = ensureConversation({
      id: conversationId,
      service: serviceKey,
      createdById: senderId || null,
    });

    const userMessage = addMessage({
      conversationId: conversation.id,
      senderId: senderId || null,
      senderName: senderName || null,
      senderRole: senderRole || null,
      role: "user",
      content,
    });

    let assistantMessage = null;

    if (!skipAssistant) {
      const serverHistory = listMessages(conversation.id, 100).map(toHistoryMessage);
      const fallbackHistory = Array.isArray(clientHistory)
        ? clientHistory.map(toHistoryMessage)
        : [];

      // Prefer server-side history when it has context; fall back to client-provided
      // history only when the server history is basically empty (e.g., after a restart).
      const dbHistory =
        fallbackHistory.length > 0 && serverHistory.length <= 1
          ? fallbackHistory
          : serverHistory;
      const contextHint = summarizeContext(dbHistory);

      try {
        const { reply: assistantReply, state: nextState } = await generateChatReplyWithState({
          message: content,
          service: service || conversation.service || "",
          history: dbHistory,
          contextHint,
          state: conversation.assistantState,
        });

        conversation.assistantState = nextState;

        assistantMessage = addMessage({
          conversationId: conversation.id,
          senderName: "Assistant",
          senderRole: "assistant",
          role: "assistant",
          content: assistantReply,
        });
      } catch (error) {
        console.error("Assistant generation failed (HTTP):", error);
      }
    }

    res.status(201).json({
      data: {
        message: serializeMessage(userMessage),
        assistant: assistantMessage ? serializeMessage(assistantMessage) : null,
      },
    });
    return;
  }

  // Persisted chat path (client & freelancer conversations)
  let conversation = null;

  if (conversationId) {
    conversation = await prisma.chatConversation.findUnique({
      where: { id: conversationId },
    });
  }

  if (!conversation) {
    if (serviceKey) {
      const candidates = await prisma.chatConversation.findMany({
        where: { service: serviceKey },
        include: {
          _count: { select: { messages: true } }
        },
        orderBy: { updatedAt: "desc" }
      });
      // Pick the one with messages, or the newest one
      conversation = candidates.find(c => c._count.messages > 0) || candidates[0];
    }
  }

  // If still no conversation was found, create a new one.
  if (!conversation) {
    conversation = await prisma.chatConversation.create({
      data: {
        service: serviceKey,
        projectTitle: projectTitle || null,
        createdById: senderId || null,
      },
    });
  }

  // Extract attachment from request body
  const { attachment } = req.body || {};

  const userMessage = await prisma.chatMessage.create({
    data: {
      conversationId: conversation.id,
      senderId: senderId || null,
      senderName: senderName || null,
      senderRole: senderRole || null,
      role: "user",
      content,
      attachment: attachment ? attachment : undefined,
    },
  });

  // Update conversation timestamp for sorting
  await prisma.chatConversation.update({
    where: { id: conversation.id },
    data: { updatedAt: new Date() }
  });

  // Send notification to the other participant
  // Service key format: CHAT:userId1:userId2
  const convService = serviceKey || conversation.service || "";
  const actualSenderId = senderId || req.user?.sub;

  if (convService.startsWith("CHAT:")) {
    const parts = convService.split(":");
    let recipientId = null;

    // Support both formats:
    // Old: CHAT:clientId:freelancerId (3 parts)
    // New: CHAT:projectId:clientId:freelancerId (4 parts)
    if (parts.length === 4) {
      // New format: CHAT:projectId:clientId:freelancerId
      const [, , clientId, freelancerId] = parts;
      recipientId = String(actualSenderId) === String(clientId) ? freelancerId : clientId;
    } else if (parts.length >= 3) {
      // Old format: CHAT:id1:id2
      const [, id1, id2] = parts;
      recipientId = String(actualSenderId) === String(id1) ? id2 : id1;
    }

    console.log(`[Notification] Service: ${convService}, Sender: ${actualSenderId}, Recipient: ${recipientId}`);
    if (recipientId && String(recipientId) !== String(actualSenderId)) {
      sendNotificationToUser(recipientId, {
        type: "chat",
        title: "New Message",
        message: `${senderName || "Someone"}: ${content.slice(0, 50)}${content.length > 50 ? "..." : ""}`,
        data: {
          conversationId: conversation.id,
          messageId: userMessage.id,
          service: convService,
          senderId: actualSenderId
        }
      });
    }
  } else {
    console.log(`[Notification] Skipped - service doesn't start with CHAT: ${convService}`);
  }

  let assistantMessage = null;

  if (!skipAssistant) {
    const recentMessages = await prisma.chatMessage.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "asc" },
      take: 100,
    });

    const dbHistory = recentMessages.map(toHistoryMessage);
    const contextHint = summarizeContext(dbHistory);

    try {
      const assistantReply = await generateChatReply({
        message: content,
        service: serviceKey || conversation.service || "",
        history: dbHistory,
        contextHint,
      });

      assistantMessage = await prisma.chatMessage.create({
        data: {
          conversationId: conversation.id,
          senderName: "Assistant",
          senderRole: "assistant",
          role: "assistant",
          content: assistantReply,
        },
      });
    } catch (error) {
      console.error("Assistant generation failed (persistent):", error);
    }
  }

  res.status(201).json({
    data: {
      message: serializeMessage(userMessage),
      assistant: assistantMessage ? serializeMessage(assistantMessage) : null,
    },
  });
});

/**
 * Get messages for a specific project (for Project Managers and Admins)
 * This allows PMs to view client-freelancer conversations
 */
export const getProjectMessages = asyncHandler(async (req, res) => {
  const userId = req.user?.sub;
  const { projectId } = req.params;

  if (!userId) {
    throw new AppError("Authentication required", 401);
  }

  // Verify user is a Project Manager or Admin
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true }
  });

  if (!user || (user.role !== "PROJECT_MANAGER" && user.role !== "ADMIN")) {
    throw new AppError("Access denied. Only Project Managers can access this.", 403);
  }

  // Find conversations that include this project ID in their service key
  // Service key format: CHAT:projectId:clientId:freelancerId
  const conversations = await prisma.chatConversation.findMany({
    where: {
      OR: [
        { service: { startsWith: `CHAT:${projectId}:` } },
        { service: { contains: projectId } }
      ]
    },
    orderBy: { updatedAt: "desc" }
  });

  if (conversations.length === 0) {
    // No conversations found
    res.json({ data: { messages: [], conversation: null } });
    return;
  }

  // Get messages from the first (most recent) conversation
  const conversation = conversations[0];

  const messages = await prisma.chatMessage.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "asc" },
    take: 100
  });

  // Format messages with sender info
  const formattedMessages = messages.map(msg => ({
    id: msg.id,
    content: msg.content,
    senderName: msg.senderName || (msg.role === "assistant" ? "Assistant" : "User"),
    senderRole: msg.senderRole || msg.role,
    createdAt: msg.createdAt,
    role: msg.role
  }));

  res.json({
    data: {
      conversation: {
        id: conversation.id,
        service: conversation.service,
        projectTitle: conversation.projectTitle
      },
      messages: formattedMessages
    }
  });
});
