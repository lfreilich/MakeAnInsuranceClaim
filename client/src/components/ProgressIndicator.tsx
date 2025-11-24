import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export function ProgressIndicator({ currentStep, totalSteps }: ProgressIndicatorProps) {
  const progressPercentage = ((currentStep - 1) / (totalSteps - 1)) * 100;
  
  return (
    <div className="w-full space-y-4" data-testid="progress-indicator">
      {/* Progress Bar */}
      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="absolute top-0 left-0 h-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${progressPercentage}%` }}
          data-testid="progress-bar"
        />
      </div>
      
      {/* Step Indicators */}
      <div className="flex justify-between items-center">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => {
          const isCompleted = step < currentStep;
          const isCurrent = step === currentStep;
          const isUpcoming = step > currentStep;
          
          return (
            <div key={step} className="flex flex-col items-center gap-2">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300",
                  isCompleted && "bg-success text-success-foreground",
                  isCurrent && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                  isUpcoming && "bg-muted text-muted-foreground"
                )}
                data-testid={`step-indicator-${step}`}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" data-testid={`check-step-${step}`} />
                ) : (
                  step
                )}
              </div>
              <span
                className={cn(
                  "text-xs font-medium hidden sm:block",
                  isCurrent && "text-foreground",
                  (isCompleted || isUpcoming) && "text-muted-foreground"
                )}
              >
                Step {step}
              </span>
            </div>
          );
        })}
      </div>
      
      {/* Completion Percentage */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{Math.round(progressPercentage)}%</span> Complete
        </p>
      </div>
    </div>
  );
}
