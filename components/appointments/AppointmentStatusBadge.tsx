'use client';

import React from 'react';
import { Calendar, Clock, CheckCircle2, XCircle, PartyPopper, Ban } from 'lucide-react';

const statusConfig: Record<string, { bg: string; color: string; icon: React.ReactNode }> = {
    pending:   { bg: '#FEF9C3', color: '#A16207', icon: <Clock size={11} /> },
    confirmed: { bg: '#DBEAFE', color: '#1D4ED8', icon: <CheckCircle2 size={11} /> },
    completed: { bg: '#DCFCE7', color: '#15803D', icon: <PartyPopper size={11} /> },
    cancelled: { bg: '#FFE4E6', color: '#BE123C', icon: <XCircle size={11} /> },
    'no-show': { bg: '#F1F5F9', color: '#475569', icon: <Ban size={11} /> },
};

export function getStatus(s: string) {
    return statusConfig[s] || { bg: '#F1F5F9', color: '#475569', icon: <Calendar size={11} /> };
}

interface AppointmentStatusBadgeProps {
    status: string;
}

export function AppointmentStatusBadge({ status }: AppointmentStatusBadgeProps) {
    const st = getStatus(status);
    return (
        <span className="clay-status" style={{ background: st.bg, color: st.color }}>
            <span aria-hidden="true">{st.icon}</span> {status}
        </span>
    );
}
