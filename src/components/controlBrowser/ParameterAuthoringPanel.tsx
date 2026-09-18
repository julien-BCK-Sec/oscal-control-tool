"use client";

import { useState, type KeyboardEvent } from "react";
import type { FrameworkControl } from "@/data/framework";
import type {
  AuthoredParameterBody,
  ProjectParameterIntent,
  ProjectParameterRecord,
  ProjectParameterRecords,
} from "@/data/parameter";
import type { FrameworkOrganizationDefinedParameter } from "@/data/framework/types";
import {
  catalogChoiceVisibleText,
  frameworkStatusLabel,
  nestedParametersForChoice,
  parameterEditorMode,
  parameterInsertContext,
  parameterPrompt,
  resolutionStateLabel,
  visibleAuthoringParameters,
  withCatalogSelection,
} from "@/domain/parameter-authoring";
import {
  displayedAssignmentValue,
  persistAssignmentValues,
} from "@/domain/parameter-draft";
import {
  resolveControlParameters,
  substitutionDisplayText,
  type EffectiveParameter,
} from "@/domain/parameter-resolution";
import { preserveNativeControlKeys } from "@/editor/keyboard-target";
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

function assignmentValues(body: AuthoredParameterBody | undefined): string[] {
  if (body?.form === "assignment") {
    return [...body.values];
  }
  return [];
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

function onNativeKeyDown(event: KeyboardEvent<HTMLElement>) {
  preserveNativeControlKeys(event);
}

function DraftTextarea({
  id,
  persistedValues,
  readOnly,
  onCommit,
  placeholder,
  minHeightClass = "min-h-20",
}: {
  id: string;
  persistedValues: readonly string[] | undefined;
  readOnly: boolean;
  onCommit: (text: string) => void;
  placeholder?: string;
  minHeightClass?: string;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <textarea
      id={id}
      className={`field mt-1.5 resize-y text-sm ${minHeightClass}`}
      readOnly={readOnly}
      value={displayedAssignmentValue(draft, persistedValues)}
      onChange={(event) => {
        setDraft(event.target.value);
        onCommit(event.target.value);
      }}
      onBlur={() => setDraft(null)}
      onKeyDown={onNativeKeyDown}
      placeholder={placeholder}
    />
  );
}

function ParameterField({
  control,
  param,
  effective,
  records,
  onChange,
  canEdit,
  byId,
  resolvedById,
  nested,
}: {
  control: FrameworkControl;
  param: FrameworkOrganizationDefinedParameter;
  effective: EffectiveParameter;
  records: ProjectParameterRecords;
  onChange: (next: ProjectParameterRecords) => void;
  canEdit: boolean;
  byId: Map<string, FrameworkOrganizationDefinedParameter>;
  resolvedById: Map<string, EffectiveParameter>;
  nested?: boolean;
}) {
  const mode = parameterEditorMode(effective);
  const project = records[param.id];
  const fieldId = `parameter-${param.id}`;
  const prompt = parameterPrompt(param);
  const insertContext = parameterInsertContext(control, param);
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
    const values = persistAssignmentValues(text);
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
    onChange(withCatalogSelection(records, control.id, param, keys));
  }

  const selectedKeys =
    project?.body?.form === "selection" ? [...project.body.selectedChoiceKeys] : [];

  return (
    <article
      className={
        nested
          ? "bg-transparent"
          : "rounded-md border border-border bg-surface px-4 py-3"
      }
      aria-labelledby={`${fieldId}-label`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        {nested ? (
          <span id={`${fieldId}-label`} className="sr-only">
            {prompt}
          </span>
        ) : (
          <h3
            id={`${fieldId}-label`}
            className="text-sm font-semibold tracking-tight text-foreground"
          >
            {prompt}
          </h3>
        )}
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
          <DraftTextarea
            id={`${fieldId}-deviation`}
            readOnly={!canEdit}
            persistedValues={
              project?.intent === "documented-deviation"
                ? assignmentValues(project.body)
                : undefined
            }
            onCommit={(text) => writeAssignment("documented-deviation", text)}
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
                onKeyDown={onNativeKeyDown}
              >
                Use permitted baseline value
              </Button>
              {project?.intent === "accept-permitted-baseline" ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => onChange(removeRecord(records, param.id))}
                  onKeyDown={onNativeKeyDown}
                >
                  Clear acceptance
                </Button>
              ) : null}
            </div>
          ) : null}
          <FormField>
            <FormLabel htmlFor={fieldId}>Organization-defined value</FormLabel>
            <DraftTextarea
              id={fieldId}
              readOnly={!canEdit}
              persistedValues={
                project?.intent === "organization-defined"
                  ? assignmentValues(project.body)
                  : undefined
              }
              onCommit={(text) =>
                writeAssignment("organization-defined", text)
              }
              placeholder="Or author an organization value instead of accepting the baseline."
            />
            <InsertScopeHint prompt={prompt} context={insertContext} />
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
            <DraftTextarea
              id={fieldId}
              readOnly={!canEdit}
              persistedValues={
                project?.intent === "dspav-assertion"
                  ? assignmentValues(project.body)
                  : undefined
              }
              onCommit={(text) =>
                writeAssignment("dspav-assertion", text, {
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
                    ? assignmentValues(project.body).join("\n")
                    : "",
                  { dspavSourceNote: event.target.value },
                )
              }
              onKeyDown={onNativeKeyDown}
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
            onKeyDown={onNativeKeyDown}
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
          <DraftTextarea
            id={fieldId}
            readOnly={!canEdit}
            persistedValues={assignmentValues(project?.body)}
            onCommit={(text) =>
              writeAssignment("organization-defined", text)
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
          <div className="mt-2 flex flex-col gap-3">
            {param.select.choices.map((choice) => {
              const checked = selectedKeys.includes(choice.key);
              const inputId = `${fieldId}-choice-${choice.key}`;
              const visibleText = catalogChoiceVisibleText(choice);
              const nestedParams = checked
                ? nestedParametersForChoice(choice, byId)
                : [];
              return (
                <div key={choice.key} className="flex flex-col gap-2">
                  <label className="flex items-start gap-2 text-sm">
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
                      onKeyDown={onNativeKeyDown}
                    />
                    <span>{visibleText}</span>
                  </label>
                  {nestedParams.map((nestedParam) => {
                    const nestedEffective = resolvedById.get(nestedParam.id);
                    if (!nestedEffective) {
                      return null;
                    }
                    const nestedLabel = parameterPrompt(nestedParam);
                    return (
                      <div
                        key={nestedParam.id}
                        className="ml-6 border-l-2 border-border pl-3"
                        role="group"
                        aria-label={`${visibleText} ${nestedLabel}`}
                      >
                        <p className="mb-1 text-xs text-text-secondary">
                          <span aria-hidden="true">└ </span>
                          {nestedLabel}
                        </p>
                        <ParameterField
                          control={control}
                          param={nestedParam}
                          effective={nestedEffective}
                          records={records}
                          onChange={onChange}
                          canEdit={canEdit}
                          byId={byId}
                          resolvedById={resolvedById}
                          nested
                        />
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </fieldset>
      ) : null}

      {mode === "assignment" ? (
        <FormField className="mt-3">
          <FormLabel htmlFor={fieldId}>Organization-defined value</FormLabel>
          <DraftTextarea
            id={fieldId}
            readOnly={!canEdit}
            persistedValues={assignmentValues(project?.body)}
            onCommit={(text) =>
              writeAssignment("organization-defined", text)
            }
            placeholder="Flexible text. Multiple lines become multiple values. Control Freak does not infer this from the narrative."
            minHeightClass="min-h-24"
          />
          <InsertScopeHint prompt={prompt} context={insertContext} />
        </FormField>
      ) : null}

      {mode === "orphan" ? (
        <FormHint tone="warning" role="status">
          This stored record is not in the current generated framework. It is
          preserved and is not used in SSP substitution.
        </FormHint>
      ) : null}
    </article>
  );
}

function InsertScopeHint({
  prompt,
  context,
}: {
  prompt: string;
  context: string | null;
}) {
  return (
    <FormHint>
      {context
        ? `This value fills only [${prompt}] in the requirement: ${context}`
        : `Enter only the value for [${prompt}], not the surrounding requirement.`}
    </FormHint>
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
              resolvedById={resolvedById}
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
