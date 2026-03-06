import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAppointments } from '@/hooks/useAppointments';

// Mock SWR
vi.mock('swr', () => {
    return {
        default: vi.fn((key: string) => {
            if (key === '/api/admin/appointments') {
                return {
                    data: [
                        { id: '1', child_id: 'c1', caregiver_id: 'cg1', scheduled_for: '2025-06-15T10:00:00Z', status: 'pending', child: { full_name: 'Baby Alice' }, caregiver: { profiles: { full_name: 'Jane Doe' } } },
                        { id: '2', child_id: 'c2', caregiver_id: 'cg2', scheduled_for: '2025-06-16T14:00:00Z', status: 'confirmed', child: { full_name: 'Baby Bob' }, caregiver: { profiles: { full_name: 'John Doe' } } },
                        { id: '3', child_id: 'c3', caregiver_id: 'cg3', scheduled_for: '2025-07-01T09:00:00Z', status: 'completed', child: { full_name: 'Baby Carol' }, caregiver: { profiles: { full_name: 'Mary Smith' } } },
                    ],
                    error: undefined,
                    isLoading: false,
                    mutate: vi.fn(),
                };
            }
            return { data: [], error: undefined, isLoading: false, mutate: vi.fn() };
        }),
    };
});

describe('useAppointments', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns all appointments when no filters are set', () => {
        const { result } = renderHook(() => useAppointments());
        expect(result.current.appointments).toHaveLength(3);
    });

    it('computes correct stats', () => {
        const { result } = renderHook(() => useAppointments());
        expect(result.current.stats).toEqual({
            total: 3,
            pending: 1,
            confirmed: 1,
            completed: 1,
        });
    });

    it('filters by status', () => {
        const { result } = renderHook(() => useAppointments());
        act(() => { result.current.setStatusFilter('pending'); });
        expect(result.current.appointments).toHaveLength(1);
        expect(result.current.appointments[0].status).toBe('pending');
    });

    it('filters by date', () => {
        const { result } = renderHook(() => useAppointments());
        act(() => { result.current.setDateFilter('2025-06-15'); });
        expect(result.current.appointments).toHaveLength(1);
        expect(result.current.appointments[0].child.full_name).toBe('Baby Alice');
    });

    it('filters by search (debounced)', async () => {
        const { result } = renderHook(() => useAppointments());
        act(() => { result.current.setSearchQuery('Bob'); });
        // Before debounce, should still show all (debounce delay is 300ms)
        // After waiting for debounce
        await waitFor(() => {
            expect(result.current.appointments).toHaveLength(1);
        }, { timeout: 500 });
        expect(result.current.appointments[0].child.full_name).toBe('Baby Bob');
    });

    it('combines status and date filters', () => {
        const { result } = renderHook(() => useAppointments());
        act(() => {
            result.current.setStatusFilter('confirmed');
            result.current.setDateFilter('2025-06-16');
        });
        expect(result.current.appointments).toHaveLength(1);
        expect(result.current.appointments[0].id).toBe('2');
    });

    it('returns empty array when nothing matches', () => {
        const { result } = renderHook(() => useAppointments());
        act(() => { result.current.setDateFilter('2099-01-01'); });
        expect(result.current.appointments).toHaveLength(0);
    });

    it('defaults statusFilter to "all"', () => {
        const { result } = renderHook(() => useAppointments());
        expect(result.current.statusFilter).toBe('all');
    });
});
