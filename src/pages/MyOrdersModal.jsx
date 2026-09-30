import { useEffect, useState } from "react";
import {
    X, Calendar, Clock, Loader2, CheckCircle2, XCircle, Hourglass, CreditCard,
    ShieldAlert, AlertCircle, Maximize2, Sparkles, PartyPopper,
} from "lucide-react";
import { api, API_BASE } from "../lib/api";

function currency(value) {
    return new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency: "GBP",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value || 0);
}

function imageUrl(src) {
    if (!src) return "";
    if (src.startsWith("http://") || src.startsWith("https://")) return src;
    return `${API_BASE}${src}`;
}

function formatDuration(seconds) {
    if (!seconds || seconds < 60) return `${seconds || 0}s`;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
}

const STATUS_STYLES = {
    pending: { icon: <Hourglass size={13} />, label: "Pending approval", cls: "bg-[#f8e4df] text-[#8c392d]" },
    approved: { icon: <CheckCircle2 size={13} />, label: "Awaiting payment", cls: "bg-[#e2f0e5] text-[#1d7a3e]" },
    "awaiting-verification": { icon: <ShieldAlert size={13} />, label: "Pending verification", cls: "bg-[#fdf3d6] text-[#8a6d1c]" },
    rejected: { icon: <XCircle size={13} />, label: "Rejected", cls: "bg-[#f8e4df] text-[#8c392d]" },
    paid: { icon: <CheckCircle2 size={13} />, label: "Paid ✓", cls: "bg-[#e2f0e5] text-[#1d7a3e]" },
    "in-progress": { icon: <Sparkles size={13} />, label: "In progress 🎨", cls: "bg-[#fdf3d6] text-[#8a6d1c]" },
    completed: { icon: <CheckCircle2 size={13} />, label: "Ready ✓", cls: "bg-[#e2f0e5] text-[#1d7a3e]" },
};

