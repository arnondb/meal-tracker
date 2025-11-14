import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { format, subDays, parseISO } from 'date-fns';
import { Calendar as CalendarIcon, BarChart2, Search, Download } from 'lucide-react';
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
import { exportToCsv } from '@/lib/csv-exporter';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmptyStateIllustration } from '@/components/EmptyStateIllustration';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];
export function ReportsPage() {
  const { t } = useTranslation();
  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });
  const [meals, setMeals] = useState<Meal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  const fetchMeals = useCallback(async () => {
    if (!date?.from || !date?.to) {
      toast.warning(t('toasts.dateRangeWarning'));
      return;
    }
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        startDate: date.from.toISOString(),
        endDate: date.to.toISOString(),
      });
      const fetchedMeals = await api<Meal[]>(`/api/meals?${params.toString()}`);
      setMeals(fetchedMeals);
    } catch (error) {
      toast.error(t('toasts.fetchReportsError'));
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [date, t]);
  useEffect(() => {
    fetchMeals();
  }, [fetchMeals]);
  const sortedMeals = useMemo(() => {
    return [...meals].sort((a, b) => {
      const dateA = parseISO(a.eatenAt).getTime();
      const dateB = parseISO(b.eatenAt).getTime();
      return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
    });
  }, [meals, sortBy]);
  const mealTypeDistribution = useMemo(() => {
    const counts = meals.reduce((acc, meal) => {
      const type = meal.type === 'Other' ? meal.customType || t('common.other') : meal.type;
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [meals, t]);
  const handleExport = () => {
    if (!date?.from || !date?.to) {
      toast.warning(t('toasts.exportNoDateWarning'));
      return;
    }
    const fromDate = format(date.from, 'yyyy-MM-dd');
    const toDate = format(date.to, 'yyyy-MM-dd');
    const filename = `ChronoPlate_Report_${fromDate}_to_${toDate}.csv`;
    exportToCsv(sortedMeals, filename);
  };
  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8 md:py-10 lg:py-12">
          <header className="mb-8">
            <h1 className="text-4xl font-heading font-bold tracking-tight text-foreground">{t('reports.title')}</h1>
            <p className="mt-2 text-lg text-muted-foreground">{t('reports.description')}</p>
          </header>
          <Card className="mb-8 p-4 sm:p-6">
            <div className="flex flex-wrap items-center gap-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant={"outline"}
                    className={cn(
                      "w-full sm:w-auto md:w-[300px] justify-start text-left font-normal",
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
                      <span>{t('reports.datePickerPlaceholder')}</span>
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
                {isLoading ? t('reports.searching') : t('reports.search')}
              </Button>
              <div className="w-full sm:w-auto sm:ml-auto flex flex-col sm:flex-row gap-4">
                <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'newest' | 'oldest')}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder={t('reports.sortBy')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">{t('reports.newestFirst')}</SelectItem>
                    <SelectItem value="oldest">{t('reports.oldestFirst')}</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleExport} disabled={isLoading || meals.length === 0} variant="outline" className="w-full sm:w-auto">
                  <Download className="mr-2 h-4 w-4" />
                  {t('reports.exportCsv')}
                </Button>
              </div>
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
                    {t('reports.distributionTitle')}
                  </CardTitle>
                  <CardDescription>{t('reports.distributionDescription')}</CardDescription>
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
                <h2 className="text-2xl font-bold">{t('reports.mealLogTitle', { count: sortedMeals.length })}</h2>
                <div className="max-h-[600px] overflow-y-auto pr-2 space-y-4">
                  <AnimatePresence>
                    {sortedMeals.map((meal) => (
                       <motion.div
                        key={meal.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                      >
                        <Card>
                          <CardContent className="p-4 flex justify-between items-start">
                            <div className="flex-1 space-y-2">
                              <div>
                                <p className="font-semibold">{meal.description || (meal.type === 'Other' ? meal.customType : meal.type)}</p>
                                <p className="text-sm text-muted-foreground">
                                  {meal.type === 'Other' ? meal.customType : meal.type}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={`https://api.dicebear.com/8.x/initials/svg?seed=${meal.userName}`} />
                                  <AvatarFallback>{meal.userName.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <span className="text-xs font-medium text-muted-foreground">{meal.userName}</span>
                              </div>
                            </div>
                            <div className="text-right text-sm text-muted-foreground flex-shrink-0 ml-4">
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
              <EmptyStateIllustration />
              <h3 className="mt-4 text-lg font-semibold text-foreground">{t('reports.emptyTitle')}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {t('reports.emptyDescription')}
              </p>
            </div>
          )}
        </div>
      </div>
      <Toaster richColors />
    </AppLayout>
  );
}