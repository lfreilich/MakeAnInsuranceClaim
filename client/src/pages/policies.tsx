import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Building2, Calendar } from "lucide-react";
import type { InsurancePolicy } from "@shared/schema";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

export default function PoliciesPage() {
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<InsurancePolicy | null>(null);

  const { data: policies = [], isLoading } = useQuery<InsurancePolicy[]>({
    queryKey: ["/api/policies"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/policies", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/policies"] });
      setIsCreateOpen(false);
      toast({
        title: "Success",
        description: "Insurance policy created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create policy",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      await apiRequest("PATCH", `/api/policies/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/policies"] });
      setEditingPolicy(null);
      toast({
        title: "Success",
        description: "Policy updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update policy",
        variant: "destructive",
      });
    },
  });

  const formatCurrency = (amount: number | null | undefined) => {
    if (!amount) return "N/A";
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(amount / 100);
  };

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-lg">Loading policies...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Insurance Policies</h1>
          <p className="text-muted-foreground mt-1">
            Manage building insurance policies and coverage
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-policy">
              <Plus className="h-4 w-4 mr-2" />
              Add Policy
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Policy</DialogTitle>
              <DialogDescription>
                Add a new insurance policy for buildings management
              </DialogDescription>
            </DialogHeader>
            <PolicyForm
              onSubmit={(data) => createMutation.mutate(data)}
              isPending={createMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {policies.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No policies yet</h3>
            <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
              Start by adding your first insurance policy to manage claims effectively
            </p>
            <Button onClick={() => setIsCreateOpen(true)} data-testid="button-add-first-policy">
              <Plus className="h-4 w-4 mr-2" />
              Add First Policy
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {policies.map((policy) => (
            <Card key={policy.id} className="hover-elevate" data-testid={`card-policy-${policy.id}`}>
              <CardHeader className="space-y-1">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{policy.policyName}</CardTitle>
                    <CardDescription className="mt-1">
                      {policy.policyNumber}
                    </CardDescription>
                  </div>
                  <Badge variant={policy.active ? "default" : "secondary"} data-testid={`badge-status-${policy.id}`}>
                    {policy.active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-sm font-medium">Insurer</div>
                  <div className="text-sm text-muted-foreground">{policy.insurerName}</div>
                </div>
                <div>
                  <div className="text-sm font-medium">Coverage Type</div>
                  <div className="text-sm text-muted-foreground">{policy.coverageType}</div>
                </div>
                {policy.excessAmount && (
                  <div>
                    <div className="text-sm font-medium">Excess Amount</div>
                    <div className="text-sm text-muted-foreground">
                      {formatCurrency(policy.excessAmount)}
                    </div>
                  </div>
                )}
                {(policy.policyStartDate || policy.policyEndDate) && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {formatDate(policy.policyStartDate)} - {formatDate(policy.policyEndDate)}
                    </span>
                  </div>
                )}
                {policy.buildingAddress && (
                  <div>
                    <div className="text-sm font-medium">Building(s)</div>
                    <div className="text-sm text-muted-foreground line-clamp-2">
                      {policy.buildingAddress}
                    </div>
                  </div>
                )}
                <Dialog open={editingPolicy?.id === policy.id} onOpenChange={(open) => !open && setEditingPolicy(null)}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setEditingPolicy(policy)}
                      data-testid={`button-edit-${policy.id}`}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Policy
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Edit Policy</DialogTitle>
                      <DialogDescription>
                        Update insurance policy details
                      </DialogDescription>
                    </DialogHeader>
                    <PolicyForm
                      defaultValues={policy}
                      onSubmit={(data) => updateMutation.mutate({ id: policy.id, data })}
                      isPending={updateMutation.isPending}
                    />
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

interface PolicyFormProps {
  defaultValues?: Partial<InsurancePolicy>;
  onSubmit: (data: any) => void;
  isPending: boolean;
}

function PolicyForm({ defaultValues, onSubmit, isPending }: PolicyFormProps) {
  const form = useForm({
    defaultValues: {
      policyNumber: defaultValues?.policyNumber || "",
      policyName: defaultValues?.policyName || "",
      insurerName: defaultValues?.insurerName || "",
      coverageType: defaultValues?.coverageType || "Buildings",
      excessAmount: defaultValues?.excessAmount ? (defaultValues.excessAmount / 100).toString() : "",
      policyStartDate: defaultValues?.policyStartDate 
        ? new Date(defaultValues.policyStartDate).toISOString().split('T')[0]
        : "",
      policyEndDate: defaultValues?.policyEndDate
        ? new Date(defaultValues.policyEndDate).toISOString().split('T')[0]
        : "",
      buildingAddress: defaultValues?.buildingAddress || "",
      notes: defaultValues?.notes || "",
      active: defaultValues?.active !== undefined ? defaultValues.active : true,
    },
  });

  const handleSubmit = form.handleSubmit((data) => {
    const payload = {
      ...data,
      excessAmount: data.excessAmount ? Math.round(parseFloat(data.excessAmount) * 100) : null,
      policyStartDate: data.policyStartDate || null,
      policyEndDate: data.policyEndDate || null,
      buildingAddress: data.buildingAddress || null,
      notes: data.notes || null,
    };
    onSubmit(payload);
  });

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="policyNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Policy Number *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="POL-2024-001" data-testid="input-policy-number" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="policyName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Policy Name *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Building Insurance 2024" data-testid="input-policy-name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="insurerName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Insurer Name *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Aviva" data-testid="input-insurer-name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="coverageType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Coverage Type *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-coverage-type">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Buildings">Buildings</SelectItem>
                    <SelectItem value="Public Liability">Public Liability</SelectItem>
                    <SelectItem value="Contents">Contents</SelectItem>
                    <SelectItem value="Comprehensive">Comprehensive</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="excessAmount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Excess Amount (£)</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="number"
                  step="0.01"
                  placeholder="500.00"
                  data-testid="input-excess-amount"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="policyStartDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Date</FormLabel>
                <FormControl>
                  <Input {...field} type="date" data-testid="input-start-date" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="policyEndDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Date</FormLabel>
                <FormControl>
                  <Input {...field} type="date" data-testid="input-end-date" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="buildingAddress"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Building Address(es)</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Enter one or more building addresses covered by this policy"
                  className="resize-none"
                  rows={3}
                  data-testid="textarea-building-address"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Additional notes about this policy"
                  className="resize-none"
                  rows={2}
                  data-testid="textarea-notes"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="active"
          render={({ field }) => (
            <FormItem className="flex items-center gap-2">
              <FormControl>
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  className="h-4 w-4"
                  data-testid="checkbox-active"
                />
              </FormControl>
              <FormLabel className="!mt-0">Active Policy</FormLabel>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-2 justify-end pt-4">
          <Button type="submit" disabled={isPending} data-testid="button-submit-policy">
            {isPending ? "Saving..." : defaultValues ? "Update Policy" : "Create Policy"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
