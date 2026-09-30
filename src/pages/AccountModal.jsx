import { useState } from "react";
import { X, Lock, Loader2, CheckCircle2 } from "lucide-react";
import { api } from "../lib/api";

export default function AccountModal({ user, onClose, onSignOut }) {
    const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const submit = async (e) => {
        e.preventDefault();
        setError(""); setSuccess(false);

        if (form.newPassword !== form.confirm) {
            return setError("New passwords do not match");
        }
        if (form.newPassword.length < 6) {
            return setError("New password must be at least 6 characters");
        }

        setBusy(true);
        try {
            await api.post("/api/users/change-password", {
                currentPassword: form.currentPassword,
                newPassword: form.newPassword,
            });
            setSuccess(true);
            setForm({ currentPassword: "", newPassword: "", confirm: "" });
        } catch (err) {
            setError(err.response?.data?.message || "Could not change password");
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-[#20140e]/70 p-4 backdrop-blur-sm" onMouseDown={onClose}>
            <div onMouseDown={e => e.stopPropagation()} className="w-full max-w-md overflow-hidden rounded-[28px] bg-[#fffdf9] shadow-2xl">
                <div className="flex items-center justify-between border-b border-[#eadfce] bg-[#faf5ed] px-6 py-4">
                    <div>
                        <div className="text-[10px] uppercase tracking-[.24em] text-[#8a6d53]">Account</div>
                        <div className="serif text-xl font-semibold">{user.username}</div>
                    </div>
                    <button onClick={onClose} className="rounded-full p-2 hover:bg-[#f1e6d8]"><X size={18} /></button>
                </div>

                <div className="p-6">
                    {/* Account info */}
                    <div className="rounded-2xl bg-[#f5ecdf] p-4 text-sm">
                        <div className="flex justify-between py-1">
                            <span className="text-[#8a6d53]">Email</span>
                            <span className="font-semibold">{user.email}</span>
                        </div>
                        <div className="flex justify-between py-1">
                            <span className="text-[#8a6d53]">Role</span>
                            <span className="font-semibold">{user.role}</span>
                        </div>
                    </div>

                    {/* Change password */}
                    <div className="mt-6">
                        <h3 className="serif text-lg font-semibold">Change password</h3>

                        <form onSubmit={submit} className="mt-4 grid gap-3">
                            <label className="grid gap-1.5 text-xs font-semibold text-[#5b4636]">
                                Current password
                                <div className="relative">
                                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#a38974]" />
                                    <input required type="password" value={form.currentPassword}
                                        onChange={e => update("currentPassword", e.target.value)}
                                        className="w-full rounded-xl border border-[#ddcdb8] bg-white py-3 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-[#b07a4f]" />
                                </div>
                            </label>

                            <label className="grid gap-1.5 text-xs font-semibold text-[#5b4636]">
                                New password
                                <div className="relative">
                                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#a38974]" />
                                    <input required type="password" minLength={6} value={form.newPassword}
                                        onChange={e => update("newPassword", e.target.value)}
                                        className="w-full rounded-xl border border-[#ddcdb8] bg-white py-3 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-[#b07a4f]" />
                                </div>
                            </label>

                            <label className="grid gap-1.5 text-xs font-semibold text-[#5b4636]">
                                Confirm new password
                                <div className="relative">
                                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#a38974]" />
                                    <input required type="password" minLength={6} value={form.confirm}
                                        onChange={e => update("confirm", e.target.value)}
                                        className="w-full rounded-xl border border-[#ddcdb8] bg-white py-3 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-[#b07a4f]" />
                                </div>
                            </label>

                            {error && <div className="rounded-xl bg-[#f8e4df] px-4 py-2.5 text-sm text-[#8c392d]">{error}</div>}

                            {success && (
                                <div className="flex items-center gap-2 rounded-xl bg-[#e2f0e5] px-4 py-2.5 text-sm text-[#1d7a3e]">
                                    <CheckCircle2 size={15} /> Password updated successfully
                                </div>
                            )}

                            <button disabled={busy} type="submit"
                                className="mt-1 flex items-center justify-center gap-2 rounded-full bg-[#24170f] px-6 py-3 text-sm font-semibold text-white disabled:opacity-60">
                                {busy ? <><Loader2 size={15} className="animate-spin" /> Updating…</> : "Update password"}
                            </button>
                        </form>
                    </div>

                    <button onClick={onSignOut}
                        className="mt-6 w-full rounded-full border border-[#e6c4be] bg-white px-6 py-3 text-sm font-semibold text-[#9b3b2b] hover:bg-[#f7e9e6]">
                        Sign out of this account
                    </button>
                </div>
            </div>
        </div>
    );
}