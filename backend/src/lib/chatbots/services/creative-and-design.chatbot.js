export const service = "Creative & Design";
export const openingMessage = "Hey! 🎨 Let's create something beautiful together. Tell me about your design needs!";
export const serviceDetails = `Sub-types: Logo Design, Branding Kit, UI/UX Design, Marketing Creatives
Deliverables: Design concepts, revisions, final source files
Pricing: Logo ₹8,000–₹30,000 | Branding kit ₹40,000–₹1,50,000 | UI/UX ₹1,500–₹3,000/screen
Timelines: Full branding project 3–5 weeks | Partial scope: Logo only 7–10 days (₹8,000–₹30,000), Single creative set 3–5 days (₹3,000–₹10,000)
Timeline policy: timelines are in working days; 10–20% buffer included; delays due to missing client inputs pause the timeline.`;
export const questions = [
  {
    "key": "name",
    "patterns": [
      "name",
      "call you"
    ],
    "templates": [
      "Hey! 🎨 Let's create something beautiful. What's your name?"
    ],
    "suggestions": null
  },
  {
    "key": "company",
    "patterns": [
      "company",
      "brand",
      "business"
    ],
    "templates": [
      "Nice to meet you, {name}! What's your company or brand called?"
    ],
    "suggestions": null
  },
  {
    "key": "design_type",
    "patterns": [
      "type",
      "need",
      "looking for",
      "want"
    ],
    "templates": [
      "What kind of design work do you need? ✨"
    ],
    "suggestions": [
      "Logo",
      "Branding",
      "Social Media Graphics",
      "UI/UX",
      "Print Design",
      "Other"
    ]
  },
  {
    "key": "style",
    "patterns": [
      "style",
      "look",
      "vibe",
      "aesthetic"
    ],
    "templates": [
      "What style or vibe are you going for?"
    ],
    "suggestions": [
      "Modern/Minimal",
      "Bold/Colorful",
      "Elegant/Luxury",
      "Playful/Fun",
      "Not sure yet"
    ]
  },
  {
    "key": "deliverables",
    "patterns": [
      "deliver",
      "files",
      "formats",
      "need"
    ],
    "templates": [
      "What deliverables do you need?"
    ],
    "suggestions": [
      "Logo files",
      "Social templates",
      "Brand guidelines",
      "Print-ready files",
      "All of it"
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
      "What's your budget for this project? 💰"
    ],
    "suggestions": [
      "Under ₹10,000",
      "₹10,000 - ₹25,000",
      "₹25,000 - ₹50,000",
      "₹50,000+"
    ]
  },
  {
    "key": "timeline",
    "patterns": [
      "timeline",
      "when",
      "deadline"
    ],
    "templates": [
      "When do you need this done? ⏰"
    ],
    "suggestions": [
      "This week",
      "1-2 weeks",
      "1 month",
      "Flexible"
    ]
  }
];

const chatbot = { service, openingMessage, questions, serviceDetails };
export default chatbot;
