import type { ReactNode } from "react";
import type { CalloutKind } from "@/help/markdown";

const CALLOUT_LABEL: Record<CalloutKind, string> = {
  note: "Note",
  tip: "Tip",
  warning: "Warning",
  limitation: "Limitation",
};

export function HelpCallout({
  kind,
  children,
}: {
  kind: CalloutKind;
  children: ReactNode;
}) {
  const label = CALLOUT_LABEL[kind];
  return (
    <aside
      role="note"
      aria-label={label}
      className={`help-callout help-callout-${kind}`}
    >
      <p className="help-callout-label">{label}</p>
      <div className="help-callout-body">{children}</div>
    </aside>
  );
}
