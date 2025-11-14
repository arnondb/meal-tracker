import React, { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
interface TimePickerProps {
  value: string; // "HH:mm"
  onChange: (value: string) => void;
}
const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const minutes = ['00', '30'];
export function TimePicker({ value, onChange }: TimePickerProps) {
  const [selectedHour, selectedMinute] = value.split(':');
  const hourRef = useRef<HTMLDivElement>(null);
  const minuteRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (hourRef.current) {
      const selectedElement = hourRef.current.querySelector<HTMLButtonElement>(`[data-hour="${selectedHour}"]`);
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    }
    if (minuteRef.current) {
      const selectedElement = minuteRef.current.querySelector<HTMLButtonElement>(`[data-minute="${selectedMinute}"]`);
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    }
  }, [selectedHour, selectedMinute]);
  const handleHourChange = (hour: string) => {
    onChange(`${hour}:${selectedMinute}`);
  };
  const handleMinuteChange = (minute: string) => {
    onChange(`${selectedHour}:${minute}`);
  };
  return (
    <div className="flex items-center justify-center gap-2 p-2 border rounded-md bg-background h-48">
      <ScrollArea className="h-full w-full rounded-md" ref={hourRef}>
        <div className="flex flex-col items-center p-1 space-y-1">
          {hours.map((hour) => (
            <Button
              key={hour}
              variant={selectedHour === hour ? 'default' : 'ghost'}
              className={cn(
                'w-full text-lg h-10',
                selectedHour === hour && 'bg-brand text-brand-foreground hover:bg-brand/90'
              )}
              onClick={() => handleHourChange(hour)}
              data-hour={hour}
            >
              {hour}
            </Button>
          ))}
        </div>
      </ScrollArea>
      <div className="text-2xl font-bold text-muted-foreground pb-2">:</div>
      <ScrollArea className="h-full w-full rounded-md" ref={minuteRef}>
        <div className="flex flex-col items-center p-1 space-y-1">
          {minutes.map((minute) => (
            <Button
              key={minute}
              variant={selectedMinute === minute ? 'default' : 'ghost'}
              className={cn(
                'w-full text-lg h-10',
                selectedMinute === minute && 'bg-brand text-brand-foreground hover:bg-brand/90'
              )}
              onClick={() => handleMinuteChange(minute)}
              data-minute={minute}
            >
              {minute}
            </Button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}