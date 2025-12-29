/**
 * Conversation State Machine for Chatbot
 * 
 * Deterministic state tracking to prevent:
 * - Context loss
 * - Question repetition
 * - Robotic tone
 */

import { CHATBOTS_BY_SERVICE, getChatbot } from "./chatbots/index.js";
import { getServiceDefinition } from "./service-catalog.js";

export const SERVICE_QUESTIONS_MAP = Object.freeze(
    Object.fromEntries(
        Object.entries(CHATBOTS_BY_SERVICE).map(([service, chatbot]) => [
            service,
            chatbot.questions,
        ])
    )
);

const resolveServiceQuestions = (service = "") => {
    const definition = getServiceDefinition(service);
    if (definition && Array.isArray(definition.fields) && definition.fields.length) {
        return { questions: definition.fields, source: "catalog", definition };
    }
    const chatbot = getChatbot(service);
    return { questions: chatbot?.questions || [], source: "chatbot", definition: null };
};

const QUESTION_KEY_TAG_REGEX = /\[QUESTION_KEY:\s*([^\]]+)\]/i;

const normalizeText = (value = "") => (value || "").toString().trim();

const resolveQuestionKey = (question = {}, index = 0) =>
    question.key ||
    question.field ||
    question.name ||
    question.answerKey ||
    question.id ||
    question.questionId ||
    question.question_id ||
    `q${index + 1}`;

const resolveQuestionId = (question = {}, key = "", index = 0) =>
    question.id || question.questionId || question.question_id || key || `q${index + 1}`;

const resolveNextQuestionId = (question = {}) => {
    const next =
        question.nextId ||
        question.nextQuestionId ||
        question.next;
    if (next === null || next === undefined) return null;
    if (typeof next === "string") {
        const trimmed = next.trim();
        return trimmed ? trimmed : null;
    }
    return String(next);
};

const resolveAnswerType = (question = {}) =>
    question.answerType ||
    question.expectedAnswerType ||
    (question.multiSelect ? "multi_select" : null) ||
    (Array.isArray(question.suggestions) && question.suggestions.length
        ? "single_select"
        : "text");

const resolveLocaleTemplates = (question = {}) => {
    const candidate =
        question.templatesByLocale ||
        question.templatesByLanguage ||
        question.templatesByLang ||
        question.textByLocale ||
        question.questionByLocale ||
        question.promptByLocale ||
        question.textsByLocale;

    if (candidate && typeof candidate === "object" && !Array.isArray(candidate)) {
        return candidate;
    }

    if (question.templates && typeof question.templates === "object" && !Array.isArray(question.templates)) {
        return question.templates;
    }

    return null;
};

const resolveTemplatesForLocale = (question = {}, locale = "en") => {
    const localeMap = resolveLocaleTemplates(question);
    const localeKey = (locale || "en").toString();
    if (localeMap) {
        const candidates = [
            localeKey,
            localeKey.toLowerCase(),
            localeKey.replace("_", "-"),
        ];
        if (localeKey.includes("-")) {
            const base = localeKey.split("-")[0];
            candidates.push(base, base.toLowerCase());
        }
        candidates.push("en", "en-us", "en-gb");

        for (const key of candidates) {
            if (!key) continue;
            const value = localeMap[key];
            if (Array.isArray(value)) return value;
            if (typeof value === "string") return [value];
        }
    }

    if (Array.isArray(question.templates)) return question.templates;
    if (typeof question.templates === "string") return [question.templates];
    if (typeof question.text === "string") return [question.text];
    if (typeof question.baseQuestion === "string") return [question.baseQuestion];
    if (typeof question.question === "string") return [question.question];
    if (typeof question.prompt === "string") return [question.prompt];

    return [];
};

const normalizeQuestions = (questions = []) => {
    const list = Array.isArray(questions) ? questions : [];
    return list.map((question, index) => {
        const key = resolveQuestionKey(question, index);
        const id = resolveQuestionId(question, key, index);
        const nextId = resolveNextQuestionId(question);
        const answerType = resolveAnswerType(question);
        return {
            ...question,
            key,
            id,
            nextId,
            answerType,
        };
    });
};

const orderQuestionsByFlow = (questions = []) => {
    const list = Array.isArray(questions) ? questions : [];
    if (!list.length) return [];

    const map = new Map();
    for (const question of list) {
        if (!map.has(question.id)) {
            map.set(question.id, question);
        }
    }

    const incoming = new Map();
    for (const question of list) {
        const nextId = question.nextId;
        if (!nextId) continue;
        incoming.set(nextId, (incoming.get(nextId) || 0) + 1);
    }

    const startQuestion =
        list.find((q) => q.start === true) ||
        list.find((q) => !incoming.has(q.id)) ||
        list[0];

    const ordered = [];
    const visited = new Set();
    let current = startQuestion;

    while (current && !visited.has(current.id)) {
        ordered.push(current);
        visited.add(current.id);
        current = current.nextId ? map.get(current.nextId) : null;
    }

    for (const question of list) {
        if (!visited.has(question.id)) {
            ordered.push(question);
        }
    }

    return ordered;
};

const escapeRegExp = (value = "") =>
    value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const canonicalize = (value = "") =>
    normalizeText(value)
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");

const canonicalizeForI18n = (value = "") =>
    normalizeText(value)
        .normalize("NFKC")
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, "");

const normalizeForSuggestionMatching = (value = "") => {
    const text = normalizeText(value).toLowerCase();
    if (!text) return "";

    return (
        text
            // Common shorthand users type in one-shot briefs.
            .replace(/\becom(m)?\b/g, "ecommerce")
            .replace(/\be-?\s*commerce\b/g, "ecommerce")
            // Normalize common feature nouns.
            .replace(/\bwish\s*list\b/g, "wishlist")
            .replace(/\breview\b/g, "reviews")
            .replace(/\brating\b/g, "ratings")
        // Keep punctuation as-is; tokenization happens later.
    );
};

