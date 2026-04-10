# Graph-Based Strategy Planning

## Overview

Add an Obsidian-style interactive graph view to Taskflow that allows users to visually plan strategy and see how tasks, goals, and habits are linked to each other.

## Motivation

- Makes it easy to see the big picture of how different tasks and goals relate
- Visual planning is more intuitive for strategy work
- Clearly shows dependencies and connections at a glance
- React Flow was explored and did not meet the desired experience

## Core Idea

Each node in the graph represents a task, goal, habit, or project. Edges between nodes represent relationships — dependencies, sub-tasks, influence, or any user-defined link. The result is a live map of the user's plans, similar to how Obsidian renders a knowledge graph.

## Features to Consider

- **Node types** — tasks, goals, habits, projects, milestones
- **Edge types** — depends on, leads to, part of, blocks
- **Interactive** — drag nodes, zoom, pan, click to open item details
- **Physics-based layout** — fluid, organic feel like Obsidian's graph
- **Filtering** — show only certain node types or tag groups
- **Bidirectional linking** — linking two items updates both

## Library Options

Avoid React Flow — it did not provide the right experience. Consider:

| Library | Notes |
|---|---|
| `d3-force` | Maximum control, physics simulation, steep learning curve |
| `vis-network` | Feature-rich, good physics, easy to get started |
| `sigma.js` | Performant for large graphs, WebGL rendering |
| `reagraph` | React-native graph lib, good aesthetics out of the box |

## Next Steps

1. Pick a graph library and prototype a basic node/edge render
2. Define the data model for nodes and edges (stored in DB)
3. Build UI for creating/editing links between items
4. Integrate with existing tasks, goals, and habits data
5. Add filtering and layout controls
