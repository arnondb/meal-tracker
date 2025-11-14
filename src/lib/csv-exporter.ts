import { format, parseISO } from 'date-fns';
import { Meal } from '@shared/types';
export function exportToCsv(meals: Meal[], filename: string) {
  if (!meals || meals.length === 0) {
    console.warn('No data to export.');
    return;
  }
  const headers = ['Date', 'Time', 'User Name', 'Type', 'Custom Type', 'Description'];
  const rows = meals.map(meal => {
    const eatenAt = parseISO(meal.eatenAt);
    const date = format(eatenAt, 'yyyy-MM-dd');
    const time = format(eatenAt, 'HH:mm');
    const userName = meal.userName;
    const type = meal.type === 'Other' ? 'Other' : meal.type;
    const customType = meal.customType || '';
    // Escape commas in description by quoting the field and doubling internal quotes
    const description = `"${(meal.description || '').replace(/"/g, '""')}"`;
    return [date, time, userName, type, customType, description].join(',');
  });
  const csvContent = [
    headers.join(','),
    ...rows
  ].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}