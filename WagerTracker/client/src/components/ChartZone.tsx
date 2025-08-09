import { TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import type { GameResult } from "@shared/schema";

interface ChartGame {
  name: string;
  chartId: string;
}

export default function ChartZone() {
  const [, setLocation] = useLocation();
  const { data: games = [], isLoading } = useQuery<GameResult[]>({
    queryKey: ['/api/live-results'],
  });

  // Create chart games from actual game data
  const chartGames: ChartGame[] = games
    .filter((game, index, self) => 
      index === self.findIndex(g => g.gameName === game.gameName)
    )
    .map(game => ({
      name: `${game.gameName} Chart`,
      chartId: game.gameName.toLowerCase().replace(/\s+/g, '-')
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const handleChartClick = (chartId: string, chartName: string) => {
    console.log(`${chartName} clicked`);
    setLocation(`/chart/${chartId}`);
  };

  return (
    <section className="bg-matka-card rounded-lg shadow-md p-6">
      <h3 className="text-xl font-bold text-center text-gray-800 mb-6 border-b-2 border-red-600 pb-2">
        PANNA/CHART ZONE
      </h3>
      
      <div className="space-y-2">
        {isLoading ? (
          <div className="text-center text-gray-600">Loading charts...</div>
        ) : chartGames.length === 0 ? (
          <div className="text-center text-gray-600">No charts available</div>
        ) : (
          chartGames.map((chart, index) => (
            <Button
              key={index}
              onClick={() => handleChartClick(chart.chartId, chart.name)}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 p-3 rounded-lg text-left font-medium border-l-4 border-red-600 hover:border-red-500 transition-all duration-200 justify-start h-auto"
              variant="ghost"
            >
              <TrendingUp className="mr-3 text-red-600" size={16} />
              {chart.name}
            </Button>
          ))
        )}
      </div>
    </section>
  );
}
