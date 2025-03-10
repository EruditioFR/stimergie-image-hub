
import { LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";

export type ViewMode = "card" | "list";

interface ViewToggleProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

export function ViewToggle({ currentView, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex items-center space-x-2">
      <Button
        variant={currentView === "card" ? "default" : "outline"}
        size="sm"
        onClick={() => onViewChange("card")}
        title="Vue Grille"
        className="px-2"
      >
        <LayoutGrid size={18} />
      </Button>
      <Button
        variant={currentView === "list" ? "default" : "outline"}
        size="sm"
        onClick={() => onViewChange("list")}
        title="Vue Liste"
        className="px-2"
      >
        <List size={18} />
      </Button>
    </div>
  );
}
