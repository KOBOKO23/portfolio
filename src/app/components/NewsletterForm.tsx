import { useState } from 'react';
import { motion } from 'motion/react';

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// NOTE — no double opt-in: subscribing here immediately marks the
// NewsletterSubscriber as active; there's no confirmation email/link step.
// CAN-SPAM/GDPR expect either double opt-in or a clear unsubscribe path in
// every subsequent email — the unsubscribe side of that is handled by the
// mailer (see the newsletter management command), but there is currently no
// opt-in confirmation step. Flagged for a decision, not fixed here.

interface NewsletterFormProps {
  /** Must be unique per instance on a page — used to build unique <label for>/id pairs. */
  idPrefix: string;
  layout?: 'row' | 'stack';
  inputClassName?: string;
  buttonClassName?: string;
  successClassName?: string;
  helperText?: string;
  buttonLabel?: string;
  buttonLabelSending?: string;
}

export function NewsletterForm({
  idPrefix,
  layout = 'row',
  inputClassName = 'flex-1 px-5 py-4 bg-black/10 border border-black/20 text-black placeholder:text-black/40 focus:outline-none focus:border-black/50 rounded-xl text-sm',
  buttonClassName = 'px-8 py-4 bg-black text-white hover:bg-white hover:text-black transition-all rounded-xl text-sm font-semibold whitespace-nowrap disabled:opacity-60',
  successClassName = 'bg-black text-white rounded-2xl p-8',
  helperText = 'No spam. No noise. Unsubscribe anytime.',
  buttonLabel = 'Subscribe',
  buttonLabelSending = 'Subscribing…',
}: NewsletterFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;
    setStatus('sending');
    try {
      const res = await fetch(`${API}/newsletter/subscribe/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      });
      const data = (await res.json()) as { success: boolean };
      setStatus(data.success ? 'done' : 'error');
    } catch {
      setStatus('error');
    }
  };

  if (status === 'done') {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className={successClassName}>
        <p className="font-serif text-2xl mb-2">You're in. ✓</p>
        <p className="text-white/60">Look out for the next issue in your inbox.</p>
      </motion.div>
    );
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className={layout === 'row' ? 'flex flex-col sm:flex-row gap-3' : 'flex flex-col gap-3'}>
        <label htmlFor={`${idPrefix}-name`} className="sr-only">Your name</label>
        <input id={`${idPrefix}-name`} name="name" type="text" required placeholder="Your name"
          value={name} onChange={e => setName(e.target.value)}
          className={inputClassName} />

        <label htmlFor={`${idPrefix}-email`} className="sr-only">Your email</label>
        <input id={`${idPrefix}-email`} name="email" type="email" required placeholder="Your email"
          value={email} onChange={e => setEmail(e.target.value)}
          className={inputClassName} />

        <button type="submit" disabled={status === 'sending'} className={buttonClassName}>
          {status === 'sending' ? buttonLabelSending : buttonLabel}
        </button>
      </form>
      {status === 'error' && (
        <p className="text-red-600 text-sm mt-3" role="alert">Something went wrong. Please try again.</p>
      )}
      {helperText && <p className="text-black/40 text-xs mt-4">{helperText}</p>}
    </div>
  );
}