export default function MyOrdersModal({ onClose, onPay }) {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [lightbox, setLightbox] = useState(null);   // { src, alt }

    const load = () => {
        setLoading(true); setError("");
        api.get("/api/orders")
            .then(({ data }) => setOrders(Array.isArray(data) ? data : []))
            .catch((err) => setError(err.response?.data?.message || "Could not load orders"))
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    useEffect(() => {
        const handler = () => load();
        window.addEventListener("mehndi:order-update", handler);
        return () => window.removeEventListener("mehndi:order-update", handler);
    }, []);

    /* Close lightbox with Esc */
    useEffect(() => {
        if (!lightbox) return;
        const handler = (e) => { if (e.key === "Escape") setLightbox(null); };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [lightbox]);

    return (
        <>
            <div className="fixed inset-0 z-[75] grid place-items-center bg-[#20140e]/70 p-4 backdrop-blur-sm" onMouseDown={onClose}>
                <div onMouseDown={e => e.stopPropagation()}
                    className="flex h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[28px] bg-[#fffdf9] shadow-2xl">

                    <div className="flex items-center justify-between border-b border-[#eadfce] bg-[#faf5ed] px-6 py-4">
                        <div>
                            <div className="text-[10px] uppercase tracking-[.24em] text-[#8a6d53]">Appointments</div>
                            <div className="serif text-2xl font-semibold">My orders</div>
                        </div>
                        <button onClick={onClose} className="rounded-full p-2 hover:bg-[#f1e6d8]"><X size={18} /></button>
                    </div>

                    <div className="flex-1 overflow-auto p-5">
                        {error && (
                            <div className="mb-4 rounded-xl bg-[#f8e4df] px-4 py-3 text-sm text-[#8c392d]">{error}</div>
                        )}

                        {loading ? (
                            <div className="grid h-full place-items-center text-[#8a6d53]">
                                <Loader2 className="animate-spin" />
                            </div>
                        ) : orders.length === 0 ? (
                            <div className="grid h-full place-items-center text-center text-[#8a6d53]">
                                <div>
                                    <Calendar className="mx-auto" size={36} />
                                    <p className="serif mt-4 text-xl">No appointments yet</p>
                                    <p className="mt-1 text-sm">Add designs to your cart and request a slot.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {orders.map(o => {
                                    const S = STATUS_STYLES[o.status] || STATUS_STYLES.pending;
                                    const d = o.proposedDate || o.requestedDate;
                                    const t = o.proposedTime || o.requestedTime;
                                    const isPending = o.status === "pending";
                                    const isAwaiting = o.status === "awaiting-verification";
                                    const isApproved = o.status === "approved";
                                    const isPaid = o.status === "paid";
                                    const isRejected = o.status === "rejected";
                                    const isInProgress = o.status === "in-progress";
                                    const isCompleted = o.status === "completed";
                                    const blurThumb = isPending || isAwaiting;

                                    return (
                                        <div key={o.id} className="rounded-2xl border border-[#eadfce] bg-white p-4">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <div className="text-[10px] uppercase tracking-[.18em] text-[#8a6d53]">
                                                        Order #{o.id.slice(0, 8)}
                                                    </div>
                                                    <div className="mt-1 flex items-center gap-2 text-sm">
                                                        <Calendar size={14} className="text-[#7d3f24]" /> {d}
                                                        <Clock size={14} className="ml-2 text-[#7d3f24]" /> {t}
                                                        {o.proposedDate && o.proposedDate !== o.requestedDate && (
                                                            <span className="ml-2 rounded-full bg-[#f4eadc] px-2 py-0.5 text-[10px]">rescheduled</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${S.cls}`}>
                                                    {S.icon} {S.label}
                                                </span>
                                            </div>

                                            {/* Larger thumbnails */}
                                            <div className="mt-4 flex flex-wrap gap-3">
                                                {o.items.map((it, idx) => (
                                                    <button
                                                        key={idx}
                                                        type="button"
                                                        disabled={blurThumb}
                                                        onClick={() => {
                                                            if (blurThumb) return;
                                                            setLightbox({ src: imageUrl(it.image), alt: it.name });
                                                        }}
                                                        className={`group relative h-32 w-28 overflow-hidden rounded-2xl border border-[#eadfce] bg-[#eadcc9] transition ${blurThumb
                                                            ? "cursor-not-allowed"
                                                            : "cursor-zoom-in hover:ring-2 hover:ring-[#7d3f24]"
                                                            }`}
                                                        title={blurThumb ? "Revealed after studio confirms" : `Click to view ${it.name}`}
                                                    >
                                                        <img
                                                            src={imageUrl(it.image)}
                                                            alt={it.name}
                                                            className={`h-full w-full object-cover transition duration-500 ${blurThumb ? "scale-110 blur-[8px]" : ""}`}
                                                        />

                                                        {isPending && (
                                                            <div className="absolute inset-0 grid place-items-center bg-[#8c392d]/60">
                                                                <Hourglass size={22} className="text-white" />
                                                            </div>
                                                        )}

                                                        {isAwaiting && (
                                                            <div className="absolute inset-0 grid place-items-center bg-[#8a6d1c]/60">
                                                                <ShieldAlert size={22} className="text-white" />
                                                            </div>
                                                        )}

                                                        {!blurThumb && (
                                                            <div className="absolute inset-0 flex flex-col items-center justify-end bg-gradient-to-t from-black/70 to-transparent pb-2 opacity-0 transition group-hover:opacity-100">
                                                                <Maximize2 size={14} className="text-white" />
                                                                <span className="mt-0.5 text-[10px] font-semibold text-white">Enlarge</span>
                                                            </div>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>

                                            {isPending && (
                                                <div className="mt-3 rounded-xl bg-[#f8e4df] px-3 py-2 text-[11px] font-semibold text-[#8c392d]">
                                                    Awaiting admin approval — designs revealed once confirmed.
                                                </div>
                                            )}
                                            {isAwaiting && (
                                                <div className="mt-3 rounded-xl bg-[#fdf3d6] px-3 py-2 text-[11px] font-semibold text-[#8a6d1c]">
                                                    Payment submitted (UTR: <span className="font-mono">{o.utr}</span>). Awaiting studio verification.
                                                </div>
                                            )}

                                            {/* LIVE TIMER when the artist is working */}
                                            {isInProgress && <LiveTimer startedAt={o.startedAt} />}

                                            {/* BEAUTIFUL READY MESSAGE when completed */}
                                            {isCompleted && (
                                                <div className="mt-3 overflow-hidden rounded-2xl border border-[#c8e6d2] bg-gradient-to-br from-[#eaf7ee] via-[#f4fbf6] to-[#f8fdf9] p-5">
                                                    <div className="flex items-start gap-4">
                                                        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#1d7a3e] text-white shadow-lg shadow-[#1d7a3e]/30">
                                                            <CheckCircle2 size={24} />
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="serif text-xl font-semibold text-[#1d7a3e]">
                                                                Your Mehndi is ready! 🎨
                                                            </div>
                                                            <p className="mt-1.5 text-sm leading-6 text-[#3d5c47]">
                                                                Thank you for choosing <strong>Mehndi Studio</strong> — it was a joy creating this for you.
                                                                {o.durationSeconds ? (
                                                                    <> Total time: <strong>{formatDuration(o.durationSeconds)}</strong>.</>
                                                                ) : null}
                                                            </p>
                                                            <p className="mt-2 flex items-center gap-1.5 text-xs italic text-[#4a7a5c]">
                                                                <PartyPopper size={13} /> We can't wait to welcome you back. ✨
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="mt-4 grid gap-1 border-t border-[#f0e6d8] pt-3 text-sm">
                                                {o.items.map((it, idx) => (
                                                    <div key={idx} className="flex justify-between text-[#715e4e]">
                                                        <span>{it.qty}× {it.name}</span>
                                                        <span>{currency(it.price * it.qty)}</span>
                                                    </div>
                                                ))}
                                                <div className="mt-2 flex justify-between font-semibold">
                                                    <span>Total</span>
                                                    <span>{currency(o.total)}</span>
                                                </div>
                                            </div>

                                            {o.paymentRejectReason && (
                                                <div className="mt-3 flex items-start gap-2 rounded-xl bg-[#f8e4df] px-3 py-2 text-xs text-[#8c392d]">
                                                    <AlertCircle size={14} className="mt-0.5 shrink-0" />
                                                    <div>
                                                        <strong>Payment not received:</strong> {o.paymentRejectReason}
                                                    </div>
                                                </div>
                                            )}

                                            {o.adminNote && (
                                                <div className="mt-3 rounded-xl bg-[#f5ecdf] px-3 py-2 text-xs text-[#5b4636]">
                                                    <strong>Admin note:</strong> {o.adminNote}
                                                </div>
                                            )}

                                            {isApproved && (
                                                <button onClick={() => onPay(o)}
                                                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-[#24170f] px-5 py-3 text-sm font-semibold text-white">
                                                    <CreditCard size={15} /> Pay now {currency(o.total)}
                                                </button>
                                            )}

                                            {isPaid && (
                                                <div className="mt-4 flex items-center gap-2 rounded-full bg-[#e2f0e5] px-4 py-2 text-xs font-semibold text-[#1d7a3e]">
                                                    <CheckCircle2 size={14} /> Payment received · {o.paymentId}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Lightbox */}
            {lightbox && (
                <div
                    className="fixed inset-0 z-[95] grid place-items-center bg-black/90 p-4 backdrop-blur-md"
                    onMouseDown={() => setLightbox(null)}
                >
                    <div
                        onMouseDown={e => e.stopPropagation()}
                        className="relative flex max-h-[95vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-[#24170f] shadow-2xl"
                    >
                        <button
                            onClick={() => setLightbox(null)}
                            className="absolute right-4 top-4 z-10 grid h-11 w-11 place-items-center rounded-full bg-black/70 text-white transition hover:bg-black/90"
                            title="Close (Esc)"
                        >
                            <X size={22} />
                        </button>

                        <div className="grid flex-1 place-items-center overflow-auto bg-black/40 p-4">
                            <img
                                src={lightbox.src}
                                alt={lightbox.alt}
                                className="max-h-[80vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl"
                            />
                        </div>

                        <div className="border-t border-white/10 bg-[#24170f] px-6 py-4 text-center">
                            <div className="text-[10px] uppercase tracking-[.24em] text-[#8a6d53]">Design</div>
                            <div className="serif mt-1 text-xl font-semibold text-[#f1cf8a]">{lightbox.alt}</div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

/* ============================================================
   Live Timer — shows a ticking countdown while studio works
   ============================================================ */
function LiveTimer({ startedAt }) {
    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        const t = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(t);
    }, []);

    const elapsed = Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 1000));
    const m = Math.floor(elapsed / 60);
    const s = elapsed % 60;

    return (
        <div className="mt-3 flex items-center gap-3 rounded-2xl border border-[#f0d98c] bg-gradient-to-br from-[#fdf3d6] to-[#fff8e5] px-4 py-3">
            <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#8a6d1c] opacity-60" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-[#8a6d1c]" />
            </span>
            <div className="flex-1">
                <div className="text-[10px] uppercase tracking-[.2em] text-[#8a6d1c]">
                    Studio is working on your design
                </div>
                <div className="serif mt-0.5 text-2xl font-bold text-[#5b4636] tabular-nums">
                    {String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
                </div>
            </div>
            <Sparkles size={20} className="text-[#8a6d1c]" />
        </div>
    );
}