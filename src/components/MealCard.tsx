import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { Pencil, Trash2, Utensils, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Meal } from '@shared/types';
import { Badge } from '@/components/ui/badge';
interface MealCardProps {
  meal: Meal;
  onEdit: (meal: Meal) => void;
  onDelete: (id: string) => void;
}
export function MealCard({ meal, onEdit, onDelete }: MealCardProps) {
  const mealTitle = meal.type === 'Other' ? meal.customType || 'Other' : meal.type;
  return (
    <motion.div
      whileHover={{ y: -5, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-muted/50">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Utensils className="h-5 w-5 text-brand" />
            <span>{meal.description || mealTitle}</span>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(meal)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => onDelete(meal.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-4 flex justify-between items-center">
          <Badge variant="outline" className="text-sm">{mealTitle}</Badge>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{format(parseISO(meal.eatenAt), 'h:mm a')}</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}