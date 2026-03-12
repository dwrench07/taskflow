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
import { type Task, type Goal } from "@/lib/types";
import { TagInput } from "./tag-input";
import { getAllGoals, getAllMilestones, getAllTasks } from "@/lib/data";
import { type Milestone } from "@/lib/types";
import { DateTimePicker } from "./date-time-picker";

const formSchema = z.object({
  title: z.string().min(2, {
    message: "Title must be at least 2 characters.",
  }),
  description: z.string().min(5, {
    message: "Description must be at least 5 characters.",
  }),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  energyLevel: z.enum(["high", "medium", "low"]).optional().nullable(),
  tags: z.array(z.string()).optional(),
  goalId: z.string().optional().nullable(),
  milestoneId: z.string().optional().nullable(),
  blockedBy: z.array(z.string()).optional(),
  blocks: z.array(z.string()).optional(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  doDate: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

interface TaskFormProps {
  task?: Task;
  allTags: string[];
  onSubmit: (data: FormValues) => Promise<void> | void;
}

export function TaskForm({ task, allTags, onSubmit }: TaskFormProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [allExistingTasks, setAllExistingTasks] = useState<Task[]>([]);

  useEffect(() => {
    Promise.all([
      getAllGoals(),
      getAllMilestones(),
      getAllTasks(),
    ]).then(([fetchedGoals, fetchedMilestones, fetchedTasks]) => {
      setGoals(fetchedGoals);
      setMilestones(fetchedMilestones);
      // Don't allow a task to block itself
      setAllExistingTasks(fetchedTasks.filter(t => t.id !== task?.id));
    }).catch(console.error);
  }, [task?.id]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: task?.title || "",
      description: task?.description || "",
      priority: task?.priority || "medium",
      tags: task?.tags || [],
      goalId: task?.goalId || null,
      milestoneId: task?.milestoneId || null,
      energyLevel: task?.energyLevel || null,
      blockedBy: task?.blockedBy || [],
      blocks: task?.blocks || [],
      startDate: task?.startDate || null,
      endDate: task?.endDate || null,
      doDate: task?.doDate || null,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a priority" />
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
            name="goalId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Linked Goal (Optional)</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || "none"}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="No goal linked" />
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
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="milestoneId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Linked Milestone (Optional)</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || "none"}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="No milestone linked" />
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
          <FormField
            control={form.control}
            name="energyLevel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Energy Required (Optional)</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || "none"}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Energy Level" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">Not specified</SelectItem>
                    <SelectItem value="high">High (Deep Work)</SelectItem>
                    <SelectItem value="medium">Medium (Standard)</SelectItem>
                    <SelectItem value="low">Low (Brain-dead)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Date</FormLabel>
                <FormControl>
                  <DateTimePicker 
                    date={field.value || undefined} 
                    setDate={(date) => field.onChange(date.toISOString())} 
                    label="Earliest start date"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="doDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-primary font-bold">Drop Dead Date</FormLabel>
                <FormControl>
                  <DateTimePicker 
                    date={field.value || undefined} 
                    setDate={(date) => field.onChange(date.toISOString())} 
                    label="Must do by..."
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
                <FormLabel>Final Due Date</FormLabel>
                <FormControl>
                  <DateTimePicker 
                    date={field.value || undefined} 
                    setDate={(date) => field.onChange(date.toISOString())} 
                    label="Hard deadline"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
          <FormField
            control={form.control}
            name="blockedBy"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Blocked By (Dependencies)</FormLabel>
                <FormControl>
                  <div className="border rounded-md p-2 max-h-48 overflow-y-auto space-y-2">
                    {allExistingTasks.length === 0 && <p className="text-sm text-muted-foreground p-2">No other tasks available.</p>}
                    {allExistingTasks.map(t => (
                      <label key={`blockedBy-${t.id}`} className="flex items-center space-x-2 text-sm">
                        <input 
                          type="checkbox" 
                          checked={field.value?.includes(t.id)}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            const current = field.value || [];
                            field.onChange(checked ? [...current, t.id] : current.filter(id => id !== t.id));
                          }}
                          className="rounded border-gray-300 text-primary focus:ring-primary"
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
                <FormLabel>Blocks (Dependents)</FormLabel>
                <FormControl>
                  <div className="border rounded-md p-2 max-h-48 overflow-y-auto space-y-2">
                    {allExistingTasks.length === 0 && <p className="text-sm text-muted-foreground p-2">No other tasks available.</p>}
                    {allExistingTasks.map(t => (
                      <label key={`blocks-${t.id}`} className="flex items-center space-x-2 text-sm">
                        <input 
                          type="checkbox" 
                          checked={field.value?.includes(t.id)}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            const current = field.value || [];
                            field.onChange(checked ? [...current, t.id] : current.filter(id => id !== t.id));
                          }}
                          className="rounded border-gray-300 text-primary focus:ring-primary"
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
        <Button type="submit">
          {task ? 'Save Changes' : 'Create Task'}
        </Button>
      </form>
    </Form>
  );
}
