import type { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/design-system/card/Card";

export type SidebarCardProps = {
  title: string;
  titleId: string;
  children: ReactNode;
  /** Emphasize the card (e.g. Review workflow). */
  prominent?: boolean;
  className?: string;
};

/**
 * Operational property panel card for the control editor sidebar.
 */
export function SidebarCard({
  title,
  titleId,
  children,
  prominent = false,
  className = "",
}: SidebarCardProps) {
  return (
    <Card
      prominent={prominent}
      aria-labelledby={titleId}
      className={className}
    >
      <CardHeader>
        <CardTitle id={titleId}>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
