import { useState, useCallback, useEffect } from 'react';
import { apiGet } from '../utils/api';
import { friendlyError } from '../utils/errorMessages';
import { clearSession, getWorkspaceId, setWorkspaceId } from '../utils/session';

interface WorkspaceRow {
  id: string;
  name: string;
}

type LoadResult = {
  ok: boolean;
  list: WorkspaceRow[];
  error: string | null;
  accountRequired: boolean;
  authRequired: boolean;
  onboardingRequired: boolean;
};

async function loadWorkspaces(): Promise<LoadResult> {
  const res = await apiGet<{ workspaces: WorkspaceRow[] }>('/api/workspace');

  if (res.success && res.data) {
    return {
      ok: true,
      list: res.data.workspaces ?? [],
      error: null,
      accountRequired: false,
      authRequired: false,
      onboardingRequired: false,
    };
  }

  const code = res.error?.code ?? '';
  return {
    ok: false,
    list: [],
    error: friendlyError(res, 'Failed to load workspaces.'),
    accountRequired: code === 'ACCOUNT_REQUIRED',
    authRequired: code === 'AUTH_REQUIRED',
    onboardingRequired: code === 'ONBOARDING_REQUIRED',
  };
}

type UseWorkspaceOptions = {
  onAuthExpired?: () => void;
};

export function useWorkspace(enabled: boolean, options?: UseWorkspaceOptions) {
  const { onAuthExpired } = options ?? {};
  const [workspaceId, setWorkspaceIdState] = useState<string | null>(
    getWorkspaceId()
  );
  const [workspaces, setWorkspaces] = useState<WorkspaceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  const applyWorkspaceList = useCallback((list: WorkspaceRow[]) => {
    setWorkspaces(list);
    const stored = getWorkspaceId();
    const valid = stored && list.some((w) => w.id === stored);
    const pick = valid ? stored! : list[0]?.id;
    if (pick) {
      setWorkspaceId(pick);
      setWorkspaceIdState(pick);
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    setSessionExpired(false);
    try {
      let result = await loadWorkspaces();

      if (!result.ok && result.authRequired) {
        clearSession();
        setSessionExpired(true);
        onAuthExpired?.();
        return;
      }

      if (!result.ok && result.onboardingRequired) {
        setError(null);
        return;
      }

      if (!result.ok) {
        setError(
          result.accountRequired
            ? 'Account setup failed. Try signing out and in again.'
            : result.error
        );
        return;
      }

      applyWorkspaceList(result.list);
      if (result.list.length === 0) {
        setError('No workspace available.');
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load workspaces.'
      );
    } finally {
      setLoading(false);
    }
  }, [enabled, applyWorkspaceList, onAuthExpired]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!enabled) {
      setSessionExpired(false);
      setWorkspaces([]);
      setWorkspaceIdState(null);
      setError(null);
    }
  }, [enabled]);

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
    sessionExpired,
    ready: !!workspaceId,
  };
}
