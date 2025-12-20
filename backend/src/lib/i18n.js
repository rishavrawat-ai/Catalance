const LOCALE_LABELS = Object.freeze({
  en: "English",
  hi: "Hindi",
  bn: "Bengali",
  pa: "Punjabi",
  gu: "Gujarati",
  ta: "Tamil",
  te: "Telugu",
  kn: "Kannada",
  ml: "Malayalam",
  mr: "Marathi",
  ne: "Nepali",
  ur: "Urdu",
  ar: "Arabic",
  he: "Hebrew",
  ru: "Russian",
  uk: "Ukrainian",
  el: "Greek",
  th: "Thai",
  ja: "Japanese",
  ko: "Korean",
  zh: "Chinese (Simplified)",
  es: "Spanish",
  fr: "French",
  de: "German",
  it: "Italian",
  pt: "Portuguese",
  nl: "Dutch",
  tr: "Turkish",
  id: "Indonesian",
  vi: "Vietnamese",
});

const normalizeText = (value = "") => (value || "").toString().trim();

export const canonicalizeForI18n = (value = "") =>
  normalizeText(value)
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "");

export const detectLocaleFromScript = (text = "") => {
  const sample = normalizeText(text);
  if (!sample) return null;

  // Order matters: Japanese uses Han, so check it before Han; same for Korean.
  const scriptRules = [
    { re: /\p{Script=Devanagari}/u, locale: "hi" },
    { re: /\p{Script=Bengali}/u, locale: "bn" },
    { re: /\p{Script=Gurmukhi}/u, locale: "pa" },
    { re: /\p{Script=Gujarati}/u, locale: "gu" },
    { re: /\p{Script=Tamil}/u, locale: "ta" },
    { re: /\p{Script=Telugu}/u, locale: "te" },
    { re: /\p{Script=Kannada}/u, locale: "kn" },
    { re: /\p{Script=Malayalam}/u, locale: "ml" },
    { re: /\p{Script=Arabic}/u, locale: "ar" },
    { re: /\p{Script=Hebrew}/u, locale: "he" },
    { re: /\p{Script=Cyrillic}/u, locale: "ru" },
    { re: /\p{Script=Greek}/u, locale: "el" },
    { re: /\p{Script=Thai}/u, locale: "th" },
    { re: /\p{Script=Hangul}/u, locale: "ko" },
    { re: /\p{Script=Hiragana}|\p{Script=Katakana}/u, locale: "ja" },
    { re: /\p{Script=Han}/u, locale: "zh" },
  ];

  for (const rule of scriptRules) {
    if (rule.re.test(sample)) return rule.locale;
  }

  return null;
};

const countLetters = (text = "") => (normalizeText(text).match(/[\p{L}]/gu) || []).length;

const countWords = (text = "") =>
  normalizeText(text)
    .split(/\s+/)
    .filter(Boolean).length;

export const shouldDetectLocaleFromMessage = ({
  message,
  existingLocale = null,
  isNewConversation = false,
} = {}) => {
  const text = normalizeText(message);
  if (!text) return false;

  // Always detect on the very first meaningful user message.
  if (isNewConversation) return true;

  // Avoid flipping locales on short option clicks like "Vercel" / "None".
  const letters = countLetters(text);
  const words = countWords(text);
  const hasSentencePunctuation = /[.!?？؟]/u.test(text);

  if (letters >= 18) return true;
  if (words >= 4) return true;
  if (hasSentencePunctuation && letters >= 8) return true;

  // If we have no locale yet (or it was reset), allow detection on shorter messages.
  if (!existingLocale) return letters >= 3 || words >= 2;

  return false;
};

const parseLocaleFromModelOutput = (value = "") => {
  const raw = normalizeText(value).toLowerCase();
  if (!raw) return "en";

  const codeMatch = raw.match(/\b[a-z]{2}(?:-[a-z]{2})?\b/);
  if (codeMatch) {
    const code = codeMatch[0].toLowerCase();
    return code.startsWith("zh") ? "zh" : code.slice(0, 2);
  }

  const byName = Object.entries(LOCALE_LABELS).find(([, label]) =>
    raw.includes(label.toLowerCase())
  );
  return byName ? byName[0] : "en";
};

