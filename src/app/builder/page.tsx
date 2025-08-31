"use client";
import React, { useEffect, useMemo, useState } from "react";
import {
  Node,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  Connection,
  NodeChange,
  EdgeChange,
} from "reactflow";
import "reactflow/dist/style.css";
import ConditionNode from "@/src/components/builder/ConditionNode";
import { RuleSchema } from "@/src/lib/validations";
import { toast } from "react-toastify";
import useFacts from "@/src/hooks/useFacts";
import useOutcomes from "@/src/hooks/useOutcomes";
import BuilderView from "@/src/components/builder/BuilderView";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/src/lib/routes";

const initialNodes: Node[] = [];

export default function BuilderPage() {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<any[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [ruleJson, setRuleJson] = useState<any | null>(null);
  const [validationErrors, setValidationErrors] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [ruleName, setRuleName] = useState("Generated rule");
  const [ruleDescription, setRuleDescription] = useState("");
  const [selectedOutcomeId, setSelectedOutcomeId] = useState<
    string | "new" | null
  >(null);
  const [newOutcomeType, setNewOutcomeType] = useState("");
  const [newOutcomeParams, setNewOutcomeParams] = useState("");

  const { facts, refresh: loadFacts } = useFacts();
  const { outcomes, refresh: loadOutcomes } = useOutcomes();

  const router = useRouter();

  const addConditionNode = () => {
    const id = `${Date.now()}`;
    setNodes((nds) => [
      ...nds,
      {
        id,
        type: "condition",
        position: { x: 200, y: 200 },
        data: {
          fact: "",
          operator: "equal",
          value: "",
          facts,
        },
      },
    ]);
  };

  const addGroupNode = () => {
    const id = `g_${Date.now()}`;
    setNodes((nds) => [
      ...nds,
      {
        id,
        type: "group",
        position: { x: 200, y: 200 },
        data: {
          mode: "all",
        },
      },
    ]);
  };

  const onNodesChange = (changes: NodeChange[]) =>
    setNodes((nds) => applyNodeChanges(changes, nds));
  const onEdgesChange = (changes: EdgeChange[]) =>
    setEdges((eds) => applyEdgeChanges(changes, eds));
  const onConnect = (connection: Connection) =>
    setEdges((eds) => addEdge(connection, eds));

  const onNodeClick = (evt: React.MouseEvent, node: Node) =>
    setSelectedNode(node as Node);

  const handleFactChange = (val: string) => {
    if (!selectedNode) return;
    const nid = selectedNode.id;
    setNodes((prev) =>
      prev.map((n) =>
        n.id === nid ? { ...n, data: { ...(n.data || {}), fact: val } } : n
      )
    );
    setSelectedNode((prev) =>
      prev ? { ...prev, data: { ...(prev.data || {}), fact: val } } : prev
    );
  };

  const handleOperatorChange = (val: string) => {
    if (!selectedNode) return;
    const nid = selectedNode.id;
    setNodes((prev) =>
      prev.map((n) =>
        n.id === nid ? { ...n, data: { ...(n.data || {}), operator: val } } : n
      )
    );
    setSelectedNode((prev) =>
      prev ? { ...prev, data: { ...(prev.data || {}), operator: val } } : prev
    );
  };

  const handleValueChange = (val: string) => {
    if (!selectedNode) return;
    const nid = selectedNode.id;
    setNodes((prev) =>
      prev.map((n) =>
        n.id === nid ? { ...n, data: { ...(n.data || {}), value: val } } : n
      )
    );
    setSelectedNode((prev) =>
      prev ? { ...prev, data: { ...(prev.data || {}), value: val } } : prev
    );
  };

  const handleDeleteNode = () => {
    if (!selectedNode) return;
    const nid = selectedNode.id;
    setNodes((nds) => nds.filter((n) => n.id !== nid));
    setEdges((eds) => eds.filter((e) => e.source !== nid && e.target !== nid));
    setSelectedNode(null);
  };

  const handleOutcomeSelect = (v: string) => {
    if (v === "__new") setSelectedOutcomeId("new");
    else setSelectedOutcomeId(v || null);
  };

  const handleNewOutcomeTypeChange = (v: string) => setNewOutcomeType(v);
  const handleNewOutcomeParamsChange = (v: string) => setNewOutcomeParams(v);

  const handleRuleNameChange = (v: string) => setRuleName(v);
  const handleRuleDescriptionChange = (v: string) => setRuleDescription(v);

  // Event wrappers for JSX onChange handlers
  const handleFactChangeEvent = (e: React.ChangeEvent<HTMLSelectElement>) =>
    handleFactChange(e.target.value);
  const handleOperatorChangeEvent = (e: React.ChangeEvent<HTMLInputElement>) =>
    handleOperatorChange(e.target.value);
  const handleValueChangeEvent = (e: React.ChangeEvent<HTMLInputElement>) =>
    handleValueChange(e.target.value);
  const handleOutcomeSelectEvent = (e: React.ChangeEvent<HTMLSelectElement>) =>
    handleOutcomeSelect(e.target.value);
  const handleNewOutcomeTypeChangeEvent = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => handleNewOutcomeTypeChange(e.target.value);
  const handleNewOutcomeParamsChangeEvent = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => handleNewOutcomeParamsChange(e.target.value);
  const handleRuleNameChangeEvent = (e: React.ChangeEvent<HTMLInputElement>) =>
    handleRuleNameChange(e.target.value);
  const handleRuleDescriptionChangeEvent = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => handleRuleDescriptionChange(e.target.value);

  const handleSaveRule = async () => {
    if (!ruleJson) {
      toast.error("Generate rule JSON first");
      return;
    }

    // Basic validation: ensure there is at least one condition
    const condObj = ruleJson?.conditions || ruleJson;
    const hasConditions = Boolean(
      (condObj && Array.isArray(condObj.all) && condObj.all.length > 0) ||
        (condObj && Array.isArray(condObj.any) && condObj.any.length > 0)
    );
    if (!hasConditions) {
      setValidationErrors("Add at least one condition before saving the rule.");
      toast.error("Add at least one condition before saving");
      return;
    }

    // Validate metadata required by RuleSchema
    if (!ruleName || !ruleName.trim()) {
      setValidationErrors("Rule name is required");
      toast.error("Rule name is required");
      return;
    }
    if (!ruleDescription || !ruleDescription.trim()) {
      setValidationErrors("Rule description is required");
      toast.error("Rule description is required");
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        rule: {
          name: ruleName,
          description: ruleDescription,
          json_conditions: ruleJson,
        },
      };
      if (selectedOutcomeId === "new") {
        const params = JSON.parse(newOutcomeParams || "{}");
        payload.outcome = { type: newOutcomeType, params };
      } else if (selectedOutcomeId) {
        payload.rule.event_id = selectedOutcomeId;
      }

      const res = await fetch("/api/builder/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Save failed");
      const createdId = j.rule?.[0]?.id;
      toast.success("Rule and outcome saved");
      if (createdId) router.push(ROUTES.RULE_EDIT(createdId));
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const nodeTypes = useMemo(
    () => ({
      condition: ConditionNode,
    }),
    []
  );

  const parseValueForOperator = (op: string | undefined, raw: any) => {
    if (raw === undefined || raw === null) return raw;
    if (op === "in" || op === "notIn") {
      if (typeof raw === "string") {
        const trimmed = raw.trim();
        try {
          if (trimmed.startsWith("[") && trimmed.endsWith("]"))
            return JSON.parse(trimmed);
        } catch (e) {}
        return trimmed
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }
      return raw;
    }
    if (raw === "true" || raw === "false") return raw === "true";
    if (!isNaN(Number(raw))) return Number(raw);
    return raw;
  };

  const generateRuleJson = () => {
    setValidationErrors(null);
    const groupNodes = nodes.filter((n) => n.type === "group");

    const makeConditionFromNode = (n: Node) => {
      const d = n.data || {};
      return {
        fact: d.fact,
        operator: d.operator,
        value: parseValueForOperator(d.operator, d.value),
      };
    };

    let json: any;

    if (groupNodes.length > 0) {
      const g = groupNodes[0];
      const children = edges
        .filter(
          (e) =>
            e.source === g.id &&
            nodes.find((n) => n.id === e.target && n.type === "condition")
        )
        .map((e) => nodes.find((n) => n.id === e.target)!) as Node[];
      const conditions = children.map((n) => makeConditionFromNode(n));
      const mode = (g.data && g.data.mode) || "all";
      json = { conditions: { [mode === "any" ? "any" : "all"]: conditions } };
    } else {
      const conditionNodes = nodes.filter((n) => n.type === "condition");
      const conditions = conditionNodes.map((n) => makeConditionFromNode(n));

      const missing = conditions
        .map((c, idx) => ({ idx, c }))
        .filter((x) => !x.c.fact || !x.c.operator)
        .map((x) => `condition[${x.idx}] missing fact/operator`);
      if (missing.length) {
        setValidationErrors(missing.join("; "));
        setRuleJson(null);
        return;
      }

      json = { conditions: { all: conditions } };
    }

    const toValidate = {
      name: ruleName || "Generated rule",
      description: ruleDescription || "",
      json_conditions: json,
    };
    const parsed = RuleSchema.safeParse(toValidate as any);
    if (!parsed.success) {
      setValidationErrors(JSON.stringify(parsed.error.format(), null, 2));
      setRuleJson(null);
      return;
    }

    setRuleJson(json);
  };

  useEffect(() => {
    loadFacts();
    loadOutcomes();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedNode(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <BuilderView
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      nodeTypes={nodeTypes}
      onNodeClick={onNodeClick}
      addConditionNode={addConditionNode}
      addGroupNode={addGroupNode}
      selectedNode={selectedNode}
      facts={facts}
      handleFactChangeEvent={handleFactChangeEvent}
      handleOperatorChangeEvent={handleOperatorChangeEvent}
      handleValueChangeEvent={handleValueChangeEvent}
      handleDeleteNode={handleDeleteNode}
      generateRuleJson={generateRuleJson}
      ruleJson={ruleJson}
      handleSaveRule={handleSaveRule}
      saving={saving}
      ruleName={ruleName}
      handleRuleNameChangeEvent={handleRuleNameChangeEvent}
      ruleDescription={ruleDescription}
      handleRuleDescriptionChangeEvent={handleRuleDescriptionChangeEvent}
      selectedOutcomeId={selectedOutcomeId}
      handleOutcomeSelectEvent={handleOutcomeSelectEvent}
      outcomes={outcomes}
      newOutcomeType={newOutcomeType}
      handleNewOutcomeTypeChangeEvent={handleNewOutcomeTypeChangeEvent}
      newOutcomeParams={newOutcomeParams}
      handleNewOutcomeParamsChangeEvent={handleNewOutcomeParamsChangeEvent}
      validationErrors={validationErrors}
    />
  );
}
