/**
 * Conversation State Machine for Chatbot
 * 
 * Deterministic state tracking to prevent:
 * - Context loss
 * - Question repetition
 * - Robotic tone
 */

import { CHATBOTS_BY_SERVICE, getChatbot } from "./chatbots/index.js";

export const SERVICE_QUESTIONS_MAP = Object.freeze(
    Object.fromEntries(
        Object.entries(CHATBOTS_BY_SERVICE).map(([service, chatbot]) => [
            service,
            chatbot.questions,
        ])
    )
);

const QUESTION_KEY_TAG_REGEX = /\[QUESTION_KEY:\s*([^\]]+)\]/i;

const normalizeText = (value = "") => (value || "").toString().trim();

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

    match = text.match(/\b(\d+(?:\.\d+)?)\s*(k)\b/i);
    if (match) return `${match[1]}k`;

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
    const hasCustomReactNode =
        tech.includes("react.js + node.js") ||
        tech.includes("mern") ||
        tech.includes("pern");

    const bases = [
        { when: hasWordPress, key: "wordpress", label: "WordPress", min: 30000 },
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

const buildWebsiteBudgetSuggestions = (requirement) => {
    if (!requirement) return null;

    const requiredMin = Number.isFinite(requirement?.min) ? requirement.min : null;
    const minLabel = requiredMin ? formatInr(requiredMin) : "";
    const suggestions = [];

    if (requirement?.range && Number.isFinite(requirement.range?.max)) {
        const rangeMin = Number.isFinite(requiredMin) ? requiredMin : requirement.range.min;
        const rangeMax = requirement.range.max;
        if (Number.isFinite(rangeMin) && Number.isFinite(rangeMax)) {
            suggestions.push(
                `${requirement.label} (${formatInr(rangeMin)} - ${formatInr(rangeMax)})`
            );
        }
    } else if (requirement?.label && minLabel) {
        suggestions.push(`${requirement.label} (${minLabel}+)`);
    } else if (minLabel) {
        suggestions.push(minLabel);
    }

    suggestions.push("Change technology");

    return suggestions.filter(Boolean);
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

const getCurrentStepFromCollected = (questions = [], collectedData = {}) => {
    const applyWebsiteBudgetRules =
        questions.some((q) => q?.key === "tech") &&
        questions.some((q) => q?.key === "pages");

    for (let i = 0; i < questions.length; i++) {
        const key = questions[i]?.key;
        if (!key) continue;
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
    }
    return questions.length;
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
        if (budget) updates.budget = budget;
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
        keys.has("description")
            ? "description"
            : keys.has("summary")
                ? "summary"
                : keys.has("vision")
                    ? "vision"
                    : null;

    if (descriptionKey && !collectedData[descriptionKey] && !treatAsQuestionForInference) {
        const hasIntentVerb = /(need|looking|build|create|develop|want|require|make)\b/i.test(parsingText);
        const hasIsA = /\b(?:it\s+is|it's|it’s|this\s+is)\b/i.test(parsingText);
        const hasProjectNoun =
            /(website|web\s*app|app|platform|tool|manager|system|dashboard|store|marketplace|landing\s*page|e-?commerce|portfolio|saas|product)\b/i.test(
                parsingText
            );

        const looksDescriptive =
            parsingText.length >= 25 && (hasIntentVerb || (hasIsA && hasProjectNoun));
        if (looksDescriptive) {
            const refined = extractDescriptionFromMixedMessage(parsingText);
            if (refined) {
                updates[descriptionKey] = refined;
            } else if (!/\b(budget|tech|timeline)\b/i.test(parsingText) && parsingText.length <= 240) {
                updates[descriptionKey] = parsingText;
            }
        }
    }

    if (keys.has("website_type") && !treatAsQuestionForInference) {
        const already =
            normalizeText(collectedData.website_type) || normalizeText(updates.website_type);
        if (!already) {
            const lower = normalizeForSuggestionMatching(parsingText).toLowerCase();

            let score = 0;
            if (/\b(e-?\s*commerce|ecommerce)\b/i.test(lower)) score += 4;
            if (/\bmarketplace\b/i.test(lower)) score += 3;
            if (/\bonline\b[\s\S]{0,40}\b(?:store|shop|boutique)\b/i.test(lower)) score += 3;
            if (/\b(?:store|shop|boutique)\b/i.test(lower)) score += 1;
            if (/\b(?:sell|selling|buy|purchase|purchases)\b/i.test(lower)) score += 2;
            if (/\b(?:product|products|catalog(?:ue)?|collection|collections)\b/i.test(lower)) score += 1;
            if (/\b(?:cart|checkout)\b/i.test(lower)) score += 2;
            if (/\b(?:payments?|payment|pay\b|razorpay|stripe)\b/i.test(lower)) score += 2;
            if (/\b(?:order|orders)\b/i.test(lower)) score += 1;
            if (/\b(?:tracking|track)\b/i.test(lower)) score += 1;
            if (/\b(?:inventory|stock|sku|discount|coupon|wishlist)\b/i.test(lower)) score += 1;

            const looksEcom =
                score >= 3 ||
                (/\b(?:cart|checkout)\b/i.test(lower) &&
                    /\b(?:products?|shop|store|boutique)\b/i.test(lower));

            if (looksEcom) updates.website_type = "E-commerce";
        }
    }

    if (
        keys.has("pages") &&
        !treatAsQuestionForInference &&
        isBrief &&
        !collectedData.pages &&
        !collectedData.pages_inferred &&
        !updates.pages_inferred
    ) {
        const pagesQuestion = questions.find((q) => q?.key === "pages");
        const websiteTypeHint = updates.website_type || collectedData.website_type || "";
        const inferred = inferPagesFromBrief(pagesQuestion, parsingText, websiteTypeHint);
        if (inferred.length) {
            updates.pages_inferred = inferred.join(", ");
        }
    }

    // Out-of-sequence extraction for closed-set questions (suggestions).
    // This helps when users mention things early like "React + Node" or "host on Vercel".
    for (const question of questions) {
        const key = question?.key;
        if (!key) continue;
        if (!keys.has(key)) continue;
        if (updates[key] !== undefined) continue;

        // Avoid inferring selections from user questions (they're often exploratory, not confirmations).
        if (treatAsQuestionForInference) continue;
        if (collectedData[key] !== undefined && collectedData[key] !== null && normalizeText(collectedData[key]) !== "") {
            continue;
        }
        if (!Array.isArray(question?.suggestions) || question.suggestions.length === 0) continue;

        // Pages can be accidentally inferred from generic words (e.g. "help"), so always ask explicitly.
        if (key === "pages") continue;

        const matches = matchSuggestionsInMessage(question, parsingText);
        if (!matches.length) continue;

        // Website type is high-signal and safe to infer from one-shot briefs.
        if (key === "website_type" && !question.multiSelect) {
            updates[key] = matches[0];
            continue;
        }

        const textCanonical = canonicalize(parsingText.toLowerCase());
        const isShort = parsingText.length <= 90;
        const hasListSeparators = /[,|\n]/.test(parsingText);
        const hasKeyPatterns = Array.isArray(question.patterns)
            ? question.patterns.some((pattern) => {
                const canon = canonicalize(pattern || "");
                return canon ? textCanonical.includes(canon) : false;
            })
            : false;

        const hasDeploymentContext =
            key === "deployment"
                ? /\b(deploy|deployment|host(?:ed|ing)?|hosting)\b/i.test(parsingText)
                : false;
        const effectiveHasKeyPatterns =
            key === "deployment" ? hasKeyPatterns || hasDeploymentContext : hasKeyPatterns;

        const singleMatchCanon =
            matches.length === 1 ? canonicalize(String(matches[0] || "").toLowerCase()) : null;
        const isLowSignalSingleMatch =
            Boolean(singleMatchCanon) &&
            (singleMatchCanon === "notsureyet" || singleMatchCanon === "nopreference");

        // Prevent generic answers like "Not sure" from accidentally populating unrelated fields
        // when the user sends a long brief (e.g. "not sure about design" should not auto-fill deployment).
        if (!isShort && isLowSignalSingleMatch) {
            if (key === "deployment") {
                if (!hasDeploymentContext) continue;
            } else if (!effectiveHasKeyPatterns) {
                continue;
            }
        }

        // Deployment providers can overlap with generic words (e.g. "render") inside long briefs.
        // Only infer deployment out-of-sequence when the user explicitly talks about hosting/deployment
        // (or they list multiple providers).
        if (
            key === "deployment" &&
            !isShort &&
            !effectiveHasKeyPatterns &&
            !(question.multiSelect && matches.length >= 2)
        ) {
            continue;
        }

        // Only accept out-of-sequence suggestion inference when the message looks like a direct selection.
        // This avoids accidental matches in long, descriptive messages.
        if (
            !isShort &&
            !hasListSeparators &&
            !effectiveHasKeyPatterns &&
            !(question.multiSelect && matches.length >= 2)
        ) {
            continue;
        }

        const limitedMatches =
            question.multiSelect && Number.isFinite(question.maxSelect) && question.maxSelect > 0
                ? matches.slice(0, question.maxSelect)
                : matches;

        updates[key] = question.multiSelect ? limitedMatches.join(", ") : limitedMatches[0];
    }

    // If we inferred a tech stack option (e.g. "React.js + Node.js"), append any extra stack details
    // provided in a one-shot message (e.g. "Prisma", "Neon DB", "open-source model").
    if (keys.has("tech") && !treatAsQuestionForInference) {
        const base = normalizeText(updates.tech || collectedData.tech || "");
        const details = extractTechDetailsFromMessage(parsingText);
        if (details.length) {
            const baseCanon = canonicalize(base.toLowerCase());
            const extras = details.filter((item) => {
                const canon = canonicalize(item.toLowerCase());
                if (!canon) return false;
                if (baseCanon && baseCanon.includes(canon)) return false;
                return true;
            });

            if (!base && extras.length) {
                updates.tech = extras.join(", ");
            } else if (base && extras.length) {
                updates.tech = `${base}, ${extras.join(", ")}`;
            }
        }
    }

    // Out-of-sequence extraction for closed-set questions (suggestions).
    // This helps when users mention things early like "React + Node" or "host on Vercel".
    for (const question of questions) {
        const key = question?.key;
        if (!key) continue;
        if (!keys.has(key)) continue;
        if (updates[key] !== undefined) continue;

        // Avoid inferring selections from user questions (they're often exploratory, not confirmations).
        if (userAskedQuestion) continue;
        if (collectedData[key] !== undefined && collectedData[key] !== null && normalizeText(collectedData[key]) !== "") {
            continue;
        }
        if (!Array.isArray(question?.suggestions) || question.suggestions.length === 0) continue;

        // Pages can be accidentally inferred from generic words (e.g. "help"), so always ask explicitly.
        if (key === "pages") continue;

        const matches = matchSuggestionsInMessage(question, text);
        if (!matches.length) continue;

        const textCanonical = canonicalize(text.toLowerCase());
        const isShort = text.length <= 90;
        const hasListSeparators = /[,|\n]/.test(text);
        const hasKeyPatterns = Array.isArray(question.patterns)
            ? question.patterns.some((pattern) => {
                const canon = canonicalize(pattern || "");
                return canon ? textCanonical.includes(canon) : false;
            })
            : false;

        // Only accept out-of-sequence suggestion inference when the message looks like a direct selection.
        // This avoids accidental matches in long, descriptive messages.
        if (!isShort && !hasListSeparators && !hasKeyPatterns && !(question.multiSelect && matches.length >= 2)) {
            continue;
        }

        const limitedMatches =
            question.multiSelect && Number.isFinite(question.maxSelect) && question.maxSelect > 0
                ? matches.slice(0, question.maxSelect)
                : matches;

        updates[key] = question.multiSelect ? limitedMatches.join(", ") : limitedMatches[0];
    }

    return updates;
};

const extractAnswerForQuestion = (question, rawMessage) => {
    const message = normalizeText(rawMessage);
    if (!question || !message) return null;
    if (isGreetingMessage(message)) return null;
    if (isSkipMessage(message)) return "[skipped]";

    switch (question.key) {
        case "company":
        case "business":
        case "business_name":
        case "brand":
        case "project": {
            if (isUserQuestion(message)) return null;
            if (isBareBudgetAnswer(message) || isBareTimelineAnswer(message)) return null;
            const budget = extractBudget(message);
            if (budget && message.length <= 30) return null;
            const timeline = extractTimeline(message);
            if (timeline && message.length <= 30) return null;

            const org = extractOrganizationName(message);
            if (org) return org;
            return message.length <= 60 ? trimEntity(message) : null;
        }
        case "budget": {
            if (isChangeTechnologyMessage(message)) return CHANGE_TECH_SENTINEL;
            return extractBudget(message);
        }
        case "timeline": {
            return extractTimeline(message);
        }
        case "name": {
            return extractName(message);
        }
        default: {
            const exactSelections = matchExactSuggestionSelections(question, message);
            if (exactSelections.length) {
                const limitedMatches =
                    question.multiSelect && Number.isFinite(question.maxSelect) && question.maxSelect > 0
                        ? exactSelections.slice(0, question.maxSelect)
                        : exactSelections;

                return question.multiSelect ? limitedMatches.join(", ") : limitedMatches[0];
            }

            const suggestionMatches = matchSuggestionsInMessage(question, message);
            if (suggestionMatches.length) {
                const limitedMatches =
                    question.multiSelect && Number.isFinite(question.maxSelect) && question.maxSelect > 0
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


/**
 * Build conversation state from message history
 * @param {Array} history - Array of {role, content} messages
 * @param {string} service - Service name
 * @returns {Object} State with collectedData and currentStep
 */
export function buildConversationState(history, service) {
    const { questions } = getChatbot(service);
    const safeHistory = Array.isArray(history) ? history : [];
    const collectedData = {};

    // Extract structured fields even if the user answered out-of-sequence.
    for (const msg of safeHistory) {
        if (msg?.role === "user") {
            Object.assign(
                collectedData,
                extractKnownFieldsFromMessage(questions, msg.content, collectedData)
            );
        }
    }

    // Map user replies to the exact question asked (tagged in assistant messages).
    for (let i = 0; i < safeHistory.length - 1; i++) {
        const botMsg = safeHistory[i];
        const userMsg = safeHistory[i + 1];
        if (botMsg?.role !== "assistant" || userMsg?.role !== "user") continue;

        const askedKey = getQuestionKeyFromAssistant(botMsg.content);
        if (!askedKey) continue;

        const question = questions.find((q) => q.key === askedKey);
        if (!question) continue;

        const answer = extractAnswerForQuestion(question, userMsg.content);
        if (question.key === "budget" && answer === CHANGE_TECH_SENTINEL) {
            collectedData.tech = "";
            collectedData.budget = "";
            continue;
        }
        if (answer !== null && answer !== undefined) {
            collectedData[question.key] = answer;
        }
    }

    // Recover name from assistant messages when the user provided it before the first tagged question.
    // Example: seeded opening prompt -> user sends "Kaif" -> assistant moves on to company.
    if (!collectedData.name && questions.some((q) => q.key === "name")) {
        for (const msg of safeHistory) {
            if (msg?.role !== "assistant") continue;
            const inferred = extractNameFromAssistantMessage(msg.content);
            if (inferred) {
                collectedData.name = inferred;
                break;
            }
        }
    }

    const currentStep = getCurrentStepFromCollected(questions, collectedData);

    return {
        collectedData,
        currentStep,
        questions,
        service,
        isComplete: currentStep >= questions.length,
    };
}

/**
 * Process the user's current message and update state
 * @param {Object} state - Current conversation state
 * @param {string} message - User's message
 * @returns {Object} Updated state
 */
export function processUserAnswer(state, message) {
    const questions = Array.isArray(state?.questions) ? state.questions : [];
    const collectedData = { ...(state?.collectedData || {}) };
    const rawMessage = normalizeText(message);
    const normalized = (() => {
        const i18n = state?.i18n;
        const lastOptions = i18n?.lastOptions;
        if (!lastOptions?.questionKey || !lastOptions?.map) return rawMessage;

        const activeStep = Number.isInteger(state?.currentStep)
            ? state.currentStep
            : getCurrentStepFromCollected(questions, collectedData);
        const activeKey = questions[activeStep]?.key || null;
        if (!activeKey || activeKey !== lastOptions.questionKey) return rawMessage;

        const map = lastOptions.map;
        if (!map || typeof map !== "object") return rawMessage;

        const parts = splitSelections(rawMessage);
        if (parts.length <= 1) {
            const canon = canonicalizeForI18n(rawMessage);
            return canon && map[canon] ? map[canon] : rawMessage;
        }

        const mapped = parts.map((part) => {
            const canon = canonicalizeForI18n(part);
            return canon && map[canon] ? map[canon] : part;
        });
        return mapped.join(", ");
    })();
    const wasQuestion = isUserQuestion(rawMessage);

    const activeStep = Number.isInteger(state?.currentStep)
        ? state.currentStep
        : getCurrentStepFromCollected(questions, collectedData);
    const activeQuestion = questions[activeStep];
    const activeKey = activeQuestion?.key || null;
    const beforeActiveValue = activeKey ? collectedData[activeKey] : undefined;

    if (activeKey === "budget" && isChangeTechnologyMessage(normalized)) {
        collectedData.tech = "";
        collectedData.budget = "";
    }

    const extracted = extractKnownFieldsFromMessage(questions, normalized, collectedData);
    Object.assign(collectedData, extracted);

    let answeredKey = null;

    if (activeQuestion?.key) {
        const afterActiveValue = collectedData[activeQuestion.key];
        const hadValueBefore =
            beforeActiveValue !== undefined &&
            beforeActiveValue !== null &&
            normalizeText(beforeActiveValue) !== "";
        const hasValueAfter =
            afterActiveValue !== undefined &&
            afterActiveValue !== null &&
            normalizeText(afterActiveValue) !== "";

        if (!hadValueBefore && hasValueAfter) {
            answeredKey = activeQuestion.key;
        } else if (!hasValueAfter) {
            const answer = extractAnswerForQuestion(activeQuestion, normalized);
            if (answer !== null && answer !== undefined) {
                collectedData[activeQuestion.key] = answer;
                answeredKey = activeQuestion.key;
            }
        }
    }

    if (activeKey === "pages" && normalizeText(collectedData.pages_inferred)) {
        const inferredSelections = splitSelections(collectedData.pages_inferred)
            .map((part) => normalizeText(part))
            .filter(Boolean)
            .filter((part) => {
                const lower = part.toLowerCase();
                return lower !== "none" && lower !== "[skipped]";
            });

        const explicitRaw = normalizeText(collectedData.pages);
        const explicitSelections = splitSelections(explicitRaw)
            .map((part) => normalizeText(part))
            .filter(Boolean);

        const explicitClean = explicitSelections.filter((part) => {
            const lower = part.toLowerCase();
            return lower !== "none" && lower !== "[skipped]";
        });

        if (inferredSelections.length) {
            const merged = [];
            const seen = new Set();
            const addUnique = (part) => {
                const canon = canonicalize(String(part || "").toLowerCase());
                if (!canon) return;
                if (seen.has(canon)) return;
                seen.add(canon);
                merged.push(part);
            };

            for (const part of inferredSelections) addUnique(part);

            // If user explicitly selected additional pages, merge them. Otherwise treat "None"/"skip" as no add-ons.
            for (const part of explicitClean) addUnique(part);

            collectedData.pages = merged.join(", ");
        }

        delete collectedData.pages_inferred;
    }

    if (activeKey === "budget" && collectedData.budget === CHANGE_TECH_SENTINEL) {
        collectedData.tech = "";
        collectedData.budget = "";
    }

    const currentStep = getCurrentStepFromCollected(questions, collectedData);
    const focusKey = wasQuestion
        ? getQuestionFocusKeyFromUserMessage(questions, normalized)
        : null;
    const nextQuestionKey =
        focusKey &&
        (!collectedData[focusKey] || normalizeText(collectedData[focusKey]) === "") &&
        focusKey !== questions[currentStep]?.key
            ? focusKey
            : null;

    return {
        ...state,
        collectedData,
        currentStep,
        questions,
        isComplete: currentStep >= questions.length,
        meta: {
            answeredKey,
            wasQuestion,
            focusKey,
            nextQuestionKey,
        },
    };
}

/**
 * Get the next humanized question
 * @param {Object} state - Current conversation state
 * @returns {string} Next question with suggestions formatted
 */
export function getNextHumanizedQuestion(state) {
    const { collectedData, currentStep, questions } = state;
    const applyWebsiteBudgetRules =
        questions.some((q) => q?.key === "tech") &&
        questions.some((q) => q?.key === "pages");

    if (currentStep >= questions.length) {
        return null; // Ready for proposal
    }

    const budgetIndex = applyWebsiteBudgetRules
        ? questions.findIndex((q) => q?.key === "budget")
        : -1;
    const hasTechContext = normalizeText(collectedData?.tech) !== "";
    const hasBudgetContext = normalizeText(collectedData?.budget) !== "";
    const budgetCheckForOverride =
        applyWebsiteBudgetRules && budgetIndex >= 0 && hasTechContext && hasBudgetContext
            ? validateWebsiteBudget(collectedData)
            : null;
    const shouldForceBudgetNow = Boolean(budgetCheckForOverride && !budgetCheckForOverride.isValid);

    const overrideKey = shouldForceBudgetNow ? "budget" : state?.meta?.nextQuestionKey;
    const overrideIndex = overrideKey
        ? questions.findIndex((q) => q.key === overrideKey)
        : -1;
    const shouldOverride =
        overrideIndex >= 0 &&
        (shouldForceBudgetNow ||
            !collectedData?.[overrideKey] ||
            normalizeText(collectedData[overrideKey]) === "");

    const question = questions[shouldOverride ? overrideIndex : currentStep];
    const templates = question.templates || [];

    // Pick random template for variety
    let text = templates.length
        ? templates[Math.floor(Math.random() * templates.length)]
        : "";

    // Replace placeholders like {name} with actual values
    for (const [key, value] of Object.entries(collectedData || {})) {
        text = text.replace(new RegExp(`\\{${key}\\}`, "gi"), value);
    }

    let suggestionsOverride = null;

    if (question?.key === "budget" && applyWebsiteBudgetRules) {
        const budgetCheck = validateWebsiteBudget(collectedData);
        const requirement = budgetCheck?.requirement || null;
        const requiredMin = Number.isFinite(requirement?.min) ? requirement.min : null;
        const minLabel = requiredMin ? formatInr(requiredMin) : "";
        suggestionsOverride = buildWebsiteBudgetSuggestions(requirement);
        const hasRange = Boolean(requirement?.range);
        const rangeHint =
            hasRange && requirement?.range
                ? `${formatInr(requirement.range.min)} - ${formatInr(requirement.range.max)}`
                : "";
        const requirementLabel = (() => {
            if (requirement?.baseLabel && requirement?.wants3D) {
                return `${requirement.baseLabel} + 3D`;
            }
            return requirement?.label || "this project";
        })();

        const providedRaw = normalizeText(collectedData?.budget);
        if (providedRaw && !budgetCheck.isValid) {
            if (budgetCheck.reason === "too_low" && budgetCheck.parsed && minLabel) {
                const provided = formatBudgetDisplay(budgetCheck.parsed) || providedRaw;
                const extra = rangeHint
                    ? ` 3D custom websites typically range ${rangeHint}.`
                    : "";

                const reply =
                    `Your budget of ${provided} is below the minimum for ${requirementLabel} ` +
                    `(minimum: ${minLabel}). Can you increase it to at least ${minLabel}?${extra}`;

                const suggestionsText =
                    Array.isArray(suggestionsOverride) && suggestionsOverride.length
                        ? suggestionsOverride.join(" | ")
                        : [minLabel, "Change technology"].filter(Boolean).join(" | ");

                return withQuestionKeyTag(
                    `${reply}\n[SUGGESTIONS: ${suggestionsText}]`,
                    question.key
                );
            }

            if (budgetCheck.reason === "unparsed" && minLabel) {
                const extra = rangeHint ? ` 3D projects typically range ${rangeHint}.` : "";
                text =
                    `What budget are you comfortable with in INR? Minimum for ${requirementLabel} ` +
                    `is ${minLabel}.${extra}`;
            }
        } else if (minLabel) {
            const extra = rangeHint ? ` 3D projects typically range ${rangeHint}.` : "";
            text =
                `What's your budget for this project? Minimum for ${requirementLabel} ` +
                `is ${minLabel}.${extra}`;
        }
    }

    if (question?.key === "pages") {
        const inferredRaw = normalizeText(collectedData?.pages_inferred);
        if (inferredRaw) {
            const inferredSelections = splitSelections(inferredRaw)
                .map((part) => normalizeText(part))
                .filter(Boolean)
                .filter((part) => {
                    const lower = part.toLowerCase();
                    return lower !== "none" && lower !== "[skipped]";
                });

            if (inferredSelections.length) {
                const inferredCanons = new Set(
                    inferredSelections
                        .map((part) => canonicalize(part.toLowerCase()))
                        .filter(Boolean)
                );

                const remainingSuggestions = Array.isArray(question.suggestions)
                    ? question.suggestions.filter((option) => {
                        const canon = canonicalize(String(option || "").toLowerCase());
                        if (!canon) return false;
                        if (canon === "none") return true;
                        return !inferredCanons.has(canon);
                    })
                    : null;

                const previewLimit = 10;
                const preview = inferredSelections.slice(0, previewLimit).join(", ");
                const extraCount = inferredSelections.length - previewLimit;
                const captured = extraCount > 0 ? `${preview} +${extraCount} more` : preview;

                text =
                    `I’ve already captured these pages/features from your brief: ${captured}.` +
                    `\nDo you want to add anything else? (Select all that apply)`;

                suggestionsOverride = Array.isArray(remainingSuggestions) && remainingSuggestions.length
                    ? remainingSuggestions
                    : ["None"];
            }
        }
    }

    // Add suggestions if available
    const suggestionsToUse =
        Array.isArray(suggestionsOverride) && suggestionsOverride.length
            ? suggestionsOverride
            : question.suggestions;

    if (suggestionsToUse) {
        const tag = question.multiSelect ? "MULTI_SELECT" : "SUGGESTIONS";
        text += `\n[${tag}: ${suggestionsToUse.join(" | ")}]`;
    }

    if (question.multiSelect && Number.isFinite(question.maxSelect) && question.maxSelect > 0) {
        text += `\n[MAX_SELECT: ${question.maxSelect}]`;
    }

    return withQuestionKeyTag(text, question.key);
}

/**
 * Check if we have enough info to generate proposal
 * @param {Object} state - Current conversation state
 * @returns {boolean}
 */
export function shouldGenerateProposal(state) {
    const questions = Array.isArray(state?.questions) ? state.questions : [];
    const collectedData = state?.collectedData || {};
    return getCurrentStepFromCollected(questions, collectedData) >= questions.length;
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
    const { collectedData, service } = state;

    // Helper: detect if value looks like a budget (must have ₹ or currency indicators)
    const isBudget = (val) => /₹[\d,]+|₹\s*[\d,]+|under\s*₹|[\d,]+\s*(?:lakh|k\b)|inr\s*[\d,]+/i.test(val);

    // Helper: detect if value looks like a timeline
    const isTimeline = (val) => /^\s*(?:\d+[-\s]?\d*\s*)?(?:week|month|day)s?\s*$/i.test(val) || /^flexible$/i.test(val);

    // Helper: detect if value looks like tech stack
    const isTechStack = (val) => /\b(?:react(?:\.?js)?|next(?:\.?js)?|node(?:\.?js)?|wordpress|shopify|laravel|django|mern|pern|vue|frontend\s+only|backend\s+only)\b/i.test(val);

    // Helper: detect if value looks like deployment platform
    const isDeployment = (val) => /vercel|netlify|aws|digitalocean|railway|render|vps|server|heroku/i.test(val);

    // Helper: detect if value looks like domain answer
    const isDomain = (val) => /(?:have|need|don't).*domain|already have domain|i don't have/i.test(val);

    // Helper: detect if value looks like design answer
    const isDesign = (val) => /have design|need design|wireframe|figma|reference|not sure yet/i.test(val);

    // Helper: detect if value looks like website type
    const isWebsiteType = (val) => /landing\s*page|business\s*website|informational|e-commerce|portfolio|web\s*app|saas/i.test(val);

    // Helper: detect if value looks like pages
    const isPages = (val) => /services|products|gallery|testimonials|blog|faq|pricing|shop|store|cart|checkout|wishlist|order|reviews|ratings|search|book\s*now|account|login|dashboard|analytics|support|resources|events|notifications|chat|widget/i.test(val);

    // Helper: detect if value looks like integrations
    const isIntegration = (val) => /payment|razorpay|stripe|paypal|email|sendgrid|mailchimp|delivery|shipping|sms|analytics|social login|google|facebook|crm|marketing|cloud storage|video|chatbot|ai assistant/i.test(val);

    // Smart extraction - analyze ALL collected values and categorize them properly
    let clientName = "";
    let projectName = "";
    let projectDescription = "";
    let websiteType = "";
    let pages = "";
    let designStatus = "";
    let techStack = "";
    let deploymentPlatform = "";
    let domainStatus = "";
    let integrations = "";
    let budget = "";
    let timeline = "";

    // First pass: Get the obvious ones by key
    clientName = collectedData.name || "";
    budget =
        collectedData.budget && collectedData.budget !== "[skipped]"
            ? collectedData.budget
            : "";
    timeline =
        collectedData.timeline && collectedData.timeline !== "[skipped]"
            ? collectedData.timeline
            : "";

    // Second pass: Analyze each value by content
    for (const [key, value] of Object.entries(collectedData)) {
        if (!value || value === "[skipped]") continue;
        const val = value.toString().trim();

        // Skip if already assigned as name
        if (key === "name") continue;

        if (key === "pages" && !pages) {
            pages = val;
            continue;
        }

        // Check patterns in order of specificity
        if (isBudget(val) && !budget) {
            budget = val;
        }
        else if (isTimeline(val) && !timeline) {
            timeline = val;
        }
        else if (isTechStack(val) && !techStack) {
            techStack = val;
        }
        else if (isDeployment(val) && !deploymentPlatform) {
            deploymentPlatform = val;
        }
        else if (isDomain(val) && !domainStatus) {
            domainStatus = val;
        }
        else if (isDesign(val) && !designStatus) {
            designStatus = val;
        }
        else if (isWebsiteType(val) && !websiteType) {
            websiteType = val;
        }
        else if (isPages(val) && !pages) {
            pages = val;
        }
        else if (isIntegration(val) && !integrations) {
            integrations = val;
        }
        // Long descriptive text - likely project description
        else if (val.length > 20 && !projectDescription && !isBudget(val) && !isTimeline(val)) {
            projectDescription = val;
        }
        // Short company/project name
        else if (key === "company" && val.length <= 20 && !projectName) {
            projectName = val;
        }
    }

    // Extract project name from description if it contains "called X" or "named X"
    if (projectDescription && !projectName) {
        const nameMatch = projectDescription.match(/(?:called|named|is)\s+([a-zA-Z0-9]+)/i);
        if (nameMatch) {
            projectName = nameMatch[1].trim();
            // Capitalize first letter
            projectName = projectName.charAt(0).toUpperCase() + projectName.slice(1);
        }
    }

    // Rewrite project description to be more professional
    let formattedDescription = projectDescription;
    if (projectDescription) {
        // Capitalize first letter and ensure proper ending
        formattedDescription = projectDescription.charAt(0).toUpperCase() + projectDescription.slice(1);
        if (!formattedDescription.endsWith('.')) {
            formattedDescription += '.';
        }
    }

    // Apply defaults for missing values
    clientName = clientName || "Client";
    projectName = projectName || "Custom Project";
    formattedDescription = formattedDescription || "Custom web development project as per client requirements.";
    websiteType = websiteType || "Custom Website";
    designStatus = designStatus || "Design assistance required";
    techStack = techStack || "To be recommended based on requirements";
    deploymentPlatform = deploymentPlatform || "To be discussed";
    if (budget) {
        const parsedBudget = parseInrBudgetRange(budget);
        budget = parsedBudget ? formatBudgetDisplay(parsedBudget) || budget : budget;
    }
    budget = budget || "To be discussed";
    timeline = timeline || "Flexible";

    // Format domain status professionally
    let formattedDomain = "To be discussed";
    if (domainStatus) {
        const domainLower = domainStatus.toLowerCase();
        if (domainLower.includes("already have") || (domainLower.includes("have") && !domainLower.includes("don't"))) {
            formattedDomain = "✓ Client owns domain";
        } else if (domainLower.includes("don't") || domainLower.includes("need")) {
            formattedDomain = "Domain purchase required";
        }
    }

    // Format design status professionally
    let formattedDesign = "Design assistance required";
    if (designStatus) {
        const designLower = designStatus.toLowerCase();
        if (designLower.includes("i have") || designLower.includes("have design")) {
            formattedDesign = "✓ Client will provide designs";
        } else if (designLower.includes("need") || designLower.includes("help")) {
            formattedDesign = "Design to be created";
        } else if (designLower.includes("reference")) {
            formattedDesign = "Design from references";
        } else if (designLower.includes("not sure")) {
            formattedDesign = "Design consultation needed";
        }
    }

    // Format pages with default pages included
    const defaultPages = ["Home", "About", "Contact", "Privacy Policy", "Terms of Service"];
    let additionalPages = [];
    if (pages && pages !== "Standard pages") {
        additionalPages = pages
            .split(",")
            .map((p) => p.trim())
            .filter((p) => {
                if (!p) return false;
                const lower = p.toLowerCase();
                return lower !== "none" && lower !== "[skipped]";
            });
    }

    const formattedPages = `  • Default: ${defaultPages.join(", ")}${additionalPages.length > 0 ? "\n  • Additional: " + additionalPages.join(", ") : ""}`;

    return `[PROPOSAL_DATA]
PROJECT PROPOSAL

═══════════════════════════════════════
CLIENT DETAILS
═══════════════════════════════════════
Client Name: ${clientName}
Project Name: ${projectName}
Service: ${service || "Website Development"}

═══════════════════════════════════════
PROJECT OVERVIEW
═══════════════════════════════════════
${formattedDescription}

Website Type: ${websiteType.replace(/,\s*/g, ", ")}

Pages & Features:
${formattedPages}

═══════════════════════════════════════
TECHNICAL SPECIFICATIONS
═══════════════════════════════════════
Technology Stack: ${techStack.replace(/,\s*/g, ", ")}
Deployment: ${deploymentPlatform.replace(/,\s*/g, ", ")}
Domain: ${formattedDomain}
Design: ${formattedDesign}
Integrations: ${integrations ? integrations.replace(/,\s*/g, ", ") : "None specified"}

═══════════════════════════════════════
INVESTMENT & TIMELINE
═══════════════════════════════════════
Budget: ${budget}
Timeline: ${timeline}

═══════════════════════════════════════
NEXT STEPS
═══════════════════════════════════════
1. Review and confirm this proposal
2. Sign agreement and pay deposit (50%)
3. Kickoff meeting to begin work

To customize this proposal, use the Edit Proposal option.
[/PROPOSAL_DATA]`;
}

/**
 * Get opening message for a service
 * @param {string} service - Service name
 * @returns {string} Opening greeting
 */
export function getOpeningMessage(service) {
    return getChatbot(service).openingMessage;
}