export const detectLocaleWithAI = async (
  openai,
  text,
  { model, fallbackModel } = {}
) => {
  const sample = normalizeText(text);
  if (!sample) return "en";

  const messages = [
    {
      role: "system",
      content:
        "Identify the language of the user's text. " +
        "Return ONLY a lowercase ISO 639-1 language code like 'en', 'hi', 'es', 'ar', 'ru', 'zh', 'ja'. " +
        "If the text is mixed/unclear, return 'en'.",
    },
    { role: "user", content: sample.slice(0, 600) },
  ];

  let completion;
  try {
    completion = await openai.chat.completions.create({
      model,
      messages,
      // Some reasoning models may spend tokens on hidden reasoning; allow enough
      // room to still emit the final 2-letter code.
      max_tokens: 60,
      temperature: 0,
    });
  } catch (error) {
    if (error?.status === 429 && fallbackModel) {
      completion = await openai.chat.completions.create({
        model: fallbackModel,
        messages,
        max_tokens: 60,
        temperature: 0,
      });
    } else {
      throw error;
    }
  }

  const msg = completion?.choices?.[0]?.message || null;
  const content = msg?.content || msg?.reasoning || "";
  return parseLocaleFromModelOutput(content);
};

const translationCache = new Map(); // key: `${locale}::${text}` -> translated string
const arrayItemTranslationCache = new Map(); // key: `${locale}::${item}` -> translated string

export const translateTextWithAI = async (
  openai,
  text,
  { targetLocale, model, fallbackModel, maxTokens = 900 } = {}
) => {
  const input = (text || "").toString();
  const locale = targetLocale || "en";
  if (locale === "en") return input;
  if (!input.trim()) return input;

  const cacheKey = `${locale}::${input}`;
  if (input.length <= 400 && translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey);
  }

  const languageLabel = LOCALE_LABELS[locale] || `locale ${locale}`;
  const lines = input.split(/\r?\n/);
  const pieces = [];
  const translateInputs = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    if (!line.trim()) {
      pieces.push({ type: "raw", value: line });
      continue;
    }

    const leading = line.match(/^\s*/)?.[0] || "";
    const trailing = line.match(/\s*$/)?.[0] || "";
    const core = line.slice(leading.length, line.length - trailing.length);

    if (!core) {
      pieces.push({ type: "raw", value: line });
      continue;
    }

    const idx = translateInputs.length;
    translateInputs.push(core);
    pieces.push({ type: "xlate", leading, trailing, index: idx });
  }

  let translatedInputs = translateInputs;
  if (translateInputs.length) {
    const messages = [
      {
        role: "system",
        content:
          `Translate each string in the provided JSON array into ${languageLabel} (language code: ${locale}). ` +
          "Translate literally and preserve punctuation/casing. " +
          "Do NOT add bullet points, examples, or extra sentences. " +
          "Return ONLY valid JSON array of strings, same length and order.",
      },
      { role: "user", content: JSON.stringify(translateInputs) },
    ];

    let completion;
    try {
      completion = await openai.chat.completions.create({
        model,
        messages,
        max_tokens: maxTokens,
        temperature: 0,
      });
    } catch (error) {
      if (error?.status === 429 && fallbackModel) {
        try {
          completion = await openai.chat.completions.create({
            model: fallbackModel,
            messages,
            max_tokens: maxTokens,
            temperature: 0,
          });
        } catch {
          completion = null;
        }
      } else {
        completion = null;
      }
    }

    const msg = completion?.choices?.[0]?.message || null;
    const raw = (msg?.content || msg?.reasoning || "").trim();
    if (raw) {
      try {
        const jsonCandidate = (() => {
          const match = raw.match(/\[[\s\S]*\]/);
          return match ? match[0] : raw;
        })();

        const parsed = JSON.parse(jsonCandidate);
        if (Array.isArray(parsed) && parsed.length === translateInputs.length) {
          translatedInputs = parsed.map((value, index) =>
            typeof value === "string" && value ? value : translateInputs[index]
          );
        }
      } catch {
        // Keep original inputs as a safe fallback.
        translatedInputs = translateInputs;
      }
    }
  }

  const output = pieces
    .map((piece) => {
      if (piece.type === "raw") return piece.value;
      const translated = translatedInputs[piece.index] ?? translateInputs[piece.index] ?? "";
      return `${piece.leading || ""}${translated}${piece.trailing || ""}`;
    })
    .join("\n");
  // Only cache when we actually changed something; if the model fails and we fall back
  // to the original text, caching would permanently disable translations for that key.
  if (input.length <= 400 && output.trim() && output !== input) {
    translationCache.set(cacheKey, output);
  }
  return output;
};

