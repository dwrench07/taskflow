"use client";

import { useState } from "react";
import { type Goal } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { TagInput } from "@/components/tag-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";

interface GoalFormProps {
    goal?: Goal;
    allTags?: string[];
    onSubmit: (goal: any) => void;
}

export function GoalForm({ goal, allTags = [], onSubmit }: GoalFormProps) {
    const [title, setTitle] = useState(goal?.title || "");
    const [description, setDescription] = useState(goal?.description || "");
    const [status, setStatus] = useState<Goal['status']>(goal?.status || 'active');
    const [deadline, setDeadline] = useState(goal?.deadline ? new Date(goal.deadline).toISOString().split('T')[0] : "");
    const [tags, setTags] = useState<string[]>(goal?.tags || []);
    const [stretchGoal, setStretchGoal] = useState(goal?.stretchGoal || "");

    const handleUpdateTags = async (newTags: string[]) => {
        setTags(newTags);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        onSubmit({
            title: title.trim(),
            description: description.trim(),
            status,
            deadline: deadline ? new Date(deadline).toISOString() : undefined,
            tags,
            stretchGoal: stretchGoal.trim() || undefined,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
            <div className="space-y-2">
                <Label htmlFor="title">Goal Title <span className="text-red-500">*</span></Label>
                <Input
                    id="title"
                    placeholder="e.g., Launch Version 2.0"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                    id="description"
                    placeholder="What are you trying to achieve?"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={status} onValueChange={(v) => setStatus(v as any)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="abandoned">Abandoned</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="deadline">Target Deadline</Label>
                    <Input
                        id="deadline"
                        type="date"
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="stretch">Stretch Goal <span className="text-muted-foreground text-xs font-normal">(optional)</span></Label>
                <Input
                    id="stretch"
                    placeholder="What would the ambitious version look like?"
                    value={stretchGoal}
                    onChange={(e) => setStretchGoal(e.target.value)}
                />
                <p className="text-[10px] text-muted-foreground">After hitting your goal, we&apos;ll surface this as an optional next level.</p>
            </div>

            <div className="space-y-2">
                <Label>Tags</Label>
                <TagInput
                    tags={tags}
                    onUpdateTags={handleUpdateTags}
                    allTags={allTags}
                    placeholder="Add tags..."
                />
            </div>

            <DialogFooter className="pt-4">
                <Button type="submit" disabled={!title.trim()} className="w-full sm:w-auto">
                    {goal ? "Save Changes" : "Create Goal"}
                </Button>
            </DialogFooter>
        </form>
    );
}
