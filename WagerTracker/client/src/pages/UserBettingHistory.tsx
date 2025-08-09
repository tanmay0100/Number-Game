import { useState, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, Filter, User, Wallet, TrendingUp, Clock, ArrowLeft, Settings, Target, DollarSign, Percent } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UserBettingHistoryProps {
  userId: number;
  onBack: () => void;
}

export default function UserBettingHistory({ userId, onBack }: UserBettingHistoryProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State management with stable initialization
  const [selectedCategory, setSelectedCategory] = useState<string>("SattaMatka");
  const [selectedSubGame, setSelectedSubGame] = useState<string>("");
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Date filtering - Default to today
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState<string>(today);
  const [endDate, setEndDate] = useState<string>(today);

  // Fetch user details with complete profile and betting stats
  const { data: userDetails, isLoading: userLoading } = useQuery({
    queryKey: [`/api/admin/user-details/${userId}`],
    queryFn: () => fetch(`/api/admin/user-details/${userId}`).then(res => res.json()),
    staleTime: 2 * 60 * 1000, // Fresh for 2 minutes
    refetchOnWindowFocus: true
  });

  // Fetch user game statistics
  const { data: gameStats, isLoading: gameStatsLoading } = useQuery({
    queryKey: [`/api/admin/user-game-stats/${userId}`],
    queryFn: () => fetch(`/api/admin/user-game-stats/${userId}`).then(res => res.json()),
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: true
  });

  // Fetch betting history for selected game and date range
  const { data: bettingHistory, isLoading: historyLoading } = useQuery({
    queryKey: [`/api/admin/user-betting-history/${userId}`, showAllHistory ? 'all' : selectedSubGame, startDate, endDate],
    queryFn: () => {
      const params = new URLSearchParams({
        ...(showAllHistory ? {} : { gameName: selectedSubGame }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate })
      });
      return fetch(`/api/admin/user-betting-history/${userId}?${params}`).then(res => res.json());
    },
    staleTime: 30 * 1000, // Fresh for 30 seconds
    refetchOnWindowFocus: true,
    enabled: showAllHistory || !!selectedSubGame
  });

  // Date filter helper functions
  const setQuickDateFilter = (filterType: string) => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    switch (filterType) {
      case 'today':
        setStartDate(todayStr);
        setEndDate(todayStr);
        break;
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        setStartDate(yesterdayStr);
        setEndDate(yesterdayStr);
        break;
      case 'last7days':
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weekAgoStr = weekAgo.toISOString().split('T')[0];
        setStartDate(weekAgoStr);
        setEndDate(todayStr);
        break;
      case 'alltime':
        setStartDate('');
        setEndDate('');
        break;
    }
    setShowFilterModal(false);
  };

  // Get current date display text
  const getCurrentDateDisplay = () => {
    if (!startDate && !endDate) return "All Time";
    if (startDate === endDate) return startDate;
    if (startDate && endDate) return `${startDate} to ${endDate}`;
    return startDate || endDate;
  };

  // Check if filter button should be highlighted
  const isFilterActive = (filterType: string) => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    switch (filterType) {
      case 'today':
        return startDate === today && endDate === today;
      case 'yesterday':
        return startDate === yesterdayStr && endDate === yesterdayStr;
      case 'last7days':
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weekAgoStr = weekAgo.toISOString().split('T')[0];
        return startDate === weekAgoStr && endDate === today;
      case 'alltime':
        return !startDate && !endDate;
      default:
        return false;
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  // Format date and time for IST
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    // Convert to IST by adding 5.5 hours to UTC
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(date.getTime() + istOffset);
    
    const formattedDate = istDate.toLocaleDateString('en-IN');
    const formattedTime = istDate.toLocaleTimeString('en-IN', { 
      hour12: true, 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
    
    return { date: formattedDate, time: formattedTime };
  };

  // Game categories and sub-games data
  const gameCategories = [
    {
      name: "SattaMatka",
      icon: "🎲",
      color: "slate",
      subGames: gameStats?.filter((game: any) => 
        game.gameName.includes("KALYAN") || 
        game.gameName.includes("MUMBAI") || 
        game.gameName.includes("MILAN") || 
        game.gameName.includes("TEST SYSTEM") ||
        game.gameName.includes("RAJDHANI")
      ) || []
    },
    {
      name: "ColorKing",
      icon: "🌈",
      color: "gray",
      subGames: [
        { gameName: "Color King Classic", totalBets: 5, totalAmount: 250 },
        { gameName: "Color King Pro", totalBets: 3, totalAmount: 150 }
      ]
    },
    {
      name: "DiceGame",
      icon: "🎯",
      color: "zinc", 
      subGames: [
        { gameName: "Dice Roll Master", totalBets: 2, totalAmount: 100 },
        { gameName: "Lucky Dice", totalBets: 4, totalAmount: 200 }
      ]
    }
  ];

  // Memoized category handling to prevent flicker
  const currentCategoryData = useMemo(() => {
    return gameCategories.find(cat => cat.name === selectedCategory);
  }, [selectedCategory, gameStats]);

  // Initialize first sub-game only when category truly changes
  useEffect(() => {
    if (currentCategoryData && currentCategoryData.subGames.length > 0) {
      const belongsToCategory = selectedSubGame && currentCategoryData.subGames.some((game: any) => game.gameName === selectedSubGame);
      if (!belongsToCategory) {
        // Use timeout to prevent flicker during state transitions
        const timer = setTimeout(() => {
          setSelectedSubGame(currentCategoryData.subGames[0].gameName);
        }, 0);
        return () => clearTimeout(timer);
      }
    }
  }, [selectedCategory]); // Only depend on selectedCategory

  const selectedGameStats = useMemo(() => {
    return gameStats?.find((game: any) => game.gameName === selectedSubGame) || 
      currentCategoryData?.subGames.find((game: any) => game.gameName === selectedSubGame);
  }, [gameStats, selectedSubGame, currentCategoryData]);

  if (userLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!userDetails) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">User not found</p>
        <Button onClick={onBack} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Users
        </Button>
      </div>
    );
  }

  return (
    <div style={{ 
      background: 'linear-gradient(135deg, rgb(248, 250, 252) 0%, rgba(219, 234, 254, 0.3) 100%)',
      minHeight: '100vh',
      padding: '24px'
    }}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              onClick={onBack}
              className="flex items-center space-x-2 bg-white hover:bg-gray-50 shadow-md"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Users</span>
            </Button>
            <div>
              <h1 style={{
                fontSize: '32px',
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, rgb(59, 130, 246) 0%, rgb(147, 51, 234) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                marginBottom: '8px'
              }}>
                User Betting History
              </h1>
              <p className="text-gray-600 text-lg">Complete betting activity and statistics</p>
            </div>
          </div>
        </div>

        {/* User Information Card */}
        <Card className="border-0 shadow-xl" style={{
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(219, 234, 254, 0.5)'
        }}>
          <CardHeader style={{
            background: 'linear-gradient(135deg, rgb(59, 130, 246) 0%, rgb(147, 51, 234) 100%)',
            borderRadius: '12px 12px 0 0',
            padding: '20px'
          }}>
            <CardTitle className="flex items-center space-x-2 text-white">
              <User className="h-5 w-5 text-white" />
              <span className="text-lg font-bold">User Profile</span>
            </CardTitle>
          </CardHeader>
          <CardContent style={{ padding: '24px' }}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="font-semibold">Name:</span>
                <span>{userDetails.name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold">Mobile:</span>
                <span>{userDetails.mobile || 'N/A'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold">User ID:</span>
                <Badge variant="secondary">{userDetails.uniqueUserId}</Badge>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Wallet className="h-4 w-4 text-green-600" />
                <span className="font-semibold">Wallet Balance:</span>
                <span className="text-green-600 font-bold">
                  {formatCurrency(parseFloat(userDetails.walletBalance || '0'))}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold">Status:</span>
                <Badge variant={userDetails.isActive ? "default" : "destructive"}>
                  {userDetails.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <span className="font-semibold">Total Bets:</span>
                <span>{userDetails.totalBets || 0}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold">Total Amount:</span>
                <span className="font-bold">
                  {formatCurrency(parseFloat(userDetails.totalBetAmount || '0'))}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold">Games Played:</span>
                <span>{userDetails.gamesPlayed || 0}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

        {/* Game Categories (Rounded Buttons) */}
        <div>
          <h2 className="text-xl font-semibold mb-6 text-gray-800">Game Categories</h2>
          <div className="flex flex-wrap gap-4 mb-8">
            {gameCategories.map((category) => (
              <Button 
                key={category.name}
                onClick={() => {
                  if (selectedCategory !== category.name && !isTransitioning) {
                    setIsTransitioning(true);
                    setSelectedCategory(category.name);
                    setSelectedSubGame("");
                    setShowAllHistory(false);
                    // Clear transition state after brief delay
                    setTimeout(() => setIsTransitioning(false), 100);
                  }
                }}
                style={{
                  background: selectedCategory === category.name
                    ? category.name === 'SattaMatka' 
                      ? 'linear-gradient(to right, rgb(37, 99, 235), rgb(29, 78, 216))'
                      : category.name === 'ColorKing'
                      ? 'linear-gradient(to right, rgb(147, 51, 234), rgb(126, 34, 206))'
                      : 'linear-gradient(to right, rgb(34, 197, 94), rgb(22, 163, 74))'
                    : 'rgb(255, 255, 255)',
                  color: selectedCategory === category.name ? 'white' : 'rgb(55, 65, 81)',
                  border: selectedCategory === category.name ? 'none' : '2px solid rgb(229, 231, 235)',
                  boxShadow: selectedCategory === category.name ? '0 10px 15px -3px rgba(0, 0, 0, 0.1)' : 'none',
                  transition: 'all 0.2s ease-in-out'
                }}
                className="px-6 py-3 rounded-full text-lg font-semibold hover:opacity-90"
              >
                <span className="mr-2">{category.icon}</span>
                {category.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Sub-Games Cards */}
        {selectedCategory && !isTransitioning && (
          <div key={`${selectedCategory}-games`} 
               style={{ 
                 opacity: isTransitioning ? 0 : 1, 
                 transition: 'opacity 0.15s ease-in-out' 
               }}>
            <h3 className="text-lg font-semibold mb-4 text-gray-800">
              {selectedCategory} Games
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {currentCategoryData?.subGames.map((game: any) => (
                <Card 
                  key={`${game.gameName}-${selectedCategory}`}
                  className="cursor-pointer border-0 shadow-md h-20 hover:shadow-lg hover:scale-105"
                  style={{
                    background: selectedSubGame === game.gameName 
                      ? selectedCategory === 'SattaMatka'
                        ? 'linear-gradient(135deg, rgb(219, 234, 254) 0%, rgb(191, 219, 254) 100%)'
                        : selectedCategory === 'ColorKing'
                        ? 'linear-gradient(135deg, rgb(243, 232, 255) 0%, rgb(233, 213, 255) 100%)'
                        : 'linear-gradient(135deg, rgb(220, 252, 231) 0%, rgb(187, 247, 208) 100%)'
                      : 'linear-gradient(135deg, rgb(248, 250, 252) 0%, rgb(241, 245, 249) 100%)',
                    border: selectedSubGame === game.gameName 
                      ? selectedCategory === 'SattaMatka'
                        ? '2px solid rgb(37, 99, 235)'
                        : selectedCategory === 'ColorKing'
                        ? '2px solid rgb(147, 51, 234)'
                        : '2px solid rgb(34, 197, 94)'
                      : '2px solid rgb(203, 213, 225)',
                    transition: 'all 0.2s ease-in-out'
                  }}
                  onClick={() => {
                    setSelectedSubGame(game.gameName);
                    setShowAllHistory(false);
                  }}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <h4 className={`font-bold text-sm ${
                        selectedSubGame === game.gameName 
                          ? 'text-slate-800'
                          : 'text-gray-800'
                      }`}>
                        {game.gameName}
                      </h4>
                      {selectedSubGame === game.gameName && (
                        <Badge className="bg-white text-slate-600 font-semibold text-xs">Selected</Badge>
                      )}
                    </div>
                    <div className={`text-xs mt-1 ${
                      selectedSubGame === game.gameName 
                        ? 'text-slate-700'
                        : 'text-gray-600'
                    }`}>
                      <div className="flex justify-between">
                        <span>Bets: {game.totalBets}</span>
                        <span>Amount: {formatCurrency(parseFloat(game.totalAmount || '0'))}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* All History Toggle Button */}
            <div className="mb-6">
              <Button 
                onClick={() => setShowAllHistory(!showAllHistory)}
                variant={showAllHistory ? "default" : "outline"}
                style={{
                  background: showAllHistory 
                    ? selectedCategory === 'SattaMatka'
                      ? 'linear-gradient(to right, rgb(37, 99, 235), rgb(29, 78, 216))'
                      : selectedCategory === 'ColorKing'
                      ? 'linear-gradient(to right, rgb(147, 51, 234), rgb(126, 34, 206))'
                      : 'linear-gradient(to right, rgb(34, 197, 94), rgb(22, 163, 74))'
                    : 'white',
                  color: showAllHistory ? 'white' : 
                    selectedCategory === 'SattaMatka' ? 'rgb(37, 99, 235)' :
                    selectedCategory === 'ColorKing' ? 'rgb(147, 51, 234)' : 'rgb(34, 197, 94)',
                  border: showAllHistory ? 'none' : 
                    selectedCategory === 'SattaMatka' ? '2px solid rgb(37, 99, 235)' :
                    selectedCategory === 'ColorKing' ? '2px solid rgb(147, 51, 234)' : '2px solid rgb(34, 197, 94)'
                }}
                className="px-6 py-2 hover:opacity-90 transition-all duration-200"
              >
                {showAllHistory ? '📊 Showing All History' : '📈 View All History'}
              </Button>
            </div>

            {/* Quick Stats Cards for Selected Game */}
            {selectedCategory && selectedSubGame && !showAllHistory && selectedGameStats && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card className="border-0 shadow-md" style={{
                  background: selectedCategory === 'SattaMatka'
                    ? 'linear-gradient(135deg, rgb(219, 234, 254) 0%, rgb(191, 219, 254) 100%)'
                    : selectedCategory === 'ColorKing'
                    ? 'linear-gradient(135deg, rgb(243, 232, 255) 0%, rgb(233, 213, 255) 100%)'
                    : 'linear-gradient(135deg, rgb(220, 252, 231) 0%, rgb(187, 247, 208) 100%)'
                }}>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Target className={`h-5 w-5 ${
                        selectedCategory === 'SattaMatka' ? 'text-blue-700' :
                        selectedCategory === 'ColorKing' ? 'text-purple-700' : 'text-green-700'
                      }`} />
                      <div>
                        <p className={`text-sm ${
                          selectedCategory === 'SattaMatka' ? 'text-blue-600' :
                          selectedCategory === 'ColorKing' ? 'text-purple-600' : 'text-green-600'
                        }`}>Total Bets</p>
                        <p className={`text-xl font-bold ${
                          selectedCategory === 'SattaMatka' ? 'text-blue-800' :
                          selectedCategory === 'ColorKing' ? 'text-purple-800' : 'text-green-800'
                        }`}>{selectedGameStats.totalBets}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-md" style={{
                  background: selectedCategory === 'SattaMatka'
                    ? 'linear-gradient(135deg, rgb(219, 234, 254) 0%, rgb(191, 219, 254) 100%)'
                    : selectedCategory === 'ColorKing'
                    ? 'linear-gradient(135deg, rgb(243, 232, 255) 0%, rgb(233, 213, 255) 100%)'
                    : 'linear-gradient(135deg, rgb(220, 252, 231) 0%, rgb(187, 247, 208) 100%)'
                }}>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <DollarSign className={`h-5 w-5 ${
                        selectedCategory === 'SattaMatka' ? 'text-blue-700' :
                        selectedCategory === 'ColorKing' ? 'text-purple-700' : 'text-green-700'
                      }`} />
                      <div>
                        <p className={`text-sm ${
                          selectedCategory === 'SattaMatka' ? 'text-blue-600' :
                          selectedCategory === 'ColorKing' ? 'text-purple-600' : 'text-green-600'
                        }`}>Total Amount</p>
                        <p className={`text-xl font-bold ${
                          selectedCategory === 'SattaMatka' ? 'text-blue-800' :
                          selectedCategory === 'ColorKing' ? 'text-purple-800' : 'text-green-800'
                        }`}>
                          {formatCurrency(parseFloat(selectedGameStats.totalAmount || '0'))}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-md" style={{
                  background: selectedCategory === 'SattaMatka'
                    ? 'linear-gradient(135deg, rgb(219, 234, 254) 0%, rgb(191, 219, 254) 100%)'
                    : selectedCategory === 'ColorKing'
                    ? 'linear-gradient(135deg, rgb(243, 232, 255) 0%, rgb(233, 213, 255) 100%)'
                    : 'linear-gradient(135deg, rgb(220, 252, 231) 0%, rgb(187, 247, 208) 100%)'
                }}>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Percent className={`h-5 w-5 ${
                        selectedCategory === 'SattaMatka' ? 'text-blue-700' :
                        selectedCategory === 'ColorKing' ? 'text-purple-700' : 'text-green-700'
                      }`} />
                      <div>
                        <p className={`text-sm ${
                          selectedCategory === 'SattaMatka' ? 'text-blue-600' :
                          selectedCategory === 'ColorKing' ? 'text-purple-600' : 'text-green-600'
                        }`}>Avg Bet</p>
                        <p className={`text-xl font-bold ${
                          selectedCategory === 'SattaMatka' ? 'text-blue-800' :
                          selectedCategory === 'ColorKing' ? 'text-purple-800' : 'text-green-800'
                        }`}>
                          {selectedGameStats.totalBets > 0 
                            ? formatCurrency(Math.round(parseFloat(selectedGameStats.totalAmount || '0') / selectedGameStats.totalBets))
                            : '₹0'
                          }
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}

        {/* Betting History Section */}
        <Card className="border-0 shadow-xl" style={{
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(219, 234, 254, 0.5)'
        }}>
          <CardHeader style={{
            background: selectedCategory === 'SattaMatka'
              ? 'linear-gradient(135deg, rgb(37, 99, 235) 0%, rgb(29, 78, 216) 100%)'
              : selectedCategory === 'ColorKing'
              ? 'linear-gradient(135deg, rgb(147, 51, 234) 0%, rgb(126, 34, 206) 100%)'
              : 'linear-gradient(135deg, rgb(34, 197, 94) 0%, rgb(22, 163, 74) 100%)',
            borderRadius: '12px 12px 0 0',
            padding: '20px'
          }}>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2 text-white">
                <Clock className="h-5 w-5 text-white" />
                <span className="text-lg font-bold">
                  {showAllHistory ? 'All Games' : selectedSubGame || selectedCategory} Betting History
                </span>
              </CardTitle>
            
              {/* Date Filter */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-white font-medium">
                  📅 {getCurrentDateDisplay()}
                </span>
                <Dialog open={showFilterModal} onOpenChange={setShowFilterModal}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" 
                      style={{
                        backgroundColor: 'white',
                        color: selectedCategory === 'SattaMatka' ? 'rgb(37, 99, 235)' :
                               selectedCategory === 'ColorKing' ? 'rgb(147, 51, 234)' : 'rgb(34, 197, 94)',
                        borderColor: 'white'
                      }}
                      className="hover:opacity-80"
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      Filter
                    </Button>
                  </DialogTrigger>
                <DialogContent className="sm:max-w-md border-0 shadow-xl" style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(15px)',
                  WebkitBackdropFilter: 'blur(15px)',
                  border: '1px solid rgba(219, 234, 254, 0.5)',
                  borderRadius: '16px'
                }}>
                  <DialogHeader style={{
                    background: 'linear-gradient(135deg, rgb(34, 197, 94) 0%, rgb(16, 185, 129) 100%)',
                    borderRadius: '16px 16px 0 0',
                    padding: '20px',
                    margin: '-24px -24px 20px -24px'
                  }}>
                    <DialogTitle className="text-white font-bold text-lg flex items-center">
                      🗓️ Date Range Filter
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6" style={{ padding: '0 4px' }}>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant={isFilterActive('today') ? "default" : "outline"}
                        onClick={() => setQuickDateFilter('today')}
                        className="w-full transition-all duration-200"
                        style={{
                          background: isFilterActive('today') 
                            ? 'linear-gradient(135deg, rgb(59, 130, 246) 0%, rgb(147, 51, 234) 100%)'
                            : 'linear-gradient(135deg, rgba(219, 234, 254, 0.5) 0%, rgba(191, 219, 254, 0.5) 100%)',
                          color: isFilterActive('today') ? 'white' : 'rgb(59, 130, 246)',
                          border: isFilterActive('today') 
                            ? '2px solid rgb(59, 130, 246)' 
                            : '2px solid rgb(147, 197, 253)',
                          fontWeight: '600'
                        }}
                      >
                        Today
                      </Button>
                      <Button
                        variant={isFilterActive('yesterday') ? "default" : "outline"}
                        onClick={() => setQuickDateFilter('yesterday')}
                        className="w-full transition-all duration-200"
                        style={{
                          background: isFilterActive('yesterday') 
                            ? 'linear-gradient(135deg, rgb(59, 130, 246) 0%, rgb(147, 51, 234) 100%)'
                            : 'linear-gradient(135deg, rgba(219, 234, 254, 0.5) 0%, rgba(191, 219, 254, 0.5) 100%)',
                          color: isFilterActive('yesterday') ? 'white' : 'rgb(59, 130, 246)',
                          border: isFilterActive('yesterday') 
                            ? '2px solid rgb(59, 130, 246)' 
                            : '2px solid rgb(147, 197, 253)',
                          fontWeight: '600'
                        }}
                      >
                        Yesterday
                      </Button>
                      <Button
                        variant={isFilterActive('last7days') ? "default" : "outline"}
                        onClick={() => setQuickDateFilter('last7days')}
                        className="w-full transition-all duration-200"
                        style={{
                          background: isFilterActive('last7days') 
                            ? 'linear-gradient(135deg, rgb(59, 130, 246) 0%, rgb(147, 51, 234) 100%)'
                            : 'linear-gradient(135deg, rgba(219, 234, 254, 0.5) 0%, rgba(191, 219, 254, 0.5) 100%)',
                          color: isFilterActive('last7days') ? 'white' : 'rgb(59, 130, 246)',
                          border: isFilterActive('last7days') 
                            ? '2px solid rgb(59, 130, 246)' 
                            : '2px solid rgb(147, 197, 253)',
                          fontWeight: '600'
                        }}
                      >
                        Last 7 Days
                      </Button>
                      <Button
                        variant={isFilterActive('alltime') ? "default" : "outline"}
                        onClick={() => setQuickDateFilter('alltime')}
                        className="w-full transition-all duration-200"
                        style={{
                          background: isFilterActive('alltime') 
                            ? 'linear-gradient(135deg, rgb(59, 130, 246) 0%, rgb(147, 51, 234) 100%)'
                            : 'linear-gradient(135deg, rgba(219, 234, 254, 0.5) 0%, rgba(191, 219, 254, 0.5) 100%)',
                          color: isFilterActive('alltime') ? 'white' : 'rgb(59, 130, 246)',
                          border: isFilterActive('alltime') 
                            ? '2px solid rgb(59, 130, 246)' 
                            : '2px solid rgb(147, 197, 253)',
                          fontWeight: '600'
                        }}
                      >
                        All Time
                      </Button>
                    </div>
                    
                    <Separator style={{ backgroundColor: 'rgba(219, 234, 254, 0.5)' }} />
                    
                    <div className="space-y-4">
                      <label className="text-sm font-semibold text-gray-800">📅 Custom Date Range</label>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium text-gray-600 mb-1 block">Start Date</label>
                          <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full p-3 border-2 rounded-lg text-sm transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            style={{
                              border: '2px solid rgb(147, 197, 253)',
                              backgroundColor: 'rgba(249, 250, 251, 0.8)'
                            }}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-600 mb-1 block">End Date</label>
                          <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full p-3 border-2 rounded-lg text-sm transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            style={{
                              border: '2px solid rgb(147, 197, 253)',
                              backgroundColor: 'rgba(249, 250, 251, 0.8)'
                            }}
                          />
                        </div>
                      </div>
                      <Button
                        onClick={() => setShowFilterModal(false)}
                        className="w-full mt-4 font-semibold py-3 transition-all duration-200 hover:shadow-lg"
                        style={{
                          background: 'linear-gradient(135deg, rgb(34, 197, 94) 0%, rgb(16, 185, 129) 100%)',
                          color: 'white',
                          border: 'none'
                        }}
                      >
                        ✅ Apply Custom Filter
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          </CardHeader>
          <CardContent style={{ padding: '24px' }}>
          {historyLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2">Loading betting history...</span>
            </div>
          ) : bettingHistory && bettingHistory.length > 0 ? (
            <div className="space-y-4">
              {/* Summary Stats */}
              {selectedGameStats && (
                <div className="bg-gray-50 p-4 rounded-lg grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{selectedGameStats.totalBets}</div>
                    <div className="text-sm text-gray-600">Total Bets</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(parseFloat(selectedGameStats.totalAmount || '0'))}
                    </div>
                    <div className="text-sm text-gray-600">Total Amount</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{selectedGameStats.activeDays}</div>
                    <div className="text-sm text-gray-600">Active Days</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-orange-600">
                      {formatCurrency(parseFloat(selectedGameStats.totalAmount || '0') / parseInt(selectedGameStats.totalBets || '1'))}
                    </div>
                    <div className="text-sm text-gray-600">Avg Bet</div>
                  </div>
                </div>
              )}

              {/* Betting History List */}
              <div className="space-y-3">
                {bettingHistory.map((bet: any) => {
                  const { date, time } = formatDateTime(bet.createdAt);
                  return (
                    <Card key={bet.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <Badge variant="secondary">{bet.betType || 'N/A'}</Badge>
                              <span className="font-medium">Number: {bet.betNumber || 'N/A'}</span>
                              <Badge 
                                variant={bet.status === 'completed' ? 'default' : 'destructive'}
                                className={bet.status === 'completed' ? 'bg-green-600' : ''}
                              >
                                {bet.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">{bet.description}</p>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-lg font-bold text-red-600">
                              -{formatCurrency(parseFloat(bet.amount || '0'))}
                            </div>
                            <div className="text-xs text-gray-500">
                              {date} at {time}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Calendar className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Betting History</h3>
              <p className="text-gray-500">
                No bets found for {showAllHistory ? 'any game' : selectedSubGame || selectedCategory} in the selected date range.
              </p>
            </div>
          )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}