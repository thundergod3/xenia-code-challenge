export const operatorCompatibility: Record<string, string[]> = {
  number: [
    "greaterThan",
    "lessThan",
    "equal",
    "notEqual",
    "greaterThanInclusive",
    "lessThanInclusive",
  ],
  string: ["equal", "notEqual", "contains", "startsWith", "endsWith"],
  boolean: ["equal", "notEqual"],
  list: ["in", "notIn"],
};

export const allOperators = Array.from(
  new Set(Object.values(operatorCompatibility).flat())
);

export const operatorLabels: Record<string, string> = {
  greaterThan: "Greater than",
  lessThan: "Less than",
  equal: "Equal",
  notEqual: "Not equal",
  greaterThanInclusive: "Greater than or equal",
  lessThanInclusive: "Less than or equal",
  contains: "Contains",
  startsWith: "Starts with",
  endsWith: "Ends with",
  in: "In",
  notIn: "Not in",
};
