import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { step5Schema, type Step5Data } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface Step5TheftVandalismProps {
  defaultValues: Partial<Step5Data>;
  onNext: (data: Step5Data) => void;
  onBack: () => void;
}

export function Step5TheftVandalism({ defaultValues, onNext, onBack }: Step5TheftVandalismProps) {
  const form = useForm<Step5Data>({
    resolver: zodResolver(step5Schema),
    defaultValues: {
      hasTheft: defaultValues.hasTheft || false,
      theftDescription: defaultValues.theftDescription || '',
      theftPoliceReported: defaultValues.theftPoliceReported || false,
      theftPoliceReference: defaultValues.theftPoliceReference || '',
    },
  });

  const hasTheft = form.watch("hasTheft");
  const theftPoliceReported = form.watch("theftPoliceReported");

  const onSubmit = (data: Step5Data) => {
    if (!data.hasTheft) {
      data.theftDescription = '';
      data.theftPoliceReported = false;
      data.theftPoliceReference = '';
    }
    onNext(data);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Theft / Vandalism</h2>
        <p className="text-muted-foreground">
          Information about any theft or vandalism related to this claim.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="hasTheft"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-lg border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    data-testid="checkbox-has-theft"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="font-semibold">
                    This claim involves theft or vandalism
                  </FormLabel>
                  <p className="text-sm text-muted-foreground">
                    Check this box if items were stolen or the property was deliberately damaged
                  </p>
                </div>
              </FormItem>
            )}
          />

          {hasTheft && (
            <>
              <Alert className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <AlertDescription className="text-sm text-amber-900 dark:text-amber-100">
                  <strong>Important:</strong> Theft claims must be reported to the police. 
                  A police reference number is required for processing.
                </AlertDescription>
              </Alert>

              <FormField
                control={form.control}
                name="theftDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description of Theft/Vandalism</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe what was stolen or damaged, when it was discovered, and any suspects or witnesses."
                        className="min-h-[120px] resize-y"
                        {...field}
                        data-testid="textarea-theft-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="theftPoliceReported"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-lg border p-4 bg-muted/50">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="checkbox-police-reported"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="font-semibold">
                        This incident has been reported to the police
                      </FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Required for theft/vandalism claims
                      </p>
                    </div>
                  </FormItem>
                )}
              />

              {theftPoliceReported && (
                <FormField
                  control={form.control}
                  name="theftPoliceReference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Police Reference Number</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., CR/12345/2024"
                          {...field}
                          data-testid="input-police-reference"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </>
          )}

          <div className="flex justify-between pt-4">
            <Button type="button" variant="outline" onClick={onBack} data-testid="button-back-step5">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button type="submit" size="lg" data-testid="button-next-step5">
              Next Step
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
