import React, { useEffect, useRef, useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
interface TimePickerProps {
  value: string; // "HH:mm"
  onChange: (value: string) => void;
}
export function TimePicker({ value, onChange }: TimePickerProps) {
  const timeSlots = useMemo(() => {
    const slots: string[] = [];
    for (let i = 0; i < 24; i++) {
      const hour = i.toString().padStart(2, '0');
      slots.push(`${hour}:00`);
      slots.push(`${hour}:30`);
    }
    return slots;
  }, []);
  const timePickerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (timePickerRef.current) {
      const selectedElement = timePickerRef.current.querySelector<HTMLButtonElement>(`[data-time="${value}"]`);
      if (selectedElement) {
        // Use a timeout to ensure the element is rendered before scrolling
        setTimeout(() => {
          selectedElement.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }, 100);
      }
    }
  }, [value]);
  return (
    <div className="p-2 border rounded-md bg-background h-64 w-48">
      <ScrollArea className="h-full w-full rounded-md" ref={timePickerRef}>
        <div className="flex flex-col items-center p-1 space-y-1">
          {timeSlots.map((time) => (
            <Button
              key={time}
              variant={value === time ? 'default' : 'ghost'}
              className={cn(
                'w-full text-lg h-10',
                value === time && 'bg-brand text-brand-foreground hover:bg-brand/90'
              )}
              onClick={() => onChange(time)}
              data-time={time}
            >
              {time}
            </Button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}