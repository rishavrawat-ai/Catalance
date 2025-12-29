import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const SERVICES_DIR = path.resolve(moduleDir, "..", "data", "services");

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "be",
  "do",
  "for",
  "from",
  "get",
  "have",
  "how",
  "i",
  "in",
  "is",
  "it",
  "me",
  "my",
  "of",
  "on",
  "or",
  "please",
  "provide",
  "share",
  "the",
  "to",
  "we",
  "what",
  "when",
  "where",
  "will",
  "would",
  "you",
  "your",
]);

const normalizeWhitespace = (value = "") =>
  value.replace(/\s+/g, " ").trim();

const normalizeLabel = (value = "") =>
  normalizeWhitespace(value)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const tokenizeLabel = (value = "") =>
  normalizeLabel(value)
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token && !STOP_WORDS.has(token));

const tokensMatch = (labelTokens, promptTokens) => {
  if (!labelTokens.length) return false;
  for (const token of labelTokens) {
    const matched = promptTokens.some((promptToken) => {
      if (promptToken === token) return true;
      if (promptToken.length < 4 || token.length < 4) return false;
      return (
        promptToken.startsWith(token) ||
        token.startsWith(promptToken)
      );
    });
    if (!matched) return false;
  }
  return true;
};

const matchLabelToQuestion = (labels = [], prompt = "") => {
  if (!labels.length || !prompt) return null;
  const promptTokens = tokenizeLabel(prompt);
  for (const label of labels) {
    const labelTokens = tokenizeLabel(label);
    if (tokensMatch(labelTokens, promptTokens)) return label;
  }
  return null;
};

const slugify = (value = "") =>
  normalizeLabel(value).replace(/\s+/g, "_");

const inferTags = (prompt = "", key = "") => {
  const text = normalizeLabel(prompt);
  const tags = new Set();
  const add = (tag) => tags.add(tag);
  const hasName = /\bname\b/.test(text);
  const isNotesPrompt = /\bspecial\b|\bnotes?\b|\brequests?\b/.test(text);

  if (hasName) add("name");
  if (hasName && /\b(company|brand|business|organization|project)\b/.test(text)) {
    add("company");
  }
  if (/\bbased\b|\blocation\b|\bcity\b|\bcountry\b/.test(text)) add("location");
  if (/\bbudget\b|\bprice\b|\bcost\b|\bspend\b/.test(text)) add("budget");
  if (
    /\btimeline\b|\bdeadline\b|\bdelivery\b|\bcompleted\b|\bstart\b|\bwhen\b/.test(
      text
    )
  ) {
    add("timeline");
  }
  if (/\bgoal\b|\bpurpose\b|\bobjective\b/.test(text)) add("goal");
  if (/\baudience\b|\btarget\b/.test(text)) add("audience");
  if (
    !isNotesPrompt &&
    (/\bdescribe\b|\bbriefly\b|\bsummary\b|\bvision\b/.test(text) ||
      /\btell us\b/.test(text) ||
      (/\babout your\b/.test(text) &&
        /\b(business|industry|company|brand|project|product|idea)\b/.test(text)))
  ) {
    add("description");
  }
  if (/\bservice\b/.test(text) && /\btype\b/.test(text)) add("service_type");
  if (
    /\btype\b/.test(text) &&
    /\b(video|audio|support|development|design|marketing|content|writing|website|app|software)\b/.test(
      text
    )
  ) {
    add("service_type");
  }
  if (/\bservices?\b/.test(text) && /\binterested\b/.test(text)) add("service_type");
  if (/\bproject\b/.test(text) && /\btype\b/.test(text)) add("project_type");
  if (/\bnew\b/.test(text) && /\b(rebrand|rebranding|ongoing)\b/.test(text)) {
    add("project_type");
  }
  if (/\bnew\b/.test(text) && /\bexisting\b/.test(text)) add("status");
  if (/\bonline presence\b|\bwebsite\b/.test(text)) {
    if (/\balready\b|\bhave\b|\bcurrently\b|\bnot yet\b|\bneed help\b/.test(text)) {
      add("online_presence");
    }
  }
  if (/\bdeliverables?\b|\bformats?\b|\boutput\b/.test(text)) add("deliverables");
  if (/\bplatforms?\b|\bchannels?\b|\bpublished\b|\bused\b/.test(text)) add("platforms");
  if (/\bfootage\b/.test(text)) add("footage");
  if (/\bduration\b|\blength\b|\bword count\b|\bhow many\b|\bnumber of\b/.test(text)) {
    add("quantity");
    add("timeline");
  }
  if (/\bstyle\b|\btone\b|\bmood\b/.test(text)) add("style");
  if (/\breferences?\b|\binspiration\b|\bportfolio\b|\blinks?\b/.test(text)) add("references");
  if (/\bspecial\b|\bnotes?\b|\brequests?\b/.test(text)) add("notes");
  if (/\bagents?\b|\btraining\b|\btrain\b|\bstaff\b/.test(text)) add("staffing");
  if (
    (/\btechnical\b/.test(text) || /\bgeneral\b/.test(text) || /\bspecialists?\b/.test(text)) &&
    /\bsupport\b/.test(text)
  ) {
    add("support_preference");
  }

  if (key) {
    if (key.includes("budget")) add("budget");
    if (key.includes("timeline") || key.includes("delivery")) add("timeline");
    if (key.includes("audience")) add("audience");
    if (key.includes("goal")) add("goal");
  }

  return Array.from(tags);
};

