const normalizeText = (value = "") => (value || "").toString().trim();

export const canonicalizeForI18n = (value = "") =>
  normalizeText(value)
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "");

export const detectLocalePreference = () => null;
export const detectLocaleFromScript = () => null;
export const detectLocaleWithAI = async () => "en";
export const isLikelyHinglish = () => false;

export const translateTextWithAI = async (_openai, text) => (text || "").toString();
export const translateArrayWithAI = async (_openai, items) =>
  Array.isArray(items) ? items : [];

export const translateQuestionBodyWithAI = async (_openai, reply) =>
  (reply || "").toString();

export const translateReplyBodyWithAI = async (_openai, reply) =>
  (reply || "").toString();

export const translateAssistantReply = async (_openai, reply) => ({
  reply: (reply || "").toString(),
  lastOptions: null,
});
