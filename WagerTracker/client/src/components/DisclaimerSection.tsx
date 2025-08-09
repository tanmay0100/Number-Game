import { AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface AppSetting {
  id: number;
  setting_key: string;
  setting_value: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export default function DisclaimerSection() {
  // Fetch disclaimer content from database
  const { data: disclaimerSetting, isLoading } = useQuery<AppSetting>({
    queryKey: ["/api/app-settings/disclaimer_content"],
    staleTime: 10 * 60 * 1000, // Disclaimer rarely changes - fresh for 10 minutes
  });

  const disclaimerContent = disclaimerSetting?.setting_value || "Loading disclaimer...";

  return (
    <section className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-8">
      <h3 className="text-lg font-bold text-center text-gray-800 mb-4">
        <AlertTriangle className="inline mr-2 text-yellow-600" size={20} />
        Disclaimer & Responsible Gaming
      </h3>
      <div className="text-sm text-gray-700 space-y-2">
        {isLoading ? (
          <div className="animate-pulse">
            <div className="bg-gray-200 h-3 rounded mb-2"></div>
            <div className="bg-gray-200 h-3 rounded mb-2"></div>
            <div className="bg-gray-200 h-3 rounded"></div>
          </div>
        ) : (
          <p className="whitespace-pre-line">{disclaimerContent}</p>
        )}
      </div>
    </section>
  );
}
