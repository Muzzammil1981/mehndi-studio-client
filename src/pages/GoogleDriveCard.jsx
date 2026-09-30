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
            <div className="rounded-3xl border border-[#eadfce] bg-white p-8">
                <div className="flex items-center gap-3 text-[#8a6d53]">
                    <Loader2 className="animate-spin" size={18} /> Checking Drive…
                </div>
            </div>
        );
    }

    const { connected, account } = status;

    return (
        <div className="overflow-hidden rounded-3xl border border-[#eadfce] bg-gradient-to-br from-white to-[#faf5ed] shadow-sm">
            <div className="flex items-start justify-between gap-4 border-b border-[#eadfce] p-6">
                <div className="flex items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-full bg-[#f1cf8a]/40 text-[#7d3f24]">
                        <Cloud size={20} />
                    </div>
                    <div>
                        <h3 className="serif text-xl font-semibold">Google Drive</h3>
                        <p className="text-xs text-[#8a6d53]">
                            Images, JSON data & user files stored in Drive
                        </p>
                    </div>
                </div>
                <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${connected
                        ? "bg-[#d6efdc] text-[#1d7a3e]"
                        : "bg-[#f3e0dc] text-[#9b3b2b]"
                    }`}>
                    {connected ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                    {connected ? "Connected" : "Not Connected"}
                </span>
            </div>

            <div className="p-6">
                {connected ? (
                    <div className="space-y-4">
                        <div className="rounded-2xl bg-[#f6efe3] p-4 text-sm">
                            <div className="text-[10px] uppercase tracking-[.2em] text-[#8a6d53]">Account</div>
                            <div className="mt-1 font-semibold">{account?.email || "Google Account"}</div>
                            {account?.folderId && (
                                <>
                                    <div className="mt-3 text-[10px] uppercase tracking-[.2em] text-[#8a6d53]">Folder</div>
                                    <div className="mt-1 font-mono text-xs">{account.folderId}</div>
                                </>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <a
                                href="https://drive.google.com/drive/my-drive"
                                target="_blank" rel="noreferrer"
                                className="inline-flex items-center gap-2 rounded-full border border-[#ded0bc] bg-white px-5 py-2.5 text-sm font-semibold hover:bg-[#f4eadc]">
                                <ExternalLink size={15} /> Open Drive
                            </a>
                            <button onClick={disconnect} disabled={busy}
                                className="rounded-full border border-[#e6c4be] bg-white px-5 py-2.5 text-sm font-semibold text-[#9b3b2b] hover:bg-[#f7e9e6] disabled:opacity-60">
                                Disconnect
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <p className="text-sm leading-6 text-[#715e4e]">
                            Connect a Google account to store all Mehndi designs, images and JSON data
                            in Drive. The SuperAdmin will be redirected to Google to grant permission.
                        </p>
                        <button onClick={connect} disabled={busy}
                            className="inline-flex items-center gap-2 rounded-full bg-[#24170f] px-6 py-3 text-sm font-semibold text-white hover:-translate-y-0.5 disabled:opacity-60">
                            {busy ? <Loader2 size={16} className="animate-spin" /> : <Cloud size={16} />}
                            {busy ? "Redirecting..." : "Connect Google Drive"}
                        </button>
                    </div>
                )}

                {error && (
                    <div className="mt-4 flex items-start gap-2 rounded-xl bg-[#f8e4df] px-4 py-3 text-sm text-[#8c392d]">
                        <AlertCircle size={16} className="mt-0.5" /> {error}
                    </div>
                )}
            </div>
        </div>
    );
}