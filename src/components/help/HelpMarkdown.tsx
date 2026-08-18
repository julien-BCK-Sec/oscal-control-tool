import Link from "next/link";
import type { ReactNode } from "react";
import type { BlockNode, InlineNode } from "@/help/markdown";
import { HelpCallout } from "@/components/help/HelpCallout";
import { HelpDiagram } from "@/components/help/HelpDiagram";

const HELP_LINK_CLASS =
  "text-accent underline underline-offset-2 hover:no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring";

/**
 * Renders the Help content AST as React elements. Never uses
 * dangerouslySetInnerHTML — every text value flows through React children,
 * so it is safe even though the parser is dependency-free.
 */
export function HelpMarkdown({ blocks }: { blocks: BlockNode[] }) {
  return <>{blocks.map((block, index) => renderBlock(block, index))}</>;
}

function renderInline(nodes: InlineNode[]): ReactNode {
  return nodes.map((node, index) => renderInlineNode(node, index));
}

function renderInlineNode(node: InlineNode, key: number): ReactNode {
  switch (node.type) {
    case "text":
      return node.value;
    case "bold":
      return <strong key={key}>{renderInline(node.children)}</strong>;
    case "italic":
      return <em key={key}>{renderInline(node.children)}</em>;
    case "code":
      return (
        <code
          key={key}
          className="control-id rounded-sm bg-accent-muted px-1 py-0.5 text-[0.85em] text-accent"
        >
          {node.value}
        </code>
      );
    case "link": {
      const isInternal = node.href.startsWith("/");
      if (isInternal) {
        return (
          <Link key={key} href={node.href} className={HELP_LINK_CLASS}>
            {renderInline(node.children)}
          </Link>
        );
      }
      return (
        <a
          key={key}
          href={node.href}
          target="_blank"
          rel="noopener noreferrer"
          className={HELP_LINK_CLASS}
        >
          {renderInline(node.children)}
        </a>
      );
    }
    default:
      return null;
  }
}

// Page titles (frontmatter) render as <h1> outside this component, so the
// smallest heading content pages use (`##`, level 2) maps directly to <h2>.
const HEADING_TAG = {
  1: "h2",
  2: "h2",
  3: "h3",
  4: "h4",
} as const;

function renderBlock(block: BlockNode, key: number): ReactNode {
  switch (block.type) {
    case "heading": {
      const Tag = HEADING_TAG[block.level];
      return (
        <Tag
          key={key}
          id={block.id}
          className={`scroll-mt-24 ${key === 0 ? "mt-0" : ""}`}
        >
          {renderInline(block.children)}
        </Tag>
      );
    }
    case "paragraph":
      return (
        <p key={key} className="mt-3 text-text-secondary">
          {renderInline(block.children)}
        </p>
      );
    case "list": {
      const Tag = block.ordered ? "ol" : "ul";
      return (
        <Tag
          key={key}
          className={`mt-3 space-y-1.5 pl-5 text-text-secondary ${
            block.ordered ? "list-decimal" : "list-disc"
          }`}
        >
          {block.items.map((item, itemIndex) => (
            <li key={itemIndex}>{renderInline(item)}</li>
          ))}
        </Tag>
      );
    }
    case "code_block":
      if (block.lang === "diagram") {
        return <HelpDiagram key={key} code={block.code} />;
      }
      return (
        <pre
          key={key}
          className="control-id mt-3 overflow-x-auto rounded-md border border-border bg-surface-secondary p-3 text-xs"
        >
          <code>{block.code}</code>
        </pre>
      );
    case "blockquote":
      return (
        <HelpCallout key={key} kind={block.kind}>
          {renderInline(block.children)}
        </HelpCallout>
      );
    case "table":
      return (
        <div key={key} className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-secondary">
                {block.header.map((cell, cellIndex) => (
                  <th
                    key={cellIndex}
                    scope="col"
                    className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-text-secondary"
                  >
                    {renderInline(cell)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-b border-border/60">
                  {row.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className={`px-3 py-2.5 align-top text-text-secondary ${
                        cellIndex === 0 ? "font-medium text-foreground" : ""
                      }`}
                    >
                      {renderInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "hr":
      return <hr key={key} className="mt-6 border-border" />;
    default:
      return null;
  }
}
