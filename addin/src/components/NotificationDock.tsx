import { useNotifications } from '../context/NotificationContext';
import NotificationCard from './NotificationCard';

export default function NotificationDock() {
  const { notifications, clear } = useNotifications();

  return (
    <section
      className="shrink-0 border-t-2 border-accent/25 bg-gradient-to-b from-white to-bg px-3.5 py-2.5 shadow-[0_-8px_24px_rgba(11,15,26,0.18)]"
      aria-label="Notifications"
    >
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-ink-3">
        Notifications
      </p>
      {notifications.length === 0 ? (
        <p className="text-[11px] text-ink-3">No messages yet.</p>
      ) : (
        <div className="max-h-32 space-y-1.5 overflow-y-auto">
          {notifications.map((n) => (
            <NotificationCard
              key={n.id}
              kind={n.kind}
              message={n.message}
              onDismiss={() => clear(n.source)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
