import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type NotificationKind = 'success' | 'warn' | 'error';

export type Notification = {
  id: string;
  kind: NotificationKind;
  message: string;
  source: string;
};

type PublishInput = {
  kind: NotificationKind;
  message: string;
  source: string;
};

type NotificationContextValue = {
  notifications: Notification[];
  publish: (input: PublishInput) => void;
  clear: (source: string) => void;
  clearAll: () => void;
};

const KIND_PRIORITY: Record<NotificationKind, number> = {
  error: 0,
  warn: 1,
  success: 2,
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [bySource, setBySource] = useState<Map<string, Notification>>(
    () => new Map()
  );

  const publish = useCallback((input: PublishInput) => {
    setBySource((prev) => {
      const next = new Map(prev);
      next.set(input.source, {
        id: input.source,
        kind: input.kind,
        message: input.message,
        source: input.source,
      });
      return next;
    });
  }, []);

  const clear = useCallback((source: string) => {
    setBySource((prev) => {
      if (!prev.has(source)) return prev;
      const next = new Map(prev);
      next.delete(source);
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setBySource(new Map());
  }, []);

  const notifications = useMemo(
    () =>
      Array.from(bySource.values()).sort(
        (a, b) => KIND_PRIORITY[a.kind] - KIND_PRIORITY[b.kind]
      ),
    [bySource]
  );

  const value = useMemo(
    () => ({ notifications, publish, clear, clearAll }),
    [notifications, publish, clear, clearAll]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return ctx;
}

/** Sync a nullable message into the notification dock by source. */
export function useNotifyEffect(
  source: string,
  message: string | null | undefined,
  kind: NotificationKind = 'warn'
) {
  const { publish, clear } = useNotifications();

  useEffect(() => {
    if (message) {
      publish({ kind, message, source });
    } else {
      clear(source);
    }
  }, [message, kind, source, publish, clear]);
}