const inferExpectedType = ({ prompt, suggestions, multiSelect }) => {
  const text = normalizeLabel(prompt);
  if (Array.isArray(suggestions) && suggestions.length) {
    if (multiSelect) return "list";
    const yesNo = suggestions.every((item) =>
      /^(yes|no|maybe|not sure)$/i.test(normalizeLabel(item))
    );
    return yesNo ? "boolean" : "enum";
  }
  if (/\bbudget\b|\bprice\b|\bcost\b|\bspend\b/.test(text)) return "money";
  if (
    /\btimeline\b|\bdeadline\b|\bdelivery\b|\bcompleted\b|\bstart date\b|\bwhen\b|\bduration\b/.test(
      text
    )
  ) {
    return "duration";
  }
  if (/\bword count\b|\bwords?\b/.test(text)) return "number_range";
  if (/\bhow many\b|\bnumber of\b|\bcount\b|\bvolume\b/.test(text)) return "number_range";
  return "text";
};

const inferExamples = ({ expectedType, suggestions }) => {
  if (Array.isArray(suggestions) && suggestions.length) {
    return suggestions.slice(0, 2);
  }
  if (expectedType === "money") {
    return ["INR 100000", "INR 150000-300000"];
  }
  if (expectedType === "duration") {
    return ["2 weeks", "1 month"];
  }
  if (expectedType === "number_range") {
    return ["100", "100-500"];
  }
  return [];
};

const inferKeyFromPrompt = (prompt = "") => {
  const text = normalizeLabel(prompt);
  const rules = [
    { re: /\bfirst name\b/, key: "first_name" },
    { re: /\bfull name\b/, key: "full_name" },
    { re: /\bcompany\b|\bbrand\b|\bproject name\b/, key: "company_name" },
    { re: /\blocation\b|\bbased\b|\bcity\b|\bcountry\b/, key: "location" },
    { re: /\bvideo\b.*\btype\b/, key: "video_type" },
    { re: /\baudio\b.*\btype\b/, key: "audio_service_type" },
    { re: /\bservice\b.*\btype\b/, key: "service_type" },
    { re: /\bprimary goal\b|\bgoal\b|\bpurpose\b/, key: "goal" },
    { re: /\bfootage\b/, key: "footage" },
    { re: /\bplatforms?\b|\bused\b|\bpublished\b/, key: "platforms" },
    { re: /\bduration\b|\blength\b/, key: "duration" },
    { re: /\bstyle\b|\btone\b|\bmood\b/, key: "style" },
    { re: /\bbudget\b/, key: "budget" },
    { re: /\btimeline\b|\bdelivery\b|\bcompleted\b|\bstart\b/, key: "timeline" },
    { re: /\bdeliverables?\b/, key: "deliverables" },
    { re: /\btarget audience\b/, key: "target_audience" },
    { re: /\bword count\b/, key: "word_count" },
    { re: /\boutput format\b/, key: "output_format" },
    { re: /\breferences?\b|\bportfolio\b|\binspiration\b/, key: "references" },
    { re: /\bspecial requests?\b|\bnotes?\b/, key: "notes" },
  ];

  for (const rule of rules) {
    if (rule.re.test(text)) return rule.key;
  }
  return slugify(text.split(" ").slice(0, 6).join(" "));
};

