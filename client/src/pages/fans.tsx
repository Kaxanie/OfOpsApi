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
import { 
  Users, 
  Search, 
  Filter, 
  DollarSign, 
  Heart, 
  Clock, 
  TrendingUp,
  UserPlus,
  Star,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CREATOR_ID = "creator_123";

export default function Fans() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBy, setFilterBy] = useState("all");

  const { data: persona } = useQuery({
    queryKey: ["/api/personas/creator", CREATOR_ID],
    queryFn: () => api.getPersona(CREATOR_ID),
  });

  const { data: conversations, isLoading } = useQuery({
    queryKey: ["/api/conversations/active", persona?.id],
    queryFn: () => persona ? api.getActiveConversations(persona.id) : Promise.resolve([]),
    enabled: !!persona?.id,
  });

  // Extract unique fans from conversations
  const fans = conversations?.map(conv => conv.fan).filter(Boolean) || [];
  
  const filteredFans = fans.filter(fan => {
    if (!fan) return false;
    
    const matchesSearch = fan.handle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         fan.displayName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterBy === "all") return matchesSearch;
    if (filterBy === "high-value") return matchesSearch && fan.spendTier !== "free";
    if (filterBy === "verified") return matchesSearch && fan.consentStatus?.ageAffirmed;
    if (filterBy === "recent") {
      const lastPurchase = fan.lastPurchaseAt ? new Date(fan.lastPurchaseAt) : null;
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return matchesSearch && lastPurchase && lastPurchase > weekAgo;
    }
    
    return matchesSearch;
  });

  const getSpendTierInfo = (tier: string) => {
    switch (tier) {
      case "vip":
        return { color: "bg-purple-100 text-purple-700 border-purple-200", icon: Star, label: "VIP" };
      case "premium":
        return { color: "bg-blue-100 text-blue-700 border-blue-200", icon: TrendingUp, label: "Premium" };
      case "regular":
        return { color: "bg-green-100 text-green-700 border-green-200", icon: DollarSign, label: "Regular" };
      default:
        return { color: "bg-gray-100 text-gray-700 border-gray-200", icon: Users, label: "Free" };
    }
  };

  const formatJoinDate = (dateString?: string) => {
    if (!dateString) return "Unknown";
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
  };

  const getConsentStatus = (fan: any) => {
    const consent = fan.consentStatus;
    if (!consent) return { icon: AlertCircle, color: "text-red-500", label: "No Consent" };
    if (consent.ageAffirmed && consent.romanticContent) {
      return { icon: CheckCircle, color: "text-green-500", label: "Verified" };
    }
    return { icon: AlertCircle, color: "text-yellow-500", label: "Partial" };
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const statsData = {
    total: fans.length,
    verified: fans.filter(f => f?.consentStatus?.ageAffirmed).length,
    highValue: fans.filter(f => f?.spendTier !== "free").length,
    recent: fans.filter(f => {
      if (!f?.lastPurchaseAt) return false;
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return new Date(f.lastPurchaseAt) > weekAgo;
    }).length,
  };

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Fans & Users</h1>
            <p className="text-gray-600 mt-1">Manage your fan base and user relationships</p>
          </div>
          <Button className="flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            Export Data
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Fans</p>
                  <p className="text-2xl font-bold">{statsData.total}</p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Verified Users</p>
                  <p className="text-2xl font-bold">{statsData.verified}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">High Value</p>
                  <p className="text-2xl font-bold">{statsData.highValue}</p>
                </div>
                <Star className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Recent Activity</p>
                  <p className="text-2xl font-bold">{statsData.recent}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-orange-500" />
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
                    placeholder="Search by handle or name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={filterBy} onValueChange={setFilterBy}>
                <SelectTrigger className="w-40">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Fans</SelectItem>
                  <SelectItem value="high-value">High Value</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="recent">Recent Activity</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Fans List */}
        <Card>
          <CardHeader>
            <CardTitle>Fan Directory ({filteredFans.length})</CardTitle>
            <CardDescription>
              Detailed view of your fan base and their engagement metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredFans.length > 0 ? (
              <div className="space-y-4">
                {filteredFans.map((fan) => {
                  if (!fan) return null;
                  
                  const tierInfo = getSpendTierInfo(fan.spendTier);
                  const TierIcon = tierInfo.icon;
                  const consentInfo = getConsentStatus(fan);
                  const ConsentIcon = consentInfo.icon;
                  
                  return (
                    <div
                      key={fan.id}
                      className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      {/* Avatar */}
                      <img
                        src={`https://images.unsplash.com/photo-${Math.floor(Math.random() * 1000000000000)}?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100`}
                        alt="Fan avatar"
                        className="w-12 h-12 rounded-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100";
                        }}
                      />
                      
                      {/* Fan Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <p className="font-medium text-gray-900">{fan.handle}</p>
                          {fan.displayName && (
                            <p className="text-sm text-gray-500">({fan.displayName})</p>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>Joined {formatJoinDate(fan.createdAt)}</span>
                          {fan.timezone && <span>• {fan.timezone}</span>}
                        </div>
                      </div>
                      
                      {/* Badges and Status */}
                      <div className="flex items-center space-x-3">
                        {/* Spend Tier */}
                        <Badge variant="outline" className={tierInfo.color}>
                          <TierIcon className="w-3 h-3 mr-1" />
                          {tierInfo.label}
                        </Badge>
                        
                        {/* Consent Status */}
                        <div className={`flex items-center space-x-1 ${consentInfo.color}`}>
                          <ConsentIcon className="w-4 h-4" />
                          <span className="text-xs font-medium">{consentInfo.label}</span>
                        </div>
                        
                        {/* Last Purchase */}
                        {fan.lastPurchaseAt && (
                          <div className="flex items-center space-x-1 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            <span>Recent purchase</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          View Profile
                        </Button>
                        <Button variant="ghost" size="sm">
                          Message
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {searchTerm || filterBy !== "all" ? "No fans found" : "No fans yet"}
                </h3>
                <p className="text-gray-600">
                  {searchTerm || filterBy !== "all" 
                    ? "Try adjusting your search or filters" 
                    : "Fans will appear here once they start interacting with your AI"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
