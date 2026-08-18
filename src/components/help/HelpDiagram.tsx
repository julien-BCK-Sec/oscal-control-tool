/**
 * Lightweight semantic diagrams from fenced `diagram` blocks in Markdown.
 * First line is the kind (`tree`, `flow`, or `columns`); remaining lines
 * are the labeled content. No image assets.
 */
export function HelpDiagram({ code }: { code: string }) {
  const lines = code.replace(/\r\n/g, "\n").trim().split("\n");
  const kind = (lines[0] ?? "").trim().toLowerCase();
  const rest = lines.slice(1).map((line) => line.trim()).filter(Boolean);

  if (kind === "tree") {
    const [root, ...children] = rest;
    if (!root) {
      return null;
    }
    return (
      <figure className="help-diagram" aria-label={root}>
        <figcaption className="help-diagram-node text-sm font-semibold text-foreground">
          {root}
        </figcaption>
        <ul className="mt-3 space-y-2 border-l border-border pl-4">
          {children.map((child) => (
            <li key={child} className="help-diagram-node text-sm text-text-secondary">
              {child}
            </li>
          ))}
        </ul>
      </figure>
    );
  }

  if (kind === "flow") {
    const steps = rest
      .join(" ")
      .split(/→|->/)
      .map((step) => step.trim())
      .filter(Boolean);
    if (steps.length === 0) {
      return null;
    }
    return (
      <figure className="help-diagram" aria-label={steps.join(" to ")}>
        <ol className="m-0 flex list-none flex-wrap items-center gap-2 p-0">
          {steps.map((step, index) => (
            <li key={`${step}-${index}`} className="flex items-center gap-2">
              <span className="help-diagram-node text-sm font-medium text-foreground">
                {step}
              </span>
              {index < steps.length - 1 ? (
                <span aria-hidden="true" className="text-text-muted">
                  →
                </span>
              ) : null}
            </li>
          ))}
        </ol>
      </figure>
    );
  }

  if (kind === "columns") {
    const groups = code
      .replace(/\r\n/g, "\n")
      .trim()
      .split("\n")
      .slice(1)
      .join("\n")
      .split(/\n---\n/);
    const columns = groups
      .map((group) => {
        const [title, ...body] = group
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean);
        return title ? { title, body: body.join(" ") } : null;
      })
      .filter((column): column is { title: string; body: string } => Boolean(column));
    if (columns.length === 0) {
      return null;
    }
    const columnClass =
      columns.length >= 3
        ? "sm:grid-cols-3"
        : columns.length === 2
          ? "sm:grid-cols-2"
          : "grid-cols-1";
    return (
      <figure className="help-diagram">
        <ul className={`m-0 grid list-none gap-3 p-0 ${columnClass}`}>
          {columns.map((column) => (
            <li key={column.title} className="help-diagram-node">
              <p className="text-sm font-semibold text-foreground">{column.title}</p>
              {column.body ? (
                <p className="mt-1 text-sm leading-relaxed text-text-secondary">
                  {column.body}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      </figure>
    );
  }

  return (
    <pre className="control-id mt-3 overflow-x-auto rounded-md border border-border bg-surface-secondary p-3 text-xs">
      <code>{code}</code>
    </pre>
  );
}
