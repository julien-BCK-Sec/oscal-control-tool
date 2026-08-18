import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getHelpSearchIndex } from "./content";
import { searchHelp, type HelpSearchDocument } from "./search";

const SAMPLE: HelpSearchDocument[] = [
  {
    slug: "authoring-controls",
    title: "Document controls and requirements",
    summary: "Narrative, ownership, and the three status fields.",
    sectionLabel: "Controls and requirements",
    headings: [
      { id: "the-three-status-fields-in-detail", text: "The three status fields, in detail" },
    ],
    bodyText:
      "The difference between Implemented and Approved depends on which field. Narrative Implemented does not imply review Approved.",
  },
  {
    slug: "oscal-export",
    title: "OSCAL export",
    summary: "How to export a System Security Plan.",
    sectionLabel: "Frameworks and standards",
    headings: [{ id: "what-valid-means-here", text: 'What "valid" means here' }],
    bodyText:
      "CMMC Level 2 projects do not offer OSCAL export. No official CMMC OSCAL profile is pinned.",
  },
  {
    slug: "evidence-coverage",
    title: "Track Evidence coverage",
    summary: "How coverage and freshness are computed.",
    sectionLabel: "Evidence",
    headings: [{ id: "how-coverage-is-computed", text: "How coverage is computed" }],
    bodyText: "Required — missing evidence. Draft does not satisfy coverage.",
  },
];

describe("searchHelp", () => {
  it("returns no hits for an empty query", () => {
    assert.deepEqual(searchHelp(SAMPLE, "   "), []);
  });

  it("matches title, summary, headings, and body", () => {
    const byTitle = searchHelp(SAMPLE, "OSCAL export");
    assert.equal(byTitle[0]?.slug, "oscal-export");

    const byHeading = searchHelp(SAMPLE, "three status fields");
    assert.equal(byHeading[0]?.slug, "authoring-controls");
    assert.equal(byHeading[0]?.heading, "The three status fields, in detail");

    const byBody = searchHelp(SAMPLE, "missing evidence");
    assert.equal(byBody[0]?.slug, "evidence-coverage");
  });

  it("finds status documentation for approved vs implemented", () => {
    const hits = searchHelp(SAMPLE, "difference between approved and implemented");
    assert.ok(hits.some((hit) => hit.slug === "authoring-controls"));
  });

  it("finds the CMMC OSCAL limitation", () => {
    const hits = searchHelp(SAMPLE, "CMMC OSCAL");
    assert.ok(hits.some((hit) => hit.slug === "oscal-export"));
  });

  it("includes a short excerpt and prefers heading anchors when headings match", () => {
    const hits = searchHelp(SAMPLE, "valid");
    assert.ok(hits[0]?.excerpt.length > 0);
    assert.equal(hits[0]?.href, "/help/oscal-export#what-valid-means-here");
  });
});

describe("searchHelp against the real guide", () => {
  it("resolves representative queries to the expected articles", () => {
    const index = getHelpSearchIndex();

    const statusHits = searchHelp(index, "difference between approved and implemented");
    assert.ok(
      statusHits.some(
        (hit) => hit.slug === "welcome" || hit.slug === "authoring-controls",
      ),
      "expected status documentation for approved vs implemented",
    );

    const oscalHits = searchHelp(index, "CMMC OSCAL");
    assert.ok(
      oscalHits.some((hit) => hit.slug === "oscal-export" || hit.slug === "limitations"),
      "expected OSCAL export limitation for CMMC OSCAL",
    );

    const coverageHits = searchHelp(index, "missing evidence");
    assert.ok(
      coverageHits.some((hit) => hit.slug === "evidence-coverage"),
      "expected Evidence coverage for missing evidence",
    );
  });
});
