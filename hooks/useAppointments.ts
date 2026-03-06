import useSWR from 'swr';
import { useState, useMemo, useEffect } from 'react';

const fetcher = (url: string) => fetch(url).then((res) => {
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
});

function useDebounce(value: string, delay: number) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);
    return debouncedValue;
}

export interface Appointment {
    id: string;
    child_id: string;
    caregiver_id: string;
    doctor_id?: string;
    scheduled_for: string;
    status: string;
    notes?: string;
    child: { full_name: string };
    caregiver?: { profiles: { full_name: string } };
    doctor?: { profiles: { full_name: string } };
}

export interface Child { id: string; full_name: string; }
export interface Caregiver { id: string; profiles: { full_name: string }; }
export interface Doctor { user_id: string; profiles: { full_name: string }; }

export function useAppointments() {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('');
    const debouncedSearch = useDebounce(searchQuery, 300);

    const { data: appointments, error, isLoading, mutate } = useSWR<Appointment[]>('/api/admin/appointments', fetcher);
    const { data: children } = useSWR<Child[]>('/api/admin/children', fetcher);
    const { data: caregivers } = useSWR<Caregiver[]>('/api/admin/caregivers', fetcher);
    const { data: doctors } = useSWR<Doctor[]>('/api/admin/doctors', fetcher);

    const filteredAppointments = useMemo(() =>
        appointments?.filter((apt) => {
            const query = debouncedSearch.toLowerCase();
            const matchesSearch =
                apt.child?.full_name?.toLowerCase().includes(query) ||
                apt.caregiver?.profiles?.full_name?.toLowerCase().includes(query);
            const matchesStatus = statusFilter === 'all' || apt.status === statusFilter;
            const matchesDate = !dateFilter || apt.scheduled_for?.startsWith(dateFilter);
            return matchesSearch && matchesStatus && matchesDate;
        }) || [],
        [appointments, debouncedSearch, statusFilter, dateFilter]
    );

    const stats = useMemo(() => ({
        total: appointments?.length || 0,
        pending: appointments?.filter(a => a.status === 'pending').length || 0,
        confirmed: appointments?.filter(a => a.status === 'confirmed').length || 0,
        completed: appointments?.filter(a => a.status === 'completed').length || 0,
    }), [appointments]);

    return {
        appointments: filteredAppointments,
        stats,
        error,
        isLoading,
        mutate,
        children,
        caregivers,
        doctors,
        searchQuery, setSearchQuery,
        statusFilter, setStatusFilter,
        dateFilter, setDateFilter,
    };
}
