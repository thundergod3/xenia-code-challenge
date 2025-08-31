"use client";
import React, { useMemo } from "react";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  ReactFlowProvider,
} from "reactflow";
import "reactflow/dist/style.css";
import Button from "@/src/components/ui/atoms/Button";
import Input from "@/src/components/ui/atoms/Input";
import Select from "@/src/components/ui/atoms/Select";
import Textarea from "@/src/components/ui/atoms/Textarea";
import {
  operatorCompatibility,
  operatorLabels,
  allOperators,
} from "@/src/lib/operators";
import Field from "@/src/components/ui/molecules/Field";

export default function BuilderView(props: any) {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    nodeTypes,
    onNodeClick,
    addConditionNode,
    selectedNode,
    facts,
    handleFactChangeEvent,
    handleOperatorChangeEvent,
    handleValueChangeEvent,
    handleDeleteNode,
    generateRuleJson,
    ruleJson,
    handleSaveRule,
    saving,
    ruleName,
    handleRuleNameChangeEvent,
    ruleDescription,
    handleRuleDescriptionChangeEvent,
    selectedOutcomeId,
    handleOutcomeSelectEvent,
    outcomes,
    newOutcomeType,
    handleNewOutcomeTypeChangeEvent,
    newOutcomeParams,
    handleNewOutcomeParamsChangeEvent,
    validationErrors,
  } = props;

  const operatorOptions = useMemo(() => {
    const factName = selectedNode?.data?.fact;
    const fact = facts?.find((f: any) => f.name === factName);
    const ops = fact ? operatorCompatibility?.[fact.type] || [] : allOperators;
    return ops.map((op: string) => ({
      value: op,
      label: operatorLabels[op] || op,
    }));
  }, [selectedNode?.data?.fact, facts]);

  return (
    <ReactFlowProvider>
      <main>
        <h1 className="text-xl font-semibold mb-4">Rule Builder (Prototype)</h1>

        <div className="flex gap-4">
          <div className="w-44">
            <div className="bg-white rounded shadow p-3">
              <h3 className="font-medium">Palette</h3>
              <div className="mt-3 space-y-2">
                <Button
                  className="w-full px-3 py-2 bg-indigo-600 text-white rounded"
                  onClick={addConditionNode}>
                  Add Condition
                </Button>
              </div>
            </div>
          </div>

          <div className="flex-1 h-[500px] rounded border">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              onNodeClick={onNodeClick}
              fitView>
              <MiniMap />
              <Controls />
              <Background />
            </ReactFlow>
          </div>

          <aside className="w-[25rem]">
            <div className="bg-white rounded shadow p-4">
              <h2 className="font-semibold">Properties</h2>
              {selectedNode ? (
                <div className="mt-3">
                  <div className="text-sm font-medium">
                    Node ID: {selectedNode.id}
                  </div>
                  {selectedNode.type === "condition" ? (
                    <>
                      <Field label="Fact">
                        <Select
                          className="w-full"
                          value={selectedNode?.data?.fact}
                          onChange={handleFactChangeEvent}
                          options={facts?.map?.((f: any) => ({
                            value: f.name,
                            label: f.description || f.name,
                          }))}
                          placeholder="Select a fact"
                        />
                      </Field>

                      <Field label="Operator">
                        <Select
                          className="w-full"
                          value={selectedNode?.data?.operator}
                          onChange={handleOperatorChangeEvent}
                          options={operatorOptions}
                        />
                      </Field>

                      <Field label="Value">
                        <Input
                          value={selectedNode?.data?.value}
                          onChange={handleValueChangeEvent}
                        />
                      </Field>
                    </>
                  ) : null}
                  <div className="mt-2">
                    <Button
                      className="px-3 py-1 bg-red-600 text-white rounded"
                      onClick={handleDeleteNode}>
                      Delete node
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-3 text-sm text-gray-500">
                  Select a node to edit its properties.
                </div>
              )}
            </div>

            <div className="mt-4 bg-white rounded shadow p-4">
              <h2 className="font-semibold">Graph JSON</h2>

              <div className="mt-2">
                <Field label="Rule name">
                  <Input
                    value={ruleName}
                    onChange={handleRuleNameChangeEvent}
                  />
                </Field>
                <Field label="Rule description">
                  <Input
                    value={ruleDescription}
                    onChange={handleRuleDescriptionChangeEvent}
                  />
                </Field>
                <div className="mt-3">
                  <Field label="Outcome">
                    <Select
                      value={selectedOutcomeId ?? ""}
                      onChange={handleOutcomeSelectEvent}
                      options={[
                        ...(outcomes || []).map((o: any) => ({
                          value: o.id,
                          label: o.type,
                        })),
                        { value: "__new", label: "Create new outcome..." },
                      ]}
                      placeholder="Select outcome"
                    />
                  </Field>

                  {selectedOutcomeId === "new" && (
                    <div className="mt-2">
                      <Field label="New outcome type">
                        <Input
                          className="w-full"
                          value={newOutcomeType}
                          onChange={handleNewOutcomeTypeChangeEvent}
                        />
                      </Field>
                      <Field label="New outcome params (JSON)">
                        <Textarea
                          className="w-full h-24"
                          value={newOutcomeParams}
                          onChange={handleNewOutcomeParamsChangeEvent}
                        />
                      </Field>
                    </div>
                  )}
                </div>
              </div>
              {ruleJson && (
                <div className="mt-2">
                  <h3 className="font-medium">Exported json_conditions</h3>
                  <pre className="mt-1 bg-white p-3 border">
                    {JSON.stringify(ruleJson, null, 2)}
                  </pre>
                </div>
              )}
              {validationErrors && (
                <div className="mt-2 text-sm text-red-600 whitespace-pre-wrap">
                  {validationErrors}
                </div>
              )}
              <div className="mt-4 flex gap-2">
                <Button
                  onClick={generateRuleJson}
                  className="px-3 py-1 bg-indigo-600 text-white rounded">
                  Generate Rule JSON
                </Button>
                <Button
                  onClick={handleSaveRule}
                  className="px-3 py-1 bg-green-600 text-white rounded"
                  disabled={!ruleJson || saving}>
                  {saving ? "Saving..." : "Save rule + outcome"}
                </Button>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </ReactFlowProvider>
  );
}
