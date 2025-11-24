import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { step4Schema, type Step4Data } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft } from "lucide-react";

interface Step4BuildingDamageProps {
  defaultValues: Partial<Step4Data>;
  onNext: (data: Step4Data) => void;
  onBack: () => void;
}

export function Step4BuildingDamage({ defaultValues, onNext, onBack }: Step4BuildingDamageProps) {
  const form = useForm<Step4Data>({
    resolver: zodResolver(step4Schema),
    defaultValues: {
      hasBuildingDamage: defaultValues.hasBuildingDamage || false,
      buildingDamageDescription: defaultValues.buildingDamageDescription || '',
      buildingDamageAffectedAreas: defaultValues.buildingDamageAffectedAreas || '',
    },
  });

  const hasBuildingDamage = form.watch("hasBuildingDamage");

  const onSubmit = (data: Step4Data) => {
    if (!data.hasBuildingDamage) {
      data.buildingDamageDescription = '';
      data.buildingDamageAffectedAreas = '';
    }
    onNext(data);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Building Damage</h2>
        <p className="text-muted-foreground">
          Details about damage to the building structure or common areas.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="hasBuildingDamage"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-lg border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    data-testid="checkbox-has-building-damage"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="font-semibold">
                    This claim includes damage to the building structure or common areas
                  </FormLabel>
                  <p className="text-sm text-muted-foreground">
                    Check this box if the incident caused damage to walls, roof, windows, floors, 
                    communal areas, or other building elements
                  </p>
                </div>
              </FormItem>
            )}
          />

          {hasBuildingDamage && (
            <>
              <FormField
                control={form.control}
                name="buildingDamageDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description of Building Damage</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the specific damage to the building. Include location, extent, and visible effects."
                        className="min-h-[120px] resize-y"
                        {...field}
                        data-testid="textarea-building-damage-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="buildingDamageAffectedAreas"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Affected Areas</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="List all affected areas (e.g., ceiling in bedroom, external wall, communal hallway)"
                        className="min-h-[100px] resize-y"
                        {...field}
                        data-testid="textarea-affected-areas"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}

          <div className="flex justify-between pt-4">
            <Button type="button" variant="outline" onClick={onBack} data-testid="button-back-step4">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button type="submit" size="lg" data-testid="button-next-step4">
              Next Step
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
