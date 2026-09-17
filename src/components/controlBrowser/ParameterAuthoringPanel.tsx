"use client";

import type { FrameworkControl } from "@/data/framework";
import type {
  AuthoredParameterBody,
  ProjectParameterIntent,
  ProjectParameterRecord,
  ProjectParameterRecords,
} from "@/data/parameter";
import type { FrameworkOrganizationDefinedParameter } from "@/data/framework/types";
import {
  frameworkStatusLabel,
  parameterEditorMode,
  parameterPrompt,
  resolutionStateLabel,
  visibleAuthoringParameters,
} from "@/domain/parameter-authoring";
import {
  resolveControlParameters,
  substitutionDisplayText,
  type EffectiveParameter,
} from "@/domain/parameter-resolution";
import { HelpLink } from "@/components/help/HelpLink";
import { Button } from "@/components/design-system/button/Button";
import { StatusBadge } from "@/components/design-system/badge/StatusBadge";
import {
  FormField,
  FormHint,
  FormLabel,
} from "@/components/design-system/form/FormField";
import { SectionHeader } from "@/components/design-system/layout/primitives";

export type ParameterAuthoringPanelProps = {
  control: FrameworkControl;
  records: ProjectParameterRecords;
  onChange: (next: ProjectParameterRecords) => void;
  canEdit: boolean;
};

function assignmentText(body: AuthoredParameterBody | undefined): string {
  if (body?.form === "assignment") {
    return body.values.join("\n");
  }
  return "";
}

