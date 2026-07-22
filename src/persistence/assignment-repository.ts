import type {
  Assignment,
  CreateAssignmentInput,
} from "@/data/collaboration";

/**
 * Persistence boundary for control assignments.
 * Always scoped by organizationId for tenant isolation.
 */
export interface AssignmentRepository {
  create(input: CreateAssignmentInput): Promise<Assignment>;
  getById(
    organizationId: string,
    assignmentId: string,
  ): Promise<Assignment | null>;
  listByControl(
    organizationId: string,
    projectId: string,
    controlId: string,
  ): Promise<Assignment[]>;
  listByProject(
    organizationId: string,
    projectId: string,
  ): Promise<Assignment[]>;
  listByAssignee(
    organizationId: string,
    assigneeUserId: string,
  ): Promise<Assignment[]>;
  /**
   * Replace the assignee on an existing assignment (reassign).
   * Returns null when the assignment is missing or outside the organization.
   */
  reassign(
    organizationId: string,
    assignmentId: string,
    assigneeUserId: string,
    assignedByUserId: string,
  ): Promise<Assignment | null>;
  complete(
    organizationId: string,
    assignmentId: string,
    completedAt?: string,
  ): Promise<Assignment | null>;
  remove(
    organizationId: string,
    assignmentId: string,
  ): Promise<boolean>;
}
