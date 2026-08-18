import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAdjacentHelpPages, getHelpManifest, getHelpPage } from "@/help/content";
import { HelpArticle } from "@/components/help/HelpArticle";
import { HelpSidebarNav } from "@/components/help/HelpSidebarNav";

type HelpTopicPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: HelpTopicPageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = getHelpPage(slug);
  if (!page) {
    return { title: "Help" };
  }
  return { title: page.title, description: page.summary || undefined };
}

export default async function HelpTopicPage({ params }: HelpTopicPageProps) {
  const { slug } = await params;
  const page = getHelpPage(slug);
  if (!page) {
    notFound();
  }

  const manifest = getHelpManifest();
  const { previous, next } = getAdjacentHelpPages(slug);
  const related = page.related
    .map((relatedSlug) =>
      manifest.flat.find((summary) => summary.slug === relatedSlug),
    )
    .filter((summary): summary is NonNullable<typeof summary> => Boolean(summary));

  return (
    <div className="mx-auto flex w-full max-w-[var(--layout-help-max)] flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
      <HelpSidebarNav sections={manifest.sections} activeSlug={slug} />
      <HelpArticle page={page} previous={previous} next={next} related={related} />
    </div>
  );
}
