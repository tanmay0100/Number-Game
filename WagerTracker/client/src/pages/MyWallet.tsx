import { useState } from "react";
import { ArrowLeft, Wallet, Plus, Minus, CreditCard, Banknote, History, AlertCircle, DollarSign } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";

export default function MyWallet() {
  const { user } = useAuth();
  const [amount, setAmount] = useState("");
  const [activeTab, setActiveTab] = useState<"add" | "withdraw">("add");
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Fetch current user data to get latest wallet balance
  const { data: currentUser } = useQuery({
    queryKey: ["/api/admin/users"],
    enabled: !!user?.id,
    refetchInterval: 5000, // Refresh every 5 seconds
    staleTime: 0,
    select: (data) => {
      // Find current user from all users data
      return data.find((u: any) => u.id === user?.id || u.email === user?.email);
    },
  });
  
  const walletBalance = currentUser?.wallet_balance ? parseFloat(currentUser.wallet_balance) : 0;

  // Fetch user transactions (DISABLED to prevent infinite loop)
  const { data: userTransactions, error: transactionError } = useQuery({
    queryKey: ["/api/user/transactions", user?.id],
    enabled: false, // DISABLED
    refetchInterval: false,
    staleTime: 5 * 60 * 1000,
  });
  
  // Remove debug logs
  // console.log('User transactions data:', userTransactions);
  // console.log('Transaction error:', transactionError);

  const handleBackToDashboard = () => {
    window.history.back();
  };

  const handleAddMoney = () => {
    if (!amount || Number(amount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }
    // In real app, this would make API call to add money
    setShowSuccess(true);
    setAmount("");
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleWithdraw = () => {
    if (!amount || Number(amount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }
    if (Number(amount) > walletBalance) {
      alert("Insufficient balance");
      return;
    }
    // In real app, this would make API call to withdraw money
    setShowSuccess(true);
    setAmount("");
    setTimeout(() => setShowSuccess(false), 3000);
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

          <h1 className="text-lg font-semibold text-gray-900">My Wallet</h1>

          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 md:p-6">
        <div className="max-w-md mx-auto">
          {/* Wallet Balance Card */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <Wallet className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Wallet Balance</h3>
                <p className="text-sm opacity-90">Available Amount</p>
              </div>
            </div>
            <div className="text-3xl font-bold">₹{walletBalance.toFixed(2)}</div>
          </div>

          {/* Success Message */}
          {showSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
                <span className="text-green-800 font-medium">
                  {activeTab === "add" ? "Money added successfully!" : "Withdrawal request submitted!"}
                </span>
              </div>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="bg-white rounded-lg shadow-sm mb-6">
            <div className="flex border-b">
              <button
                onClick={() => setActiveTab("add")}
                className={`flex-1 py-3 px-4 text-center font-medium ${
                  activeTab === "add"
                    ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Plus className="h-4 w-4 inline mr-2" />
                Add Money
              </button>
              <button
                onClick={() => setActiveTab("withdraw")}
                className={`flex-1 py-3 px-4 text-center font-medium ${
                  activeTab === "withdraw"
                    ? "text-red-600 border-b-2 border-red-600 bg-red-50"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Minus className="h-4 w-4 inline mr-2" />
                Withdraw
              </button>

            </div>

            <div className="p-6">
              {activeTab === "add" ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Enter Amount to Add
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min="1"
                      />
                    </div>
                  </div>

                  {/* Quick Amount Buttons */}
                  <div className="grid grid-cols-3 gap-2">
                    {[100, 500, 1000].map((quickAmount) => (
                      <button
                        key={quickAmount}
                        onClick={() => setAmount(quickAmount.toString())}
                        className="py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                      >
                        ₹{quickAmount}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleAddMoney}
                    className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 flex items-center justify-center gap-2"
                  >
                    <CreditCard className="h-5 w-5" />
                    Add Money
                  </button>

                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-blue-800 text-sm">
                      💳 Payment methods: UPI, Net Banking, Debit/Credit Cards
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Enter Amount to Withdraw
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        min="1"
                        max={walletBalance}
                      />
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                      <div className="text-yellow-800 text-sm">
                        <p className="font-medium mb-1">Withdrawal Policy:</p>
                        <ul className="space-y-1 text-xs">
                          <li>• Minimum withdrawal: ₹100</li>
                          <li>• Processing time: 24-48 hours</li>
                          <li>• Available balance: ₹{walletBalance.toFixed(2)}</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleWithdraw}
                    className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 flex items-center justify-center gap-2"
                  >
                    <Banknote className="h-5 w-5" />
                    Request Withdrawal
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Transaction History */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-4 border-b">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <History className="h-5 w-5" />
                Recent Transactions
              </h3>
            </div>
            <div className="p-4">
              {userTransactions && userTransactions.length > 0 ? (
                <div className="space-y-3">
                  {userTransactions.map((transaction: any) => (
                    <div key={transaction.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {transaction.type === 'deposit' ? 'Money Added by Admin' : 'Money Deducted by Admin'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(transaction.createdAt).toLocaleDateString('en-IN')} | {new Date(transaction.createdAt).toLocaleTimeString('en-IN')}
                        </div>
                        {transaction.reason && (
                          <div className="text-xs text-blue-600 mt-1">
                            Reason: {transaction.reason}
                          </div>
                        )}
                      </div>
                      <div className={`text-lg font-bold ${
                        transaction.type === 'deposit' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'deposit' ? '+' : '-'}₹{Math.abs(parseFloat(transaction.amount))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <History className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No transactions yet</p>
                  <p className="text-sm">Your transaction history will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}