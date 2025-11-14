import { useEffect, useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { format, parseISO, isToday } from 'date-fns';
import { Plus, Calendar as CalendarIcon } from 'lucide-react';
import { create } from 'zustand';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Toaster, toast } from '@/components/ui/sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api-client';
import { Meal } from '@shared/types';
import { MealCard } from '@/components/MealCard';
import { AddMealSheet } from '@/components/AddMealSheet';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { EmptyStateIllustration } from '@/components/EmptyStateIllustration';
type MealStore = {
  meals: Meal[];
  isLoading: boolean;
  error: string | null;
  fetchMeals: (date: Date) => Promise<void>;
  addMeal: (meal: Meal) => void;
  updateMeal: (meal: Meal) => void;
  removeMeal: (id: string) => void;
};
const useMealStore = create<MealStore>((set) => ({
  meals: [],
  isLoading: true,
  error: null,
  fetchMeals: async (date) => {
    set({ isLoading: true, error: null });
    try {
      const dateString = format(date, 'yyyy-MM-dd');
      const meals = await api<Meal[]>(`/api/meals?date=${dateString}`);
      const sortedMeals = meals.sort((a, b) => new Date(a.eatenAt).getTime() - new Date(b.eatenAt).getTime());
      set({ meals: sortedMeals, isLoading: false });
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to fetch meals';
      set({ error, isLoading: false });
      toast.error(error);
    }
  },
  addMeal: (meal) => set((state) => ({ meals: [...state.meals, meal].sort((a, b) => new Date(a.eatenAt).getTime() - new Date(b.eatenAt).getTime()) })),
  updateMeal: (meal) => set((state) => ({ meals: state.meals.map((m) => (m.id === meal.id ? meal : m)).sort((a, b) => new Date(a.eatenAt).getTime() - new Date(b.eatenAt).getTime()) })),
  removeMeal: (id) => set((state) => ({ meals: state.meals.filter((m) => m.id !== id) })),
}));
export function HomePage() {
  const [isSheetOpen, setSheetOpen] = useState(false);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [deletingMealId, setDeletingMealId] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isCalendarOpen, setCalendarOpen] = useState(false);
  const { fetchMeals, meals, isLoading, addMeal, updateMeal, removeMeal } = useMealStore();
  useEffect(() => {
    fetchMeals(currentDate);
  }, [fetchMeals, currentDate]);
  const handleAddMeal = () => {
    setEditingMeal(null);
    setSheetOpen(true);
  };
  const handleEditMeal = (meal: Meal) => {
    setEditingMeal(meal);
    setSheetOpen(true);
  };
  const handleDeleteMeal = (id: string) => {
    setDeletingMealId(id);
  };
  const confirmDelete = async () => {
    if (!deletingMealId) return;
    try {
      await api(`/api/meals/${deletingMealId}`, { method: 'DELETE' });
      removeMeal(deletingMealId);
      toast.success('Meal deleted successfully!');
    } catch (err) {
      toast.error('Failed to delete meal.');
    } finally {
      setDeletingMealId(null);
    }
  };
  const goToToday = () => {
    setCurrentDate(new Date());
  };
  const sortedMeals = useMemo(() => meals.slice().sort((a, b) => parseISO(a.eatenAt).getTime() - parseISO(b.eatenAt).getTime()), [meals]);
  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8 md:py-10 lg:py-12">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CalendarIcon className="h-6 w-6 text-muted-foreground" />
                <h2 className="text-2xl font-bold text-foreground">Meals</h2>
              </div>
              <div className="flex items-center gap-2">
                <Popover open={isCalendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[240px] justify-start text-left font-normal",
                        !currentDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(currentDate, "MMMM d, yyyy")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={currentDate}
                      onSelect={(date) => {
                        if (date) {
                          setCurrentDate(date);
                        }
                        setCalendarOpen(false);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Button variant="outline" size="sm" onClick={goToToday} disabled={isToday(currentDate)}>Today</Button>
              </div>
            </div>
            <Button onClick={handleAddMeal} className="bg-brand hover:bg-brand/90 text-brand-foreground">
              <Plus className="mr-2 h-4 w-4" /> Log a Meal
            </Button>
          </div>
          <div className="space-y-4">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)
            ) : sortedMeals.length > 0 ? (
              <AnimatePresence>
                {sortedMeals.map((meal) => (
                  <motion.div
                    key={meal.id}
                    layout
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                  >
                    <MealCard meal={meal} onEdit={handleEditMeal} onDelete={handleDeleteMeal} />
                  </motion.div>
                ))}
              </AnimatePresence>
            ) : (
              <div className="text-center py-16 px-6 border-2 border-dashed rounded-lg">
                <EmptyStateIllustration />
                <h3 className="mt-4 text-lg font-semibold text-foreground">No meals logged yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">Click "Log a Meal" to get started.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <AddMealSheet
        isOpen={isSheetOpen}
        setIsOpen={setSheetOpen}
        meal={editingMeal}
        currentDate={currentDate}
        addMeal={addMeal}
        updateMeal={updateMeal}
      />
      <AlertDialog open={!!deletingMealId} onOpenChange={(open) => !open && setDeletingMealId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this meal entry.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Toaster richColors />
    </AppLayout>
  );
}