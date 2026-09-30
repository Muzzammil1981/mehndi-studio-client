import { useEffect, useMemo, useState, useRef } from "react";
import {
  ArrowRight, Check, ChevronRight, CircleX, Heart, ImagePlus, Menu, Minus,
  Plus, Search, ShoppingBag, Sparkles, Star, Trash2, Upload, User, X, LogOut,
  Loader2, ExternalLink,
} from "lucide-react";
import { io } from "socket.io-client";

import LoginPage from "./pages/LoginPage";
import AdminDashboard from "./pages/AdminDashboard";
import AuthModal from "./pages/AuthModal";
import AccountModal from "./pages/AccountModal";
import BookingModal from "./pages/BookingModal";
import MyOrdersModal from "./pages/MyOrdersModal";
import PaymentModal from "./pages/PaymentModal";
import { api } from "./lib/api";
import { playNotificationSound, primeAudioOnFirstGesture } from "./lib/notify";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

function imageUrl(src) {
  if (!src) return "";
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  return `${API}${src}`;
}

const seedCategories = [
  { id: "arabic", name: "Arabic Mehndi", shortName: "Arabic", description: "Bold floral trails, statement motifs and elegant negative space.", accent: "Warm & graceful" },
  { id: "indian", name: "Indian Mehndi", shortName: "Indian", description: "Intricate paisleys, peacocks, florals and detailed traditional storytelling.", accent: "Intricate & rich" },
  { id: "pakistani", name: "Pakistani Mehndi", shortName: "Pakistani", description: "Mandalas, domes, architectural details and beautifully detailed fingers.", accent: "Detailed & regal" },
  { id: "moroccan", name: "Moroccan Mehndi", shortName: "Moroccan", description: "Geometric diamonds, grids, zig-zags and clean tribal-inspired lines.", accent: "Geometric & bold" },
  { id: "indo-arabic", name: "Indo-Arabic Mehndi", shortName: "Indo-Arabic", description: "Arabic openness meets Indian detail for a balanced statement look.", accent: "Balanced & expressive" },
  { id: "minimal-modern", name: "Minimal / Modern", shortName: "Modern", description: "Clean lines, small focal motifs and contemporary negative space.", accent: "Clean & modern" },
  { id: "bridal", name: "Bridal Mehndi", shortName: "Bridal", description: "Full, luxurious compositions for weddings, celebrations and bridal moments.", accent: "Grand & timeless" }
];

const demoImages = {
  arabic: "https://images.unsplash.com/photo-1594736797933-d0f06ba4a3a5?auto=format&fit=crop&w=900&q=80",
  indian: "https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=900&q=80",
  pakistani: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80",
  moroccan: "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=900&q=80",
  "indo-arabic": "https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=900&q=80",
  "minimal-modern": "https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=900&q=80",
  bridal: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=900&q=80"
};

function currency(value) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);
}

/* =========================================================
   ROOT APP
   ========================================================= */
function App() {
  const isAdminRoute = window.location.pathname.startsWith("/admin");
  const [adminUser, setAdminUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!isAdminRoute) { setChecking(false); return; }
    const token = localStorage.getItem("mehndi-token");
    if (!token) { setChecking(false); return; }
    api.get("/api/auth/me")
      .then(({ data }) => setAdminUser(data.user))
      .catch(() => localStorage.removeItem("mehndi-token"))
      .finally(() => setChecking(false));
  }, [isAdminRoute]);

  const logout = () => {
    localStorage.removeItem("mehndi-token");
    setAdminUser(null);
  };

  useEffect(() => { primeAudioOnFirstGesture(); }, []);

  if (isAdminRoute) {
    if (checking) {
      return (
        <div className="grid min-h-screen place-items-center bg-[#1b100b] text-[#f1cf8a]">
          <div className="serif text-2xl animate-pulse">Loading studio…</div>
        </div>
      );
    }
    if (!adminUser) return <LoginPage onLogin={setAdminUser} />;
    return <AdminDashboard user={adminUser} onLogout={logout} />;
  }

  return <PublicCatalog />;
}

/* =========================================================
   PUBLIC SITE
   ========================================================= */
