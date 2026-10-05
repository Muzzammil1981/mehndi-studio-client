import { useEffect, useState } from "react";
import {
    LogOut, Image as ImageIcon, Users, Bell, Plus, X, Upload, Loader2,
    Calendar, Clock, CheckCircle2, XCircle, ShieldAlert, Play, Square, BarChart3, LayoutGrid, Trash2, QrCode, Search
} from "lucide-react";
import { io } from "socket.io-client";
import GoogleDriveCard from "./GoogleDriveCard";
import { api, API_BASE } from "../lib/api";
import { playNotificationSound, primeAudioOnFirstGesture } from "../lib/notify";
import AdminSettingsCard from "./AdminSettingsCard";
import ReportsPanel from "./ReportsPanel";
import AdminDesigns from "./Admindesigns";
import { imageUrl, currency } from "../lib/format";
import SafeImage from "../components/SafeImage";

const CATEGORY_OPTIONS = [
    { id: "arabic", name: "Arabic Mehndi" },
    { id: "indian", name: "Indian Mehndi" },
    { id: "pakistani", name: "Pakistani Mehndi" },
    { id: "moroccan", name: "Moroccan Mehndi" },
    { id: "indo-arabic", name: "Indo-Arabic Mehndi" },
    { id: "minimal-modern", name: "Minimal / Modern" },
    { id: "bridal", name: "Bridal Mehndi" },
];

