import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getAdjacentHelpPages,
  getHelpManifest,
  getHelpPage,
  getHelpSearchIndex,
} from "./content";
import { HELP_CONTEXTUAL_ANCHORS, HELP_LANDING_ITEMS } from "./landing";
import { HELP_SECTIONS } from "./sections";

describe("getHelpManifest", () => {
  it("loads every guide page into a known section", () => {
    const manifest = getHelpManifest();
    assert.ok(manifest.flat.length > 0);
    for (const summary of manifest.flat) {
      assert.ok(summary.title.length > 0, `${summary.slug} has a title`);
      assert.ok(summary.summary.length > 0, `${summary.slug} has a summary`);
    }
  });

  it("groups pages under sections in the declared section order", () => {
    const manifest = getHelpManifest();
    const orders = manifest.sections.map((entry) => entry.section.order);
    const sorted = [...orders].sort((a, b) => a - b);
    assert.deepEqual(orders, sorted);
  });

  it("only uses section ids declared in the section catalog", () => {
    const manifest = getHelpManifest();
    const knownIds = new Set(HELP_SECTIONS.map((section) => section.id));
    for (const entry of manifest.sections) {
      assert.ok(knownIds.has(entry.section.id));
    }
  });

  it("has no duplicate slugs across the whole manifest", () => {
    const manifest = getHelpManifest();
    const slugs = manifest.flat.map((page) => page.slug);
    assert.equal(new Set(slugs).size, slugs.length);
  });

  it("places Quick start after Welcome in Getting started", () => {
    const manifest = getHelpManifest();
    const gettingStarted = manifest.sections.find(
      (entry) => entry.section.id === "getting-started",
    );
    assert.ok(gettingStarted);
    const slugs = gettingStarted!.pages.map((page) => page.slug);
    const welcomeIndex = slugs.indexOf("welcome");
    const quickStartIndex = slugs.indexOf("quick-start");
    const signingInIndex = slugs.indexOf("signing-in");
    assert.ok(welcomeIndex !== -1);
    assert.ok(quickStartIndex !== -1);
    assert.ok(signingInIndex !== -1);
    assert.ok(welcomeIndex < quickStartIndex);
    assert.ok(quickStartIndex < signingInIndex);
  });

  it("uses task-oriented titles for renamed navigation pages", () => {
    assert.equal(getHelpPage("projects")?.title, "Create and manage projects");
    assert.equal(
      getHelpPage("authoring-controls")?.title,
      "Document controls and requirements",
    );
    assert.equal(getHelpPage("evidence")?.title, "Add and manage Evidence");
    assert.equal(
      getHelpPage("evidence-coverage")?.title,
      "Track Evidence coverage",
    );
    assert.equal(
      getHelpPage("frameworks")?.title,
      "Choose and understand frameworks",
    );
    assert.equal(
      getHelpPage("dod-cloud-il4")?.title,
      "DoD Cloud Impact Level 4",
    );
    assert.equal(getHelpPage("invitations-and-team")?.title, "Manage your team");
    assert.equal(getHelpPage("limitations")?.title, "Product limitations");
    assert.equal(
      getHelpPage("quick-start")?.title,
      "Quick start: document your first control",
    );
  });
});

describe("getHelpPage", () => {
  it("resolves a known page with parsed content", () => {
    const page = getHelpPage("welcome");
    assert.ok(page);
    assert.equal(page?.slug, "welcome");
    assert.ok(page!.blocks.length > 0);
    assert.ok(page!.headings.length > 0);
  });

  it("returns null for an unknown slug", () => {
    assert.equal(getHelpPage("does-not-exist"), null);
  });

  it("returns null for a path-traversal-shaped slug", () => {
    assert.equal(getHelpPage("../../package"), null);
    assert.equal(getHelpPage("..%2f..%2fpackage"), null);
  });
});

describe("getAdjacentHelpPages", () => {
  it("returns previous/next within reading order", () => {
    const manifest = getHelpManifest();
    const first = manifest.flat[0];
    const adjacentToFirst = getAdjacentHelpPages(first.slug);
    assert.equal(adjacentToFirst.previous, null);
    assert.ok(adjacentToFirst.next);

    const last = manifest.flat[manifest.flat.length - 1];
    const adjacentToLast = getAdjacentHelpPages(last.slug);
    assert.equal(adjacentToLast.next, null);
    assert.ok(adjacentToLast.previous);
  });

  it("returns null/null for an unknown slug", () => {
    const adjacent = getAdjacentHelpPages("does-not-exist");
    assert.equal(adjacent.previous, null);
    assert.equal(adjacent.next, null);
  });
});

