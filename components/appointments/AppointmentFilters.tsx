'use client';

import { Search, RefreshCw } from 'lucide-react';
import { KeyedMutator } from 'swr';
import type { Appointment } from '@/hooks/useAppointments';

interface AppointmentFiltersProps {
    searchQuery: string;
    setSearchQuery: (q: string) => void;
    statusFilter: string;
    setStatusFilter: (s: string) => void;
    dateFilter: string;
    setDateFilter: (d: string) => void;
    mutate: KeyedMutator<Appointment[]>;
}

const STATUSES = ['all', 'pending', 'confirmed', 'completed', 'cancelled'] as const;

export function AppointmentFilters({
    searchQuery, setSearchQuery,
    statusFilter, setStatusFilter,
    dateFilter, setDateFilter,
    mutate,
}: AppointmentFiltersProps) {
    return (
        <div className="clay-filter" style={{ padding: '18px 20px', marginBottom: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Search */}
                <div style={{ position: 'relative' }}>
                    <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9090B0', pointerEvents: 'none' }} />
                    <input
                        className="clay-search"
                        placeholder="Search by child or caregiver…"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        aria-label="Search appointments"
                        style={{ width: '100%', padding: '10px 14px 10px 40px', fontSize: 14, color: '#1E1B4B' }}
                    />
                </div>

                {/* Status pills + date + refresh */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
                    <div role="group" aria-label="Filter by status" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {STATUSES.map(s => (
                            <button key={s}
                                className={`clay-pill ${statusFilter === s ? 'clay-pill-active' : ''}`}
                                onClick={() => setStatusFilter(s)}
                                aria-pressed={statusFilter === s}
                                style={{
                                    padding: '6px 14px', fontSize: 12,
                                    background: statusFilter === s ? undefined : 'white',
                                    color: statusFilter === s ? undefined : '#4C4C72',
                                }}>
                                {s === 'all' ? '✦ All' : s.charAt(0).toUpperCase() + s.slice(1)}
                            </button>
                        ))}
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)}
                            className="clay-date"
                            aria-label="Filter by date"
                            style={{ padding: '8px 14px', fontSize: 13, color: '#1E1B4B', cursor: 'pointer' }} />
                        <button className="clay-refresh" onClick={() => mutate()}
                            aria-label="Refresh appointments"
                            style={{ width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#6366F1' }}>
                            <RefreshCw size={15} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