export const translateArrayWithAI = async (
  openai,
  items,
  { targetLocale, model, fallbackModel } = {}
) => {
  const locale = targetLocale || "en";
  const list = Array.isArray(items) ? items : [];
  if (locale === "en" || list.length === 0) return list;

  const resolved = new Array(list.length);
  const missingIndices = [];
  const missingItems = [];

  for (let i = 0; i < list.length; i++) {
    const item = (list[i] || "").toString();
    const cacheKey = `${locale}::${item}`;
    if (arrayItemTranslationCache.has(cacheKey)) {
      resolved[i] = arrayItemTranslationCache.get(cacheKey);
    } else {
      missingIndices.push(i);
      missingItems.push(item);
    }
  }

  if (missingItems.length === 0) {
    return resolved.map((value, idx) => (value ? value : list[idx]));
  }

  const languageLabel = LOCALE_LABELS[locale] || `locale ${locale}`;
  const maxTokens = Math.min(900, Math.max(220, 80 + missingItems.length * 20));
  const messages = [
    {
      role: "system",
      content:
        `Translate each string in the provided JSON array into ${languageLabel} (language code: ${locale}). ` +
        "Keep each item short, preserve meaning, and do not add numbering. " +
        "Return ONLY valid JSON array of strings, same length and order.",
    },
    { role: "user", content: JSON.stringify(missingItems) },
  ];

  let completion;
  try {
    completion = await openai.chat.completions.create({
      model,
      messages,
      max_tokens: maxTokens,
      temperature: 0,
    });
  } catch (error) {
    if (error?.status === 429 && fallbackModel) {
      completion = await openai.chat.completions.create({
        model: fallbackModel,
        messages,
        max_tokens: maxTokens,
        temperature: 0,
      });
    } else {
      // Best-effort: keep any cached translations, fall back to original labels.
      return resolved.map((value, idx) => (value ? value : list[idx]));
    }
  }

  const msg = completion?.choices?.[0]?.message || null;
  const raw = (msg?.content || msg?.reasoning || "").trim();
  const content = raw;
  try {
    const jsonCandidate = (() => {
      if (!content) return "";
      const match = content.match(/\[[\s\S]*\]/);
      return match ? match[0] : content;
    })();

    const parsed = JSON.parse(jsonCandidate);
    if (Array.isArray(parsed) && parsed.length === missingItems.length) {
      for (let j = 0; j < parsed.length; j++) {
        const translatedRaw = parsed[j];
        const translated =
          typeof translatedRaw === "string" && translatedRaw.trim()
            ? translatedRaw.trim()
            : missingItems[j];
        const original = missingItems[j];
        const index = missingIndices[j];
        const cacheKey = `${locale}::${original}`;
        arrayItemTranslationCache.set(cacheKey, translated);
        resolved[index] = translated;
      }
    }
  } catch {
    // fall through
  }

  return resolved.map((value, idx) => (value ? value : list[idx]));
};

const SUGGESTION_TAG_REGEX = /\[(SUGGESTIONS|MULTI_SELECT):\s*([\s\S]*?)\]/i;
const MAX_SELECT_TAG_REGEX = /\[MAX_SELECT:\s*(\d+)\s*\]/i;
const QUESTION_KEY_TAG_REGEX = /\[QUESTION_KEY:\s*([^\]]+)\]/i;
const PROPOSAL_BLOCK_REGEX = /\[PROPOSAL_DATA\][\s\S]*?\[\/PROPOSAL_DATA\]/g;

const parseChoiceTags = (reply = "") => {
  const original = (reply || "").toString();
  const questionKeyMatch = original.match(QUESTION_KEY_TAG_REGEX);
  const questionKey = questionKeyMatch?.[1]?.trim() || null;

  const maxSelectMatch = original.match(MAX_SELECT_TAG_REGEX);
  const maxSelect = maxSelectMatch ? Number.parseInt(maxSelectMatch[1], 10) : null;

  const suggestionMatch = original.match(SUGGESTION_TAG_REGEX);
  const suggestionTag = suggestionMatch?.[1]?.toUpperCase() || null;
  const suggestionOptions = suggestionMatch?.[2]
    ? suggestionMatch[2].split("|").map((s) => s.trim()).filter(Boolean)
    : [];

  let body = original;
  if (suggestionMatch) body = body.replace(suggestionMatch[0], "");
  if (maxSelectMatch) body = body.replace(maxSelectMatch[0], "");
  if (questionKeyMatch) body = body.replace(questionKeyMatch[0], "");

  return {
    body: body.trimEnd(),
    questionKey,
    maxSelect: Number.isFinite(maxSelect) ? maxSelect : null,
    suggestionTag,
    suggestionOptions,
  };
};

