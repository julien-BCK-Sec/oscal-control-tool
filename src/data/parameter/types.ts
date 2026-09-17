export type ParameterSelectHowMany = "one" | "one-or-more";

export type AuthoredAssignment = {
  form: "assignment";
  values: readonly string[];
};

export type AuthoredSelection = {
  form: "selection";
  howMany: ParameterSelectHowMany;
  selectedChoiceKeys: readonly string[];
  nested?: Readonly<Record<string, AuthoredParameterBody>>;
};

export type AuthoredParameterBody = AuthoredAssignment | AuthoredSelection;

export type ProjectParameterIntent =
  | "organization-defined"
  | "accept-permitted-baseline"
  | "dspav-assertion"
  | "documented-deviation"
  | "conflict-proceeding";

export type ProjectParameterRecord = {
  controlId: string;
  parameterId: string;
  intent: ProjectParameterIntent;
  body?: AuthoredParameterBody;
  notes?: string;
  dspavSourceNote?: string;
};

export type ProjectParameterRecords = Record<string, ProjectParameterRecord>;
