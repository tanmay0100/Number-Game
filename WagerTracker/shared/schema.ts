import { pgTable, text, serial, integer, boolean, timestamp, varchar, decimal, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Generate unique user ID - USR + 1-digit batch + 2-letter random suffix
export function generateUserId(): string {
  const batch = Math.floor(Math.random() * 10); // 0-9
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const suffix = letters.charAt(Math.floor(Math.random() * letters.length)) + 
                letters.charAt(Math.floor(Math.random() * letters.length));
  return `USR${batch}${suffix}`;
}

// Generate unique agent username - AG + 6 random alphanumeric characters
export function generateAgentUsername(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'AG';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: varchar("email"),
  mobile: varchar("mobile"),
  password: text("password").notNull(),
  role: varchar("role").default("user"), // "user", "admin", or "agent"
  referralCode: varchar("referral_code"),
  uniqueUserId: varchar("unique_user_id").notNull().unique(),
  username: varchar("username").unique(), // Agent login username (AG + 6 chars)
  walletBalance: decimal("wallet_balance", { precision: 10, scale: 2 }).default("1.00"),
  isActive: boolean("is_active").default(true),
  // Agent-specific fields
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).default("0.00"), // Agent commission percentage
  territory: varchar("territory"), // Agent's assigned territory
  assignedAgentId: integer("assigned_agent_id").references(() => users.id), // For customers assigned to agents
  createdAt: timestamp("created_at").defaultNow(),
});

