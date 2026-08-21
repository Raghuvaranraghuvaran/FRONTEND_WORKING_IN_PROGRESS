import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  motion,
  useMotionValue,
  useTransform,
  useSpring,
  useScroll,
  useReducedMotion,
  AnimatePresence,
} from 'framer-motion'
import {
  ShoppingBag,
  ArrowRight,
  ArrowUpRight,
  Star,
  Menu,
  X,
  Plus,
  Truck,
  ShieldCheck,
  RotateCcw,
  ChevronDown,
  Fingerprint,
  ScanLine,
  BrainCircuit,
} from 'lucide-react'

/* ------------------------------------------------------------------ */
/* DATA                                                                */
/* ------------------------------------------------------------------ */

const PRODUCTS = [
  {
    id: 1,
    name: 'Titan Edge',
    type: 'Luxury Watch',
    price: 24999,
    tag: 'Premium',
    img: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=900&q=80',
    specs: { brand: 'Titan', material: 'Stainless Steel', movement: 'Automatic' },
  },
  {
    id: 2,
    name: 'Sony Premium',
    type: 'Wireless Headset',
    price: 18499,
    tag: 'Bestseller',
    img: 'https://images.unsplash.com/photo-1487215078519-e21cc028cb29?w=900&q=80',
    specs: { brand: 'Sony', sound: 'Noise Cancelling', battery: '50hrs' },
  },
  {
    id: 3,
    name: 'Executive Shoes',
    type: 'Leather Oxford',
    price: 12999,
    tag: null,
    img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=900&q=80',
    specs: { brand: 'Luxury Shoes', material: 'Italian Leather', sole: 'Leather' },
  },
]

const LAYERS = [
  {
    n: '01',
    name: 'Real-Time Risk Scoring',
    copy: 'AI-powered fraud detection analyses every return request in milliseconds — scoring device fingerprint, purchase history, and behavioral signals.',
  },
  {
    n: '02',
    name: 'Device-Based Verification',
    copy: 'Our SDK silently fingerprints each session. Repeated device reuse, emulator patterns, and VPN masking are caught before checkout.',
  },
  {
    n: '03',
    name: 'Self-Tuning Rules Engine',
    copy: 'Fraud thresholds auto-calibrate weekly based on your store\u2019s data \u2014 reducing false positives while tightening defences against real abuse.',
  },
]

const MATERIALS = [
  'REAL-TIME SCORING',
  'DEVICE FINGERPRINT',
  'COD PROTECTION',
  'SMART RETURNS',
  'OTP VERIFICATION',
  'ZERO FRICTION',
]

const TESTIMONIALS = [
  {
    name: 'Arjun Mehta',
    role: 'D2C Fashion, Mumbai',
    quote:
      'ReturnGuard cut our return fraud by 62% in the first month. The self-tuning engine just keeps getting smarter.',
  },
  {
    name: 'Priya Sharma',
    role: 'Electronics Store, Delhi',
    quote:
      'COD refusal rates dropped from 18% to 4%. Honest customers don\u2019t even notice it\u2019s there.',
  },
  {
    name: 'Rahul Iyer',
    role: 'Premium Lifestyle, Bangalore',
    quote:
      'The merchant dashboard gives us total visibility. Flagged cases are reviewed in seconds, not hours.',
  },
]

/* ------------------------------------------------------------------ */
/* HOOKS                                                               */
/* ------------------------------------------------------------------ */

function useTilt(intensity = 14, reduce = false) {
  const ref = useRef(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [intensity, -intensity]), {
    stiffness: 200,
    damping: 22,
  })
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-intensity, intensity]), {
    stiffness: 200,
    damping: 22,
  })
  const glareX = useTransform(x, [-0.5, 0.5], ['0%', '100%'])
  const glareY = useTransform(y, [-0.5, 0.5], ['0%', '100%'])

  function onMove(e) {
    if (reduce || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    x.set((e.clientX - r.left) / r.width - 0.5)
    y.set((e.clientY - r.top) / r.height - 0.5)
  }
  function onLeave() {
    x.set(0)
    y.set(0)
  }
  return { ref, rotateX, rotateY, glareX, glareY, onMove, onLeave }
}

function useCountdown(hoursFromNow) {
  const target = useRef(Date.now() + hoursFromNow * 3600 * 1000)
  const [left, setLeft] = useState(target.current - Date.now())
  useEffect(() => {
    const id = setInterval(() => setLeft(Math.max(0, target.current - Date.now())), 1000)
    return () => clearInterval(id)
  }, [])
  const d = Math.floor(left / 86400000)
  const h = Math.floor((left % 86400000) / 3600000)
  const m = Math.floor((left % 3600000) / 60000)
  const s = Math.floor((left % 60000) / 1000)
  return { d, h, m, s }
}

