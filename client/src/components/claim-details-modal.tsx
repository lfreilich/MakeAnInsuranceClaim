import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { User, Home, AlertCircle, Clock, MessageSquare, Plus, UserCheck, Building2, Save } from "lucide-react";
import { format } from "date-fns";
import type { Claim, AuditLog, ClaimNote, User as UserType, LossAssessor } from "@shared/schema";

interface ClaimDetailsModalProps {
  claim: Claim | null;
  users: UserType[];
  onClose: () => void;
}

export function ClaimDetailsModal({ claim, users, onClose }: ClaimDetailsModalProps) {
  const [newNote, setNewNote] = useState("");
  const [noteVisibility, setNoteVisibility] = useState<"internal" | "insurer">("internal");
  const [editingInsurerDetails, setEditingInsurerDetails] = useState(false);
  const [insurerClaimRef, setInsurerClaimRef] = useState(claim?.insurerClaimRef || "");
  const [insurerSubmittedAt, setInsurerSubmittedAt] = useState(
    claim?.insurerSubmittedAt ? format(new Date(claim.insurerSubmittedAt), "yyyy-MM-dd") : ""
  );
  const [insurerResponseDate, setInsurerResponseDate] = useState(
    claim?.insurerResponseDate ? format(new Date(claim.insurerResponseDate), "yyyy-MM-dd") : ""
  );
  const { toast } = useToast();

  const { data: lossAssessors = [] } = useQuery<LossAssessor[]>({
    queryKey: ["/api/loss-assessors"],
    enabled: !!claim,
  });

  const { data: auditLogs = [] } = useQuery<AuditLog[]>({
    queryKey: ["/api/claims", claim?.id, "audit-logs"],
    enabled: !!claim,
  });

  // Reset form state when claim changes
  useEffect(() => {
    if (claim) {
      setInsurerClaimRef(claim.insurerClaimRef || "");
      setInsurerSubmittedAt(claim.insurerSubmittedAt ? format(new Date(claim.insurerSubmittedAt), "yyyy-MM-dd") : "");
      setInsurerResponseDate(claim.insurerResponseDate ? format(new Date(claim.insurerResponseDate), "yyyy-MM-dd") : "");
      setEditingInsurerDetails(false);
    }
  }, [claim?.id]);

  const { data: notes = [] } = useQuery<ClaimNote[]>({
    queryKey: ["/api/claims", claim?.id, "notes"],
    enabled: !!claim,
  });

  const addNoteMutation = useMutation({
    mutationFn: async (data: { body: string; visibility: string; authorUserId: number }) => {
      await apiRequest("POST", `/api/claims/${claim?.id}/notes`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/claims", claim?.id, "notes"] });
      setNewNote("");
      toast({
        title: "Success",
        description: "Note added successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add note",
        variant: "destructive",
      });
    },
  });

  const assignAssessorMutation = useMutation({
    mutationFn: async (assessorId: number | null) => {
      await apiRequest("PATCH", `/api/claims/${claim?.id}/assign-assessor`, {
        assessorId,
        userId: 1,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/claims"] });
      toast({
        title: "Success",
        description: "Loss assessor updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update loss assessor",
        variant: "destructive",
      });
    },
  });

  const updateInsurerDetailsMutation = useMutation({
    mutationFn: async (data: { insurerClaimRef: string; insurerSubmittedAt: string; insurerResponseDate: string }) => {
      await apiRequest("PATCH", `/api/claims/${claim?.id}/insurer-details`, {
        ...data,
        userId: 1,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/claims"] });
      setEditingInsurerDetails(false);
      toast({
        title: "Success",
        description: "Insurer details updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update insurer details",
        variant: "destructive",
      });
    },
  });

  const handleAddNote = () => {
    if (!newNote.trim() || !claim) return;

    addNoteMutation.mutate({
      body: newNote,
      visibility: noteVisibility,
      authorUserId: 1,
    });
  };

  const handleUpdateInsurerDetails = () => {
    updateInsurerDetailsMutation.mutate({
      insurerClaimRef: insurerClaimRef.trim() || "",
      insurerSubmittedAt: insurerSubmittedAt.trim() || "",
      insurerResponseDate: insurerResponseDate.trim() || "",
    });
  };

  const assignedAssessor = lossAssessors.find((a) => a.id === claim?.lossAssessorId);

  const formatIncidentType = (type: string) => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  if (!claim) return null;

  return (
    <Dialog open={!!claim} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Claim Details - {claim.referenceNumber}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details" data-testid="tab-details">
              Details
            </TabsTrigger>
            <TabsTrigger value="audit" data-testid="tab-audit">
              <Clock className="h-4 w-4 mr-2" />
              Audit Log ({auditLogs.length})
            </TabsTrigger>
            <TabsTrigger value="notes" data-testid="tab-notes">
              <MessageSquare className="h-4 w-4 mr-2" />
              Notes ({notes.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Claimant Information
                </h3>
                <dl className="space-y-2 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Name</dt>
                    <dd>{claim.claimantName}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Email</dt>
                    <dd>{claim.claimantEmail}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Phone</dt>
                    <dd>{claim.claimantPhone}</dd>
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
                    <dd>{claim.propertyAddress}</dd>
                  </div>
                  {claim.propertyBlock && (
                    <div>
                      <dt className="text-muted-foreground">Block</dt>
                      <dd>{claim.propertyBlock}</dd>
                    </div>
                  )}
                  {claim.propertyConstructionAge && (
                    <div>
                      <dt className="text-muted-foreground">Construction Age</dt>
                      <dd>{claim.propertyConstructionAge}</dd>
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
                  <dd>{formatIncidentType(claim.incidentType)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Date</dt>
                  <dd>{format(new Date(claim.incidentDate), "PPP")}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Description</dt>
                  <dd className="whitespace-pre-wrap">{claim.incidentDescription}</dd>
                </div>
              </dl>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <UserCheck className="h-4 w-4" />
                  Loss Assessor
                </h3>
                <div className="space-y-3">
                  <Select
                    value={claim.lossAssessorId?.toString() || "none"}
                    onValueChange={(value) => assignAssessorMutation.mutate(value === "none" ? null : parseInt(value))}
                    disabled={assignAssessorMutation.isPending}
                  >
                    <SelectTrigger data-testid="select-loss-assessor">
                      <SelectValue placeholder="Select assessor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No assessor assigned</SelectItem>
                      {lossAssessors.filter((a) => a.active).map((assessor) => (
                        <SelectItem key={assessor.id} value={assessor.id.toString()}>
                          {assessor.companyName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {assignedAssessor && (
                    <dl className="space-y-2 text-sm">
                      <div>
                        <dt className="text-muted-foreground">Contact</dt>
                        <dd>{assignedAssessor.contactName}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Email</dt>
                        <dd>{assignedAssessor.email}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Phone</dt>
                        <dd>{assignedAssessor.phone}</dd>
                      </div>
                    </dl>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Insurer Submission
                  </h3>
                  {!editingInsurerDetails && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingInsurerDetails(true)}
                      data-testid="button-edit-insurer-details"
                    >
                      Edit
                    </Button>
                  )}
                </div>
                {editingInsurerDetails ? (
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="insurerClaimRef">Insurer Claim Reference</Label>
                      <Input
                        id="insurerClaimRef"
                        value={insurerClaimRef}
                        onChange={(e) => setInsurerClaimRef(e.target.value)}
                        placeholder="INS-12345"
                        data-testid="input-insurer-claim-ref"
                      />
                    </div>
                    <div>
                      <Label htmlFor="insurerSubmittedAt">Submission Date</Label>
                      <Input
                        id="insurerSubmittedAt"
                        type="date"
                        value={insurerSubmittedAt}
                        onChange={(e) => setInsurerSubmittedAt(e.target.value)}
                        data-testid="input-insurer-submitted-at"
                      />
                    </div>
                    <div>
                      <Label htmlFor="insurerResponseDate">Response Date</Label>
                      <Input
                        id="insurerResponseDate"
                        type="date"
                        value={insurerResponseDate}
                        onChange={(e) => setInsurerResponseDate(e.target.value)}
                        data-testid="input-insurer-response-date"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleUpdateInsurerDetails}
                        disabled={updateInsurerDetailsMutation.isPending}
                        data-testid="button-save-insurer-details"
                      >
                        <Save className="h-3 w-3 mr-1" />
                        Save
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingInsurerDetails(false)}
                        data-testid="button-cancel-insurer-details"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <dl className="space-y-2 text-sm">
                    <div>
                      <dt className="text-muted-foreground">Claim Reference</dt>
                      <dd>{claim.insurerClaimRef || "Not submitted"}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Submitted Date</dt>
                      <dd>
                        {claim.insurerSubmittedAt 
                          ? format(new Date(claim.insurerSubmittedAt), "PPP")
                          : "Not submitted"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Response Date</dt>
                      <dd>
                        {claim.insurerResponseDate 
                          ? format(new Date(claim.insurerResponseDate), "PPP")
                          : "No response yet"}
                      </dd>
                    </div>
                  </dl>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="audit" className="mt-4">
            <div className="space-y-3">
              {auditLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No audit logs yet</p>
                </div>
              ) : (
                auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="border rounded-lg p-3 space-y-2"
                    data-testid={`audit-log-${log.id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <Badge variant="outline" className="mb-1">
                          {log.action.replace(/_/g, " ")}
                        </Badge>
                        <p className="text-sm text-muted-foreground">
                          {log.userId && users.find((u) => u.id === log.userId)?.name}
                          {!log.userId && "System"}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(log.createdAt), "MMM d, yyyy HH:mm")}
                      </span>
                    </div>
                    {log.changes && (
                      <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                        {JSON.stringify(log.changes, null, 2) as string}
                      </pre>
                    )}
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="notes" className="mt-4">
            <div className="space-y-4">
              <div className="border rounded-lg p-4 bg-muted/50">
                <h4 className="font-semibold mb-3">Add New Note</h4>
                <div className="space-y-3">
                  <Textarea
                    placeholder="Enter note..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    rows={3}
                    data-testid="textarea-new-note"
                  />
                  <div className="flex gap-2">
                    <Select value={noteVisibility} onValueChange={(v: any) => setNoteVisibility(v)}>
                      <SelectTrigger className="w-40" data-testid="select-note-visibility">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="internal">Internal</SelectItem>
                        <SelectItem value="insurer">Share with Insurer</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={handleAddNote}
                      disabled={!newNote.trim() || addNoteMutation.isPending}
                      data-testid="button-add-note"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Note
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {notes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No notes yet</p>
                  </div>
                ) : (
                  notes.map((note) => (
                    <div
                      key={note.id}
                      className="border rounded-lg p-3 space-y-2"
                      data-testid={`note-${note.id}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={note.visibility === "internal" ? "secondary" : "default"}>
                              {note.visibility}
                            </Badge>
                            {note.noteType !== "general" && (
                              <Badge variant="outline">{note.noteType}</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            By {users.find((u) => u.id === note.authorUserId)?.name || "Unknown"}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(note.createdAt), "MMM d, yyyy HH:mm")}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{note.body}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
