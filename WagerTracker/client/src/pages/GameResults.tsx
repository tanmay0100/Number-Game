import { ArrowLeft, Calendar, Clock, RefreshCw, Wallet } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import type { GameResult } from "@shared/schema";

export default function GameResults() {
  const { user } = useAuth();
  
  // Fetch live results from API (same as admin added games)
  const { data: liveResults = [], isLoading, refetch } = useQuery<GameResult[]>({
    queryKey: ["/api/live-results"],
    refetchInterval: 5000, // Auto-refresh every 5 seconds
    refetchOnWindowFocus: true,
  });

  // Fetch updated user data for wallet balance
  const { data: allUsers } = useQuery({
    queryKey: ["/api/admin/users"],
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 10000,
  });

  // Get current user with latest wallet balance
  const currentUser = allUsers?.find((u: any) => u.id === user?.id || u.email === user?.email);

  // Format result display logic - Show combined result only when complete
  const formatResult = (result: GameResult) => {
    // Check if result is complete (all four fields must be present)
    const isComplete = result.openPatti && result.openAnk && result.closePatti && result.closeAnk;
    
    if (isComplete) {
      // Full result: "555-52-444" (openPatti-openAnk+closeAnk-closePatti)
      const middleJodi = `${result.openAnk}${result.closeAnk}`;
      return `${result.openPatti}-${middleJodi}-${result.closePatti}`;
    } else if (result.openPatti && result.openAnk && (!result.closePatti && !result.closeAnk)) {
      // Only open result available
      return `${result.openPatti}-${result.openAnk}*-***`;
    } else if (result.closePatti && result.closeAnk && (!result.openPatti && !result.openAnk)) {
      // Only close result available  
      return `***-*${result.closeAnk}-${result.closePatti}`;
    }
    
    return "***-**-***"; // Pending result
  };

  const handleBackToDashboard = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="px-4 py-3 flex items-center justify-between">
          <button 
            onClick={handleBackToDashboard}
            className="p-2 hover:bg-gray-100 rounded-lg flex items-center gap-2"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm font-medium">Back</span>
          </button>

          <h1 className="text-lg font-semibold text-gray-900">Game Results</h1>

          <div className="flex items-center gap-4">
            {/* Wallet */}
            <div className="flex items-center gap-2 bg-green-50 px-3 py-2 rounded-lg">
              <Wallet className="h-4 w-4 text-green-600" />
              <span className="text-green-700 font-semibold">
                ₹{currentUser?.wallet_balance || '0.00'}
              </span>
            </div>
            
            {/* Profile */}
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          {/* Info Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-blue-900">Live Game Results</h3>
            </div>
            <p className="text-blue-700 text-sm">
              Latest results for all active games. Results are updated in real-time.
            </p>
          </div>

          {/* Refresh Button */}
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Live Game Results</h3>
            <button
              onClick={() => refetch()}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>

          {/* Game Results Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
              // Loading state
              Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="bg-white rounded-lg shadow-sm border animate-pulse">
                  <div className="p-4">
                    <div className="h-6 bg-gray-200 rounded mb-3"></div>
                    <div className="h-16 bg-gray-100 rounded"></div>
                  </div>
                </div>
              ))
            ) : liveResults.length === 0 ? (
              // Empty state
              <div className="col-span-full bg-gray-50 rounded-lg p-8 border border-gray-200 text-center">
                <p className="text-gray-500">कोई games अभी तक add नहीं हुई हैं</p>
                <p className="text-sm text-gray-400 mt-1">Admin panel से games add करने के बाद यहाँ results दिखेंगे</p>
              </div>
            ) : (
              liveResults.map((game) => (
                <div key={game.id} className={`rounded-lg shadow-sm border hover:shadow-md transition-shadow ${
                  game.highlighted ? 'bg-yellow-100 border-yellow-400' : 'bg-white border-gray-200'
                }`}>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-gray-900 text-lg">{game.gameName}</h3>
                      <div className="flex items-center gap-1 text-gray-500 text-sm">
                        <Clock className="h-4 w-4" />
                        {game.startTime} - {game.endTime}
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-red-600 tracking-wider">
                        {formatResult(game)}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {game.resultDate ? new Date(game.resultDate).toLocaleDateString('hi-IN') : "Today's Result"}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Info */}
          <div className="mt-8 text-center text-gray-500 text-sm">
            <p>Results are updated automatically from admin panel. Check back for the latest numbers.</p>
          </div>
        </div>
      </main>
    </div>
  );
}