describe("cross-page /help links", () => {
  it("every internal /help/{slug} link in a page body resolves to a real page", () => {
    const manifest = getHelpManifest();
    const knownSlugs = new Set(manifest.flat.map((page) => page.slug));
    const linkPattern = /\/help\/([a-z0-9-]+)/g;

    for (const summary of manifest.flat) {
      const page = getHelpPage(summary.slug);
      assert.ok(page);
      const body = JSON.stringify(page!.blocks);
      for (const match of body.matchAll(linkPattern)) {
        assert.ok(
          knownSlugs.has(match[1]),
          `${summary.slug} links to unknown page "${match[1]}"`,
        );
      }
    }
  });

  it("every related-page slug resolves to a real page", () => {
    const manifest = getHelpManifest();
    const knownSlugs = new Set(manifest.flat.map((page) => page.slug));

    for (const summary of manifest.flat) {
      const page = getHelpPage(summary.slug);
      for (const relatedSlug of page!.related) {
        assert.ok(
          knownSlugs.has(relatedSlug),
          `${summary.slug} lists unknown related page "${relatedSlug}"`,
        );
      }
    }
  });
});

describe("Help landing destinations and contextual anchors", () => {
  it("points every landing-page task card at a real Help page and heading", () => {
    const manifest = getHelpManifest();
    const knownSlugs = new Set(manifest.flat.map((page) => page.slug));

    for (const item of HELP_LANDING_ITEMS) {
      assert.ok(item.href.startsWith("/help/"), `${item.label} href is not a Help link`);
      const match = item.href.match(/^\/help\/([a-z0-9-]+)(?:#([a-z0-9-]+))?$/);
      assert.ok(match, `${item.label} has an unexpected href: ${item.href}`);
      const slug = match![1];
      const headingId = match![2];
      assert.ok(knownSlugs.has(slug), `${item.label} links to unknown page "${slug}"`);
      if (headingId) {
        const page = getHelpPage(slug);
        assert.ok(
          page!.headings.some((heading) => heading.id === headingId),
          `${item.href} is missing heading "${headingId}"`,
        );
      }
    }
  });

  it("keeps contextual Help heading anchors on the target pages", () => {
    for (const { slug, headingId } of HELP_CONTEXTUAL_ANCHORS) {
      const page = getHelpPage(slug);
      assert.ok(page, `missing Help page "${slug}"`);
      assert.ok(
        page!.headings.some((heading) => heading.id === headingId),
        `${slug} is missing heading "${headingId}"`,
      );
    }
  });
});

describe("getHelpSearchIndex", () => {
  it("indexes every manifest page with searchable body text from Markdown", () => {
    const manifest = getHelpManifest();
    const index = getHelpSearchIndex();
    assert.equal(index.length, manifest.flat.length);
    for (const doc of index) {
      assert.ok(doc.bodyText.length > 0, `${doc.slug} has empty body text`);
    }
  });

  it("makes DoD Cloud Impact Level 4 Help discoverable", () => {
    const manifest = getHelpManifest();
    const frameworks = manifest.sections.find(
      (entry) => entry.section.id === "frameworks",
    );
    assert.ok(frameworks);
    const slugs = frameworks!.pages.map((page) => page.slug);
    const frameworksIndex = slugs.indexOf("frameworks");
    const il4Index = slugs.indexOf("dod-cloud-il4");
    const oscalIndex = slugs.indexOf("oscal-export");
    assert.ok(frameworksIndex !== -1);
    assert.ok(il4Index !== -1);
    assert.ok(oscalIndex !== -1);
    assert.ok(frameworksIndex < il4Index);
    assert.ok(il4Index < oscalIndex);

    const page = getHelpPage("dod-cloud-il4");
    assert.ok(page);
    assert.ok(
      page!.headings.some(
        (heading) => heading.id === "how-nist-fedramp-and-dod-layers-appear",
      ),
    );
    assert.ok(
      page!.headings.some((heading) => heading.id === "dod-assignment-required"),
    );
    assert.ok(
      page!.headings.some(
        (heading) => heading.id === "source-interpretation-requires-review",
      ),
    );
    const indexed = getHelpSearchIndex().find(
      (doc) => doc.slug === "dod-cloud-il4",
    );
    assert.ok(indexed);
    assert.match(indexed!.bodyText, /345/);
    assert.match(indexed!.bodyText, /General Readiness Requirement/);
    assert.match(
      indexed!.bodyText,
      /not a claim that OSCAL cannot represent overlays/,
    );
    assert.doesNotMatch(indexed!.bodyText, /OSCAL cannot represent IL4/i);
  });
});
