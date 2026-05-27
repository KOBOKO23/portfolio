import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Heart, User, Sparkles, CheckCircle, Loader2, CreditCard, Smartphone, X, AlertCircle } from 'lucide-react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { SEO } from '../components/SEO';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api';

// ── Types ─────────────────────────────────────────────────────────────────────
type PaymentMethod = 'mpesa' | 'card';
type OrderStatus = 'idle' | 'processing' | 'polling' | 'paid' | 'failed';

interface PreorderFormData {
  name: string;
  email: string;
  phone: string;
  method: PaymentMethod;
}

// ── Stripe loader (lazy — only when Stripe PK is available) ───────────────────
let stripePromise: ReturnType<typeof loadStripe> | null = null;
function getStripe(publishableKey: string) {
  if (!stripePromise && publishableKey) stripePromise = loadStripe(publishableKey);
  return stripePromise;
}

// ── M-Pesa flow ───────────────────────────────────────────────────────────────
async function initMpesa(data: { name: string; email: string; phone: string; amount: number }) {
  const res = await fetch(`${API_BASE}/payments/mpesa/stk-push/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.error?.message ?? 'M-Pesa request failed');
  return json.data as { order_id: string; message: string };
}

async function pollOrderStatus(orderId: string): Promise<string> {
  const res = await fetch(`${API_BASE}/payments/orders/${orderId}/`);
  const json = await res.json();
  return json?.data?.status ?? 'processing';
}

// ── Stripe card form ───────────────────────────────────────────────────────────
function StripeCardForm({
  orderId,
  clientSecret,
  onSuccess,
  onError,
}: {
  orderId: string;
  clientSecret: string;
  onSuccess: () => void;
  onError: (msg: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    const card = elements.getElement(CardElement);
    if (!card) { setSubmitting(false); return; }

    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card },
    });

    if (error) {
      onError(error.message ?? 'Card payment failed');
      setSubmitting(false);
      return;
    }

    if (paymentIntent?.status === 'succeeded') {
      // Notify backend
      await fetch(`${API_BASE}/payments/orders/${orderId}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });
      onSuccess();
    }
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <div className="p-4 border border-black/20 bg-white">
        <CardElement
          options={{
            style: {
              base: { fontSize: '16px', color: '#0a0a0a', '::placeholder': { color: '#9ca3af' } },
              invalid: { color: '#ef4444' },
            },
          }}
        />
      </div>
      <button
        type="submit"
        disabled={submitting || !stripe}
        className="w-full py-4 bg-black text-white hover:bg-[#d4a574] disabled:opacity-50 disabled:cursor-not-allowed transition-all text-lg flex items-center justify-center gap-2"
      >
        {submitting ? <><Loader2 size={20} className="animate-spin" /> Processing…</> : <>Pay $9.99 · USD</>}
      </button>
      <p className="text-xs text-black/50 text-center">Secured by Stripe · TLS encrypted</p>
    </form>
  );
}

