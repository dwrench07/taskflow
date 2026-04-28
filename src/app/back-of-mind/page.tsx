
"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import {
  Brain, Plus, Search, Shuffle, Pencil, Trash2, Sparkles, X,
  ArrowUpDown, Filter, Lightbulb, HelpCircle, AlertTriangle, ListTodo, Loader2,
  CheckCircle2, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getAllBackOfMindItems,
  addBackOfMindItem,
  updateBackOfMindItem,
  deleteBackOfMindItem,
  getAllMistakeLogEntries,
  addMistakeLogEntry,
  updateMistakeLogEntry,
  deleteMistakeLogEntry,
  saveUserProgress
} from "@/lib/data";
import type { BackOfMindItem, MistakeLogEntry } from "@/lib/types";
import { formatDistanceToNow, parseISO } from "date-fns";
import { stripAllMetadata } from "@/lib/jots";
import { useGamification } from "@/context/GamificationContext";
import { useToast } from "@/hooks/use-toast";

const CATEGORIES = [
  { value: "worry", label: "Worry", icon: AlertTriangle, color: "text-red-500 border-red-500/20 bg-red-500/5" },
  { value: "idea", label: "Idea", icon: Lightbulb, color: "text-amber-500 border-amber-500/20 bg-amber-500/5" },
  { value: "question", label: "Question", icon: HelpCircle, color: "text-blue-500 border-blue-500/20 bg-blue-500/5" },
  { value: "someday", label: "Someday", icon: Sparkles, color: "text-purple-500 border-purple-500/20 bg-purple-500/5" },
  { value: "task-idea", label: "Task Idea", icon: ListTodo, color: "text-green-500 border-green-500/20 bg-green-500/5" },
  { value: "other", label: "Other", icon: Brain, color: "text-zinc-500 border-zinc-500/20 bg-zinc-500/5" },
];

function getCategoryConfig(cat?: string) {
  return CATEGORIES.find(c => c.value === cat) || CATEGORIES[CATEGORIES.length - 1];
}

interface ItemFormState {
  content: string;
  category: string;
  relevanceScore: number;
}

const EMPTY_FORM: ItemFormState = { content: "", category: "other", relevanceScore: 5 };

