
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

interface ClientsHeaderProps {
  onAddClick: () => void;
}

export function ClientsHeader({ onAddClick }: ClientsHeaderProps) {
  return (
    <div className="bg-muted/30 border-b border-border">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Clients</h1>
          
          <Button onClick={onAddClick} className="gap-2">
            <PlusCircle size={18} />
            Ajouter un client
          </Button>
        </div>
      </div>
    </div>
  );
}
