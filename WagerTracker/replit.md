# SattaMatka Website

## Overview
This project is a full-stack web application for a SattaMatka (Indian gambling game) website. It provides live game results, user and agent management, and various gaming features with a responsive design supporting both English and Hindi content. The ambition is to create a robust and dynamic platform for online SattaMatka, offering a comprehensive and engaging user experience.

## User Preferences
Preferred communication style: Hindi/Hinglish language responses.
Architecture preference: Separated microservices architecture (frontend, backend, database separate).

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter
- **State Management**: TanStack Query
- **UI Framework**: shadcn/ui (built on Radix UI)
- **Styling**: Tailwind CSS with custom CSS variables
- **Build Tool**: Vite

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database
- **Session Management**: Express sessions with PostgreSQL store
- **Development**: TSX

### Database Schema
- **PostgreSQL Database**: Integrated with Neon Database.
- **Key Tables**: Users, Game Results, Game Rates, Transactions.
- **Schema Location**: `shared/schema.ts` using Drizzle ORM.
- **Migrations**: Managed through Drizzle Kit.

### Core Architectural Decisions & Features
- **Monorepo Structure**: Integrated client, server, and shared directories.
- **Internationalization**: English and Hindi content support.
- **User Management**: Comprehensive user, admin, and agent roles with authentication and wallet management.
- **Game Management**: Dynamic game rates, real-time results display, comprehensive chart systems for various SattaMatka games.
- **Betting System**: Single Ank, Jodi, Single Patti, Double Patti, Triple Patti, and Color King games with real-time betting, validation, and transaction recording.
- **Analytics**: Real-time admin dashboard with revenue, bet, and user statistics, featuring advanced date range filtering and sorting.
- **Agent Management**: Dedicated agent panel, offline bet placement, customer management, grouped agent bet display, and real-time agent wallet updates.
- **Performance Optimization**: Event-based API system, smart caching, and reduced continuous polling to minimize server load.
- **UI/UX Design**: Responsive design with consistent theming, glassmorphism effects, and category-specific color schemes (Blue for SattaMatka, Purple for ColorKing, Green for DiceGame).

## External Dependencies

### Frontend Dependencies
- **UI Components**: Radix UI
- **Form Handling**: React Hook Form with Zod
- **Date Utilities**: date-fns
- **Icons**: Lucide React
- **Carousel**: Embla Carousel

### Backend Dependencies
- **ORM**: Drizzle ORM
- **Validation**: Zod
- **Session Store**: connect-pg-simple
- **Database**: Neon Database

### Development Tools
- **Type Checking**: TypeScript
- **Build Tools**: Vite (frontend), ESBuild (backend)