export default function BackOfMindPage() {
  const [items, setItems] = useState<BackOfMindItem[]>([]);
  const [mistakes, setMistakes] = useState<MistakeLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"relevance" | "newest" | "oldest">("relevance");

  // Dialog states
  const [showAdd, setShowAdd] = useState(false);
  const [isMistakeOpen, setIsMistakeOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BackOfMindItem | null>(null);
  const [surfacedItem, setSurfacedItem] = useState<BackOfMindItem | null>(null);
  const [form, setForm] = useState<ItemFormState>(EMPTY_FORM);
  const [mistakeDesc, setMistakeDesc] = useState("");
  const [mistakeLessons, setMistakeLessons] = useState("");
  const [mistakeAction, setMistakeAction] = useState("");
  const [saving, setSaving] = useState(false);
  const { userProgress, refreshProgress } = useGamification();
  const { toast } = useToast();

  const loadItems = async () => {
    setLoading(true);
    const [data, mData] = await Promise.all([
      getAllBackOfMindItems(),
      getAllMistakeLogEntries().catch(() => [])
    ]);
    setItems(data);
    setMistakes(mData);
    setLoading(false);
  };

  useEffect(() => {
    loadItems();
  }, []);

  const filtered = useMemo(() => {
    let result = [...items];

    // Filter by category
    if (filterCategory !== "all") {
      result = result.filter(i => (i.category || "other") === filterCategory);
    }

    // Filter by search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(i => i.content.toLowerCase().includes(q));
    }

    // Sort
    if (sortBy === "relevance") {
      result.sort((a, b) => b.relevanceScore - a.relevanceScore);
    } else if (sortBy === "newest") {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else {
      result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }

    return result;
  }, [items, filterCategory, search, sortBy]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: items.length };
    items.forEach(i => {
      const cat = i.category || "other";
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [items]);

  const handleAdd = async () => {
    if (!form.content.trim()) return;
    setSaving(true);
    await addBackOfMindItem({
      content: form.content.trim(),
      category: form.category,
      relevanceScore: form.relevanceScore,
    });
    setForm(EMPTY_FORM);
    setShowAdd(false);
    setSaving(false);
    loadItems();
  };

  const handleUpdate = async () => {
    if (!editingItem || !form.content.trim()) return;
    setSaving(true);
    await updateBackOfMindItem({
      ...editingItem,
      content: form.content.trim(),
      category: form.category,
      relevanceScore: form.relevanceScore,
      updatedAt: new Date().toISOString(),
    });
    setEditingItem(null);
    setForm(EMPTY_FORM);
    setSaving(false);
    loadItems();
  };

  const handleDelete = async (id: string) => {
    // Gamification: If it's a worry, ask if it turned out better than feared
    const item = items.find(i => i.id === id);
    if (item?.category === 'worry') {
      // In a real app, we'd show a "Was this worry accurate?" dialog.
      // For now, if they are resolving it (deleting), we'll assume it's a success/growth.
      if (userProgress) {
        import("@/lib/gamification").then(async ({ evaluateGamificationTriggers }) => {
          const tempProgress = JSON.parse(JSON.stringify(userProgress));
          const updates = evaluateGamificationTriggers({ type: 'worry-resolved', accuracy: 'low' }, tempProgress);
          if (updates.length > 0) {
            await saveUserProgress(tempProgress);
            await refreshProgress();
            updates.forEach(u => toast({ title: `🎁 ${u.message}`, description: u.detail }));
          }
        });
      }
    }
    
    await deleteBackOfMindItem(id);
    if (surfacedItem?.id === id) setSurfacedItem(null);
    loadItems();
  };

  const openEdit = (item: BackOfMindItem) => {
    setForm({
      content: item.content,
      category: item.category || "other",
      relevanceScore: item.relevanceScore,
    });
    setEditingItem(item);
  };

  const surfaceRandom = () => {
    if (items.length === 0) return;
    // Weight by relevance score so higher relevance items surface more
    const weighted: BackOfMindItem[] = [];
    items.forEach(item => {
      for (let i = 0; i < item.relevanceScore; i++) {
        weighted.push(item);
      }
    });
    const picked = weighted[Math.floor(Math.random() * weighted.length)];
    setSurfacedItem(picked);
  };

  const handleAddMistake = async () => {
    if (!mistakeDesc.trim() || !mistakeLessons.trim()) return;
    try {
      const newEntry = await addMistakeLogEntry({
        description: mistakeDesc,
        lessonsLearned: mistakeLessons,
        actionTaken: mistakeAction || undefined,
        status: mistakeAction ? "resolved" : "open",
      });
      setMistakes([newEntry, ...mistakes]);
      setIsMistakeOpen(false);
      setMistakeDesc("");
      setMistakeLessons("");
      setMistakeAction("");

      // Gamification trigger
      if (userProgress) {
        import("@/lib/gamification").then(async ({ evaluateGamificationTriggers }) => {
          const tempProgress = JSON.parse(JSON.stringify(userProgress));
          const updates = evaluateGamificationTriggers({ type: 'mistake-logged' }, tempProgress);
          if (updates.length > 0) {
            await saveUserProgress(tempProgress);
            await refreshProgress();
            updates.forEach(u => toast({ title: `🎁 ${u.message}`, description: u.detail }));
          }
        });
      }
    } catch (err) {
      console.error("Failed to add mistake:", err);
    }
  };

  const handleResolveMistake = async (entry: MistakeLogEntry) => {
    try {
      await updateMistakeLogEntry({ ...entry, status: "resolved" });
      setMistakes(mistakes.map(m => m.id === entry.id ? { ...m, status: "resolved" } : m));
    } catch (err) {
      console.error("Failed to resolve mistake:", err);
    }
  };

  const handleDeleteMistake = async (id: string) => {
    try {
      await deleteMistakeLogEntry(id);
      setMistakes(mistakes.filter(m => m.id !== id));
    } catch (err) {
      console.error("Failed to delete mistake:", err);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-violet-600 flex items-center justify-center shadow-sm">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">Deep Store</h1>
          </div>
          <p className="text-muted-foreground text-sm pl-1">
            Capture thoughts so they stop looping, and distill lessons to evolve.
          </p>
        </div>
      </div>

      <Tabs defaultValue="thoughts" className="space-y-6 flex-1 flex flex-col">
        <TabsList className="bg-muted border border-border w-fit">
          <TabsTrigger value="thoughts" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Thoughts & Ideas
          </TabsTrigger>
          <TabsTrigger value="mistakes" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Mistakes & Feedback
          </TabsTrigger>
        </TabsList>

        <TabsContent value="thoughts" className="space-y-6 flex-1 focus-visible:outline-none focus-visible:ring-0">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Long-Term Thoughts</h2>
            <div className="flex items-center gap-2">
              <Button
                onClick={surfaceRandom}
                variant="outline"
                className="gap-2 border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                disabled={items.length === 0}
              >
                <Shuffle className="h-4 w-4" />
                Surface a Thought
              </Button>
              <Button onClick={() => { setForm(EMPTY_FORM); setShowAdd(true); }} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Thought
              </Button>
            </div>
          </div>

      {/* Surfaced thought card */}
      {surfacedItem && (
        <Card className="border-border bg-card shadow-md animate-in fade-in slide-in-from-top-4 duration-500">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-violet-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-violet-400">Random Reflection</span>
                </div>
                <p className="text-lg font-medium">{stripAllMetadata(surfacedItem.content)}</p>
                <div className="flex items-center gap-2 pt-1">
                  <Badge variant="outline" className={cn("text-[11px]", getCategoryConfig(surfacedItem.category).color)}>
                    {getCategoryConfig(surfacedItem.category).label}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Added {formatDistanceToNow(parseISO(surfacedItem.createdAt), { addSuffix: true })}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => openEdit(surfacedItem)} className="h-8 w-8">
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setSurfacedItem(null)} className="h-8 w-8">
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button variant="outline" size="sm" onClick={surfaceRandom} className="text-xs gap-1.5">
                <Shuffle className="h-3 w-3" /> Another One
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs text-red-500 border-border hover:bg-red-500/10 gap-1.5"
                onClick={() => handleDelete(surfacedItem.id)}
              >
                <Trash2 className="h-3 w-3" /> Resolved / Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search thoughts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[160px]">
              <Filter className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All ({categoryCounts.all || 0})</SelectItem>
              {CATEGORIES.map(cat => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label} ({categoryCounts[cat.value] || 0})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
            <SelectTrigger className="w-[150px]">
              <ArrowUpDown className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">By Relevance</SelectItem>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Category quick filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterCategory("all")}
          className={cn(
            "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
            filterCategory === "all"
              ? "bg-white/10 text-white border-white/20"
              : "text-muted-foreground border-border/50 hover:border-border"
          )}
        >
          All {items.length}
        </button>
        {CATEGORIES.map(cat => {
          const count = categoryCounts[cat.value] || 0;
          if (count === 0) return null;
          const Icon = cat.icon;
          return (
            <button
              key={cat.value}
              onClick={() => setFilterCategory(filterCategory === cat.value ? "all" : cat.value)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium border transition-all flex items-center gap-1.5",
                filterCategory === cat.value
                  ? cat.color
                  : "text-muted-foreground border-border/50 hover:border-border"
              )}
            >
              <Icon className="h-3 w-3" />
              {cat.label} {count}
            </button>
          );
        })}
      </div>

      {/* Items grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 space-y-3">
          <Brain className="h-12 w-12 text-muted-foreground/30 mx-auto" />
          <p className="text-muted-foreground">
            {items.length === 0
              ? "Your mind is clear. Add thoughts that keep circling back."
              : "No thoughts match your filters."}
          </p>
          {items.length === 0 && (
            <Button variant="outline" onClick={() => { setForm(EMPTY_FORM); setShowAdd(true); }} className="gap-2">
              <Plus className="h-4 w-4" /> Capture your first thought
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => {
            const catConfig = getCategoryConfig(item.category);
            const Icon = catConfig.icon;
            return (
              <Card
                key={item.id}
                className="group transition-all duration-300 hover:border-primary/30 hover:shadow-md"
              >
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", catConfig.color)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(item)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-400 hover:text-red-300"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <p className="text-sm leading-relaxed">{stripAllMetadata(item.content)}</p>

                  <div className="flex items-center justify-between pt-1">
                    <Badge variant="outline" className={cn("text-[11px]", catConfig.color)}>
                      {catConfig.label}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1" title={`Relevance: ${item.relevanceScore}/10`}>
                        {Array.from({ length: 10 }).map((_, i) => (
                          <div
                            key={i}
                            className={cn(
                              "h-1.5 w-1.5 rounded-full transition-colors",
                              i < item.relevanceScore ? "bg-violet-400" : "bg-muted-foreground/20"
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-muted-foreground">
                    {formatDistanceToNow(parseISO(item.createdAt), { addSuffix: true })}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      </TabsContent>

      <TabsContent value="mistakes" className="space-y-6 flex-1 focus-visible:outline-none focus-visible:ring-0">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Feedback & Lessons Learned</h2>
            <Button variant="secondary" className="text-destructive hover:text-destructive-foreground hover:bg-destructive gap-2 border-destructive/20" onClick={() => setIsMistakeOpen(true)}>
              <Plus className="h-4 w-4" />
              Log Mistake
            </Button>
          </div>

          <div className="space-y-4">
            {mistakes.map((entry) => (
              <Card key={entry.id} className={`bg-card border-l-4 transition-all group shadow-sm ${entry.status === 'open' ? 'border-l-destructive border-border' : 'border-l-emerald-500 border-border'}`}>
                <CardHeader className="py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {entry.status === 'open' ? (
                        <div className="h-8 w-8 rounded-full bg-destructive/10 flex items-center justify-center">
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                        </div>
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        </div>
                      )}
                      <div>
                        <div className="flex gap-2 items-center">
                          <span className="text-sm font-medium">Mistake logged</span>
                          <span className="text-xs text-muted-foreground">• {new Date(entry.createdAt).toLocaleDateString()}</span>
                        </div>
                        <Badge variant="outline" className={`mt-1 text-xs ${entry.status === 'open' ? 'text-destructive border-destructive/20' : 'text-emerald-500 border-emerald-500/20'}`}>
                          {entry.status === 'open' ? 'Loop Open' : 'Resolved'}
                        </Badge>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity" onClick={() => handleDeleteMistake(entry.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">The Mistake</h4>
                       <p className="text-sm">{entry.description}</p>
                    </div>
                    <div className="space-y-2">
                       <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Lessons Learned</h4>
                       <p className="text-sm">{entry.lessonsLearned}</p>
                    </div>
                  </div>
                  
                  {/* Action or Resolution */}
                  <div className="pt-4 border-t border-border">
                    {entry.actionTaken ? (
                      <div>
                        <h4 className="flex items-center gap-2 text-sm font-semibold text-emerald-500 tracking-wider">
                          <ChevronRight className="h-4 w-4" />
                          Action Implemented
                        </h4>
                        <p className="text-sm mt-1 ml-6 text-muted-foreground">{entry.actionTaken}</p>
                      </div>
                    ) : (
                       <div className="flex items-center justify-between bg-primary/5 rounded-lg p-3">
                         <span className="text-sm text-amber-500/90 flex items-center gap-2">
                           <AlertTriangle className="h-4 w-4" />
                           Feedback loop is still open. Implement an action.
                         </span>
                         <Button size="sm" variant="outline" onClick={() => handleResolveMistake(entry)}>
                           <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-500" />
                           Mark Resolved
                         </Button>
                       </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            {mistakes.length === 0 && (
              <div className="py-12 text-center text-muted-foreground border border-dashed border-border rounded-xl bg-muted/30">
                <AlertTriangle className="h-8 w-8 mx-auto mb-3 opacity-50" />
                <p>No mistakes logged yet.</p>
                <p className="text-sm opacity-70">Acknowledge mistakes objectively to refine your process.</p>
              </div>
            )}
          </div>
      </TabsContent>
      </Tabs>

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-violet-400" />
              Capture a Thought
            </DialogTitle>
            <DialogDescription>
              Write it down so your brain can let go of it.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Textarea
              placeholder="What's been on your mind?"
              value={form.content}
              onChange={(e) => setForm(f => ({ ...f, content: e.target.value }))}
              className="min-h-[100px] resize-none"
              autoFocus
            />
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Category</label>
              <div className="grid grid-cols-3 gap-2">
                {CATEGORIES.map(cat => {
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.value}
                      onClick={() => setForm(f => ({ ...f, category: cat.value }))}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all",
                        form.category === cat.value ? cat.color : "border-border/50 text-muted-foreground hover:border-border"
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-muted-foreground">Relevance</label>
                <span className="text-xs font-bold text-violet-400">{form.relevanceScore}/10</span>
              </div>
              <Slider
                value={[form.relevanceScore]}
                onValueChange={([v]) => setForm(f => ({ ...f, relevanceScore: v }))}
                min={1}
                max={10}
                step={1}
              />
              <p className="text-[11px] text-muted-foreground">How much mental space is this taking up?</p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={!form.content.trim() || saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Capture
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingItem} onOpenChange={(open) => { if (!open) setEditingItem(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-violet-400" />
              Edit Thought
            </DialogTitle>
            <DialogDescription>
              Update or refine this thought.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Textarea
              placeholder="What's been on your mind?"
              value={form.content}
              onChange={(e) => setForm(f => ({ ...f, content: e.target.value }))}
              className="min-h-[100px] resize-none"
              autoFocus
            />
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Category</label>
              <div className="grid grid-cols-3 gap-2">
                {CATEGORIES.map(cat => {
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.value}
                      onClick={() => setForm(f => ({ ...f, category: cat.value }))}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all",
                        form.category === cat.value ? cat.color : "border-border/50 text-muted-foreground hover:border-border"
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-muted-foreground">Relevance</label>
                <span className="text-xs font-bold text-violet-400">{form.relevanceScore}/10</span>
              </div>
              <Slider
                value={[form.relevanceScore]}
                onValueChange={([v]) => setForm(f => ({ ...f, relevanceScore: v }))}
                min={1}
                max={10}
                step={1}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setEditingItem(null)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={!form.content.trim() || saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Log Mistake Dialog */}
      <Dialog open={isMistakeOpen} onOpenChange={setIsMistakeOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Log Mistake & Feedback</DialogTitle>
            <DialogDescription>
              Document a misstep to distill lessons and define corrective action.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="mDesc">What happened? (The Mistake)</Label>
              <Textarea 
                id="mDesc" 
                placeholder="Describe the context and the mistake objectively..."
                value={mistakeDesc}
                onChange={(e) => setMistakeDesc(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mLessons">Lessons Learned</Label>
              <Textarea 
                id="mLessons" 
                placeholder="What is the core takeaway?"
                value={mistakeLessons}
                onChange={(e) => setMistakeLessons(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mAction">Action Taken / Feedback Loop (Optional)</Label>
              <Input 
                id="mAction" 
                placeholder="How will you prevent this in the future?"
                value={mistakeAction}
                onChange={(e) => setMistakeAction(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                If you add an action now, it will be marked as 'Resolved'. Otherwise, it stays 'Open'.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setIsMistakeOpen(false)}>Cancel</Button>
            <Button onClick={handleAddMistake} variant="destructive">Log Learning</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