/* ------------------------------------------------------------------ */
/* SMALL PIECES                                                        */
/* ------------------------------------------------------------------ */

function Digit({ value, label }) {
  return (
    <div className="vlc-digit">
      <div className="vlc-digit-window">
        <AnimatePresence mode="popLayout">
          <motion.span
            key={value}
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -16, opacity: 0 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
          >
            {String(value).padStart(2, '0')}
          </motion.span>
        </AnimatePresence>
      </div>
      <div className="vlc-digit-label">{label}</div>
    </div>
  )
}

function Reveal({ children, delay = 0, y = 36, className = '' }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}

function HeroImage({ reduce }) {
  const { ref, rotateX, rotateY, glareX, glareY, onMove, onLeave } = useTilt(12, reduce)
  return (
    <motion.div
      ref={ref}
      className="vlc-hero-img"
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{
        rotateX: reduce ? 0 : rotateX,
        rotateY: reduce ? 0 : rotateY,
        transformPerspective: 900,
        transformStyle: 'preserve-3d',
      }}
    >
      <img src="https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=1200&q=85" alt="Premium luxury product" />
      {!reduce && (
        <motion.div
          className="vlc-glare"
          style={{
            background: `radial-gradient(circle at ${glareX} ${glareY}, rgba(255,255,255,0.14), transparent 60%)`,
          }}
        />
      )}
    </motion.div>
  )
}

function ProductCard({ p, reduce, index }) {
  const { ref, rotateX, rotateY, glareX, glareY, onMove, onLeave } = useTilt(10, reduce)

  return (
    <Reveal delay={index * 0.08} className="vlc-card-wrap">
      <motion.div
        ref={ref}
        className="vlc-card"
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        style={{
          rotateX: reduce ? 0 : rotateX,
          rotateY: reduce ? 0 : rotateY,
          transformPerspective: 900,
        }}
      >
        {p.tag && <span className="vlc-card-tag">{p.tag}</span>}
        <div className="vlc-card-media">
          <img src={p.img} alt={`${p.name} ${p.type}`} loading="lazy" />
          {!reduce && (
            <motion.div
              className="vlc-glare"
              style={{
                background: `radial-gradient(circle at ${glareX} ${glareY}, rgba(255,255,255,0.16), transparent 60%)`,
              }}
            />
          )}
        </div>
        <div className="vlc-card-body">
          <div className="vlc-card-row">
            <h3>{p.name}</h3>
            <span className="vlc-price">₹{p.price.toLocaleString('en-IN')}</span>
          </div>
          <p className="vlc-card-type">{p.type}</p>
          <div className="vlc-specs">
            <span>{p.specs.brand || p.specs.weight}</span>
            <span>·</span>
            <span>{p.specs.material || p.specs.stack}</span>
            <span>·</span>
            <span>{p.specs.sound || p.specs.movement || p.specs.sole || p.specs.fit || p.specs.drop}</span>
          </div>

        </div>
      </motion.div>
    </Reveal>
  )
}

/* ------------------------------------------------------------------ */
/* MAIN LANDING PAGE                                                    */
/* ------------------------------------------------------------------ */