const sanitizeOption = (value = "") => {
  const ascii = value.replace(/[^\x20-\x7E]/g, "");
  return normalizeWhitespace(ascii);
};

const splitSuggestions = (value = "") =>
  value
    .split("|")
    .map((part) => sanitizeOption(part))
    .filter(Boolean);

const deriveTagsFromLabel = (label = "") => {
  const text = normalizeLabel(label);
  const tags = new Set();
  if (/\bname\b/.test(text)) tags.add("name");
  if (/\bcompany\b|\bbrand\b|\bbusiness\b|\borganization\b/.test(text)) tags.add("company");
  if (/\bproject\b/.test(text) && /\bname\b/.test(text)) tags.add("company");
  if (/\blocation\b|\bcity\b|\bcountry\b|\bbased\b/.test(text)) tags.add("location");
  if (/\bgoal\b|\bpurpose\b|\bobjective\b/.test(text)) tags.add("goal");
  if (/\btimeline\b|\bdate\b|\bdelivery\b|\bduration\b|\bcompletion\b/.test(text)) tags.add("timeline");
  if (/\bbudget\b/.test(text)) tags.add("budget");
  if (/\bformat\b|\bdeliverables?\b/.test(text)) tags.add("deliverables");
  if (/\bplatforms?\b|\bchannels?\b|\busage\b/.test(text)) tags.add("platforms");
  if (/\bfootage\b/.test(text)) tags.add("footage");
  if (/\bvolume\b|\bcount\b|\bquantity\b/.test(text)) tags.add("quantity");
  if (/\bservice\b/.test(text) && /\btype\b/.test(text)) tags.add("service_type");
  if (
    /\btype\b/.test(text) &&
    /\b(video|audio|support|development|design|marketing|content|writing|project)\b/.test(text)
  ) {
    tags.add("service_type");
  }
  if (/\bproject\b/.test(text) && /\btype\b/.test(text)) tags.add("project_type");
  if (/\b(rebrand|rebranding|ongoing)\b/.test(text)) tags.add("project_type");
  if (/\bonline presence\b|\bwebsite\b/.test(text)) tags.add("online_presence");
  if (/\bstatus\b/.test(text) && !tags.has("online_presence")) tags.add("status");
  if (/\bagent\b|\btraining\b|\btrain\b|\bstaff\b/.test(text)) tags.add("staffing");
  if (/\bpreference\b/.test(text) && /\bsupport\b/.test(text)) tags.add("support_preference");
  if (/\btone\b|\bmood\b|\bstyle\b/.test(text)) tags.add("style");
  if (/\bdescription\b|\bsummary\b|\bbrief\b|\bvision\b|\bidea\b/.test(text)) tags.add("description");
  return Array.from(tags);
};

