import type { Metadata } from "next";
import { getHelpManifest, getHelpSearchIndex } from "@/help/content";
import { HelpLanding } from "@/components/help/HelpLanding";

export const metadata: Metadata = {
  title: "Help",
};

export default function HelpIndexPage() {
  const manifest = getHelpManifest();
  const searchIndex = getHelpSearchIndex();

  return (
    <HelpLanding sections={manifest.sections} searchIndex={searchIndex} />
  );
}
