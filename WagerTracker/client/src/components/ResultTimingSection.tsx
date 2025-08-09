import { Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { GameResult } from "@shared/schema";

interface GameTiming {
  name: string;
  timing: string;
}

export default function ResultTimingSection() {
  // Fetch live results from API to get all added games
  const { data: liveResults = [], isLoading } = useQuery<GameResult[]>({
    queryKey: ["/api/live-results"],
    refetchInterval: 30000, // Refresh every 30 seconds
    refetchOnWindowFocus: true,
  });

  // Convert game results to timing format
  const gameTimings: GameTiming[] = liveResults.map((game) => ({
    name: game.gameName,
    timing: `${game.startTime} - ${game.endTime}`
  }));

  if (isLoading) {
    return (
      <section className="bg-matka-card rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold text-center text-gray-800 mb-4">
          <Clock className="inline mr-2 text-orange-500" size={20} />
          Result Timing Information
        </h3>
        <div className="space-y-3">
          <div className="bg-gray-50 p-3 rounded animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
          <div className="bg-gray-50 p-3 rounded animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-matka-card rounded-lg shadow-md p-6">
      <h3 className="text-lg font-bold text-center text-gray-800 mb-4">
        <Clock className="inline mr-2 text-orange-500" size={20} />
        Result Timing Information
      </h3>
      <div className="space-y-3">
        {gameTimings.length > 0 ? (
          gameTimings.map((game, index) => (
            <div key={index} className="bg-gray-50 p-3 rounded flex justify-between items-center">
              <div className="font-semibold text-gray-700">{game.name}</div>
              <div className="text-gray-600 font-medium">{game.timing}</div>
            </div>
          ))
        ) : (
          <div className="text-center text-gray-500 py-4">
            No games available
          </div>
        )}
      </div>
    </section>
  );
}