const parseServiceFile = (filePath) => {
  const raw = fs.readFileSync(filePath, "utf-8");
  const lines = raw.split(/\r?\n/);

  let serviceName = null;
  let section = null;
  const questions = [];
  const requiredLabels = [];
  const optionalLabels = [];

  for (const line of lines) {
    const headingMatch = line.match(/^#\s+(.+)/);
    if (headingMatch && !serviceName) {
      const heading = headingMatch[1].trim();
      serviceName = heading.split(" - ")[0].trim();
      continue;
    }

    if (/^##\s+Questions/i.test(line)) {
      section = "questions";
      continue;
    }
    if (/^##\s+Required Fields/i.test(line)) {
      section = "required";
      continue;
    }
    if (/^##\s+Optional Fields/i.test(line)) {
      section = "optional";
      continue;
    }
    if (/^##\s+/.test(line)) {
      section = null;
      continue;
    }

    if (section === "questions") {
      const questionMatch = line.match(/^\s*\d+\.\s+(.*)$/);
      if (questionMatch) {
        questions.push({
          prompt: normalizeWhitespace(questionMatch[1]),
          suggestions: null,
          multiSelect: false,
        });
        continue;
      }
      const suggestionMatch = line.match(/\[(SUGGESTIONS|MULTI_SELECT):\s*(.+)\]/i);
      if (suggestionMatch && questions.length) {
        const type = suggestionMatch[1].toUpperCase();
        const values = splitSuggestions(suggestionMatch[2]);
        questions[questions.length - 1].suggestions = values.length ? values : null;
        questions[questions.length - 1].multiSelect = type === "MULTI_SELECT";
        continue;
      }
      const trimmed = normalizeWhitespace(line);
      if (trimmed && questions.length) {
        questions[questions.length - 1].prompt = normalizeWhitespace(
          `${questions[questions.length - 1].prompt} ${trimmed}`
        );
      }
      continue;
    }

    if (section === "required") {
      const match = line.match(/^\s*-\s+(.+)/);
      if (match) requiredLabels.push(normalizeWhitespace(match[1]));
      continue;
    }
    if (section === "optional") {
      const match = line.match(/^\s*-\s+(.+)/);
      if (match) optionalLabels.push(normalizeWhitespace(match[1]));
    }
  }

  const slug = path.basename(filePath).replace(/\.md$/i, "");
  const usedKeys = new Set();
  const requiredTags = new Set(
    requiredLabels.flatMap((label) => deriveTagsFromLabel(label))
  );

  const fields = questions.map((question, index) => {
    const prompt = question.prompt || `Question ${index + 1}`;
    const matchLabel =
      matchLabelToQuestion(requiredLabels, prompt) ||
      matchLabelToQuestion(optionalLabels, prompt);
    let key = matchLabel ? slugify(matchLabel) : inferKeyFromPrompt(prompt);
    if (usedKeys.has(key)) {
      let counter = 2;
      while (usedKeys.has(`${key}_${counter}`)) counter += 1;
      key = `${key}_${counter}`;
    }
    usedKeys.add(key);

    const tags = inferTags(prompt, key);
    const requiredByLabel = Boolean(matchLabelToQuestion(requiredLabels, prompt));
    const optionalByLabel = Boolean(matchLabelToQuestion(optionalLabels, prompt));
    const requiredByTag = tags.some((tag) => requiredTags.has(tag));
    const required = requiredByLabel || (requiredByTag && !optionalByLabel);
    const expectedType = inferExpectedType({
      prompt,
      suggestions: question.suggestions,
      multiSelect: question.multiSelect,
    });
    const examples = inferExamples({
      expectedType,
      suggestions: question.suggestions,
    });

    return {
      key,
      prompt,
      templates: [prompt],
      suggestions: question.suggestions,
      multiSelect: question.multiSelect,
      required,
      expectedType,
      examples,
      tags,
      order: index,
    };
  });

  return {
    id: slug,
    name: serviceName || slug,
    fields,
    requiredLabels,
    optionalLabels,
    sourcePath: filePath,
  };
};

const normalizeServiceKey = (value = "") =>
  normalizeLabel(value)
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .trim();

let cachedSignature = null;
let cachedCatalog = null;

export const getServiceCatalog = () => {
  if (!fs.existsSync(SERVICES_DIR)) return new Map();

  const entries = fs
    .readdirSync(SERVICES_DIR)
    .filter((file) => file.endsWith(".md"));

  const signature = entries
    .map((file) => {
      const fullPath = path.join(SERVICES_DIR, file);
      const stat = fs.statSync(fullPath);
      return `${file}:${stat.mtimeMs}`;
    })
    .join("|");

  if (cachedCatalog && cachedSignature === signature) {
    return cachedCatalog;
  }

  const catalog = new Map();
  for (const file of entries) {
    const fullPath = path.join(SERVICES_DIR, file);
    const definition = parseServiceFile(fullPath);
    const keyName = normalizeServiceKey(definition.name);
    const slugName = normalizeServiceKey(definition.id);
    catalog.set(keyName, definition);
    if (slugName && slugName !== keyName) {
      catalog.set(slugName, definition);
    }
  }

  cachedSignature = signature;
  cachedCatalog = catalog;
  return catalog;
};

export const getServiceDefinition = (service = "") => {
  const key = normalizeServiceKey(service);
  if (!key) return null;
  const catalog = getServiceCatalog();
  return catalog.get(key) || null;
};
