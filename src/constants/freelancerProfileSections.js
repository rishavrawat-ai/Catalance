export const PROFILE_SECTIONS = [
  {
    key: "resumeHeadline",
    title: "Resume headline",
    description: "Highlight the role you're targeting and what you bring to the table.",
    placeholder: "Looking to partner with principal design teams on AI-first interfaces.",
    type: "textarea",
    rows: 3,
  },
  {
    key: "keySkills",
    title: "Key skills",
    description: "List your top skills so clients can filter you correctly.",
    placeholder:
      "Design systems • UX strategy • AI workflow design • React • Tailwind • Storybook",
    type: "textarea",
    rows: 3,
  },
  {
    key: "experienceSummary",
    title: "Experience",
    description: "Summarize recent roles, clients, and impact.",
    placeholder:
      "Lead product designer at Nova Stack. Delivered AI onboarding flows for Intercom, reducing setup time by 42%.",
    type: "textarea",
    rows: 4,
  },
  {
    key: "educationBackground",
    title: "Education & certifications",
    description: "Mention relevant programs, bootcamps, or certifications.",
    placeholder: "B.Des, NID • Google UX Cert • Design Leadership Bootcamp",
    type: "textarea",
    rows: 3,
  },
  {
    key: "portfolioLinks",
    title: "Portfolio & socials",
    description: "Link to up-to-date case studies, dribbble shots, or Github repos.",
    placeholder: "https://figma.com/@you • https://dribbble.com/you • https://github.com/you",
    type: "input",
  },
  {
    key: "availabilityPreferences",
    title: "Availability & preferences",
    description: "Share bandwidth, rate, and preferred engagement models.",
    placeholder:
      "30 hrs / week • Open to fractional leadership • Target rate $80/hr • Prefer remote-first teams",
    type: "textarea",
    rows: 3,
  },
];

export const PROFILE_STORAGE_KEY = "catalance-profile";
