import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { ProgressIndicator } from "../components/ProgressIndicator";
import { Step1ClaimantDetails } from "../components/form-steps/Step1ClaimantDetails";
import { Step2PropertyDetails } from "../components/form-steps/Step2PropertyDetails";
import { Step3IncidentDetails } from "../components/form-steps/Step3IncidentDetails";
import { Step4BuildingDamage } from "../components/form-steps/Step4BuildingDamage";
import { Step5TheftVandalism } from "../components/form-steps/Step5TheftVandalism";
import { Step6PropertyOccupancy } from "../components/form-steps/Step6PropertyOccupancy";
import { Step7Uploads } from "../components/form-steps/Step7Uploads";
import { Step8Declaration } from "../components/form-steps/Step8Declaration";
import { apiRequest } from "@/lib/queryClient";
import type { ClaimFormData } from "@shared/schema";
import logoImage from "@assets/MEM logo png_1763993340955.png";
import headerImage from "@assets/generated_images/modern_residential_building_header.png";
import { useToast } from "@/hooks/use-toast";

const TOTAL_STEPS = 8;

export default function ClaimForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<ClaimFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const updateFormData = (stepData: Partial<ClaimFormData>) => {
    setFormData(prev => ({ ...prev, ...stepData }));
  };

  const handleStepComplete = (stepData: Partial<ClaimFormData>) => {
    updateFormData(stepData);
    setCurrentStep(prev => Math.min(prev + 1, TOTAL_STEPS));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFinalSubmit = async (step8Data: Partial<ClaimFormData>) => {
    // Normalize boolean flags - ensure they're always false if not explicitly set
    const normalizedFormData = {
      ...formData,
      ...step8Data,
      // Convert Date to ISO string for JSON serialization
      incidentDate: formData.incidentDate instanceof Date 
        ? formData.incidentDate.toISOString() 
        : formData.incidentDate,
      hasBuildingDamage: formData.hasBuildingDamage ?? false,
      hasTheft: formData.hasTheft ?? false,
      theftPoliceReported: formData.theftPoliceReported ?? false,
      isInvestmentProperty: formData.isInvestmentProperty ?? false,
      // Ensure arrays are never undefined
      damagePhotos: formData.damagePhotos ?? [],
      repairQuotes: formData.repairQuotes ?? [],
      invoices: formData.invoices ?? [],
      policeReports: formData.policeReports ?? [],
      otherDocuments: formData.otherDocuments ?? [],
      tenancyAgreements: formData.tenancyAgreements ?? [],
    };
    setIsSubmitting(true);

    try {
      const response = await apiRequest("POST", "/api/claims", normalizedFormData);
      const data = await response.json();
      
      toast({
        title: "Claim Submitted Successfully",
        description: `Your claim reference is ${data.referenceNumber}`,
      });
      
      setLocation(`/claim/success/${data.referenceNumber}`);
    } catch (error: any) {
      console.error("Claim submission error:", error);
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: error.message || "Failed to submit claim. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Building Image */}
      <div className="relative h-48 sm:h-64 w-full overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${headerImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 to-slate-900/80" />
        </div>
        
        <div className="relative z-10 h-full flex items-center justify-center px-6">
          <div className="text-center">
            <img
              src={logoImage}
              alt="Moreland Estate Management"
              className="h-12 sm:h-16 mx-auto mb-4 opacity-90"
              data-testid="logo-form"
            />
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              Buildings Insurance Claim
            </h1>
          </div>
        </div>
      </div>

      {/* Warning Banner */}
      <div className="bg-amber-500 text-white py-3 px-6">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">
            <strong>Important:</strong> Claims must be submitted within 60 days of the incident. 
            Ensure all information is accurate and complete.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8 sm:py-12">
        {/* Progress Indicator */}
        <div className="mb-8">
          <ProgressIndicator currentStep={currentStep} totalSteps={TOTAL_STEPS} />
        </div>

        {/* Facilitator Notice */}
        <Alert className="mb-8 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription className="text-sm text-blue-900 dark:text-blue-100">
            <strong>Reminder:</strong> Moreland Estate Management facilitates this claim on your behalf. 
            All decisions are made by the insurance company's claims team.
          </AlertDescription>
        </Alert>

        {/* Step Content */}
        <Card className="shadow-lg">
          <CardContent className="p-6 sm:p-8">
            {currentStep === 1 && (
              <Step1ClaimantDetails
                defaultValues={formData}
                onNext={handleStepComplete}
              />
            )}
            {currentStep === 2 && (
              <Step2PropertyDetails
                defaultValues={formData}
                onNext={handleStepComplete}
                onBack={handleBack}
              />
            )}
            {currentStep === 3 && (
              <Step3IncidentDetails
                defaultValues={formData}
                onNext={handleStepComplete}
                onBack={handleBack}
              />
            )}
            {currentStep === 4 && (
              <Step4BuildingDamage
                defaultValues={formData}
                onNext={handleStepComplete}
                onBack={handleBack}
              />
            )}
            {currentStep === 5 && (
              <Step5TheftVandalism
                defaultValues={formData}
                onNext={handleStepComplete}
                onBack={handleBack}
              />
            )}
            {currentStep === 6 && (
              <Step6PropertyOccupancy
                defaultValues={formData}
                onNext={handleStepComplete}
                onBack={handleBack}
              />
            )}
            {currentStep === 7 && (
              <Step7Uploads
                defaultValues={formData}
                formData={formData}
                onNext={handleStepComplete}
                onBack={handleBack}
              />
            )}
            {currentStep === 8 && (
              <Step8Declaration
                defaultValues={formData}
                onSubmit={handleFinalSubmit}
                onBack={handleBack}
                isSubmitting={isSubmitting}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
