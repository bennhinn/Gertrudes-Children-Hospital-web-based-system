// components/ui/label.tsx
import { ReactNode, LabelHTMLAttributes } from 'react';

interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
    children: ReactNode;
    className?: string;
}

export function Label({ children, className = '', ...props }: LabelProps) {
    return (
        <label
            className={`block text-sm font-medium text-slate-700 mb-1 ${className}`}
            {...props}
        >
            {children}
        </label>
    );
}