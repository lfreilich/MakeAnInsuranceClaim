import { useState } from "react";
import { Sparkles, Loader2, ChevronRight, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";

interface AIWritingAssistantProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  originalText: string;
  onAccept: (enhancedText: string) => void;
}

export function AIWritingAssistant({ open, onOpenChange, originalText, onAccept }: AIWritingAssistantProps) {
  const [enhancedText, setEnhancedText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userConfirmed, setUserConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEnhance = async () => {
    if (!originalText.trim()) {
      setError("Please provide some text to enhance");
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiRequest("POST", "/api/ai/enhance-description", {
        text: originalText
      });
      const data = await response.json();
      setEnhancedText(data.enhancedText);
    } catch (err: any) {
      setError(err.message || "Failed to enhance text. Please try again.");
      console.error("AI enhancement error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = () => {
    if (!userConfirmed) {
      setError("Please confirm that you've reviewed and take responsibility for the AI-generated content");
      return;
    }
    onAccept(enhancedText);
    onOpenChange(false);
    setEnhancedText("");
    setUserConfirmed(false);
    setError(null);
  };

  const handleClose = () => {
    onOpenChange(false);
    setEnhancedText("");
    setUserConfirmed(false);
    setError(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <DialogTitle className="text-xl">AI Writing Assistant</DialogTitle>
              <DialogDescription>
                Enhance your incident description with AI-powered suggestions
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Original Text */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Your Original Description</Label>
            <Textarea
              value={originalText}
              readOnly
              className="min-h-[120px] bg-muted/50"
              data-testid="textarea-original"
            />
          </div>

          {/* Enhance Button */}
          {!enhancedText && !isLoading && (
            <Button
              onClick={handleEnhance}
              className="w-full"
              size="lg"
              data-testid="button-enhance"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Enhance with AI
            </Button>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-8 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
              <p className="text-sm text-muted-foreground">Generating enhanced description...</p>
            </div>
          )}

          {/* Enhanced Text */}
          {enhancedText && !isLoading && (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">AI-Enhanced Description</Label>
                  <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                    You can edit before accepting
                  </span>
                </div>
                <Textarea
                  value={enhancedText}
                  onChange={(e) => setEnhancedText(e.target.value)}
                  className="min-h-[120px] border-purple-200 dark:border-purple-800 focus:border-purple-500 dark:focus:border-purple-600"
                  data-testid="textarea-enhanced"
                />
              </div>

              {/* User Confirmation */}
              <Alert className="bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800">
                <AlertTriangle className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <AlertDescription>
                  <div className="space-y-3">
                    <p className="text-sm text-purple-900 dark:text-purple-100 font-medium">
                      Important: Review AI-generated content carefully
                    </p>
                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="ai-confirm"
                        checked={userConfirmed}
                        onCheckedChange={(checked) => setUserConfirmed(checked as boolean)}
                        className="mt-0.5"
                        data-testid="checkbox-confirm"
                      />
                      <label
                        htmlFor="ai-confirm"
                        className="text-sm text-purple-800 dark:text-purple-200 leading-relaxed cursor-pointer"
                      >
                        I have reviewed the AI-generated content and confirm it is accurate. I understand 
                        that I am responsible for the accuracy of all information submitted in this claim.
                      </label>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            </>
          )}

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleClose} data-testid="button-cancel">
            Cancel
          </Button>
          {enhancedText && (
            <Button
              onClick={handleAccept}
              disabled={!userConfirmed}
              className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-700"
              data-testid="button-accept-enhanced"
            >
              Accept & Use Enhanced Description
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
