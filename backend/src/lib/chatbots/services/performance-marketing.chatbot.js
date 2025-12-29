export const service = "Performance Marketing";
export const openingMessage = "Hi! Ready to run some high-converting ads? Let's get started!";
export const serviceDetails = `Sub-types: Meta Ads, Google Ads, LinkedIn Ads, Retargeting
Deliverables: Campaign strategy, ad creatives & copies, optimization & reports
Pricing: Setup â‚¹20,000â€“â‚¹40,000 | Management 10â€“20% of ad spend
Timelines: Ongoing (30-day cycles) | Partial scope: Ad setup only 5â€“7 days (â‚¹10,000â€“â‚¹25,000), Optimization only monthly (â‚¹15,000â€“â‚¹30,000)
Timeline policy: timelines are in working days; 10â€“20% buffer included; delays due to missing client inputs pause the timeline.`;
export const questions = [
  {
    key: "platforms",
    patterns: ["platforms", "meta", "google", "linkedin"],
    templates: ["Which platforms do you want to advertise on?"],
    suggestions: ["Meta", "Google", "LinkedIn", "Multiple"],
  },
  {
    key: "objective",
    patterns: ["objective", "goal", "category", "leads", "sales", "traffic"],
    templates: ["What is your project objective?"],
    suggestions: ["Leads", "Sales", "Traffic", "App installs"],
  },
  {
    key: "ad_spend",
    patterns: ["ad budget", "ad spend", "monthly spend", "monthly budget"],
    templates: ["What is your ad budget per month?"],
    suggestions: null,
  },
  {
    key: "ad_accounts",
    patterns: ["ad accounts", "existing accounts"],
    templates: ["Do you already have ad accounts?"],
    suggestions: ["Yes", "No"],
  },
  {
    key: "creative_scope",
    patterns: ["creatives", "copies", "campaign management"],
    templates: ["Do you need creatives and copies, or only campaign management?"],
    suggestions: ["Need creatives and copies", "Campaign management only", "Not sure"],
  },
  {
    key: "scope",
    patterns: ["full campaign", "optimization"],
    templates: ["Do you need full campaign management or optimization only?"],
    suggestions: ["Full campaign management", "Optimization only"],
  },
  {
    key: "timeline",
    patterns: ["duration", "timeline", "campaign length"],
    templates: ["What is the expected campaign duration (in months)?"],
    suggestions: null,
  },
];

const chatbot = { service, openingMessage, questions, serviceDetails };
export default chatbot;


