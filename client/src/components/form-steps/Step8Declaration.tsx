import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { step8Schema, type Step8Data } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Send } from "lucide-react";
import { SignatureCanvas } from "../SignatureCanvas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface Step8DeclarationProps {
  defaultValues: Partial<Step8Data>;
  onSubmit: (data: Step8Data) => void;
  onBack: () => void;
  isSubmitting: boolean;
}

export function Step8Declaration({ defaultValues, onSubmit, onBack, isSubmitting }: Step8DeclarationProps) {
  const form = useForm<Step8Data>({
    resolver: zodResolver(step8Schema),
    defaultValues: {
      signatureData: defaultValues.signatureData || '',
      signatureType: defaultValues.signatureType || 'drawn',
      declarationAccepted: defaultValues.declarationAccepted || false,
      fraudWarningAccepted: defaultValues.fraudWarningAccepted || false,
      contentsExclusionAccepted: defaultValues.contentsExclusionAccepted || false,
    },
  });

  const handleSubmit = (data: Step8Data) => {
    onSubmit(data);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Declaration & Signature</h2>
        <p className="text-muted-foreground">
          Please review and accept the declarations below, then sign to submit your claim.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Signature */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Electronic Signature</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="signatureData"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <SignatureCanvas
                        onSignatureChange={(data, type) => {
                          field.onChange(data);
                          form.setValue('signatureType', type);
                        }}
                        value={field.value}
                        signatureType={form.watch('signatureType')}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Declarations */}
          <Card className="border-amber-200 dark:border-amber-800">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                Important Declarations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="declarationAccepted"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="checkbox-declaration"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="font-medium cursor-pointer">
                        I declare that the information provided in this claim is true and accurate to the best of my knowledge
                      </FormLabel>
                      <p className="text-sm text-muted-foreground">
                        This includes all details about the incident, property, and uploaded documents
                      </p>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contentsExclusionAccepted"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="checkbox-contents-exclusion"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="font-medium cursor-pointer">
                        I understand that this buildings insurance does not cover personal contents or belongings
                      </FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Damage to furniture, electronics, clothing, and other personal items are not covered under this policy
                      </p>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fraudWarningAccepted"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="checkbox-fraud-warning"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="font-medium cursor-pointer">
                        I acknowledge that providing false or misleading information may constitute fraud and could result in criminal prosecution
                      </FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Insurance fraud is a criminal offense under the Fraud Act 2006
                      </p>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <AlertDescription className="text-sm text-blue-900 dark:text-blue-100">
              <p className="font-semibold mb-2">What happens next:</p>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Your claim will be sent to Moreland Estate Management</li>
                <li>We will forward it to the insurance company's claims team</li>
                <li>The insurers will assess your claim and may request additional information</li>
                <li>You will be contacted directly regarding the outcome</li>
              </ol>
            </AlertDescription>
          </Alert>

          <div className="flex justify-between pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              disabled={isSubmitting}
              data-testid="button-back-step8"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700"
              data-testid="button-submit-claim"
            >
              {isSubmitting ? "Submitting..." : "Submit Claim"}
              <Send className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
