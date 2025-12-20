export const service = "Audio Services";
export const openingMessage = "Hey! 🎙️ Let's create some amazing audio together!";
export const questions = [
  {
    "key": "name",
    "patterns": [
      "name",
      "call you"
    ],
    "templates": [
      "Hey! 🎙️ Let's create some amazing audio. What's your name?"
    ],
    "suggestions": null
  },
  {
    "key": "audio_type",
    "patterns": [
      "type",
      "kind",
      "need",
      "audio"
    ],
    "templates": [
      "Nice, {name}! What type of audio work do you need?"
    ],
    "suggestions": [
      "Voiceover",
      "Podcast editing",
      "Music/Jingle",
      "Sound design",
      "Mixing/Mastering",
      "Other"
    ]
  },
  {
    "key": "purpose",
    "patterns": [
      "purpose",
      "for",
      "use",
      "goal"
    ],
    "templates": [
      "What's this audio for? 🎵"
    ],
    "suggestions": [
      "Commercial/Ad",
      "Podcast",
      "YouTube",
      "Corporate",
      "Music release",
      "Other"
    ]
  },
  {
    "key": "duration",
    "patterns": [
      "duration",
      "long",
      "length",
      "minutes"
    ],
    "templates": [
      "How long will the final audio be?"
    ],
    "suggestions": [
      "Under 1 minute",
      "1-5 minutes",
      "5-30 minutes",
      "30+ minutes"
    ]
  },
  {
    "key": "voice",
    "patterns": [
      "voice",
      "talent",
      "speaker"
    ],
    "templates": [
      "Do you need voice talent?"
    ],
    "suggestions": [
      "Male voice",
      "Female voice",
      "I'll provide recordings",
      "Not needed"
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
      "When do you need the final audio? ⏰"
    ],
    "suggestions": [
      "This week",
      "1-2 weeks",
      "1 month",
      "Flexible"
    ]
  }
];

const chatbot = { service, openingMessage, questions };
export default chatbot;
