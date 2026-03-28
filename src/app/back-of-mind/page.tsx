
"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  Brain, Plus, Search, Shuffle, Pencil, Trash2, Sparkles, X,
  ArrowUpDown, Filter, Lightbulb, HelpCircle, AlertTriangle, ListTodo, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getAllBackOfMindItems,
  addBackOfMindItem,
  updateBackOfMindItem,
  deleteBackOfMindItem,
} from "@/lib/data";
import type { BackOfMindItem } from "@/lib/types";
import { formatDistanceToNow, parseISO } from "date-fns";
import { stripAllMetadata } from "@/lib/jots";

const CATEGORIES = [
  { value: "worry", label: "Worry", icon: AlertTriangle, color: "text-red-400 border-red-500/30 bg-red-500/10" },
  { value: "idea", label: "Idea", icon: Lightbulb, color: "text-amber-400 border-amber-500/30 bg-amber-500/10" },
  { value: "question", label: "Question", icon: HelpCircle, color: "text-blue-400 border-blue-500/30 bg-blue-500/10" },
  { value: "someday", label: "Someday", icon: Sparkles, color: "text-purple-400 border-purple-500/30 bg-purple-500/10" },
  { value: "task-idea", label: "Task Idea", icon: ListTodo, color: "text-green-400 border-green-500/30 bg-green-500/10" },
  { value: "other", label: "Other", icon: Brain, color: "text-zinc-400 border-zinc-500/30 bg-zinc-500/10" },
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
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"relevance" | "newest" | "oldest">("relevance");

  // Dialog states
  const [showAdd, setShowAdd] = useState(false);
  const [editingItem, setEditingItem] = useState<BackOfMindItem | null>(null);
  const [surfacedItem, setSurfacedItem] = useState<BackOfMindItem | null>(null);
  const [form, setForm] = useState<ItemFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const loadItems = async () => {
    setLoading(true);
    const data = await getAllBackOfMindItems();
    setItems(data);
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

  return (
    <div className="flex flex-col gap-6 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-violet-600 flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.3)]">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-black tracking-tight">Back of Mind</h1>
          </div>
          <p className="text-muted-foreground text-sm pl-1">
            Capture thoughts so they stop looping. Surface them when you&apos;re ready to think.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={surfaceRandom}
            variant="outline"
            className="gap-2 border-violet-500/30 text-violet-400 hover:bg-violet-500/10"
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
        <Card className="border-2 border-violet-500/30 bg-violet-500/5 shadow-lg shadow-violet-500/10 animate-in fade-in slide-in-from-top-4 duration-500">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-violet-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-violet-400">Random Reflection</span>
                </div>
                <p className="text-lg font-medium">{stripAllMetadata(surfacedItem.content)}</p>
                <div className="flex items-center gap-2 pt-1">
                  <Badge variant="outline" className={cn("text-[10px]", getCategoryConfig(surfacedItem.category).color)}>
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
                className="text-xs text-red-400 border-red-500/30 hover:bg-red-500/10 gap-1.5"
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
                className="group transition-all duration-300 hover:border-violet-500/30 hover:shadow-md hover:shadow-violet-500/5"
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
                    <Badge variant="outline" className={cn("text-[10px]", catConfig.color)}>
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

                  <p className="text-[10px] text-muted-foreground/60">
                    {formatDistanceToNow(parseISO(item.createdAt), { addSuffix: true })}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

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
              <p className="text-[10px] text-muted-foreground">How much mental space is this taking up?</p>
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
    </div>
  );
}
