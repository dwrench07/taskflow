"use client";

import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

interface DateTimePickerProps {
  date?: string;
  setDate: (date: Date) => void;
  label?: string;
  triggerClassName?: string;
}

export function DateTimePicker({ date, setDate, label, triggerClassName }: DateTimePickerProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const selectedDate = date ? new Date(date) : undefined;
  const formattedDate = isMounted && date ? format(new Date(date), "PP p") : (label || "Pick a date and time");

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = e.target.value;
    if (!time) return;
    const [hours, minutes] = time.split(':').map(Number);
    const newDate = new Date(selectedDate || new Date());
    newDate.setHours(hours, minutes);
    setDate(newDate);
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal overflow-hidden",
            !date && "text-muted-foreground",
            triggerClassName
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          <span className="truncate">{formattedDate}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(d) => { if (d) setDate(d) }}
          initialFocus
        />
        <div className="p-3 border-t border-border">
          <Input
            type="time"
            onChange={handleTimeChange}
            defaultValue={selectedDate ? format(selectedDate, 'HH:mm') : ''}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
