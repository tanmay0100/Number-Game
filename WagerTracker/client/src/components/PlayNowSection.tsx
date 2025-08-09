import { useState } from "react";
import { Download, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import AuthModal from "./AuthModal";

interface AppSetting {
  id: number;
  setting_key: string;
  setting_value: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export default function PlayNowSection() {
  const { isAuthenticated } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Fetch app download URL from database
  const { data: playNowSetting } = useQuery<AppSetting>({
    queryKey: ["/api/app-settings/play_now_url"],
    staleTime: 10 * 60 * 1000, // Play Now URL rarely changes
  });

  const handleDownloadApp = () => {
    console.log("Download App clicked");
    const downloadUrl = playNowSetting?.setting_value;
    if (downloadUrl && downloadUrl.trim() && downloadUrl !== '#') {
      window.open(downloadUrl, '_blank');
    } else {
      alert("Download link not configured. Please contact admin.");
    }
  };

  const handlePlayNow = () => {
    console.log("Play Now clicked");
    if (isAuthenticated) {
      // User is logged in, redirect to play games with scroll reset
      window.scrollTo(0, 0);
      window.location.href = '/play-games';
    } else {
      // User not logged in, show auth modal
      setShowAuthModal(true);
    }
  };

  return (
    <>
      <section className="bg-matka-card rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-center text-gray-800 mb-6 border-b-2 border-red-600 pb-2">
          Download App / Play Now
        </h3>
        
        <div className="space-y-4">
          <Button
            onClick={handleDownloadApp}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white p-4 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 justify-start h-auto"
          >
            <Download className="mr-3" size={20} />
            Download App
          </Button>

          <Button
            onClick={handlePlayNow}
            className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white p-4 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 justify-start h-auto"
          >
            <Play className="mr-3" size={20} />
            Play Now
          </Button>
        </div>
      </section>

      {/* Auth Modal for Play Now */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </>
  );
}