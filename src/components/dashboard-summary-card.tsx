"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { LucideIcon, TrendingDown, TrendingUp } from "lucide-react";
import { ReactNode } from "react";

interface SummaryCardProps {
  icon: LucideIcon;
  title: string;
  value: string | number;
  subtitle: string;
  color?: string;
  children: ReactNode;
  className?: string;
  trend?: {
    value: number;
    isGood?: boolean; // If true, positive is green, negative is red. If false, reverse (e.g. for distractions).
  };
}

export function SummaryCard({
  icon: Icon,
  title,
  value,
  subtitle,
  color = "text-primary",
  children,
  className,
  trend
}: SummaryCardProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Card className={cn(
          "cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md active:scale-[0.98] border-border/50 bg-card/50 backdrop-blur-sm relative overflow-hidden",
          className
        )}>
          <CardContent className="p-4 flex flex-col items-center text-center gap-1">
            <div className={cn("p-2 rounded-full bg-muted/50 mb-1", color)}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex items-baseline gap-1.5 justify-center w-full">
                <span className="text-2xl font-bold tracking-tight text-foreground">{value}</span>
                {trend && trend.value !== 0 && (
                    <div className={cn(
                        "text-[10px] font-bold flex items-center h-4 px-1 rounded-sm gap-0.5",
                        (trend.value > 0 === trend.isGood) ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"
                    )}>
                        {trend.value > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {Math.abs(trend.value)}
                    </div>
                )}
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</span>
            <span className="text-[10px] text-muted-foreground/70 truncate w-full">{subtitle}</span>
          </CardContent>
        </Card>
      </PopoverTrigger>
      <PopoverContent className="w-[calc(100vw-2rem)] sm:w-96 p-0 overflow-hidden shadow-2xl border-primary/20" align="start" side="bottom" sideOffset={8}>
        <div className="bg-primary/5 p-3 border-b border-primary/10 flex items-center gap-2">
            <Icon className={cn("w-4 h-4", color)} />
            <h4 className="font-bold text-sm tracking-tight">{title} Details</h4>
        </div>
        <div className="max-h-[70vh] overflow-y-auto">
          {children}
        </div>
      </PopoverContent>
    </Popover>
  );
}