export default function AdminDashboard({ user, onLogout }) {
    const [toast, setToast] = useState(null);
    const [addOpen, setAddOpen] = useState(false);
    const [designsKey, setDesignsKey] = useState(0);
    const [lightbox, setLightbox] = useState(null);
    const [orders, setOrders] = useState([]);
    const [ordersLoading, setOrdersLoading] = useState(true);
    const [actionOrder, setActionOrder] = useState(null);

    useEffect(() => { primeAudioOnFirstGesture(); }, []);
    useEffect(() => {
        const p = new URLSearchParams(window.location.search).get("google");
        if (p === "connected") showToast("ok", "Google Drive connected ✓");
        if (p === "error") showToast("err", "Google Drive connection failed");
        if (p) window.history.replaceState({}, "", "/admin");
    }, []);

    useEffect(() => {
        const token = localStorage.getItem("mehndi-token");
        const socket = io(API_BASE, { auth: { token } });
        socket.on("notification", (n) => {
            playNotificationSound("info");
            if (n.type === "new-order" || n.type === "order-paid" || n.type === "payment-claim") {
                showToast("info", n.title);
                loadOrders(true);
            } else {
                showToast("info", n.title);
            }
        });
        return () => socket.disconnect();
    }, []);

    const [tab, setTab] = useState("dashboard");
    const loadOrders = async (silent = false) => {
        if (!silent) setOrdersLoading(true);
        try { const { data } = await api.get("/api/orders"); setOrders(data); }
        catch { /* ignore */ }
        finally { setOrdersLoading(false); }
    };

    useEffect(() => { loadOrders(); }, []);
    const showToast = (kind, text) => { setToast({ kind, text }); setTimeout(() => setToast(null), 3500); };
    const pendingCount = orders.filter(o => o.status === "pending").length;
    const verifyCount = orders.filter(o => o.status === "awaiting-verification").length;
    const HIDDEN_STATUSES = ["completed", "rejected"];
    const activeOrders = orders.filter(o => !HIDDEN_STATUSES.includes(o.status));

    return (
        <div className="min-h-[100dvh] overflow-x-hidden bg-[#fbf8f2] text-[#2a1a12]">
            <header className="sticky top-0 z-30 border-b border-[#eadfce] bg-[#fbf8f2]/90 backdrop-blur">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-5 lg:px-8">
                    <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#24170f] text-[#f1cf8a] serif">M</div>
                        <div className="min-w-0">
                            <div className="serif truncate text-sm font-bold leading-tight sm:text-base">Mehndi Studio</div>
                            <div className="truncate text-[9px] uppercase tracking-[.18em] text-[#8a6d53] sm:text-[10px] sm:tracking-[.22em]">SuperAdmin · {user.username}</div>
                        </div>
                    </div>
                    <button onClick={onLogout} className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#ded0bc] bg-white px-3 py-2 text-xs font-semibold hover:bg-[#f4eadc] sm:gap-2 sm:px-4 sm:text-sm"><LogOut size={14} /> <span className="hidden sm:inline">Sign out</span></button>
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-4 py-6 sm:px-5 sm:py-10 lg:px-8">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <h1 className="serif text-3xl font-semibold sm:text-4xl">Dashboard</h1>
                        <p className="mt-2 max-w-xl text-sm text-[#715e4e]">Manage Google Drive storage, designs, users and appointments.</p>
                    </div>
                    <div className="inline-flex w-full rounded-full border border-[#ded0bc] bg-white p-1 sm:w-auto overflow-x-auto no-scrollbar">
                        <button onClick={() => setTab("dashboard")} className={`inline-flex flex-1 items-center justify-center gap-2 rounded-full px-3 py-2 text-xs font-semibold transition sm:flex-none sm:px-4 sm:text-sm ${tab === "dashboard" ? "bg-[#24170f] text-white" : "text-[#5b4636] hover:bg-[#f4eadc]"}`}><LayoutGrid size={14} /> Dashboard</button>
                        <button onClick={() => setTab("events")} className={`inline-flex flex-1 items-center justify-center gap-2 rounded-full px-3 py-2 text-xs font-semibold transition sm:flex-none sm:px-4 sm:text-sm ${tab === "events" ? "bg-[#24170f] text-white" : "text-[#5b4636] hover:bg-[#f4eadc]"}`}><Calendar size={14} /> Events</button>
                        <button onClick={() => setTab("reports")} className={`inline-flex flex-1 items-center justify-center gap-2 rounded-full px-3 py-2 text-xs font-semibold transition sm:flex-none sm:px-4 sm:text-sm ${tab === "reports" ? "bg-[#24170f] text-white" : "text-[#5b4636] hover:bg-[#f4eadc]"}`}><BarChart3 size={14} /> Reports</button>
                    </div>
                </div>

                {tab === "reports" && <div className="mt-6 sm:mt-8"><ReportsPanel /></div>}
                {tab === "events" && <div className="mt-6 sm:mt-8"><EventsManager /></div>}

                {tab === "dashboard" && (
                    <>
                        <div className="mt-6 grid gap-4 sm:mt-8 sm:gap-6 lg:grid-cols-[1.2fr_.8fr]">
                            <GoogleDriveCard />
                            <div className="grid gap-3 sm:gap-4">
                                <button onClick={() => setAddOpen(true)} className="rounded-2xl border border-[#eadfce] bg-white p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md sm:rounded-3xl sm:p-5">
                                    <div className="flex items-center gap-3">
                                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#f1cf8a]/40 text-[#7d3f24]"><ImageIcon size={18} /></div>
                                        <div className="min-w-0 flex-1">
                                            <div className="text-sm font-semibold sm:text-base">Designs</div>
                                            <div className="truncate text-[11px] text-[#8a6d53] sm:text-xs">Add & manage Mehndi designs</div>
                                        </div>
                                        <Plus size={16} className="shrink-0 text-[#7d3f24]" />
                                    </div>
                                </button>
                                <QuickCard icon={<Users size={18} />} title="Users" body="Create ADMIN & USER accounts" />
                                <QuickCard icon={<Bell size={18} />} title="Appointments" body={verifyCount > 0 ? `${verifyCount} payment${verifyCount > 1 ? "s" : ""} to verify` : pendingCount > 0 ? `${pendingCount} pending request${pendingCount > 1 ? "s" : ""}` : "No pending requests"} />
                            </div>
                        </div>

                        <div className="mt-4 sm:mt-6"><AdminSettingsCard /></div>

                        <section className="mt-10 sm:mt-12">
                            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                                <div>
                                    <h2 className="serif text-xl font-semibold sm:text-2xl">Appointment requests</h2>
                                    <p className="text-xs text-[#8a6d53] sm:text-sm">{pendingCount} pending · {verifyCount} to verify · {activeOrders.length} active</p>
                                </div>
                                <button onClick={() => loadOrders()} className="self-start rounded-full border border-[#ded0bc] bg-white px-4 py-2.5 text-sm font-semibold hover:bg-[#f4eadc] sm:self-auto">Refresh</button>
                            </div>
                            {ordersLoading ? (
                                <div className="rounded-2xl border border-[#eadfce] bg-white p-12 text-center text-[#8a6d53]"><Loader2 className="mx-auto animate-spin" /></div>
                            ) : orders.length === 0 ? (
                                <div className="rounded-3xl border border-dashed border-[#d9c7b0] bg-white p-10 text-center text-sm text-[#8a6d53] sm:p-12">No appointment requests yet.</div>
                            ) : activeOrders.length === 0 ? (
                                <div className="rounded-3xl border border-dashed border-[#d9c7b0] bg-white p-10 text-center text-sm text-[#8a6d53] sm:p-12">No active appointment requests. Completed and rejected orders are in Reports.</div>
                            ) : (
                                <div className="grid gap-4">
                                    {activeOrders.map(o => <OrderCard key={o.id} order={o} onAction={setActionOrder} onRefresh={() => loadOrders(true)} onViewImage={(src, alt) => setLightbox({ src, alt })} />)}
                                </div>
                            )}
                        </section>

                        <AdminDesigns categories={CATEGORY_OPTIONS} refreshKey={designsKey} onAdd={() => setAddOpen(true)} onView={setLightbox} onToast={showToast} />
                    </>
                )}
            </main>

            {addOpen && <AddDesignModal onClose={() => setAddOpen(false)} onSaved={() => { setAddOpen(false); setDesignsKey(k => k + 1); showToast("ok", "Design uploaded to Drive ✓"); }} />}
            {actionOrder && <OrderActionModal order={actionOrder.order} mode={actionOrder.mode} onClose={() => setActionOrder(null)} onDone={() => { setActionOrder(null); loadOrders(true); showToast("ok", "Order updated"); }} />}
            {lightbox && <ImageLightbox src={lightbox.src} alt={lightbox.alt} onClose={() => setLightbox(null)} />}
            {toast && <div className={`fixed left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-2xl px-5 py-3 text-center text-sm font-semibold shadow-xl sm:left-auto sm:right-6 sm:w-auto sm:max-w-none sm:-translate-x-0 sm:text-left ${toast.kind === "err" ? "bg-[#7d3f24] text-white" : toast.kind === "ok" ? "bg-[#1d7a3e] text-white" : "bg-[#24170f] text-[#f1cf8a]"}`} style={{ bottom: "max(1.25rem, env(safe-area-inset-bottom))" }}>{toast.text}</div>}
        </div>
    );
}

