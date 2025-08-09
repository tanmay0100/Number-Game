import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { WebSocketProvider } from "@/hooks/useWebSocket";
import Home from "@/pages/Home";
import SimpleDashboard from "@/pages/SimpleDashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import AgentPanel from "@/pages/AgentPanel";
import PlayGames from "@/pages/PlayGames";
import GameResults from "@/pages/GameResults";
import GameRates from "@/pages/GameRates";
import MyWallet from "@/pages/MyWallet";
import HowToPlay from "@/pages/HowToPlay";
import Settings from "@/pages/Settings";
import MyOrders from "@/pages/MyOrders";
import GameChart from "@/pages/GameChart";
import GuessFormula from "@/pages/GuessFormula";
import SattaMatkaDetails from "@/pages/SattaMatkaDetails";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Check user roles
  const isAdmin = user?.role === 'admin' || user?.email === 'admin';
  const isAgent = user?.role === 'agent';

  return (
    <Switch>
      <Route path="/">
        {!isAuthenticated ? <Home /> : 
         isAdmin ? <AdminDashboard /> : 
         isAgent ? <AgentPanel /> : <SimpleDashboard />}
      </Route>
      <Route path="/admin">
        {isAdmin ? <AdminDashboard /> : <Home />}
      </Route>
      <Route path="/admin-dashboard">
        {isAdmin ? <AdminDashboard /> : <Home />}
      </Route>
      <Route path="/agent-panel">
        {isAgent ? <AgentPanel /> : <Home />}
      </Route>
      <Route path="/play-games">
        {isAuthenticated && !isAdmin && !isAgent ? <PlayGames /> : <Home />}
      </Route>
      <Route path="/game-results">
        {isAuthenticated && !isAdmin ? <GameResults /> : <Home />}
      </Route>
      <Route path="/game-rates">
        {isAuthenticated && !isAdmin ? <GameRates /> : <Home />}
      </Route>
      <Route path="/my-wallet">
        {isAuthenticated && !isAdmin ? <MyWallet /> : <Home />}
      </Route>
      <Route path="/how-to-play">
        {isAuthenticated && !isAdmin ? <HowToPlay /> : <Home />}
      </Route>
      <Route path="/settings">
        {isAuthenticated && !isAdmin ? <Settings /> : <Home />}
      </Route>
      <Route path="/my-orders">
        {isAuthenticated && !isAdmin ? <MyOrders /> : <Home />}
      </Route>
      <Route path="/chart/:gameName">
        <GameChart />
      </Route>
      <Route path="/guess-formula">
        <GuessFormula />
      </Route>
      <Route path="/satta-matka-details">
        {isAdmin ? <SattaMatkaDetails /> : <Home />}
      </Route>
      <Route>
        <NotFound />
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <div className="w-screen overflow-x-hidden">
      <QueryClientProvider client={queryClient}>
        <WebSocketProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </WebSocketProvider>
      </QueryClientProvider>
    </div>
  );
}

export default App;
