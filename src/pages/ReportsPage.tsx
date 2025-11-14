import { useState, useEffect, useMemo, useCallback } from 'react';
import { format, subDays, parseISO } from 'date-fns';
import { Calendar as CalendarIcon, BarChart2, Search, UtensilsCrossed } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { AnimatePresence, motion } from 'framer-motion';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Toaster, toast } from '@/components/ui/sonner';
import { api } from '@/lib/api-client';
import { Meal } from '@shared/types';
import { cn } from '@/lib/utils';
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];
export function ReportsPage() {
  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });
  const [meals, setMeals] = useState<Meal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const fetchMeals = useCallback(async () => {
    if (!date?.from || !date?.to) {
      toast.warning('Please select a valid date range.');
      return;
    }
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        startDate: date.from.toISOString(),
        endDate: date.to.toISOString(),
      });
      const fetchedMeals = await api<Meal[]>(`/api/meals?${params.toString()}`);
      setMeals(fetchedMeals.sort((a, b) => new Date(b.eatenAt).getTime() - new Date(a.eatenAt).getTime()));
    } catch (error) {
      toast.error('Failed to fetch meal reports.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [date]);
  useEffect(() => {
    fetchMeals();
  }, [fetchMeals]);
  const mealTypeDistribution = useMemo(() => {
    const counts = meals.reduce((acc, meal) => {
      const type = meal.type === 'Other' ? meal.customType || 'Other' : meal.type;
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [meals]);
  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8 md:py-10 lg:py-12">
          <header className="mb-8">
            <h1 className="text-4xl font-heading font-bold tracking-tight text-foreground">Meal Reports</h1>
            <p className="mt-2 text-lg text-muted-foreground">Analyze your eating habits over time.</p>
          </header>
          <Card className="mb-8 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant={"outline"}
                    className={cn(
                      "w-full sm:w-[300px] justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date?.from ? (
                      date.to ? (
                        <>
                          {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(date.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={date?.from}
                    selected={date}
                    onSelect={setDate}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
              <Button onClick={fetchMeals} disabled={isLoading} className="w-full sm:w-auto bg-brand hover:bg-brand/90 text-brand-foreground">
                <Search className="mr-2 h-4 w-4" />
                {isLoading ? 'Searching...' : 'Search'}
              </Button>
            </div>
          </Card>
          {isLoading ? (
            <div className="grid gap-8 md:grid-cols-2">
              <Card>
                <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
                <CardContent><Skeleton className="h-64 w-full" /></CardContent>
              </Card>
              <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            </div>
          ) : meals.length > 0 ? (
            <div className="grid gap-8 md:grid-cols-5">
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart2 className="h-5 w-5 text-brand" />
                    Meal Type Distribution
                  </CardTitle>
                  <CardDescription>A breakdown of your meals by type for the selected period.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={mealTypeDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                          const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                          const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                          const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                          return (
                            <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
                              {`${(percent * 100).toFixed(0)}%`}
                            </text>
                          );
                        }}
                      >
                        {mealTypeDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <div className="md:col-span-3 space-y-4">
                <h2 className="text-2xl font-bold">Meal Log ({meals.length})</h2>
                <div className="max-h-[600px] overflow-y-auto pr-2 space-y-4">
                  <AnimatePresence>
                    {meals.map((meal) => (
                       <motion.div
                        key={meal.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                      >
                        <Card>
                          <CardContent className="p-4 flex justify-between items-center">
                            <div>
                              <p className="font-semibold">{meal.description}</p>
                              <p className="text-sm text-muted-foreground">
                                {meal.type === 'Other' ? meal.customType : meal.type}
                              </p>
                            </div>
                            <div className="text-right text-sm text-muted-foreground">
                              <p>{format(parseISO(meal.eatenAt), 'MMM d, yyyy')}</p>
                              <p>{format(parseISO(meal.eatenAt), 'h:mm a')}</p>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 px-6 border-2 border-dashed rounded-lg">
              <UtensilsCrossed className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold text-foreground">No meals found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                No meals were logged in the selected date range. Try expanding your search.
              </p>
            </div>
          )}
        </div>
      </div>
      <Toaster richColors />
    </AppLayout>
  );
}