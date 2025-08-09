import { useState } from "react";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import AuthModal from "@/components/AuthModal";

export default function Header() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const handleLoginRegistration = () => {
    setIsAuthModalOpen(true);
  };

  return (
    <>
      <header className="bg-gradient-to-r from-red-600 to-red-500 text-white py-4 shadow-lg">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-2xl md:text-3xl font-bold tracking-wider">:::SattaMatka:::</h1>
          <p className="text-sm md:text-base mt-1 opacity-90">सबसे तेज़ और भरोसेमंद वेबसाइट</p>
        </div>
      </header>
      
      <section className="bg-white shadow-sm py-3">
        <div className="container mx-auto px-4 text-center">
          <Button
            onClick={handleLoginRegistration}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 font-semibold"
          >
            <LogIn className="mr-2 h-4 w-4" />
            Login & Registration
          </Button>
        </div>
      </section>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </>
  );
}
