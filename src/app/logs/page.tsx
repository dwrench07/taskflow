"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Plus, Brain, AlertTriangle, CheckCircle2, ChevronRight, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getAllBackOfMindItems,
  addBackOfMindItem,
  updateBackOfMindItem,
  deleteBackOfMindItem,
  getAllMistakeLogEntries,
  addMistakeLogEntry,
  updateMistakeLogEntry,
  deleteMistakeLogEntry
} from "@/lib/data";
import type { BackOfMindItem, MistakeLogEntry } from "@/lib/types";

export default function LogsPage() {
  const { user } = useAuth();
  const [bomItems, setBomItems] = useState<BackOfMindItem[]>([]);
  const [mistakes, setMistakes] = useState<MistakeLogEntry[]>([]);
  
  // Dialog states
  const [isBomOpen, setIsBomOpen] = useState(false);
  const [isMistakeOpen, setIsMistakeOpen] = useState(false);

  // BOM Form
  const [bomContent, setBomContent] = useState("");
  const [bomCategory, setBomCategory] = useState("");
  const [bomRelevance, setBomRelevance] = useState("5");

  // Mistake Form
  const [mistakeDesc, setMistakeDesc] = useState("");
  const [mistakeLessons, setMistakeLessons] = useState("");
  const [mistakeAction, setMistakeAction] = useState("");

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user]);

  async function loadData() {
    try {
      const bItems = await getAllBackOfMindItems();
      setBomItems(bItems);
      const mEntries = await getAllMistakeLogEntries();
      setMistakes(mEntries);
    } catch (err) {
      console.error("Failed to load logs:", err);
    }
  }

  // === BOM Handlers ===
  const handleAddBom = async () => {
    if (!bomContent.trim()) return;
    try {
      const newItem = await addBackOfMindItem({
        content: bomContent,
        category: bomCategory || undefined,
        relevanceScore: parseInt(bomRelevance, 10),
      });
      setBomItems([newItem, ...bomItems].sort((a,b) => b.relevanceScore - a.relevanceScore));
      setIsBomOpen(false);
      setBomContent("");
      setBomCategory("");
      setBomRelevance("5");
    } catch (err) {
      console.error("Failed to add BOM:", err);
    }
  };

  const handleDeleteBom = async (id: string) => {
    try {
      await deleteBackOfMindItem(id);
      setBomItems(bomItems.filter(i => i.id !== id));
    } catch (err) {
      console.error("Failed to delete BOM:", err);
    }
  };

  // === Mistake Handlers ===
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
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">Utility Logs</h1>
          <p className="text-muted-foreground mt-1">Capture long-term thoughts and learn from feedback loops.</p>
        </div>
      </div>

      <Tabs defaultValue="bom" className="space-y-6">
        <TabsList className="bg-background/40 backdrop-blur-md border border-white/5">
          <TabsTrigger value="bom" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Back of Mind
          </TabsTrigger>
          <TabsTrigger value="mistakes" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Mistake & Feedback Log
          </TabsTrigger>
        </TabsList>

        {/* BACK OF MIND TAB */}
        <TabsContent value="bom" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Long-Term Thoughts & Ideas</h2>
            <Dialog open={isBomOpen} onOpenChange={setIsBomOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary/20 text-primary hover:bg-primary/30">
                  <Plus className="h-4 w-4 mr-2" />
                  Capture Thought
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Capture Back of Mind Thought</DialogTitle>
                  <DialogDescription>
                    Store an idea or thought that you want to hold onto for the future.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="bomContent">Thought / Idea</Label>
                    <Textarea 
                      id="bomContent" 
                      placeholder="What's on your mind?"
                      value={bomContent}
                      onChange={(e) => setBomContent(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bomCategory">Category (Optional)</Label>
                    <Input 
                      id="bomCategory" 
                      placeholder="e.g., Project X, Philosophy, Future Biz"
                      value={bomCategory}
                      onChange={(e) => setBomCategory(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bomRelevance">Relevance / Urgency Score (1-10)</Label>
                    <Select value={bomRelevance} onValueChange={setBomRelevance}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select score" />
                      </SelectTrigger>
                      <SelectContent>
                        {[1,2,3,4,5,6,7,8,9,10].map(s => (
                          <SelectItem key={s} value={s.toString()}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsBomOpen(false)}>Cancel</Button>
                  <Button onClick={handleAddBom}>Save Thought</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bomItems.map((item) => (
              <Card key={item.id} className="bg-background/40 backdrop-blur-md border-white/5 hover:border-white/10 transition-all group">
                <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
                  <div className="flex flex-col gap-1">
                    {item.category && <Badge variant="outline" className="w-fit">{item.category}</Badge>}
                    <span className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleDateString()}</span>
                  </div>
                  <Badge variant={item.relevanceScore >= 8 ? "destructive" : item.relevanceScore >= 5 ? "default" : "secondary"}>
                    Score: {item.relevanceScore}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed">{item.content}</p>
                </CardContent>
                <CardFooter className="pt-2 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive/80" onClick={() => handleDeleteBom(item.id)}>
                    <X className="h-4 w-4 mr-1" />
                    Drop
                  </Button>
                </CardFooter>
              </Card>
            ))}
            {bomItems.length === 0 && (
              <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed border-white/10 rounded-xl bg-white/5">
                <Brain className="h-8 w-8 mx-auto mb-3 opacity-50" />
                <p>Your back of mind is empty.</p>
                <p className="text-sm opacity-70">Capture long-term thoughts here to unclutter your active workspace.</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* MISTAKE LOG TAB */}
        <TabsContent value="mistakes" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Feedback & Lessons Learned</h2>
            <Dialog open={isMistakeOpen} onOpenChange={setIsMistakeOpen}>
              <DialogTrigger asChild>
                <Button className="bg-destructive/20 text-destructive-foreground hover:bg-destructive/30 border border-destructive/30">
                  <Plus className="h-4 w-4 mr-2" />
                  Log Mistake
                </Button>
              </DialogTrigger>
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
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsMistakeOpen(false)}>Cancel</Button>
                  <Button onClick={handleAddMistake} variant="destructive">Log Learning</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4">
            {mistakes.map((entry) => (
              <Card key={entry.id} className={`bg-background/40 backdrop-blur-md border-l-4 transition-all group ${entry.status === 'open' ? 'border-l-destructive/80 border-white/5' : 'border-l-emerald-500/80 border-white/5'}`}>
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
                  <div className="pt-4 border-t border-white/5">
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
              <div className="py-12 text-center text-muted-foreground border border-dashed border-white/10 rounded-xl bg-white/5">
                <AlertTriangle className="h-8 w-8 mx-auto mb-3 opacity-50" />
                <p>No mistakes logged yet.</p>
                <p className="text-sm opacity-70">Acknowledge mistakes objectively to refine your process.</p>
              </div>
            )}
          </div>
        </TabsContent>
        
      </Tabs>
    </div>
  );
}
