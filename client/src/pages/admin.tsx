import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  ChevronDown,
  ChevronUp,
  Download,
  Search,
  FileText,
  Calendar,
  MapPin,
  User,
  Phone,
  Mail,
  Home,
  AlertCircle,
  Shield,
  Building2,
  Clock,
  MessageSquare,
  UserCheck,
} from "lucide-react";
import { format } from "date-fns";
import type { Claim, User as UserType, InsurancePolicy, AuditLog, ClaimNote } from "@shared/schema";
import { ClaimDetailsModal } from "@/components/claim-details-modal";

export default function AdminDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  const { data: claims = [], isLoading } = useQuery<Claim[]>({
    queryKey: ["/api/claims"],
    enabled: isAuthenticated,
  });

  const { data: users = [] } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
    enabled: isAuthenticated,
  });

  const { data: policies = [] } = useQuery<InsurancePolicy[]>({
    queryKey: ["/api/policies"],
    enabled: isAuthenticated,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: number;
      status: "pending" | "approved" | "rejected";
    }) => {
      const response = await fetch(`/api/claims/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        throw new Error("Failed to update status");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/claims"] });
    },
  });

  const assignClaimMutation = useMutation({
    mutationFn: async ({ id, handlerUserId, policyId }: { id: number; handlerUserId?: number; policyId?: number }) => {
      await apiRequest("PATCH", `/api/claims/${id}/assign`, { handlerUserId, policyId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/claims"] });
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple password check - in production, use proper authentication
    if (password === "moreland2024") {
      setIsAuthenticated(true);
      setAuthError("");
    } else {
      setAuthError("Incorrect password");
    }
  };

  const filteredClaims = claims.filter((claim) => {
    const matchesSearch =
      claim.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.claimantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.propertyAddress.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || claim.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const exportToCSV = () => {
    const headers = [
      "Reference",
      "Date Submitted",
      "Claimant Name",
      "Email",
      "Phone",
      "Property Address",
      "Incident Type",
      "Incident Date",
      "Status",
    ];

    const rows = filteredClaims.map((claim) => [
      claim.referenceNumber,
      format(new Date(claim.submittedAt), "yyyy-MM-dd HH:mm"),
      claim.claimantName,
      claim.claimantEmail,
      claim.claimantPhone,
      claim.propertyAddress,
      formatIncidentType(claim.incidentType),
      format(new Date(claim.incidentDate), "yyyy-MM-dd"),
      claim.status,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${cell?.toString().replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `claims-export-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  const formatIncidentType = (type: string) => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "approved":
        return "default";
      case "rejected":
        return "destructive";
      default:
        return "secondary";
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Admin Access
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Input
                  type="password"
                  placeholder="Enter admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  data-testid="input-admin-password"
                />
                {authError && (
                  <p className="text-sm text-destructive mt-2">{authError}</p>
                )}
              </div>
              <Button type="submit" className="w-full" data-testid="button-admin-login">
                Access Dashboard
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading claims...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Claims Management</h1>
            <p className="text-muted-foreground">
              {filteredClaims.length} claim{filteredClaims.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/policies">
              <Button variant="outline" data-testid="button-manage-policies">
                <Building2 className="h-4 w-4 mr-2" />
                Manage Policies
              </Button>
            </Link>
            <Link href="/admin/loss-assessors">
              <Button variant="outline" data-testid="button-manage-assessors">
                <UserCheck className="h-4 w-4 mr-2" />
                Manage Loss Assessors
              </Button>
            </Link>
            <Button
              onClick={exportToCSV}
              variant="outline"
              disabled={filteredClaims.length === 0}
              data-testid="button-export-csv"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by reference, name, or address..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-claims"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48" data-testid="select-status-filter">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Claimant</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Incident</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClaims.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <p className="text-muted-foreground">No claims found</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredClaims.map((claim) => (
                      <>
                        <TableRow
                          key={claim.id}
                          className="cursor-pointer hover-elevate"
                          onClick={() =>
                            setExpandedRow(
                              expandedRow === claim.id ? null : claim.id
                            )
                          }
                          data-testid={`row-claim-${claim.id}`}
                        >
                          <TableCell>
                            {expandedRow === claim.id ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {claim.referenceNumber}
                          </TableCell>
                          <TableCell>
                            {format(new Date(claim.submittedAt), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell>{claim.claimantName}</TableCell>
                          <TableCell className="max-w-xs truncate">
                            {claim.propertyAddress}
                          </TableCell>
                          <TableCell>
                            {formatIncidentType(claim.incidentType)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(claim.status)}>
                              {claim.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedClaim(claim);
                              }}
                              data-testid={`button-view-${claim.id}`}
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                        {expandedRow === claim.id && (
                          <TableRow>
                            <TableCell colSpan={8} className="bg-muted/50">
                              <div className="p-4 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                  <div>
                                    <p className="text-sm font-medium mb-2">
                                      Contact Information
                                    </p>
                                    <div className="space-y-1 text-sm">
                                      <div className="flex items-center gap-2">
                                        <Mail className="h-3 w-3 text-muted-foreground" />
                                        {claim.claimantEmail}
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Phone className="h-3 w-3 text-muted-foreground" />
                                        {claim.claimantPhone}
                                      </div>
                                    </div>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium mb-2">
                                      Incident Details
                                    </p>
                                    <div className="space-y-1 text-sm">
                                      <div className="flex items-center gap-2">
                                        <Calendar className="h-3 w-3 text-muted-foreground" />
                                        {format(
                                          new Date(claim.incidentDate),
                                          "PPP"
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <AlertCircle className="h-3 w-3 text-muted-foreground" />
                                        {formatIncidentType(claim.incidentType)}
                                      </div>
                                    </div>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium mb-2">
                                      Assign Handler
                                    </p>
                                    <Select
                                      value={claim.handlerUserId?.toString() || "unassigned"}
                                      onValueChange={(value) => {
                                        const handlerUserId = value === "unassigned" ? null : parseInt(value);
                                        assignClaimMutation.mutate({
                                          id: claim.id,
                                          handlerUserId: handlerUserId || undefined,
                                        });
                                      }}
                                    >
                                      <SelectTrigger data-testid={`select-handler-${claim.id}`}>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="unassigned">Unassigned</SelectItem>
                                        {users.map((user) => (
                                          <SelectItem key={user.id} value={user.id.toString()}>
                                            {user.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium mb-2">
                                      Link Policy
                                    </p>
                                    <Select
                                      value={claim.policyId?.toString() || "none"}
                                      onValueChange={(value) => {
                                        const policyId = value === "none" ? null : parseInt(value);
                                        assignClaimMutation.mutate({
                                          id: claim.id,
                                          policyId: policyId || undefined,
                                        });
                                      }}
                                    >
                                      <SelectTrigger data-testid={`select-policy-${claim.id}`}>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="none">No Policy</SelectItem>
                                        {policies.map((policy) => (
                                          <SelectItem key={policy.id} value={policy.id.toString()}>
                                            {policy.policyName}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                                <div>
                                  <p className="text-sm font-medium mb-2">
                                    Incident Description
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {claim.incidentDescription}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <ClaimDetailsModal
          claim={selectedClaim}
          users={users}
          onClose={() => setSelectedClaim(null)}
        />
      </div>
    </div>
  );
}
