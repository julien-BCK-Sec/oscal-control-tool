import type { ActorIdentity } from "./actor";
import type {
  Assignment,
  AssignmentRole,
  CreateAssignmentInput,
} from "@/data/collaboration";
import type { ControlActivity } from "@/data/control-activity";

export type AssignmentMutationResult = {
  assignment: Assignment;
  activity: ControlActivity;
};

/**
 * Coordinates control assignments with ControlActivity audit events.
 */
export interface AssignmentService {
  listByControl(
    organizationId: string,
    projectId: string,
    controlId: string,
  ): Promise<Assignment[]>;

  getById(
    organizationId: string,
    assignmentId: string,
  ): Promise<Assignment | null>;

  assign(
    input: CreateAssignmentInput,
    actor: ActorIdentity,
  ): Promise<AssignmentMutationResult>;

  reassign(
    organizationId: string,
    assignmentId: string,
    assigneeUserId: string,
    actor: ActorIdentity,
  ): Promise<AssignmentMutationResult | null>;

  complete(
    organizationId: string,
    assignmentId: string,
    actor: ActorIdentity,
  ): Promise<AssignmentMutationResult | null>;

  remove(
    organizationId: string,
    assignmentId: string,
    actor: ActorIdentity,
  ): Promise<AssignmentMutationResult | null>;
}

export type { AssignmentRole };
