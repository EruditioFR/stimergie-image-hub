import React, { useState } from "react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Client } from "@/types/user";
import { UserFormFieldProps } from "../UserFormTypes";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ClientsMultiSelectProps extends UserFormFieldProps {
  clients: Client[];
}

export function ClientsMultiSelect({ form, clients, disabled = false }: ClientsMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const selectedIds = form.watch("clientIds") || [];

  const toggleClient = (clientId: string) => {
    const currentIds = form.getValues("clientIds") || [];
    const newIds = currentIds.includes(clientId)
      ? currentIds.filter((id: string) => id !== clientId)
      : [...currentIds, clientId];
    form.setValue("clientIds", newIds);
  };

  const removeClient = (clientId: string) => {
    const currentIds = form.getValues("clientIds") || [];
    form.setValue("clientIds", currentIds.filter((id: string) => id !== clientId));
  };

  const selectedClients = clients.filter((client) => selectedIds.includes(client.id));

  return (
    <FormField
      control={form.control}
      name="clientIds"
      render={({ field }) => (
        <FormItem className="col-span-1">
          <FormLabel>Clients</FormLabel>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className={cn(
                    "w-full justify-between",
                    !selectedIds.length && "text-muted-foreground"
                  )}
                  disabled={disabled}
                >
                  {selectedIds.length > 0
                    ? `${selectedIds.length} client(s) sélectionné(s)`
                    : "Sélectionner des clients"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <div className="max-h-64 overflow-auto p-2">
                {clients.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-2">Aucun client disponible</p>
                ) : (
                  <div className="space-y-1">
                    {clients.map((client) => {
                      const isSelected = selectedIds.includes(client.id);
                      return (
                        <div
                          key={client.id}
                          className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent cursor-pointer"
                          onClick={() => toggleClient(client.id || "")}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleClient(client.id || "")}
                            className="pointer-events-none"
                          />
                          <span className="text-sm flex-1">{client.nom}</span>
                          {isSelected && <Check className="h-4 w-4 text-primary" />}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
          {selectedClients.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedClients.map((client) => (
                <Badge key={client.id} variant="secondary" className="gap-1">
                  {client.nom}
                  {!disabled && (
                    <button
                      type="button"
                      onClick={() => removeClient(client.id || "")}
                      className="ml-1 hover:bg-accent rounded-full"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </Badge>
              ))}
            </div>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
