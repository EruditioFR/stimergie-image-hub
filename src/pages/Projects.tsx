
import { Header } from "@/components/ui/layout/Header";
import { Footer } from "@/components/ui/layout/Footer";
import { ProjectsContainer } from "@/components/projects/ProjectsContainer";

export default function Projects() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1">
        <ProjectsContainer />
      </main>
      <Footer />
    </div>
  );
}
