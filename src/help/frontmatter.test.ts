import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseFrontmatter } from "./frontmatter";

describe("parseFrontmatter", () => {
  it("parses key/value pairs and returns the remaining body", () => {
    const { data, content } = parseFrontmatter(
      '---\ntitle: "Evidence Coverage"\nsection: evidence\norder: 40\n---\nBody text.\n',
    );
    assert.equal(data.title, "Evidence Coverage");
    assert.equal(data.section, "evidence");
    assert.equal(data.order, "40");
    assert.equal(content, "Body text.\n");
  });

  it("returns empty data when there is no frontmatter block", () => {
    const { data, content } = parseFrontmatter("Just content.\n");
    assert.deepEqual(data, {});
    assert.equal(content, "Just content.\n");
  });

  it("handles values containing a colon", () => {
    const { data } = parseFrontmatter(
      "---\nsummary: Note: this is quoted text\n---\nBody\n",
    );
    assert.equal(data.summary, "Note: this is quoted text");
  });

  it("strips single and double quotes around values", () => {
    const { data } = parseFrontmatter("---\ntitle: 'Quoted title'\n---\nBody\n");
    assert.equal(data.title, "Quoted title");
  });
});
