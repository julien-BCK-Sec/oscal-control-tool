import { ControlBrowser } from "@/components/ControlBrowser";
import { ProjectMetadataSection } from "@/components/ProjectMetadataSection";

export default function Home() {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <ProjectMetadataSection />
      <div className="flex min-h-0 flex-1 flex-col">
        <ControlBrowser />
      </div>
    </div>
  );
}
