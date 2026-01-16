"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
    value: number;
    duration?: number;
    formatter?: (n: number) => string;
};

export default function AnimatedNumber({ value, duration = 1500, formatter }: Props) {
    const [current, setCurrent] = useState(0);
    const rafRef = useRef<number | null>(null);
    const startRef = useRef<number | null>(null);

    useEffect(() => {
        const step = (timestamp: number) => {
            if (startRef.current === null) startRef.current = timestamp;
            const progress = Math.min((timestamp - (startRef.current || 0)) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCurrent(Math.round(eased * value));
            if (progress < 1) {
                rafRef.current = requestAnimationFrame(step);
            }
        };

        rafRef.current = requestAnimationFrame(step);

        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            startRef.current = null;
        };
    }, [value, duration]);

    return <span>{formatter ? formatter(current) : current}</span>;
}