const rebuildWithChoiceTags = ({
  body,
  questionKey,
  maxSelect,
  suggestionTag,
  suggestionOptions,
} = {}) => {
  let out = (body || "").toString().trimEnd();

  if (suggestionTag && Array.isArray(suggestionOptions) && suggestionOptions.length) {
    out += `${out ? "\n" : ""}[${suggestionTag}: ${suggestionOptions.join(" | ")}]`;
  }
  if (Number.isFinite(maxSelect) && maxSelect > 0) {
    out += `${out ? "\n" : ""}[MAX_SELECT: ${maxSelect}]`;
  }
  if (questionKey) {
    out += `${out ? "\n" : ""}[QUESTION_KEY: ${questionKey}]`;
  }
  return out;
};

export const translateAssistantReply = async (
  openai,
  reply,
  { targetLocale, model, fallbackModel } = {}
) => {
  const locale = targetLocale || "en";
  const input = (reply || "").toString();
  if (!input.trim() || locale === "en") {
    return { reply: input, lastOptions: null };
  }

  const blocks = [...input.matchAll(PROPOSAL_BLOCK_REGEX)];
  if (!blocks.length) {
    const parsed = parseChoiceTags(input);

    const translatedBody = await translateTextWithAI(openai, parsed.body, {
      targetLocale: locale,
      model,
      fallbackModel,
      maxTokens: 900,
    });

    const translatedOptions = parsed.suggestionTag
      ? await translateArrayWithAI(openai, parsed.suggestionOptions, {
          targetLocale: locale,
          model,
          fallbackModel,
        })
      : parsed.suggestionOptions;

    const translatedReply = rebuildWithChoiceTags({
      body: translatedBody,
      questionKey: parsed.questionKey,
      maxSelect: parsed.maxSelect,
      suggestionTag: parsed.suggestionTag,
      suggestionOptions: translatedOptions,
    });

    const lastOptions =
      parsed.questionKey && parsed.suggestionTag && parsed.suggestionOptions.length
        ? {
            questionKey: parsed.questionKey,
            map: Object.fromEntries(
              translatedOptions
                .map((label, index) => {
                  const canon = canonicalizeForI18n(label);
                  const original = parsed.suggestionOptions[index];
                  return canon && original ? [canon, original] : null;
                })
                .filter(Boolean)
            ),
          }
        : null;

    return { reply: translatedReply, lastOptions };
  }

  // Reply contains one or more proposal blocks. Translate non-proposal segments
  // and (best-effort) translate the proposal bodies while keeping tags intact.
  let cursor = 0;
  const parts = [];
  let lastOptions = null;

  for (const match of blocks) {
    const start = match.index ?? 0;
    const end = start + match[0].length;

    const before = input.slice(cursor, start);
    if (before.trim()) {
      const translated = await translateAssistantReply(openai, before, {
        targetLocale: locale,
        model,
        fallbackModel,
      });
      parts.push(translated.reply);
      if (translated.lastOptions) lastOptions = translated.lastOptions;
    } else {
      parts.push(before);
    }

    const proposalMatch = match[0].match(
      /^\[PROPOSAL_DATA\]([\s\S]*?)\[\/PROPOSAL_DATA\]$/
    );
    if (proposalMatch) {
      const inner = proposalMatch[1];
      const translatedInner = await translateTextWithAI(openai, inner, {
        targetLocale: locale,
        model,
        fallbackModel,
        maxTokens: 1400,
      });
      parts.push(`[PROPOSAL_DATA]${translatedInner}[/PROPOSAL_DATA]`);
    } else {
      parts.push(match[0]);
    }

    cursor = end;
  }

  const after = input.slice(cursor);
  if (after.trim()) {
    const translated = await translateAssistantReply(openai, after, {
      targetLocale: locale,
      model,
      fallbackModel,
    });
    parts.push(translated.reply);
    if (translated.lastOptions) lastOptions = translated.lastOptions;
  } else {
    parts.push(after);
  }

  return { reply: parts.join(""), lastOptions };
};
