"use client";
import React, { useMemo, useState } from "react";
import Button from "@/src/components/ui/atoms/Button";
import Select from "@/src/components/ui/atoms/Select";
import Input from "@/src/components/ui/atoms/Input";
import { operatorCompatibility, operatorLabels } from "@/src/lib/operators";

// Minimal tree types
type ConditionNode = { id: string; fact: string; operator: string; value: any };
type GroupNode = {
  id: string;
  op: "all" | "any";
  children: Array<GroupNode | ConditionNode>;
};

function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

export default function RuleConditionBuilder({
  initialTree,
  facts,
  onChange,
}: {
  initialTree?: GroupNode;
  facts?: any[];
  onChange?: (tree: GroupNode, errors?: Record<string, any>) => void;
}) {
  const defaultTree: GroupNode = initialTree || {
    id: uid("g"),
    op: "all",
    children: [],
  };
  const [tree, setTree] = useState<GroupNode>(defaultTree);
  const [errors, setErrors] = useState<
    Record<string, { fact?: string; operator?: string; value?: string }>
  >({});

  const runValidation = (root: GroupNode) => {
    const errs: Record<string, any> = {};
    const walk = (node: any) => {
      if (node.children) {
        // empty group is invalid
        if (!node.children || node.children.length === 0) {
          errs[node.id] = {
            group: "Group must contain at least one condition",
          };
          return;
        }
        return node.children.forEach(walk);
      }
      const id = node.id;
      const fact = node.fact;
      const op = node.operator;
      const val = node.value;
      const e: any = {};
      if (!fact) e.fact = "Select a fact";
      const factMeta = (facts || []).find((f: any) => f.name === fact);
      const ftype = factMeta?.type || "string";
      const allowed = operatorCompatibility[ftype] || [];
      if (op && allowed && !allowed.includes(op))
        e.operator = `Operator not valid for ${ftype}`;
      if (!op) e.operator = "Operator required";
      if (op && op !== "exists" && (val === undefined || val === ""))
        e.value = "Value required";
      if (Object.keys(e).length) errs[id] = e;
    };
    walk(root);
    setErrors(errs);
    return errs;
  };

  const updateTree = (next: GroupNode) => {
    setTree(next as GroupNode);
    const errs = runValidation(next);
    onChange?.(next as GroupNode, errs);
  };

  const addCondition = (parentId: string) => {
    const c: ConditionNode = {
      id: uid("c"),
      fact: "",
      operator: "",
      value: "",
    };
    const walk = (n: GroupNode): GroupNode => {
      if (n.id === parentId) return { ...n, children: [...n.children, c] };
      return {
        ...n,
        children: n.children.map((ch) =>
          "children" in ch ? walk(ch as GroupNode) : ch
        ),
      };
    };
    const next = walk(tree);
    updateTree(next as GroupNode);
  };

  const addGroup = (parentId: string) => {
    const g: GroupNode = { id: uid("g"), op: "any", children: [] };
    const walk = (n: GroupNode): GroupNode => {
      if (n.id === parentId) return { ...n, children: [...n.children, g] };
      return {
        ...n,
        children: n.children.map((ch) =>
          "children" in ch ? walk(ch as GroupNode) : ch
        ),
      };
    };
    const next = walk(tree);
    updateTree(next as GroupNode);
  };

  // Handlers without inline functions in JSX: use data-* attrs to carry ids
  const handleGroupOpChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const gid = (e.currentTarget as HTMLSelectElement).dataset.group as string;
    const op = e.currentTarget.value as "all" | "any";
    if (!gid) return;
    const walk = (node: GroupNode): GroupNode => {
      if (node.id === gid) return { ...node, op };
      return {
        ...node,
        children: node.children.map((ch) =>
          "children" in ch ? walk(ch as GroupNode) : ch
        ),
      };
    };
    const next = walk(tree);
    updateTree(next as GroupNode);
  };

  const handleAddConditionClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const gid = (e.currentTarget as HTMLButtonElement).dataset.group as string;
    if (!gid) return;
    addCondition(gid);
  };

  const handleAddGroupClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const gid = (e.currentTarget as HTMLButtonElement).dataset.group as string;
    if (!gid) return;
    addGroup(gid);
  };

  const handleFactChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cid = (e.currentTarget as HTMLSelectElement).dataset.cond as string;
    const fact = e.currentTarget.value;
    if (!cid) return;
    const walk = (node: GroupNode): GroupNode => ({
      ...node,
      children: node.children.map((ch) => {
        if ((ch as any).id === cid) return { ...(ch as any), fact };
        if ((ch as any).children) return walk(ch as GroupNode);
        return ch;
      }),
    });
    const next = walk(tree);
    updateTree(next as GroupNode);
  };

  const handleOperatorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cid = (e.currentTarget as HTMLSelectElement).dataset.cond as string;
    const operator = e.currentTarget.value;
    if (!cid) return;
    const walk = (node: GroupNode): GroupNode => ({
      ...node,
      children: node.children.map((ch) => {
        if ((ch as any).id === cid) return { ...(ch as any), operator };
        if ((ch as any).children) return walk(ch as GroupNode);
        return ch;
      }),
    });
    const next = walk(tree);
    updateTree(next as GroupNode);
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cid = (e.currentTarget as HTMLInputElement).dataset.cond as string;
    const value = e.currentTarget.value;
    if (!cid) return;
    const walk = (node: GroupNode): GroupNode => ({
      ...node,
      children: node.children.map((ch) => {
        if ((ch as any).id === cid) return { ...(ch as any), value };
        if ((ch as any).children) return walk(ch as GroupNode);
        return ch;
      }),
    });
    const next = walk(tree);
    updateTree(next as GroupNode);
  };

  const removeNodeById = (id: string) => {
    const walk = (node: GroupNode): GroupNode => ({
      ...node,
      children: node.children
        .filter((ch) => (ch as any).id !== id)
        .map((ch) => ("children" in ch ? walk(ch as GroupNode) : ch)),
    });
    const next = walk(tree);
    updateTree(next as GroupNode);
  };

  const handleRemoveClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const id = (e.currentTarget as HTMLButtonElement).dataset.id as string;
    if (!id) return;
    // prevent removing root
    if (id === tree.id) return;
    removeNodeById(id);
  };

  const renderNode = (n: GroupNode | ConditionNode) => {
    if ((n as any).children) {
      const g = n as GroupNode;
      return (
        <div key={g.id} className="bg-gray-50 border rounded p-3 space-y-3">
          <div className="flex items-center gap-3">
            <div className="text-sm font-medium">Group</div>
            <Select
              data-group={g.id}
              value={g.op}
              onChange={handleGroupOpChange}
              options={[
                { value: "all", label: "All (AND)" },
                { value: "any", label: "Any (OR)" },
              ]}
            />
            <div className="ml-auto flex items-center gap-2">
              <Button
                type="button"
                data-group={g.id}
                onClick={handleAddConditionClick}
                className="px-2 py-1 text-sm">
                Add condition
              </Button>
              <Button
                type="button"
                data-group={g.id}
                onClick={handleAddGroupClick}
                className="px-2 py-1 text-sm">
                Add group
              </Button>
              <Button
                type="button"
                data-id={g.id}
                onClick={handleRemoveClick}
                className="px-2 py-1 text-sm bg-red-100 text-red-700">
                Remove group
              </Button>
            </div>
          </div>
          <div className="pl-4 space-y-2">
            {g.children.map((ch) => renderNode(ch))}
          </div>
        </div>
      );
    }
    const c = n as ConditionNode;
    const nodeErr = errors[c.id] || {};
    return (
      <div key={c.id} className="grid grid-cols-12 gap-3 items-center w-full">
        <div className="col-span-6">
          <Select
            data-cond={c.id}
            value={c.fact}
            onChange={handleFactChange}
            options={facts?.map?.((f) => ({ value: f.name, label: f.name }))}
            placeholder="Select fact"
          />
          {nodeErr.fact && (
            <div className="mt-1 text-xs text-red-600">{nodeErr.fact}</div>
          )}
        </div>

        <div className="col-span-3">
          <Select
            data-cond={c.id}
            value={c.operator}
            onChange={handleOperatorChange}
            options={operatorCompatibility[
              facts?.find?.((x: any) => x.name === c.fact)?.type || "string"
            ]?.map?.((op) => ({ value: op, label: operatorLabels[op] || op }))}
            placeholder="Operator"
          />
          {nodeErr.operator && (
            <div className="mt-1 text-xs text-red-600">{nodeErr.operator}</div>
          )}
        </div>

        <div className="col-span-2">
          <Input
            data-cond={c.id}
            value={String(c.value)}
            onChange={handleValueChange}
            placeholder="Value"
          />
          {nodeErr.value && (
            <div className="mt-1 text-xs text-red-600">{nodeErr.value}</div>
          )}
        </div>

        <div className="col-span-1 flex justify-end items-center">
          <Button
            type="button"
            data-id={c.id}
            onClick={handleRemoveClick}
            className="px-2 py-1 text-xs bg-red-100 text-red-700">
            Remove
          </Button>
        </div>
      </div>
    );
  };

  const summary = useMemo(() => {
    const repr = (node: any): string => {
      if (node.children)
        return `${node.op.toUpperCase()}(${node.children
          .map(repr)
          .join(", ")})`;
      return `${node.fact} ${node.operator} ${node.value}`;
    };
    return repr(tree);
  }, [tree]);

  return (
    <div>
      <div className="text-sm text-gray-700 mb-2">{summary}</div>
      {renderNode(tree)}
    </div>
  );
}