export default function LandingPage() {
  const reduce = useReducedMotion()
  const [navOpen, setNavOpen] = useState(false)
  const { scrollY } = useScroll()
  const navBg = useTransform(scrollY, [0, 80], ['rgba(13,15,18,0)', 'rgba(13,15,18,0.85)'])
  const navBorder = useTransform(scrollY, [0, 80], ['rgba(255,255,255,0)', 'rgba(255,255,255,0.08)'])

  const { d, h, m, s } = useCountdown(62)

  return (
    <div className="vlc-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');

        .vlc-root {
          --bg: #0D0F12;
          --surface: #16181C;
          --surface-2: #1D2025;
          --accent: #6366F1;
          --accent-dim: rgba(99,102,241,0.14);
          --accent-glow: rgba(99,102,241,0.35);
          --ice: #B9C4C9;
          --text: #F3F1EC;
          --muted: #8B9096;
          --border: rgba(255,255,255,0.08);
          --success: #34D399;
          background: var(--bg);
          color: var(--text);
          font-family: 'Inter', sans-serif;
          overflow-x: hidden;
          position: relative;
        }
        .vlc-root * { box-sizing: border-box; margin: 0; padding: 0; }
        .vlc-root img { display:block; max-width:100%; }
        .vlc-root a { text-decoration: none; color: inherit; }
        .vlc-display {
          font-family: 'Bebas Neue', sans-serif;
          letter-spacing: 0.01em;
          line-height: 0.92;
          text-transform: uppercase;
        }
        .vlc-mono { font-family: 'IBM Plex Mono', monospace; }
        .vlc-eyebrow {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 12px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--accent);
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .vlc-eyebrow::before {
          content: '';
          width: 22px; height: 1px;
          background: var(--accent);
          display: inline-block;
        }
        .vlc-section { padding: 120px 8vw; position: relative; }
        @media (max-width: 720px) { .vlc-section { padding: 64px 5vw; } }
        @media (max-width: 400px) { .vlc-section { padding: 48px 4vw; } }

        /* NAV */
        .vlc-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 50;
          display: flex; align-items: center; justify-content: space-between;
          padding: 22px 8vw;
          backdrop-filter: blur(14px);
          border-bottom: 1px solid transparent;
        }
        .vlc-logo { display: flex; align-items: center; gap: 10px; font-family:'Bebas Neue',sans-serif; font-size: 26px; letter-spacing: 0.06em; }
        .vlc-logo span { color: var(--accent); }
        .vlc-logo-icon {
          display: flex; align-items: center; justify-content: center;
          width: 36px; height: 36px; border-radius: 10px;
          background: transparent; color: #fff; font-size: 14px; font-weight: 700;
          font-family: 'Inter', sans-serif; letter-spacing: 0;
          box-shadow: none;
        }
        .vlc-logo-icon img { width: 100%; height: 100%; object-fit: contain; }
        .vlc-nav-links { display: flex; gap: 36px; list-style: none; }
        .vlc-nav-links a {
          color: var(--muted); text-decoration: none; font-size: 14px; font-weight: 500;
          transition: color .25s ease; position: relative;
        }
        .vlc-nav-links a:hover { color: var(--text); }
        .vlc-nav-right { display: flex; align-items: center; gap: 14px; }
        .vlc-login-btn {
          display:flex; align-items:center; gap:6px; background: transparent;
          border: 1px solid var(--border); color: var(--muted); border-radius: 999px;
          padding: 9px 18px; cursor: pointer; font-size: 13px; font-weight: 600;
          transition: background .25s ease, color .25s ease, border-color .25s ease; text-decoration: none;
        }
        .vlc-login-btn:hover { background: var(--accent); color: #fff; border-color: var(--accent); }
        .vlc-merchant-btn {
          display:flex; align-items:center; gap:6px; background: transparent;
          border: 1px solid var(--border); color: var(--muted); border-radius: 999px;
          padding: 9px 18px; cursor: pointer; font-size: 13px; font-weight: 600;
          transition: background .25s ease, color .25s ease, border-color .25s ease; text-decoration: none;
        }
        .vlc-merchant-btn:hover { background: var(--accent); color: #fff; border-color: var(--accent); }
        .vlc-burger { display:none; background:none; border:none; color:var(--text); cursor:pointer; }
        @media (max-width: 860px) {
          .vlc-nav-links { display:none; }
          .vlc-burger { display:block; }
          .vlc-nav-right .vlc-login-btn,
          .vlc-nav-right .vlc-merchant-btn { display: none; }
        }
        .vlc-mobile-menu {
          position: fixed; inset: 0; background: var(--bg); z-index: 60;
          display:flex; flex-direction:column; justify-content:center; gap: 28px; padding: 8vw;
        }
        .vlc-mobile-menu a { font-family:'Bebas Neue'; font-size: 42px; color: var(--text); text-decoration:none; }
        .vlc-mobile-close { position:absolute; top:26px; right:8vw; background:none; border:none; color:var(--text); cursor:pointer; }

        /* HERO */
        .vlc-hero {
          min-height: 100vh; display:flex; align-items:center; position:relative;
          padding: 140px 8vw 60px; overflow:hidden;
        }
        @media(max-width:720px){ .vlc-hero { padding: 120px 5vw 48px; min-height: auto; } }
        @media(max-width:400px){ .vlc-hero { padding: 110px 4vw 40px; } }
        .vlc-hero-grid { display:grid; grid-template-columns: 1.05fr 0.95fr; gap: 40px; align-items:center; width:100%; position:relative; z-index:2; }
        @media (max-width: 960px) { .vlc-hero-grid { grid-template-columns: 1fr; } }
        .vlc-hero h1 {
          font-size: clamp(52px, 7.2vw, 108px);
          color: var(--text);
        }
        .vlc-hero h1 .accent { color: var(--accent); }
        .vlc-hero p.sub {
          color: var(--muted); font-size: clamp(14px, 2vw, 17px); max-width: 440px; margin-top: 22px; line-height: 1.6;
        }
        .vlc-hero-cta { display:flex; gap: 16px; margin-top: 38px; align-items:center; flex-wrap: wrap; }
        .vlc-btn-primary {
          background: var(--accent); color: #fff; border: none; padding: 15px 26px;
          border-radius: 999px; font-weight: 700; font-size: 14px; cursor:pointer;
          display:flex; align-items:center; gap: 10px; letter-spacing: 0.02em;
          box-shadow: 0 0 30px var(--accent-glow); transition: all .25s ease;
          text-decoration: none;
        }
        .vlc-btn-primary:hover { filter: brightness(1.1); transform: translateY(-2px); }
        .vlc-btn-ghost {
          background: transparent; color: var(--text); border: 1px solid var(--border);
          padding: 15px 24px; border-radius: 999px; font-weight: 600; font-size: 14px; cursor:pointer;
          transition: all .25s ease; text-decoration: none;
          display:flex; align-items:center; gap: 8px;
        }
        .vlc-btn-ghost:hover { border-color: rgba(255,255,255,0.2); }
        .vlc-hero-visual { position: relative; height: 480px; }
        .vlc-hero-img-wrap {
          position: absolute; inset: 0; display:flex; align-items:center; justify-content:center;
        }
        .vlc-hero-img {
          width: 100%; max-width: 480px; border-radius: 24px; overflow:hidden;
          box-shadow: 0 40px 80px -20px rgba(0,0,0,0.6);
          border: 1px solid var(--border);
          position: relative; transform-style: preserve-3d;
          will-change: transform;
        }
        .vlc-hero-img img { width:100%; height: 420px; object-fit: cover; }
        @media (max-width: 960px) {
          .vlc-hero-visual { height: auto; min-height: 260px; }
          .vlc-hero-img-wrap { position: relative; inset: auto; }
          .vlc-hero-img { max-width: 100%; }
          .vlc-hero-img img { height: 260px; }
        }
        .vlc-orb {
          position:absolute; border-radius:50%; filter: blur(60px); opacity:0.35; z-index:0;
        }
        .vlc-orb-1 { width: 340px; height: 340px; background: var(--accent); top: 6%; right: 8%; }
        .vlc-orb-2 { width: 260px; height: 260px; background: var(--ice); bottom: 4%; left: 2%; opacity: 0.14; }
        .vlc-speedlines { position:absolute; inset:0; z-index:0; pointer-events:none; opacity:0.5; }
        .vlc-speedline {
          position:absolute; height:1px; background: linear-gradient(90deg, transparent, var(--border), transparent);
          width: 60%;
        }
        .vlc-scroll-cue {
          position:absolute; bottom: 34px; left: 50%; transform: translateX(-50%);
          display:flex; flex-direction:column; align-items:center; gap:6px; color: var(--muted);
          font-family:'IBM Plex Mono'; font-size: 11px; letter-spacing: 0.1em; z-index: 2;
        }

        /* TRUST BAR */
        .vlc-trust { display:flex; gap: 20px; flex-wrap:wrap; padding: 28px 8vw; border-top:1px solid var(--border); border-bottom:1px solid var(--border); }
        .vlc-trust-item { display:flex; align-items:center; gap: 10px; color: var(--muted); font-size: 13px; }
        .vlc-trust-item svg { color: var(--accent); }
        @media (max-width: 600px) {
          .vlc-trust { gap: 14px; padding: 20px 6vw; }
          .vlc-trust-item { font-size: 12px; }
        }

        /* MARQUEE */
        .vlc-marquee-wrap { overflow:hidden; border-bottom: 1px solid var(--border); padding: 22px 0; background: var(--surface); }
        .vlc-marquee-track { display:flex; gap: 48px; white-space:nowrap; width: max-content; }
        .vlc-marquee-track span { font-family:'Bebas Neue'; font-size: 26px; color: var(--muted); letter-spacing: 0.04em; }
        .vlc-marquee-track span.dot { color: var(--accent); }

        /* SECTION HEAD */
        .vlc-head { display:flex; justify-content:space-between; align-items:flex-end; gap: 24px; margin-bottom: 56px; flex-wrap:wrap; }
        .vlc-head h2 { font-size: clamp(34px, 4.5vw, 58px); }
        .vlc-head p { color: var(--muted); max-width: 360px; font-size: 14px; line-height:1.6; }

        /* PRODUCT GRID */
        .vlc-grid { display:grid; grid-template-columns: repeat(3, 1fr); gap: 30px; }
        @media (max-width: 1080px) { .vlc-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 560px) { .vlc-grid { grid-template-columns: 1fr; } }
        .vlc-card-wrap { perspective: 900px; }
        .vlc-card {
          background: var(--surface); border: 1px solid var(--border); border-radius: 18px;
          overflow:hidden; position:relative; transform-style: preserve-3d;
        }
        .vlc-card-tag {
          position:absolute; top:14px; left:14px; z-index:3; background: var(--accent);
          color:#fff; font-size: 10px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase;
          padding: 5px 10px; border-radius: 999px;
        }
        .vlc-card-media { position:relative; height: 220px; background: var(--surface-2); overflow:hidden; }
        .vlc-card-media img { width:100%; height:100%; object-fit: cover; }
        .vlc-glare { position:absolute; inset:0; pointer-events:none; }
        .vlc-card-body { padding: 20px; }
        .vlc-card-row { display:flex; justify-content:space-between; align-items:baseline; }
        .vlc-card-row h3 { font-family:'Bebas Neue'; font-size: 26px; letter-spacing:0.03em; }
        .vlc-price { font-family:'IBM Plex Mono'; color: var(--ice); font-size: 15px; }
        .vlc-card-type { color: var(--muted); font-size: 13px; margin-top: 2px; }
        .vlc-specs { display:flex; gap: 8px; font-family:'IBM Plex Mono'; font-size: 11px; color: var(--muted); margin-top: 14px; flex-wrap:wrap; }
        .vlc-add {
          margin-top: 18px; width:100%; background: var(--surface-2); border: 1px solid var(--border);
          color: var(--text); padding: 12px; border-radius: 10px; display:flex; align-items:center;
          justify-content:center; gap: 8px; cursor:pointer; font-weight:600; font-size: 13px;
          transition: background .25s ease, border-color .25s ease; text-decoration: none;
        }
        .vlc-add:hover { border-color: var(--accent); background: var(--accent-dim); }

        /* LAYERS / TECH */
        .vlc-layers { display:grid; grid-template-columns: 0.9fr 1.1fr; gap: 60px; align-items:center; }
        @media (max-width: 900px) { .vlc-layers { grid-template-columns: 1fr; } }
        .vlc-layer-visual {
          position:relative; height: 420px; border-radius: 20px; overflow:hidden;
          background: linear-gradient(180deg, var(--surface), var(--surface-2));
          border: 1px solid var(--border);
        }
        @media(max-width:900px){ .vlc-layer-visual { height: 220px; } }
        .vlc-layer-visual img { width:100%; height:100%; object-fit:cover; opacity:0.55; }
        .vlc-layer-item { display:flex; gap: 20px; padding: 26px 0; border-top: 1px solid var(--border); }
        .vlc-layer-item:last-child { border-bottom: 1px solid var(--border); }
        .vlc-layer-n { font-family:'Bebas Neue'; font-size: 30px; color: var(--accent); min-width: 50px; }
        .vlc-layer-item h4 { font-size: 17px; margin-bottom: 8px; }
        .vlc-layer-item p { color: var(--muted); font-size: 14px; line-height: 1.6; max-width: 420px; }
        .vlc-layer-overlay { position:absolute; inset:0; background:linear-gradient(135deg,rgba(99,102,241,.12),transparent 45%,rgba(0,0,0,.5)); }
        .vlc-layer-label { position:absolute; left:22px; bottom:20px; z-index:2; font-family:'IBM Plex Mono'; font-size:11px; color:var(--ice); letter-spacing:.12em; }

        /* COUNTDOWN */
        .vlc-drop { background:var(--surface); border-top:1px solid var(--border); border-bottom:1px solid var(--border); }
        .vlc-drop-grid { display:grid; grid-template-columns:1fr auto; gap:40px; align-items:center; }
        @media(max-width:800px){.vlc-drop-grid{grid-template-columns:1fr}.vlc-drop-grid .vlc-countdown{justify-self:start}}
        .vlc-drop-copy h2 { font-family:'Bebas Neue'; font-size:clamp(42px,5vw,70px); margin-top:12px; }
        .vlc-drop-copy p { color:var(--muted); max-width:540px; line-height:1.7; margin-top:14px; font-size:14px; }
        .vlc-countdown { display:flex; gap:10px; flex-wrap:wrap; }
        .vlc-digit { text-align:center; min-width:58px; }
        .vlc-digit-window { height:54px; overflow:hidden; display:grid; place-items:center; background:var(--surface-2); border:1px solid var(--border); border-radius:12px; font-family:'IBM Plex Mono'; font-size:22px; color:var(--text); }
        .vlc-digit-label { margin-top:7px; font-family:'IBM Plex Mono'; font-size:9px; letter-spacing:.13em; color:var(--muted); text-transform:uppercase; }
        @media(max-width:400px){
          .vlc-digit { min-width:50px; }
          .vlc-digit-window { height:46px; font-size:18px; }
          .vlc-countdown { gap:8px; }
        }

        /* QUOTE */
        .vlc-quote-grid { display:grid; grid-template-columns:1.1fr .9fr; gap:60px; align-items:end; }
        @media(max-width:900px){.vlc-quote-grid{grid-template-columns:1fr}}
        .vlc-quote-mark { font-family:'Bebas Neue'; color:var(--accent); font-size:clamp(48px,6vw,80px); line-height:.7; }
        .vlc-quote { font-family:'Bebas Neue'; font-size:clamp(34px,4.5vw,62px); line-height:.98; text-transform:uppercase; margin-top:18px; }
        .vlc-quote-meta { color:var(--muted); font-family:'IBM Plex Mono'; font-size:11px; margin-top:26px; letter-spacing:.08em; }
        .vlc-testimonials { display:grid; gap:14px; }
        .vlc-testimonial { padding:22px; border:1px solid var(--border); background:var(--surface); border-radius:14px; }
        .vlc-stars { display:flex; gap:3px; color:var(--accent); margin-bottom:12px; }
        .vlc-testimonial p { color:var(--ice); font-size:14px; line-height:1.65; }
        .vlc-testimonial small { display:block; color:var(--muted); margin-top:14px; font-family:'IBM Plex Mono'; font-size:10px; }

        /* CTA BANNER */
        .vlc-cta-banner {
          text-align: center; padding: 80px 6vw;
          background: linear-gradient(180deg, var(--bg), var(--surface));
          border-top: 1px solid var(--border);
        }
        @media(max-width:600px){ .vlc-cta-banner { padding: 56px 5vw; } }
        .vlc-cta-banner h2 { font-family:'Bebas Neue'; font-size: clamp(40px,5.5vw,72px); margin-top: 14px; }
        .vlc-cta-banner p { color: var(--muted); max-width: 520px; margin: 18px auto 0; font-size: 15px; line-height: 1.7; }
        .vlc-cta-btns { display: flex; gap: 16px; justify-content: center; margin-top: 40px; flex-wrap: wrap; }

        /* FOOTER */
        .vlc-footer { padding:70px 8vw 32px; border-top:1px solid var(--border); background:#0a0c0f; }
        .vlc-footer-top { display:grid; grid-template-columns:1.3fr 1fr 1fr 1fr; gap:50px; padding-bottom:60px; }
        @media(max-width:800px){.vlc-footer-top{grid-template-columns:1fr 1fr}.vlc-footer-brand{grid-column:1/-1}}
        @media(max-width:520px){.vlc-footer-top{grid-template-columns:1fr}.vlc-footer-brand{grid-column:auto}}
        .vlc-footer-brand p { color:var(--muted); max-width:300px; line-height:1.7; font-size:13px; margin-top:16px; }
        .vlc-footer h5 { font-family:'IBM Plex Mono'; color:var(--text); font-size:10px; letter-spacing:.15em; margin-bottom:18px; }
        .vlc-footer a { display:block; color:var(--muted); text-decoration:none; font-size:13px; margin:10px 0; transition:color .2s; }
        .vlc-footer a:hover { color:var(--text); }
        .vlc-footer-bottom { border-top:1px solid var(--border); padding-top:24px; display:flex; justify-content:space-between; gap:20px; color:var(--muted); font-family:'IBM Plex Mono'; font-size:10px; flex-wrap:wrap; }

        @keyframes vlc-marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        .vlc-marquee-track { animation:vlc-marquee 24s linear infinite; }
        .vlc-marquee-wrap:hover .vlc-marquee-track { animation-play-state:paused; }
        @media(prefers-reduced-motion:reduce){.vlc-marquee-track{animation:none}}
      `}</style>

      {/* ── NAV ────────────────────────────────────────────────────── */}
      <motion.nav className="vlc-nav" style={{ background: navBg, borderColor: navBorder }}>
        <Link to="/" className="vlc-logo">
          <span className="vlc-logo-icon"><img src="/returnguard-icon.svg" alt="" /></span>
          RETURN<span>GUARD</span>
        </Link>

        <div className="vlc-nav-right">
          <Link to="/login" className="vlc-login-btn">Shopper Login</Link>
          <Link to="/merchant/login" className="vlc-merchant-btn">Merchant Login</Link>
          <button className="vlc-burger" onClick={() => setNavOpen(true)} aria-label="Open menu"><Menu size={22} /></button>
        </div>
      </motion.nav>

      {/* ── MOBILE MENU DRAWER ────────────────────────────────────────── */}
      <AnimatePresence>
        {navOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
              onClick={() => setNavOpen(false)}
            />

            {/* Drawer */}
            <motion.aside
              key="drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="fixed inset-y-0 right-0 z-50 flex w-[82vw] max-w-[340px] flex-col justify-between bg-white text-slate-900 shadow-2xl"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              <div>
                {/* Close Button Top Row */}
                <div className="flex items-center justify-end px-5 pt-5 pb-3">
                  <button
                    onClick={() => setNavOpen(false)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                    aria-label="Close menu"
                  >
                    <X size={22} strokeWidth={2.2} />
                  </button>
                </div>

                {/* Nav Links with Divider Lines */}
                <nav className="mt-1 flex flex-col">
                  <a
                    href="#top"
                    onClick={() => setNavOpen(false)}
                    className="flex items-center justify-between border-b border-slate-100 px-6 py-3.5 text-[15px] font-medium text-slate-800 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                  >
                    Home
                  </a>
                  <a
                    href="#shop"
                    onClick={() => setNavOpen(false)}
                    className="flex items-center justify-between border-b border-slate-100 px-6 py-3.5 text-[15px] font-medium text-slate-800 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                  >
                    Collection
                  </a>
                  <Link
                    to="/shop"
                    onClick={() => setNavOpen(false)}
                    className="flex items-center justify-between border-b border-slate-100 px-6 py-3.5 text-[15px] font-medium text-slate-800 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                  >
                    Shop Store
                  </Link>
                  <a
                    href="#drop"
                    onClick={() => setNavOpen(false)}
                    className="flex items-center justify-between border-b border-slate-100 px-6 py-3.5 text-[15px] font-medium text-slate-800 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                  >
                    Early Access
                  </a>
                  <a
                    href="#stories"
                    onClick={() => setNavOpen(false)}
                    className="flex items-center justify-between border-b border-slate-100 px-6 py-3.5 text-[15px] font-medium text-slate-800 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                  >
                    Impact Stories
                  </a>
                  <a
                    href="#top"
                    onClick={() => setNavOpen(false)}
                    className="flex items-center justify-between border-b border-slate-100 px-6 py-3.5 text-[15px] font-medium text-slate-800 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                  >
                    Contact
                  </a>
                </nav>
              </div>

              {/* Bottom Buttons: Shopper Login & Merchant Login */}
              <div className="border-t border-slate-100 p-5 space-y-2.5">
                <Link
                  to="/login"
                  onClick={() => setNavOpen(false)}
                  className="flex w-full items-center justify-center rounded-full bg-[#0055ff] py-3.5 px-6 text-[15px] font-semibold text-white shadow-sm hover:bg-[#0047d6] active:scale-[0.98] transition-all"
                >
                  Shopper Login
                </Link>
                <Link
                  to="/merchant/login"
                  onClick={() => setNavOpen(false)}
                  className="flex w-full items-center justify-center rounded-full border border-slate-200 bg-white py-3 px-6 text-[14px] font-medium text-slate-700 hover:bg-slate-50 active:scale-[0.98] transition-all"
                >
                  Merchant Login
                </Link>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── HERO ───────────────────────────────────────────────────── */}
      <section id="top" className="vlc-hero">
        <div className="vlc-orb vlc-orb-1" />
        <div className="vlc-orb vlc-orb-2" />
        <div className="vlc-speedlines">
          {[18, 32, 46, 61, 77].map((top, i) => <span key={i} className="vlc-speedline" style={{ top: `${top}%`, left: `${i % 2 ? 35 : 5}%`, transform: `rotate(${i % 2 ? 2 : -2}deg)` }} />)}
        </div>
        <div className="vlc-hero-grid">
          <div>
            <Reveal>
              <div className="vlc-eyebrow">India · COD-native · Return-fraud protection</div>
              <h1 className="vlc-display" style={{ marginTop: 18 }}>SECURE<br /><span className="accent">SHOPPING.</span><br />SMARTER RETURNS.</h1>
              <p className="sub">ReturnGuard protects D2C merchants from wardrobing, empty-box returns, and serial over-ordering — while keeping honest customers friction-free.</p>

            </Reveal>
          </div>
          <div className="vlc-hero-visual">
            <div className="vlc-hero-img-wrap">
              <HeroImage reduce={reduce} />
            </div>
          </div>
        </div>
        <div className="vlc-scroll-cue"><ChevronDown size={14} /><span>SCROLL TO EXPLORE</span></div>
      </section>

      {/* ── TRUST BAR ──────────────────────────────────────────────── */}
      <div className="vlc-trust">
        <div className="vlc-trust-item"><ShieldCheck size={16} /> Zero friction for honest shoppers</div>
        <div className="vlc-trust-item"><Fingerprint size={16} /> Real-time device fingerprinting</div>
        <div className="vlc-trust-item"><RotateCcw size={16} /> AI-powered return scoring</div>
        <div className="vlc-trust-item"><Star size={16} /> 98% fraud detection accuracy</div>
      </div>

      {/* ── MARQUEE ────────────────────────────────────────────────── */}
      <div className="vlc-marquee-wrap">
        <div className="vlc-marquee-track">
          {[...MATERIALS, ...MATERIALS].map((m, i) => <React.Fragment key={`${m}-${i}`}><span>{m}</span><span className="dot">·</span></React.Fragment>)}
        </div>
      </div>

      {/* ── PRODUCT GRID ───────────────────────────────────────────── */}
      <section id="shop" className="vlc-section">
        <div className="vlc-head">
          <div><div className="vlc-eyebrow">The collection</div><h2 className="vlc-display" style={{ marginTop: 14 }}>CRAFTED TO<br />IMPRESS.</h2></div>
          <p>Premium products protected by ReturnGuard's intelligent fraud detection — shop with confidence.</p>
        </div>
        <div className="vlc-grid">
          {PRODUCTS.map((p, i) => <ProductCard key={p.id} p={p} index={i} reduce={reduce} />)}
        </div>
      </section>


      {/* ── COUNTDOWN ──────────────────────────────────────────────── */}
      <section id="drop" className="vlc-section vlc-drop">
        <div className="vlc-drop-grid">
          <div className="vlc-drop-copy">
            <div className="vlc-eyebrow">Limited pilot program</div>
            <h2>EARLY ACCESS<br />CLOSING SOON.</h2>
            <p>Join the first wave of merchants using ReturnGuard's AI-powered fraud detection. Pilot spots are limited — secure your place before the window closes.</p>
          </div>
          <div className="vlc-countdown">
            <Digit value={d} label="days" />
            <Digit value={h} label="hours" />
            <Digit value={m} label="minutes" />
            <Digit value={s} label="seconds" />
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ───────────────────────────────────────────── */}
      <section id="stories" className="vlc-section">
        <div className="vlc-quote-grid">
          <Reveal>
            <div className="vlc-quote-mark">"</div>
            <div className="vlc-quote">{TESTIMONIALS[0].quote}</div>
            <div className="vlc-quote-meta">{TESTIMONIALS[0].name.toUpperCase()} · {TESTIMONIALS[0].role.toUpperCase()}</div>
          </Reveal>
          <div className="vlc-testimonials">
            {TESTIMONIALS.slice(1).map((t, i) => <Reveal key={t.name} delay={i * .1}><div className="vlc-testimonial"><div className="vlc-stars">{[1, 2, 3, 4, 5].map(n => <Star key={n} size={13} fill="currentColor" />)}</div><p>"{t.quote}"</p><small>{t.name} · {t.role}</small></div></Reveal>)}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ─────────────────────────────────────────────── */}
      <section className="vlc-cta-banner">
        <div className="vlc-eyebrow" style={{ justifyContent: 'center' }}>Get started today</div>
        <h2 className="vlc-display">READY TO<br />PROTECT YOUR STORE?</h2>
        <p>Whether you're a shopper looking for secure transactions or a merchant fighting return fraud — ReturnGuard has you covered.</p>

      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────── */}
      <footer className="vlc-footer">
        <div className="vlc-footer-top">
          <div className="vlc-footer-brand">
            <div className="vlc-logo" style={{ fontSize: 22 }}>
              <span className="vlc-logo-icon" style={{ width: 30, height: 30, fontSize: 12 }}><img src="/returnguard-icon.svg" alt="" /></span>
              RETURN<span>GUARD</span>
            </div>
            <p>Intelligent return-fraud protection for India's D2C merchants. Secure shopping for every customer.</p>
          </div>
          <div><h5>SHOP</h5><Link to="/shop">All Products</Link><Link to="/shop">Watches</Link><Link to="/shop">Audio</Link><Link to="/shop">Footwear</Link></div>
          <div><h5>PLATFORM</h5><a href="#technology">Technology</a><a href="#stories">Stories</a><a href="#drop">Early Access</a><Link to="/merchant/login">For Merchants</Link></div>
          <div><h5>ACCOUNT</h5><Link to="/login">Shopper Login</Link><Link to="/register">Create Account</Link><Link to="/merchant/login">Merchant Login</Link><a href="#top">Contact</a></div>
        </div>
        <div className="vlc-footer-bottom"><span>© {new Date().getFullYear()} RETURNGUARD. ALL RIGHTS RESERVED.</span><span>ENGINEERED FOR TRUST.</span></div>
      </footer>
    </div>
  )
}
