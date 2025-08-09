import { useState, useEffect } from "react";
import { ArrowLeft, Wallet, Target, Palette, Plane, Dice1, Zap, CreditCard, TrendingUp, DollarSign, Play, RotateCcw, Trophy, Star, CheckCircle, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";

interface GameCard {
  id: string;
  title: string;
  description: string;
  icon: any;
  bgGradient: string;
  hoverGradient: string;
}

export default function PlayGames() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  // Fetch updated user data - only refresh when needed
  const { data: allUsers } = useQuery({
    queryKey: ["/api/admin/users"],
    staleTime: 5 * 60 * 1000, // Fresh for 5 minutes
  });

  // Get current user with latest wallet balance
  const currentUser = allUsers?.find((u: any) => u.id === user?.id || u.email === user?.email);
  
  // Fetch admin games - only refresh when needed
  const { data: adminGames } = useQuery({
    queryKey: ["/api/admin/games"],
    staleTime: 5 * 60 * 1000, // Fresh for 5 minutes
  });

  // Mutation to place bet
  const placeBetMutation = useMutation({
    mutationFn: async (betData: any) => {
      const response = await apiRequest('/api/place-bet', 'POST', betData);
      return response.json();
    },
    onSuccess: () => {
      // Refresh user data to get updated wallet balance
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/total-bets"] });
    },
  });
  
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [selectedMatkaGame, setSelectedMatkaGame] = useState<string | null>(null);
  const [selectedMatkaType, setSelectedMatkaType] = useState<string | null>(null);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedCoin, setSelectedCoin] = useState<number>(10);
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [selectedPanna, setSelectedPanna] = useState<string>("");
  const [selectedSingleDigit, setSelectedSingleDigit] = useState<number | null>(null);
  const [selectedPannaList, setSelectedPannaList] = useState<string[]>([]);
  const [selectedDoubleDigit, setSelectedDoubleDigit] = useState<number | null>(null);
  const [selectedDoublePannaList, setSelectedDoublePannaList] = useState<string[]>([]);
  const [selectedTripleDigit, setSelectedTripleDigit] = useState<number | null>(null);
  const [selectedTriplePanna, setSelectedTriplePanna] = useState<string>('');
  // Half Sangam states
  const [halfSangamType, setHalfSangamType] = useState<'open-ank-close-patti' | 'close-ank-open-patti' | null>(null);
  const [openAnk, setOpenAnk] = useState<number | null>(null);
  const [closePatti, setClosePatti] = useState<string>('');
  const [closeAnk, setCloseAnk] = useState<number | null>(null);
  const [openPatti, setOpenPatti] = useState<string>('');
  // Full Sangam states
  const [fullSangamOpenPatti, setFullSangamOpenPatti] = useState<string>('');
  const [fullSangamClosePatti, setFullSangamClosePatti] = useState<string>('');
  const [fullSangamJodi, setFullSangamJodi] = useState<string>('');
  const [betAmount, setBetAmount] = useState<number>(10);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [lastBetData, setLastBetData] = useState<any>(null);
  const [myBids, setMyBids] = useState<any[]>([]);

  // Load bids from localStorage on component mount
  useEffect(() => {
    const savedBids = localStorage.getItem('myBids');
    if (savedBids) {
      setMyBids(JSON.parse(savedBids));
    }
  }, []);

  // Reset scroll position when game states change
  useEffect(() => {
    const mainElement = document.querySelector('main');
    if (mainElement) {
      mainElement.scrollTop = 0;
    }
    window.scrollTo(0, 0);
  }, [selectedGame, selectedMatkaGame, selectedMatkaType]);
  
  // Color King game states
  const [isColorKingPlaying, setIsColorKingPlaying] = useState(false);
  const [colorKingResult, setColorKingResult] = useState<string | null>(null);
  // Fetch Color King results from server - only refresh when game ends
  const { data: colorKingResults, refetch: refetchColorKingResults } = useQuery({
    queryKey: ["/api/color-king-results"],
    staleTime: 30 * 1000, // Fresh for 30 seconds 
  });
  const [colorKingTimer, setColorKingTimer] = useState(150); // 2.5 minutes (150 seconds)
  const [currentRound, setCurrentRound] = useState(1);
  const [gameStartTime, setGameStartTime] = useState<number>(Date.now());
  const [totalWins, setTotalWins] = useState(0);
  const [totalLoses, setTotalLoses] = useState(0);
  const [liveBettingHistory, setLiveBettingHistory] = useState<{name: string, amount: number, color: string, timestamp: number}[]>([]);

  // Fetch live bets from database - only refresh when new bet placed
  const { data: liveBets, refetch: refetchLiveBets } = useQuery({
    queryKey: ["/api/live-bets"],
    staleTime: 10 * 1000, // Fresh for 10 seconds
  });

  // Mutation to create live bet
  const createLiveBetMutation = useMutation({
    mutationFn: async (betData: any) => {
      return apiRequest('/api/live-bets', 'POST', betData);
    },
    onSuccess: () => {
      // Refresh live bets immediately after creating new bet
      refetchLiveBets();
      queryClient.invalidateQueries({ queryKey: ["/api/live-bets"] });
    },
  });

  // Mutation to create Color King result
  const createColorKingResultMutation = useMutation({
    mutationFn: async (resultData: { winningColor: string; roundNumber: number }) => {
      return apiRequest('/api/color-king-results', 'POST', resultData);
    },
    onSuccess: () => {
      // Refresh Color King results immediately after creating new result
      refetchColorKingResults();
      queryClient.invalidateQueries({ queryKey: ["/api/color-king-results"] });
    },
  });
  const [isAutoGameRunning, setIsAutoGameRunning] = useState(true);
  const [showColorWinPopup, setShowColorWinPopup] = useState(false);
  const [winningColorData, setWinningColorData] = useState<{color: string, isWin: boolean} | null>(null);
  const [showBetSuccessPopup, setShowBetSuccessPopup] = useState(false);
  const [betSuccessData, setBetSuccessData] = useState<{colors: string[], amount: number} | null>(null);
  const [lastResultTime, setLastResultTime] = useState<number>(0);

  // Initialize game start time when Color King is selected
  useEffect(() => {
    if (selectedGame !== 'color-king') return;
    
    const now = Date.now();
    const roundDuration = 150000; // 2.5 minutes (150 seconds)
    
    // Calculate which round we should be in based on elapsed time
    const elapsedSinceStart = now % roundDuration;
    const remainingTime = Math.floor((roundDuration - elapsedSinceStart) / 1000);
    
    setColorKingTimer(remainingTime);
    setGameStartTime(now - elapsedSinceStart);
  }, [selectedGame]);

  // Color King timer effect with real-time sync - runs only when Color King is selected
  useEffect(() => {
    if (selectedGame !== 'color-king') return;
    
    let interval: NodeJS.Timeout;
    
    interval = setInterval(() => {
      const now = Date.now();
      const roundDuration = 150000; // 2.5 minutes (150 seconds)
      const elapsedSinceRoundStart = (now - gameStartTime) % roundDuration;
      const remainingTime = Math.floor((roundDuration - elapsedSinceRoundStart) / 1000);
      
      const currentRoundStart = Math.floor((now - gameStartTime) / roundDuration) * roundDuration + gameStartTime;
      
      if (remainingTime <= 0 && lastResultTime !== currentRoundStart) {
        // Round ended, generate result only once per round
        setLastResultTime(currentRoundStart);
        generateColorKingResult();
        // Don't restart timer here - it will be handled by popup timeout
      } else if (remainingTime !== colorKingTimer && remainingTime > 0) {
        setColorKingTimer(remainingTime);
      }
    }, 100); // Check every 100ms for accuracy
    
    return () => clearInterval(interval);
  }, [selectedGame, gameStartTime, colorKingTimer, colorKingResult]);

  // Auto generate random live bets every few seconds
  useEffect(() => {
    const generateRandomBet = () => {
      const names = ['Raj Kumar', 'Priya Sharma', 'Amit Singh', 'Neha Gupta', 'Rohit Verma', 'Kavita Joshi', 'Vikash Yadav', 'Sunita Devi'];
      const colors = ['red', 'green', 'yellow', 'blue'];
      const amounts = [10, 20, 50, 100, 200, 500];
      
      const randomBet = {
        name: names[Math.floor(Math.random() * names.length)],
        amount: amounts[Math.floor(Math.random() * amounts.length)],
        color: colors[Math.floor(Math.random() * colors.length)],
        timestamp: Date.now()
      };
      
      setLiveBettingHistory(prev => [randomBet, ...prev.slice(0, 7)]); // Keep only last 8 bets
    };

    if (isAutoGameRunning) {
      const interval = setInterval(generateRandomBet, Math.random() * 5000 + 2000); // Every 2-7 seconds
      return () => clearInterval(interval);
    }
  }, [isAutoGameRunning]);

  // Start auto game when component mounts
  useEffect(() => {
    setIsAutoGameRunning(true);
  }, []);

  const generateColorKingResult = () => {
    const colors = ['red', 'green', 'yellow', 'blue'];
    const winningColor = colors[Math.floor(Math.random() * colors.length)];
    setColorKingResult(winningColor);
    
    // Save result to database
    createColorKingResultMutation.mutate({
      winningColor,
      roundNumber: currentRound
    });
    
    // Check if user won based on their selections
    const isWin = selectedColors.length > 0 ? selectedColors.includes(winningColor) : false;
    
    // Show popup with winning color result
    setWinningColorData({ color: winningColor, isWin });
    setShowColorWinPopup(true);
    
    // Auto-close popup after 10 seconds and start new round
    setTimeout(() => {
      setShowColorWinPopup(false);
      setWinningColorData(null);
      resetColorKingRound();
      // Restart timer to full 150 seconds (2.5 minutes)
      setGameStartTime(Date.now());
      setColorKingTimer(150);
      // Increment round number for next round
      setCurrentRound(prev => prev + 1);
    }, 10000);
    
    // Update local stats only (results are stored in database)
    if (isWin) {
      setTotalWins(prev => prev + 1);
    } else {
      setTotalLoses(prev => prev + 1);
    }

    // Remove this timeout as it conflicts with the popup system
    // The round will reset automatically when next timer cycle starts
  };

  const resetColorKingRound = () => {
    setColorKingResult(null);
    setIsColorKingPlaying(false);
    setSelectedColors([]);
    setCurrentRound(prev => prev + 1);
    // Timer will auto-adjust based on real-time calculation
  };

  // Function to calculate Jodi from Open and Close Patti
  const calculateJodiFromPatti = (openPatti: string, closePatti: string): string => {
    if (openPatti.length !== 3 || closePatti.length !== 3) return '';
    
    // Calculate sum for open patti and take last digit
    const openSum = openPatti.split('').reduce((sum, digit) => sum + parseInt(digit), 0);
    const openLastDigit = openSum % 10;
    
    // Calculate sum for close patti and take last digit
    const closeSum = closePatti.split('').reduce((sum, digit) => sum + parseInt(digit), 0);
    const closeLastDigit = closeSum % 10;
    
    // Return jodi in format like "90"
    return `${openLastDigit}${closeLastDigit}`;
  };

  const calculateTotalAmount = () => {
    if (selectedMatkaType === 'single-patti' || selectedMatkaType === 'jodi-digit') {
      return betAmount * selectedNumbers.length;
    }
    if (selectedMatkaType === 'single-panna') {
      return betAmount * selectedPannaList.length;
    }
    if (selectedMatkaType === 'double-panna') {
      return betAmount * selectedDoublePannaList.length;
    }
    if (selectedMatkaType === 'triple-panna') {
      return selectedTriplePanna ? betAmount : 0;
    }
    if (selectedMatkaType === 'half-sangam') {
      return ((halfSangamType === 'open-ank-close-patti' && openAnk !== null && closePatti) || 
              (halfSangamType === 'close-ank-open-patti' && closeAnk !== null && openPatti)) ? betAmount : 0;
    }
    if (selectedMatkaType === 'full-sangam') {
      return (fullSangamOpenPatti && fullSangamClosePatti) ? betAmount : 0;
    }
    return betAmount;
  };

  const handlePlaceBet = async () => {
    const totalAmount = calculateTotalAmount();
    const betData = {
      userId: user?.id,
      userName: user?.name,
      gameName: selectedMatkaGame,
      type: selectedMatkaType,
      typeName: matkaOptions.find(o => o.id === selectedMatkaType)?.title,
      selection: selectedMatkaType === 'single-patti' ? selectedNumbers.join(', ') :
                selectedMatkaType === 'jodi-digit' ? selectedNumbers.map(n => n.toString().padStart(2, '0')).join(', ') :
                selectedMatkaType === 'single-panna' ? selectedPannaList.join(', ') :
                selectedMatkaType === 'double-panna' ? selectedDoublePannaList.join(', ') :
                selectedMatkaType === 'triple-panna' ? selectedTriplePanna :
                selectedMatkaType === 'half-sangam' && halfSangamType ? 
                  (halfSangamType === 'open-ank-close-patti' ? `${openAnk}-${closePatti}` :
                   halfSangamType === 'close-ank-open-patti' ? `${closeAnk}-${openPatti}` : '') :
                selectedMatkaType === 'full-sangam' ? `${fullSangamOpenPatti}-${calculateJodiFromPatti(fullSangamOpenPatti, fullSangamClosePatti)}-${fullSangamClosePatti}` :
                selectedPanna,
      amount: totalAmount,
      rate: matkaOptions.find(o => o.id === selectedMatkaType)?.rate,
    };
    
    try {
      // Store bet data for success dialog before API call
      setLastBetData({
        gameName: selectedMatkaGame,
        typeName: matkaOptions.find(o => o.id === selectedMatkaType)?.title,
        amount: totalAmount,
        selection: selectedMatkaType === 'single-patti' ? selectedNumbers.join(', ') :
                  selectedMatkaType === 'jodi-digit' ? selectedNumbers.map(n => n.toString().padStart(2, '0')).join(', ') :
                  selectedMatkaType === 'single-panna' ? selectedPannaList.join(', ') :
                  selectedMatkaType === 'double-panna' ? selectedDoublePannaList.join(', ') :
                  selectedMatkaType === 'triple-panna' ? selectedTriplePanna :
                  selectedMatkaType === 'half-sangam' && halfSangamType ? 
                    (halfSangamType === 'open-ank-close-patti' ? `${openAnk}-${closePatti}` :
                     halfSangamType === 'close-ank-open-patti' ? `${closeAnk}-${openPatti}` : '') :
                  selectedMatkaType === 'full-sangam' ? `${fullSangamOpenPatti}-${calculateJodiFromPatti(fullSangamOpenPatti, fullSangamClosePatti)}-${fullSangamClosePatti}` :
                  selectedPanna
      });
      
      // Place bet via API - now saves to database
      await placeBetMutation.mutateAsync(betData);
      
      // Also update localStorage for local bid history
      const newBid = {
        id: Date.now(),
        ...betData,
        timestamp: new Date().toLocaleString(),
        status: 'completed'
      };
      const updatedBids = [newBid, ...myBids];
      setMyBids(updatedBids);
      localStorage.setItem('myBids', JSON.stringify(updatedBids));
      
      setShowConfirmDialog(false);
      setShowSuccessDialog(true);
      
      // Auto-hide success dialog after 5 seconds
      setTimeout(() => {
        setShowSuccessDialog(false);
        setLastBetData(null);
      }, 5000);
      
      // Reset form
      setSelectedNumbers([]);
      setSelectedPanna("");
      setSelectedSingleDigit(null);
      setSelectedPannaList([]);
      setSelectedDoubleDigit(null);
      setSelectedDoublePannaList([]);
      setSelectedTripleDigit(null);
      setSelectedTriplePanna('');
      // Reset Half Sangam states
      setHalfSangamType(null);
      setOpenAnk(null);
      setClosePatti('');
      setCloseAnk(null);
      setOpenPatti('');
      // Reset Full Sangam states
      setFullSangamOpenPatti('');
      setFullSangamClosePatti('');
      setFullSangamJodi('');
      setBetAmount(10);
      
    } catch (error) {
      console.error('Error placing bet:', error);
      // Handle error - maybe show error dialog
    }
  };

  const startColorKingRound = async () => {
    if (selectedColors.length > 0 && selectedCoin > 0) {
      // Create live bet in database
      const liveBetData = {
        userName: user?.name || 'Anonymous Player',
        gameType: 'color-king',
        selectedColors: selectedColors.join(', '),
        betAmount: selectedCoin,
        roundNumber: currentRound
      };

      try {
        // Save to database
        await createLiveBetMutation.mutateAsync(liveBetData);
        
        // Show success popup
        setBetSuccessData({
          colors: selectedColors,
          amount: selectedCoin * selectedColors.length
        });
        setShowBetSuccessPopup(true);
        
        // Auto-close success popup after 3 seconds
        setTimeout(() => {
          setShowBetSuccessPopup(false);
          setBetSuccessData(null);
        }, 3000);
        
        // Also add to local state for immediate feedback
        const userBet = {
          name: user?.name || 'You',
          amount: selectedCoin * selectedColors.length,
          color: selectedColors.join(', '),
          timestamp: Date.now()
        };
        setLiveBettingHistory(prev => [userBet, ...prev.slice(0, 7)]);
        
        setIsColorKingPlaying(true);
        // Don't change timer, let it continue countdown
        setColorKingResult(null);
      } catch (error) {
        console.error('Error creating live bet:', error);
        // Still allow local gameplay even if database fails
        const userBet = {
          name: user?.name || 'You',
          amount: selectedCoin * selectedColors.length,
          color: selectedColors.join(', '),
          timestamp: Date.now()
        };
        setLiveBettingHistory(prev => [userBet, ...prev.slice(0, 7)]);
        
        setIsColorKingPlaying(true);
        setColorKingResult(null);
      }
    }
  }

  // Helper function to format timer
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };;

  const handleBackToDashboard = () => {
    setLocation("/");
  };

  const handleBackToGames = () => {
    setSelectedGame(null);
    setSelectedMatkaGame(null);
    setSelectedMatkaType(null);
    setSelectedColors([]);
    setSelectedCoin(10);
    setSelectedNumbers([]);
    setSelectedPanna("");
    setSelectedSingleDigit(null);
    setSelectedPannaList([]);
    setSelectedDoubleDigit(null);
    setSelectedDoublePannaList([]);
    setSelectedTripleDigit(null);
    setSelectedTriplePanna('');
    // Reset Half Sangam states  
    setHalfSangamType(null);
    setOpenAnk(null);
    setClosePatti('');
    setCloseAnk(null);
    setOpenPatti('');
    // Reset Full Sangam states
    setFullSangamOpenPatti('');
    setFullSangamClosePatti('');
    setFullSangamJodi('');
    setBetAmount(10);
  };

  const handleBackToMatkaGames = () => {
    setSelectedMatkaGame(null);
    setSelectedMatkaType(null);
    setSelectedNumbers([]);
    setSelectedPanna("");
    setSelectedSingleDigit(null);
    setSelectedPannaList([]);
    setSelectedDoubleDigit(null);
    setSelectedDoublePannaList([]);
    setSelectedTripleDigit(null);
    setSelectedTriplePanna('');
    // Reset Half Sangam states  
    setHalfSangamType(null);
    setOpenAnk(null);
    setClosePatti('');
    setCloseAnk(null);
    setOpenPatti('');
    // Reset Full Sangam states
    setFullSangamOpenPatti('');
    setFullSangamClosePatti('');
    setFullSangamJodi('');
    setBetAmount(10);
  };

  const handleBackToMatkaTypes = () => {
    setSelectedMatkaType(null);
    setSelectedNumbers([]);
    setSelectedPanna("");
    setSelectedSingleDigit(null);
    setSelectedPannaList([]);
    setSelectedDoubleDigit(null);
    setSelectedDoublePannaList([]);
    setSelectedTripleDigit(null);
    setSelectedTriplePanna('');
    // Reset Half Sangam states  
    setHalfSangamType(null);
    setOpenAnk(null);
    setClosePatti('');
    setCloseAnk(null);
    setOpenPatti('');
    // Reset Full Sangam states
    setFullSangamOpenPatti('');
    setFullSangamClosePatti('');
    setFullSangamJodi('');
    setBetAmount(10);
  };

  const gameCards: GameCard[] = [
    {
      id: "matka",
      title: "Satta Matka",
      description: "Traditional number guessing game with multiple betting options",
      icon: Target,
      bgGradient: "from-red-500 to-red-600",
      hoverGradient: "from-red-600 to-red-700"
    },
    {
      id: "color-king",
      title: "Color King",
      description: "Pick the winning colors and multiply your earnings",
      icon: Palette,
      bgGradient: "from-purple-500 to-pink-500",
      hoverGradient: "from-purple-600 to-pink-600"
    },
    {
      id: "dice-game", 
      title: "Dice Game",
      description: "Roll the dice and win big with lucky numbers",
      icon: Dice1,
      bgGradient: "from-blue-500 to-blue-600",
      hoverGradient: "from-blue-600 to-blue-700"
    }
  ];

  const colorOptions = [
    { id: "red", name: "Red / लाल", color: "bg-red-500", emoji: "🔴" },
    { id: "green", name: "Green / हरा", color: "bg-green-500", emoji: "🟢" }, 
    { id: "yellow", name: "Yellow / पीला", color: "bg-yellow-500", emoji: "🟡" },
    { id: "blue", name: "Blue / नीला", color: "bg-blue-500", emoji: "🔵" }
  ];

  const coinOptions = [5, 10, 20, 50, 100, 200, 500, 1000];

  // Panna mapping for each digit (Single Patti)
  const pannaMapping: Record<number, string[]> = {
    1: ["137", "128", "146", "236", "245", "290", "380", "470", "489", "560", "678", "579"],
    2: ["129", "138", "147", "156", "237", "246", "345", "390", "480", "570", "589", "679"],
    3: ["120", "139", "148", "157", "238", "247", "256", "346", "490", "580", "670", "689"],
    4: ["130", "149", "158", "167", "239", "248", "257", "347", "356", "590", "680", "789"],
    5: ["140", "159", "168", "230", "249", "258", "267", "348", "357", "456", "690", "780"],
    6: ["123", "150", "169", "178", "240", "259", "268", "349", "358", "367", "457", "790"],
    7: ["124", "160", "179", "250", "269", "278", "340", "359", "368", "458", "467", "890"],
    8: ["125", "134", "170", "189", "260", "279", "350", "369", "378", "459", "468", "567"],
    9: ["126", "135", "180", "234", "270", "289", "360", "379", "450", "469", "478", "568"],
    0: ["127", "136", "145", "190", "235", "280", "370", "389", "460", "479", "569", "578"]
  };

  // Double Patti mapping for each digit  
  const doublePannaMapping: Record<number, string[]> = {
    1: ["119", "155", "227", "335", "344", "399", "588", "669", "100"],
    2: ["110", "228", "255", "336", "499", "660", "688", "778", "200"],
    3: ["166", "229", "337", "355", "445", "599", "779", "788", "300"],
    4: ["112", "220", "266", "338", "446", "455", "699", "770", "400"],
    5: ["113", "122", "177", "339", "366", "447", "799", "889", "500"],
    6: ["114", "277", "330", "448", "466", "556", "880", "899", "600"],
    7: ["115", "133", "188", "223", "377", "449", "557", "566", "700"],
    8: ["116", "224", "233", "288", "440", "477", "558", "990", "800"],
    9: ["117", "144", "199", "225", "388", "559", "577", "667", "900"],
    0: ["118", "226", "244", "299", "334", "488", "668", "677", "550"]
  };

  // Triple Patti mapping for each digit (special mapping as requested)
  const triplePannaMapping: Record<number, string> = {
    1: "777",
    2: "444", 
    3: "111",
    4: "888",
    5: "555",
    6: "222",
    7: "999",
    8: "666",
    9: "333",
    0: "000"
  };

  // Matka betting options
  const matkaOptions = [
    {
      id: "single-patti",
      title: "Single Ank",
      description: "Ek ank chuno (0–9)",
      rate: "1:9.5"
    },
    {
      id: "jodi-digit",
      title: "Jodi", 
      description: "Do ank ka joda chuno (00–99)",
      rate: "1:95"
    },
    {
      id: "single-panna",
      title: "Single Patti",
      description: "Teen alag ank chuno (jaise 123)",
      rate: "1:142"
    },
    {
      id: "double-panna",
      title: "Double Patti",
      description: "Ek ank do baar ho (jaise 112)", 
      rate: "1:285"
    },
    {
      id: "triple-panna",
      title: "Triple Patti",
      description: "Teen baar ek hi ank (jaise 111)",
      rate: "1:950"
    },
    {
      id: "half-sangam",
      title: "Half Sangam",
      description: "Ek jodi + ek patti (jaise 46 + 123)",
      rate: "1:1425"
    },
    {
      id: "full-sangam", 
      title: "Full Sangam",
      description: "Do patti ka combination (jaise 123 + 456)",
      rate: "1:9500"
    }
  ];

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-white via-blue-50/20 to-purple-50/40 relative flex flex-col overflow-hidden">
      {/* Floating Orbs */}
      <div className="floating-orb floating-orb-1"></div>
      <div className="floating-orb floating-orb-2"></div>
      <div className="floating-orb floating-orb-3"></div>
      <div className="floating-orb floating-orb-4"></div>
      {/* Header */}
      <header className="bg-white shadow-lg sticky top-0 z-50 flex-shrink-0">
        <div className="px-4 py-4 flex items-center justify-between">
          <button 
            onClick={() => {
              if (selectedGame === 'matka' && selectedMatkaType) {
                // From betting interface back to matka types
                handleBackToMatkaTypes();
              } else if (selectedGame === 'matka' && selectedMatkaGame && !selectedMatkaType) {
                // From matka types back to matka games
                handleBackToMatkaGames();
              } else if (selectedGame === 'matka' && !selectedMatkaGame) {
                // From matka games back to main games
                handleBackToGames();
              } else if (selectedGame === 'color-king') {
                // From color king back to main games
                handleBackToGames();
              } else if (selectedGame && !selectedMatkaType) {
                // From game selection back to main games
                handleBackToGames();
              } else {
                // From main games back to dashboard
                handleBackToDashboard();
              }
            }}
            className="p-2 hover:bg-gray-100 rounded-lg flex items-center gap-2 text-gray-800 transition-all duration-200"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm font-bold">Back</span>
          </button>

          <h1 className="text-lg sm:text-xl font-extrabold text-gray-800 flex items-center gap-2">
            <Target className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="truncate">
              {!selectedGame ? 'Choose Your Game' : 
               selectedGame === 'matka' && !selectedMatkaGame ? 'Satta Matka Games' :
               selectedGame === 'matka' && selectedMatkaGame && !selectedMatkaType ? selectedMatkaGame :
               selectedGame === 'matka' && selectedMatkaType ? matkaOptions.find(o => o.id === selectedMatkaType)?.title :
               selectedGame === 'color-king' ? 'Color King' :
               gameCards.find(g => g.id === selectedGame)?.title || 'Game'}
            </span>
          </h1>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="glass-card px-2 sm:px-4 py-2 rounded-full">
              <div className="flex items-center gap-1 sm:gap-2">
                <Wallet className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
                <span className="text-purple-800 font-bold text-xs sm:text-sm">
                  ₹{currentUser?.wallet_balance || '0.00'}
                </span>
              </div>
            </div>
            
            <div className="glass-card w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-purple-900 font-black text-sm sm:text-lg border border-purple-200">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
          </div>
        </div>
      </header>
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 w-full">
        {!selectedGame ? (
          // Game Selection Screen
          (<div className="w-full max-w-6xl mx-auto px-2">
            <div className="text-center mb-6 sm:mb-8">
              <div className="glass-card inline-block p-3 sm:p-4 rounded-full mb-4 sm:mb-6">
                <Target className="h-8 w-8 sm:h-12 sm:w-12 text-purple-600" />
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gradient-primary mb-3 sm:mb-4 px-4">
                Choose Your Game
              </h2>
              <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-2xl mx-auto px-4">
                Select a game and start playing to win big rewards! Each game offers unique excitement and winning opportunities.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 w-full">
              {gameCards.map((game, index) => (
                <div
                  key={game.id}
                  className="glass-card cursor-pointer transition-all duration-300 transform hover:scale-105 hover:glass-primary group p-4 sm:p-6 w-full"
                  onClick={() => {
                    // Reset scroll position for the main element
                    const mainElement = document.querySelector('main');
                    if (mainElement) {
                      mainElement.scrollTop = 0;
                    }
                    window.scrollTo(0, 0);
                    setSelectedGame(game.id);
                  }}
                >
                  <div className={`w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 bg-gradient-to-br ${game.bgGradient} rounded-full flex items-center justify-center`}>
                    <game.icon className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                  </div>
                  
                  <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-2 text-center group-hover:text-purple-800 transition-colors">
                    {game.title}
                  </h3>
                  
                  <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 text-center">
                    {game.description}
                  </p>
                  
                  <Button 
                    className={`w-full bg-gradient-to-r ${game.bgGradient} hover:${game.hoverGradient} text-white font-semibold rounded-full transition-all duration-300 transform hover:scale-105`}
                    size="sm"
                  >
                    Play Now
                  </Button>
                </div>
              ))}
            </div>
          </div>)
        ) : selectedGame === "matka" && !selectedMatkaGame ? (
          // Matka Games List (Admin added games)
          (<div className="w-full h-full bg-gradient-to-br from-white via-red-50/20 to-orange-50/40 relative">
            {/* Floating Orbs for Matka */}
            <div className="floating-orb floating-orb-1" style={{background: 'linear-gradient(45deg, rgba(239, 68, 68, 0.4), rgba(251, 146, 60, 0.4))'}}></div>
            <div className="floating-orb floating-orb-2" style={{background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.5), rgba(245, 101, 101, 0.5))'}}></div>
            <div className="floating-orb floating-orb-3" style={{background: 'linear-gradient(225deg, rgba(234, 88, 12, 0.6), rgba(251, 146, 60, 0.6))'}}></div>
            <div className="w-full max-w-5xl mx-auto relative z-10 px-2 py-2">
              <div className="text-center mb-4">
                <div className="glass-card inline-block p-3 sm:p-4 rounded-full mb-4 sm:mb-6">
                  <Target className="h-8 w-8 sm:h-12 sm:w-12 text-red-600" />
                </div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gradient-primary mb-3 sm:mb-4 px-4">
                  Satta Matka Games
                </h2>
                <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-xl mx-auto px-4">
                  Choose from available matka games to start betting
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 w-full">
                {adminGames && adminGames.length > 0 ? adminGames.map((game: any, index: number) => {
                  const gradients = [
                    'from-red-500 to-red-600',
                    'from-orange-500 to-orange-600', 
                    'from-yellow-500 to-yellow-600',
                    'from-green-500 to-green-600',
                    'from-blue-500 to-blue-600',
                    'from-purple-500 to-purple-600',
                    'from-pink-500 to-pink-600'
                  ];
                  const icons = [Target, DollarSign, Star, Trophy, Dice1, Zap, CreditCard];
                  const IconComponent = icons[index % icons.length];
                  
                  return (
                    <div
                      key={game.id}
                      className="glass-card cursor-pointer transition-all duration-300 transform hover:scale-105 hover:glass-primary group p-4 sm:p-6 w-full"
                      onClick={() => {
                        // Reset scroll position for the main element
                        const mainElement = document.querySelector('main');
                        if (mainElement) {
                          mainElement.scrollTop = 0;
                        }
                        window.scrollTo(0, 0);
                        setSelectedMatkaGame(game.gameName);
                      }}
                      style={{
                        animationDelay: `${index * 100}ms`,
                        animation: 'fadeInUp 0.6s ease-out forwards'
                      }}
                    >
                      {/* Icon with gradient */}
                      <div className={`w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 bg-gradient-to-br ${gradients[index % gradients.length]} rounded-full flex items-center justify-center`}>
                        <IconComponent className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                      </div>
                      
                      {/* Title */}
                      <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4 text-center group-hover:text-red-600 transition-colors">
                        {game.gameName}
                      </h3>
                      
                      {/* Timing */}
                      <div className="text-center mb-4">
                        <p className="text-sm text-gray-600">
                          Start: <span className="font-semibold text-green-600">{game.startTime}</span>
                        </p>
                        <p className="text-sm text-gray-600">
                          End: <span className="font-semibold text-red-600">{game.endTime}</span>
                        </p>
                      </div>
                      
                      {/* Status */}
                      <div className="text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          game.highlighted ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {game.highlighted ? 'Featured' : 'Active'}
                        </span>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="col-span-full text-center py-12">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Target className="h-10 w-10 text-red-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">No Games Available</h3>
                    <p className="text-gray-600">No matka games have been added by admin yet.</p>
                  </div>
                )}
              </div>

              <div className="mt-2 text-center pb-2">
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => {
                    handleBackToGames();
                  }}
                  className="glass-card hover:glass-primary transition-all duration-300 rounded-full"
                >
                  ← Back to Games
                </Button>
              </div>
            </div>
          </div>)
        ) : selectedGame === "matka" && selectedMatkaGame && !selectedMatkaType ? (
          // Matka Game Type Selection
          (<div className="w-full h-full bg-gradient-to-br from-white via-red-50/20 to-orange-50/40 relative">
            {/* Floating Orbs for Matka */}
            <div className="floating-orb floating-orb-1" style={{background: 'linear-gradient(45deg, rgba(239, 68, 68, 0.4), rgba(251, 146, 60, 0.4))'}}></div>
            <div className="floating-orb floating-orb-2" style={{background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.5), rgba(245, 101, 101, 0.5))'}}></div>
            <div className="floating-orb floating-orb-3" style={{background: 'linear-gradient(225deg, rgba(234, 88, 12, 0.6), rgba(251, 146, 60, 0.6))'}}></div>
            <div className="w-full max-w-5xl mx-auto relative z-10 px-2 py-2">
              <div className="text-center mb-6 sm:mb-8">
                <div className="glass-card inline-block p-3 sm:p-4 rounded-full mb-4 sm:mb-6">
                  <Target className="h-8 w-8 sm:h-12 sm:w-12 text-red-600" />
                </div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gradient-primary mb-3 sm:mb-4 px-4">
                  {selectedMatkaGame} - Betting Types
                </h2>
                <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-xl mx-auto px-4">
                  Choose your betting type for {selectedMatkaGame}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 w-full">
                {matkaOptions.map((option, index) => {
                  const gradients = [
                    'from-red-500 to-red-600',
                    'from-orange-500 to-orange-600', 
                    'from-yellow-500 to-yellow-600',
                    'from-green-500 to-green-600',
                    'from-blue-500 to-blue-600',
                    'from-purple-500 to-purple-600',
                    'from-pink-500 to-pink-600'
                  ];
                  const icons = [Target, DollarSign, Star, Trophy, Dice1, Zap, CreditCard];
                  const IconComponent = icons[index];
                  
                  return (
                    <div
                      key={option.id}
                      className="glass-card cursor-pointer transition-all duration-300 transform hover:scale-105 hover:glass-primary group p-4 sm:p-6 w-full"
                      onClick={() => {
                        // Reset scroll position for the main element
                        const mainElement = document.querySelector('main');
                        if (mainElement) {
                          mainElement.scrollTop = 0;
                        }
                        window.scrollTo(0, 0);
                        setSelectedMatkaType(option.id);
                      }}
                      style={{
                        animationDelay: `${index * 100}ms`,
                        animation: 'fadeInUp 0.6s ease-out forwards'
                      }}
                    >
                      {/* Icon with gradient */}
                      <div className={`w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 bg-gradient-to-br ${gradients[index]} rounded-full flex items-center justify-center`}>
                        <IconComponent className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                      </div>
                      
                      {/* Title */}
                      <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4 text-center group-hover:text-red-600 transition-colors">
                        {option.title}
                      </h3>
                      
                      {/* Description */}
                      <p className="text-sm text-gray-600 text-center">
                        {option.description}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-2 text-center pb-2">
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => {
                    handleBackToMatkaGames();
                  }}
                  className="glass-card hover:glass-primary transition-all duration-300 rounded-full"
                >
                  ← Back to Matka Games
                </Button>
              </div>
            </div>
          </div>)
        ) : selectedGame === "matka" && selectedMatkaType ? (
          // Matka Betting Interface
          (<div className="w-full bg-gradient-to-br from-white via-red-50/20 to-orange-50/40 relative">
            {/* Floating Orbs for Matka */}
            <div className="floating-orb floating-orb-1" style={{background: 'linear-gradient(45deg, rgba(239, 68, 68, 0.4), rgba(251, 146, 60, 0.4))'}}></div>
            <div className="floating-orb floating-orb-2" style={{background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.5), rgba(245, 101, 101, 0.5))'}}></div>
            <div className="w-full max-w-4xl mx-auto relative z-10 pt-4 px-2">
              <div className="text-center mb-4">
                <div className="glass-card inline-block p-4 rounded-full mb-2">
                  <Target className="h-12 w-12 text-red-600" />
                </div>
                <h2 className="text-3xl font-bold text-gradient-primary mb-2">
                  {selectedMatkaGame} - {matkaOptions.find(o => o.id === selectedMatkaType)?.title}
                </h2>
                <p className="text-lg text-gray-600">
                  Rate: {matkaOptions.find(o => o.id === selectedMatkaType)?.rate}
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Number Selection */}
                <div className="lg:col-span-2">
                  <div className="glass-card p-6 h-fit">
                    
                    
                    {selectedMatkaType === 'single-panna' && (
                      <div className="space-y-4">
                        {/* Step 1: Choose Digit */}
                        <div className="glass-card p-4 rounded-xl">
                          <h4 className="text-lg font-bold text-blue-800 mb-3 flex items-center gap-2">
                            <span className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">1</span>
                            स्टेप 1: अंक चुनें
                          </h4>
                          <p className="text-blue-700 mb-4">
                            किस नंबर का पाना लगाना है आपको? / Which number patti do you want to play on?
                          </p>
                          
                          <div className="grid grid-cols-5 gap-3">
                            {[0,1,2,3,4,5,6,7,8,9].map((num) => (
                              <button
                                key={num}
                                className={`p-4 rounded-xl border-2 transition-all duration-300 text-xl font-bold aspect-square flex items-center justify-center ${
                                  selectedSingleDigit === num 
                                    ? 'border-blue-500 bg-blue-100 text-blue-800 shadow-lg' 
                                    : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50'
                                }`}
                                onClick={() => {
                                  setSelectedSingleDigit(num);
                                  setSelectedPannaList([]);
                                }}
                              >
                                <span className="font-bold text-xl">{num}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Step 2: Choose Panna */}
                        {selectedSingleDigit !== null && (
                          <div className="glass-card p-4 rounded-xl">
                            <h4 className="text-lg font-bold text-green-800 mb-3 flex items-center gap-2">
                              <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">2</span>
                              स्टेप 2: पाना चुनें
                            </h4>
                            <p className="text-green-700 mb-4">
                              अंक {selectedSingleDigit} के लिए पाना चुनें
                            </p>
                            
                            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-64 overflow-y-auto p-2 border rounded-lg bg-white">
                              {pannaMapping[selectedSingleDigit].map((panna) => (
                                <button
                                  key={panna}
                                  className={`p-2 rounded-lg border-2 transition-all duration-200 text-sm font-bold ${
                                    selectedPannaList.includes(panna) 
                                      ? 'border-green-500 bg-green-100 text-green-800' 
                                      : 'border-gray-200 bg-white hover:border-green-300 hover:bg-green-50'
                                  }`}
                                  onClick={() => {
                                    if (selectedPannaList.includes(panna)) {
                                      setSelectedPannaList(prev => prev.filter(p => p !== panna));
                                    } else {
                                      setSelectedPannaList(prev => [...prev, panna]);
                                    }
                                  }}
                                >
                                  {panna}
                                </button>
                              ))}
                            </div>

                            {selectedPannaList.length > 0 && (
                              <div className="mt-4 p-3 bg-green-100 border border-green-200 rounded-lg">
                                <p className="text-green-800 font-semibold mb-2">
                                  Selected Pannas ({selectedPannaList.length}):
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {selectedPannaList.map((panna) => (
                                    <span 
                                      key={panna}
                                      className="bg-green-200 text-green-800 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2"
                                    >
                                      {panna}
                                      <button
                                        onClick={() => setSelectedPannaList(prev => prev.filter(p => p !== panna))}
                                        className="text-green-600 hover:text-green-800"
                                      >
                                        ×
                                      </button>
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Step 3: Choose Amount */}
                        {selectedPannaList.length > 0 && (
                          <div className="glass-card p-4 rounded-xl mb-4">
                            <h4 className="text-lg font-bold text-orange-800 mb-3 flex items-center gap-2">
                              <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">3</span>
                              अंतिम स्टेप: पैसे चुनें
                            </h4>
                            <p className="text-orange-700 mb-4">
                              कितने रुपये लगाना चाहते हैं? / How much money do you want to bet?
                            </p>
                            
                            <div className="grid grid-cols-4 gap-3">
                              {coinOptions.map((coin) => (
                                <Button
                                  key={coin}
                                  variant={betAmount === coin ? "default" : "outline"}
                                  className={`text-sm font-bold transition-all duration-300 ${
                                    betAmount === coin ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'hover:bg-orange-50 border-orange-300'
                                  }`}
                                  onClick={() => setBetAmount(coin)}
                                >
                                  ₹{coin}
                                </Button>
                              ))}
                            </div>
                            
                            <div className="mt-4 p-3 bg-orange-100 border border-orange-200 rounded-lg">
                              <div className="text-sm text-orange-800">
                                <p className="font-semibold">Total Bet: ₹{betAmount * selectedPannaList.length}</p>
                                <p className="text-xs">({selectedPannaList.length} pannas × ₹{betAmount})</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {selectedMatkaType === 'double-panna' && (
                      <div className="space-y-4 mb-2 flex flex-col justify-start">
                        {/* Step 1: Choose Digit */}
                        <div className="glass-card p-4 rounded-xl">
                          <h4 className="text-lg font-bold text-red-800 mb-3 flex items-center gap-2">
                            <span className="bg-gradient-to-r from-red-500 to-orange-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">1</span>
                            डबल अंक चुनें
                          </h4>
                          <p className="text-gray-700 mb-4">
                            किस नंबर का डबल पाना लगाना है?
                          </p>
                          
                          <div className="grid grid-cols-5 gap-3">
                            {[0,1,2,3,4,5,6,7,8,9].map((num) => (
                              <button
                                key={num}
                                className={`p-4 rounded-xl border-2 transition-all duration-300 text-xl font-bold aspect-square flex items-center justify-center ${
                                  selectedDoubleDigit === num 
                                    ? 'border-red-500 bg-red-100 text-red-800 shadow-lg' 
                                    : 'border-gray-200 bg-white hover:border-red-300 hover:bg-red-50'
                                }`}
                                onClick={() => {
                                  setSelectedDoubleDigit(num);
                                  setSelectedDoublePannaList([]);
                                }}
                              >
                                {num}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Step 2: Choose Double Panna */}
                        {selectedDoubleDigit !== null && (
                          <div className="glass-card p-4 rounded-xl">
                            <h4 className="text-lg font-bold text-orange-800 mb-3 flex items-center gap-2">
                              <span className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">2</span>
                              डबल पाना चुनें
                            </h4>
                            <p className="text-gray-700 mb-4">
                              अंक {selectedDoubleDigit} के लिए डबल पाना चुनें
                            </p>
                            
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-64 overflow-y-auto p-2 border rounded-lg bg-white">
                              {doublePannaMapping[selectedDoubleDigit].map((panna) => (
                                <button
                                  key={panna}
                                  className={`p-2 rounded-lg border-2 transition-all duration-200 text-sm font-bold ${
                                    selectedDoublePannaList.includes(panna) 
                                      ? 'border-orange-500 bg-orange-100 text-orange-800' 
                                      : 'border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-50'
                                  }`}
                                  onClick={() => {
                                    if (selectedDoublePannaList.includes(panna)) {
                                      setSelectedDoublePannaList(prev => prev.filter(p => p !== panna));
                                    } else {
                                      setSelectedDoublePannaList(prev => [...prev, panna]);
                                    }
                                  }}
                                >
                                  {panna}
                                </button>
                              ))}
                            </div>

                            {selectedDoublePannaList.length > 0 && (
                              <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                                <p className="text-orange-800 font-semibold mb-2">
                                  Selected Double Pannas ({selectedDoublePannaList.length}):
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {selectedDoublePannaList.map((panna) => (
                                    <span 
                                      key={panna}
                                      className="bg-orange-200 text-orange-800 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2"
                                    >
                                      {panna}
                                      <button
                                        onClick={() => setSelectedDoublePannaList(prev => prev.filter(p => p !== panna))}
                                        className="text-orange-600 hover:text-orange-800"
                                      >
                                        ×
                                      </button>
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Step 3: Choose Amount */}
                        {selectedDoublePannaList.length > 0 && (
                          <div className="glass-card p-4 rounded-xl mb-4">
                            <h4 className="text-lg font-bold text-yellow-800 mb-3 flex items-center gap-2">
                              <span className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">3</span>
                              पैसे चुनें
                            </h4>
                            <p className="text-gray-700 mb-4">
                              कितने रुपये लगाना चाहते हैं?
                            </p>
                            
                            <div className="grid grid-cols-4 gap-3">
                              {coinOptions.map((coin) => (
                                <Button
                                  key={coin}
                                  variant={betAmount === coin ? "default" : "outline"}
                                  className={`text-sm font-bold transition-all duration-300 ${
                                    betAmount === coin ? 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white' : 'hover:bg-yellow-50 border-yellow-300'
                                  }`}
                                  onClick={() => setBetAmount(coin)}
                                >
                                  ₹{coin}
                                </Button>
                              ))}
                            </div>
                            
                            <div className="mt-4 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg">
                              <div className="text-sm text-orange-800">
                                <p className="font-semibold">Total Bet: ₹{betAmount * selectedDoublePannaList.length}</p>
                                <p className="text-xs">({selectedDoublePannaList.length} double pannas × ₹{betAmount})</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {selectedMatkaType === 'triple-panna' && (
                      <div className="space-y-4 mb-6">
                        {/* Step 1: Choose Digit */}
                        <div className="glass-card p-4 rounded-xl">
                          <h4 className="text-lg font-bold text-purple-800 mb-3 flex items-center gap-2">
                            <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">1</span>
                            एक अंक चुनें
                          </h4>
                          <p className="text-gray-700 mb-4">
                            कोई भी एक अंक चुनें (0-9) - यह तीन बार दोहराया जाएगा
                          </p>
                          
                          <div className="grid grid-cols-5 gap-3">
                            {[0,1,2,3,4,5,6,7,8,9].map((digit) => (
                              <button
                                key={digit}
                                className={`p-4 rounded-xl border-2 transition-all duration-300 text-xl font-bold aspect-square flex items-center justify-center ${
                                  selectedTripleDigit === digit 
                                    ? 'border-purple-500 bg-purple-100 text-purple-800' 
                                    : 'border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50'
                                }`}
                                onClick={() => {
                                  setSelectedTripleDigit(digit);
                                  setSelectedTriplePanna(triplePannaMapping[digit]);
                                }}
                              >
                                {digit}
                              </button>
                            ))}
                          </div>

                          {selectedTripleDigit !== null && (
                            <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                              <p className="text-purple-800 font-semibold mb-2">
                                Selected Digit: {selectedTripleDigit}
                              </p>
                              <p className="text-purple-700 text-sm">
                                Triple Panna: {selectedTriplePanna}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Step 2: Confirm Selection */}
                        {selectedTripleDigit !== null && (
                          <div className="glass-card p-4 rounded-xl">
                            <h4 className="text-lg font-bold text-purple-800 mb-3 flex items-center gap-2">
                              <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">2</span>
                              अपना चुनाव देखें
                            </h4>
                            <p className="text-gray-700 mb-4">
                              आपका ट्रिपल पन्ना: <span className="font-bold text-purple-800 text-xl">{selectedTriplePanna}</span>
                            </p>
                            
                            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
                              <div className="text-center">
                                <div className="text-3xl font-bold text-purple-800 mb-2">{selectedTriplePanna}</div>
                                <div className="text-sm text-purple-600">
                                  अंक {selectedTripleDigit} का ट्रिपल पन्ना
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Step 3: Choose Amount */}
                        {selectedTripleDigit !== null && (
                          <div className="glass-card p-4 rounded-xl mb-4">
                            <h4 className="text-lg font-bold text-purple-800 mb-3 flex items-center gap-2">
                              <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">3</span>
                              पैसे चुनें
                            </h4>
                            <p className="text-gray-700 mb-4">
                              कितने रुपये लगाना चाहते हैं?
                            </p>
                            
                            <div className="grid grid-cols-4 gap-3">
                              {coinOptions.map((coin) => (
                                <Button
                                  key={coin}
                                  variant={betAmount === coin ? "default" : "outline"}
                                  className={`text-sm font-bold transition-all duration-300 ${
                                    betAmount === coin ? 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white' : 'hover:bg-purple-50 border-purple-300'
                                  }`}
                                  onClick={() => setBetAmount(coin)}
                                >
                                  ₹{coin}
                                </Button>
                              ))}
                            </div>
                            
                            <div className="mt-4 p-3 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg">
                              <div className="text-sm text-purple-800">
                                <p className="font-semibold">Total Bet: ₹{betAmount}</p>
                                <p className="text-xs">Triple Panna: {selectedTriplePanna}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {selectedMatkaType === 'half-sangam' && (
                      <div className="space-y-4 mb-2">
                        {/* Step 1: Choose Sangam Type */}
                        <div className="glass-card p-4 rounded-xl">
                          <h4 className="text-lg font-bold text-teal-800 mb-3 flex items-center gap-2">
                            <span className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">1</span>
                            Half Sangam Type चुनें
                          </h4>
                          <p className="text-gray-700 mb-4">
                            कौन सा Half Sangam खेलना चाहते हैं?
                          </p>
                          
                          <div className="grid grid-cols-1 gap-3">
                            <button
                              className={`p-4 rounded-xl border-2 transition-all duration-300 text-center ${
                                halfSangamType === 'open-ank-close-patti' 
                                  ? 'border-teal-500 bg-teal-100 text-teal-800' 
                                  : 'border-gray-200 bg-white hover:border-teal-300 hover:bg-teal-50'
                              }`}
                              onClick={() => setHalfSangamType('open-ank-close-patti')}
                            >
                              <div className="font-bold text-lg">Open Ank + Close Patti</div>
                              <div className="text-sm text-gray-600">पहले Open Ank फिर Close Patti</div>
                            </button>
                            
                            <button
                              className={`p-4 rounded-xl border-2 transition-all duration-300 text-center ${
                                halfSangamType === 'close-ank-open-patti' 
                                  ? 'border-teal-500 bg-teal-100 text-teal-800' 
                                  : 'border-gray-200 bg-white hover:border-teal-300 hover:bg-teal-50'
                              }`}
                              onClick={() => setHalfSangamType('close-ank-open-patti')}
                            >
                              <div className="font-bold text-lg">Close Ank + Open Patti</div>
                              <div className="text-sm text-gray-600">पहले Close Ank फिर Open Patti</div>
                            </button>
                          </div>
                        </div>

                        {/* Step 2: Input based on selected type */}
                        {halfSangamType === 'open-ank-close-patti' && (
                          <div className="glass-card p-4 rounded-xl">
                            <h4 className="text-lg font-bold text-teal-800 mb-3 flex items-center gap-2">
                              <span className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">2</span>
                              Open Ank + Close Patti भरें
                            </h4>
                            
                            <div className="space-y-4">
                              {/* Open Ank Selection */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Open Ank (0-9)</label>
                                <div className="grid grid-cols-5 gap-2">
                                  {[0,1,2,3,4,5,6,7,8,9].map((digit) => (
                                    <button
                                      key={digit}
                                      className={`p-3 rounded-lg border-2 transition-all duration-300 text-lg font-bold aspect-square flex items-center justify-center ${
                                        openAnk === digit 
                                          ? 'border-teal-500 bg-teal-100 text-teal-800' 
                                          : 'border-gray-200 bg-white hover:border-teal-300 hover:bg-teal-50'
                                      }`}
                                      onClick={() => setOpenAnk(digit)}
                                    >
                                      {digit}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Close Patti Input */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Close Patti (3 अंक)</label>
                                <input
                                  type="text"
                                  maxLength={3}
                                  placeholder="123"
                                  className="w-full p-3 rounded-xl border-2 border-gray-200 focus:border-teal-500 text-center text-lg font-bold"
                                  value={closePatti}
                                  onChange={(e) => {
                                    const value = e.target.value.replace(/[^0-9]/g, '');
                                    if (value.length <= 3) {
                                      setClosePatti(value);
                                    }
                                  }}
                                />
                                <p className="text-xs text-gray-500 mt-1">केवल 3 अंक डालें (जैसे 123)</p>
                              </div>

                              {/* Display Selection */}
                              {openAnk !== null && closePatti.length === 3 && (
                                <div className="mt-4 p-3 bg-teal-50 border border-teal-200 rounded-lg">
                                  <p className="text-teal-800 font-semibold text-center">
                                    आपका Half Sangam: <span className="text-xl">{openAnk} + {closePatti}</span>
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {halfSangamType === 'close-ank-open-patti' && (
                          <div className="glass-card p-4 rounded-xl">
                            <h4 className="text-lg font-bold text-teal-800 mb-3 flex items-center gap-2">
                              <span className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">2</span>
                              Close Ank + Open Patti भरें
                            </h4>
                            
                            <div className="space-y-4">
                              {/* Close Ank Selection */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Close Ank (0-9)</label>
                                <div className="grid grid-cols-5 gap-2">
                                  {[0,1,2,3,4,5,6,7,8,9].map((digit) => (
                                    <button
                                      key={digit}
                                      className={`p-3 rounded-lg border-2 transition-all duration-300 text-lg font-bold aspect-square flex items-center justify-center ${
                                        closeAnk === digit 
                                          ? 'border-teal-500 bg-teal-100 text-teal-800' 
                                          : 'border-gray-200 bg-white hover:border-teal-300 hover:bg-teal-50'
                                      }`}
                                      onClick={() => setCloseAnk(digit)}
                                    >
                                      {digit}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Open Patti Input */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Open Patti (3 अंक)</label>
                                <input
                                  type="text"
                                  maxLength={3}
                                  placeholder="456"
                                  className="w-full p-3 rounded-xl border-2 border-gray-200 focus:border-teal-500 text-center text-lg font-bold"
                                  value={openPatti}
                                  onChange={(e) => {
                                    const value = e.target.value.replace(/[^0-9]/g, '');
                                    if (value.length <= 3) {
                                      setOpenPatti(value);
                                    }
                                  }}
                                />
                                <p className="text-xs text-gray-500 mt-1">केवल 3 अंक डालें (जैसे 456)</p>
                              </div>

                              {/* Display Selection */}
                              {closeAnk !== null && openPatti.length === 3 && (
                                <div className="mt-4 p-3 bg-teal-50 border border-teal-200 rounded-lg">
                                  <p className="text-teal-800 font-semibold text-center">
                                    आपका Half Sangam: <span className="text-xl">{closeAnk} + {openPatti}</span>
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Step 3: Choose Amount */}
                        {((halfSangamType === 'open-ank-close-patti' && openAnk !== null && closePatti.length === 3) || 
                          (halfSangamType === 'close-ank-open-patti' && closeAnk !== null && openPatti.length === 3)) && (
                          <div className="glass-card p-4 rounded-xl mb-4">
                            <h4 className="text-lg font-bold text-teal-800 mb-3 flex items-center gap-2">
                              <span className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">3</span>
                              पैसे चुनें
                            </h4>
                            <p className="text-gray-700 mb-4">
                              कितने रुपये लगाना चाहते हैं?
                            </p>
                            
                            <div className="grid grid-cols-4 gap-3">
                              {coinOptions.map((coin) => (
                                <Button
                                  key={coin}
                                  variant={betAmount === coin ? "default" : "outline"}
                                  className={`text-sm font-bold transition-all duration-300 ${
                                    betAmount === coin ? 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white' : 'hover:bg-teal-50 border-teal-300'
                                  }`}
                                  onClick={() => setBetAmount(coin)}
                                >
                                  ₹{coin}
                                </Button>
                              ))}
                            </div>
                            
                            <div className="mt-4 p-3 bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200 rounded-lg">
                              <div className="text-sm text-teal-800">
                                <p className="font-semibold">Total Bet: ₹{betAmount}</p>
                                <p className="text-xs">
                                  {halfSangamType === 'open-ank-close-patti' ? 
                                    `Open Ank: ${openAnk}, Close Patti: ${closePatti}` :
                                    `Close Ank: ${closeAnk}, Open Patti: ${openPatti}`
                                  }
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {selectedMatkaType === 'full-sangam' && (
                      <div className="space-y-4 mb-2">
                        {/* All inputs in one card */}
                        <div className="glass-card p-4 rounded-xl">
                          <h4 className="text-lg font-bold text-indigo-800 mb-3 flex items-center gap-2">
                            <span className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">1</span>
                            Full Sangam भरें
                          </h4>
                          <p className="text-gray-700 mb-4">
                            दो पत्ती + एक जोड़ी का कॉम्बिनेशन भरें
                          </p>
                          
                          <div className="space-y-4">
                            {/* Open Patti */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Open Patti (3 अंक)</label>
                              <input
                                type="text"
                                maxLength={3}
                                placeholder="123"
                                className="w-full p-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 text-center text-lg font-bold"
                                value={fullSangamOpenPatti}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/[^0-9]/g, '');
                                  if (value.length <= 3) {
                                    setFullSangamOpenPatti(value);
                                  }
                                }}
                              />
                              <p className="text-xs text-gray-500 mt-1">केवल 3 अंक डालें (जैसे 123)</p>
                            </div>

                            {/* Close Patti */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Close Patti (3 अंक)</label>
                              <input
                                type="text"
                                maxLength={3}
                                placeholder="456"
                                className="w-full p-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 text-center text-lg font-bold"
                                value={fullSangamClosePatti}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/[^0-9]/g, '');
                                  if (value.length <= 3) {
                                    setFullSangamClosePatti(value);
                                  }
                                }}
                              />
                              <p className="text-xs text-gray-500 mt-1">केवल 3 अंक डालें (जैसे 456)</p>
                            </div>

                            {/* Display Complete Selection with Auto-calculated Jodi */}
                            {fullSangamOpenPatti.length === 3 && fullSangamClosePatti.length === 3 && (
                              <div className="mt-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                                <p className="text-indigo-800 font-semibold text-center">
                                  आपका Full Sangam: 
                                  <span className="text-xl block mt-1 font-bold text-indigo-900">
                                    {fullSangamOpenPatti}-{calculateJodiFromPatti(fullSangamOpenPatti, fullSangamClosePatti)}-{fullSangamClosePatti}
                                  </span>
                                </p>
                                <div className="text-xs text-indigo-600 mt-2 text-center">
                                  <p>Open: {fullSangamOpenPatti} → {fullSangamOpenPatti.split('').reduce((sum, digit) => sum + parseInt(digit), 0) % 10}</p>
                                  <p>Close: {fullSangamClosePatti} → {fullSangamClosePatti.split('').reduce((sum, digit) => sum + parseInt(digit), 0) % 10}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Choose Amount */}
                        {fullSangamOpenPatti.length === 3 && fullSangamClosePatti.length === 3 && (
                          <div className="glass-card p-4 rounded-xl mb-4">
                            <h4 className="text-lg font-bold text-indigo-800 mb-3 flex items-center gap-2">
                              <span className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">2</span>
                              पैसे चुनें
                            </h4>
                            <p className="text-gray-700 mb-4">
                              कितने रुपये लगाना चाहते हैं? (High Risk, High Reward!)
                            </p>
                            
                            <div className="grid grid-cols-4 gap-3">
                              {coinOptions.map((coin) => (
                                <Button
                                  key={coin}
                                  variant={betAmount === coin ? "default" : "outline"}
                                  className={`text-sm font-bold transition-all duration-300 ${
                                    betAmount === coin ? 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white' : 'hover:bg-indigo-50 border-indigo-300'
                                  }`}
                                  onClick={() => setBetAmount(coin)}
                                >
                                  ₹{coin}
                                </Button>
                              ))}
                            </div>
                            
                            <div className="mt-4 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg">
                              <div className="text-sm text-indigo-800">
                                <p className="font-semibold">Total Bet: ₹{betAmount}</p>
                                <p className="text-xs">Full Sangam: {fullSangamOpenPatti}-{calculateJodiFromPatti(fullSangamOpenPatti, fullSangamClosePatti)}-{fullSangamClosePatti}</p>
                                <p className="text-xs font-bold text-green-600">Potential Win: ₹{(betAmount * 9500).toLocaleString()}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {selectedMatkaType === 'single-patti' && (
                      <div className="space-y-4 mb-2">
                        <h4 className="text-lg font-bold text-red-800 mb-3 flex items-center gap-2">
                          <span className="text-2xl">🎯</span>
                          Choose Single Ank (0-9) / एक अंक चुनें (0-9)
                        </h4>
                        
                        <div className="grid grid-cols-5 gap-3">
                          {[0,1,2,3,4,5,6,7,8,9].map((num) => (
                            <button
                              key={num}
                              className={`p-4 rounded-xl border-2 transition-all duration-300 text-xl font-bold aspect-square flex items-center justify-center ${
                                selectedNumbers.includes(num) 
                                  ? 'border-red-500 bg-red-100 text-red-800' 
                                  : 'border-gray-200 bg-white hover:border-red-300 hover:bg-red-50'
                              }`}
                              onClick={() => {
                                if (selectedNumbers.includes(num)) {
                                  setSelectedNumbers(prev => prev.filter(n => n !== num));
                                } else {
                                  setSelectedNumbers(prev => [...prev, num]);
                                }
                              }}
                            >
                              {num}
                            </button>
                          ))}
                        </div>

                        {selectedNumbers.length > 0 && (
                          <div className="glass-card p-4 bg-green-50 border border-green-200">
                            <p className="text-green-800 font-semibold mb-2">
                              Selected Numbers ({selectedNumbers.length}):
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {selectedNumbers.map((num) => (
                                <span 
                                  key={num}
                                  className="bg-green-200 text-green-800 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2"
                                >
                                  {num}
                                  <button
                                    onClick={() => setSelectedNumbers(prev => prev.filter(n => n !== num))}
                                    className="text-green-600 hover:text-green-800"
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {selectedMatkaType === 'jodi-digit' && (
                      <div className="space-y-4 mb-2">
                        {/* Quick number input */}
                        <div className="mb-4">
                          <input
                            type="number"
                            min="0"
                            max="99"
                            placeholder="Quick add Jodi (00-99)"
                            className="w-full p-3 rounded-xl border-2 border-gray-200 focus:border-red-500 text-center text-lg font-bold"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                const val = parseInt(e.target.value);
                                if (val >= 0 && val <= 99) {
                                  if (!selectedNumbers.includes(val)) {
                                    setSelectedNumbers(prev => [...prev, val]);
                                  }
                                  e.target.value = '';
                                }
                              }
                            }}
                          />
                          <p className="text-xs text-gray-500 mt-1 text-center">Type a number and press Enter to add</p>
                        </div>

                        {/* All Jodi pairs grid */}
                        <div className="border rounded-xl p-3 bg-gray-50">
                          <div className="grid grid-cols-10 gap-1.5">
                            {Array.from({length: 100}, (_, i) => i).map((num) => (
                              <button
                                key={num}
                                className={`p-1.5 rounded-md border transition-all duration-200 text-xs font-bold min-h-[32px] ${
                                  selectedNumbers.includes(num) 
                                    ? 'border-red-500 bg-red-100 text-red-800' 
                                    : 'border-gray-200 bg-white hover:border-red-300 hover:bg-red-50'
                                }`}
                                onClick={() => {
                                  if (selectedNumbers.includes(num)) {
                                    setSelectedNumbers(prev => prev.filter(n => n !== num));
                                  } else {
                                    setSelectedNumbers(prev => [...prev, num]);
                                  }
                                }}
                              >
                                {num.toString().padStart(2, '0')}
                              </button>
                            ))}
                          </div>
                        </div>

                        {selectedNumbers.length > 0 && (
                          <div className="glass-card p-4 bg-green-50 border border-green-200">
                            <p className="text-green-800 font-semibold mb-2">
                              Selected Jodis ({selectedNumbers.length}):
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {selectedNumbers.map((num) => (
                                <span 
                                  key={num}
                                  className="bg-green-200 text-green-800 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2"
                                >
                                  {num.toString().padStart(2, '0')}
                                  <button
                                    onClick={() => setSelectedNumbers(prev => prev.filter(n => n !== num))}
                                    className="text-green-600 hover:text-green-800"
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    

                    {/* Bet Amount Selection - Only for single-patti and jodi-digit types */}
                    {(selectedMatkaType === 'single-patti' || selectedMatkaType === 'jodi-digit') && (
                      <>
                        <h4 className="text-lg font-bold text-red-800 mb-3">Select Bet Amount</h4>
                        <div className="grid grid-cols-3 gap-3 mb-2">
                          {coinOptions.map((coin) => (
                            <Button
                              key={coin}
                              variant={betAmount === coin ? "default" : "outline"}
                              className={`aspect-square text-sm font-bold transition-all duration-300 rounded-full ${
                                betAmount === coin ? 'bg-red-500 hover:bg-red-600' : 'hover:glass-primary'
                              }`}
                              onClick={() => setBetAmount(coin)}
                            >
                              ₹{coin}
                            </Button>
                          ))}
                        </div>

                        {/* Custom Amount */}
                        <div className="mb-2">
                          <input
                            type="number"
                            min="10"
                            placeholder="Custom Amount (Min ₹10)"
                            className="w-full p-3 rounded-xl border-2 border-gray-200 focus:border-red-500"
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              if (val >= 10) setBetAmount(val);
                            }}
                          />
                        </div>
                      </>
                    )}

                    {/* Game Controls */}
                    <div className="space-y-3">
                      <Button 
                        size="lg"
                        className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-bold py-4 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 rounded-full"
                        disabled={
                          (selectedMatkaType === 'single-patti' && selectedNumbers.length === 0) ||
                          (selectedMatkaType === 'jodi-digit' && selectedNumbers.length === 0) ||
                          (selectedMatkaType === 'single-panna' && selectedPannaList.length === 0) ||
                          (selectedMatkaType === 'double-panna' && selectedDoublePannaList.length === 0) ||
                          (selectedMatkaType === 'triple-panna' && (selectedTripleDigit === null || !selectedTriplePanna)) ||
                          (selectedMatkaType === 'half-sangam' && (
                            !halfSangamType || 
                            (halfSangamType === 'open-ank-close-patti' && (openAnk === null || closePatti.length !== 3)) ||
                            (halfSangamType === 'close-ank-open-patti' && (closeAnk === null || openPatti.length !== 3))
                          )) ||
                          (selectedMatkaType === 'full-sangam' && (fullSangamOpenPatti.length !== 3 || fullSangamClosePatti.length !== 3)) ||
                          (selectedMatkaType?.includes('panna') && selectedMatkaType !== 'single-panna' && selectedMatkaType !== 'double-panna' && selectedMatkaType !== 'triple-panna' && selectedMatkaType !== 'full-sangam' && !selectedPanna) ||
                          !betAmount
                        }
                        onClick={() => setShowConfirmDialog(true)}
                      >
                        <Play className="h-5 w-5 mr-2" />
                        Place Bet
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        size="lg"
                        className="w-full glass-card hover:glass-primary transition-all duration-300 rounded-full"
                        onClick={() => {
                          setSelectedNumbers([]);
                          setSelectedPanna("");
                          setSelectedSingleDigit(null);
                          setSelectedPannaList([]);
                          setSelectedDoubleDigit(null);
                          setSelectedDoublePannaList([]);
                          setSelectedTripleDigit(null);
                          setSelectedTriplePanna('');
                          // Reset Half Sangam states
                          setHalfSangamType(null);
                          setOpenAnk(null);
                          setClosePatti('');
                          setCloseAnk(null);
                          setOpenPatti('');
                          setBetAmount(10);
                        }}
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Reset Selection
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        size="lg"
                        onClick={handleBackToMatkaTypes}
                        className="w-full glass-card hover:glass-primary transition-all duration-300 rounded-full"
                      >
                        ← Back to Betting Types
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Bet Summary & Info */}
                <div className="space-y-4">
                  {/* Current Bet Info */}
                  <div className="glass-accent p-6">
                    <h3 className="text-lg font-bold text-red-800 mb-4">Bet Summary</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-red-700">Type:</span>
                        <span className="font-bold text-red-800">
                          {matkaOptions.find(o => o.id === selectedMatkaType)?.title}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-red-700">Selection:</span>
                        <span className="font-bold text-red-800">
                          {selectedMatkaType === 'single-patti' && selectedNumbers.length > 0 ? selectedNumbers.join(', ') :
                           selectedMatkaType === 'jodi-digit' && selectedNumbers.length > 0 ? selectedNumbers.map(n => n.toString().padStart(2, '0')).join(', ') :
                           selectedMatkaType === 'single-panna' && selectedPannaList.length > 0 ? selectedPannaList.join(', ') :
                           selectedMatkaType === 'double-panna' && selectedDoublePannaList.length > 0 ? selectedDoublePannaList.join(', ') :
                           selectedMatkaType === 'triple-panna' && selectedTriplePanna ? selectedTriplePanna :
                           selectedMatkaType === 'half-sangam' && halfSangamType ? 
                             (halfSangamType === 'open-ank-close-patti' && openAnk !== null && closePatti ? `${openAnk} + ${closePatti}` :
                              halfSangamType === 'close-ank-open-patti' && closeAnk !== null && openPatti ? `${closeAnk} + ${openPatti}` : 'None') :
                           selectedMatkaType === 'full-sangam' && fullSangamOpenPatti && fullSangamClosePatti ? 
                             `${fullSangamOpenPatti}-${calculateJodiFromPatti(fullSangamOpenPatti, fullSangamClosePatti)}-${fullSangamClosePatti}` :
                           selectedPanna || 'None'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-red-700">Bet:</span>
                        <span className="font-bold text-red-800">
                          ₹{calculateTotalAmount()}
                          {(selectedMatkaType === 'single-patti' || selectedMatkaType === 'jodi-digit') && selectedNumbers.length > 1 && 
                            <span className="text-xs text-gray-600 ml-1">({selectedNumbers.length} × ₹{betAmount})</span>
                          }
                          {selectedMatkaType === 'single-panna' && selectedPannaList.length > 1 && 
                            <span className="text-xs text-gray-600 ml-1">({selectedPannaList.length} × ₹{betAmount})</span>
                          }
                          {selectedMatkaType === 'double-panna' && selectedDoublePannaList.length > 1 && 
                            <span className="text-xs text-gray-600 ml-1">({selectedDoublePannaList.length} × ₹{betAmount})</span>
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-red-700">Rate:</span>
                        <span className="font-bold text-orange-600">
                          {matkaOptions.find(o => o.id === selectedMatkaType)?.rate}
                        </span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="text-red-700">Potential Win:</span>
                        <span className="font-bold text-green-600">
                          ₹{(() => {
                            const option = matkaOptions.find(o => o.id === selectedMatkaType);
                            if (!option) return 0;
                            const rate = parseFloat(option.rate.split(':')[1]);
                            // For single-patti and jodi-digit, win amount is per number, not total bet
                            if (selectedMatkaType === 'single-patti' || selectedMatkaType === 'jodi-digit') {
                              return (betAmount * rate).toFixed(2);
                            }
                            const totalAmount = calculateTotalAmount();
                            return (totalAmount * rate).toFixed(2);
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Game Rules */}
                  <div className="glass-card p-4 mb-0">
                    <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <Star className="h-5 w-5" />
                      Game Rules
                    </h3>
                    <div className="space-y-2 text-sm text-gray-600">
                      {selectedMatkaType === 'single-patti' && (
                        <p>• Pick any single digit from 0-9<br/>• If your number matches the result, you win 9.5x your bet<br/>• Multiple selections: each winning number pays 9.5x individually</p>
                      )}
                      {selectedMatkaType === 'jodi-digit' && (
                        <p>• Pick any two digit combination from 00-99<br/>• If your jodi matches the result, you win 95x your bet</p>
                      )}
                      {selectedMatkaType === 'triple-panna' && (
                        <p>• Pick any single digit (0-9) for triple panna<br/>• Digit is converted to triple form (e.g., 1→777, 2→444)<br/>• Extremely high payout: 950x your bet if you win</p>
                      )}
                      {selectedMatkaType === 'half-sangam' && (
                        <p>• Choose Half Sangam combination: Open Ank + Close Patti OR Close Ank + Open Patti<br/>• Very high payout: 1425x your bet if you win<br/>• Example: Open Ank 5 + Close Patti 123 = 5-123</p>
                      )}
                      {selectedMatkaType?.includes('panna') && selectedMatkaType !== 'triple-panna' && (
                        <p>• Pick three digit combinations<br/>• Higher payouts for rarer combinations<br/>• Check panna charts for guidance</p>
                      )}
                      {selectedMatkaType === 'full-sangam' && (
                        <p>• Full combination betting with extremely high risk/reward<br/>• Requires multiple number selections<br/>• Highest payout: 9500x your bet for correct guess</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>)
        ) : selectedGame === "color-king" ? (
          // Color King Game
          (<div className="w-full h-full bg-gradient-to-br from-white via-purple-50/20 to-pink-50/40 relative">
            <div className="floating-orb floating-orb-1" style={{background: 'linear-gradient(45deg, rgba(147, 51, 234, 0.4), rgba(236, 72, 153, 0.4))'}}></div>
            <div className="floating-orb floating-orb-2" style={{background: 'linear-gradient(135deg, rgba(126, 34, 206, 0.5), rgba(219, 39, 119, 0.5))'}}></div>
            <div className="floating-orb floating-orb-3" style={{background: 'linear-gradient(225deg, rgba(168, 85, 247, 0.6), rgba(244, 114, 182, 0.6))'}}></div>
            <div className="w-full max-w-4xl mx-auto relative z-10 px-2 py-2">
              <div className="text-center mb-6">
                <div className="glass-card inline-block p-4 rounded-full mb-4">
                  <Palette className="h-12 w-12 text-purple-600" />
                </div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gradient-primary mb-3 sm:mb-4 px-4">
                  Color King Game / कलर किंग गेम
                </h2>
                <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-2xl mx-auto px-4">
                  रंग चुनें और बड़ी जीत पाएं! / Select colors and bet amount to win big! Round #{currentRound}
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
                {/* Color Selection */}
                <div className="lg:col-span-2 w-full">
                  {/* Countdown Timer */}
                  <div className="glass-accent p-4 text-center mb-4">
                    <div className="text-3xl sm:text-4xl font-bold text-orange-600 mb-1">{formatTimer(colorKingTimer)}</div>
                    <p className="text-orange-700 text-sm">
                      {colorKingTimer <= 30 ? 'बेटिंग बंद / Betting Closed' : 'समय बाकी / Time Remaining'}
                    </p>
                  </div>

                  <div className="glass-card p-4 w-full">
                    <h3 className="text-lg font-bold text-orange-800 mb-3 flex items-center gap-2">
                      <Palette className="h-5 w-5" />
                      Select Colors / रंग चुनें
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {colorOptions.map((color) => (
                        <button
                          key={color.id}
                          className={`glass-card p-3 rounded-xl border-2 transition-all duration-300 ${
                            selectedColors.includes(color.id) 
                              ? 'border-orange-500 glass-primary' 
                              : 'border-transparent hover:border-orange-300'
                          } ${colorKingTimer <= 30 ? 'opacity-50 cursor-not-allowed' : ''}`}
                          onClick={() => {
                            if (colorKingTimer > 30) {
                              setSelectedColors(prev => 
                                prev.includes(color.id) 
                                  ? prev.filter(c => c !== color.id)
                                  : [...prev, color.id]
                              );
                            }
                          }}
                          disabled={colorKingTimer < 30}
                        >
                          <div className={`w-16 h-16 ${color.color} rounded-full mx-auto mb-3 shadow-lg transform transition-transform duration-200 ${selectedColors.includes(color.id) ? 'scale-110' : 'hover:scale-105'}`}></div>
                          <span className="font-bold text-gray-800 text-sm text-center">{color.name}</span>
                        </button>
                      ))}
                    </div>

                    {/* Coin Selection */}
                    <h4 className="text-lg font-bold text-orange-800 mb-3">Select Bet Amount / बेट राशि चुनें</h4>
                    <div className="grid grid-cols-4 gap-2 mb-4">
                      {coinOptions.map((coin) => (
                        <Button
                          key={coin}
                          variant={selectedCoin === coin ? "default" : "outline"}
                          className={`aspect-square text-xs font-bold transition-all duration-300 rounded-full ${
                            selectedCoin === coin ? 'bg-orange-500 hover:bg-orange-600' : 'hover:glass-primary'
                          } ${colorKingTimer <= 30 ? 'opacity-50 cursor-not-allowed' : ''}`}
                          disabled={colorKingTimer <= 30}
                          onClick={() => setSelectedCoin(coin)}
                        >
                          ₹{coin}
                        </Button>
                      ))}
                    </div>

                    {/* Game Controls */}
                    <div className="space-y-3">
                      <Button 
                        size="lg"
                        className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 rounded-xl"
                        disabled={selectedColors.length === 0 || !selectedCoin || colorKingTimer <= 30}
                        onClick={startColorKingRound}
                      >
                        <Play className="h-5 w-5 mr-2" />
                        {colorKingTimer <= 30 ? 'बेटिंग बंद / Betting Closed' : isColorKingPlaying ? 'गेम चल रहा है...' : 'राउंड शुरू करें / Start Round'}
                      </Button>

                      
                      <Button 
                        variant="outline" 
                        size="lg"
                        className="w-full glass-card hover:glass-primary transition-all duration-300 rounded-full"
                        onClick={() => {
                          setSelectedColors([]);
                          setSelectedCoin(10);
                        }}
                        disabled={colorKingTimer < 30}
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        रीसेट करें / Reset
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        size="lg"
                        onClick={() => {
                          handleBackToGames();
                        }}
                        className="w-full glass-card hover:glass-primary transition-all duration-300 rounded-full"
                      >
                        ← वापस / Back to Games
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Game Status & Stats */}
                <div className="space-y-4">
                  {/* Current Bet Summary */}
                  {selectedColors.length > 0 && !isColorKingPlaying && !colorKingResult && (
                    <div className="glass-card p-4">
                      <h3 className="text-lg font-bold text-orange-800 mb-3 flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        बेट सारांश / Bet Summary
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Selected Colors:</span>
                          <span className="font-semibold">{selectedColors.length} colors</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Bet Amount:</span>
                          <span className="font-bold text-orange-600">₹{selectedCoin}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Risk:</span>
                          <span className="font-bold text-red-600">₹{selectedCoin * selectedColors.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Potential Win:</span>
                          <span className="font-bold text-green-600">₹{selectedCoin * 3} (3x)</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Game Result */}
                  {colorKingResult && (
                    <div className="glass-accent p-6 text-center">
                      <h3 className="text-lg font-bold text-orange-800 mb-3">राउंड परिणाम / Round Result</h3>
                      <div className={`w-20 h-20 mx-auto mb-4 rounded-full shadow-lg transform animate-bounce ${
                        colorKingResult === 'red' ? 'bg-red-500' :
                        colorKingResult === 'green' ? 'bg-green-500' :
                        colorKingResult === 'yellow' ? 'bg-yellow-500' : 'bg-blue-500'
                      }`}></div>
                      <p className="text-orange-700 capitalize font-bold text-lg">{colorKingResult === 'red' ? 'लाल / Red' : colorKingResult === 'green' ? 'हरा / Green' : colorKingResult === 'yellow' ? 'पीला / Yellow' : 'नीला / Blue'} Won!</p>
                      <p className="text-sm text-orange-600 mt-2 font-semibold">
                        {selectedColors.includes(colorKingResult) ? '🎉 आपकी जीत! / You Win!' : '😊 फिर कोशिश करें! / Try Again!'}
                      </p>
                    </div>
                  )}

                  {/* Live Betting History */}
                  <div className="glass-card p-4">
                    <h3 className="text-lg font-bold text-green-800 mb-3 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      लाइव बेट्स / Live Bets
                    </h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {liveBets && liveBets.length > 0 ? (
                        liveBets.map((bet: any, index: number) => (
                          <div key={bet.id || index} className="flex justify-between items-center text-xs bg-white/50 p-2 rounded">
                            <div className="flex-1">
                              <span className="font-semibold text-gray-800">{bet.userName}</span>
                              <div className="text-gray-600">
                                <span className="font-medium text-blue-600">{bet.selectedColors}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-orange-600">₹{bet.betAmount}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center p-4">
                          <p className="text-gray-500 text-sm">कोई बेट नहीं / No bets yet</p>
                          <p className="text-xs text-gray-400 mt-1">
                            Debug: {liveBets ? `${liveBets.length} bets loaded` : 'Loading...'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Last Results */}
                  <div className="glass-card p-4">
                    <h3 className="text-lg font-bold text-purple-800 mb-3 flex items-center gap-2">
                      <Trophy className="h-5 w-5" />
                      पिछले परिणाम / Last Results
                    </h3>
                    <div className="flex justify-center items-center gap-2 py-2 flex-wrap">
                      {colorKingResults && colorKingResults.length > 0 ? (
                        // Show last 10 results, latest first
                        colorKingResults.slice(0, 10).map((result: any, index: number) => (
                          <div
                            key={result.id || index}
                            className={`w-7 h-7 rounded-full border-2 border-white shadow-lg ${
                              result.winningColor === 'red' ? 'bg-red-500' :
                              result.winningColor === 'green' ? 'bg-green-500' :
                              result.winningColor === 'yellow' ? 'bg-yellow-500' : 
                              'bg-blue-500'
                            }`}
                            title={`Result: ${result.winningColor === 'red' ? 'लाल/Red' : result.winningColor === 'green' ? 'हरा/Green' : result.winningColor === 'yellow' ? 'पीला/Yellow' : 'नीला/Blue'}`}
                          />
                        ))
                      ) : (
                        // Placeholder when no results yet
                        Array.from({ length: 10 }).map((_, index) => (
                          <div
                            key={index}
                            className="w-7 h-7 rounded-full bg-gray-200 border-2 border-gray-300"
                          />
                        ))
                      )}
                    </div>
                    {colorKingResults && colorKingResults.length > 0 && (
                      <p className="text-xs text-gray-500 text-center mt-2">
                        नवीनतम परिणाम बाएं से / Latest results from left
                      </p>
                    )}
                  </div>

                  {/* Game Rules */}
                  <div className="glass-card p-4">
                    <h3 className="text-lg font-bold text-blue-800 mb-3 flex items-center gap-2">
                      <Star className="h-5 w-5" />
                      नियम / Game Rules
                    </h3>
                    <div className="space-y-2 text-xs text-gray-600">
                      <p>• 1 से 4 रंग चुनें / Select 1-4 colors</p>
                      <p>• सही रंग आने पर 3x जीत / Win 3x on correct color</p>
                      <p>• एक से ज्यादा रंग चुनने से जीतने की संभावना बढ़ती है</p>
                      <p>• Round duration: 2 minutes 30 seconds</p>
                    </div>
                  </div>

                  {/* Statistics */}
                  <div className="glass-card p-4">
                    <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <Trophy className="h-5 w-5" />
                      आंकड़े / Statistics
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">कुल राउंड / Total Rounds:</span>
                        <span className="font-bold">{currentRound - 1}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-600">जीत / Wins:</span>
                        <span className="font-bold text-green-700">{totalWins}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-red-600">हार / Losses:</span>
                        <span className="font-bold text-red-700">{totalLoses}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-orange-600">जीत दर / Win Rate:</span>
                        <span className="font-bold text-orange-700">
                          {currentRound > 1 ? Math.round((totalWins / (currentRound - 1)) * 100) : 0}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>)
        ) : (
          // Other Games Coming Soon
          (<div className="max-w-2xl mx-auto text-center">
            <div className="glass-card p-6 text-center">
              <div className="text-6xl mb-4">🚧</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {gameCards.find(g => g.id === selectedGame)?.title}
              </h2>
              <p className="text-gray-600 mb-4">
                This game is currently under development and will be available soon!
              </p>
              <Button 
                onClick={() => {
                  handleBackToGames();
                }}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-full"
              >
                ← Back to Games
              </Button>
            </div>
          </div>)
        )}
      </main>
      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="glass-card max-w-md w-full p-6 rounded-xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Confirm Your Bet</h3>
              <p className="text-gray-600">Are you sure you want to place this bet?</p>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Game:</span>
                <span className="font-semibold text-red-600">{selectedMatkaGame}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Type:</span>
                <span className="font-semibold">{matkaOptions.find(o => o.id === selectedMatkaType)?.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Selection:</span>
                <span className="font-semibold">
                  {selectedMatkaType === 'single-patti' && selectedNumbers.length > 0 ? selectedNumbers.join(', ') :
                   selectedMatkaType === 'jodi-digit' && selectedNumbers.length > 0 ? selectedNumbers.map(n => n.toString().padStart(2, '0')).join(', ') :
                   selectedPanna || 'None'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-semibold text-red-600">
                  ₹{calculateTotalAmount()}
                  {(selectedMatkaType === 'single-patti' || selectedMatkaType === 'jodi-digit') && selectedNumbers.length > 1 && 
                    <span className="text-xs text-gray-500 ml-1">({selectedNumbers.length} × ₹{betAmount})</span>
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Potential Win:</span>
                <span className="font-semibold text-green-600">
                  ₹{(() => {
                    const option = matkaOptions.find(o => o.id === selectedMatkaType);
                    if (!option) return 0;
                    const rate = parseFloat(option.rate.split(':')[1]);
                    // For single-patti and jodi-digit, win amount is per number, not total bet
                    if (selectedMatkaType === 'single-patti' || selectedMatkaType === 'jodi-digit') {
                      return (betAmount * rate).toFixed(2);
                    }
                    const totalAmount = calculateTotalAmount();
                    return (totalAmount * rate).toFixed(2);
                  })()}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowConfirmDialog(false)}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600"
                onClick={handlePlaceBet}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirm Bet
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Success Dialog */}
      {showSuccessDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="glass-card max-w-md w-full p-6 rounded-xl animate-in fade-in-0 scale-in-95 duration-300">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Bet Placed Successfully!</h3>
              <p className="text-gray-600 mb-4">Your bet has been submitted and is now pending.</p>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Game:</span>
                  <span className="font-semibold text-green-700">{lastBetData?.gameName}</span>
                </div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-semibold">{lastBetData?.typeName}</span>
                </div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Selection:</span>
                  <span className="font-semibold">{lastBetData?.selection}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-bold text-green-700">₹{lastBetData?.amount}</span>
                </div>
              </div>

              {/* Real-time User Data */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Your Balance:</span>
                  <span className="font-bold text-blue-700">₹{currentUser?.wallet_balance || 0}</span>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setLocation('/my-orders')}
                >
                  View Orders
                </Button>
                <Button
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                  onClick={() => setShowSuccessDialog(false)}
                >
                  Continue Playing
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Color Win Popup */}
      <Dialog open={showColorWinPopup} onOpenChange={setShowColorWinPopup}>
        <DialogContent className="max-w-md mx-auto glass-card border-none">
          <DialogHeader className="text-center">
            <DialogTitle className="text-2xl font-bold text-orange-800 mb-4">
              राउंड परिणाम / Round Result
            </DialogTitle>
          </DialogHeader>
          
          {winningColorData && (
            <div className="text-center space-y-6">
              {/* Winning Color Display */}
              <div className="relative">
                <div className={`w-32 h-32 mx-auto rounded-full shadow-2xl transform animate-pulse border-4 border-white ${
                  winningColorData.color === 'red' ? 'bg-red-500' :
                  winningColorData.color === 'green' ? 'bg-green-500' :
                  winningColorData.color === 'yellow' ? 'bg-yellow-500' : 'bg-blue-500'
                }`}>
                  <div className="absolute inset-0 rounded-full bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>
                
                {/* Color Name */}
                <div className="mt-4">
                  <h3 className="text-2xl font-bold text-orange-700 capitalize">
                    {winningColorData.color === 'red' ? 'लाल / Red' : 
                     winningColorData.color === 'green' ? 'हरा / Green' : 
                     winningColorData.color === 'yellow' ? 'पीला / Yellow' : 'नीला / Blue'} 
                    <span className="text-orange-600"> Won!</span>
                  </h3>
                </div>
              </div>

              {/* Win/Loss Message */}
              <div className={`p-4 rounded-xl ${winningColorData.isWin ? 'bg-green-100 border-2 border-green-300' : 'bg-red-100 border-2 border-red-300'}`}>
                <div className="text-4xl mb-2">
                  {winningColorData.isWin ? '🎉' : '😊'}
                </div>
                <h4 className={`text-xl font-bold ${winningColorData.isWin ? 'text-green-700' : 'text-red-700'}`}>
                  {winningColorData.isWin ? 'बधाई हो! आपकी जीत!' : 'बेहतर भाग्य के लिए!'}
                </h4>
                <p className={`text-sm font-medium ${winningColorData.isWin ? 'text-green-600' : 'text-red-600'}`}>
                  {winningColorData.isWin ? 'Congratulations! You Win!' : 'Better Luck Next Time!'}
                </p>
                
                {winningColorData.isWin && (
                  <div className="mt-2">
                    <p className="text-green-800 font-bold text-lg">
                      जीत राशि: ₹{selectedCoin * selectedColors.length * 3}
                    </p>
                    <p className="text-green-700 text-sm">
                      Win Amount: ₹{selectedCoin * selectedColors.length * 3}
                    </p>
                  </div>
                )}
              </div>

              {/* Close Button */}
              <Button 
                onClick={() => {
                  setShowColorWinPopup(false);
                  setWinningColorData(null);
                }}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-3 rounded-xl"
              >
                <CheckCircle className="h-5 w-5 mr-2" />
                अगला राउंड / Next Round
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Bet Success Popup for Color King */}
      <Dialog open={showBetSuccessPopup} onOpenChange={setShowBetSuccessPopup}>
        <DialogContent className="max-w-md mx-auto glass-card border-none">
          <DialogHeader className="text-center">
            <DialogTitle className="text-2xl font-bold text-green-800 mb-4">
              🎉 बेट सफलतापूर्वक लगाई गई!
            </DialogTitle>
          </DialogHeader>
          
          {betSuccessData && (
            <div className="text-center space-y-4">
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                <div className="text-4xl mb-2">✅</div>
                <h4 className="text-lg font-bold text-green-700 mb-2">
                  Bet Placed Successfully!
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Selected Colors:</span>
                    <span className="font-bold text-green-700 capitalize">
                      {betSuccessData.colors.join(', ')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Amount:</span>
                    <span className="font-bold text-green-700">₹{betSuccessData.amount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Round:</span>
                    <span className="font-bold text-green-700">#{currentRound}</span>
                  </div>
                </div>
              </div>
              
              <p className="text-gray-600 text-sm">
                Your bet is now active. Wait for the round to complete!
              </p>
              
              <Button 
                onClick={() => setShowBetSuccessPopup(false)}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
              >
                Continue Playing
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}