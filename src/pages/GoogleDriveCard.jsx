import { useEffect, useState } from "react";
import {
    Cloud, CheckCircle2, XCircle, ExternalLink, Loader2, AlertCircle
} from "lucide-react";
import { api } from "../lib/api";

export default function GoogleDriveCard() {
    const [status, setStatus] = useState(null); // { connected, account }
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    const load = async () => {
        try {
            const { data } = await api.get("/api/google/status");
            setStatus(data);
        } catch (err) {
            setError(err.response?.data?.message || "Could not fetch status");
        }
    };

    useEffect(() => { load(); }, []);

    const connect = async () => {
        setBusy(true); setError("");
        try {
            const { data } = await api.get("/api/google/auth");
            window.location.href = data.url; // hand off to Google
        } catch (err) {
            setError(err.response?.data?.message || "Could not start Google auth");
            setBusy(false);
        }
    };

    const disconnect = async () => {
        setBusy(true);
        try {
            await api.post("/api/google/disconnect");
            await load();
        } finally { setBusy(false); }
    };

    if (!status) {
        return (
            <div className="rounded-2xl border border-[#eadfce] bg-white p-6 sm:rounded-3xl sm:p-8">
                <div className="flex items-center gap-3 text-sm text-[#8a6d53] sm:text-base">
                    <Loader2 className="animate-spin" size={18} /> Checking Drive…
                </div>
            </div>
        );
    }

    const { connected, account } = status;

    return (
        <div className="overflow-hidden rounded-2xl border border-[#eadfce] bg-gradient-to-br from-white to-[#faf5ed] shadow-sm sm:rounded-3xl">
            {/* Header — stacks on mobile, side-by-side on ≥sm */}
            <div className="flex flex-col gap-3 border-b border-[#eadfce] p-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:p-6">
                <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#f1cf8a]/40 text-[#7d3f24] sm:h-11 sm:w-11">
                        <Cloud size={18} className="sm:hidden" />
                        <Cloud size={20} className="hidden sm:block" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="serif text-lg font-semibold sm:text-xl">Google Drive</h3>
                        <p className="text-[11px] text-[#8a6d53] sm:text-xs">
                            Images, JSON data & user files stored in Drive
                        </p>
                    </div>
                </div>

                <span
                    className={`inline-flex shrink-0 items-center gap-1 self-start whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-bold sm:text-xs ${connected
                            ? "bg-[#d6efdc] text-[#1d7a3e]"
                            : "bg-[#f3e0dc] text-[#9b3b2b]"
                        }`}
                >
                    {connected ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                    {connected ? "Connected" : "Not Connected"}
                </span>
            </div>

            <div className="p-4 sm:p-6">
                {connected ? (
                    <div className="space-y-4">
                        <div className="rounded-2xl bg-[#f6efe3] p-4 text-sm">
                            <div className="text-[10px] uppercase tracking-[.2em] text-[#8a6d53]">
                                Account
                            </div>
                            <div className="mt-1 break-all font-semibold">
                                {account?.email || "Google Account"}
                            </div>

                            {account?.folderId && (
                                <>
                                    <div className="mt-3 text-[10px] uppercase tracking-[.2em] text-[#8a6d53]">
                                        Folder
                                    </div>
                                    <div className="mt-1 break-all font-mono text-xs">
                                        {account.folderId}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Actions — full-width stacked on mobile, inline on ≥sm */}
                        <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:gap-3">
                            <a
                                href="https://drive.google.com/drive/my-drive"
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-full border border-[#ded0bc] bg-white px-5 py-2.5 text-sm font-semibold hover:bg-[#f4eadc] sm:w-auto"
                            >
                                <ExternalLink size={15} /> Open Drive
                            </a>
                            <button
                                onClick={disconnect}
                                disabled={busy}
                                className="min-h-[46px] rounded-full border border-[#e6c4be] bg-white px-5 py-2.5 text-sm font-semibold text-[#9b3b2b] hover:bg-[#f7e9e6] disabled:opacity-60 sm:w-auto"
                            >
                                {busy ? "Disconnecting…" : "Disconnect"}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <p className="text-sm leading-6 text-[#715e4e]">
                            Connect a Google account to store all Mehndi designs, images and JSON
                            data in Drive. The SuperAdmin will be redirected to Google to grant
                            permission.
                        </p>
                        <button
                            onClick={connect}
                            disabled={busy}
                            className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-[#24170f] px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0 sm:w-auto"
                        >
                            {busy ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <Cloud size={16} />
                            )}
                            {busy ? "Redirecting..." : "Connect Google Drive"}
                        </button>
                    </div>
                )}

                {error && (
                    <div className="mt-4 flex items-start gap-2 rounded-xl bg-[#f8e4df] px-4 py-3 text-sm text-[#8c392d]">
                        <AlertCircle size={16} className="mt-0.5 shrink-0" />
                        <span className="min-w-0 break-words">{error}</span>
                    </div>
                )}
            </div>
        </div>
    );
}