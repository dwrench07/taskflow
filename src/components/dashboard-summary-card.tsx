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
  // Removed getGlowColor in favor of static border-border for solid form UI

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Card className={cn(
          "group cursor-pointer transition-all duration-300 hover:translate-y-[-2px]",
          "bg-card border-border shadow-sm relative overflow-hidden",
          className
        )}>

          <CardContent className="p-3 flex flex-col items-center text-center gap-2 relative z-10">
            <div className={cn(
                "p-2 rounded-2xl transition-all duration-500 group-hover:scale-110",
                "bg-muted/50 border border-border/50",
                color
            )}>
              <Icon className="w-5 h-5" />
            </div>
            
            <div className="flex flex-col items-center gap-0.5 mt-1">
                <div className="flex items-center gap-2">
                    <span className="text-2xl font-black tracking-tighter text-foreground group-hover:scale-105 transition-transform duration-500">{value}</span>
                    {trend && trend.value !== 0 && (
                        <div className={cn(
                            "text-[11px] font-bold flex items-center h-4 px-1.5 rounded-full gap-0.5",
                            (trend.value > 0 === trend.isGood) ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                        )}>
                            {trend.value > 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                            {Math.abs(trend.value)}
                        </div>
                    )}
                </div>
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/80">{title}</span>
            </div>
            
            <span className="text-[11px] text-muted-foreground/50 font-medium truncate w-full">{subtitle}</span>
          </CardContent>
        </Card>
      </PopoverTrigger>
      <PopoverContent className="w-[calc(100vw-2rem)] sm:w-96 p-0 overflow-hidden shadow-xl border-border bg-popover animate-in fade-in zoom-in-95 duration-300" align="center" side="bottom" sideOffset={12} collisionPadding={16}>
        <div className="bg-muted/50 p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg bg-muted", color)}>
                    <Icon className="w-4 h-4" />
                </div>
                <h4 className="font-black text-xs uppercase tracking-widest">{title} Analysis</h4>
            </div>
            <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
        </div>
        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-1">
          {children}
        </div>
      </PopoverContent>
    </Popover>
  );
}
