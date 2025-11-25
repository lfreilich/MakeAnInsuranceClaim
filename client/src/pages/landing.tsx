import { Link } from "wouter";
import { Shield, Clock, FileCheck, Building2, Mail, Phone, AlertCircle, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import heroImage from "@assets/generated_images/luxury_apartment_building_hero.png";
import logoImage from "@assets/MEM logo png_1763993340955.png";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative min-h-[500px] sm:min-h-[600px] lg:min-h-[700px] w-full overflow-hidden py-12 sm:py-16 lg:py-20">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-900/70 to-slate-900/90" />
        </div>
        
        <div className="relative z-10 h-full flex flex-col items-center justify-center px-6 text-center">
          <img
            src={logoImage}
            alt="Moreland Estate Management"
            className="h-24 sm:h-32 mb-8 opacity-100"
            data-testid="logo-hero"
          />
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 max-w-4xl">
            Submit Your Buildings Insurance Claim Online
          </h1>
          
          <p className="text-lg sm:text-xl text-slate-200 mb-8 max-w-2xl">
            Moreland Estate Management facilitates buildings insurance claims for leaseholders. 
            We streamline communication between you and the insurer's claims team - making the process faster and easier for everyone.
          </p>
          
          {/* Facilitator Notice */}
          <Card className="mb-8 max-w-3xl bg-blue-500/10 border-blue-500/30 backdrop-blur-sm">
            <CardContent className="p-6 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-300 flex-shrink-0 mt-0.5" />
              <div className="text-left">
                <p className="text-sm text-blue-100 font-medium mb-1">
                  Please Note:
                </p>
                <p className="text-sm text-blue-200">
                  Moreland Estate Management does not make decisions on claims. We act as a facilitator 
                  to ensure your claim reaches the insurers efficiently. All claim decisions are made by 
                  the insurance company's claims team.
                </p>
              </div>
            </CardContent>
          </Card>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/claim/start">
              <Button size="lg" className="text-lg px-8 py-6" data-testid="button-start-claim">
                Start Your Claim
              </Button>
            </Link>
            <Link href="/admin">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 bg-white/10 border-white/30 text-white hover:bg-white/20" data-testid="button-login">
                <LogIn className="w-5 h-5 mr-2" />
                Login
              </Button>
            </Link>
          </div>
          
          <p className="text-sm text-slate-400 mt-4">
            <span>Average completion time: 15 minutes</span>
            <span className="mx-2">|</span>
            <Link href="/admin" className="text-blue-300 hover:text-blue-200 hover:underline">
              Already submitted a claim? Track it here
            </Link>
          </p>
          
          {/* Trust Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-12 max-w-3xl">
            <div className="flex flex-col items-center gap-2 text-white">
              <Shield className="w-8 h-8 text-blue-400" />
              <span className="text-sm font-medium">Secure Portal</span>
            </div>
            <div className="flex flex-col items-center gap-2 text-white">
              <Clock className="w-8 h-8 text-blue-400" />
              <span className="text-sm font-medium">Fast Processing</span>
            </div>
            <div className="flex flex-col items-center gap-2 text-white">
              <FileCheck className="w-8 h-8 text-blue-400" />
              <span className="text-sm font-medium">Digital Submission</span>
            </div>
          </div>
        </div>
      </section>
      
      {/* How It Works Section */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">How It Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="hover-elevate">
              <CardContent className="p-8">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mb-4">
                  1
                </div>
                <h3 className="text-xl font-semibold mb-3">Verify Your Property</h3>
                <p className="text-muted-foreground">
                  Select your block and confirm your property address. Our system automatically validates 
                  that your property is covered under Moreland's buildings insurance.
                </p>
              </CardContent>
            </Card>
            
            <Card className="hover-elevate">
              <CardContent className="p-8">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mb-4">
                  2
                </div>
                <h3 className="text-xl font-semibold mb-3">Document the Incident</h3>
                <p className="text-muted-foreground">
                  Provide details about the incident, upload photos of the damage, and submit repair quotes. 
                  Our guided form ensures you provide everything needed for a smooth claims process.
                </p>
              </CardContent>
            </Card>
            
            <Card className="hover-elevate">
              <CardContent className="p-8">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mb-4">
                  3
                </div>
                <h3 className="text-xl font-semibold mb-3">Submit & Track</h3>
                <p className="text-muted-foreground">
                  Review and submit your claim digitally. We'll forward it to the insurers and keep you updated 
                  throughout the assessment process.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      
      {/* Protected Properties Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <Card className="overflow-hidden">
            <div className="flex flex-col md:flex-row">
              <div className="bg-primary p-12 flex items-center justify-center md:w-1/3">
                <Building2 className="w-24 h-24 text-primary-foreground" />
              </div>
              <CardContent className="p-8 md:w-2/3 flex flex-col justify-center">
                <h3 className="text-2xl font-bold mb-4">Protected Properties</h3>
                <p className="text-lg mb-4 font-semibold">Comprehensive buildings insurance</p>
                <p className="text-muted-foreground">
                  All Moreland-managed properties are covered under our premium buildings insurance policy, 
                  ensuring fast and fair claim settlements.
                </p>
              </CardContent>
            </div>
          </Card>
        </div>
      </section>
      
      {/* Contact Section */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8">Need Help?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Our team is here to assist you with your insurance claim
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Card className="hover-elevate">
              <CardContent className="p-8 flex flex-col items-center gap-4">
                <Mail className="w-8 h-8 text-primary" />
                <div>
                  <p className="font-semibold mb-1">Email Us</p>
                  <a
                    href="mailto:claims@morelandestate.co.uk"
                    className="text-primary hover:underline"
                    data-testid="link-email"
                  >
                    claims@morelandestate.co.uk
                  </a>
                </div>
              </CardContent>
            </Card>
            
            <Card className="hover-elevate">
              <CardContent className="p-8 flex flex-col items-center gap-4">
                <Phone className="w-8 h-8 text-primary" />
                <div>
                  <p className="font-semibold mb-1">24/7 Emergency</p>
                  <a
                    href="tel:+442079461234"
                    className="text-primary hover:underline"
                    data-testid="link-phone"
                  >
                    020 7946 1234
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-8 px-6 bg-card border-t">
        <div className="max-w-6xl mx-auto text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Moreland Estate Management. All rights reserved.</p>
          <p className="mt-2">Buildings insurance claims facilitation service for leaseholders</p>
        </div>
      </footer>
    </div>
  );
}
