// components/ui/modal.tsx
import { ReactNode } from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode;
}

export function Modal({ isOpen, onClose, children }: ModalProps) {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-lg shadow-xl max-w-md w-full"
                onClick={(e) => e.stopPropagation()}
            >
                {children}
            </div>
        </div>
    );
}

interface ModalHeaderProps {
    children: ReactNode;
}

export function ModalHeader({ children }: ModalHeaderProps) {
    return (
        <div className="p-6 border-b border-slate-200">
            {children}
        </div>
    );
}

interface ModalTitleProps {
    children: ReactNode;
}

export function ModalTitle({ children }: ModalTitleProps) {
    return (
        <h2 className="text-xl font-bold text-slate-800">{children}</h2>
    );
}

interface ModalContentProps {
    children: ReactNode;
}

export function ModalContent({ children }: ModalContentProps) {
    return (
        <div className="p-6 space-y-4">
            {children}
        </div>
    );
}

interface ModalFooterProps {
    children: ReactNode;
    className?: string;
}

export function ModalFooter({ children, className = '' }: ModalFooterProps) {
    return (
        <div className={`p-6 border-t border-slate-200 flex justify-end gap-2 ${className}`}>
            {children}
        </div>
    );
}