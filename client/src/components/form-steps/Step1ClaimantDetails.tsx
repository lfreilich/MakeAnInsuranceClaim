import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { step1Schema, type Step1Data } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

interface Step1ClaimantDetailsProps {
  defaultValues: Partial<Step1Data>;
  onNext: (data: Step1Data) => void;
}

export function Step1ClaimantDetails({ defaultValues, onNext }: Step1ClaimantDetailsProps) {
  const form = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      claimantName: defaultValues.claimantName || '',
      claimantEmail: defaultValues.claimantEmail || '',
      claimantPhone: defaultValues.claimantPhone || '',
    },
  });

  const onSubmit = (data: Step1Data) => {
    onNext(data);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Claimant Details</h2>
        <p className="text-muted-foreground">
          Please provide your contact information so we can keep you updated about your claim.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="claimantName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., John Smith"
                    {...field}
                    data-testid="input-claimant-name"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="claimantEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address *</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="e.g., john.smith@email.com"
                    {...field}
                    data-testid="input-claimant-email"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="claimantPhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number *</FormLabel>
                <FormControl>
                  <Input
                    type="tel"
                    placeholder="e.g., 020 1234 5678"
                    {...field}
                    data-testid="input-claimant-phone"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end pt-4">
            <Button type="submit" size="lg" data-testid="button-next-step1">
              Next Step
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
