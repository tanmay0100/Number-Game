import { useState } from "react";
import { ArrowLeft, User, Bell, Shield, Eye, EyeOff, Save, Wallet } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

export default function Settings() {
  const { user } = useAuth();
  
  // Fetch updated user data for wallet balance
  const { data: allUsers } = useQuery({
    queryKey: ["/api/admin/users"],
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 10000,
  });

  // Get current user with latest wallet balance
  const currentUser = allUsers?.find((u: any) => u.id === user?.id || u.email === user?.email);
  
  const [showPassword, setShowPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: ""
  });
  const [notifications, setNotifications] = useState({
    gameResults: true,
    promotions: false,
    winnings: true,
    maintenance: true
  });

  const handleBackToDashboard = () => {
    window.history.back();
  };

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNotificationChange = (field: string, value: boolean) => {
    setNotifications(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleUpdatePassword = () => {
    // Here you would typically make an API call to update password
    console.log("Updating password");
    setPasswordData({ newPassword: "", confirmPassword: "" });
  };

  const handleSaveNotifications = () => {
    // Here you would typically make an API call to update notification settings
    console.log("Saving notifications:", notifications);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="px-4 py-3 flex items-center justify-between">
          <button 
            onClick={handleBackToDashboard}
            className="p-2 hover:bg-gray-100 rounded-lg flex items-center gap-2"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm font-medium">Back</span>
          </button>

          <h1 className="text-lg font-semibold text-gray-900">Settings</h1>

          <div className="flex items-center gap-4">
            {/* Wallet */}
            <div className="flex items-center gap-2 bg-green-50 px-3 py-2 rounded-lg">
              <Wallet className="h-4 w-4 text-green-600" />
              <span className="text-green-700 font-semibold">
                ₹{currentUser?.wallet_balance || '0.00'}
              </span>
            </div>
            
            {/* Profile */}
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 md:p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <p className="text-sm text-gray-600">Your account details (Read-only)</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={user?.name || ""}
                    disabled
                    className="mt-1 bg-gray-50"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ""}
                    disabled
                    className="mt-1 bg-gray-50"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="mobile">Mobile Number</Label>
                <Input
                  id="mobile"
                  value={user?.mobile || ""}
                  disabled
                  className="mt-1 bg-gray-50"
                />
              </div>

              <div>
                <Label htmlFor="userId">User ID</Label>
                <Input
                  id="userId"
                  value={currentUser?.unique_user_id || "Loading..."}
                  disabled
                  className="mt-1 bg-gray-50"
                />
              </div>

              <div>
                <Label htmlFor="walletBalance">Wallet Balance</Label>
                <Input
                  id="walletBalance"
                  value={`₹${currentUser?.wallet_balance || 0}`}
                  disabled
                  className="mt-1 bg-gray-50"
                />
              </div>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Change Password
              </CardTitle>
              <p className="text-sm text-gray-600">Update your password for security</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) => handlePasswordChange("newPassword", e.target.value)}
                    className="mt-1 pr-10"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  value={passwordData.confirmPassword}
                  onChange={(e) => handlePasswordChange("confirmPassword", e.target.value)}
                  className="mt-1"
                  placeholder="Confirm new password"
                />
              </div>

              <Button 
                onClick={handleUpdatePassword}
                className="w-full" 
                disabled={!passwordData.newPassword || passwordData.newPassword !== passwordData.confirmPassword}
              >
                <Save className="h-4 w-4 mr-2" />
                Update Password
              </Button>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Settings
              </CardTitle>
              <p className="text-sm text-gray-600">Choose what notifications you want to receive</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="gameResults">Game Results</Label>
                  <p className="text-sm text-gray-600">Get notified when game results are announced</p>
                </div>
                <Switch
                  id="gameResults"
                  checked={notifications.gameResults}
                  onCheckedChange={(value) => handleNotificationChange("gameResults", value)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="promotions">Promotions & Offers</Label>
                  <p className="text-sm text-gray-600">Receive special offers and promotions</p>
                </div>
                <Switch
                  id="promotions"
                  checked={notifications.promotions}
                  onCheckedChange={(value) => handleNotificationChange("promotions", value)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="winnings">Winnings & Payouts</Label>
                  <p className="text-sm text-gray-600">Get notified about your winnings</p>
                </div>
                <Switch
                  id="winnings"
                  checked={notifications.winnings}
                  onCheckedChange={(value) => handleNotificationChange("winnings", value)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="maintenance">Maintenance Updates</Label>
                  <p className="text-sm text-gray-600">Important system maintenance notifications</p>
                </div>
                <Switch
                  id="maintenance"
                  checked={notifications.maintenance}
                  onCheckedChange={(value) => handleNotificationChange("maintenance", value)}
                />
              </div>

              <Button onClick={handleSaveNotifications} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                Save Notification Settings
              </Button>
            </CardContent>
          </Card>

          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-blue-600">Account Information</CardTitle>
              <p className="text-sm text-gray-600">Important account details</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Account Status:</strong> Active
                </p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>Member Since:</strong> {currentUser?.created_at ? new Date(currentUser.created_at).toLocaleDateString('hi-IN') : "Recently"}
                </p>
              </div>
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  );
}