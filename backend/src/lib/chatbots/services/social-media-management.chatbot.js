export const service = "Social Media Management";
export const openingMessage = "Hey! Let's grow your social presence. Tell me about your goals.";
export const serviceDetails = `Sub-types: Instagram, LinkedIn, Facebook, YouTube
Deliverables: Content calendar, creatives & captions, posting & engagement, monthly analytics
Pricing: Basic ₹15,000/month | Standard ₹25,000–₹40,000/month | Premium ₹50,000+/month
Timelines: Monthly engagement | Partial scope: Content creation only 10–15 days (₹10,000–₹25,000), Posting only monthly (₹5,000–₹15,000)
Timeline policy: timelines are in working days; 10–20% buffer included; delays due to missing client inputs pause the timeline.`;
export const questions = [
  {
    "key": "name",
    "patterns": [
      "name",
      "call you"
    ],
    "templates": [
      "Hey! Let's grow your social presence. What's your name?"
    ],
    "suggestions": null
  },
  {
    "key": "brand",
    "patterns": [
      "brand",
      "business",
      "company"
    ],
    "templates": [
      "Nice, {name}! What's your brand or business called?"
    ],
    "suggestions": null
  },
  {
    "key": "platforms",
    "patterns": [
      "platform",
      "social",
      "channel"
    ],
    "templates": [
      "Which platforms do you want to focus on?"
    ],
    "suggestions": [
      "Instagram",
      "Facebook",
      "LinkedIn",
      "Twitter/X",
      "TikTok",
      "All of them"
    ]
  },
  {
    "key": "goals",
    "patterns": [
      "goal",
      "achieve",
      "want"
    ],
    "templates": [
      "What are your main goals with social media? (Select all that apply)"
    ],
    "suggestions": [
      "Grow followers",
      "Increase engagement",
      "Brand awareness",
      "Leads/Sales",
      "Drive website traffic",
      "Build personal brand",
      "Customer support"
    ],
    "multiSelect": true,
    "maxSelect": 3
  },
  {
    "key": "content",
    "patterns": [
      "content",
      "posts",
      "create"
    ],
    "templates": [
      "Do you need help with content creation too?"
    ],
    "suggestions": [
      "Yes, full content",
      "Just scheduling",
      "Strategy only",
      "All of it"
    ]
  },
  {
    "key": "deliverables_quantity",
    "patterns": [
      "deliverables",
      "quantity",
      "posts",
      "reels",
      "stories"
    ],
    "templates": [
      "How many deliverables do you need per month? (e.g., 12 posts, 4 reels, 8 stories)"
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
      "What's your monthly budget?"
    ],
    "suggestions": [
      "Under ₹15,000/mo",
      "₹15,000 - ₹30,000/mo",
      "₹30,000 - ₹50,000/mo",
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
      "How long would you like to run social media management? (Select a duration in months)"
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




