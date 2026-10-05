import { useState } from "react";
import { X, Calendar, Clock, FileText, Loader2, CheckCircle2, Sparkles } from "lucide-react";
import { api } from "../lib/api";
import { currency } from "../lib/format";

export default function BookingModal({ cart, total, onClose, onSuccess }) {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    // Check if this is an event order
    // (If any item in the cart has an eventId, we treat it as an event order)
    const eventId = cart.length > 0 ? cart[0].eventId : null;
    const isEventOrder = Boolean(eventId);

    const [form, setForm] = useState({
        requestedDate: tomorrow,
        requestedTime: "14:00",
        notes: "",
    });
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [done, setDone] = useState(null);

    const submit = async (e) => {
        e.preventDefault();
        setBusy(true); setError("");

        try {
            let payload = {
                items: cart.map(({ id, name, price, qty, image, categoryName, amountType }) => ({
                    id, name, price, qty, image, categoryName, amountType,
                })),
                notes: form.notes,
            };

            if (isEventOrder) {
                // For events, we don't ask for a date/time.
                // We just send the current date/time as the request time.
                payload.eventId = eventId;
                payload.requestedDate = new Date().toISOString().split('T')[0];
                payload.requestedTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            } else {
                // Normal order
                payload.requestedDate = form.requestedDate;
                payload.requestedTime = form.requestedTime;
            }

            const { data } = await api.post("/api/orders", payload);
            setDone(data);
            onSuccess?.(data);
        } catch (err) {
            setError(err.response?.data?.message || "Could not submit booking");
        } finally {
            setBusy(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[75] flex items-end justify-center bg-[#20140e]/70 backdrop-blur-sm sm:items-center sm:p-4"
            onMouseDown={onClose}
        >
            <div
                onMouseDown={e => e.stopPropagation()}
                className="flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-[26px] bg-[#fffdf9] shadow-2xl sm:max-h-[90vh] sm:rounded-[28px]"
            >
                {/* Header */}
                <div className="relative shrink-0 bg-[#24170f] p-5 text-[#f1cf8a] sm:p-6">
                    <button
                        onClick={onClose}
                        aria-label="Close"
                        className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full text-[#f1cf8a] transition hover:bg-white/10 sm:right-4 sm:top-4 sm:h-10 sm:w-10"
                    >
                        <X size={18} />
                    </button>

                    <div className="pr-10 text-[10px] uppercase tracking-[.2em] sm:tracking-[.24em]">
                        {isEventOrder ? "Event Order" : "Appointment request"}
                    </div>
                    <h2 className="serif mt-2 pr-10 text-2xl font-semibold leading-tight text-white sm:text-3xl">
                        {done ? "Request sent ✓" : (isEventOrder ? "Confirm your order" : "Choose your slot")}
                    </h2>
                    <p className="mt-1 pr-10 text-xs text-[#d9c9b8] sm:text-sm">
                        {done
                            ? "The admin will confirm shortly."
                            : `${cart.length} design${cart.length > 1 ? "s" : ""} · ${currency(total)}`}
                    </p>
                </div>

                {done ? (
                    /* Success state */
                    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-center sm:p-6">
                        <CheckCircle2 className="mx-auto text-[#1d7a3e]" size={44} />

                        {done.tokenNumber && (
                            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#f1cf8a]/30 border border-[#f1cf8a]/50 px-4 py-2 text-sm font-bold text-[#7d3f24]">
                                🎟️ Your Event Token: #{done.tokenNumber}
                            </div>
                        )}

                        <p className="mt-4 text-sm text-[#5b4636] sm:text-base">
                            Your request for <strong>{done.requestedDate}</strong> at{" "}
                            <strong>{done.requestedTime}</strong> has been sent to the studio.
                        </p>
                        <p className="mt-2 text-xs text-[#8a6d53]">
                            You'll get a live notification as soon as the admin responds.
                        </p>
                        <button
                            onClick={onClose}
                            className="mt-6 min-h-[48px] w-full rounded-full bg-[#24170f] px-6 py-3 text-sm font-semibold text-white sm:w-auto"
                        >
                            Close
                        </button>
                    </div>
                ) : (
                    /* Form state */
                    <form
                        onSubmit={submit}
                        className="grid min-h-0 flex-1 gap-3.5 overflow-y-auto overscroll-contain p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:gap-4 sm:p-6"
                    >

                        {isEventOrder ? (
                            <div className="rounded-xl bg-[#fdf3d6] border border-[#f0d98c] p-4 text-sm text-[#8a6d1c] mb-1">
                                <div className="font-semibold flex items-center gap-2">
                                    <Sparkles size={16} /> First Come, First Serve
                                </div>
                                <p className="mt-1 text-xs">
                                    Your token number will be generated automatically based on the current order queue.
                                </p>
                            </div>
                        ) : (
                            <>
                                <label className="grid gap-1.5 text-xs font-semibold text-[#5b4636]">
                                    Appointment date
                                    <div className="relative">
                                        <Calendar size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#a38974]" />
                                        <input
                                            required
                                            type="date"
                                            min={tomorrow}
                                            value={form.requestedDate}
                                            onChange={e => setForm({ ...form, requestedDate: e.target.value })}
                                            className="w-full rounded-xl border border-[#ddcdb8] bg-white py-3 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-[#b07a4f]"
                                        />
                                    </div>
                                </label>

                                <label className="grid gap-1.5 text-xs font-semibold text-[#5b4636]">
                                    Preferred time
                                    <div className="relative">
                                        <Clock size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#a38974]" />
                                        <input
                                            required
                                            type="time"
                                            value={form.requestedTime}
                                            onChange={e => setForm({ ...form, requestedTime: e.target.value })}
                                            className="w-full rounded-xl border border-[#ddcdb8] bg-white py-3 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-[#b07a4f]"
                                        />
                                    </div>
                                </label>
                            </>
                        )}

                        <label className="grid gap-1.5 text-xs font-semibold text-[#5b4636]">
                            Notes for the artist (optional)
                            <div className="relative">
                                <FileText size={15} className="pointer-events-none absolute left-3.5 top-3 text-[#a38974]" />
                                <textarea
                                    rows="3"
                                    value={form.notes}
                                    onChange={e => setForm({ ...form, notes: e.target.value })}
                                    placeholder="Occasion, style preferences, add-ons…"
                                    className="w-full rounded-xl border border-[#ddcdb8] bg-white py-3 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-[#b07a4f]"
                                />
                            </div>
                        </label>

                        {error && (
                            <div className="rounded-xl bg-[#f8e4df] px-4 py-3 text-sm text-[#8c392d]">
                                {error}
                            </div>
                        )}

                        <button
                            disabled={busy}
                            type="submit"
                            className="mt-1 flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-[#24170f] px-6 py-3.5 text-sm font-semibold text-white transition disabled:opacity-60 hover:-translate-y-0.5 disabled:hover:translate-y-0"
                        >
                            {busy ? (
                                <>
                                    <Loader2 size={15} className="animate-spin" /> Sending…
                                </>
                            ) : (
                                isEventOrder ? "Generate Token & Place Order" : "Send appointment request"
                            )}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}