// Modal Dialog Generator - Modals, dialogs, sheets, and drawers
import Anthropic from '@anthropic-ai/sdk';

class ModalDialogGenerator {
    private anthropic: Anthropic | null = null;

    generateModal(): string {
        return `import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode;
    title?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    closeOnOverlay?: boolean;
    closeOnEsc?: boolean;
}

export function Modal({ isOpen, onClose, children, title, size = 'md', closeOnOverlay = true, closeOnEsc = true }: ModalProps) {
    useEffect(() => {
        if (!closeOnEsc) return;
        const handleEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose, closeOnEsc]);

    useEffect(() => {
        if (isOpen) document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    const sizes = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-xl', full: 'max-w-full m-4' };

    if (typeof window === 'undefined') return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={closeOnOverlay ? onClose : undefined} />
                    <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: 'spring', damping: 25 }}
                        className={\`relative z-10 w-full \${sizes[size]} bg-white dark:bg-gray-800 rounded-xl shadow-2xl\`}>
                        {title && (
                            <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
                                <h2 className="text-lg font-semibold">{title}</h2>
                                <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">✕</button>
                            </div>
                        )}
                        <div className="p-4">{children}</div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}

// Hook for modal state
export function useModal(initialState = false) {
    const [isOpen, setIsOpen] = useState(initialState);
    const open = useCallback(() => setIsOpen(true), []);
    const close = useCallback(() => setIsOpen(false), []);
    const toggle = useCallback(() => setIsOpen(prev => !prev), []);
    return { isOpen, open, close, toggle };
}
`;
    }

    generateConfirmDialog(): string {
        return `import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

interface ConfirmDialogProps {
    isOpen: boolean;
    onConfirm: () => void | Promise<void>;
    onCancel: () => void;
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
}

export function ConfirmDialog({
    isOpen, onConfirm, onCancel, title = 'Confirm', message, confirmText = 'Confirm', cancelText = 'Cancel', variant = 'danger'
}: ConfirmDialogProps) {
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        setLoading(true);
        try { await onConfirm(); }
        finally { setLoading(false); }
    };

    const colors = {
        danger: 'bg-red-500 hover:bg-red-600',
        warning: 'bg-yellow-500 hover:bg-yellow-600',
        info: 'bg-blue-500 hover:bg-blue-600',
    };

    if (typeof window === 'undefined') return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/50" onClick={onCancel} />
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                        className="relative z-10 w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6">
                        <h3 className="text-lg font-semibold mb-2">{title}</h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-6">{message}</p>
                        <div className="flex gap-3 justify-end">
                            <button onClick={onCancel} disabled={loading}
                                className="px-4 py-2 rounded-lg border hover:bg-gray-100 dark:hover:bg-gray-700">{cancelText}</button>
                            <button onClick={handleConfirm} disabled={loading}
                                className={\`px-4 py-2 rounded-lg text-white \${colors[variant]} disabled:opacity-50\`}>
                                {loading ? '...' : confirmText}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}

// Hook for confirm dialog
export function useConfirm() {
    const [state, setState] = useState<{ isOpen: boolean; resolve: ((v: boolean) => void) | null }>({ isOpen: false, resolve: null });

    const confirm = useCallback((message: string) => new Promise<boolean>((resolve) => {
        setState({ isOpen: true, resolve });
    }), []);

    const handleConfirm = useCallback(() => { state.resolve?.(true); setState({ isOpen: false, resolve: null }); }, [state.resolve]);
    const handleCancel = useCallback(() => { state.resolve?.(false); setState({ isOpen: false, resolve: null }); }, [state.resolve]);

    return { confirm, isOpen: state.isOpen, onConfirm: handleConfirm, onCancel: handleCancel };
}
`;
    }

    generateSheet(): string {
        return `import { ReactNode, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

type SheetSide = 'left' | 'right' | 'top' | 'bottom';

interface SheetProps {
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode;
    side?: SheetSide;
    title?: string;
    size?: 'sm' | 'md' | 'lg';
}

export function Sheet({ isOpen, onClose, children, side = 'right', title, size = 'md' }: SheetProps) {
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    useEffect(() => {
        if (isOpen) document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    const sizes = { sm: '300px', md: '400px', lg: '600px' };
    const isHorizontal = side === 'left' || side === 'right';
    const dimension = isHorizontal ? { width: sizes[size] } : { height: sizes[size] };

    const variants = {
        left: { initial: { x: '-100%' }, animate: { x: 0 }, exit: { x: '-100%' } },
        right: { initial: { x: '100%' }, animate: { x: 0 }, exit: { x: '100%' } },
        top: { initial: { y: '-100%' }, animate: { y: 0 }, exit: { y: '-100%' } },
        bottom: { initial: { y: '100%' }, animate: { y: 0 }, exit: { y: '100%' } },
    };

    const positions = { left: 'left-0 top-0 h-full', right: 'right-0 top-0 h-full', top: 'top-0 left-0 w-full', bottom: 'bottom-0 left-0 w-full' };

    if (typeof window === 'undefined') return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/50" onClick={onClose} />
                    <motion.div {...variants[side]} transition={{ type: 'spring', damping: 30 }} style={dimension}
                        className={\`absolute \${positions[side]} bg-white dark:bg-gray-800 shadow-xl z-10\`}>
                        {title && (
                            <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
                                <h2 className="text-lg font-semibold">{title}</h2>
                                <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">✕</button>
                            </div>
                        )}
                        <div className="p-4 overflow-auto h-full">{children}</div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
`;
    }

    generateDrawer(): string {
        return `import { ReactNode, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { createPortal } from 'react-dom';

interface DrawerProps {
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode;
    title?: string;
    snapPoints?: number[];
}

export function Drawer({ isOpen, onClose, children, title, snapPoints = [0.5, 1] }: DrawerProps) {
    const constraintsRef = useRef<HTMLDivElement>(null);
    const dragControls = useDragControls();

    useEffect(() => {
        if (isOpen) document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    const handleDragEnd = (event: any, info: { velocity: { y: number }; point: { y: number } }) => {
        if (info.velocity.y > 500 || info.point.y > window.innerHeight * 0.8) {
            onClose();
        }
    };

    if (typeof window === 'undefined') return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50" ref={constraintsRef}>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/50" onClick={onClose} />
                    <motion.div
                        initial={{ y: '100%' }} animate={{ y: \`\${(1 - snapPoints[0]) * 100}%\` }} exit={{ y: '100%' }}
                        drag="y" dragControls={dragControls} dragConstraints={{ top: 0 }} dragElastic={0.2}
                        onDragEnd={handleDragEnd} transition={{ type: 'spring', damping: 30 }}
                        className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-800 rounded-t-2xl shadow-xl z-10 max-h-[90vh]">
                        <div className="flex justify-center py-2">
                            <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full cursor-grab"
                                onPointerDown={(e) => dragControls.start(e)} />
                        </div>
                        {title && <h2 className="text-lg font-semibold px-4 pb-2">{title}</h2>}
                        <div className="p-4 overflow-auto max-h-[calc(90vh-60px)]">{children}</div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
`;
    }
}

export const modalDialogGenerator = new ModalDialogGenerator();
