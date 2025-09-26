
import React from "react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Client } from "@/types/user";
import { UserFormFieldProps } from "../UserFormTypes";

export interface ClientFieldProps extends UserFormFieldProps {
  clients: Client[];
}

export function ClientField({ form, clients, isEditing = false, disabled = false }: ClientFieldProps) {
  return (
    <FormField
      control={form.control}
      name="clientIds"
      render={({ field }) => (
        <FormItem className="col-span-1 md:col-span-2">
          <FormLabel>Clients</FormLabel>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 border rounded-md">
            {clients.map((client) => (
              <FormField
                key={client.id}
                control={form.control}
                name="clientIds"
                render={({ field }) => {
                  return (
                    <FormItem
                      key={client.id}
                      className="flex flex-row items-start space-x-3 space-y-0"
                    >
                      <FormControl>
                        <Checkbox
                          disabled={disabled}
                          checked={field.value?.includes(client.id) || false}
                          onCheckedChange={(checked) => {
                            const currentValues = field.value || [];
                            return checked
                              ? field.onChange([...currentValues, client.id])
                              : field.onChange(
                                  currentValues?.filter((value) => value !== client.id)
                                );
                          }}
                        />
                      </FormControl>
                      <FormLabel className="font-normal cursor-pointer">
                        {client.nom}
                      </FormLabel>
                    </FormItem>
                  );
                }}
              />
            ))}
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
