import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
import { Textarea } from "@/components/ui/textarea";
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Eye,
  XCircle,
  Flag,
  TrendingUp,
  Users,
  MessageCircle,
  FileText
} from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

export default function Safety() {
  const { toast } = useToast();
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState("");

  const { data: safetyData } = useQuery({
    queryKey: ["/api/analytics/safety"],
    queryFn: () => api.getSafetyAnalytics(),
  });

  const { data: moderationQueue, isLoading } = useQuery({
    queryKey: ["/api/moderation/queue"],
    queryFn: () => api.getModerationQueue(),
  });

  const { data: pendingQueue } = useQuery({
    queryKey: ["/api/moderation/queue", "pending"],
    queryFn: () => api.getModerationQueue("pending"),
  });

  const updateModerationMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => 
      api.updateModerationItem(id, { status, reviewedBy: "admin_user" }),
    onSuccess: () => {
      toast({ title: "Success", description: "Moderation item updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/moderation/queue"] });
      setSelectedItem(null);
      setReviewNote("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update moderation item",
        variant: "destructive",
      });
    },
  });

  const handleReview = (id: string, status: "approved" | "blocked") => {
    updateModerationMutation.mutate({ id, status });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-100 text-red-700 border-red-200";
      case "high": return "bg-orange-100 text-orange-700 border-orange-200";
      case "medium": return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "low": return "bg-blue-100 text-blue-700 border-blue-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved": return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "blocked": return <XCircle className="w-4 h-4 text-red-600" />;
      case "pending": return <Clock className="w-4 h-4 text-yellow-600" />;
      default: return <AlertTriangle className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const complianceScore = safetyData?.complianceScore || 98.2;
  const pendingCount = pendingQueue?.length || 0;
  const totalModerated = safetyData?.totalModerated || 0;

  const getComplianceColor = (score: number) => {
    if (score >= 95) return "text-green-600";
    if (score >= 85) return "text-yellow-600";
    return "text-red-600";
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
          <div className="h-64 bg-gray-200 rounded animate-pulse" />
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
            <h1 className="text-2xl font-bold text-gray-900">Safety & Moderation</h1>
            <p className="text-gray-600 mt-1">Monitor content safety and compliance metrics</p>
          </div>
          <Badge 
            variant="secondary" 
            className={complianceScore >= 95 ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}
          >
            {complianceScore >= 95 ? "Excellent" : "Good"} Compliance
          </Badge>
        </div>

        {/* Safety Alert */}
        {pendingCount > 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Action Required</AlertTitle>
            <AlertDescription>
              You have {pendingCount} items in the moderation queue awaiting review.
            </AlertDescription>
          </Alert>
        )}

        {/* Safety Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Compliance Score</p>
                  <p className={`text-2xl font-bold ${getComplianceColor(complianceScore)}`}>
                    {complianceScore.toFixed(1)}%
                  </p>
                </div>
                <Shield className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending Reviews</p>
                  <p className="text-2xl font-bold">{pendingCount}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Moderated</p>
                  <p className="text-2xl font-bold">{totalModerated}</p>
                </div>
                <Eye className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Auto-Blocked</p>
                  <p className="text-2xl font-bold">
                    {moderationQueue?.filter(item => item.status === "blocked").length || 0}
                  </p>
                </div>
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Safety Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Compliance Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                Safety Metrics
              </CardTitle>
              <CardDescription>
                Current system performance and safety indicators
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Compliance Score</span>
                  <span className={`font-bold ${getComplianceColor(complianceScore)}`}>
                    {complianceScore.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${complianceScore >= 95 ? 'bg-green-500' : 'bg-yellow-500'}`}
                    style={{ width: `${complianceScore}%` }}
                  ></div>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Messages Processed Today</span>
                  <span className="font-medium">1,245</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Auto-Approved</span>
                  <span className="font-medium text-green-600">98.2%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Flagged for Review</span>
                  <span className="font-medium text-yellow-600">1.5%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Auto-Blocked</span>
                  <span className="font-medium text-red-600">0.3%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageCircle className="w-5 h-5 mr-2" />
                Recent Moderation Activity
              </CardTitle>
              <CardDescription>
                Latest automated and manual moderation actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {moderationQueue?.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <div className="flex-shrink-0">
                      {getStatusIcon(item.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.flagReason}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(item.createdAt)}
                      </p>
                    </div>
                    <Badge variant="outline" className={getSeverityColor(item.severity)}>
                      {item.severity}
                    </Badge>
                  </div>
                ))}
                
                {(!moderationQueue || moderationQueue.length === 0) && (
                  <div className="text-center py-8 text-gray-500">
                    <Shield className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No recent moderation activity</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Moderation Queue */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Flag className="w-5 h-5 mr-2" />
              Moderation Queue ({moderationQueue?.length || 0})
            </CardTitle>
            <CardDescription>
              Review flagged content and take appropriate action
            </CardDescription>
          </CardHeader>
          <CardContent>
            {moderationQueue && moderationQueue.length > 0 ? (
              <div className="space-y-4">
                {moderationQueue.map((item) => (
                  <div
                    key={item.id}
                    className={`border rounded-lg p-4 ${selectedItem === item.id ? 'border-blue-500 bg-blue-50' : ''}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className={getSeverityColor(item.severity)}>
                          {item.severity} priority
                        </Badge>
                        <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                          {getStatusIcon(item.status)}
                          <span className="ml-1 capitalize">{item.status}</span>
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500">{formatDate(item.createdAt)}</p>
                    </div>
                    
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-900 mb-1">Flag Reason:</p>
                      <p className="text-sm text-gray-700">{item.flagReason}</p>
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-900 mb-1">Content:</p>
                      <div className="bg-gray-50 p-3 rounded border text-sm">
                        {item.content}
                      </div>
                    </div>
                    
                    {item.status === "pending" && (
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReview(item.id, "approved")}
                          disabled={updateModerationMutation.isPending}
                          className="text-green-600 border-green-300 hover:bg-green-50"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReview(item.id, "blocked")}
                          disabled={updateModerationMutation.isPending}
                          className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Block
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedItem(selectedItem === item.id ? null : item.id)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          {selectedItem === item.id ? "Hide Details" : "View Details"}
                        </Button>
                      </div>
                    )}
                    
                    {item.reviewedBy && (
                      <div className="mt-3 pt-3 border-t text-xs text-gray-500">
                        Reviewed by {item.reviewedBy} on {item.reviewedAt ? formatDate(item.reviewedAt) : 'Unknown'}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No items in queue</h3>
                <p className="text-gray-600">All content has been reviewed and processed</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Policy Guidelines */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Safety Guidelines
            </CardTitle>
            <CardDescription>
              Current moderation policies and compliance requirements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Automatic Blocking</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• References to minors or age-related content</li>
                  <li>• Violent or threatening language</li>
                  <li>• Requests for illegal activities</li>
                  <li>• Attempts to arrange in-person meetings</li>
                </ul>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Manual Review Required</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Borderline content that doesn't clearly violate policies</li>
                  <li>• New patterns not covered by automatic rules</li>
                  <li>• User appeals of blocked content</li>
                </ul>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Compliance Requirements</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Age verification before romantic content</li>
                  <li>• Clear disclosure of AI assistant status</li>
                  <li>• Respect for user stop words and boundaries</li>
                  <li>• Audit logging of all moderation actions</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
