export const service = "Customer Support";
export const openingMessage = "Hi! 🎧 Let's set up great customer support. Tell me about your needs!";
export const serviceDetails = `Sub-types: Email Support, Chat Support, Voice Support
Deliverables: Trained agents, SLA handling, daily/weekly reports
Pricing: Email/Chat ₹25,000–₹60,000 per agent | Voice ₹40,000–₹80,000 per agent
Timelines: Monthly engagement | Partial scope: Email only monthly (₹20,000–₹40,000), Chat only monthly (₹25,000–₹50,000)
Timeline policy: timelines are in working days; 10–20% buffer included; delays due to missing client inputs pause the timeline.`;
export const questions = [
  {
    "key": "name",
    "patterns": [
      "name",
      "call you"
    ],
    "templates": [
      "Hey! 🎧 Let's set up amazing support for your customers. What's your name?"
    ],
    "suggestions": null
  },
  {
    "key": "company",
    "patterns": [
      "company",
      "business",
      "brand"
    ],
    "templates": [
      "Nice to meet you, {name}! What's your company called?"
    ],
    "suggestions": null
  },
  {
    "key": "support_type",
    "patterns": [
      "type",
      "kind",
      "need",
      "support"
    ],
    "templates": [
      "What type of support do you need? 💬"
    ],
    "suggestions": [
      "Live chat",
      "Email support",
      "Phone support",
      "All channels",
      "Helpdesk setup"
    ]
  },
  {
    "key": "volume",
    "patterns": [
      "volume",
      "tickets",
      "requests",
      "many"
    ],
    "templates": [
      "How many support tickets do you handle per day?"
    ],
    "suggestions": [
      "Under 50",
      "50-200",
      "200-500",
      "500+"
    ]
  },
  {
    "key": "hours",
    "patterns": [
      "hours",
      "availability",
      "24/7",
      "time"
    ],
    "templates": [
      "What hours of coverage do you need?"
    ],
    "suggestions": [
      "Business hours",
      "Extended hours",
      "24/7",
      "Flexible"
    ]
  },
  {
    "key": "budget",
    "patterns": [
      "budget",
      "cost",
      "spend"
    ],
    "templates": [
      "What's your monthly budget for support? 💰"
    ],
    "suggestions": [
      "Under ₹30,000/mo",
      "₹30,000 - ₹60,000/mo",
      "₹60,000 - ₹1,00,000/mo",
      "₹1,00,000+/mo"
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
      "When do you want to start? ⏰"
    ],
    "suggestions": [
      "Immediately",
      "This week",
      "Next month",
      "Flexible"
    ]
  }
];

const chatbot = { service, openingMessage, questions, serviceDetails };
export default chatbot;
