import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  ShoppingBag,
  X,
  Send,
  RotateCcw,
  Heart,
  ChevronRight,
  Check,
  Star,
  ExternalLink,
  ShieldCheck,
  Scale,
  ArrowRight,
  Maximize2,
  Minimize2,
  Plus,
  Mic,
  MicOff,
  Volume2,
  Radio,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { api } from '../mock/api'
import { INR } from '../lib/format'

const INITIAL_WELCOME_MESSAGE = {
  id: 'welcome-msg',
  sender: 'ai',
  text: "Hi! 👋 I'm your ReturnGuard Shopping Assistant.\nTell me what you're looking for or tap the mic to speak, and I'll help you find the best products.",
  quickOptions: [
    'Find something for me',
    'Shop by occasion',
    'Find under ₹1000',
    'Show trending products',
    'Help me choose',
    'Find similar products',
  ],
  products: [],
  timestamp: new Date(),
}

export default function AiShoppingAssistant() {
  const { cart, addToCart, wishlist, toggleWishlist, isInWishlist, shopper } = useApp()
  const navigate = useNavigate()
  const location = useLocation()

  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [messages, setMessages] = useState([INITIAL_WELCOME_MESSAGE])
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [context, setContext] = useState({})
  const [addedItemIds, setAddedItemIds] = useState({})
  const [showBadge, setShowBadge] = useState(true)

  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const recognitionRef = useRef(null)
  const finalTranscriptRef = useRef('')

  // Scroll to bottom when messages update
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (isOpen) {
      scrollToBottom()
      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus()
        }
      }, 200)
      return () => clearTimeout(timer)
    }
  }, [messages, isOpen, loading])

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort()
        } catch {}
      }
    }
  }, [])

  // Don't show assistant on merchant or admin pages
  if (location.pathname.startsWith('/merchant') || location.pathname.startsWith('/admin')) {
    return null
  }

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Voice recognition is not supported in this browser. Please use Google Chrome, Brave, or Microsoft Edge.')
      return
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort()
      } catch {}
    }

    try {
      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = true
      recognition.lang = navigator.language || 'en-IN'
      finalTranscriptRef.current = ''

      recognition.onstart = () => {
        setIsListening(true)
        finalTranscriptRef.current = ''
      }

      recognition.onresult = (event) => {
        let interimTranscript = ''
        let finalTranscript = ''

        for (let i = 0; i < event.results.length; i++) {
          const item = event.results[i]
          if (item.isFinal) {
            finalTranscript += item[0].transcript + ' '
          } else {
            interimTranscript += item[0].transcript
          }
        }

        const combined = (finalTranscript + interimTranscript).trim()
        if (combined) {
          setInputValue(combined)
          finalTranscriptRef.current = combined
        }
      }

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error)
        setIsListening(false)
        if (event.error === 'not-allowed') {
          alert('Microphone access was denied. Please allow microphone permissions in your browser to speak with the assistant.')
        }
      }

      recognition.onend = () => {
        setIsListening(false)
        const textToQuery = (finalTranscriptRef.current || inputValue).trim()
        if (textToQuery) {
          handleSendMessage(textToQuery)
        }
      }

      recognitionRef.current = recognition
      recognition.start()
    } catch (err) {
      console.error('Failed to start speech recognition:', err)
      setIsListening(false)
    }
  }

  const stopListeningAndSearch = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {}
    }
    setIsListening(false)
    const textToQuery = (finalTranscriptRef.current || inputValue).trim()
    if (textToQuery) {
      handleSendMessage(textToQuery)
    }
  }

  const toggleListening = () => {
    if (isListening) {
      stopListeningAndSearch()
    } else {
      startListening()
    }
  }

  const handleSendMessage = async (textToSend = null) => {
    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.abort()
      } catch {}
      setIsListening(false)
    }

    const text = (textToSend !== null ? textToSend : inputValue).trim()
    if (!text || loading) return

    setInputValue('')
    finalTranscriptRef.current = ''
    setShowBadge(false)

    // Add user message
    const userMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])
    setLoading(true)

    try {
      const response = await api.sendAssistantMessage({
        message: text,
        context,
        cart,
      })

      const aiMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: response.message || "I found these options for you 💕",
        products: response.products || [],
        comparison: response.comparison || null,
        quickOptions: response.quick_options || [],
        timestamp: new Date(),
      }

      if (response.context) {
        setContext(response.context)
      }

      setMessages((prev) => [...prev, aiMessage])
    } catch (err) {
      console.error('Error in AI shopping assistant:', err)
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: 'ai',
          text: 'Sorry, I could not load the products right now. Please try again.',
          quickOptions: ['Find under ₹1000', 'Show trending products'],
          products: [],
          timestamp: new Date(),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = (product, e) => {
    e?.stopPropagation()
    addToCart(product, 1)
    const pId = product.id || product.product_id
    setAddedItemIds((prev) => ({ ...prev, [pId]: true }))
    setTimeout(() => {
      setAddedItemIds((prev) => ({ ...prev, [pId]: false }))
    }, 2000)
  }

  const handleResetChat = () => {
    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.abort()
      } catch {}
      setIsListening(false)
    }
    setMessages([INITIAL_WELCOME_MESSAGE])
    setContext({})
    setInputValue('')
    finalTranscriptRef.current = ''
    if (inputRef.current) inputRef.current.focus()
  }

  const formatPrice = (val) => {
    try {
      return INR.format(val)
    } catch {
      return `₹${val}`
    }
  }

  return (
    <>
      {/* ── Floating Action Button (Only visible when chat is closed) ────── */}
      <AnimatePresence>
        {!isOpen && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
            {/* Helper Pill Callout on first glance */}
            {showBadge && (
              <motion.div
                initial={{ opacity: 0, x: 20, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.9 }}
                onClick={() => {
                  setShowBadge(false)
                  setIsOpen(true)
                }}
                className="hidden sm:flex items-center gap-2.5 rounded-2xl bg-slate-900/95 text-white px-4 py-2.5 shadow-2xl border border-indigo-500/40 backdrop-blur-md cursor-pointer hover:border-indigo-400/80 transition group"
              >
                <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                <div className="text-xs">
                  <p className="font-bold text-slate-100 flex items-center gap-1.5">
                    <span>✨ ReturnGuard AI</span>
                  </p>
                  <p className="text-[11px] text-indigo-200">Voice or text shopping assistant</p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowBadge(false)
                  }}
                  className="text-slate-400 hover:text-slate-200 ml-1 p-0.5"
                  title="Dismiss"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            )}

            {/* Floating Bubble Button */}
            <motion.button
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => {
                setIsOpen(true)
                setShowBadge(false)
              }}
              className="relative flex h-14 w-14 items-center justify-center rounded-2xl shadow-2xl transition-all duration-300 cursor-pointer bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 text-white ring-4 ring-indigo-400/20 hover:shadow-indigo-500/25"
              aria-label="Open AI Assistant"
            >
              <div className="relative">
                <Sparkles className="h-6 w-6 text-white animate-pulse" />
                <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-emerald-400 ring-2 ring-indigo-600" />
              </div>
            </motion.button>
          </div>
        )}
      </AnimatePresence>

      {/* ── Chat Window Modal / Panel ─────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.96 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className={`fixed z-50 flex flex-col overflow-hidden border border-slate-700/80 bg-slate-900/98 text-slate-100 shadow-2xl backdrop-blur-2xl transition-all duration-300 ${
              isExpanded
                ? 'inset-3 sm:inset-6 rounded-3xl'
                : 'bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100vw-2rem)] sm:w-[470px] h-[640px] max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-4rem)] rounded-3xl'
            }`}
          >
            {/* ── Header ── */}
            <div className="relative flex items-center justify-between border-b border-slate-800/90 bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 px-4 py-3.5 sm:px-5">
              <div className="flex items-center gap-3">
                <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/20 ring-1 ring-white/20">
                  <Sparkles className="h-5 w-5" />
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-sm font-bold text-white tracking-tight">ReturnGuard AI 🛍️</h2>
                    <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] font-semibold text-indigo-300 ring-1 ring-inset ring-indigo-500/30">
                      Catalog Assistant
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">Speak or type your request</p>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleResetChat}
                  title="Reset conversation"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition cursor-pointer"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsExpanded((prev) => !prev)}
                  title={isExpanded ? 'Collapse' : 'Expand'}
                  className="hidden sm:flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition cursor-pointer"
                >
                  {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  title="Close Assistant"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-rose-400 transition cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* ── Messages Stream ── */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 scroll-smooth">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  {/* Message Bubble */}
                  <div
                    className={`max-w-[88%] sm:max-w-[82%] rounded-2xl p-3.5 text-[13px] leading-relaxed shadow-sm ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-br-xs font-medium'
                        : 'bg-slate-800/90 text-slate-200 border border-slate-700/60 rounded-bl-xs'
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.text}</p>
                  </div>

                  {/* ── Side-by-Side Comparison Spec Table ── */}
                  {msg.comparison && msg.comparison.specs && (
                    <div className="mt-3 w-full rounded-2xl border border-indigo-500/30 bg-slate-800/60 p-3.5 backdrop-blur-md">
                      <div className="flex items-center gap-2 mb-2 text-xs font-bold text-indigo-300">
                        <Scale className="h-4 w-4 text-indigo-400" />
                        <span>Product Comparison Matrix</span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-slate-700 text-slate-400">
                              <th className="pb-2 font-medium">Feature</th>
                              <th className="pb-2 font-semibold text-indigo-200 truncate max-w-[120px]">
                                {msg.comparison.products[0]?.name || 'Option A'}
                              </th>
                              <th className="pb-2 font-semibold text-violet-200 truncate max-w-[120px]">
                                {msg.comparison.products[1]?.name || 'Option B'}
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800">
                            {msg.comparison.specs.map((row, idx) => (
                              <tr key={idx} className="hover:bg-slate-750/30">
                                <td className="py-2 text-slate-400 font-medium">{row.aspect}</td>
                                <td className="py-2 text-slate-200 font-semibold">{row.product_a}</td>
                                <td className="py-2 text-slate-200 font-semibold">{row.product_b}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* ── Product Recommendation Cards Carousel / Grid ── */}
                  {msg.products && msg.products.length > 0 && (
                    <div className="mt-3 w-full space-y-2.5">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-indigo-300 px-1">
                        <span>Recommended from Catalog ({msg.products.length})</span>
                        <span className="flex items-center gap-1 text-emerald-400">
                          <ShieldCheck className="h-3.5 w-3.5" /> ReturnGuard Verified
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {msg.products.map((product) => {
                          const pId = product.id || product.product_id
                          const isAdded = Boolean(addedItemIds[pId])
                          const inWish = isInWishlist(pId)

                          return (
                            <div
                              key={pId}
                              className="group relative flex flex-col rounded-2xl border border-slate-700/80 bg-slate-800/80 p-3 hover:border-indigo-500/50 hover:bg-slate-800 transition-all duration-200 shadow-md overflow-hidden"
                            >
                              {/* Top row: image + info */}
                              <div className="flex gap-3">
                                {/* Thumbnail */}
                                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-900 border border-slate-700/50">
                                  <img
                                    src={product.image}
                                    alt={product.name}
                                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                                  />
                                  {product.discount_percent && (
                                    <span className="absolute top-1 left-1 rounded-md bg-rose-500/90 px-1 py-0.5 text-[9px] font-bold text-white shadow-xs">
                                      {product.discount_percent}% OFF
                                    </span>
                                  )}
                                </div>

                                {/* Text info */}
                                <div className="flex-1 min-w-0 flex flex-col justify-between">
                                  <div>
                                    <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider">
                                      {product.category_name || 'Item'}
                                    </span>
                                    <h4 className="text-xs font-bold text-slate-100 line-clamp-1 group-hover:text-indigo-300 transition">
                                      {product.name}
                                    </h4>
                                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                                      {product.description}
                                    </p>
                                  </div>

                                  {/* Price & Rating */}
                                  <div className="flex items-center justify-between gap-1 mt-1">
                                    <div className="flex items-baseline gap-1.5">
                                      <span className="text-sm font-extrabold text-white">
                                        {formatPrice(product.price)}
                                      </span>
                                      {product.original_price && product.original_price > product.price && (
                                        <span className="text-[10px] text-slate-500 line-through">
                                          {formatPrice(product.original_price)}
                                        </span>
                                      )}
                                    </div>
                                    <span className="inline-flex items-center gap-0.5 rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-400">
                                      <Star className="h-3 w-3 fill-amber-400" />
                                      {product.rating || 4.6}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Action buttons */}
                              <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={(e) => handleAddToCart(product, e)}
                                  className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-1.5 px-2 text-xs font-bold transition cursor-pointer ${
                                    isAdded
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-indigo-600 text-white hover:bg-indigo-500 active:scale-95'
                                  }`}
                                >
                                  {isAdded ? (
                                    <>
                                      <Check className="h-3.5 w-3.5" /> Added!
                                    </>
                                  ) : (
                                    <>
                                      <ShoppingBag className="h-3.5 w-3.5" /> Add to Cart
                                    </>
                                  )}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsOpen(false)
                                    navigate(`/products/${pId}`)
                                  }}
                                  className="flex items-center justify-center rounded-xl bg-slate-700 px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-600 hover:text-white transition cursor-pointer"
                                  title="View details"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => toggleWishlist(product)}
                                  className={`flex items-center justify-center rounded-xl p-1.5 transition cursor-pointer ${
                                    inWish
                                      ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30'
                                      : 'bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-slate-200'
                                  }`}
                                  title={inWish ? 'In Wishlist' : 'Add to Wishlist'}
                                >
                                  <Heart className={`h-3.5 w-3.5 ${inWish ? 'fill-rose-400' : ''}`} />
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* ── Quick Options / Suggestion Chips ── */}
                  {msg.quickOptions && msg.quickOptions.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {msg.quickOptions.map((opt, i) => (
                        <button
                          key={i}
                          type="button"
                          disabled={loading}
                          onClick={() => handleSendMessage(opt)}
                          className="rounded-xl border border-indigo-500/30 bg-indigo-950/40 px-3 py-1 text-[11px] font-semibold text-indigo-300 hover:border-indigo-400 hover:bg-indigo-600 hover:text-white transition active:scale-95 cursor-pointer disabled:opacity-50"
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Loading / Typing indicator */}
              {loading && (
                <div className="flex items-center gap-2 text-slate-400 text-xs py-1">
                  <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-indigo-600/30 text-indigo-300">
                    <Sparkles className="h-3.5 w-3.5 animate-spin" />
                  </div>
                  <div className="flex items-center gap-1 rounded-2xl bg-slate-800 px-3.5 py-2 border border-slate-700/60">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    <span className="ml-1.5 text-[11px] text-slate-400">Searching catalog...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* ── Voice Listening Live Banner ── */}
            <AnimatePresence>
              {isListening && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-gradient-to-r from-rose-950/90 via-red-950/90 to-rose-950/90 border-t border-rose-500/40 px-4 py-2.5 flex items-center justify-between text-xs text-rose-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <span className="h-3 w-1 rounded-full bg-rose-400 animate-pulse" />
                      <span className="h-5 w-1 rounded-full bg-rose-300 animate-pulse" style={{ animationDelay: '150ms' }} />
                      <span className="h-2 w-1 rounded-full bg-rose-400 animate-pulse" style={{ animationDelay: '300ms' }} />
                      <span className="h-4 w-1 rounded-full bg-rose-300 animate-pulse" style={{ animationDelay: '75ms' }} />
                    </div>
                    <div>
                      <p className="font-bold text-white flex items-center gap-1.5">
                        <Radio className="h-3.5 w-3.5 text-rose-400 animate-spin" />
                        <span>Listening to your voice...</span>
                      </p>
                      <p className="text-[10px] text-rose-300">Speak now, or tap Done when finished</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={stopListeningAndSearch}
                    className="text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 px-3 py-1 rounded-lg cursor-pointer shadow-sm transition active:scale-95 flex items-center gap-1"
                  >
                    <Check className="h-3.5 w-3.5" /> Done & Search
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Bottom Input Bar ── */}
            <div className="border-t border-slate-800 bg-slate-900 p-3 sm:p-4 backdrop-blur-md">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSendMessage()
                }}
                className="flex items-center gap-2"
              >
                {/* Voice Mic Button */}
                <button
                  type="button"
                  onClick={toggleListening}
                  title={isListening ? 'Click to search spoken voice' : 'Tap to speak to ReturnGuard AI'}
                  className={`flex h-10 w-10 items-center justify-center rounded-xl transition cursor-pointer shrink-0 ${
                    isListening
                      ? 'bg-rose-600 text-white animate-pulse ring-4 ring-rose-500/40 shadow-lg shadow-rose-600/30'
                      : 'bg-slate-800 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600 hover:text-white active:scale-95 shadow-sm'
                  }`}
                  aria-label="Toggle Voice Input"
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>

                {/* Text Box with pure white card background & deep black text */}
                <div className="relative flex-1">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                    placeholder={isListening ? 'Transcribing your voice...' : "Tell me what you're looking for..."}
                    autoComplete="off"
                    style={{
                      backgroundColor: '#ffffff',
                      color: '#0f172a',
                      caretColor: '#4f46e5',
                      fontWeight: '500',
                    }}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-500 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/30 transition shadow-xs"
                  />
                  {inputValue && (
                    <button
                      type="button"
                      onClick={() => {
                        setInputValue('')
                        finalTranscriptRef.current = ''
                        inputRef.current?.focus()
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs p-1 cursor-pointer font-bold"
                      title="Clear text"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={!inputValue.trim() || loading}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md hover:from-indigo-500 hover:to-violet-500 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer active:scale-95 shrink-0"
                  aria-label="Send message"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
              <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-500 px-1">
                <span className="flex items-center gap-1">
                  <Mic className="h-3 w-3 text-indigo-400" /> Tap mic to speak or type
                </span>
                <span>ReturnGuard AI</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
