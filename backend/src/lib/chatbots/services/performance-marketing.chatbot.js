export const service = "Performance Marketing";
export const openingMessage = "Hi! Ready to run some high-converting ads? Let's get started!";
export const serviceDetails = `Sub-types: Meta Ads, Google Ads, LinkedIn Ads, Retargeting
Deliverables: Campaign strategy, ad creatives & copies, optimization & reports
Pricing: Setup ₹20,000–₹40,000 | Management 10–20% of ad spend
Timelines: Ongoing (30-day cycles) | Partial scope: Ad setup only 5–7 days (₹10,000–₹25,000), Optimization only monthly (₹15,000–₹30,000)
Timeline policy: timelines are in working days; 10–20% buffer included; delays due to missing client inputs pause the timeline.`;
export const questions = [
  {
    "key": "name",
    "patterns": [
      "name",
      "call you"
    ],
    "templates": [
      "Hey! Ready to run some high-converting ads? What's your name?"
    ],
    "suggestions": null
  },
  {
    "key": "business",
    "patterns": [
      "business",
      "company",
      "sell",
      "offer"
    ],
    "templates": [
      "Great, {name}! What does your business sell or offer?"
    ],
    "suggestions": null
  },
  {
    "key": "platforms",
    "patterns": [
      "platform",
      "where",
      "ads"
    ],
    "templates": [
      "Where do you want to run ads?"
    ],
    "suggestions": [
      "Google Ads",
      "Meta (FB/IG)",
      "LinkedIn",
      "YouTube",
      "Multiple"
    ]
  },
  {
    "key": "goals",
    "patterns": [
      "goal",
      "achieve",
      "want",
      "objective"
    ],
    "templates": [
      "What's your main advertising goal?"
    ],
    "suggestions": [
      "More sales",
      "Lead generation",
      "Website traffic",
      "Brand awareness"
    ]
  },
  {
    "key": "budget",
    "patterns": [
      "budget",
      "cost",
      "spend",
      "ad spend"
    ],
    "templates": [
      "What's your monthly ad budget?"
    ],
    "suggestions": [
      "Under ₹25,000/mo",
      "₹25,000 - ₹50,000/mo",
      "₹50,000 - ₹1,00,000/mo",
      "₹1,00,000+/mo"
    ]
  },
  {
    "key": "timeline",
    "patterns": [
      "timeline",
      "when",
      "start",
      "launch"
    ],
    "templates": [
      "How long would you like to run ads? (Select a duration in months)"
    ],
    "suggestions": [
      "1 month",
      "3 months",
      "6 months",
      "More"
    ]
  }
];

const chatbot = { service, openingMessage, questions, serviceDetails };
export default chatbot;

