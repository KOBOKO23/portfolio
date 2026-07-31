import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen, Heart, User, Sparkles, CheckCircle, Loader2,
  CreditCard, Smartphone, X, AlertCircle, Star, ShoppingCart, ExternalLink,
  Lock, ShieldCheck, ChevronLeft, ArrowRight, Check, Bell, RefreshCw,
} from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements, CardNumberElement, CardExpiryElement, CardCvcElement,
  useStripe, useElements,
} from '@stripe/react-stripe-js';
import { SEO } from '../components/SEO';

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// ── Types ──────────────────────────────────────────────────────────────────────
type PaymentMethod = 'visa' | 'mpesa';
type CheckoutStep  = 1 | 2 | 3;
type OrderStatus   = 'idle' | 'processing' | 'polling' | 'paid' | 'failed';

interface BookChapter     { id: number; number: number; title: string; theme: string; excerpt: string; }
interface BookTestimonial { id: number; quote: string; author_name: string; author_title: string; author_photo: string | null; rating: number; }
interface BookData {
  id: number; title: string; subtitle: string; description: string;
  cover_image: string | null; author: string; page_count: number | null;
  release_date: string | null; publisher: string; amazon_url: string;
  preview_pdf: string | null; authors_note: string;
  price_kes: number; price_usd: string;
  is_published: boolean;
  chapters: BookChapter[];
  testimonials: BookTestimonial[];
}

// ── Stripe loader ──────────────────────────────────────────────────────────────
let stripePromise: ReturnType<typeof loadStripe> | null = null;
function getStripe(pk: string) {
  if (!stripePromise && pk) stripePromise = loadStripe(pk);
  return stripePromise;
}

// ── API helpers ────────────────────────────────────────────────────────────────
interface MpesaResp { success: boolean; data?: { order_id: string; checkout_request_id: string; message: string }; error?: { message?: string } }
interface OrderResp { success: boolean; data?: { id: string; status: string } }
interface StripeResp { success: boolean; data?: { client_secret: string; publishable_key: string; order_id: string }; error?: { message?: string } }
interface BookListResp { data?: BookData[] | { results?: BookData[] } }

async function initMpesa(data: { name: string; email: string; phone: string; amount: number }) {
  const res  = await fetch(`${API}/payments/mpesa/stk-push/`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  });
  const json = (await res.json()) as MpesaResp;
  if (!res.ok || !json.success || !json.data) throw new Error(json.error?.message ?? 'M-Pesa request failed');
  return json.data;
}

async function pollOrderStatus(orderId: string) {
  const res  = await fetch(`${API}/payments/orders/${orderId}/`);
  const json = (await res.json()) as OrderResp;
  return json.success ? (json.data?.status ?? 'processing') : 'failed';
}

