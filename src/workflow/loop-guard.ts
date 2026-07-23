/**
 * Prevents workflow actions from re-entering the Workflow Engine (no-cascade).
 *
 * While an action runs inside `runWithWorkflowCascadeGuard`, domain events
 * published by that action still dispatch to other handlers, but the workflow
 * engine must refuse to evaluate rules for those events.
 */

import { AsyncLocalStorage } from "node:async_hooks";

type WorkflowCascadeState = {
  readonly depth: number;
};

const cascadeStore = new AsyncLocalStorage<WorkflowCascadeState>();

/** True when the current async context is executing workflow actions. */
export function isWorkflowCascadeSuppressed(): boolean {
  return (cascadeStore.getStore()?.depth ?? 0) > 0;
}

/**
 * Run work with cascade suppression enabled (or deepened).
 * Nested calls increment depth so nested action publishing stays suppressed.
 */
export async function runWithWorkflowCascadeGuard<T>(
  fn: () => Promise<T>,
): Promise<T> {
  const current = cascadeStore.getStore();
  const depth = (current?.depth ?? 0) + 1;
  return cascadeStore.run({ depth }, fn);
}
