import { useState } from "react";
import { X, User, Mail, Lock, Loader2, Sparkles } from "lucide-react";
import { api } from "../lib/api";

export default function AuthModal({ onClose, onSuccess, reason }) {
    const [mode, setMode] = useState("signin"); // "signin" | "signup"
    const [form, setForm] = useState({
        identifier: "", username: "", email: "", fullName: "", password: "",
    });
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const submit = async (e) => {
        e.preventDefault();
        setBusy(true); setError("");
        try {
            let data;
            if (mode === "signup") {
                ({ data } = await api.post("/api/users/register", {
                    username: form.username,
                    email: form.email,
                    fullName: form.fullName,
                    password: form.password,
                }));
            } else {
                ({ data } = await api.post("/api/users/login", {
                    identifier: form.identifier,
                    password: form.password,
                }));
            }
            localStorage.setItem("mehndi-user-token", data.token);
            onSuccess(data.user);
        } catch (err) {
            setError(err.response?.data?.message || "Something went wrong");
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-[#20140e]/70 p-4 backdrop-blur-sm" onMouseDown={onClose}>
            <div onMouseDown={e => e.stopPropagation()} className="w-full max-w-md overflow-hidden rounded-[28px] bg-[#fffdf9] shadow-2xl">
                <div className="relative bg-[#24170f] p-6 text-[#f1cf8a]">
                    <button onClick={onClose} className="absolute right-4 top-4 rounded-full p-2 hover:bg-white/10">
                        <X size={18} />
                    </button>
                    <div className="flex items-center gap-2 text-xs uppercase tracking-[.24em]">
                        <Sparkles size={16} /> {mode === "signup" ? "Create account" : "Welcome back"}
                    </div>
                    <h2 className="serif mt-2 text-3xl font-semibold text-white">
                        {mode === "signup" ? "Join Mehndi Studio" : "Sign in to continue"}
                    </h2>
                    {reason && <p className="mt-2 text-xs text-[#d9c9b8]">{reason}</p>}
                </div>

                <form onSubmit={submit} className="grid gap-4 p-6">
                    {mode === "signup" ? (
                        <>
                            <Field icon={<User size={15} />} label="Username">
                                <input required value={form.username} onChange={e => update("username", e.target.value)}
                                    placeholder="yourname"
                                    className="w-full rounded-xl border border-[#ddcdb8] bg-white py-3 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-[#b07a4f]" />
                            </Field>
                            <Field icon={<Mail size={15} />} label="Email">
                                <input required type="email" value={form.email} onChange={e => update("email", e.target.value)}
                                    placeholder="you@example.com"
                                    className="w-full rounded-xl border border-[#ddcdb8] bg-white py-3 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-[#b07a4f]" />
                            </Field>
                            <Field icon={<User size={15} />} label="Full name (optional)">
                                <input value={form.fullName} onChange={e => update("fullName", e.target.value)}
                                    className="w-full rounded-xl border border-[#ddcdb8] bg-white py-3 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-[#b07a4f]" />
                            </Field>
                            <Field icon={<Lock size={15} />} label="Password (min 6 characters)">
                                <input required type="password" minLength={6} value={form.password} onChange={e => update("password", e.target.value)}
                                    className="w-full rounded-xl border border-[#ddcdb8] bg-white py-3 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-[#b07a4f]" />
                            </Field>
                        </>
                    ) : (
                        <>
                            <Field icon={<User size={15} />} label="Username or email">
                                <input required value={form.identifier} onChange={e => update("identifier", e.target.value)}
                                    placeholder="yourname"
                                    className="w-full rounded-xl border border-[#ddcdb8] bg-white py-3 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-[#b07a4f]" />
                            </Field>
                            <Field icon={<Lock size={15} />} label="Password">
                                <input required type="password" value={form.password} onChange={e => update("password", e.target.value)}
                                    className="w-full rounded-xl border border-[#ddcdb8] bg-white py-3 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-[#b07a4f]" />
                            </Field>
                        </>
                    )}

                    {error && <div className="rounded-xl bg-[#f8e4df] px-4 py-3 text-sm text-[#8c392d]">{error}</div>}

                    <button disabled={busy} type="submit"
                        className="mt-1 flex items-center justify-center gap-2 rounded-full bg-[#24170f] px-6 py-3.5 text-sm font-semibold text-white disabled:opacity-60">
                        {busy ? <><Loader2 size={15} className="animate-spin" /> Please wait…</> : mode === "signup" ? "Create account" : "Sign in"}
                    </button>

                    <p className="text-center text-xs text-[#8a6d53]">
                        {mode === "signup" ? "Already have an account?" : "New here?"}{" "}
                        <button type="button"
                            onClick={() => { setMode(mode === "signup" ? "signin" : "signup"); setError(""); }}
                            className="font-semibold text-[#7d3f24] underline">
                            {mode === "signup" ? "Sign in" : "Create account"}
                        </button>
                    </p>
                </form>
            </div>
        </div>
    );
}

function Field({ icon, label, children }) {
    return (
        <label className="grid gap-1.5 text-xs font-semibold text-[#5b4636]">
            {label}
            <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#a38974]">{icon}</span>
                {children}
            </div>
        </label>
    );
}