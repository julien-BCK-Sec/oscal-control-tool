import { ControlBrowser } from "@/components/ControlBrowser";
import { ProjectMetadataSection } from "@/components/ProjectMetadataSection";

export default function Home() {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <ProjectMetadataSection />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <ControlBrowser />
      </div>
    </div>
  );
}
