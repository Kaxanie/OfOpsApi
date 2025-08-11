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
  MessageCircle, 
  Search, 
  Filter, 
  TrendingUp, 
  Clock, 
  DollarSign,
  Heart,
  AlertTriangle 
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CREATOR_ID = "creator_123";

export default function Conversations() {
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

  const filteredConversations = conversations?.filter(conv => {
    const matchesSearch = conv.fan?.handle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conv.fan?.displayName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterBy === "all") return matchesSearch;
    if (filterBy === "high-value") return matchesSearch && conv.fan?.spendTier !== "free";
    if (filterBy === "recent") {
      const lastMessage = conv.lastMessageAt ? new Date(conv.lastMessageAt) : new Date(0);
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return matchesSearch && lastMessage > dayAgo;
    }
    if (filterBy === "positive") return matchesSearch && conv.sentiment === "positive";
    
    return matchesSearch;
  }) || [];

  const getSpendTierColor = (tier: string) => {
    switch (tier) {
      case "vip": return "bg-purple-100 text-purple-700";
      case "premium": return "bg-blue-100 text-blue-700";
      case "regular": return "bg-green-100 text-green-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getSentimentIcon = (sentiment?: string) => {
    switch (sentiment) {
      case "positive": return <Heart className="w-4 h-4 text-green-600" />;
      case "negative": return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default: return <MessageCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatLastMessage = (lastMessageAt?: string) => {
    if (!lastMessageAt) return "No messages";
    
    const date = new Date(lastMessageAt);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
          <div className="h-12 bg-gray-200 rounded animate-pulse" />
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!persona) {
    return (
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No AI Persona Found</h2>
            <p className="text-gray-600">Create an AI persona first to start conversations.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Active Conversations</h1>
            <p className="text-gray-600 mt-1">Monitor and manage ongoing chats with your fans</p>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
              {filteredConversations.length} Active
            </Badge>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Conversations</p>
                  <p className="text-2xl font-bold">{conversations?.length || 0}</p>
                </div>
                <MessageCircle className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">High Value Fans</p>
                  <p className="text-2xl font-bold">
                    {conversations?.filter(c => c.fan?.spendTier !== "free").length || 0}
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
                  <p className="text-sm text-gray-600">Positive Sentiment</p>
                  <p className="text-2xl font-bold">
                    {conversations?.filter(c => c.sentiment === "positive").length || 0}
                  </p>
                </div>
                <Heart className="w-8 h-8 text-pink-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Recent Activity</p>
                  <p className="text-2xl font-bold">
                    {conversations?.filter(c => {
                      const lastMessage = c.lastMessageAt ? new Date(c.lastMessageAt) : new Date(0);
                      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                      return lastMessage > dayAgo;
                    }).length || 0}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-500" />
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
              
              <div className="flex gap-2">
                <Select value={filterBy} onValueChange={setFilterBy}>
                  <SelectTrigger className="w-40">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Conversations</SelectItem>
                    <SelectItem value="high-value">High Value Fans</SelectItem>
                    <SelectItem value="recent">Recent Activity</SelectItem>
                    <SelectItem value="positive">Positive Sentiment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conversations List */}
        <Card>
          <CardHeader>
            <CardTitle>Conversations ({filteredConversations.length})</CardTitle>
            <CardDescription>
              Click on any conversation to view details and message history
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredConversations.length > 0 ? (
              <div className="space-y-4">
                {filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
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
                        <p className="font-medium text-gray-900 truncate">
                          {conversation.fan?.handle || '@unknown'}
                        </p>
                        {conversation.fan?.displayName && (
                          <p className="text-sm text-gray-500 truncate">
                            ({conversation.fan.displayName})
                          </p>
                        )}
                        <Badge 
                          variant="secondary" 
                          className={getSpendTierColor(conversation.fan?.spendTier || 'free')}
                        >
                          {conversation.fan?.spendTier || 'free'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 truncate">
                        {conversation.threadSummary || 'No summary available'}
                      </p>
                    </div>
                    
                    {/* Conversation Stats */}
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        {getSentimentIcon(conversation.sentiment)}
                        <span className="capitalize">{conversation.sentiment || 'neutral'}</span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{formatLastMessage(conversation.lastMessageAt)}</span>
                      </div>
                    </div>
                    
                    {/* Action Indicator */}
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {searchTerm || filterBy !== "all" ? "No conversations found" : "No active conversations"}
                </h3>
                <p className="text-gray-600">
                  {searchTerm || filterBy !== "all" 
                    ? "Try adjusting your search or filters" 
                    : "Conversations will appear here once fans start chatting with your AI"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
