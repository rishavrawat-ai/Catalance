import { PROFILE_SECTIONS, PROFILE_STORAGE_KEY } from "@/constants/freelancerProfileSections";

const safeWindow = typeof window === "undefined" ? null : window;

export const loadFreelancerProfile = () => {
  if (!safeWindow) {
    return { values: {}, updatedAt: null, completion: 0 };
  }

  try {
    const raw = safeWindow.localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) {
      return { values: {}, updatedAt: null, completion: 0 };
    }

    const parsed = JSON.parse(raw);
    const values =
      (parsed && typeof parsed === "object" && parsed.values) ||
      (parsed && typeof parsed === "object" ? parsed : {});
    const updatedAt =
      (parsed && typeof parsed === "object" && parsed.updatedAt) || null;
    const completion = computeCompletion(values);

    return { values, updatedAt, completion };
  } catch (error) {
    console.warn("Unable to load freelancer profile:", error);
    return { values: {}, updatedAt: null, completion: 0 };
  }
};

export const saveFreelancerProfile = (values) => {
  if (!safeWindow) {
    return { values, updatedAt: null, completion: computeCompletion(values) };
  }

  const payload = {
    values,
    updatedAt: new Date().toISOString(),
  };

  try {
    safeWindow.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn("Unable to persist freelancer profile", error);
  }

  return { ...payload, completion: computeCompletion(values) };
};

export const computeCompletion = (values = {}) => {
  const filled = PROFILE_SECTIONS.filter(({ key }) => {
    const value = values[key];
    if (typeof value === "string") {
      return value.trim().length > 0;
    }
    return Boolean(value);
  }).length;

  return Math.round((filled / PROFILE_SECTIONS.length) * 100);
};