// ── Step indicator ─────────────────────────────────────────────────────────────
function StepBar({ step, method }: { step: CheckoutStep; method: PaymentMethod }) {
  const labels = ['Details', method === 'visa' ? 'Card' : 'Confirm', 'Done'];
  return (
    <div className="flex items-center justify-center mb-8 select-none">
      {labels.map((label, i) => {
        const n = i + 1;
        const done   = step > n;
        const active = step === n;
        return (
          <div key={n} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all duration-400 ${
                done   ? 'bg-[#d4a574] border-[#d4a574] text-white' :
                active ? 'bg-[#0a0a0a] border-[#0a0a0a] text-white' :
                         'bg-white border-black/15 text-black/30'
              }`}>
                {done ? <Check size={13} strokeWidth={2.5} /> : n}
              </div>
              <span className={`text-[10px] mt-1.5 uppercase tracking-wider transition-colors duration-300 ${active ? 'text-black font-semibold' : 'text-black/30'}`}>
                {label}
              </span>
            </div>
            {i < 2 && (
              <div className={`w-14 h-px mb-5 mx-1 transition-colors duration-500 ${done ? 'bg-[#d4a574]' : 'bg-black/10'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Visa card visual ───────────────────────────────────────────────────────────
function VisaCardPreview({ name, focused }: {
  name: string;
  focused: 'number' | 'expiry' | 'cvc' | null;
}) {
  const flipped = focused === 'cvc';
  return (
    <div className="mb-8 select-none" style={{ perspective: '1200px' }}>
      <div style={{
        transformStyle: 'preserve-3d',
        transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        transition: 'transform 0.65s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        height: '185px',
      }}>

        {/* ── Card front ── */}
        <div style={{ backfaceVisibility: 'hidden', position: 'absolute', inset: 0 }} className="overflow-hidden rounded-sm">
          <div className="relative h-full p-5 flex flex-col justify-between"
            style={{ background: 'linear-gradient(135deg, #1c1c1c 0%, #0a0a0a 55%, #16120a 100%)' }}>
            {/* shimmer */}
            <div className="absolute inset-0 opacity-[0.07]"
              style={{ background: 'linear-gradient(135deg, #d4a574 0%, transparent 55%)' }} />
            {/* top row */}
            <div className="flex justify-between items-start relative z-10">
              {/* EMV chip */}
              <div className="w-9 h-[26px] border border-[#d4a574]/40 bg-[#d4a574]/10 rounded-[3px] grid grid-cols-3 grid-rows-3 gap-px p-[3px]">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="bg-[#d4a574]/35 rounded-[1px]" />
                ))}
              </div>
              {/* NFC icon */}
              <div className="flex flex-col gap-[3px] items-end opacity-40 mt-0.5">
                {[10, 14, 18].map(w => (
                  <div key={w} className="h-[2px] rounded-full bg-white" style={{ width: w }} />
                ))}
              </div>
            </div>
            {/* number + info */}
            <div className="relative z-10">
              {/* masked number */}
              <div className={`flex gap-3 mb-4 transition-all duration-200 ${focused === 'number' ? 'opacity-100' : 'opacity-70'}`}>
                {['••••', '••••', '••••', '••••'].map((g, i) => (
                  <span key={i} className="text-white text-base tracking-[0.2em] font-mono">{g}</span>
                ))}
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-white/25 text-[8px] uppercase tracking-[0.15em] mb-0.5">Cardholder</p>
                  <p className={`text-sm tracking-widest uppercase font-medium transition-all duration-200 ${focused === 'number' || focused === 'expiry' ? 'text-white/90' : 'text-white/60'}`}>
                    {name || 'YOUR NAME'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-white/25 text-[8px] uppercase tracking-[0.15em] mb-0.5">Expires</p>
                  <p className={`text-sm tracking-wider font-mono transition-all duration-200 ${focused === 'expiry' ? 'text-white/90' : 'text-white/60'}`}>
                    MM / YY
                  </p>
                </div>
              </div>
            </div>
            {/* Visa wordmark */}
            <div className="absolute bottom-4 right-5">
              <span className="font-black italic text-[22px] tracking-wide"
                style={{ color: '#d4a574', fontFamily: 'Georgia, "Times New Roman", serif' }}>
                VISA
              </span>
            </div>
            {/* focus ring */}
            <div className={`absolute inset-0 border-2 border-[#d4a574] rounded-sm transition-opacity duration-300 ${focused && focused !== 'cvc' ? 'opacity-40' : 'opacity-0'}`} />
          </div>
        </div>

        {/* ── Card back ── */}
        <div style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', position: 'absolute', inset: 0 }} className="overflow-hidden rounded-sm">
          <div className="h-full flex flex-col"
            style={{ background: 'linear-gradient(135deg, #1c1c1c 0%, #0a0a0a 55%, #16120a 100%)' }}>
            <div className="absolute inset-0 opacity-[0.07]"
              style={{ background: 'linear-gradient(135deg, #d4a574 0%, transparent 55%)' }} />
            {/* magnetic stripe */}
            <div className="h-11 bg-black/80 mt-6 relative z-10" />
            {/* signature + CVV */}
            <div className="px-5 mt-4 relative z-10">
              <div className="h-10 bg-white/90 flex items-center justify-end pr-3 gap-2">
                <div className="flex-1 h-full bg-[repeating-linear-gradient(90deg,#f5f5f0_0px,#f5f5f0_6px,#e8e4dc_6px,#e8e4dc_8px)] opacity-60" />
                <div className="flex items-center gap-1 pl-2">
                  <p className="text-black/40 text-[10px] font-mono italic mr-1">CVV</p>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="w-[7px] h-[7px] rounded-full bg-black/40" />
                  ))}
                </div>
              </div>
              <p className="text-white/20 text-[9px] mt-1.5 text-right">3-digit code · back of card</p>
            </div>
            {/* footer */}
            <div className="absolute bottom-4 right-5 left-5 flex justify-between items-center z-10">
              {/* hologram circles */}
              <div className="flex -space-x-2">
                <div className="w-7 h-7 rounded-full border border-[#d4a574]/30" style={{ background: 'radial-gradient(circle at 40% 40%, #d4a57420, transparent)' }} />
                <div className="w-7 h-7 rounded-full border border-[#d4a574]/20" style={{ background: 'radial-gradient(circle at 60% 60%, #d4a57415, transparent)' }} />
              </div>
              <span className="font-black italic text-[18px]"
                style={{ color: '#d4a574', fontFamily: 'Georgia, "Times New Roman", serif' }}>VISA</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Stripe Visa form ───────────────────────────────────────────────────────────
function StripeVisaForm({ orderId, clientSecret, priceUsd, name, onSuccess, onError }: {
  orderId: string; clientSecret: string; priceUsd: string; name: string;
  onSuccess: () => void; onError: (msg: string) => void;
}) {
  const stripe   = useStripe();
  const elements = useElements();
  const [busy, setBusy]             = useState(false);
  const [focused, setFocused]       = useState<'number' | 'expiry' | 'cvc' | null>(null);
  const [brandError, setBrandError] = useState('');

  const elStyle = {
    style: {
      base: {
        fontSize: '15px', color: '#0a0a0a',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        '::placeholder': { color: '#c8c8c8' },
        letterSpacing: '0.02em',
      },
      invalid: { color: '#dc2626' },
    },
  };

  const pay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || brandError) return;
    setBusy(true);
    const cardEl = elements.getElement(CardNumberElement);
    if (!cardEl) { setBusy(false); return; }
    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card: cardEl },
    });
    if (error) { onError(error.message ?? 'Card payment failed'); setBusy(false); return; }
    if (paymentIntent?.status === 'succeeded') {
      await fetch(`${API}/payments/orders/${orderId}/`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      });
      onSuccess();
    }
    setBusy(false);
  };

  const fieldClass = (f: typeof focused) =>
    `border px-4 py-3.5 transition-colors ${focused === f ? 'border-[#d4a574] bg-[#fdf8f3]' : 'border-black/15'}`;

  return (
    <form onSubmit={pay} className="space-y-5">
      <VisaCardPreview name={name} focused={focused} />

      {brandError && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-sm">
          <AlertCircle size={15} className="flex-shrink-0" />{brandError}
        </div>
      )}

      {/* Card number */}
      <div>
        <p className="block text-[10px] font-semibold text-black/40 uppercase tracking-[0.15em] mb-2">Card Number</p>
        <div className={fieldClass('number')}>
          <CardNumberElement options={elStyle}
            onFocus={() => setFocused('number')}
            onBlur={() => setFocused(null)}
            onChange={e => {
              if (e.brand && e.brand !== 'visa' && e.brand !== 'unknown') {
                setBrandError('Only Visa cards are accepted. Please use a Visa card.');
              } else {
                setBrandError('');
              }
            }}
          />
        </div>
      </div>

      {/* Expiry + CVV */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="block text-[10px] font-semibold text-black/40 uppercase tracking-[0.15em] mb-2">Expiry Date</p>
          <div className={fieldClass('expiry')}>
            <CardExpiryElement options={elStyle}
              onFocus={() => setFocused('expiry')}
              onBlur={() => setFocused(null)}
            />
          </div>
        </div>
        <div>
          <p className="block text-[10px] font-semibold text-black/40 uppercase tracking-[0.15em] mb-2">
            Security Code
          </p>
          <div className={fieldClass('cvc')}>
            <CardCvcElement options={elStyle}
              onFocus={() => setFocused('cvc')}
              onBlur={() => setFocused(null)}
            />
          </div>
          <p className="text-[9px] text-black/25 mt-1">↑ Card flips to show CVV</p>
        </div>
      </div>

      <button type="submit" disabled={busy || !stripe || !!brandError}
        className="w-full py-4 bg-[#0a0a0a] text-white hover:bg-[#d4a574] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 font-medium text-sm tracking-wide mt-2">
        {busy
          ? <><Loader2 size={17} className="animate-spin" /> Processing payment…</>
          : <><Lock size={15} /> Pay ${priceUsd} · Visa</>}
      </button>

      <div className="flex items-center justify-center gap-2 text-[10px] text-black/30 pt-1">
        <ShieldCheck size={12} />
        <span>256-bit TLS · Secured by Stripe · Visa Verified</span>
      </div>
    </form>
  );
}

