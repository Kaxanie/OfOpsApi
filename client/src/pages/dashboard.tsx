import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import MetricCard from "@/components/metric-card";
import { 
  DollarSign, 
  MessageCircle, 
  TrendingUp, 
  Shield,
  Plus,
  Edit,
  BarChart3,
  Pause,
  Eye,
  Users,
  ArrowUpRight,
  Clock,
  Archive
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";

const CREATOR_ID = "creator_123"; // In a real app, this would come from auth context

export default function Dashboard() {
  const [, navigate] = useLocation();

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["/api/dashboard/metrics", CREATOR_ID],
    queryFn: () => api.getDashboardMetrics(CREATOR_ID),
  });

  const { data: persona } = useQuery({
    queryKey: ["/api/personas/creator", CREATOR_ID],
    queryFn: () => api.getPersona(CREATOR_ID),
  });

  const { data: conversations } = useQuery({
    queryKey: ["/api/conversations/active", persona?.id],
    queryFn: () => persona ? api.getActiveConversations(persona.id) : Promise.resolve([]),
    enabled: !!persona?.id,
  });

  const { data: topContent } = useQuery({
    queryKey: ["/api/content/top", CREATOR_ID],
    queryFn: () => api.getTopPerformingContent(CREATOR_ID, 3),
  });

  const { data: safetyData } = useQuery({
    queryKey: ["/api/analytics/safety"],
    queryFn: () => api.getSafetyAnalytics(),
  });

  if (metricsLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const recentConversations = conversations?.slice(0, 3) || [];

  return (
    <div className="p-6">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
            <p className="text-gray-600 mt-1">Monitor your AI companion performance and revenue</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>AI Active</span>
            </div>
          </div>
        </div>
      </header>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Total Revenue"
          value={`$${metrics?.totalRevenue?.toLocaleString() || '0'}`}
          change="+23% from last month"
          changeType="positive"
          icon={<DollarSign className="w-6 h-6" />}
          iconColor="success"
        />
        
        <MetricCard
          title="Active Conversations"
          value={metrics?.activeConversations || 0}
          change="+12 new today"
          changeType="positive"
          icon={<MessageCircle className="w-6 h-6" />}
          iconColor="primary"
        />
        
        <MetricCard
          title="Conversion Rate"
          value={`${metrics?.conversionRate?.toFixed(1) || '0'}%`}
          change="+3.2% this week"
          changeType="positive"
          icon={<TrendingUp className="w-6 h-6" />}
          iconColor="secondary"
        />
        
        <MetricCard
          title="Safety Score"
          value={`${metrics?.safetyScore?.toFixed(1) || '0'}%`}
          change="Excellent compliance"
          changeType="positive"
          icon={<Shield className="w-6 h-6" />}
          iconColor="success"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        
        {/* AI Persona Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">AI Persona Status</CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate("/persona")}
              className="text-primary hover:text-primary/80"
            >
              Edit
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {persona ? (
              <>
                <div className="flex items-center space-x-3">
                  <img 
                    src="https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=150&h=150" 
                    alt="AI persona avatar" 
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-medium text-gray-900">{persona.name}</p>
                    <p className="text-sm text-gray-600">{persona.voiceKeywords?.join(', ') || 'Playful, Warm, Attentive'}</p>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-700 italic">
                    "Hey gorgeous! I was just thinking about you and wondering what you're up to today. Want to chat a bit? 💕"
                  </p>
                  <p className="text-xs text-gray-500 mt-2">Sample AI message</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{metrics?.messagesSentToday || 0}</p>
                    <p className="text-xs text-gray-600">Messages sent today</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">94%</p>
                    <p className="text-xs text-gray-600">Response rate</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No AI persona configured</p>
                <Button onClick={() => navigate("/persona")}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Persona
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Recent Conversations */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Conversations</CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate("/conversations")}
              className="text-primary hover:text-primary/80"
            >
              View All
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentConversations.length > 0 ? (
              recentConversations.map((conv) => (
                <div key={conv.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <img 
                    src={`https://images.unsplash.com/photo-${Math.floor(Math.random() * 1000000000000)}?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100`} 
                    alt="User avatar" 
                    className="w-10 h-10 rounded-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100";
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {conv.fan?.handle || '@unknown'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleDateString() : 'Today'}
                      </p>
                    </div>
                    <p className="text-sm text-gray-600 truncate">
                      {conv.threadSummary || 'Active conversation'}
                    </p>
                  </div>
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No active conversations</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Revenue Overview */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Revenue Overview</CardTitle>
            <select className="text-sm border border-gray-300 rounded-lg px-3 py-1">
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>Last 90 days</option>
            </select>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-900">Custom Videos</span>
              </div>
              <span className="text-sm font-bold text-gray-900">$4,200</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-900">Chat Sessions</span>
              </div>
              <span className="text-sm font-bold text-gray-900">$2,850</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-pink-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-pink-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-900">Photo Sets</span>
              </div>
              <span className="text-sm font-bold text-gray-900">$1,450</span>
            </div>
            
            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">Total This Week</span>
                <span className="text-lg font-bold text-gray-900">$8,500</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Content Performance */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Top Performing Content</CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate("/content")}
              className="text-primary hover:text-primary/80"
            >
              Library
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {topContent && topContent.length > 0 ? (
              topContent.map((content) => (
                <div key={content.id} className="flex items-center space-x-3">
                  <img 
                    src={content.thumbnailUrl || content.url} 
                    alt="Content thumbnail" 
                    className="w-12 h-8 rounded object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=150&h=100";
                    }}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{content.title}</p>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-xs text-gray-500">{content.purchaseCount} purchases</span>
                      <span className="text-xs font-medium text-green-600">
                        ${parseFloat(content.revenue).toFixed(0)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Archive className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No content available</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Safety & Moderation */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Safety Dashboard</CardTitle>
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              All Clear
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Messages Moderated Today</span>
              <span className="text-sm font-bold text-gray-900">{metrics?.moderatedToday || 0}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Auto-blocked Messages</span>
              <span className="text-sm font-bold text-yellow-600">{metrics?.blockedToday || 0}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Human Review Queue</span>
              <span className="text-sm font-bold text-gray-900">{safetyData?.pendingReviews || 0}</span>
            </div>
            
            <div className="pt-4 border-t border-gray-100">
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Compliance Score</span>
                  <span className="text-gray-900">{safetyData?.complianceScore?.toFixed(1) || 98.2}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${safetyData?.complianceScore || 98.2}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate("/safety")}
            >
              View Detailed Report
            </Button>
          </CardContent>
        </Card>
        
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              className="w-full justify-center"
              onClick={() => navigate("/content")}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Content
            </Button>
            
            <Button 
              variant="secondary" 
              className="w-full justify-center"
              onClick={() => navigate("/persona")}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit AI Persona
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full justify-center"
              onClick={() => navigate("/analytics")}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              View Full Analytics
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full justify-center text-yellow-600 border-yellow-200 hover:bg-yellow-50"
            >
              <Pause className="w-4 h-4 mr-2" />
              Pause AI Activity
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Feed */}
      <Card className="mt-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Recent Activity</CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate("/analytics")}
            className="text-primary hover:text-primary/80"
          >
            View All Activity
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start space-x-3 p-4 border border-gray-100 rounded-lg">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-4 h-4 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-900">New payment received from <span className="font-medium">@michael_k</span></p>
              <p className="text-xs text-gray-500 mt-1">Custom video request - $40.00 • 2 minutes ago</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3 p-4 border border-gray-100 rounded-lg">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-900">AI started conversation with new follower <span className="font-medium">@alexdoe</span></p>
              <p className="text-xs text-gray-500 mt-1">Sent welcome message • 5 minutes ago</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3 p-4 border border-gray-100 rounded-lg">
            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Shield className="w-4 h-4 text-yellow-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-900">Message flagged by moderation system</p>
              <p className="text-xs text-gray-500 mt-1">Auto-blocked inappropriate request • 12 minutes ago</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
