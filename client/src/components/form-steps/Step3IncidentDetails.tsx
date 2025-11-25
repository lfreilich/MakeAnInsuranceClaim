import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { step3Schema, type Step3Data } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronRight, ChevronLeft, Calendar as CalendarIcon, Sparkles, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { AIWritingAssistant } from "../AIWritingAssistant";

interface Step3IncidentDetailsProps {
  defaultValues: Partial<Step3Data>;
  onNext: (data: Step3Data) => void;
  onBack: () => void;
}

export function Step3IncidentDetails({ defaultValues, onNext, onBack }: Step3IncidentDetailsProps) {
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showLateNotificationWarning, setShowLateNotificationWarning] = useState(false);
  const [lateNotificationAcknowledged, setLateNotificationAcknowledged] = useState(false);
  
  const form = useForm<Step3Data>({
    resolver: zodResolver(step3Schema),
    defaultValues: {
      incidentDate: defaultValues.incidentDate ? new Date(defaultValues.incidentDate) : new Date(),
      incidentDescription: defaultValues.incidentDescription || '',
      incidentType: defaultValues.incidentType || 'fire',
    },
  });

  const incidentDate = form.watch("incidentDate");
  const incidentDescription = form.watch("incidentDescription");
  
  const daysSinceIncident = incidentDate 
    ? Math.floor((new Date().getTime() - new Date(incidentDate).getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  const isWithin60Days = daysSinceIncident <= 60;

  useEffect(() => {
    if (!isWithin60Days && incidentDate && !lateNotificationAcknowledged) {
      setShowLateNotificationWarning(true);
    }
  }, [incidentDate, isWithin60Days, lateNotificationAcknowledged]);

  const handleAcknowledgeLateNotification = () => {
    setLateNotificationAcknowledged(true);
    setShowLateNotificationWarning(false);
  };

  const handleAIEnhance = (enhancedText: string) => {
    form.setValue("incidentDescription", enhancedText);
  };

  const onSubmit = (data: Step3Data) => {
    onNext(data);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Incident Details</h2>
        <p className="text-muted-foreground">
          Describe what happened and when the incident occurred.
        </p>
      </div>

      {!isWithin60Days && incidentDate && (
        <Alert variant="destructive">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>
            <strong>Warning:</strong> Claims must be submitted within 60 days of the incident. 
            Your incident date is {daysSinceIncident} days ago. Late submissions may not be accepted.
          </AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="incidentDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date of Incident *</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                        data-testid="button-select-date"
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription className="text-xs">
                  When did the damage or incident occur?
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="incidentType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type of Incident *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-incident-type">
                      <SelectValue placeholder="Select incident type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="fire">Fire</SelectItem>
                    <SelectItem value="lightning">Lightning</SelectItem>
                    <SelectItem value="explosion">Explosion</SelectItem>
                    <SelectItem value="aircraft">Aircraft</SelectItem>
                    <SelectItem value="riot">Riot</SelectItem>
                    <SelectItem value="civil_commotion">Civil commotion</SelectItem>
                    <SelectItem value="strikers_locked_out_workers">Strikers / locked-out workers</SelectItem>
                    <SelectItem value="malicious_persons">Malicious persons</SelectItem>
                    <SelectItem value="theft_or_attempted_theft">Theft or attempted theft</SelectItem>
                    <SelectItem value="earthquake">Earthquake</SelectItem>
                    <SelectItem value="storm">Storm</SelectItem>
                    <SelectItem value="flood">Flood</SelectItem>
                    <SelectItem value="escape_of_water">Escape of water</SelectItem>
                    <SelectItem value="escape_of_oil">Escape of oil</SelectItem>
                    <SelectItem value="impact_by_vehicle_or_animal">Impact by vehicle or animal</SelectItem>
                    <SelectItem value="leakage_of_oil_from_heating">Leakage of oil from fixed heating installation</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="incidentDescription"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Incident Description *</FormLabel>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAIAssistant(true)}
                    disabled={!incidentDescription.trim()}
                    className="text-purple-600 border-purple-200 hover:bg-purple-50 dark:text-purple-400 dark:border-purple-800 dark:hover:bg-purple-950"
                    data-testid="button-ai-enhance"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Enhance with AI
                  </Button>
                </div>
                <FormControl>
                  <Textarea
                    placeholder="Describe what happened in detail. Include the cause, extent of damage, and any immediate actions taken. Minimum 50 characters required."
                    className="min-h-[150px] resize-y"
                    {...field}
                    data-testid="textarea-incident-description"
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  Provide as much detail as possible (minimum 50 characters)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-between pt-4">
            <Button type="button" variant="outline" onClick={onBack} data-testid="button-back-step3">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button type="submit" size="lg" data-testid="button-next-step3">
              Next Step
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </form>
      </Form>

      <AIWritingAssistant
        open={showAIAssistant}
        onOpenChange={setShowAIAssistant}
        originalText={incidentDescription}
        onAccept={handleAIEnhance}
      />

      <Dialog open={showLateNotificationWarning} onOpenChange={setShowLateNotificationWarning}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <DialogTitle className="text-xl">Late Notification Warning</DialogTitle>
                <DialogDescription className="text-sm">
                  Incident reported {daysSinceIncident} days after occurrence
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <p className="text-sm leading-relaxed">
              This notice applies only if this is the first notification of a loss that occurred more than 60 days ago.
            </p>
            <p className="text-sm leading-relaxed">
              The policy requires all claims to be reported within 60 days. You may continue to complete the claim documentation, and it will be forwarded to insurers; however, <strong>the acceptance of this claim will remain entirely at their discretion</strong>.
            </p>
          </div>

          <DialogFooter>
            <Button
              onClick={handleAcknowledgeLateNotification}
              className="w-full"
              data-testid="button-acknowledge-late-notification"
            >
              I Understand - Continue with Claim
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
