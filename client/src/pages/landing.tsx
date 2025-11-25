import { Link } from "wouter";
import { Shield, Clock, FileCheck, Building2, Mail, Phone, AlertCircle, LogIn, Home, Bug, ShieldAlert, Droplets, TrendingUp, Users, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import heroImage from "@assets/generated_images/luxury_apartment_building_hero.png";
import logoImage from "@assets/MEM logo png_1763993340955.png";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative min-h-screen w-full overflow-hidden flex flex-col">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-900/70 to-slate-900/90" />
        </div>
        
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
          <img
            src={logoImage}
            alt="Moreland Estate Management"
            className="h-24 sm:h-32 mb-8 opacity-100"
            data-testid="logo-hero"
          />
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-amber-400 mb-6 max-w-4xl">
            Submit Your Buildings Insurance Claim Online
          </h1>
          
          <p className="text-lg sm:text-xl text-amber-200 mb-8 max-w-2xl">
            Moreland Estate Management facilitates buildings insurance claims for leaseholders. 
            We streamline communication between you and the insurer's claims team - making the process faster and easier for everyone.
          </p>
          
          {/* Facilitator Notice */}
          <Card className="mb-8 max-w-3xl bg-blue-500/20 border-blue-500/30 backdrop-blur-sm text-white">
            <CardContent className="p-6 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-left">
                <p className="text-sm text-amber-400 font-medium mb-1">
                  Please Note:
                </p>
                <p className="text-sm text-white/90">
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
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 bg-blue-500/30 border-blue-400/50 text-amber-400 hover:bg-blue-500/40" data-testid="button-login">
                <LogIn className="w-5 h-5 mr-2" />
                Login
              </Button>
            </Link>
          </div>
          
          <p className="text-sm text-slate-400 mt-4">
            <span>Average completion time: 15 minutes</span>
            <span className="mx-2">|</span>
            <Link href="/admin" className="text-amber-400 hover:text-amber-300 hover:underline">
              Already submitted a claim? Track it here
            </Link>
          </p>
          
          {/* Trust Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-12 max-w-3xl">
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-blue-500/30 flex items-center justify-center">
                <Shield className="w-6 h-6 text-amber-400" />
              </div>
              <span className="text-sm font-medium text-amber-400">Secure Portal</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-blue-500/30 flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-400" />
              </div>
              <span className="text-sm font-medium text-amber-400">Fast Processing</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-blue-500/30 flex items-center justify-center">
                <FileCheck className="w-6 h-6 text-amber-400" />
              </div>
              <span className="text-sm font-medium text-amber-400">Digital Submission</span>
            </div>
          </div>
        </div>
      </section>
      
      {/* How It Works Section */}
      <section className="relative py-20 px-6 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-slate-900/95" />
        </div>
        
        <div className="relative z-10 max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12 text-amber-400">How It Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-blue-500/20 backdrop-blur-sm border-blue-500/30 hover-elevate">
              <CardContent className="p-8">
                <div className="w-12 h-12 rounded-full bg-amber-500 text-slate-900 flex items-center justify-center text-2xl font-bold mb-4">
                  1
                </div>
                <h3 className="text-xl font-semibold mb-3 text-amber-400">Enter Your Details</h3>
                <p className="text-white/90">
                  Provide your contact information and property address. Our guided form makes it easy 
                  to submit the details needed to process your buildings insurance claim.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-blue-500/20 backdrop-blur-sm border-blue-500/30 hover-elevate">
              <CardContent className="p-8">
                <div className="w-12 h-12 rounded-full bg-amber-500 text-slate-900 flex items-center justify-center text-2xl font-bold mb-4">
                  2
                </div>
                <h3 className="text-xl font-semibold mb-3 text-amber-400">Document the Incident</h3>
                <p className="text-white/90">
                  Provide details about the incident, upload photos of the damage, and submit repair quotes. 
                  Our guided form ensures you provide everything needed for a smooth claims process.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-blue-500/20 backdrop-blur-sm border-blue-500/30 hover-elevate">
              <CardContent className="p-8">
                <div className="w-12 h-12 rounded-full bg-amber-500 text-slate-900 flex items-center justify-center text-2xl font-bold mb-4">
                  3
                </div>
                <h3 className="text-xl font-semibold mb-3 text-amber-400">Submit & Track</h3>
                <p className="text-white/90">
                  Review and submit your claim digitally. We'll forward it to the insurers and keep you updated 
                  throughout the assessment process.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      
      {/* Protected Properties Section */}
      <section className="relative py-20 px-6 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-slate-900/95" />
        </div>
        
        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-amber-400">Why Your Building's Insurance Is Exceptional<span className="text-white">*</span></h2>
            <p className="text-lg text-white/90 max-w-3xl mx-auto">
              Moreland-managed buildings benefit from a premium, portfolio-grade insurance policy that includes 
              protections rarely found in standard block of flats cover. This means faster reinstatement, 
              stronger financial safety, and wider protection for every leaseholder.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="bg-blue-500/20 backdrop-blur-sm border-blue-500/30 hover-elevate">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-blue-500/30 flex items-center justify-center flex-shrink-0">
                    <Home className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2 text-amber-400">30% Alternative Accommodation Cover</h3>
                    <p className="text-sm text-white/90">
                      If your flat becomes uninhabitable, the policy provides significantly higher-than-standard 
                      limits to ensure you're re-housed comfortably while repairs are completed.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-blue-500/20 backdrop-blur-sm border-blue-500/30 hover-elevate">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-blue-500/30 flex items-center justify-center flex-shrink-0">
                    <Bug className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2 text-amber-400">Japanese Knotweed & Fly-Tipping Cover</h3>
                    <p className="text-sm text-white/90">
                      Unusual and highly valuable protections that most block policies exclude, keeping the 
                      estate protected from unexpected environmental issues.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-blue-500/20 backdrop-blur-sm border-blue-500/30 hover-elevate">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-blue-500/30 flex items-center justify-center flex-shrink-0">
                    <ShieldAlert className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2 text-amber-400">Police Welfare Entry & Squatter Damage</h3>
                    <p className="text-sm text-white/90">
                      Damage caused during emergency welfare checks or unlawful occupation is included, giving 
                      residents peace of mind.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-blue-500/20 backdrop-blur-sm border-blue-500/30 hover-elevate">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-blue-500/30 flex items-center justify-center flex-shrink-0">
                    <Droplets className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2 text-amber-400">Enhanced Leak Detection (Trace & Access)</h3>
                    <p className="text-sm text-white/90">
                      The policy pays for finding and fixing the source of leaks within walls and ceilings, 
                      protecting you from the most common type of flat-to-flat damage.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-blue-500/20 backdrop-blur-sm border-blue-500/30 hover-elevate">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-blue-500/30 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2 text-amber-400">Day-One Rebuild Protection</h3>
                    <p className="text-sm text-white/90">
                      Your building is protected against inflation in construction costs from day one, 
                      ensuring full reinstatement after a major event.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-blue-500/20 backdrop-blur-sm border-blue-500/30 hover-elevate">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-blue-500/30 flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2 text-amber-400">Composite Insured Protection</h3>
                    <p className="text-sm text-white/90">
                      One resident's mistake won't invalidate the entire block's insurance. Your cover 
                      remains safe regardless of others' actions.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Portfolio-Grade Protection - Featured Card */}
          <Card className="mt-8 bg-blue-500/20 backdrop-blur-sm border-blue-400/30">
            <CardContent className="p-8">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="w-16 h-16 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-8 h-8 text-slate-900" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2 text-amber-400">Portfolio-Grade Protection</h3>
                  <p className="text-white/90 max-w-2xl">
                    Together, these features provide a level of cover normally reserved for institutional property 
                    portfolios, ensuring your home is safeguarded with one of the strongest residential block policies 
                    in the market.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
        </div>
      </section>
      
      {/* Contact Section */}
      <section className="relative py-20 px-6 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-slate-900/95" />
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4 text-amber-400">Need Help?</h2>
          <p className="text-lg text-white/90 mb-8">
            Our team is here to assist you with your insurance claim
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Card className="bg-blue-500/20 backdrop-blur-sm border-blue-500/30 hover-elevate">
              <CardContent className="p-8 flex flex-col items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-500/30 flex items-center justify-center">
                  <Mail className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <p className="font-semibold mb-1 text-amber-400">Email Us</p>
                  <a
                    href="mailto:claims@morelandestate.co.uk"
                    className="text-white hover:text-amber-300 hover:underline"
                    data-testid="link-email"
                  >
                    claims@morelandestate.co.uk
                  </a>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-blue-500/20 backdrop-blur-sm border-blue-500/30 hover-elevate">
              <CardContent className="p-8 flex flex-col items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-500/30 flex items-center justify-center">
                  <Phone className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <p className="font-semibold mb-1 text-amber-400">24/7 Emergency</p>
                  <a
                    href="tel:+442070434260"
                    className="text-white hover:text-amber-300 hover:underline"
                    data-testid="link-phone"
                  >
                    020 7043 4260
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-8 px-6 bg-slate-900 border-t border-slate-800">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-sm text-slate-400">&copy; {new Date().getFullYear()} Moreland Estate Management. All rights reserved.</p>
          <p className="text-sm text-slate-400 mt-2">Buildings insurance claims facilitation service for leaseholders</p>
        </div>
        
        <p className="text-[10px] text-slate-500 mt-6 px-4 text-center">
          * The features described above apply only to buildings insured under Moreland's bespoke policy wording, produced in conjunction with the insurer, underwriters, and our specialist broker team. Buildings insured under different policy arrangements may have different levels of cover. Coverage is always subject to the full terms, conditions, limits, and exclusions contained within the insurer's official policy documents. This summary is for general guidance only and does not replace or override the insurer's wording, schedule, or endorsements. Nothing on this page constitutes insurance advice. For full details of your building's insurance cover, please refer to the complete policy documentation or contact our insurance administration team.
        </p>
      </footer>
    </div>
  );
}
