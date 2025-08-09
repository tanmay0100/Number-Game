import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertUserSchema, loginUserSchema, liveMatkaResultSchema, guessingPostSchema, appSettingSchema } from "@shared/schema";

// Global WebSocket instance for real-time updates
let wss: WebSocketServer;

// Broadcast function for real-time updates
function broadcastToAdminClients(eventType: string, data: any) {
  if (!wss) return;
  
  const message = JSON.stringify({
    type: eventType,
    data,
    timestamp: new Date().toISOString()
  });
  
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
  
  console.log(`📡 Broadcasted ${eventType} to ${wss.clients.size} clients`);
}

export async function registerRoutes(app: Express): Promise<Server> {
  // User registration endpoint
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmailOrMobile(
        validatedData.email || validatedData.mobile || ""
      );
      
      if (existingUser) {
        return res.status(400).json({ 
          message: "User already exists with this email or mobile number" 
        });
      }

      // Remove confirmPassword from data before creating user
      const { confirmPassword, ...userData } = validatedData;
      const user = await storage.createUser(userData);
      
      // Don't send password back
      const { password, ...userResponse } = user;
      res.status(201).json({ 
        message: "User registered successfully", 
        user: userResponse 
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ 
        message: "Registration failed", 
        errors: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // User login endpoint
  app.post("/api/auth/login", async (req, res) => {
    try {
      const validatedData = loginUserSchema.parse(req.body);
      const user = await storage.authenticateUser(validatedData);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Don't send password back and ensure wallet_balance is properly formatted
      const { password, ...userResponse } = user;
      res.json({ 
        message: "Login successful", 
        user: {
          ...userResponse,
          walletBalance: userResponse.walletBalance || "0"
        }
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(400).json({ 
        message: "Login failed", 
        errors: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Get fresh user data endpoint (RE-ENABLED with safeguards)
  app.get("/api/user/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Add rate limiting safeguard
      const rateLimitKey = `user_${userId}_${req.ip}`;
      const now = Date.now();
      
      if (!global.apiCallTracker) {
        global.apiCallTracker = new Map();
      }
      
      const lastCall = global.apiCallTracker.get(rateLimitKey);
      if (lastCall && (now - lastCall) < 1000) { // 1 second rate limit
        return res.status(429).json({ message: "Rate limited - too many requests" });
      }
      
      global.apiCallTracker.set(rateLimitKey, now);
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Don't send password back
      const { password, ...userResponse } = user;
      res.json({
        ...userResponse,
        walletBalance: userResponse.walletBalance || "0"
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Failed to get user data" });
    }
  });

  // Seed game rates data (one-time setup)
  app.post("/api/seed-game-rates", async (req, res) => {
    try {
      const { gameRates } = await import("@shared/schema");
      const { db } = await import("./db");
      
      const defaultRates = [
        { gameName: "Single Digit", betAmount: 10, payoutAmount: 95 },
        { gameName: "Jodi", betAmount: 10, payoutAmount: 900 },
        { gameName: "Single Pana", betAmount: 10, payoutAmount: 1400 },
        { gameName: "Double Pana", betAmount: 10, payoutAmount: 2800 },
        { gameName: "Half Sangam", betAmount: 10, payoutAmount: 10000 },
        { gameName: "Full Sangam", betAmount: 10, payoutAmount: 100000 }
      ];

      for (const rate of defaultRates) {
        await db.insert(gameRates).values(rate).onConflictDoNothing();
      }

      res.json({ message: "Game rates seeded successfully" });
    } catch (error) {
      console.error("Error seeding game rates:", error);
      res.status(500).json({ message: "Failed to seed game rates" });
    }
  });

  // Admin middleware to check if user is admin
  const isAdmin = (req: any, res: any, next: any) => {
    // For now, simple check - in production, this should be more secure
    const { emailOrMobile } = req.body;
    if (emailOrMobile === 'admin') {
      next();
    } else {
      res.status(403).json({ message: "Admin access required" });
    }
  };

  // Admin API Routes for Live Matka Results
  app.post("/api/admin/live-results", async (req, res) => {
    try {
      const validatedData = liveMatkaResultSchema.parse(req.body);
      
      // Check if game with same name already exists
      const existingResults = await storage.getLiveResults();
      const existingGame = existingResults.find(
        (game: any) => game.gameName.toLowerCase() === validatedData.gameName.toLowerCase()
      );

      if (existingGame) {
        // Update existing game
        const result = await storage.updateLiveResult(existingGame.id, validatedData);
        res.json({ message: "Live result updated successfully", result });
      } else {
        // Create new game
        const result = await storage.createLiveResult(validatedData);
        res.json({ message: "Live result created successfully", result });
      }
    } catch (error) {
      console.error("Error managing live result:", error);
      res.status(500).json({ 
        message: "Failed to manage live result", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  app.get("/api/admin/live-results", async (req, res) => {
    try {
      const results = await storage.getLiveResults();
      res.json(results);
    } catch (error) {
      console.error("Error fetching live results:", error);
      res.status(500).json({ message: "Failed to fetch live results" });
    }
  });

  // New separated endpoints for admin
  // Add Game endpoint (name + timing only)
  app.post("/api/admin/add-game", async (req, res) => {
    try {
      const { gameName, startTime, endTime, highlighted } = req.body;
      console.log("Backend received data:", { gameName, startTime, endTime, highlighted });
      const newGame = await storage.addGame({ gameName, startTime, endTime, highlighted });
      res.json({ message: "Game added successfully", game: newGame });
    } catch (error) {
      console.error("Error adding game:", error);
      res.status(500).json({ message: "Failed to add game" });
    }
  });

  // Get all games for dropdown
  app.get("/api/admin/games", async (req, res) => {
    try {
      const games = await storage.getAllGames();
      res.json(games);
    } catch (error) {
      console.error("Error fetching games:", error);
      res.status(500).json({ message: "Failed to fetch games" });
    }
  });

  // Update game result endpoint (open/close results)
  app.post("/api/admin/update-result", async (req, res) => {
    try {
      const { gameId, resultDate, openPatti, openAnk, closePatti, closeAnk } = req.body;
      const updatedGame = await storage.updateGameResult(gameId, {
        resultDate,
        openPatti,
        openAnk,
        closePatti,
        closeAnk,
      });
      res.json({ message: "Game result updated successfully", game: updatedGame });
    } catch (error) {
      console.error("Error updating game result:", error);
      res.status(500).json({ message: "Failed to update game result" });
    }
  });

  // Delete game endpoint 
  app.delete("/api/admin/delete-game/:gameId", async (req, res) => {
    try {
      const gameId = parseInt(req.params.gameId);
      await storage.deleteGame(gameId);
      res.json({ message: "Game deleted successfully" });
    } catch (error) {
      console.error("Error deleting game:", error);
      res.status(500).json({ message: "Failed to delete game" });
    }
  });

  // Reorder games endpoint
  app.post("/api/admin/reorder-games", async (req, res) => {
    try {
      const { gameIds } = req.body;
      
      if (!Array.isArray(gameIds) || gameIds.length === 0) {
        return res.status(400).json({ message: "Invalid game IDs array" });
      }

      await storage.reorderGames(gameIds);
      res.json({ message: "Games reordered successfully" });
    } catch (error) {
      console.error("Error reordering games:", error);
      res.status(500).json({ message: "Failed to reorder games" });
    }
  });

  // Public API Routes for Website
  // Get live matka results for public website
  app.get("/api/live-results", async (req, res) => {
    try {
      const games = await storage.getAllGames();
      res.json(games);
    } catch (error) {
      console.error("Error fetching live results:", error);
      res.status(500).json({ message: "Failed to fetch live results" });
    }
  });

  // Lucky Numbers Management Routes
  
  // Get all lucky numbers
  app.get("/api/lucky-numbers", async (req, res) => {
    try {
      const luckyNumbers = await storage.getLuckyNumbers();
      res.json(luckyNumbers);
    } catch (error) {
      console.error("Error fetching lucky numbers:", error);
      res.status(500).json({ message: "Failed to fetch lucky numbers" });
    }
  });

  // Add new lucky number (admin only)
  app.post("/api/admin/lucky-numbers", async (req, res) => {
    try {
      const { numberType, numberValue, displayOrder = 1, isActive = true } = req.body;
      const newLuckyNumber = await storage.addLuckyNumber({
        numberType,
        numberValue,
        displayOrder,
        isActive,
      });
      res.json({ message: "Lucky number added successfully", luckyNumber: newLuckyNumber });
    } catch (error) {
      console.error("Error adding lucky number:", error);
      res.status(500).json({ message: "Failed to add lucky number" });
    }
  });

  // Update lucky number (admin only)
  app.put("/api/admin/lucky-numbers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { numberType, numberValue, displayOrder, isActive } = req.body;
      const updatedLuckyNumber = await storage.updateLuckyNumber(id, {
        numberType,
        numberValue,
        displayOrder,
        isActive,
      });
      res.json({ message: "Lucky number updated successfully", luckyNumber: updatedLuckyNumber });
    } catch (error) {
      console.error("Error updating lucky number:", error);
      res.status(500).json({ message: "Failed to update lucky number" });
    }
  });

  // Delete lucky number (admin only)
  app.delete("/api/admin/lucky-numbers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteLuckyNumber(id);
      res.json({ message: "Lucky number deleted successfully" });
    } catch (error) {
      console.error("Error deleting lucky number:", error);
      res.status(500).json({ message: "Failed to delete lucky number" });
    }
  });

  // Chart Routes
  app.get("/api/charts/:gameName", async (req, res) => {
    try {
      const gameName = req.params.gameName.toUpperCase().replace(/-/g, ' ');
      const chartResults = await storage.getChartResults(gameName);
      res.json(chartResults);
    } catch (error) {
      console.error("Error fetching chart results:", error);
      res.status(500).json({ message: "Failed to fetch chart results" });
    }
  });

  // Generic charts endpoint for any game name (fallback)
  app.get("/api/charts", async (req, res) => {
    try {
      // Return empty array for now, this is called by the chart components
      res.json([]);
    } catch (error) {
      console.error("Error fetching charts:", error);
      res.status(500).json({ message: "Failed to fetch charts" });
    }
  });

  // Guessing Posts API Routes
  app.get("/api/guessing-posts", async (req, res) => {
    try {
      const posts = await storage.getGuessingPosts();
      res.json(posts);
    } catch (error) {
      console.error("Error fetching guessing posts:", error);
      res.status(500).json({ message: "Failed to fetch guessing posts" });
    }
  });

  app.post("/api/guessing-posts", async (req: any, res) => {
    try {
      // For now, we'll use a simple authentication check
      // This will be integrated with Replit Auth later
      const { userId = 1, userName = "Anonymous User" } = req.body;

      const validatedData = guessingPostSchema.parse(req.body);
      
      const newPost = await storage.createGuessingPost(userId, userName, validatedData);
      res.json({ message: "Guessing post created successfully", post: newPost });
    } catch (error) {
      console.error("Error creating guessing post:", error);
      res.status(500).json({ 
        message: "Failed to create guessing post", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Current User API Route (for getting updated wallet balance)
  app.get("/api/current-user", async (req, res) => {
    try {
      // Try to get user from authentication cache or session
      const authHeader = req.headers.authorization;
      const userFromAuth = authHeader ? JSON.parse(atob(authHeader.split(' ')[1] || '')) : null;
      
      let userId;
      if (userFromAuth && userFromAuth.id) {
        userId = userFromAuth.id;
      } else {
        // Check if user is logged in via session
        userId = (req as any).session?.userId || 3; // Default to Test User
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove sensitive data
      const { password, ...userResponse } = user;
      res.json(userResponse);
    } catch (error) {
      console.error("Error fetching current user:", error);
      res.status(500).json({ message: "Failed to fetch current user" });
    }
  });

  // Users Management API Routes - Return all users including agents (exclude only admins)
  app.get("/api/admin/users", async (req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      // Filter out only admins, include agents and regular users
      const usersAndAgents = allUsers.filter(user => user.role !== 'admin');
      res.json(usersAndAgents);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.put("/api/admin/users/:userId/toggle-status", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const result = await storage.toggleUserStatus(userId);
      res.json({ message: "User status updated successfully", user: result });
    } catch (error) {
      console.error("Error toggling user status:", error);
      res.status(500).json({ message: "Failed to update user status" });
    }
  });

  // Admin: Add new user
  app.post("/api/admin/users", async (req, res) => {
    try {
      const { 
        name, 
        email, 
        mobile, 
        password = "123456", 
        wallet_balance = 0,
        role = 'user',
        commission_rate = 0,
        territory = null,
        unique_user_id = null,
        is_active = true
      } = req.body;
      
      if (!name || !mobile) {
        return res.status(400).json({ message: "Name and mobile are required" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmailOrMobile(email || mobile);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists with this email or mobile" });
      }

      const userData = {
        name,
        email: email || null,
        mobile,
        password,
        wallet_balance,
        role,
        commission_rate,
        territory,
        unique_user_id,
        is_active
      };

      const newUser = await storage.createUser(userData);
      const { password: _, ...userResponse } = newUser;
      res.status(201).json({ message: "User created successfully", user: userResponse });
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // Admin: Update user
  app.put("/api/admin/users/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { name, email, mobile, wallet_balance } = req.body;
      
      const result = await storage.updateUser(userId, {
        name,
        email,
        mobile,
        wallet_balance
      });
      
      res.json({ message: "User updated successfully", user: result });
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Admin: Delete user
  app.delete("/api/admin/users/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (!userId || isNaN(userId)) {
        return res.status(400).json({ message: "Valid user ID is required" });
      }

      const result = await storage.deleteUser(userId);
      res.json({ message: "User deleted successfully", result });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Admin: Update user wallet
  app.post("/api/admin/users/wallet", async (req, res) => {
    try {
      const { userId, amount, reason } = req.body;
      
      if (!userId || !amount || !reason) {
        return res.status(400).json({ message: "User ID, amount and reason are required" });
      }

      const result = await storage.updateUserWallet(userId, amount, reason);
      res.json({ message: "Wallet updated successfully", user: result });
    } catch (error) {
      console.error("Error updating wallet:", error);
      res.status(500).json({ message: "Failed to update wallet" });
    }
  });

  // Admin: Update user wallet (PATCH method - for frontend compatibility)
  app.patch("/api/admin/users/:userId/wallet", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { amount, reason } = req.body;
      
      if (!amount || !reason) {
        return res.status(400).json({ message: "Amount and reason are required" });
      }

      const result = await storage.updateUserWallet(userId, amount, reason);
      res.json({ message: "Wallet updated successfully", user: result });
    } catch (error) {
      console.error("Error updating wallet:", error);
      res.status(500).json({ message: "Failed to update wallet" });
    }
  });

  // Get all transactions
  app.get("/api/admin/transactions", async (req, res) => {
    try {
      const transactions = await storage.getAllTransactions();
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  // Admin API: Get Total SattaMatka Bets Count (with date filtering)
  app.get("/api/admin/total-bets", async (req, res) => {
    try {
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      const totalBets = await storage.getTotalSattaMatkaBets(startDate, endDate);
      res.json({ totalBets });
    } catch (error) {
      console.error("Error fetching total bets count:", error);
      res.status(500).json({ message: "Failed to fetch total bets count" });
    }
  });

  // Admin API: Get Unique Users Today Count
  app.get("/api/admin/unique-users-today", async (req, res) => {
    try {
      const uniqueUsersToday = await storage.getUniqueUsersToday();
      res.json({ uniqueUsersToday });
    } catch (error) {
      console.error("Error fetching unique users today:", error);
      res.status(500).json({ message: "Failed to fetch unique users today" });
    }
  });

  // Game-specific analytics endpoints
  app.get("/api/admin/game-betting-stats", async (req, res) => {
    try {
      const gameName = req.query.game as string;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      
      if (!gameName) {
        return res.status(400).json({ error: "Game name is required" });
      }
      
      const stats = await storage.getGameBettingStats(gameName, { startDate, endDate });
      res.json(stats);
    } catch (error) {
      console.error("Error getting game betting stats:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/admin/game-popular-numbers", async (req, res) => {
    try {
      const gameName = req.query.game as string;
      const betType = req.query.betType as string;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      
      if (!gameName) {
        return res.status(400).json({ error: "Game name is required" });
      }
      
      const numbers = await storage.getGamePopularNumbers(gameName, betType, { startDate, endDate });
      res.json(numbers);
    } catch (error) {
      console.error("Error getting game popular numbers:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/admin/game-unique-users", async (req, res) => {
    try {
      const gameName = req.query.game as string;
      if (!gameName) {
        return res.status(400).json({ error: "Game name is required" });
      }
      
      const uniqueUsers = await storage.getGameUniqueUsers(gameName);
      res.json({ uniqueUsers });
    } catch (error) {
      console.error("Error getting game unique users:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/admin/game-total-bets", async (req, res) => {
    try {
      const gameName = req.query.game as string;
      if (!gameName) {
        return res.status(400).json({ error: "Game name is required" });
      }
      
      const totalBets = await storage.getGameTotalBets(gameName);
      res.json({ totalBets });
    } catch (error) {
      console.error("Error getting game total bets:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Number-specific betting details API with date range and sorting
  app.get("/api/admin/number-bets", async (req, res) => {
    try {
      const gameName = req.query.game as string;
      const number = req.query.number as string;
      const betType = req.query.betType as string;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      const sortBy = req.query.sortBy as string || 'time';
      const sortOrder = req.query.sortOrder as string || 'desc';
      
      if (!gameName || !number) {
        return res.status(400).json({ error: "Game name and number are required" });
      }
      
      const bets = await storage.getNumberBets(gameName, number, betType, {
        startDate,
        endDate,
        sortBy,
        sortOrder
      });
      res.json(bets);
    } catch (error) {
      console.error("Error getting number bets:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get grouped agent bets for specific number
  app.get("/api/admin/grouped-agent-bets", async (req, res) => {
    try {
      const { betNumber, gameName, startDate, endDate } = req.query;
      if (!betNumber || !gameName) {
        return res.status(400).json({ message: "Bet number and game name are required" });
      }
      const groupedBets = await storage.getGroupedAgentBets(betNumber as string, gameName as string, startDate as string, endDate as string);
      res.json(groupedBets);
    } catch (error) {
      console.error("Error fetching grouped agent bets:", error);
      res.status(500).json({ message: "Failed to fetch grouped agent bets" });
    }
  });

  // Get agent bet details for specific agent and number
  app.get("/api/admin/agent-bet-details", async (req, res) => {
    try {
      const { agentId, betNumber, gameName, startDate, endDate } = req.query;
      if (!agentId || !betNumber || !gameName) {
        return res.status(400).json({ message: "Agent ID, bet number and game name are required" });
      }
      const betDetails = await storage.getAgentBetDetails(parseInt(agentId as string), betNumber as string, gameName as string, startDate as string, endDate as string);
      res.json(betDetails);
    } catch (error) {
      console.error("Error fetching agent bet details:", error);
      res.status(500).json({ message: "Failed to fetch agent bet details" });
    }
  });

  // SattaMatka Bet Placement API
  // Admin API: Get Total Revenue (all bet amounts) with date filtering
  app.get("/api/admin/total-revenue", async (req, res) => {
    try {
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      const revenue = await storage.getTotalRevenue(startDate, endDate);
      res.json({ totalRevenue: revenue });
    } catch (error) {
      console.error("Error fetching total revenue:", error);
      res.status(500).json({ message: "Failed to fetch total revenue" });
    }
  });

  // Admin API: Get Today's Revenue (today's bet amounts) with date filtering
  app.get("/api/admin/today-revenue", async (req, res) => {
    try {
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      const revenue = await storage.getTodayRevenue(startDate, endDate);
      res.json({ todayRevenue: revenue });
    } catch (error) {
      console.error("Error fetching today revenue:", error);
      res.status(500).json({ message: "Failed to fetch today revenue" });
    }
  });

  app.post("/api/place-bet", async (req, res) => {
    try {
      const { userId, userName, gameName, type, typeName, selection, amount, rate } = req.body;
      
      if (!userId || !gameName || !type || !amount) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Create detailed transaction record for the bet
      const betDescription = `${typeName || type} bet on ${gameName} - Selection: ${selection}`;
      const result = await storage.createDetailedTransaction({
        userId,
        userName,
        type: 'bet',
        amount: parseFloat(amount),
        status: 'completed',
        description: betDescription,
        gameName,
        betType: typeName || type,
        betNumber: selection
      });

      // Broadcast real-time update to admin clients
      broadcastToAdminClients('BET_PLACED', {
        gameName,
        type: typeName || type,
        selection,
        amount: parseFloat(amount),
        userName,
        userId
      });
      
      res.json({ 
        message: "Bet placed successfully", 
        transaction: result,
        betDetails: { gameName, type, selection, amount }
      });
    } catch (error) {
      console.error("Error placing bet:", error);
      res.status(500).json({ message: "Failed to place bet" });
    }
  });

  // Admin: Toggle user status (activate/deactivate)
  app.post("/api/admin/users/:userId/toggle-status", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const result = await storage.toggleUserStatus(userId);
      res.json({ message: "User status updated successfully", user: result });
    } catch (error) {
      console.error("Error toggling user status:", error);
      res.status(500).json({ message: "Failed to update user status" });
    }
  });

  // App Settings API Routes
  app.get("/api/app-settings", async (req, res) => {
    try {
      const settings = await storage.getAllAppSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching app settings:", error);
      res.status(500).json({ message: "Failed to fetch app settings" });
    }
  });

  // User Betting History APIs
  app.get("/api/admin/user-details/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const userDetails = await storage.getUserDetails(userId);
      if (!userDetails) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(userDetails);
    } catch (error) {
      console.error("Error fetching user details:", error);
      res.status(500).json({ message: "Failed to fetch user details" });
    }
  });

  app.get("/api/admin/user-game-stats/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const gameStats = await storage.getUserGameStats(userId);
      res.json(gameStats);
    } catch (error) {
      console.error("Error fetching user game stats:", error);
      res.status(500).json({ message: "Failed to fetch user game stats" });
    }
  });

  app.get("/api/admin/user-betting-history/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const { gameName, startDate, endDate } = req.query;
      
      const bettingHistory = await storage.getUserBettingHistory(
        userId,
        gameName as string,
        startDate as string,
        endDate as string
      );

      res.json(bettingHistory);
    } catch (error) {
      console.error("Error fetching user betting history:", error);
      res.status(500).json({ message: "Failed to fetch user betting history" });
    }
  });

  app.get("/api/app-settings/:key", async (req, res) => {
    try {
      const { key } = req.params;
      const setting = await storage.getAppSetting(key);
      if (!setting) {
        return res.status(404).json({ message: "Setting not found" });
      }
      res.json(setting);
    } catch (error) {
      console.error("Error fetching app setting:", error);
      res.status(500).json({ message: "Failed to fetch app setting" });
    }
  });

  app.put("/api/admin/app-settings/:key", async (req, res) => {
    try {
      const { key } = req.params;
      const { settingValue } = req.body;
      
      if (!settingValue) {
        return res.status(400).json({ message: "Setting value is required" });
      }

      const updatedSetting = await storage.updateAppSetting(key, settingValue);
      if (!updatedSetting) {
        return res.status(404).json({ message: "Setting not found" });
      }
      
      res.json({ message: "App setting updated successfully", setting: updatedSetting });
    } catch (error) {
      console.error("Error updating app setting:", error);
      res.status(500).json({ 
        message: "Failed to update app setting", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // User API Routes
  // Get user transactions for current logged in user
  app.get("/api/user/transactions", async (req, res) => {
    try {
      // For now, we'll get user ID from query parameter or default to test user
      const userId = parseInt(req.query.userId as string) || 4; // Default to Tanmay's ID
      
      const transactions = await storage.getUserTransactions(userId);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching user transactions:", error);
      res.status(500).json({ message: "Failed to fetch user transactions" });
    }
  });

  // Get user transactions for specific user (admin route)
  app.get("/api/user/transactions/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      const transactions = await storage.getUserTransactions(userId);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching user transactions:", error);
      res.status(500).json({ message: "Failed to fetch user transactions" });
    }
  });

  // Live Bets API Routes
  // Get all live bets (merged real + dummy)
  app.get("/api/live-bets", async (req, res) => {
    try {
      const liveBets = await storage.getAllLiveBets();
      
      // Add random dummy bets to make it look active
      const { getRandomDummyBet } = await import("@shared/dummyUsers");
      const dummyBets = [];
      
      // Generate 8-12 recent dummy bets with varied timestamps
      const numDummyBets = Math.floor(Math.random() * 5) + 8;
      for (let i = 0; i < numDummyBets; i++) {
        const dummy = getRandomDummyBet();
        
        // Create more realistic time distribution
        let secondsAgo;
        if (i < 2) {
          secondsAgo = Math.floor(Math.random() * 30) + 5; // Very recent (5-35 seconds)
        } else if (i < 5) {
          secondsAgo = Math.floor(Math.random() * 120) + 30; // Recent (30 seconds - 2.5 minutes)
        } else {
          secondsAgo = Math.floor(Math.random() * 600) + 120; // Older (2-12 minutes)
        }
        
        const createdAt = new Date(Date.now() - secondsAgo * 1000);
        
        dummyBets.push({
          id: `dummy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${i}`,
          ...dummy,
          createdAt: createdAt.toISOString()
        });
      }
      
      // Mix real and dummy bets naturally - sort by time only
      const allBets = [...liveBets, ...dummyBets]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 15); // Show only latest 15 bets
      
      res.json(allBets);
    } catch (error) {
      console.error("Error fetching live bets:", error);
      res.status(500).json({ message: "Failed to fetch live bets" });
    }
  });

  // Add new live bet
  app.post("/api/live-bets", async (req, res) => {
    try {
      const { liveBetSchema } = await import("@shared/schema");
      const validatedData = liveBetSchema.parse(req.body);
      
      const newBet = await storage.createLiveBet(validatedData);
      res.status(201).json({ message: "Live bet created successfully", bet: newBet });
    } catch (error) {
      console.error("Error creating live bet:", error);
      res.status(400).json({ 
        message: "Failed to create live bet", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Color King Results API Routes
  app.get("/api/color-king-results", async (req, res) => {
    try {
      const results = await storage.getColorKingResults(10); // Get last 10 results
      res.json(results);
    } catch (error) {
      console.error("Error fetching color king results:", error);
      res.status(500).json({ message: "Failed to fetch color king results" });
    }
  });

  app.post("/api/color-king-results", async (req, res) => {
    try {
      const { winningColor, roundNumber } = req.body;
      
      if (!winningColor || !roundNumber) {
        return res.status(400).json({ message: "Winning color and round number are required" });
      }

      const newResult = await storage.createColorKingResult({ winningColor, roundNumber });
      res.status(201).json({ message: "Color King result created successfully", result: newResult });
    } catch (error) {
      console.error("Error creating color king result:", error);
      res.status(400).json({ 
        message: "Failed to create color king result", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Agent Management Routes
  
  // Create new agent
  app.post('/api/admin/agents', async (req, res) => {
    try {
      const { name, email, mobile, password, territory, commissionRate, initialWalletBalance } = req.body;
      
      // Only name and password are required, mobile and email are optional
      if (!name || !password) {
        return res.status(400).json({ error: 'Name and password are required' });
      }
      
      const agentData = {
        name,
        email: email || null,
        mobile: mobile || null,
        password,
        territory: territory || null,
        commissionRate: parseFloat(commissionRate || '0'),
        walletBalance: parseFloat(initialWalletBalance || '0')
      };
      
      const agent = await storage.createAgent(agentData);
      res.json(agent);
    } catch (error) {
      console.error('Error creating agent:', error);
      res.status(500).json({ error: 'Failed to create agent' });
    }
  });

  // Get all agents
  app.get('/api/admin/agents', async (req, res) => {
    try {
      const agents = await storage.getAllAgents();
      res.json(agents);
    } catch (error) {
      console.error('Error fetching agents:', error);
      res.status(500).json({ error: 'Failed to fetch agents' });
    }
  });

  // Update agent wallet
  app.post('/api/admin/agents/:id/wallet', async (req, res) => {
    try {
      const agentId = parseInt(req.params.id);
      const { amount, reason } = req.body;
      
      const agent = await storage.updateAgentWallet(agentId, parseFloat(amount), reason);
      
      // Broadcast wallet update to all connected clients for real-time updates
      broadcastToAdminClients('agent_wallet_updated', {
        agentId: agent.id,
        agentName: agent.name,
        newBalance: agent.wallet_balance,
        amount: parseFloat(amount),
        reason: reason,
        actionType: amount > 0 ? 'added' : 'removed'
      });
      
      res.json(agent);
    } catch (error) {
      console.error('Error updating agent wallet:', error);
      res.status(500).json({ error: 'Failed to update agent wallet' });
    }
  });

  // Delete agent
  app.delete('/api/admin/agents/:id', async (req, res) => {
    try {
      const agentId = parseInt(req.params.id);
      const agent = await storage.deleteAgent(agentId);
      res.json(agent);
    } catch (error) {
      console.error('Error deleting agent:', error);
      res.status(500).json({ error: 'Failed to delete agent' });
    }
  });

  // Get agent revenue
  app.get('/api/admin/agents/:id/revenue', async (req, res) => {
    try {
      const agentId = parseInt(req.params.id);
      const { startDate, endDate } = req.query;
      
      const revenue = await storage.getAgentRevenue(agentId, startDate as string, endDate as string);
      res.json(revenue);
    } catch (error) {
      console.error('Error fetching agent revenue:', error);
      res.status(500).json({ error: 'Failed to fetch agent revenue' });
    }
  });

  // Assign customer to agent
  app.post('/api/admin/agents/:agentId/customers/:customerId', async (req, res) => {
    try {
      const agentId = parseInt(req.params.agentId);
      const customerId = parseInt(req.params.customerId);
      
      const result = await storage.assignCustomerToAgent(customerId, agentId);
      res.json(result);
    } catch (error) {
      console.error('Error assigning customer to agent:', error);
      res.status(500).json({ error: 'Failed to assign customer to agent' });
    }
  });

  // Get agent customers
  app.get('/api/admin/agents/:id/customers', async (req, res) => {
    try {
      const agentId = parseInt(req.params.id);
      const customers = await storage.getAgentCustomers(agentId);
      res.json(customers);
    } catch (error) {
      console.error('Error fetching agent customers:', error);
      res.status(500).json({ error: 'Failed to fetch agent customers' });
    }
  });

  // Agent Panel API Routes
  // Create customer by agent
  app.post("/api/agent/create-customer", async (req, res) => {
    try {
      const { name, email, mobile, password = "123456", wallet_balance = 0, assigned_agent_id } = req.body;
      
      if (!name || !mobile || !assigned_agent_id) {
        return res.status(400).json({ message: "Name, mobile, and agent ID are required" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmailOrMobile(email || mobile);
      if (existingUser) {
        return res.status(400).json({ message: "Customer already exists with this email or mobile" });
      }

      const customerData = {
        name,
        email: email || null,
        mobile,
        password,
        wallet_balance,
        role: 'user',
        assigned_agent_id,
        is_active: true
      };

      const newCustomer = await storage.createUser(customerData);
      const { password: _, ...customerResponse } = newCustomer;
      res.status(201).json({ message: "Customer created successfully", customer: customerResponse });
    } catch (error) {
      console.error("Error creating customer:", error);
      res.status(500).json({ message: "Failed to create customer" });
    }
  });

  // Add coins to customer by agent
  app.post("/api/agent/add-coins", async (req, res) => {
    try {
      const { customerId, amount, reason } = req.body;
      
      if (!customerId || !amount || !reason) {
        return res.status(400).json({ message: "Customer ID, amount and reason are required" });
      }

      const result = await storage.updateUserWallet(parseInt(customerId), parseFloat(amount), reason);
      res.json({ message: "Coins added successfully", customer: result });
    } catch (error) {
      console.error("Error adding coins:", error);
      res.status(500).json({ message: "Failed to add coins" });
    }
  });

  // Place bet by agent (offline)
  app.post("/api/agent/place-bet", async (req, res) => {
    try {
      const { customerName, customerMobile, gameName, betType, betAmount, selectedNumbers, agent_id, agent_name } = req.body;
      
      console.log("Received data:", { customerName, gameName, betType, betAmount, selectedNumbers });
      
      if (!customerName || !gameName || !betType || !betAmount || !selectedNumbers) {
        return res.status(400).json({ message: "Customer name, game, bet type, amount and selected numbers are required" });
      }

      // Process multiple numbers if comma-separated
      const numbers = selectedNumbers.split(',').map(n => n.trim()).filter(n => n);
      const singleBetAmount = parseFloat(betAmount);
      const totalAmount = numbers.length * singleBetAmount;

      // Check if agent has sufficient wallet balance
      const agent = await storage.getUser(agent_id);
      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }

      const currentBalance = parseFloat(agent.walletBalance || '0');
      if (currentBalance < totalAmount) {
        return res.status(400).json({ 
          message: `Insufficient wallet balance. Required: ₹${totalAmount}, Available: ₹${currentBalance}` 
        });
      }

      // Deduct total amount from agent's wallet
      await storage.updateUserWallet(agent_id, -totalAmount, `Offline bet placement for ${customerName} - ${gameName} (${numbers.length} numbers)`);

      // Create separate transaction for each number
      const transactions = [];
      for (const number of numbers) {
        const betData = {
          userId: null, // No specific user ID for offline bets
          userName: customerName,
          type: 'bet',
          amount: singleBetAmount, // Positive amount for display
          description: `Offline ${betType} bet on ${gameName}${customerMobile ? ` - Mobile: ${customerMobile}` : ''} - Number: ${number}`,
          game_name: gameName,
          bet_type: betType,
          bet_number: number,
          status: 'completed',
          agent_id: agent_id,
          agent_name: agent_name,
          is_agent_bet: true,
          customer_name: customerName
        };
        
        const transaction = await storage.createTransaction(betData);
        transactions.push(transaction);
      }

      // Broadcast real-time update for agent bet placement
      broadcastToAdminClients('agent_bet_placed', {
        agentId: agent_id,
        agentName: agent_name,
        customerName: customerName,
        gameName: gameName,
        betType: betType,
        totalAmount: totalAmount,
        numbersCount: numbers.length,
        timestamp: new Date().toISOString()
      });

      // Get updated agent balance for response
      const updatedAgent = await storage.getUser(agent_id);
      const newBalance = parseFloat(updatedAgent?.walletBalance || '0');

      res.json({ 
        message: "Offline bet placed successfully", 
        totalAmount: totalAmount,
        numbersProcessed: numbers.length,
        transactions: transactions,
        agentWalletDeducted: totalAmount,
        newAgentBalance: newBalance
      });
    } catch (error) {
      console.error("Error placing offline bet:", error);
      res.status(500).json({ message: "Failed to place offline bet" });
    }
  });

  // Get agent transactions
  app.get("/api/agent/transactions", async (req, res) => {
    try {
      // For now, get all transactions where agent_id matches
      // In real implementation, you'd filter by agent session
      const transactions = await storage.getAgentTransactions(19); // Hardcoded for demo
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching agent transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  // Agent Ledger API Routes
  
  // Get agent transactions for ledger with filtering
  app.get("/api/admin/agent-transactions", async (req, res) => {
    try {
      const { filter = 'all-time' } = req.query;
      console.log('Agent Ledger API called with filter:', filter);
      const agentTransactions = await storage.getAgentLedgerTransactions(filter as string);
      console.log('Agent transactions found:', agentTransactions.length);
      res.json(agentTransactions);
    } catch (error) {
      console.error("Error fetching agent ledger transactions:", error);
      res.status(500).json({ message: "Failed to fetch agent ledger transactions" });
    }
  });

  // Get agent statistics for ledger
  app.get("/api/admin/agent-stats", async (req, res) => {
    try {
      const { filter = 'all-time' } = req.query;
      console.log('Agent stats API called with filter:', filter);
      const agentStats = await storage.getAgentLedgerStats(filter as string);
      console.log('Agent stats found:', agentStats);
      res.json(agentStats);
    } catch (error) {
      console.error("Error fetching agent ledger stats:", error);
      res.status(500).json({ message: "Failed to fetch agent ledger stats" });
    }
  });

  // Agent Panel Wallet Management (similar to Admin's "Add Coins to User")
  
  // Update agent wallet (unified endpoint for add/remove)
  app.post("/api/admin/agents/:agentId/wallet", async (req, res) => {
    try {
      const agentId = parseInt(req.params.agentId);
      const { amount, reason } = req.body;
      
      if (!agentId || !amount || !reason) {
        return res.status(400).json({ message: "Agent ID, amount and reason are required" });
      }

      // Update agent wallet balance
      const updatedAgent = await storage.updateUserWallet(agentId, parseFloat(amount), reason);
      
      // Create transaction record
      const transactionType = parseFloat(amount) > 0 ? 'wallet_credit' : 'wallet_debit';
      await storage.createTransaction({
        userId: agentId,
        userName: updatedAgent.name,
        type: transactionType,
        amount: parseFloat(amount),
        description: `Wallet ${parseFloat(amount) > 0 ? 'credited' : 'debited'} by Admin: ${reason}`,
        status: 'completed'
      });

      // Broadcast real-time WebSocket update to agent
      broadcastToAdminClients('agent_wallet_updated', {
        agentId: agentId,
        newBalance: updatedAgent.wallet_balance,
        amount: Math.abs(parseFloat(amount)),
        actionType: parseFloat(amount) > 0 ? 'added' : 'removed',
        reason: reason,
        timestamp: new Date().toISOString()
      });

      res.json({ 
        message: `Coins ${parseFloat(amount) > 0 ? 'added to' : 'removed from'} agent wallet successfully`,
        agent: updatedAgent,
        wallet_balance: updatedAgent.wallet_balance
      });
    } catch (error) {
      console.error("Error updating agent wallet:", error);
      res.status(500).json({ message: "Failed to update agent wallet" });
    }
  });
  
  // Legacy endpoint for backward compatibility
  app.post("/api/admin/agent-wallet/add", async (req, res) => {
    try {
      const { agentId, amount, reason } = req.body;
      
      if (!agentId || !amount || !reason) {
        return res.status(400).json({ message: "Agent ID, amount and reason are required" });
      }

      // Update agent wallet balance
      const updatedAgent = await storage.updateUserWallet(parseInt(agentId), parseFloat(amount), reason);
      
      // Create transaction record
      await storage.createTransaction({
        userId: parseInt(agentId),
        userName: updatedAgent.name,
        type: 'wallet_credit',
        amount: parseFloat(amount),
        description: `Wallet credited by Admin: ${reason}`,
        status: 'completed'
      });

      // Broadcast real-time WebSocket update to agent
      broadcastToAdminClients('agent_wallet_updated', {
        agentId: parseInt(agentId),
        newBalance: updatedAgent.wallet_balance,
        amount: parseFloat(amount),
        actionType: 'added',
        reason: reason,
        timestamp: new Date().toISOString()
      });

      res.json({ 
        message: "Coins added to agent wallet successfully",
        agent: updatedAgent,
        newBalance: updatedAgent.wallet_balance
      });
    } catch (error) {
      console.error("Error adding coins to agent wallet:", error);
      res.status(500).json({ message: "Failed to add coins to agent wallet" });
    }
  });

  // Remove coins from agent wallet (Admin action)
  app.post("/api/admin/agent-wallet/remove", async (req, res) => {
    try {
      const { agentId, amount, reason } = req.body;
      
      if (!agentId || !amount || !reason) {
        return res.status(400).json({ message: "Agent ID, amount and reason are required" });
      }

      // Update agent wallet balance (negative amount for removal)
      const updatedAgent = await storage.updateUserWallet(parseInt(agentId), -parseFloat(amount), reason);
      
      // Create transaction record
      await storage.createTransaction({
        userId: parseInt(agentId),
        userName: updatedAgent.name,
        type: 'wallet_debit',
        amount: -parseFloat(amount),
        description: `Wallet debited by Admin: ${reason}`,
        status: 'completed'
      });

      // Broadcast real-time WebSocket update to agent
      broadcastToAdminClients('agent_wallet_updated', {
        agentId: parseInt(agentId),
        newBalance: updatedAgent.wallet_balance,
        amount: parseFloat(amount),
        actionType: 'removed',
        reason: reason,
        timestamp: new Date().toISOString()
      });

      res.json({ 
        message: "Coins removed from agent wallet successfully",
        agent: updatedAgent,
        newBalance: updatedAgent.wallet_balance
      });
    } catch (error) {
      console.error("Error removing coins from agent wallet:", error);
      res.status(500).json({ message: "Failed to remove coins from agent wallet" });
    }
  });

  const httpServer = createServer(app);
  
  // Setup WebSocket server for real-time updates
  wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws' 
  });

  // WebSocket connection handler
  wss.on('connection', (ws: WebSocket) => {
    console.log('🔌 New WebSocket client connected');
    
    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message);
        console.log('📨 WebSocket message received:', data);
        
        // Handle different message types
        if (data.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
        }
      } catch (error) {
        console.error('❌ WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      console.log('🔌 WebSocket client disconnected');
    });

    ws.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
    });
  });

  return httpServer;
}
