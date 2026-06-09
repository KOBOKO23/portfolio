import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X, Send, CheckCircle, Star } from 'lucide-react';

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) return;
    setIsSubmitting(true);
    setError('');
    try {
      const res = await fetch(`${API}/feedback/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: rating || 5, message: feedback, email, page_url: window.location.pathname }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error?.message || 'Failed');
      setIsSubmitted(true);
      setTimeout(() => {
        setIsSubmitted(false);
        setIsOpen(false);
        setFeedback('');
        setEmail('');
        setRating(0);
      }, 3000);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.3, type: 'spring' }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#d4a574] text-white rounded-full shadow-2xl hover:bg-[#c9a063] transition-all duration-300 flex items-center justify-center group hover:w-auto hover:px-6 overflow-hidden"
            aria-label="Open feedback"
          >
            <MessageCircle size={24} className="flex-shrink-0" />
            <span className="ml-3 opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity duration-300 text-sm font-medium">
              Feedback
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Feedback Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
            />

            {/* Feedback Form */}
            <motion.div
              initial={{ opacity: 0, y: 100, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.9 }}
              transition={{ duration: 0.3, type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed bottom-6 right-6 z-50 w-full max-w-md bg-white shadow-2xl"
            >
              {!isSubmitted ? (
                <>
                  {/* Header */}
                  <div className="bg-black text-white p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <MessageCircle size={24} />
                      <div>
                        <h3 className="text-xl" style={{ fontFamily: 'var(--font-serif)' }}>
                          Share Your Thoughts
                        </h3>
                        <p className="text-white/70 text-sm">Your feedback helps us improve</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="text-white/70 hover:text-white transition-colors"
                      aria-label="Close feedback"
                    >
                      <X size={24} />
                    </button>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Rating */}
                    <div>
                      <p className="block text-sm text-black/70 mb-3">
                        How would you rate your experience?
                      </p>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoveredRating(star)}
                            onMouseLeave={() => setHoveredRating(0)}
                            className="transition-transform hover:scale-110"
                          >
                            <Star
                              size={32}
                              className={`transition-colors ${
                                star <= (hoveredRating || rating)
                                  ? 'text-[#d4a574] fill-[#d4a574]'
                                  : 'text-black/20'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Feedback Text */}
                    <div>
                      <label htmlFor="feedback" className="block text-sm text-black/70 mb-2">
                        Your Feedback *
                      </label>
                      <textarea
                        id="feedback"
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="What can we improve? What do you love?"
                        rows={4}
                        required
                        className="w-full px-4 py-3 border border-black/10 focus:border-[#d4a574] outline-none transition-colors resize-none"
                      />
                    </div>

                    {/* Email (Optional) */}
                    <div>
                      <label htmlFor="email" className="block text-sm text-black/70 mb-2">
                        Email (optional)
                      </label>
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="w-full px-4 py-3 border border-black/10 focus:border-[#d4a574] outline-none transition-colors"
                      />
                      <p className="text-xs text-black/50 mt-1">
                        Leave your email if you'd like a response
                      </p>
                    </div>

                    {/* Error */}
                    {error && <p className="text-red-600 text-sm">{error}</p>}

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full px-6 py-4 bg-black text-white hover:bg-[#d4a574] transition-all duration-300 flex items-center justify-center gap-2 group disabled:opacity-60"
                    >
                      <span>{isSubmitting ? 'Sending…' : 'Send Feedback'}</span>
                      {!isSubmitting && <Send size={18} className="group-hover:translate-x-1 transition-transform" />}
                    </button>
                  </form>
                </>
              ) : (
                /* Success State */
                <div className="p-12 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                  >
                    <CheckCircle size={64} className="mx-auto mb-6 text-[#d4a574]" />
                  </motion.div>
                  <h3
                    className="text-2xl mb-3"
                    style={{ fontFamily: 'var(--font-serif)' }}
                  >
                    Thank You!
                  </h3>
                  <p className="text-black/70">
                    Your feedback has been received and will help us improve.
                  </p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
