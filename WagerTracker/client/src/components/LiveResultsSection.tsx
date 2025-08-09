import { useState, useEffect } from "react";
import { RefreshCw, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { GameResult } from "@shared/schema";

export default function LiveResultsSection() {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every 30 seconds for more responsive timing
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000); // Update every 30 seconds

    return () => clearInterval(timer);
  }, []);

  // Fetch live results from API - Only fetch when needed, not continuously
  const { data: allResults = [], isLoading } = useQuery<GameResult[]>({
    queryKey: ["/api/live-results"],
    refetchOnWindowFocus: true, // Only refetch when user returns to page
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });

  // Function to parse time string (e.g., "11:45 AM") to today's Date object
  const parseTime = (timeStr: string): Date => {
    const today = new Date();
    const [time, period] = timeStr.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    
    let hour24 = hours;
    if (period === 'PM' && hours !== 12) hour24 += 12;
    if (period === 'AM' && hours === 12) hour24 = 0;
    
    const resultDate = new Date(today);
    resultDate.setHours(hour24, minutes, 0, 0);
    
    return resultDate;
  };

  // Function to check if game should be visible based on timing
  const shouldShowGame = (game: GameResult): boolean => {
    const startTime = parseTime(game.startTime);
    const endTime = parseTime(game.endTime);
    
    // Show 15 minutes before start time
    const showStartTime = new Date(startTime.getTime() - 15 * 60 * 1000);
    
    // Hide 30 minutes after end time  
    const hideEndTime = new Date(endTime.getTime() + 30 * 60 * 1000);
    
    return currentTime >= showStartTime && currentTime <= hideEndTime;
  };

  // Function to get time remaining for upcoming games
  const getTimeRemaining = (game: GameResult): string => {
    const startTime = parseTime(game.startTime);
    const timeDiff = startTime.getTime() - currentTime.getTime();
    
    if (timeDiff <= 0) return "Started";
    
    const minutes = Math.floor(timeDiff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m बाकी`;
    } else {
      return `${remainingMinutes}m बाकी`;
    }
  };

  // Filter games that should be currently visible - strict timing
  const visibleResults = allResults.filter(shouldShowGame);

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

  // Get game status (upcoming, live, completed)
  const getGameStatus = (game: GameResult): string => {
    const startTime = parseTime(game.startTime);
    const endTime = parseTime(game.endTime);
    
    if (currentTime < startTime) {
      return "UPCOMING";
    } else if (currentTime >= startTime && currentTime <= endTime) {
      return "LIVE";
    } else {
      return "COMPLETED";
    }
  };

  // Get detailed status with visibility timing info
  const getDetailedStatus = (game: GameResult): { status: string; message: string; color: string } => {
    const startTime = parseTime(game.startTime);
    const endTime = parseTime(game.endTime);
    const showStartTime = new Date(startTime.getTime() - 15 * 60 * 1000);
    const hideEndTime = new Date(endTime.getTime() + 30 * 60 * 1000);
    
    if (currentTime < showStartTime) {
      // Game not yet visible
      const minutesUntilShow = Math.floor((showStartTime.getTime() - currentTime.getTime()) / (1000 * 60));
      return {
        status: "HIDDEN",
        message: `${minutesUntilShow} minutes में दिखेगा`,
        color: "bg-gray-100 text-gray-600"
      };
    } else if (currentTime >= showStartTime && currentTime < startTime) {
      // Show before game starts
      const minutesUntilStart = Math.floor((startTime.getTime() - currentTime.getTime()) / (1000 * 60));
      return {
        status: "UPCOMING",
        message: `${minutesUntilStart} minutes में शुरू`,
        color: "bg-blue-100 text-blue-800"
      };
    } else if (currentTime >= startTime && currentTime <= endTime) {
      // Game is live
      return {
        status: "LIVE",
        message: "🔴 LIVE चल रहा है",
        color: "bg-green-100 text-green-800 animate-pulse"
      };
    } else if (currentTime > endTime && currentTime <= hideEndTime) {
      // Game completed but still visible
      const minutesUntilHide = Math.floor((hideEndTime.getTime() - currentTime.getTime()) / (1000 * 60));
      return {
        status: "COMPLETED",
        message: `${minutesUntilHide} minutes और दिखेगा`,
        color: "bg-gray-100 text-gray-800"
      };
    } else {
      // Game should be hidden
      return {
        status: "HIDDEN",
        message: "अब छुप गया है",
        color: "bg-gray-100 text-gray-600"
      };
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["/api/live-results"] });
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  return (
    <section className="bg-matka-card rounded-lg shadow-md p-6">
      <h3 className="text-xl font-bold text-center text-gray-800 mb-4 border-b-2 border-red-600 pb-2">
        <Radio className="inline mr-2 text-red-600" size={20} />
        Live Update
        <span className="ml-2 inline-flex items-center gap-1">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
          <span className="text-red-600 text-sm font-bold animate-pulse">LIVE</span>
        </span>
      </h3>
      
      <div className="space-y-3 mb-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-gray-200 rounded-lg h-16"></div>
            ))}
          </div>
        ) : visibleResults.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-8 border border-gray-200 text-center">
            <p className="text-gray-500">इस समय कोई लाइव गेम नहीं है</p>
            <p className="text-sm text-gray-400 mt-1">अगली गेम का समय आने पर यहाँ दिखेगी</p>
            <p className="text-xs text-gray-400 mt-2">Current Time: {currentTime.toLocaleTimeString('hi-IN')}</p>
            

          </div>
        ) : (
          visibleResults.map((result: GameResult) => {
            const detailedStatus = getDetailedStatus(result);
            
            return (
              <div key={result.id} className={`rounded-lg p-4 border-2 shadow-sm ${
                result.highlighted 
                  ? 'bg-yellow-100 border-yellow-400' 
                  : 'bg-white border-gray-200'
              }`}>
                <div className="text-center">
                  <div className="mb-3">
                    <h4 className="font-bold text-gray-800 text-lg">{result.gameName}</h4>
                  </div>
                  
                  <div className="text-2xl font-bold text-red-600 mb-2">{formatResult(result)}</div>


                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="text-center">
        <Button 
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 font-semibold"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh Results
        </Button>
      </div>
    </section>
  );
}
