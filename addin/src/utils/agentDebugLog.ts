import { apiPost } from './api';

/** Send debug telemetry to the web API (works from Excel; localhost ingest does not). */
export function agentDebugLog(payload: Record<string, unknown>): void {
  void apiPost<{ logged: boolean }>('/api/debug/agent-log', payload).catch(() => {});
}
