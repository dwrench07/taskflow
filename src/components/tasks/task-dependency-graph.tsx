"use client";

import { useEffect, useRef, useMemo, useState } from "react";
import cytoscape, { type Core, type ElementDefinition } from "cytoscape";
// @ts-ignore - no types ship with cytoscape-dagre
import dagre from "cytoscape-dagre";
import type { Task } from "@/lib/types";

if (typeof window !== "undefined") {
  try { cytoscape.use(dagre); } catch { /* already registered */ }
}

const STATUS_COLOR: Record<string, string> = {
  todo: "#3b82f6",
  "in-progress": "#f59e0b",
  done: "#10b981",
  abandoned: "#6b7280",
};

interface Props {
  tasks: Task[];
  hideCompleted: boolean;
  onSelect?: (taskId: string | null) => void;
}

export function TaskDependencyGraph({ tasks, hideCompleted, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const elements = useMemo<ElementDefinition[]>(() => {
    const byId = new Map(tasks.map((t) => [t.id, t]));
    const involved = new Set<string>();
    for (const t of tasks) {
      const hasDeps = (t.blockedBy?.length ?? 0) > 0 || (t.blocks?.length ?? 0) > 0;
      if (!hasDeps) continue;
      if (hideCompleted && t.status === "done") continue;
      involved.add(t.id);
      t.blockedBy?.forEach((id) => byId.has(id) && involved.add(id));
      t.blocks?.forEach((id) => byId.has(id) && involved.add(id));
    }

    const nodes: ElementDefinition[] = [];
    const edges: ElementDefinition[] = [];
    const edgeSeen = new Set<string>();

    involved.forEach((id) => {
      const t = byId.get(id);
      if (!t) return;
      if (hideCompleted && t.status === "done") return;
      nodes.push({
        data: {
          id: t.id,
          label: t.title,
          status: t.status,
          color: STATUS_COLOR[t.status] ?? "#6b7280",
        },
      });
    });

    const present = new Set(nodes.map((n) => n.data.id as string));

    tasks.forEach((t) => {
      // blockedBy: blocker -> t
      t.blockedBy?.forEach((blockerId) => {
        if (!present.has(t.id) || !present.has(blockerId)) return;
        const key = `${blockerId}->${t.id}`;
        if (edgeSeen.has(key)) return;
        edgeSeen.add(key);
        edges.push({ data: { id: key, source: blockerId, target: t.id } });
      });
      // blocks: t -> blocked
      t.blocks?.forEach((blockedId) => {
        if (!present.has(t.id) || !present.has(blockedId)) return;
        const key = `${t.id}->${blockedId}`;
        if (edgeSeen.has(key)) return;
        edgeSeen.add(key);
        edges.push({ data: { id: key, source: t.id, target: blockedId } });
      });
    });

    return [...nodes, ...edges];
  }, [tasks, hideCompleted]);

  useEffect(() => {
    if (!containerRef.current) return;

    const cy = cytoscape({
      container: containerRef.current,
      elements,
      style: [
        {
          selector: "node",
          style: {
            "background-color": "data(color)",
            label: "data(label)",
            color: "#e5e7eb",
            "font-size": 11,
            "text-wrap": "wrap",
            "text-max-width": "140px",
            "text-valign": "center",
            "text-halign": "center",
            "text-outline-width": 2,
            "text-outline-color": "#0f172a",
            width: 36,
            height: 36,
            "border-width": 2,
            "border-color": "#0f172a",
          },
        },
        {
          selector: "node:selected",
          style: {
            "border-color": "#ec4899",
            "border-width": 4,
          },
        },
        {
          selector: "node.faded",
          style: { opacity: 0.15 },
        },
        {
          selector: "node.highlighted",
          style: {
            "border-color": "#ec4899",
            "border-width": 3,
          },
        },
        {
          selector: "edge",
          style: {
            width: 2,
            "line-color": "#64748b",
            "target-arrow-color": "#64748b",
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
            opacity: 0.7,
          },
        },
        {
          selector: "edge.faded",
          style: { opacity: 0.08 },
        },
        {
          selector: "edge.highlighted",
          style: {
            "line-color": "#ec4899",
            "target-arrow-color": "#ec4899",
            width: 3,
            opacity: 1,
          },
        },
      ],
      layout: {
        name: "dagre",
        // @ts-ignore - dagre options not in core types
        rankDir: "LR",
        nodeSep: 40,
        rankSep: 90,
        animate: false,
      } as any,
      wheelSensitivity: 0.2,
    });

    cyRef.current = cy;

    cy.on("tap", "node", (evt) => {
      const id = evt.target.id() as string;
      setSelected(id);
      onSelect?.(id);
      const node = evt.target;
      const chain = node.predecessors().union(node.successors()).union(node);
      cy.elements().addClass("faded");
      chain.removeClass("faded").addClass("highlighted");
    });

    cy.on("tap", (evt) => {
      if (evt.target === cy) {
        setSelected(null);
        onSelect?.(null);
        cy.elements().removeClass("faded").removeClass("highlighted");
      }
    });

    return () => {
      cy.destroy();
      cyRef.current = null;
    };
  }, [elements, onSelect]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
      {elements.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground pointer-events-none">
          No task dependencies yet. Add blockers via a task's edit form to see the graph.
        </div>
      )}
    </div>
  );
}
