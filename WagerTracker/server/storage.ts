import { users, gameResults, luckyNumbers, liveBets, colorKingResults, transactions, type User, type InsertUser, type LoginUser, generateUserId, generateAgentUsername } from "@shared/schema";
import { db } from "./db";
import { eq, or, desc, sql } from "drizzle-orm";

// Simple in-memory cache for authentication
const authCache = new Map<string, { user: User; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByEmailOrMobile(emailOrMobile: string): Promise<User | undefined>;
  createUser(user: Omit<InsertUser, 'confirmPassword'>): Promise<User>;
  authenticateUser(credentials: LoginUser): Promise<User | null>;
  // Game management
  addGame(game: { gameName: string; startTime: string; endTime: string; highlighted?: boolean }): Promise<any>;
  getAllGames(): Promise<any[]>;
  deleteGame(gameId: number): Promise<void>;
  reorderGames(gameIds: number[]): Promise<void>;
  
  // Result management
  updateGameResult(gameId: number, result: { resultDate?: string; openPatti?: string; openAnk?: string; closePatti?: string; closeAnk?: string }): Promise<any>;
  
  // Lucky numbers management
  getLuckyNumbers(): Promise<any[]>;
  addLuckyNumber(luckyNumber: { numberType: string; numberValue: string; displayOrder: number; isActive: boolean }): Promise<any>;
  updateLuckyNumber(id: number, luckyNumber: { numberType?: string; numberValue?: string; displayOrder?: number; isActive?: boolean }): Promise<any>;
  deleteLuckyNumber(id: number): Promise<void>;
  
  // Chart management
  getChartResults(gameName: string): Promise<any[]>;
  addChartResult(chartData: { gameName: string; resultDate: string; openPanna?: string; jodi?: string; closePanna?: string }): Promise<any>;
  addNewChartEntry(chartData: { gameName: string; resultDate: string; openPanna?: string; jodi?: string; closePanna?: string }): Promise<any>;
  addCompleteChartEntry(chartData: { gameName: string; resultDate: string; weekStartDate: string; combinedResult: string; openPanna: string; jodi: string; closePanna: string }): Promise<any>;
  
  // Guessing posts management
  getGuessingPosts(): Promise<any[]>;
  createGuessingPost(userId: number, userName: string, postData: { gameName: string; guessDate: string; formula: string }): Promise<any>;
  
  // App settings management
  getAppSetting(settingKey: string): Promise<any>;
  updateAppSetting(settingKey: string, settingValue: string): Promise<any>;
  getAllAppSettings(): Promise<any[]>;
  
  // User management
  getAllUsers(): Promise<any[]>;
  toggleUserStatus(userId: number): Promise<any>;
  updateUser(userId: number, userData: { name?: string; email?: string; mobile?: string; wallet_balance?: number }): Promise<any>;
  updateUserWallet(userId: number, amount: number, reason: string): Promise<any>;
  deleteUser(userId: number): Promise<any>;
  
  // Agent management
  createAgent(agentData: { name: string; email?: string; mobile?: string; password: string; territory?: string; commissionRate?: number; walletBalance?: number }): Promise<any>;
  getAllAgents(): Promise<any[]>;
  updateAgentWallet(agentId: number, amount: number, reason: string): Promise<any>;
  deleteAgent(agentId: number): Promise<any>;
  getAgentRevenue(agentId: number, startDate?: string, endDate?: string): Promise<any>;
  assignCustomerToAgent(customerId: number, agentId: number): Promise<any>;
  getAgentCustomers(agentId: number): Promise<any[]>;
  
  // Transaction management
  getAllTransactions(): Promise<any[]>;
  getUserTransactions(userId: number): Promise<any[]>;
  getTotalSattaMatkaBets(startDate?: string, endDate?: string): Promise<number>;
  getUniqueUsersToday(): Promise<number>;
  
  // User betting history management
  getUserBettingHistory(userId: number, gameName?: string, startDate?: string, endDate?: string): Promise<any[]>;
  getUserGameStats(userId: number): Promise<any[]>;
  getUserDetails(userId: number): Promise<any>;
  getTotalRevenue(startDate?: string, endDate?: string): Promise<number>;
  getTodayRevenue(startDate?: string, endDate?: string): Promise<number>;
  createTransaction(transactionData: { userId: number; type: string; amount: number; status: string; description: string }): Promise<any>;
  createDetailedTransaction(transactionData: { 
    userId: number; 
    userName: string;
    type: string; 
    amount: number; 
    status: string; 
    description: string;
    gameName?: string;
    betType?: string;
    betNumber?: string;
  }): Promise<any>;
  
  // Game-specific analytics methods
  getGameBettingStats(gameName: string, options?: { startDate?: string; endDate?: string }): Promise<{
    totalAmount: number;
    totalBets: number;
    bettingTypes: Array<{
      type: string;
      amount: number;
      bets: number;
    }>;
  }>;
  
  // Number-specific betting details
  getNumberBets(gameName: string, number: string, betType?: string): Promise<Array<{
    id: number;
    userId: number;
    userName: string;
    betType: string;
    betNumber: string;
    amount: number;
    createdAt: string;
    description: string;
  }>>;
  
  getGamePopularNumbers(gameName: string, betType?: string): Promise<Array<{
    number: string;
    amount: number;
    players: number;
    betCount: number;
  }>>;
  
  getGameUniqueUsers(gameName: string): Promise<number>;
  getGameTotalBets(gameName: string): Promise<number>;
  
  // Live bets management
  getAllLiveBets(): Promise<any[]>;
  createLiveBet(betData: { userName: string; gameType: string; selectedColors: string; betAmount: number; roundNumber: number }): Promise<any>;
  
  // Color King results management
  getColorKingResults(limit?: number): Promise<any[]>;
  createColorKingResult(resultData: { winningColor: string; roundNumber: number }): Promise<any>;
  
  // Legacy support
  createLiveResult(result: any): Promise<any>;
  updateLiveResult(id: number, result: any): Promise<any>;
  getLiveResults(): Promise<any[]>;
  
  // Agent Ledger methods
  getAgentLedgerTransactions(filter: string): Promise<any[]>;
  getAgentLedgerStats(filter: string): Promise<{
    totalAgents: number;
    totalAmount: number;
    totalBets: number;
    totalCommission: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmailOrMobile(emailOrMobile: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(
        or(
          eq(users.email, emailOrMobile),
          eq(users.mobile, emailOrMobile),
          eq(users.username, emailOrMobile)
        )
      );
    return user || undefined;
  }

  async createUser(insertUser: Omit<InsertUser, 'confirmPassword'>): Promise<User> {
    // Generate unique user ID with retry logic if not provided
    let uniqueUserId: string;
    
    if (insertUser.unique_user_id) {
      uniqueUserId = insertUser.unique_user_id;
    } else {
      let attempts = 0;
      const maxAttempts = 10;
      
      do {
        uniqueUserId = generateUserId();
        const existingUser = await db
          .select()
          .from(users)
          .where(eq(users.uniqueUserId, uniqueUserId))
          .limit(1);
        
        if (existingUser.length === 0) break;
        attempts++;
      } while (attempts < maxAttempts);
      
      if (attempts >= maxAttempts) {
        throw new Error("Failed to generate unique user ID after multiple attempts");
      }
    }
    
    const [user] = await db
      .insert(users)
      .values({
        name: insertUser.name,
        email: insertUser.email || null,
        mobile: insertUser.mobile || null,
        password: insertUser.password,
        referralCode: insertUser.referralCode || null,
        uniqueUserId,
        walletBalance: insertUser.wallet_balance || 0,
        role: insertUser.role || 'user',
        commissionRate: insertUser.commission_rate || 0,
        territory: insertUser.territory || null,
        isActive: insertUser.is_active !== undefined ? insertUser.is_active : true
      })
      .returning();
    
    return user;
  }

  async authenticateUser(credentials: LoginUser): Promise<User | null> {
    const cacheKey = `auth:${credentials.emailOrMobile}:${credentials.password}`;
    
    // Check cache first
    const cached = authCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('Auth cache hit');
      return cached.user;
    }
    
    const user = await this.getUserByEmailOrMobile(credentials.emailOrMobile);
    
    if (user && user.password === credentials.password) {
      // Cache successful authentication
      authCache.set(cacheKey, { user, timestamp: Date.now() });
      console.log('Auth cached');
      return user;
    }
    return null;
  }

  async createLiveResult(result: any): Promise<any> {
    const [newResult] = await db
      .insert(gameResults)
      .values({
        gameName: result.gameName,
        startTime: result.startTime,
        endTime: result.endTime,
        openPatti: result.openPatti || null,
        openAnk: result.openAnk || null,
        closePatti: result.closePatti || null,
        closeAnk: result.closeAnk || null,
      })
      .returning();
    return newResult;
  }

  async updateLiveResult(id: number, result: any): Promise<any> {
    const [updatedResult] = await db
      .update(gameResults)
      .set({
        gameName: result.gameName,
        startTime: result.startTime,
        endTime: result.endTime,
        openPatti: result.openPatti || null,
        openAnk: result.openAnk || null,
        closePatti: result.closePatti || null,
        closeAnk: result.closeAnk || null,
        updatedAt: new Date(),
      })
      .where(eq(gameResults.id, id))
      .returning();
    return updatedResult;
  }

  async getLiveResults(): Promise<any[]> {
    const results = await db
      .select()
      .from(gameResults)
      .orderBy(desc(gameResults.updatedAt));
    return results;
  }

  // New game management functions
  async addGame(game: { gameName: string; startTime: string; endTime: string; highlighted?: boolean }): Promise<any> {
    try {
      const [newGame] = await db
        .insert(gameResults)
        .values({
          gameName: game.gameName,
          startTime: game.startTime,
          endTime: game.endTime,
          highlighted: game.highlighted || false,
          result: null, // Default empty result
        })
        .returning();
      return newGame;
    } catch (error) {
      console.error("Error adding game:", error);
      throw error;
    }
  }

  async getAllGames(): Promise<any[]> {
    return await db
      .select()
      .from(gameResults)
      .orderBy(gameResults.displayOrder, gameResults.id);
  }

  async updateGameResult(gameId: number, result: { resultDate?: string; openPatti?: string; openAnk?: string; closePatti?: string; closeAnk?: string }): Promise<any> {
    try {
      console.log("🔍 updateGameResult called with:", { gameId, result });
      
      // Build update object with only the fields that are provided
      const updateData: any = {
        updatedAt: new Date(),
      };

      // Determine what type of update this is
      const isOpenUpdate = (result.openPatti !== undefined || result.openAnk !== undefined);
      const isCloseUpdate = (result.closePatti !== undefined || result.closeAnk !== undefined);

      if (isOpenUpdate && !isCloseUpdate) {
        // Only open result is being updated - clear close fields and update open fields
        console.log("📋 Open-only update detected - clearing close fields");
        updateData.openPatti = result.openPatti && result.openPatti.trim() !== '' ? result.openPatti : null;
        updateData.openAnk = result.openAnk && result.openAnk.trim() !== '' ? result.openAnk : null;
        updateData.closePatti = null;
        updateData.closeAnk = null;
      } else if (isCloseUpdate && !isOpenUpdate) {
        // Only close result is being updated - update close fields only (keep existing open fields)
        console.log("📋 Close-only update detected - keeping existing open fields");
        updateData.closePatti = result.closePatti && result.closePatti.trim() !== '' ? result.closePatti : null;
        updateData.closeAnk = result.closeAnk && result.closeAnk.trim() !== '' ? result.closeAnk : null;
      } else if (isOpenUpdate && isCloseUpdate) {
        // Both open and close are being updated
        console.log("📋 Full update detected - updating all fields");
        updateData.openPatti = result.openPatti && result.openPatti.trim() !== '' ? result.openPatti : null;
        updateData.openAnk = result.openAnk && result.openAnk.trim() !== '' ? result.openAnk : null;
        updateData.closePatti = result.closePatti && result.closePatti.trim() !== '' ? result.closePatti : null;
        updateData.closeAnk = result.closeAnk && result.closeAnk.trim() !== '' ? result.closeAnk : null;
      }

      const [updatedGame] = await db
        .update(gameResults)
        .set(updateData)
        .where(eq(gameResults.id, gameId))
        .returning();

      // Auto-feed to chart only when BOTH open and close results are complete
      if (updatedGame) {
        console.log(`📊 Checking if chart update needed for ${updatedGame.gameName}`);
        
        // Get complete game data
        const fullGameData = await db
          .select()
          .from(gameResults)
          .where(eq(gameResults.id, gameId))
          .limit(1);
        
        if (fullGameData.length > 0) {
          const game = fullGameData[0];
          
          // Only add to chart when BOTH open and close results are complete
          if (game.openPatti && game.openAnk && game.closePatti && game.closeAnk) {
            // Use the provided result date if available, otherwise use current date
            const currentDate = result.resultDate && result.resultDate.trim() !== '' 
              ? result.resultDate 
              : new Date().toISOString().split('T')[0];
            
            console.log(`🔍 Chart feeding logic:`, {
              providedResultDate: result.resultDate,
              calculatedCurrentDate: currentDate,
              isResultDateProvided: !!(result.resultDate && result.resultDate.trim() !== '')
            });
            
            const targetDate = new Date(currentDate);
            
            // Calculate week start date (Monday) from target date
            const dayOfWeek = targetDate.getDay();
            const mondayOffset = dayOfWeek === 0 ? -6 : -(dayOfWeek - 1); // Sunday = 0, Monday = 1
            const weekStart = new Date(targetDate);
            weekStart.setDate(targetDate.getDate() + mondayOffset);
            
            const weekStartStr = weekStart.toISOString().split('T')[0];
            
            // Create combined result format: open-jodi-close
            const combinedResult = `${game.openPatti}-${game.openAnk}${game.closeAnk}-${game.closePatti}`;
            
            console.log(`📊 Complete result found: ${combinedResult}`);
            console.log(`📊 Adding to chart for week starting: ${weekStartStr}`);
            
            const chartData = {
              gameName: game.gameName,
              resultDate: currentDate,
              weekStartDate: weekStartStr,
              combinedResult: combinedResult,
              openPanna: game.openPatti,
              jodi: `${game.openAnk}${game.closeAnk}`,
              closePanna: game.closePatti
            };
            
            const chartResult = await this.addCompleteChartEntry(chartData);
            console.log(`📊 Chart entry added successfully:`, chartResult);
          } else {
            console.log(`📊 Incomplete result - waiting for both open and close data`);
            console.log(`📊 Current state: open=${game.openPatti}-${game.openAnk}, close=${game.closePatti}-${game.closeAnk}`);
          }
        }
      }

      return updatedGame;
    } catch (error) {
      console.error("Error updating game result:", error);
      throw error;
    }
  }

  async deleteGame(gameId: number): Promise<void> {
    try {
      await db.delete(gameResults).where(eq(gameResults.id, gameId));
    } catch (error) {
      console.error("Error deleting game:", error);
      throw error;
    }
  }

  async reorderGames(gameIds: number[]): Promise<void> {
    try {
      // Update display_order for each game based on array position
      for (let i = 0; i < gameIds.length; i++) {
        await db
          .update(gameResults)
          .set({ displayOrder: i + 1 })
          .where(eq(gameResults.id, gameIds[i]));
      }
    } catch (error) {
      console.error("Error reordering games:", error);
      throw error;
    }
  }

  // Lucky numbers management methods
  async getLuckyNumbers(): Promise<any[]> {
    try {
      return await db
        .select()
        .from(luckyNumbers)
        .where(eq(luckyNumbers.isActive, true))
        .orderBy(luckyNumbers.numberType, luckyNumbers.displayOrder);
    } catch (error) {
      console.error("Error fetching lucky numbers:", error);
      throw error;
    }
  }

  async addLuckyNumber(luckyNumber: { numberType: string; numberValue: string; displayOrder: number; isActive: boolean }): Promise<any> {
    try {
      const [newLuckyNumber] = await db
        .insert(luckyNumbers)
        .values({
          numberType: luckyNumber.numberType,
          numberValue: luckyNumber.numberValue,
          displayOrder: luckyNumber.displayOrder,
          isActive: luckyNumber.isActive,
        })
        .returning();
      return newLuckyNumber;
    } catch (error) {
      console.error("Error adding lucky number:", error);
      throw error;
    }
  }

  async updateLuckyNumber(id: number, luckyNumber: { numberType?: string; numberValue?: string; displayOrder?: number; isActive?: boolean }): Promise<any> {
    try {
      const updateData: any = { updatedAt: new Date() };
      
      if (luckyNumber.numberType !== undefined) updateData.numberType = luckyNumber.numberType;
      if (luckyNumber.numberValue !== undefined) updateData.numberValue = luckyNumber.numberValue;
      if (luckyNumber.displayOrder !== undefined) updateData.displayOrder = luckyNumber.displayOrder;
      if (luckyNumber.isActive !== undefined) updateData.isActive = luckyNumber.isActive;

      const [updatedLuckyNumber] = await db
        .update(luckyNumbers)
        .set(updateData)
        .where(eq(luckyNumbers.id, id))
        .returning();
      return updatedLuckyNumber;
    } catch (error) {
      console.error("Error updating lucky number:", error);
      throw error;
    }
  }

  async deleteLuckyNumber(id: number): Promise<void> {
    try {
      await db.delete(luckyNumbers).where(eq(luckyNumbers.id, id));
    } catch (error) {
      console.error("Error deleting lucky number:", error);
      throw error;
    }
  }

  async getChartResults(gameName: string): Promise<any[]> {
    try {
      const results = await db.execute(sql`
        SELECT * FROM chart_results 
        WHERE game_name = ${gameName}
        ORDER BY year DESC, week_number DESC, result_date DESC
      `);
      return results.rows;
    } catch (error) {
      console.error("Error getting chart results:", error);
      return [];
    }
  }

  async addChartResult(chartData: { gameName: string; resultDate: string; openPanna?: string; jodi?: string; closePanna?: string }): Promise<any> {
    try {
      const date = new Date(chartData.resultDate);
      const year = date.getFullYear();
      const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
      
      // Calculate week number
      const startOfYear = new Date(year, 0, 1);
      const pastDaysOfYear = (date.getTime() - startOfYear.getTime()) / 86400000;
      const weekNumber = Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);

      // Check if record exists first
      const existingRecord = await db.execute(sql`
        SELECT * FROM chart_results 
        WHERE game_name = ${chartData.gameName} AND result_date = ${chartData.resultDate}
      `);

      if (existingRecord.rows.length > 0) {
        // Update only specific fields using individual queries
        let updateResult;
        
        if (chartData.openPanna !== undefined) {
          updateResult = await db.execute(sql`
            UPDATE chart_results 
            SET open_panna = ${chartData.openPanna}, updated_at = NOW()
            WHERE game_name = ${chartData.gameName} AND result_date = ${chartData.resultDate}
            RETURNING *
          `);
        }
        
        if (chartData.jodi !== undefined) {
          updateResult = await db.execute(sql`
            UPDATE chart_results 
            SET jodi = ${chartData.jodi}, updated_at = NOW()
            WHERE game_name = ${chartData.gameName} AND result_date = ${chartData.resultDate}
            RETURNING *
          `);
        }
        
        if (chartData.closePanna !== undefined) {
          updateResult = await db.execute(sql`
            UPDATE chart_results 
            SET close_panna = ${chartData.closePanna}, updated_at = NOW()
            WHERE game_name = ${chartData.gameName} AND result_date = ${chartData.resultDate}
            RETURNING *
          `);
        }
        
        return updateResult?.rows[0] || existingRecord.rows[0];
      } else {
        // Insert new record
        const result = await db.execute(sql`
          INSERT INTO chart_results (game_name, result_date, day_of_week, week_number, year, open_panna, jodi, close_panna)
          VALUES (${chartData.gameName}, ${chartData.resultDate}, ${dayOfWeek}, ${weekNumber}, ${year}, ${chartData.openPanna || null}, ${chartData.jodi || null}, ${chartData.closePanna || null})
          RETURNING *
        `);
        return result.rows[0];
      }
    } catch (error) {
      console.error("Error adding chart result:", error);
      throw error;
    }
  }

  async addNewChartEntry(chartData: { gameName: string; resultDate: string; openPanna?: string; jodi?: string; closePanna?: string }): Promise<any> {
    try {
      const date = new Date();
      const year = date.getFullYear();
      const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
      
      // Calculate week number
      const startOfYear = new Date(year, 0, 1);
      const pastDaysOfYear = (date.getTime() - startOfYear.getTime()) / 86400000;
      const weekNumber = Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);

      // For new entries, we'll use a different approach - check if entry exists and create incrementally
      const existingCount = await db.execute(sql`
        SELECT COUNT(*) as count FROM chart_results 
        WHERE game_name = ${chartData.gameName} AND result_date = ${chartData.resultDate}
      `);
      
      const count = parseInt(String((existingCount.rows[0] as any).count)) + 1;
      
      // Always insert new record - PostgreSQL will handle conflicts
      const result = await db.execute(sql`
        INSERT INTO chart_results (game_name, result_date, day_of_week, week_number, year, open_panna, jodi, close_panna)
        VALUES (${chartData.gameName}, ${chartData.resultDate}, ${dayOfWeek}, ${weekNumber}, ${year}, ${chartData.openPanna || null}, ${chartData.jodi || null}, ${chartData.closePanna || null})
        RETURNING *
      `);
      return result.rows[0];
    } catch (error) {
      console.error("Error adding new chart entry:", error);
      throw error;
    }
  }

  async addCompleteChartEntry(chartData: { gameName: string; resultDate: string; weekStartDate: string; combinedResult: string; openPanna: string; jodi: string; closePanna: string }): Promise<any> {
    try {
      const inputDate = new Date(chartData.resultDate);
      const year = inputDate.getFullYear();
      const dayOfWeek = inputDate.toLocaleDateString('en-US', { weekday: 'long' });
      
      // Smart Week Detection: Calculate which Monday-Saturday week this date falls into
      const dayOfWeekNum = inputDate.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
      const mondayOffset = dayOfWeekNum === 0 ? -6 : -(dayOfWeekNum - 1); // Calculate offset to Monday
      
      const weekStartDate = new Date(inputDate);
      weekStartDate.setDate(inputDate.getDate() + mondayOffset);
      
      const weekEndDate = new Date(weekStartDate);
      weekEndDate.setDate(weekStartDate.getDate() + 5); // Saturday
      
      // Calculate week number from week start date
      const startOfYear = new Date(year, 0, 1);
      const pastDaysOfYear = (weekStartDate.getTime() - startOfYear.getTime()) / 86400000;
      const weekNumber = Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
      
      const weekStartStr = weekStartDate.toISOString().split('T')[0];
      const weekEndStr = weekEndDate.toISOString().split('T')[0];
      
      console.log(`📅 Auto-detected week: ${weekStartStr} to ${weekEndStr} (Week ${weekNumber})`);
      console.log(`📅 Input date ${chartData.resultDate} falls on ${dayOfWeek}`);

      // Insert or update chart entry for this specific date within the week
      const result = await db.execute(sql`
        INSERT INTO chart_results (game_name, result_date, day_of_week, week_number, year, open_panna, jodi, close_panna)
        VALUES (${chartData.gameName}, ${chartData.resultDate}, ${dayOfWeek}, ${weekNumber}, ${year}, ${chartData.openPanna}, ${chartData.jodi}, ${chartData.closePanna})
        ON CONFLICT (game_name, result_date) 
        DO UPDATE SET 
          open_panna = EXCLUDED.open_panna,
          jodi = EXCLUDED.jodi,
          close_panna = EXCLUDED.close_panna,
          updated_at = NOW()
        RETURNING *
      `);
      return result.rows[0];
    } catch (error) {
      console.error("Error adding complete chart entry:", error);
      throw error;
    }
  }

  // Guessing posts management methods
  async getGuessingPosts(): Promise<any[]> {
    try {
      const result = await db.execute(sql`
        SELECT * FROM guessing_posts
        ORDER BY created_at DESC
      `);
      return result.rows || [];
    } catch (error) {
      console.error("Error fetching guessing posts:", error);
      throw error;
    }
  }

  async createGuessingPost(userId: number, userName: string, postData: { gameName: string; guessDate: string; formula: string }): Promise<any> {
    try {
      const result = await db.execute(sql`
        INSERT INTO guessing_posts (user_id, user_name, game_name, guess_date, formula)
        VALUES (${userId}, ${userName}, ${postData.gameName}, ${postData.guessDate}, ${postData.formula})
        RETURNING *
      `);
      return result.rows?.[0];
    } catch (error) {
      console.error("Error creating guessing post:", error);
      throw error;
    }
  }

  // App settings management methods
  async getAppSetting(settingKey: string): Promise<any> {
    try {
      const result = await db.execute(sql`
        SELECT * FROM app_settings WHERE setting_key = ${settingKey}
      `);
      return result.rows?.[0];
    } catch (error) {
      console.error("Error fetching app setting:", error);
      throw error;
    }
  }

  async updateAppSetting(settingKey: string, settingValue: string): Promise<any> {
    try {
      const result = await db.execute(sql`
        UPDATE app_settings 
        SET setting_value = ${settingValue}, updated_at = NOW()
        WHERE setting_key = ${settingKey}
        RETURNING *
      `);
      return result.rows?.[0];
    } catch (error) {
      console.error("Error updating app setting:", error);
      throw error;
    }
  }

  async getAllAppSettings(): Promise<any[]> {
    try {
      const result = await db.execute(sql`
        SELECT * FROM app_settings ORDER BY setting_key
      `);
      return result.rows || [];
    } catch (error) {
      console.error("Error fetching app settings:", error);
      throw error;
    }
  }

  async getAllUsers(): Promise<any[]> {
    try {
      const result = await db.execute(sql`
        SELECT * FROM users ORDER BY created_at DESC
      `);
      return result.rows || [];
    } catch (error) {
      console.error("Error fetching all users:", error);
      throw error;
    }
  }

  async toggleUserStatus(userId: number): Promise<any> {
    try {
      const result = await db.execute(sql`
        UPDATE users 
        SET is_active = NOT is_active 
        WHERE id = ${userId} 
        RETURNING id, name, is_active
      `);
      return result.rows?.[0];
    } catch (error) {
      console.error("Error toggling user status:", error);
      throw error;
    }
  }

  async updateUser(userId: number, userData: { name?: string; email?: string; mobile?: string; wallet_balance?: number }): Promise<any> {
    try {
      const updateFields = [];
      const values = [];
      let paramIndex = 1;

      if (userData.name !== undefined) {
        updateFields.push(`name = $${paramIndex++}`);
        values.push(userData.name);
      }
      if (userData.email !== undefined) {
        updateFields.push(`email = $${paramIndex++}`);
        values.push(userData.email);
      }
      if (userData.mobile !== undefined) {
        updateFields.push(`mobile = $${paramIndex++}`);
        values.push(userData.mobile);
      }
      if (userData.wallet_balance !== undefined) {
        updateFields.push(`wallet_balance = $${paramIndex++}`);
        values.push(userData.wallet_balance);
      }

      if (updateFields.length === 0) {
        throw new Error("No fields to update");
      }

      values.push(userId);
      const result = await db.execute(sql`
        UPDATE users 
        SET ${sql.raw(updateFields.join(', '))} 
        WHERE id = ${userId} 
        RETURNING *
      `);
      
      return result.rows?.[0];
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  }

  async updateUserWallet(userId: number, amount: number, reason: string): Promise<any> {
    try {
      const result = await db.execute(sql`
        UPDATE users 
        SET wallet_balance = GREATEST(0, wallet_balance + ${amount})
        WHERE id = ${userId} 
        RETURNING *
      `);

      if (result.rows && result.rows.length > 0) {
        // Record transaction for audit trail
        try {
          await db.execute(sql`
            INSERT INTO transactions (user_id, type, amount, description, status)
            VALUES (${userId}, ${amount > 0 ? 'deposit' : 'withdrawal'}, ${Math.abs(amount)}, ${reason}, 'completed')
          `);
        } catch (transactionError) {
          console.error("Error recording transaction:", transactionError);
          // Don't throw - wallet update should still succeed
        }
      }

      return result.rows?.[0];
    } catch (error) {
      console.error("Error updating user wallet:", error);
      throw error;
    }
  }

  async deleteUser(userId: number): Promise<any> {
    try {
      // Delete user's transactions first (due to foreign key constraint)
      await db.execute(sql`
        DELETE FROM transactions WHERE user_id = ${userId}
      `);
      
      // Delete the user
      const result = await db.execute(sql`
        DELETE FROM users WHERE id = ${userId} RETURNING *
      `);

      return result.rows?.[0];
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  }

  // Agent Management Methods
  async createAgent(agentData: { name: string; email?: string; mobile?: string; password: string; territory?: string; commissionRate?: number; walletBalance?: number }): Promise<any> {
    try {
      const uniqueId = generateUserId();
      let username = generateAgentUsername();
      
      // Ensure username uniqueness
      let isUnique = false;
      while (!isUnique) {
        const existing = await db.execute(sql`SELECT id FROM users WHERE username = ${username}`);
        if (existing.rows.length === 0) {
          isUnique = true;
        } else {
          username = generateAgentUsername();
        }
      }
      
      const result = await db.execute(sql`
        INSERT INTO users (name, email, mobile, password, role, unique_user_id, username, wallet_balance, commission_rate, territory)
        VALUES (${agentData.name}, ${agentData.email || null}, ${agentData.mobile || null}, ${agentData.password}, 'agent', ${uniqueId}, ${username}, ${agentData.walletBalance || 0}, ${agentData.commissionRate || 0}, ${agentData.territory || null})
        RETURNING *
      `);
      return result.rows?.[0];
    } catch (error) {
      console.error("Error creating agent:", error);
      throw error;
    }
  }

  async getAllAgents(): Promise<any[]> {
    try {
      const result = await db.execute(sql`
        SELECT id, name, email, mobile, username, wallet_balance, commission_rate, territory, unique_user_id, created_at, is_active 
        FROM users WHERE role = 'agent' ORDER BY created_at DESC
      `);
      return result.rows || [];
    } catch (error) {
      console.error("Error fetching agents:", error);
      throw error;
    }
  }

  async updateAgentWallet(agentId: number, amount: number, reason: string): Promise<any> {
    try {
      const result = await db.execute(sql`
        UPDATE users 
        SET wallet_balance = GREATEST(0, wallet_balance + ${amount})
        WHERE id = ${agentId} AND role = 'agent'
        RETURNING *
      `);

      if (result.rows && result.rows.length > 0) {
        // Record transaction for audit trail
        await db.execute(sql`
          INSERT INTO transactions (user_id, type, amount, description, status)
          VALUES (${agentId}, ${amount > 0 ? 'deposit' : 'withdrawal'}, ${Math.abs(amount)}, ${reason}, 'completed')
        `);
      }

      return result.rows?.[0];
    } catch (error) {
      console.error("Error updating agent wallet:", error);
      throw error;
    }
  }

  async deleteAgent(agentId: number): Promise<any> {
    try {
      // First unassign all customers from this agent
      await db.execute(sql`
        UPDATE users SET assigned_agent_id = NULL WHERE assigned_agent_id = ${agentId}
      `);
      
      // Delete agent's transactions
      await db.execute(sql`
        DELETE FROM transactions WHERE user_id = ${agentId}
      `);
      
      // Delete the agent
      const result = await db.execute(sql`
        DELETE FROM users WHERE id = ${agentId} AND role = 'agent' RETURNING *
      `);

      return result.rows?.[0];
    } catch (error) {
      console.error("Error deleting agent:", error);
      throw error;
    }
  }

  async getAgentRevenue(agentId: number, startDate?: string, endDate?: string): Promise<any> {
    try {
      let dateFilter = sql``;
      if (startDate && endDate) {
        dateFilter = sql`AND DATE(t.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') BETWEEN ${startDate} AND ${endDate}`;
      }

      const result = await db.execute(sql`
        SELECT 
          COUNT(*) as total_bets,
          COALESCE(SUM(CASE WHEN t.type = 'bet' THEN t.amount ELSE 0 END), 0) as total_bet_amount,
          COALESCE(SUM(CASE WHEN t.type = 'win' THEN t.amount ELSE 0 END), 0) as total_winnings,
          COUNT(DISTINCT CASE WHEN t.agent_id = ${agentId} THEN t.user_id END) as customers_served
        FROM transactions t
        WHERE (t.agent_id = ${agentId} OR t.user_id = ${agentId})
          AND t.status = 'completed'
          ${dateFilter}
      `);
      
      return result.rows?.[0] || { total_bets: 0, total_bet_amount: 0, total_winnings: 0, customers_served: 0 };
    } catch (error) {
      console.error("Error fetching agent revenue:", error);
      throw error;
    }
  }

  async assignCustomerToAgent(customerId: number, agentId: number): Promise<any> {
    try {
      const result = await db.execute(sql`
        UPDATE users 
        SET assigned_agent_id = ${agentId}
        WHERE id = ${customerId} AND role = 'user'
        RETURNING *
      `);
      return result.rows?.[0];
    } catch (error) {
      console.error("Error assigning customer to agent:", error);
      throw error;
    }
  }

  async getAgentCustomers(agentId: number): Promise<any[]> {
    try {
      const result = await db.execute(sql`
        SELECT * FROM users WHERE assigned_agent_id = ${agentId} AND role = 'user' ORDER BY created_at DESC
      `);
      return result.rows || [];
    } catch (error) {
      console.error("Error fetching agent customers:", error);
      throw error;
    }
  }

  async getGroupedAgentBets(betNumber: string, gameName: string, startDate?: string, endDate?: string): Promise<any[]> {
    try {
      let dateFilter = sql``;
      if (startDate && endDate) {
        dateFilter = sql`AND DATE(t.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') BETWEEN ${startDate} AND ${endDate}`;
      } else {
        // Default to today's bets
        dateFilter = sql`AND DATE(t.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') = CURRENT_DATE`;
      }

      const result = await db.execute(sql`
        SELECT 
          t.agent_id,
          t.agent_name,
          COUNT(*) as bet_count,
          SUM(t.amount) as total_amount,
          array_agg(t.customer_name ORDER BY t.created_at DESC) as customer_names,
          array_agg(t.amount ORDER BY t.created_at DESC) as individual_amounts,
          array_agg(t.created_at ORDER BY t.created_at DESC) as bet_times
        FROM transactions t
        WHERE t.bet_number = ${betNumber}
          AND t.game_name = ${gameName}
          AND t.is_agent_bet = true
          AND t.status = 'completed'
          ${dateFilter}
        GROUP BY t.agent_id, t.agent_name
        ORDER BY total_amount DESC
      `);
      
      return result.rows || [];
    } catch (error) {
      console.error("Error fetching grouped agent bets:", error);
      throw error;
    }
  }

  async getAgentBetDetails(agentId: number, betNumber: string, gameName: string, startDate?: string, endDate?: string): Promise<any[]> {
    try {
      let dateFilter = sql``;
      if (startDate && endDate) {
        dateFilter = sql`AND DATE(t.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') BETWEEN ${startDate} AND ${endDate}`;
      } else {
        // Default to today's bets
        dateFilter = sql`AND DATE(t.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') = CURRENT_DATE`;
      }

      const result = await db.execute(sql`
        SELECT 
          t.id,
          t.customer_name,
          t.amount,
          t.created_at,
          t.bet_type,
          t.description
        FROM transactions t
        WHERE t.agent_id = ${agentId}
          AND t.bet_number = ${betNumber}
          AND t.game_name = ${gameName}
          AND t.is_agent_bet = true
          AND t.status = 'completed'
          ${dateFilter}
        ORDER BY t.created_at DESC
      `);
      
      return result.rows || [];
    } catch (error) {
      console.error("Error fetching agent bet details:", error);
      throw error;
    }
  }

  async getAllTransactions(): Promise<any[]> {
    try {
      const result = await db.execute(sql`
        SELECT 
          t.id,
          t.user_id as "userId",
          u.name as "userName",
          u.unique_user_id as "userUserId",
          u.mobile as "userMobile",
          t.type,
          t.amount,
          t.status,
          t.description,
          t.created_at as "createdAt"
        FROM transactions t
        LEFT JOIN users u ON t.user_id = u.id
        ORDER BY t.created_at DESC
        LIMIT 100
      `);
      
      return result.rows || [];
    } catch (error) {
      console.error("Error fetching transactions:", error);
      throw error;
    }
  }

  async getUserTransactions(userId: number): Promise<any[]> {
    try {
      const result = await db.execute(sql`
        SELECT 
          t.id,
          t.user_id as "userId",
          u.name as "userName",
          u.unique_user_id as "userUserId",
          u.mobile as "userMobile",
          t.type,
          t.amount,
          t.status,
          t.description,
          t.created_at as "createdAt"
        FROM transactions t
        LEFT JOIN users u ON t.user_id = u.id
        WHERE t.user_id = ${userId}
        ORDER BY t.created_at DESC
        LIMIT 50
      `);
      
      return result.rows || [];
    } catch (error) {
      console.error("Error fetching user transactions:", error);
      throw error;
    }
  }

  async getTotalSattaMatkaBets(startDate?: string, endDate?: string): Promise<number> {
    try {
      let dateFilter = sql``;
      if (startDate && endDate) {
        dateFilter = sql`AND DATE(t.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') BETWEEN ${startDate} AND ${endDate}`;
      } else if (startDate) {
        dateFilter = sql`AND DATE(t.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') >= ${startDate}`;
      } else if (endDate) {
        dateFilter = sql`AND DATE(t.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') <= ${endDate}`;
      } else {
        // If no date range provided, return all bets (for dashboard "All Time" view)
        dateFilter = sql``;
      }
      
      // Count bets only for games that exist in admin panel (game_results table)
      const result = await db.execute(sql`
        SELECT COUNT(*) as bet_count
        FROM transactions t
        WHERE type = 'bet' 
          AND status = 'completed' 
          AND game_name IS NOT NULL 
          AND game_name != ''
          AND EXISTS (
            SELECT 1 FROM game_results gr 
            WHERE UPPER(gr.game_name) = UPPER(t.game_name)
          )
          ${dateFilter}
      `);
      
      const betCount = parseInt((result.rows?.[0] as any)?.bet_count || '0');
      return betCount;
    } catch (error) {
      console.error("Error counting SattaMatka bets:", error);
      return 0;
    }
  }

  async getUniqueUsersToday(): Promise<number> {
    try {
      const result = await db.execute(sql`
        SELECT COUNT(DISTINCT user_id) as unique_users_count
        FROM transactions 
        WHERE DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') = DATE(NOW() AT TIME ZONE 'Asia/Kolkata')
      `);
      
      return parseInt((result.rows?.[0] as any)?.unique_users_count || '0');
    } catch (error) {
      console.error("Error counting unique users today:", error);
      return 0;
    }
  }

  async getTotalRevenue(startDate?: string, endDate?: string): Promise<number> {
    try {
      let dateFilter = sql``;
      if (startDate && endDate) {
        dateFilter = sql`AND DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') BETWEEN ${startDate} AND ${endDate}`;
      } else if (startDate) {
        dateFilter = sql`AND DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') >= ${startDate}`;
      } else if (endDate) {
        dateFilter = sql`AND DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') <= ${endDate}`;
      }
      
      const result = await db.execute(sql`
        SELECT COALESCE(SUM(amount), 0) as total_revenue
        FROM transactions 
        WHERE type = 'bet' AND status = 'completed'
        ${dateFilter}
      `);
      
      return parseFloat((result.rows?.[0] as any)?.total_revenue || '0');
    } catch (error) {
      console.error("Error calculating total revenue:", error);
      return 0;
    }
  }

  async getTodayRevenue(startDate?: string, endDate?: string): Promise<number> {
    try {
      let dateFilter = sql``;
      if (startDate && endDate) {
        dateFilter = sql`AND DATE(t.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') BETWEEN ${startDate} AND ${endDate}`;
      } else if (startDate) {
        dateFilter = sql`AND DATE(t.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') >= ${startDate}`;
      } else if (endDate) {
        dateFilter = sql`AND DATE(t.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') <= ${endDate}`;  
      } else {
        // Default to today if no dates provided
        dateFilter = sql`AND DATE(t.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') = DATE(NOW() AT TIME ZONE 'Asia/Kolkata')`;
      }
      
      // Count revenue only for games that exist in admin panel (active games) with date filtering
      const result = await db.execute(sql`
        SELECT COALESCE(SUM(amount), 0) as today_revenue
        FROM transactions t
        WHERE type = 'bet' 
          AND status = 'completed' 
          AND game_name IS NOT NULL 
          AND game_name != ''
          AND EXISTS (
            SELECT 1 FROM game_results gr 
            WHERE UPPER(gr.game_name) = UPPER(t.game_name)
          )
          ${dateFilter}
      `);
      
      return parseFloat((result.rows?.[0] as any)?.today_revenue || '0');
    } catch (error) {
      console.error("Error calculating today revenue:", error);
      return 0;
    }
  }

  async createTransaction(transactionData: { 
    userId?: number | null; 
    userName?: string;
    type: string; 
    amount: number; 
    status: string; 
    description: string;
    game_name?: string;
    bet_type?: string;
    bet_number?: string;
    agent_id?: number;
    agent_name?: string;
    is_agent_bet?: boolean;
    customer_name?: string;
  }): Promise<any> {
    try {
      const result = await db.execute(sql`
        INSERT INTO transactions (
          user_id, 
          user_name,
          type, 
          amount, 
          status, 
          description,
          game_name,
          bet_type,
          bet_number,
          agent_id,
          agent_name,
          is_agent_bet,
          customer_name
        )
        VALUES (
          ${transactionData.userId || null}, 
          ${transactionData.userName || null},
          ${transactionData.type}, 
          ${transactionData.amount}, 
          ${transactionData.status}, 
          ${transactionData.description},
          ${transactionData.game_name || null},
          ${transactionData.bet_type || null},
          ${transactionData.bet_number || null},
          ${transactionData.agent_id || null},
          ${transactionData.agent_name || null},
          ${transactionData.is_agent_bet || false},
          ${transactionData.customer_name || null}
        )
        RETURNING *
      `);
      
      return result.rows?.[0];
    } catch (error) {
      console.error("Error creating transaction:", error);
      throw error;
    }
  }

  async createDetailedTransaction(transactionData: { 
    userId: number; 
    userName: string;
    type: string; 
    amount: number; 
    status: string; 
    description: string;
    gameName?: string;
    betType?: string;
    betNumber?: string;
  }): Promise<any> {
    try {
      const result = await db.execute(sql`
        INSERT INTO transactions (user_id, type, amount, status, description, game_name, bet_type, bet_number, user_name)
        VALUES (${transactionData.userId}, ${transactionData.type}, ${transactionData.amount}, ${transactionData.status}, ${transactionData.description}, ${transactionData.gameName || null}, ${transactionData.betType || null}, ${transactionData.betNumber || null}, ${transactionData.userName || null})
        RETURNING *
      `);
      
      return result.rows?.[0];
    } catch (error) {
      console.error("Error creating detailed transaction:", error);
      throw error;
    }
  }

  async getAllLiveBets(): Promise<any[]> {
    try {
      const result = await db.execute(sql`
        SELECT 
          id,
          user_name as "userName",
          game_type as "gameType",
          selected_colors as "selectedColors",
          bet_amount as "betAmount",
          round_number as "roundNumber",
          created_at as "createdAt"
        FROM live_bets
        ORDER BY created_at DESC
        LIMIT 50
      `);
      
      return result.rows || [];
    } catch (error) {
      console.error("Error fetching live bets:", error);
      throw error;
    }
  }

  async createLiveBet(betData: { userName: string; gameType: string; selectedColors: string; betAmount: number; roundNumber: number }): Promise<any> {
    try {
      const result = await db.execute(sql`
        INSERT INTO live_bets (user_name, game_type, selected_colors, bet_amount, round_number)
        VALUES (${betData.userName}, ${betData.gameType}, ${betData.selectedColors}, ${betData.betAmount}, ${betData.roundNumber})
        RETURNING *
      `);
      
      return result.rows?.[0];
    } catch (error) {
      console.error("Error creating live bet:", error);
      throw error;
    }
  }

  async getColorKingResults(limit: number = 10): Promise<any[]> {
    try {
      const result = await db.execute(sql`
        SELECT 
          id,
          winning_color as "winningColor",
          round_number as "roundNumber",
          created_at as "createdAt"
        FROM color_king_results
        ORDER BY created_at DESC
        LIMIT ${limit}
      `);
      
      return result.rows || [];
    } catch (error) {
      console.error("Error fetching color king results:", error);
      throw error;
    }
  }

  async createColorKingResult(resultData: { winningColor: string; roundNumber: number }): Promise<any> {
    try {
      const result = await db.execute(sql`
        INSERT INTO color_king_results (winning_color, round_number)
        VALUES (${resultData.winningColor}, ${resultData.roundNumber})
        RETURNING *
      `);
      
      return result.rows?.[0];
    } catch (error) {
      console.error("Error creating color king result:", error);
      throw error;
    }
  }

  // User betting history management methods
  async getUserBettingHistory(userId: number, gameName?: string, startDate?: string, endDate?: string): Promise<any[]> {
    try {  
      let query = sql`
        SELECT 
          t.id,
          t.user_id as "userId",
          t.user_name as "userName",
          t.type,
          t.amount,
          t.status,
          t.description,
          t.game_name as "gameName",
          t.bet_type as "betType",  
          t.bet_number as "betNumber",
          t.created_at as "createdAt"
        FROM transactions t
        WHERE t.user_id = ${userId}
          AND t.type = 'bet'
          AND t.status = 'completed'
      `;

      // Add game filter if provided
      if (gameName) {
        query = sql`${query} AND UPPER(t.game_name) = UPPER(${gameName})`;
      }

      // Add date range filter with IST timezone conversion
      if (startDate && endDate) {
        query = sql`${query} 
          AND DATE(t.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') 
          BETWEEN ${startDate} AND ${endDate}`;
      } else if (startDate) {
        query = sql`${query} 
          AND DATE(t.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') = ${startDate}`;
      }

      query = sql`${query} ORDER BY t.created_at DESC`;

      const result = await db.execute(query);
      return result.rows || [];
    } catch (error) {
      console.error("Error fetching user betting history:", error);
      throw error;
    }
  }

  async getUserGameStats(userId: number): Promise<any[]> {
    try {
      const result = await db.execute(sql`
        SELECT 
          t.game_name as "gameName",
          COUNT(*) as "totalBets",
          SUM(t.amount) as "totalAmount",
          COUNT(DISTINCT DATE(t.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata')) as "activeDays",
          MIN(t.created_at) as "firstBet",
          MAX(t.created_at) as "lastBet"
        FROM transactions t
        WHERE t.user_id = ${userId}
          AND t.type = 'bet'
          AND t.status = 'completed'
          AND t.game_name IS NOT NULL
        GROUP BY t.game_name
        ORDER BY "totalAmount" DESC
      `);
      
      return result.rows || [];
    } catch (error) {
      console.error("Error fetching user game stats:", error);
      throw error;
    }
  }

  async getUserDetails(userId: number): Promise<any> {
    try {
      const result = await db.execute(sql`
        SELECT 
          u.id,
          u.name,
          u.email,
          u.mobile,
          u.unique_user_id as "uniqueUserId",
          u.wallet_balance as "walletBalance", 
          u.is_active as "isActive",
          u.created_at as "createdAt",
          u.role,
          -- Betting statistics
          COALESCE(bet_stats.total_bets, 0) as "totalBets",
          COALESCE(bet_stats.total_amount, 0) as "totalBetAmount",
          COALESCE(bet_stats.games_played, 0) as "gamesPlayed",
          COALESCE(bet_stats.first_bet, null) as "firstBet",
          COALESCE(bet_stats.last_bet, null) as "lastBet"
        FROM users u
        LEFT JOIN (
          SELECT 
            user_id,
            COUNT(*) as total_bets,
            SUM(amount) as total_amount,
            COUNT(DISTINCT game_name) as games_played,
            MIN(created_at) as first_bet,
            MAX(created_at) as last_bet
          FROM transactions
          WHERE type = 'bet' AND status = 'completed'
          GROUP BY user_id
        ) bet_stats ON u.id = bet_stats.user_id
        WHERE u.id = ${userId}
      `);
      
      return result.rows?.[0] || null;
    } catch (error) {
      console.error("Error fetching user details:", error);
      throw error;
    }
  }

  // Game-specific analytics methods implementation
  async getGameBettingStats(gameName: string, options?: { startDate?: string; endDate?: string }): Promise<{
    totalAmount: number;
    totalBets: number;
    bettingTypes: Array<{
      type: string;
      amount: number;
      bets: number;
    }>;
  }> {
    try {
      // Build base query with optional date filtering
      let baseConditions = sql`
        WHERE type = 'bet' 
        AND status = 'completed'
        AND UPPER(game_name) = UPPER(${gameName})
      `;
      
      if (options?.startDate) {
        baseConditions = sql`${baseConditions} 
          AND DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') >= ${options.startDate}`;
      }
      if (options?.endDate) {
        baseConditions = sql`${baseConditions} 
          AND DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') <= ${options.endDate}`;
      }
      
      // Get total stats for the game
      const totalResult = await db.execute(sql`
        SELECT 
          COUNT(*) as total_bets,
          COALESCE(SUM(amount), 0) as total_amount
        FROM transactions 
        ${baseConditions}
      `);
      
      // Get betting types breakdown
      const typesResult = await db.execute(sql`
        SELECT 
          bet_type as type,
          COUNT(*) as bets,
          COALESCE(SUM(amount), 0) as amount
        FROM transactions 
        ${baseConditions}
        AND bet_type IS NOT NULL
        GROUP BY bet_type
        ORDER BY amount DESC
      `);
      
      const totalRow = totalResult.rows?.[0];
      
      return {
        totalAmount: parseFloat(String(totalRow?.total_amount || '0')),
        totalBets: parseInt(String(totalRow?.total_bets || '0')),
        bettingTypes: (typesResult.rows || []).map((row: any) => ({
          type: String(row.type || 'Unknown'),
          amount: parseFloat(String(row.amount || '0')),
          bets: parseInt(String(row.bets || '0'))
        }))
      };
    } catch (error) {
      console.error("Error getting game betting stats:", error);
      return {
        totalAmount: 0,
        totalBets: 0,
        bettingTypes: []
      };
    }
  }

  async getGamePopularNumbers(gameName: string, betType?: string, options?: { startDate?: string; endDate?: string }): Promise<Array<{
    number: string;
    amount: number;
    players: number;
    betCount: number;
  }>> {
    try {
      // Build base conditions with date filtering
      let baseConditions = sql`
        WHERE type = 'bet' 
        AND status = 'completed'
        AND UPPER(game_name) = UPPER(${gameName})
        AND bet_number IS NOT NULL
      `;
      
      if (betType) {
        baseConditions = sql`${baseConditions} AND bet_type = ${betType}`;
      }
      
      if (options?.startDate) {
        baseConditions = sql`${baseConditions} 
          AND DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') >= ${options.startDate}`;
      }
      if (options?.endDate) {
        baseConditions = sql`${baseConditions} 
          AND DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') <= ${options.endDate}`;
      }
      
      const query = sql`
        SELECT 
          bet_number as number,
          COUNT(*) as bet_count,
          COUNT(DISTINCT user_id) as players,
          COALESCE(SUM(amount), 0) as amount
        FROM transactions 
        ${baseConditions}
        GROUP BY bet_number 
        ORDER BY amount DESC 
        LIMIT 10
      `;
      
      const result = await db.execute(query);
      
      return (result.rows || []).map((row: any) => ({
        number: String(row.number || ''),
        amount: parseFloat(String(row.amount || '0')),
        players: parseInt(String(row.players || '0')),
        betCount: parseInt(String(row.bet_count || '0'))
      }));
    } catch (error) {
      console.error("Error getting game popular numbers:", error);
      return [];
    }
  }

  async getGameUniqueUsers(gameName: string): Promise<number> {
    try {
      const result = await db.execute(sql`
        SELECT COUNT(DISTINCT COALESCE(user_name, customer_name)) as unique_users
        FROM transactions 
        WHERE type = 'bet' 
        AND status = 'completed'
        AND game_name = ${gameName}
        AND DATE(created_at) = CURRENT_DATE
      `);
      
      return parseInt(String(result.rows?.[0]?.unique_users || '0'));
    } catch (error) {
      console.error("Error getting game unique users:", error);
      return 0;
    }
  }

  async getGameTotalBets(gameName: string): Promise<number> {
    try {
      const result = await db.execute(sql`
        SELECT COUNT(*) as total_bets
        FROM transactions 
        WHERE type = 'bet' 
        AND (description ILIKE ${`%${gameName}%`} OR game_name = ${gameName})
      `);
      
      return parseInt(String(result.rows?.[0]?.total_bets || '0'));
    } catch (error) {
      console.error("Error getting game total bets:", error);
      return 0;
    }
  }

  async getNumberBets(gameName: string, number: string, betType?: string, options?: {
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<Array<{
    id: number;
    userId: number;
    userName: string;
    betType: string;
    betNumber: string;
    amount: number;
    createdAt: string;
    description: string;
  }>> {
    try {
      let query = sql`
        SELECT 
          id,
          user_id as "userId",
          user_name as "userName",
          bet_type as "betType", 
          bet_number as "betNumber",
          amount,
          created_at as "createdAt",
          description,
          agent_id,
          agent_name
        FROM transactions 
        WHERE type = 'bet' 
        AND status = 'completed'
        AND game_name = ${gameName}
        AND bet_number = ${number}
      `;
      
      if (betType) {
        query = sql`${query} AND bet_type = ${betType}`;
      }
      
      // Add date range filtering with IST timezone
      if (options?.startDate) {
        query = sql`${query} AND DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') >= ${options.startDate}`;
      }
      if (options?.endDate) {
        query = sql`${query} AND DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') <= ${options.endDate}`;
      }
      
      // Add sorting
      const sortBy = options?.sortBy || 'time';
      const sortOrder = options?.sortOrder || 'desc';
      
      if (sortBy === 'amount') {
        query = sql`${query} ORDER BY amount ${sortOrder === 'asc' ? sql`ASC` : sql`DESC`}`;
      } else if (sortBy === 'user') {
        query = sql`${query} ORDER BY user_name ${sortOrder === 'asc' ? sql`ASC` : sql`DESC`}`;
      } else {
        // Default to time sorting
        query = sql`${query} ORDER BY created_at ${sortOrder === 'asc' ? sql`ASC` : sql`DESC`}`;
      }
      
      const result = await db.execute(query);
      
      return (result.rows || []).map((row: any) => ({
        id: parseInt(String(row.id || '0')),
        userId: row.userId ? parseInt(String(row.userId)) : 0, // Handle null user_id for agent bets
        userName: String(row.userName || 'Unknown User'),
        betType: String(row.betType || 'Unknown'),
        betNumber: String(row.betNumber || ''),
        amount: parseFloat(String(row.amount || '0')),
        createdAt: String(row.createdAt || ''),
        description: String(row.description || ''),
        agent_id: row.agent_id ? parseInt(String(row.agent_id)) : null,
        agent_name: String(row.agent_name || '')
      }));
    } catch (error) {
      console.error("Error getting number bets:", error);
      return [];
    }
  }

  // Agent-specific methods
  async getAgentTransactions(agentId: number): Promise<any[]> {
    try {
      const result = await db.execute(sql`
        SELECT * FROM transactions 
        WHERE agent_id = ${agentId} 
        ORDER BY created_at DESC
        LIMIT 100
      `);
      return result.rows || [];
    } catch (error) {
      console.error("Error fetching agent transactions:", error);
      throw error;
    }
  }



  // Agent Ledger implementation methods
  async getAgentLedgerTransactions(filter: string): Promise<any[]> {
    try {
      let dateCondition = '';
      const today = new Date();
      const todayIST = new Date(today.getTime() + (5.5 * 60 * 60 * 1000)); // Convert to IST
      const todayStr = todayIST.toISOString().split('T')[0];

      switch (filter) {
        case 'today':
          dateCondition = `AND DATE(t.created_at + INTERVAL '5.5 hours') = '${todayStr}'`;
          break;
        case 'yesterday':
          const yesterday = new Date(todayIST);
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];
          dateCondition = `AND DATE(t.created_at + INTERVAL '5.5 hours') = '${yesterdayStr}'`;
          break;
        case 'last-7-days':
          const weekAgo = new Date(todayIST);
          weekAgo.setDate(weekAgo.getDate() - 7);
          const weekAgoStr = weekAgo.toISOString().split('T')[0];
          dateCondition = `AND DATE(t.created_at + INTERVAL '5.5 hours') >= '${weekAgoStr}'`;
          break;
        case 'all-time':
        default:
          dateCondition = '';
          break;
      }

      const result = await db.execute(sql`
        SELECT 
          t.agent_id,
          t.agent_name,
          u.email as agent_email,
          u.territory,
          u.commission_rate,
          SUM(t.amount) as total_amount,
          COUNT(*) as total_bets
        FROM transactions t
        LEFT JOIN users u ON t.agent_id = u.id
        WHERE t.is_agent_bet = true 
        AND t.status = 'completed'
        AND t.agent_id IS NOT NULL
        ${sql.raw(dateCondition)}
        GROUP BY t.agent_id, t.agent_name, u.email, u.territory, u.commission_rate
        ORDER BY total_amount DESC
      `);

      return result.rows || [];
    } catch (error) {
      console.error("Error fetching agent ledger transactions:", error);
      throw error;
    }
  }

  async getAgentLedgerStats(filter: string): Promise<{
    totalAgents: number;
    totalAmount: number;
    totalBets: number;
    totalCommission: number;
  }> {
    try {
      let dateCondition = '';
      const today = new Date();
      const todayIST = new Date(today.getTime() + (5.5 * 60 * 60 * 1000)); // Convert to IST
      const todayStr = todayIST.toISOString().split('T')[0];

      switch (filter) {
        case 'today':
          dateCondition = `AND DATE(t.created_at + INTERVAL '5.5 hours') = '${todayStr}'`;
          break;
        case 'yesterday':
          const yesterday = new Date(todayIST);
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];
          dateCondition = `AND DATE(t.created_at + INTERVAL '5.5 hours') = '${yesterdayStr}'`;
          break;
        case 'last-7-days':
          const weekAgo = new Date(todayIST);
          weekAgo.setDate(weekAgo.getDate() - 7);
          const weekAgoStr = weekAgo.toISOString().split('T')[0];
          dateCondition = `AND DATE(t.created_at + INTERVAL '5.5 hours') >= '${weekAgoStr}'`;
          break;
        case 'all-time':
        default:
          dateCondition = '';
          break;
      }

      const result = await db.execute(sql`
        SELECT 
          COUNT(DISTINCT t.agent_id) as total_agents,
          COALESCE(SUM(t.amount), 0) as total_amount,
          COUNT(*) as total_bets,
          COALESCE(SUM(t.amount * (u.commission_rate / 100)), 0) as total_commission
        FROM transactions t
        LEFT JOIN users u ON t.agent_id = u.id
        WHERE t.is_agent_bet = true 
        AND t.status = 'completed'
        AND t.agent_id IS NOT NULL
        ${sql.raw(dateCondition)}
      `);

      const stats = result.rows?.[0] || {
        total_agents: 0,
        total_amount: 0,
        total_bets: 0,
        total_commission: 0
      };

      return {
        totalAgents: Number(stats.total_agents) || 0,
        totalAmount: Number(stats.total_amount) || 0,
        totalBets: Number(stats.total_bets) || 0,
        totalCommission: Number(stats.total_commission) || 0
      };
    } catch (error) {
      console.error("Error fetching agent ledger stats:", error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();
