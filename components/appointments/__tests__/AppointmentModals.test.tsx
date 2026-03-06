import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ViewAppointmentModal, EditAppointmentModal, AddAppointmentModal } from '../AppointmentModals';
import type { Appointment } from '@/hooks/useAppointments';

const mockAppointment: Appointment = {
    id: '1',
    child_id: 'c1',
    caregiver_id: 'cg1',
    doctor_id: 'd1',
    scheduled_for: '2025-06-15T10:00:00Z',
    status: 'confirmed',
    notes: 'Check-up scheduled',
    child: { full_name: 'Baby Alice' },
    caregiver: { profiles: { full_name: 'Jane Doe' } },
    doctor: { profiles: { full_name: 'Dr. Smith' } },
};

const emptyForm = { child_id: '', caregiver_id: '', doctor_id: '', scheduled_for: '', status: 'pending', notes: '' };

const mockChildren = [{ id: 'c1', full_name: 'Baby Alice' }];
const mockCaregivers = [{ id: 'cg1', profiles: { full_name: 'Jane Doe' } }];
const mockDoctors = [{ user_id: 'd1', profiles: { full_name: 'Dr. Smith' } }];

describe('ViewAppointmentModal', () => {
    it('renders nothing when appointment is null', () => {
        const { container } = render(<ViewAppointmentModal appointment={null} onClose={vi.fn()} />);
        expect(container.innerHTML).toBe('');
    });

    it('renders appointment details when open', () => {
        render(<ViewAppointmentModal appointment={mockAppointment} onClose={vi.fn()} />);
        expect(screen.getByText('Appointment Details')).toBeInTheDocument();
        expect(screen.getByText('Baby Alice')).toBeInTheDocument();
        expect(screen.getByText('Jane Doe')).toBeInTheDocument();
        expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
        expect(screen.getByText('confirmed')).toBeInTheDocument();
        expect(screen.getByText('Check-up scheduled')).toBeInTheDocument();
    });

    it('calls onClose when Close button is clicked', () => {
        const onClose = vi.fn();
        render(<ViewAppointmentModal appointment={mockAppointment} onClose={onClose} />);
        fireEvent.click(screen.getByText('Close'));
        expect(onClose).toHaveBeenCalled();
    });
});

describe('EditAppointmentModal', () => {
    it('renders nothing when appointment is null', () => {
        const { container } = render(
            <EditAppointmentModal
                appointment={null} form={emptyForm} setForm={vi.fn()}
                isSaving={false} onSave={vi.fn()} onClose={vi.fn()}
                children={mockChildren} caregivers={mockCaregivers} doctors={mockDoctors}
            />
        );
        expect(container.innerHTML).toBe('');
    });

    it('renders edit form when open with proper labels', () => {
        render(
            <EditAppointmentModal
                appointment={mockAppointment} form={emptyForm} setForm={vi.fn()}
                isSaving={false} onSave={vi.fn()} onClose={vi.fn()}
                children={mockChildren} caregivers={mockCaregivers} doctors={mockDoctors}
            />
        );
        expect(screen.getByText('Edit Appointment')).toBeInTheDocument();
        expect(screen.getByText('Child')).toBeInTheDocument();
        expect(screen.getByText('Caregiver')).toBeInTheDocument();
        expect(screen.getByText('Doctor')).toBeInTheDocument();
    });

    it('disables save button when isSaving', () => {
        render(
            <EditAppointmentModal
                appointment={mockAppointment} form={emptyForm} setForm={vi.fn()}
                isSaving={true} onSave={vi.fn()} onClose={vi.fn()}
                children={mockChildren} caregivers={mockCaregivers} doctors={mockDoctors}
            />
        );
        expect(screen.getByText('⏳ Saving…')).toBeDisabled();
    });

    it('calls onSave when save is clicked', () => {
        const onSave = vi.fn();
        render(
            <EditAppointmentModal
                appointment={mockAppointment} form={emptyForm} setForm={vi.fn()}
                isSaving={false} onSave={onSave} onClose={vi.fn()}
                children={mockChildren} caregivers={mockCaregivers} doctors={mockDoctors}
            />
        );
        fireEvent.click(screen.getByText('💾 Save Changes'));
        expect(onSave).toHaveBeenCalled();
    });
});

describe('AddAppointmentModal', () => {
    it('renders nothing when closed', () => {
        const { container } = render(
            <AddAppointmentModal
                isOpen={false} form={emptyForm} setForm={vi.fn()}
                isSaving={false} onSave={vi.fn()} onClose={vi.fn()}
                children={mockChildren} caregivers={mockCaregivers} doctors={mockDoctors}
            />
        );
        expect(container.innerHTML).toBe('');
    });

    it('renders add form when open', () => {
        render(
            <AddAppointmentModal
                isOpen={true} form={emptyForm} setForm={vi.fn()}
                isSaving={false} onSave={vi.fn()} onClose={vi.fn()}
                children={mockChildren} caregivers={mockCaregivers} doctors={mockDoctors}
            />
        );
        expect(screen.getByText('New Appointment')).toBeInTheDocument();
    });

    it('calls onSave when create is clicked', () => {
        const onSave = vi.fn();
        render(
            <AddAppointmentModal
                isOpen={true} form={emptyForm} setForm={vi.fn()}
                isSaving={false} onSave={onSave} onClose={vi.fn()}
                children={mockChildren} caregivers={mockCaregivers} doctors={mockDoctors}
            />
        );
        fireEvent.click(screen.getByText('✅ Create Appointment'));
        expect(onSave).toHaveBeenCalled();
    });

    it('shows creating state when saving', () => {
        render(
            <AddAppointmentModal
                isOpen={true} form={emptyForm} setForm={vi.fn()}
                isSaving={true} onSave={vi.fn()} onClose={vi.fn()}
                children={mockChildren} caregivers={mockCaregivers} doctors={mockDoctors}
            />
        );
        expect(screen.getByText('⏳ Creating…')).toBeDisabled();
    });
});
