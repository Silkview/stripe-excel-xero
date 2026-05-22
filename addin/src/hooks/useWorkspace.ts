import { useState, useCallback, useEffect } from 'react';
import { apiGet } from '../utils/api';
import { friendlyError } from '../utils/errorMessages';
import { getWorkspaceId, setWorkspaceId } from '../utils/session';

interface WorkspaceRow {
  id: string;
  name: string;
}

export function useWorkspace(enabled: boolean) {
  const [workspaceId, setWorkspaceIdState] = useState<string | null>(
    getWorkspaceId()
  );
  const [workspaces, setWorkspaces] = useState<WorkspaceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiGet<{ workspaces: WorkspaceRow[] }>('/api/workspace');
      if (!res.success || !res.data) {
        setError(friendlyError(res, 'Failed to load workspaces.'));
        return;
      }
      const list = res.data.workspaces ?? [];
      setWorkspaces(list);
      const stored = getWorkspaceId();
      const valid = stored && list.some((w) => w.id === stored);
      const pick = valid ? stored! : list[0]?.id;
      if (pick) {
        setWorkspaceId(pick);
        setWorkspaceIdState(pick);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load workspaces.'
      );
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const selectWorkspace = useCallback((id: string) => {
    setWorkspaceId(id);
    setWorkspaceIdState(id);
  }, []);

  return {
    workspaceId,
    workspaces,
    loading,
    error,
    refresh,
    selectWorkspace,
    ready: !!workspaceId,
  };
}
