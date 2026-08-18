/**
 * NIST SP 800-171 Rev. 2 family numbering used by CMMC Level 2.
 * Abbreviations follow 32 CFR § 170.14(c)(1) `DD.L#-REQ` numbering.
 */

export type NistSp800171R2Family = {
  chapter: string;
  abbreviation: string;
  title: string;
  requirementCount: number;
};

export const NIST_SP800171_R2_FAMILIES: readonly NistSp800171R2Family[] = [
  {
    chapter: "3.1",
    abbreviation: "AC",
    title: "Access Control",
    requirementCount: 22,
  },
  {
    chapter: "3.2",
    abbreviation: "AT",
    title: "Awareness and Training",
    requirementCount: 3,
  },
  {
    chapter: "3.3",
    abbreviation: "AU",
    title: "Audit and Accountability",
    requirementCount: 9,
  },
  {
    chapter: "3.4",
    abbreviation: "CM",
    title: "Configuration Management",
    requirementCount: 9,
  },
  {
    chapter: "3.5",
    abbreviation: "IA",
    title: "Identification and Authentication",
    requirementCount: 11,
  },
  {
    chapter: "3.6",
    abbreviation: "IR",
    title: "Incident Response",
    requirementCount: 3,
  },
  {
    chapter: "3.7",
    abbreviation: "MA",
    title: "Maintenance",
    requirementCount: 6,
  },
  {
    chapter: "3.8",
    abbreviation: "MP",
    title: "Media Protection",
    requirementCount: 9,
  },
  {
    chapter: "3.9",
    abbreviation: "PS",
    title: "Personnel Security",
    requirementCount: 2,
  },
  {
    chapter: "3.10",
    abbreviation: "PE",
    title: "Physical Protection",
    requirementCount: 6,
  },
  {
    chapter: "3.11",
    abbreviation: "RA",
    title: "Risk Assessment",
    requirementCount: 3,
  },
  {
    chapter: "3.12",
    abbreviation: "CA",
    title: "Security Assessment",
    requirementCount: 4,
  },
  {
    chapter: "3.13",
    abbreviation: "SC",
    title: "System and Communications Protection",
    requirementCount: 16,
  },
  {
    chapter: "3.14",
    abbreviation: "SI",
    title: "System and Information Integrity",
    requirementCount: 7,
  },
];

export const CMMC_LEVEL_2_REQUIREMENT_COUNT = 110;

const FAMILY_BY_CHAPTER = new Map(
  NIST_SP800171_R2_FAMILIES.map((family) => [family.chapter, family] as const),
);

export function chapterFromOriginId(originId: string): string | null {
  const match = /^(3\.\d+)\.\d+$/.exec(originId.trim());
  return match ? match[1] : null;
}

export function familyForOriginId(originId: string): NistSp800171R2Family | undefined {
  const chapter = chapterFromOriginId(originId);
  return chapter ? FAMILY_BY_CHAPTER.get(chapter) : undefined;
}

/** CMMC identification number: DD.L#-REQ (32 CFR § 170.14(c)(1)). */
export function cmmcLevel2ControlId(originId: string): string | null {
  const family = familyForOriginId(originId);
  if (!family) {
    return null;
  }
  return `${family.abbreviation}.L2-${originId.trim()}`;
}
