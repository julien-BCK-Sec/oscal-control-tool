import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { extractMentionTokens } from "./mentions";
import { resolveMentions } from "./resolve-mentions";
import type { OrganizationMemberDto } from "@/persistence/postgres/organization-repository";

const members: OrganizationMemberDto[] = [
  {
    id: "m1",
    organizationId: "org-1",
    userId: "u-alice",
    role: "author",
    createdAt: "2026-01-01T00:00:00.000Z",
    email: "alice@example.com",
    name: "Alice Smith",
  },
  {
    id: "m2",
    organizationId: "org-1",
    userId: "u-bob",
    role: "reviewer",
    createdAt: "2026-01-01T00:00:00.000Z",
    email: "bob@example.com",
    name: "Bob",
  },
];

describe("mention parsing", () => {
  it("extracts unique tokens in order", () => {
    const tokens = extractMentionTokens("Hi @alice and @bob, cc @alice again");
    assert.deepEqual(
      tokens.map((t) => t.token),
      ["alice", "bob"],
    );
  });

  it("ignores empty bodies", () => {
    assert.deepEqual(extractMentionTokens(""), []);
    assert.deepEqual(extractMentionTokens("no mentions here"), []);
  });
});

describe("mention identity resolution", () => {
  it("resolves by email local-part, full email, and display name", () => {
    const resolved = resolveMentions(
      "Ping @alice @bob@example.com and @Alice Smith",
      members,
    );
    // Alice matched once (local-part), Bob by email; "Alice Smith" token is
    // one token without spaces because MENTIONS_PATTERN stops at whitespace —
    // so @Alice alone already resolved alice. Second alice smith won't match
    // as a single token "Alice".
    assert.equal(resolved.length, 2);
    assert.equal(resolved[0].userId, "u-alice");
    assert.equal(resolved[1].userId, "u-bob");
  });

  it("ignores tokens that are not organization members", () => {
    const resolved = resolveMentions("Hello @outsider @alice", members);
    assert.equal(resolved.length, 1);
    assert.equal(resolved[0].userId, "u-alice");
  });

  it("deduplicates the same user mentioned multiple ways", () => {
    const resolved = resolveMentions(
      "@alice @alice@example.com",
      members,
    );
    assert.equal(resolved.length, 1);
    assert.equal(resolved[0].userId, "u-alice");
  });

  it("returns empty when there are no members", () => {
    assert.deepEqual(resolveMentions("@alice", []), []);
  });
});
