import { Calculator, GraduationCap, MessageCircle, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface DailyGame {
  name: string;
  icon: React.ReactNode;
  bgColor: string;
  hoverColor: string;
}

export default function DailyGamesZone() {
  const dailyGames: DailyGame[] = [
    {
      name: "Guessing Formula",
      icon: <Calculator size={20} />,
      bgColor: "from-blue-500 to-blue-600",
      hoverColor: "hover:from-blue-600 hover:to-blue-700"
    },
    {
      name: "Expert Formula",
      icon: <GraduationCap size={20} />,
      bgColor: "from-purple-500 to-purple-600",
      hoverColor: "hover:from-purple-600 hover:to-purple-700"
    },
    {
      name: "Chatting Formula",
      icon: <MessageCircle size={20} />,
      bgColor: "from-green-500 to-green-600",
      hoverColor: "hover:from-green-600 hover:to-green-700"
    },
    {
      name: "Free Open to Close",
      icon: <Gift size={20} />,
      bgColor: "from-orange-500 to-red-500",
      hoverColor: "hover:from-red-500 hover:to-red-600"
    }
  ];

  const handleGameClick = (gameName: string) => {
    console.log(`${gameName} clicked`);
  };

  return (
    <section className="bg-matka-card rounded-lg shadow-md p-6">
      <h3 className="text-xl font-bold text-center text-gray-800 mb-6 border-b-2 border-red-600 pb-2">
        DAILY GAMES ZONE (MEETING ROOM)
      </h3>
      
      <div className="space-y-3">
        {dailyGames.map((game, index) => {
          if (game.name === "Guessing Formula") {
            return (
              <Link key={index} href="/guess-formula">
                <Button
                  className={`w-full bg-gradient-to-r ${game.bgColor} ${game.hoverColor} text-white p-4 rounded-lg font-semibold text-left transition-all duration-200 transform hover:scale-105 justify-start h-auto`}
                >
                  <span className="mr-3">{game.icon}</span>
                  {game.name}
                </Button>
              </Link>
            );
          }
          
          return (
            <Button
              key={index}
              onClick={() => handleGameClick(game.name)}
              className={`w-full bg-gradient-to-r ${game.bgColor} ${game.hoverColor} text-white p-4 rounded-lg font-semibold text-left transition-all duration-200 transform hover:scale-105 justify-start h-auto`}
            >
              <span className="mr-3">{game.icon}</span>
              {game.name}
            </Button>
          );
        })}
      </div>
    </section>
  );
}
