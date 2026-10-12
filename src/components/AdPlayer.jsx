import { useEffect, useMemo, useRef } from "react";

export default function AdPlayer({ video, onEnded, soundEnabled = false }) {
    const timerRef = useRef(null);
    const videoRef = useRef(null);

    // Auto-advance timer (independent of whether the embed reports "ended")
    useEffect(() => {
        if (!video) return;
        const seconds = Number(video.durationSeconds) || 30;
        timerRef.current = setTimeout(() => onEnded?.(true), seconds * 1000);
        return () => clearTimeout(timerRef.current);
    }, [video?.id]);

    // Build the final URL. For YouTube embeds we swap mute=1 ⇄ mute=0
    // based on the sound flag. Other embeds ignore this.
    const src = useMemo(() => {
        if (!video) return "";
        const raw = video.embedUrl || video.url || "";
        if (!/youtube\.com\/embed\//.test(raw)) return raw;

        if (soundEnabled) {
            // Ensure mute=0 (unmuted). If no mute param exists, add mute=0.
            if (/[?&]mute=/.test(raw)) return raw.replace(/mute=\d/, "mute=0");
            return raw + (raw.includes("?") ? "&" : "?") + "mute=0";
        }
        // Sound disabled → force mute=1
        if (/[?&]mute=/.test(raw)) return raw.replace(/mute=\d/, "mute=1");
        return raw + (raw.includes("?") ? "&" : "?") + "mute=1";
    }, [video?.embedUrl, video?.url, soundEnabled]);

    // For direct <video> files, force unmute + play after mount when sound is on
    useEffect(() => {
        const el = videoRef.current;
        if (!el) return;
        if (soundEnabled) {
            el.muted = false;
            el.volume = 1;
            const p = el.play();
            if (p && typeof p.catch === "function") p.catch(() => { /* silent */ });
        }
    }, [soundEnabled, video?.id, src]);

    if (!video) return null;

    const isVideoFile = /\.(mp4|webm|ogg)(\?|$)/i.test(src);

    if (isVideoFile) {
        return (
            <video
                key={video.id + (soundEnabled ? "-sound" : "-mute")}
                ref={videoRef}
                src={src}
                autoPlay
                muted={!soundEnabled}
                playsInline
                className="h-full w-full object-contain bg-black"
                onEnded={() => onEnded?.(true)}
            />
        );
    }

    return (
        <iframe
            key={video.id + (soundEnabled ? "-sound" : "-mute")}
            src={src}
            title={video.title || "Advertisement"}
            className="h-full w-full border-0"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
        />
    );
}