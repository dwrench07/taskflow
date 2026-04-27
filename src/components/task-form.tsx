"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import React, { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { type Task, type Goal, type Project } from "@/lib/types";
import { TagInput } from "./tag-input";
import { getAllGoals, getAllMilestones, getAllTasks, getAllProjects } from "@/lib/data";
import { type Milestone } from "@/lib/types";
import { DateTimePicker } from "./date-time-picker";
import { Separator } from "@/components/ui/separator";

const formSchema = z.object({
  title: z.string().min(2, { message: "Title must be at least 2 characters." }),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  category: z.enum(["project-work", "chore", "habit"]),
  recurrence: z.enum(["once", "daily", "weekly", "monthly", "custom"]),
  intervalDays: z.coerce.number().optional().nullable(),
  projectId: z.string().optional().nullable(),
  energyLevel: z.enum(["high", "medium", "low"]).optional().nullable(),
  tags: z.array(z.string()).optional(),
  goalId: z.string().optional().nullable(),
  milestoneId: z.string().optional().nullable(),
  blockedBy: z.array(z.string()).optional(),
  blocks: z.array(z.string()).optional(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  doDate: z.string().optional().nullable(),
  tShirtSize: z.enum(["S", "M", "L", "XL"]).optional().nullable(),
  timeLimit: z.coerce.number().optional().nullable(),
  isFrog: z.boolean().optional(),
});

export type TaskFormValues = z.infer<typeof formSchema>;
type FormValues = TaskFormValues;

interface TaskFormProps {
  task?: Task;
  allTags: string[];
  onSubmit: (data: FormValues) => Promise<void> | void;
}

export function TaskForm({ task, allTags, onSubmit }: TaskFormProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [allExistingTasks, setAllExistingTasks] = useState<Task[]>([]);

  useEffect(() => {
    Promise.all([
      getAllGoals(),
      getAllMilestones(),
      getAllTasks(),
      getAllProjects(),
    ]).then(([fetchedGoals, fetchedMilestones, fetchedTasks, fetchedProjects]) => {
      setGoals(fetchedGoals);
      setMilestones(fetchedMilestones);
      setAllExistingTasks(fetchedTasks.filter(t => t.id !== task?.id));
      setProjects(fetchedProjects);
    }).catch(console.error);
  }, [task?.id]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: task?.title || "",
      description: task?.description || "",
      priority: task?.priority || "medium",
      category: task?.category || (task?.isHabit ? "habit" : "project-work"),
      recurrence: task?.recurrence || (task?.isHabit ? (task?.habitFrequency ?? "daily") : "once"),
      intervalDays: task?.intervalDays || null,
      projectId: task?.projectId || null,
      tags: task?.tags || [],
      goalId: task?.goalId || null,
      milestoneId: task?.milestoneId || null,
      energyLevel: task?.energyLevel || null,
      blockedBy: task?.blockedBy || [],
      blocks: task?.blocks || [],
      startDate: task?.startDate || null,
      endDate: task?.endDate || null,
      doDate: task?.doDate || null,
      tShirtSize: task?.tShirtSize || null,
      timeLimit: task?.timeLimit || null,
      isFrog: task?.isFrog || false,
    },
  });

  const recurrence = form.watch("recurrence");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Content Column */}
          <div className="md:col-span-2 space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Design new homepage" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g. Create mockups and prototype..."
                      className="min-h-[120px] resize-none"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <FormControl>
                    <TagInput
                      tags={field.value || []}
                      allTags={allTags}
                      onUpdateTags={async (tags) => form.setValue('tags', tags)}
                      placeholder="Add or select tags..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="blockedBy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Blocked By</FormLabel>
                    <FormControl>
                      <div className="border rounded-md p-2 max-h-32 overflow-y-auto space-y-1 bg-muted/20">
                        {allExistingTasks.length === 0 && <p className="text-[10px] text-muted-foreground p-1">No tasks.</p>}
                        {allExistingTasks.map(t => (
                          <label key={`blockedBy-${t.id}`} className="flex items-center space-x-2 text-xs">
                            <input
                              type="checkbox"
                              checked={field.value?.includes(t.id)}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                const current = field.value || [];
                                field.onChange(checked ? [...current, t.id] : current.filter(id => id !== t.id));
                              }}
                              className="h-3 w-3 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <span className="truncate">{t.title}</span>
                          </label>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="blocks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Blocks</FormLabel>
                    <FormControl>
                      <div className="border rounded-md p-2 max-h-32 overflow-y-auto space-y-1 bg-muted/20">
                        {allExistingTasks.length === 0 && <p className="text-[10px] text-muted-foreground p-1">No tasks.</p>}
                        {allExistingTasks.map(t => (
                          <label key={`blocks-${t.id}`} className="flex items-center space-x-2 text-xs">
                            <input
                              type="checkbox"
                              checked={field.value?.includes(t.id)}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                const current = field.value || [];
                                field.onChange(checked ? [...current, t.id] : current.filter(id => id !== t.id));
                              }}
                              className="h-3 w-3 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <span className="truncate">{t.title}</span>
                          </label>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Sidebar Meta Column */}
          <div className="space-y-4 bg-muted/30 p-4 rounded-xl border border-white/5">
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="project-work">Project work</SelectItem>
                        <SelectItem value="chore">Chore</SelectItem>
                        <SelectItem value="habit">Habit</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="recurrence"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Repeats</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Repeats" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="once">Once</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {recurrence === "custom" && (
              <FormField
                control={form.control}
                name="intervalDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Every (days)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        placeholder="e.g. 14"
                        className="h-8 text-xs"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value, 10) : null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Priority</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tShirtSize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Estimate</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || "none"}>
                      <FormControl>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Size" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">n/a</SelectItem>
                        <SelectItem value="S">S - 30m</SelectItem>
                        <SelectItem value="M">M - 2h</SelectItem>
                        <SelectItem value="L">L - 4h</SelectItem>
                        <SelectItem value="XL">XL - 1d+</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="isFrog"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border bg-background/50 p-2 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel className="text-xs flex items-center gap-1">Eat the Frog 🐸</FormLabel>
                  </div>
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <FormField
                control={form.control}
                name="energyLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Energy</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || "none"}>
                      <FormControl>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Energy" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">n/a</SelectItem>
                        <SelectItem value="high">Deep Work</SelectItem>
                        <SelectItem value="medium">Standard</SelectItem>
                        <SelectItem value="low">Low Brain</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="timeLimit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Timebox (m)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="25"
                        className="h-8 text-xs"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator className="bg-white/5" />

            <div className="space-y-3">
              <FormField
                control={form.control}
                name="projectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-muted-foreground">Project</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || "none"}>
                      <FormControl>
                        <SelectTrigger className="h-8 text-xs italic bg-transparent">
                          <SelectValue placeholder="Standalone" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Standalone (no project)</SelectItem>
                        {projects.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="goalId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-muted-foreground">Goal</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || "none"}>
                      <FormControl>
                        <SelectTrigger className="h-8 text-xs italic bg-transparent">
                          <SelectValue placeholder="No goal" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {goals.map((g) => (
                          <SelectItem key={g.id} value={g.id}>{g.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="milestoneId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-muted-foreground">Milestone</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || "none"}>
                      <FormControl>
                        <SelectTrigger className="h-8 text-xs italic bg-transparent">
                          <SelectValue placeholder="No milestone" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {milestones.map((m) => (
                          <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator className="bg-white/5" />

            <div className="space-y-3">
              <FormField
                control={form.control}
                name="doDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] uppercase font-bold text-primary">Drop Dead Date</FormLabel>
                    <FormControl>
                      <DateTimePicker
                        date={field.value || undefined}
                        setDate={(date) => field.onChange(date.toISOString())}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] uppercase text-muted-foreground">Final Deadline</FormLabel>
                    <FormControl>
                      <DateTimePicker
                        date={field.value || undefined}
                        setDate={(date) => field.onChange(date.toISOString())}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" className="w-full shadow-lg shadow-primary/20 mt-4">
              {task ? 'Update Task' : 'Create Task'}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
