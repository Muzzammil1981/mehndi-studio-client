import { useState } from "react";
import { Lock, User, Sparkles, Loader2 } from "lucide-react";
import { api } from "../lib/api"

export default function LoginPage({ onLogin }) {
    const [form, setForm] = useState({ username: "", password: "" });
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    const submit = async (e) => {
        e.preventDefault();
        setBusy(true); setError("");
        try {
            const { data } = await api.post("/api/auth/login", form);
            localStorage.setItem("mehndi-token", data.token);
            onLogin(data.user);
        } catch (err) {
            setError(err.response?.data?.message || "Login failed");
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="relative grid min-h-screen place-items-center overflow-hidden bg-[#1b100b] px-4">
            {/* decorative */}
            <div className="pointer-events-none absolute inset-0 opacity-30"
                style={{
                    backgroundImage:
                        "radial-gradient(#c69a63 1px, transparent 1px)",
                    backgroundSize: "24px 24px"
                }} />
            <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#7d3f24]/30 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-[#c69a63]/20 blur-3xl" />

            <form onSubmit={submit}
                className="relative w-full max-w-md rounded-[32px] border border-[#3a2418] bg-[#24170f]/90 p-8 shadow-2xl backdrop-blur-xl sm:p-10">
                <div className="mb-8 text-center">
                    <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#f1cf8a] text-[#24170f]">
                        <Sparkles size={22} />
                    </div>
                    <h1 className="serif mt-4 text-3xl font-semibold text-[#fff5e6]">
                        Mehndi Studio
                    </h1>
                    <p className="mt-1 text-xs uppercase tracking-[.28em] text-[#c69a63]">
                        Studio Management Portal
                    </p>
                </div>

                <label className="grid gap-2 text-sm font-medium text-[#e8d6bd]">
                    Username
                    <div className="relative">
                        <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a4826a]" />
                        <input
                            autoFocus required value={form.username}
                            onChange={(e) => setForm({ ...form, username: e.target.value })}
                            placeholder="admin"
                            className="w-full rounded-xl border border-[#3a2418] bg-[#1b100b] py-3.5 pl-11 pr-4 text-[#fff5e6] outline-none transition focus:border-[#c69a63]"
                        />
                    </div>
                </label>

                <label className="mt-5 grid gap-2 text-sm font-medium text-[#e8d6bd]">
                    Password
                    <div className="relative">
                        <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a4826a]" />
                        <input
                            required type="password" value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            placeholder="••••••••"
                            className="w-full rounded-xl border border-[#3a2418] bg-[#1b100b] py-3.5 pl-11 pr-4 text-[#fff5e6] outline-none transition focus:border-[#c69a63]"
                        />
                    </div>
                </label>

                {error && (
                    <div className="mt-4 rounded-xl border border-[#7d3f24]/40 bg-[#7d3f24]/15 px-4 py-2.5 text-sm text-[#f1c8b6]">
                        {error}
                    </div>
                )}

                <button disabled={busy}
                    className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-[#f1cf8a] px-6 py-3.5 font-semibold text-[#24170f] transition hover:brightness-105 disabled:opacity-60">
                    {busy ? <Loader2 className="animate-spin" size={17} /> : null}
                    {busy ? "Signing in..." : "Sign in"}
                </button>

                <p className="mt-6 text-center text-[11px] uppercase tracking-[.22em] text-[#7a6250]">
                    Secure Studio Administration
                </p>
            </form>
        </div>
    );
}