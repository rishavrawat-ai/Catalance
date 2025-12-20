export const service = "default";
export const openingMessage = "Hey there! 👋 I'm excited to help you with your project. Let's get started!";
export const questions = [
  {
    "key": "name",
    "patterns": [
      "name",
      "call you",
      "who are you"
    ],
    "templates": [
      "Hey there! 👋 Before we dive in, what should I call you?",
      "Hi! I'm excited to help. What's your name?"
    ],
    "suggestions": null
  },
  {
    "key": "company",
    "patterns": [
      "company",
      "project name",
      "business",
      "brand"
    ],
    "templates": [
      "Nice to meet you, {name}! 🎉 What's your company or project called?",
      "Great to have you here, {name}! What's the name of your project?",
      "Nice to meet you, {name}! What's the project name?",
      "Great to have you here, {name}! What's the project name?"
    ],
    "suggestions": null
  },
  {
    "key": "description",
    "patterns": [
      "building",
      "describe",
      "tell me about",
      "project",
      "idea"
    ],
    "templates": [
      "In 1 simple sentence, describe your project in easy words. Example: A website to showcase my services and get leads.",
      "Briefly describe what you want to build (1 sentence)."
    ],
    "suggestions": null
  },
  {
    "key": "budget",
    "patterns": [
      "budget",
      "spend",
      "cost",
      "price",
      "inr",
      "₹"
    ],
    "templates": [
      "And what kind of budget are we working with? (Just a rough range in INR is fine!) 💰",
      "What budget do you have in mind for this? Even a ballpark helps!"
    ],
    "suggestions": [
      "Under ₹25,000",
      "₹25,000 - ₹50,000",
      "₹50,000 - ₹1,00,000",
      "₹1,00,000+",
      "Flexible"
    ]
  },
  {
    "key": "timeline",
    "patterns": [
      "timeline",
      "deadline",
      "when",
      "launch",
      "delivery",
      "complete"
    ],
    "templates": [
      "When are you hoping to have this ready? No pressure if you're flexible! ⏰",
      "What's your ideal timeline for this project?"
    ],
    "suggestions": [
      "1-2 weeks",
      "1 month",
      "2-3 months",
      "Flexible"
    ]
  }
];

const chatbot = { service, openingMessage, questions };
export default chatbot;
