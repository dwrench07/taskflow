"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ListTree, Network, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { Pillar, Milestone, Task } from "@/lib/types";
import { getAllPillars, getAllMilestones, getAllTasks, addPillar, addMilestone } from "@/lib/data";

// Placeholder components that we will create next
import { AlignmentTreeView } from "@/components/alignment/alignment-tree-view";
import { AlignmentGraphView } from "@/components/alignment/alignment-graph-view";

export default function AlignmentPage() {
  const [pillars, setPillars] = useState<Pillar[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isPillarDialogOpen, setIsPillarDialogOpen] = useState(false);
  const [isMilestoneDialogOpen, setIsMilestoneDialogOpen] = useState(false);
  
  const [newPillar, setNewPillar] = useState({ title: "", description: "", color: "#3b82f6" });
  const [newMilestone, setNewMilestone] = useState({ title: "", description: "", pillarId: "" });
  
  const { toast } = useToast();

  useEffect(() => {
    fetchAlignmentData();
  }, []);

  const fetchAlignmentData = async () => {
    setIsLoading(true);
    try {
      const [pData, mData, tData] = await Promise.all([
        getAllPillars(),
        getAllMilestones(),
        getAllTasks()
      ]);
      setPillars(pData || []);
      setMilestones(mData || []);
      setTasks(tData || []);
    } catch (error) {
      console.error("Failed to fetch alignment data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePillar = async () => {
    if (!newPillar.title.trim()) return;
    try {
      const added = await addPillar({
        title: newPillar.title.trim(),
        description: newPillar.description.trim(),
        color: newPillar.color,
      });
      setPillars([...pillars, added]);
      setNewPillar({ title: "", description: "", color: "#3b82f6" });
      setIsPillarDialogOpen(false);
      toast({ title: "Pillar created", description: "Successfully added new pillar." });
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to create pillar.", variant: "destructive" });
    }
  };

  const handleCreateMilestone = async () => {
    if (!newMilestone.title.trim()) return;
    try {
      const added = await addMilestone({
        title: newMilestone.title.trim(),
        description: newMilestone.description.trim(),
        pillarId: newMilestone.pillarId || "",
        status: "active",
      });
      setMilestones([...milestones, added]);
      setNewMilestone({ title: "", description: "", pillarId: "" });
      setIsMilestoneDialogOpen(false);
      toast({ title: "Milestone created", description: "Successfully added new milestone." });
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to create milestone.", variant: "destructive" });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Alignment Engine</h1>
          <p className="text-muted-foreground mt-1 text-lg">
            Connect your daily tasks to high-level life pillars and milestones.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <Dialog open={isPillarDialogOpen} onOpenChange={setIsPillarDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Plus className="h-4 w-4" /> New Pillar
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Create Life Pillar</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input value={newPillar.title} onChange={(e) => setNewPillar({...newPillar, title: e.target.value})} placeholder="e.g., Health, Career" />
                </div>
                <div className="space-y-2">
                  <Label>Color Hex</Label>
                  <Input type="color" value={newPillar.color} onChange={(e) => setNewPillar({...newPillar, color: e.target.value})} className="h-10 px-2" />
                </div>
                <Button className="w-full" onClick={handleCreatePillar} disabled={!newPillar.title.trim()}>Save Pillar</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isMilestoneDialogOpen} onOpenChange={setIsMilestoneDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> New Milestone
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Create Milestone</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input value={newMilestone.title} onChange={(e) => setNewMilestone({...newMilestone, title: e.target.value})} placeholder="e.g., Run a 5K" />
                </div>
                <div className="space-y-2">
                  <Label>Attach to Pillar (Optional)</Label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                    value={newMilestone.pillarId}
                    onChange={(e) => setNewMilestone({...newMilestone, pillarId: e.target.value})}
                  >
                    <option value="">None</option>
                    {pillars.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                  </select>
                </div>
                <Button className="w-full" onClick={handleCreateMilestone} disabled={!newMilestone.title.trim()}>Save Milestone</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="list" className="w-full">
        <div className="flex justify-between items-center mb-6">
          <TabsList className="grid w-[200px] grid-cols-2">
            <TabsTrigger value="list" className="gap-2">
              <ListTree className="h-4 w-4" /> Tree
            </TabsTrigger>
            <TabsTrigger value="graph" className="gap-2">
              <Network className="h-4 w-4" /> Graph
            </TabsTrigger>
          </TabsList>
        </div>

        {isLoading ? (
          <div className="h-[600px] w-full rounded-md border border-dashed flex items-center justify-center">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4" />
              <p className="text-muted-foreground">Loading alignment engine...</p>
            </div>
          </div>
        ) : (
          <>
            <TabsContent value="list" className="mt-0 outline-none">
              <Card className="border-border">
                <CardHeader>
                  <CardTitle>Strategic Hierarchy</CardTitle>
                  <CardDescription>
                    Your life architecture structured from Pillars down to individual Tasks.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AlignmentTreeView 
                    pillars={pillars} 
                    milestones={milestones} 
                    tasks={tasks} 
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="graph" className="mt-0 h-[700px] outline-none">
              <Card className="h-full border-border flex flex-col">
                <CardHeader className="pb-2 flex-shrink-0">
                  <CardTitle>Dependency Graph</CardTitle>
                  <CardDescription>
                    Visual mapping of blocks and dependencies across your projects.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 p-0 overflow-hidden relative rounded-b-xl">
                  <AlignmentGraphView 
                    pillars={pillars} 
                    milestones={milestones} 
                    tasks={tasks} 
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}
