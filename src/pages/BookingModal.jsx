import { useState } from "react";
import { X, Calendar, Clock, FileText, Loader2, CheckCircle2 } from "lucide-react";
import { api } from "../lib/api";

export default function BookingModal({ cart, total, onClose, onSuccess }) {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

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
            const { data } = await api.post("/api/orders", {
                items: cart.map(({ id, name, price, qty, image, categoryName, amountType }) => ({
                    id, name, price, qty, image, categoryName, amountType,
                })),
                requestedDate: form.requestedDate,
                requestedTime: form.requestedTime,
                notes: form.notes,
            });
            setDone(data);
            onSuccess?.(data);
        } catch (err) {
            setError(err.response?.data?.message || "Could not submit booking");
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[75] grid place-items-center bg-[#20140e]/70 p-4 backdrop-blur-sm" onMouseDown={onClose}>
            <div onMouseDown={e => e.stopPropagation()} className="w-full max-w-lg overflow-hidden rounded-[28px] bg-[#fffdf9] shadow-2xl">
                <div className="relative bg-[#24170f] p-6 text-[#f1cf8a]">
                    <button onClick={onClose} className="absolute right-4 top-4 rounded-full p-2 hover:bg-white/10">
                        <X size={18} />
                    </button>
                    <div className="text-[10px] uppercase tracking-[.24em]">Appointment request</div>
                    <h2 className="serif mt-2 text-3xl font-semibold text-white">
                        {done ? "Request sent ✓" : "Choose your slot"}
                    </h2>
                    <p className="mt-1 text-sm text-[#d9c9b8]">
                        {done ? "The admin will confirm shortly." : `${cart.length} design${cart.length > 1 ? "s" : ""} · ${total}`}
                    </p>
                </div>

                {done ? (
                    <div className="p-6 text-center">
                        <CheckCircle2 className="mx-auto text-[#1d7a3e]" size={44} />
                        <p className="mt-4 text-[#5b4636]">
                            Your request for <strong>{done.requestedDate}</strong> at <strong>{done.requestedTime}</strong> has been sent to the studio.
                        </p>
                        <p className="mt-2 text-xs text-[#8a6d53]">
                            You'll get a live notification as soon as the admin responds.
                        </p>
                        <button onClick={onClose}
                            className="mt-6 rounded-full bg-[#24170f] px-6 py-3 text-sm font-semibold text-white">
                            Close
                        </button>
                    </div>
                ) : (
                    <form onSubmit={submit} className="grid gap-4 p-6">
                        <label className="grid gap-1.5 text-xs font-semibold text-[#5b4636]">
                            Appointment date
                            <div className="relative">
                                <Calendar size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#a38974]" />
                                <input required type="date" min={tomorrow} value={form.requestedDate}
                                    onChange={e => setForm({ ...form, requestedDate: e.target.value })}
                                    className="w-full rounded-xl border border-[#ddcdb8] bg-white py-3 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-[#b07a4f]" />
                            </div>
                        </label>

                        <label className="grid gap-1.5 text-xs font-semibold text-[#5b4636]">
                            Preferred time
                            <div className="relative">
                                <Clock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#a38974]" />
                                <input required type="time" value={form.requestedTime}
                                    onChange={e => setForm({ ...form, requestedTime: e.target.value })}
                                    className="w-full rounded-xl border border-[#ddcdb8] bg-white py-3 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-[#b07a4f]" />
                            </div>
                        </label>

                        <label className="grid gap-1.5 text-xs font-semibold text-[#5b4636]">
                            Notes for the artist (optional)
                            <div className="relative">
                                <FileText size={15} className="absolute left-3.5 top-3 text-[#a38974]" />
                                <textarea rows="3" value={form.notes}
                                    onChange={e => setForm({ ...form, notes: e.target.value })}
                                    placeholder="Occasion, style preferences, add-ons…"
                                    className="w-full rounded-xl border border-[#ddcdb8] bg-white py-3 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-[#b07a4f]" />
                            </div>
                        </label>

                        {error && <div className="rounded-xl bg-[#f8e4df] px-4 py-3 text-sm text-[#8c392d]">{error}</div>}

                        <button disabled={busy} type="submit"
                            className="flex items-center justify-center gap-2 rounded-full bg-[#24170f] px-6 py-3.5 text-sm font-semibold text-white disabled:opacity-60">
                            {busy ? <><Loader2 size={15} className="animate-spin" /> Sending…</> : "Send appointment request"}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}