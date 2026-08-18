import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
  AnimatePresence,
} from 'framer-motion'

const heroProducts = [
  {
    id: 'bag',
    name: 'Luxury Handbag',
    price: '₹24,999',
    image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=85',
    depth: 14,
    className: 'left-[44%] top-[46%] z-30 w-[54%] sm:w-[48%]',
    label: 'ReturnGuard Protected',
  },
  {
    id: 'watch',
    name: 'Chrono Watch',
    price: '₹18,499',
    image: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=500&q=85',
    depth: 9,
    className: 'left-[4%] top-[12%] z-20 w-[30%] sm:w-[27%]',
    label: 'Authenticity Verified',
  },
  {
    id: 'sneaker',
    name: 'Premium Sneaker',
    price: '₹12,999',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=500&q=85',
    depth: 9,
    className: 'right-[4%] top-[14%] z-20 w-[30%] sm:w-[27%]',
    label: 'Secure Checkout',
  },
  {
    id: 'sunglasses',
    name: 'Designer Shades',
    price: '₹7,999',
    image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=500&q=85',
    depth: 5,
    className: 'left-[14%] bottom-[4%] z-10 w-[25%] sm:w-[22%]',
    label: 'Smart Return',
  },
  {
    id: 'jewelry',
    name: 'Gold Jewelry',
    price: '₹32,499',
    image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=500&q=85',
    depth: 5,
    className: 'right-[13%] bottom-[5%] z-10 w-[25%] sm:w-[22%]',
    label: 'Trust Score 98/100',
  },
]

const floatingCards = [
  { icon: '✓', title: 'ReturnGuard Protected', className: 'left-[8%] top-[2%]', delay: 0 },
  { icon: '◈', title: 'Authenticity Verified', className: 'right-[8%] top-[4%]', delay: 1.2 },
  { icon: '↺', title: '30-day return eligible', className: 'left-[2%] bottom-[18%]', delay: 2.2 },
  { icon: '◆', title: 'Trust Score 98/100', className: 'right-[2%] bottom-[20%]', delay: 0.8 },
]

const particles = [
  { left: '12%', bottom: '30%', size: 6, delay: 0 },
  { left: '28%', bottom: '22%', size: 4, delay: 1.4 },
  { left: '55%', bottom: '12%', size: 5, delay: 2.4 },
  { left: '70%', bottom: '34%', size: 4, delay: 3.2 },
  { left: '85%', bottom: '18%', size: 5, delay: 1.8 },
]

