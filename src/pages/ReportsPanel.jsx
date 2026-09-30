import { useEffect, useState } from "react";
import {
    Calendar, Users, IndianRupee, Clock, TrendingUp, Loader2, RefreshCw,
    Trophy, Star, Filter, X,
} from "lucide-react";
import { api } from "../lib/api";

function currency(value) {
    return new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency: "GBP",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value || 0);
}

function formatDuration(seconds) {
    if (!seconds || seconds < 60) return `${seconds || 0}s`;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
}

const todayISO = () => new Date().toISOString().slice(0, 10);
const daysAgoISO = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);

export default function ReportsPanel() {
    const [from, setFrom] = useState(daysAgoISO(30));
    const [to, setTo] = useState(todayISO());
    const [userId, setUserId] = useState("");
    const [customers, setCustomers] = useState([]);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadCustomers = async () => {
        try {
            const { data } = await api.get("/api/reports/customers");
            setCustomers(data);
        } catch { /* ignore */ }
    };

    const loadReport = async () => {
        setLoading(true); setError("");
        try {
            const params = new URLSearchParams();
            if (from) params.set("from", from);
            if (to) params.set("to", to);
            if (userId) params.set("userId", userId);
            const { data } = await api.get(`/api/reports?${params.toString()}`);
            setData(data);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load report");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadCustomers(); }, []);
    useEffect(() => { loadReport(); }, [from, to, userId]);

    const clearFilters = () => {
        setFrom(daysAgoISO(30));
        setTo(todayISO());
        setUserId("");
    };

    return (
        <div className="space-y-6">
            {/* Filter bar */}
            <div className="rounded-3xl border border-[#eadfce] bg-white p-5">
                <div className="flex flex-wrap items-end gap-3">
                    <label className="grid gap-1.5 text-xs font-semibold text-[#5b4636]">
                        From
                        <input type="date" value={from} onChange={e => setFrom(e.target.value)}
                            className="rounded-xl border border-[#ddcdb8] bg-white px-3 py-2 text-sm outline-none" />
                    </label>
                    <label className="grid gap-1.5 text-xs font-semibold text-[#5b4636]">
                        To
                        <input type="date" value={to} onChange={e => setTo(e.target.value)}
                            className="rounded-xl border border-[#ddcdb8] bg-white px-3 py-2 text-sm outline-none" />
                    </label>
                    <label className="grid gap-1.5 text-xs font-semibold text-[#5b4636]">
                        Customer
                        <select value={userId} onChange={e => setUserId(e.target.value)}
                            className="min-w-[180px] rounded-xl border border-[#ddcdb8] bg-white px-3 py-2 text-sm outline-none">
                            <option value="">All customers</option>
                            {customers.map(c => (
                                <option key={c.id} value={c.id}>{c.username} ({c.email})</option>
                            ))}
                        </select>
                    </label>
                    <button onClick={loadReport}
                        className="inline-flex items-center gap-2 rounded-full border border-[#ded0bc] bg-white px-4 py-2.5 text-sm font-semibold hover:bg-[#f4eadc]">
                        <RefreshCw size={14} /> Refresh
                    </button>
                    {(userId || from !== daysAgoISO(30) || to !== todayISO()) && (
                        <button onClick={clearFilters}
                            className="inline-flex items-center gap-2 text-xs font-semibold text-[#7d3f24] hover:underline">
                            <X size={13} /> Clear filters
                        </button>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="grid h-40 place-items-center rounded-3xl border border-[#eadfce] bg-white">
                    <Loader2 className="animate-spin text-[#8a6d53]" />
                </div>
            ) : error ? (
                <div className="rounded-3xl border border-[#f8e4df] bg-[#fffdf9] p-6 text-center text-[#8c392d]">
                    {error}
                </div>
            ) : data ? (
                <>
                    {/* KPI tiles */}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <KpiTile icon={<IndianRupee size={18} />} label="Total revenue"
                            value={currency(data.summary.totalRevenue)}
                            sub={`${data.summary.totalOrders} paid order${data.summary.totalOrders === 1 ? "" : "s"}`} />
                        <KpiTile icon={<Clock size={18} />} label="Avg session time"
                            value={formatDuration(data.summary.avgSeconds)}
                            sub={`${data.summary.totalSessions} sessions completed`} />
                        <KpiTile icon={<Users size={18} />} label="Unique customers"
                            value={data.summary.uniqueCustomers}
                            sub={data.summary.inProgressCount > 0 ? `${data.summary.inProgressCount} in progress` : "No active sessions"} />
                        <KpiTile icon={<TrendingUp size={18} />} label="Revenue / order"
                            value={data.summary.totalOrders
                                ? currency(Math.round(data.summary.totalRevenue / data.summary.totalOrders))
                                : currency(0)}
                            sub="Average order value" />
                    </div>

                    {/* Revenue chart */}
                    <div className="rounded-3xl border border-[#eadfce] bg-white p-6">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <div className="text-[10px] uppercase tracking-[.24em] text-[#8a6d53]">Trend</div>
                                <h3 className="serif mt-1 text-xl font-semibold">Revenue by day</h3>
                            </div>
                            <Calendar size={18} className="text-[#8a6d53]" />
                        </div>
                        <RevenueChart data={data.dailyRevenue} />
                    </div>

                    {/* Two-column: top customers + top designs */}
                    <div className="grid gap-6 lg:grid-cols-2">
                        <TopList title="Top customers" icon={<Trophy size={16} />}>
                            {data.topCustomers.length === 0 ? (
                                <EmptyRow>No paid customers in range</EmptyRow>
                            ) : data.topCustomers.map(c => (
                                <li key={c.userId} className="flex items-center justify-between border-b border-[#f0e6d8] py-3 last:border-0">
                                    <div className="min-w-0">
                                        <div className="truncate font-semibold text-sm">{c.username}</div>
                                        <div className="truncate text-xs text-[#8a6d53]">{c.email}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold">{currency(c.revenue)}</div>
                                        <div className="text-[10px] text-[#8a6d53]">
                                            {c.count} order{c.count === 1 ? "" : "s"} · {formatDuration(c.totalSeconds)}
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </TopList>

                        <TopList title="Top designs" icon={<Star size={16} />}>
                            {data.topDesigns.length === 0 ? (
                                <EmptyRow>No design sales in range</EmptyRow>
                            ) : data.topDesigns.map(d => (
                                <li key={d.name} className="flex items-center justify-between border-b border-[#f0e6d8] py-3 last:border-0">
                                    <div className="min-w-0">
                                        <div className="truncate font-semibold text-sm">{d.name}</div>
                                        <div className="text-xs text-[#8a6d53]">{d.qty} booked</div>
                                    </div>
                                    <div className="font-bold">{currency(d.revenue)}</div>
                                </li>
                            ))}
                        </TopList>
                    </div>

                    {/* Session log */}
                    <div className="rounded-3xl border border-[#eadfce] bg-white p-6">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <div className="text-[10px] uppercase tracking-[.24em] text-[#8a6d53]">Activity</div>
                                <h3 className="serif mt-1 text-xl font-semibold">Session log</h3>
                            </div>
                            <div className="text-xs text-[#8a6d53]">{data.sessions.length} entries</div>
                        </div>

                        {data.sessions.length === 0 ? (
                            <div className="py-12 text-center text-sm text-[#8a6d53]">
                                No sessions recorded in this date range.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="text-left text-[10px] uppercase tracking-[.16em] text-[#8a6d53]">
                                        <tr className="border-b border-[#eadfce]">
                                            <th className="py-2 pr-4">Customer</th>
                                            <th className="py-2 pr-4">Order</th>
                                            <th className="py-2 pr-4">Started</th>
                                            <th className="py-2 pr-4">Duration</th>
                                            <th className="py-2 pr-4 text-right">Amount</th>
                                            <th className="py-2 text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.sessions.map(s => (
                                            <tr key={s.id} className="border-b border-[#f5ecdf] last:border-0">
                                                <td className="py-2 pr-4 font-semibold">{s.username}</td>
                                                <td className="py-2 pr-4 font-mono text-xs text-[#8a6d53]">#{s.id.slice(0, 8)}</td>
                                                <td className="py-2 pr-4 text-xs">
                                                    {new Date(s.startedAt).toLocaleString()}
                                                </td>
                                                <td className="py-2 pr-4">
                                                    {s.durationSeconds ? formatDuration(s.durationSeconds) : "—"}
                                                </td>
                                                <td className="py-2 pr-4 text-right font-semibold">{currency(s.total)}</td>
                                                <td className="py-2 text-right">
                                                    <StatusPill status={s.status} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            ) : null}
        </div>
    );
}

/* ---------- Small components ---------- */

function KpiTile({ icon, label, value, sub }) {
    return (
        <div className="rounded-3xl border border-[#eadfce] bg-white p-5">
            <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-[#f1cf8a]/40 text-[#7d3f24]">
                    {icon}
                </div>
                <div>
                    <div className="text-[10px] uppercase tracking-[.18em] text-[#8a6d53]">{label}</div>
                    <div className="serif mt-0.5 text-2xl font-bold leading-tight">{value}</div>
                    <div className="text-[11px] text-[#8a6d53]">{sub}</div>
                </div>
            </div>
        </div>
    );
}

function TopList({ title, icon, children }) {
    return (
        <div className="rounded-3xl border border-[#eadfce] bg-white p-6">
            <div className="mb-3 flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-full bg-[#f1cf8a]/40 text-[#7d3f24]">
                    {icon}
                </div>
                <h3 className="serif text-lg font-semibold">{title}</h3>
            </div>
            <ul>{children}</ul>
        </div>
    );
}

function EmptyRow({ children }) {
    return <li className="py-6 text-center text-xs text-[#8a6d53]">{children}</li>;
}

function StatusPill({ status }) {
    const map = {
        "in-progress": "bg-[#fdf3d6] text-[#8a6d1c]",
        completed: "bg-[#e2f0e5] text-[#1d7a3e]",
        paid: "bg-[#e2f0e5] text-[#1d7a3e]",
    };
    const label = {
        "in-progress": "In progress",
        completed: "Completed",
        paid: "Paid",
    }[status] || status;
    return (
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${map[status] || "bg-[#f4eadc] text-[#8a6d53]"}`}>
            {label}
        </span>
    );
}

/* ---------- Pure-SVG bar chart ---------- */

function RevenueChart({ data }) {
    if (!data || data.length === 0) {
        return <div className="py-12 text-center text-sm text-[#8a6d53]">No revenue yet in this range.</div>;
    }

    const maxAmount = Math.max(...data.map(d => d.amount), 1);
    const barW = Math.max(12, Math.min(48, Math.floor(900 / data.length) - 6));

    return (
        <div className="flex items-end gap-2 overflow-x-auto pb-3" style={{ minHeight: 200 }}>
            {data.map(d => {
                const pct = d.amount / maxAmount;
                const h = Math.max(6, Math.round(pct * 160));
                return (
                    <div key={d.date} className="flex shrink-0 flex-col items-center" style={{ width: barW }}>
                        <div className="mb-1 text-[10px] font-semibold text-[#7d3f24]">
                            £{d.amount}
                        </div>
                        <div
                            className="rounded-t-md bg-gradient-to-t from-[#7d3f24] to-[#f1cf8a] transition-all hover:from-[#5b2e18]"
                            style={{ height: h, width: barW }}
                            title={`${d.date}: £${d.amount}`}
                        />
                        <div className="mt-1 rotate-[-40deg] origin-top-left whitespace-nowrap text-[9px] text-[#8a6d53]"
                            style={{ width: 0 }}>
                            {d.date.slice(5)}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}