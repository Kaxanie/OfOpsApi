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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  DollarSign, 
  TrendingUp, 
  CreditCard, 
  Download, 
  Calendar,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Banknote,
  PieChart
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CREATOR_ID = "creator_123";

export default function Payments() {
  const [searchTerm, setSearchTerm] = useState("");
  const [timeFilter, setTimeFilter] = useState("all");

  const { data: revenue } = useQuery({
    queryKey: ["/api/analytics/revenue", CREATOR_ID],
    queryFn: () => api.getRevenue(CREATOR_ID),
  });

  const { data: metrics } = useQuery({
    queryKey: ["/api/dashboard/metrics", CREATOR_ID],
    queryFn: () => api.getDashboardMetrics(CREATOR_ID),
  });

  // Mock payment data - in a real app, this would come from the API
  const mockPayments = [
    {
      id: "pay_1",
      fanHandle: "@michael_k",
      amount: 4000,
      productType: "custom_video",
      status: "completed",
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "pay_2", 
      fanHandle: "@sarah_fan",
      amount: 2500,
      productType: "chat_session",
      status: "completed",
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "pay_3",
      fanHandle: "@alex_m",
      amount: 1500,
      productType: "photo_set",
      status: "pending",
      createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "pay_4",
      fanHandle: "@david_rose",
      amount: 3500,
      productType: "custom_video",
      status: "completed",
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "pay_5",
      fanHandle: "@jenny_star",
      amount: 2000,
      productType: "chat_session",
      status: "failed",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-700";
      case "pending": return "bg-yellow-100 text-yellow-700";
      case "failed": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getProductTypeLabel = (type: string) => {
    switch (type) {
      case "custom_video": return "Custom Video";
      case "chat_session": return "Chat Session";
      case "photo_set": return "Photo Set";
      default: return type;
    }
  };

  const formatAmount = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return "Yesterday";
    return date.toLocaleDateString();
  };

  const filteredPayments = mockPayments.filter(payment => {
    const matchesSearch = payment.fanHandle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         getProductTypeLabel(payment.productType).toLowerCase().includes(searchTerm.toLowerCase());
    
    if (timeFilter === "all") return matchesSearch;
    
    const paymentDate = new Date(payment.createdAt);
    const now = new Date();
    
    switch (timeFilter) {
      case "today":
        return matchesSearch && paymentDate.toDateString() === now.toDateString();
      case "week":
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return matchesSearch && paymentDate > weekAgo;
      case "month":
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return matchesSearch && paymentDate > monthAgo;
      default:
        return matchesSearch;
    }
  });

  const revenueByType = {
    "Custom Videos": 4200,
    "Chat Sessions": 2850,
    "Photo Sets": 1450,
  };

  const totalRevenue = Object.values(revenueByType).reduce((sum, value) => sum + value, 0);

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Revenue & Payments</h1>
            <p className="text-gray-600 mt-1">Track your earnings and payment history</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
            <Button>
              <Calendar className="w-4 h-4 mr-2" />
              Custom Date Range
            </Button>
          </div>
        </div>

        {/* Revenue Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold">${(revenue?.totalRevenue / 100 || 0).toLocaleString()}</p>
                  <p className="text-sm text-green-600 flex items-center mt-1">
                    <ArrowUpRight className="w-3 h-3 mr-1" />
                    +23% from last month
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">This Month</p>
                  <p className="text-2xl font-bold">$8,500</p>
                  <p className="text-sm text-green-600 flex items-center mt-1">
                    <ArrowUpRight className="w-3 h-3 mr-1" />
                    +15% vs last month
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Transactions</p>
                  <p className="text-2xl font-bold">{revenue?.paymentCount || 0}</p>
                  <p className="text-sm text-green-600 flex items-center mt-1">
                    <ArrowUpRight className="w-3 h-3 mr-1" />
                    +8 this week
                  </p>
                </div>
                <CreditCard className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Average Order</p>
                  <p className="text-2xl font-bold">
                    ${revenue?.paymentCount ? ((revenue.totalRevenue / 100) / revenue.paymentCount).toFixed(2) : '0.00'}
                  </p>
                  <p className="text-sm text-gray-600 flex items-center mt-1">
                    <ArrowUpRight className="w-3 h-3 mr-1" />
                    Trending up
                  </p>
                </div>
                <Banknote className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Revenue by Product Type */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <PieChart className="w-5 h-5 mr-2" />
                Revenue by Product Type
              </CardTitle>
              <CardDescription>Last 30 days breakdown</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(revenueByType).map(([type, amount]) => (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-medium">{type}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">${amount.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">
                      {((amount / totalRevenue) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent High-Value Transactions */}
          <Card>
            <CardHeader>
              <CardTitle>High-Value Transactions</CardTitle>
              <CardDescription>Transactions over $30 in the last week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockPayments
                  .filter(p => p.amount >= 3000 && p.status === "completed")
                  .slice(0, 4)
                  .map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{payment.fanHandle}</p>
                        <p className="text-sm text-gray-600">{getProductTypeLabel(payment.productType)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">{formatAmount(payment.amount)}</p>
                        <p className="text-xs text-gray-500">{formatDate(payment.createdAt)}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search payments..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={timeFilter} onValueChange={setTimeFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Payment History */}
        <Card>
          <CardHeader>
            <CardTitle>Payment History ({filteredPayments.length})</CardTitle>
            <CardDescription>
              Detailed transaction log with status updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredPayments.length > 0 ? (
              <div className="space-y-4">
                {filteredPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {/* Transaction Icon */}
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-blue-600" />
                    </div>
                    
                    {/* Transaction Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="font-medium text-gray-900">{payment.fanHandle}</p>
                        <span className="text-gray-500">•</span>
                        <p className="text-sm text-gray-600">{getProductTypeLabel(payment.productType)}</p>
                      </div>
                      <p className="text-sm text-gray-500">
                        Transaction ID: {payment.id} • {formatDate(payment.createdAt)}
                      </p>
                    </div>
                    
                    {/* Amount and Status */}
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">{formatAmount(payment.amount)}</p>
                      <Badge variant="secondary" className={getStatusColor(payment.status)}>
                        {payment.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {searchTerm || timeFilter !== "all" ? "No payments found" : "No payments yet"}
                </h3>
                <p className="text-gray-600">
                  {searchTerm || timeFilter !== "all" 
                    ? "Try adjusting your search or filters" 
                    : "Payment history will appear here once transactions start coming in"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
