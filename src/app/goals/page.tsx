"use client";

import React, { useState, useEffect } from "react";
import { type Goal, type FocusSession } from "@/lib/types";
import { getAllGoals, addGoal, updateGoal, deleteGoal, getAllTasks, getFocusSessions } from "@/lib/data";
import { GoalCelebration } from "@/components/goal-celebration";
import { useGamification } from "@/context/GamificationContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Target, PlusCircle, MoreVertical, Edit, Trash2, Calendar, Target as TargetIcon, CheckCircle2, Circle, Rocket } from "lucide-react";
import { GoalForm } from "@/components/goal-form";
import { useToast } from "@/hooks/use-toast";

export default function GoalsPage() {
    const [goals, setGoals] = useState<Goal[]>([]);
    const [tasks, setTasks] = useState<any[]>([]); // To calculate completion progress
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
    const [focusSessions, setFocusSessions] = useState<FocusSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [celebratingGoal, setCelebratingGoal] = useState<Goal | null>(null);
    const { toast } = useToast();
    const { celebrate } = useGamification();

    const loadData = async () => {
        setLoading(true);
        const [fetchedGoals, fetchedTasks, fetchedSessions] = await Promise.all([
            getAllGoals(),
            getAllTasks(),
            getFocusSessions()
        ]);
        setGoals(fetchedGoals);
        setTasks(fetchedTasks || []);
        setFocusSessions(fetchedSessions || []);
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleAddGoal = async (data: any) => {
        try {
            await addGoal({ ...data, status: 'active' });
            toast({ title: "Goal Created", description: "Successfully added new goal." });
            setIsFormOpen(false);
            loadData();
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to create goal." });
        }
    };

    const handleUpdateGoal = async (data: any) => {
        if (!editingGoal) return;
        try {
            const wasActive = editingGoal.status !== 'completed';
            const isNowCompleted = data.status === 'completed';

            const updatedGoal = {
                ...editingGoal,
                ...data,
                ...(wasActive && isNowCompleted ? { completedAt: new Date().toISOString() } : {}),
            };

            await updateGoal(updatedGoal);
            toast({ title: "Goal Updated", description: "Successfully updated goal." });
            setEditingGoal(null);

            // Trigger celebration if newly completed
            if (wasActive && isNowCompleted) {
                celebrate({ reason: 'goal-complete', title: `Goal achieved: ${updatedGoal.title}`, intensity: 'big' });
                setCelebratingGoal(updatedGoal);
            }

            loadData();
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to update goal." });
        }
    };

    const handleDeleteGoal = async (id: string) => {
        try {
            await deleteGoal(id);
            toast({ title: "Goal Deleted", description: "Successfully deleted goal." });
            loadData();
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to delete goal." });
        }
    };

    const calculateProgress = (goalId: string) => {
        const goalTasks = tasks.filter(t => t.goalId === goalId);
        if (goalTasks.length === 0) return 0;
        const completedTasks = goalTasks.filter(t => t.status === 'done').length;
        return Math.round((completedTasks / goalTasks.length) * 100);
    };

    return (
        <div className="h-full max-w-7xl mx-auto p-4 md:p-8 animate-fade-in pb-20">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <TargetIcon className="h-8 w-8 text-primary" />
                        Goals & Objectives
                    </h1>
                    <p className="text-muted-foreground mt-1">Define long-term objectives and track their completion.</p>
                </div>

                <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                    <DialogTrigger asChild>
                        <Button className="rounded-full shadow-md gap-2">
                            <PlusCircle className="h-4 w-4" /> New Goal
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Goal</DialogTitle>
                        </DialogHeader>
                        <GoalForm onSubmit={handleAddGoal} />
                    </DialogContent>
                </Dialog>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <Card key={i} className="animate-pulse bg-muted/20 border-border/50 h-48 rounded-3xl" />
                    ))}
                </div>
            ) : goals.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center bg-muted/10 rounded-3xl border border-dashed border-border/60">
                    <Target className="h-16 w-16 text-muted-foreground/30 mb-4" />
                    <h3 className="text-xl font-bold text-foreground">No Goals Found</h3>
                    <p className="text-muted-foreground mt-2 max-w-sm">Start laying out your long-term objectives by creating your first Goal.</p>
                    <Button variant="outline" className="mt-6 rounded-full" onClick={() => setIsFormOpen(true)}>
                        Create Goal
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {goals.map(goal => {
                        const progress = calculateProgress(goal.id);
                        return (
                            <Card key={goal.id} className="rounded-3xl border-border/50 shadow-sm hover:shadow-md transition-all overflow-hidden relative group">
                                <div className={`absolute top-0 left-0 w-full h-1 ${goal.status === 'completed' ? 'bg-green-500' : goal.status === 'abandoned' ? 'bg-red-500' : 'bg-primary'}`} />
                                <CardHeader className="pb-4">
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-xl font-bold leading-tight">{goal.title}</CardTitle>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full -mt-2 -mr-2 text-muted-foreground hover:bg-muted xl:opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <Dialog open={!!editingGoal && editingGoal.id === goal.id} onOpenChange={(open) => !open && setEditingGoal(null)}>
                                                    <DialogTrigger asChild>
                                                        <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setEditingGoal(goal); }}>
                                                            <Edit className="mr-2 h-4 w-4" /> Edit Goal
                                                        </DropdownMenuItem>
                                                    </DialogTrigger>
                                                    <DialogContent>
                                                        <DialogHeader>
                                                            <DialogTitle>Edit Goal</DialogTitle>
                                                        </DialogHeader>
                                                        <GoalForm goal={goal} onSubmit={handleUpdateGoal} />
                                                    </DialogContent>
                                                </Dialog>

                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                                                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                        </DropdownMenuItem>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This action cannot be undone. This will permanently delete the goal "{goal.title}".
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDeleteGoal(goal.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                                                Delete
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                    <CardDescription className="line-clamp-2 mt-2">{goal.description || "No description provided."}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Calendar className="h-4 w-4" />
                                            {goal.deadline ? `Target: ${new Date(goal.deadline).toLocaleDateString()}` : "No deadline set"}
                                        </div>

                                        <div className="space-y-1.5">
                                            <div className="flex justify-between text-xs font-medium text-muted-foreground">
                                                <span>Task Completion</span>
                                                <span>{progress}%</span>
                                            </div>
                                            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-1000 ${progress === 100 ? 'bg-green-500' : 'bg-primary'}`}
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>
                                        </div>

                                        {(() => {
                                            const goalTasks = tasks.filter(t => t.goalId === goal.id);
                                            const activeTasks = goalTasks.filter(t => t.status !== 'done' && t.status !== 'abandoned').slice(0, 3);
                                            
                                            if (activeTasks.length === 0) return null;
                                            
                                            return (
                                                <div className="bg-muted/30 rounded-xl p-3 space-y-2 border border-border/30 mt-4">
                                                    <p className="text-xs font-medium text-muted-foreground mb-1">Active Tasks</p>
                                                    {activeTasks.map(task => (
                                                        <div key={task.id} className="flex items-center gap-2 text-sm line-clamp-1">
                                                            <Circle className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                                            <span className="truncate">{task.title}</span>
                                                        </div>
                                                    ))}
                                                    {goalTasks.filter(t => t.status !== 'done' && t.status !== 'abandoned').length > 3 && (
                                                        <p className="text-xs text-muted-foreground pl-5">
                                                            +{goalTasks.filter(t => t.status !== 'done' && t.status !== 'abandoned').length - 3} more...
                                                        </p>
                                                    )}
                                                </div>
                                            );
                                        })()}

                                        <div className="flex flex-wrap gap-2 pt-2">
                                            <Badge variant={goal.status === 'completed' ? 'default' : goal.status === 'abandoned' ? 'destructive' : 'secondary'} className="capitalize">
                                                {goal.status}
                                            </Badge>
                                            {goal.stretchGoal && (
                                                <Badge variant="outline" className="text-xs text-amber-400 border-amber-500/30 gap-1">
                                                    <Rocket className="h-3 w-3" /> Stretch set
                                                </Badge>
                                            )}
                                            {goal.tags?.slice(0, 2).map((tag, i) => (
                                                <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>
                                            ))}
                                            {(goal.tags?.length || 0) > 2 && (
                                                <Badge variant="outline" className="text-xs">+{goal.tags!.length - 2}</Badge>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
            {/* Goal Celebration Modal */}
            {celebratingGoal && (
                <GoalCelebration
                    goal={celebratingGoal}
                    focusSessions={focusSessions}
                    open={!!celebratingGoal}
                    onClose={() => setCelebratingGoal(null)}
                    onContinueToStretch={celebratingGoal.stretchGoal ? () => {
                        // Update goal title to stretch version and reactivate
                        const stretchTitle = `${celebratingGoal.title} (Stretch: ${celebratingGoal.stretchGoal})`;
                        updateGoal({
                            ...celebratingGoal,
                            title: celebratingGoal.title,
                            description: `Stretch goal: ${celebratingGoal.stretchGoal}\n\nOriginal: ${celebratingGoal.description || ''}`.trim(),
                            status: 'active',
                            stretchGoal: undefined,
                        });
                        setCelebratingGoal(null);
                        loadData();
                        toast({ title: "Stretch goal activated!", description: "Keep pushing — you've got this." });
                    } : undefined}
                />
            )}
        </div>
    );
}
