import type {
  InformationType,
  SystemInterconnection,
  SystemRole,
} from "@/data/project";

export function createEmptySystemRole(id: string): SystemRole {
  return {
    id,
    role: "system-owner",
    name: "",
  };
}

export function createEmptyInformationType(id: string): InformationType {
  return {
    id,
    title: "",
  };
}

export function createEmptyInterconnection(id: string): SystemInterconnection {
  return {
    id,
    name: "",
  };
}
