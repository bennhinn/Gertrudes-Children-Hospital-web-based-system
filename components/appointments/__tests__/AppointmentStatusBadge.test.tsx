import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppointmentStatusBadge, getStatus } from '../AppointmentStatusBadge';

describe('getStatus', () => {
    it('returns correct values for known statuses', () => {
        expect(getStatus('pending').color).toBe('#A16207');
        expect(getStatus('confirmed').color).toBe('#1D4ED8');
        expect(getStatus('completed').color).toBe('#15803D');
        expect(getStatus('cancelled').color).toBe('#BE123C');
        expect(getStatus('no-show').color).toBe('#475569');
    });

    it('returns fallback for unknown status', () => {
        const result = getStatus('unknown-status');
        expect(result.bg).toBe('#F1F5F9');
        expect(result.color).toBe('#475569');
    });
});

describe('AppointmentStatusBadge', () => {
    it('renders status text', () => {
        render(<AppointmentStatusBadge status="pending" />);
        expect(screen.getByText('pending')).toBeInTheDocument();
    });

    it('applies correct background color', () => {
        const { container } = render(<AppointmentStatusBadge status="confirmed" />);
        const badge = container.querySelector('.clay-status') as HTMLElement;
        expect(badge.style.background).toBe('rgb(219, 234, 254)'); // #DBEAFE
    });

    it('hides decorative icon from screen readers', () => {
        const { container } = render(<AppointmentStatusBadge status="pending" />);
        const iconSpan = container.querySelector('[aria-hidden="true"]');
        expect(iconSpan).toBeInTheDocument();
    });
});
