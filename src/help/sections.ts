/**
 * Help section catalog. A "section" is a chapter grouping of guide pages.
 * Adding a new guide page never requires touching this file unless the page
 * introduces a new chapter — set the page's frontmatter `section` to one of
 * these ids and it is picked up automatically (see `src/help/content.ts`).
 */
export type HelpSection = {
  id: string;
  label: string;
  order: number;
  description: string;
};

export const HELP_SECTIONS: HelpSection[] = [
  {
    id: "getting-started",
    label: "Getting started",
    order: 10,
    description:
      "What Control Freak is, how access works, and how to find your way around.",
  },
  {
    id: "projects",
    label: "Projects",
    order: 20,
    description: "Creating projects, choosing a framework, and the project workspace.",
  },
  {
    id: "controls",
    label: "Controls and requirements",
    order: 30,
    description: "Authoring implementations and moving them through review.",
  },
  {
    id: "collaboration",
    label: "Collaboration",
    order: 40,
    description: "Discussions, assignments, and notifications.",
  },
  {
    id: "evidence",
    label: "Evidence",
    order: 50,
    description: "Uploading, versioning, linking, and tracking supporting Evidence.",
  },
  {
    id: "frameworks",
    label: "Frameworks and standards",
    order: 60,
    description: "NIST SP 800-53 baselines, CMMC Level 2, and OSCAL export.",
  },
  {
    id: "history",
    label: "Version history",
    order: 70,
    description: "Named versions, automatic snapshots, and restoring prior states.",
  },
  {
    id: "administration",
    label: "Organization administration",
    order: 80,
    description: "Team membership, invitations, roles, and workflow automation.",
  },
  {
    id: "reference",
    label: "Reference",
    order: 90,
    description: "Roles and permissions, glossary, and known limitations.",
  },
];

export function findHelpSection(id: string): HelpSection | undefined {
  return HELP_SECTIONS.find((section) => section.id === id);
}
