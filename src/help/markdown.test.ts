import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseInline, parseMarkdown, parseCalloutPrefix, slugifyHeading } from "./markdown";

describe("slugifyHeading", () => {
  it("lowercases and hyphenates", () => {
    assert.equal(slugifyHeading("Evidence Coverage"), "evidence-coverage");
  });

  it("strips punctuation and collapses runs", () => {
    assert.equal(slugifyHeading("CMMC Level 2 / NIST SP 800-171"), "cmmc-level-2-nist-sp-800-171");
  });

  it("trims leading and trailing separators", () => {
    assert.equal(slugifyHeading("  Roles & permissions!  "), "roles-permissions");
  });
});

describe("parseInline", () => {
  it("parses bold, italic, code, and link spans", () => {
    const nodes = parseInline("Use **bold**, *italic*, `code`, and a [link](/help/evidence).");
    const types = nodes.map((n) => n.type);
    assert.ok(types.includes("bold"));
    assert.ok(types.includes("italic"));
    assert.ok(types.includes("code"));
    assert.ok(types.includes("link"));
    const link = nodes.find((n) => n.type === "link");
    assert.equal(link && link.type === "link" ? link.href : null, "/help/evidence");
  });

  it("returns a single text node for plain text", () => {
    const nodes = parseInline("no special formatting here");
    assert.equal(nodes.length, 1);
    assert.equal(nodes[0].type, "text");
  });
});

describe("parseMarkdown", () => {
  it("parses headings with stable ids", () => {
    const blocks = parseMarkdown("## Evidence Coverage\n\nSome text.");
    assert.equal(blocks[0].type, "heading");
    if (blocks[0].type === "heading") {
      assert.equal(blocks[0].level, 2);
      assert.equal(blocks[0].id, "evidence-coverage");
      assert.equal(blocks[0].text, "Evidence Coverage");
    }
  });

  it("joins wrapped paragraph lines into one block", () => {
    const blocks = parseMarkdown("Line one\nline two continues.\n\nNew paragraph.");
    assert.equal(blocks.length, 2);
    assert.equal(blocks[0].type, "paragraph");
  });

  it("parses unordered and ordered lists", () => {
    const blocks = parseMarkdown("- First\n- Second\n\n1. Step one\n2. Step two");
    assert.equal(blocks[0].type, "list");
    if (blocks[0].type === "list") {
      assert.equal(blocks[0].ordered, false);
      assert.equal(blocks[0].items.length, 2);
    }
    assert.equal(blocks[1].type, "list");
    if (blocks[1].type === "list") {
      assert.equal(blocks[1].ordered, true);
    }
  });

  it("parses fenced code blocks verbatim", () => {
    const blocks = parseMarkdown("```\nAC.L2-3.1.1\n```");
    assert.equal(blocks[0].type, "code_block");
    if (blocks[0].type === "code_block") {
      assert.equal(blocks[0].code, "AC.L2-3.1.1");
    }
  });

  it("parses a blockquote as a note callout", () => {
    const blocks = parseMarkdown("> Evidence coverage is not a compliance score.");
    assert.equal(blocks[0].type, "blockquote");
    if (blocks[0].type === "blockquote") {
      assert.equal(blocks[0].kind, "note");
    }
  });

  it("parses labeled callout prefixes into note, tip, warning, and limitation", () => {
    const note = parseMarkdown("> **Note:** Frameworks are immutable after create.");
    const tip = parseMarkdown("> **Tip:** Start with Quick start.");
    const warning = parseMarkdown("> **Warning:** Restore does not roll back Evidence.");
    const limitation = parseMarkdown(
      "> **Limitation:** OSCAL validation is structural only.",
    );
    assert.equal(note[0].type, "blockquote");
    if (note[0].type === "blockquote") {
      assert.equal(note[0].kind, "note");
    }
    assert.equal(tip[0].type, "blockquote");
    if (tip[0].type === "blockquote") {
      assert.equal(tip[0].kind, "tip");
    }
    assert.equal(warning[0].type, "blockquote");
    if (warning[0].type === "blockquote") {
      assert.equal(warning[0].kind, "warning");
    }
    assert.equal(limitation[0].type, "blockquote");
    if (limitation[0].type === "blockquote") {
      assert.equal(limitation[0].kind, "limitation");
    }
  });

  it("strips the callout label from the quoted body", () => {
    const { kind, text } = parseCalloutPrefix(
      "**Limitation:** Evidence Coverage is not a compliance score.",
    );
    assert.equal(kind, "limitation");
    assert.equal(text, "Evidence Coverage is not a compliance score.");
  });

  it("preserves diagram fenced blocks with a diagram language", () => {
    const blocks = parseMarkdown("```diagram\ntree\nEvidence record\nMetadata\n```");
    assert.equal(blocks[0].type, "code_block");
    if (blocks[0].type === "code_block") {
      assert.equal(blocks[0].lang, "diagram");
      assert.match(blocks[0].code, /Evidence record/);
    }
  });

  it("parses a horizontal rule", () => {
    const blocks = parseMarkdown("Above\n\n---\n\nBelow");
    assert.equal(blocks[1].type, "hr");
  });

  it("parses a pipe table with header and rows", () => {
    const blocks = parseMarkdown(
      "| Role | Can edit |\n| --- | --- |\n| Author | Yes |\n| Viewer | No |",
    );
    assert.equal(blocks[0].type, "table");
    if (blocks[0].type === "table") {
      assert.equal(blocks[0].header.length, 2);
      assert.equal(blocks[0].rows.length, 2);
    }
  });

  it("does not loop forever on unrecognized content", () => {
    const blocks = parseMarkdown("\n\n\n");
    assert.deepEqual(blocks, []);
  });

  it("is deterministic: identical input always parses to identical output", () => {
    const source =
      "## Heading\n\nA paragraph with **bold**, *italic*, `code`, and a [link](/help/evidence).\n\n- One\n- Two\n\n| A | B |\n| --- | --- |\n| 1 | 2 |\n";
    assert.deepEqual(parseMarkdown(source), parseMarkdown(source));
  });
});
