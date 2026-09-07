import { profileSchema, type Profile } from "@/lib/content-validation";

/**
 * Confirmed profile facts only.
 *
 * Everything here is either supplied by the owner or copy taken from the BRD.
 * Do not add employers, job titles, dates, awards, or impact numbers without
 * the owner confirming them. `verifiedLinks`, `resumeAsset`, `portraitAsset`,
 * and `locationOptional` stay empty until real values exist — the UI treats
 * absence as the normal case and simply renders less.
 *
 * See README.md, "Editing the biography".
 */
const raw: Profile = {
  name: "Ankit Kapoor",

  positioning:
    "I investigate how AI changes competition, customer value, and business economics.",

  shortBio:
    "Ankit Kapoor. Former machine learning engineer. MBA candidate at USC Marshall.",

  longBio: [
    "My background is in machine learning engineering, and I am now pursuing an MBA at USC Marshall. I am interested in the decisions around AI: where it creates value, what makes that value defensible, and how to judge whether an investment is worthwhile.",
    "These projects are a way to investigate those questions in public, with assumptions and limitations open to inspection.",
    "Working on models taught me how quickly a capability can be reproduced, and how little that fact settles on its own. A demonstration is not a product, a product is not an advantage, and an advantage is not a return. Each of those steps needs a separate argument, and each one is where most AI cases seem to break.",
    "So the work here is deliberately unfinished in public. Each project states the question first, the method second, and the conclusion only when there is something behind it. Where a project has not produced evidence yet, it says so.",
  ],

  education: [
    { institution: "USC Marshall", credential: "MBA candidate" },
    { institution: "BITS Pilani Dubai", credential: "Computer science" },
  ],

  // Add entries only for destinations the owner has verified, e.g.
  // { label: "LinkedIn", href: "https://www.linkedin.com/in/<slug>" }
  verifiedLinks: [],

  // Asset IDs from content/assets.ts, or null while no real file exists.
  resumeAsset: null,
  portraitAsset: null,

  locationOptional: null,
};

export const profile: Profile = profileSchema.parse(raw);

/** Development-time copy for the contact section, per BRD section 7. */
export const contactPlaceholder = "Contact details will be added before launch.";