/* EVENTS MANAGER COMPONENT (With QR Code Generator) */
/* =========================================================
   EVENTS MANAGER COMPONENT (With QR, Image Preview & Search)
   ========================================================= */
function EventsManager() {
    const [events, setEvents] = useState([]);
    const [designs, setDesigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // QR Code State
    const [qrEvent, setQrEvent] = useState(null);

    // Image Preview State
    const [previewDesign, setPreviewDesign] = useState(null);

    // NEW: Search State
    const [designSearch, setDesignSearch] = useState("");

    const [name, setName] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [selectedDesigns, setSelectedDesigns] = useState([]);
    const [selectAll, setSelectAll] = useState(false);
    const [priceOverrides, setPriceOverrides] = useState({});

    useEffect(() => {
        fetchEvents();
        fetchDesigns();
    }, []);

    const fetchEvents = async () => {
        try {
            const { data } = await api.get("/api/events");
            setEvents(Array.isArray(data) ? data : (data?.events || []));
        } catch (err) {
            console.error("Failed to fetch events", err);
            setEvents([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchDesigns = async () => {
        try {
            const { data } = await api.get("/api/designs");
            setDesigns(data);
        } catch (err) { console.error(err); }
    };

    const handleDesignToggle = (id) => {
        setSelectedDesigns(prev => prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]);
    };

    const handlePriceChange = (id, value) => {
        if (value === "") {
            setPriceOverrides(prev => {
                const next = { ...prev };
                delete next[id];
                return next;
            });
        } else {
            setPriceOverrides(prev => ({ ...prev, [id]: Number(value) }));
        }
    };

    // NEW: Filter designs based on search query
    const filteredDesigns = designs.filter(d =>
        d.name.toLowerCase().includes(designSearch.toLowerCase()) ||
        (d.categoryName && d.categoryName.toLowerCase().includes(designSearch.toLowerCase()))
    );

    // NEW: Select all currently filtered designs
    const selectAllFiltered = () => {
        const filteredIds = filteredDesigns.map(d => d.id);
        // Combine existing selected designs with the newly filtered ones
        setSelectedDesigns(prev => {
            const combined = new Set([...prev, ...filteredIds]);
            return Array.from(combined);
        });
    };

    const submitEvent = async (e) => {
        e.preventDefault();
        try {
            await api.post("/api/events", {
                name,
                startDate,
                endDate,
                designIds: selectAll ? ["all"] : selectedDesigns,
                priceOverrides
            });
            setShowForm(false);
            fetchEvents();
            setName(""); setStartDate(""); setEndDate(""); setSelectedDesigns([]); setSelectAll(false); setPriceOverrides({}); setDesignSearch("");
        } catch (err) {
            alert(err.response?.data?.message || "Failed to create event");
        }
    };

    const deleteEvent = async (id) => {
        if (!confirm("Are you sure you want to delete this event?")) return;
        try {
            await api.delete(`/api/events/${id}`);
            fetchEvents();
        } catch (err) { alert("Failed to delete event"); }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="serif text-2xl font-semibold">Event Manager</h2>
                <button onClick={() => setShowForm(!showForm)} className="bg-[#24170f] text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 hover:bg-[#382419] transition">
                    <Plus size={16} /> {showForm ? "Cancel" : "Create Event"}
                </button>
            </div>

            {showForm && (
                <form onSubmit={submitEvent} className="bg-white p-6 rounded-2xl border border-[#eadfce] space-y-4 shadow-sm">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className="grid gap-1.5 text-sm font-semibold">
                            Event Name
                            <input required value={name} onChange={e => setName(e.target.value)} className="rounded-xl border border-[#ddcdb8] p-3 font-normal outline-none focus:ring-2 focus:ring-[#b07a4f]" placeholder="e.g. Diwali Special 2026" />
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <label className="grid gap-1.5 text-sm font-semibold">
                                Start Date & Time
                                <input required type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)} className="rounded-xl border border-[#ddcdb8] p-3 font-normal text-xs outline-none focus:ring-2 focus:ring-[#b07a4f]" />
                            </label>
                            <label className="grid gap-1.5 text-sm font-semibold">
                                End Date & Time
                                <input required type="datetime-local" value={endDate} onChange={e => setEndDate(e.target.value)} className="rounded-xl border border-[#ddcdb8] p-3 font-normal text-xs outline-none focus:ring-2 focus:ring-[#b07a4f]" />
                            </label>
                        </div>
                    </div>

                    <div className="border-t border-[#eadfce] pt-4">
                        <div className="flex flex-col gap-3 mb-3 sm:flex-row sm:items-center sm:justify-between">
                            <h3 className="font-semibold text-sm">Select Designs & Set Event Prices</h3>

                            <div className="flex items-center gap-2">
                                {/* NEW: Select Filtered Button */}
                                {designSearch && (
                                    <button
                                        type="button"
                                        onClick={selectAllFiltered}
                                        className="text-[10px] font-semibold text-[#7d3f24] bg-[#f4eadc] px-3 py-1.5 rounded-full hover:bg-[#eaddc8] transition"
                                    >
                                        Select Filtered ({filteredDesigns.length})
                                    </button>
                                )}
                                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer bg-[#f4eadc] px-3 py-1.5 rounded-full">
                                    <input type="checkbox" checked={selectAll} onChange={e => setSelectAll(e.target.checked)} className="accent-[#7d3f24]" />
                                    Select All Designs
                                </label>
                            </div>
                        </div>

                        {!selectAll && (
                            <>
                                {/* NEW: Search Input */}
                                <div className="relative mb-3">
                                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a6d53]" />
                                    <input
                                        type="text"
                                        placeholder="Search designs by name or category..."
                                        value={designSearch}
                                        onChange={(e) => setDesignSearch(e.target.value)}
                                        className="w-full rounded-xl border border-[#ddcdb8] bg-white pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#b07a4f]"
                                    />
                                </div>

                                <div className="max-h-60 overflow-y-auto border border-[#eadfce] rounded-xl p-3 space-y-2 bg-[#fbf8f2]">
                                    {filteredDesigns.length === 0 ? (
                                        <div className="text-center py-6 text-xs text-[#8a6d53]">
                                            No designs found matching "{designSearch}"
                                        </div>
                                    ) : (
                                        filteredDesigns.map(d => (
                                            <div key={d.id} className="flex flex-col gap-2 bg-white p-3 rounded-lg border border-[#f0e6d8] transition">

                                                {/* Top Row: Checkbox, Name, Image Preview Button */}
                                                <div className="flex items-center justify-between">
                                                    <label className="flex items-center gap-3 text-xs font-semibold truncate max-w-[250px] cursor-pointer">
                                                        <input type="checkbox" checked={selectedDesigns.includes(d.id)} onChange={() => handleDesignToggle(d.id)} className="accent-[#7d3f24]" />
                                                        <span className="truncate">{d.name}</span>
                                                    </label>

                                                    {/* Image Preview Button */}
                                                    <button
                                                        type="button"
                                                        onClick={() => setPreviewDesign(d)}
                                                        className="text-[#8a6d53] hover:text-[#7d3f24] p-1.5 rounded-full hover:bg-[#f4eadc] transition"
                                                        title="View Design"
                                                    >
                                                        <ImageIcon size={14} />
                                                    </button>
                                                </div>

                                                {/* Bottom Row: Price Input (Only when selected) */}
                                                {selectedDesigns.includes(d.id) && (
                                                    <div className="flex items-center justify-between mt-1 pt-2 border-t border-[#f0e6d8]">
                                                        <span className="text-[10px] text-[#8a6d53] uppercase tracking-wider">
                                                            Event Price: <span className="font-bold text-[#7d3f24]">(Current: {currency(d.price)})</span>
                                                        </span>
                                                        <input
                                                            type="number"
                                                            placeholder={`Leave blank for ${d.price}`}
                                                            value={priceOverrides[d.id] || ""}
                                                            onChange={(e) => handlePriceChange(d.id, e.target.value)}
                                                            className="w-32 border border-[#ddcdb8] rounded-lg p-1.5 text-xs outline-none focus:ring-1 focus:ring-[#b07a4f]"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    <button type="submit" className="w-full bg-[#1d7a3e] text-white py-3.5 rounded-full font-semibold text-sm hover:bg-[#155c2d] transition shadow-md">Save Event to Google Drive</button>
                </form>
            )}

            <div className="grid gap-4">
                {loading ? (
                    <div className="text-center p-8 text-[#8a6d53]"><Loader2 className="mx-auto animate-spin" /></div>
                ) : events.length === 0 ? (
                    <div className="text-center p-8 text-[#8a6d53] border border-dashed rounded-2xl bg-white">No events created yet.</div>
                ) : (
                    events.map(e => (
                        <div key={e.id} className="bg-white p-5 rounded-2xl border border-[#eadfce] flex justify-between items-center shadow-sm hover:shadow-md transition">
                            <div>
                                <div className="font-semibold text-lg text-[#24170f]">{e.name}</div>
                                <div className="text-xs text-[#8a6d53] flex flex-col sm:flex-row gap-1 sm:gap-4 mt-1.5">
                                    <span className="flex items-center gap-1"><Calendar size={12} /> Start: {new Date(e.startDate).toLocaleString()}</span>
                                    <span className="flex items-center gap-1"><Clock size={12} /> End: {new Date(e.endDate).toLocaleString()}</span>
                                </div>
                                <div className="text-[10px] text-[#7d3f24] font-semibold mt-2 bg-[#f4eadc] inline-block px-2 py-1 rounded-full">
                                    {e.designIds.includes("all") ? "All Designs Included" : `${e.designIds.length} Designs Included`}
                                </div>
                                <div className="text-[10px] text-[#1d7a3e] font-semibold mt-2 ml-2 bg-[#e2f0e5] inline-block px-2 py-1 rounded-full">
                                    Token Counter: #{e.tokenCounter || 0}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setQrEvent(e)} className="text-[#7d3f24] p-3 hover:bg-[#f4eadc] rounded-full transition" title="Generate QR Code"><QrCode size={18} /></button>
                                <button onClick={() => deleteEvent(e.id)} className="text-red-500 p-3 hover:bg-red-50 rounded-full transition" title="Delete Event"><Trash2 size={18} /></button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* QR CODE MODAL */}
            {qrEvent && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#20140e]/70 backdrop-blur-sm p-4" onMouseDown={() => setQrEvent(null)}>
                    <div onMouseDown={e => e.stopPropagation()} className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="serif text-xl font-semibold text-[#24170f]">Event QR Code</h3>
                            <button onClick={() => setQrEvent(null)} className="text-[#8a6d53] hover:text-[#24170f]"><X size={20} /></button>
                        </div>
                        <p className="text-xs text-[#8a6d53] mb-4">Scan this QR code at your store to order from <strong>{qrEvent.name}</strong></p>
                        <div className="bg-white p-4 rounded-2xl border border-[#eadfce] inline-block">
                            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`${window.location.origin}/?event=${qrEvent.id}`)}`} alt="Event QR Code" className="w-48 h-48 mx-auto" />
                        </div>
                        <p className="text-[10px] text-[#8a6d53] mt-4 break-all bg-[#faf5ed] p-2 rounded-lg">{window.location.origin}/?event={qrEvent.id}</p>
                    </div>
                </div>
            )}

            {/* DESIGN IMAGE PREVIEW MODAL */}
            {previewDesign && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-[#20140e]/80 backdrop-blur-sm p-4" onMouseDown={() => setPreviewDesign(null)}>
                    <div onMouseDown={e => e.stopPropagation()} className="bg-white rounded-3xl p-4 max-w-lg w-full shadow-2xl relative">
                        <button
                            onClick={() => setPreviewDesign(null)}
                            className="absolute right-4 top-4 z-10 grid h-8 w-8 place-items-center rounded-full bg-black/60 text-white hover:bg-black/80"
                        >
                            <X size={16} />
                        </button>
                        <div className="flex items-center justify-center bg-[#eadcc9] rounded-2xl p-2 min-h-[300px]">
                            <SafeImage
                                src={imageUrl(previewDesign.image)}
                                alt={previewDesign.name}
                                className="w-full h-auto max-h-[60vh] object-contain rounded-xl"
                            />
                        </div>
                        <div className="mt-4 text-center">
                            <div className="font-semibold text-lg text-[#24170f]">{previewDesign.name}</div>
                            <div className="text-sm text-[#8a6d53]">Current Price: {currency(previewDesign.price)}</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ---------- Quick card ---------- */
function QuickCard({ icon, title, body }) {
    return (
        <div className="rounded-2xl border border-[#eadfce] bg-white p-4 sm:rounded-3xl sm:p-5">
            <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#f1cf8a]/40 text-[#7d3f24]">{icon}</div>
                <div className="min-w-0">
                    <div className="text-sm font-semibold sm:text-base">{title}</div>
                    <div className="truncate text-[11px] text-[#8a6d53] sm:text-xs">{body}</div>
                </div>
            </div>
        </div>
    );
}

/* ---------- Order card (Now displays Token) ---------- */
function OrderCard({ order, onAction, onRefresh, onViewImage }) {
    const STATUS = {
        pending: { cls: "bg-[#f4eadc] text-[#8a6d53]", label: "Pending" },
        approved: { cls: "bg-[#e2f0e5] text-[#1d7a3e]", label: "Awaiting payment" },
        "awaiting-verification": { cls: "bg-[#fdf3d6] text-[#8a6d1c]", label: "Verify payment ⏳" },
        rejected: { cls: "bg-[#f8e4df] text-[#8c392d]", label: "Rejected" },
        paid: { cls: "bg-[#e2f0e5] text-[#1d7a3e]", label: "Paid" },
        "in-progress": { cls: "bg-[#fdf3d6] text-[#8a6d1c]", label: "In progress 🎨" },
        completed: { cls: "bg-[#e2f0e5] text-[#1d7a3e]", label: "Completed ✓" },
    }[order.status] || { cls: "bg-[#f4eadc] text-[#8a6d53]", label: order.status };

    const d = order.proposedDate || order.requestedDate;
    const t = order.proposedTime || order.requestedTime;
    const [verifyBusy, setVerifyBusy] = useState(false);
    const [rejectOpen, setRejectOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [err, setErr] = useState("");

    const confirmPayment = async () => {
        if (!confirm(`Confirm you received £${order.total} for this order?`)) return;
        setVerifyBusy(true); setErr("");
        try { await api.post(`/api/orders/${order.id}/confirm-payment`, {}); onRefresh?.(); }
        catch (e) { setErr(e.response?.data?.message || "Failed"); }
        finally { setVerifyBusy(false); }
    };

    const submitReject = async () => {
        setVerifyBusy(true); setErr("");
        try { await api.post(`/api/orders/${order.id}/reject-payment`, { reason: rejectReason }); setRejectOpen(false); onRefresh?.(); }
        catch (e) { setErr(e.response?.data?.message || "Failed"); }
        finally { setVerifyBusy(false); }
    };

    const startWork = async () => {
        setVerifyBusy(true); setErr("");
        try { await api.post(`/api/orders/${order.id}/start-work`); onRefresh?.(); }
        catch (e) { setErr(e.response?.data?.message || "Failed"); }
        finally { setVerifyBusy(false); }
    };

    const endWork = async () => {
        setVerifyBusy(true); setErr("");
        try { await api.post(`/api/orders/${order.id}/end-work`); onRefresh?.(); }
        catch (e) { setErr(e.response?.data?.message || "Failed"); }
        finally { setVerifyBusy(false); }
    };

    return (
        <div className={`rounded-2xl border-2 bg-white p-4 sm:p-5 ${order.status === "awaiting-verification" ? "border-[#f0b950] shadow-[0_0_0_3px_rgba(240,185,80,0.15)]" : "border-[#eadfce]"}`}>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-3">
                <div className="min-w-0">
                    <div className="truncate text-[10px] uppercase tracking-[.16em] text-[#8a6d53] sm:tracking-[.18em]">Order #{order.id.slice(0, 8)} · {order.username}</div>

                    {/* EVENT TOKEN DISPLAY */}
                    {order.tokenNumber && (
                        <div className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-[#f1cf8a]/30 border border-[#f1cf8a]/50 px-3 py-1 text-[11px] font-bold text-[#7d3f24]">
                            🎟️ Event Token: #{order.tokenNumber}
                        </div>
                    )}

                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm">
                        <span className="inline-flex items-center gap-1.5"><Calendar size={13} className="text-[#7d3f24]" /> {d}</span>
                        <span className="inline-flex items-center gap-1.5"><Clock size={13} className="text-[#7d3f24]" /> {t}</span>
                        {order.proposedDate && order.proposedDate !== order.requestedDate && <span className="rounded-full bg-[#f4eadc] px-2 py-0.5 text-[10px]">rescheduled</span>}
                    </div>
                    <div className="mt-1 truncate text-[11px] text-[#8a6d53] sm:text-xs">{order.email}</div>
                </div>
                <span className={`self-start whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-bold sm:text-xs ${STATUS.cls}`}>{STATUS.label}</span>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
                {order.items.map((it, idx) => (
                    <button key={idx} type="button" onClick={() => onViewImage?.(imageUrl(it.image), it.name)} className="h-16 w-14 cursor-zoom-in overflow-hidden rounded-xl border border-[#eadfce] bg-[#eadcc9] transition hover:ring-2 hover:ring-[#7d3f24] sm:h-20 sm:w-16" title={`View ${it.name}`}>
                        <SafeImage src={imageUrl(it.image, "thumb")} alt={it.name} className="h-full w-full object-cover" />
                    </button>
                ))}
            </div>

            <div className="mt-3 grid gap-1 border-t border-[#f0e6d8] pt-3 text-xs sm:text-sm">
                {order.items.map((it, i) => (
                    <div key={i} className="flex justify-between gap-3 text-[#715e4e]"><span className="min-w-0 truncate">{it.qty}× {it.name}</span><span className="shrink-0">{currency(it.price * it.qty)}</span></div>
                ))}
                <div className="mt-1 flex justify-between gap-3 font-semibold"><span>Total</span><span>{currency(order.total)}</span></div>
            </div>

            {order.notes && <div className="mt-3 rounded-xl bg-[#faf5ed] px-3 py-2 text-xs text-[#5b4636]"><strong>User note:</strong> {order.notes}</div>}
            {order.status === "awaiting-verification" && (
                <div className="mt-3 rounded-xl bg-[#fdf3d6] px-3 py-2 text-xs text-[#8a6d1c]">
                    <div className="flex items-center gap-2 font-semibold"><ShieldAlert size={13} /> User claims they paid</div>
                    <div className="mt-1 break-all">UTR / Transaction ID: <span className="font-mono font-bold">{order.utr}</span></div>
                    <div className="mt-1 text-[10px] text-[#8a6d1c]">Check your UPI app / bank statement and match this UTR before confirming.</div>
                </div>
            )}

            {order.status === "paid" && <div className="mt-4"><button onClick={startWork} disabled={verifyBusy} className="flex w-full items-center justify-center gap-2 rounded-full bg-[#7d3f24] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60 sm:w-auto"><Play size={14} /> Start Mehndi session</button></div>}

            {order.status === "in-progress" && (
                <div className="mt-4 space-y-3">
                    <div className="flex items-center gap-2 rounded-xl bg-[#fdf3d6] px-3 py-2 text-xs text-[#8a6d1c]"><Clock size={13} /> Session started at {new Date(order.startedAt).toLocaleTimeString()}</div>
                    <button onClick={endWork} disabled={verifyBusy} className="flex w-full items-center justify-center gap-2 rounded-full bg-[#1d7a3e] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60 sm:w-auto"><Square size={14} /> End session</button>
                </div>
            )}

            {order.status === "completed" && <div className="mt-4 flex items-center gap-2 rounded-full bg-[#e2f0e5] px-4 py-2 text-xs font-semibold text-[#1d7a3e]"><CheckCircle2 size={14} /> Completed in {order.durationSeconds >= 60 ? `${Math.round(order.durationSeconds / 60)} min` : `${order.durationSeconds}s`}</div>}

            {order.status === "pending" && (
                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    <button onClick={() => onAction({ order, mode: "approve" })} className="flex w-full items-center justify-center gap-2 rounded-full bg-[#1d7a3e] px-4 py-2 text-sm font-semibold text-white sm:w-auto"><CheckCircle2 size={14} /> Approve</button>
                    <button onClick={() => onAction({ order, mode: "reject" })} className="flex w-full items-center justify-center gap-2 rounded-full border border-[#e6c4be] bg-white px-4 py-2 text-sm font-semibold text-[#9b3b2b] sm:w-auto"><XCircle size={14} /> Reject</button>
                    <button onClick={() => onAction({ order, mode: "reschedule" })} className="flex w-full items-center justify-center gap-2 rounded-full border border-[#ded0bc] bg-white px-4 py-2 text-sm font-semibold sm:w-auto"><Clock size={14} /> Change date/time</button>
                </div>
            )}

            {order.status === "awaiting-verification" && (
                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    <button onClick={confirmPayment} disabled={verifyBusy} className="flex w-full items-center justify-center gap-2 rounded-full bg-[#1d7a3e] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60 sm:w-auto"><CheckCircle2 size={14} /> Payment received</button>
                    <button onClick={() => setRejectOpen(true)} disabled={verifyBusy} className="flex w-full items-center justify-center gap-2 rounded-full border border-[#e6c4be] bg-white px-5 py-2.5 text-sm font-semibold text-[#9b3b2b] sm:w-auto"><XCircle size={14} /> Not received</button>
                </div>
            )}

            {order.adminNote && <div className="mt-3 rounded-xl bg-[#f5ecdf] px-3 py-2 text-xs text-[#5b4636]"><strong>Your note:</strong> {order.adminNote}</div>}
            {err && <div className="mt-3 rounded-xl bg-[#f8e4df] px-3 py-2 text-xs text-[#8c392d]">{err}</div>}

            {rejectOpen && (
                <div className="fixed inset-0 z-[95] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={() => setRejectOpen(false)}>
                    <div onMouseDown={e => e.stopPropagation()} className="w-full max-w-md rounded-t-[26px] bg-white p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-3xl sm:p-6">
                        <h3 className="serif text-xl font-semibold">Payment not received?</h3>
                        <p className="mt-1 text-xs text-[#8a6d53]">Explain why. The user will be asked to try again.</p>
                        <textarea rows="3" value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="e.g. UTR not found in bank statement" className="mt-4 w-full rounded-xl border border-[#ddcdb8] bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#b07a4f]" />
                        <div className="mt-4 flex gap-2">
                            <button onClick={() => setRejectOpen(false)} className="flex-1 rounded-full border border-[#ded0bc] bg-white px-4 py-3 text-sm font-semibold">Cancel</button>
                            <button onClick={submitReject} disabled={verifyBusy} className="flex-1 rounded-full bg-[#9b3b2b] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">{verifyBusy ? "Sending…" : "Notify user"}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ---------- Image lightbox ---------- */
function ImageLightbox({ src, alt, onClose }) {
    return (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-black/85 p-3 backdrop-blur-sm sm:p-4" onMouseDown={onClose}>
            <div onMouseDown={e => e.stopPropagation()} className="relative max-h-[92dvh] w-full max-w-5xl overflow-hidden rounded-2xl bg-[#24170f] shadow-2xl sm:rounded-3xl">
                <button onClick={onClose} className="absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full bg-black/60 text-white hover:bg-black/80 sm:right-4 sm:top-4" title="Close" aria-label="Close"><X size={20} /></button>
                <SafeImage src={src} alt={alt} eager fallbackClassName="h-64 w-full" className="max-h-[80dvh] w-full object-contain sm:max-h-[88vh] sm:w-auto" />
                <div className="bg-[#24170f] px-4 py-3 text-center text-xs font-semibold text-[#f1cf8a] sm:text-sm">{alt}</div>
            </div>
        </div>
    );
}

/* ---------- Order action modal ---------- */
function OrderActionModal({ order, mode, onClose, onDone }) {
    const [adminNote, setAdminNote] = useState("");
    const [proposedDate, setProposedDate] = useState(order.requestedDate);
    const [proposedTime, setProposedTime] = useState(order.requestedTime);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    const submit = async (e) => {
        e.preventDefault(); setBusy(true); setError("");
        try {
            const status = mode === "reject" ? "rejected" : "approved";
            const body = { status, adminNote };
            if (mode === "reschedule") { body.proposedDate = proposedDate; body.proposedTime = proposedTime; }
            await api.patch(`/api/orders/${order.id}/status`, body);
            onDone?.();
        } catch (err) { setError(err.response?.data?.message || "Could not update"); }
        finally { setBusy(false); }
    };

    const title = mode === "approve" ? "Approve appointment" : mode === "reject" ? "Reject appointment" : "Change date/time";

    return (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-[#20140e]/70 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={onClose}>
            <div onMouseDown={e => e.stopPropagation()} className="max-h-[92dvh] w-full max-w-md overflow-y-auto overscroll-contain rounded-t-[26px] bg-[#fffdf9] p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-[28px] sm:p-6">
                <h2 className="serif text-2xl font-semibold">{title}</h2>
                <p className="mt-1 text-xs text-[#8a6d53]">Order #{order.id.slice(0, 8)} · {order.username}</p>
                <form onSubmit={submit} className="mt-5 grid gap-3">
                    {mode === "reschedule" && (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <label className="grid gap-1.5 text-xs font-semibold text-[#5b4636]">New date<input required type="date" value={proposedDate} onChange={e => setProposedDate(e.target.value)} className="rounded-xl border border-[#ddcdb8] bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#b07a4f]" /></label>
                            <label className="grid gap-1.5 text-xs font-semibold text-[#5b4636]">New time<input required type="time" value={proposedTime} onChange={e => setProposedTime(e.target.value)} className="rounded-xl border border-[#ddcdb8] bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#b07a4f]" /></label>
                        </div>
                    )}
                    <label className="grid gap-1.5 text-xs font-semibold text-[#5b4636]">Note to user (optional)<textarea rows="3" value={adminNote} onChange={e => setAdminNote(e.target.value)} className="rounded-xl border border-[#ddcdb8] bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#b07a4f]" /></label>
                    {error && <div className="rounded-xl bg-[#f8e4df] px-4 py-2.5 text-sm text-[#8c392d]">{error}</div>}
                    <div className="mt-1 flex flex-col gap-2 sm:flex-row">
                        <button type="button" onClick={onClose} className="w-full rounded-full border border-[#ded0bc] bg-white px-4 py-3 text-sm font-semibold sm:flex-1">Cancel</button>
                        <button disabled={busy} type="submit" className="w-full rounded-full bg-[#24170f] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60 sm:flex-1">{busy ? "Saving…" : "Confirm"}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ---------- Add Design modal ---------- */
function AddDesignModal({ onClose, onSaved }) {
    const [form, setForm] = useState({ name: "", description: "", price: "", amountType: "per design", categoryId: "arabic", featured: false });
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    const pickFile = (f) => {
        if (!f) return;
        if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) { setError("Please choose a JPG, PNG or WebP image."); return; }
        if (f.size > 8 * 1024 * 1024) { setError("Image is too large (max 8 MB)."); return; }
        setError("");
        if (preview) URL.revokeObjectURL(preview);
        setImage(f); setPreview(URL.createObjectURL(f));
    };

    const submit = async (e) => {
        e.preventDefault();
        if (!image) return setError("Please choose a design image.");
        setBusy(true); setError("");
        const body = new FormData();
        Object.entries(form).forEach(([k, v]) => body.append(k, v));
        body.append("image", image);
        try { await api.post("/api/designs", body); onSaved(); }
        catch (err) { setError(err.response?.data?.message || "Upload failed"); }
        finally { setBusy(false); }
    };

    return (
        <div className="fixed inset-0 z-[60] overflow-y-auto overscroll-contain bg-[#20140e]/60 backdrop-blur-sm">
            <div className="flex min-h-full items-end justify-center p-0 sm:items-center sm:p-4">
                <div className="w-full max-w-2xl rounded-t-[26px] bg-[#fffdf9] p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl sm:my-8 sm:rounded-[30px] sm:p-9">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <div className="text-[11px] font-bold uppercase tracking-[.2em] text-[#9a7352] sm:text-xs">Catalog manager</div>
                            <h2 className="serif mt-1 text-2xl sm:text-3xl">Add Mehndi design</h2>
                        </div>
                        <button onClick={onClose} aria-label="Close" className="grid h-10 w-10 shrink-0 place-items-center rounded-full hover:bg-[#f1e6d8]"><X size={18} /></button>
                    </div>
                    <form onSubmit={submit} className="mt-6 grid gap-4 sm:mt-7 sm:gap-5">
                        <label className="grid gap-2 text-sm font-semibold">
                            Design image
                            <div className="relative rounded-2xl border-2 border-dashed border-[#d9c7b0] bg-[#faf5ed] p-5 text-center sm:p-6">
                                {preview ? <img src={preview} alt="preview" className="mx-auto max-h-40 rounded-xl object-contain sm:max-h-48" /> : <><Upload className="mx-auto text-[#946b49]" /><div className="mt-2 text-xs text-[#8a6d53] sm:text-sm">Choose JPG, PNG or WebP</div></>}
                                <input required type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => pickFile(e.target.files?.[0])} className="absolute inset-0 cursor-pointer opacity-0" />
                            </div>
                        </label>
                        <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
                            <label className="grid gap-2 text-sm font-semibold">Design name<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-xl border border-[#ddcdb8] bg-white px-4 py-3 font-normal outline-none focus:ring-2 focus:ring-[#b07a4f]" /></label>
                            <label className="grid gap-2 text-sm font-semibold">Category<select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="rounded-xl border border-[#ddcdb8] bg-white px-4 py-3 font-normal">{CATEGORY_OPTIONS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
                        </div>
                        <label className="grid gap-2 text-sm font-semibold">Description<textarea rows="3" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe the motif, coverage, occasion…" className="rounded-xl border border-[#ddcdb8] bg-white px-4 py-3 font-normal outline-none focus:ring-2 focus:ring-[#b07a4f]" /></label>
                        <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
                            <label className="grid gap-2 text-sm font-semibold">Price<input required type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="1500" className="rounded-xl border border-[#ddcdb8] bg-white px-4 py-3 font-normal outline-none focus:ring-2 focus:ring-[#b07a4f]" /></label>
                            <label className="grid gap-2 text-sm font-semibold">Amount type<select value={form.amountType} onChange={(e) => setForm({ ...form, amountType: e.target.value })} className="rounded-xl border border-[#ddcdb8] bg-white px-4 py-3 font-normal"><option>per design</option><option>per hand</option><option>per pair</option><option>per hour</option><option>package</option></select></label>
                        </div>
                        <label className="flex items-center gap-3 rounded-xl bg-[#f5ecdf] p-4 text-sm"><input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} />Mark this design as featured</label>
                        {error && <div className="rounded-xl bg-[#f8e4df] px-4 py-3 text-sm text-[#8c392d]">{error}</div>}
                        <button disabled={busy} className="flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-[#24170f] px-6 py-4 text-sm font-semibold text-white disabled:opacity-50">{busy ? <><Loader2 size={15} className="animate-spin" /> Uploading to Drive…</> : "Save design to Drive"}</button>
                    </form>
                </div>
            </div>
        </div>
    );
}