// ── M-Pesa phone mockup ────────────────────────────────────────────────────────
function MpesaPhoneUI({ priceKes, mpesaMsg, paid }: {
  priceKes: number; mpesaMsg: string; paid: boolean;
}) {
  const steps = [
    { label: 'STK Push sent to Safaricom', done: true,  active: false },
    { label: 'Enter your M-Pesa PIN now',  done: paid,  active: !paid },
    { label: 'Confirming payment',          done: paid,  active: false },
  ];
  return (
    <div className="flex flex-col items-center py-2">
      {/* Phone shell */}
      <div className="relative w-44 overflow-hidden shadow-2xl"
        style={{ borderRadius: '2rem', border: '4px solid #1a1a1a', background: '#0d0d0d' }}>
        {/* Notch */}
        <div className="h-6 flex items-center justify-center bg-[#0d0d0d]">
          <div className="w-14 h-3 rounded-b-xl" style={{ background: '#111' }} />
        </div>
        {/* Screen */}
        <div className="bg-[#f0f0f0] px-2.5 pt-1.5 pb-3 min-h-[195px]">
          {/* status bar */}
          <div className="flex justify-between text-[8px] text-black/40 mb-2 px-0.5">
            <span>9:41</span><span className="tracking-widest">●●●</span>
          </div>
          {/* M-Pesa header notification */}
          <div className="rounded-xl p-2.5 mb-2" style={{ background: '#00A651' }}>
            <div className="flex items-center gap-1.5 mb-1">
              <Smartphone size={10} className="text-white" />
              <p className="text-white font-bold text-[9px]">M-PESA</p>
            </div>
            <p className="text-white/90 text-[9px] leading-tight">{mpesaMsg || 'Lipa na M-Pesa request received'}</p>
          </div>
          {/* Payment card */}
          <div className="bg-white rounded-lg p-2.5 shadow-sm">
            <p className="text-[8px] text-black/40 mb-0.5 uppercase tracking-wider">Amount</p>
            <p className="font-bold text-sm text-black">KES {priceKes.toLocaleString()}</p>
            <div className="border-t border-black/5 mt-2 pt-2">
              <p className="text-[8px] text-black/40 mb-1.5">M-Pesa PIN</p>
              {/* PIN dots */}
              <div className="flex gap-1.5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-4 h-4 rounded-full border-2"
                    style={{ borderColor: '#00A651' }}
                    animate={!paid ? { scale: [1, 1.15, 1], backgroundColor: ['#ffffff', '#00A65120', '#ffffff'] } : { backgroundColor: '#00A651' }}
                    transition={!paid ? { duration: 1.2, delay: i * 0.15, repeat: Infinity } : {}}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
        {/* Home indicator */}
        <div className="h-5 flex items-center justify-center bg-[#0d0d0d]">
          <div className="w-10 h-1 rounded-full bg-white/15" />
        </div>
      </div>

      {/* Progress steps */}
      <div className="mt-7 w-full space-y-3 max-w-[260px]">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500 ${
              s.done   ? 'bg-[#00A651] border-2 border-[#00A651]' :
              s.active ? 'border-2 border-[#d4a574] bg-[#d4a574]/10' :
                         'border-2 border-black/10 bg-white'
            }`}>
              {s.done   ? <Check size={12} className="text-white" strokeWidth={2.5} /> :
               s.active ? <Loader2 size={12} className="animate-spin text-[#d4a574]" /> :
                          <div className="w-1.5 h-1.5 rounded-full bg-black/15" />}
            </div>
            <span className={`text-sm leading-snug transition-colors duration-300 ${
              s.done ? 'text-black/40 line-through decoration-black/20' :
              s.active ? 'text-black font-medium' : 'text-black/25'
            }`}>
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Payment modal ──────────────────────────────────────────────────────────────
function PaymentModal({ book, onClose }: { book: BookData; onClose: () => void }) {
  const [step, setStep]     = useState<CheckoutStep>(1);
  const [method, setMethod] = useState<PaymentMethod>('mpesa');
  const [form, setForm]     = useState({ name: '', email: '', phone: '' });
  const [fieldErr, setFieldErr] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<OrderStatus>('idle');
  const [errMsg, setErrMsg] = useState('');
  const [orderId, setOrderId]   = useState('');
  const [secret, setSecret]     = useState('');
  const [stripeKey, setStrKey]  = useState('');
  const [mpesaMsg, setMpesaMsg] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => { window.removeEventListener('keydown', h); stopPoll(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopPoll = () => { if (pollRef.current) clearInterval(pollRef.current); };

  const startPoll = (id: string) => {
    let n = 0;
    pollRef.current = setInterval(async () => {
      n++;
      const s = await pollOrderStatus(id);
      if (s === 'paid') { setStatus('paid'); stopPoll(); return; }
      if (s === 'failed' || s === 'cancelled' || n > 24) {
        setStatus('failed');
        setErrMsg(
          s === 'failed'    ? 'Payment was not completed on your phone.' :
          s === 'cancelled' ? 'Payment was cancelled.' :
                              'Request timed out. Please try again.'
        );
        stopPoll();
      }
    }, 5000);
  };

  const validate1 = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim())  e.name  = 'Full name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email address';
    if (method === 'mpesa') {
      const phone = form.phone.replace(/\s/g, '');
      if (!phone) e.phone = 'M-Pesa number is required';
      else if (!/^(07|01|\+?2547|\+?2541)\d{8}$/.test(phone))
        e.phone = 'Enter a valid Safaricom number (e.g. 0712 345 678)';
    }
    setFieldErr(e);
    return Object.keys(e).length === 0;
  };

  const handleContinue = () => {
    if (!validate1()) return;
    setStep(2);
    if (method === 'visa') {
      setStatus('processing');
      fetch(`${API}/payments/stripe/create-intent/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name, email: form.email,
          amount: Math.round(parseFloat(book.price_usd) * 100),
          currency: 'usd',
        }),
      })
        .then(r => r.json() as Promise<StripeResp>)
        .then(json => {
          if (!json.success || !json.data) throw new Error(json.error?.message ?? 'Failed to initialise payment');
          setSecret(json.data.client_secret);
          setStrKey(json.data.publishable_key);
          setOrderId(json.data.order_id);
          setStatus('idle');
        })
        .catch((err: unknown) => { setStatus('failed'); setErrMsg(err instanceof Error ? err.message : 'Request failed'); });
    }
  };

  const handleMpesaSend = async () => {
    setStatus('processing'); setErrMsg('');
    try {
      const r = await initMpesa({ name: form.name, email: form.email, phone: form.phone, amount: book.price_kes });
      setOrderId(r.order_id); setMpesaMsg(r.message);
      setStatus('polling'); setStep(3);
      startPoll(r.order_id);
    } catch (err) {
      setStatus('failed');
      setErrMsg(err instanceof Error ? err.message : 'Request failed');
      setStep(3);
    }
  };

  const reset = () => {
    stopPoll();
    setStep(1); setStatus('idle'); setErrMsg('');
    setOrderId(''); setSecret(''); setStrKey(''); setMpesaMsg('');
    setFieldErr({});
  };

  const goBack = () => {
    setStep(1); setStatus('idle'); setSecret(''); setStrKey('');
  };

  const field = (key: 'name' | 'email' | 'phone') => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm(p => ({ ...p, [key]: e.target.value }));
      setFieldErr(p => ({ ...p, [key]: '' }));
    },
    className: `w-full px-4 py-3.5 border outline-none text-sm transition-colors ${
      fieldErr[key] ? 'border-red-400 bg-red-50/60' : 'border-black/12 focus:border-[#d4a574]'
    }`,
  });

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      style={{ backgroundColor: 'rgba(5,5,5,0.88)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 24 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 8 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md bg-white relative my-8 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center text-white/40 hover:text-white transition-colors">
          <X size={19} />
        </button>

        {/* Header */}
        <div className="px-8 pt-8 pb-6" style={{ background: '#0a0a0a' }}>
          <div className="w-8 h-[2px] bg-[#d4a574] mb-4" />
          <h2 className="text-xl text-white mb-1" style={{ fontFamily: 'var(--font-serif)' }}>
            {book.is_published ? 'Purchase' : 'Pre-Order'} · {book.title}
          </h2>
          <div className="flex gap-5 mt-4 pt-4 border-t border-white/8">
            <div>
              <p className="text-[9px] text-white/30 uppercase tracking-[0.18em] mb-0.5">M-Pesa</p>
              <p className="text-lg text-[#d4a574]" style={{ fontFamily: 'var(--font-serif)' }}>
                KES {book.price_kes.toLocaleString()}
              </p>
            </div>
            <div className="w-px bg-white/8" />
            <div>
              <p className="text-[9px] text-white/30 uppercase tracking-[0.18em] mb-0.5">Visa Card</p>
              <p className="text-lg text-[#d4a574]" style={{ fontFamily: 'var(--font-serif)' }}>
                ${book.price_usd} USD
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-8 py-7">
          {/* Step bar — only on steps 1 & 2 */}
          {step < 3 && status !== 'polling' && (
            <StepBar step={step} method={method} />
          )}

          <AnimatePresence mode="wait">

            {/* ── Step 1: Details ── */}
            {step === 1 && (
              <motion.div key="s1"
                initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -18 }} transition={{ duration: 0.22 }}
                className="space-y-5"
              >
                {/* Name */}
                <div>
                  <label htmlFor="checkout-name" className="block text-[10px] font-semibold text-black/40 uppercase tracking-[0.15em] mb-1.5">Full Name *</label>
                  <input id="checkout-name" type="text" placeholder="Philip Koboko" {...field('name')} />
                  {fieldErr.name && <p className="text-red-500 text-xs mt-1">{fieldErr.name}</p>}
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="checkout-email" className="block text-[10px] font-semibold text-black/40 uppercase tracking-[0.15em] mb-1.5">Email Address *</label>
                  <input id="checkout-email" type="email" placeholder="you@email.com" {...field('email')} />
                  {fieldErr.email && <p className="text-red-500 text-xs mt-1">{fieldErr.email}</p>}
                </div>

                {/* Payment method */}
                <div>
                  <p className="block text-[10px] font-semibold text-black/40 uppercase tracking-[0.15em] mb-2">Pay With *</p>
                  <div className="grid grid-cols-2 gap-3">
                    {([
                      {
                        key: 'mpesa' as PaymentMethod,
                        label: 'M-Pesa',
                        sub: `KES ${book.price_kes.toLocaleString()} · Kenya`,
                        Icon: Smartphone,
                        accentColor: '#00A651',
                      },
                      {
                        key: 'visa' as PaymentMethod,
                        label: 'Visa Card',
                        sub: `$${book.price_usd} USD · Worldwide`,
                        Icon: CreditCard,
                        accentColor: '#1A1F71',
                      },
                    ] as const).map(({ key, label, sub, Icon, accentColor }) => (
                      <button
                        key={key} type="button"
                        onClick={() => { setMethod(key); setFieldErr(p => ({ ...p, phone: '' })); }}
                        className={`relative p-4 border-2 text-left transition-all duration-200 ${
                          method === key ? 'border-[#d4a574] bg-[#fdf9f5]' : 'border-black/10 hover:border-black/22 bg-white'
                        }`}
                      >
                        {method === key && (
                          <div className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-[#d4a574] flex items-center justify-center">
                            <Check size={9} className="text-white" strokeWidth={3} />
                          </div>
                        )}
                        <Icon size={19} className="mb-2.5" style={{ color: method === key ? accentColor : '#b0b0b0' }} />
                        <p className="font-semibold text-sm text-black">{label}</p>
                        <p className="text-[10px] text-black/38 mt-0.5 leading-tight">{sub}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* M-Pesa phone field */}
                <AnimatePresence>
                  {method === 'mpesa' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.22 }}
                    >
                      <label htmlFor="checkout-phone" className="block text-[10px] font-semibold text-black/40 uppercase tracking-[0.15em] mb-1.5">M-Pesa Number *</label>
                      <div className={`flex border transition-colors ${fieldErr.phone ? 'border-red-400' : 'border-black/12 focus-within:border-[#d4a574]'}`}>
                        <div className="flex items-center px-3 gap-1.5 flex-shrink-0 border-r border-inherit bg-[#f7f7f5]">
                          <span className="text-sm">🇰🇪</span>
                          <span className="text-xs text-black/45 font-mono">+254</span>
                        </div>
                        <input
                          id="checkout-phone"
                          type="tel"
                          placeholder="712 345 678"
                          value={form.phone}
                          onChange={e => { setForm(p => ({ ...p, phone: e.target.value })); setFieldErr(p => ({ ...p, phone: '' })); }}
                          className="flex-1 px-3 py-3.5 outline-none text-sm bg-transparent"
                        />
                      </div>
                      {fieldErr.phone
                        ? <p className="text-red-500 text-xs mt-1">{fieldErr.phone}</p>
                        : <p className="text-[10px] text-black/28 mt-1">Safaricom number registered with M-Pesa</p>
                      }
                    </motion.div>
                  )}
                </AnimatePresence>

                <button onClick={handleContinue}
                  className="w-full py-4 bg-[#0a0a0a] text-white hover:bg-[#d4a574] transition-all duration-300 flex items-center justify-center gap-2 font-medium text-sm tracking-wide">
                  Continue <ArrowRight size={17} />
                </button>
              </motion.div>
            )}

            {/* ── Step 2: Payment Details ── */}
            {step === 2 && (
              <motion.div key="s2"
                initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -18 }} transition={{ duration: 0.22 }}
              >
                <button onClick={goBack}
                  className="flex items-center gap-1 text-xs text-black/35 hover:text-black mb-5 transition-colors">
                  <ChevronLeft size={15} /> Back to details
                </button>

                {/* ── Visa card form ── */}
                {method === 'visa' && (
                  <>
                    {status === 'processing' && !secret && (
                      <div className="text-center py-14">
                        <Loader2 className="w-8 h-8 text-[#d4a574] mx-auto mb-3 animate-spin" />
                        <p className="text-sm text-black/50">Setting up secure payment…</p>
                      </div>
                    )}
                    {status === 'failed' && !secret && (
                      <div className="text-center py-10">
                        <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
                        <p className="text-black/60 text-sm mb-5">{errMsg || 'Could not initialise payment.'}</p>
                        <button onClick={reset}
                          className="px-6 py-3 bg-black text-white hover:bg-[#d4a574] transition-all text-sm flex items-center gap-2 mx-auto">
                          <RefreshCw size={15} /> Try Again
                        </button>
                      </div>
                    )}
                    {secret && stripeKey && (
                      <Elements stripe={getStripe(stripeKey)} options={{ clientSecret: secret }}>
                        <StripeVisaForm
                          orderId={orderId} clientSecret={secret}
                          priceUsd={book.price_usd} name={form.name}
                          onSuccess={() => { setStatus('paid'); setStep(3); }}
                          onError={msg => { setStatus('failed'); setErrMsg(msg); setStep(3); }}
                        />
                      </Elements>
                    )}
                  </>
                )}

                {/* ── M-Pesa confirm ── */}
                {method === 'mpesa' && (
                  <>
                    {status === 'processing' ? (
                      <div className="text-center py-14">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" style={{ color: '#00A651' }} />
                        <p className="text-sm text-black/50">Sending M-Pesa request…</p>
                      </div>
                    ) : (
                      <div className="space-y-5">
                        {/* Order card */}
                        <div className="border border-black/8 p-5 bg-[#f9f9f7]">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <p className="font-semibold text-sm">{book.title}</p>
                              <p className="text-[11px] text-black/40 mt-0.5">
                                {book.is_published ? 'Purchase' : 'Pre-Order'} · First Edition
                              </p>
                            </div>
                            <p className="font-bold text-lg text-[#d4a574]" style={{ fontFamily: 'var(--font-serif)' }}>
                              KES {book.price_kes.toLocaleString()}
                            </p>
                          </div>
                          <div className="border-t border-black/8 pt-3 flex justify-between text-xs text-black/40">
                            <span>Charged to</span>
                            <span className="font-mono text-black/65">{form.phone}</span>
                          </div>
                        </div>

                        {/* How it works */}
                        <div>
                          <p className="text-[10px] text-black/35 uppercase tracking-widest mb-3">How it works</p>
                          <div className="space-y-3">
                            {[
                              'We send an STK Push to your Safaricom number',
                              'A pop-up appears on your phone — enter your M-Pesa PIN',
                              'Payment confirmed instantly · Receipt emailed to you',
                            ].map((text, i) => (
                              <div key={i} className="flex items-start gap-3">
                                <div className="w-5 h-5 rounded-full flex items-center justify-center text-white font-bold text-[10px] flex-shrink-0 mt-0.5"
                                  style={{ background: '#00A651', minWidth: 20 }}>
                                  {i + 1}
                                </div>
                                <p className="text-sm text-black/55 leading-relaxed">{text}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        <button onClick={handleMpesaSend}
                          className="w-full py-4 text-white transition-all duration-300 flex items-center justify-center gap-2 font-medium text-sm tracking-wide"
                          style={{ background: '#00A651' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#008a43')}
                          onMouseLeave={e => (e.currentTarget.style.background = '#00A651')}>
                          <Smartphone size={17} /> Send M-Pesa Request
                        </button>

                        <div className="flex items-center justify-center gap-2 text-[10px] text-black/28">
                          <ShieldCheck size={11} /> Safaricom Daraja API · Encrypted
                        </div>
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            )}

            {/* ── Step 3: Result ── */}
            {step === 3 && (
              <motion.div key="s3"
                initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25 }}
              >
                {/* M-Pesa polling */}
                {status === 'polling' && (
                  <div>
                    <div className="text-center mb-5">
                      <h3 className="text-xl font-medium" style={{ fontFamily: 'var(--font-serif)' }}>Check Your Phone</h3>
                      <p className="text-xs text-black/40 mt-1">Waiting for M-Pesa confirmation…</p>
                    </div>
                    <MpesaPhoneUI priceKes={book.price_kes} mpesaMsg={mpesaMsg} paid={false} />
                    <button onClick={() => { stopPoll(); reset(); }}
                      className="w-full mt-6 py-2 text-sm text-black/35 hover:text-black transition-colors underline decoration-black/20">
                      Cancel this payment
                    </button>
                  </div>
                )}

                {/* Success */}
                {status === 'paid' && (
                  <div className="text-center py-6">
                    {method === 'mpesa' && (
                      <div className="mb-4">
                        <MpesaPhoneUI priceKes={book.price_kes} mpesaMsg={mpesaMsg} paid={true} />
                      </div>
                    )}
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      className="w-16 h-16 rounded-full border-2 border-green-400 bg-green-50 flex items-center justify-center mx-auto mb-5"
                    >
                      <CheckCircle className="w-8 h-8 text-green-500" />
                    </motion.div>
                    <h3 className="text-2xl mb-2" style={{ fontFamily: 'var(--font-serif)' }}>
                      {book.is_published ? 'Purchase Confirmed!' : 'Pre-Order Confirmed!'}
                    </h3>
                    <p className="text-black/55 text-sm mb-1">Thank you, {form.name.split(' ')[0]}.</p>
                    <p className="text-black/38 text-sm mb-8">
                      Receipt sent to <strong className="text-black/55">{form.email}</strong>
                    </p>
                    <button onClick={onClose}
                      className="px-10 py-3 bg-[#0a0a0a] text-white hover:bg-[#d4a574] transition-all text-sm">
                      Done
                    </button>
                  </div>
                )}

                {/* Failed */}
                {status === 'failed' && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-full border-2 border-red-300 bg-red-50 flex items-center justify-center mx-auto mb-5">
                      <AlertCircle className="w-8 h-8 text-red-400" />
                    </div>
                    <h3 className="text-xl mb-2" style={{ fontFamily: 'var(--font-serif)' }}>Payment Failed</h3>
                    <p className="text-black/55 text-sm mb-7 max-w-xs mx-auto leading-relaxed">
                      {errMsg || 'Something went wrong. Please try again.'}
                    </p>
                    <button onClick={reset}
                      className="px-8 py-3 bg-[#0a0a0a] text-white hover:bg-[#d4a574] transition-all text-sm flex items-center gap-2 mx-auto">
                      <RefreshCw size={15} /> Try Again
                    </button>
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Get Notified modal ─────────────────────────────────────────────────────────
function NotifyModal({ book, onClose }: { book: BookData; onClose: () => void }) {
  const [form, setForm] = useState({ name: '', email: '' });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr]   = useState('');

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) { setErr('Name and email are required.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setErr('Enter a valid email.'); return; }
    setBusy(true); setErr('');
    try {
      const res  = await fetch(`${API}/newsletter/subscribe/`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email }),
      });
      const json = (await res.json()) as { success?: boolean; error?: { message?: string } };
      if (res.ok || json.success) { setDone(true); }
      else throw new Error(json.error?.message ?? 'Could not subscribe');
    } catch {
      setDone(true); // still show success — notifications are low-stakes
    }
    setBusy(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(5,5,5,0.88)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm bg-white relative shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose}
          className="absolute top-4 right-4 z-10 text-white/35 hover:text-white transition-colors">
          <X size={19} />
        </button>

        <div className="px-8 pt-8 pb-6" style={{ background: '#0a0a0a' }}>
          <div className="w-8 h-[2px] bg-[#d4a574] mb-4" />
          <h2 className="text-xl text-white" style={{ fontFamily: 'var(--font-serif)' }}>Get Notified</h2>
          <p className="text-white/40 text-sm mt-1">
            Be the first to know when <em>"{book.title}"</em> launches
          </p>
        </div>

        <div className="px-8 py-7">
          <AnimatePresence mode="wait">
            {done ? (
              <motion.div key="done" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center py-4">
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 18 }}
                  className="w-14 h-14 rounded-full border-2 border-[#d4a574] bg-[#d4a574]/8 flex items-center justify-center mx-auto mb-5"
                >
                  <Bell className="w-7 h-7 text-[#d4a574]" />
                </motion.div>
                <h3 className="text-xl mb-2" style={{ fontFamily: 'var(--font-serif)' }}>You're on the list!</h3>
                <p className="text-black/50 text-sm mb-7 leading-relaxed">
                  We'll notify <strong className="text-black/65">{form.email}</strong> the moment the book is available.
                </p>
                <button onClick={onClose}
                  className="px-8 py-3 bg-[#0a0a0a] text-white hover:bg-[#d4a574] transition-all text-sm">
                  Done
                </button>
              </motion.div>
            ) : (
              <motion.form key="form" onSubmit={submit} className="space-y-4">
                {err && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-600 text-sm">
                    <AlertCircle size={14} />{err}
                  </div>
                )}
                <div>
                  <label htmlFor="notify-name" className="block text-[10px] font-semibold text-black/40 uppercase tracking-[0.15em] mb-1.5">Name *</label>
                  <input id="notify-name" value={form.name} onChange={e => { setForm(p => ({ ...p, name: e.target.value })); setErr(''); }}
                    className="w-full px-4 py-3.5 border border-black/12 focus:border-[#d4a574] outline-none text-sm transition-colors"
                    placeholder="Your name" />
                </div>
                <div>
                  <label htmlFor="notify-email" className="block text-[10px] font-semibold text-black/40 uppercase tracking-[0.15em] mb-1.5">Email *</label>
                  <input id="notify-email" type="email" value={form.email} onChange={e => { setForm(p => ({ ...p, email: e.target.value })); setErr(''); }}
                    className="w-full px-4 py-3.5 border border-black/12 focus:border-[#d4a574] outline-none text-sm transition-colors"
                    placeholder="you@email.com" />
                </div>
                <button type="submit" disabled={busy}
                  className="w-full py-4 bg-[#0a0a0a] text-white hover:bg-[#d4a574] disabled:opacity-45 transition-all flex items-center justify-center gap-2 font-medium text-sm tracking-wide">
                  {busy ? <><Loader2 size={16} className="animate-spin" /> Subscribing…</> : <><Bell size={15} /> Notify Me at Launch</>}
                </button>
                <p className="text-[10px] text-black/28 text-center">No spam. Unsubscribe any time.</p>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export function Book() {
  const [book, setBook]             = useState<BookData | null>(null);
  const [loading, setLoading]       = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [showNotify, setShowNotify]   = useState(false);

  const [testimonialForm, setTestimonialForm] = useState({ name: '', title: '', email: '', quote: '' });
  const [testimonialRating, setTestimonialRating] = useState(0);
  const [testimonialHover, setTestimonialHover] = useState(0);
  const [testimonialSubmitting, setTestimonialSubmitting] = useState(false);
  const [testimonialSubmitted, setTestimonialSubmitted] = useState(false);
  const [testimonialError, setTestimonialError] = useState('');

  useEffect(() => {
    fetch(`${API}/books/`)
      .then(r => r.json() as Promise<BookListResp>)
      .then(d => {
        const results: BookData[] = Array.isArray(d.data) ? d.data : (d.data?.results ?? []);
        const first = results[0];
        if (first) setBook(first);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen pt-20 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-[#d4a574]" />
    </div>
  );

  if (!book) return (
    <div className="min-h-screen pt-20 flex items-center justify-center text-center px-6">
      <div>
        <BookOpen className="w-16 h-16 mx-auto mb-4 text-black/20" />
        <p className="text-black/40 text-lg">No book information available yet.</p>
      </div>
    </div>
  );

  const isPublished = book.is_published;
  const hasAmazon   = isPublished && !!book.amazon_url;

  const submitTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testimonialForm.quote.trim() || !testimonialForm.name.trim()) return;
    setTestimonialSubmitting(true);
    setTestimonialError('');
    try {
      const res = await fetch(`${API}/books/${book.id}/testimonials/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quote: testimonialForm.quote,
          author_name: testimonialForm.name,
          author_title: testimonialForm.title,
          email: testimonialForm.email,
          rating: testimonialRating || 5,
        }),
      });
      const data = (await res.json()) as { success: boolean; error?: { message?: string } };
      if (!res.ok || !data.success) throw new Error(data.error?.message ?? 'Failed');
      setTestimonialSubmitted(true);
      setTestimonialForm({ name: '', title: '', email: '', quote: '' });
      setTestimonialRating(0);
    } catch {
      setTestimonialError('Something went wrong. Please try again.');
    } finally {
      setTestimonialSubmitting(false);
    }
  };

  const themes = [
    { icon: Heart,    title: 'Redemption', description: 'The journey from brokenness to wholeness through divine grace' },
    { icon: User,     title: 'Identity',   description: 'Discovering who you are beyond your wounds and failures' },
    { icon: Sparkles, title: 'Hope',       description: 'Finding light in the darkest moments of life' },
  ];

  return (
    <div className="min-h-screen pt-20">
      <SEO
        title={`${book.title} — ${book.subtitle || 'The Book'}`}
        description={book.description.slice(0, 160)}
        image={book.cover_image ?? undefined}
        url="/book"
      />

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden bg-[#0a0a0a]">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 80% 80% at 50% 60%, #0d1020 0%, #0a0a0a 65%)' }} />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 35% 45% at 50% 45%, #d4a57414 0%, transparent 70%)' }} />
        <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: 'linear-gradient(#d4a574 1px, transparent 1px)', backgroundSize: '100% 3rem' }} />
        <div className="absolute left-[10%] top-[15%] bottom-[15%] w-[2px] hidden lg:block"
          style={{ background: 'linear-gradient(180deg, transparent, #d4a574 20%, #d4a574 80%, transparent)' }} />

        <div className="relative z-20 text-center text-white px-6 max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            {book.cover_image ? (
              <img src={book.cover_image} alt={book.title} className="w-48 mx-auto mb-8 shadow-2xl" />
            ) : (
              <div className="w-20 h-20 mx-auto mb-8 flex items-center justify-center border border-[#d4a574]/40"
                style={{ background: 'rgba(212,165,116,0.06)' }}>
                <BookOpen className="w-10 h-10 text-[#d4a574]" />
              </div>
            )}
            <p className="text-sm uppercase tracking-widest mb-4 text-[#d4a574]">
              {isPublished ? 'Now Available' : 'Coming Soon'}
            </p>
            <h1 className="text-6xl md:text-8xl mb-4" style={{ fontFamily: 'var(--font-serif)' }}>{book.title}</h1>
            {book.subtitle && <p className="text-xl md:text-2xl text-white/60 mb-10">{book.subtitle}</p>}

            <div className="flex flex-wrap gap-4 justify-center">
              {hasAmazon ? (
                <a href={book.amazon_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-10 py-4 bg-[#d4a574] text-white hover:bg-[#c9a063] transition-all duration-300 text-lg">
                  <ShoppingCart size={20} /> Buy Now
                </a>
              ) : (
                <button onClick={() => setShowPayment(true)}
                  className="flex items-center gap-2 px-10 py-4 bg-[#d4a574] text-white hover:bg-[#c9a063] transition-all duration-300 text-lg">
                  <ShoppingCart size={20} /> {isPublished ? 'Purchase' : 'Pre-Order Now'}
                </button>
              )}
              {!isPublished && (
                <button onClick={() => setShowNotify(true)}
                  className="px-10 py-4 border border-white/30 text-white/80 hover:border-white hover:text-white transition-all duration-300 text-lg">
                  Get Notified
                </button>
              )}
            </div>

            {(Boolean(book.page_count) || Boolean(book.publisher)) && (
              <div className="flex justify-center gap-8 mt-10 text-white/30 text-xs uppercase tracking-widest">
                {book.page_count && <span>{book.page_count} pages</span>}
                {book.publisher  && <><span>·</span><span>{book.publisher}</span></>}
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* ── About ─────────────────────────────────────────────────────── */}
      <section className="py-24 lg:py-32 px-6 lg:px-12 max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <div className="w-12 h-[2px] bg-[#d4a574] mb-6" />
            <h2 className="text-4xl md:text-5xl mb-6" style={{ fontFamily: 'var(--font-serif)' }}>About the Book</h2>
            <p className="text-lg leading-relaxed text-black/70">{book.description}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
            className="bg-[#f5f5f0] p-12">
            <blockquote className="text-2xl md:text-3xl leading-relaxed mb-8" style={{ fontFamily: 'var(--font-serif)' }}>
              "We are not defined by our brokenness, but by the One who redeems it."
            </blockquote>
            <p className="text-black/60 uppercase text-sm tracking-wide">— {book.author}</p>
          </motion.div>
        </div>
      </section>

      {/* ── Key Themes ────────────────────────────────────────────────── */}
      <section className="py-24 lg:py-32 bg-black text-white">
        <div className="px-6 lg:px-12 max-w-[1400px] mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <div className="w-12 h-[2px] bg-[#d4a574] mb-6 mx-auto" />
            <h2 className="text-4xl md:text-5xl mb-16 text-center" style={{ fontFamily: 'var(--font-serif)' }}>Key Themes</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {themes.map((t, i) => (
                <motion.div key={t.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }} className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-[#d4a574] mb-6"><t.icon className="w-8 h-8" /></div>
                  <h3 className="text-2xl mb-4" style={{ fontFamily: 'var(--font-serif)' }}>{t.title}</h3>
                  <p className="text-white/70 leading-relaxed">{t.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Chapter Preview ───────────────────────────────────────────── */}
      {book.chapters.length > 0 && (
        <section className="py-24 lg:py-32 px-6 lg:px-12 max-w-[1400px] mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <div className="w-12 h-[2px] bg-[#d4a574] mb-6 mx-auto" />
            <h2 className="text-4xl md:text-5xl mb-16 text-center" style={{ fontFamily: 'var(--font-serif)' }}>Chapter Preview</h2>
            <div className="max-w-3xl mx-auto space-y-4">
              {book.chapters.map((ch, i) => (
                <motion.div key={ch.id} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.08 }}
                  className="border-l-4 border-[#d4a574] pl-8 py-4 hover:bg-[#f5f5f0] transition-colors">
                  <div className="flex items-baseline gap-6">
                    <span className="text-5xl text-[#d4a574]/30 flex-shrink-0" style={{ fontFamily: 'var(--font-serif)' }}>{ch.number}</span>
                    <div>
                      <h3 className="text-2xl mb-1" style={{ fontFamily: 'var(--font-serif)' }}>{ch.title}</h3>
                      {ch.theme   && <p className="text-black/50 italic text-sm mb-2">{ch.theme}</p>}
                      {ch.excerpt && <p className="text-black/65 text-sm leading-relaxed">{ch.excerpt}</p>}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>
      )}

      {/* ── Author's Note ─────────────────────────────────────────────── */}
      {book.authors_note && (
        <section className="py-24 lg:py-32 bg-[#f5f5f0]">
          <div className="px-6 lg:px-12 max-w-[1000px] mx-auto">
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center">
              <div className="w-12 h-[2px] bg-[#d4a574] mb-8 mx-auto" />
              <h2 className="text-4xl md:text-5xl mb-8" style={{ fontFamily: 'var(--font-serif)' }}>Author's Note</h2>
              <div className="text-lg leading-relaxed text-black/70 space-y-4 text-left max-w-2xl mx-auto">
                {book.authors_note.split('\n\n').map((para, i) => <p key={i}>{para}</p>)}
              </div>
              <p className="mt-8 text-xl text-black/60" style={{ fontFamily: 'var(--font-serif)' }}>— {book.author}</p>
            </motion.div>
          </div>
        </section>
      )}

      {/* ── Testimonials ──────────────────────────────────────────────── */}
      <section className="py-24 lg:py-32 bg-black text-white">
        <div className="px-6 lg:px-12 max-w-[1400px] mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <div className="w-12 h-[2px] bg-[#d4a574] mb-6 mx-auto" />
            <h2 className="text-4xl md:text-5xl mb-16 text-center" style={{ fontFamily: 'var(--font-serif)' }}>What People Say</h2>

            {book.testimonials.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
                {book.testimonials.map((t, i) => (
                  <motion.div key={t.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }}
                    className="border border-white/10 p-8 hover:border-[#d4a574]/40 transition-colors">
                    <div className="flex gap-1 mb-4">
                      {Array.from({ length: t.rating }).map((_, j) => <Star key={j} size={14} className="text-[#d4a574] fill-[#d4a574]" />)}
                    </div>
                    <p className="text-lg leading-relaxed text-white/85 mb-6" style={{ fontFamily: 'var(--font-serif)' }}>"{t.quote}"</p>
                    <div className="flex items-center gap-3">
                      {t.author_photo ? (
                        <img src={t.author_photo} alt={t.author_name} className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#d4a574]/20 flex items-center justify-center text-[#d4a574] font-semibold text-sm">
                          {t.author_name[0]}
                        </div>
                      )}
                      <div>
                        <p className="text-white font-medium text-sm">{t.author_name}</p>
                        {t.author_title && <p className="text-white/50 text-xs">{t.author_title}</p>}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Share a testimonial */}
            <div className="max-w-xl mx-auto border-t border-white/10 pt-16">
              {testimonialSubmitted ? (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 text-[#d4a574]" />
                  <h3 className="text-2xl mb-2" style={{ fontFamily: 'var(--font-serif)' }}>Thank You!</h3>
                  <p className="text-white/60">Your testimonial has been received and will appear here once approved.</p>
                </motion.div>
              ) : (
                <>
                  <h3 className="text-2xl mb-2 text-center" style={{ fontFamily: 'var(--font-serif)' }}>Share Your Thoughts</h3>
                  <p className="text-white/50 text-sm text-center mb-8">Read an early copy or have thoughts on the book? Leave a testimonial.</p>
                  <form onSubmit={submitTestimonial} className="space-y-5">
                    <div>
                      <p className="text-sm text-white/70 mb-3">Your rating</p>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button key={star} type="button"
                            onClick={() => setTestimonialRating(star)}
                            onMouseEnter={() => setTestimonialHover(star)}
                            onMouseLeave={() => setTestimonialHover(0)}
                            className="transition-transform hover:scale-110">
                            <Star size={28}
                              className={(testimonialHover || testimonialRating) >= star
                                ? 'text-[#d4a574] fill-[#d4a574]' : 'text-white/20'} />
                          </button>
                        ))}
                      </div>
                    </div>

                    <textarea required rows={4} placeholder="What did you think? *"
                      value={testimonialForm.quote}
                      onChange={e => setTestimonialForm(f => ({ ...f, quote: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/5 border border-white/15 focus:border-[#d4a574] outline-none transition-colors resize-none text-white placeholder:text-white/30" />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <input required placeholder="Your name *" value={testimonialForm.name}
                        onChange={e => setTestimonialForm(f => ({ ...f, name: e.target.value }))}
                        className="px-4 py-3 bg-white/5 border border-white/15 focus:border-[#d4a574] outline-none transition-colors text-white placeholder:text-white/30" />
                      <input placeholder="Title / role (optional)" value={testimonialForm.title}
                        onChange={e => setTestimonialForm(f => ({ ...f, title: e.target.value }))}
                        className="px-4 py-3 bg-white/5 border border-white/15 focus:border-[#d4a574] outline-none transition-colors text-white placeholder:text-white/30" />
                    </div>

                    <input type="email" placeholder="Email (optional, not published)" value={testimonialForm.email}
                      onChange={e => setTestimonialForm(f => ({ ...f, email: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/5 border border-white/15 focus:border-[#d4a574] outline-none transition-colors text-white placeholder:text-white/30" />

                    {testimonialError && <p className="text-red-400 text-sm">{testimonialError}</p>}

                    <button type="submit" disabled={testimonialSubmitting}
                      className="w-full px-6 py-4 bg-[#d4a574] text-black hover:bg-white transition-all duration-300 font-medium disabled:opacity-60">
                      {testimonialSubmitting ? 'Submitting…' : 'Submit Testimonial'}
                    </button>
                    <p className="text-xs text-white/35 text-center">Testimonials are reviewed before appearing publicly.</p>
                  </form>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Reserve Your Copy CTA ─────────────────────────────────────── */}
      <section className="py-24 lg:py-32 px-6 lg:px-12 max-w-[1400px] mx-auto">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center">
          <div className="w-12 h-[2px] bg-[#d4a574] mb-8 mx-auto" />
          <h2 className="text-4xl md:text-5xl mb-5" style={{ fontFamily: 'var(--font-serif)' }}>
            {isPublished ? 'Get Your Copy' : 'Reserve Your Copy'}
          </h2>
          <p className="text-lg text-black/55 max-w-xl mx-auto mb-10 leading-relaxed">
            {isPublished
              ? `"${book.title}" is now available. Order your copy today.`
              : `Be among the first to receive "${book.title}" when it launches. Pre-order now and secure your copy.`}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-10">
            {hasAmazon ? (
              <a href={book.amazon_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-10 py-4 bg-black text-white hover:bg-[#d4a574] transition-all duration-300 text-base font-medium">
                <ExternalLink size={18} /> Buy on Amazon
              </a>
            ) : (
              <button onClick={() => setShowPayment(true)}
                className="flex items-center gap-2 px-10 py-4 bg-black text-white hover:bg-[#d4a574] transition-all duration-300 text-base font-medium">
                <ShoppingCart size={18} /> {isPublished ? 'Purchase Now' : 'Pre-Order Now'}
              </button>
            )}
            {!isPublished && (
              <button onClick={() => setShowNotify(true)}
                className="flex items-center gap-2 px-10 py-4 border-2 border-black text-black hover:bg-black hover:text-white transition-all duration-300 text-base font-medium">
                <Bell size={18} /> Get Notified
              </button>
            )}
          </div>

          {/* Payment method badges */}
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 px-4 py-2 border border-black/10 bg-[#f9f9f9] rounded-sm">
              <Smartphone size={15} style={{ color: '#00A651' }} />
              <span className="text-sm text-black/55 font-medium">M-Pesa</span>
              <span className="text-xs text-black/30">· Kenya</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 border border-black/10 bg-[#f9f9f9] rounded-sm">
              <CreditCard size={15} style={{ color: '#1A1F71' }} />
              <span className="text-sm text-black/55 font-medium italic font-bold" style={{ fontFamily: 'Georgia, serif' }}>VISA</span>
              <span className="text-xs text-black/30">· Worldwide</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 border border-black/10 bg-[#f9f9f9] rounded-sm">
              <Lock size={13} className="text-black/30" />
              <span className="text-xs text-black/40">Secure Checkout</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Modals */}
      <AnimatePresence>
        {showPayment && <PaymentModal book={book} onClose={() => setShowPayment(false)} />}
        {showNotify  && <NotifyModal  book={book} onClose={() => setShowNotify(false)}  />}
      </AnimatePresence>
    </div>
  );
}
