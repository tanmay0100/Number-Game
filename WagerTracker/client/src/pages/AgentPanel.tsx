import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Users, 
  Wallet, 
  TrendingUp, 
  Settings, 
  LogOut,
  UserPlus,
  Eye,
  DollarSign,
  Clock,
  Target,
  Trophy,
  ChevronRight,
  Plus,
  History,
  Search,
  Calendar,
  ArrowUpDown
} from "lucide-react";

export default function AgentPanel() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState("dashboard");

  // Track wallet balance state locally - update when user data changes
  const [currentWalletBalance, setCurrentWalletBalance] = useState(user?.walletBalance || '0');


  
  // State for forms
  const [newCustomerForm, setNewCustomerForm] = useState({
    name: "", email: "", mobile: "", password: "123456", wallet_balance: 0
  });
  const [addCoinsForm, setAddCoinsForm] = useState({ customerId: "", amount: "", reason: "" });
  const [betForm, setBetForm] = useState({
    customerName: "", customerMobile: "", gameName: "", betType: "", betAmount: "", selectedNumbers: ""
  });

  // Get current user data with wallet balance
  const { data: currentUserData } = useQuery({
    queryKey: [`/api/user/${user?.id}`],
    enabled: !!user?.id,
    staleTime: 1000, // Very short stale time for real-time wallet updates
    refetchOnWindowFocus: true,
  });

  // Agent dashboard data
  const { data: agentStats } = useQuery({
    queryKey: [`/api/admin/agents/${user?.id}/revenue`],
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000,
  });

  const { data: agentCustomers } = useQuery({
    queryKey: [`/api/admin/agents/${user?.id}/customers`],
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000,
  });

  const { data: agentTransactions } = useQuery({
    queryKey: [`/api/agent/transactions`],
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000,
  });

  const { data: availableGames } = useQuery({
    queryKey: ['/api/admin/games'],
    staleTime: 5 * 60 * 1000,
  });

  // Update local wallet balance when user data changes
  useEffect(() => {
    if (currentUserData?.walletBalance) {
      setCurrentWalletBalance(currentUserData.walletBalance);
    } else if (user?.walletBalance) {
      setCurrentWalletBalance(user.walletBalance);
    }
  }, [currentUserData?.walletBalance, user?.walletBalance]);

  // WebSocket real-time updates for Agent Panel wallet balance
  useEffect(() => {
    const connectWebSocket = () => {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      const socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        console.log('🔗 Agent Panel WebSocket connected');
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 Agent Panel WebSocket message:', data);

          // Handle agent wallet updates
          if (data.type === 'agent_wallet_updated' && data.agentId === user?.id) {
            console.log('💰 Agent wallet updated:', data);
            
            // Update local wallet balance immediately
            setCurrentWalletBalance(data.newBalance.toString());
            
            // Invalidate relevant queries to refresh data
            queryClient.invalidateQueries({ queryKey: [`/api/user/${user?.id}`] });
            queryClient.invalidateQueries({ queryKey: [`/api/admin/agents/${user?.id}/revenue`] });
            
            // Show toast notification
            toast({
              title: "💰 Wallet Updated",
              description: `₹${data.amount} ${data.actionType} your wallet. Reason: ${data.reason}`,
              duration: 5000,
            });
          }
        } catch (error) {
          console.error('❌ WebSocket message parsing error:', error);
        }
      };

      socket.onclose = () => {
        console.log('🔌 Agent Panel WebSocket disconnected. Attempting to reconnect...');
        // Attempt to reconnect after 3 seconds
        setTimeout(connectWebSocket, 3000);
      };

      socket.onerror = (error) => {
        console.error('🚨 Agent Panel WebSocket error:', error);
      };

      return socket;
    };

    let websocket: WebSocket | null = null;
    
    if (user?.id) {
      websocket = connectWebSocket();
    }

    return () => {
      if (websocket) {
        websocket.close();
      }
    };
  }, [user?.id, queryClient, toast]);
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).globalWebSocket && user?.id) {
      const handleWalletUpdate = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'agent_wallet_updated' && data.data.agentId === user.id) {
            console.log('💰 Agent wallet updated - refreshing balance:', data.data);
            
            // Update user's wallet balance using useAuth global state mechanism
            const updatedUser = { ...user, walletBalance: data.data.newBalance.toString() };
            
            // Update localStorage with fresh wallet balance
            const stored = localStorage.getItem('user');
            if (stored) {
              const parsedStored = JSON.parse(stored);
              const updatedStoredUser = { ...parsedStored, walletBalance: data.data.newBalance.toString() };
              localStorage.setItem('user', JSON.stringify(updatedStoredUser));
            }
            
            // Update local wallet balance state
            setCurrentWalletBalance(data.data.newBalance.toString());
            
            // Update global user state to trigger UI refresh across all components
            if ((window as any).globalStateCallbacks) {
              (window as any).globalStateCallbacks.forEach((callback: any) => callback(updatedUser));
            }
            
            // Show real-time notification
            const actionText = data.data.actionType === 'added' ? 'added to' : 'removed from';
            toast({
              title: "💰 Wallet Updated",
              description: `₹${Math.abs(data.data.amount)} ${actionText} your wallet. New balance: ₹${Math.round(data.data.newBalance).toLocaleString()}`,
              duration: 5000,
            });
          }
        } catch (error) {
          console.error('Error handling WebSocket message:', error);
        }
      };

      (window as any).globalWebSocket.addEventListener('message', handleWalletUpdate);
      console.log('🔌 Agent Panel WebSocket listener added for agent ID:', user.id);

      return () => {
        if ((window as any).globalWebSocket) {
          (window as any).globalWebSocket.removeEventListener('message', handleWalletUpdate);
          console.log('🔌 Agent Panel WebSocket listener removed');
        }
      };
    }
  }, [user?.id, queryClient, toast]);

  // Mutations
  const createCustomerMutation = useMutation({
    mutationFn: async (customerData: any) => {
      const response = await apiRequest("/api/agent/create-customer", "POST", {
        ...customerData,
        assigned_agent_id: user?.id
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Customer created successfully!" });
      setNewCustomerForm({ name: "", email: "", mobile: "", password: "123456", wallet_balance: 0 });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/agents/${user?.id}/customers`] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create customer" });
    }
  });

  const addCoinsMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("/api/agent/add-coins", "POST", data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Coins added successfully!" });
      setAddCoinsForm({ customerId: "", amount: "", reason: "" });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/agents/${user?.id}/customers`] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to add coins" });
    }
  });

  const placeBetMutation = useMutation({
    mutationFn: async (betData: any) => {
      const response = await apiRequest("/api/agent/place-bet", "POST", {
        ...betData,
        agent_id: user?.id,
        agent_name: user?.name
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to place bet");
      }
      
      return response.json();
    },
    onSuccess: (data: any) => {
      toast({ 
        title: "✅ Bet Placed Successfully!", 
        description: `₹${data.totalAmount} deducted from wallet. New balance: ₹${Math.round(data.newAgentBalance).toLocaleString()}` 
      });
      
      // Update local wallet balance immediately
      setCurrentWalletBalance(data.newAgentBalance.toString());
      
      // Reset form
      setBetForm({ customerName: "", customerMobile: "", gameName: "", betType: "", betAmount: "", selectedNumbers: "" });
      
      // Refresh queries
      queryClient.invalidateQueries({ queryKey: [`/api/agent/transactions`] });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/agents/${user?.id}/revenue`] });
      queryClient.invalidateQueries({ queryKey: [`/api/user/${user?.id}`] });
    },
    onError: (error: any) => {
      toast({ 
        title: "❌ Bet Failed", 
        description: error.message || "Failed to place bet",
        variant: "destructive"
      });
    }
  });

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Welcome, {user?.name}!</h1>
        <p className="text-blue-100">Agent ID: {user?.unique_user_id}</p>
        <p className="text-blue-100">Territory: {user?.territory || "Not Assigned"}</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600">Wallet Balance</p>
                <p className="text-2xl font-bold text-green-700">
                  ₹{Math.round(parseFloat(currentWalletBalance)).toLocaleString()}
                </p>
              </div>
              <Wallet className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600">My Customers</p>
                <p className="text-2xl font-bold text-blue-700">
                  {agentCustomers?.length || 0}
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600">Total Bets</p>
                <p className="text-2xl font-bold text-purple-700">
                  {agentStats?.total_bets || 0}
                </p>
              </div>
              <Target className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600">Commission Rate</p>
                <p className="text-2xl font-bold text-orange-700">
                  {user?.commission_rate || 0}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Quick Actions</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="h-16 flex-col"
              onClick={() => setActiveSection("place-bet")}
            >
              <Target className="w-6 h-6 mb-2" />
              Place Offline Bet
            </Button>
            
            <Button 
              variant="outline" 
              className="h-16 flex-col"
              onClick={() => setActiveSection("customers")}
            >
              <Users className="w-6 h-6 mb-2" />
              Manage Customers
            </Button>
            
            <Button 
              variant="outline" 
              className="h-16 flex-col"
              onClick={() => setActiveSection("transactions")}
            >
              <DollarSign className="w-6 h-6 mb-2" />
              View Transactions
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Recent Activity</h3>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No recent activity</p>
            <p className="text-sm">Your recent transactions and bets will appear here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderPlaceBet = () => {
    // Calculate summary statistics
    const totalBets = agentStats?.total_bets || 0;
    const totalRevenue = parseFloat(agentStats?.total_bet_amount || '0');
    const todayBets = agentTransactions?.filter((t: any) => {
      const transactionDate = new Date(t.created_at || t.createdAt);
      const today = new Date();
      return transactionDate.toDateString() === today.toDateString();
    }).length || 0;

    return (
      <div className="min-h-screen" style={{
        background: 'linear-gradient(135deg, rgb(248, 250, 252) 0%, rgb(237, 242, 247) 100%)'
      }}>
        <div className="p-6">
          {/* Enhanced Header */}
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold mb-2" style={{
                fontSize: '32px',
                fontWeight: '700',
                background: 'linear-gradient(135deg, rgb(34, 197, 94) 0%, rgb(16, 185, 129) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                🎯 Place Offline Bet
              </h1>
              <p style={{
                color: 'rgba(63, 63, 70, 0.6)',
                fontSize: '14px'
              }}>
                Place bets on behalf of your customers with comprehensive tracking
              </p>
            </div>
          </div>

          {/* Summary Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {/* Total Bets Card */}
            <Card className="border-0 shadow-lg h-28" style={{
              background: 'linear-gradient(135deg, rgb(219, 234, 254) 0%, rgb(186, 230, 253) 100%)',
              border: '2px solid rgb(147, 197, 253)'
            }}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Target style={{ color: 'rgb(37, 99, 235)', width: '18px', height: '18px' }} />
                </div>
                <p style={{ color: 'rgb(30, 64, 175)', fontSize: '12px', fontWeight: '500' }}>
                  Total Bets Placed
                </p>
                <p style={{ 
                  color: 'rgb(30, 58, 138)', 
                  fontSize: '20px', 
                  fontWeight: 'bold',
                  margin: '4px 0 0 0'
                }}>
                  {totalBets}
                </p>
              </CardContent>
            </Card>

            {/* Total Revenue Card */}
            <Card className="border-0 shadow-lg h-28" style={{
              background: 'linear-gradient(135deg, rgb(220, 252, 231) 0%, rgb(187, 247, 208) 100%)',
              border: '2px solid rgb(134, 239, 172)'
            }}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <DollarSign style={{ color: 'rgb(34, 197, 94)', width: '18px', height: '18px' }} />
                </div>
                <p style={{ color: 'rgb(21, 128, 61)', fontSize: '12px', fontWeight: '500' }}>
                  Total Revenue
                </p>
                <p style={{ 
                  color: 'rgb(20, 83, 45)', 
                  fontSize: '20px', 
                  fontWeight: 'bold',
                  margin: '4px 0 0 0'
                }}>
                  ₹{Math.round(Math.abs(totalRevenue)).toLocaleString()}
                </p>
              </CardContent>
            </Card>

            {/* Today's Bets Card */}
            <Card className="border-0 shadow-lg h-28" style={{
              background: 'linear-gradient(135deg, rgb(254, 240, 138) 0%, rgb(253, 224, 71) 100%)',
              border: '2px solid rgb(250, 204, 21)'
            }}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Calendar style={{ color: 'rgb(202, 138, 4)', width: '18px', height: '18px' }} />
                </div>
                <p style={{ color: 'rgb(146, 64, 14)', fontSize: '12px', fontWeight: '500' }}>
                  Today's Bets
                </p>
                <p style={{ 
                  color: 'rgb(120, 53, 15)', 
                  fontSize: '20px', 
                  fontWeight: 'bold',
                  margin: '4px 0 0 0'
                }}>
                  {todayBets}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Betting Form Section */}
          <Card className="bg-white shadow-xl border-0" style={{ borderRadius: "20px" }}>
            {/* Header with Gradient Background */}
            <div 
              className="px-8 py-6 rounded-t-[20px]"
              style={{
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                borderTopLeftRadius: "20px",
                borderTopRightRadius: "20px"
              }}
            >
              <div className="flex items-center">
                <Target className="w-8 h-8 mr-3 text-white" />
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">
                    Offline Betting Operations
                  </h3>
                  <p className="text-white opacity-90 text-sm">
                    Complete betting management with customer details and transaction tracking
                  </p>
                </div>
              </div>
            </div>

            <CardContent className="p-8">
              <div className="space-y-6">
                {/* Customer Details Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="customerName" className="text-sm font-semibold text-gray-700 mb-2 block">
                      Customer Name *
                    </Label>
                    <Input
                      className="h-12 border-2 focus:border-green-500 rounded-lg"
                      placeholder="Enter customer full name"
                      value={betForm.customerName}
                      onChange={(e) => setBetForm({...betForm, customerName: e.target.value})}
                    />
                  </div>

                  <div>
                    <Label htmlFor="customerMobile" className="text-sm font-semibold text-gray-700 mb-2 block">
                      Customer Mobile (Optional)
                    </Label>
                    <Input
                      className="h-12 border-2 focus:border-green-500 rounded-lg"
                      placeholder="Enter 10-digit mobile number"
                      value={betForm.customerMobile}
                      onChange={(e) => setBetForm({...betForm, customerMobile: e.target.value})}
                    />
                  </div>
                </div>

                {/* Game Selection Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="game" className="text-sm font-semibold text-gray-700 mb-2 block">
                      Select Game *
                    </Label>
                    <Select value={betForm.gameName} onValueChange={(value) => setBetForm({...betForm, gameName: value})}>
                      <SelectTrigger className="h-12 border-2 focus:border-green-500 rounded-lg">
                        <SelectValue placeholder="Choose available game" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableGames?.map((game: any) => (
                          <SelectItem key={game.id} value={game.gameName}>
                            {game.gameName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="betType" className="text-sm font-semibold text-gray-700 mb-2 block">
                      Bet Type *
                    </Label>
                    <Select value={betForm.betType} onValueChange={(value) => setBetForm({...betForm, betType: value})}>
                      <SelectTrigger className="h-12 border-2 focus:border-green-500 rounded-lg">
                        <SelectValue placeholder="Select betting type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Single Ank">Single Ank</SelectItem>
                        <SelectItem value="Jodi">Jodi</SelectItem>
                        <SelectItem value="Single Patti">Single Patti</SelectItem>
                        <SelectItem value="Double Patti">Double Patti</SelectItem>
                        <SelectItem value="Triple Patti">Triple Patti</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Betting Details Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="betAmount" className="text-sm font-semibold text-gray-700 mb-2 block">
                      Amount per Number (₹) *
                    </Label>
                    <Input
                      type="number"
                      className="h-12 border-2 focus:border-green-500 rounded-lg"
                      placeholder="Enter amount per number"
                      value={betForm.betAmount}
                      onChange={(e) => setBetForm({...betForm, betAmount: e.target.value})}
                    />
                  </div>

                  <div>
                    <Label htmlFor="numbers" className="text-sm font-semibold text-gray-700 mb-2 block">
                      Selected Numbers *
                    </Label>
                    <Input
                      className="h-12 border-2 focus:border-green-500 rounded-lg"
                      placeholder="Enter numbers (e.g., 1,2,3 or 123)"
                      value={betForm.selectedNumbers}
                      onChange={(e) => setBetForm({...betForm, selectedNumbers: e.target.value})}
                    />
                  </div>
                </div>

                {/* Bet Summary */}
                {betForm.selectedNumbers && betForm.betAmount && (
                  <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                    <h4 className="font-semibold text-yellow-800 mb-2">Bet Summary:</h4>
                    <div className="text-sm text-yellow-700">
                      {(() => {
                        const numbers = betForm.selectedNumbers.split(',').map(n => n.trim()).filter(n => n);
                        const singleBetAmount = parseFloat(betForm.betAmount) || 0;
                        const totalAmount = numbers.length * singleBetAmount;
                        return (
                          <div>
                            <p>Selected Numbers: <strong>{numbers.join(', ')}</strong></p>
                            <p>Count: <strong>{numbers.length} number{numbers.length > 1 ? 's' : ''}</strong></p>
                            <p>Amount per number: <strong>₹{singleBetAmount}</strong></p>
                            <p className="text-lg font-bold text-yellow-900">Total Amount: ₹{totalAmount}</p>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <div className="pt-4">
                  <Button 
                    className="w-full h-14 text-lg font-semibold rounded-lg"
                    style={{
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    }}
                    onClick={() => {
                      placeBetMutation.mutate({
                        ...betForm
                      });
                    }}
                    disabled={placeBetMutation.isPending || !betForm.customerName || !betForm.gameName || !betForm.betAmount || !betForm.selectedNumbers}
                  >
                    {placeBetMutation.isPending ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                        Placing Bet...
                      </div>
                    ) : "Place Offline Bet"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const renderCustomers = () => (
    <div className="space-y-6">
      {/* Create New Customer */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <UserPlus className="w-5 h-5 mr-2" />
            Create New Customer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customerName">Customer Name</Label>
              <Input
                placeholder="Enter full name"
                value={newCustomerForm.name}
                onChange={(e) => setNewCustomerForm({...newCustomerForm, name: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="customerMobile">Mobile Number</Label>
              <Input
                placeholder="Enter mobile number"
                value={newCustomerForm.mobile}
                onChange={(e) => setNewCustomerForm({...newCustomerForm, mobile: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="customerEmail">Email (Optional)</Label>
              <Input
                placeholder="Enter email"
                value={newCustomerForm.email}
                onChange={(e) => setNewCustomerForm({...newCustomerForm, email: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="initialBalance">Initial Wallet Balance (₹)</Label>
              <Input
                type="number"
                placeholder="0"
                value={newCustomerForm.wallet_balance}
                onChange={(e) => setNewCustomerForm({...newCustomerForm, wallet_balance: parseFloat(e.target.value) || 0})}
              />
            </div>
          </div>
          <Button 
            className="mt-4"
            onClick={() => createCustomerMutation.mutate(newCustomerForm)}
            disabled={createCustomerMutation.isPending || !newCustomerForm.name || !newCustomerForm.mobile}
          >
            {createCustomerMutation.isPending ? "Creating..." : "Create Customer"}
          </Button>
        </CardContent>
      </Card>

      {/* Add Coins to Customer */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Plus className="w-5 h-5 mr-2" />
            Add Coins to Customer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="selectCustomer">Select Customer</Label>
              <Select value={addCoinsForm.customerId} onValueChange={(value) => setAddCoinsForm({...addCoinsForm, customerId: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose customer" />
                </SelectTrigger>
                <SelectContent>
                  {agentCustomers?.map((customer: any) => (
                    <SelectItem key={customer.id} value={customer.id.toString()}>
                      {customer.name} - ₹{Math.round(customer.wallet_balance || 0)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="coinsAmount">Amount (₹)</Label>
              <Input
                type="number"
                placeholder="Enter amount"
                value={addCoinsForm.amount}
                onChange={(e) => setAddCoinsForm({...addCoinsForm, amount: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="reason">Reason</Label>
              <Input
                placeholder="Payment received"
                value={addCoinsForm.reason}
                onChange={(e) => setAddCoinsForm({...addCoinsForm, reason: e.target.value})}
              />
            </div>
          </div>
          <Button 
            className="mt-4"
            onClick={() => addCoinsMutation.mutate(addCoinsForm)}
            disabled={addCoinsMutation.isPending || !addCoinsForm.customerId || !addCoinsForm.amount}
          >
            {addCoinsMutation.isPending ? "Adding..." : "Add Coins"}
          </Button>
        </CardContent>
      </Card>

      {/* My Customers List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="w-5 h-5 mr-2" />
            My Customers ({agentCustomers?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {agentCustomers && agentCustomers.length > 0 ? (
            <div className="space-y-3">
              {agentCustomers.map((customer: any) => (
                <div key={customer.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
                  <div>
                    <p className="font-semibold text-gray-800">{customer.name}</p>
                    <p className="text-sm text-gray-600">📱 {customer.mobile}</p>
                    <p className="text-sm text-gray-600">📧 {customer.email || "No email"}</p>
                    <p className="text-sm font-medium text-green-600">💰 ₹{Math.round(customer.wallet_balance || 0).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">ID: {customer.unique_user_id}</p>
                    <p className="text-xs text-gray-500">Joined: {new Date(customer.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No Customers Yet</p>
              <p className="text-sm">Create your first customer using the form above</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderTransactions = () => (
    <div className="space-y-6">
      {/* Daily Business Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600">Today's Turnover</p>
                <p className="text-2xl font-bold text-green-700">
                  ₹{(agentStats?.today_turnover || 0).toLocaleString()}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600">Today's Commission</p>
                <p className="text-2xl font-bold text-blue-700">
                  ₹{(agentStats?.today_commission || 0).toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600">Total Transactions</p>
                <p className="text-2xl font-bold text-purple-700">
                  {agentTransactions?.length || 0}
                </p>
              </div>
              <History className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <History className="w-5 h-5 mr-2" />
            My Transaction History
          </CardTitle>
          <p className="text-sm text-gray-600">All transactions related to your customers</p>
        </CardHeader>
        <CardContent>
          {agentTransactions && agentTransactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commission</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {agentTransactions.map((transaction: any) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {transaction.customer_name || transaction.userName}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          transaction.type === 'deposit' ? 'bg-green-100 text-green-800' : 
                          transaction.type === 'bet' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {transaction.type.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">
                        ₹{Math.abs(parseFloat(transaction.amount)).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-green-600">
                        ₹{(parseFloat(transaction.amount) * (user?.commission_rate || 0) / 100).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <History className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No Transactions Yet</p>
              <p className="text-sm">Start placing bets or adding coins to see transaction history</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const sidebarItems = [
    { id: "dashboard", label: "Dashboard", icon: TrendingUp },
    { id: "place-bet", label: "Place Bet", icon: Target },
    { id: "customers", label: "My Customers", icon: Users },
    { id: "transactions", label: "Transactions", icon: DollarSign },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="flex items-center justify-between px-6 py-4">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Agent Panel
          </h1>
          
          {/* Right Side - Wallet Info */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center bg-green-50 px-4 py-2 rounded-lg border border-green-200">
              <Wallet className="w-5 h-5 text-green-600 mr-2" />
              <div className="text-right">
                <p className="text-xs text-green-600 font-medium">Wallet Balance</p>
                <p className="text-sm font-bold text-green-700">
                  ₹{Math.round(parseFloat(currentWalletBalance)).toLocaleString()}
                </p>
              </div>
            </div>
            
            {/* Agent Info */}
            <div className="flex items-center text-gray-600">
              <div className="text-right mr-3">
                <p className="text-sm font-medium text-gray-800">{user?.name}</p>
                <p className="text-xs text-gray-500">Agent ID: {user?.uniqueUserId}</p>
              </div>
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-sm min-h-screen border-r">
          <div className="p-4 flex flex-col h-full">
            <div className="space-y-2 flex-1">
              {sidebarItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${
                    activeSection === item.id
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.label}
                  <ChevronRight className="w-4 h-4 ml-auto" />
                </button>
              ))}
            </div>
            
            {/* Logout button at bottom */}
            <div className="mt-auto pt-4 border-t">
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors text-red-600 hover:bg-red-50"
              >
                <LogOut className="w-5 h-5 mr-3" />
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          {activeSection === "dashboard" && renderDashboard()}
          {activeSection === "place-bet" && renderPlaceBet()}
          {activeSection === "customers" && renderCustomers()}
          {activeSection === "transactions" && renderTransactions()}
        </div>
      </div>
    </div>
  );
}