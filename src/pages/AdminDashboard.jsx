import { useEffect, useState } from "react";
import {
    LogOut, Image as ImageIcon, Users, Bell, Plus, X, Upload, Loader2, Trash2,
    Calendar, Clock, CheckCircle2, XCircle, ShieldAlert, Play, Square, BarChart3, LayoutGrid,
} from "lucide-react";
import { io } from "socket.io-client";
import GoogleDriveCard from "./GoogleDriveCard";
import { api, API_BASE } from "../lib/api";
import { playNotificationSound, primeAudioOnFirstGesture } from "../lib/notify";
import AdminSettingsCard from "./AdminSettingsCard";
import ReportsPanel from "./ReportsPanel";

function imageUrl(src) {
    if (!src) return "";
    if (src.startsWith("http://") || src.startsWith("https://")) return src;
    return `${API_BASE}${src}`;
}

function currency(value) {
    return new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency: "GBP",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value || 0);
}

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
    const [designs, setDesigns] = useState([]);
    const [lightbox, setLightbox] = useState(null);

    /* orders */
    const [orders, setOrders] = useState([]);
    const [ordersLoading, setOrdersLoading] = useState(true);
    const [actionOrder, setActionOrder] = useState(null);

    /* prime audio on first user gesture */
    useEffect(() => { primeAudioOnFirstGesture(); }, []);

    /* URL feedback from Google redirect */
    useEffect(() => {
        const p = new URLSearchParams(window.location.search).get("google");
        if (p === "connected") showToast("ok", "Google Drive connected ✓");
        if (p === "error") showToast("err", "Google Drive connection failed");
        if (p) window.history.replaceState({}, "", "/admin");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /* Socket.IO — join admin room + react to live events */
    useEffect(() => {
        const token = localStorage.getItem("mehndi-token");
        const socket = io(API_BASE, { auth: { token } });

        socket.on("notification", (n) => {
            playNotificationSound("info");

            if (
                n.type === "new-order" ||
                n.type === "order-paid" ||
                n.type === "payment-claim"
            ) {
                showToast("info", n.title);
                loadOrders();
            } else {
                showToast("info", n.title);
            }
        });

        return () => socket.disconnect();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const [tab, setTab] = useState("dashboard");

    const loadDesigns = async () => {
        try {
            const { data } = await api.get("/api/designs");
            setDesigns(data);
        } catch { /* ignore */ }
    };

    const loadOrders = async () => {
        setOrdersLoading(true);
        try {
            const { data } = await api.get("/api/orders");
            setOrders(data);
        } catch { /* ignore */ }
        finally { setOrdersLoading(false); }
    };

    useEffect(() => { loadDesigns(); loadOrders(); }, []);

    const showToast = (kind, text) => {
        setToast({ kind, text });
        setTimeout(() => setToast(null), 3500);
    };

    const removeDesign = async (id) => {
        if (!confirm("Remove this design from Drive?")) return;
        try {
            await api.delete(`/api/designs/${id}`);
            showToast("ok", "Design removed");
            loadDesigns();
        } catch (err) {
            showToast("err", err.response?.data?.message || "Delete failed");
        }
    };

    const pendingCount = orders.filter(o => o.status === "pending").length;
    const verifyCount = orders.filter(o => o.status === "awaiting-verification").length;

    return (
        <div className="min-h-screen bg-[#fbf8f2] text-[#2a1a12]">
            <header className="sticky top-0 z-30 border-b border-[#eadfce] bg-[#fbf8f2]/90 backdrop-blur">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
                    <div className="flex items-center gap-3">
                        <div className="grid h-9 w-9 place-items-center rounded-full bg-[#24170f] text-[#f1cf8a] serif">M</div>
                        <div>
                            <div className="serif font-bold leading-tight">Mehndi Studio</div>
                            <div className="text-[10px] uppercase tracking-[.22em] text-[#8a6d53]">
                                SuperAdmin · {user.username}
                            </div>
                        </div>
                    </div>
                    <button onClick={onLogout}
                        className="inline-flex items-center gap-2 rounded-full border border-[#ded0bc] bg-white px-4 py-2 text-sm font-semibold hover:bg-[#f4eadc]">
                        <LogOut size={15} /> Sign out
                    </button>
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
                <div className="flex items-end justify-between gap-4">
                    <div>
                        <h1 className="serif text-4xl font-semibold">Dashboard</h1>
                        <p className="mt-2 text-sm text-[#715e4e]">
                            Manage Google Drive storage, designs, users and appointments.
                        </p>
                    </div>

                    {/* Tab switcher */}
                    <div className="inline-flex rounded-full border border-[#ded0bc] bg-white p-1">
                        <button
                            onClick={() => setTab("dashboard")}
                            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${tab === "dashboard"
                                ? "bg-[#24170f] text-white"
                                : "text-[#5b4636] hover:bg-[#f4eadc]"
                                }`}
                        >
                            <LayoutGrid size={14} /> Dashboard
                        </button>
                        <button
                            onClick={() => setTab("reports")}
                            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${tab === "reports"
                                ? "bg-[#24170f] text-white"
                                : "text-[#5b4636] hover:bg-[#f4eadc]"
                                }`}
                        >
                            <BarChart3 size={14} /> Reports
                        </button>
                    </div>
                </div>

                {tab === "reports" ? (
                    <div className="mt-8">
                        <ReportsPanel />
                    </div>
                ) : (
                    <>
                        {/* ---------- Drive + Quick cards ---------- */}
                        <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
                            <GoogleDriveCard />
                            <div className="grid gap-4">
                                <button onClick={() => setAddOpen(true)} className="rounded-3xl border border-[#eadfce] bg-white p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md">
                                    <div className="flex items-center gap-3">
                                        <div className="grid h-9 w-9 place-items-center rounded-full bg-[#f1cf8a]/40 text-[#7d3f24]">
                                            <ImageIcon size={18} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-semibold">Designs</div>
                                            <div className="text-xs text-[#8a6d53]">Add & manage Mehndi designs</div>
                                        </div>
                                        <Plus size={16} className="text-[#7d3f24]" />
                                    </div>
                                </button>
                                <QuickCard icon={<Users size={18} />} title="Users" body="Create ADMIN & USER accounts" />
                                <QuickCard
                                    icon={<Bell size={18} />}
                                    title="Appointments"
                                    body={
                                        verifyCount > 0
                                            ? `${verifyCount} payment${verifyCount > 1 ? "s" : ""} to verify`
                                            : pendingCount > 0
                                                ? `${pendingCount} pending request${pendingCount > 1 ? "s" : ""}`
                                                : "No pending requests"
                                    }
                                />
                            </div>
                        </div>

                        <div className="mt-6">
                            <AdminSettingsCard />
                        </div>

                        {/* ---------- Appointments ---------- */}
                        <section className="mt-12">
                            <div className="mb-5 flex items-end justify-between">
                                <div>
                                    <h2 className="serif text-2xl font-semibold">Appointment requests</h2>
                                    <p className="text-sm text-[#8a6d53]">
                                        {pendingCount} pending · {verifyCount} to verify · {orders.length} total
                                    </p>
                                </div>
                                <button onClick={loadOrders} className="rounded-full border border-[#ded0bc] bg-white px-4 py-2.5 text-sm font-semibold hover:bg-[#f4eadc]">
                                    Refresh
                                </button>
                            </div>

                            {ordersLoading ? (
                                <div className="rounded-2xl border border-[#eadfce] bg-white p-12 text-center text-[#8a6d53]">
                                    <Loader2 className="mx-auto animate-spin" />
                                </div>
                            ) : orders.length === 0 ? (
                                <div className="rounded-3xl border border-dashed border-[#d9c7b0] bg-white p-12 text-center text-[#8a6d53]">
                                    No appointment requests yet.
                                </div>
                            ) : (
                                <div className="grid gap-4">
                                    {orders.map(o => (
                                        <OrderCard
                                            key={o.id}
                                            order={o}
                                            onAction={setActionOrder}
                                            onRefresh={loadOrders}
                                            onViewImage={(src, alt) => setLightbox({ src, alt })}
                                        />
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* ---------- Designs ---------- */}
                        <section className="mt-12">
                            <div className="mb-5 flex items-end justify-between">
                                <div>
                                    <h2 className="serif text-2xl font-semibold">Your designs</h2>
                                    <p className="text-sm text-[#8a6d53]">
                                        {designs.length} {designs.length === 1 ? "design" : "designs"} stored in Drive
                                    </p>
                                </div>
                                <button onClick={() => setAddOpen(true)} className="inline-flex items-center gap-2 rounded-full bg-[#24170f] px-5 py-2.5 text-sm font-semibold text-white">
                                    <Plus size={15} /> Add design
                                </button>
                            </div>

                            {designs.length === 0 ? (
                                <div className="rounded-3xl border border-dashed border-[#d9c7b0] bg-white p-12 text-center text-[#8a6d53]">
                                    No designs yet — click <strong>Add design</strong> to upload your first one to Drive.
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                                    {designs.map((d) => (
                                        <div key={d.id} className="group relative overflow-hidden rounded-2xl border border-[#eadfce] bg-white">
                                            <div className="aspect-[4/5] cursor-zoom-in bg-[#eadcc9]"
                                                onClick={() => setLightbox({ src: imageUrl(d.image), alt: d.name })}>
                                                <img src={imageUrl(d.image)} alt={d.name} className="h-full w-full object-cover" />
                                            </div>
                                            <div className="p-3">
                                                <div className="text-[10px] uppercase tracking-[.16em] text-[#9a7352]">{d.categoryName}</div>
                                                <div className="truncate font-semibold text-sm">{d.name}</div>
                                            </div>
                                            <button onClick={() => removeDesign(d.id)}
                                                className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-[#7d3f24] opacity-0 transition group-hover:opacity-100">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </>
                )}
            </main>

            {addOpen && (
                <AddDesignModal
                    onClose={() => setAddOpen(false)}
                    onSaved={() => { setAddOpen(false); loadDesigns(); showToast("ok", "Design uploaded to Drive ✓"); }}
                />
            )}

            {actionOrder && (
                <OrderActionModal
                    order={actionOrder.order}
                    mode={actionOrder.mode}
                    onClose={() => setActionOrder(null)}
                    onDone={() => { setActionOrder(null); loadOrders(); showToast("ok", "Order updated"); }}
                />
            )}

            {lightbox && (
                <ImageLightbox
                    src={lightbox.src}
                    alt={lightbox.alt}
                    onClose={() => setLightbox(null)}
                />
            )}

            {toast && (
                <div className={`fixed bottom-6 right-6 z-50 rounded-2xl px-5 py-3 text-sm font-semibold shadow-xl ${toast.kind === "err" ? "bg-[#7d3f24] text-white"
                    : toast.kind === "ok" ? "bg-[#1d7a3e] text-white"
                        : "bg-[#24170f] text-[#f1cf8a]"
                    }`}>{toast.text}</div>
            )}
        </div>
    );
}

/* ---------- Quick card ---------- */

function QuickCard({ icon, title, body }) {
    return (
        <div className="rounded-3xl border border-[#eadfce] bg-white p-5">
            <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-[#f1cf8a]/40 text-[#7d3f24]">{icon}</div>
                <div>
                    <div className="font-semibold">{title}</div>
                    <div className="text-xs text-[#8a6d53]">{body}</div>
                </div>
            </div>
        </div>
    );
}

/* ---------- Order card ---------- */

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
        try {
            await api.post(`/api/orders/${order.id}/confirm-payment`, {});
            onRefresh?.();
        } catch (e) {
            setErr(e.response?.data?.message || "Failed");
        } finally { setVerifyBusy(false); }
    };

    const submitReject = async () => {
        setVerifyBusy(true); setErr("");
        try {
            await api.post(`/api/orders/${order.id}/reject-payment`, { reason: rejectReason });
            setRejectOpen(false);
            onRefresh?.();
        } catch (e) {
            setErr(e.response?.data?.message || "Failed");
        } finally { setVerifyBusy(false); }
    };

    const startWork = async () => {
        setVerifyBusy(true); setErr("");
        try {
            await api.post(`/api/orders/${order.id}/start-work`);
            onRefresh?.();
        } catch (e) {
            setErr(e.response?.data?.message || "Failed");
        } finally { setVerifyBusy(false); }
    };

    const endWork = async () => {
        setVerifyBusy(true); setErr("");
        try {
            await api.post(`/api/orders/${order.id}/end-work`);
            onRefresh?.();
        } catch (e) {
            setErr(e.response?.data?.message || "Failed");
        } finally { setVerifyBusy(false); }
    };

    return (
        <div className={`rounded-2xl border-2 bg-white p-5 ${order.status === "awaiting-verification"
            ? "border-[#f0b950] shadow-[0_0_0_3px_rgba(240,185,80,0.15)]"
            : "border-[#eadfce]"
            }`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <div className="text-[10px] uppercase tracking-[.18em] text-[#8a6d53]">
                        Order #{order.id.slice(0, 8)} · {order.username}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-sm">
                        <Calendar size={14} className="text-[#7d3f24]" /> {d}
                        <Clock size={14} className="ml-2 text-[#7d3f24]" /> {t}
                        {order.proposedDate && order.proposedDate !== order.requestedDate && (
                            <span className="ml-2 rounded-full bg-[#f4eadc] px-2 py-0.5 text-[10px]">rescheduled</span>
                        )}
                    </div>
                    <div className="mt-1 text-xs text-[#8a6d53]">{order.email}</div>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS.cls}`}>{STATUS.label}</span>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
                {order.items.map((it, idx) => (
                    <button key={idx} type="button"
                        onClick={() => onViewImage?.(imageUrl(it.image), it.name)}
                        className="h-20 w-16 cursor-zoom-in overflow-hidden rounded-xl border border-[#eadfce] bg-[#eadcc9] transition hover:ring-2 hover:ring-[#7d3f24]"
                        title={`View ${it.name}`}>
                        <img src={imageUrl(it.image)} alt={it.name} className="h-full w-full object-cover" />
                    </button>
                ))}
            </div>

            <div className="mt-3 grid gap-1 border-t border-[#f0e6d8] pt-3 text-sm">
                {order.items.map((it, i) => (
                    <div key={i} className="flex justify-between text-[#715e4e]">
                        <span>{it.qty}× {it.name}</span>
                        <span>{currency(it.price * it.qty)}</span>
                    </div>
                ))}
                <div className="mt-1 flex justify-between font-semibold">
                    <span>Total</span><span>{currency(order.total)}</span>
                </div>
            </div>

            {order.notes && (
                <div className="mt-3 rounded-xl bg-[#faf5ed] px-3 py-2 text-xs text-[#5b4636]">
                    <strong>User note:</strong> {order.notes}
                </div>
            )}

            {order.status === "awaiting-verification" && (
                <div className="mt-3 rounded-xl bg-[#fdf3d6] px-3 py-2 text-xs text-[#8a6d1c]">
                    <div className="flex items-center gap-2 font-semibold">
                        <ShieldAlert size={13} /> User claims they paid
                    </div>
                    <div className="mt-1">
                        UTR / Transaction ID:{" "}
                        <span className="font-mono font-bold">{order.utr}</span>
                    </div>
                    <div className="mt-1 text-[10px] text-[#8a6d1c]">
                        Check your UPI app / bank statement and match this UTR before confirming.
                    </div>
                </div>
            )}

            {order.status === "paid" && (
                <div className="mt-4">
                    <button onClick={startWork} disabled={verifyBusy}
                        className="flex items-center gap-2 rounded-full bg-[#7d3f24] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
                        <Play size={14} /> Start Mehndi session
                    </button>
                </div>
            )}

            {order.status === "in-progress" && (
                <div className="mt-4 space-y-3">
                    <div className="flex items-center gap-2 rounded-xl bg-[#fdf3d6] px-3 py-2 text-xs text-[#8a6d1c]">
                        <Clock size={13} /> Session started at{" "}
                        {new Date(order.startedAt).toLocaleTimeString()}
                    </div>
                    <button onClick={endWork} disabled={verifyBusy}
                        className="flex items-center gap-2 rounded-full bg-[#1d7a3e] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
                        <Square size={14} /> End session
                    </button>
                </div>
            )}

            {order.status === "completed" && (
                <div className="mt-4 flex items-center gap-2 rounded-full bg-[#e2f0e5] px-4 py-2 text-xs font-semibold text-[#1d7a3e]">
                    <CheckCircle2 size={14} /> Completed in{" "}
                    {order.durationSeconds >= 60
                        ? `${Math.round(order.durationSeconds / 60)} min`
                        : `${order.durationSeconds}s`}
                </div>
            )}
            {order.status === "pending" && (
                <div className="mt-4 flex flex-wrap gap-2">
                    <button onClick={() => onAction({ order, mode: "approve" })}
                        className="flex items-center gap-2 rounded-full bg-[#1d7a3e] px-4 py-2 text-sm font-semibold text-white">
                        <CheckCircle2 size={14} /> Approve
                    </button>
                    <button onClick={() => onAction({ order, mode: "reject" })}
                        className="flex items-center gap-2 rounded-full border border-[#e6c4be] bg-white px-4 py-2 text-sm font-semibold text-[#9b3b2b]">
                        <XCircle size={14} /> Reject
                    </button>
                    <button onClick={() => onAction({ order, mode: "reschedule" })}
                        className="flex items-center gap-2 rounded-full border border-[#ded0bc] bg-white px-4 py-2 text-sm font-semibold">
                        <Clock size={14} /> Change date/time
                    </button>
                </div>
            )}

            {order.status === "awaiting-verification" && (
                <div className="mt-4 flex flex-wrap gap-2">
                    <button onClick={confirmPayment} disabled={verifyBusy}
                        className="flex items-center gap-2 rounded-full bg-[#1d7a3e] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
                        <CheckCircle2 size={14} /> Payment received
                    </button>
                    <button onClick={() => setRejectOpen(true)} disabled={verifyBusy}
                        className="flex items-center gap-2 rounded-full border border-[#e6c4be] bg-white px-5 py-2.5 text-sm font-semibold text-[#9b3b2b]">
                        <XCircle size={14} /> Not received
                    </button>
                </div>
            )}

            {order.adminNote && (
                <div className="mt-3 rounded-xl bg-[#f5ecdf] px-3 py-2 text-xs text-[#5b4636]">
                    <strong>Your note:</strong> {order.adminNote}
                </div>
            )}

            {err && (
                <div className="mt-3 rounded-xl bg-[#f8e4df] px-3 py-2 text-xs text-[#8c392d]">{err}</div>
            )}

            {rejectOpen && (
                <div className="fixed inset-0 z-[95] grid place-items-center bg-black/60 p-4" onMouseDown={() => setRejectOpen(false)}>
                    <div onMouseDown={e => e.stopPropagation()} className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
                        <h3 className="serif text-xl font-semibold">Payment not received?</h3>
                        <p className="mt-1 text-xs text-[#8a6d53]">
                            Explain why. The user will be asked to try again.
                        </p>
                        <textarea rows="3" value={rejectReason}
                            onChange={e => setRejectReason(e.target.value)}
                            placeholder="e.g. UTR not found in bank statement"
                            className="mt-4 w-full rounded-xl border border-[#ddcdb8] bg-white px-4 py-3 text-sm outline-none" />
                        <div className="mt-4 flex gap-2">
                            <button onClick={() => setRejectOpen(false)}
                                className="flex-1 rounded-full border border-[#ded0bc] bg-white px-4 py-3 text-sm font-semibold">
                                Cancel
                            </button>
                            <button onClick={submitReject} disabled={verifyBusy}
                                className="flex-1 rounded-full bg-[#9b3b2b] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
                                {verifyBusy ? "Sending…" : "Notify user"}
                            </button>
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
        <div
            className="fixed inset-0 z-[90] grid place-items-center bg-black/85 p-4 backdrop-blur-sm"
            onMouseDown={onClose}
        >
            <div
                onMouseDown={e => e.stopPropagation()}
                className="relative max-h-[92vh] max-w-5xl overflow-hidden rounded-3xl bg-[#24170f] shadow-2xl"
            >
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full bg-black/60 text-white hover:bg-black/80"
                    title="Close"
                >
                    <X size={20} />
                </button>
                <img
                    src={src}
                    alt={alt}
                    className="max-h-[88vh] w-auto object-contain"
                />
                <div className="bg-[#24170f] px-6 py-3 text-center text-sm font-semibold text-[#f1cf8a]">
                    {alt}
                </div>
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
        e.preventDefault();
        setBusy(true); setError("");
        try {
            const status = mode === "reject" ? "rejected" : "approved";
            const body = { status, adminNote };
            if (mode === "reschedule") {
                body.proposedDate = proposedDate;
                body.proposedTime = proposedTime;
            }
            await api.patch(`/api/orders/${order.id}/status`, body);
            onDone?.();
        } catch (err) {
            setError(err.response?.data?.message || "Could not update");
        } finally {
            setBusy(false);
        }
    };

    const title = mode === "approve" ? "Approve appointment"
        : mode === "reject" ? "Reject appointment"
            : "Change date/time";

    return (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-[#20140e]/70 p-4 backdrop-blur-sm" onMouseDown={onClose}>
            <div onMouseDown={e => e.stopPropagation()} className="w-full max-w-md rounded-[28px] bg-[#fffdf9] p-6 shadow-2xl">
                <h2 className="serif text-2xl font-semibold">{title}</h2>
                <p className="mt-1 text-xs text-[#8a6d53]">Order #{order.id.slice(0, 8)} · {order.username}</p>

                <form onSubmit={submit} className="mt-5 grid gap-3">
                    {mode === "reschedule" && (
                        <div className="grid grid-cols-2 gap-3">
                            <label className="grid gap-1.5 text-xs font-semibold text-[#5b4636]">
                                New date
                                <input required type="date" value={proposedDate}
                                    onChange={e => setProposedDate(e.target.value)}
                                    className="rounded-xl border border-[#ddcdb8] bg-white px-3 py-2.5 text-sm outline-none" />
                            </label>
                            <label className="grid gap-1.5 text-xs font-semibold text-[#5b4636]">
                                New time
                                <input required type="time" value={proposedTime}
                                    onChange={e => setProposedTime(e.target.value)}
                                    className="rounded-xl border border-[#ddcdb8] bg-white px-3 py-2.5 text-sm outline-none" />
                            </label>
                        </div>
                    )}

                    <label className="grid gap-1.5 text-xs font-semibold text-[#5b4636]">
                        Note to user (optional)
                        <textarea rows="3" value={adminNote}
                            onChange={e => setAdminNote(e.target.value)}
                            className="rounded-xl border border-[#ddcdb8] bg-white px-3 py-2.5 text-sm outline-none" />
                    </label>

                    {error && <div className="rounded-xl bg-[#f8e4df] px-4 py-2.5 text-sm text-[#8c392d]">{error}</div>}

                    <div className="mt-1 flex gap-2">
                        <button type="button" onClick={onClose}
                            className="flex-1 rounded-full border border-[#ded0bc] bg-white px-4 py-3 text-sm font-semibold">
                            Cancel
                        </button>
                        <button disabled={busy} type="submit"
                            className="flex-1 rounded-full bg-[#24170f] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
                            {busy ? "Saving…" : "Confirm"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ---------- Add Design modal ---------- */

function AddDesignModal({ onClose, onSaved }) {
    const [form, setForm] = useState({
        name: "", description: "", price: "",
        amountType: "per design",
        categoryId: "arabic",
        featured: false,
    });
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    const pickFile = (f) => {
        setImage(f);
        if (f) setPreview(URL.createObjectURL(f));
    };

    const submit = async (e) => {
        e.preventDefault();
        if (!image) return setError("Please choose a design image.");
        setBusy(true); setError("");

        const body = new FormData();
        Object.entries(form).forEach(([k, v]) => body.append(k, v));
        body.append("image", image);

        try {
            await api.post("/api/designs", body);
            onSaved();
        } catch (err) {
            setError(err.response?.data?.message || "Upload failed");
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] overflow-auto bg-[#20140e]/60 p-4 backdrop-blur-sm">
            <div className="mx-auto my-8 max-w-2xl rounded-[30px] bg-[#fffdf9] p-6 shadow-2xl sm:p-9">
                <div className="flex items-start justify-between">
                    <div>
                        <div className="text-xs font-bold uppercase tracking-[.2em] text-[#9a7352]">Catalog manager</div>
                        <h2 className="serif mt-1 text-3xl">Add Mehndi design</h2>
                    </div>
                    <button onClick={onClose} className="rounded-full p-2 hover:bg-[#f1e6d8]"><X size={18} /></button>
                </div>

                <form onSubmit={submit} className="mt-7 grid gap-5">
                    <label className="grid gap-2 text-sm font-semibold">
                        Design image
                        <div className="relative rounded-2xl border-2 border-dashed border-[#d9c7b0] bg-[#faf5ed] p-6 text-center">
                            {preview ? (
                                <img src={preview} alt="preview" className="mx-auto max-h-48 rounded-xl object-contain" />
                            ) : (
                                <>
                                    <Upload className="mx-auto text-[#946b49]" />
                                    <div className="mt-2 text-sm text-[#8a6d53]">Choose JPG, PNG or WebP</div>
                                </>
                            )}
                            <input required type="file" accept="image/*"
                                onChange={(e) => pickFile(e.target.files?.[0])}
                                className="absolute inset-0 cursor-pointer opacity-0" />
                        </div>
                    </label>

                    <div className="grid gap-5 sm:grid-cols-2">
                        <label className="grid gap-2 text-sm font-semibold">
                            Design name
                            <input required value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                className="rounded-xl border border-[#ddcdb8] bg-white px-4 py-3 font-normal outline-none focus:ring-2 focus:ring-[#b07a4f]" />
                        </label>
                        <label className="grid gap-2 text-sm font-semibold">
                            Category
                            <select value={form.categoryId}
                                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                                className="rounded-xl border border-[#ddcdb8] bg-white px-4 py-3 font-normal">
                                {CATEGORY_OPTIONS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </label>
                    </div>

                    <label className="grid gap-2 text-sm font-semibold">
                        Description
                        <textarea rows="3" value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            placeholder="Describe the motif, coverage, occasion…"
                            className="rounded-xl border border-[#ddcdb8] bg-white px-4 py-3 font-normal outline-none focus:ring-2 focus:ring-[#b07a4f]" />
                    </label>

                    <div className="grid gap-5 sm:grid-cols-2">
                        <label className="grid gap-2 text-sm font-semibold">
                            Price
                            <input required type="number" min="0" value={form.price}
                                onChange={(e) => setForm({ ...form, price: e.target.value })}
                                placeholder="1500"
                                className="rounded-xl border border-[#ddcdb8] bg-white px-4 py-3 font-normal outline-none" />
                        </label>
                        <label className="grid gap-2 text-sm font-semibold">
                            Amount type
                            <select value={form.amountType}
                                onChange={(e) => setForm({ ...form, amountType: e.target.value })}
                                className="rounded-xl border border-[#ddcdb8] bg-white px-4 py-3 font-normal">
                                <option>per design</option><option>per hand</option>
                                <option>per pair</option><option>per hour</option><option>package</option>
                            </select>
                        </label>
                    </div>

                    <label className="flex items-center gap-3 rounded-xl bg-[#f5ecdf] p-4 text-sm">
                        <input type="checkbox" checked={form.featured}
                            onChange={(e) => setForm({ ...form, featured: e.target.checked })} />
                        Mark this design as featured
                    </label>

                    {error && (
                        <div className="rounded-xl bg-[#f8e4df] px-4 py-3 text-sm text-[#8c392d]">{error}</div>
                    )}

                    <button disabled={busy}
                        className="flex items-center justify-center gap-2 rounded-full bg-[#24170f] px-6 py-4 text-sm font-semibold text-white disabled:opacity-50">
                        {busy ? <><Loader2 size={15} className="animate-spin" /> Uploading to Drive…</> : "Save design to Drive"}
                    </button>
                </form>
            </div>
        </div>
    );
}