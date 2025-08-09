import { Phone, Users } from "lucide-react";
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

export default function TalkToExpertSection() {
  // Fetch talk to expert URL from database
  const { data: expertSetting } = useQuery<AppSetting>({
    queryKey: ["/api/app-settings/talk_to_expert_url"],
    staleTime: 0,
    refetchInterval: 2000,
  });

  const handleTalkToExpert = () => {
    console.log("Talk to Expert clicked");
    const expertUrl = expertSetting?.setting_value;
    if (expertUrl && expertUrl.trim() && expertUrl !== '#') {
      window.open(expertUrl, '_blank');
    } else {
      alert("Expert contact link not configured. Please contact admin.");
    }
  };

  return (
    <section className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg shadow-md p-6">
      <div className="text-center text-white">
        <h3 className="text-xl font-bold mb-4">
          <Users className="inline mr-2" size={24} />
          हमारे एक्सपर्ट्स से बात करें
        </h3>
        <p className="text-sm mb-6 opacity-90">
          Get expert advice and tips from our experienced Matka professionals
        </p>
        <Button
          onClick={handleTalkToExpert}
          className="bg-white text-purple-600 px-8 py-3 font-bold hover:bg-gray-100 transition-all duration-200 transform hover:scale-105"
        >
          <Phone className="mr-2 h-5 w-5" />
          Talk to Expert Now
        </Button>
      </div>
    </section>
  );
}