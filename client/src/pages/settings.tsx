import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Settings as SettingsIcon, 
  CreditCard, 
  Shield, 
  Bell, 
  User, 
  Key,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Info
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const CREATOR_ID = "creator_123"; // In a real app, this would come from auth context

export default function Settings() {
  const { toast } = useToast();
  const [stripeConnected, setStripeConnected] = useState(false);
  const [notifications, setNotifications] = useState({
    newMessages: true,
    payments: true,
    safetyAlerts: true,
    dailyReports: false
  });

  const handleStripeSetup = () => {
    // Open Stripe dashboard in popup
    const stripeUrl = "https://dashboard.stripe.com/apikeys";
    const popup = window.open(
      stripeUrl, 
      'stripe-setup', 
      'width=800,height=600,scrollbars=yes,resizable=yes'
    );
    
    toast({
      title: "Stripe Setup",
      description: "Opening Stripe dashboard to get your API keys.",
    });
  };

  const handleSaveStripeKeys = () => {
    // In a real app, this would save the keys securely
    setStripeConnected(true);
    toast({
      title: "Stripe Connected",
      description: "Your payment processing is now active!",
    });
  };

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
    toast({
      title: "Settings Updated",
      description: `${key} notifications ${value ? 'enabled' : 'disabled'}`,
    });
  };

  return (
    <div className="container mx-auto p-4 space-y-6 max-w-4xl">
      <div className="flex items-center space-x-2 mb-6">
        <SettingsIcon className="w-6 h-6" />
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <Tabs defaultValue="payment" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="payment" className="flex items-center space-x-2">
            <CreditCard className="w-4 h-4" />
            <span className="hidden sm:inline">Payment</span>
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex items-center space-x-2">
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="safety" className="flex items-center space-x-2">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Safety</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center space-x-2">
            <Bell className="w-4 h-4" />
            <span className="hidden sm:inline">Alerts</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="payment" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl">Stripe Payment Setup</CardTitle>
              {stripeConnected ? (
                <Badge variant="default" className="bg-green-100 text-green-700">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Connected
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Not Connected
                </Badge>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Connect your Stripe account to receive payments from fans for custom content and chat sessions.
                </AlertDescription>
              </Alert>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="stripe-public">Stripe Publishable Key</Label>
                  <Input 
                    id="stripe-public" 
                    placeholder="pk_test_..." 
                    type="password"
                    className="font-mono text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stripe-secret">Stripe Secret Key</Label>
                  <Input 
                    id="stripe-secret" 
                    placeholder="sk_test_..." 
                    type="password"
                    className="font-mono text-sm"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={handleStripeSetup}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Get Stripe API Keys</span>
                </Button>
                <Button 
                  onClick={handleSaveStripeKeys}
                  className="flex items-center space-x-2"
                >
                  <Key className="w-4 h-4" />
                  <span>Save & Connect</span>
                </Button>
              </div>

              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">How to get your Stripe keys:</h4>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Click "Get Stripe API Keys" to open Stripe dashboard</li>
                  <li>Sign up for a Stripe account if you don't have one</li>
                  <li>Copy your Publishable key (starts with pk_)</li>
                  <li>Copy your Secret key (starts with sk_)</li>
                  <li>Paste both keys above and click "Save & Connect"</li>
                </ol>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Processing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="default-price">Default Content Price ($)</Label>
                  <Input 
                    id="default-price" 
                    type="number" 
                    placeholder="25" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="chat-price">Chat Session Price ($)</Label>
                  <Input 
                    id="chat-price" 
                    type="number" 
                    placeholder="15" 
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch id="auto-pricing" />
                <Label htmlFor="auto-pricing">Enable dynamic pricing based on demand</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Creator Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input id="username" placeholder="@yourhandle" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="you@example.com" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <textarea 
                  id="bio" 
                  className="w-full p-3 border rounded-md resize-none h-24"
                  placeholder="Tell your fans about yourself..."
                />
              </div>

              <Button className="w-full sm:w-auto">Save Profile</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="safety" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Content Moderation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto-moderate">Auto-moderate messages</Label>
                  <p className="text-sm text-gray-500">Automatically filter inappropriate content</p>
                </div>
                <Switch id="auto-moderate" defaultChecked />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="strict-mode">Strict safety mode</Label>
                  <p className="text-sm text-gray-500">Extra cautious content filtering</p>
                </div>
                <Switch id="strict-mode" />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="age-verification">Require age verification</Label>
                  <p className="text-sm text-gray-500">Verify fans are 18+ before allowing interactions</p>
                </div>
                <Switch id="age-verification" defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(notifications).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <Label htmlFor={key} className="capitalize">
                      {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                    </Label>
                    <p className="text-sm text-gray-500">
                      {key === 'newMessages' && 'Get notified when fans send messages'}
                      {key === 'payments' && 'Get notified about successful payments'}
                      {key === 'safetyAlerts' && 'Get notified about content moderation issues'}
                      {key === 'dailyReports' && 'Receive daily performance summaries'}
                    </p>
                  </div>
                  <Switch 
                    id={key}
                    checked={value}
                    onCheckedChange={(checked) => handleNotificationChange(key, checked)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}