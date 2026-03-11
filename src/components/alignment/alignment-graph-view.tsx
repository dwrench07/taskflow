"use client";

import { useMemo, useCallback, useState, useEffect } from "react";
import { 
  ReactFlow, 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState,
  MarkerType,
  Handle,
  Position,
  NodeProps,
  Edge
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import type { Pillar, Milestone, Task } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Target, Flag, CheckCircle2, Circle, Lock } from "lucide-react";

// --- Custom Node Components ---

const PillarNode = ({ data }: NodeProps) => (
  <div className="px-4 py-2 shadow-lg rounded-full bg-background border-2 min-w-[150px] text-center" style={{ borderColor: data.color as string || '#3b82f6' }}>
    <Handle type="source" position={Position.Bottom} className="w-2 h-2" />
    <div className="flex items-center justify-center gap-2">
      <Target className="h-4 w-4" style={{ color: data.color as string || '#3b82f6' }} />
      <div className="font-bold text-sm">{data.label as string}</div>
    </div>
  </div>
);

const MilestoneNode = ({ data }: NodeProps) => (
  <div className="px-4 py-3 shadow-md rounded-md bg-card border-2 border-blue-500/50 min-w-[200px]">
    <Handle type="target" position={Position.Top} className="w-2 h-2" />
    <Handle type="source" position={Position.Bottom} className="w-2 h-2" />
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <Flag className="h-4 w-4 text-blue-500" />
        <div className="font-semibold text-sm">{data.label as string}</div>
      </div>
      <div className="text-xs text-muted-foreground text-right">{data.status as string}</div>
    </div>
  </div>
);

const TaskNode = ({ data }: NodeProps) => {
  const isDone = data.status === "done";
  const isBlocked = data.isBlocked as boolean;
  
  return (
    <div className={`px-3 py-2 shadow-sm rounded-md border min-w-[180px] ${isDone ? 'bg-muted/50 border-muted opacity-60' : isBlocked ? 'bg-red-500/5 border-red-500/30' : 'bg-background border-border'} transition-all`}>
      <Handle type="target" position={Position.Top} className="w-2 h-2 opacity-50" />
      <Handle type="source" position={Position.Bottom} className="w-2 h-2 flex opacity-50" />
      
      {/* Target handle for dependencies (side) */}
      <Handle type="target" position={Position.Left} id="dep-target" className="w-2 h-2 bg-rose-500" />
      {/* Source handle for dependencies (side) */}
      <Handle type="source" position={Position.Right} id="dep-source" className="w-2 h-2 bg-emerald-500" />

      <div className="flex items-center gap-2">
        {isDone ? (
          <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
        ) : isBlocked ? (
          <Lock className="h-3.5 w-3.5 text-red-500 shrink-0" />
        ) : (
          <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
        <div className={`text-xs font-medium truncate ${isDone ? 'line-through text-muted-foreground' : ''}`}>
          {data.label as string}
        </div>
      </div>
    </div>
  );
};

const nodeTypes = {
  pillarNode: PillarNode,
  milestoneNode: MilestoneNode,
  taskNode: TaskNode,
};

// --- Main Layout Component ---

interface AlignmentGraphViewProps {
  pillars: Pillar[];
  milestones: Milestone[];
  tasks: Task[];
}

export function AlignmentGraphView({ pillars, milestones, tasks }: AlignmentGraphViewProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Compute graph layout
  useEffect(() => {
    if (!pillars || !milestones || !tasks) return;

    // A very primitive auto-layout system (a real app would use dagre or elkjs for complex graphs)
    const newNodes: any[] = [];
    const newEdges: Edge[] = [];
    
    // Y-levels for our hierarchy
    const Y_PILLAR = 50;
    const Y_MILESTONE = 200;
    const Y_TASK_START = 350;

    let pCursorX = 100;
    
    pillars.forEach((pillar, pIndex) => {
      // Create Pillar Node
      newNodes.push({
        id: `p-${pillar.id}`,
        type: 'pillarNode',
        position: { x: pCursorX, y: Y_PILLAR },
        data: { label: pillar.title, color: pillar.color },
      });

      // Find embedded milestones
      const pMilestones = milestones.filter(m => m.pillarId === pillar.id);
      
      let mCursorX = pCursorX - ((Math.max(0, pMilestones.length - 1)) * 120);

      pMilestones.forEach((milestone, mIndex) => {
        // Create Milestone Node
        newNodes.push({
          id: `m-${milestone.id}`,
          type: 'milestoneNode',
          position: { x: mCursorX, y: Y_MILESTONE },
          data: { label: milestone.title, status: milestone.status },
        });

        // Edge: Pillar -> Milestone
        newEdges.push({
          id: `e-p${pillar.id}-m${milestone.id}`,
          source: `p-${pillar.id}`,
          target: `m-${milestone.id}`,
          type: 'smoothstep',
          animated: false,
          style: { stroke: pillar.color || '#9ca3af', strokeWidth: 2, opacity: 0.5 },
        });

        // Find embedded tasks
        const mTasks = tasks.filter(t => t.milestoneId === milestone.id);
        
        mTasks.forEach((task, tIndex) => {
          // Identify if it's blocked by scanning *all* tasks' blockedBy arrays
          const isBlocked = task.blockedBy && task.blockedBy.length > 0 && task.status !== "done";
          
          newNodes.push({
            id: `t-${task.id}`,
            type: 'taskNode',
            position: { x: mCursorX + (tIndex % 3) * 200 - 200, y: Y_TASK_START + Math.floor(tIndex / 3) * 80 },
            data: { 
              label: task.title, 
              status: task.status,
              isBlocked
            },
          });

          // Edge: Milestone -> Task
          newEdges.push({
            id: `e-m${milestone.id}-t${task.id}`,
            source: `m-${milestone.id}`,
            target: `t-${task.id}`,
            type: 'smoothstep',
            animated: task.status !== "done",
            style: { stroke: '#94a3b8', strokeWidth: 1.5, strokeDasharray: '5,5' },
          });
        });

        mCursorX += 300;
        if (mCursorX > pCursorX) pCursorX = mCursorX; // Push pillar cursor right
      });

      pCursorX += 400; // Spacing between pillars
    });

    // Handle cross-task dependencies (blockers)
    tasks.forEach(task => {
      if (task.blockedBy && task.blockedBy.length > 0) {
        task.blockedBy.forEach(blockerId => {
          // Verify blocker exists
          if (tasks.find(t => t.id === blockerId)) {
            newEdges.push({
              id: `dep-${blockerId}-${task.id}`,
              source: `t-${blockerId}`,
              sourceHandle: 'dep-source',
              target: `t-${task.id}`,
              targetHandle: 'dep-target',
              type: 'bezier',
              animated: true,
              style: { stroke: '#ef4444', strokeWidth: 2 },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: '#ef4444',
              },
            });
          }
        });
      }
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, [pillars, milestones, tasks, setNodes, setEdges]);

  if (!isClient) return null; // Avoid SSR react-flow mismatch

  return (
    <div className="w-full h-full bg-slate-50/50 dark:bg-slate-950/50">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-right"
        minZoom={0.2}
      >
        <Background gap={20} size={1} />
        <Controls />
      </ReactFlow>
    </div>
  );
}
