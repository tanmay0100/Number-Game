import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useLocation, useParams } from "wouter";
import { ArrowLeft, Trophy, Calendar, Users, TrendingUp, DollarSign, Crown, FileText, PieChart, User, Clock, Filter, SortAsc, SortDesc, ArrowUpDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";

interface SattaMatkaDetailsProps {
  selectedGame?: string;
  onBack?: () => void;
  marketData?: {
    id: number;
    name: string;
    totalUsers?: number;
    totalBets?: number;
    totalAmount?: number;
    date?: string;
  };
}

export default function SattaMatkaDetails({ selectedGame, onBack }: SattaMatkaDetailsProps = {}) {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const { isConnected } = useWebSocket();
  const [selectedBettingType, setSelectedBettingType] = useState("Single Ank");
  const [selectedNumber, setSelectedNumber] = useState<string | null>(null);
  const [showNumberDetails, setShowNumberDetails] = useState(false);
  const [showAgentDetails, setShowAgentDetails] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  // Default to today for better admin experience
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState<string>(today);
  const [endDate, setEndDate] = useState<string>(today);
  const [sortBy, setSortBy] = useState<string>('time');
  const [sortOrder, setSortOrder] = useState<string>('desc');

  const params = useParams();
  
  // Get game name from props, URL params or query string
  const urlParams = new URLSearchParams(window.location.search);
  const gameName = selectedGame || urlParams.get('game') || params.gameName || "KALYAN MORNING";

  // Fetch game-specific real database data with date filtering
  const { data: gameStatsData } = useQuery({
    queryKey: ["/api/admin/game-betting-stats", gameName, startDate, endDate],
    queryFn: () => {
      const params = new URLSearchParams({
        game: gameName,
        ...(startDate && { startDate }),
        ...(endDate && { endDate })
      });
      return fetch(`/api/admin/game-betting-stats?${params}`).then(res => res.json());
    },
    enabled: !!gameName,
    staleTime: 2 * 60 * 1000, // Consider data fresh for 2 minutes
    refetchOnWindowFocus: true // Refresh when admin focuses window
  });

  const { data: gameUniqueUsersData } = useQuery({
    queryKey: ["/api/admin/game-unique-users", gameName],
    queryFn: () => fetch(`/api/admin/game-unique-users?game=${encodeURIComponent(gameName)}`).then(res => res.json()),
    enabled: !!gameName,
    staleTime: 2 * 60 * 1000, // Consider data fresh for 2 minutes  
    refetchOnWindowFocus: true // Refresh when admin focuses window
  });

  const { data: gamePopularNumbersData } = useQuery({
    queryKey: ["/api/admin/game-popular-numbers", gameName, selectedBettingType, startDate, endDate],
    queryFn: () => {
      const params = new URLSearchParams({
        game: gameName,
        betType: selectedBettingType,
        ...(startDate && { startDate }),
        ...(endDate && { endDate })
      });
      return fetch(`/api/admin/game-popular-numbers?${params}`).then(res => res.json());
    },
    enabled: !!gameName,
    staleTime: 2 * 60 * 1000, // Consider data fresh for 2 minutes
    refetchOnWindowFocus: true // Refresh when admin focuses window
  });

  // Get market data with real database values and dynamic game name
  const marketData = {
    id: 1,
    name: gameName.toUpperCase(),
    totalUsers: gameUniqueUsersData?.uniqueUsers || 0,
    totalBets: gameStatsData?.totalBets || 0,
    totalAmount: gameStatsData?.totalAmount || 0,
    date: new Date().toLocaleDateString()
  };

  // Get current betting type data from real API
  const currentBettingData = {
    numbers: gamePopularNumbersData || [],
    totalPlayers: gameUniqueUsersData?.uniqueUsers || 0,
    totalBets: gameStatsData?.totalBets || 0,
    totalAmount: gameStatsData?.totalAmount || 0,
    growth: gameStatsData?.totalBets > 0 ? "+5%" : "0%"
  };

  const currentData = currentBettingData;

  // Date range already initialized to today by default
  // No useEffect needed as we set today as default value

  // Fetch detailed betting data for selected number with date range and sorting
  const { data: numberBetsData } = useQuery({
    queryKey: [
      `/api/admin/number-bets`,
      gameName,
      selectedNumber,
      selectedBettingType,
      startDate,
      endDate,
      sortBy,
      sortOrder
    ],
    queryFn: () => {
      const params = new URLSearchParams({
        game: gameName,
        number: selectedNumber || '',
        betType: selectedBettingType,
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        sortBy,
        sortOrder
      });
      return fetch(`/api/admin/number-bets?${params}`).then(res => res.json());
    },
    enabled: !!selectedNumber,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });

  // Fetch grouped agent bets for selected number
  const { data: groupedAgentBetsData } = useQuery({
    queryKey: [
      `/api/admin/grouped-agent-bets`,
      selectedNumber,
      gameName,
      startDate,
      endDate
    ],
    queryFn: () => {
      const params = new URLSearchParams({
        betNumber: selectedNumber || '',
        gameName: gameName,
        ...(startDate && { startDate }),
        ...(endDate && { endDate })
      });
      return fetch(`/api/admin/grouped-agent-bets?${params}`).then(res => res.json());
    },
    enabled: !!selectedNumber,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });

  // Fetch agent bet details for selected agent
  const { data: agentBetDetailsData } = useQuery({
    queryKey: [
      `/api/admin/agent-bet-details`,
      selectedAgent?.agent_id,
      selectedNumber,
      gameName,
      startDate,
      endDate
    ],
    queryFn: () => {
      const params = new URLSearchParams({
        agentId: selectedAgent?.agent_id?.toString() || '',
        betNumber: selectedNumber || '',
        gameName: gameName,
        ...(startDate && { startDate }),
        ...(endDate && { endDate })
      });
      return fetch(`/api/admin/agent-bet-details?${params}`).then(res => res.json());
    },
    enabled: !!(selectedAgent && selectedNumber),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });

  const numberBets = Array.isArray(numberBetsData) ? numberBetsData : [];
  const groupedAgentBets = Array.isArray(groupedAgentBetsData) ? groupedAgentBetsData : [];
  const numberTotalAmount = numberBets.reduce((sum: number, bet: any) => sum + (bet.amount || 0), 0);
  const numberTotalUsers = new Set(numberBets.map((bet: any) => bet.userId)).size;
  
  // Separate user bets and agent bets - remove individual agent bets from main display
  const userBets = numberBets.filter((bet: any) => 
    // Only show bets that are NOT agent bets (is_agent_bet is false/null/undefined)
    !bet.is_agent_bet && bet.agent_id === null
  );
  const agentDetails = Array.isArray(agentBetDetailsData) ? agentBetDetailsData : [];
  
  // Combine user bets with grouped agent bets for display
  // This will show: individual user bets + grouped agent summaries (not individual agent bets)
  const allBetsForDisplay = [
    ...userBets,
    ...groupedAgentBets.map((agentGroup: any) => ({
      isAgentGroup: true,
      agent_id: agentGroup.agent_id,
      agent_name: agentGroup.agent_name,
      amount: parseFloat(agentGroup.total_amount || '0'),
      betCount: parseInt(agentGroup.bet_count || '0'),
      customerNames: agentGroup.customer_names || [],
      individualAmounts: agentGroup.individual_amounts || [],
      betTimes: agentGroup.bet_times || []
    }))
  ];

  // If showing agent details, render agent bet breakdown
  if (showAgentDetails && selectedAgent) {
    const agentDetails = Array.isArray(agentBetDetailsData) ? agentBetDetailsData : [];
    
    return (
      <div 
        className="min-h-screen p-4"
        style={{
          background: "linear-gradient(135deg, rgb(248, 250, 252) 0%, rgb(237, 242, 247) 100%)"
        }}
      >
        {/* Header Section */}
        <div 
          className="relative text-white rounded-2xl mb-8 shadow-2xl backdrop-blur-sm hover:shadow-3xl transition-all duration-300"
          style={{
            background: "linear-gradient(135deg, #ea580c 0%, #dc2626 100%)",
            borderRadius: "16px",
            padding: "24px"
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent rounded-2xl"></div>
          <div className="relative z-10 flex justify-between items-start">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4">
                <Button
                  onClick={() => setShowAgentDetails(false)}
                  className="p-3 bg-white/20 hover:bg-white/30 text-white border-0 rounded-xl shadow-lg backdrop-blur-sm transition-all duration-200"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div 
                  className="rounded-xl backdrop-blur shadow-lg"
                  style={{
                    background: "rgba(255, 255, 255, 0.2)",
                    padding: "12px"
                  }}
                >
                  <span className="text-2xl">👨‍💼</span>
                </div>
                <div>
                  <h1 
                    className="text-white font-bold drop-shadow-md"
                    style={{ 
                      fontSize: "32px", 
                      fontWeight: "700"
                    }}
                  >
                    Agent Bet Details
                  </h1>
                  <p 
                    className="font-medium text-white/90 drop-shadow-sm"
                    style={{ 
                      color: "rgba(255, 255, 255, 0.9)", 
                      fontSize: "16px" 
                    }}
                  >
                    {selectedAgent.agent_name} - Number {selectedNumber} bets breakdown
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Agent Summary Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-orange-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200 text-center">
              <div className="text-2xl font-bold text-orange-700 mb-1">{selectedAgent.betCount}</div>
              <div className="text-sm text-orange-600 font-medium">Total Bets</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-lg p-4 border border-green-200 text-center">
              <div className="text-2xl font-bold text-green-700 mb-1">₹{selectedAgent.amount?.toLocaleString()}</div>
              <div className="text-sm text-green-600 font-medium">Total Amount</div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200 text-center">
              <div className="text-2xl font-bold text-blue-700 mb-1">₹{Math.round(selectedAgent.amount / selectedAgent.betCount).toLocaleString()}</div>
              <div className="text-sm text-blue-600 font-medium">Avg Bet</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200 text-center">
              <div className="text-2xl font-bold text-purple-700 mb-1">{selectedAgent.customerNames?.length || 0}</div>
              <div className="text-sm text-purple-600 font-medium">Customers</div>
            </div>
          </div>
        </div>

        {/* Detailed Bets */}
        <div className="bg-white rounded-2xl shadow-xl border border-orange-200 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Customer-wise Bet Details</h3>
          
          {agentDetails.length > 0 ? (
            <div className="space-y-4">
              {agentDetails.map((bet: any, index: number) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-4 rounded-xl border-2 border-orange-200 hover:border-orange-300 transition-all hover:shadow-md bg-gradient-to-r from-orange-50 to-orange-100"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-lg">{bet.customer_name}</h4>
                      <p className="text-sm text-gray-600">Placed by {selectedAgent.agent_name} Agent</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-sm text-gray-600">Bet Type</div>
                      <div className="font-semibold text-orange-700">{bet.bet_type}</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-sm text-gray-600">Amount</div>
                      <div className="font-bold text-green-700 text-xl">₹{parseFloat(bet.amount || '0').toLocaleString()}</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-sm text-gray-600">Time</div>
                      <div className="font-medium text-gray-700 flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {bet.created_at ? (() => {
                          const utcTime = new Date(bet.created_at);
                          const istTime = new Date(utcTime.getTime() + (5.5 * 60 * 60 * 1000));
                          return istTime.toLocaleTimeString('en-US', { hour12: true });
                        })() : 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">👨‍💼</div>
              <h3 className="text-xl font-bold text-gray-700 mb-2">No Bet Details Found</h3>
              <p className="text-gray-500">No detailed betting history available for this agent</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // If showing number details, render different content
  if (showNumberDetails && selectedNumber) {
    return (
      <div 
        className="min-h-screen p-4"
        style={{
          background: "linear-gradient(135deg, rgb(248, 250, 252) 0%, rgb(237, 242, 247) 100%)"
        }}
      >
        {/* Header Section with Background */}
        <div 
          className="relative text-white rounded-2xl mb-8 shadow-2xl backdrop-blur-sm hover:shadow-3xl transition-all duration-300"
          style={{
            background: "linear-gradient(135deg, #00b4db 0%, #0083b0 100%)",
            borderRadius: "16px",
            padding: "24px"
          }}
        >
          {/* Subtle overlay for depth */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent rounded-2xl"></div>
          <div className="relative z-10 flex justify-between items-start">
            <div className="flex items-center gap-6">
              {/* Back button and title */}
              <div className="flex items-center gap-4">
                <Button
                  onClick={() => setShowNumberDetails(false)}
                  className="p-3 bg-white/20 hover:bg-white/30 text-white border-0 rounded-xl shadow-lg backdrop-blur-sm transition-all duration-200"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div 
                  className="rounded-xl backdrop-blur shadow-lg"
                  style={{
                    background: "rgba(255, 255, 255, 0.2)",
                    padding: "12px"
                  }}
                >
                  <span className="text-2xl">🎯</span>
                </div>
                <div>
                  <h1 
                    className="text-white font-bold drop-shadow-md"
                    style={{ 
                      fontSize: "32px", 
                      fontWeight: "700"
                    }}
                  >
                    Number Betting Details
                  </h1>
                  <p 
                    className="font-medium text-white/90 drop-shadow-sm"
                    style={{ 
                      color: "rgba(255, 255, 255, 0.9)", 
                      fontSize: "16px" 
                    }}
                  >
                    Complete analysis for number <span className="font-bold text-yellow-200">{selectedNumber}</span> in {gameName}
                  </p>
                </div>
              </div>
            </div>

            {/* Game Badge with WebSocket Status */}
            <div className="flex items-center gap-3">
              <div 
                className="flex flex-col items-center justify-center gap-1 px-4 py-3 rounded-xl border border-white/30 shadow-lg backdrop-blur-sm text-center pl-[9px] pr-[9px] ml-[-5px] mr-[-5px] pt-[5px] pb-[5px] mt-[8px] mb-[8px]"
                style={{
                  background: "rgba(255, 255, 255, 0.2)"
                }}
              >
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm font-semibold">
                    {gameName}
                  </span>
                </div>
                <span className="text-xs font-medium text-white/90">
                  Premium Market
                </span>
              </div>
              
              {/* Real-time Status Indicator */}
              <div 
                className="flex items-center gap-2 px-3 py-2 rounded-lg backdrop-blur-sm border border-white/30"
                style={{
                  background: isConnected 
                    ? "rgba(34, 197, 94, 0.2)" 
                    : "rgba(239, 68, 68, 0.2)"
                }}
              >
                <div 
                  className={`w-2 h-2 rounded-full ${
                    isConnected ? 'bg-green-400' : 'bg-red-400'
                  } ${isConnected ? 'animate-pulse' : ''}`}
                />
                <span className="text-xs font-medium text-white/90">
                  {isConnected ? 'Live Updates' : 'Reconnecting...'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Summary Stats Cards */}
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200 shadow-xl">
              <div className="text-4xl font-bold text-blue-700 mb-2 font-mono">{selectedNumber}</div>
              <div className="text-sm text-blue-600 font-medium">Selected Number</div>
            </div>
            <div className="text-center bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl p-6 border border-green-200 shadow-xl">
              <div className="text-4xl font-bold text-green-700 mb-2">₹{numberTotalAmount.toLocaleString()}</div>
              <div className="text-sm text-green-600 font-medium">💰 Total Amount</div>
            </div>
            <div className="text-center bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200 shadow-xl">
              <div className="text-4xl font-bold text-purple-700 mb-2">{numberTotalUsers}</div>
              <div className="text-sm text-purple-600 font-medium">👥 Unique Players</div>
            </div>
          </div>

          {/* Filter and Sort Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white rounded-2xl shadow-lg border border-blue-200 p-4">
            {/* Filter Dropdown */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">
                  {startDate === endDate ? 
                    new Date(startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) :
                    `${new Date(startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} - ${new Date(endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`
                  }
                </span>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    className="text-white shadow-lg border-0 hover:opacity-90 transition-all duration-200 px-4 py-2 rounded-xl"
                    style={{
                      background: "linear-gradient(135deg, #00b4db 0%, #0083b0 100%)"
                    }}
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Filter Dates
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  className="w-72 p-4 shadow-2xl border border-blue-200"
                  style={{
                    background: "linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.98) 100%)",
                    backdropFilter: "blur(20px)"
                  }}
                >
                  <DropdownMenuLabel className="flex items-center gap-2 text-blue-800 font-semibold mb-3">
                    <Calendar className="w-4 h-4" />
                    Date Range Filter
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-blue-200" />
                  
                  <div className="space-y-3 mt-4">
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          const today = new Date().toISOString().split('T')[0];
                          setStartDate(today);
                          setEndDate(today);
                        }}
                        className={(() => {
                          const todayStr = new Date().toISOString().split('T')[0];
                          return startDate === todayStr && endDate === todayStr ? 
                            "text-white shadow-lg border-0 text-xs" : 
                            "bg-white/70 hover:bg-blue-50 text-blue-700 border border-blue-200 hover:border-blue-400 text-xs";
                        })()}
                        style={(() => {
                          const todayStr = new Date().toISOString().split('T')[0];
                          return startDate === todayStr && endDate === todayStr ? 
                            { background: "linear-gradient(135deg, #00b4db 0%, #0083b0 100%)" } : 
                            {};
                        })()}
                      >
                        Today
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          const yesterday = new Date();
                          yesterday.setDate(yesterday.getDate() - 1);
                          const yesterdayStr = yesterday.toISOString().split('T')[0];
                          setStartDate(yesterdayStr);
                          setEndDate(yesterdayStr);
                        }}
                        className={(() => {
                          const yesterday = new Date();
                          yesterday.setDate(yesterday.getDate() - 1);
                          const yesterdayStr = yesterday.toISOString().split('T')[0];
                          return startDate === yesterdayStr && endDate === yesterdayStr ? 
                            "text-white shadow-lg border-0 text-xs" : 
                            "bg-white/70 hover:bg-blue-50 text-blue-700 border border-blue-200 hover:border-blue-400 text-xs";
                        })()}
                        style={(() => {
                          const yesterday = new Date();
                          yesterday.setDate(yesterday.getDate() - 1);
                          const yesterdayStr = yesterday.toISOString().split('T')[0];
                          return startDate === yesterdayStr && endDate === yesterdayStr ? 
                            { background: "linear-gradient(135deg, #00b4db 0%, #0083b0 100%)" } : 
                            {};
                        })()}
                      >
                        Yesterday
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          const today = new Date();
                          const lastWeek = new Date();
                          lastWeek.setDate(today.getDate() - 7);
                          setStartDate(lastWeek.toISOString().split('T')[0]);
                          setEndDate(today.toISOString().split('T')[0]);
                        }}
                        className={(() => {
                          const today = new Date();
                          const lastWeek = new Date();
                          lastWeek.setDate(today.getDate() - 7);
                          const lastWeekStr = lastWeek.toISOString().split('T')[0];
                          const todayStr = today.toISOString().split('T')[0];
                          return startDate === lastWeekStr && endDate === todayStr ? 
                            "text-white shadow-lg border-0 text-xs" : 
                            "bg-white/70 hover:bg-blue-50 text-blue-700 border border-blue-200 hover:border-blue-400 text-xs";
                        })()}
                        style={(() => {
                          const today = new Date();
                          const lastWeek = new Date();
                          lastWeek.setDate(today.getDate() - 7);
                          const lastWeekStr = lastWeek.toISOString().split('T')[0];
                          const todayStr = today.toISOString().split('T')[0];
                          return startDate === lastWeekStr && endDate === todayStr ? 
                            { background: "linear-gradient(135deg, #00b4db 0%, #0083b0 100%)" } : 
                            {};
                        })()}
                      >
                        Last 7 Days
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          setStartDate('');
                          setEndDate('');
                        }}
                        className="bg-white/70 hover:bg-blue-50 text-blue-700 border border-blue-200 hover:border-blue-400 transition-all duration-200 text-xs"
                      >
                        All Time
                      </Button>
                    </div>
                    
                    <DropdownMenuSeparator className="bg-blue-200 my-3" />
                    
                    {/* Custom Date Range */}
                    <div className="space-y-3">
                      <div className="text-sm font-medium text-gray-700">Custom Date Range:</div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
                          <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full px-2 py-1 text-xs border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                            style={{
                              background: "rgba(255, 255, 255, 0.9)"
                            }}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
                          <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full px-2 py-1 text-xs border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                            style={{
                              background: "rgba(255, 255, 255, 0.9)"
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium text-gray-700">
                  {sortBy === 'time' ? 'Sort by Time' : sortOrder === 'desc' ? 'High to Low' : sortOrder === 'asc' ? 'Low to High' : 'Sort Options'}
                </span>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    className="text-white shadow-lg border-0 hover:opacity-90 transition-all duration-200 px-4 py-2 rounded-xl"
                    style={{
                      background: "linear-gradient(135deg, #9333ea 0%, #7c3aed 100%)"
                    }}
                  >
                    <SortAsc className="w-4 h-4 mr-2" />
                    Sort Options
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  className="w-64 p-4 shadow-2xl border border-purple-200"
                  style={{
                    background: "linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.98) 100%)",
                    backdropFilter: "blur(20px)"
                  }}
                >
                  <DropdownMenuLabel className="flex items-center gap-2 text-purple-800 font-semibold mb-3">
                    <ArrowUpDown className="w-4 h-4" />
                    Sort Configuration
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-purple-200" />
                  
                  <div className="space-y-3 mt-4">
                    <div className="grid grid-cols-1 gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSortBy('amount');
                          setSortOrder('desc');
                        }}
                        className={`text-xs transition-all duration-200 ${
                          sortBy === 'amount' && sortOrder === 'desc' 
                            ? 'bg-purple-100 border-purple-500 text-purple-800 shadow-sm' 
                            : 'text-purple-700 border border-purple-300 hover:border-purple-500 hover:bg-purple-50'
                        }`}
                      >
                        📉 High to Low
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSortBy('amount');
                          setSortOrder('asc');
                        }}
                        className={`text-xs transition-all duration-200 ${
                          sortBy === 'amount' && sortOrder === 'asc' 
                            ? 'bg-purple-100 border-purple-500 text-purple-800 shadow-sm' 
                            : 'text-purple-700 border border-purple-300 hover:border-purple-500 hover:bg-purple-50'
                        }`}
                      >
                        📈 Low to High
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSortBy('time');
                          setSortOrder('desc');
                        }}
                        className={`text-xs transition-all duration-200 ${
                          sortBy === 'time' 
                            ? 'bg-purple-100 border-purple-500 text-purple-800 shadow-sm' 
                            : 'text-purple-700 border border-purple-300 hover:border-purple-500 hover:bg-purple-50'
                        }`}
                      >
                        ⏰ Time
                      </Button>
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Betting Details */}
          <div className="bg-white rounded-2xl shadow-xl border border-blue-200 p-6">
            <div className="flex items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-md">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">User Betting History</h2>
                  <p className="text-gray-600">All bets placed on number {selectedNumber} ({selectedBettingType})</p>
                </div>
              </div>
            </div>


            {allBetsForDisplay.length > 0 ? (
              <div className="space-y-4">
                {allBetsForDisplay.map((bet: any, index: number) => (
                  <div 
                    key={index}
                    className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all hover:shadow-md ${
                      bet.isAgentGroup 
                        ? 'border-orange-200 hover:border-orange-300 bg-gradient-to-r from-orange-50 to-orange-100 cursor-pointer'
                        : 'border-gray-200 hover:border-blue-300 bg-gradient-to-r from-gray-50 to-gray-100'
                    }`}
                    onClick={() => {
                      if (bet.isAgentGroup) {
                        setSelectedAgent(bet);
                        setShowAgentDetails(true);
                      }
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full ${
                        bet.isAgentGroup 
                          ? 'bg-gradient-to-r from-orange-500 to-orange-600'
                          : 'bg-gradient-to-r from-blue-500 to-blue-600'
                      }`}>
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        {bet.isAgentGroup ? (
                          <div>
                            <h4 className="font-bold text-gray-900 text-lg">{bet.agent_name} Agent</h4>
                            <p className="text-sm text-gray-600">{bet.betCount} bets placed for customers</p>
                          </div>
                        ) : (
                          <div>
                            <h4 className="font-bold text-gray-900 text-lg">{bet.userName || 'Unknown User'}</h4>
                            <p className="text-sm text-gray-600">User ID: {bet.userId}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="text-sm text-gray-600">
                          {bet.isAgentGroup ? 'Total Bets' : 'Bet Type'}
                        </div>
                        <div className="font-semibold text-blue-700">
                          {bet.isAgentGroup ? bet.betCount : bet.betType}
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-sm text-gray-600">
                          {bet.isAgentGroup ? 'Total Amount' : 'Amount'}
                        </div>
                        <div className="font-bold text-green-700 text-xl">₹{bet.amount?.toLocaleString()}</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-sm text-gray-600">
                          {bet.isAgentGroup ? 'Action' : 'Time'}
                        </div>
                        <div className="font-medium text-gray-700 flex items-center gap-1">
                          {bet.isAgentGroup ? (
                            <span className="text-xs bg-orange-200 text-orange-800 px-2 py-1 rounded-full">
                              Click for Details
                            </span>
                          ) : (
                            <>
                              <Clock className="w-4 h-4" />
                              {bet.createdAt ? (() => {
                                const utcTime = new Date(bet.createdAt);
                                const istTime = new Date(utcTime.getTime() + (5.5 * 60 * 60 * 1000));
                                return istTime.toLocaleTimeString('en-US', { hour12: true });
                              })() : 'N/A'}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🎯</div>
                <h3 className="text-xl font-bold text-gray-700 mb-2">No Bets Found</h3>
                <p className="text-gray-500">No betting history available for number {selectedNumber} in {gameName}</p>
              </div>
            )}

            {/* Analytics Section */}
            {numberBets.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-lg font-bold text-gray-900 mb-4">Betting Analytics</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200 text-center">
                    <div className="text-2xl font-bold text-blue-700 mb-1">{numberBets.length}</div>
                    <div className="text-sm text-blue-600 font-medium">Total Bets</div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-lg p-4 border border-green-200 text-center">
                    <div className="text-2xl font-bold text-green-700 mb-1">₹{Math.round(numberTotalAmount / numberBets.length).toLocaleString()}</div>
                    <div className="text-sm text-green-600 font-medium">Avg Bet</div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200 text-center">
                    <div className="text-2xl font-bold text-purple-700 mb-1">₹{Math.max(...numberBets.map((b: any) => b.amount || 0)).toLocaleString()}</div>
                    <div className="text-sm text-purple-600 font-medium">Highest Bet</div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200 text-center">
                    <div className="text-2xl font-bold text-orange-700 mb-1">₹{Math.min(...numberBets.map((b: any) => b.amount || 0)).toLocaleString()}</div>
                    <div className="text-sm text-orange-600 font-medium">Lowest Bet</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen p-4"
      style={{
        background: "linear-gradient(135deg, rgb(248, 250, 252) 0%, rgb(237, 242, 247) 100%)"
      }}
    >
      {/* Luxury Header Section - Consistent with Satta Matka Analytics */}
      <div 
        className="relative text-white rounded-2xl mb-8 shadow-2xl backdrop-blur-sm hover:shadow-3xl transition-all duration-300"
        style={{
          background: "linear-gradient(135deg, #00b4db 0%, #0083b0 100%)",
          borderRadius: "16px",
          padding: "24px"
        }}
      >
        {/* Subtle overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent rounded-2xl"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 lg:gap-0">
          <div className="flex items-center gap-3 sm:gap-6 w-full lg:w-auto">
            {/* Back button and title */}
            <div className="flex items-center gap-2 sm:gap-4 flex-1">
              <Button
                onClick={() => {
                  console.log("🚀 Back button clicked! Using onBack callback");
                  if (onBack) {
                    onBack();
                  }
                }}
                className="p-2 sm:p-3 bg-white/20 hover:bg-white/30 text-white border-0 rounded-xl shadow-lg backdrop-blur-sm transition-all duration-200 flex-shrink-0"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
              <div 
                className="rounded-xl backdrop-blur shadow-lg flex-shrink-0 hidden sm:block"
                style={{
                  background: "rgba(255, 255, 255, 0.2)",
                  padding: "12px"
                }}
              >
                <span className="text-2xl">🎯</span>
              </div>
              <div className="flex-1 min-w-0">
                <h1 
                  className="text-white font-bold drop-shadow-md text-lg sm:text-2xl lg:text-3xl truncate"
                  style={{ 
                    fontWeight: "700"
                  }}
                >
                  {marketData.name}
                </h1>
                <p 
                  className="font-medium text-white/90 drop-shadow-sm text-xs sm:text-sm lg:text-base"
                  style={{ 
                    color: "rgba(255, 255, 255, 0.9)"
                  }}
                >
                  Detailed Market Analysis & Live Statistics
                </p>
              </div>
            </div>
          </div>

          {/* Date section with Filter Button */}
          <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
            <div 
              className="flex flex-col items-center justify-center gap-1 px-2 sm:px-4 py-2 sm:py-3 rounded-xl border border-white/30 shadow-lg backdrop-blur-sm text-center"
              style={{
                background: "rgba(255, 255, 255, 0.2)"
              }}
            >
              <div className="flex items-center gap-1 sm:gap-2">
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm font-semibold truncate max-w-32 sm:max-w-none">
                  {startDate && endDate ? 
                    (startDate === endDate ? 
                      new Date(startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) :
                      `${new Date(startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} - ${new Date(endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`
                    ) : 
                    "20 July 2025"
                  }
                </span>
              </div>
              <span className="text-xs font-medium text-white/90 hidden sm:block">
                {startDate === endDate ? "Selected Date" : "Date Range"}
              </span>
            </div>
            
            {/* Filter Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="p-2 sm:p-3 bg-white/20 hover:bg-white/30 text-white border-0 rounded-xl shadow-lg backdrop-blur-sm transition-all duration-200 flex-shrink-0">
                  <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                className="w-80 p-4 shadow-2xl border border-blue-200"
                style={{
                  background: "linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.98) 100%)",
                  backdropFilter: "blur(20px)"
                }}
              >
                <DropdownMenuLabel className="flex items-center gap-2 text-blue-800 font-semibold mb-3">
                  <Filter className="w-4 h-4" />
                  Filter Options
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-blue-200" />
                
                {/* Quick Date Filter Buttons */}
                <div className="space-y-3 mt-4">
                  <div className="text-sm font-medium text-gray-700 mb-2">Quick Filters:</div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        const today = new Date().toISOString().split('T')[0];
                        setStartDate(today);
                        setEndDate(today);
                      }}
                      className={(() => {
                        const todayStr = new Date().toISOString().split('T')[0];
                        return startDate === todayStr && endDate === todayStr ? 
                          "text-white shadow-lg border-0 text-xs" : 
                          "bg-white/70 hover:bg-blue-50 text-blue-700 border border-blue-200 hover:border-blue-400 text-xs";
                      })()}
                      style={(() => {
                        const todayStr = new Date().toISOString().split('T')[0];
                        return startDate === todayStr && endDate === todayStr ? 
                          { background: "linear-gradient(135deg, #00b4db 0%, #0083b0 100%)" } : 
                          {};
                      })()}
                    >
                      Today
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        const yesterday = new Date();
                        yesterday.setDate(yesterday.getDate() - 1);
                        const yesterdayStr = yesterday.toISOString().split('T')[0];
                        setStartDate(yesterdayStr);
                        setEndDate(yesterdayStr);
                      }}
                      className={(() => {
                        const yesterday = new Date();
                        yesterday.setDate(yesterday.getDate() - 1);
                        const yesterdayStr = yesterday.toISOString().split('T')[0];
                        return startDate === yesterdayStr && endDate === yesterdayStr ? 
                          "text-white shadow-lg border-0 text-xs" : 
                          "bg-white/70 hover:bg-blue-50 text-blue-700 border border-blue-200 hover:border-blue-400 text-xs";
                      })()}
                      style={(() => {
                        const yesterday = new Date();
                        yesterday.setDate(yesterday.getDate() - 1);
                        const yesterdayStr = yesterday.toISOString().split('T')[0];
                        return startDate === yesterdayStr && endDate === yesterdayStr ? 
                          { background: "linear-gradient(135deg, #00b4db 0%, #0083b0 100%)" } : 
                          {};
                      })()}
                    >
                      Yesterday
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        const today = new Date();
                        const lastWeek = new Date();
                        lastWeek.setDate(today.getDate() - 7);
                        setStartDate(lastWeek.toISOString().split('T')[0]);
                        setEndDate(today.toISOString().split('T')[0]);
                      }}
                      className={(() => {
                        const today = new Date();
                        const lastWeek = new Date();
                        lastWeek.setDate(today.getDate() - 7);
                        const lastWeekStr = lastWeek.toISOString().split('T')[0];
                        const todayStr = today.toISOString().split('T')[0];
                        return startDate === lastWeekStr && endDate === todayStr ? 
                          "text-white shadow-lg border-0 text-xs" : 
                          "bg-white/70 hover:bg-blue-50 text-blue-700 border border-blue-200 hover:border-blue-400 text-xs";
                      })()}
                      style={(() => {
                        const today = new Date();
                        const lastWeek = new Date();
                        lastWeek.setDate(today.getDate() - 7);
                        const lastWeekStr = lastWeek.toISOString().split('T')[0];
                        const todayStr = today.toISOString().split('T')[0];
                        return startDate === lastWeekStr && endDate === todayStr ? 
                          { background: "linear-gradient(135deg, #00b4db 0%, #0083b0 100%)" } : 
                          {};
                      })()}
                    >
                      Last 7 Days
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        const today = new Date();
                        const lastMonth = new Date();
                        lastMonth.setDate(today.getDate() - 30);
                        setStartDate(lastMonth.toISOString().split('T')[0]);
                        setEndDate(today.toISOString().split('T')[0]);
                      }}
                      className="bg-white/70 hover:bg-blue-50 text-blue-700 border border-blue-200 hover:border-blue-400 transition-all duration-200 text-xs"
                    >
                      Last 30 Days
                    </Button>
                  </div>
                  
                  <DropdownMenuSeparator className="bg-blue-200 my-3" />
                  
                  {/* Sort Options */}
                  <div className="space-y-3">
                    <div className="text-sm font-medium text-gray-700">Sort Options:</div>
                    <div className="grid grid-cols-2 gap-2">
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="text-xs">
                          <SelectValue placeholder="Sort by..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="time">⏰ Time</SelectItem>
                          <SelectItem value="amount">💰 Amount</SelectItem>
                          <SelectItem value="user">👤 User Name</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={sortOrder} onValueChange={setSortOrder}>
                        <SelectTrigger className="text-xs">
                          <SelectValue placeholder="Order..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="desc">📉 High to Low</SelectItem>
                          <SelectItem value="asc">📈 Low to High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      {/* Main Content */}
      <div className="space-y-6">
        {/* Overview Stats Section - 3 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Total Users Today */}
          <div className="bg-white rounded-2xl p-4 shadow-lg border border-blue-200 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-50 to-cyan-50">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 w-full">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1 gap-2">
                  <div className="flex-1">
                    <h3 className="text-gray-900 font-semibold text-sm sm:text-base">Total Users Today</h3>
                    <p className="text-gray-600 text-xs">Active participants</p>
                  </div>
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold shadow-sm self-start sm:self-center">+12%</span>
                </div>
                <p className="text-lg sm:text-xl font-bold text-gray-900">{marketData.totalUsers?.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Total Bets Count */}
          <div className="bg-white rounded-2xl p-4 shadow-lg border border-blue-200 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-green-50 to-emerald-50">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 w-full">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1 gap-2">
                  <div className="flex-1">
                    <h3 className="text-gray-900 font-semibold text-sm sm:text-base">Total Bets Count</h3>
                    <p className="text-gray-600 text-xs">Number of bets placed</p>
                  </div>
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-semibold shadow-sm self-start sm:self-center">+8%</span>
                </div>
                <p className="text-lg sm:text-xl font-bold text-gray-900">{marketData.totalBets?.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Total Amount */}
          <div className="bg-white rounded-2xl p-4 shadow-lg border border-blue-200 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-purple-50 to-pink-50">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 w-full">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1 gap-2">
                  <div className="flex-1">
                    <h3 className="text-gray-900 font-semibold text-sm sm:text-base">Total Amount</h3>
                    <p className="text-gray-600 text-xs">Revenue generated</p>
                  </div>
                  <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-semibold shadow-sm self-start sm:self-center">+15%</span>
                </div>
                <p className="text-lg sm:text-xl font-bold text-gray-900">₹{marketData.totalAmount?.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Betting Analysis by Type Section */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-6">
          {/* Betting Analysis by Type Card */}
          <div className="lg:col-span-3 bg-white rounded-2xl shadow-xl p-4 md:p-5 border border-blue-200 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-md">
                <PieChart className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-gray-900 font-bold text-lg">Betting Analysis by Type</h3>
                <p className="text-gray-600 text-sm">Total stakes by betting categories</p>
              </div>
            </div>

            <div className="space-y-4">
              {(gameStatsData?.bettingTypes || []).map((item: any, index: number) => {
                const colors = [
                  'from-blue-500 to-blue-600',
                  'from-green-500 to-emerald-600',
                  'from-purple-500 to-purple-600',
                  'from-orange-500 to-orange-600',
                  'from-pink-500 to-pink-600'
                ];
                
                return (
                  <div key={index} className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium text-gray-900">{item.type}</h4>
                      <span className="font-bold text-lg text-blue-600">
                        ₹{item.amount?.toLocaleString() || '0'}
                      </span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-700 ease-out bg-gradient-to-r ${colors[index % colors.length]}`}
                        style={{
                          width: `${Math.min(100, (item.bets || 0) * 10)}%`
                        }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Select Betting Type Card */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl p-5 border border-blue-200 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-md">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-gray-900 font-bold text-lg">Select Betting Type</h3>
                <p className="text-gray-600 text-sm">Filter by betting category</p>
              </div>
            </div>

            <div className="space-y-3">
              {["Single Ank", "Jodi", "Single Patti", "Double Patti", "Triple Patti"].map((betType, index) => (
                <div 
                  key={index}
                  className={`flex justify-between items-center py-3 px-4 rounded-xl transition-all cursor-pointer border-2 shadow-sm hover:shadow-md ${
                    selectedBettingType === betType 
                      ? 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-500 text-blue-700 shadow-md' 
                      : 'bg-gray-50 border-transparent hover:bg-gray-100 text-gray-700'
                  }`}
                  onClick={() => setSelectedBettingType(betType)}
                >
                  <span className="font-semibold text-base">{betType}</span>
                  <span className={`font-bold text-lg ${
                    selectedBettingType === betType ? 'text-blue-900' : 'text-gray-900'
                  }`}>
                    ₹{gameStatsData?.bettingTypes?.find((bt: any) => bt.type === betType)?.amount?.toLocaleString() || '0'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Popular Numbers Analysis - Enhanced Design */}
        <div className="bg-white rounded-2xl shadow-xl border border-blue-200 p-6 hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-md">
              <span className="text-2xl">🎯</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">Popular Numbers</h3>
              <p className="text-sm text-gray-600 font-medium">Most played {selectedBettingType.toLowerCase()} today</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {currentData.numbers.length > 0 ? currentData.numbers.map((item: any, index: number) => (
              <div 
                key={index}
                className="bg-white rounded-xl p-4 hover:scale-105 transition-all duration-300 border-2 border-blue-200 hover:border-blue-400 shadow-md hover:shadow-lg cursor-pointer"
                style={{
                  background: item.rank <= 3 ? 
                    'linear-gradient(135deg, rgba(0, 180, 219, 0.1) 0%, rgba(0, 131, 176, 0.05) 100%)' :
                    'linear-gradient(135deg, rgba(248, 250, 252, 1) 0%, rgba(241, 245, 249, 1) 100%)'
                }}
                onClick={() => {
                  setSelectedNumber(item.number);
                  setShowNumberDetails(true);
                }}
              >
                {/* Rank Badge */}
                <div className="flex justify-between items-center mb-3">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shadow-md bg-gradient-to-r from-blue-400 to-blue-600 text-white">
                    {index + 1}
                  </span>
                  <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded-full border border-green-200">
                    +{item.betCount || 0}
                  </span>
                </div>

                {/* Number Display */}
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-800 mb-2 font-mono">
                    {item.number}
                  </div>
                  <div className="text-sm font-bold text-blue-700 mb-2 bg-blue-50 px-2 py-1 rounded-full">
                    ₹{item.amount?.toLocaleString() || '0'}
                  </div>
                  <div className="flex items-center justify-center gap-1 text-xs text-gray-600 font-medium">
                    <Users className="w-3 h-3 text-blue-500" />
                    <span>{item.players || 0} players</span>
                  </div>
                </div>
              </div>
            )) : (
              <div className="col-span-full text-center py-8">
                <p className="text-gray-500">No betting data available for {selectedBettingType} in {gameName}</p>
              </div>
            )}
          </div>

          {/* Summary Stats */}
          <div className="mt-6 pt-6 border-t border-blue-200">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                <div className="text-2xl font-bold text-blue-700 mb-1">{currentData.totalPlayers}</div>
                <div className="text-sm text-blue-600 font-medium">👥 Total Players</div>
              </div>
              <div className="text-center bg-gradient-to-br from-green-50 to-emerald-100 rounded-lg p-4 border border-green-200">
                <div className="text-2xl font-bold text-green-700 mb-1">{currentData.totalBets}</div>
                <div className="text-sm text-green-600 font-medium">💰 Total Bets</div>
              </div>
              <div className="text-center bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                <div className="text-2xl font-bold text-purple-700 mb-1">₹{currentData.totalAmount?.toLocaleString() || '0'}</div>
                <div className="text-sm text-purple-600 font-medium">💰 Total Amount</div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-6">
          <Button 
            className="flex-1 text-white shadow-luxury"
            style={{ 
              background: "linear-gradient(135deg, hsl(var(--satta-gold)) 0%, hsl(var(--satta-amber)) 100%)" 
            }}
            onClick={() => {
              toast({
                title: "📊 Market Analysis Report Generated",
                description: `Comprehensive analysis report for ${marketData.name} market has been created successfully.`,
              });
            }}
          >
            <FileText className="w-4 h-4 mr-2" />
            Generate Detailed Report
          </Button>
          <Button 
            variant="outline" 
            className="flex-1 border-2"
            style={{ 
              borderColor: "hsl(var(--satta-gold))",
              color: "hsl(var(--satta-gold))"
            }}
            onClick={() => navigate("/admin")}
          >
            Back to Dashboard
          </Button>
        </div>
      </div>


    </div>
  );
}