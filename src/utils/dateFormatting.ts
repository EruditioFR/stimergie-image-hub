
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export function formatDate(dateString: string | undefined) {
  if (!dateString) return "";
  try {
    return format(new Date(dateString), "dd MMMM yyyy", { locale: fr });
  } catch (error) {
    return dateString;
  }
}
