import { AnalysisProvider } from "@/components/analysis-provider";
import { WorkspaceChrome } from "@/components/workspace-chrome";

export default function WorkspaceLayout({ children }: LayoutProps<"/workspace">) {
  return (
    <AnalysisProvider>
      <WorkspaceChrome />
      {children}
    </AnalysisProvider>
  );
}
