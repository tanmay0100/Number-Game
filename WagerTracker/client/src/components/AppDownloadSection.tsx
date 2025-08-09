import { Smartphone, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

interface AppSetting {
  id: number;
  setting_key: string;
  setting_value: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export default function AppDownloadSection() {
  // Fetch app download URL from database
  const { data: appSetting } = useQuery<AppSetting>({
    queryKey: ["/api/app-settings/app_download_url"],
    staleTime: 10 * 60 * 1000, // Download URL rarely changes - fresh for 10 minutes
  });

  const handleDownload = () => {
    const downloadUrl = appSetting?.setting_value;
    if (downloadUrl && downloadUrl.trim() && downloadUrl !== '#') {
      // Redirect to the actual download URL
      window.open(downloadUrl, '_blank');
    } else {
      alert("Download link not configured. Please contact admin.");
    }
  };

  return (
    <section className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-md p-6 text-white">
      <div className="text-center">
        <h3 className="text-xl font-bold mb-3">
          <Smartphone className="inline mr-2" size={20} />
          Download PlayMatka App
        </h3>
        <p className="text-sm mb-4 opacity-90">
          अब मटका खेलना हुआ बेहद आसान, घर बैठे मोबाइल ऐप पर खेलो सारे गेम्स, 
          पाओ सबसे तेज़ रिज़ल्ट, लाइव अपडेट्स और फ्री गेसिंग टिप्स, 
          अभी डाउनलोड करो और शुरू करो अपनी किस्मत!
        </p>
        <Button 
          onClick={handleDownload}
          className="bg-white text-green-600 px-8 py-3 font-bold hover:bg-gray-100"
        >
          <Download className="mr-2 h-4 w-4" />
          Download Free Android App
        </Button>
      </div>
    </section>
  );
}