// ── Pre-order modal ────────────────────────────────────────────────────────────
function PreorderModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState<PreorderFormData>({
    name: '', email: '', phone: '', method: 'mpesa',
  });
  const [status, setStatus] = useState<OrderStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [orderId, setOrderId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [stripeKey, setStripeKey] = useState('');
  const [mpesaMsg, setMpesaMsg] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => { window.removeEventListener('keydown', handler); stopPolling(); };
  }, []);

  const stopPolling = () => { if (pollRef.current) clearInterval(pollRef.current); };

  const startPolling = (id: string) => {
    let attempts = 0;
    pollRef.current = setInterval(async () => {
      attempts++;
      const s = await pollOrderStatus(id);
      if (s === 'paid') { setStatus('paid'); stopPolling(); }
      if (s === 'failed' || attempts > 20) {
        setStatus('failed');
        setErrorMsg(s === 'failed' ? 'Payment was not completed.' : 'Timed out waiting for M-Pesa confirmation.');
        stopPolling();
      }
    }, 5000);
  };

  const handleMpesa = async () => {
    if (!form.name || !form.email || !form.phone) {
      setErrorMsg('Please fill in all fields.'); return;
    }
    setStatus('processing'); setErrorMsg('');
    try {
      const result = await initMpesa({ name: form.name, email: form.email, phone: form.phone, amount: 1500 });
      setOrderId(result.order_id);
      setMpesaMsg(result.message);
      setStatus('polling');
      startPolling(result.order_id);
    } catch (err) {
      setStatus('failed');
      setErrorMsg(err instanceof Error ? err.message : 'Request failed');
    }
  };

  const handleStripeInit = async () => {
    if (!form.name || !form.email) {
      setErrorMsg('Please fill in name and email.'); return;
    }
    setStatus('processing'); setErrorMsg('');
    try {
      const res = await fetch(`${API_BASE}/payments/stripe/create-intent/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, amount: 999, currency: 'usd' }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message ?? 'Failed to initialize payment');
      setClientSecret(json.data.client_secret);
      setStripeKey(json.data.publishable_key);
      setOrderId(json.data.order_id);
      setStatus('processing'); // stay in processing — card form is shown
    } catch (err) {
      setStatus('failed');
      setErrorMsg(err instanceof Error ? err.message : 'Failed to initialize Stripe');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.method === 'mpesa') await handleMpesa();
    else await handleStripeInit();
  };

  const isFormReady = status === 'idle' || (status === 'failed' && !clientSecret);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-lg bg-white relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-black/40 hover:text-black transition-colors z-10">
          <X size={24} />
        </button>

        {/* Header */}
        <div className="bg-[#0a0a0a] p-8 text-white">
          <div className="w-10 h-[2px] bg-[#d4a574] mb-4" />
          <h2 className="text-3xl mb-2" style={{ fontFamily: 'var(--font-serif)' }}>Pre-Order</h2>
          <p className="text-white/70">Broken Souls · First Edition</p>
          <div className="flex gap-6 mt-4 pt-4 border-t border-white/10">
            <div><p className="text-xs text-white/50 uppercase tracking-wider">KES Price</p><p className="text-2xl text-[#d4a574]" style={{ fontFamily: 'var(--font-serif)' }}>1,500</p></div>
            <div><p className="text-xs text-white/50 uppercase tracking-wider">USD Price</p><p className="text-2xl text-[#d4a574]" style={{ fontFamily: 'var(--font-serif)' }}>$9.99</p></div>
          </div>
        </div>

        <div className="p-8">
          {/* Success */}
          {status === 'paid' && (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-2xl mb-2" style={{ fontFamily: 'var(--font-serif)' }}>Order Confirmed!</h3>
              <p className="text-black/70 mb-6">Thank you, {form.name}. You'll receive a confirmation at {form.email}.</p>
              <button onClick={onClose} className="px-8 py-3 bg-black text-white hover:bg-[#d4a574] transition-all">
                Close
              </button>
            </div>
          )}

          {/* M-Pesa waiting */}
          {status === 'polling' && (
            <div className="text-center py-8">
              <Smartphone className="w-16 h-16 text-[#d4a574] mx-auto mb-4" />
              <h3 className="text-2xl mb-2" style={{ fontFamily: 'var(--font-serif)' }}>Check Your Phone</h3>
              <p className="text-black/70 mb-4">{mpesaMsg || 'An M-Pesa prompt has been sent to your phone.'}</p>
              <div className="flex items-center justify-center gap-2 text-black/50 text-sm mb-6">
                <Loader2 size={16} className="animate-spin" />
                <span>Waiting for payment confirmation…</span>
              </div>
              <button
                onClick={() => { stopPolling(); setStatus('idle'); setErrorMsg(''); }}
                className="text-sm text-black/50 hover:text-black underline"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Stripe card form */}
          {status === 'processing' && form.method === 'card' && clientSecret && stripeKey && (
            <div>
              <h3 className="text-xl mb-4" style={{ fontFamily: 'var(--font-serif)' }}>Enter Card Details</h3>
              <Elements stripe={getStripe(stripeKey)} options={{ clientSecret }}>
                <StripeCardForm
                  orderId={orderId}
                  clientSecret={clientSecret}
                  onSuccess={() => setStatus('paid')}
                  onError={(msg) => { setStatus('failed'); setErrorMsg(msg); }}
                />
              </Elements>
            </div>
          )}

          {/* Stripe init spinner */}
          {status === 'processing' && form.method === 'card' && !clientSecret && (
            <div className="text-center py-8">
              <Loader2 className="w-10 h-10 text-[#d4a574] mx-auto mb-4 animate-spin" />
              <p className="text-black/70">Setting up secure payment…</p>
            </div>
          )}

          {/* M-Pesa init spinner */}
          {status === 'processing' && form.method === 'mpesa' && (
            <div className="text-center py-8">
              <Loader2 className="w-10 h-10 text-[#d4a574] mx-auto mb-4 animate-spin" />
              <p className="text-black/70">Sending M-Pesa request…</p>
            </div>
          )}

          {/* The form */}
          {isFormReady && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {errorMsg && (
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 text-red-700 text-sm">
                  <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-black/70 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full px-4 py-3 border border-black/15 focus:border-[#d4a574] outline-none transition-colors bg-white"
                  placeholder="Koboko Philip"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black/70 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  className="w-full px-4 py-3 border border-black/15 focus:border-[#d4a574] outline-none transition-colors bg-white"
                  placeholder="you@email.com"
                />
              </div>

              {/* Payment method selector */}
              <div>
                <label className="block text-sm font-medium text-black/70 mb-2">Payment Method *</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'mpesa' as PaymentMethod, label: 'M-Pesa', sub: 'Kenya · KES 1,500', icon: Smartphone },
                    { key: 'card' as PaymentMethod, label: 'Card', sub: 'Visa/Mastercard · $9.99', icon: CreditCard },
                  ].map(({ key, label, sub, icon: Icon }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, method: key }))}
                      className={`p-4 border text-left transition-all ${
                        form.method === key
                          ? 'border-[#d4a574] bg-[#d4a574]/5'
                          : 'border-black/15 hover:border-black/30'
                      }`}
                    >
                      <Icon size={20} className={`mb-2 ${form.method === key ? 'text-[#d4a574]' : 'text-black/50'}`} />
                      <p className="font-medium text-sm">{label}</p>
                      <p className="text-xs text-black/50">{sub}</p>
                    </button>
                  ))}
                </div>
              </div>

              {form.method === 'mpesa' && (
                <div>
                  <label className="block text-sm font-medium text-black/70 mb-1">M-Pesa Phone Number *</label>
                  <input
                    type="tel"
                    required={form.method === 'mpesa'}
                    value={form.phone}
                    onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                    className="w-full px-4 py-3 border border-black/15 focus:border-[#d4a574] outline-none transition-colors bg-white"
                    placeholder="0712 345 678"
                  />
                  <p className="text-xs text-black/40 mt-1">Safaricom number registered with M-Pesa</p>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-4 bg-black text-white hover:bg-[#d4a574] transition-all text-lg flex items-center justify-center gap-2"
              >
                {form.method === 'mpesa'
                  ? <><Smartphone size={20} /> Pay KES 1,500 via M-Pesa</>
                  : <><CreditCard size={20} /> Pay $9.99 · Continue to Card</>
                }
              </button>

              <div className="flex items-center justify-center gap-4 text-xs text-black/40 pt-2">
                <span>🔒 SSL Encrypted</span>
                {form.method === 'card' && <><span>·</span><span>Powered by Stripe</span></>}
                {form.method === 'mpesa' && <><span>·</span><span>Safaricom Daraja API</span></>}
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main Book page ─────────────────────────────────────────────────────────────
export function Book() {
  const [showPreorder, setShowPreorder] = useState(false);

  const chapters = [
    { number: 1, title: 'Shattered', theme: 'The Breaking' },
    { number: 2, title: 'The Wilderness', theme: 'Isolation & Discovery' },
    { number: 3, title: 'Echoes of Grace', theme: 'Divine Whispers' },
    { number: 4, title: 'Rebuilding', theme: 'Restoration Begins' },
    { number: 5, title: 'New Foundations', theme: 'Transformed Purpose' },
  ];

  const themes = [
    { icon: Heart, title: 'Redemption', description: 'The journey from brokenness to wholeness through divine grace' },
    { icon: User, title: 'Identity', description: 'Discovering who you are beyond your wounds and failures' },
    { icon: Sparkles, title: 'Hope', description: 'Finding light in the darkest moments of life' },
  ];

  return (
    <div className="min-h-screen pt-20">
      <SEO
        title="The Book — Echoes of Grace"
        description="A journey from brokenness to wholeness. Pre-order 'Echoes of Grace' — a memoir of faith, identity, and redemption by Koboko."
        url="/book"
      />
      {/* Hero */}
      <section className="relative h-[80vh] flex items-center justify-center overflow-hidden bg-[#0a0a0a]">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 80% 80% at 50% 60%, #0d1020 0%, #0a0a0a 65%)' }} />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 35% 45% at 50% 45%, #d4a57414 0%, transparent 70%)' }} />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: 'linear-gradient(#d4a574 1px, transparent 1px)', backgroundSize: '100% 3rem' }}
        />
        <div
          className="absolute left-[10%] top-[15%] bottom-[15%] w-[2px] hidden lg:block"
          style={{ background: 'linear-gradient(180deg, transparent, #d4a574 20%, #d4a574 80%, transparent)' }}
        />
        <div className="relative z-20 text-center text-white px-6">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div className="w-20 h-20 mx-auto mb-8 flex items-center justify-center border border-[#d4a574]/40" style={{ background: 'rgba(212,165,116,0.06)' }}>
              <BookOpen className="w-10 h-10 text-[#d4a574]" />
            </div>
            <p className="text-sm uppercase tracking-widest mb-4 text-[#d4a574]">Coming Soon</p>
            <h1 className="text-6xl md:text-8xl mb-6" style={{ fontFamily: 'var(--font-serif)' }}>Broken Souls</h1>
            <p className="text-2xl md:text-3xl max-w-3xl mx-auto leading-relaxed text-white/80 mb-12">A Journey from Brokenness to Wholeness</p>
            <button
              onClick={() => setShowPreorder(true)}
              className="px-10 py-4 bg-[#d4a574] text-white hover:bg-[#c9a063] transition-all duration-300 text-lg"
            >
              Pre-Order Now
            </button>
          </motion.div>
        </div>
      </section>

      {/* About */}
      <section className="py-24 lg:py-32 px-6 lg:px-12 max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <div className="w-12 h-[2px] bg-[#d4a574] mb-6" />
            <h2 className="text-4xl md:text-5xl mb-6" style={{ fontFamily: 'var(--font-serif)' }}>About the Book</h2>
            <div className="space-y-4 text-lg leading-relaxed text-black/70">
              <p>"Broken Souls" is a deeply personal exploration of pain, healing, and redemption. Drawing from personal experiences, biblical truths, and universal human struggles, this book speaks to anyone who has felt shattered by life's circumstances.</p>
              <p>Through raw honesty and profound faith, I navigate the difficult terrain of brokenness — not to glorify suffering, but to illuminate the path to restoration.</p>
              <p>The book weaves together narrative storytelling, theological reflection, and practical wisdom for those seeking healing, purpose, and a renewed sense of identity in Christ.</p>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="bg-[#f5f5f0] p-12">
            <blockquote className="text-2xl md:text-3xl leading-relaxed mb-8" style={{ fontFamily: 'var(--font-serif)' }}>
              "We are not defined by our brokenness, but by the One who redeems it."
            </blockquote>
            <p className="text-black/60 uppercase text-sm tracking-wide">— Koboko, Author</p>
          </motion.div>
        </div>
      </section>

      {/* Key Themes */}
      <section className="py-24 lg:py-32 bg-black text-white">
        <div className="px-6 lg:px-12 max-w-[1400px] mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <div className="w-12 h-[2px] bg-[#d4a574] mb-6 mx-auto" />
            <h2 className="text-4xl md:text-5xl mb-16 text-center" style={{ fontFamily: 'var(--font-serif)' }}>Key Themes</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {themes.map((theme, index) => (
                <motion.div key={theme.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: index * 0.1 }} className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-[#d4a574] mb-6"><theme.icon className="w-8 h-8" /></div>
                  <h3 className="text-2xl mb-4" style={{ fontFamily: 'var(--font-serif)' }}>{theme.title}</h3>
                  <p className="text-white/70 leading-relaxed">{theme.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Chapter Preview */}
      <section className="py-24 lg:py-32 px-6 lg:px-12 max-w-[1400px] mx-auto">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
          <div className="w-12 h-[2px] bg-[#d4a574] mb-6 mx-auto" />
          <h2 className="text-4xl md:text-5xl mb-16 text-center" style={{ fontFamily: 'var(--font-serif)' }}>Chapter Preview</h2>
          <div className="max-w-3xl mx-auto space-y-6">
            {chapters.map((chapter, index) => (
              <motion.div key={chapter.number} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: index * 0.1 }} className="border-l-4 border-[#d4a574] pl-8 py-4 hover:bg-[#f5f5f0] transition-colors">
                <div className="flex items-baseline gap-6">
                  <span className="text-5xl text-[#d4a574]/30 flex-shrink-0" style={{ fontFamily: 'var(--font-serif)' }}>{chapter.number}</span>
                  <div>
                    <h3 className="text-2xl mb-2" style={{ fontFamily: 'var(--font-serif)' }}>{chapter.title}</h3>
                    <p className="text-black/60 italic">{chapter.theme}</p>
                  </div>
                </div>
              </motion.div>
            ))}
            <p className="text-center text-black/60 pt-8">…and many more chapters to come</p>
          </div>
        </motion.div>
      </section>

      {/* Author's Note */}
      <section className="py-24 lg:py-32 bg-[#f5f5f0]">
        <div className="px-6 lg:px-12 max-w-[1000px] mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center">
            <div className="w-12 h-[2px] bg-[#d4a574] mb-8 mx-auto" />
            <h2 className="text-4xl md:text-5xl mb-8" style={{ fontFamily: 'var(--font-serif)' }}>Author's Note</h2>
            <div className="space-y-6 text-lg leading-relaxed text-black/70">
              <p>Writing "Broken Souls" has been one of the most vulnerable and rewarding experiences of my life. This book is not just theory or theology — it's lived experience.</p>
              <p>My prayer is that these pages become a companion for anyone walking through their own season of pain. May you find hope, healing, and the assurance that broken souls can become beautiful testimonies of God's redemptive power.</p>
              <p className="text-xl" style={{ fontFamily: 'var(--font-serif)' }}>— Koboko</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pre-Order CTA */}
      <section className="py-24 lg:py-32 px-6 lg:px-12 max-w-[1400px] mx-auto">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center">
          <h2 className="text-4xl md:text-5xl mb-6" style={{ fontFamily: 'var(--font-serif)' }}>Reserve Your Copy</h2>
          <p className="text-lg text-black/60 max-w-2xl mx-auto mb-8">
            Be among the first to receive "Broken Souls" when it launches. Pre-order now and receive exclusive bonus content.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
            <button
              onClick={() => setShowPreorder(true)}
              className="px-10 py-4 bg-black text-white hover:bg-[#d4a574] transition-all duration-300 text-lg"
            >
              Pre-Order Book
            </button>
            <a href="/contact" className="px-10 py-4 border-2 border-black text-black hover:bg-black hover:text-white transition-all duration-300 text-lg">
              Get Notified
            </a>
          </div>
          {/* Payment trust badges */}
          <div className="flex items-center justify-center gap-6 text-sm text-black/40">
            <div className="flex items-center gap-1.5"><Smartphone size={16} /><span>M-Pesa (Kenya)</span></div>
            <span>·</span>
            <div className="flex items-center gap-1.5"><CreditCard size={16} /><span>Visa / Mastercard</span></div>
            <span>·</span>
            <span>🔒 Secure Checkout</span>
          </div>
        </motion.div>
      </section>

      {/* Pre-order modal */}
      <AnimatePresence>
        {showPreorder && <PreorderModal onClose={() => setShowPreorder(false)} />}
      </AnimatePresence>
    </div>
  );
}
