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

interface AddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

// Helper to extract address component by type
function getAddressComponent(components: AddressComponent[], type: string): string | undefined {
  const component = components.find(c => c.types.includes(type));
  return component?.long_name;
}

export function Step2PropertyDetails({ defaultValues, onNext, onBack }: Step2PropertyDetailsProps) {
  const [addressSearch, setAddressSearch] = useState("");
  const [addressPredictions, setAddressPredictions] = useState<AddressPrediction[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoadingConstruction, setIsLoadingConstruction] = useState(false);
  const [constructionDetails, setConstructionDetails] = useState<ConstructionDetails | null>(null);
  const [hasSelectedAddress, setHasSelectedAddress] = useState(!!defaultValues.propertyPlaceId);

  const form = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      propertyAddress: defaultValues.propertyAddress || '',
      propertyBlock: defaultValues.propertyBlock || '',
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
        const addressComponents: AddressComponent[] = detailsData.result?.address_components || [];
        
        form.setValue("propertyAddress", formattedAddress);
        form.setValue("propertyPlaceId", prediction.place_id);
        setHasSelectedAddress(true);
        
        // Extract apartment/block information from address components
        // subpremise = apartment, suite, unit, floor number
        // premise = building name or number (common for apartment buildings)
        const subpremise = getAddressComponent(addressComponents, 'subpremise');
        const premise = getAddressComponent(addressComponents, 'premise');
        
        // Build the block/unit string from available components
        const blockParts: string[] = [];
        if (premise) blockParts.push(premise);
        if (subpremise) blockParts.push(subpremise);
        
        if (blockParts.length > 0) {
          const blockValue = blockParts.join(', ');
          form.setValue("propertyBlock", blockValue);
        }
        
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
    console.log("Step 2 submitting with data:", data);
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
          <strong>Required:</strong> Use the address search below to find and select your UK property. We'll verify it and retrieve construction details automatically.
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
                <div className="space-y-3">
                  <Popover open={isOpen} onOpenChange={setIsOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between font-normal h-auto min-h-[44px] py-3"
                        type="button"
                        data-testid="button-address-search"
                      >
                        <div className="flex items-center gap-2 flex-1 text-left">
                          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <span className={field.value ? "text-foreground" : "text-muted-foreground"}>
                            {field.value || "Click to search for UK address..."}
                          </span>
                        </div>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[500px] p-0" align="start">
                      <Command shouldFilter={false}>
                        <CommandInput
                          placeholder="Start typing address (e.g., 10 Downing Street, London...)"
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

                  {!hasSelectedAddress && (
                    <Alert className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
                      <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <AlertDescription className="text-sm text-amber-900 dark:text-amber-100">
                        You must select an address from the search to continue
                      </AlertDescription>
                    </Alert>
                  )}

                  {hasSelectedAddress && field.value && (
                    <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md">
                      <MapPin className="h-4 w-4 mt-0.5 text-green-600 dark:text-green-400 shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-green-900 dark:text-green-100">Selected Address:</p>
                        <p className="text-sm text-green-800 dark:text-green-200">{field.value}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          form.setValue("propertyAddress", "");
                          form.setValue("propertyPlaceId", "");
                          form.setValue("propertyBlock", "");
                          setHasSelectedAddress(false);
                          setConstructionDetails(null);
                        }}
                        data-testid="button-clear-address"
                      >
                        Change
                      </Button>
                    </div>
                  )}
                </div>
                <FormDescription className="text-xs">
                  Click the search button above and select your property from the results
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {hasSelectedAddress && (
            <FormField
              control={form.control}
              name="propertyBlock"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Block / Apartment / Unit Number</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Block A, Flat 12, Unit 3B"
                      {...field}
                      data-testid="input-property-block"
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    {field.value 
                      ? "Auto-detected from address. Edit if needed."
                      : "If applicable, enter your block, apartment, or unit number"
                    }
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

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
