import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import type { GameResult } from "@shared/schema";

export default function GameResultsSection() {
  // Fetch live results from API (same as admin added games) - PUBLIC ACCESS
  const { data: liveResults = [], isLoading } = useQuery<GameResult[]>({
    queryKey: ["/api/live-results"],
    refetchOnWindowFocus: true, // Only refetch when user returns to page
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    // No authentication required - public section
  });

  // Show all games (including pending ones without results)
  const allGames = (liveResults as GameResult[]);

  // Format result display logic - Show combined result only when complete
  const formatResult = (result: GameResult) => {
    // Check if result is complete (all four fields must be present)
    const isComplete = result.openPatti && result.openAnk && result.closePatti && result.closeAnk;
    
    if (isComplete) {
      // Full result: "555-52-444" (openPatti-openAnk+closeAnk-closePatti)
      const middleJodi = `${result.openAnk}${result.closeAnk}`;
      return `${result.openPatti}-${middleJodi}-${result.closePatti}`;
    } else if (result.openPatti && result.openAnk && (!result.closePatti && !result.closeAnk)) {
      // Only open result available - show clean partial format
      return `${result.openPatti}-${result.openAnk}`;
    } else if (result.closePatti && result.closeAnk && (!result.openPatti && !result.openAnk)) {
      // Only close result available - show clean partial format
      return `${result.closeAnk}-${result.closePatti}`;
    }
    
    return "***-**-***"; // Pending result
  };

  const handleJodiClick = (gameName: string) => {
    console.log(`Jodi clicked for ${gameName}`);
  };

  const handlePanelClick = (gameName: string) => {
    console.log(`Panel clicked for ${gameName}`);
  };

  return (
    <section className="bg-matka-card rounded-lg shadow-md p-6">
      <h3 className="text-xl font-bold text-center text-gray-800 mb-6 border-b-2 border-red-600 pb-2">
        Live Matka Results
      </h3>
      
      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-gray-200 rounded-lg h-20"></div>
            ))}
          </div>
        ) : allGames.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-8 border border-gray-200 text-center">
            <p className="text-gray-500">अभी तक कोई Game Add नहीं हुई है</p>
            <p className="text-sm text-gray-400 mt-1">Admin जब games add करेगा तो यहाँ दिखेंगी</p>
          </div>
        ) : (
          allGames.map((game: GameResult, index: number) => (
            <div 
              key={game.id} 
              className={`border-2 rounded-lg p-4 hover:shadow-md transition-shadow ${
                game.highlighted 
                  ? 'bg-yellow-100 border-yellow-400' 
                  : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <Button 
                  onClick={() => handleJodiClick(game.gameName)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-semibold"
                >
                  Jodi
                </Button>
                <div className="flex-1 text-center">
                  <h4 className="font-bold text-lg text-gray-800">{game.gameName}</h4>
                  <div className="text-2xl font-bold text-red-600 mt-1">{formatResult(game)}</div>
                  <div className="text-sm text-gray-600 mt-1">({game.startTime} - {game.endTime})</div>

                </div>
                <Button 
                  onClick={() => handlePanelClick(game.gameName)}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-full text-sm font-semibold"
                >
                  Panel
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
