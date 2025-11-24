import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { step6Schema, type Step6Data } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft } from "lucide-react";

interface Step6SubletProps {
  defaultValues: Partial<Step6Data>;
  onNext: (data: Step6Data) => void;
  onBack: () => void;
}

export function Step6Sublet({ defaultValues, onNext, onBack }: Step6SubletProps) {
  const form = useForm<Step6Data>({
    resolver: zodResolver(step6Schema),
    defaultValues: {
      hasSublet: defaultValues.hasSublet || false,
      subletDescription: defaultValues.subletDescription || '',
      subletEvidence: defaultValues.subletEvidence || '',
    },
  });

  const hasSublet = form.watch("hasSublet");

  const onSubmit = (data: Step6Data) => {
    if (!data.hasSublet) {
      data.subletDescription = '';
      data.subletEvidence = '';
    }
    onNext(data);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Subletting Information</h2>
        <p className="text-muted-foreground">
          Details about any unauthorized subletting related to this claim.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="hasSublet"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-lg border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    data-testid="checkbox-has-sublet"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="font-semibold">
                    This claim involves unauthorized subletting
                  </FormLabel>
                  <p className="text-sm text-muted-foreground">
                    Check this box if the damage was caused by or relates to unauthorized subletting
                  </p>
                </div>
              </FormItem>
            )}
          />

          {hasSublet && (
            <>
              <FormField
                control={form.control}
                name="subletDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description of Subletting Situation</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe how the subletting was discovered and its relationship to the claim."
                        className="min-h-[120px] resize-y"
                        {...field}
                        data-testid="textarea-sublet-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subletEvidence"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Evidence of Subletting</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe any evidence you have (e.g., names of subtenants, witness statements, rental advertisements)"
                        className="min-h-[100px] resize-y"
                        {...field}
                        data-testid="textarea-sublet-evidence"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}

          <div className="flex justify-between pt-4">
            <Button type="button" variant="outline" onClick={onBack} data-testid="button-back-step6">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button type="submit" size="lg" data-testid="button-next-step6">
              Next Step
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
