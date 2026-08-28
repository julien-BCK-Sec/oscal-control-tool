/**
 * Task-oriented entry points on the Help landing page. Labels are navigation
 * copy; destinations must be existing guide pages or heading anchors.
 */
export type HelpLandingItem = {
  label: string;
  href: string;
};

export type HelpLandingGroup = {
  id: string;
  title: string;
  items: HelpLandingItem[];
};

export const HELP_LANDING_GROUPS: HelpLandingGroup[] = [
  {
    id: "getting-started",
    title: "Getting started",
    items: [
      { label: "Quick start", href: "/help/quick-start" },
      { label: "Create and manage projects", href: "/help/projects" },
      { label: "Choose a framework", href: "/help/frameworks" },
    ],
  },
  {
    id: "document-your-system",
    title: "Document your system",
    items: [
      { label: "Document controls and requirements", href: "/help/authoring-controls" },
      {
        label: "Understand the three statuses",
        href: "/help/authoring-controls#the-three-status-fields-in-detail",
      },
      { label: "Submit work for review", href: "/help/review-workflow" },
    ],
  },
  {
    id: "evidence",
    title: "Evidence",
    items: [
      { label: "Add and manage Evidence", href: "/help/evidence" },
      { label: "Understand Evidence coverage", href: "/help/evidence-coverage" },
      {
        label: "Review due dates and freshness",
        href: "/help/evidence-coverage#freshness",
      },
    ],
  },
  {
    id: "collaboration",
    title: "Collaboration",
    items: [
      { label: "Discussions and assignments", href: "/help/collaboration" },
      { label: "Review workflow", href: "/help/review-workflow" },
    ],
  },
  {
    id: "administration",
    title: "Administration",
    items: [
      { label: "Manage your team", href: "/help/invitations-and-team" },
      { label: "Workflow automation", href: "/help/workflow-automation" },
    ],
  },
  {
    id: "standards-and-export",
    title: "Standards and export",
    items: [
      { label: "Frameworks and standards", href: "/help/frameworks" },
      { label: "DoD Cloud Impact Level 4", href: "/help/dod-cloud-il4" },
      { label: "OSCAL export", href: "/help/oscal-export" },
    ],
  },
];

export const HELP_LANDING_ITEMS: HelpLandingItem[] = HELP_LANDING_GROUPS.flatMap(
  (group) => group.items,
);

/** Heading anchors used by in-product contextual Help links. */
export const HELP_CONTEXTUAL_ANCHORS: Array<{ slug: string; headingId: string }> = [
  { slug: "authoring-controls", headingId: "the-three-status-fields-in-detail" },
  { slug: "evidence-coverage", headingId: "how-coverage-is-computed" },
  { slug: "oscal-export", headingId: "what-valid-means-here" },
  { slug: "oscal-export", headingId: "dod-cloud-il4-projects-do-not-have-this-button" },
  { slug: "dod-cloud-il4", headingId: "how-nist-fedramp-and-dod-layers-appear" },
  { slug: "workflow-automation", headingId: "triggers-conditions-and-actions" },
];
