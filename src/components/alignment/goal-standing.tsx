"use client";

import React from "react";
import { Pillar, Goal, Task } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ShieldAlert, Shield, Zap, Target } from "lucide-react";
import { cn } from "@/lib/utils";

interface GoalStandingProps {
  pillars: Pillar[];
  goals: Goal[];
  tasks: Task[];
}

export function GoalStanding({ pillars, goals, tasks }: GoalStandingProps) {
  
  const calculatePillarHealth = (pillarId: string) => {
    const pillarGoals = goals.filter(g => g.pillarId === pillarId);
    if (pillarGoals.length === 0) return 0;

    const pillarTasks = tasks.filter(t => {
        if (t.goalId) {
            const goal = pillarGoals.find(g => g.id === t.goalId);
            return !!goal;
        }
        return false;
    });

    if (pillarTasks.length === 0) {
        // If goals exist but no tasks, health is 50% (potential but no action)
        return 50;
    }

    const completedTasks = pillarTasks.filter(t => t.status === 'done').length;
    return Math.round((completedTasks / pillarTasks.length) * 100);
  };

  const getStatusInfo = (health: number) => {
    if (health >= 80) return { label: "Fortified", icon: ShieldCheck, color: "text-emerald-500", bg: "bg-emerald-500/10", border: 'border-emerald-500/20' };
    if (health >= 50) return { label: "Stable", icon: Shield, color: "text-blue-500", bg: "bg-blue-500/10", border: 'border-blue-500/20' };
    if (health >= 20) return { label: "At Risk", icon: ShieldAlert, color: "text-amber-500", bg: "bg-amber-500/10", border: 'border-amber-500/20' };
    return { label: "Fragile", icon: Zap, color: "text-red-500", bg: "bg-red-500/10", border: 'border-red-500/20' };
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {pillars.map((pillar) => {
        const health = calculatePillarHealth(pillar.id);
        const status = getStatusInfo(health);
        const Icon = status.icon;

        return (
          <Card key={pillar.id} className={cn("rounded-3xl border-2 transition-all hover:shadow-xl", status.border, status.bg)}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center mb-2">
                <Badge variant="outline" className={cn("px-3 py-1 font-bold", status.color, status.border)}>
                  <Icon className="h-3 w-3 mr-1" /> {status.label}
                </Badge>
                <div className="h-2 w-2 rounded-full animate-pulse" style={{ backgroundColor: pillar.color || '#3b82f6' }} />
              </div>
              <CardTitle className="text-2xl font-black tracking-tight">{pillar.title}</CardTitle>
              <CardDescription className="line-clamp-1">{pillar.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              <div className="relative h-32 w-32 mx-auto">
                <svg className="h-full w-full" viewBox="0 0 100 100">
                  <circle
                    className="text-muted/20 stroke-current"
                    strokeWidth="10"
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                  ></circle>
                  <circle
                    className={cn("stroke-current transition-all duration-1000 ease-out", status.color)}
                    strokeWidth="10"
                    strokeDasharray={251.2}
                    strokeDashoffset={251.2 - (251.2 * health) / 100}
                    strokeLinecap="round"
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    transform="rotate(-90 50 50)"
                  ></circle>
                  <text
                    x="50"
                    y="50"
                    fontFamily="inherit"
                    fontSize="18"
                    fontWeight="800"
                    textAnchor="middle"
                    alignmentBaseline="middle"
                    className="fill-foreground"
                  >
                    {health}%
                  </text>
                </svg>
                {/* Visual Glow */}
                <div className={cn("absolute inset-0 blur-2xl opacity-20 -z-10 rounded-full", status.bg)} />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-end">
                   <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Strategic Standing</div>
                   <div className={cn("text-xs font-black", status.color)}>{health}/100</div>
                </div>
                <Progress value={health} className="h-2" />
                
                <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="bg-background/40 rounded-2xl p-2 border border-border/50">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-70">Goals</p>
                        <p className="text-lg font-black">{goals.filter(g => g.pillarId === pillar.id).length}</p>
                    </div>
                    <div className="bg-background/40 rounded-2xl p-2 border border-border/50">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-70">Velocity</p>
                        <p className="text-lg font-black flex items-center justify-center gap-1">
                            <Target className="h-3 w-3 text-primary" />
                            {goals.filter(g => g.pillarId === pillar.id && g.status === 'completed').length}
                        </p>
                    </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
