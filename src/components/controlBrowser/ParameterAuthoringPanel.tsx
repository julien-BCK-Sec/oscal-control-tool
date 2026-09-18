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
  authorFacingStatusHint,
  authorFacingStatusLabel,
  catalogChoiceVisibleText,
  frameworkStatusLabel,
  nestedParametersForChoice,
  isFailClosedParameterMode,
  parameterAuthoringSummary,
  parameterDetailsDefaultOpen,
  parameterEditorMode,
  parameterInsertContext,
  parameterOdpSectionDefaultOpen,
  parameterPrompt,
  parameterUsesCompactResolvedPresentation,
  resolutionStateLabel,
  sharedAuthorableEditorMode,
  sharedParameterSectionNotice,
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
import { AuthoringDisclosure } from "@/components/authoring/AuthoringDisclosure";
import { HelpLink } from "@/components/help/HelpLink";
import { Button } from "@/components/design-system/button/Button";
import { StatusBadge } from "@/components/design-system/badge/StatusBadge";
import {
  FormField,
  FormHint,
  FormLabel,
} from "@/components/design-system/form/FormField";

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
}: {
  id: string;
  persistedValues: readonly string[] | undefined;
  readOnly: boolean;
  onCommit: (text: string) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const multiValue = (persistedValues?.length ?? 0) > 1;
  return (
    <textarea
      id={id}
      rows={multiValue ? 3 : 1}
      className={`field mt-1 resize-y text-sm ${
        multiValue ? "min-h-16" : "min-h-9"
      }`}
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

function ParameterDetails({
  fieldId,
  param,
  effective,
  insertContext,
}: {
  fieldId: string;
  param: FrameworkOrganizationDefinedParameter;
  effective: EffectiveParameter;
  insertContext: string | null;
}) {
  const frameworkValues =
    effective.framework?.values?.length
      ? substitutionDisplayText(effective.framework.values)
      : null;
  const provenance =
    effective.framework?.sources
      .map((source) => `${source.source}: ${source.text}`)
      .join(" ") ?? null;
  const mappingBasis = effective.framework?.mappingBasis ?? null;

  return (
    <AuthoringDisclosure
      title="Details"
      titleId={`${fieldId}-details`}
      defaultOpen={parameterDetailsDefaultOpen()}
      compact
      className="mt-1.5"
    >
      <dl className="space-y-1 text-xs text-text-muted">
        <div>
          <dt className="inline font-medium text-text-secondary">Parameter ID: </dt>
          <dd className="inline">
            {param.id}
            {param.altIdentifiers.length > 0
              ? ` (also ${param.altIdentifiers.join(", ")})`
              : ""}
          </dd>
        </div>
        <div>
          <dt className="inline font-medium text-text-secondary">Resolution: </dt>
          <dd className="inline">{resolutionStateLabel(effective)}</dd>
        </div>
        <div>
          <dt className="inline font-medium text-text-secondary">Framework status: </dt>
          <dd className="inline">{frameworkStatusLabel(effective)}</dd>
        </div>
        {mappingBasis ? (
          <div>
            <dt className="inline font-medium text-text-secondary">Mapping basis: </dt>
            <dd className="inline">{mappingBasis}</dd>
          </div>
        ) : null}
        {frameworkValues ? (
          <div>
            <dt className="inline font-medium text-text-secondary">Framework value: </dt>
            <dd className="inline text-text-secondary">{frameworkValues}</dd>
          </div>
        ) : null}
        {provenance ? (
          <div>
            <dt className="inline font-medium text-text-secondary">Source: </dt>
            <dd className="inline">{provenance}</dd>
          </div>
        ) : null}
        {insertContext ? (
          <div>
            <dt className="inline font-medium text-text-secondary">Insert context: </dt>
            <dd className="inline">{insertContext}</dd>
          </div>
        ) : null}
      </dl>
    </AuthoringDisclosure>
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
  sharedMode,
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
  sharedMode: ReturnType<typeof sharedAuthorableEditorMode>;
}) {
  const mode = parameterEditorMode(effective);
  const project = records[param.id];
  const fieldId = `parameter-${param.id}`;
  const prompt = parameterPrompt(param);
  const insertContext = parameterInsertContext(control, param);
  const failClosed = isFailClosedParameterMode(mode);
  const compactResolved = parameterUsesCompactResolvedPresentation({
    substitutionKind: effective.substitution.kind,
    nested,
    failClosed,
    mode,
  });
  const [editing, setEditing] = useState(!compactResolved);
  const resolvedPreview =
    effective.substitution.kind === "value"
      ? substitutionDisplayText(effective.substitution.values)
      : null;
  const showEditor = editing || !compactResolved;
  const status = authorFacingStatusLabel(effective);
  const hint = authorFacingStatusHint(mode, nested ? null : sharedMode);
  const description = param.description.trim();

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
      className={nested ? "bg-transparent" : undefined}
      aria-labelledby={`${fieldId}-label`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        {nested ? (
          <span id={`${fieldId}-label`} className="sr-only">
            {prompt}
          </span>
        ) : (
          <h3
            id={`${fieldId}-label`}
            className="text-xs font-semibold uppercase tracking-wide text-text-secondary"
          >
            {prompt}
          </h3>
        )}
        <StatusBadge
          label={status}
          variant={effective.substitution.kind === "value" ? "info" : "neutral"}
          size="xs"
        />
      </div>
      {description && showEditor ? (
        <p className="mt-1 text-xs leading-relaxed text-text-muted">{description}</p>
      ) : null}
      {hint ? (
        <p className="mt-1 text-xs leading-relaxed text-text-secondary" role="status">
          {hint}
        </p>
      ) : null}
      {!showEditor && resolvedPreview ? (
        <p className="mt-1 text-sm text-foreground">{resolvedPreview}</p>
      ) : null}
      {!showEditor ? (
        <div className="mt-1.5">
          <Button
            type="button"
            size="sm"
            onClick={() => setEditing(true)}
            onKeyDown={onNativeKeyDown}
          >
            {canEdit ? "Edit" : "Show value"}
          </Button>
        </div>
      ) : null}

      {showEditor ? (
        <div>
          {mode === "framework-authoritative" ? (
            <FormField className="mt-2">
              {resolvedPreview ? (
                <p className="mb-2 text-sm text-foreground">{resolvedPreview}</p>
              ) : null}
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
            </FormField>
          ) : null}

          {mode === "may-use-baseline" ? (
            <div className="mt-2 flex flex-col gap-2">
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
              </FormField>
            </div>
          ) : null}

          {mode === "authoritative-value-required" ? (
            <div className="mt-2">
              <FormField>
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
              <FormField className="mt-2 max-w-xl">
                <FormLabel htmlFor={`${fieldId}-source`}>Source note</FormLabel>
                <input
                  id={`${fieldId}-source`}
                  className="field mt-1"
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
              </FormField>
            </div>
          ) : null}

          {mode === "source-conflict" ? (
            <FormField className="mt-2">
              <FormLabel htmlFor={fieldId}>How the organization proceeded</FormLabel>
              <textarea
                id={fieldId}
                rows={2}
                className="field mt-1 min-h-9 resize-y text-sm"
                readOnly={!canEdit}
                value={
                  project?.intent === "conflict-proceeding" ? project.notes ?? "" : ""
                }
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
            </FormField>
          ) : null}

          {mode === "control-level-unmapped" ? (
            <FormField className="mt-2">
              <FormLabel htmlFor={fieldId}>Optional project documentation</FormLabel>
              <DraftTextarea
                id={fieldId}
                readOnly={!canEdit}
                persistedValues={assignmentValues(project?.body)}
                onCommit={(text) => writeAssignment("organization-defined", text)}
                placeholder="Optional. Not substituted into the SSP while this parameter is unmapped."
              />
            </FormField>
          ) : null}

          {mode === "selection" && param.select ? (
            <fieldset className="mt-2" disabled={!canEdit}>
              <legend className="text-xs font-medium text-text-secondary">
                {param.select.howMany === "one-or-more"
                  ? "Select one or more catalog choices"
                  : "Select one catalog choice"}
              </legend>
              <div className="mt-1.5 flex flex-col gap-2">
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
                          name={
                            param.select?.howMany === "one"
                              ? fieldId
                              : `${fieldId}-${choice.key}`
                          }
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
                              sharedMode={null}
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
            <FormField className="mt-2">
              <FormLabel htmlFor={fieldId}>Organization-defined value</FormLabel>
              <DraftTextarea
                id={fieldId}
                readOnly={!canEdit}
                persistedValues={assignmentValues(project?.body)}
                onCommit={(text) => writeAssignment("organization-defined", text)}
                placeholder="Flexible text. Multiple lines become multiple values."
              />
            </FormField>
          ) : null}

          {mode === "orphan" ? (
            <FormHint tone="warning" role="status">
              This stored record is not in the current generated framework. It is
              preserved and is not used in SSP substitution.
            </FormHint>
          ) : null}
        </div>
      ) : null}

      <ParameterDetails
        fieldId={fieldId}
        param={param}
        effective={effective}
        insertContext={insertContext}
      />
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
  const orphans = resolved.filter(
    (row) =>
      row.substitution.kind === "unresolved" && row.substitution.reason === "orphan",
  );
  const summary = parameterAuthoringSummary(control, resolved, records);
  const sharedMode = sharedAuthorableEditorMode(control, resolved, records);
  const sharedNotice = sharedParameterSectionNotice(sharedMode);

  if (visible.length === 0 && orphans.length === 0) {
    return null;
  }

  return (
    <AuthoringDisclosure
      title="Organization-defined parameters"
      titleId="parameter-authoring-heading"
      summary={summary.caption}
      description={sharedNotice?.title}
      defaultOpen={parameterOdpSectionDefaultOpen(summary)}
      expandHint="Review parameters"
      collapseHint="Hide parameters"
    >
      {sharedNotice ? (
        <div className="mb-3 border-l-2 border-border bg-surface-secondary/50 px-3 py-2">
          <p className="text-xs font-medium text-text-secondary">{sharedNotice.title}</p>
          <p className="mt-1 text-xs leading-relaxed text-text-muted">
            {sharedNotice.body}
          </p>
          <p className="mt-1.5 text-xs">
            <HelpLink slug={sharedNotice.helpSlug} hash={sharedNotice.helpHash}>
              Learn more
            </HelpLink>
          </p>
        </div>
      ) : (
        <p className="mb-3 text-xs text-text-muted">
          Author parameter values here. Control Freak does not infer them from
          the implementation narrative.{" "}
          <HelpLink slug="authoring-controls" hash="organization-defined-parameters">
            Learn more
          </HelpLink>
        </p>
      )}
      <div className="flex flex-col divide-y divide-border">
        {visible.map((param) => {
          const effective = resolvedById.get(param.id);
          if (!effective) {
            return null;
          }
          return (
            <div key={param.id} className="py-3 first:pt-0 last:pb-0">
              <ParameterField
                control={control}
                param={param}
                effective={effective}
                records={records}
                onChange={onChange}
                canEdit={canEdit}
                byId={byId}
                resolvedById={resolvedById}
                sharedMode={sharedMode}
              />
            </div>
          );
        })}
        {orphans.map((orphan) => (
          <article key={orphan.parameterId} className="py-3 first:pt-0 last:pb-0">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
              Orphaned parameter {orphan.parameterId}
            </h3>
            <FormHint tone="warning" role="status">
              Preserved on the project and excluded from SSP substitution. It is
              not rebound by label.
            </FormHint>
          </article>
        ))}
      </div>
    </AuthoringDisclosure>
  );
}
