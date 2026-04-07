/**
 * AutomationCanvas — Main ReactFlow canvas wrapper.
 *
 * Phase 4: Visual flow canvas replacing the vertical sortable list.
 * Integrates with useWorkflowBuilder hook for step CRUD.
 */

"use client";

import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import {
  ReactFlow,
  MiniMap,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Node,
  type Edge,
  ReactFlowProvider,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { TriggerNode } from "./nodes/TriggerNode";
import { ActionNode } from "./nodes/ActionNode";
import { ConditionNode } from "./nodes/ConditionNode";
import { DelayNode } from "./nodes/DelayNode";
import { LoopNode } from "./nodes/LoopNode";
import { EndNode } from "./nodes/EndNode";
import { NoteNode } from "./nodes/NoteNode";
import { DefaultEdge } from "./edges/DefaultEdge";
import { LoopbackEdge } from "./edges/LoopbackEdge";
import { CanvasControls } from "./CanvasControls";

import {
  stepsToNodesAndEdges,
  extractNodePositions,
  TRIGGER_NODE_ID,
} from "./utils/converters";
import { applyDagreLayout } from "./utils/layout";

import type { WorkflowStep, TriggerConfig } from "../../types/automation-types";

// ============================================================================
// NODE + EDGE TYPE REGISTRIES
// ============================================================================

const nodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  condition: ConditionNode,
  delay: DelayNode,
  loop: LoopNode,
  end: EndNode,
  note: NoteNode,
};

const edgeTypes = {
  "default-edge": DefaultEdge,
  "loopback-edge": LoopbackEdge,
};

// ============================================================================
// TYPES
// ============================================================================

interface AutomationCanvasProps {
  steps: WorkflowStep[];
  triggerConfig?: TriggerConfig;
  triggerType?: string;
  selectedStepId?: string;
  onStepClick: (step: WorkflowStep | null) => void;
  onStepDelete: (stepId: string) => void;
  onStepDuplicate?: (step: WorkflowStep) => void;
  onAddStep: (step: Partial<WorkflowStep>) => void;
  onUpdateStep?: (
    stepId: string,
    updates: Partial<
      Pick<WorkflowStep, "action_config" | "position_x" | "position_y">
    >,
  ) => void;
}

// ============================================================================
// INNER CANVAS (needs ReactFlowProvider context)
// ============================================================================

function CanvasInner({
  steps,
  triggerConfig,
  triggerType,
  selectedStepId,
  onStepClick,
  onStepDelete,
  onAddStep,
  onUpdateStep,
}: AutomationCanvasProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition, fitView } = useReactFlow();
  const [isLocked, setIsLocked] = useState(false);

  // Convert steps to nodes+edges
  const { initialNodes, initialEdges } = useMemo(() => {
    const { nodes, edges } = stepsToNodesAndEdges(steps, {
      triggerConfig,
      triggerType,
    });

    // Check if any node has persisted positions
    const hasPositions = steps.some((s) => s.position_x != null);

    const layoutNodes = hasPositions ? nodes : applyDagreLayout(nodes, edges);
    return { initialNodes: layoutNodes, initialEdges: edges };
  }, [steps, triggerConfig, triggerType]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync when steps change (compare by count or IDs)
  const stepsKey = steps.map((s) => s.id).join(",");
  useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = stepsToNodesAndEdges(steps, {
      triggerConfig,
      triggerType,
    });

    const hasPositions = steps.some((s) => s.position_x != null);
    const layoutNodes = hasPositions
      ? newNodes
      : applyDagreLayout(newNodes, newEdges);

    setNodes(layoutNodes);
    setEdges(newEdges);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepsKey]);

  // Fit view on initial load
  useEffect(() => {
    const timer = setTimeout(
      () => fitView({ padding: 0.2, duration: 300 }),
      100,
    );
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle edge connections
  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) =>
        addEdge({ ...connection, type: "default-edge", animated: false }, eds),
      );
    },
    [setEdges],
  );

  // Handle node click → select step
  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (node.id === TRIGGER_NODE_ID || node.id === "__end__") {
        onStepClick(null);
        return;
      }
      const step = steps.find((s) => s.id === node.id);
      if (step) onStepClick(step);
    },
    [steps, onStepClick],
  );

  // Handle node deletion
  const onNodesDelete = useCallback(
    (deleted: Node[]) => {
      for (const node of deleted) {
        if (node.id !== TRIGGER_NODE_ID && node.id !== "__end__") {
          onStepDelete(node.id);
        }
      }
    },
    [onStepDelete],
  );

  // Handle drag-and-drop from sidebar
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const stepType = event.dataTransfer.getData("application/reactflow-type");
      const actionType = event.dataTransfer.getData(
        "application/reactflow-action",
      );
      const name = event.dataTransfer.getData("application/reactflow-name");

      if (!stepType) return;

      // Handle note separately (not a workflow step)
      if (stepType === "note") {
        const position = screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });
        const noteNode: Node = {
          id: `note-${Date.now()}`,
          type: "note",
          position,
          data: { label: "Note", text: "" },
        };
        setNodes((nds) => [...nds, noteNode]);
        return;
      }

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      onAddStep({
        step_type: stepType as WorkflowStep["step_type"],
        action_type: actionType,
        name,
        position_x: Math.round(position.x),
        position_y: Math.round(position.y),
      });
    },
    [screenToFlowPosition, onAddStep, setNodes],
  );

  // Auto-layout
  const handleAutoLayout = useCallback(() => {
    const layoutNodes = applyDagreLayout(nodes, edges);
    setNodes(layoutNodes);

    // Persist positions
    if (onUpdateStep) {
      const positions = extractNodePositions(layoutNodes);
      for (const [stepId, pos] of positions) {
        onUpdateStep(stepId, pos);
      }
    }

    setTimeout(() => fitView({ padding: 0.2, duration: 300 }), 50);
  }, [nodes, edges, setNodes, fitView, onUpdateStep, steps]);

  // Handle node position save on drag end
  const onNodeDragStop = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (!onUpdateStep) return;
      if (node.id === TRIGGER_NODE_ID || node.id === "__end__") return;

      const step = steps.find((s) => s.id === node.id);
      if (step) {
        onUpdateStep(node.id, {
          position_x: Math.round(node.position.x),
          position_y: Math.round(node.position.y),
        });
      }
    },
    [onUpdateStep, steps],
  );

  return (
    <div ref={reactFlowWrapper} className="relative h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onNodesDelete={onNodesDelete}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        nodesDraggable={!isLocked}
        nodesConnectable={!isLocked}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        colorMode="dark"
        deleteKeyCode={["Backspace", "Delete"]}
        multiSelectionKeyCode="Shift"
        className="bg-muted/30"
        defaultEdgeOptions={{
          type: "default-edge",
          animated: false,
        }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
        <MiniMap
          position="bottom-right"
          className="!bg-background/80 !border !border-border !rounded-lg !shadow-md"
          nodeStrokeWidth={3}
          pannable
          zoomable
        />
      </ReactFlow>

      <CanvasControls
        onAutoLayout={handleAutoLayout}
        isLocked={isLocked}
        onToggleLock={() => setIsLocked((v) => !v)}
      />
    </div>
  );
}

// ============================================================================
// EXPORTED WRAPPER (provides ReactFlowProvider)
// ============================================================================

export function AutomationCanvas(props: AutomationCanvasProps) {
  return (
    <ReactFlowProvider>
      <CanvasInner {...props} />
    </ReactFlowProvider>
  );
}
