'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function TeamInviteForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch('/api/account/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error?.message ?? 'Invite failed.');
        return;
      }
      setMessage(`Invitation sent to ${email.trim()}.`);
      setEmail('');
    } catch {
      setError('Invite failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <Input
        label="Email address"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      {error && <p className="text-sm text-warn-text">{error}</p>}
      {message && <p className="text-sm text-success-text">{message}</p>}
      <Button type="submit" variant="primary" disabled={loading}>
        {loading ? 'Sending…' : 'Send invite'}
      </Button>
    </form>
  );
}
