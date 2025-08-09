import { useState, useEffect } from "react";
import { type User } from "@shared/schema";

// Global state for instant authentication
let globalUser: User | null = null;
let globalStateCallbacks: Array<(user: User | null) => void> = [];

// Expose globalStateCallbacks for WebSocket updates
if (typeof window !== 'undefined') {
  (window as any).globalStateCallbacks = globalStateCallbacks;
}

// Initialize from localStorage immediately
try {
  const stored = localStorage.getItem('user');
  if (stored) {
    const userData = JSON.parse(stored);
    // Check if the user data has expired
    if (userData.expiresAt && Date.now() > userData.expiresAt) {
      localStorage.removeItem('user');
      globalUser = null;
    } else {
      // Remove the expiration timestamp from the user object before setting it
      const { expiresAt, ...userWithoutExpiry } = userData;
      globalUser = userWithoutExpiry;
    }
  }
} catch (error) {
  localStorage.removeItem('user');
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(globalUser);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Register for global state updates
    globalStateCallbacks.push(setUser);
    
    // Update window reference when callbacks change
    if (typeof window !== 'undefined') {
      (window as any).globalStateCallbacks = globalStateCallbacks;
    }
    
    return () => {
      globalStateCallbacks = globalStateCallbacks.filter(cb => cb !== setUser);
      // Update window reference after cleanup
      if (typeof window !== 'undefined') {
        (window as any).globalStateCallbacks = globalStateCallbacks;
      }
    };
  }, []);

  const login = (userData: User, rememberMe: boolean = false) => {
    globalUser = userData;
    
    if (rememberMe) {
      // Set expiration for 30 days if remember me is checked
      const expiration = new Date();
      expiration.setDate(expiration.getDate() + 30);
      const userWithExpiry = {
        ...userData,
        expiresAt: expiration.getTime()
      };
      localStorage.setItem('user', JSON.stringify(userWithExpiry));
    } else {
      // Set expiration for 1 day if remember me is not checked
      const expiration = new Date();
      expiration.setDate(expiration.getDate() + 1);
      const userWithExpiry = {
        ...userData,
        expiresAt: expiration.getTime()
      };
      localStorage.setItem('user', JSON.stringify(userWithExpiry));
    }
    
    // Update all components instantly
    globalStateCallbacks.forEach(callback => callback(userData));
  };

  const logout = () => {
    globalUser = null;
    localStorage.removeItem('user');
    
    // Don't remove login form values if Remember Me was enabled
    // Those should persist for user convenience
    
    // Update all components instantly
    globalStateCallbacks.forEach(callback => callback(null));
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
  };
}