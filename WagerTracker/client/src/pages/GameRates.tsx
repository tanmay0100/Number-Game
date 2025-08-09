import { ArrowLeft, IndianRupee, TrendingUp, Wallet } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";

interface GameRate {
  id: string;
  name: string;
  bet: number;
  payout: number;
}

export default function GameRates() {
  const { user } = useAuth();
  
  // Fetch updated user data for wallet balance
  const { data: allUsers } = useQuery({
    queryKey: ["/api/admin/users"],
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 10000,
  });

  // Get current user with latest wallet balance
  const currentUser = allUsers?.find((u: any) => u.id === user?.id || u.email === user?.email);
  
  const gameRates: GameRate[] = [
    { id: "1", name: "SINGLE", bet: 10, payout: 95 },
    { id: "2", name: "JODI", bet: 10, payout: 900 },
    { id: "3", name: "SINGLE PANA", bet: 10, payout: 1400 },
    { id: "4", name: "DOUBLE PANA", bet: 10, payout: 2800 },
    { id: "5", name: "TRIPPLE PATTI", bet: 10, payout: 8000 },
    { id: "6", name: "HALF SANGAM", bet: 10, payout: 10000 },
    { id: "7", name: "FULL SANGAM", bet: 10, payout: 100000 }
  ];

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

          <h1 className="text-lg font-semibold text-gray-900">Game Rates</h1>

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
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold text-green-900">Current Game Rates</h3>
            </div>
            <p className="text-green-700 text-sm">
              View the latest betting rates and payout ratios for all games.
            </p>
          </div>

          {/* Game Rates List */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 border-b bg-gray-50">
              <h3 className="font-bold text-gray-900 text-lg">Game Rates & Payouts</h3>
            </div>
            <div className="p-4">
              <div className="space-y-3">
                {gameRates.map((rate) => (
                  <div key={rate.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                    <div className="font-semibold text-gray-800 text-lg">
                      {rate.name}
                    </div>
                    <div className="text-lg font-bold text-blue-600">
                      {rate.bet} ka {rate.payout}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Info */}
          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-semibold text-yellow-900 mb-2">Important Notes:</h4>
            <ul className="text-yellow-800 text-sm space-y-1">
              <li>• Minimum bet amount starts from ₹10</li>
              <li>• Rates are subject to change based on market conditions</li>
              <li>• Higher payouts mean lower probability of winning</li>
              <li>• Please play responsibly</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}