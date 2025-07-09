
import { Header } from '@/components/ui/layout/Header';
import { Footer } from '@/components/ui/layout/Footer';
import { ProjectAccessPeriods } from '@/components/access-periods/ProjectAccessPeriods';

const AccessPeriods = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <ProjectAccessPeriods />
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default AccessPeriods;
