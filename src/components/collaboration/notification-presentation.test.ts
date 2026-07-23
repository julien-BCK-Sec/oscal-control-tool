import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Notification } from "@/data/collaboration";
import {
  buildNotificationHref,
  formatNotificationEventType,
  resolveControlIdDisplay,
  resolveControlTitle,
  toNotificationView,
  truncateNotificationPreview,
} from "@/components/collaboration/notification-presentation";
import {
  parseCommentQueryParam,
  parseControlQueryParam,
  parseWorkspaceViewParam,
} from "@/components/workspace/presentation";

function sampleNotification(
  overrides: Partial<Notification> = {},
): Notification {
  return {
    id: "n1",
    organizationId: "org-1",
    recipientUserId: "user-1",
    actorUserId: "user-2",
    eventType: "comment_mention",
    relatedObjectType: "comment",
    relatedObjectId: "comment-1",
    projectId: "project-1",
    controlId: "ac-2",
    summary: "You were mentioned on control ac-2",
    readAt: null,
    deletedAt: null,
    createdAt: "2026-07-22T12:00:00.000Z",
    ...overrides,
  };
}

describe("notification presentation", () => {
  it("formats event types for the notification center", () => {
    assert.equal(formatNotificationEventType("comment_mention"), "Mention");
    assert.equal(formatNotificationEventType("comment_reply"), "Reply");
    assert.equal(
      formatNotificationEventType("discussion_resolved"),
      "Discussion resolved",
    );
    assert.equal(
      formatNotificationEventType("assignment_created"),
      "Assignment",
    );
  });

  it("resolves control identifier display and title", () => {
    assert.equal(resolveControlIdDisplay("ac-2"), "AC-2");
    assert.equal(resolveControlIdDisplay(null), null);
    const title = resolveControlTitle("ac-2");
    assert.ok(title);
    assert.match(title, /account/i);
  });

  it("truncates comment previews", () => {
    assert.equal(truncateNotificationPreview("  hello   world  "), "hello world");
    assert.equal(truncateNotificationPreview(""), null);
    const long = "x".repeat(200);
    const preview = truncateNotificationPreview(long, 20);
    assert.ok(preview);
    assert.ok(preview.endsWith("…"));
    assert.ok(preview.length <= 20);
  });

  it("builds deep links with project, control, and comment", () => {
    const href = buildNotificationHref(sampleNotification());
    assert.equal(
      href,
      "/projects/project-1?view=controls&control=ac-2&comment=comment-1",
    );
  });

  it("omits comment from assignment notification deep links", () => {
    const href = buildNotificationHref(
      sampleNotification({
        eventType: "assignment_created",
        relatedObjectType: "assignment",
        relatedObjectId: "assignment-1:assignment_created",
      }),
    );
    assert.equal(href, "/projects/project-1?view=controls&control=ac-2");
  });

  it("returns null href when project id is missing", () => {
    assert.equal(
      buildNotificationHref(sampleNotification({ projectId: null })),
      null,
    );
  });

  it("includes project name and preview on the notification view", () => {
    const view = toNotificationView(sampleNotification(), {
      projectName: "Goose Flagship",
      preview: "Please review @bob",
    });
    assert.equal(view.projectName, "Goose Flagship");
    assert.equal(view.controlIdDisplay, "AC-2");
    assert.ok(view.controlTitle);
    assert.equal(view.eventTypeLabel, "Mention");
    assert.equal(view.preview, "Please review @bob");
    assert.ok(view.href?.includes("control=ac-2"));
  });
});

describe("notification deep-link query parsing", () => {
  it("parses control and comment query params", () => {
    assert.equal(parseControlQueryParam("ac-2"), "ac-2");
    assert.equal(parseControlQueryParam("  "), undefined);
    assert.equal(parseCommentQueryParam("comment-1"), "comment-1");
    assert.equal(parseCommentQueryParam(undefined), undefined);
  });

  it("keeps workspace view parsing for controls deep links", () => {
    assert.equal(parseWorkspaceViewParam("controls"), "controls");
  });
});
