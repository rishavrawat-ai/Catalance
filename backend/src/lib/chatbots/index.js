import defaultChatbot from "./services/default.chatbot.js";
import videoServicesChatbot from "./services/video-services.chatbot.js";
import websiteDevelopmentChatbot from "./services/website-development.chatbot.js";
import appDevelopmentChatbot from "./services/app-development.chatbot.js";
import softwareDevelopmentChatbot from "./services/software-development.chatbot.js";
import leadGenerationChatbot from "./services/lead-generation.chatbot.js";
import seoOptimizationChatbot from "./services/seo-optimization.chatbot.js";
import socialMediaManagementChatbot from "./services/social-media-management.chatbot.js";
import performanceMarketingChatbot from "./services/performance-marketing.chatbot.js";
import creativeAndDesignChatbot from "./services/creative-and-design.chatbot.js";
import writingAndContentChatbot from "./services/writing-and-content.chatbot.js";
import customerSupportChatbot from "./services/customer-support.chatbot.js";
import audioServicesChatbot from "./services/audio-services.chatbot.js";
import influencerUgcMarketingChatbot from "./services/influencer-ugc-marketing.chatbot.js";
import crmAndErpSolutionsChatbot from "./services/crm-and-erp-solutions.chatbot.js";
import aiAutomationChatbot from "./services/ai-automation.chatbot.js";
import whatsappChatBotChatbot from "./services/whatsapp-chat-bot.chatbot.js";

export const CHATBOTS_BY_SERVICE = Object.freeze({
  [defaultChatbot.service]: defaultChatbot,
  [videoServicesChatbot.service]: videoServicesChatbot,
  [websiteDevelopmentChatbot.service]: websiteDevelopmentChatbot,
  [appDevelopmentChatbot.service]: appDevelopmentChatbot,
  [softwareDevelopmentChatbot.service]: softwareDevelopmentChatbot,
  [leadGenerationChatbot.service]: leadGenerationChatbot,
  [seoOptimizationChatbot.service]: seoOptimizationChatbot,
  [socialMediaManagementChatbot.service]: socialMediaManagementChatbot,
  [performanceMarketingChatbot.service]: performanceMarketingChatbot,
  [creativeAndDesignChatbot.service]: creativeAndDesignChatbot,
  [writingAndContentChatbot.service]: writingAndContentChatbot,
  [customerSupportChatbot.service]: customerSupportChatbot,
  [audioServicesChatbot.service]: audioServicesChatbot,
  [influencerUgcMarketingChatbot.service]: influencerUgcMarketingChatbot,
  [crmAndErpSolutionsChatbot.service]: crmAndErpSolutionsChatbot,
  [aiAutomationChatbot.service]: aiAutomationChatbot,
  [whatsappChatBotChatbot.service]: whatsappChatBotChatbot,
});

export const getChatbot = (service) => {
  const key = (service || "").toString().trim();
  if (key && CHATBOTS_BY_SERVICE[key]) {
    return CHATBOTS_BY_SERVICE[key];
  }
  return CHATBOTS_BY_SERVICE[defaultChatbot.service];
};

export const getChatbotQuestions = (service) => getChatbot(service).questions;
export const getChatbotOpeningMessage = (service) =>
  getChatbot(service).openingMessage;
