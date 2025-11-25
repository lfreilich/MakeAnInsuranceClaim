import { useEffect, useState } from "react";
import { Loader2, FileText, Mail, Shield, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface SubmissionOverlayProps {
  isVisible: boolean;
}

const statusMessages = [
  { text: "Validating your information...", icon: Shield, duration: 1500 },
  { text: "Processing claim details...", icon: FileText, duration: 2000 },
  { text: "Uploading documents...", icon: FileText, duration: 2000 },
  { text: "Generating reference number...", icon: FileText, duration: 1500 },
  { text: "Sending confirmation email...", icon: Mail, duration: 2000 },
  { text: "Finalizing submission...", icon: CheckCircle2, duration: 1500 },
];

export function SubmissionOverlay({ isVisible }: SubmissionOverlayProps) {
  const [progress, setProgress] = useState(0);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    if (!isVisible) {
      setProgress(0);
      setCurrentMessageIndex(0);
      return;
    }

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return prev;
        const increment = Math.random() * 8 + 2;
        return Math.min(prev + increment, 95);
      });
    }, 300);

    const messageInterval = setInterval(() => {
      setCurrentMessageIndex((prev) => 
        prev < statusMessages.length - 1 ? prev + 1 : prev
      );
    }, 2000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(messageInterval);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  const CurrentIcon = statusMessages[currentMessageIndex].icon;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      data-testid="submission-overlay"
    >
      <div className="bg-card border rounded-lg shadow-lg p-8 max-w-md w-full mx-4 text-center">
        <div className="mb-6">
          <div className="relative inline-flex items-center justify-center w-16 h-16 mb-4">
            <Loader2 className="w-16 h-16 text-primary animate-spin" />
            <CurrentIcon className="w-6 h-6 text-primary absolute" />
          </div>
          
          <h3 className="text-xl font-semibold mb-2">
            Submitting Your Claim
          </h3>
          
          <p className="text-muted-foreground text-sm mb-6 min-h-[20px] transition-all duration-300">
            {statusMessages[currentMessageIndex].text}
          </p>
        </div>

        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {Math.round(progress)}% complete
          </p>
        </div>

        <p className="text-xs text-muted-foreground mt-6">
          Please do not close this window or navigate away.
        </p>
      </div>
    </div>
  );
}
