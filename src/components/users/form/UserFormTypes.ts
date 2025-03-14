
import { User, Client } from "@/types/user";
import { UserRole } from "./UserFormValidation";

export interface UserFormProps {
  clients: Client[];
  onSubmit: (user: Omit<User, 'id'> | User, password?: string) => void;
  onCancel: () => void;
  initialData?: User;
  isEditing?: boolean;
  isAdmin?: boolean;
}

export interface UserFormFieldProps {
  form: any;
  isEditing?: boolean;
}

export interface RoleFieldProps extends UserFormFieldProps {
  availableRoles: Array<{value: UserRole, label: string}>;
}

export interface ClientFieldProps extends UserFormFieldProps {
  clients: Client[];
}

export interface PasswordFieldProps extends UserFormFieldProps {
  isEditing: boolean;
}
