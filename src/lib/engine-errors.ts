export class EngineExecutionError extends Error {
  code: string;
  detail?: any;
  constructor(code: string, message: string, detail?: any) {
    super(message);
    this.code = code;
    this.detail = detail;
  }
}

export function mapEngineError(err: any) {
  // Lightweight mapping; can be extended with more sophisticated patterns
  const msg = err?.message || String(err);
  if (/requires a number|greaterThan|lessThan|number/i.test(msg)) {
    return new EngineExecutionError(
      "INVALID_FACT_TYPE",
      `Invalid fact input: ${msg}`,
      { raw: msg }
    );
  }
  if (/timeout|failed to fetch/i.test(msg)) {
    return new EngineExecutionError(
      "EXTERNAL_FETCH_FAILED",
      `Failed fetching external data: ${msg}`,
      { raw: msg }
    );
  }
  return new EngineExecutionError("ENGINE_RUNTIME_ERROR", msg, { raw: msg });
}
