import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { step2Schema, type Step2Data } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft, Search, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface Step2PropertyDetailsProps {
  defaultValues: Partial<Step2Data>;
  onNext: (data: Step2Data) => void;
  onBack: () => void;
}

// Moreland managed blocks
const MANAGED_BLOCKS = [
  "Arlington Court",
  "Beaumont House",
  "Carlton Gardens",
  "Devonshire Towers",
  "Elmwood Manor",
  "Fairfield Heights",
  "Greenwich Plaza",
  "Hampton Court"
];

export function Step2PropertyDetails({ defaultValues, onNext, onBack }: Step2PropertyDetailsProps) {
  const [addressSearch, setAddressSearch] = useState("");
  const [addressResults, setAddressResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      propertyAddress: defaultValues.propertyAddress || '',
      propertyBlock: defaultValues.propertyBlock || '',
      propertyUnit: defaultValues.propertyUnit || '',
    },
  });

  // Debounced address search
  useEffect(() => {
    if (addressSearch.length < 3) {
      setAddressResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await fetch(`/api/address/search?q=${encodeURIComponent(addressSearch)}`);
        if (response.ok) {
          const data = await response.json();
          setAddressResults(data.addresses || []);
        }
      } catch (error) {
        console.error("Address search failed:", error);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [addressSearch]);

  const handleAddressSelect = (address: any) => {
    const fullAddress = address.formatted || address.line_1 || address.text || "";
    form.setValue("propertyAddress", fullAddress);
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
          Confirm the property address where the incident occurred. Only Moreland-managed properties are covered.
        </p>
      </div>

      <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        <AlertDescription className="text-sm text-blue-900 dark:text-blue-100">
          Your property must be within a Moreland-managed block to be covered under the buildings insurance policy.
        </AlertDescription>
      </Alert>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="propertyBlock"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Moreland Block *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-property-block">
                      <SelectValue placeholder="Select your block" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {MANAGED_BLOCKS.map((block) => (
                      <SelectItem key={block} value={block}>
                        {block}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="propertyAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Property Address *</FormLabel>
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
                        {field.value || "Search for address..."}
                        <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0" align="start">
                      <Command shouldFilter={false}>
                        <CommandInput
                          placeholder="Type to search UK addresses..."
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
                          {!isSearching && addressResults.length === 0 && addressSearch.length >= 3 && (
                            <CommandEmpty>No addresses found. Try a different search.</CommandEmpty>
                          )}
                          {!isSearching && addressResults.length === 0 && addressSearch.length < 3 && (
                            <CommandEmpty>Type at least 3 characters to search</CommandEmpty>
                          )}
                          {addressResults.length > 0 && (
                            <CommandGroup heading="Addresses">
                              {addressResults.map((address, index) => (
                                <CommandItem
                                  key={index}
                                  value={address.formatted || address.line_1 || address.text}
                                  onSelect={() => handleAddressSelect(address)}
                                  data-testid={`address-result-${index}`}
                                >
                                  {address.formatted || address.line_1 || address.text}
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
                  Search for your address above, or type it manually below
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
                    placeholder="e.g., 12B or Ground Floor"
                    {...field}
                    data-testid="input-property-unit"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
