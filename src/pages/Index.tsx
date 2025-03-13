
import { Hero } from "@/components/Hero";
import { Header } from "@/components/ui/layout/Header";
import { Footer } from "@/components/ui/layout/Footer";

export default function Index() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <Hero />
        
        <section className="py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold mb-12 text-center">
              Explorez nos collections d'images
            </h2>
            {/* Content will be added here */}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
