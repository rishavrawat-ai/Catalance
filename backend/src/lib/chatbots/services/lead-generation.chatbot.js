export const service = "Lead Generation";
export const openingMessage = "Hello! 📈 Looking to grow your leads? I'll help you put together the perfect campaign!";
export const serviceDetails = `Sub-types: B2B Lead Generation, B2C Lead Generation, Real Estate Leads, Appointment Booking
Deliverables: Ad account setup, targeting & creatives, lead tracking sheet/CRM, weekly performance reports
Pricing: Setup ₹15,000–₹30,000 | Monthly ₹20,000–₹60,000
Timelines: Full campaign is ongoing (minimum 30 days) | Partial scope: Ad setup only 5–7 days (₹10,000–₹20,000), Lead data delivery only 10–15 days (custom pricing)
Timeline policy: timelines are in working days; 10–20% buffer included; delays due to missing client inputs pause the timeline.`;
export const questions = [
  {
    "key": "name",
    "patterns": [
      "name",
      "call you"
    ],
    "templates": [
      "Hey! 📈 Ready to grow your leads? What's your name?",
      "Hi! Let's get you more customers. What should I call you?"
    ],
    "suggestions": null
  },
  {
    "key": "business",
    "patterns": [
      "business",
      "company",
      "do",
      "sell"
    ],
    "templates": [
      "Great, {name}! Tell me about your business - what do you offer?"
    ],
    "suggestions": null
  },
  {
    "key": "target",
    "patterns": [
      "target",
      "audience",
      "customer",
      "who"
    ],
    "templates": [
      "Who's your ideal customer? 🎯"
    ],
    "suggestions": null
  },
  {
    "key": "volume",
    "patterns": [
      "volume",
      "many",
      "leads",
      "number"
    ],
    "templates": [
      "How many leads per month are you looking for?"
    ],
    "suggestions": [
      "Under 100",
      "100-500",
      "500-1000",
      "1000+"
    ]
  },
  {
    "key": "channels",
    "patterns": [
      "channel",
      "method",
      "how",
      "source"
    ],
    "templates": [
      "Which channels work best for reaching your audience?"
    ],
    "suggestions": [
      "Email",
      "LinkedIn",
      "Cold Calling",
      "Ads",
      "Mix of all"
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
      "What's your budget for lead generation? 💰"
    ],
    "suggestions": [
      "Under ₹25,000",
      "₹25,000 - ₹50,000",
      "₹50,000 - ₹1,00,000",
      "₹1,00,000+"
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
      "When do you want to start the campaign? ⏰"
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