function PublicCatalog() {
  const [categories, setCategories] = useState(seedCategories);
  const [designs, setDesigns] = useState([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [loading, setLoading] = useState(true);

  const [user, setUser] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [pendingDesign, setPendingDesign] = useState(null);

  const [bookingOpen, setBookingOpen] = useState(false);
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [paymentOrder, setPaymentOrder] = useState(null);

  const [cart, setCart] = useState([]);
  const [selectedItems, setSelectedItems] = useState(new Set());

  /* restore session */
  useEffect(() => {
    const token = localStorage.getItem("mehndi-user-token");
    if (!token) return;
    api.get("/api/users/me")
      .then(({ data }) => setUser(data.user))
      .catch(() => localStorage.removeItem("mehndi-user-token"));
  }, []);

  /* load cart when user changes */
  useEffect(() => {
    if (!user) { setCart([]); setSelectedItems(new Set()); return; }
    try {
      const saved = JSON.parse(localStorage.getItem(`mehndi-cart-${user.id}`) || "[]");
      setCart(Array.isArray(saved) ? saved : []);
      setSelectedItems(new Set());
    } catch {
      setCart([]);
      setSelectedItems(new Set());
    }
  }, [user?.id]);

  /* persist cart */
  useEffect(() => {
    if (!user) return;
    localStorage.setItem(`mehndi-cart-${user.id}`, JSON.stringify(cart));
  }, [cart, user?.id]);

  /* live notifications */
  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem("mehndi-user-token");
    const socket = io(API, { auth: { token } });

    socket.on("notification", (n) => {
      playNotificationSound(
        n.status === "approved" ? "success" :
          n.status === "rejected" ? "error" :
            "info"
      );
      if (n.type === "order-update") {
        window.dispatchEvent(new CustomEvent("mehndi:order-update", { detail: n }));
      }
    });

    return () => socket.disconnect();
  }, [user?.id]);

  /* load catalog */
  const load = async () => {
    try {
      const [cRes, dRes] = await Promise.all([
        fetch(`${API}/api/categories`),
        fetch(`${API}/api/designs`)
      ]);
      if (cRes.ok) setCategories(await cRes.json());
      if (dRes.ok) setDesigns(await dRes.json());
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    let list = designs;
    if (activeCategory !== "all") list = list.filter(d => d.categoryId === activeCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(d => `${d.name} ${d.description} ${d.categoryName}`.toLowerCase().includes(q));
    }
    return list;
  }, [designs, activeCategory, search]);

  /* cart ops */
  const doAddToCart = (design) => {
    setCart(prev => {
      const found = prev.find(x => x.id === design.id);
      if (found) return prev.map(x => x.id === design.id ? { ...x, qty: x.qty + 1 } : x);
      return [...prev, { ...design, qty: 1 }];
    });
    setSelected(null);
    setCartOpen(true);
  };

  const addToCart = (design) => {
    if (!user) { setPendingDesign(design); setAuthOpen(true); return; }
    doAddToCart(design);
  };

  const handleAuthSuccess = (u) => {
    setUser(u);
    setAuthOpen(false);
    if (pendingDesign) {
      setTimeout(() => doAddToCart(pendingDesign), 100);
      setPendingDesign(null);
    }
  };

  const userLogout = () => {
    localStorage.removeItem("mehndi-user-token");
    setUser(null);
    setCart([]);
    setSelectedItems(new Set());
    setCartOpen(false);
    setAccountOpen(false);
    setOrdersOpen(false);
    setBookingOpen(false);
    setPaymentOrder(null);
  };

  const toggleItem = (id) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedItems.size === cart.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(cart.map(x => x.id)));
    }
  };

  const cartCount = cart.reduce((n, x) => n + x.qty, 0);
  const cartTotal = cart.reduce((n, x) => n + x.qty * x.price, 0);
  const selectedCartItems = cart.filter(i => selectedItems.has(i.id));
  const selectedTotal = selectedCartItems.reduce((n, x) => n + x.qty * x.price, 0);

  return (
    <div className="min-h-screen bg-[#fbf8f2] text-[#2a1a12]">
      <Header
        count={cartCount}
        onCart={() => setCartOpen(true)}
        onMenu={() => setMobileMenu(!mobileMenu)}
        user={user}
        onSignIn={() => setAuthOpen(true)}
        onSignOut={userLogout}
        onAccount={() => setAccountOpen(true)}
        onOrders={() => setOrdersOpen(true)}
      />

      {mobileMenu && (
        <MobileMenu
          setMobileMenu={setMobileMenu}
          setActiveCategory={setActiveCategory}
          user={user}
          onSignIn={() => setAuthOpen(true)}
          onSignOut={userLogout}
          onAccount={() => setAccountOpen(true)}
          onOrders={() => setOrdersOpen(true)}
        />
      )}

      <main>
        <Hero onExplore={() => document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" })} />
        <CategoryRail categories={categories} active={activeCategory} setActive={setActiveCategory} />
        <Catalog
          categories={categories}
          designs={filtered}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          search={search}
          setSearch={setSearch}
          loading={loading}
          onSelect={setSelected}
          onAdmin={() => { window.location.href = "/admin"; }}
        />
        <Story />
      </main>

      <Footer />

      {selected && <DesignModal design={selected} onClose={() => setSelected(null)} onAdd={addToCart} />}

      {cartOpen && user && (
        <CartDrawer
          cart={cart}
          setCart={setCart}
          total={cartTotal}
          selectedItems={selectedItems}
          toggleItem={toggleItem}
          toggleAll={toggleAll}
          onClose={() => setCartOpen(false)}
          onProceed={() => { setCartOpen(false); setBookingOpen(true); }}
        />
      )}

      {authOpen && (
        <AuthModal
          reason={pendingDesign ? "Create an account or sign in to add this design to your selection." : null}
          onClose={() => { setAuthOpen(false); setPendingDesign(null); }}
          onSuccess={handleAuthSuccess}
        />
      )}

      {accountOpen && user && (
        <AccountModal
          user={user}
          onClose={() => setAccountOpen(false)}
          onSignOut={userLogout}
        />
      )}

      {bookingOpen && user && selectedCartItems.length > 0 && (
        <BookingModal
          cart={selectedCartItems}
          total={selectedTotal}
          onClose={() => setBookingOpen(false)}
          onSuccess={() => {
            const remaining = cart.filter(i => !selectedItems.has(i.id));
            setCart(remaining);
            setSelectedItems(new Set());
            setBookingOpen(false);
            setOrdersOpen(true);
          }}
        />
      )}

      {ordersOpen && user && (
        <MyOrdersModal
          onClose={() => setOrdersOpen(false)}
          onPay={(order) => { setOrdersOpen(false); setPaymentOrder(order); }}
        />
      )}

      {paymentOrder && user && (
        <PaymentModal
          order={paymentOrder}
          onClose={() => setPaymentOrder(null)}
          onPaid={() => { setPaymentOrder(null); setOrdersOpen(true); }}
        />
      )}
    </div>
  );
}

