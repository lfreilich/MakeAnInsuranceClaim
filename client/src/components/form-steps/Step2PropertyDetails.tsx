import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { step2Schema, type Step2Data } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface Step2PropertyDetailsProps {
  defaultValues: Partial<Step2Data>;
  onNext: (data: Step2Data) => void;
  onBack: () => void;
}

// Moreland managed blocks
const MANAGED_BLOCKS = [
  "Arlington Court",
  "Beaumont House",
  "Carlton Gardens",
  "Devonshire Towers",
  "Elmwood Manor",
  "Fairfield Heights",
  "Greenwich Plaza",
  "Hampton Court"
];

export function Step2PropertyDetails({ defaultValues, onNext, onBack }: Step2PropertyDetailsProps) {
  const form = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      propertyAddress: defaultValues.propertyAddress || '',
      propertyBlock: defaultValues.propertyBlock || '',
      propertyUnit: defaultValues.propertyUnit || '',
    },
  });

  const onSubmit = (data: Step2Data) => {
    onNext(data);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Property Details</h2>
        <p className="text-muted-foreground">
          Confirm the property address where the incident occurred. Only Moreland-managed properties are covered.
        </p>
      </div>

      <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        <AlertDescription className="text-sm text-blue-900 dark:text-blue-100">
          Your property must be within a Moreland-managed block to be covered under the buildings insurance policy.
        </AlertDescription>
      </Alert>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="propertyBlock"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Moreland Block *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-property-block">
                      <SelectValue placeholder="Select your block" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {MANAGED_BLOCKS.map((block) => (
                      <SelectItem key={block} value={block}>
                        {block}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="propertyAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Property Address *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., Flat 12B, 45 High Street, London, SW1A 1AA"
                    {...field}
                    data-testid="input-property-address"
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  Include flat/unit number, street name, and postcode
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="propertyUnit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit/Flat Number (Optional)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., 12B or Ground Floor"
                    {...field}
                    data-testid="input-property-unit"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-between pt-4">
            <Button type="button" variant="outline" onClick={onBack} data-testid="button-back-step2">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button type="submit" size="lg" data-testid="button-next-step2">
              Next Step
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
