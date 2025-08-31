// Server-side registry of allowed dynamic fact functions.
// Functions must be safe, synchronous or async, and must not execute arbitrary user code.

export type DynamicFunction = (params?: any) => Promise<any> | any;

const registry: Record<string, DynamicFunction> = {
  // example function: returns a mocked computed value
  getMockValue: async (params: any) => {
    // params may include a `value` override
    if (params && params.value !== undefined) return params.value;
    return 42; // default mock
  },
};

export function registerDynamicFunction(name: string, fn: DynamicFunction) {
  registry[name] = fn;
}

export function getDynamicFunction(name: string): DynamicFunction | undefined {
  return registry[name];
}
