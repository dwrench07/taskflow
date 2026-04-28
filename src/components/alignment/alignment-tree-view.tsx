"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown, CheckCircle2, Circle, Target, Flag, LocateFixed, ExternalLink, Trash2, Pencil, Check, X, CornerDownRight } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import type { Pillar, Milestone, Task } from "@/lib/types";

interface AlignmentTreeViewProps {
  pillars: Pillar[];
  milestones: Milestone[];
  tasks: Task[];
  onDeleteMilestone?: (id: string) => void;
  onUpdateMilestone?: (milestone: Milestone) => void;
}

export function AlignmentTreeView({ pillars, milestones, tasks, onDeleteMilestone, onUpdateMilestone }: AlignmentTreeViewProps) {
  const [expandedPillars, setExpandedPillars] = useState<Set<string>>(new Set());
  const [expandedMilestones, setExpandedMilestones] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const router = useRouter();

  const togglePillar = (id: string) => {
    const next = new Set(expandedPillars);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpandedPillars(next);
  };

  const toggleMilestone = (id: string) => {
    const next = new Set(expandedMilestones);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpandedMilestones(next);
  };

  const startEdit = (m: Milestone) => {
    setEditingId(m.id);
    setEditingTitle(m.title);
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditingTitle("");
  };
  const commitEdit = (m: Milestone) => {
    const title = editingTitle.trim();
    if (title && title !== m.title && onUpdateMilestone) {
      onUpdateMilestone({ ...m, title });
    }
    cancelEdit();
  };

  // Descendant check to prevent cycles when reparenting
  const isDescendant = (candidateParentId: string, milestoneId: string): boolean => {
    if (candidateParentId === milestoneId) return true;
    const visited = new Set<string>();
    let cursor: string | undefined = candidateParentId;
    while (cursor && !visited.has(cursor)) {
      visited.add(cursor);
      const parent = milestones.find(x => x.id === cursor);
      if (!parent) return false;
      if (parent.parentMilestoneId === milestoneId) return true;
      cursor = parent.parentMilestoneId;
    }
    return false;
  };

  const childrenOf = (parentId: string) => milestones.filter(m => m.parentMilestoneId === parentId);
  const tasksFor = (milestoneId: string) => tasks.filter(t => t.milestoneId === milestoneId);

  const renderMilestone = (milestone: Milestone, depth: number) => {
    const mTasks = tasksFor(milestone.id);
    const childMilestones = childrenOf(milestone.id);
    const mExpanded = expandedMilestones.has(milestone.id);
    const completedTasks = mTasks.filter(t => t.status === "done").length;
    const progress = mTasks.length ? Math.round((completedTasks / mTasks.length) * 100) : 0;
    const isEditing = editingId === milestone.id;

    return (
      <div key={milestone.id} className="border rounded-md bg-card overflow-hidden">
        <div
          className="flex items-center justify-between p-2 cursor-pointer hover:bg-muted/50 transition-colors gap-2"
          onClick={() => !isEditing && toggleMilestone(milestone.id)}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {mExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
            {depth > 0 && <CornerDownRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />}
            <Flag className="h-4 w-4 text-blue-500 flex-shrink-0" />
            {isEditing ? (
              <Input
                autoFocus
                value={editingTitle}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => setEditingTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); commitEdit(milestone); }
                  if (e.key === "Escape") { e.preventDefault(); cancelEdit(); }
                }}
                className="h-7 text-sm"
              />
            ) : (
              <span className="font-medium text-md truncate">{milestone.title}</span>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground flex-shrink-0">
            {!isEditing && (
              <>
                <span className={milestone.status === "completed" ? "text-green-500 font-medium" : ""}>
                  {milestone.status}
                </span>
                {mTasks.length > 0 && <span>{progress}% Tasks</span>}
              </>
            )}
            {onUpdateMilestone && milestones.length > 1 && !isEditing && (
              <select
                value={milestone.parentMilestoneId || ""}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => {
                  e.stopPropagation();
                  const newParent = e.target.value || undefined;
                  if (newParent && isDescendant(newParent, milestone.id)) {
                    alert("Cannot nest a milestone under itself or its descendant.");
                    return;
                  }
                  onUpdateMilestone({ ...milestone, parentMilestoneId: newParent });
                }}
                className="h-7 rounded-md border border-input bg-background px-2 text-xs"
                title="Nest under another milestone"
              >
                <option value="">No parent</option>
                {milestones
                  .filter(other => other.id !== milestone.id && !isDescendant(other.id, milestone.id))
                  .map(other => (
                    <option key={other.id} value={other.id}>{other.title}</option>
                  ))}
              </select>
            )}
            {isEditing ? (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); commitEdit(milestone); }}
                  className="p-1.5 rounded-full hover:bg-green-500/10 hover:text-green-500 transition-colors"
                  title="Save"
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); cancelEdit(); }}
                  className="p-1.5 rounded-full hover:bg-muted transition-colors"
                  title="Cancel"
                >
                  <X className="h-4 w-4" />
                </button>
              </>
            ) : (
              onUpdateMilestone && (
                <button
                  onClick={(e) => { e.stopPropagation(); startEdit(milestone); }}
                  className="p-1.5 rounded-full hover:bg-muted hover:text-foreground transition-colors"
                  title="Rename milestone"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              )
            )}
            {onDeleteMilestone && !isEditing && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Delete milestone "${milestone.title}"? Tasks linked to it will be unlinked, and any nested milestones will be moved up.`)) {
                    onDeleteMilestone(milestone.id);
                  }
                }}
                className="p-1.5 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors"
                title="Delete milestone"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {mExpanded && (
          <div className="bg-muted/20 border-t p-2 pl-6 space-y-2">
            {childMilestones.length > 0 && (
              <div className="space-y-2">
                {childMilestones.map(child => renderMilestone(child, depth + 1))}
              </div>
            )}
            {mTasks.length === 0 && childMilestones.length === 0 ? (
              <p className="text-sm text-muted-foreground py-1">No tasks or sub-milestones yet.</p>
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
  };

  // Top-level milestones for a pillar: belongs to pillar and has no parent (or parent is not in same pillar)
  const topLevelForPillar = (pillarId: string) =>
    milestones.filter(m => m.pillarId === pillarId && (!m.parentMilestoneId || !milestones.find(p => p.id === m.parentMilestoneId)));

  const uncategorizedMilestones = milestones.filter(m => !m.pillarId && (!m.parentMilestoneId || !milestones.find(p => p.id === m.parentMilestoneId)));

  return (
    <div className="space-y-4">
      {pillars.length === 0 && milestones.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
          <p>No alignment data found. Create Pillars and Milestones to get started.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {pillars.map(pillar => {
            const pillarMilestones = topLevelForPillar(pillar.id);
            const allPillarMilestones = milestones.filter(m => m.pillarId === pillar.id);
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
                    {allPillarMilestones.length} Milestones
                  </div>
                </div>

                {isExpanded && (
                  <div className="bg-background/50 border-t p-2 pl-10 space-y-2">
                    {pillarMilestones.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-2">No milestones attached to this pillar.</p>
                    ) : (
                      pillarMilestones.map(m => renderMilestone(m, 0))
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {uncategorizedMilestones.length > 0 && (
            <div className="border rounded-md overflow-hidden bg-card mt-4">
              <div className="p-3 bg-muted/30 border-b flex items-center gap-2">
                <LocateFixed className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-medium text-muted-foreground">Uncategorized Milestones</h3>
              </div>
              <div className="p-2 space-y-2">
                {uncategorizedMilestones.map(m => renderMilestone(m, 0))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
