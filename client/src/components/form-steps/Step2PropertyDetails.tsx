import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { step2Schema, type Step2Data } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft, Search, Loader2, MapPin } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Info } from "lucide-react";
import { useState, useEffect } from "react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent } from "@/components/ui/card";

interface Step2PropertyDetailsProps {
  defaultValues: Partial<Step2Data>;
  onNext: (data: Step2Data) => void;
  onBack: () => void;
}

interface AddressPrediction {
  description: string;
  place_id: string;
}

interface ConstructionDetails {
  age?: string;
  construction_type?: string;
}

export function Step2PropertyDetails({ defaultValues, onNext, onBack }: Step2PropertyDetailsProps) {
  const [addressSearch, setAddressSearch] = useState("");
  const [addressPredictions, setAddressPredictions] = useState<AddressPrediction[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoadingConstruction, setIsLoadingConstruction] = useState(false);
  const [constructionDetails, setConstructionDetails] = useState<ConstructionDetails | null>(null);

  const form = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      propertyAddress: defaultValues.propertyAddress || '',
      propertyBlock: defaultValues.propertyBlock || '',
      propertyUnit: defaultValues.propertyUnit || '',
      propertyPlaceId: defaultValues.propertyPlaceId || '',
      propertyConstructionAge: defaultValues.propertyConstructionAge || '',
      propertyConstructionType: defaultValues.propertyConstructionType || '',
    },
  });

  // Debounced Google Places autocomplete search
  useEffect(() => {
    if (addressSearch.length < 3) {
      setAddressPredictions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await fetch(`/api/address/autocomplete?input=${encodeURIComponent(addressSearch)}`);
        if (response.ok) {
          const data = await response.json();
          setAddressPredictions(data.predictions || []);
        }
      } catch (error) {
        console.error("Address autocomplete failed:", error);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [addressSearch]);

  const handleAddressSelect = async (prediction: AddressPrediction) => {
    try {
      // Get place details from Google Places
      const detailsResponse = await fetch(`/api/address/details/${prediction.place_id}`);
      if (detailsResponse.ok) {
        const detailsData = await detailsResponse.json();
        const formattedAddress = detailsData.result?.formatted_address || prediction.description;
        
        form.setValue("propertyAddress", formattedAddress);
        form.setValue("propertyPlaceId", prediction.place_id);
        
        // Now fetch construction details from Chimnie
        setIsLoadingConstruction(true);
        try {
          const constructionResponse = await fetch('/api/address/construction-details', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address: formattedAddress }),
          });
          
          if (constructionResponse.ok) {
            const constructionData = await constructionResponse.json();
            const details: ConstructionDetails = {
              age: constructionData.construction_age || constructionData.age_band || 'Unknown',
              construction_type: constructionData.construction_type || constructionData.build_type || 'Unknown',
            };
            
            setConstructionDetails(details);
            form.setValue("propertyConstructionAge", details.age || '');
            form.setValue("propertyConstructionType", details.construction_type || '');
          }
        } catch (error) {
          console.error("Failed to fetch construction details:", error);
        } finally {
          setIsLoadingConstruction(false);
        }
      }
    } catch (error) {
      console.error("Failed to get place details:", error);
    }
    
    setIsOpen(false);
    setAddressSearch("");
  };

  const onSubmit = (data: Step2Data) => {
    onNext(data);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Property Details</h2>
        <p className="text-muted-foreground">
          Enter your property address. We'll validate it and retrieve construction details automatically.
        </p>
      </div>

      <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        <AlertDescription className="text-sm text-blue-900 dark:text-blue-100">
          All UK properties can submit claims through this portal. We'll verify the address using Google Places and retrieve construction details via Chimnie.
        </AlertDescription>
      </Alert>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="propertyAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Property Address *</FormLabel>
                <div className="space-y-2">
                  <Popover open={isOpen} onOpenChange={setIsOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between font-normal"
                        type="button"
                        data-testid="button-address-search"
                      >
                        {field.value || "Search for UK address..."}
                        <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[500px] p-0" align="start">
                      <Command shouldFilter={false}>
                        <CommandInput
                          placeholder="Start typing address (e.g., 10 Downing Street...)"
                          value={addressSearch}
                          onValueChange={setAddressSearch}
                          data-testid="input-address-search"
                        />
                        <CommandList>
                          {isSearching && (
                            <div className="flex items-center justify-center p-4">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span className="ml-2 text-sm text-muted-foreground">Searching...</span>
                            </div>
                          )}
                          {!isSearching && addressPredictions.length === 0 && addressSearch.length >= 3 && (
                            <CommandEmpty>No addresses found. Try a different search.</CommandEmpty>
                          )}
                          {!isSearching && addressPredictions.length === 0 && addressSearch.length < 3 && (
                            <CommandEmpty>Type at least 3 characters to search</CommandEmpty>
                          )}
                          {addressPredictions.length > 0 && (
                            <CommandGroup heading="UK Addresses">
                              {addressPredictions.map((prediction, index) => (
                                <CommandItem
                                  key={prediction.place_id}
                                  value={prediction.description}
                                  onSelect={() => handleAddressSelect(prediction)}
                                  data-testid={`address-result-${index}`}
                                  className="flex items-start gap-2"
                                >
                                  <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                                  <span>{prediction.description}</span>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          )}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  
                  <FormControl>
                    <Input
                      placeholder="Or type address manually: e.g., Flat 12B, 45 High Street, London, SW1A 1AA"
                      {...field}
                      data-testid="input-property-address"
                    />
                  </FormControl>
                </div>
                <FormDescription className="text-xs">
                  Search using Google Places above, or type the full address manually
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="propertyUnit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit/Flat Number (Optional)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., 12B, Ground Floor, or Unit 5"
                    {...field}
                    data-testid="input-property-unit"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {isLoadingConstruction && (
            <Alert className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
              <Loader2 className="w-4 h-4 animate-spin text-amber-600 dark:text-amber-400" />
              <AlertDescription className="text-sm text-amber-900 dark:text-amber-100">
                Fetching construction details from Chimnie...
              </AlertDescription>
            </Alert>
          )}

          {constructionDetails && !isLoadingConstruction && (
            <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
              <CardContent className="p-4">
                <h4 className="font-semibold text-sm mb-3 text-green-900 dark:text-green-100">
                  Property Construction Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="font-medium text-green-800 dark:text-green-200">Construction Age:</span>
                    <p className="text-green-900 dark:text-green-100">{constructionDetails.age}</p>
                  </div>
                  <div>
                    <span className="font-medium text-green-800 dark:text-green-200">Construction Type:</span>
                    <p className="text-green-900 dark:text-green-100">{constructionDetails.construction_type}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-between pt-4">
            <Button type="button" variant="outline" onClick={onBack} data-testid="button-back-step2">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button type="submit" size="lg" data-testid="button-next-step2">
              Next Step
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
