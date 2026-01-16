"use client";

import React, { useEffect, useRef, useState } from 'react';
import AnimatedNumber from './animated-number';

type Props = {
    end: number;
    suffix?: string;
    label: string;
    delay?: number; // milliseconds to wait after visible
};

export default function StatCard({ end, suffix, label, delay = 0 }: Props) {
    const ref = useRef<HTMLDivElement | null>(null);
    const [visible, setVisible] = useState(false);
    const timeoutRef = useRef<number | null>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        let obs: IntersectionObserver | null = null;
        let scrollListener: (() => void) | null = null;

        const startIfIntersecting = (entry: IntersectionObserverEntry) => {
            if (!entry.isIntersecting) return;

            const trigger = () => {
                timeoutRef.current = window.setTimeout(() => setVisible(true), delay) as unknown as number;
                if (obs) obs.disconnect();
            };

            // If the page is at the top on initial load, defer start until user scrolls
            if (typeof window !== 'undefined' && window.scrollY === 0) {
                const checkOnScroll = () => {
                    const rect = el.getBoundingClientRect();
                    if (rect.top < window.innerHeight && rect.bottom > 0) {
                        trigger();
                        window.removeEventListener('scroll', checkOnScroll);
                        window.removeEventListener('touchstart', checkOnScroll);
                    }
                };

                scrollListener = checkOnScroll;
                window.addEventListener('scroll', checkOnScroll, { passive: true });
                window.addEventListener('touchstart', checkOnScroll, { passive: true });
                return;
            }

            trigger();
        };

        obs = new IntersectionObserver(
            (entries) => entries.forEach(startIfIntersecting),
            { threshold: 0.25 }
        );

        obs.observe(el);

        return () => {
            if (obs) obs.disconnect();
            if (scrollListener) {
                window.removeEventListener('scroll', scrollListener);
                window.removeEventListener('touchstart', scrollListener);
            }
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return (
        <div ref={ref} className="text-center">
            <p className="mb-2 text-4xl font-bold text-white md:text-5xl">
                {visible ? <AnimatedNumber value={end} /> : 0}
                {suffix ?? ''}
            </p>
            <p className="text-blue-100">{label}</p>
        </div>
    );
}
