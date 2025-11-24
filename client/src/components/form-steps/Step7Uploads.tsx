import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { step7Schema, type Step7Data } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { FileUploadZone } from "../FileUploadZone";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";

interface Step7UploadsProps {
  defaultValues: Partial<Step7Data>;
  formData: any;
  onNext: (data: Step7Data) => void;
  onBack: () => void;
}

export function Step7Uploads({ defaultValues, formData, onNext, onBack }: Step7UploadsProps) {
  // Create dynamic validation based on previous form data (using boolean flags only for consistency)
  const requiresDamagePhotos = formData.hasBuildingDamage === true;
  const requiresPoliceReports = formData.hasTheft === true && formData.theftPoliceReported === true;

  const dynamicSchema = step7Schema.refine(
    (data) => {
      if (requiresDamagePhotos) {
        return data.damagePhotos && data.damagePhotos.length >= 2;
      }
      return true;
    },
    {
      message: "At least 2 damage photos are required for building damage claims",
      path: ["damagePhotos"],
    }
  ).refine(
    (data) => {
      if (requiresDamagePhotos) {
        return data.repairQuotes && data.repairQuotes.length >= 1;
      }
      return true;
    },
    {
      message: "At least 1 repair quote is required for building damage claims",
      path: ["repairQuotes"],
    }
  ).refine(
    (data) => {
      if (requiresPoliceReports) {
        return data.policeReports && data.policeReports.length >= 1;
      }
      return true;
    },
    {
      message: "At least 1 police report is required when theft/vandalism is reported to police",
      path: ["policeReports"],
    }
  );

  const form = useForm<Step7Data>({
    resolver: zodResolver(dynamicSchema as z.ZodType<Step7Data>),
    defaultValues: {
      damagePhotos: defaultValues.damagePhotos || [],
      repairQuotes: defaultValues.repairQuotes || [],
      invoices: defaultValues.invoices || [],
      policeReports: defaultValues.policeReports || [],
      otherDocuments: defaultValues.otherDocuments || [],
    },
  });

  const handleFileUpload = async (file: File): Promise<string> => {
    try {
      // Get presigned URL from backend
      const response = await apiRequest("POST", "/api/objects/upload", {});
      const data = await response.json() as { uploadURL: string };
      
      if (!data || !data.uploadURL) {
        throw new Error('Failed to get upload URL from server');
      }
      
      const uploadURL = data.uploadURL;
      
      // Upload directly to object storage
      const uploadResponse = await fetch(uploadURL, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed with status: ${uploadResponse.status}`);
      }

      // Return the uploaded file path (remove query parameters)
      const filePath = uploadURL.split('?')[0];
      if (!filePath) {
        throw new Error('Invalid upload URL returned');
      }
      
      return filePath;
    } catch (error) {
      console.error('File upload error:', error);
      throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const onSubmit = (data: Step7Data) => {
    onNext(data);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Upload Documents</h2>
        <p className="text-muted-foreground">
          Please upload supporting documents for your claim. Clear photos and valid quotes help process your claim faster.
        </p>
      </div>

      {requiresDamagePhotos && (
        <Alert className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <AlertDescription className="text-sm text-amber-900 dark:text-amber-100">
            <strong>Required:</strong> At least 2 photos of the damage and 1 repair quote are mandatory for building damage claims.
          </AlertDescription>
        </Alert>
      )}
      
      {!requiresDamagePhotos && !requiresPoliceReports && (
        <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription className="text-sm text-blue-900 dark:text-blue-100">
            Upload any supporting documents for your claim. Photos and evidence strengthen your submission.
          </AlertDescription>
        </Alert>
      )}
      
      {!requiresDamagePhotos && requiresPoliceReports && (
        <Alert className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <AlertDescription className="text-sm text-amber-900 dark:text-amber-100">
            <strong>Required:</strong> At least 1 police report is mandatory when theft/vandalism was reported to police.
          </AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="border-blue-200 dark:border-blue-800">
            <CardContent className="p-6 space-y-6">
              <FormField
                control={form.control}
                name="damagePhotos"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FileUploadZone
                        label="Damage Photos"
                        description={requiresDamagePhotos ? "Clear photos showing the extent of the damage (minimum 2 required)" : "Upload photos of any damage (optional)"}
                        accept="image/*"
                        maxFiles={10}
                        required={requiresDamagePhotos}
                        files={field.value || []}
                        onFilesChange={field.onChange}
                        onUpload={handleFileUpload}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card className="border-green-200 dark:border-green-800">
            <CardContent className="p-6 space-y-6">
              <FormField
                control={form.control}
                name="repairQuotes"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FileUploadZone
                        label="Repair Quotes"
                        description={requiresDamagePhotos ? "Written quotes from qualified contractors (minimum 1 required)" : "Upload repair quotes if available (optional)"}
                        accept="image/*,.pdf"
                        maxFiles={5}
                        required={requiresDamagePhotos}
                        files={field.value || []}
                        onFilesChange={field.onChange}
                        onUpload={handleFileUpload}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-6">
              <FormField
                control={form.control}
                name="invoices"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FileUploadZone
                        label="Invoices (Optional)"
                        description="Any invoices for emergency repairs already completed"
                        accept="image/*,.pdf"
                        maxFiles={5}
                        files={field.value}
                        onFilesChange={field.onChange}
                        onUpload={handleFileUpload}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="policeReports"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FileUploadZone
                        label={requiresPoliceReports ? "Police Reports" : "Police Reports (Optional)"}
                        description={requiresPoliceReports ? "Police report required when theft/vandalism was reported to police (minimum 1 required)" : "Police report if theft or vandalism occurred"}
                        accept="image/*,.pdf"
                        maxFiles={3}
                        required={requiresPoliceReports}
                        files={field.value || []}
                        onFilesChange={field.onChange}
                        onUpload={handleFileUpload}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="otherDocuments"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FileUploadZone
                        label="Other Documents (Optional)"
                        description="Any other supporting documents"
                        accept="image/*,.pdf"
                        maxFiles={5}
                        files={field.value}
                        onFilesChange={field.onChange}
                        onUpload={handleFileUpload}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-between pt-4">
            <Button type="button" variant="outline" onClick={onBack} data-testid="button-back-step7">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button type="submit" size="lg" data-testid="button-next-step7">
              Next Step
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
