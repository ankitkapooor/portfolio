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

  positioning: "I build decision systems for ambiguous strategic questions.",

  shortBio:
    "Ankit Kapoor. Former machine learning engineer. MBA candidate at USC Marshall.",

  longBio: [
    "My background is in machine learning engineering, and I am now pursuing an MBA at USC Marshall. I am interested in the decisions around technology: where it creates value, what makes that value defensible, how organizations should act on it, and what would have to be true for the economics to work.",
    "The projects here turn those questions into working systems. Some use public data, some use financial filings, and some deliberately use simplified scenarios. The common rule is that assumptions, trade-offs, and limitations should be visible enough for someone else to disagree with them precisely.",
    "Working on models taught me how quickly a capability can be reproduced, and how little that fact settles on its own. A demonstration is not a product, a product is not an advantage, and an advantage is not a return. Each of those steps needs a separate argument, and each one is where most AI cases seem to break.",
    "So the work here is deliberately unfinished in public. Each project states the question first, the method second, and the conclusion only when there is something behind it. Where a project has not produced evidence yet, it says so.",
  ],

  education: [
    { institution: "USC Marshall", credential: "MBA candidate" },
    { institution: "BITS Pilani Dubai", credential: "Computer science" },
  ],

  verifiedLinks: [
    {
      label: "Email",
      href: "mailto:ankit.kapoor.2028@marshall.usc.edu",
    },
    {
      label: "LinkedIn",
      href: "https://www.linkedin.com/in/ankitkapooor/",
    },
    {
      label: "GitHub",
      href: "https://github.com/ankitkapooor",
    },
  ],

  // Asset IDs from content/assets.ts, or null while no real file exists.
  resumeAsset: null,
  portraitAsset: null,

  locationOptional: null,
};

export const profile: Profile = profileSchema.parse(raw);

/** Development-time copy for the contact section, per BRD section 7. */
export const contactPlaceholder = "Contact details will be added before launch.";
