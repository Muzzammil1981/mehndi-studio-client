import { useEffect, useRef } from "react";

export default function AdPlayer({ video, onEnded }) {
    const timerRef = useRef(null);

    useEffect(() => {
        if (!video) return;
        const seconds = Number(video.durationSeconds) || 30;
        timerRef.current = setTimeout(() => onEnded?.(true), seconds * 1000);
        return () => clearTimeout(timerRef.current);
    }, [video?.id]);

    if (!video) return null;
    const embedUrl = video.embedUrl || video.url;
    const isVideoFile = /\.(mp4|webm|ogg)(\?|$)/i.test(embedUrl);

    if (isVideoFile) {
        return (
            <video
                key={video.id}
                src={embedUrl}
                autoPlay
                muted
                playsInline
                className="h-full w-full object-contain bg-black"
                onEnded={() => onEnded?.(true)}
            />
        );
    }

    return (
        <iframe
            key={video.id}
            src={embedUrl}
            title={video.title || "Advertisement"}
            className="h-full w-full border-0"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin" // 👈 Add this line
        />
    );
}