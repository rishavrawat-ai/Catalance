export const service = "Video Services";
export const openingMessage = "Hey! 🎬 I'm here to help you create an amazing video. Let's figure out exactly what you need!";
export const serviceDetails = `Sub-types: Reels/Shorts, Explainer Videos, Ad Films, Corporate Videos
Deliverables: Script & storyboard, editing & motion graphics, multiple export formats
Pricing: Reels ₹1,500–₹5,000/video | Explainer ₹10,000–₹40,000 | Ad video ₹5,000–₹25,000
Timelines: Full video project 7–14 days | Partial scope: Editing only 3–5 days (₹1,000–₹8,000), Script only 2–3 days (₹2,000–₹6,000)
Timeline policy: timelines include buffer days (10–20%); delays due to missing client inputs pause the timeline.`;
export const questions = [
  {
    "key": "name",
    "patterns": [
      "name",
      "call you"
    ],
    "templates": [
      "Hey! 🎬 Ready to create something amazing? What's your name?",
      "Hi there! Let's make some great video content. What should I call you?"
    ],
    "suggestions": null
  },
  {
    "key": "video_type",
    "patterns": [
      "type",
      "kind",
      "what video"
    ],
    "templates": [
      "Nice to meet you, {name}! What type of video are you looking for?"
    ],
    "suggestions": [
      "Promotional",
      "Social Media",
      "YouTube/Vlog",
      "Corporate",
      "Explainer/Animated",
      "Other"
    ]
  },
  {
    "key": "goal",
    "patterns": [
      "goal",
      "purpose",
      "objective",
      "why"
    ],
    "templates": [
      "Great choice! What's the main goal of this video? 🎯"
    ],
    "suggestions": [
      "Brand Awareness",
      "Lead Generation",
      "Engagement",
      "Product Launch"
    ]
  },
  {
    "key": "footage",
    "patterns": [
      "footage",
      "raw",
      "production",
      "shoot"
    ],
    "templates": [
      "Do you already have footage, or do you need full production? 📹"
    ],
    "suggestions": [
      "I have footage",
      "Need full production",
      "Not sure yet"
    ]
  },
  {
    "key": "duration",
    "patterns": [
      "duration",
      "length",
      "how long",
      "seconds",
      "minutes"
    ],
    "templates": [
      "How long should the final video be?"
    ],
    "suggestions": [
      "Under 30 seconds",
      "30-60 seconds",
      "1-3 minutes",
      "3+ minutes"
    ]
  },
  {
    "key": "style",
    "patterns": [
      "style",
      "mood",
      "tone",
      "vibe",
      "feel"
    ],
    "templates": [
      "What style or mood are you going for? 🎨"
    ],
    "suggestions": [
      "Professional",
      "Fun/Energetic",
      "Emotional",
      "Cinematic",
      "Educational"
    ]
  },
  {
    "key": "platforms",
    "patterns": [
      "platform",
      "where",
      "publish",
      "channel",
      "social"
    ],
    "templates": [
      "Where will this video be shared?"
    ],
    "suggestions": [
      "Website",
      "YouTube",
      "Instagram",
      "LinkedIn",
      "TikTok",
      "Multiple"
    ]
  },
  {
    "key": "budget",
    "patterns": [
      "budget",
      "cost",
      "price",
      "spend"
    ],
    "templates": [
      "What's your budget for this project? 💰"
    ],
    "suggestions": [
      "Under ₹25,000",
      "₹25,000 - ₹60,000",
      "₹60,000 - ₹1,25,000",
      "₹1,25,000+"
    ]
  },
  {
    "key": "timeline",
    "patterns": [
      "timeline",
      "deadline",
      "when",
      "delivery"
    ],
    "templates": [
      "When do you need the final video? ⏰"
    ],
    "suggestions": [
      "Within 1 week",
      "2-4 weeks",
      "1-2 months",
      "Flexible"
    ]
  },
  {
    "key": "notes",
    "patterns": [
      "notes",
      "else",
      "anything",
      "special",
      "reference"
    ],
    "templates": [
      "Any special requests or reference videos you'd like to share? (Optional - just type 'done' to skip)"
    ],
    "suggestions": [
      "Skip this"
    ]
  }
];

const chatbot = { service, openingMessage, questions, serviceDetails };
export default chatbot;
