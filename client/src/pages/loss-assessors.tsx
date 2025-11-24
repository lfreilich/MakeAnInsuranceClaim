import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, UserCheck, Mail, Phone, MapPin, Building2, AlertCircle, Trash2, ArrowLeft } from "lucide-react";
import type { LossAssessor, Claim } from "@shared/schema";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Link } from "wouter";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface LossAssessorFormData {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  address?: string;
  specializations: string[];
  notes?: string;
}

function LossAssessorForm({
  defaultValues,
  onSubmit,
  isPending,
}: {
  defaultValues?: Partial<LossAssessorFormData>;
  onSubmit: (data: LossAssessorFormData) => void;
  isPending: boolean;
}) {
  const form = useForm<LossAssessorFormData>({
    defaultValues: {
      companyName: defaultValues?.companyName || "",
      contactName: defaultValues?.contactName || "",
      email: defaultValues?.email || "",
      phone: defaultValues?.phone || "",
      address: defaultValues?.address || "",
      specializations: defaultValues?.specializations || [],
      notes: defaultValues?.notes || "",
    },
  });

  const [specializationsInput, setSpecializationsInput] = useState(
    defaultValues?.specializations?.join(", ") || ""
  );

  const handleSubmit = (data: LossAssessorFormData) => {
    const specializations = specializationsInput
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    
    onSubmit({
      ...data,
      specializations,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="companyName"
          rules={{ required: "Company name is required" }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company Name</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="ABC Loss Assessors Ltd"
                  data-testid="input-company-name"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="contactName"
          rules={{ required: "Contact name is required" }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contact Name</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="John Smith"
                  data-testid="input-contact-name"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="email"
            rules={{
              required: "Email is required",
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: "Invalid email address",
              },
            }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="email"
                    placeholder="contact@example.com"
                    data-testid="input-email"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            rules={{ required: "Phone is required" }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="020 1234 5678"
                    data-testid="input-phone"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address (Optional)</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="123 Main Street, London, UK"
                  data-testid="input-address"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div>
          <Label htmlFor="specializations">Specializations (comma-separated)</Label>
          <Input
            id="specializations"
            value={specializationsInput}
            onChange={(e) => setSpecializationsInput(e.target.value)}
            placeholder="Fire damage, Water damage, Structural"
            className="mt-2"
            data-testid="input-specializations"
          />
          <p className="text-sm text-muted-foreground mt-1">
            Enter specializations separated by commas
          </p>
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Additional notes about this loss assessor"
                  rows={3}
                  data-testid="input-notes"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={isPending}
          data-testid="button-submit-assessor"
        >
          {isPending ? "Saving..." : defaultValues ? "Update Assessor" : "Create Assessor"}
        </Button>
      </form>
    </Form>
  );
}

export default function LossAssessorsPage() {
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingAssessor, setEditingAssessor] = useState<LossAssessor | null>(null);
  const [deletingAssessor, setDeletingAssessor] = useState<LossAssessor | null>(null);

  const { data: assessors = [], isLoading } = useQuery<LossAssessor[]>({
    queryKey: ["/api/loss-assessors"],
  });

  const { data: claims = [] } = useQuery<Claim[]>({
    queryKey: ["/api/claims"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: LossAssessorFormData) => {
      await apiRequest("POST", "/api/loss-assessors", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loss-assessors"] });
      setIsCreateOpen(false);
      toast({
        title: "Success",
        description: "Loss assessor created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create loss assessor",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<LossAssessorFormData> }) => {
      await apiRequest("PATCH", `/api/loss-assessors/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loss-assessors"] });
      setEditingAssessor(null);
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

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/loss-assessors/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loss-assessors"] });
      setDeletingAssessor(null);
      toast({
        title: "Success",
        description: "Loss assessor deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete loss assessor",
        variant: "destructive",
      });
    },
  });

  const getAssignedClaimsCount = (assessorId: number) => {
    return claims.filter((claim) => claim.lossAssessorId === assessorId).length;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-lg">Loading loss assessors...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Loss Assessors</h1>
          <p className="text-muted-foreground mt-1">
            Manage loss assessors and claim assignments
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-assessor">
              <Plus className="h-4 w-4 mr-2" />
              Add Assessor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Loss Assessor</DialogTitle>
              <DialogDescription>
                Add a new loss assessor to the system
              </DialogDescription>
            </DialogHeader>
            <LossAssessorForm
              onSubmit={(data) => createMutation.mutate(data)}
              isPending={createMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {assessors.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <UserCheck className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No loss assessors yet</h3>
            <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
              Start by adding your first loss assessor to assign to claims
            </p>
            <Button onClick={() => setIsCreateOpen(true)} data-testid="button-add-first-assessor">
              <Plus className="h-4 w-4 mr-2" />
              Add First Assessor
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {assessors.map((assessor) => (
            <Card key={assessor.id} className="hover-elevate" data-testid={`card-assessor-${assessor.id}`}>
              <CardHeader className="space-y-1">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{assessor.companyName}</CardTitle>
                    <CardDescription className="mt-1">
                      {assessor.contactName}
                    </CardDescription>
                  </div>
                  <Badge variant={assessor.active ? "default" : "secondary"} data-testid={`badge-status-${assessor.id}`}>
                    {assessor.active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{assessor.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{assessor.phone}</span>
                  </div>
                  {assessor.address && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground truncate">{assessor.address}</span>
                    </div>
                  )}
                </div>

                {assessor.specializations && assessor.specializations.length > 0 && (
                  <div>
                    <div className="text-sm font-medium mb-2">Specializations</div>
                    <div className="flex flex-wrap gap-1">
                      {assessor.specializations.map((spec, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs" data-testid={`badge-spec-${idx}`}>
                          {spec}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-3 border-t">
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{getAssignedClaimsCount(assessor.id)}</span>
                    <span className="text-muted-foreground">assigned claim{getAssignedClaimsCount(assessor.id) !== 1 ? 's' : ''}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Dialog open={editingAssessor?.id === assessor.id} onOpenChange={(open) => !open && setEditingAssessor(null)}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setEditingAssessor(assessor)}
                        data-testid={`button-edit-${assessor.id}`}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Edit Loss Assessor</DialogTitle>
                        <DialogDescription>
                          Update loss assessor details
                        </DialogDescription>
                      </DialogHeader>
                      <LossAssessorForm
                        defaultValues={{
                          companyName: assessor.companyName,
                          contactName: assessor.contactName,
                          email: assessor.email,
                          phone: assessor.phone,
                          address: assessor.address || undefined,
                          specializations: assessor.specializations || [],
                          notes: assessor.notes || undefined,
                        }}
                        onSubmit={(data) => updateMutation.mutate({ id: assessor.id, data })}
                        isPending={updateMutation.isPending}
                      />
                    </DialogContent>
                  </Dialog>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeletingAssessor(assessor)}
                    data-testid={`button-delete-${assessor.id}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!deletingAssessor} onOpenChange={(open) => !open && setDeletingAssessor(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Loss Assessor</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deletingAssessor?.companyName}? This action cannot be undone.
              {deletingAssessor && getAssignedClaimsCount(deletingAssessor.id) > 0 && (
                <div className="mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded-md flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                  <span className="text-sm">
                    This assessor has {getAssignedClaimsCount(deletingAssessor.id)} assigned claim{getAssignedClaimsCount(deletingAssessor.id) !== 1 ? 's' : ''}. Those claims will be unassigned.
                  </span>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingAssessor && deleteMutation.mutate(deletingAssessor.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
