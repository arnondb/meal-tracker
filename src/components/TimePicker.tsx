import React, { useEffect, useRef, useMemo, useState } from 'react';
import { useSwipeable } from 'react-swipeable';
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
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState<HTMLElement | null>(null);
  useEffect(() => {
    if (scrollAreaRef.current) {
      const vp = scrollAreaRef.current.querySelector<HTMLElement>(':scope > div');
      if (vp) {
        setViewport(vp);
      }
    }
  }, []);
  useEffect(() => {
    if (viewport) {
      const selectedElement = viewport.querySelector<HTMLButtonElement>(`[data-time="${value}"]`);
      if (selectedElement) {
        setTimeout(() => {
          selectedElement.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }, 100);
      }
    }
  }, [value, viewport]);
  const handlers = useSwipeable({
    onSwiping: (eventData) => {
      if (viewport) {
        viewport.scrollTop -= eventData.deltaY;
      }
    },
    trackMouse: true,
    preventScrollOnSwipe: true,
  });
  return (
    <div
      {...handlers}
      className="p-2 border rounded-md bg-background h-64 w-48 cursor-grab active:cursor-grabbing touch-none"
    >
      <ScrollArea
        className="h-full w-full rounded-md pointer-events-none"
        ref={scrollAreaRef}
      >
        <div className="flex flex-col items-center p-1 space-y-1">
          {timeSlots.map((time) => (
            <Button
              key={time}
              variant={value === time ? 'default' : 'ghost'}
              className={cn(
                'w-full text-lg h-10 pointer-events-auto',
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