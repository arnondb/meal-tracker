import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, set } from 'date-fns';
import { toast } from 'sonner';
import { Clock } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { api } from '@/lib/api-client';
import { Meal, Preset } from '@shared/types';
import { TimePicker } from './TimePicker';
import { cn } from '@/lib/utils';
const mealSchema = z.object({
  description: z.string(),
  type: z.string().min(1, 'Meal type is required'),
  customType: z.string().optional(),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)'),
}).refine(data => data.type !== 'Other' || (data.customType && data.customType.length > 0), {
  message: 'Custom type is required when "Other" is selected',
  path: ['customType'],
});
type MealFormData = z.infer<typeof mealSchema>;
interface AddMealSheetProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  meal: Meal | null;
  currentDate: Date;
  addMeal: (meal: Meal) => void;
  updateMeal: (meal: Meal) => void;
}
export function AddMealSheet({ isOpen, setIsOpen, meal, currentDate, addMeal, updateMeal }: AddMealSheetProps) {
  const [presets, setPresets] = useState<Preset[]>([]);
  const { register, handleSubmit, control, watch, reset, formState: { errors, isSubmitting } } = useForm<MealFormData>({
    resolver: zodResolver(mealSchema),
  });
  const selectedType = watch('type');
  useEffect(() => {
    if (isOpen) {
      const fetchPresetsAndResetForm = async () => {
        try {
          const fetchedPresets = await api<Preset[]>('/api/presets');
          setPresets(fetchedPresets);
          if (meal) {
            reset({
              description: meal.description,
              type: meal.type,
              customType: meal.customType || '',
              time: format(new Date(meal.eatenAt), 'HH:mm'),
            });
          } else {
            const now = new Date();
            const currentMinutes = now.getMinutes();
            const roundedMinutes = currentMinutes < 30 ? '00' : '30';
            const initialTime = `${format(now, 'HH')}:${roundedMinutes}`;
            reset({
              description: '',
              type: fetchedPresets.length > 0 ? fetchedPresets[0].name : 'Other',
              customType: '',
              time: initialTime,
            });
          }
        } catch (error) {
          toast.error('Could not load meal pre-sets.');
          if (!meal) {
            const now = new Date();
            const currentMinutes = now.getMinutes();
            const roundedMinutes = currentMinutes < 30 ? '00' : '30';
            const initialTime = `${format(now, 'HH')}:${roundedMinutes}`;
            reset({
              description: '',
              type: 'Other',
              customType: '',
              time: initialTime,
            });
          }
        }
      };
      fetchPresetsAndResetForm();
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
        toast.success('Meal updated successfully!', { duration: 1500 });
      } else {
        const newMeal = await api<Meal>('/api/meals', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        addMeal(newMeal);
        toast.success('Meal added successfully!', { duration: 1500 });
      }
      setIsOpen(false);
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    }
  };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  };
  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>{meal ? 'Edit Meal' : 'Log a New Meal'}</SheetTitle>
          <SheetDescription>
            {meal ? 'Editing meal for ' : 'Logging a meal for '}
            <span className="font-semibold text-foreground">{format(currentDate, 'MMMM d, yyyy')}</span>.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col justify-between space-y-6 py-6">
          <div className="space-y-6 px-1 overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input id="description" {...register('description')} placeholder="e.g., Oatmeal with berries" onKeyDown={handleKeyDown} />
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
                <Input id="customType" {...register('customType')} placeholder="e.g., Brunch" onKeyDown={handleKeyDown} />
                {errors.customType && <p className="text-sm text-destructive">{errors.customType.message}</p>}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <Controller
                name="time"
                control={control}
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        <Clock className="mr-2 h-4 w-4" />
                        {field.value ? field.value : <span>Pick a time</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <TimePicker value={field.value} onChange={field.onChange} />
                    </PopoverContent>
                  </Popover>
                )}
              />
              {errors.time && <p className="text-sm text-destructive">{errors.time.message}</p>}
            </div>
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