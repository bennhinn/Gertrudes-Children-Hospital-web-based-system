import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AppointmentsTable } from '../AppointmentsTable';
import type { Appointment } from '@/hooks/useAppointments';

const mockAppointments: Appointment[] = [
    {
        id: '1',
        child_id: 'c1',
        caregiver_id: 'cg1',
        doctor_id: 'd1',
        scheduled_for: '2025-06-15T10:00:00Z',
        status: 'pending',
        child: { full_name: 'Baby Alice' },
        caregiver: { profiles: { full_name: 'Jane Doe' } },
        doctor: { profiles: { full_name: 'Dr. Smith' } },
    },
    {
        id: '2',
        child_id: 'c2',
        caregiver_id: 'cg2',
        scheduled_for: '2025-06-16T14:00:00Z',
        status: 'confirmed',
        child: { full_name: 'Baby Bob' },
        caregiver: { profiles: { full_name: 'John Doe' } },
    },
];

const defaultProps = {
    appointments: mockAppointments,
    isLoading: false,
    onView: vi.fn(),
    onEdit: vi.fn(),
};

describe('AppointmentsTable', () => {
    it('renders the appointment count badge', () => {
        render(<AppointmentsTable {...defaultProps} />);
        expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('renders child names', () => {
        render(<AppointmentsTable {...defaultProps} />);
        // Mobile cards (visible by default since no CSS media query in test env)
        expect(screen.getAllByText('Baby Alice').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('Baby Bob').length).toBeGreaterThanOrEqual(1);
    });

    it('shows loading skeletons when isLoading is true', () => {
        render(<AppointmentsTable {...defaultProps} isLoading={true} />);
        expect(screen.getByRole('status')).toBeInTheDocument();
        expect(screen.getByLabelText('Loading appointments')).toBeInTheDocument();
    });

    it('shows empty state when no appointments', () => {
        render(<AppointmentsTable {...defaultProps} appointments={[]} />);
        expect(screen.getByText('No appointments found')).toBeInTheDocument();
        expect(screen.getByText('Try adjusting your filters')).toBeInTheDocument();
    });

    it('calls onView when View button is clicked', () => {
        const onView = vi.fn();
        render(<AppointmentsTable {...defaultProps} onView={onView} />);
        const viewButtons = screen.getAllByText('View');
        fireEvent.click(viewButtons[0]);
        expect(onView).toHaveBeenCalledWith(mockAppointments[0]);
    });

    it('calls onEdit when Edit button is clicked', () => {
        const onEdit = vi.fn();
        render(<AppointmentsTable {...defaultProps} onEdit={onEdit} />);
        const editButtons = screen.getAllByText('Edit');
        fireEvent.click(editButtons[0]);
        expect(onEdit).toHaveBeenCalledWith(mockAppointments[0]);
    });

    it('View buttons have accessible labels', () => {
        render(<AppointmentsTable {...defaultProps} />);
        expect(screen.getAllByLabelText('View appointment for Baby Alice').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByLabelText('View appointment for Baby Bob').length).toBeGreaterThanOrEqual(1);
    });

    it('Edit buttons have accessible labels', () => {
        render(<AppointmentsTable {...defaultProps} />);
        expect(screen.getAllByLabelText('Edit appointment for Baby Alice').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByLabelText('Edit appointment for Baby Bob').length).toBeGreaterThanOrEqual(1);
    });

    it('renders table headers with scope="col" in desktop table', () => {
        const { container } = render(<AppointmentsTable {...defaultProps} />);
        // Desktop table is hidden via display:none (toggled by CSS media query),
        // so we query the DOM directly rather than by ARIA role.
        const headers = container.querySelectorAll('th[scope="col"]');
        expect(headers.length).toBe(6); // Child, Caregiver, Doctor, Date & Time, Status, Actions
    });
});
