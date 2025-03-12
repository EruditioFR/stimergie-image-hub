
import { Client } from "@/pages/Clients";
import { useState } from "react";
import { ClientForm } from "./ClientForm";

interface ClientFormDialogProps {
  show: boolean;
  initialData?: Client;
  onSubmit: (client: Client) => void;
  onCancel: () => void;
}

export function ClientFormDialog({
  show,
  initialData,
  onSubmit,
  onCancel
}: ClientFormDialogProps) {
  if (!show) return null;

  return (
    <div className="pt-6">
      <ClientForm
        initialData={initialData}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    </div>
  );
}
