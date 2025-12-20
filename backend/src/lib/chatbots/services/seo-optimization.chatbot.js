export const service = "SEO Optimization";
export const openingMessage = "Hi! Ready to rank higher on Google? Let's boost your visibility.";
export const serviceDetails = `Sub-types: On-page SEO, Off-page SEO, Technical SEO, Local SEO (GMB)
Deliverables: Keyword research, on-page optimization, backlink building, monthly SEO report
Pricing: Starter ₹15,000/month | Growth ₹25,000–₹60,000/month
Timelines: Results typically start in 60–90 days | Partial scope: Audit only 7–10 days (₹8,000–₹20,000), On-page SEO only 15–20 days (₹15,000–₹30,000)
Timeline policy: timelines are in working days; 10–20% buffer included; delays due to missing client inputs pause the timeline.`;
export const questions = [
  {
    "key": "name",
    "patterns": [
      "name",
      "call you"
    ],
    "templates": [
      "Hey! Ready to rank higher on Google? What's your name?"
    ],
    "suggestions": null
  },
  {
    "key": "website",
    "patterns": [
      "website",
      "url",
      "site"
    ],
    "templates": [
      "Nice to meet you, {name}! What's your website URL?"
    ],
    "suggestions": null
  },
  {
    "key": "goals",
    "patterns": [
      "goal",
      "achieve",
      "want",
      "need"
    ],
    "templates": [
      "What's your main goal with SEO?"
    ],
    "suggestions": [
      "Rank higher",
      "More traffic",
      "More leads",
      "Brand visibility"
    ]
  },
  {
    "key": "keywords",
    "patterns": [
      "keyword",
      "search",
      "term",
      "rank for"
    ],
    "templates": [
      "Any specific keywords you want to rank for?"
    ],
    "suggestions": null
  },
  {
    "key": "competitors",
    "patterns": [
      "competitor",
      "competition",
      "similar"
    ],
    "templates": [
      "Who are your main competitors?"
    ],
    "suggestions": null
  },
  {
    "key": "budget",
    "patterns": [
      "budget",
      "cost",
      "spend"
    ],
    "templates": [
      "What's your monthly budget for SEO?"
    ],
    "suggestions": [
      "Under ₹10,000/mo",
      "₹10,000 - ₹25,000/mo",
      "₹25,000 - ₹50,000/mo",
      "₹50,000+/mo"
    ]
  },
  {
    "key": "timeline",
    "patterns": [
      "timeline",
      "when",
      "start"
    ],
    "templates": [
      "SEO requires a minimum 3-month commitment. How long would you like to run it?"
    ],
    "suggestions": [
      "3 months (minimum)",
      "6 months",
      "12 months",
      "More"
    ]
  }
];

const chatbot = { service, openingMessage, questions, serviceDetails };
export default chatbot;


