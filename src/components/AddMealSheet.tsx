import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, set } from 'date-fns';
import { create } from 'zustand';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api-client';
import { Meal, MealType, Preset } from '@shared/types';
const mealSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  type: z.string().min(1, 'Meal type is required'),
  customType: z.string().optional(),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)'),
}).refine(data => data.type !== 'Other' || (data.customType && data.customType.length > 0), {
  message: 'Custom type is required when "Other" is selected',
  path: ['customType'],
});
type MealFormData = z.infer<typeof mealSchema>;
type MealStore = {
  addMeal: (meal: Meal) => void;
  updateMeal: (meal: Meal) => void;
};
// This is a simplified selector from the HomePage store.
const useMealStore = create<MealStore>(() => ({
  addMeal: () => {},
  updateMeal: () => {},
}));
if (typeof window !== 'undefined') {
  try {
    const mainStore = (window as any).__ZUSTAND_STORES__.MealStore;
    if (mainStore) {
      useMealStore.setState(mainStore.getState());
      mainStore.subscribe(useMealStore.setState);
    }
  } catch (e) {
    // Store not found, this is fine.
  }
}
interface AddMealSheetProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  meal: Meal | null;
  currentDate: Date;
}
const defaultMealTypes: MealType[] = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
export function AddMealSheet({ isOpen, setIsOpen, meal, currentDate }: AddMealSheetProps) {
  const { addMeal, updateMeal } = useMealStore.getState();
  const [presets, setPresets] = useState<Preset[]>([]);
  const { register, handleSubmit, control, watch, reset, formState: { errors, isSubmitting } } = useForm<MealFormData>({
    resolver: zodResolver(mealSchema),
    defaultValues: {
      description: '',
      type: 'Breakfast',
      customType: '',
      time: format(new Date(), 'HH:mm'),
    },
  });
  const selectedType = watch('type');
  useEffect(() => {
    if (isOpen) {
      const fetchPresets = async () => {
        try {
          const fetchedPresets = await api<Preset[]>('/api/presets');
          setPresets(fetchedPresets);
        } catch (error) {
          toast.error('Could not load meal pre-sets.');
        }
      };
      fetchPresets();
      if (meal) {
        reset({
          description: meal.description,
          type: meal.type,
          customType: meal.customType || '',
          time: format(new Date(meal.eatenAt), 'HH:mm'),
        });
      } else {
        reset({
          description: '',
          type: 'Breakfast',
          customType: '',
          time: format(new Date(), 'HH:mm'),
        });
      }
    }
  }, [meal, isOpen, reset]);
  const onSubmit = async (data: MealFormData) => {
    try {
      const [hours, minutes] = data.time.split(':').map(Number);
      const eatenAtDate = set(currentDate, { hours, minutes, seconds: 0, milliseconds: 0 });
      const payload = {
        description: data.description,
        type: data.type,
        customType: data.type === 'Other' ? data.customType : undefined,
        eatenAt: eatenAtDate.toISOString(),
      };
      if (meal) {
        const updatedMeal = await api<Meal>(`/api/meals/${meal.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        updateMeal(updatedMeal);
        toast.success('Meal updated successfully!');
      } else {
        const newMeal = await api<Meal>('/api/meals', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        addMeal(newMeal);
        toast.success('Meal added successfully!');
      }
      setIsOpen(false);
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    }
  };
  const allMealTypes = [...defaultMealTypes, ...presets.map(p => p.name), 'Other'];
  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{meal ? 'Edit Meal' : 'Log a New Meal'}</SheetTitle>
          <SheetDescription>
            Fill in the details of your meal. Click save when you're done.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-6">
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input id="description" {...register('description')} placeholder="e.g., Oatmeal with berries" />
            {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Meal Type</Label>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a meal type" />
                  </SelectTrigger>
                  <SelectContent>
                    {defaultMealTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                    {presets.map((preset) => (
                      <SelectItem key={preset.id} value={preset.name}>{preset.name}</SelectItem>
                    ))}
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          {selectedType === 'Other' && (
            <div className="space-y-2 animate-fade-in">
              <Label htmlFor="customType">Custom Meal Type</Label>
              <Input id="customType" {...register('customType')} placeholder="e.g., Brunch" />
              {errors.customType && <p className="text-sm text-destructive">{errors.customType.message}</p>}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="time">Time</Label>
            <Input id="time" type="time" {...register('time')} />
            {errors.time && <p className="text-sm text-destructive">{errors.time.message}</p>}
          </div>
          <SheetFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full bg-brand hover:bg-brand/90 text-brand-foreground">
              {isSubmitting ? 'Saving...' : 'Save Meal'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}