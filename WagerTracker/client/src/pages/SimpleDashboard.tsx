import { useState } from "react";
import { useLocation } from "wouter";
import { Menu, Home, Gamepad2, BarChart3, Phone, History, CreditCard, Gift, Settings, LogOut, Wallet, Play, Users, DollarSign } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import LiveResultsSection from "@/components/LiveResultsSection";

export default function SimpleDashboard() {
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [, setLocation] = useLocation();

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

  // Fetch user transactions (DISABLED to prevent infinite loop)
  const { data: userTransactions } = useQuery({
    queryKey: ["/api/user/transactions", user?.id],
    enabled: false, // DISABLED
    refetchInterval: false,
    staleTime: 5 * 60 * 1000,
  });

  const handleLogout = () => {
    logout();
    setIsSidebarOpen(false);
  };

  const handleNavigation = (path: string) => {
    window.scrollTo(0, 0);
    setLocation(path);
    setIsSidebarOpen(false);
  };

  const sidebarItems = [
    { icon: Home, label: "Home", href: "/" },
    { icon: Gamepad2, label: "Play Games", href: "/play-games" },
    { icon: BarChart3, label: "Game Results", href: "/game-results" },
    { icon: Phone, label: "Game Rates", href: "/game-rates" },
    { icon: History, label: "My Orders", href: "/my-orders" },
    { icon: CreditCard, label: "My Bid", href: "/my-bid" },
    { icon: Wallet, label: "My Wallet", href: "/my-wallet" },
    { icon: Gift, label: "How to Play", href: "/how-to-play" },
    { icon: Settings, label: "Settings", href: "/settings" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="px-4 py-3 flex items-center justify-between">
          {/* Left Side - Hamburger Menu */}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Right Side - Profile & Wallet */}
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

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed left-0 top-16 h-full bg-white shadow-lg border-r transition-transform duration-300 z-50 w-64 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <nav className="p-4 space-y-2">
          {sidebarItems.map((item) => (
            <button
              key={item.href}
              className="w-full flex items-center gap-3 text-gray-700 hover:text-gray-900 hover:bg-gray-100 p-3 rounded-lg text-left"
              onClick={() => handleNavigation(item.href)}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </button>
          ))}
          <button
            className="w-full flex items-center gap-3 text-red-600 hover:text-red-700 hover:bg-red-50 p-3 rounded-lg text-left mt-4"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <main className="p-4 md:p-6">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">👋</span>
            <h1 className="text-2xl font-bold text-gray-900">
              Hey {user?.name?.toUpperCase() || "USER"}
            </h1>
          </div>
          <p className="text-gray-600 text-sm">
            Welcome to the World's Biggest Matka Game Website
          </p>
          <p className="text-gray-500 text-xs mt-1">
            User ID: {currentUser?.unique_user_id || user?.unique_user_id}
          </p>
        </div>

        {/* Play Games Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <button 
            onClick={() => {
              window.scrollTo(0, 0);
              setLocation("/play-games");
            }}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 text-lg font-semibold rounded-lg mb-6"
          >
            <Play className="inline mr-2 h-5 w-5" />
            PLAY GAMES
          </button>

        </div>

        {/* Live Results Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Live Matka Results</h2>
          <LiveResultsSection />
        </div>

        {/* Telegram/WhatsApp Section */}
        <div className="bg-gradient-to-r from-blue-500 to-green-500 rounded-lg p-6 text-white text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="text-2xl">🎯</span>
            <h3 className="text-lg font-semibold">Join Our Community</h3>
          </div>
          <p className="mb-4">Join Telegram / WhatsApp group for tips & tricks</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button className="bg-white text-blue-600 hover:bg-gray-100 px-4 py-2 rounded-lg font-semibold">
              <Users className="inline mr-2 h-4 w-4" />
              Join Telegram
            </button>
            <button className="bg-white text-green-600 hover:bg-gray-100 px-4 py-2 rounded-lg font-semibold">
              <Users className="inline mr-2 h-4 w-4" />
              Join WhatsApp
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}