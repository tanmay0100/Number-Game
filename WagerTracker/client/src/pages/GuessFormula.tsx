import { useState } from "react";
import { ArrowLeft, Send, MessageCircle, Clock, User, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { guessingPostSchema, type InsertGuessingPost, type GameResult } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import AuthModal from "@/components/AuthModal";

interface GuessingPost {
  id: number;
  user_id: number;
  user_name: string;
  game_name: string;
  guess_date: string;
  formula: string;
  created_at: string;
}

export default function GuessFormula() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Fetch all games for selection
  const { data: games = [] } = useQuery<GameResult[]>({
    queryKey: ["/api/live-results"],
  });

  // Fetch guessing posts
  const { data: posts = [], isLoading: postsLoading } = useQuery<GuessingPost[]>({
    queryKey: ["/api/guessing-posts"],
    refetchInterval: 10000, // Auto-refresh every 10 seconds
  });

  // Form setup
  const form = useForm<InsertGuessingPost>({
    resolver: zodResolver(guessingPostSchema),
    defaultValues: {
      gameName: "",
      guessDate: new Date().toISOString().split('T')[0], // Today's date
      formula: "",
    },
  });

  // Post creation mutation
  const createPostMutation = useMutation({
    mutationFn: async (data: InsertGuessingPost & { userId: number; userName: string }) => {
      const response = await fetch("/api/guessing-posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error(await response.text());
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Your guessing formula has been posted.",
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/guessing-posts"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to post formula.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertGuessingPost) => {
    if (!isAuthenticated || !user) {
      toast({
        title: "Login Required",
        description: "Please login to post your formula.",
        variant: "destructive",
      });
      return;
    }

    createPostMutation.mutate({
      ...data,
      userId: user.id,
      userName: user.name,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4 text-blue-600 hover:text-blue-800">
              <ArrowLeft className="mr-2" size={20} />
              Back to Home
            </Button>
          </Link>
          
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-6">
            <div className="flex items-center space-x-3">
              <Calculator size={32} />
              <div>
                <h1 className="text-3xl font-bold">Guessing Formula</h1>
                <p className="text-blue-100 mt-2">Share and discover winning formulas from the community</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Posts List - Left Side (2 columns) */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md">
              <div className="p-6 border-b bg-gray-50">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                  <MessageCircle className="mr-3" size={24} />
                  Community Posts ({posts.length})
                </h2>
              </div>
              
              <div className="p-6">
                {postsLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-gray-500">Loading posts...</p>
                  </div>
                ) : posts.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageCircle className="mx-auto h-16 w-16 text-gray-300 mb-6" />
                    <h3 className="text-lg font-medium text-gray-600 mb-2">No posts yet</h3>
                    <p className="text-gray-500">Be the first to share your winning formula!</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {posts.map((post) => (
                      <div key={post.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="bg-blue-100 p-2 rounded-full">
                              <User className="text-blue-600" size={20} />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-800">{post.user_name}</h3>
                              <div className="flex items-center space-x-2 text-sm text-gray-500">
                                <span className="font-medium text-purple-600">{post.game_name}</span>
                                <span>•</span>
                                <span>For {formatDate(post.guess_date)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <Clock size={16} />
                            <span>{formatTime(post.created_at)}</span>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{post.formula}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Post Form - Right Side (1 column) */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md sticky top-8">
              <div className="p-6 border-b bg-gray-50">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                  <Send className="mr-3" size={24} />
                  Share Your Formula
                </h2>
              </div>

              <div className="p-6">
                {!isAuthenticated ? (
                  <div className="text-center py-8">
                    <div className="bg-blue-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <MessageCircle className="text-blue-600" size={24} />
                    </div>
                    <h3 className="text-lg font-medium text-gray-600 mb-2">Login Required</h3>
                    <p className="text-gray-500 mb-6">Please login to share your formula with the community</p>
                    <Button 
                      onClick={() => setIsAuthModalOpen(true)}
                      className="bg-blue-500 hover:bg-blue-600"
                    >
                      Login to Post
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Game
                      </label>
                      <Select
                        value={form.watch("gameName")}
                        onValueChange={(value) => form.setValue("gameName", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose game..." />
                        </SelectTrigger>
                        <SelectContent>
                          {games.map((game) => (
                            <SelectItem key={game.id} value={game.gameName}>
                              {game.gameName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {form.formState.errors.gameName && (
                        <p className="text-red-500 text-sm mt-1">{form.formState.errors.gameName.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Guess Date
                      </label>
                      <Input
                        type="date"
                        {...form.register("guessDate")}
                        className="w-full"
                      />
                      {form.formState.errors.guessDate && (
                        <p className="text-red-500 text-sm mt-1">{form.formState.errors.guessDate.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Your Formula
                      </label>
                      <Textarea
                        {...form.register("formula")}
                        placeholder="Share your guessing formula, tips, or analysis here..."
                        rows={8}
                        className="w-full resize-none"
                      />
                      {form.formState.errors.formula && (
                        <p className="text-red-500 text-sm mt-1">{form.formState.errors.formula.message}</p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      disabled={createPostMutation.isPending}
                      className="w-full bg-blue-500 hover:bg-blue-600 py-3"
                    >
                      {createPostMutation.isPending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Posting...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2" size={18} />
                          Post Formula
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}