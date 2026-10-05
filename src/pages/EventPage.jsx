import { useEffect, useState } from "react";
import { Clock, Sparkles, ShoppingBag } from "lucide-react";
import { api } from "../lib/api";
import { imageUrl, currency } from "../lib/format";
import SafeImage from "../components/SafeImage";

export default function EventPage({ event, onAddToCart, onSelect }) {
    const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
    const [designs, setDesigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    /* COUNTDOWN */
    useEffect(() => {
        if (!event?.endDate) return;
        const updateCountdown = () => {
            const now = new Date().getTime();
            const end = new Date(event.endDate).getTime();
            const distance = end - now;

            if (isNaN(end) || distance <= 0) {
                setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
                return;
            }

            setTimeLeft({
                hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
                seconds: Math.floor((distance % (1000 * 60)) / 1000),
            });
        };

        updateCountdown();
        const timer = setInterval(updateCountdown, 1000);
        return () => clearInterval(timer);
    }, [event?.endDate]);

    /* LOAD EVENT DESIGNS */
    useEffect(() => {
        const fetchEventDesigns = async () => {
            if (!event) {
                setError("No event information was provided.");
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError("");
                const response = await api.get("/api/designs");
                const allDesigns = Array.isArray(response.data) ? response.data : (response.data?.designs || []);

                const designIds = Array.isArray(event.designIds) ? event.designIds : [];
                const priceOverrides = event.priceOverrides && typeof event.priceOverrides === "object" ? event.priceOverrides : {};

                let eventDesigns = designIds.includes("all")
                    ? allDesigns
                    : allDesigns.filter((design) => designIds.includes(String(design.id)));

                eventDesigns = eventDesigns.map((design) => {
                    const override = priceOverrides[design.id];
                    return {
                        ...design,
                        originalPrice: design.price,
                        price: (override !== undefined && override !== null && override !== "") ? Number(override) : design.price,
                    };
                });

                setDesigns(eventDesigns);
            } catch (err) {
                console.error("Failed to load event designs:", err);
                setError(err.response?.data?.message || "Unable to load event designs.");
                setDesigns([]);
            } finally {
                setLoading(false);
            }
        };

        fetchEventDesigns();
    }, [event]);

    if (!event) {
        return (
            <div className="min-h-screen bg-[#1b100b] text-[#fff9ef] grid place-items-center px-5">
                <div className="text-center">
                    <Sparkles size={40} className="mx-auto mb-4 text-[#f1cf8a]" />
                    <h1 className="serif text-3xl font-bold">No Active Event</h1>
                    <p className="mt-2 text-[#d9c9b8]">There is currently no active event.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#1b100b] text-[#fff9ef]">
            {/* HERO */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#24170f] to-[#1b100b] px-5 py-20 text-center">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(#f1cf8a 1px, transparent 1px)", backgroundSize: "22px 22px" }} />
                <div className="relative z-10 mx-auto max-w-3xl">
                    <div className="inline-flex items-center gap-2 rounded-full border border-[#f1cf8a]/30 bg-[#f1cf8a]/10 px-4 py-2 text-xs font-semibold uppercase tracking-[.2em] text-[#f1cf8a] mb-6">
                        <Sparkles size={14} /> Limited Time Event
                    </div>
                    <h1 className="serif text-5xl font-bold text-white mb-4 sm:text-6xl">{event.name}</h1>
                    <p className="text-[#d9c9b8] text-lg mb-8">Exclusive designs and special pricing for a limited time only.</p>

                    <div className="flex justify-center gap-4 text-center">
                        <div className="bg-[#24170f] border border-[#3a2418] rounded-2xl p-4 w-20">
                            <div className="text-3xl font-bold text-[#f1cf8a]">{String(timeLeft.hours).padStart(2, "0")}</div>
                            <div className="text-[10px] uppercase tracking-widest text-[#7a6250]">Hours</div>
                        </div>
                        <div className="bg-[#24170f] border border-[#3a2418] rounded-2xl p-4 w-20">
                            <div className="text-3xl font-bold text-[#f1cf8a]">{String(timeLeft.minutes).padStart(2, "0")}</div>
                            <div className="text-[10px] uppercase tracking-widest text-[#7a6250]">Mins</div>
                        </div>
                        <div className="bg-[#24170f] border border-[#3a2418] rounded-2xl p-4 w-20">
                            <div className="text-3xl font-bold text-[#f1cf8a]">{String(timeLeft.seconds).padStart(2, "0")}</div>
                            <div className="text-[10px] uppercase tracking-widest text-[#7a6250]">Secs</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* TOKEN BANNER */}
            <div className="bg-[#f1cf8a] text-[#24170f] py-3 px-5 text-center font-bold text-sm flex items-center justify-center gap-2">
                <Clock size={16} /> First Come, First Serve! Book now to secure your token number.
            </div>

            {/* DESIGNS */}
            <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
                <h2 className="serif text-3xl mb-8 text-center text-[#f1cf8a]">Event Exclusive Designs</h2>

                {loading && <div className="text-center text-[#f1cf8a] animate-pulse">Loading event designs...</div>}

                {!loading && error && (
                    <div className="mx-auto max-w-xl rounded-2xl border border-red-900/40 bg-[#2a1712] p-6 text-center">
                        <div className="text-red-300 font-semibold">Unable to load event designs</div>
                        <div className="mt-2 text-sm text-[#d9c9b8]">{error}</div>
                    </div>
                )}

                {!loading && !error && designs.length === 0 && (
                    <div className="mx-auto max-w-xl rounded-2xl border border-[#3a2418] bg-[#24170f] p-8 text-center">
                        <Sparkles size={30} className="mx-auto mb-3 text-[#f1cf8a]" />
                        <div className="font-semibold text-[#f1cf8a]">No designs in this event</div>
                        <div className="mt-2 text-sm text-[#d9c9b8]">This event does not currently contain any available designs.</div>
                    </div>
                )}

                {!loading && !error && designs.length > 0 && (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {designs.map((design) => (
                            <div key={design.id} className="group relative bg-[#fffdf9] rounded-3xl overflow-hidden shadow-2xl transition hover:-translate-y-1">
                                <button onClick={() => onSelect(design)} className="block w-full aspect-[4/5] overflow-hidden bg-[#eadcc9] cursor-zoom-in text-left">
                                    <SafeImage src={imageUrl(design.image)} alt={design.name} className="w-full h-full object-cover transition group-hover:scale-105" />
                                </button>
                                <div className="p-5">
                                    <h3 className="serif text-xl font-semibold text-[#24170f]">{design.name}</h3>
                                    <div className="mt-2 flex items-center gap-2">
                                        <span className="text-lg font-bold text-[#7d3f24]">{currency(design.price)}</span>
                                        {design.price !== design.originalPrice && (
                                            <span className="text-sm text-[#8a6d53] line-through">{currency(design.originalPrice)}</span>
                                        )}
                                    </div>
                                    <button
                                        // IMPORTANT: We pass eventId here so the backend knows to generate a token
                                        onClick={() => onAddToCart({ ...design, eventId: event.id })}
                                        className="mt-4 w-full bg-[#24170f] text-white py-3 rounded-full text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#382419] transition"
                                    >
                                        <ShoppingBag size={16} /> Add to Selection
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}