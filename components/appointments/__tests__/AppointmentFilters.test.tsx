import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AppointmentFilters } from '../AppointmentFilters';

const defaultProps = {
    searchQuery: '',
    setSearchQuery: vi.fn(),
    statusFilter: 'all',
    setStatusFilter: vi.fn(),
    dateFilter: '',
    setDateFilter: vi.fn(),
    mutate: vi.fn(),
};

describe('AppointmentFilters', () => {
    it('renders search input with aria-label', () => {
        render(<AppointmentFilters {...defaultProps} />);
        expect(screen.getByLabelText('Search appointments')).toBeInTheDocument();
    });

    it('renders all status pills', () => {
        render(<AppointmentFilters {...defaultProps} />);
        expect(screen.getByText('✦ All')).toBeInTheDocument();
        expect(screen.getByText('Pending')).toBeInTheDocument();
        expect(screen.getByText('Confirmed')).toBeInTheDocument();
        expect(screen.getByText('Completed')).toBeInTheDocument();
        expect(screen.getByText('Cancelled')).toBeInTheDocument();
    });

    it('marks active status pill with aria-pressed', () => {
        render(<AppointmentFilters {...defaultProps} statusFilter="pending" />);
        expect(screen.getByText('Pending')).toHaveAttribute('aria-pressed', 'true');
        expect(screen.getByText('✦ All')).toHaveAttribute('aria-pressed', 'false');
    });

    it('calls setSearchQuery on input change', () => {
        const setSearchQuery = vi.fn();
        render(<AppointmentFilters {...defaultProps} setSearchQuery={setSearchQuery} />);
        fireEvent.change(screen.getByLabelText('Search appointments'), { target: { value: 'John' } });
        expect(setSearchQuery).toHaveBeenCalledWith('John');
    });

    it('calls setStatusFilter when a pill is clicked', () => {
        const setStatusFilter = vi.fn();
        render(<AppointmentFilters {...defaultProps} setStatusFilter={setStatusFilter} />);
        fireEvent.click(screen.getByText('Confirmed'));
        expect(setStatusFilter).toHaveBeenCalledWith('confirmed');
    });

    it('calls mutate when refresh button is clicked', () => {
        const mutate = vi.fn();
        render(<AppointmentFilters {...defaultProps} mutate={mutate} />);
        fireEvent.click(screen.getByLabelText('Refresh appointments'));
        expect(mutate).toHaveBeenCalled();
    });

    it('renders date filter with aria-label', () => {
        render(<AppointmentFilters {...defaultProps} />);
        expect(screen.getByLabelText('Filter by date')).toBeInTheDocument();
    });

    it('has status filter group with role="group"', () => {
        render(<AppointmentFilters {...defaultProps} />);
        expect(screen.getByRole('group', { name: 'Filter by status' })).toBeInTheDocument();
    });
});
