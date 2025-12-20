export const service = "Influencer/UGC Marketing";
export const openingMessage =
  "Hi! Let’s plan an influencer/UGC campaign that fits your brand and budget. What’s your name?";

export const serviceDetails = `Sub-types: Micro Influencers, Macro Influencers, UGC Creators
Deliverables: Influencer sourcing, content coordination, performance tracking
Pricing: Micro influencers ₹5,000–₹25,000 | UGC videos ₹3,000–₹15,000/video
Timelines: Full campaign 2–4 weeks | Partial scope: Influencer sourcing only 7–10 days (₹5,000–₹15,000), UGC creation only 5–7 days (₹3,000–₹15,000)
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
    patterns: ["company", "brand", "business"],
    templates: ["Nice to meet you, {name}! What’s your brand name?"],
    suggestions: null,
  },
  {
    key: "goal",
    patterns: ["goal", "objective", "target", "purpose"],
    templates: ["What’s the main goal of this campaign?"],
    suggestions: [
      "Brand awareness",
      "Sales",
      "App installs",
      "Lead generation",
      "Not sure yet",
    ],
  },
  {
    key: "platforms",
    patterns: ["platform", "channel", "instagram", "youtube"],
    templates: ["Which platforms should we focus on? (Select all that apply)"],
    suggestions: ["Instagram", "YouTube", "Facebook", "LinkedIn", "Other"],
    multiSelect: true,
  },
  {
    key: "creator_type",
    patterns: ["micro", "macro", "ugc", "creator", "influencer"],
    templates: ["What kind of creators do you want?"],
    suggestions: ["Micro Influencers", "Macro Influencers", "UGC Creators", "Not sure yet"],
  },
  {
    key: "deliverables",
    patterns: ["deliverables", "content", "reels", "posts", "videos"],
    templates: ["What content deliverables do you need? (Select all that apply)"],
    suggestions: ["Reels/Shorts", "Posts", "Stories", "UGC Videos", "Other"],
    multiSelect: true,
  },
  {
    key: "budget",
    patterns: ["budget", "cost", "price", "spend"],
    templates: ["What’s your budget range for this campaign?"],
    suggestions: ["₹5,000–₹25,000", "₹25,000–₹60,000", "₹60,000+", "Not sure yet"],
  },
  {
    key: "timeline",
    patterns: ["timeline", "when", "start", "deadline"],
    templates: ["When do you want to start?"],
    suggestions: ["This week", "1–2 weeks", "2–4 weeks", "Flexible"],
  },
];

const chatbot = { service, openingMessage, questions, serviceDetails };
export default chatbot;

