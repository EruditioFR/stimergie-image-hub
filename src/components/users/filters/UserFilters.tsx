
import { ViewToggle, ViewMode } from "@/components/ui/ViewToggle";

interface UserFiltersProps {
  selectedClientId: string | null;
  setSelectedClientId: (clientId: string | null) => void;
  selectedRole: string | null;
  setSelectedRole: (role: string | null) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  clients: { id: string; nom: string }[];
  visibleRoles: Array<{ value: string; label: string }>;
  canSeeClientFilter: boolean;
  isAdminClient: boolean;
  isAdmin: boolean;
}

export function UserFilters({
  selectedClientId,
  setSelectedClientId,
  selectedRole,
  setSelectedRole,
  viewMode,
  setViewMode,
  clients,
  visibleRoles,
  canSeeClientFilter,
  isAdminClient,
  isAdmin
}: UserFiltersProps) {
  return (
    <div className="mb-8 flex flex-col md:flex-row gap-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow">
        {canSeeClientFilter && (
          <div>
            <label htmlFor="client-filter" className="block text-sm font-medium mb-2">
              Filtrer par client
            </label>
            <select
              id="client-filter"
              className="w-full rounded-md border border-input px-3 py-2"
              value={selectedClientId || ""}
              onChange={(e) => setSelectedClientId(e.target.value || null)}
              disabled={!isAdmin && isAdminClient}
            >
              <option value="">Tous les clients</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.nom}
                </option>
              ))}
            </select>
          </div>
        )}
        
        <div>
          <label htmlFor="role-filter" className="block text-sm font-medium mb-2">
            Filtrer par rôle
          </label>
          <select
            id="role-filter"
            className="w-full rounded-md border border-input px-3 py-2"
            value={selectedRole || ""}
            onChange={(e) => setSelectedRole(e.target.value || null)}
          >
            <option value="">Tous les rôles</option>
            {visibleRoles.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="flex items-end justify-end md:pl-4">
        <ViewToggle currentView={viewMode} onViewChange={setViewMode} />
      </div>
    </div>
  );
}