const stripMarkdownFormatting = (value = "") => {
    let text = normalizeText(value);
    if (!text) return text;

    // Basic Markdown cleanup so regex-based extraction can work with inputs like **CartNest**.
    text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
    text = text.replace(/[*`~]/g, "");
    text = text.replace(/_{1,2}/g, "");

    return text.replace(/\s+/g, " ").trim();
};

const CHANGE_TECH_SENTINEL = "__CHANGE_TECH__";

const withMandatoryBrief = (questions = []) => {
    const list = Array.isArray(questions) ? questions : [];
    const hasExplicitFlow = list.some((q) =>
        Boolean(
            q?.nextId ||
            q?.nextQuestionId ||
            q?.next ||
            q?.questionId ||
            q?.id ||
            q?.start
        )
    );
    if (hasExplicitFlow) return list;
    const briefKeys = new Set([
        "brief",
        "summary",
        "description",
        "problem",
        "use_case",
        "business_info",
        "vision",
    ]);

    if (list.some((q, index) => briefKeys.has(resolveQuestionKey(q, index)))) return list;

    const briefQuestion = {
        key: "brief",
        patterns: ["brief", "summary", "overview", "requirements"],
        templates: ["Please share a short brief of what you need (2-3 lines)."],
        suggestions: null,
    };

    if (!list.length) return [briefQuestion];

    const insertIndex = Math.min(1, list.length);
    return [
        ...list.slice(0, insertIndex),
        briefQuestion,
        ...list.slice(insertIndex),
    ];
};

const isChangeTechnologyMessage = (value = "") => {
    const canon = canonicalize(value);
    if (!canon) return false;

    return (
        canon === "changetechnology" ||
        canon === "changetech" ||
        canon === "switchtechnology" ||
        canon === "switchtech" ||
        canon === "differenttechnology" ||
        canon === "chooseanothertechnology" ||
        canon === "chooseanothertech" ||
        canon === "changestack" ||
        canon === "switchstack" ||
        canon === "changeplatform" ||
        canon === "switchplatform"
    );
};

const getSuggestionAliases = (value = "") => {
    const text = normalizeText(value);
    if (!text) return [];

    const aliases = new Set([text]);

    const withoutParens = text
        .replace(/\s*\([^)]*\)\s*/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    if (withoutParens) aliases.add(withoutParens);

    const parenMatches = Array.from(text.matchAll(/\(([^)]+)\)/g));
    for (const match of parenMatches) {
        const inside = normalizeText(match[1]);
        if (!inside) continue;

        // Only treat parenthetical content as aliases when it contains explicit alternatives.
        // Example: "Payment Gateway (Razorpay/Stripe)" -> ["Razorpay", "Stripe"]
        // Avoid broad aliases like "(React)" which would match many unrelated options.
        if (/[\\/|,]/.test(inside)) {
            for (const part of inside.split(/[\\/|,]/)) {
                const cleaned = normalizeText(part);
                if (cleaned) aliases.add(cleaned);
            }
        }
    }

    for (const part of text.split(/[\\/|]/)) {
        const cleaned = normalizeText(part);
        if (cleaned) aliases.add(cleaned);
    }

    if (text.toLowerCase().endsWith(" yet")) {
        const noYet = text.slice(0, -4).trim();
        if (noYet) aliases.add(noYet);
    }

    for (const alias of Array.from(aliases)) {
        const withoutJs = alias
            .replace(/\.?\bjs\b/gi, "")
            .replace(/\s+/g, " ")
            .trim();
        // Avoid creating overly-generic aliases like "Next" from "Next.js".
        if (withoutJs && withoutJs !== alias && withoutJs.length >= 5) {
            aliases.add(withoutJs);
        }
    }

    return Array.from(aliases);
};

const matchSuggestionsInMessage = (question, rawMessage) => {
    const message = normalizeText(rawMessage);
    if (!message) return [];
    if (!Array.isArray(question?.suggestions) || question.suggestions.length === 0) {
        return [];
    }

    const messageLower = normalizeForSuggestionMatching(message);
    const messageCanonical = canonicalize(messageLower);
    const tokens = (messageLower.match(/[a-z0-9]+/gi) || []).map((t) =>
        canonicalize(t.toLowerCase())
    );
    const tokenSet = new Set(tokens.filter(Boolean));
    // Add common bigrams to support inputs like "next js" -> "nextjs".
    for (let i = 0; i < tokens.length - 1; i++) {
        const bigram = `${tokens[i]}${tokens[i + 1]}`;
        if (bigram) tokenSet.add(bigram);
    }
    const matches = [];

    for (const option of question.suggestions) {
        const optionText = normalizeText(option);
        if (!optionText) continue;

        let isMatch = false;

        // Handle composite options like "React.js + Node.js" where users often type "react and node".
        if (/[+&]/.test(optionText)) {
            const parts = optionText
                .split(/[+&]/)
                .map((part) => normalizeText(part.replace(/\([^)]*\)/g, "")))
                .filter(Boolean);

            const partCanons = parts
                .map((part) => canonicalize(part.toLowerCase()))
                .filter((canon) => canon && canon.length >= 3);

            if (partCanons.length >= 2) {
                const allPresent = partCanons.every(
                    (canon) => tokenSet.has(canon) || messageCanonical.includes(canon)
                );
                if (allPresent) isMatch = true;
            }
        }

        if (!isMatch) {
            const aliases = getSuggestionAliases(optionText);
            for (const alias of aliases) {
                const aliasLower = normalizeText(alias).toLowerCase();
                const aliasCanonical = canonicalize(aliasLower);
                if (!aliasCanonical) continue;

                if (!aliasLower.includes(" ")) {
                    // For single tokens, require whole-token matching to avoid false positives
                    // like "help" matching "helps" or "search" matching "research".
                    isMatch = tokenSet.has(aliasCanonical);
                } else {
                    // For multi-word phrases, allow canonical containment.
                    isMatch = messageCanonical.includes(aliasCanonical) || messageLower.includes(aliasLower);
                }

                if (isMatch) break;
            }
        }

        if (isMatch) matches.push(optionText);
    }

    const unique = Array.from(new Set(matches));
    if (unique.length <= 1) return unique;

    // Prefer the most specific options when one match is a strict substring of another.
    const ranked = unique
        .map((optionText) => {
            const canon = canonicalize(optionText.toLowerCase());
            return { optionText, canon, len: canon.length };
        })
        .sort((a, b) => b.len - a.len);

    const kept = [];
    for (const item of ranked) {
        if (!item.canon || item.len <= 3) {
            kept.push(item);
            continue;
        }

        const isSub = kept.some(
            (keptItem) =>
                keptItem.canon &&
                keptItem.len > item.len &&
                keptItem.canon.includes(item.canon)
        );
        if (!isSub) kept.push(item);
    }

    return kept.map((item) => item.optionText);
};

const matchExactSuggestionSelections = (question, rawMessage) => {
    const message = normalizeText(rawMessage);
    if (!message) return [];
    if (!Array.isArray(question?.suggestions) || question.suggestions.length === 0) return [];

    // Only attempt exact parsing for short, selection-like inputs (e.g. chip picks).
    if (message.length > 180) return [];

    const parts = message
        .split(/[,|]/)
        .map((part) => normalizeText(part))
        .filter(Boolean);

    if (!parts.length) return [];

    const suggestionsByCanon = new Map();
    for (const option of question.suggestions) {
        const canon = canonicalize(String(option || "").toLowerCase());
        if (canon) suggestionsByCanon.set(canon, option);
    }

    const matches = [];
    for (const part of parts) {
        const canon = canonicalize(part.toLowerCase());
        if (!canon) continue;
        const option = suggestionsByCanon.get(canon);
        if (option) matches.push(option);
    }

    // Only accept when every comma-separated item matched a suggestion option.
    if (matches.length !== parts.length || matches.length === 0) return [];

    const unique = Array.from(new Set(matches));
    const hasNone = unique.some((opt) => canonicalize(String(opt || "").toLowerCase()) === "none");
    if (hasNone) return ["None"];

    return unique;
};

const trimEntity = (value = "") => {
    let text = normalizeText(value);
    if (!text) return "";

    // Prefer the part before common separators.
    text = text.split(/\s+and\s+/i)[0];
    text = text.split(/\s+but\s+/i)[0];
    text = text.split(/\s+so\s+/i)[0];
    text = text.split(/\s+because\s+/i)[0];
    text = text.split(/[,.!\n]/)[0];

    return normalizeText(text).replace(/\s+/g, " ");
};

const extractDescriptionFromMixedMessage = (value = "") => {
    const text = normalizeText(value);
    if (!text) return null;

    const startPatterns = [
        // Match only the project/brand name segment, stopping before common separators like "and", commas, or budget/tech markers.
        /\b(?:my\s+)?(?:company|business|brand|project)\s*(?:name\s*)?(?:is|:|called|named)\s+[^\n,.;]{1,80}?(?=(?:\s+(?:and|with|\bbudget\b|\btech\b|\btimeline\b))|[,.!\n]|$)/i,
    ];

    let startIndex = 0;
    for (const pattern of startPatterns) {
        const match = text.match(pattern);
        if (match && typeof match.index === "number") {
            startIndex = match.index + match[0].length;
            break;
        }
    }

    const tail = text.slice(startIndex);
    const tailLower = tail.toLowerCase();

    const markerIndexes = [
        tailLower.search(/\bbudget\b/),
        tailLower.search(/\btech(?:nology)?\b/),
        tailLower.search(/\btimeline\b/),
        tailLower.search(/\bdeploy(?:ment)?\b|\bhost(?:ed|ing)?\b/),
        tailLower.search(/\bdomain\b/),
        tailLower.search(/\bintegration\b/),
    ].filter((idx) => idx >= 0);

    const endIndex = markerIndexes.length ? Math.min(...markerIndexes) : tail.length;
    let candidate = tail.slice(0, endIndex);

    candidate = candidate
        .replace(/^[\s,.;:-]+/, "")
        .replace(/^\s*(?:and\s+)?(?:it\s+is|it's|its)\s+/i, "")
        .replace(/^\s*(?:and|also|plus)\b\s*/i, "")
        .replace(/\s+/g, " ")
        .trim();

    // If we didn't find a project/brand marker, strip common lead-ins like "my name ..."
    if (startIndex === 0) {
        candidate = candidate
            .replace(/^(?:hi|hello|hey)\b[!,.\s-]*/i, "")
            .replace(
                /^(?:my\s+name|name)\s*(?:is|:)?\s+(?!and\b|i\b|im\b|i'm\b|we\b|we're\b)[a-z][a-z'’.-]*(?:\s+(?!and\b|i\b|im\b|i'm\b|we\b|we're\b)[a-z][a-z'’.-]*){0,2}\b[!,.\s-]*/i,
                ""
            )
            .replace(/^\s*(?:and|so)\b\s*/i, "")
            .replace(
                /\b(?:my\s+)?(?:company|business|brand|project)\s*(?:name\s*)?(?:is|:|called|named)\s+[^\n,.;]{1,80}?(?=(?:\s+(?:and|with|\bbudget\b|\btech\b|\btimeline\b))|[,.!\n]|$)/gi,
                ""
            )
            .replace(/\s+/g, " ")
            .trim();
    }

    if (candidate.length < 20) return null;
    return candidate;
};

const extractOrganizationName = (value = "") => {
    const text = normalizeText(value);
    if (!text) return null;

    const trimOrganizationCandidate = (candidate = "") => {
        let refined = normalizeText(candidate);
        if (!refined) return "";

        const lower = refined.toLowerCase();
        const markerIndexes = [
            lower.search(/\bbudget\b/),
            lower.search(/\btech(?:nology)?\b|\bstack\b/),
            lower.search(/\btimeline\b|\bdeadline\b/),
            lower.search(/\bdeploy(?:ment)?\b|\bhost(?:ing|ed)?\b/),
            lower.search(/\bdomain\b/),
        ].filter((idx) => idx >= 0);

        const endIndex = markerIndexes.length ? Math.min(...markerIndexes) : refined.length;
        refined = refined.slice(0, endIndex);

        return refined.replace(/[\s,.;:-]+$/, "").trim();
    };

    const looksLikeGenericProjectLabel = (candidate = "") => {
        const cleaned = normalizeText(candidate)
            .replace(/\?/g, "")
            .replace(/^\s*(?:a|an|the|my|our|this|that|its)\b\s*/i, "")
            .replace(/\s+/g, " ")
            .trim();
        if (!cleaned) return true;

        const canon = canonicalize(cleaned);
        if (!canon) return true;

        const genericCanons = new Set([
            "ecomm",
            "ecom",
            "ecommerce",
            "ecommercewebsite",
            "website",
            "webapp",
            "webapplication",
            "app",
            "application",
            "mobileapp",
            "mobileapplication",
            "landingpage",
            "portfolio",
            "businesswebsite",
            "informationalwebsite",
            "saas",
            "dashboard",
            "platform",
            "marketplace",
            "store",
            "shop",
            "onlinestore",
        ]);

        if (genericCanons.has(canon)) return true;

        // If the extracted "name" still contains generic project nouns, it's likely a type/description.
        if (
            /\s/.test(cleaned) &&
            /\b(website|web\s*app|app|application|store|shop|platform|marketplace|dashboard|landing\s*page|portfolio|saas|e-?\s*commerce)\b/i.test(
                cleaned
            )
        ) {
            return true;
        }

        return false;
    };

    const patterns = [
        // "The name I'm thinking of is CartNest"
        /\b(?:the\s+)?name\s+i['’]m\s+thinking\s+of\s*(?:is|:)?\s*([a-z0-9][a-z0-9&._' -]{1,80})/i,
        /\b(?:the\s+)?name\s+i[’'\?]m\s+thinking\s+of\s*(?:is|:)?\s*([a-z0-9][a-z0-9&._' -]{1,80})/i,
        /\b(?:the\s+)?name\s+im\s+thinking\s+of\s*(?:is|:)?\s*([a-z0-9][a-z0-9&._' -]{1,80})/i,
        /\b(?:the\s+)?name\s+i\s+am\s+thinking\s+of\s*(?:is|:)?\s*([a-z0-9][a-z0-9&._' -]{1,80})/i,
        /\b(?:the\s+)?name\s+i\s+have\s+in\s+mind\s*(?:is|:)?\s*([a-z0-9][a-z0-9&._' -]{1,80})/i,
        /\bfor\s+(?:my\s+)?(?:company|business|brand|project)\s+([a-z0-9][a-z0-9&._' -]{1,80})/i,
        /\bmy\s+(?:company|business|brand|project)\s*(?:name\s*)?(?:is|:|called|named)\s*([a-z0-9][a-z0-9&._' -]{1,80})/i,
        /\b(?:company|business|brand|project)\s*(?:name\s*)?(?:is|:|called|named)\s*([a-z0-9][a-z0-9&._' -]{1,80})/i,
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (!match) continue;
        const candidate = trimOrganizationCandidate(trimEntity(match[1]));
        if (candidate && candidate.length <= 60 && !looksLikeGenericProjectLabel(candidate)) {
            return candidate;
        }
    }

    // Common phrasing: "my project called Markify", "it's called Markify"
    if (
        /\b(?:called|named)\b/i.test(text) &&
        /\b(company|business|brand|project|app|website|platform|product|tool|manager|system|dashboard|store|marketplace|saas)\b/i.test(
            text
        )
    ) {
        const match = text.match(/\b(?:called|named)\s+([a-z0-9][a-z0-9&._' -]{1,80})/i);
        if (match) {
            const candidate = trimOrganizationCandidate(trimEntity(match[1]));
            if (candidate && candidate.length <= 60 && !looksLikeGenericProjectLabel(candidate)) {
                return candidate;
            }
        }
    }

    return null;
};

const getQuestionKeyFromAssistant = (value = "") => {
    const match = normalizeText(value).match(QUESTION_KEY_TAG_REGEX);
    return match ? match[1].trim() : null;
};

const withQuestionKeyTag = (text = "", key = "") => {
    if (!key) return text;
    if (QUESTION_KEY_TAG_REGEX.test(text)) return text;
    return `${text}\n[QUESTION_KEY: ${key}]`;
};

const isGreetingMessage = (value = "") => {
    const raw = normalizeText(value);
    if (!raw) return false;

    const text = raw
        .toLowerCase()
        .replace(/[^a-z0-9'\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    // Treat as a greeting only when the message is basically *just* a greeting.
    // Examples that should count: "hi", "hello!", "hey there"
    // Examples that should NOT count: "hi i need a website", "hello can you help with SEO?"
    if (text.length > 20) return false;

    const compact = text.replace(/\s+/g, "");

    if (/^(hi|hey|yo|sup|hii+)(there)?$/.test(compact)) return true;
    if (/^(what'?sup|whatsup)(there)?$/.test(compact)) return true;

    // Common "hello" variations / typos: hello, helloo, hellooo, hellow, helo, hlo.
    if (/^(hell+o+w*|helo+|hlo+|hlw+)(there)?$/.test(compact)) return true;

    return false;
};

const isSkipMessage = (value = "") => {
    const text = normalizeText(value).toLowerCase();
    return text === "skip" || text === "done" || text === "na" || text === "n/a" || text.includes("skip");
};

const extractBudget = (value = "") => {
    const text = normalizeText(value).replace(/\?/g, "");
    if (!text) return null;
    if (/^flexible$/i.test(text)) return "Flexible";
    if (/\bcustom\s*amount\b/i.test(text)) return "Custom amount";

    // Range budget: "₹1,00,000 - ₹4,00,000" or "100000-400000"

    let match = text.match(
        /(?:\u20B9|inr|rs\.?|rupees?)?\s*([\d,]{4,}(?:\.\d+)?)\s*(?:-|to)\s*(?:\u20B9|inr|rs\.?|rupees?)?\s*([\d,]{4,}(?:\.\d+)?)\b/i
    );
    if (match) {
        return `${match[1].replace(/,/g, "")}-${match[2].replace(/,/g, "")}`;
    }

    match = text.match(/under\s+(?:\u20B9|inr|rs\.?|rupees?)?\s*([\d,]{4,})\b/i);
    if (match) return match[1].replace(/,/g, "");

    match = text.match(/(?:\u20B9|inr|rs\.?|rupees?)\s*([\d,]+(?:\.\d+)?)\b/i);
    if (match) return match[1].replace(/,/g, "");

    // Chip/label style: "Custom React.js + Node.js (₹1,50,000+)" or "(1,50,000+)"
    match = text.match(/\(([^)]{0,60})\)\s*$/);
    if (match && /(?:\u20B9|inr|rs\.?|rupees?|\+|\/-)/i.test(match[1])) {
        const insideNumber = match[1].match(/([\d,]{4,})/);
        if (insideNumber) return insideNumber[1].replace(/,/g, "");
    }

    match = text.match(/\b(\d+(?:\.\d+)?)\s*(k|thousand|thousands)\b/i);
    if (match) {
        const unit = match[2].toLowerCase();
        if (unit.startsWith("k")) return `${match[1]}k`;
        return `${match[1]}000`; // crude normalization for "thousand"
    }

    match = text.match(/\b(\d+(?:\.\d+)?)\s*(m|mn|million|millions)\b/i);
    if (match) return `${match[1]}M`;

    match = text.match(/\b(\d+(?:\.\d+)?)\s*(l)\b/i);
    if (match) return `${match[1]}L`;

    match = text.match(/\b(\d+(?:\.\d+)?)\s*lakh(s)?\b/i);
    if (match) return `${match[1]} lakh`;

    // Bare numeric budgets are common replies when the budget question is active.
    match = text.match(/^\s*([\d,]{4,})\s*(?:\+|\/-)?\s*$/);
    if (match) return match[1].replace(/,/g, "");

    match = text.match(/\b(\d{4,})\b/);
    if (match && /(budget|cost|price|inr|\u20B9|rs|rupees?)/i.test(text)) return match[1];

    // Fallback: comma-separated budgets in longer sentences (e.g. "budget is 95,000").
    match = text.match(/\b(?:budget|cost|price)\b[^0-9]{0,24}([\d,]{4,})\b/i);
    if (match) return match[1].replace(/,/g, "");

    return null;
};

const extractTimeline = (value = "") => {
    const text = normalizeText(value).replace(/\?/g, "");
    if (!text) return null;
    if (/^flexible$/i.test(text)) return "Flexible";

    let match = text.match(/\b(\d+\s*-\s*\d+)\s*(day|week|month|year)s?\b/i);
    if (match) {
        const range = match[1].replace(/\s*/g, "");
        const unit = match[2].toLowerCase();
        return `${range} ${unit}s`;
    }

    match = text.match(/\b(\d+)\s*(day|week|month|year)s?\b/i);
    if (match) {
        const count = parseInt(match[1], 10);
        const unit = match[2].toLowerCase();
        return `${count} ${unit}${count === 1 ? "" : "s"}`;
    }

    if (/\b(asap|urgent|immediately)\b/i.test(text)) return text;
    if (/\bby\b/i.test(text)) return text;
    if (/\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)\b/i.test(text)) return text;

    return null;
};

const extractTechDetailsFromMessage = (value = "") => {
    const text = normalizeText(value);
    if (!text) return [];

    const lower = text.toLowerCase();
    const markerMatch = lower.match(/\b(?:tech(?:nology)?\s*stack|tech\s*stack)\b\s*(?:is|:)?\s*/i);

    const scanForCommonTech = (sourceLower = "") => {
        const found = [];

        if (/\bexpress\b/.test(sourceLower)) found.push("Express");
        if (/\bmongo\s*db\b/.test(sourceLower) || /\bmongodb\b/.test(sourceLower)) found.push("MongoDB");
        if (/\bpostgres(?:ql)?\b/.test(sourceLower) || /\bpostgre\s*sql\b/.test(sourceLower)) found.push("PostgreSQL");
        if (/\bmysql\b/.test(sourceLower)) found.push("MySQL");
        if (/\bredis\b/.test(sourceLower)) found.push("Redis");
        if (/\bdocker\b/.test(sourceLower)) found.push("Docker");
        if (/\bprisma\b|\bpris(?:ma|em|m)\b/.test(sourceLower)) found.push("Prisma");
        if (/\bneon\s*db\b/.test(sourceLower)) found.push("Neon DB");
        if (/\bopen\s*-?\s*(?:source|sourse)\b/.test(sourceLower) && /\bmodel\b/.test(sourceLower)) {
            found.push("Open-source model");
        }

        return found;
    };

    const scanned = scanForCommonTech(lower);

    if (!markerMatch || typeof markerMatch.index !== "number") {
        return scanned;
    }

    const start = markerMatch.index + markerMatch[0].length;
    const tail = text.slice(start);
    const tailLower = tail.toLowerCase();

    const stopIndexes = [
        tailLower.search(/\bbudget\b/),
        tailLower.search(/\btimeline\b|\bdeadline\b/),
        tailLower.search(/\bdeploy(?:ment)?\b|\bhost(?:ing|ed)?\b/),
        tailLower.search(/\bdomain\b/),
        tailLower.search(/\b\d+\s*(?:day|week|month|year)s?\b/),
    ].filter((idx) => idx >= 0);

    const end = stopIndexes.length ? Math.min(...stopIndexes) : tail.length;
    const segmentRaw = tail.slice(0, end);

    const parts = segmentRaw
        .replace(/[\n\r]/g, " ")
        .split(/\s*(?:,|\/|&|\+|\band\b)\s*/i)
        .map((part) =>
            normalizeText(part)
                .replace(/^[\s,.;:-]+/, "")
                .replace(/^\s*(?:some\s+of\s+the|some\s+of|some|the|a|an)\b\s*/i, "")
                .replace(/\s+/g, " ")
                .trim()
        )
        .filter(Boolean);

    const normalized = parts.map((part) => {
        const p = part.toLowerCase();

        if (/\breact\b/.test(p) || /\breactjs\b/.test(p) || /\breact\.js\b/.test(p)) return "React.js";
        if (/\bnext\b/.test(p) || /\bnextjs\b/.test(p) || /\bnext\.js\b/.test(p)) return "Next.js";
        if (/\bnode\b/.test(p) || /\bnodejs\b/.test(p) || /\bnode\.js\b/.test(p)) return "Node.js";
        if (/\bpris(?:ma|em|m)\b/.test(p)) return "Prisma";
        if (/\bneon\b/.test(p)) return "Neon DB";
        if (/\bpostgres(?:ql)?\b/.test(p) || /\bpostgre\s*sql\b/.test(p)) return "PostgreSQL";
        if (/\bmongo(?:db)?\b/.test(p)) return "MongoDB";
        if (/\bmysql\b/.test(p)) return "MySQL";
        if (/\bopen\s*-?\s*(?:source|sourse)\b/.test(p) && /\bmodel\b/.test(p)) return "Open-source model";

        return part;
    });

    const seen = new Set();
    const unique = [];
    for (const item of normalized) {
        const canon = canonicalize(item.toLowerCase());
        if (!canon) continue;
        if (seen.has(canon)) continue;
        seen.add(canon);
        unique.push(item);
    }

    // Merge scanned values with marker-based parsing (dedupe).
    for (const item of scanned) {
        const canon = canonicalize(item.toLowerCase());
        if (!canon) continue;
        if (seen.has(canon)) continue;
        seen.add(canon);
        unique.push(item);
    }

    return unique;
};

const formatInr = (amount) => {
    if (!Number.isFinite(amount)) return "";
    try {
        return `₹${Math.round(amount).toLocaleString("en-IN")}`;
    } catch {
        return `₹${Math.round(amount)}`;
    }
};

const inferPagesFromBrief = (pagesQuestion, rawText = "", websiteTypeHint = "") => {
    if (!pagesQuestion || !Array.isArray(pagesQuestion?.suggestions) || !pagesQuestion.suggestions.length) {
        return [];
    }

    const text = normalizeForSuggestionMatching(rawText);
    if (!text) return [];

    const lower = text.toLowerCase();
    const websiteTypeLower = normalizeText(websiteTypeHint).toLowerCase();

    const suggestions = pagesQuestion.suggestions;
    const suggestionsByCanon = new Map();
    for (const option of suggestions) {
        const canon = canonicalize(String(option || "").toLowerCase());
        if (canon) suggestionsByCanon.set(canon, option);
    }

    const picked = new Set();
    const add = (label) => {
        const canon = canonicalize(String(label || "").toLowerCase());
        if (!canon) return;
        const option = suggestionsByCanon.get(canon);
        if (!option) return;
        if (canonicalize(String(option).toLowerCase()) === "none") return;
        picked.add(option);
    };

    const isEcommerce =
        /\be\s*-?\s*commerce\b|\becommerce\b|\bonline\s+store\b|\bonline\s+shop\b/i.test(lower) ||
        /\be\s*-?\s*commerce\b|\becommerce\b|\bonline\s+store\b|\bonline\s+shop\b/i.test(websiteTypeLower);

    if (isEcommerce) add("Shop/Store");

    if (
        /\bproducts?\b/i.test(lower) ||
        /\bproduct\s+categor/i.test(lower) ||
        /\bcatalog(?:ue)?\b/i.test(lower) ||
        /\binventory\b/i.test(lower) ||
        /\bsku\b/i.test(lower)
    ) {
        add("Products");
    }

    if (/\bsearch\b|\bfilters?\b|\bsort(?:ing)?\b/i.test(lower)) add("Search");
    if (/\breviews?\b|\bratings?\b|\bstars?\b/i.test(lower)) add("Reviews/Ratings");

    if (/\bwishlist\b|\bfavou?rites?\b|\bsave\s+for\s+later\b/i.test(lower)) add("Wishlist");

    if (
        /\bcart\b|\bcheckout\b|\bpayments?\b|\bpay\b|\brazorpay\b|\bstripe\b/i.test(lower)
    ) {
        add("Cart/Checkout");
    }

    if (
        /\border\s*tracking\b|\btrack\s*order\b|\btracking\b.*\border\b|\border\b.*\btracking\b/i.test(
            lower
        )
    ) {
        add("Order Tracking");
    }

    if (
        /\bsign\s*up\b|\bsignup\b|\bregister\b|\blog\s*in\b|\blogin\b|\bauth(?:entication)?\b|\bjwt\b/i.test(
            lower
        )
    ) {
        add("Account/Login");
    }

    const hasAdminPanel =
        /\badmin\s*(?:panel|dashboard|portal|console|section|area)\b/i.test(lower) ||
        /\bmanage\s+(?:products?|orders?|users?|inventory|stock|catalog|prices?|pricing)\b/i.test(lower) ||
        /\b(?:product|order|user|inventory|stock|catalog)\s+management\b/i.test(lower) ||
        /\b(?:update|edit)\s+(?:prices?|pricing|stock|inventory)\b/i.test(lower) ||
        /\b(?:coupons?|discounts?|promo\s*codes?)\b/i.test(lower);

    if (hasAdminPanel) add("Admin Dashboard");

    if (/\banalytics\b|\breports?\b|\bmetrics\b|\binsights?\b/i.test(lower)) add("Analytics Dashboard");
    if (/\bnotifications?\b|\bemail\s+notifications?\b|\balerts?\b|\bsms\b|\bpush\b/i.test(lower)) {
        add("Notifications");
    }

    if (
        /\blive\s+chat\b|\bchat\s+widget\b|\bsupport\s+widget\b|\bcustomer\s+support\s+chat\b|\bwhatsapp\b/i.test(
            lower
        )
    ) {
        add("Chat/Support Widget");
    }

    if (/\bfaq\b|\bfrequently\s+asked\b/i.test(lower)) add("FAQ");
    if (/\bblog\b|\barticles?\b|\bposts?\b/i.test(lower)) add("Blog");
    if (/\btestimonials?\b|\bcustomer\s+stories\b/i.test(lower)) add("Testimonials");
    if (
        /\bpricing\b/i.test(lower) ||
        /\bplans?\s+and\s+pricing\b/i.test(lower) ||
        /\bsubscription\s+plans?\b/i.test(lower) ||
        /\bprice\s*plans?\b/i.test(lower)
    ) {
        add("Pricing");
    }
    if (/\bportfolio\b|\bgallery\b|\blookbook\b/i.test(lower)) add("Portfolio/Gallery");
    if (/\bbook\s*now\b|\bbooking\b|\bappointments?\b|\bschedule\b/i.test(lower)) add("Book Now");
    if (/\bresources?\b|\bdownloads?\b|\bdocumentation\b|\bdocs\b/i.test(lower)) add("Resources");
    if (/\bevents?\b|\bevent\s+calendar\b/i.test(lower)) add("Events");

    if (/\b3d\b/i.test(lower) && /\banimations?\b|\banimation\b/i.test(lower)) add("3D Animations");
    if (/\b3d\b/i.test(lower) && /\b(?:model\s+viewer|3d\s+viewer|viewer)\b/i.test(lower)) {
        add("3D Model Viewer");
    }

    const ordered = suggestions.filter((option) => picked.has(option));

    // Only treat this as reliable when we picked multiple high-signal pages/features.
    if (ordered.length < 2 && !isEcommerce) return [];
    return ordered;
};

const splitSelections = (value = "") =>
    normalizeText(value)
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean);

const parseInrAmount = (value = "") => {
    const text = normalizeText(value)
        .replace(/\?/g, "")
        .replace(/[₹,]/g, "")
        .replace(/\/-|\+/g, "")
        .trim()
        .toLowerCase();

    if (!text) return null;

    let match = text.match(/^(\d+(?:\.\d+)?)\s*k$/i);
    if (match) return Math.round(parseFloat(match[1]) * 1000);

    match = text.match(/^(\d+(?:\.\d+)?)\s*l$/i);
    if (match) return Math.round(parseFloat(match[1]) * 100000);

    match = text.match(/^(\d+(?:\.\d+)?)\s*lakh$/i);
    if (match) return Math.round(parseFloat(match[1]) * 100000);

    match = text.match(/^(\d+(?:\.\d+)?)\s*lakhs$/i);
    if (match) return Math.round(parseFloat(match[1]) * 100000);

    match = text.match(/^(\d{4,})$/);
    if (match) return parseInt(match[1], 10);

    return null;
};

const parseInrBudgetRange = (value = "") => {
    const text = normalizeText(value).replace(/\?/g, "");
    if (!text) return null;
    if (/^flexible$/i.test(text)) return { flexible: true };

    const rangeMatch = text.match(/(.+?)\s*(?:-|–|to)\s*(.+)/i);
    if (rangeMatch) {
        const min = parseInrAmount(rangeMatch[1]);
        const max = parseInrAmount(rangeMatch[2]);
        if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
        return {
            min: Math.min(min, max),
            max: Math.max(min, max),
        };
    }

    const single = parseInrAmount(text);
    if (!Number.isFinite(single)) return null;
    return { min: single, max: single };
};

const formatBudgetDisplay = (range) => {
    if (!range) return "";
    if (range.flexible) return "Flexible";
    if (!Number.isFinite(range.min) || !Number.isFinite(range.max)) return "";
    if (range.min === range.max) return formatInr(range.min);
    return `${formatInr(range.min)} - ${formatInr(range.max)}`;
};

const resolveMinimumWebsiteBudget = (collectedData = {}) => {
    const techSelections = splitSelections(collectedData.tech);
    const tech = techSelections.join(" ").toLowerCase();
    const pages = splitSelections(collectedData.pages).join(" ").toLowerCase();
    const description = normalizeText(collectedData.description).toLowerCase();

    const wants3D =
        pages.includes("3d ") ||
        pages.startsWith("3d") ||
        pages.includes("3d animations") ||
        pages.includes("3d model") ||
        /\b3d\b/.test(description) ||
        /\b(?:virtual\s*try\s*-?\s*on|try\s*-?\s*on|augmented\s+reality|\bar\b|face\s*filter|shade\s*(?:match|test))\b/i.test(
            description
        );

    const hasWordPress = tech.includes("wordpress");
    const hasCustomShopify = tech.includes("hydrogen");
    const hasShopify = tech.includes("shopify");
    const hasNext = tech.includes("next.js");
    const hasReact = tech.includes("react.js");
    const hasCustomReactNode =
        tech.includes("react.js + node.js") ||
        tech.includes("mern") ||
        tech.includes("pern");

    const bases = [
        { when: hasWordPress, key: "wordpress", label: "WordPress", min: 30000 },
        { when: hasReact, key: "react", label: "React.js", min: 60000 },
        { when: hasCustomShopify, key: "custom_shopify", label: "Custom Shopify", min: 80000 },
        { when: hasShopify, key: "shopify", label: "Shopify", min: 30000 },
        { when: hasNext, key: "nextjs", label: "Next.js", min: 175000 },
        { when: hasCustomReactNode, key: "custom_react_node", label: "Custom React.js + Node.js", min: 150000 },
    ].filter((b) => b.when);

    const base =
        bases.length > 0
            ? bases.reduce((best, current) => (current.min > best.min ? current : best))
            : { key: "website", label: "Website", min: 30000 };

    if (!wants3D) {
        return { ...base, wants3D: false, range: null };
    }

    if (base.key === "wordpress") {
        return { key: "wordpress_3d", label: "3D WordPress", min: 45000, wants3D: true, range: null };
    }

    const range = { min: 100000, max: 400000 };
    return {
        key: "custom_3d",
        label: "3D Custom Website",
        min: Math.max(base.min, range.min),
        wants3D: true,
        range,
        baseKey: base.key,
        baseLabel: base.label,
    };
};

const validateWebsiteBudget = (collectedData = {}) => {
    const rawBudget = collectedData?.budget;
    const requirement = resolveMinimumWebsiteBudget(collectedData);

    if (!rawBudget || rawBudget === "[skipped]" || /^flexible$/i.test(rawBudget)) {
        return { isValid: true, reason: null, requirement, parsed: null };
    }

    const parsed = parseInrBudgetRange(rawBudget);
    if (!parsed || parsed.flexible) {
        return { isValid: false, reason: "unparsed", requirement, parsed: null };
    }

    if (Number.isFinite(requirement?.min) && parsed.max < requirement.min) {
        return { isValid: false, reason: "too_low", requirement, parsed };
    }

    return { isValid: true, reason: null, requirement, parsed };
};

const LOW_BUDGET_SUGGESTIONS = ["Increase budget", "Continue with current budget"];

const isIncreaseBudgetDecision = (value = "") => {
    const canon = canonicalize(value);
    return (
        canon === "increasebudget" ||
        canon === "increase" ||
        canon === "raisebudget" ||
        canon === "raisethebudget" ||
        canon === "increaseyourbudget"
    );
};

const isProceedWithLowBudgetDecision = (value = "") => {
    const canon = canonicalize(value);
    return (
        canon === "continuewithcurrentbudget" ||
        canon === "continuewithbudget" ||
        canon === "continuebudget" ||
        canon === "proceedwithcurrentbudget" ||
        canon === "proceedwithbudget" ||
        canon === "proceedbudget" ||
        canon === "continue" ||
        canon === "proceed" ||
        canon === "goahead"
    );
};

const formatBudgetForWarning = (rawBudget = "") => {
    const range = parseInrBudgetRange(rawBudget);
    if (!range) return rawBudget;
    return formatBudgetDisplay(range) || rawBudget;
};

const formatMinimumBudgetLabel = (requirement) => {
    if (!requirement) return "";
    if (requirement.range) return formatBudgetDisplay(requirement.range);
    if (Number.isFinite(requirement.min)) return `${formatInr(requirement.min)}+`;
    return "";
};

const buildWebsiteBudgetSuggestions = (requirement) => {
    if (!requirement) return null;

    return ["Change technology"];
};

const MANAGED_HOSTING_TECH_CANONS = new Set(["shopify"]);

const shouldSkipDeploymentQuestion = (collectedData = {}) => {
    const techSelections = splitSelections(collectedData.tech);
    if (!techSelections.length) return false;

    const techCanon = canonicalize(techSelections.join(" ").toLowerCase());
    if (!techCanon) return false;

    for (const platform of MANAGED_HOSTING_TECH_CANONS) {
        if (techCanon.includes(platform)) return true;
    }

    return false;
};

const resolveMinimumWebsiteTimelineWeeks = (collectedData = {}) => {
    const normalizeSelections = (value = "") =>
        splitSelections(value)
            .map((part) => normalizeText(part))
            .filter(Boolean)
            .filter((part) => {
                const lower = part.toLowerCase();
                return lower !== "none" && lower !== "[skipped]";
            });

    const pagesRaw = normalizeText(collectedData.pages || collectedData.pages_inferred || "");
    const integrationsRaw = normalizeText(collectedData.integrations || "");
    const pages = normalizeSelections(pagesRaw);
    const integrations = normalizeSelections(integrationsRaw);

    if (!pages.length && !integrations.length) return null;

    const websiteType = normalizeText(collectedData.website_type).toLowerCase();
    const pageCanons = new Set(
        pages.map((part) => canonicalize(part.toLowerCase())).filter(Boolean)
    );
    const integrationCanons = new Set(
        integrations.map((part) => canonicalize(part.toLowerCase())).filter(Boolean)
    );

    const hasPage = (label = "") => pageCanons.has(canonicalize(label.toLowerCase()));
    const hasIntegration = (label = "") =>
        integrationCanons.has(canonicalize(label.toLowerCase()));

    const isEcommerce =
        websiteType.includes("e-commerce") ||
        websiteType.includes("ecommerce") ||
        hasPage("Shop/Store") ||
        hasPage("Cart/Checkout") ||
        hasIntegration("Payment Gateway (Razorpay/Stripe)");

    const isWebApp = websiteType.includes("web app") || websiteType.includes("webapp");

    const hasDashboards =
        hasPage("Admin Dashboard") || hasPage("User Dashboard") || hasPage("Analytics Dashboard");
    const hasAuth = hasPage("Account/Login");
    const hasOrders = hasPage("Order Tracking");
    const hasCommerceFeatures =
        hasPage("Cart/Checkout") || hasPage("Wishlist") || hasPage("Reviews/Ratings");
    const hasEngagement = hasPage("Notifications") || hasPage("Chat/Support Widget") || hasPage("Search");
    const has3D = hasPage("3D Animations") || hasPage("3D Model Viewer");

    const totalSelections = pages.length + integrations.length;
    const isComplex =
        isEcommerce ||
        isWebApp ||
        hasDashboards ||
        hasAuth ||
        hasOrders ||
        hasCommerceFeatures ||
        hasEngagement ||
        has3D ||
        integrations.length >= 2 ||
        totalSelections >= 4;

    if (!isComplex) return null;

    return { minWeeks: 4, label: "this feature set" };
};

const formatTimelineWeeksLabel = (weeks) => {
    if (!Number.isFinite(weeks)) return "";
    const rounded = Math.max(1, Math.round(weeks));
    if (rounded % 4 === 0) {
        const months = Math.max(1, Math.round(rounded / 4));
        return months === 1 ? "1 month" : `${months} months`;
    }
    return rounded === 1 ? "1 week" : `${rounded} weeks`;
};

const validateWebsiteTimeline = (collectedData = {}) => {
    const rawTimeline = collectedData?.timeline;
    const requirement = resolveMinimumWebsiteTimelineWeeks(collectedData);

    if (!rawTimeline || rawTimeline === "[skipped]" || /^flexible$/i.test(rawTimeline)) {
        return { isValid: true, reason: null, requirement, weeks: null };
    }

    const parsedWeeks = parseTimelineWeeks(rawTimeline);
    if (!parsedWeeks || !requirement) {
        return { isValid: true, reason: null, requirement, weeks: parsedWeeks };
    }

    if (Number.isFinite(requirement?.minWeeks) && parsedWeeks < requirement.minWeeks) {
        return { isValid: false, reason: "too_short", requirement, weeks: parsedWeeks };
    }

    return { isValid: true, reason: null, requirement, weeks: parsedWeeks };
};

const isBareBudgetAnswer = (value = "") => {
    const text = normalizeText(value)
        .replace(/\?/g, "")
        .toLowerCase();
    if (!text) return false;
    if (text === "flexible") return true;

    // Examples: "60000", "₹60,000", "INR 60000", "60k", "1 lakh", "Under ₹120,000"
    if (/^under\s+(?:\u20B9|inr|rs\.?|rupees?)?\s*\d[\d,]*(?:\.\d+)?\s*(?:k|l|lakh)?\s*$/i.test(text)) {
        return true;
    }

    return /^(?:(?:\u20B9|inr|rs\.?|rupees?)\s*)?\d[\d,]*(?:\.\d+)?\s*(?:k|l|lakh)?\s*$/.test(text);
};

const isBareTimelineAnswer = (value = "") => {
    const text = normalizeText(value)
        .replace(/[?？؟]/g, "")
        .toLowerCase();
    if (!text) return false;
    if (text === "flexible") return true;
    if (/^(asap|urgent|immediately|this week|next week|next month)$/i.test(text)) return true;
    if (/^\d+\s*-\s*\d+\s*(day|week|month|year)s?$/.test(text)) return true;
    return /^\d+\s*(day|week|month|year)s?$/.test(text);
};

const isUserQuestion = (value = "") => {
    const text = normalizeText(value);
    if (!text) return false;
    // Treat as a question only when question-mark punctuation is present (not inside words like "I?m" or "?95,000").
    // This intentionally does NOT infer questions from leading words (e.g. "can you ...") unless the user
    // includes a question mark, so the chatbot doesn't break the questionnaire flow on statement-like inputs.
    if (!/[?？؟](?![\p{L}\p{N}])/u.test(text)) return false;

    const withoutMarks = text.replace(/[?？؟](?![\p{L}\p{N}])/gu, "");
    // Treat pure budget/timeline inputs as answers even if a user typed '?'. Otherwise it's a question.
    if (isBareBudgetAnswer(withoutMarks) || isBareTimelineAnswer(withoutMarks)) return false;
    return true;
};

const looksLikeProjectBrief = (value = "") => {
    const text = normalizeText(value);
    if (!text) return false;

    const lower = text.toLowerCase();
    const isLong = text.length >= 140;
    const hasMultipleSentences = (text.match(/[.!?\n]/g) || []).length >= 2;

    let signals = 0;

    if (/\bbudget\b/.test(lower) || /\b(inr|rs\.?|rupees?)\b/.test(lower) || lower.includes("₹")) {
        signals += 1;
    }

    if (/\btimeline\b|\bdeadline\b/.test(lower) || /\b\d+\s*(day|week|month|year)s?\b/i.test(text)) {
        signals += 1;
    }

    if (
        /\btech\s*stack\b|\bstack\b|\breact\b|\bnext\b|\bnode\b|\bexpress\b|\bwordpress\b|\bshopify\b|\blaravel\b|\bdjango\b|\bmongodb\b|\bpostgres\b|\bmysql\b|\bprisma\b/i.test(
            lower
        )
    ) {
        signals += 1;
    }

    if (/\b(i\s+want|i\s+need|looking\s+to|build|create|develop|from\s+scratch)\b/i.test(lower)) {
        signals += 1;
    }

    if (/\b(features?|requirements?|must-?have|include|pages?)\b/i.test(lower)) {
        signals += 1;
    }

    // Long, multi-sentence messages that clearly talk about a website/app are usually a one-shot brief
    // even if the user doesn't explicitly say "features/requirements".
    if (
        /\b(website|web\s*app|app|platform|store|shop|marketplace|landing\s*page|portfolio|saas|e-?\s*commerce|ecommerce)\b/i.test(
            lower
        )
    ) {
        signals += 1;
    }

    if (
        /\b(?:users?|customers?|visitors?|people|clients?)\b/i.test(lower) &&
        /\b(?:can|should|able\s+to|must|need\s+to)\b/i.test(lower)
    ) {
        signals += 1;
    }

    // For shorter messages, require stronger evidence; for longer/multi-sentence briefs, a couple of signals is enough.
    if (isLong || hasMultipleSentences) return signals >= 2;
    return signals >= 3;
};

const stripTrailingQuestionSentence = (value = "") => {
    const text = normalizeText(value);
    const matches = Array.from(text.matchAll(/\?(?![a-z0-9])/gi));
    if (!matches.length) return text;
    const last = matches[matches.length - 1];
    const qIndex = typeof last?.index === "number" ? last.index : -1;
    if (qIndex < 0) return text;

    const before = text.slice(0, qIndex);
    const lastBoundary = Math.max(
        before.lastIndexOf("."),
        before.lastIndexOf("!"),
        before.lastIndexOf("\n")
    );

    // If we can't confidently split sentences, keep the original text.
    if (lastBoundary < 0) return text;

    const head = text.slice(0, lastBoundary + 1).trim();
    return head || text;
};

const NON_NAME_SINGLE_TOKENS = new Set([
    "there",
    "bro",
    "buddy",
    "sir",
    "madam",
    "maam",
    "mam",
    "boss",
    "team",
    "everyone",
    "guys",
    "all",
    "friend",
    "mate",
    "pal",
    "dude",
    "help",
    "support",
    "please",
    "plz",
    "thanks",
    "thankyou",
    "thx",
    "ok",
    "okay",
    "sure",
    "yes",
    "yep",
    "no",
    "nope",
    "nah",
]);

const isLikelyName = (value = "") => {
    const text = normalizeText(value).replace(/\?/g, "");
    if (!text) return false;
    if (text.length > 40) return false;
    if (isGreetingMessage(text)) return false;
    if (isUserQuestion(text)) return false;
    if (/\bhttps?:\/\//i.test(text) || /\bwww\./i.test(text)) return false;
    if (text.includes("@")) return false;
    if (/\d{2,}/.test(text)) return false;

    const tokens = text
        .toLowerCase()
        .replace(/[^a-z'\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .split(" ")
        .filter(Boolean);

    if (tokens.length === 1 && NON_NAME_SINGLE_TOKENS.has(tokens[0])) return false;
    if (
        /(budget|timeline|website|web\s*app|app|project|proposal|quote|pricing|price|cost|estimate|generate|need|want|build|looking|landing|page|portfolio|e-?commerce|ecommerce|shopify|wordpress|react|next|mern|pern|saas|dashboard)\b/i.test(
            text
        )
    ) {
        return false;
    }
    return /[a-zA-Z]/.test(text);
};

const startsWithNonNameIntro = (value = "") => {
    const text = normalizeText(value).toLowerCase();
    if (!text) return false;

    const tokens = text
        .replace(/[^a-z'\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .split(" ")
        .filter(Boolean);

    if (!tokens.length) return false;
    const first = tokens[0];

    const blockedFirstTokens = new Set([
        "thinking",
        "looking",
        "planning",
        "trying",
        "working",
        "building",
        "creating",
        "developing",
        "here",
        "from",
        "based",
    ]);

    if (blockedFirstTokens.has(first)) return true;

    // Common non-name phrases: "I'm a developer", "I'm an agency", etc.
    if (tokens.length > 1 && /^(a|an|the)$/.test(first)) return true;

    // Role labels that commonly appear in introductions but aren't names.
    if (
        tokens.length <= 3 &&
        /\b(developer|designer|founder|owner|student|freelancer|agency|team|company)\b/i.test(text)
    ) {
        return true;
    }

    return false;
};

const extractName = (value = "") => {
    let text = normalizeText(value).replace(/\?/g, "");
    if (!text) return null;
    if (isGreetingMessage(text)) return null;

    // Handle common patterns like "hi kaif", "hello harsh" without treating the greeting as part of the name.
    const leadingGreeting = text.match(/^(?:hi|hey|yo|sup|hii+|hello|hell+o+w*|helo+|hlo+|hlw+)\b\s+(.+)$/i);
    if (leadingGreeting) {
        text = normalizeText(leadingGreeting[1]);
        if (!text) return null;
        if (isGreetingMessage(text)) return null;
    }

    const explicitMyName = text.match(/\bmy\s+name\s*(?:is|:)?\s+(.+)$/i);
    const explicitNameLabel = text.match(/^\s*name\s*(?:is|:)?\s+(.+)$/i);
    const explicitIAm = text.match(/\b(?:i\s+am|i['’\?]m|im|this\s+is)\s+(.+)$/i);

    const explicitMatch = explicitMyName || explicitNameLabel || explicitIAm;
    if (explicitMatch) {
        const candidate = trimEntity(explicitMatch[1]);
        const limited = candidate.split(/\s+/).slice(0, 3).join(" ");
        if (startsWithNonNameIntro(limited)) return null;
        return isLikelyName(limited) ? limited : null;
    }

    return isLikelyName(text) ? trimEntity(text) : null;
};

const extractExplicitName = (value = "") => {
    const text = normalizeText(value).replace(/\?/g, "");
    if (!text) return null;

    const patterns = [
        /\bmy\s+name\s*(?:is|:)?\s+(.+)/i,
        /^\s*name\s*(?:is|:)?\s+(.+)/i,
        /\b(?:i\s+am|i['’\?]m|im|this\s+is)\s+(.+)/i,
    ];

    let explicitMatch = null;
    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
            explicitMatch = match;
            break;
        }
    }
    if (!explicitMatch) return null;

    const candidate = trimEntity(explicitMatch[1]);
    const limited = candidate.split(/\s+/).slice(0, 3).join(" ");
    if (startsWithNonNameIntro(limited)) return null;
    return isLikelyName(limited) ? limited : null;
};

const stripInternalTags = (value = "") =>
    normalizeText(value)
        .replace(/\[(?:QUESTION_KEY|SUGGESTIONS|MULTI_SELECT|MAX_SELECT):[\s\S]*?\]/gi, "")
        .trim();

const extractNameFromAssistantMessage = (value = "") => {
    const text = stripInternalTags(value);
    if (!text) return null;

    // Common template across services: "Nice to meet you, {name}!"
    const match = text.match(/\bnice\s+to\s+meet\s+you,?\s+(.+?)(?:[!.,\n]|$)/i);
    if (!match) return null;

    const candidate = trimEntity(match[1]);
    const limited = candidate.split(/\s+/).slice(0, 3).join(" ");
    if (!limited) return null;
    if (isGreetingMessage(limited)) return null;
    return isLikelyName(limited) ? limited : null;
};

const shouldApplyWebsiteBudgetRules = (questions = []) =>
    questions.some((q) => q?.key === "tech") &&
    questions.some((q) => q?.key === "pages");

const getCurrentStepFromCollected = (questions = [], collectedData = {}) => {
    const applyWebsiteBudgetRules = shouldApplyWebsiteBudgetRules(questions);
    const applyWebsiteTimelineRules =
        applyWebsiteBudgetRules && questions.some((q) => q?.key === "timeline");
    const skipDeployment = shouldSkipDeploymentQuestion(collectedData);

    for (let i = 0; i < questions.length; i++) {
        const key = questions[i]?.key;
        if (!key) continue;
        if (key === "deployment" && skipDeployment) {
            continue;
        }
        const value = collectedData[key];
        if (value === undefined || value === null || normalizeText(value) === "") {
            return i;
        }

        if (key === "budget" && applyWebsiteBudgetRules) {
            const budgetCheck = validateWebsiteBudget(collectedData);
            if (!budgetCheck.isValid) {
                return i;
            }
        }

        if (key === "timeline" && applyWebsiteTimelineRules) {
            const timelineCheck = validateWebsiteTimeline(collectedData);
            if (!timelineCheck.isValid) {
                return i;
            }
        }
    }
    return questions.length;
};

const buildLowBudgetWarning = (state) => {
    const questions = Array.isArray(state?.questions) ? state.questions : [];
    if (!shouldApplyWebsiteBudgetRules(questions)) return null;
    if (state?.meta?.allowLowBudget) return null;

    const collectedData = state?.collectedData || {};
    const rawBudget = normalizeText(collectedData.budget || "");
    if (!rawBudget || rawBudget === "[skipped]") return null;
    const techValue = normalizeText(collectedData.tech || "");
    if (!techValue || techValue === "[skipped]") return null;

    const budgetCheck = validateWebsiteBudget(collectedData);
    if (!budgetCheck || budgetCheck.reason !== "too_low") return null;

    const requirement = budgetCheck.requirement || null;
    const techLabel =
        requirement?.label ||
        normalizeText(collectedData.tech || "") ||
        "this stack";
    const budgetLabel = formatBudgetForWarning(rawBudget) || rawBudget;
    const minLabel = formatMinimumBudgetLabel(requirement);
    const minSuffix = minLabel ? ` (${minLabel})` : "";

    return (
        `Your budget of ${budgetLabel} is below the minimum for ${techLabel}${minSuffix}. ` +
        "We can still build with your budget, but the quality and polish may vary. " +
        "Would you like to increase the budget or continue with the current budget?"
    );
};

const getQuestionFocusKeyFromUserMessage = (questions = [], message = "") => {
    const text = normalizeText(message);
    if (!text) return null;

    // When the user message contains a question mark but also includes a long brief,
    // only use the *question sentence* to decide what they're asking about.
    const focusText = (() => {
        const matches = Array.from(text.matchAll(/\?(?![a-z0-9])/gi));
        if (!matches.length) return text;
        const last = matches[matches.length - 1];
        const qIndex = typeof last?.index === "number" ? last.index : -1;
        if (qIndex < 0) return text;
        const before = qIndex >= 0 ? text.slice(0, qIndex) : text;
        const lastBoundary = Math.max(
            before.lastIndexOf("."),
            before.lastIndexOf("!"),
            before.lastIndexOf("\n")
        );
        const start = lastBoundary >= 0 ? lastBoundary + 1 : 0;
        return text.slice(start);
    })();

    const messageLower = focusText.toLowerCase();
    const messageCanonical = canonicalize(messageLower);
    if (!messageCanonical) return null;

    let bestKey = null;
    let bestScore = 0;

    for (const question of questions) {
        const key = question?.key;
        if (!key) continue;

        const patterns = new Set();
        patterns.add(key.replace(/_/g, " "));
        if (Array.isArray(question.patterns)) {
            for (const pattern of question.patterns) {
                const cleaned = normalizeText(pattern);
                if (cleaned) patterns.add(cleaned);
            }
        }

        let score = 0;
        for (const pattern of patterns) {
            const patternLower = pattern.toLowerCase();
            if (!patternLower) continue;

            if (!patternLower.includes(" ")) {
                const re = new RegExp(`\\b${escapeRegExp(patternLower)}\\b`, "i");
                if (re.test(messageLower)) score += Math.min(patternLower.length, 12);
                continue;
            }

            const patternCanonical = canonicalize(patternLower);
            if (patternCanonical && messageCanonical.includes(patternCanonical)) {
                score += Math.min(patternCanonical.length, 16);
            }
        }

        if (score > bestScore) {
            bestKey = key;
            bestScore = score;
        }
    }

    if (!bestKey || bestScore < 4) return null;
    return bestKey;
};

const extractKnownFieldsFromMessage = (questions = [], message = "", collectedData = {}) => {
    const text = normalizeText(message);
    if (!text || isGreetingMessage(text)) return {};
    const userAskedQuestion = isUserQuestion(text);
    const isBrief = looksLikeProjectBrief(text);
    const treatAsQuestionForInference = userAskedQuestion && !isBrief;
    const extractionText = isBrief ? stripTrailingQuestionSentence(text) : text;
    const parsingText = stripMarkdownFormatting(extractionText);

    const keys = new Set(questions.map((q) => q.key));
    const updates = {};

    if (keys.has("budget")) {
        const budget = extractBudget(parsingText);
        if (budget) {
            const hasBudgetCue =
                /\b(budget|cost|price|spend)\b/i.test(parsingText) ||
                /\b(inr|rs\.?|rupees?)\b/i.test(parsingText) ||
                parsingText.includes("\u20B9");
            if (hasBudgetCue || isBareBudgetAnswer(parsingText)) {
                updates.budget = budget;
            }
        }
    }

    if (keys.has("timeline")) {
        const timeline = extractTimeline(parsingText);
        if (timeline) updates.timeline = timeline;
    }

    if (keys.has("name") && !collectedData.name) {
        // Only extract a name out-of-sequence when it's explicitly stated, to avoid
        // misclassifying values like "portfolio" or "landing page" as a person's name.
        const name = extractExplicitName(parsingText);
        if (name) updates.name = name;
    }

    const orgKey = keys.has("company")
        ? "company"
        : keys.has("business_name")
            ? "business_name"
            : keys.has("business")
                ? "business"
                : keys.has("brand")
                    ? "brand"
                    : keys.has("project")
                        ? "project"
                        : null;

    if (orgKey && !collectedData[orgKey]) {
        const org = extractOrganizationName(parsingText);
        if (org) updates[orgKey] = org;
    }

    const descriptionKey =
        keys.has("brief")
            ? "brief"
            : keys.has("description")
                ? "description"
                : keys.has("summary")
                    ? "summary"
                    : keys.has("vision")
                        ? "vision"
                        : keys.has("problem")
                            ? "problem"
                            : keys.has("business_info")
                                ? "business_info"
                                : null;

    if (descriptionKey && !collectedData[descriptionKey] && !treatAsQuestionForInference) {
        const description = extractDescriptionFromMixedMessage(parsingText);
        if (description) {
            updates[descriptionKey] = description;
        } else if (isBrief) {
            updates[descriptionKey] = parsingText;
        }
    }

    if (keys.has("tech") && !collectedData.tech && !treatAsQuestionForInference) {
        const techSelections = extractTechDetailsFromMessage(parsingText);
        if (techSelections.length) updates.tech = techSelections.join(", ");
    }

    if (keys.has("pages") && !collectedData.pages && !collectedData.pages_inferred && isBrief) {
        const pagesQuestion = questions.find((q) => q.key === "pages");
        const inferred = inferPagesFromBrief(
            pagesQuestion,
            parsingText,
            collectedData.website_type || ""
        );
        if (inferred.length) {
            updates.pages_inferred = inferred.join(", ");
        }
    }

    return updates;
};

const extractAnswerForQuestion = (question = {}, rawMessage = "") => {
    const rawText = normalizeText(rawMessage);
    if (!rawText) return null;

    const message = stripMarkdownFormatting(rawText);
    if (!message) return null;

    if (isSkipMessage(message)) return "[skipped]";

    switch (question?.key) {
        case "name": {
            return extractName(message);
        }
        case "budget": {
            if (isChangeTechnologyMessage(message)) return CHANGE_TECH_SENTINEL;
            const budget = extractBudget(message);
            if (budget) return budget;

            const exactSelections = matchExactSuggestionSelections(question, message);
            if (exactSelections.length) {
                const parsed = extractBudget(exactSelections[0]);
                if (parsed) return parsed;
            }

            const suggestionMatches = matchSuggestionsInMessage(question, message);
            if (suggestionMatches.length) {
                const parsed = extractBudget(suggestionMatches[0]);
                if (parsed) return parsed;
            }

            return null;
        }
        case "timeline": {
            const timeline = extractTimeline(message);
            if (timeline) return timeline;
            break;
        }
        case "tech": {
            const techSelections = extractTechDetailsFromMessage(message);
            if (techSelections.length) return techSelections.join(", ");
            break;
        }
        case "company":
        case "business_name":
        case "business":
        case "brand":
        case "project": {
            const org = extractOrganizationName(message);
            if (org) return org;

            const trimmed = trimEntity(message);
            if (!trimmed) return null;
            if (trimmed.length > 60) return null;
            if (
                /\b(website|web\s*app|app|application|platform|store|shop|marketplace|dashboard|landing\s*page|portfolio|saas|e-?\s*commerce|ecommerce)\b/i.test(
                    trimmed
                )
            ) {
                return null;
            }

            return trimmed;
        }
        default: {
            const exactSelections = matchExactSuggestionSelections(question, message);
            if (exactSelections.length) {
                const limitedMatches =
                    question.multiSelect &&
                    Number.isFinite(question.maxSelect) &&
                    question.maxSelect > 0
                        ? exactSelections.slice(0, question.maxSelect)
                        : exactSelections;

                return question.multiSelect ? limitedMatches.join(", ") : limitedMatches[0];
            }

            const suggestionMatches = matchSuggestionsInMessage(question, message);
            if (suggestionMatches.length) {
                const limitedMatches =
                    question.multiSelect &&
                    Number.isFinite(question.maxSelect) &&
                    question.maxSelect > 0
                        ? suggestionMatches.slice(0, question.maxSelect)
                        : suggestionMatches;

                return question.multiSelect ? limitedMatches.join(", ") : limitedMatches[0];
            }

            if (Array.isArray(question.suggestions) && question.suggestions.length) {
                // If this is a closed-set question and nothing matched, avoid incorrectly
                // capturing a long multi-field message as the answer.
                if (message.length > 80) return null;
            }

            if (isUserQuestion(message)) {
                const qMatch = message.match(/\?(?![a-z0-9])/i);
                const qIndex = qMatch && typeof qMatch.index === "number" ? qMatch.index : -1;
                const beforeQuestion = qIndex >= 0 ? message.slice(0, qIndex).trim() : "";
                const cutAt = Math.max(
                    beforeQuestion.lastIndexOf("."),
                    beforeQuestion.lastIndexOf("!"),
                    beforeQuestion.lastIndexOf("\n")
                );
                const candidate = (cutAt > -1
                    ? beforeQuestion.slice(0, cutAt)
                    : beforeQuestion
                ).trim();

                if (!candidate) return null;
                if (isUserQuestion(candidate)) return null;
                if (isBareBudgetAnswer(candidate) || isBareTimelineAnswer(candidate)) return null;
                if (extractBudget(candidate) && candidate.length <= 30) return null;
                if (extractTimeline(candidate) && candidate.length <= 30) return null;

                return candidate;
            }

            // Avoid capturing pure budget/timeline answers for unrelated questions.
            if (isBareBudgetAnswer(message) || isBareTimelineAnswer(message)) return null;
            const budget = extractBudget(message);
            if (budget && message.length <= 30) return null;
            const timeline = extractTimeline(message);
            if (timeline && message.length <= 30) return null;

            return message;
        }
    }
};


const DEFAULT_CURRENCY = "INR";

const detectCurrency = (text = "", locale = "en-IN") => {
    if (!text) return DEFAULT_CURRENCY;
    if (text.includes("$")) return "USD";
    if (text.includes("\u20B9")) return "INR";
    if (text.includes("\u20AC")) return "EUR";
    if (text.includes("\u00A3")) return "GBP";
    const codeMatch = text.match(/\b(INR|USD|EUR|GBP)\b/i);
    if (codeMatch) return codeMatch[1].toUpperCase();
    if (/\b(rs\.?|rupees?)\b/i.test(text)) return "INR";
    if ((locale || "").toLowerCase().includes("en-in")) return "INR";
    return DEFAULT_CURRENCY;
};

const parseMoneyToken = (raw = "") => {
    const cleaned = normalizeText(raw).replace(/,/g, "").toLowerCase();
    if (!cleaned) return null;
    const match = cleaned.match(
        /^(\d+(?:\.\d+)?)(?:\s*(k|m|mn|l|lakh|lakhs|million))?$/
    );
    if (!match) return null;
    const value = parseFloat(match[1]);
    if (!Number.isFinite(value)) return null;
    const suffix = match[2];
    if (!suffix) return value;
    if (suffix === "k") return value * 1000;
    if (suffix === "m" || suffix === "mn" || suffix === "million") return value * 1000000;
    if (suffix === "l" || suffix === "lakh" || suffix === "lakhs") return value * 100000;
    return value;
};

const normalizeMoneyValue = (raw = "", locale = "en-IN") => {
    const text = normalizeText(raw);
    if (!text) return { status: "invalid", error: "empty" };
    if (/^flexible$/i.test(text)) {
        return { status: "ok", normalized: { flexible: true, currency: detectCurrency(text, locale) }, confidence: 0.7 };
    }

    const lowered = text.toLowerCase().replace(/[–—]/g, "-");
    const currency = detectCurrency(lowered, locale);
    const period = /\b(per\s+month|monthly|\/month)\b/i.test(lowered) ? "month" : null;

    const rangeMatch = lowered.match(
        /(\d[\d,]*(?:\.\d+)?\s*(?:k|m|mn|l|lakh|lakhs|million)?)\s*(?:-|to)\s*(\d[\d,]*(?:\.\d+)?\s*(?:k|m|mn|l|lakh|lakhs|million)?)/i
    );
    if (rangeMatch) {
        const min = parseMoneyToken(rangeMatch[1]);
        const max = parseMoneyToken(rangeMatch[2]);
        if (Number.isFinite(min) && Number.isFinite(max)) {
            const low = Math.min(min, max);
            const high = Math.max(min, max);
            return {
                status: "ok",
                normalized: { min: low, max: high, currency, period },
                confidence: currency ? 0.85 : 0.7,
            };
        }
    }

    const underMatch = lowered.match(
        /\b(under|less than|below)\b[^0-9]*([\d,]+(?:\.\d+)?\s*(?:k|m|mn|l|lakh|lakhs|million)?)/i
    );
    if (underMatch) {
        const max = parseMoneyToken(underMatch[2]);
        if (Number.isFinite(max)) {
            return {
                status: "ok",
                normalized: { min: null, max, currency, period },
                confidence: currency ? 0.8 : 0.6,
            };
        }
    }

    const tokenMatch = lowered.match(/[\d,]+(?:\.\d+)?\s*(?:k|m|mn|l|lakh|lakhs|million)?/i);
    if (tokenMatch) {
        const amount = parseMoneyToken(tokenMatch[0]);
        if (Number.isFinite(amount)) {
            return {
                status: "ok",
                normalized: { min: amount, max: amount, currency, period },
                confidence: currency ? 0.9 : 0.75,
            };
        }
    }

    return { status: "invalid", error: "money_format" };
};

const NUMBER_WORDS = new Map([
    ["one", 1],
    ["two", 2],
    ["three", 3],
    ["four", 4],
    ["five", 5],
    ["six", 6],
    ["seven", 7],
    ["eight", 8],
    ["nine", 9],
    ["ten", 10],
    ["eleven", 11],
    ["twelve", 12],
]);

const parseNumberWordOrDigit = (value = "") => {
    const trimmed = normalizeText(value).toLowerCase();
    if (!trimmed) return null;
    if (NUMBER_WORDS.has(trimmed)) return NUMBER_WORDS.get(trimmed);
    const num = parseFloat(trimmed);
    return Number.isFinite(num) ? num : null;
};

const normalizeDurationValue = (raw = "", allowedUnits = null) => {
    const text = normalizeText(raw);
    if (!text) return { status: "invalid", error: "empty" };
    const lowered = text.toLowerCase();

    if (/^flexible$/.test(lowered) || /\bongoing\b/.test(lowered)) {
        return { status: "ok", normalized: { flexible: true, label: text }, confidence: 0.7 };
    }

    if (/\bby\b/.test(lowered) || /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)\b/.test(lowered)) {
        return { status: "ok", normalized: { label: text, kind: "date" }, confidence: 0.7 };
    }

    const normalized = lowered.replace(/[–—]/g, "-");
    const rangeMatch = normalized.match(
        /(\d+(?:\.\d+)?|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s*(?:-|to)\s*(\d+(?:\.\d+)?|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s*(day|week|month|year)s?/i
    );
    if (rangeMatch) {
        const min = parseNumberWordOrDigit(rangeMatch[1]);
        const max = parseNumberWordOrDigit(rangeMatch[2]);
        const unit = rangeMatch[3].toLowerCase();
        if (Number.isFinite(min) && Number.isFinite(max)) {
            return {
                status: "ok",
                normalized: { min, max, unit },
                confidence: 0.85,
            };
        }
    }

    const singleMatch = normalized.match(
        /(\d+(?:\.\d+)?|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s*(day|week|month|year)s?/i
    );
    if (singleMatch) {
        const value = parseNumberWordOrDigit(singleMatch[1]);
        const unit = singleMatch[2].toLowerCase();
        if (Number.isFinite(value)) {
            return { status: "ok", normalized: { value, unit }, confidence: 0.9 };
        }
    }

    const quickUnits = allowedUnits && allowedUnits.length ? allowedUnits : ["week", "month"];
    const bareNumber = parseNumberWordOrDigit(normalized);
    if (Number.isFinite(bareNumber)) {
        return {
            status: "ambiguous",
            options: quickUnits.map((unit) => `${bareNumber} ${unit}${bareNumber === 1 ? "" : "s"}`),
            confidence: 0.3,
        };
    }

    return { status: "invalid", error: "duration_format" };
};

const normalizeNumberRangeValue = (raw = "") => {
    const text = normalizeText(raw);
    if (!text) return { status: "invalid", error: "empty" };
    const lowered = text.toLowerCase().replace(/[–—]/g, "-");

    const rangeMatch = lowered.match(/(\d+(?:\.\d+)?)[\s-]*(?:to|-)[\s-]*(\d+(?:\.\d+)?)/);
    if (rangeMatch) {
        const min = parseFloat(rangeMatch[1]);
        const max = parseFloat(rangeMatch[2]);
        if (Number.isFinite(min) && Number.isFinite(max)) {
            return {
                status: "ok",
                normalized: { min, max },
                confidence: 0.8,
            };
        }
    }

    const singleMatch = lowered.match(/(\d+(?:\.\d+)?)(\+)?/);
    if (singleMatch) {
        const value = parseFloat(singleMatch[1]);
        if (Number.isFinite(value)) {
            const plus = Boolean(singleMatch[2]);
            return {
                status: "ok",
                normalized: plus ? { min: value, max: null } : { min: value, max: value },
                confidence: 0.75,
            };
        }
    }

    return { status: "invalid", error: "number_format" };
};

const normalizeSelectionValue = (question, raw = "", allowMultiple = false) => {
    const text = normalizeText(raw);
    if (!text) return { status: "invalid", error: "empty" };
    if (!Array.isArray(question?.suggestions) || question.suggestions.length === 0) {
        return { status: "ok", normalized: allowMultiple ? splitSelections(text) : text, confidence: 0.6 };
    }

    const exact = matchExactSuggestionSelections(question, text);
    if (exact.length) {
        const values = allowMultiple ? exact : [exact[0]];
        return { status: "ok", normalized: values, confidence: 0.9 };
    }

    const matches = matchSuggestionsInMessage(question, text);
    if (matches.length) {
        const values = allowMultiple ? matches : [matches[0]];
        return { status: "ok", normalized: values, confidence: 0.8 };
    }

    return { status: "invalid", error: "enum_mismatch" };
};

const normalizeTextValue = (raw = "") => {
    const text = normalizeText(raw);
    if (!text) return { status: "invalid", error: "empty" };
    return { status: "ok", normalized: text, confidence: 0.85 };
};

const formatSlotValue = (slot) => {
    if (!slot || slot.status !== "answered") return "";
    const value = slot.normalized;
    if (value === null || value === undefined) return "";
    if (typeof value === "string") return value;
    if (Array.isArray(value)) return value.join(", ");
    if (typeof value === "number") return `${value}`;
    if (value.flexible && value.label) return value.label;
    if (value.kind === "date" && value.label) return value.label;
    if (value.min !== undefined || value.max !== undefined) {
        const min = Number.isFinite(value.min) ? value.min : null;
        const max = Number.isFinite(value.max) ? value.max : null;
        const unit = value.unit ? value.unit : "";
        const unitLabel = unit ? `${unit}${max !== 1 ? "s" : ""}` : "";
        if (min !== null && max !== null && min === max) {
            return unitLabel ? `${min} ${unitLabel}` : `${min}`;
        }
        if (min !== null && max !== null) {
            return unitLabel ? `${min}-${max} ${unitLabel}` : `${min}-${max}`;
        }
        if (max !== null) return unitLabel ? `${max} ${unitLabel}` : `${max}`;
        if (min !== null) return unitLabel ? `${min}+ ${unitLabel}` : `${min}+`;
    }
    if (value.value && value.unit) {
        const count = value.value;
        const unit = value.unit;
        return `${count} ${unit}${count === 1 ? "" : "s"}`;
    }
    return "";
};

const resolveSlotDisplayValue = (state, key) => {
    if (!state || !key) return "";
    const slot = state?.slots?.[key];
    if (slot?.status === "answered") {
        return formatSlotValue(slot);
    }
    return normalizeText(state?.collectedData?.[key] || "");
};

const applyTemplatePlaceholders = (text, state) => {
    if (!text) return text;
    let output = text;
    const name =
        resolveSlotDisplayValue(state, "name") ||
        resolveSlotDisplayValue(state, "first_name") ||
        resolveSlotDisplayValue(state, "full_name");

    if (name) {
        output = output.replace(/\{name\}/gi, name);
    } else if (/\{name\}/i.test(output)) {
        output = output.replace(/\s*,\s*\{name\}/gi, "");
        output = output.replace(/\{name\}/gi, "");
        output = output.replace(/\s+!/g, "!");
        output = output.replace(/\s+\?/g, "?");
        output = output.replace(/\s{2,}/g, " ");
    }

    if (/\{tech\}/i.test(output)) {
        const tech = resolveSlotDisplayValue(state, "tech") || "your chosen stack";
        output = output.replace(/\{tech\}/gi, tech);
    }

    if (/\{min_budget\}/i.test(output)) {
        const requirement = resolveMinimumWebsiteBudget(state?.collectedData || {});
        const rangeLabel = requirement?.range ? formatBudgetDisplay(requirement.range) : "";
        const min = Number.isFinite(requirement?.min) ? requirement.min : null;
        const minLabel = rangeLabel || (min ? `${formatInr(min)}+` : "");
        const fallback = minLabel || "a realistic budget";
        output = output.replace(/\{min_budget\}/gi, fallback);
    }

    return output.trim();
};

const getQuestionTags = (question = {}) => {
    if (Array.isArray(question.tags) && question.tags.length) return question.tags;
    const key = question.key || "";
    const tags = [];
    if (key.includes("budget")) tags.push("budget");
    if (key.includes("timeline") || key.includes("delivery")) tags.push("timeline");
    if (key.includes("goal")) tags.push("goal");
    if (key.includes("audience")) tags.push("audience");
    if (key.includes("location")) tags.push("location");
    const hasName = key.includes("name");
    if (
        key.includes("company") ||
        key.includes("brand") ||
        key.includes("business") ||
        key.includes("organization") ||
        (hasName && key.includes("project"))
    ) {
        tags.push("company");
    }
    if (key.includes("name")) tags.push("name");
    if (key.includes("brief") || key.includes("summary") || key.includes("description")) tags.push("description");
    if (key.includes("deliverable") || key.includes("format") || key.includes("output")) tags.push("deliverables");
    if (key.includes("platform")) tags.push("platforms");
    if (key.includes("style") || key.includes("tone") || key.includes("mood")) tags.push("style");
    if (key.includes("service_type") || key.endsWith("type")) tags.push("service_type");
    if (key.includes("notes") || key.includes("request")) tags.push("notes");
    return tags;
};

const isRequiredQuestion = (question = {}) => {
    if (typeof question.required === "boolean") return question.required;
    const key = question.key || "";
    return (
        key === "name" ||
        key === "first_name" ||
        key === "full_name" ||
        key === "company" ||
        key === "company_name" ||
        key === "budget" ||
        key === "timeline" ||
        key === "delivery_timeline"
    );
};

const extractLocationFromMessage = (value = "") => {
    const text = normalizeText(value);
    if (!text) return null;
    const match = text.match(/\b(?:based in|located in|from)\s+([^,.;\n]+)/i);
    if (match) return normalizeText(match[1]);
    return null;
};

const extractGoalFromMessage = (value = "") => {
    const text = normalizeText(value);
    if (!text) return null;
    const match = text.match(/\b(?:goal|purpose|objective)\b\s*(?:is|:)?\s*([^,.;\n]+)/i);
    if (match) return normalizeText(match[1]);
    return null;
};

const extractAudienceFromMessage = (value = "") => {
    const text = normalizeText(value);
    if (!text) return null;
    const match = text.match(/\btarget audience\b\s*(?:is|:)?\s*([^,.;\n]+)/i);
    if (match) return normalizeText(match[1]);
    return null;
};

const hasBudgetSignal = (value = "") =>
    /\b(budget|cost|price|spend)\b/i.test(value) ||
    /\b(inr|rs\.?|rupees?)\b/i.test(value) ||
    value.includes("\u20B9") ||
    isBareBudgetAnswer(value);

const hasTimelineSignal = (value = "") =>
    /\b(timeline|deadline|delivery|start|completed)\b/i.test(value) ||
    isBareTimelineAnswer(value);

const hasLocationSignal = (value = "") =>
    /\b(based in|located in|from|location|city|country)\b/i.test(value);

const hasKeywordSignal = (value = "", tags = []) => {
    const lowered = normalizeText(value).toLowerCase();
    return tags.some((tag) => lowered.includes(tag));
};

const createSlotDefaults = () => ({
    status: "empty",
    raw: "",
    normalized: null,
    confidence: 0,
    askedCount: 0,
    clarifiedOnce: false,
    validationErrors: [],
    options: null,
});

const ensureSlot = (slots, key) => {
    if (!slots[key]) slots[key] = createSlotDefaults();
    return slots[key];
};

const recomputeProgress = (state) => {
    const questions = Array.isArray(state?.questions) ? state.questions : [];
    const slots = state?.slots || {};
    const { missingRequired, missingOptional } = buildMissingLists(questions, slots);
    const nextKey = findNextQuestionKey(questions, missingRequired, missingOptional);
    const currentStep = nextKey ? questions.findIndex((q) => q.key === nextKey) : questions.length;
    const asked = Object.keys(slots).filter((key) => (slots[key]?.askedCount || 0) > 0);
    const answered = Object.keys(slots).filter((key) => slots[key]?.status === "answered");

    return {
        ...state,
        missingRequired,
        missingOptional,
        currentStep,
        asked,
        answered,
        isComplete: missingRequired.length === 0 && missingOptional.length === 0,
    };
};

const clearBudgetSlot = (state) => {
    if (!state) return state;
    const next = {
        ...state,
        slots: { ...(state.slots || {}) },
        collectedData: { ...(state.collectedData || {}) },
    };
    if (next.slots.budget) {
        next.slots.budget = createSlotDefaults();
    }
    delete next.collectedData.budget;
    return next;
};

const applySlotResult = (slot, result, raw) => {
    slot.raw = raw;
    slot.validationErrors = [];
    slot.options = null;
    if (result.status === "ok") {
        slot.status = "answered";
        slot.normalized = result.normalized;
        slot.confidence = result.confidence || 0;
        return;
    }
    if (result.status === "ambiguous") {
        slot.status = "ambiguous";
        slot.normalized = null;
        slot.confidence = result.confidence || 0;
        slot.options = Array.isArray(result.options) ? result.options : null;
        if (result.error) slot.validationErrors = [result.error];
        return;
    }
    slot.status = "invalid";
    slot.normalized = null;
    slot.confidence = 0;
    if (result.error) slot.validationErrors = [result.error];
};

const collectQuestionMatches = (question, message) => {
    if (!Array.isArray(question?.suggestions) || question.suggestions.length === 0) {
        return [];
    }
    return matchSuggestionsInMessage(question, message);
};

const evaluateAnswerForQuestion = (question, message, options = {}) => {
    const text = normalizeText(message);
    if (!text) return null;
    const expectedType = question.expectedType || question.expected_type || question.answerType || "text";
    const allowMultiple = question.multiSelect || expectedType === "list";
    const allowedUnits = question.allowedUnits || question.allowed_units || null;
    const wasQuestion = options.wasQuestion === true;
    const force = options.force === true;

    if (expectedType === "money") {
        if (!force && !hasBudgetSignal(text)) return null;
        return normalizeMoneyValue(text);
    }

    if (expectedType === "duration") {
        if (!force && !hasTimelineSignal(text) && !/\b(day|week|month|year)\b/i.test(text)) return null;
        return normalizeDurationValue(text, allowedUnits);
    }

    if (expectedType === "number_range") {
        if (!force && !/\d/.test(text)) return null;
        return normalizeNumberRangeValue(text);
    }

    if (expectedType === "enum") {
        if (!force && collectQuestionMatches(question, text).length === 0) return null;
        return normalizeSelectionValue(question, text, false);
    }

    if (expectedType === "list") {
        if (!force && collectQuestionMatches(question, text).length === 0) return null;
        return normalizeSelectionValue(question, text, true);
    }

    if (!force && wasQuestion) return null;

    const tags = getQuestionTags(question);
    if (force && expectedType === "text" && isGreetingMessage(text)) {
        return { status: "invalid", error: "greeting_only" };
    }
    if (tags.includes("name")) {
        const name = extractExplicitName(text) || extractName(text);
        if (!name && !force) return null;
        return name ? { status: "ok", normalized: name, confidence: 0.8 } : normalizeTextValue(text);
    }
    if (tags.includes("company")) {
        const org = extractOrganizationName(text);
        if (!org && !force) return null;
        return org ? { status: "ok", normalized: org, confidence: 0.8 } : normalizeTextValue(text);
    }
    if (tags.includes("location")) {
        const location = extractLocationFromMessage(text);
        if (!location && !force) return null;
        return location ? { status: "ok", normalized: location, confidence: 0.8 } : normalizeTextValue(text);
    }
    if (tags.includes("goal")) {
        const goal = extractGoalFromMessage(text);
        if (!goal && !force) return null;
        return goal ? { status: "ok", normalized: goal, confidence: 0.75 } : normalizeTextValue(text);
    }
    if (tags.includes("audience")) {
        const audience = extractAudienceFromMessage(text);
        if (!audience && !force) return null;
        return audience ? { status: "ok", normalized: audience, confidence: 0.75 } : normalizeTextValue(text);
    }

    if (looksLikeProjectBrief(text) && !force) {
        return { status: "ok", normalized: text, confidence: 0.7 };
    }

    return normalizeTextValue(text);
};

const buildMissingLists = (questions, slots) => {
    const missingRequired = [];
    const missingOptional = [];
    for (const question of questions) {
        const key = question.key;
        if (!key) continue;
        const slot = slots[key];
        const required = isRequiredQuestion(question);
        const answered = slot?.status === "answered";
        const declined = slot?.status === "declined";
        if (required && !answered) missingRequired.push(key);
        if (!required && !answered && !declined) missingOptional.push(key);
    }
    return { missingRequired, missingOptional };
};

const findNextQuestionKey = (questions, missingRequired, missingOptional) => {
    const targets = missingRequired.length ? missingRequired : missingOptional;
    if (!targets.length) return null;
    const next = questions.find((q) => targets.includes(q.key));
    return next ? next.key : null;
};

const buildForcedChoices = (question) => {
    if (Array.isArray(question?.suggestions) && question.suggestions.length) {
        return question.suggestions;
    }
    const expectedType = question.expectedType || question.answerType;
    if (expectedType === "money") {
        return ["INR 50000-100000", "INR 100000-300000", "INR 300000+", "Not sure yet"];
    }
    if (expectedType === "duration") {
        return ["1 week", "2-4 weeks", "1-2 months", "Flexible"];
    }
    return null;
};

const buildClarificationText = (question) => {
    const examples = Array.isArray(question?.examples) ? question.examples : [];
    if (examples.length >= 2) {
        return `Please reply with something like \"${examples[0]}\" or \"${examples[1]}\".`;
    }
    const forced = buildForcedChoices(question);
    if (Array.isArray(forced) && forced.length >= 2) {
        return "Please choose one option below.";
    }
    return "Please reply with a short, specific answer.";
};

const shouldCaptureOutOfOrder = (question, message) => {
    const text = normalizeText(message);
    if (!text) return false;
    const expectedType = question.expectedType || question.expected_type || question.answerType || "text";
    const tags = getQuestionTags(question);
    const matches = collectQuestionMatches(question, text);
    const hasKeywords = hasKeywordSignal(text, tags);

    if (expectedType === "money") return hasBudgetSignal(text);
    if (expectedType === "duration") {
        return hasTimelineSignal(text) || /\b(day|week|month|year)\b/i.test(text);
    }
    if (expectedType === "number_range") {
        return /\d/.test(text) && (hasKeywords || /\bhow many\b|\bnumber of\b/i.test(text));
    }

    if (matches.length) {
        const generic = matches.every((match) =>
            /^(yes|no|maybe|not sure)$/i.test(normalizeText(match).toLowerCase())
        );
        return generic ? hasKeywords : true;
    }

    if (tags.includes("location")) return hasLocationSignal(text);
    if (tags.includes("name") || tags.includes("company")) return hasKeywords;
    if (tags.includes("goal") || tags.includes("audience")) return hasKeywords;
    if (tags.includes("description") && looksLikeProjectBrief(text)) return true;
    if (tags.includes("notes") && hasKeywords) return true;

    return false;
};

const applyMessageToState = (state, message, activeKey = null) => {
    const rawMessage = normalizeText(message);
    if (!rawMessage) return state;
    const questions = Array.isArray(state?.questions) ? state.questions : [];
    const slots = { ...(state?.slots || {}) };
    const wasQuestion = isUserQuestion(rawMessage);
    const stripped = stripMarkdownFormatting(rawMessage);

    const questionByKey = new Map(questions.map((q) => [q.key, q]));
    const activeQuestion = activeKey ? questionByKey.get(activeKey) : null;

    if (activeQuestion?.key) {
        const slot = ensureSlot(slots, activeQuestion.key);
        slot.askedCount += 1;

        if (isSkipMessage(stripped)) {
            if (isRequiredQuestion(activeQuestion)) {
                applySlotResult(slot, { status: "invalid", error: "required" }, stripped);
            } else {
                slot.status = "declined";
                slot.raw = stripped;
                slot.normalized = null;
                slot.confidence = 1;
            }
        } else {
            const force = !wasQuestion || shouldCaptureOutOfOrder(activeQuestion, stripped);
            const result = force
                ? evaluateAnswerForQuestion(activeQuestion, stripped, { force: true, wasQuestion })
                : null;
            if (result) applySlotResult(slot, result, stripped);
        }
    }

    for (const question of questions) {
        if (!question?.key || question.key === activeKey) continue;
        const slot = ensureSlot(slots, question.key);
        const answered = slot.status === "answered";
        const shouldCapture = shouldCaptureOutOfOrder(question, stripped);
        if (!shouldCapture) continue;

        if (answered && !hasKeywordSignal(stripped, getQuestionTags(question))) {
            continue;
        }

        const result = evaluateAnswerForQuestion(question, stripped, { force: false, wasQuestion });
        if (result) {
            applySlotResult(slot, result, stripped);
        }
    }

    const collectedData = {};
    for (const question of questions) {
        const key = question?.key;
        if (!key) continue;
        const slot = slots[key];
        if (slot?.status === "answered") {
            const formatted = formatSlotValue(slot);
            if (formatted) collectedData[key] = formatted;
        } else if (slot?.status === "declined") {
            collectedData[key] = "[skipped]";
        }
    }

    const { missingRequired, missingOptional } = buildMissingLists(questions, slots);
    const nextKey = findNextQuestionKey(questions, missingRequired, missingOptional);
    const currentStep = nextKey ? questions.findIndex((q) => q.key === nextKey) : questions.length;

    const asked = Object.keys(slots).filter((key) => (slots[key]?.askedCount || 0) > 0);
    const answered = Object.keys(slots).filter((key) => slots[key]?.status === "answered");

    return {
        ...state,
        slots,
        collectedData,
        missingRequired,
        missingOptional,
        asked,
        answered,
        currentStep,
        isComplete: missingRequired.length === 0 && missingOptional.length === 0,
        meta: {
            ...(state?.meta || {}),
            wasQuestion,
        },
    };
};

/**
 * Build conversation state from message history
 * @param {Array} history - Array of {role, content} messages
 * @param {string} service - Service name
 * @returns {Object} State with collectedData and currentStep
 */
export function buildConversationState(history, service) {
    const { questions: rawQuestions, source, definition } = resolveServiceQuestions(service);
    const safeHistory = Array.isArray(history) ? history : [];
    const needsBrief = source !== "catalog";
    const normalizedQuestions = normalizeQuestions(
        needsBrief ? withMandatoryBrief(rawQuestions) : rawQuestions
    );
    const questions = orderQuestionsByFlow(normalizedQuestions);

    const slots = {};
    for (const question of questions) {
        if (question?.key) {
            slots[question.key] = createSlotDefaults();
        }
    }

    let state = {
        service,
        serviceSource: source,
        serviceDefinition: definition,
        questions,
        slots,
        collectedData: {},
        asked: [],
        answered: [],
        missingRequired: [],
        missingOptional: [],
        currentStep: 0,
        isComplete: false,
        pendingQuestionKey: null,
        meta: {},
    };

    let lastQuestionKey = null;
    for (const msg of safeHistory) {
        if (msg?.role === "assistant") {
            const askedKey = getQuestionKeyFromAssistant(msg.content);
            if (askedKey) lastQuestionKey = askedKey;
            continue;
        }
        if (msg?.role === "user") {
            state = applyMessageToState(state, msg.content, lastQuestionKey);
        }
    }

    if (!state.missingRequired?.length && !state.missingOptional?.length) {
        const { missingRequired, missingOptional } = buildMissingLists(questions, state.slots);
        const nextKey = findNextQuestionKey(questions, missingRequired, missingOptional);
        state.missingRequired = missingRequired;
        state.missingOptional = missingOptional;
        state.currentStep = nextKey ? questions.findIndex((q) => q.key === nextKey) : questions.length;
        state.isComplete = missingRequired.length === 0 && missingOptional.length === 0;
    }

    if (lastQuestionKey) {
        state.pendingQuestionKey = lastQuestionKey;
    }

    return state;
}

/**
 * Process the user's current message and update state
 * @param {Object} state - Current conversation state
 * @param {string} message - User's message
 * @returns {Object} Updated state
 */
export function processUserAnswer(state, message) {
    const { questions: rawQuestions, source, definition } = resolveServiceQuestions(state?.service || "");
    const needsBrief = source !== "catalog";
    const normalizedQuestions = normalizeQuestions(
        needsBrief ? withMandatoryBrief(rawQuestions) : rawQuestions
    );
    const questions = orderQuestionsByFlow(
        Array.isArray(state?.questions) && state.questions.length ? state.questions : normalizedQuestions
    );

    const normalizedMessage = normalizeText(message);
    let workingState = state;
    const hasLowBudgetPending = Boolean(workingState?.meta?.lowBudgetPending);
    const budgetDecisionIncrease = hasLowBudgetPending && isIncreaseBudgetDecision(normalizedMessage);
    const budgetDecisionProceed = hasLowBudgetPending && isProceedWithLowBudgetDecision(normalizedMessage);
    const budgetInputDetected =
        hasLowBudgetPending && (hasBudgetSignal(normalizedMessage) || isBareBudgetAnswer(normalizedMessage));

    if (hasLowBudgetPending) {
        if (budgetDecisionProceed) {
            const nextState = recomputeProgress({
                ...workingState,
                meta: {
                    ...(workingState?.meta || {}),
                    lowBudgetPending: false,
                    allowLowBudget: true,
                },
            });
            return nextState;
        }
        if (budgetDecisionIncrease) {
            const cleared = clearBudgetSlot(workingState);
            const nextState = recomputeProgress({
                ...cleared,
                meta: {
                    ...(cleared?.meta || {}),
                    lowBudgetPending: false,
                    allowLowBudget: false,
                },
            });
            return nextState;
        }
        if (!budgetInputDetected) {
            return {
                ...workingState,
                meta: { ...(workingState?.meta || {}), wasQuestion: isUserQuestion(normalizedMessage) },
            };
        }
        workingState = {
            ...workingState,
            meta: { ...(workingState?.meta || {}), lowBudgetPending: false, allowLowBudget: false },
        };
    }

    const greetingOnly =
        !workingState?.pendingQuestionKey && isGreetingMessage(normalizedMessage);

    const activeKey =
        workingState?.pendingQuestionKey ||
        (greetingOnly ? null : questions[workingState?.currentStep || 0]?.key) ||
        null;

    const nextState = applyMessageToState(
        {
            ...workingState,
            questions,
            serviceSource: source,
            serviceDefinition: definition,
        },
        message,
        activeKey
    );

    if (nextState?.meta?.allowLowBudget) {
        const budgetCheck = validateWebsiteBudget(nextState?.collectedData || {});
        if (budgetCheck?.isValid) {
            nextState.meta.allowLowBudget = false;
        }
    }

    return {
        ...nextState,
        pendingQuestionKey: null,
    };
}

/**
 * Get the next humanized question
 * @param {Object} state - Current conversation state
 * @returns {string} Next question with suggestions formatted
 */
export function getNextHumanizedQuestion(state) {
    const questions = Array.isArray(state?.questions) ? state.questions : [];
    const slots = state?.slots || {};
    const locale = state?.i18n?.locale || "en";
    const missingRequired = Array.isArray(state?.missingRequired) ? state.missingRequired : [];
    const missingOptional = Array.isArray(state?.missingOptional) ? state.missingOptional : [];

    if (!questions.length) return null;

    const lowBudgetWarning = buildLowBudgetWarning(state);
    if (lowBudgetWarning) {
        state.meta = { ...(state?.meta || {}), lowBudgetPending: true };
        return `${lowBudgetWarning}\n[SUGGESTIONS: ${LOW_BUDGET_SUGGESTIONS.join(" | ")}]`;
    }

    const findIssue = (requiredOnly) => {
        for (const question of questions) {
            if (!question?.key) continue;
            if (requiredOnly && !isRequiredQuestion(question)) continue;
            const slot = slots[question.key];
            if (slot?.status === "ambiguous" || slot?.status === "invalid") {
                return question.key;
            }
        }
        return null;
    };

    const issueKey = missingRequired.length
        ? findIssue(true)
        : findIssue(false);

    let question = null;
    let text = "";
    let suggestionsOverride = null;
    let isClarification = false;

    if (issueKey) {
        question = questions.find((q) => q.key === issueKey) || null;
        const slot = question ? slots[question.key] : null;
        if (question && slot) {
            isClarification = true;
            const templates = resolveTemplatesForLocale(question, locale);
            const basePrompt = templates.length ? templates[0] : question.prompt || "";
            text = `${basePrompt}\n${buildClarificationText(question)}`.trim();

            if (!slot.clarifiedOnce) {
                slot.clarifiedOnce = true;
            } else {
                suggestionsOverride = buildForcedChoices(question);
                if (suggestionsOverride) {
                    text = `${basePrompt}\nPlease choose one option below.`.trim();
                }
            }

            if (slot.options && slot.options.length) {
                suggestionsOverride = slot.options;
            }
        }
    }

    if (!question) {
        const nextKey = findNextQuestionKey(questions, missingRequired, missingOptional);
        if (!nextKey) return null;
        question = questions.find((q) => q.key === nextKey) || null;
        if (!question) return null;

        const slot = slots[question.key];
        const templates = resolveTemplatesForLocale(question, locale);
        const basePrompt = templates.length ? templates[0] : question.prompt || "";
        const askedCount = slot?.askedCount || 0;
        if (askedCount > 0) {
            text = `Quick check: ${basePrompt}`;
        } else {
            text = basePrompt;
        }
    }

    if (!text && question?.prompt) {
        text = question.prompt;
    }

    text = applyTemplatePlaceholders(text, state);

    const suggestionsToUse =
        Array.isArray(suggestionsOverride) && suggestionsOverride.length
            ? suggestionsOverride
            : question?.suggestions;

    if (suggestionsToUse && suggestionsToUse.length) {
        const tag = question.multiSelect ? "MULTI_SELECT" : "SUGGESTIONS";
        text += `\n[${tag}: ${suggestionsToUse.join(" | ")}]`;
    }

    if (question?.multiSelect && Number.isFinite(question.maxSelect) && question.maxSelect > 0) {
        text += `\n[MAX_SELECT: ${question.maxSelect}]`;
    }

    if (question?.key) {
        state.pendingQuestionKey = question.key;
    }

    return question?.key ? withQuestionKeyTag(text.trim(), question.key) : text.trim();
}

/**
 * Check if we have enough info to generate proposal
 * @param {Object} state - Current conversation state
 * @returns {boolean}
 */
export function shouldGenerateProposal(state) {
    const questions = Array.isArray(state?.questions) ? state.questions : [];
    const slots = state?.slots || {};
    const { missingRequired, missingOptional } = buildMissingLists(questions, slots);
    return missingRequired.length === 0 && missingOptional.length === 0;
}

const parseTimelineWeeks = (value = "") => {
    const text = normalizeText(value).toLowerCase();
    if (!text) return null;

    let match = text.match(/\b(\d+)\s*weeks?\b/);
    if (match) return Math.max(1, parseInt(match[1], 10));

    match = text.match(/\b(\d+)\s*months?\b/);
    if (match) return Math.max(1, parseInt(match[1], 10) * 4);

    match = text.match(/\b(\d+)\s*days?\b/);
    if (match) return Math.max(1, Math.ceil(parseInt(match[1], 10) / 7));

    return null;
};

const parseDurationMonths = (value = "") => {
    const text = normalizeText(value).toLowerCase();
    if (!text) return null;

    let match = text.match(/\b(\d+(?:\.\d+)?)\s*months?\b/);
    if (match) {
        const months = parseFloat(match[1]);
        return Number.isFinite(months) ? Math.max(1, Math.round(months)) : null;
    }

    match = text.match(/\b(\d+(?:\.\d+)?)\s*weeks?\b/);
    if (match) {
        const weeks = parseFloat(match[1]);
        return Number.isFinite(weeks) ? Math.max(1, Math.ceil(weeks / 4)) : null;
    }

    match = text.match(/\b(\d+(?:\.\d+)?)\s*days?\b/);
    if (match) {
        const days = parseFloat(match[1]);
        return Number.isFinite(days) ? Math.max(1, Math.ceil(days / 30)) : null;
    }

    return null;
};

const collectRoadmapFeatureParts = (collectedData = {}) => {
    const normalizeList = (raw = "") =>
        splitSelections(raw)
            .map((part) => normalizeText(part))
            .filter(Boolean)
            .filter((part) => {
                const lower = part.toLowerCase();
                return lower !== "none" && lower !== "[skipped]";
            });

    const pagesRaw = normalizeText(collectedData.pages || collectedData.pages_inferred || "");
    const pages = normalizeList(pagesRaw);

    const integrationsRaw = normalizeText(collectedData.integrations || "");
    const integrations = normalizeList(integrationsRaw);

    const merged = [...pages, ...integrations];
    const seen = new Set();
    const unique = [];
    for (const item of merged) {
        const canon = canonicalize(String(item || "").toLowerCase());
        if (!canon) continue;
        if (seen.has(canon)) continue;
        seen.add(canon);
        unique.push(item);
    }

    return { pages, integrations, all: unique };
};

const collectRoadmapFeatures = (collectedData = {}) =>
    collectRoadmapFeatureParts(collectedData).all;

const buildWebsiteRoadmapMilestones = ({ weeks, isEcommerce, hasAdmin } = {}) => {
    const totalWeeks = Number.isFinite(weeks) && weeks > 0 ? weeks : 6;
    const milestones = [];

    if (isEcommerce) {
        milestones.push("Week 1: Setup, DB schema, auth, UI foundation");
        milestones.push("Week 2: Product catalog + categories, search & filters");
        milestones.push("Week 3: Product pages + reviews, cart + wishlist");
        milestones.push("Week 4: Checkout, payments + webhooks, order flow");
        if (hasAdmin) {
            milestones.push("Week 5: Admin panel, coupons, order tracking, email notifications");
        } else {
            milestones.push("Week 5: Order management + notifications, refinements");
        }
        milestones.push("Week 6: QA, deployment (domain+SSL), handover");
    } else {
        milestones.push("Week 1: Discovery, design direction, setup");
        milestones.push("Week 2: Core pages + content structure");
        milestones.push("Week 3: Forms/integrations, responsive polish");
        milestones.push("Week 4: QA, deployment (domain+SSL), handover");
    }

    // If timeline is shorter, compress to the last N milestones.
    if (totalWeeks <= 4) {
        return milestones.slice(-Math.max(3, totalWeeks));
    }
    if (totalWeeks < milestones.length) {
        return milestones.slice(0, totalWeeks);
    }
    return milestones;
};

export function generateRoadmapFromState(state) {
    const collectedData = state?.collectedData || {};

    const projectName =
        normalizeText(collectedData.company) ||
        normalizeText(collectedData.project) ||
        normalizeText(collectedData.brand) ||
        "Your project";

    const websiteType = normalizeText(collectedData.website_type) || "Website";
    const techStack = normalizeText(collectedData.tech) || "To be confirmed";

    const budgetRaw = normalizeText(collectedData.budget);
    const budgetParsed = budgetRaw ? parseInrBudgetRange(budgetRaw) : null;
    const budgetDisplay = budgetParsed ? formatBudgetDisplay(budgetParsed) || budgetRaw : (budgetRaw || "");

    const timelineRaw = normalizeText(collectedData.timeline);
    const timelineWeeks = parseTimelineWeeks(timelineRaw);

    const description = normalizeText(collectedData.description);
    const featureParts = collectRoadmapFeatureParts(collectedData);
    const features = featureParts.all;

    const isEcommerce =
        websiteType.toLowerCase().includes("e-commerce") ||
        websiteType.toLowerCase().includes("ecommerce") ||
        features.some((f) => canonicalize(f.toLowerCase()) === canonicalize("Shop/Store".toLowerCase())) ||
        features.some((f) => canonicalize(f.toLowerCase()) === canonicalize("Cart/Checkout".toLowerCase()));

    const hasAdmin = features.some(
        (f) => canonicalize(f.toLowerCase()) === canonicalize("Admin Dashboard".toLowerCase())
    );

    const milestones = buildWebsiteRoadmapMilestones({
        weeks: timelineWeeks,
        isEcommerce,
        hasAdmin,
    });

    const pageLine = featureParts.pages.length
        ? featureParts.pages.join(", ")
        : "To be finalized from requirements";

    const integrationsLine = featureParts.integrations.length
        ? featureParts.integrations.join(", ")
        : "None specified yet";

    const summarize = (value = "", maxLen = 180) => {
        const text = normalizeText(value);
        if (!text) return "";
        const cleaned = text.replace(/\s+/g, " ").trim();
        if (cleaned.length <= maxLen) return cleaned;

        const head = cleaned.slice(0, maxLen);
        const lastBoundary = Math.max(head.lastIndexOf("."), head.lastIndexOf("!"), head.lastIndexOf("\n"));
        const trimmed = lastBoundary >= 60 ? head.slice(0, lastBoundary + 1) : head;
        return `${trimmed.trim()}...`;
    };

    const summary = (() => {
        const cleaned = summarize(description);
        const descriptionLooksClean =
            cleaned &&
            cleaned.length <= 140 &&
            !/\b(budget|timeline|deadline|tech\s*stack|stack)\b/i.test(description);
        if (descriptionLooksClean) return cleaned;

        const pageCanon = new Set(featureParts.pages.map((p) => canonicalize(String(p || "").toLowerCase())));
        const integrationCanon = new Set(
            featureParts.integrations.map((p) => canonicalize(String(p || "").toLowerCase()))
        );

        const hasPage = (label) => pageCanon.has(canonicalize(String(label || "").toLowerCase()));
        const hasIntegration = (label) =>
            integrationCanon.has(canonicalize(String(label || "").toLowerCase()));

        const base = isEcommerce ? "E-commerce website" : `${websiteType} website`;
        const highlights = [];

        if (/\b(?:virtual\s*try\s*-?\s*on|try\s*-?\s*on|augmented\s+reality|\bar\b|shade\s*(?:match|test))\b/i.test(
            description
        )) {
            highlights.push("virtual try-on/AR");
        }

        if (hasPage("Products") || hasPage("Shop/Store")) highlights.push("product catalog");
        if (hasPage("Search")) highlights.push("search & filters");
        if (hasPage("Cart/Checkout")) highlights.push("cart & checkout");
        if (hasIntegration("Payment Gateway (Razorpay/Stripe)")) highlights.push("payments");
        if (hasAdmin) highlights.push("admin panel");
        if (hasPage("Order Tracking")) highlights.push("order tracking");
        if (hasPage("Notifications")) highlights.push("notifications");
        if (hasPage("Reviews/Ratings")) highlights.push("reviews");
        if (hasPage("Wishlist")) highlights.push("wishlist");

        const short = highlights.filter(Boolean).slice(0, 6);
        if (!short.length) return base;
        return `${base} with ${short.join(", ")}`;
    })();

    const applyWebsiteBudgetRules =
        Array.isArray(state?.questions) &&
        state.questions.some((q) => q?.key === "tech") &&
        state.questions.some((q) => q?.key === "pages");

    const budgetCheck = applyWebsiteBudgetRules ? validateWebsiteBudget(collectedData) : null;
    const requirement = budgetCheck?.requirement || null;
    const requiredMin = Number.isFinite(requirement?.min) ? requirement.min : null;
    const minLabel = requiredMin ? formatInr(requiredMin) : "";
    const scopeLabel = requirement?.label || "this scope";

    const costBuckets = isEcommerce
        ? [
            { label: "Setup", pct: 0.15 },
            { label: "Catalog+PDP", pct: 0.25 },
            { label: "Checkout+Payments", pct: 0.3 },
            { label: "Admin/Ops", pct: 0.2 },
            { label: "QA+Deploy", pct: 0.1 },
        ]
        : [
            { label: "Discovery+Design", pct: 0.25 },
            { label: "Build", pct: 0.45 },
            { label: "Integrations", pct: 0.15 },
            { label: "QA+Deploy", pct: 0.15 },
        ];

    const shouldUseMinimumForBreakdown =
        Boolean(budgetCheck && !budgetCheck.isValid && budgetCheck.reason === "too_low" && requiredMin);

    const costBaseAmount = (() => {
        if (shouldUseMinimumForBreakdown) return requiredMin;
        if (budgetParsed && Number.isFinite(budgetParsed.max)) return budgetParsed.max;
        return null;
    })();

    const costBaseLabel = costBaseAmount ? formatInr(costBaseAmount) : "";

    const costSplit = (() => {
        const pctOnly = costBuckets
            .map((b) => `${b.label} ${Math.round(b.pct * 100)}%`)
            .join(" | ");

        if (!costBaseAmount) return pctOnly;

        return costBuckets
            .map((b) => {
                const amount = Math.round(costBaseAmount * b.pct);
                return `${b.label} ~${formatInr(amount)}`;
            })
            .join(" | ");
    })();

    const costSplitTitle = (() => {
        if (!costBaseAmount) return "Cost split (rough)";
        if (shouldUseMinimumForBreakdown) return `Cost split (rough, based on minimum ${costBaseLabel})`;
        if (budgetDisplay) return `Cost split (rough, based on ${costBaseLabel})`;
        return `Cost split (rough, based on ${costBaseLabel})`;
    })();

    const feasibilityNote = (() => {
        if (!budgetRaw) return "";
        if (!applyWebsiteBudgetRules || !budgetCheck) return "";
        if (budgetCheck.isValid) return "";

        if (budgetCheck.reason === "too_low" && minLabel) {
            return (
                `\n\nFeasibility: ${budgetDisplay || budgetRaw} is below the minimum for ${scopeLabel} (${minLabel}+).` +
                `\nOptions:` +
                `\n- Increase budget to ${minLabel}+` +
                `\n- Keep budget and reduce scope / phase delivery` +
                `\n- Switch to a lower-cost stack (e.g., WordPress/Shopify)`
            );
        }

        return minLabel ? `\n\nFeasibility: Budget should be at least ${minLabel}+ for ${scopeLabel}.` : "";
    })();

    const titleBits = [
        budgetDisplay ? budgetDisplay : null,
        timelineRaw ? timelineRaw : null,
    ].filter(Boolean);

    const titleSuffix = titleBits.length ? ` (${titleBits.join(", ")})` : "";

    const summaryLine = summary ? `Summary: ${summary}` : "";

    return (
        `Roadmap + Estimate${titleSuffix}\n` +
        `Project: ${stripMarkdownFormatting(projectName)} (${websiteType})\n` +
        `Stack: ${stripMarkdownFormatting(techStack)}\n` +
        (summaryLine ? `${stripMarkdownFormatting(summaryLine)}\n` : "") +
        `Pages/features: ${stripMarkdownFormatting(pageLine)}\n` +
        `Integrations: ${stripMarkdownFormatting(integrationsLine)}\n\n` +
        `Milestones:\n` +
        milestones.map((m) => `- ${m}`).join("\n") +
        `\n\n${costSplitTitle}: ${costSplit}` +
        feasibilityNote
    ).trim();
}

/**
 * Generate proposal from collected state
 * @param {Object} state - Completed conversation state
 * @returns {string} Proposal in [PROPOSAL_DATA] format
 */
export function generateProposalFromState(state) {
    const collectedData = state?.collectedData || {};
    const questions = Array.isArray(state?.questions) ? state.questions : [];
    const slots = state?.slots || {};
    const rawService = normalizeText(state?.service || "");
    const serviceName =
        rawService && rawService.toLowerCase() !== "default"
            ? rawService
            : "General Services";

    const normalizeValue = (value = "") => {
        const text = normalizeText(value);
        if (!text || text === "[skipped]") return "";
        return text;
    };

    const getSlotValue = (key = "") => {
        const slot = slots[key];
        if (slot?.status === "answered") {
            return formatSlotValue(slot);
        }
        return normalizeValue(collectedData[key]);
    };

    const getValuesByTag = (tag) => {
        const values = [];
        const seen = new Set();
        for (const question of questions) {
            if (!question?.key) continue;
            const tags = Array.isArray(question.tags) && question.tags.length
                ? question.tags
                : getQuestionTags(question);
            if (!tags.includes(tag)) continue;
            const value = getSlotValue(question.key);
            if (!value) continue;
            const canon = canonicalize(value.toLowerCase());
            if (canon && !seen.has(canon)) {
                seen.add(canon);
                values.push(value);
            }
        }
        return values;
    };

    const formatCurrency = (amount, currency = DEFAULT_CURRENCY) => {
        if (!Number.isFinite(amount)) return "";
        const locale = currency === "INR" ? "en-IN" : "en-US";
        const rounded = Math.round(amount);
        const formatted = rounded.toLocaleString(locale);
        return `${currency} ${formatted}`;
    };

    const formatBudget = () => {
        const budgetKey = questions.find((q) =>
            (q?.tags || []).includes("budget") || getQuestionTags(q).includes("budget")
        )?.key;
        if (!budgetKey) return normalizeValue(collectedData.budget);
        const slot = slots[budgetKey];
        if (!slot || slot.status !== "answered") return normalizeValue(collectedData[budgetKey]);
        const normalized = slot.normalized;
        if (!normalized) return normalizeValue(collectedData[budgetKey]);
        if (normalized.flexible) return "Flexible";
        const currency = normalized.currency || DEFAULT_CURRENCY;
        const min = Number.isFinite(normalized.min) ? normalized.min : null;
        const max = Number.isFinite(normalized.max) ? normalized.max : null;
        if (min !== null && max !== null && min === max) {
            return formatCurrency(min, currency);
        }
        if (min !== null && max !== null) {
            return `${formatCurrency(min, currency)} - ${formatCurrency(max, currency)}`;
        }
        if (max !== null) return `Under ${formatCurrency(max, currency)}`;
        if (min !== null) return `${formatCurrency(min, currency)}+`;
        return normalizeValue(collectedData[budgetKey]);
    };

    const goals = getValuesByTag("goal").join(", ");
    const audience = getValuesByTag("audience").join(", ");
    const summary = getValuesByTag("description").join(" ");
    const platforms = getValuesByTag("platforms").join(", ");
    const deliverables = getValuesByTag("deliverables").join(", ");
    const style = getValuesByTag("style").join(", ");

    const requirementValues = [];
    for (const value of [deliverables, platforms, style]) {
        if (value) requirementValues.push(value);
    }
    const requirements = requirementValues.join("; ");

    const timeline = getValuesByTag("timeline").join(", ");
    const budget = formatBudget();

    const assumptions = [];
    if (budget && /flexible|not sure/i.test(budget)) {
        assumptions.push("Budget will be finalized after scope confirmation.");
    }
    if (timeline && /flexible|not sure/i.test(timeline)) {
        assumptions.push("Timeline will be finalized after scope confirmation.");
    }

    const isWebsiteFlow =
        questions.some((q) => q?.key === "pages") && questions.some((q) => q?.key === "tech");

    if (isWebsiteFlow) {
        const primaryName =
            resolveSlotDisplayValue(state, "name") ||
            resolveSlotDisplayValue(state, "first_name") ||
            resolveSlotDisplayValue(state, "full_name");
        const projectName =
            getSlotValue("company") ||
            getSlotValue("project") ||
            getSlotValue("brand") ||
            "Website Project";
        const websiteType = getSlotValue("website_type") || "Website";
        const techStack = getSlotValue("tech") || "To be confirmed";
        const design = getSlotValue("design");
        const deployment = getSlotValue("deployment");
        const domain = getSlotValue("domain");

        const cleanList = (items = []) => {
            const seen = new Set();
            const result = [];
            for (const item of items) {
                const text = normalizeText(item);
                if (!text || text === "[skipped]") continue;
                const canon = canonicalize(text.toLowerCase());
                if (!canon || canon === "none") continue;
                if (seen.has(canon)) continue;
                seen.add(canon);
                result.push(text);
            }
            return result;
        };

        const listFromValue = (value) => cleanList(splitSelections(normalizeValue(value)));

        const pagesRaw = getSlotValue("pages") || normalizeValue(collectedData.pages_inferred);
        const pages = listFromValue(pagesRaw);
        const integrations = listFromValue(getSlotValue("integrations"));
        const deployments = listFromValue(deployment);

        const corePages = ["Home", "About", "Contact", "Privacy Policy", "Terms"];

        const sections = ["[PROPOSAL_DATA]", "PROJECT PROPOSAL", ""];

        sections.push("Project Overview");
        sections.push(`- Service: ${serviceName}`);
        sections.push(`- Project: ${projectName}`);
        if (primaryName) sections.push(`- Client: ${primaryName}`);
        sections.push(`- Website type: ${websiteType}`);
        if (techStack) sections.push(`- Tech stack: ${techStack}`);
        sections.push("");

        if (summary) {
            sections.push("Summary");
            sections.push(`- ${summary}`);
            sections.push("");
        }

        sections.push("Pages & Features");
        sections.push(`- Core pages included: ${corePages.join(", ")}`);
        sections.push(`- Additional pages/features: ${pages.length ? pages.join(", ") : "None specified"}`);
        sections.push("");

        sections.push("Integrations");
        sections.push(`- ${integrations.length ? integrations.join(", ") : "None specified"}`);
        sections.push("");

        const infraLines = [];
        if (design) infraLines.push(`- Designs: ${design}`);
        if (deployments.length) infraLines.push(`- Hosting/deployment: ${deployments.join(", ")}`);
        if (domain) infraLines.push(`- Domain: ${domain}`);
        if (infraLines.length) {
            sections.push(...infraLines);
            sections.push("");
        }

        if (assumptions.length) {
            sections.push("Assumptions");
            assumptions.forEach((item) => sections.push(`- ${item}`));
            sections.push("");
        }

        if (timeline) {
            sections.push("Timeline");
            sections.push(`- ${timeline}`);
            sections.push("");
        }

        if (budget) {
            sections.push("Budget");
            sections.push(`- ${budget}`);
            sections.push("");
        }

        sections.push("Next Steps");
        sections.push("- Confirm pages and integrations");
        sections.push("- Share design files, content, and brand assets");
        sections.push("- Approve proposal to start your project");
        sections.push("[/PROPOSAL_DATA]");

        return sections.join("\n").trim();
    }

    const sections = ["[PROPOSAL_DATA]"];

    sections.push("Confirmed Brief");
    sections.push(`- Service: ${serviceName}`);
    if (goals) sections.push(`- Goals: ${goals}`);
    if (audience) sections.push(`- Target audience: ${audience}`);
    if (summary) sections.push(`- Brief: ${summary}`);
    if (requirements) sections.push(`- Key requirements: ${requirements}`);
    sections.push("");

    if (assumptions.length) {
        sections.push("Assumptions");
        assumptions.forEach((item) => sections.push(`- ${item}`));
        sections.push("");
    }

    const scopeLines = [];
    if (deliverables) scopeLines.push(`- Deliverables: ${deliverables}`);
    if (platforms) scopeLines.push(`- Platforms/channels: ${platforms}`);
    if (style) scopeLines.push(`- Style/tone: ${style}`);
    if (scopeLines.length) {
        sections.push("Scope & Deliverables");
        sections.push(...scopeLines);
        sections.push("");
    }

    if (timeline) {
        sections.push("Timeline");
        sections.push(`- ${timeline}`);
        sections.push("");
    }

    if (budget) {
        sections.push("Budget Alignment / Packages");
        sections.push(`- Budget: ${budget}`);
        sections.push("");
    }

    sections.push("Next Steps");
    sections.push("- Confirm the brief");
    sections.push("- Share any missing assets or links");
    sections.push("- Approve proposal to begin");
    sections.push("[/PROPOSAL_DATA]");

    return sections.join("\n").trim();
}

/**
 * Get opening message for a service
 * @param {string} service - Service name
 * @returns {string} Opening greeting
 */
export function getOpeningMessage(service) {
    return getChatbot(service).openingMessage;
}


