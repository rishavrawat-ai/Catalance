export const service = "Website Development";
export const openingMessage = "Hi there! 🚀 Ready to build something awesome? Let's talk about your website project!";
export const questions = [
  {
    "key": "name",
    "patterns": [
      "name",
      "call you"
    ],
    "templates": [
      "Hey! 🚀 Let's build something amazing. What's your name?",
      "Hi there! Ready to create your website? What should I call you?"
    ],
    "suggestions": null
  },
  {
    "key": "company",
    "patterns": [
      "company",
      "project",
      "business"
    ],
    "templates": [
      "Nice to meet you, {name}! What's the project name?"
    ],
    "suggestions": null
  },
  {
    "key": "description",
    "patterns": [
      "building",
      "describe",
      "tell me",
      "about",
      "idea"
    ],
    "templates": [
      "In 1 simple sentence, describe your project in easy words. Example: An e-commerce website for my clothing brand.",
      "Briefly describe what you want to build (1 sentence)."
    ],
    "suggestions": null
  },
  {
    "key": "website_type",
    "patterns": [
      "type",
      "kind",
      "what website",
      "need"
    ],
    "templates": [
      "What kind of website do you need?"
    ],
    "suggestions": [
      "Landing Page",
      "Business Website",
      "Informational Website",
      "E-commerce",
      "Portfolio",
      "Web App",
      "Other"
    ]
  },
  {
    "key": "pages",
    "patterns": [
      "pages",
      "sections",
      "features"
    ],
    "templates": [
      "Every website includes: Home, About, Contact, Privacy Policy & Terms. What additional pages do you need? (Select all that apply)"
    ],
    "suggestions": [
      "Services",
      "Products",
      "Portfolio/Gallery",
      "Testimonials",
      "Blog",
      "FAQ",
      "Pricing",
      "Shop/Store",
      "Cart/Checkout",
      "Wishlist",
      "Order Tracking",
      "Reviews/Ratings",
      "Search",
      "Book Now",
      "Account/Login",
      "Admin Dashboard",
      "User Dashboard",
      "Analytics Dashboard",
      "Notifications",
      "Chat/Support Widget",
      "Help/Support",
      "Resources",
      "Events",
      "3D Animations",
      "3D Model Viewer",
      "None"
    ],
    "multiSelect": true
  },
  {
    "key": "integrations",
    "patterns": [
      "integration",
      "payment",
      "api",
      "third-party"
    ],
    "templates": [
      "What integrations do you need? (Select all that apply) 🔌"
    ],
    "suggestions": [
      "Payment Gateway (Razorpay/Stripe)",
      "Email Service (Nodemailer/Resend)",
      "Delivery/Shipping Tracking",
      "None"
    ],
    "multiSelect": true
  },
  {
    "key": "design",
    "patterns": [
      "design",
      "look",
      "style",
      "wireframe"
    ],
    "templates": [
      "Do you have any designs or inspirations in mind? 🎨"
    ],
    "suggestions": [
      "I have designs",
      "Need design help",
      "Have some references",
      "Not sure yet"
    ]
  },
  {
    "key": "tech",
    "patterns": [
      "tech",
      "platform",
      "wordpress",
      "react"
    ],
    "templates": [
      "What technology stack would you prefer? (Select one) 🛠️"
    ],
    "suggestions": [
      "WordPress",
      "Next.js",
      "React.js",
      "React.js + Node.js",
      "Shopify",
      "Shopify + Hydrogen (React)",
      "Laravel + Vue",
      "Django + React",
      "No preference"
    ]
  },
  {
    "key": "deployment",
    "patterns": [
      "deploy",
      "hosting",
      "server",
      "cloud"
    ],
    "templates": [
      "Where would you like the website deployed/hosted? (Select up to 2) 🚀"
    ],
    "suggestions": [
      "Vercel",
      "Netlify",
      "AWS",
      "DigitalOcean",
      "Railway",
      "Render",
      "VPS/Custom Server",
      "Not sure yet"
    ],
    "multiSelect": true,
    "maxSelect": 2
  },
  {
    "key": "domain",
    "patterns": [
      "domain",
      "url",
      "website name"
    ],
    "templates": [
      "Do you have a domain name? 🌍"
    ],
    "suggestions": [
      "I already have domain",
      "I don't have domain"
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
      "WordPress (₹30,000+)",
      "3D WordPress (₹45,000+)",
      "Shopify (₹30,000+)",
      "Custom Shopify (₹80,000+)",
      "Custom React.js + Node.js (₹1,50,000+)",
      "Next.js (₹1,75,000+)",
      "3D Custom Website (₹1,00,000 - ₹4,00,000)"
    ]
  },
  {
    "key": "timeline",
    "patterns": [
      "timeline",
      "deadline",
      "when",
      "launch"
    ],
    "templates": [
      "When do you need the website ready? ⏰"
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
