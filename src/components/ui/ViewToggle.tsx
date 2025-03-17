
import { Grid2X2, List } from "lucide-react";
import { Button } from "@/components/ui/button";

export type ViewMode = "card" | "list";

interface ViewToggleProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

export function ViewToggle({ currentView, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex space-x-1 border rounded-md p-1">
      <Button
        variant={currentView === "card" ? "default" : "ghost"}
        size="icon"
        className="h-8 w-8"
        onClick={() => onViewChange("card")}
        title="Vue en cartes"
      >
        <Grid2X2 size={16} />
      </Button>
      <Button
        variant={currentView === "list" ? "default" : "ghost"}
        size="icon"
        className="h-8 w-8"
        onClick={() => onViewChange("list")}
        title="Vue en liste"
      >
        <List size={16} />
      </Button>
    </div>
  );
}
