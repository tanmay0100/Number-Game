import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

interface WebSocketContextType {
  isConnected: boolean;
  sendMessage: (message: any) => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

interface WebSocketProviderProps {
  children: ReactNode;
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const connectWebSocket = () => {
      try {
        wsRef.current = new WebSocket(wsUrl);
        
        wsRef.current.onopen = () => {
          console.log("🔌 WebSocket connected globally");
          setIsConnected(true);
        };
        
        wsRef.current.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            console.log("📨 Global WebSocket message:", message);
            
            if (message.type === 'BET_PLACED') {
              console.log("🎯 Global bet placed - invalidating all analytics caches");
              
              // Invalidate all admin analytics queries
              queryClient.invalidateQueries({ 
                queryKey: ['/api/admin/total-bets'] 
              });
              queryClient.invalidateQueries({ 
                predicate: (query) => {
                  const key = query.queryKey[0] as string;
                  return key?.includes('/api/admin/game-betting-stats') ||
                         key?.includes('/api/admin/game-popular-numbers') ||
                         key?.includes('/api/admin/game-unique-users') ||
                         key?.includes('/api/admin/number-bets');
                }
              });
              
              // Show toast notification
              toast({
                title: "New Bet Placed!",
                description: `${message.data.userName} placed ₹${message.data.amount} on ${message.data.gameName}`,
                duration: 3000
              });
            }
          } catch (error) {
            console.error("❌ WebSocket message parsing error:", error);
          }
        };
        
        wsRef.current.onclose = () => {
          console.log("🔌 WebSocket disconnected - reconnecting in 3s");
          setIsConnected(false);
          setTimeout(connectWebSocket, 3000);
        };
        
        wsRef.current.onerror = (error) => {
          console.error("❌ WebSocket error:", error);
          setIsConnected(false);
        };
      } catch (error) {
        console.error("❌ WebSocket connection error:", error);
        setTimeout(connectWebSocket, 3000);
      }
    };
    
    connectWebSocket();
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [queryClient]);

  const sendMessage = (message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  };

  return (
    <WebSocketContext.Provider value={{ isConnected, sendMessage }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within WebSocketProvider');
  }
  return context;
}