function parseAssignmentValues(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function upsert(
  records: ProjectParameterRecords,
  record: ProjectParameterRecord | undefined,
): ProjectParameterRecords {
  const next = { ...records };
  if (!record) {
    return next;
  }
  next[record.parameterId] = record;
  return next;
}

function removeRecord(
  records: ProjectParameterRecords,
  parameterId: string,
): ProjectParameterRecords {
  const next = { ...records };
  delete next[parameterId];
  return next;
}

function nestedParamsFor(
  param: FrameworkOrganizationDefinedParameter,
  selectedKeys: readonly string[],
  byId: Map<string, FrameworkOrganizationDefinedParameter>,
): FrameworkOrganizationDefinedParameter[] {
  const nested: FrameworkOrganizationDefinedParameter[] = [];
  const seen = new Set<string>();
  for (const choice of param.select?.choices ?? []) {
    if (!selectedKeys.includes(choice.key)) {
      continue;
    }
    for (const nestedId of choice.nestedParameterIds) {
      if (seen.has(nestedId)) {
        continue;
      }
      const nestedParam = byId.get(nestedId);
      if (nestedParam) {
        seen.add(nestedId);
        nested.push(nestedParam);
      }
    }
  }
  return nested;
}

function ParameterField({
  control,
  param,
  effective,
  records,
  onChange,
  canEdit,
  byId,
  nested,
}: {
  control: FrameworkControl;
  param: FrameworkOrganizationDefinedParameter;
  effective: EffectiveParameter;
  records: ProjectParameterRecords;
  onChange: (next: ProjectParameterRecords) => void;
  canEdit: boolean;
  byId: Map<string, FrameworkOrganizationDefinedParameter>;
  nested?: boolean;
}) {
  const mode = parameterEditorMode(effective);
  const project = records[param.id];
  const fieldId = `parameter-${param.id}`;
  const prompt = parameterPrompt(param);
  const frameworkValues =
    effective.framework?.values?.length
      ? substitutionDisplayText(effective.framework.values)
      : null;
  const provenance =
    effective.framework?.sources
      .map((source) => `${source.source}: ${source.text}`)
      .join(" ") ?? null;

  function writeAssignment(
    intent: ProjectParameterIntent,
    text: string,
    extra: Partial<ProjectParameterRecord> = {},
  ) {
    const values = parseAssignmentValues(text);
    if (values.length === 0 && intent === "organization-defined" && !extra.notes) {
      onChange(removeRecord(records, param.id));
      return;
    }
    onChange(
      upsert(records, {
        controlId: control.id,
        parameterId: param.id,
        intent,
        ...(values.length > 0
          ? { body: { form: "assignment", values } }
          : {}),
        ...extra,
      }),
    );
  }

  function writeSelection(keys: string[]) {
    if (keys.length === 0) {
      onChange(removeRecord(records, param.id));
      return;
    }
    onChange(
      upsert(records, {
        controlId: control.id,
        parameterId: param.id,
        intent: "organization-defined",
        body: {
          form: "selection",
          howMany: param.select?.howMany ?? "one",
          selectedChoiceKeys: keys,
        },
      }),
    );
  }

  const selectedKeys =
    project?.body?.form === "selection" ? [...project.body.selectedChoiceKeys] : [];

  return (
    <article
      className={`rounded-md border border-border bg-surface px-4 py-3 ${nested ? "ml-4" : ""}`}
      aria-labelledby={`${fieldId}-label`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3
          id={`${fieldId}-label`}
          className="text-sm font-semibold tracking-tight text-foreground"
        >
          {prompt}
        </h3>
        <StatusBadge
          label={resolutionStateLabel(effective)}
          variant={
            effective.substitution.kind === "value" ? "info" : "neutral"
          }
          size="sm"
        />
      </div>
      {param.description.trim() ? (
        <FormHint className="mt-1.5">{param.description.trim()}</FormHint>
      ) : null}
      <p className="mt-1 text-xs text-text-muted">
        {frameworkStatusLabel(effective)}. Parameter ID {param.id}
        {param.altIdentifiers.length > 0
          ? ` (also ${param.altIdentifiers.join(", ")})`
          : ""}
        .
      </p>
      {frameworkValues ? (
        <p className="mt-2 text-sm text-text-secondary">
          Framework value: <span className="font-medium text-foreground">{frameworkValues}</span>
        </p>
      ) : null}
      {provenance ? (
        <p className="mt-1 text-xs text-text-muted">Source: {provenance}</p>
      ) : null}

      {mode === "framework-authoritative" ? (
        <FormField className="mt-3">
          <FormLabel htmlFor={`${fieldId}-deviation`}>
            Documented operational deviation
          </FormLabel>
          <textarea
            id={`${fieldId}-deviation`}
            className="field mt-1.5 min-h-20 resize-y text-sm"
            readOnly={!canEdit}
            value={
              project?.intent === "documented-deviation"
                ? assignmentText(project.body)
                : ""
            }
            onChange={(event) =>
              writeAssignment("documented-deviation", event.target.value)
            }
            placeholder="Optional. This does not replace the authoritative value."
          />
          <FormHint>
            The authoritative framework value remains the resolved requirement.
            A deviation is project documentation only.
          </FormHint>
        </FormField>
      ) : null}

      {mode === "may-use-baseline" ? (
        <div className="mt-3 flex flex-col gap-3">
          <p className="text-sm text-text-secondary">
            DoD permits the baseline value. It is not accepted for this project
            until you choose it explicitly.
          </p>
          {canEdit ? (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="primary"
                onClick={() =>
                  onChange(
                    upsert(records, {
                      controlId: control.id,
                      parameterId: param.id,
                      intent: "accept-permitted-baseline",
                    }),
                  )
                }
              >
                Use permitted baseline value
              </Button>
              {project?.intent === "accept-permitted-baseline" ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => onChange(removeRecord(records, param.id))}
                >
                  Clear acceptance
                </Button>
              ) : null}
            </div>
          ) : null}
          <FormField>
            <FormLabel htmlFor={fieldId}>Organization-defined value</FormLabel>
            <textarea
              id={fieldId}
              className="field mt-1.5 min-h-20 resize-y text-sm"
              readOnly={!canEdit}
              value={
                project?.intent === "organization-defined"
                  ? assignmentText(project.body)
                  : ""
              }
              onChange={(event) =>
                writeAssignment("organization-defined", event.target.value)
              }
              placeholder="Or author an organization value instead of accepting the baseline."
            />
          </FormField>
        </div>
      ) : null}

      {mode === "authoritative-value-required" ? (
        <div className="mt-3">
          <p className="text-sm text-text-secondary">
            An authoritative external value is required (for example DSPAV).
            Control Freak does not invent that value.
          </p>
          <FormField className="mt-3">
            <FormLabel htmlFor={fieldId}>Project assertion</FormLabel>
            <textarea
              id={fieldId}
              className="field mt-1.5 min-h-20 resize-y text-sm"
              readOnly={!canEdit}
              value={
                project?.intent === "dspav-assertion"
                  ? assignmentText(project.body)
                  : ""
              }
              onChange={(event) =>
                writeAssignment("dspav-assertion", event.target.value, {
                  dspavSourceNote: project?.dspavSourceNote ?? "",
                })
              }
              placeholder="Value the organization asserts it obtained from the restricted source."
            />
          </FormField>
          <FormField className="mt-3 max-w-xl">
            <FormLabel htmlFor={`${fieldId}-source`}>Source note</FormLabel>
            <input
              id={`${fieldId}-source`}
              className="field mt-1.5"
              readOnly={!canEdit}
              value={project?.dspavSourceNote ?? ""}
              onChange={(event) =>
                writeAssignment(
                  "dspav-assertion",
                  project?.intent === "dspav-assertion"
                    ? assignmentText(project.body)
                    : "",
                  { dspavSourceNote: event.target.value },
                )
              }
              placeholder="Restricted source identity or ticket, not a Control Freak verification."
            />
            <FormHint>
              This remains a project assertion. It is not a verified
              substitution in the resolved requirement.
            </FormHint>
          </FormField>
        </div>
      ) : null}

      {mode === "source-conflict" ? (
        <FormField className="mt-3">
          <FormLabel htmlFor={fieldId}>How the organization proceeded</FormLabel>
          <textarea
            id={fieldId}
            className="field mt-1.5 min-h-20 resize-y text-sm"
            readOnly={!canEdit}
            value={project?.intent === "conflict-proceeding" ? project.notes ?? "" : ""}
            onChange={(event) =>
              onChange(
                upsert(records, {
                  controlId: control.id,
                  parameterId: param.id,
                  intent: "conflict-proceeding",
                  notes: event.target.value,
                }),
              )
            }
            placeholder="This note does not choose a winner between authoritative sources."
          />
          <FormHint>
            Both authoritative sources remain visible. This is not conflict
            resolution.
          </FormHint>
        </FormField>
      ) : null}

      {mode === "control-level-unmapped" ? (
        <FormField className="mt-3">
          <FormLabel htmlFor={fieldId}>Project documentation</FormLabel>
          <textarea
            id={fieldId}
            className="field mt-1.5 min-h-20 resize-y text-sm"
            readOnly={!canEdit}
            value={assignmentText(project?.body)}
            onChange={(event) =>
              writeAssignment("organization-defined", event.target.value)
            }
            placeholder="Optional documentation. Not substituted into the SSP while this ODP is unmapped."
          />
          <FormHint>
            Overlay text for this control stays at control level. Control Freak
            does not know which ODP that overlay resolves.
          </FormHint>
        </FormField>
      ) : null}

      {mode === "selection" && param.select ? (
        <fieldset className="mt-3" disabled={!canEdit}>
          <legend className="text-xs font-medium text-text-secondary">
            {param.select.howMany === "one-or-more"
              ? "Select one or more catalog choices"
              : "Select one catalog choice"}
          </legend>
          <div className="mt-2 flex flex-col gap-2">
            {param.select.choices.map((choice) => {
              const checked = selectedKeys.includes(choice.key);
              const inputId = `${fieldId}-choice-${choice.key}`;
              return (
                <label key={choice.key} className="flex items-start gap-2 text-sm">
                  <input
                    id={inputId}
                    type={param.select?.howMany === "one" ? "radio" : "checkbox"}
                    name={param.select?.howMany === "one" ? fieldId : `${fieldId}-${choice.key}`}
                    className="mt-0.5"
                    checked={checked}
                    onChange={() => {
                      if (param.select?.howMany === "one") {
                        writeSelection([choice.key]);
                        return;
                      }
                      const next = checked
                        ? selectedKeys.filter((key) => key !== choice.key)
                        : [...selectedKeys, choice.key];
                      writeSelection(next);
                    }}
                  />
                  <span>{choice.text.replace(/\{\{\s*insert:\s*param,\s*[^}]+\s*\}\}/gi, "[nested parameter]")}</span>
                </label>
              );
            })}
          </div>
        </fieldset>
      ) : null}

      {mode === "assignment" ? (
        <FormField className="mt-3">
          <FormLabel htmlFor={fieldId}>Organization-defined value</FormLabel>
          <textarea
            id={fieldId}
            className="field mt-1.5 min-h-24 resize-y text-sm"
            readOnly={!canEdit}
            value={assignmentText(project?.body)}
            onChange={(event) =>
              writeAssignment("organization-defined", event.target.value)
            }
            placeholder="Flexible text. Multiple lines become multiple values. Control Freak does not infer this from the narrative."
          />
        </FormField>
      ) : null}

      {mode === "orphan" ? (
        <FormHint tone="warning" role="status">
          This stored record is not in the current generated framework. It is
          preserved and is not used in SSP substitution.
        </FormHint>
      ) : null}

      {param.select
        ? nestedParamsFor(param, selectedKeys, byId).map((nestedParam) => {
            const nestedEffective: EffectiveParameter = {
              controlId: control.id,
              parameterId: nestedParam.id,
              catalog: nestedParam,
              framework:
                (control.parameters?.parameterResolutions ?? []).find(
                  (row) => row.parameterId === nestedParam.id,
                ) ?? null,
              project: records[nestedParam.id],
              substitution: { kind: "unresolved", reason: "organization-defined" },
              annotations: [],
              isAggregate: false,
            };
            const resolvedNested =
              resolveControlParameters(control, records).find(
                (row) => row.parameterId === nestedParam.id,
              ) ?? nestedEffective;
            return (
              <div key={nestedParam.id} className="mt-3">
                <ParameterField
                  control={control}
                  param={nestedParam}
                  effective={resolvedNested}
                  records={records}
                  onChange={onChange}
                  canEdit={canEdit}
                  byId={byId}
                  nested
                />
              </div>
            );
          })
        : null}
    </article>
  );
}