/* =========================================================
   HEADER
   ========================================================= */
function Header({ count, onCart, onMenu, user, onSignIn, onSignOut, onAccount, onOrders }) {
  return (
    <header className="sticky top-0 z-40 border-b border-[#eadfce] bg-[#fbf8f2]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-8">
        <a href="#" className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-[#24170f] text-[#f1cf8a]">
            <span className="serif text-xl">M</span>
          </div>
          <div>
            <div className="serif text-xl font-bold tracking-tight">Mehndi Studio</div>
            <div className="text-[9px] uppercase tracking-[.28em] text-[#8a6d53]">Art on your hands</div>
          </div>
        </a>

        <nav className="hidden items-center gap-8 text-sm font-medium lg:flex">
          <a href="#catalog" className="hover:text-[#9b5d32]">Designs</a>
          <a href="#categories" className="hover:text-[#9b5d32]">Categories</a>
          <a href="#story" className="hover:text-[#9b5d32]">Our Story</a>
          <a href="/admin" className="rounded-full border border-[#ded0bc] bg-white px-4 py-1.5 hover:bg-[#f4eadc]">Admin</a>
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <div className="hidden items-center gap-2 lg:flex">
              <button onClick={onOrders}
                className="flex items-center gap-2 rounded-full border border-[#ded0bc] bg-white px-4 py-2 text-sm font-semibold hover:bg-[#f4eadc]">
                📅 My orders
              </button>
              <button onClick={onAccount} title="Account settings"
                className="flex items-center gap-2 rounded-full border border-[#ded0bc] bg-white px-4 py-2 hover:bg-[#f4eadc]">
                <User size={15} className="text-[#7d3f24]" />
                <span className="max-w-[120px] truncate text-sm font-semibold">{user.username}</span>
              </button>
              <button onClick={onSignOut} title="Sign out"
                className="flex items-center gap-2 rounded-full border border-[#e6c4be] bg-white px-4 py-2 text-sm font-semibold text-[#9b3b2b] hover:bg-[#f7e9e6]">
                <LogOut size={15} /> Sign out
              </button>
            </div>
          ) : (
            <button onClick={onSignIn}
              className="hidden items-center gap-2 rounded-full border border-[#ded0bc] bg-white px-4 py-2 text-sm font-semibold hover:bg-[#f4eadc] lg:flex">
              <User size={15} /> Sign in
            </button>
          )}

          <button onClick={onMenu} className="rounded-full p-3 hover:bg-[#f0e6d8] lg:hidden"><Menu size={20} /></button>

          <button onClick={onCart}
            className="relative rounded-full border border-[#ded0bc] bg-white p-3 shadow-sm transition hover:-translate-y-0.5">
            <ShoppingBag size={19} />
            {count > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#7d3f24] px-1 text-[10px] font-bold text-white">{count}</span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

function MobileMenu({ setMobileMenu, setActiveCategory, user, onSignIn, onSignOut, onAccount, onOrders }) {
  return <div className="fixed inset-x-0 top-20 z-30 border-b border-[#eadfce] bg-[#fffdf9] p-5 shadow-xl lg:hidden">
    <div className="grid gap-2">
      {["all", "arabic", "indian", "pakistani", "moroccan", "indo-arabic", "minimal-modern", "bridal"].map(x =>
        <button key={x} onClick={() => { setActiveCategory(x); setMobileMenu(false); document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" }); }} className="rounded-xl px-4 py-3 text-left text-sm capitalize hover:bg-[#f4eadc]">{x === "all" ? "All Designs" : x.replace("-", " / ")}</button>
      )}

      {user ? (
        <>
          <button onClick={() => { setMobileMenu(false); onOrders(); }}
            className="flex items-center gap-2 rounded-xl border border-[#ded0bc] bg-white px-4 py-3 text-left text-sm font-semibold">
            📅 My orders
          </button>
          <button onClick={() => { setMobileMenu(false); onAccount(); }}
            className="flex items-center gap-2 rounded-xl border border-[#ded0bc] bg-white px-4 py-3 text-left text-sm font-semibold">
            <User size={15} /> {user.username}
          </button>
          <button onClick={() => { setMobileMenu(false); onSignOut(); }}
            className="flex items-center gap-2 rounded-xl border border-[#e6c4be] bg-white px-4 py-3 text-left text-sm font-semibold text-[#9b3b2b]">
            <LogOut size={15} /> Sign out
          </button>
        </>
      ) : (
        <button onClick={() => { setMobileMenu(false); onSignIn(); }}
          className="flex items-center gap-2 rounded-xl border border-[#ded0bc] bg-white px-4 py-3 text-left text-sm font-semibold">
          <User size={15} /> Sign in
        </button>
      )}

      <a href="/admin" className="rounded-xl bg-[#24170f] px-4 py-3 text-left text-sm font-semibold text-white">Open Admin</a>
    </div>
  </div>;
}

function Hero({ onExplore }) {
  return <section className="hero-pattern relative overflow-hidden">
    <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 lg:grid-cols-[1.05fr_.95fr] lg:px-8 lg:py-28">
      <div>
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#dfc9a8] bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[.18em] text-[#835b38]">
          <Sparkles size={14} /> Curated Mehndi Collection
        </div>
        <h1 className="serif max-w-3xl text-5xl font-semibold leading-[.98] tracking-[-.04em] sm:text-6xl lg:text-8xl">
          Where tradition<br /><span className="italic text-[#8c4e2f]">becomes art.</span>
        </h1>
        <p className="mt-7 max-w-xl text-base leading-7 text-[#715e4e] sm:text-lg">
          Explore expressive Mehndi designs across seven distinctive styles. Save your favourites, discover details and build your selection beautifully.
        </p>
        <div className="mt-9 flex flex-wrap gap-3">
          <button onClick={onExplore} className="group inline-flex items-center gap-3 rounded-full bg-[#24170f] px-6 py-3.5 text-sm font-semibold text-white shadow-luxe transition hover:-translate-y-0.5">
            Explore collection <ArrowRight size={17} className="transition group-hover:translate-x-1" />
          </button>
          <div className="flex items-center gap-2 rounded-full border border-[#ddcdb8] bg-white/70 px-5 py-3.5 text-sm text-[#715e4e]">
            <Star size={15} className="fill-[#bd8b48] text-[#bd8b48]" /> Designed for every occasion
          </div>
        </div>
      </div>
      <HeroArtwork />
    </div>
  </section>;
}

function HeroArtwork() {
  return <div className="relative mx-auto aspect-[4/5] w-full max-w-[520px]">
    <div className="absolute inset-8 rotate-[-5deg] rounded-[45%_45%_10%_10%] bg-[#e7d5bd]" />
    <div className="absolute inset-5 overflow-hidden rounded-[45%_45%_10%_10%] border border-white/70 bg-gradient-to-b from-[#eadac7] to-[#d1b595] shadow-luxe">
      <div className="absolute inset-0 opacity-70" style={{ backgroundImage: "radial-gradient(#8b5a36 1.2px, transparent 1.2px)", backgroundSize: "18px 18px" }} />
      <div className="absolute left-[17%] top-[17%] h-28 w-28 rotate-45 border-[3px] border-[#754327] opacity-90" />
      <div className="absolute right-[16%] top-[31%] h-24 w-24 rounded-full border-[3px] border-[#754327]" />
      <div className="absolute left-[28%] top-[48%] h-40 w-40 rounded-full border-[3px] border-[#754327]" />
      <div className="absolute bottom-[12%] left-[16%] right-[16%] h-20 rounded-full border-[3px] border-[#754327]" />
      <div className="absolute inset-x-10 bottom-8 text-center text-[#6f4027]">
        <div className="serif text-4xl italic">Mehndi</div>
        <div className="mt-1 text-[9px] uppercase tracking-[.5em]">timeless craft</div>
      </div>
    </div>
    <div className="absolute -bottom-2 -left-2 rounded-2xl border border-[#e2d1bb] bg-white/85 p-4 shadow-xl backdrop-blur">
      <div className="text-[10px] uppercase tracking-[.2em] text-[#92765c]">Collection</div>
      <div className="serif mt-1 text-xl">7 signature styles</div>
    </div>
  </div>;
}

function CategoryRail({ categories, active, setActive }) {
  return <section id="categories" className="border-y border-[#eadfce] bg-[#fffdf9]">
    <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
      <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
        <button onClick={() => setActive("all")} className={`shrink-0 rounded-full border px-5 py-2.5 text-sm font-semibold transition ${active === "all" ? "border-[#24170f] bg-[#24170f] text-white" : "border-[#ded0bc] bg-white hover:bg-[#f4eadc]"}`}>All styles</button>
        {categories.map(c => <button key={c.id} onClick={() => setActive(c.id)} className={`shrink-0 rounded-full border px-5 py-2.5 text-sm font-semibold transition ${active === c.id ? "border-[#7d3f24] bg-[#7d3f24] text-white" : "border-[#ded0bc] bg-white hover:bg-[#f4eadc]"}`}>{c.shortName}</button>)}
      </div>
    </div>
  </section>;
}

/* =========================================================
   CATALOG — with infinite scroll + smart search
   ========================================================= */
const PAGE_SIZE = 10;

function Catalog({ categories, designs, activeCategory, setActiveCategory, search, setSearch, loading, onSelect, onAdmin }) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef(null);

  const isFiltering = search.trim().length > 0 || activeCategory !== "all";
  const visibleDesigns = designs.slice(0, visibleCount);
  const hasMore = visibleCount < designs.length;

  /* Reset pagination when the filter changes */
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [activeCategory, search]);

  /* Infinite scroll observer */
  useEffect(() => {
    if (!isFiltering || !hasMore || loading) return;
    const el = sentinelRef.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount(c => Math.min(c + PAGE_SIZE, designs.length));
        }
      },
      { rootMargin: "400px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [isFiltering, hasMore, loading, designs.length]);

  return <section id="catalog" className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-24">
    <div className="flex flex-col justify-between gap-7 md:flex-row md:items-end">
      <div>
        <p className="text-xs font-bold uppercase tracking-[.25em] text-[#9b6d43]">The collection</p>
        <h2 className="serif mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">Find your signature style.</h2>
      </div>

      <SearchBox
        value={search}
        onChange={setSearch}
        designs={designs.length ? designs : []}
        categories={categories}
        onPickCategory={setActiveCategory}
        onPickDesign={onSelect}
      />
    </div>

    <div className="mt-12">
      {activeCategory === "all" && !search && <CategoryShowcase categories={categories} designs={designs} setActiveCategory={setActiveCategory} />}

      {activeCategory !== "all" && !search && <div className="mb-8 rounded-3xl border border-[#eadfce] bg-[#fffdf9] p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-[.22em] text-[#9b6d43]">Style</div>
            <h3 className="serif mt-1 text-3xl">{categories.find(c => c.id === activeCategory)?.name}</h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#715e4e]">{categories.find(c => c.id === activeCategory)?.description}</p>
          </div>
          <div className="rounded-full bg-[#f0e3d3] px-3 py-1 text-xs font-semibold">{designs.length} designs</div>
        </div>
      </div>}

      {isFiltering && (
        <>
          <DesignGrid designs={visibleDesigns} loading={loading} onSelect={onSelect} />

          {/* Loading-more sentinel */}
          {!loading && hasMore && (
            <div ref={sentinelRef} className="mt-12 flex flex-col items-center gap-2 text-[#8a6d53]">
              <Loader2 size={22} className="animate-spin" />
              <span className="text-xs">Loading more designs…</span>
            </div>
          )}

          {/* End of list */}
          {!loading && !hasMore && designs.length > PAGE_SIZE && (
            <div className="mt-12 text-center text-xs text-[#8a6d53]">
              You've seen all <strong>{designs.length}</strong> designs
            </div>
          )}
        </>
      )}

      {activeCategory === "all" && !search && <div className="mt-16">
        <div className="mb-7 flex items-end justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.22em] text-[#9b6d43]">Featured</p>
            <h3 className="serif mt-1 text-3xl">A few favourites to begin.</h3>
          </div>
          <button onClick={() => setActiveCategory("arabic")} className="hidden items-center gap-1 text-sm font-semibold text-[#7d3f24] sm:flex">
            Browse styles <ChevronRight size={16} />
          </button>
        </div>
        <DesignGrid designs={designs.slice(0, 6)} loading={loading} onSelect={onSelect} />
      </div>}

      {!loading && designs.length === 0 && <EmptyState search={search} onAdmin={onAdmin} />}
    </div>
  </section>;
}

/* =========================================================
   SMART SEARCH BOX — debounced, live suggestions
   ========================================================= */
function SearchBox({ value, onChange, designs, categories, onPickCategory, onPickDesign }) {
  const [input, setInput] = useState(value || "");
  const [open, setOpen] = useState(false);
  const [debounced, setDebounced] = useState(value || "");
  const boxRef = useRef(null);

  /* Debounce input → call parent + update local filter */
  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(input);
      onChange(input);
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input]);

  /* Close on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* Close on Esc */
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const q = debounced.trim().toLowerCase();

  const matchedCategories = q
    ? categories
      .filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.shortName.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
      )
      .slice(0, 3)
    : [];

  const matchedDesigns = q
    ? designs
      .filter(d =>
        `${d.name} ${d.description} ${d.categoryName}`.toLowerCase().includes(q)
      )
      .slice(0, 5)
    : [];

  const hasResults = matchedCategories.length > 0 || matchedDesigns.length > 0;

  const clearAll = () => {
    setInput("");
    setDebounced("");
    onChange("");
    setOpen(false);
  };

  return (
    <div ref={boxRef} className="relative w-full md:max-w-md">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a38b74]" size={18} />
      <input
        value={input}
        onChange={e => { setInput(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="Search designs, categories…"
        className="w-full rounded-full border border-[#ded0bc] bg-white py-3.5 pl-11 pr-24 text-sm outline-none ring-[#9b5d32] transition focus:ring-2"
      />

      {/* Clear button */}
      {input && (
        <button
          onClick={clearAll}
          className="absolute right-14 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-[#8a6d53] hover:bg-[#f1e6d8]"
          title="Clear search"
        >
          <X size={14} />
        </button>
      )}

      {/* Design count chip */}
      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-[#f1cf8a]/40 px-2 py-0.5 text-[10px] font-bold text-[#7d3f24]">
        {designs.length}
      </div>

      {/* Suggestions dropdown */}
      {open && q && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-96 overflow-auto rounded-2xl border border-[#eadfce] bg-white p-2 shadow-2xl">
          {!hasResults ? (
            <div className="py-8 text-center text-sm text-[#8a6d53]">
              <div className="serif text-lg">No matches for "{input}"</div>
              <div className="mt-1 text-xs">Try a different keyword</div>
            </div>
          ) : (
            <>
              {matchedCategories.length > 0 && (
                <div className="mb-1">
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.16em] text-[#8a6d53]">
                    Categories
                  </div>
                  {matchedCategories.map(c => (
                    <button
                      key={c.id}
                      onClick={() => { onPickCategory(c.id); setOpen(false); }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition hover:bg-[#faf5ed]"
                    >
                      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#f1cf8a]/40 text-[10px] font-bold text-[#7d3f24]">
                        {c.shortName.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-semibold">{c.name}</div>
                        <div className="truncate text-xs text-[#8a6d53]">{c.accent}</div>
                      </div>
                      <ChevronRight size={14} className="text-[#a38b74]" />
                    </button>
                  ))}
                </div>
              )}

              {matchedDesigns.length > 0 && (
                <div>
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.16em] text-[#8a6d53]">
                    Designs
                  </div>
                  {matchedDesigns.map(d => (
                    <button
                      key={d.id}
                      onClick={() => { onPickDesign(d); setOpen(false); }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition hover:bg-[#faf5ed]"
                    >
                      <img
                        src={imageUrl(d.image)}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="h-10 w-10 shrink-0 rounded-lg object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-semibold">{d.name}</div>
                        <div className="truncate text-xs text-[#8a6d53]">
                          {d.categoryName} · {currency(d.price)}
                        </div>
                      </div>
                      <ArrowRight size={14} className="text-[#a38b74]" />
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function CategoryShowcase({ categories, designs, setActiveCategory }) {
  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    {categories.map((c, i) => {
      const d = designs.find(x => x.categoryId === c.id);
      return <button key={c.id} onClick={() => setActiveCategory(c.id)} className={`group relative overflow-hidden rounded-[28px] border border-[#eadfce] bg-[#efe2d2] text-left ${i === 0 ? "lg:col-span-2 lg:row-span-2" : ""}`}>
        <div className={`aspect-[4/3] ${i === 0 ? "lg:aspect-auto lg:h-full lg:min-h-[450px]" : ""}`}>
          {d
            ? <img src={imageUrl(d.image)} alt={d.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
            : <img src={demoImages[c.id]} alt={c.name} className="h-full w-full object-cover opacity-70 transition duration-700 group-hover:scale-105" />
          }
          <div className="absolute inset-0 bg-gradient-to-t from-[#1f130d]/85 via-[#1f130d]/15 to-transparent" />
          <div className="absolute bottom-0 p-6 text-white">
            <div className="text-[10px] uppercase tracking-[.24em] text-[#f0d5a4]">{c.accent}</div>
            <div className="serif mt-1 text-2xl font-semibold">{c.name}</div>
            <div className="mt-2 max-w-sm text-xs leading-5 text-white/75">{c.description}</div>
            <div className="mt-4 inline-flex items-center gap-1 text-xs font-bold">Explore <ArrowRight size={14} /></div>
          </div>
        </div>
      </button>;
    })}
  </div>;
}

function DesignGrid({ designs, loading, onSelect }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-[4/5] animate-pulse rounded-3xl bg-[#eee3d4]" />
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
      {designs.map(d => <DesignCard key={d.id} design={d} onSelect={onSelect} />)}
    </div>
  );
}

function DesignCard({ design, onSelect }) {
  return <article className="group">
    <button onClick={() => onSelect(design)} className="relative block w-full overflow-hidden rounded-[24px] bg-[#eadcc9] text-left shadow-sm">
      <div className="aspect-[4/5]">
        <img
          src={imageUrl(design.image)}
          alt={design.name}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
        />
      </div>
      <div className="absolute inset-x-3 top-3 flex justify-between">
        {design.featured && <span className="rounded-full bg-white/90 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.16em]">Featured</span>}
        <span className="ml-auto rounded-full bg-[#24170f]/80 px-2.5 py-1 text-[9px] font-bold text-white">{currency(design.price)}</span>
      </div>
    </button>
    <div className="px-1 pt-3">
      <div className="text-[10px] font-bold uppercase tracking-[.16em] text-[#9a7352]">{design.categoryName}</div>
      <h3 className="mt-1 font-semibold">{design.name}</h3>
      <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#806b58]">{design.description || "A beautifully composed Mehndi design."}</p>
      <button onClick={() => onSelect(design)} className="mt-3 text-xs font-bold text-[#7d3f24]">View design →</button>
    </div>
  </article>;
}

function EmptyState({ search, onAdmin }) {
  return <div className="rounded-3xl border border-dashed border-[#d9c7b0] bg-[#fffdf9] px-6 py-16 text-center">
    <ImagePlus className="mx-auto text-[#9b7656]" size={34} />
    <h3 className="serif mt-4 text-2xl">{search ? "No matching designs yet" : "Your collection is ready for its first design"}</h3>
    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#806b58]">Add your actual Mehndi images, descriptions and prices from the admin panel.</p>
    <button onClick={onAdmin} className="mt-5 rounded-full bg-[#24170f] px-5 py-3 text-sm font-semibold text-white">Add a design</button>
  </div>;
}

function DesignModal({ design, onClose, onAdd }) {
  return <div className="fixed inset-0 z-50 grid place-items-center bg-[#20140e]/60 p-4 backdrop-blur-sm" onMouseDown={onClose}>
    <div onMouseDown={e => e.stopPropagation()} className="grid max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-[30px] bg-[#fffdf9] shadow-2xl md:grid-cols-2">
      <div className="min-h-[360px] bg-[#eadcc9]">
        <img src={imageUrl(design.image)} alt={design.name} className="h-full max-h-[620px] w-full object-cover" />
      </div>
      <div className="flex flex-col p-7 sm:p-10">
        <button onClick={onClose} className="ml-auto rounded-full p-2 hover:bg-[#f1e6d8]"><X size={19} /></button>
        <div className="mt-4 text-xs font-bold uppercase tracking-[.2em] text-[#9a7352]">{design.categoryName}</div>
        <h2 className="serif mt-2 text-4xl font-semibold">{design.name}</h2>
        <p className="mt-5 leading-7 text-[#725e4c]">{design.description || "A timeless Mehndi composition created for an elegant finish."}</p>
        <div className="mt-8 rounded-2xl bg-[#f3e9dc] p-5">
          <div className="text-xs uppercase tracking-[.15em] text-[#927158]">Price</div>
          <div className="mt-1 flex items-end gap-2">
            <span className="serif text-3xl font-bold">{currency(design.price)}</span>
            <span className="pb-1 text-xs text-[#806b58]">{design.amountType}</span>
          </div>
        </div>
        <button onClick={() => onAdd(design)} className="mt-auto flex items-center justify-center gap-2 rounded-full bg-[#24170f] px-6 py-4 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5">
          <ShoppingBag size={17} /> Add to selection
        </button>
      </div>
    </div>
  </div>;
}

/* =========================================================
   CART DRAWER
   ========================================================= */
function CartDrawer({
  cart, setCart, total,
  selectedItems, toggleItem, toggleAll,
  onClose, onProceed,
}) {
  const update = (id, delta) =>
    setCart(prev => prev.map(x => x.id === id ? { ...x, qty: Math.max(1, x.qty + delta) } : x));

  const allSelected = cart.length > 0 && selectedItems.size === cart.length;
  const someSelected = selectedItems.size > 0 && selectedItems.size < cart.length;
  const selectedTotal = cart
    .filter(i => selectedItems.has(i.id))
    .reduce((n, x) => n + x.qty * x.price, 0);

  return (
    <div className="fixed inset-0 z-50 bg-[#20140e]/45" onMouseDown={onClose}>
      <aside
        onMouseDown={e => e.stopPropagation()}
        className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-[#fffdf9] shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-[#eadfce] p-6">
          <div>
            <div className="text-xs font-bold uppercase tracking-[.2em] text-[#9a7352]">
              Your selection
            </div>
            <h2 className="serif mt-1 text-3xl">Cart</h2>
          </div>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-[#f1e6d8]">
            <X />
          </button>
        </div>

        {cart.length > 0 && (
          <div className="flex items-center justify-between border-b border-[#eadfce] bg-[#faf5ed] px-5 py-3">
            <label className="flex cursor-pointer items-center gap-3 text-sm font-semibold">
              <input
                type="checkbox"
                checked={allSelected}
                ref={el => { if (el) el.indeterminate = someSelected; }}
                onChange={toggleAll}
                className="h-4 w-4 accent-[#7d3f24]"
              />
              Select all ({cart.length})
            </label>
            <span className="text-xs text-[#8a6d53]">
              {selectedItems.size} selected
            </span>
          </div>
        )}

        <div className="flex-1 overflow-auto p-5">
          {cart.length === 0 ? (
            <div className="grid h-full place-items-center text-center">
              <div>
                <ShoppingBag className="mx-auto text-[#9a7352]" size={35} />
                <p className="serif mt-4 text-2xl">Your selection is empty.</p>
                <p className="mt-2 text-sm text-[#806b58]">
                  Add designs you would like to keep together.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map(item => {
                const isSelected = selectedItems.has(item.id);
                return (
                  <div
                    key={item.id}
                    className={`flex gap-3 rounded-2xl border p-3 transition ${isSelected
                      ? "border-[#7d3f24] bg-[#fdf7ee]"
                      : "border-[#eadfce] bg-white"
                      }`}
                  >
                    <label className="flex shrink-0 cursor-pointer items-start pt-1">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleItem(item.id)}
                        className="h-4 w-4 accent-[#7d3f24]"
                      />
                    </label>

                    <img
                      src={imageUrl(item.image)}
                      loading="lazy"
                      decoding="async"
                      className="h-24 w-20 rounded-xl object-cover"
                      alt=""
                    />

                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold">{item.name}</div>
                      <div className="mt-1 text-xs text-[#806b58]">{item.amountType}</div>
                      <div className="mt-2 font-bold">{currency(item.price)}</div>
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          onClick={() => update(item.id, -1)}
                          className="rounded-full border p-1"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-5 text-center text-xs">{item.qty}</span>
                        <button
                          onClick={() => update(item.id, 1)}
                          className="rounded-full border p-1"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => setCart(prev => prev.filter(x => x.id !== item.id))}
                      className="self-start p-1 text-[#a17e63] hover:text-[#7d3f24]"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="border-t border-[#eadfce] p-5">
            <div className="flex justify-between text-sm text-[#806b58]">
              <span>Subtotal</span>
              <span>{currency(total)}</span>
            </div>
            {selectedItems.size > 0 && selectedItems.size < cart.length && (
              <div className="mt-1 flex justify-between text-sm font-semibold text-[#7d3f24]">
                <span>Selected ({selectedItems.size})</span>
                <span>{currency(selectedTotal)}</span>
              </div>
            )}

            <button
              onClick={onProceed}
              disabled={selectedItems.size === 0}
              className="mt-4 w-full rounded-full bg-[#24170f] px-6 py-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              {selectedItems.size === 0
                ? "Select items to continue"
                : `Continue with ${selectedItems.size} item${selectedItems.size > 1 ? "s" : ""}`}
            </button>

            <p className="mt-3 text-center text-[10px] text-[#9a846f]">
              Pick your appointment date and time next.
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}

function Story() {
  return <section id="story" className="border-t border-[#eadfce] bg-[#24170f] text-[#fff9ef]">
    <div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 lg:grid-cols-2 lg:px-8">
      <div>
        <div className="text-xs font-bold uppercase tracking-[.24em] text-[#d8b37b]">The idea</div>
        <h2 className="serif mt-3 text-5xl leading-tight">Every pattern has a personality.</h2>
      </div>
      <div className="text-[#d9c9b8]">
        <p className="leading-7">From a quick Arabic trail to an elaborate bridal composition, Mehndi is more than decoration. This collection is designed to make discovering that expression simple, visual and personal.</p>
        <div className="mt-8 grid grid-cols-3 gap-4 border-t border-white/10 pt-7 text-center">
          <div><div className="serif text-3xl text-white">07</div><div className="mt-1 text-[10px] uppercase tracking-[.16em]">Styles</div></div>
          <div><div className="serif text-3xl text-white">∞</div><div className="mt-1 text-[10px] uppercase tracking-[.16em]">Possibilities</div></div>
          <div><div className="serif text-3xl text-white">01</div><div className="mt-1 text-[10px] uppercase tracking-[.16em]">Signature</div></div>
        </div>
      </div>
    </div>
  </section>;
}

/* =========================================================
   FOOTER — with "Powered by M-Technology"
   ========================================================= */
function Footer() {
  return (
    <footer className="relative overflow-hidden bg-[#1b100b] px-5 pt-12 pb-8 text-center text-xs text-[#aa9480]">
      {/* Subtle dot pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage: "radial-gradient(#c69a63 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />

      <div className="relative">
        <div className="serif text-xl text-[#eee0cf]">Mehndi Studio</div>
        <div className="mt-2">A modern catalog for a timeless craft.</div>

        {/* Powered-by badge */}
        <div className="mt-7 flex items-center justify-center gap-3 text-[11px]">
          <span className="text-[#7a6250]">Powered by</span>
          <a
            href="https://m-technology.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-1.5 rounded-full border border-[#3a2418] bg-gradient-to-r from-[#24170f] to-[#2d1a11] px-4 py-2 font-semibold text-[#f1cf8a] shadow-lg shadow-black/40 transition hover:-translate-y-0.5 hover:border-[#f1cf8a]/50"
          >
            <Sparkles size={12} className="transition group-hover:rotate-12" />
            <span>M-Technology</span>
            <ExternalLink size={11} className="transition group-hover:translate-x-0.5" />
          </a>
        </div>

        <div className="mt-7 border-t border-white/5 pt-5 text-[10px] text-[#7a6250]">
          © {new Date().getFullYear()} Mehndi Studio · All rights reserved
        </div>
      </div>
    </footer>
  );
}

export default App;