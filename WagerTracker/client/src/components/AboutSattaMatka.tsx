import { Brain } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface AppSetting {
  id: number;
  setting_key: string;
  setting_value: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export default function AboutSattaMatka() {
  // Fetch about content from database
  const { data: aboutSetting, isLoading } = useQuery<AppSetting>({
    queryKey: ["/api/app-settings/about_sattamatka_content"],
    staleTime: 10 * 60 * 1000, // About content rarely changes - fresh for 10 minutes
  });

  const aboutContent = aboutSetting?.setting_value || "Loading content...";

  return (
    <section className="bg-matka-card rounded-lg shadow-md p-6">
      <h3 className="text-xl font-bold text-center text-gray-800 mb-6 border-b-2 border-red-600 pb-2">
        <Brain className="inline mr-2 text-blue-600" size={20} />
        About SattaMatka
      </h3>
      
      <div className="space-y-4 text-sm md:text-base leading-relaxed">
        {isLoading ? (
          <div className="animate-pulse">
            <div className="bg-gray-200 h-4 rounded mb-3"></div>
            <div className="bg-gray-200 h-4 rounded mb-3"></div>
            <div className="bg-gray-200 h-4 rounded"></div>
          </div>
        ) : (
          <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
            <p className="text-gray-700 whitespace-pre-line">{aboutContent}</p>
          </div>
        )}
      </div>
    </section>
  );
}