function ProductCard({ product, isFocused, springX, springY, reduced }) {
  const scale = isFocused ? 1.03 : product.id === 'bag' ? 0.98 : 0.94
  const depthX = useTransform(springX, (value) => value * product.depth)
  const depthY = useTransform(springY, (value) => value * product.depth)
  const rotateX = useTransform(springY, (value) => -value * product.depth * 0.3)
  const rotateY = useTransform(springX, (value) => value * product.depth * 0.3)

  return (
    <motion.div
      className={`product-card absolute ${product.className}`}
      style={{
        x: depthX,
        y: depthY,
        rotateX,
        rotateY,
        scale,
        zIndex: isFocused ? 40 : parseInt(product.className.match(/z-\d+/)?.[0]?.replace('z-', '') || '10', 10),
        opacity: isFocused ? 1 : 0.92,
      }}
      transition={{ type: 'spring', stiffness: 80, damping: 18, mass: 0.9 }}
    >
      <motion.div
        className={`overflow-hidden rounded-[2rem] border border-white/80 bg-white/70 p-3 shadow-[0_24px_60px_rgba(79,70,229,0.14)] backdrop-blur-xl ${isFocused ? 'ring-1 ring-indigo-200' : ''}`}
        animate={reduced ? undefined : { y: [0, -6, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      >
        <motion.div
          className="overflow-hidden rounded-[1.35rem] bg-slate-100"
          animate={reduced ? undefined : { scale: isFocused ? [1, 1.045, 1] : [1.04, 1, 1.04] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        >
          <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
        </motion.div>
        <div className="px-2 pb-1 pt-3">
          <p className="text-sm font-semibold text-slate-900">{product.name}</p>
          <p className="mt-0.5 text-xs font-semibold text-indigo-600">{product.price}</p>
        </div>
      </motion.div>

      <motion.div
        className={`absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/85 px-3 py-1.5 text-[10px] font-semibold text-indigo-700 shadow-lg ring-1 ring-white/80 backdrop-blur-md ${isFocused ? 'opacity-100' : 'opacity-80'}`}
        animate={reduced ? undefined : { y: [0, -3, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      >
        ✓ {product.label}
      </motion.div>
    </motion.div>
  )
}

function HeroVisual() {
  const reduced = useReducedMotion()
  const [focusIndex, setFocusIndex] = useState(0)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const springX = useSpring(mouseX, { stiffness: 50, damping: 16 })
  const springY = useSpring(mouseY, { stiffness: 50, damping: 16 })

  const handleMouseMove = (event) => {
    if (reduced) return
    const bounds = event.currentTarget.getBoundingClientRect()
    const x = (event.clientX - bounds.left) / bounds.width - 0.5
    const y = (event.clientY - bounds.top) / bounds.height - 0.5
    mouseX.set(x)
    mouseY.set(y)
  }

  const handleMouseLeave = () => {
    mouseX.set(0)
    mouseY.set(0)
  }

  const focusRotate = () => {
    if (reduced) return
    setFocusIndex((current) => (current + 1) % heroProducts.length)
  }

  return (
    <div className="relative">
      <div
        className="hero-visual relative hidden h-[560px] sm:block"
        style={{ transformStyle: 'preserve-3d', perspective: '1200px' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div className="absolute inset-x-8 inset-y-8 rounded-[3rem] bg-white/40 ring-1 ring-white/70 backdrop-blur-sm" />

        <motion.div
          className="absolute left-[16%] top-[14%] h-44 w-44 rounded-full bg-violet-200/40 blur-3xl"
          animate={reduced ? undefined : { x: [0, 12, 0], y: [0, 10, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute right-[12%] top-[30%] h-52 w-52 rounded-full bg-blue-200/40 blur-3xl"
          animate={reduced ? undefined : { x: [0, -10, 0], y: [0, 14, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />
        <motion.div
          className="absolute bottom-[8%] left-[40%] h-40 w-40 rounded-full bg-rose-100/40 blur-3xl"
          animate={reduced ? undefined : { x: [0, 8, 0], y: [0, -8, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
        />

        {floatingCards.map((card) => (
          <motion.div
            key={card.title}
            className={`glass-card absolute ${card.className} z-30 flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-semibold text-slate-800`}
            animate={reduced ? undefined : { y: [0, -7, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: card.delay }}
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-50 text-xs text-indigo-600">{card.icon}</span>
            {card.title}
          </motion.div>
        ))}

        {!reduced &&
          particles.map((particle, index) => (
            <motion.span
              key={index}
              className="absolute rounded-full bg-indigo-300/60"
              style={{
                left: particle.left,
                bottom: particle.bottom,
                width: particle.size,
                height: particle.size,
              }}
              animate={{ opacity: [0, 0.8, 0], y: [0, -70, -130], scale: [0.9, 1, 1.15] }}
              transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: particle.delay }}
            />
          ))}

        <AnimatePresence>
          {heroProducts.map((product, index) => {
            const isFocused = index === focusIndex

            return (
              <motion.div key={product.id} className="contents">
                <ProductCard
                  product={product}
                  isFocused={isFocused}
                  springX={springX}
                  springY={springY}
                  reduced={reduced}
                />
              </motion.div>
            )
          })}
        </AnimatePresence>

        <motion.button
          type="button"
          onClick={focusRotate}
          className="sr-only"
          aria-label="Rotate featured product"
        />
      </div>

      {/* Mobile composition */}
      <div className="grid grid-cols-1 gap-4 sm:hidden">
        {heroProducts.slice(0, 3).map((product) => (
          <motion.div
            key={product.id}
            className="rounded-3xl border border-white/80 bg-white/80 p-3 shadow-[0_18px_40px_rgba(79,70,229,0.12)] backdrop-blur-xl"
            initial={reduced ? false : { opacity: 0, y: 18 }}
            whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <div className="overflow-hidden rounded-2xl bg-slate-100">
              <img src={product.image} alt={product.name} className="h-52 w-full object-cover" />
            </div>
            <div className="px-2 pb-1 pt-3">
              <p className="text-sm font-semibold text-slate-900">{product.name}</p>
              <p className="mt-0.5 text-xs font-semibold text-indigo-600">{product.price}</p>
              <p className="mt-2 inline-flex rounded-full bg-indigo-50 px-2 py-1 text-[10px] font-semibold text-indigo-700">✓ {product.label}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default function LandingPage() {
  const reduced = useReducedMotion()

  return (
    <main className="min-h-screen overflow-hidden bg-[#fafaff] text-slate-900">
      <motion.header
        className="relative z-40 border-b border-slate-200/70 bg-white/70 backdrop-blur-xl"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-sm font-bold text-white shadow-sm shadow-indigo-200">RG</span>
            <span className="text-lg font-bold tracking-tight text-slate-900">ReturnGuard</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <motion.div whileHover={reduced ? undefined : { scale: 1.02 }} whileTap={reduced ? undefined : { scale: 0.98 }}>
              <Link to="/login" className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-indigo-600">
                Shopper Login
              </Link>
            </motion.div>
            <motion.div whileHover={reduced ? undefined : { y: -2 }} whileTap={reduced ? undefined : { scale: 0.98 }}>
              <Link to="/merchant/login" className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-500 hover:shadow-md">
                Merchant Login
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.header>

      <section className="relative px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-violet-100/70 blur-3xl" />
          <div className="absolute right-0 top-1/4 h-80 w-80 rounded-full bg-blue-100/70 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-rose-50/80 blur-3xl" />
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(#64748b 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
        </div>

        <div className="relative mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[45%_55%]">
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 24 }}
            animate={reduced ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">India · COD-native · Return-fraud protection</p>
            <h1 className="mt-4 max-w-xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              Secure shopping. Smarter returns.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
              ReturnGuard protects D2C merchants from wardrobing, empty-box returns, and serial over-ordering — while
              keeping honest customers friction-free.
            </p>

            <div className="mt-8">
              <motion.div whileHover={reduced ? undefined : { y: -2 }} whileTap={reduced ? undefined : { scale: 0.98 }}>
                <Link to="/shop" className="inline-flex rounded-2xl bg-slate-900 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-slate-200 transition hover:bg-slate-800">
                  Start shopping
                </Link>
              </motion.div>
            </div>

            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-slate-500">
              <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Zero friction for honest shoppers</span>
              <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-indigo-500" /> Real-time risk scoring</span>
              <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-violet-500" /> Doorstep-witnessed proof</span>
            </div>
          </motion.div>

          <motion.div
            initial={reduced ? false : { opacity: 0, y: 24 }}
            animate={reduced ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.15 }}
          >
            <HeroVisual />
          </motion.div>
        </div>
      </section>
    </main>
  )
}
