import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  MessageCircle, 
  DollarSign,
  Download,
  Calendar,
  Eye,
  Heart,
  Clock,
  Shield,
  Target,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Activity
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CREATOR_ID = "creator_123";

export default function Analytics() {
  const [timeRange, setTimeRange] = useState("30d");
  const [metricType, setMetricType] = useState("all");

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["/api/dashboard/metrics", CREATOR_ID],
    queryFn: () => api.getDashboardMetrics(CREATOR_ID),
  });

  const { data: revenue } = useQuery({
    queryKey: ["/api/analytics/revenue", CREATOR_ID],
    queryFn: () => api.getRevenue(CREATOR_ID),
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

  const { data: safetyData } = useQuery({
    queryKey: ["/api/analytics/safety"],
    queryFn: () => api.getSafetyAnalytics(),
  });

  // Calculate derived metrics
  const totalFans = conversations?.length || 0;
  const avgResponseTime = "2.3"; // Mock - would be calculated from message timestamps
  const engagementRate = totalFans > 0 ? ((metrics?.activeConversations || 0) / totalFans * 100) : 0;

  // Mock time series data - in a real app this would come from APIs
  const revenueChart = [
    { date: "Jan", value: 2400 },
    { date: "Feb", value: 2800 },
    { date: "Mar", value: 3200 },
    { date: "Apr", value: 2900 },
    { date: "May", value: 3800 },
    { date: "Jun", value: 4200 },
  ];

  const conversationChart = [
    { date: "Jan", conversations: 120, messages: 2400 },
    { date: "Feb", conversations: 145, messages: 2890 },
    { date: "Mar", conversations: 180, messages: 3600 },
    { date: "Apr", conversations: 165, messages: 3300 },
    { date: "May", conversations: 210, messages: 4200 },
    { date: "Jun", conversations: 248, messages: 4960 },
  ];

  const topPerformingHours = [
    { hour: "6 PM", activity: 85 },
    { hour: "7 PM", activity: 92 },
    { hour: "8 PM", activity: 100 },
    { hour: "9 PM", activity: 78 },
    { hour: "10 PM", activity: 65 },
  ];

  const MetricCard = ({ 
    title, 
    value, 
    change, 
    changeType, 
    icon: Icon, 
    description 
  }: {
    title: string;
    value: string | number;
    change: string;
    changeType: 'positive' | 'negative' | 'neutral';
    icon: any;
    description?: string;
  }) => {
    const changeColors = {
      positive: 'text-green-600',
      negative: 'text-red-600',
      neutral: 'text-gray-600'
    };

    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <p className="text-3xl font-bold text-gray-900">{value}</p>
              <div className="flex items-center space-x-1">
                {changeType === 'positive' && <ArrowUpRight className="w-4 h-4 text-green-600" />}
                {changeType === 'negative' && <ArrowDownRight className="w-4 h-4 text-red-600" />}
                <p className={`text-sm font-medium ${changeColors[changeType]}`}>
                  {change}
                </p>
              </div>
              {description && (
                <p className="text-xs text-gray-500">{description}</p>
              )}
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <Icon className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const SimpleChart = ({ 
    data, 
    title, 
    valueKey 
  }: { 
    data: any[], 
    title: string, 
    valueKey: string 
  }) => {
    const maxValue = Math.max(...data.map(d => d[valueKey]));
    
    return (
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-900">{title}</h4>
        <div className="space-y-3">
          {data.map((item, index) => (
            <div key={index} className="flex items-center space-x-3">
              <div className="w-16 text-xs text-gray-600">
                {item.date || item.hour}
              </div>
              <div className="flex-1 bg-gray-100 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(item[valueKey] / maxValue) * 100}%` }}
                />
              </div>
              <div className="w-12 text-xs font-medium text-gray-900 text-right">
                {typeof item[valueKey] === 'number' ? item[valueKey].toLocaleString() : item[valueKey]}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (metricsLoading) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600 mt-1">Comprehensive insights into your AI companion performance</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Key Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Revenue"
            value={`$${(revenue?.totalRevenue / 100 || 0).toLocaleString()}`}
            change="+23.5% vs last month"
            changeType="positive"
            icon={DollarSign}
            description="Gross revenue across all products"
          />
          
          <MetricCard
            title="Active Conversations"
            value={metrics?.activeConversations || 0}
            change="+12 new this week"
            changeType="positive"
            icon={MessageCircle}
            description="Currently engaged users"
          />
          
          <MetricCard
            title="Conversion Rate"
            value={`${metrics?.conversionRate?.toFixed(1) || 0}%`}
            change="+3.2% improvement"
            changeType="positive"
            icon={Target}
            description="Visitors to paying customers"
          />
          
          <MetricCard
            title="Engagement Rate"
            value={`${engagementRate.toFixed(1)}%`}
            change="+5.8% this month"
            changeType="positive"
            icon={Heart}
            description="Active vs total fan ratio"
          />
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Avg Response Time"
            value={`${avgResponseTime}s`}
            change="-0.5s faster"
            changeType="positive"
            icon={Zap}
            description="AI response latency"
          />
          
          <MetricCard
            title="Safety Score"
            value={`${metrics?.safetyScore?.toFixed(1) || 0}%`}
            change="Excellent rating"
            changeType="positive"
            icon={Shield}
            description="Compliance & moderation"
          />
          
          <MetricCard
            title="Total Fans"
            value={totalFans}
            change="+25 this week"
            changeType="positive"
            icon={Users}
            description="Unique engaged users"
          />
          
          <MetricCard
            title="Messages Today"
            value={metrics?.messagesSentToday || 0}
            change="+8.3% vs yesterday"
            changeType="positive"
            icon={Activity}
            description="AI messages sent today"
          />
        </div>

        {/* Charts and Detailed Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Revenue Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                Revenue Trends
              </CardTitle>
              <CardDescription>Monthly revenue performance over time</CardDescription>
            </CardHeader>
            <CardContent>
              <SimpleChart 
                data={revenueChart} 
                title="Monthly Revenue ($)" 
                valueKey="value" 
              />
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">$4,200</p>
                  <p className="text-sm text-gray-600">This Month</p>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">$18,400</p>
                  <p className="text-sm text-gray-600">Total (6 months)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Conversation Analytics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageCircle className="w-5 h-5 mr-2" />
                Conversation Analytics
              </CardTitle>
              <CardDescription>User engagement and messaging patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <SimpleChart 
                data={conversationChart} 
                title="Active Conversations" 
                valueKey="conversations" 
              />
              <Separator className="my-4" />
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Avg. Messages per Conversation</span>
                  <span className="font-medium">23.5</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Avg. Conversation Duration</span>
                  <span className="font-medium">18.2 min</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Return Rate</span>
                  <span className="font-medium text-green-600">76.3%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Peak Activity Hours */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Peak Activity Hours
              </CardTitle>
              <CardDescription>When your fans are most active</CardDescription>
            </CardHeader>
            <CardContent>
              <SimpleChart 
                data={topPerformingHours} 
                title="Activity Level (%)" 
                valueKey="activity" 
              />
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-900">
                  💡 Peak hour: 8 PM - 9 PM
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Schedule premium content releases during peak hours for maximum engagement
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Fan Demographics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Fan Insights
              </CardTitle>
              <CardDescription>User behavior and spending patterns</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Spending Tiers</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">VIP ($100+)</span>
                    </div>
                    <span className="text-sm font-medium">12%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Premium ($25-$99)</span>
                    </div>
                    <span className="text-sm font-medium">28%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Regular ($5-$24)</span>
                    </div>
                    <span className="text-sm font-medium">35%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                      <span className="text-sm text-gray-600">Free</span>
                    </div>
                    <span className="text-sm font-medium">25%</span>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Top Preferences</h4>
                <div className="space-y-2">
                  <Badge variant="outline" className="mr-2 mb-1">Custom Videos (45%)</Badge>
                  <Badge variant="outline" className="mr-2 mb-1">Chat Sessions (32%)</Badge>
                  <Badge variant="outline" className="mr-2 mb-1">Photo Sets (23%)</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Performance Summary
            </CardTitle>
            <CardDescription>
              Key insights and recommendations based on your analytics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Achievements */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">🎉 Achievements</h4>
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-sm font-medium text-green-800">Revenue Goal Met</p>
                    <p className="text-xs text-green-600">Exceeded monthly target by 23%</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-blue-800">High Engagement</p>
                    <p className="text-xs text-blue-600">76% fan retention rate</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="text-sm font-medium text-purple-800">Safety Excellence</p>
                    <p className="text-xs text-purple-600">98.2% compliance score</p>
                  </div>
                </div>
              </div>

              {/* Opportunities */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">💡 Opportunities</h4>
                <div className="space-y-3">
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <p className="text-sm font-medium text-yellow-800">Peak Hour Optimization</p>
                    <p className="text-xs text-yellow-600">Schedule more content at 8 PM</p>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <p className="text-sm font-medium text-orange-800">Free User Conversion</p>
                    <p className="text-xs text-orange-600">25% of fans haven't made purchases</p>
                  </div>
                  <div className="p-3 bg-pink-50 rounded-lg">
                    <p className="text-sm font-medium text-pink-800">Content Diversification</p>
                    <p className="text-xs text-pink-600">Audio content underutilized</p>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">🎯 Recommendations</h4>
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-800">A/B Test Pricing</p>
                    <p className="text-xs text-gray-600">Try $35-45 for custom videos</p>
                  </div>
                  <div className="p-3 bg-indigo-50 rounded-lg">
                    <p className="text-sm font-medium text-indigo-800">Personalize Outreach</p>
                    <p className="text-xs text-indigo-600">Target inactive premium users</p>
                  </div>
                  <div className="p-3 bg-teal-50 rounded-lg">
                    <p className="text-sm font-medium text-teal-800">Expand Offerings</p>
                    <p className="text-xs text-teal-600">Add voice message packages</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
