import { useState, useEffect } from "react";
import { ArrowLeft, History, Target, Trophy } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function MyOrders() {
  const { user } = useAuth();
  const [myBids, setMyBids] = useState<any[]>([]);

  // Load bids from localStorage
  useEffect(() => {
    const savedBids = localStorage.getItem('myBids');
    if (savedBids) {
      setMyBids(JSON.parse(savedBids));
    }
  }, []);

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

          <h1 className="text-lg font-semibold text-gray-900">My Orders</h1>

          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 md:p-6">
        <div className="max-w-md mx-auto">
          {/* Orders Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <History className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Betting Orders</h3>
                <p className="text-sm opacity-90">Your Game History</p>
              </div>
            </div>
            <div className="text-2xl font-bold">{myBids.length} Total Orders</div>
          </div>

          {/* Orders List */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Order History</h3>
              <span className="text-sm text-gray-600">{myBids.length} Orders</span>
            </div>
            
            {myBids.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="h-10 w-10 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No Orders Yet</h3>
                <p className="text-gray-600 mb-6">Start playing games to see your betting orders here.</p>
                <button 
                  onClick={() => window.location.href = '/play-games'}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700"
                >
                  <Trophy className="inline mr-2 h-4 w-4" />
                  Start Playing
                </button>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {myBids.map((bid) => (
                  <div key={bid.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:border-purple-300 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-800">{bid.typeName}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            bid.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            bid.status === 'won' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {bid.status}
                          </span>
                        </div>
                        {bid.gameName && (
                          <p className="text-sm text-gray-600 mb-1">Game: <span className="font-medium text-red-600">{bid.gameName}</span></p>
                        )}
                        <p className="text-sm text-gray-600">Numbers: <span className="font-medium">{bid.selection}</span></p>
                        <p className="text-sm text-gray-600">Rate: <span className="font-medium">1:{bid.rate?.split(':')[1] || 95}</span></p>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                      <div>
                        <p className="text-lg font-bold text-purple-600">₹{bid.amount}</p>
                        <p className="text-xs text-gray-500">Bet Amount</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-800">₹{bid.amount * (bid.rate || 95)}</p>
                        <p className="text-xs text-gray-500">Potential Win</p>
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-500">Order Date: {bid.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}