
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface ClientsSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function ClientsSearch({ value, onChange }: ClientsSearchProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
      <Input
        placeholder="Rechercher un client par nom..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10"
      />
    </div>
  );
}
