"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown, CheckCircle2, Circle, Target, Flag, LocateFixed, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Pillar, Milestone, Task } from "@/lib/types";

interface AlignmentTreeViewProps {
  pillars: Pillar[];
  milestones: Milestone[];
  tasks: Task[];
}

export function AlignmentTreeView({ pillars, milestones, tasks }: AlignmentTreeViewProps) {
  const [expandedPillars, setExpandedPillars] = useState<Set<string>>(new Set());
  const [expandedMilestones, setExpandedMilestones] = useState<Set<string>>(new Set());
  const router = useRouter();

  const togglePillar = (id: string) => {
    const newExpanded = new Set(expandedPillars);
    if (newExpanded.has(id)) newExpanded.delete(id);
    else newExpanded.add(id);
    setExpandedPillars(newExpanded);
  };

  const toggleMilestone = (id: string) => {
    const newExpanded = new Set(expandedMilestones);
    if (newExpanded.has(id)) newExpanded.delete(id);
    else newExpanded.add(id);
    setExpandedMilestones(newExpanded);
  };

  // Group milestones by pillarId
  const getMilestonesForPillar = (pillarId: string) => 
    milestones.filter(m => m.pillarId === pillarId);

  // Group tasks by milestoneId
  const getTasksForMilestone = (milestoneId: string) =>
    tasks.filter(t => t.milestoneId === milestoneId);

  // Uncategorized stuff
  const uncategorizedMilestones = milestones.filter(m => !m.pillarId);
  const uncategorizedTasks = tasks.filter(t => !t.milestoneId && t.status !== "done");

  return (
    <div className="space-y-4">
      {pillars.length === 0 && milestones.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
          <p>No alignment data found. Create Pillars and Milestones to get started.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {pillars.map(pillar => {
            const pillarMilestones = getMilestonesForPillar(pillar.id);
            const isExpanded = expandedPillars.has(pillar.id);
            
            return (
              <div key={pillar.id} className="border rounded-md overflow-hidden bg-card">
                <div 
                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => togglePillar(pillar.id)}
                  style={{ borderLeft: `4px solid ${pillar.color || '#primary'}` }}
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? <ChevronDown className="h-5 w-5 text-muted-foreground" /> : <ChevronRight className="h-5 w-5 text-muted-foreground" />}
                    <div className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-primary" style={{ color: pillar.color }} />
                      <h3 className="font-semibold text-lg">{pillar.title}</h3>
                      <button 
                        onClick={(e) => { e.stopPropagation(); router.push(`/pillars/${pillar.id}`); }}
                        className="ml-2 p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        title="View Pillar Dashboard"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {pillarMilestones.length} Milestones
                  </div>
                </div>

                {isExpanded && (
                  <div className="bg-background/50 border-t p-2 pl-10 space-y-2">
                    {pillarMilestones.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-2">No milestones attached to this pillar.</p>
                    ) : (
                      pillarMilestones.map(milestone => {
                        const mTasks = getTasksForMilestone(milestone.id);
                        const mExpanded = expandedMilestones.has(milestone.id);
                        const completedTasks = mTasks.filter(t => t.status === "done").length;
                        const progress = mTasks.length ? Math.round((completedTasks / mTasks.length) * 100) : 0;

                        return (
                          <div key={milestone.id} className="border rounded-md bg-card overflow-hidden">
                            <div 
                              className="flex items-center justify-between p-2 cursor-pointer hover:bg-muted/50 transition-colors"
                              onClick={() => toggleMilestone(milestone.id)}
                            >
                              <div className="flex items-center gap-2">
                                {mExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                                <div className="flex items-center gap-2">
                                  <Flag className="h-4 w-4 text-blue-500" />
                                  <span className="font-medium text-md">{milestone.title}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className={milestone.status === "completed" ? "text-green-500 font-medium" : ""}>
                                  {milestone.status}
                                </span>
                                {mTasks.length > 0 && <span>{progress}% Tasks</span>}
                              </div>
                            </div>

                            {mExpanded && (
                              <div className="bg-muted/20 border-t p-2 pl-8 space-y-1">
                                {mTasks.length === 0 ? (
                                  <p className="text-sm text-muted-foreground py-1">No tasks attached to this milestone.</p>
                                ) : (
                                  mTasks.map(task => (
                                    <div key={task.id} className="flex items-center gap-3 p-2 hover:bg-background/80 rounded-md border border-transparent hover:border-border transition-colors">
                                      {task.status === "done" ? (
                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                      ) : (
                                        <Circle className="h-4 w-4 text-muted-foreground" />
                                      )}
                                      <Link href={`/focus?taskId=${task.id}`} className={`text-sm hover:text-primary transition-colors ${task.status === "done" ? "line-through text-muted-foreground" : "text-foreground"}`}>
                                        {task.title}
                                      </Link>
                                      {task.blockedBy && task.blockedBy.length > 0 && task.status !== "done" && (
                                        <span className="text-xs bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full outline outline-1 outline-red-500/20">Blocked</span>
                                      )}
                                    </div>
                                  ))
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Render uncategorized milestones */}
          {uncategorizedMilestones.length > 0 && (
             <div className="border rounded-md overflow-hidden bg-card mt-4">
               <div className="p-3 bg-muted/30 border-b flex items-center gap-2">
                 <LocateFixed className="h-5 w-5 text-muted-foreground" />
                 <h3 className="font-medium text-muted-foreground">Uncategorized Milestones</h3>
               </div>
               <div className="p-2 space-y-2">
                {uncategorizedMilestones.map(milestone => {
                  const mTasks = getTasksForMilestone(milestone.id);
                  const mExpanded = expandedMilestones.has(milestone.id);
                  
                  return (
                    // Same milestone render block as above
                    <div key={milestone.id} className="border rounded-md bg-card overflow-hidden">
                       <div 
                         className="flex items-center justify-between p-2 cursor-pointer hover:bg-muted/50 transition-colors"
                         onClick={() => toggleMilestone(milestone.id)}
                       >
                         <div className="flex items-center gap-2">
                           {mExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                           <div className="flex items-center gap-2">
                             <Flag className="h-4 w-4 text-blue-500" />
                             <span className="font-medium text-md">{milestone.title}</span>
                           </div>
                         </div>
                       </div>
                       {mExpanded && (
                         <div className="bg-muted/20 border-t p-2 pl-8 space-y-1">
                           {mTasks.map(task => (
                             <div key={task.id} className="flex items-center gap-3 p-2 text-sm">
                               <Link href={`/focus?taskId=${task.id}`} className="hover:text-primary transition-colors">{task.title}</Link>
                             </div>
                           ))}
                         </div>
                       )}
                    </div>
                  );
                })}
               </div>
             </div>
          )}
        </div>
      )}
    </div>
  );
}
