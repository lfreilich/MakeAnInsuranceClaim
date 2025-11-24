import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
} from "lucide-react";
import { format } from "date-fns";
import type { Claim } from "@shared/schema";

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
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                                      Update Status
                                    </p>
                                    <Select
                                      value={claim.status}
                                      onValueChange={(value) =>
                                        updateStatusMutation.mutate({
                                          id: claim.id,
                                          status: value as
                                            | "pending"
                                            | "approved"
                                            | "rejected",
                                        })
                                      }
                                    >
                                      <SelectTrigger data-testid={`select-status-${claim.id}`}>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="pending">
                                          Pending
                                        </SelectItem>
                                        <SelectItem value="approved">
                                          Approved
                                        </SelectItem>
                                        <SelectItem value="rejected">
                                          Rejected
                                        </SelectItem>
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

        <Dialog
          open={selectedClaim !== null}
          onOpenChange={() => setSelectedClaim(null)}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Claim Details - {selectedClaim?.referenceNumber}
              </DialogTitle>
            </DialogHeader>
            {selectedClaim && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Claimant Information
                    </h3>
                    <dl className="space-y-2 text-sm">
                      <div>
                        <dt className="text-muted-foreground">Name</dt>
                        <dd>{selectedClaim.claimantName}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Email</dt>
                        <dd>{selectedClaim.claimantEmail}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Phone</dt>
                        <dd>{selectedClaim.claimantPhone}</dd>
                      </div>
                    </dl>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Home className="h-4 w-4" />
                      Property Information
                    </h3>
                    <dl className="space-y-2 text-sm">
                      <div>
                        <dt className="text-muted-foreground">Address</dt>
                        <dd>{selectedClaim.propertyAddress}</dd>
                      </div>
                      {selectedClaim.propertyBlock && (
                        <div>
                          <dt className="text-muted-foreground">Block</dt>
                          <dd>{selectedClaim.propertyBlock}</dd>
                        </div>
                      )}
                      {selectedClaim.propertyConstructionAge && (
                        <div>
                          <dt className="text-muted-foreground">
                            Construction Age
                          </dt>
                          <dd>{selectedClaim.propertyConstructionAge}</dd>
                        </div>
                      )}
                      {selectedClaim.propertyConstructionType && (
                        <div>
                          <dt className="text-muted-foreground">
                            Construction Type
                          </dt>
                          <dd>{selectedClaim.propertyConstructionType}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Incident Information
                  </h3>
                  <dl className="space-y-2 text-sm">
                    <div>
                      <dt className="text-muted-foreground">Type</dt>
                      <dd>{formatIncidentType(selectedClaim.incidentType)}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Date</dt>
                      <dd>
                        {format(new Date(selectedClaim.incidentDate), "PPP")}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Description</dt>
                      <dd className="whitespace-pre-wrap">
                        {selectedClaim.incidentDescription}
                      </dd>
                    </div>
                  </dl>
                </div>

                {selectedClaim.hasBuildingDamage && (
                  <div>
                    <h3 className="font-semibold mb-2">Building Damage</h3>
                    <dl className="space-y-2 text-sm">
                      <div>
                        <dt className="text-muted-foreground">Description</dt>
                        <dd>{selectedClaim.buildingDamageDescription}</dd>
                      </div>
                      {selectedClaim.buildingDamageAffectedAreas && (
                        <div>
                          <dt className="text-muted-foreground">
                            Affected Areas
                          </dt>
                          <dd>{selectedClaim.buildingDamageAffectedAreas}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                )}

                {selectedClaim.hasTheft && (
                  <div>
                    <h3 className="font-semibold mb-2">Theft/Vandalism</h3>
                    <dl className="space-y-2 text-sm">
                      <div>
                        <dt className="text-muted-foreground">Description</dt>
                        <dd>{selectedClaim.theftDescription}</dd>
                      </div>
                      {selectedClaim.theftPoliceReported && (
                        <div>
                          <dt className="text-muted-foreground">
                            Police Reference
                          </dt>
                          <dd>{selectedClaim.theftPoliceReference}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                )}

                {selectedClaim.isInvestmentProperty && (
                  <div>
                    <h3 className="font-semibold mb-2">Tenant Information</h3>
                    <dl className="space-y-2 text-sm">
                      <div>
                        <dt className="text-muted-foreground">Name</dt>
                        <dd>{selectedClaim.tenantName}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Phone</dt>
                        <dd>{selectedClaim.tenantPhone}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Email</dt>
                        <dd>{selectedClaim.tenantEmail}</dd>
                      </div>
                    </dl>
                  </div>
                )}

                <div>
                  <h3 className="font-semibold mb-2">Uploaded Files</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {selectedClaim.damagePhotos &&
                      selectedClaim.damagePhotos.length > 0 && (
                        <div>
                          <dt className="text-muted-foreground mb-1">
                            Damage Photos ({selectedClaim.damagePhotos.length})
                          </dt>
                        </div>
                      )}
                    {selectedClaim.repairQuotes &&
                      selectedClaim.repairQuotes.length > 0 && (
                        <div>
                          <dt className="text-muted-foreground mb-1">
                            Repair Quotes ({selectedClaim.repairQuotes.length})
                          </dt>
                        </div>
                      )}
                    {selectedClaim.policeReports &&
                      selectedClaim.policeReports.length > 0 && (
                        <div>
                          <dt className="text-muted-foreground mb-1">
                            Police Reports ({selectedClaim.policeReports.length}
                            )
                          </dt>
                        </div>
                      )}
                    {selectedClaim.tenancyAgreements &&
                      selectedClaim.tenancyAgreements.length > 0 && (
                        <div>
                          <dt className="text-muted-foreground mb-1">
                            Tenancy Agreements (
                            {selectedClaim.tenancyAgreements.length})
                          </dt>
                        </div>
                      )}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
