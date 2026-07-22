import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  resolveActor,
  SYSTEM_ACTOR,
  UNKNOWN_ACTOR,
} from "@/persistence/actor";

describe("resolveActor", () => {
  it("defaults to System when no headers are present", () => {
    assert.deepEqual(resolveActor(null), SYSTEM_ACTOR);
    assert.deepEqual(resolveActor(undefined), SYSTEM_ACTOR);
  });

  it("reads Cloudflare Access email when present", () => {
    const headers = {
      get(name: string): string | null {
        if (name.toLowerCase() === "cf-access-authenticated-user-email") {
          return "julien@example.com";
        }
        return null;
      },
    };
    assert.deepEqual(resolveActor(headers), {
      actorId: "julien@example.com",
      actorDisplayName: "julien@example.com",
    });
  });

  it("exports Unknown user constant for future callers", () => {
    assert.equal(UNKNOWN_ACTOR.actorDisplayName, "Unknown user");
  });
});
