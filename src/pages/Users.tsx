
import { UsersHeader } from "@/components/users/UsersHeader";
import { UsersContainer } from "@/components/users/UsersContainer";
import { UsersProvider } from "@/components/users/UsersContext";
import { Header } from "@/components/ui/layout/Header";
import { Toaster } from "sonner";
import { useUsersContext } from "@/components/users/UsersContext";

export default function Users() {
  return (
    <UsersProvider>
      <div className="min-h-screen flex flex-col">
        <Header />
        <UsersPageContent />
        <Toaster position="top-center" />
      </div>
    </UsersProvider>
  );
}

function UsersPageContent() {
  const { setShowAddForm } = useUsersContext();
  
  const handleAddClick = () => {
    setShowAddForm(true);
  };
  
  return (
    <>
      <UsersHeader onAddClick={handleAddClick} />
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12">
        <UsersContainer />
      </main>
    </>
  );
}
