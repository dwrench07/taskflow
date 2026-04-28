"use client";

import { Info } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

interface WidgetInfoProps {
  description: string;
}

/**
 * A small ⓘ button that, when clicked, shows a popover explaining what the widget does.
 * Use alongside a dashboard widget title.
 */
export function WidgetInfo({ description }: WidgetInfoProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-full p-0.5 text-muted-foreground hover:text-muted-foreground hover:bg-muted/50 transition-colors duration-200 focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          aria-label="Widget information"
        >
          <Info className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        className="w-64 p-3 text-xs leading-relaxed text-muted-foreground"
      >
        {description}
      </PopoverContent>
    </Popover>
  );
}
