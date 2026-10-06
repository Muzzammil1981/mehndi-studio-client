import { useEffect, useState } from "react";
import { Sparkles, Clock, Wifi, WifiOff, CheckCircle2, Users, Ticket, Timer, Maximize, Minimize } from "lucide-react";
import { api, API_BASE } from "../lib/api";

const BASE_SECONDS = 30 * 60; // default session length
const EXTEND_SECONDS = 10 * 60; // added each time the block runs out

const buildImageUrl = (src) => {
    if (!src) return "";
    if (src.startsWith("http://") || src.startsWith("https://")) return src;
    return `${API_BASE}${src}`;
};

const formatTimer = (seconds) => {
    const s = Math.max(0, Math.floor(seconds));
    const m = Math.floor(s / 60);
    return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};

/* 30 min → 40 → 50 … whenever elapsed reaches the current total */
const getProgress = (elapsed, base) => {
    let total = base;
    let extensions = 0;
    if (elapsed >= base) {
        extensions = Math.floor((elapsed - base) / EXTEND_SECONDS) + 1;
        total = base + extensions * EXTEND_SECONDS;
    }
    const percent = Math.min(100, Math.floor((elapsed / total) * 100));
    return { total, extensions, percent, pending: Math.max(0, total - elapsed) };
};

export default function MonitorPage({ eventId }) {
    const [data, setData] = useState(null);
    const [error, setError] = useState("");
    const [connected, setConnected] = useState(true);
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    /* Fullscreen */
    const [isFullscreen, setIsFullscreen] = useState(false);

    const toggleFullscreen = () => {
        if (document.fullscreenElement) {
            document.exitFullscreen?.();
        } else {
            document.documentElement.requestFullscreen?.().catch(() => { });
        }
    };

    useEffect(() => {
        const onChange = () => setIsFullscreen(!!document.fullscreenElement);
        const onKey = (e) => {
            if ((e.key === "f" || e.key === "F") && !e.ctrlKey && !e.metaKey && !e.altKey) toggleFullscreen();
        };
        document.addEventListener("fullscreenchange", onChange);
        window.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("fullscreenchange", onChange);
            window.removeEventListener("keydown", onKey);
        };
    }, []);

    useEffect(() => {
        if (!eventId) {
            setError("No event specified. Add ?event=ID to the URL.");
            return;
        }
        let cancelled = false;
        const fetchQueue = async () => {
            try {
                const res = await api.get(`/api/events/${eventId}/queue`);
                if (cancelled) return;
                setData(res.data);
                setError("");
                setConnected(true);
            } catch (err) {
                if (cancelled) return;
                setConnected(false);
                setError(err.response?.data?.message || "Failed to load queue");
            }
        };
        fetchQueue();
        const t = setInterval(fetchQueue, 8000);
        return () => { cancelled = true; clearInterval(t); };
    }, [eventId]);

    if (!eventId) {
        return (
            <div className="min-h-screen bg-[#120a06] grid place-items-center px-5">
                <div className="text-center">
                    <Sparkles size={48} className="mx-auto mb-4 text-[#f1cf8a]" />
                    <h1 className="serif text-3xl font-bold text-white">No event selected</h1>
                    <p className="mt-2 text-[#d9c9b8]">
                        Add <code className="bg-white/10 px-2 py-1 rounded">?event=event-xxxxx</code> to the URL.
                    </p>
                </div>
            </div>
        );
    }

    if (!data && !error) {
        return (
            <div className="min-h-screen bg-[#120a06] grid place-items-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#f1cf8a]/20 border-t-[#f1cf8a]" />
                    <div className="serif text-2xl text-[#f1cf8a]">Loading queue…</div>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="min-h-screen bg-[#120a06] grid place-items-center px-5">
                <div className="text-center max-w-lg">
                    <h1 className="serif text-3xl font-bold text-red-300">Unable to load the queue</h1>
                    <p className="mt-2 text-[#d9c9b8]">{error}</p>
                </div>
            </div>
        );
    }

    const current = data.nowServing[0];
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const dateStr = now.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });

    let elapsed = 0;
    if (current?.startedAt) {
        elapsed = Math.max(0, Math.floor((now.getTime() - new Date(current.startedAt).getTime()) / 1000));
    }
    const base = current?.estimatedSeconds > 0 ? current.estimatedSeconds : BASE_SECONDS;
    const { total, extensions, percent, pending } = getProgress(elapsed, base);
    const imgUrl = current?.image ? buildImageUrl(current.image) : "";
    const ringColor = extensions > 0 ? "#f1cf8a" : "#4ade80";

    return (
        <div className="min-h-screen bg-[#120a06] text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.035]" style={{ backgroundImage: "radial-gradient(#f1cf8a 1.5px, transparent 1.5px)", backgroundSize: "36px 36px" }} />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1400px] h-[600px] bg-[#f1cf8a]/5 blur-[160px] rounded-full pointer-events-none" />

            <div className="relative z-10 flex flex-col min-h-screen">
                {/* Header */}
                <header className="flex items-center justify-between px-6 md:px-10 py-5 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-[#24170f] to-[#382419] text-[#f1cf8a] serif text-xl ring-1 ring-[#f1cf8a]/30">M</div>
                        <div>
                            <div className="serif text-lg font-bold leading-tight">Mehndi Studio</div>
                            <div className="text-xs text-[#8a6d53]">Live queue</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 md:gap-6">
                        <div className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold ${connected ? "border-[#1d7a3e]/40 bg-[#1d7a3e]/10 text-[#4ade80]" : "border-red-500/40 bg-red-500/10 text-red-300"}`}>
                            {connected ? <Wifi size={14} /> : <WifiOff size={14} />}
                            <span className="hidden sm:inline">{connected ? "Live" : "Reconnecting"}</span>
                        </div>
                        <button
                            type="button"
                            onClick={toggleFullscreen}
                            title={isFullscreen ? "Exit fullscreen (F)" : "Fullscreen (F)"}
                            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                            className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/5 text-[#f1cf8a] transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f1cf8a]"
                        >
                            {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
                        </button>
                        <div className="text-right">
                            <div className="flex items-center gap-2 text-2xl md:text-3xl font-bold tabular-nums text-[#f1cf8a] leading-none">
                                <Clock size={22} /> {timeStr}
                            </div>
                            <div className="text-xs text-[#8a6d53] mt-1">{dateStr}</div>
                        </div>
                    </div>
                </header>

                {/* Event name */}
                <div className="text-center pt-8 pb-4 px-6">
                    <h1 className="serif text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-[#d9c9b8] leading-tight">
                        {data.event.name}
                    </h1>
                </div>

                {/* Now serving */}
                <div className="flex-1 grid place-items-center px-6 md:px-10 py-6">
                    {current ? (
                        <div className="w-full max-w-[1500px] grid grid-cols-1 lg:grid-cols-[minmax(0,340px)_1fr_minmax(0,340px)] gap-8 lg:gap-10 items-center">
                            {/* Design photo */}
                            <figure className="mx-auto w-full max-w-[340px]">
                                <div className="relative aspect-square rounded-3xl overflow-hidden border border-[#f1cf8a]/40 shadow-[0_20px_60px_rgba(0,0,0,.6)]">
                                    {imgUrl ? (
                                        <img src={imgUrl} alt={current.itemName || "Design"} className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="h-full w-full grid place-items-center bg-white/5 text-[#8a6d53]">No image</div>
                                    )}
                                </div>
                                <figcaption className="mt-4 text-center">
                                    <div className="text-xs text-[#a88b6f]">Working on</div>
                                    <div className="serif text-2xl font-semibold">{current.itemName || "Design"}</div>
                                </figcaption>
                            </figure>

                            {/* Token */}
                            <div className="flex flex-col items-center text-center gap-3">
                                <div className="flex items-center gap-2 text-sm font-semibold text-[#a88b6f]">
                                    <Ticket size={18} className="text-[#f1cf8a]" /> Now serving
                                </div>
                                <span className="serif text-[#f1cf8a] font-bold leading-none text-[8rem] md:text-[11rem] xl:text-[14rem] drop-shadow-[0_0_60px_rgba(241,207,138,0.5)]">
                                    #{current.tokenNumber}
                                </span>
                                <div className="serif text-3xl md:text-5xl font-semibold text-[#e9dccb]">{current.username}</div>

                                {current.startedAt && (
                                    <div className="mt-3 inline-flex items-center gap-3 rounded-2xl border border-[#1d7a3e]/40 bg-[#1d7a3e]/10 px-5 py-3">
                                        <span className="relative flex h-3 w-3">
                                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#4ade80] opacity-70" />
                                            <span className="relative inline-flex h-3 w-3 rounded-full bg-[#4ade80]" />
                                        </span>
                                        <Timer size={22} className="text-[#4ade80]" />
                                        <div className="text-left">
                                            <div className="text-xs text-[#4ade80]/80">Session time</div>
                                            <div className="serif text-3xl font-bold tabular-nums text-[#4ade80] leading-none">{formatTimer(elapsed)}</div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Progress image */}
                            <figure className="mx-auto w-full max-w-[340px]">
                                <div
                                    className="relative aspect-square rounded-3xl overflow-hidden border shadow-[0_20px_60px_rgba(0,0,0,.6)]"
                                    style={{ borderColor: `${ringColor}66` }}
                                    role="img"
                                    aria-label={`${percent}% complete`}
                                >
                                    {imgUrl && (
                                        <>
                                            {/* pending: dim greyscale */}
                                            <img src={imgUrl} alt="" className="absolute inset-0 h-full w-full object-cover grayscale brightness-[.35]" />
                                            {/* completed: full colour, revealed from the bottom */}
                                            <img
                                                src={imgUrl}
                                                alt=""
                                                className="absolute inset-0 h-full w-full object-cover transition-[clip-path] duration-1000 ease-linear"
                                                style={{ clipPath: `inset(${100 - percent}% 0 0 0)` }}
                                            />
                                            {/* leading edge line */}
                                            <div
                                                className="absolute inset-x-0 h-[2px] transition-[top] duration-1000 ease-linear"
                                                style={{ top: `${100 - percent}%`, background: ringColor, boxShadow: `0 0 14px ${ringColor}` }}
                                            />
                                        </>
                                    )}
                                    <div className="absolute inset-0 grid place-items-center bg-black/25">
                                        <div className="serif font-bold tabular-nums text-white text-7xl md:text-8xl drop-shadow-[0_4px_20px_rgba(0,0,0,.9)]">
                                            {percent}<span className="text-4xl text-white/80">%</span>
                                        </div>
                                    </div>
                                </div>

                                <figcaption className="mt-4">
                                    <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                                        <div className="h-full rounded-full transition-[width] duration-1000 ease-linear" style={{ width: `${percent}%`, background: ringColor }} />
                                    </div>
                                    <div className="mt-3 grid grid-cols-2 gap-3 text-center">
                                        <div className="rounded-xl border border-[#4ade80]/25 bg-[#4ade80]/5 py-2">
                                            <div className="text-xs text-[#4ade80]/80">Completed</div>
                                            <div className="serif text-2xl font-bold tabular-nums text-[#4ade80]">{formatTimer(elapsed)}</div>
                                        </div>
                                        <div className="rounded-xl border border-[#f1cf8a]/25 bg-[#f1cf8a]/5 py-2">
                                            <div className="text-xs text-[#f1cf8a]/80">Pending</div>
                                            <div className="serif text-2xl font-bold tabular-nums text-[#f1cf8a]">{formatTimer(pending)}</div>
                                        </div>
                                    </div>
                                    <div className="mt-3 text-center text-xs text-[#a88b6f]">
                                        {extensions > 0
                                            ? `Extended by ${extensions * 10} min · now ${Math.round(total / 60)} min total`
                                            : `Estimated ${Math.round(total / 60)} min`}
                                    </div>
                                </figcaption>
                            </figure>
                        </div>
                    ) : (
                        <div className="text-center">
                            <div className="serif text-6xl md:text-8xl font-bold text-[#f1cf8a]/40">Waiting…</div>
                            <div className="mt-3 text-lg text-[#a88b6f]">
                                {data.totalTokens > 0 ? "Please wait for the next token" : "No orders yet"}
                            </div>
                        </div>
                    )}
                </div>

                {/* Queues */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6 px-6 md:px-10 pb-8">
                    <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 md:p-6">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="grid h-10 w-10 place-items-center rounded-full bg-[#f1cf8a]/15 text-[#f1cf8a]"><Users size={19} /></div>
                            <h2 className="serif text-xl font-bold">Up next</h2>
                        </div>
                        {data.upNext.length === 0 ? (
                            <div className="py-10 text-center text-sm text-[#8a6d53]">No one in the queue</div>
                        ) : (
                            <div className="grid gap-3">
                                {data.upNext.map((t, i) => (
                                    <div key={t.tokenNumber} className="flex items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3">
                                        <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-xl ${i === 0 ? "bg-[#f1cf8a]/20 text-[#f1cf8a] border border-[#f1cf8a]/40" : "bg-white/5 text-[#d9c9b8] border border-white/10"}`}>
                                            <span className="serif text-2xl font-bold tabular-nums">{t.tokenNumber}</span>
                                        </div>
                                        {t.image && (
                                            <div className="h-14 w-14 shrink-0 rounded-xl overflow-hidden border border-white/10">
                                                <img src={buildImageUrl(t.image)} alt="" className="h-full w-full object-cover" />
                                            </div>
                                        )}
                                        <div className="min-w-0 flex-1">
                                            <div className="truncate text-base font-semibold">{t.username}</div>
                                            {i === 0 && <div className="text-xs font-semibold text-[#f1cf8a]">Next in line</div>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 md:p-6">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="grid h-10 w-10 place-items-center rounded-full bg-[#1d7a3e]/20 text-[#4ade80]"><CheckCircle2 size={19} /></div>
                            <h2 className="serif text-xl font-bold">Recently completed</h2>
                        </div>
                        {data.recentlyCompleted.length === 0 ? (
                            <div className="py-10 text-center text-sm text-[#8a6d53]">No completed tokens yet</div>
                        ) : (
                            <div className="grid gap-3">
                                {data.recentlyCompleted.map((t) => (
                                    <div key={t.tokenNumber} className="flex items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3 opacity-80">
                                        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-[#1d7a3e]/15 text-[#4ade80] border border-[#1d7a3e]/30">
                                            <span className="serif text-2xl font-bold tabular-nums">{t.tokenNumber}</span>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="truncate text-base font-semibold text-[#d9c9b8]">{t.username}</div>
                                            <div className="flex items-center gap-2 text-xs font-semibold text-[#4ade80]">
                                                <CheckCircle2 size={12} /> Done
                                                {t.durationSeconds > 0 && <span className="text-[#8a6d53]">{formatTimer(t.durationSeconds)}</span>}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>

                {/* Footer */}
                <footer className="border-t border-white/5 px-6 md:px-10 py-4 flex items-center justify-between text-xs text-[#8a6d53]">
                    <div>Total tokens: <span className="text-[#f1cf8a] font-bold">{data.totalTokens}</span></div>
                    <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#4ade80] opacity-60" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#4ade80]" />
                        </span>
                        Refreshes every 8 seconds
                    </div>
                </footer>
            </div>
        </div>
    );
}