import { SUPPORT_EMAIL, supportMailtoUrl } from '@/lib/support';

export default function LegalEmailLink() {
  return (
    <a href={supportMailtoUrl()} className="text-accent no-underline hover:underline">
      {SUPPORT_EMAIL}
    </a>
  );
}
