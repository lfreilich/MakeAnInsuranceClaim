import { useParams, Link } from "wouter";
import { CheckCircle, Mail, Clock, FileText, AlertTriangle, Phone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import successImage from "@assets/generated_images/elegant_residential_tower_success.png";
import logoImage from "@assets/generated_images/moreland_estate_management_logo.png";

export default function ClaimSuccess() {
  const { referenceNumber } = useParams<{ referenceNumber: string }>();

  return (
    <div className="min-h-screen bg-background">
      {/* Success Hero Section */}
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${successImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-green-900/80 via-green-900/70 to-green-900/90" />
        </div>
        
        <div className="relative z-10 py-16 px-6 text-center">
          <div className="max-w-3xl mx-auto">
            <div className="mb-6 flex justify-center">
              <img
                src={logoImage}
                alt="Moreland Estate Management"
                className="h-16 opacity-90"
                data-testid="logo-success"
              />
            </div>
            
            <div className="mb-8 inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm animate-scale-in">
              <CheckCircle className="w-12 h-12 text-white" data-testid="success-icon" />
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 animate-fade-in">
              Claim Submitted Successfully
            </h1>
            
            <p className="text-lg sm:text-xl text-green-100 mb-6">
              Your buildings insurance claim has been received and will be processed by our team
            </p>
            
            <div className="inline-block bg-white/10 backdrop-blur-md rounded-lg px-8 py-4 border border-white/20">
              <p className="text-sm text-green-200 mb-1">Your Claim Reference</p>
              <p className="text-2xl sm:text-3xl font-bold text-white tracking-wider" data-testid="reference-number">
                {referenceNumber || "CLM-XXXXXX"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Next Steps Section */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-bold mb-8 text-center">What Happens Next</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="border-blue-200 dark:border-blue-800">
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-3">
                <Mail className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle className="text-lg">Step 1: Email Confirmation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                You will receive an email confirmation at the address you provided. 
                Please check your spam folder if you don't see it within 10 minutes.
              </p>
            </CardContent>
          </Card>

          <Card className="border-purple-200 dark:border-purple-800">
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center mb-3">
                <FileText className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <CardTitle className="text-lg">Step 2: Review & Forward</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Moreland Estate Management will review your claim within 2 business days 
                and forward it to the insurance company's claims team.
              </p>
            </CardContent>
          </Card>

          <Card className="border-green-200 dark:border-green-800">
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mb-3">
                <Clock className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-lg">Step 3: Assessment</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                The insurers will assess your claim and may contact you for additional information. 
                Average processing time is 5-10 business days.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Important Reminders */}
        <Alert className="mb-8 bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          <AlertDescription>
            <p className="font-semibold text-amber-900 dark:text-amber-100 mb-2">Important Reminders:</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-amber-800 dark:text-amber-200">
              <li>Keep your claim reference number <strong>{referenceNumber}</strong> for all future correspondence</li>
              <li>Do not proceed with permanent repairs until the claim is approved</li>
              <li>Save all receipts for emergency repairs you've already completed</li>
              <li>The insurers may arrange a property inspection - please cooperate with their assessor</li>
            </ul>
          </AlertDescription>
        </Alert>

        {/* Contact Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          <Card className="hover-elevate">
            <CardContent className="p-6 flex flex-col items-center gap-4 text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold mb-2">Questions About Your Claim?</p>
                <a
                  href="mailto:claims@morelandestate.co.uk"
                  className="text-sm text-primary hover:underline"
                  data-testid="link-contact-email"
                >
                  claims@morelandestate.co.uk
                </a>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-elevate">
            <CardContent className="p-6 flex flex-col items-center gap-4 text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Phone className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold mb-2">24/7 Emergency Line</p>
                <a
                  href="tel:+442079461234"
                  className="text-sm text-primary hover:underline"
                  data-testid="link-contact-phone"
                >
                  020 7946 1234
                </a>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={() => window.print()}
            variant="outline"
            size="lg"
            data-testid="button-print"
          >
            Print This Page
          </Button>
          <Link href="/">
            <Button size="lg" data-testid="button-home">
              Return to Homepage
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
