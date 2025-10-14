"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import React, { useEffect } from "react";

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
import { type TaskTemplate, type TemplateSubtask } from "@/lib/types";
import { TagInput } from "./tag-input";
import { PlusCircle, Trash2 } from "lucide-react";
import { Separator } from "./ui/separator";

const templateSubtaskSchema = z.object({
  title: z.string().min(1, "Subtask title cannot be empty."),
  tags: z.array(z.string()).optional(),
});

const formSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters."),
  description: z.string().min(5, "Description must be at least 5 characters."),
  priority: z.enum(["low", "medium", "high"]),
  tags: z.array(z.string()).optional(),
  subtasks: z.array(templateSubtaskSchema).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface TemplateFormProps {
    template?: TaskTemplate;
    allTags: string[];
    onSubmit: (data: Omit<TaskTemplate, 'id'>) => void;
}

export function TemplateForm({ template, allTags, onSubmit }: TemplateFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: template?.title || "",
      description: template?.description || "",
      priority: template?.priority || "medium",
      tags: template?.tags || [],
      subtasks: template?.subtasks || [],
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "subtasks",
  });

  const handleFormSubmit = (data: FormValues) => {
    const subtasks = data.subtasks?.map((st, index) => ({
      ...st,
      id: template?.subtasks[index]?.id || `tsub-${Date.now()}-${index}`,
    })) || [];
    onSubmit({ ...data, subtasks });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6 max-h-[80vh] overflow-y-auto pr-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Weekly Onboarding Checklist" {...field} />
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
                  placeholder="e.g. A reusable checklist for new hires..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="priority"
          render={({ field }) => (
            <FormItem>
            <FormLabel>Default Priority</FormLabel>
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
                </SelectContent>
            </Select>
            <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="tags"
          render={({ field }) => (
            <FormItem>
                <FormLabel>Default Tags</FormLabel>
                <FormControl>
                   <TagInput
                      tags={field.value || []}
                      allTags={allTags}
                      onUpdateTags={(tags) => form.setValue('tags', tags)}
                      placeholder="Add or select tags..."
                    />
                </FormControl>
                <FormMessage />
            </FormItem>
          )}
        />

        <Separator />
        
        <div>
            <FormLabel>Subtasks</FormLabel>
            <div className="space-y-4 mt-2">
                {fields.map((field, index) => (
                    <div key={field.id} className="flex items-start gap-2 p-3 border rounded-md">
                       <div className="flex-grow space-y-3">
                         <FormField
                            control={form.control}
                            name={`subtasks.${index}.title`}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="sr-only">Subtask Title</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Subtask title" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                         />
                         <FormField
                            control={form.control}
                            name={`subtasks.${index}.tags`}
                            render={({ field }) => (
                                <FormItem>
                                     <FormLabel className="sr-only">Subtask Tags</FormLabel>
                                    <FormControl>
                                        <TagInput
                                            tags={field.value || []}
                                            allTags={allTags}
                                            onUpdateTags={(tags) => update(index, { ...fields[index], tags })}
                                            placeholder="Add subtask tags..."
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                         />
                       </div>
                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                ))}
                 <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ title: '' })}
                    className="w-full"
                    >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Subtask
                </Button>
            </div>
        </div>

        <Button type="submit" className="w-full">
            {template ? 'Save Changes' : 'Create Template'}
        </Button>
      </form>
    </Form>
  );
}
