"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
  Handle,
  Position,
  NodeProps,
  Edge,
  Connection,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Sparkles,
  Link2,
  Trash2,
  Pencil,
  X,
} from "lucide-react";
import type { Interest, InterestConnection, Priority } from "@/lib/types";
import {
  getAllInterests,
  addInterest,
  updateInterest,
  deleteInterest,
  getAllInterestConnections,
  addInterestConnection,
  deleteInterestConnection,
} from "@/lib/data";

// --- Category Colors ---
const CATEGORY_COLORS: Record<string, string> = {
  Tech: "#6366f1",
  Art: "#ec4899",
  Health: "#10b981",
  Science: "#f59e0b",
  Music: "#8b5cf6",
  Business: "#06b6d4",
  Sports: "#ef4444",
  Education: "#14b8a6",
  Social: "#f97316",
  Other: "#6b7280",
};

const PRIORITY_SIZES: Record<Priority, number> = {
  low: 120,
  medium: 140,
  high: 160,
  urgent: 180,
};

function getColor(interest: Interest): string {
  if (interest.color) return interest.color;
  if (interest.category && CATEGORY_COLORS[interest.category])
    return CATEGORY_COLORS[interest.category];
  return "#6b7280";
}

// --- Custom Node ---
const InterestNode = ({ data }: NodeProps) => {
  const color = data.color as string;
  const priority = data.priority as string;
  const category = data.category as string;

  return (
    <div
      className="group relative cursor-pointer transition-all duration-200 hover:scale-105"
      style={{ minWidth: PRIORITY_SIZES[(priority as Priority) || "medium"] }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-white/20 !border-2 group-hover:!bg-white/60"
        style={{ borderColor: color }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-white/20 !border-2 group-hover:!bg-white/60"
        style={{ borderColor: color }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!w-3 !h-3 !bg-white/20 !border-2 group-hover:!bg-white/60"
        style={{ borderColor: color }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!w-3 !h-3 !bg-white/20 !border-2 group-hover:!bg-white/60"
        style={{ borderColor: color }}
      />

      <div
        className="rounded-2xl px-5 py-3 shadow-lg border-2"
        style={{
          borderColor: color,
          backgroundColor: `${color}10`,
        }}
      >
        <div className="flex items-center gap-2 mb-1">
          <div
            className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
            style={{ backgroundColor: color }}
          />
          <span className="font-semibold text-sm text-foreground truncate">
            {data.label as string}
          </span>
        </div>
        {category && (
          <span
            className="text-[10px] font-medium px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: `${color}20`,
              color: color,
            }}
          >
            {category}
          </span>
        )}
      </div>
    </div>
  );
};

const nodeTypes = { interestNode: InterestNode };

// --- Main Page ---
export default function InterestsPage() {
  const [interests, setInterests] = useState<Interest[]>([]);
  const [connections, setConnections] = useState<InterestConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isConnectOpen, setIsConnectOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Interest | null>(null);

  const [editingInterest, setEditingInterest] = useState<Interest | null>(null);
  const [newInterest, setNewInterest] = useState({
    name: "",
    description: "",
    category: "",
    priority: "medium" as Priority,
    color: "",
  });
  const [newConnection, setNewConnection] = useState({
    sourceId: "",
    targetId: "",
    label: "",
    strength: 5,
  });

  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [iData, cData] = await Promise.all([
        getAllInterests(),
        getAllInterestConnections(),
      ]);
      setInterests(iData || []);
      setConnections(cData || []);
    } catch (error) {
      console.error("Failed to fetch interest data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Build graph from data
  useEffect(() => {
    if (!interests) return;

    // Layout: arrange in a force-directed-like grid
    const cols = Math.max(3, Math.ceil(Math.sqrt(interests.length)));
    const spacingX = 280;
    const spacingY = 180;

    const newNodes = interests.map((interest, idx) => ({
      id: interest.id,
      type: "interestNode",
      position: {
        x: (idx % cols) * spacingX + Math.random() * 40 - 20,
        y: Math.floor(idx / cols) * spacingY + Math.random() * 30 - 15,
      },
      data: {
        label: interest.name,
        color: getColor(interest),
        priority: interest.priority,
        category: interest.category || "",
        interestId: interest.id,
      },
    }));

    const newEdges: Edge[] = connections.map((conn) => ({
      id: conn.id,
      source: conn.sourceId,
      target: conn.targetId,
      type: "bezier",
      animated: true,
      label: conn.label || undefined,
      style: {
        stroke: "#94a3b8",
        strokeWidth: Math.max(1, Math.min(4, (conn.strength || 5) / 2.5)),
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: "#94a3b8",
      },
      labelStyle: {
        fill: "#94a3b8",
        fontSize: 11,
        fontWeight: 500,
      },
    }));

    setNodes(newNodes);
    setEdges(newEdges);
  }, [interests, connections, setNodes, setEdges]);

  // Handle new connection via drag in graph
  const onConnect = useCallback(
    async (connection: Connection) => {
      if (!connection.source || !connection.target) return;
      if (connection.source === connection.target) return;

      try {
        const added = await addInterestConnection({
          sourceId: connection.source,
          targetId: connection.target,
          label: "",
          strength: 5,
        });
        setConnections((prev) => [...prev, added]);
        toast({ title: "Connected", description: "Interests linked together." });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to connect interests.",
          variant: "destructive",
        });
      }
    },
    [toast]
  );

  const handleAddInterest = async () => {
    if (!newInterest.name.trim()) return;
    try {
      const added = await addInterest({
        name: newInterest.name.trim(),
        description: newInterest.description.trim(),
        category: newInterest.category || undefined,
        priority: newInterest.priority,
        color: newInterest.color || undefined,
      } as any);
      setInterests((prev) => [...prev, added]);
      setNewInterest({
        name: "",
        description: "",
        category: "",
        priority: "medium",
        color: "",
      });
      setIsAddOpen(false);
      toast({ title: "Interest added", description: `"${added.name}" created.` });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add interest.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateInterest = async () => {
    if (!editingInterest) return;
    try {
      await updateInterest(editingInterest);
      setInterests((prev) =>
        prev.map((i) => (i.id === editingInterest.id ? editingInterest : i))
      );
      setIsEditOpen(false);
      setEditingInterest(null);
      toast({ title: "Updated", description: "Interest updated." });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update interest.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteInterest = async () => {
    if (!deleteTarget) return;
    try {
      await deleteInterest(deleteTarget.id);
      setInterests((prev) => prev.filter((i) => i.id !== deleteTarget.id));
      setConnections((prev) =>
        prev.filter(
          (c) =>
            c.sourceId !== deleteTarget.id && c.targetId !== deleteTarget.id
        )
      );
      setDeleteTarget(null);
      toast({ title: "Deleted", description: "Interest and its connections removed." });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete interest.",
        variant: "destructive",
      });
    }
  };

  const handleAddConnection = async () => {
    if (!newConnection.sourceId || !newConnection.targetId) return;
    if (newConnection.sourceId === newConnection.targetId) {
      toast({
        title: "Invalid",
        description: "Cannot connect an interest to itself.",
        variant: "destructive",
      });
      return;
    }
    try {
      const added = await addInterestConnection({
        sourceId: newConnection.sourceId,
        targetId: newConnection.targetId,
        label: newConnection.label || undefined,
        strength: newConnection.strength,
      } as any);
      setConnections((prev) => [...prev, added]);
      setNewConnection({ sourceId: "", targetId: "", label: "", strength: 5 });
      setIsConnectOpen(false);
      toast({ title: "Connected", description: "Interests linked." });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect interests.",
        variant: "destructive",
      });
    }
  };

  const handleNodeClick = useCallback(
    (_: any, node: any) => {
      const interest = interests.find((i) => i.id === node.id);
      if (interest) {
        setEditingInterest({ ...interest });
        setIsEditOpen(true);
      }
    },
    [interests]
  );

  // Group interests by category for side panel
  const grouped = useMemo(() => {
    const groups: Record<string, Interest[]> = {};
    interests.forEach((i) => {
      const cat = i.category || "Uncategorized";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(i);
    });
    return groups;
  }, [interests]);

  const categoryNames = Object.keys(CATEGORY_COLORS);

  if (!isClient) return null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-primary" />
            Interest Graph
          </h1>
          <p className="text-muted-foreground mt-1 text-lg">
            Map, connect, and prioritize your interests visually.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Add Interest Dialog */}
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> New Interest
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Interest</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input
                    value={newInterest.name}
                    onChange={(e) =>
                      setNewInterest({ ...newInterest, name: e.target.value })
                    }
                    placeholder="e.g., Machine Learning, Guitar, Photography"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    value={newInterest.description}
                    onChange={(e) =>
                      setNewInterest({
                        ...newInterest,
                        description: e.target.value,
                      })
                    }
                    placeholder="Brief description..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                      value={newInterest.category}
                      onValueChange={(v) =>
                        setNewInterest({ ...newInterest, category: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryNames.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-2.5 h-2.5 rounded-full"
                                style={{
                                  backgroundColor: CATEGORY_COLORS[cat],
                                }}
                              />
                              {cat}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select
                      value={newInterest.priority}
                      onValueChange={(v) =>
                        setNewInterest({
                          ...newInterest,
                          priority: v as Priority,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Color Override</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      value={newInterest.color || "#6b7280"}
                      onChange={(e) =>
                        setNewInterest({ ...newInterest, color: e.target.value })
                      }
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <span className="text-xs text-muted-foreground">
                      Leave default to use category color
                    </span>
                    {newInterest.color && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setNewInterest({ ...newInterest, color: "" })
                        }
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={handleAddInterest}
                  disabled={!newInterest.name.trim()}
                  className="w-full"
                >
                  Add Interest
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Connect Dialog */}
          <Dialog open={isConnectOpen} onOpenChange={setIsConnectOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2" disabled={interests.length < 2}>
                <Link2 className="h-4 w-4" /> Connect
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Connect Interests</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>From</Label>
                  <Select
                    value={newConnection.sourceId}
                    onValueChange={(v) =>
                      setNewConnection({ ...newConnection, sourceId: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select interest..." />
                    </SelectTrigger>
                    <SelectContent>
                      {interests.map((i) => (
                        <SelectItem key={i.id} value={i.id}>
                          {i.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>To</Label>
                  <Select
                    value={newConnection.targetId}
                    onValueChange={(v) =>
                      setNewConnection({ ...newConnection, targetId: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select interest..." />
                    </SelectTrigger>
                    <SelectContent>
                      {interests
                        .filter((i) => i.id !== newConnection.sourceId)
                        .map((i) => (
                          <SelectItem key={i.id} value={i.id}>
                            {i.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Relationship Label</Label>
                  <Input
                    value={newConnection.label}
                    onChange={(e) =>
                      setNewConnection({
                        ...newConnection,
                        label: e.target.value,
                      })
                    }
                    placeholder='e.g., "enables", "related to", "inspires"'
                  />
                </div>
                <div className="space-y-2">
                  <Label>
                    Strength ({newConnection.strength}/10)
                  </Label>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={newConnection.strength}
                    onChange={(e) =>
                      setNewConnection({
                        ...newConnection,
                        strength: parseInt(e.target.value),
                      })
                    }
                    className="w-full accent-primary"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={handleAddConnection}
                  disabled={
                    !newConnection.sourceId || !newConnection.targetId
                  }
                  className="w-full"
                >
                  Create Connection
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats bar */}
      {interests.length > 0 && (
        <div className="flex flex-wrap gap-3">
          <Badge variant="secondary" className="text-xs px-3 py-1">
            {interests.length} interest{interests.length !== 1 ? "s" : ""}
          </Badge>
          <Badge variant="secondary" className="text-xs px-3 py-1">
            {connections.length} connection{connections.length !== 1 ? "s" : ""}
          </Badge>
          <Badge variant="secondary" className="text-xs px-3 py-1">
            {Object.keys(grouped).length} categor{Object.keys(grouped).length !== 1 ? "ies" : "y"}
          </Badge>
        </div>
      )}

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Graph View */}
        <Card className="lg:col-span-3 border-border overflow-hidden">
          <CardContent className="p-0 h-[650px] relative">
            {isLoading ? (
              <div className="h-full w-full flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center">
                  <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4" />
                  <p className="text-muted-foreground">
                    Loading interest graph...
                  </p>
                </div>
              </div>
            ) : interests.length === 0 ? (
              <div className="h-full w-full flex flex-col items-center justify-center gap-4 p-8 text-center">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-10 w-10 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">
                    Start Mapping Your Interests
                  </h3>
                  <p className="text-muted-foreground max-w-md">
                    Add your interests and connect them to build a visual map.
                    See how your passions relate to each other and discover
                    patterns.
                  </p>
                </div>
                <Button
                  onClick={() => setIsAddOpen(true)}
                  className="gap-2 mt-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Your First Interest
                </Button>
              </div>
            ) : (
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={handleNodeClick}
                nodeTypes={nodeTypes}
                fitView
                attributionPosition="bottom-right"
                minZoom={0.15}
                maxZoom={2}
                snapToGrid
                snapGrid={[20, 20]}
                className="bg-slate-50/50 dark:bg-slate-950/50"
              >
                <Background
                  variant={BackgroundVariant.Dots}
                  gap={24}
                  size={1.5}
                  color="rgba(148, 163, 184, 0.15)"
                />
                <Controls className="bg-background border-border" />
                <MiniMap
                  nodeColor={(n) => (n.data?.color as string) || "#6b7280"}
                  maskColor="rgba(0, 0, 0, 0.1)"
                  className="bg-background border-border rounded-lg"
                />
              </ReactFlow>
            )}
          </CardContent>
        </Card>

        {/* Side panel — category list */}
        <Card className="border-border max-h-[650px] overflow-y-auto">
          <CardHeader className="pb-3 sticky top-0 bg-card z-10">
            <CardTitle className="text-base">By Category</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            {Object.keys(grouped).length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No interests yet. Click &ldquo;New Interest&rdquo; to start.
              </p>
            ) : (
              Object.entries(grouped)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([category, items]) => (
                  <div key={category}>
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{
                          backgroundColor:
                            CATEGORY_COLORS[category] || "#6b7280",
                        }}
                      />
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {category}
                      </span>
                      <Badge variant="outline" className="text-[10px] h-4 px-1.5 ml-auto">
                        {items.length}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      {items.map((interest) => (
                        <div
                          key={interest.id}
                          className="group flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-muted/50 transition-colors cursor-pointer"
                          onClick={() => {
                            setEditingInterest({ ...interest });
                            setIsEditOpen(true);
                          }}
                        >
                          <span className="text-sm truncate">
                            {interest.name}
                          </span>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingInterest({ ...interest });
                                setIsEditOpen(true);
                              }}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteTarget(interest);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Interest</DialogTitle>
          </DialogHeader>
          {editingInterest && (
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={editingInterest.name}
                  onChange={(e) =>
                    setEditingInterest({
                      ...editingInterest,
                      name: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={editingInterest.description || ""}
                  onChange={(e) =>
                    setEditingInterest({
                      ...editingInterest,
                      description: e.target.value,
                    })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={editingInterest.category || ""}
                    onValueChange={(v) =>
                      setEditingInterest({ ...editingInterest, category: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryNames.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2.5 h-2.5 rounded-full"
                              style={{
                                backgroundColor: CATEGORY_COLORS[cat],
                              }}
                            />
                            {cat}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select
                    value={editingInterest.priority}
                    onValueChange={(v) =>
                      setEditingInterest({
                        ...editingInterest,
                        priority: v as Priority,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="color"
                    value={editingInterest.color || getColor(editingInterest)}
                    onChange={(e) =>
                      setEditingInterest({
                        ...editingInterest,
                        color: e.target.value,
                      })
                    }
                    className="w-12 h-10 p-1 cursor-pointer"
                  />
                  {editingInterest.color && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setEditingInterest({
                          ...editingInterest,
                          color: undefined,
                        })
                      }
                    >
                      Reset
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button
              variant="destructive"
              onClick={() => {
                setIsEditOpen(false);
                if (editingInterest) setDeleteTarget(editingInterest);
              }}
              className="gap-1"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </Button>
            <Button onClick={handleUpdateInterest}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete &ldquo;{deleteTarget?.name}&rdquo;?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this interest and all its
              connections. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteInterest}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
