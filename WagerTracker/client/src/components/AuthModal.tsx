import { useState, useEffect } from "react";
import { X, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertUserSchema, loginUserSchema, type InsertUser, type LoginUser } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();
  const { login } = useAuth();

  // Simple base64 encoding for password storage (basic security)
  const encodePassword = (password: string) => {
    return btoa(password);
  };

  const decodePassword = (encodedPassword: string) => {
    try {
      return atob(encodedPassword);
    } catch {
      return "";
    }
  };

  // Get saved form values from localStorage
  const getSavedFormValues = () => {
    try {
      const saved = localStorage.getItem('loginFormValues');
      if (saved) {
        const parsedValues = JSON.parse(saved);
        return {
          emailOrMobile: parsedValues.emailOrMobile || "",
          password: parsedValues.encodedPassword ? decodePassword(parsedValues.encodedPassword) : "",
          rememberMe: parsedValues.rememberMe || false,
        };
      }
    } catch (error) {
      console.error("Error loading saved form values:", error);
    }
    return {
      emailOrMobile: "",
      password: "",
      rememberMe: false,
    };
  };

  // Login form
  const loginForm = useForm<LoginUser>({
    resolver: zodResolver(loginUserSchema),
    defaultValues: getSavedFormValues(),
  });

  // Load saved values when modal opens
  useEffect(() => {
    if (isOpen) {
      const savedValues = getSavedFormValues();
      loginForm.reset(savedValues);
    }
  }, [isOpen, loginForm]);

  // Registration form
  const registrationForm = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      name: "",
      email: "",
      mobile: "",
      password: "",
      confirmPassword: "",
      referralCode: "",
    },
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (data: LoginUser) => {
      const response = await apiRequest("/api/auth/login", "POST", data);
      return response.json();
    },
    onSuccess: (data, variables: any) => {
      const endTime = performance.now();
      const duration = variables._startTime ? Math.round(endTime - variables._startTime) : 0;
      console.log(`✅ Login completed in ${duration}ms`);
      
      const formData = loginForm.getValues();
      login(data.user, formData.rememberMe);
      
      // Check user role for routing
      const isAdmin = data.user.role === 'admin' || data.user.email === 'admin';
      const isAgent = data.user.role === 'agent';
      
      toast({
        title: "Login Successful", 
        description: `Welcome back ${data.user.name}!`,
      });
      onClose();
      
      // Force page reload to trigger router update
      setTimeout(() => {
        if (isAdmin) {
          window.location.href = '/admin-dashboard';
        } else if (isAgent) {
          window.location.href = '/agent-panel';
        } else {
          window.location.href = '/';
        }
      }, 500);
      
      // Save form values to localStorage if Remember Me is checked
      if (formData.rememberMe) {
        const formValuesToSave = {
          emailOrMobile: formData.emailOrMobile,
          encodedPassword: encodePassword(formData.password),
          rememberMe: true,
        };
        localStorage.setItem('loginFormValues', JSON.stringify(formValuesToSave));
        
        // Don't reset form, keep all values for next time
      } else {
        // Clear saved form values and reset form
        localStorage.removeItem('loginFormValues');
        loginForm.reset();
      }
    },
    onError: (error) => {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    },
  });

  // Registration mutation
  const registrationMutation = useMutation({
    mutationFn: async (data: InsertUser) => {
      const response = await apiRequest("/api/auth/register", "POST", data);
      return response.json();
    },
    onSuccess: (data) => {
      login(data.user);
      toast({
        title: "Registration Successful",
        description: `Welcome ${data.user.name}! Your User ID: ${data.user.uniqueUserId}`,
      });
      onClose();
      registrationForm.reset();
      setActiveTab("login");
      
      // Force page reload to trigger router update
      setTimeout(() => {
        const isAdmin = data.user.role === 'admin' || data.user.email === 'admin';
        if (isAdmin) {
          window.location.href = '/admin-dashboard';
        } else {
          window.location.href = '/';
        }
      }, 500);
    },
    onError: (error) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    },
  });

  const onLoginSubmit = (data: LoginUser) => {
    console.log("🚀 Login process started...");
    const startTime = performance.now();
    
    loginMutation.mutate({
      ...data,
      _startTime: startTime // Pass start time for performance tracking
    });
  };

  const onRegistrationSubmit = (data: InsertUser) => {
    registrationMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Login & Registration</DialogTitle>
          <DialogDescription className="text-center text-sm text-gray-600">
            Access your account or create a new one to start playing
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="mt-6">
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                <FormField
                  control={loginForm.control}
                  name="emailOrMobile"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email / Mobile / Username</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter email, mobile number, or username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type={showPassword ? "text" : "password"} 
                            placeholder="Enter password" 
                            {...field} 
                          />
                          <button
                            type="button"
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={loginForm.control}
                  name="rememberMe"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Remember me for 30 days
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "Logging in..." : "Login"}
                </Button>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="signup" className="mt-6">
            <Form {...registrationForm}>
              <form onSubmit={registrationForm.handleSubmit(onRegistrationSubmit)} className="space-y-4">
                <FormField
                  control={registrationForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Enter Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={registrationForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="Enter email address" 
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={registrationForm.control}
                  name="mobile"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mobile Number</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter mobile number" 
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={registrationForm.control}
                  name="referralCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Referral Code (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter referral code" 
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={registrationForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type={showRegPassword ? "text" : "password"} 
                            placeholder="Enter password" 
                            {...field} 
                          />
                          <button
                            type="button"
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            onClick={() => setShowRegPassword(!showRegPassword)}
                          >
                            {showRegPassword ? (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={registrationForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type={showConfirmPassword ? "text" : "password"} 
                            placeholder="Confirm password" 
                            {...field} 
                          />
                          <button
                            type="button"
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={registrationMutation.isPending}
                >
                  {registrationMutation.isPending ? "Creating Account..." : "Create Account"}
                </Button>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}