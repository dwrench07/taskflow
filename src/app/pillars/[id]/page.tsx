"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Edit, Plus, Trash2, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getPillarById, getAllMilestones, getAllTasks } from "@/lib/data";
import type { Pillar, Milestone, Task } from "@/lib/types";

export default function PillarDashboardPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  const [pillar, setPillar] = useState<Pillar | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      setIsLoading(true);
      try {
        const [fetchedPillar, allMilestones, allTasks] = await Promise.all([
          getPillarById(id),
          getAllMilestones(),
          getAllTasks()
        ]);

        if (!fetchedPillar) {
          router.push('/alignment');
          return;
        }

        setPillar(fetchedPillar);

        const pillarMilestones = allMilestones.filter(m => m.pillarId === id);
        setMilestones(pillarMilestones);

        const milestoneIds = new Set(pillarMilestones.map(m => m.id));
        const relevantTasks = allTasks.filter(t => t.milestoneId && milestoneIds.has(t.milestoneId));
        setTasks(relevantTasks);
      } catch (error) {
        console.error("Failed to load pillar data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [id, router]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl space-y-8 animate-pulse">
        <div className="h-8 w-32 bg-secondary rounded-md" />
        <div className="h-32 w-full bg-secondary rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-48 bg-secondary rounded-xl" />
          <div className="h-48 bg-secondary rounded-xl" />
        </div>
      </div>
    );
  }

  if (!pillar) return null;

  const totalTasks = tasks.length;
  // Currently "done" is the only resolved status type available
  const completedTasks = tasks.filter(t => t.status === "done").length; 
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl space-y-8">
      <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground pl-0" onClick={() => router.push('/alignment')}>
        <ArrowLeft className="h-4 w-4" /> Back to Alignment
      </Button>

      {/* Header Profile */}
      <Card className="overflow-hidden border-none shadow-md" style={{ borderTop: `4px solid ${pillar.color || 'hsl(var(--primary))'}` }}>
        <CardContent className="p-8 flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-3">
              <div 
                className="w-12 h-12 flex items-center justify-center rounded-xl text-white shadow-sm"
                style={{ backgroundColor: pillar.color || 'hsl(var(--primary))' }}
              >
                <Map className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{pillar.title}</h1>
                <p className="text-muted-foreground mt-1">Strategic Pillar</p>
              </div>
            </div>
            {pillar.description && (
              <p className="text-lg leading-relaxed text-foreground/80 max-w-3xl">
                {pillar.description}
              </p>
            )}
          </div>

          <div className="bg-secondary/30 rounded-xl p-5 border border-white/5 min-w-[200px] flex flex-col justify-center">
            <div className="flex justify-between items-end mb-2">
              <span className="text-sm font-medium text-muted-foreground">Overall Velocity</span>
              <span className="text-2xl font-bold">{progressPercent}%</span>
            </div>
            <Progress value={progressPercent} className="h-2.5" />
            <div className="text-xs text-muted-foreground mt-3 text-right">
              {completedTasks} of {totalTasks} aligned tasks complete
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Milestones */}
        <div className="lg:col-span-1 border rounded-xl bg-background/50 flex flex-col overflow-hidden">
          <div className="p-4 border-b bg-card/50 flex justify-between items-center">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Badge variant="outline" className="px-1.5 py-0">{milestones.length}</Badge>
              Milestones
            </h3>
          </div>
          <div className="p-4 space-y-4 flex-1 overflow-y-auto max-h-[500px]">
            {milestones.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8 italic">No milestones map to this pillar yet.</p>
            ) : (
              milestones.map(m => {
                const mTasks = tasks.filter(t => t.milestoneId === m.id);
                const completeCount = mTasks.filter(t => t.status === "done").length;
                const mProgress = mTasks.length > 0 ? Math.round((completeCount / mTasks.length) * 100) : 0;

                return (
                  <Card key={m.id} className="border border-white/5 hover:border-primary/20 transition-colors">
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-foreground/90">{m.title}</h4>
                      {m.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{m.description}</p>}
                      <div className="mt-4 flex items-center gap-3">
                        <Progress value={mProgress} className="flex-1 h-1.5" />
                        <span className="text-xs font-medium text-muted-foreground min-w-[32px]">{mProgress}%</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Rolled Up Tasks */}
        <div className="lg:col-span-2 border rounded-xl bg-background/50 flex flex-col overflow-hidden">
          <div className="p-4 border-b bg-card/50 flex justify-between items-center">
            <h3 className="font-semibold text-lg">Aligned Tasks</h3>
            <Button size="sm" variant="outline" onClick={() => router.push('/tasks')}>
              Manage Tasks
            </Button>
          </div>
          <div className="flex-1 p-0 overflow-hidden flex flex-col bg-card/30">
            {tasks.length === 0 ? (
               <div className="p-10 text-center text-muted-foreground">
                 <p className="mb-4">You have no tasks linked through milestones.</p>
                 <Button variant="outline" onClick={() => router.push('/tasks')}>Go create tasks</Button>
               </div>
            ) : (
              <div className="divide-y divide-white/5 overflow-y-auto max-h-[500px]">
                {tasks.map(t => (
                  <div key={t.id} className="p-4 hover:bg-white/5 transition-colors flex items-start gap-3">
                    <div className="mt-1">
                      <Badge variant="outline" className={
                        t.status === 'done' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                        t.status === 'in-progress' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                        'bg-zinc-500/10 text-zinc-500 border-zinc-500/20'
                      }>
                        {t.status.toUpperCase()}
                      </Badge>
                    </div>
                    <div>
                      <h5 className="font-medium text-foreground">{t.title}</h5>
                      {t.milestoneId && (
                        <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1.5">
                          Milestone: <span className="font-medium">{milestones.find(m => m.id === t.milestoneId)?.title || "Unknown"}</span>
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
