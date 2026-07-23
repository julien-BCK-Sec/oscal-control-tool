/**
 * Next.js cache invalidation helpers for workflow-driven mutations.
 * Safe to call from Server Actions / domain-event handlers during a request.
 */

import { revalidatePath } from "next/cache";

/**
 * Invalidate pages that may show workflow-mutated data for a project.
 */
export function revalidateProjectViews(projectId: string): void {
  const id = projectId.trim();
  if (!id) {
    return;
  }
  try {
    revalidatePath(`/projects/${id}`);
    revalidatePath("/projects");
  } catch {
    // Outside a Next.js request (e.g. some tests) revalidatePath may throw.
  }
}

/**
 * Invalidate organization workflow admin pages.
 */
export function revalidateWorkflowAdmin(organizationId: string): void {
  const orgId = organizationId.trim();
  if (!orgId) {
    return;
  }
  try {
    revalidatePath(`/organizations/${orgId}/workflows`);
    revalidatePath(`/organizations/${orgId}/settings`);
  } catch {
    // Ignore outside request context.
  }
}