export function ParameterAuthoringPanel({
  control,
  records,
  onChange,
  canEdit,
}: ParameterAuthoringPanelProps) {
  const visible = visibleAuthoringParameters(control);
  const resolved = resolveControlParameters(control, records);
  const resolvedById = new Map(resolved.map((row) => [row.parameterId, row]));
  const byId = new Map(
    (control.parameters?.organizationDefined ?? []).map((param) => [
      param.id,
      param,
    ]),
  );
  const orphans = resolved.filter((row) => row.substitution.kind === "unresolved" && row.substitution.reason === "orphan");

  if (visible.length === 0 && orphans.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="parameter-authoring-heading" className="min-w-0">
      <SectionHeader
        title="Organization-defined parameters"
        titleId="parameter-authoring-heading"
        description="Author parameter values here. Control Freak does not infer them from the implementation narrative."
      />
      <p className="mt-2 text-xs">
        <HelpLink slug="authoring-controls" hash="organization-defined-parameters">
          How parameter values relate to framework assignments
        </HelpLink>
      </p>
      <div className="mt-3 flex flex-col gap-3">
        {visible.map((param) => {
          const effective = resolvedById.get(param.id);
          if (!effective) {
            return null;
          }
          return (
            <ParameterField
              key={param.id}
              control={control}
              param={param}
              effective={effective}
              records={records}
              onChange={onChange}
              canEdit={canEdit}
              byId={byId}
            />
          );
        })}
        {orphans.map((orphan) => (
          <article
            key={orphan.parameterId}
            className="rounded-md border border-border bg-surface px-4 py-3"
          >
            <h3 className="text-sm font-semibold tracking-tight text-foreground">
              Orphaned parameter {orphan.parameterId}
            </h3>
            <FormHint tone="warning" role="status">
              Preserved on the project and excluded from SSP substitution. It is
              not rebound by label.
            </FormHint>
          </article>
        ))}
      </div>
    </section>
  );
}
