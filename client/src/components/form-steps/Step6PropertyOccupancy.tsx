import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { step6Schema, type Step6Data } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ChevronRight, ChevronLeft, Upload, FileText, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { useState } from "react";

interface Step6PropertyOccupancyProps {
  defaultValues: Partial<Step6Data>;
  onNext: (data: Step6Data) => void;
  onBack: () => void;
}

export function Step6PropertyOccupancy({ defaultValues, onNext, onBack }: Step6PropertyOccupancyProps) {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm<Step6Data>({
    resolver: zodResolver(step6Schema),
    defaultValues: {
      isInvestmentProperty: defaultValues.isInvestmentProperty || false,
      tenantName: defaultValues.tenantName || '',
      tenantPhone: defaultValues.tenantPhone || '',
      tenantEmail: defaultValues.tenantEmail || '',
    },
  });

  const isInvestmentProperty = form.watch("isInvestmentProperty");

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const uploadedFilePaths: string[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          uploadedFilePaths.push(data.path);
          setUploadedFiles(prev => [...prev, file]);
        }
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = (data: Step6Data) => {
    if (!data.isInvestmentProperty) {
      data.tenantName = '';
      data.tenantPhone = '';
      data.tenantEmail = '';
    }
    onNext(data);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Property Occupancy</h2>
        <p className="text-muted-foreground">
          Please tell us about how the property is occupied.
        </p>
      </div>

      <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        <AlertDescription className="text-sm text-blue-900 dark:text-blue-100">
          If the property is tenanted, we need contact details for the tenant and a copy of the tenancy agreement.
        </AlertDescription>
      </Alert>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="isInvestmentProperty"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Property Occupancy Type *</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={(value) => field.onChange(value === "true")}
                    defaultValue={field.value ? "true" : "false"}
                    className="flex flex-col space-y-2"
                  >
                    <div className="flex items-center space-x-3 space-y-0 rounded-lg border p-4 hover-elevate cursor-pointer">
                      <RadioGroupItem value="false" id="owner-occupied" data-testid="radio-owner-occupied" />
                      <label htmlFor="owner-occupied" className="flex-1 cursor-pointer">
                        <div className="font-semibold">Owner Occupied</div>
                        <p className="text-sm text-muted-foreground">I live in this property</p>
                      </label>
                    </div>
                    <div className="flex items-center space-x-3 space-y-0 rounded-lg border p-4 hover-elevate cursor-pointer">
                      <RadioGroupItem value="true" id="investment" data-testid="radio-investment-property" />
                      <label htmlFor="investment" className="flex-1 cursor-pointer">
                        <div className="font-semibold">Investment Property</div>
                        <p className="text-sm text-muted-foreground">This property is rented to tenants</p>
                      </label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {isInvestmentProperty && (
            <div className="space-y-6 p-4 bg-muted/50 rounded-lg border">
              <div>
                <h3 className="text-lg font-semibold mb-1">Tenant Information</h3>
                <p className="text-sm text-muted-foreground">
                  Please provide details for the current tenant
                </p>
              </div>

              <FormField
                control={form.control}
                name="tenantName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tenant Full Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., John Smith"
                        {...field}
                        data-testid="input-tenant-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tenantPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tenant Phone Number *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., 07700 900000"
                        {...field}
                        data-testid="input-tenant-phone"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tenantEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tenant Email Address *</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="e.g., tenant@example.com"
                        {...field}
                        data-testid="input-tenant-email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-3">
                <FormLabel>Tenancy Agreement *</FormLabel>
                <FormDescription className="text-xs">
                  Please upload a copy of the current tenancy agreement
                </FormDescription>
                
                <div className="space-y-3">
                  <label
                    htmlFor="tenancy-agreement-upload"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                      <p className="mb-2 text-sm text-muted-foreground">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground">PDF, DOC, or image files</p>
                    </div>
                    <input
                      id="tenancy-agreement-upload"
                      type="file"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e.target.files)}
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      multiple
                      disabled={isUploading}
                      data-testid="input-tenancy-agreement-upload"
                    />
                  </label>

                  {uploadedFiles.length > 0 && (
                    <div className="space-y-2">
                      {uploadedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 p-2 bg-background border rounded-md"
                        >
                          <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                          <span className="text-sm flex-1 truncate">{file.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {isUploading && (
                    <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                      <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <AlertDescription className="text-sm text-blue-900 dark:text-blue-100">
                        Uploading files...
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            </div>
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