export const gameResults = pgTable("game_results", {
  id: serial("id").primaryKey(),
  gameName: varchar("game_name").notNull(),
  result: varchar("result"), // Optional for compatibility
  startTime: varchar("start_time").notNull(),
  endTime: varchar("end_time").notNull(),
  openPatti: varchar("open_patti", { length: 3 }),
  openAnk: varchar("open_ank", { length: 1 }),
  closePatti: varchar("close_patti", { length: 3 }),
  closeAnk: varchar("close_ank", { length: 1 }),
  highlighted: boolean("highlighted").default(false),
  displayOrder: integer("display_order").default(0),
  resultDate: timestamp("result_date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const gameRates = pgTable("game_rates", {
  id: serial("id").primaryKey(),
  gameName: varchar("game_name").notNull(),
  betAmount: integer("bet_amount").notNull().default(10),
  payoutAmount: integer("payout_amount").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  type: varchar("type").notNull(), // 'deposit', 'withdrawal', 'bet', 'win'
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status").notNull().default("pending"), // 'pending', 'completed', 'failed'
  description: text("description"),
  gameName: varchar("game_name"), // For SattaMatka bets
  betType: varchar("bet_type"), // 'Single Ank', 'Jodi', 'Single Patti', 'Double Patti', 'Triple Patti'
  betNumber: varchar("bet_number"), // The number(s) bet on
  userName: varchar("user_name"), // Cached user name for performance
  // Agent-related fields
  agentId: integer("agent_id").references(() => users.id), // Agent who placed the bet (if applicable)
  agentName: varchar("agent_name"), // Cached agent name for performance
  isAgentBet: boolean("is_agent_bet").default(false), // Whether this bet was placed by an agent
  customerName: varchar("customer_name"), // For agent bets, the customer's name
  createdAt: timestamp("created_at").defaultNow(),
});

export const luckyNumbers = pgTable("lucky_numbers", {
  id: serial("id").primaryKey(),
  numberType: varchar("number_type").notNull(), // 'single', 'jodi', 'patti'
  numberValue: varchar("number_value").notNull(), // The actual number (e.g., '5', '23', '123')
  displayOrder: integer("display_order").notNull().default(1),
  isActive: boolean("is_active").notNull().default(true),
  dateCreated: timestamp("date_created").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const chartResults = pgTable("chart_results", {
  id: serial("id").primaryKey(),
  gameName: varchar("game_name", { length: 50 }).notNull(),
  resultDate: date("result_date").notNull(),
  dayOfWeek: varchar("day_of_week", { length: 10 }).notNull(), // 'Monday', 'Tuesday', etc.
  weekNumber: integer("week_number").notNull(), // Week of year
  year: integer("year").notNull(),
  openPanna: varchar("open_panna", { length: 10 }),
  jodi: varchar("jodi", { length: 10 }),
  closePanna: varchar("close_panna", { length: 10 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Guessing Formula Posts Table
export const guessingPosts = pgTable("guessing_posts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  userName: varchar("user_name", { length: 255 }).notNull(),
  gameName: varchar("game_name", { length: 255 }).notNull(),
  guessDate: date("guess_date").notNull(),
  formula: text("formula").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// App Settings Table
export const appSettings = pgTable("app_settings", {
  id: serial("id").primaryKey(),
  settingKey: varchar("setting_key", { length: 255 }).notNull().unique(),
  settingValue: text("setting_value").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Live Betting History Table for Color King Game
export const liveBets = pgTable("live_bets", {
  id: serial("id").primaryKey(),
  userName: varchar("user_name", { length: 255 }).notNull(),
  gameType: varchar("game_type", { length: 50 }).notNull().default("color-king"),
  selectedColors: text("selected_colors").notNull(), // JSON array of colors
  betAmount: integer("bet_amount").notNull(),
  roundNumber: integer("round_number").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Color King Results Table - Shared across all users
export const colorKingResults = pgTable("color_king_results", {
  id: serial("id").primaryKey(),
  winningColor: varchar("winning_color", { length: 10 }).notNull(), // 'red', 'green', 'yellow', 'blue'
  roundNumber: integer("round_number").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().optional(),
  mobile: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  referralCode: z.string().optional(),
  confirmPassword: z.string().min(1, "Confirm password is required"),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords must match",
  path: ["confirmPassword"],
}).refine(data => data.email || data.mobile, {
  message: "Either email or mobile number is required",
  path: ["email"],
});

export const loginUserSchema = z.object({
  emailOrMobile: z.string().min(1, "Email or mobile number is required"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional().default(false),
});

// Schema for adding new game (name + timing only)
export const addGameSchema = z.object({
  gameName: z.string().min(1, "Game name is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  highlighted: z.boolean().optional().default(false),
});

// Schema for updating game result (can update open or close or both)
export const updateGameResultSchema = z.object({
  gameId: z.number().min(1, "Game selection is required"),
  resultDate: z.string().min(1, "Result date is required"),
  openPatti: z.string().refine(val => val === "" || /^\d{3}$/.test(val), "Open Patti must be 3 digits or empty").optional(),
  openAnk: z.string().refine(val => val === "" || /^\d{1}$/.test(val), "Open Ank must be 1 digit or empty").optional(),
  closePatti: z.string().refine(val => val === "" || /^\d{3}$/.test(val), "Close Patti must be 3 digits or empty").optional(),
  closeAnk: z.string().refine(val => val === "" || /^\d{1}$/.test(val), "Close Ank must be 1 digit or empty").optional(),
});

// Legacy schema for compatibility
export const liveMatkaResultSchema = z.object({
  gameName: z.string().min(1, "Game name is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  openPatti: z.string().regex(/^\d{3}$/, "Open Patti must be 3 digits").optional(),
  openAnk: z.string().regex(/^\d{1}$/, "Open Ank must be 1 digit").optional(),
  closePatti: z.string().regex(/^\d{3}$/, "Close Patti must be 3 digits").optional(),
  closeAnk: z.string().regex(/^\d{1}$/, "Close Ank must be 1 digit").optional(),
});

// Schema for lucky numbers management
export const luckyNumberSchema = z.object({
  numberType: z.enum(["single", "jodi", "patti"], { 
    errorMap: () => ({ message: "Type must be single, jodi, or patti" }) 
  }),
  numberValue: z.string().min(1, "Number value is required"),
  displayOrder: z.number().min(1).default(1),
  isActive: z.boolean().default(true),
});

export const guessingPostSchema = z.object({
  gameName: z.string().min(1, "Game selection is required"),
  guessDate: z.string().min(1, "Guess date is required"),
  formula: z.string().min(1, "Formula is required"),
});

// Live Betting Schema
export const liveBetSchema = z.object({
  userName: z.string().min(1, "User name is required"),
  gameType: z.string().default("color-king"),
  selectedColors: z.string().min(1, "Selected colors required"),
  betAmount: z.number().min(1, "Bet amount must be positive"),
  roundNumber: z.number().min(1, "Round number required"),
});

// Type definitions
export type LiveBet = typeof liveBets.$inferSelect;
export type InsertLiveBet = z.infer<typeof liveBetSchema>;

export const appSettingSchema = z.object({
  settingKey: z.string().min(1, "Setting key is required"),
  settingValue: z.string().min(1, "Setting value is required"),
  description: z.string().optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type AddGame = z.infer<typeof addGameSchema>;
export type UpdateGameResult = z.infer<typeof updateGameResultSchema>;
export type LiveMatkaResult = z.infer<typeof liveMatkaResultSchema>;
export type LuckyNumber = typeof luckyNumbers.$inferSelect;
export type InsertLuckyNumber = z.infer<typeof luckyNumberSchema>;
export type GuessingPost = typeof guessingPosts.$inferSelect;
export type InsertGuessingPost = z.infer<typeof guessingPostSchema>;
export type AppSetting = typeof appSettings.$inferSelect;
export type InsertAppSetting = z.infer<typeof appSettingSchema>;
export type User = typeof users.$inferSelect;
export type GameResult = typeof gameResults.$inferSelect;
export type ChartResult = typeof chartResults.$inferSelect;
