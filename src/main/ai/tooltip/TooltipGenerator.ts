// Tooltip Generator - Tooltips, popovers, and hints
import Anthropic from '@anthropic-ai/sdk';

class TooltipGenerator {
    private anthropic: Anthropic | null = null;

    generateTooltip(): string {
        return `import { useState, useRef, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

interface TooltipProps {
    content: ReactNode;
    children: ReactNode;
    position?: TooltipPosition;
    delay?: number;
    className?: string;
}

export function Tooltip({ content, children, position = 'top', delay = 200, className = '' }: TooltipProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [coords, setCoords] = useState({ x: 0, y: 0 });
    const triggerRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<NodeJS.Timeout>();

    const showTooltip = () => {
        timeoutRef.current = setTimeout(() => {
            if (triggerRef.current) {
                const rect = triggerRef.current.getBoundingClientRect();
                const positions = {
                    top: { x: rect.left + rect.width / 2, y: rect.top - 8 },
                    bottom: { x: rect.left + rect.width / 2, y: rect.bottom + 8 },
                    left: { x: rect.left - 8, y: rect.top + rect.height / 2 },
                    right: { x: rect.right + 8, y: rect.top + rect.height / 2 },
                };
                setCoords(positions[position]);
                setIsVisible(true);
            }
        }, delay);
    };

    const hideTooltip = () => {
        clearTimeout(timeoutRef.current);
        setIsVisible(false);
    };

    useEffect(() => () => clearTimeout(timeoutRef.current), []);

    const transforms = { top: 'translate(-50%, -100%)', bottom: 'translate(-50%, 0)', left: 'translate(-100%, -50%)', right: 'translate(0, -50%)' };

    return (
        <>
            <div ref={triggerRef} onMouseEnter={showTooltip} onMouseLeave={hideTooltip} className="inline-block">{children}</div>
            {typeof window !== 'undefined' && createPortal(
                <AnimatePresence>
                    {isVisible && (
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                            className={\`fixed z-50 px-3 py-2 text-sm bg-gray-900 text-white rounded-lg shadow-lg max-w-xs \${className}\`}
                            style={{ left: coords.x, top: coords.y, transform: transforms[position] }}>
                            {content}
                            <div className={\`absolute w-2 h-2 bg-gray-900 transform rotate-45 \${
                                position === 'top' ? 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2' :
                                position === 'bottom' ? 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2' :
                                position === 'left' ? 'right-0 top-1/2 translate-x-1/2 -translate-y-1/2' :
                                'left-0 top-1/2 -translate-x-1/2 -translate-y-1/2'
                            }\`} />
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    );
}
`;
    }

    generatePopover(): string {
        return `import { useState, useRef, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

interface PopoverProps {
    trigger: ReactNode;
    content: ReactNode;
    position?: 'top' | 'bottom' | 'left' | 'right';
    triggerOn?: 'click' | 'hover';
    className?: string;
    onOpenChange?: (open: boolean) => void;
}

export function Popover({ trigger, content, position = 'bottom', triggerOn = 'click', className = '', onOpenChange }: PopoverProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [coords, setCoords] = useState({ x: 0, y: 0 });
    const triggerRef = useRef<HTMLDivElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);

    const updatePosition = () => {
        if (!triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        const positions = {
            top: { x: rect.left + rect.width / 2, y: rect.top - 8 },
            bottom: { x: rect.left + rect.width / 2, y: rect.bottom + 8 },
            left: { x: rect.left - 8, y: rect.top + rect.height / 2 },
            right: { x: rect.right + 8, y: rect.top + rect.height / 2 },
        };
        setCoords(positions[position]);
    };

    const toggle = () => { setIsOpen(!isOpen); onOpenChange?.(!isOpen); };
    const open = () => { setIsOpen(true); onOpenChange?.(true); };
    const close = () => { setIsOpen(false); onOpenChange?.(false); };

    useEffect(() => {
        if (isOpen) updatePosition();
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (!triggerRef.current?.contains(e.target as Node) && !popoverRef.current?.contains(e.target as Node)) close();
        };
        if (isOpen && triggerOn === 'click') document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, triggerOn]);

    const transforms = { top: 'translate(-50%, -100%)', bottom: 'translate(-50%, 0)', left: 'translate(-100%, -50%)', right: 'translate(0, -50%)' };

    return (
        <>
            <div ref={triggerRef} onClick={triggerOn === 'click' ? toggle : undefined}
                onMouseEnter={triggerOn === 'hover' ? open : undefined} onMouseLeave={triggerOn === 'hover' ? close : undefined}
                className="inline-block">{trigger}</div>
            {typeof window !== 'undefined' && createPortal(
                <AnimatePresence>
                    {isOpen && (
                        <motion.div ref={popoverRef} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                            className={\`fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl border dark:border-gray-700 \${className}\`}
                            style={{ left: coords.x, top: coords.y, transform: transforms[position] }}>
                            {content}
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    );
}
`;
    }

    generateInfoHint(): string {
        return `import { ReactNode } from 'react';
import { Tooltip } from './Tooltip';

interface InfoHintProps {
    content: ReactNode;
    icon?: ReactNode;
    className?: string;
}

export function InfoHint({ content, icon, className = '' }: InfoHintProps) {
    return (
        <Tooltip content={content} position="top">
            <span className={\`inline-flex items-center justify-center w-4 h-4 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 cursor-help \${className}\`}>
                {icon || (
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                )}
            </span>
        </Tooltip>
    );
}

// Label with hint
export function LabelWithHint({ label, hint, required, className = '' }: { label: string; hint: ReactNode; required?: boolean; className?: string }) {
    return (
        <div className={\`flex items-center gap-1 \${className}\`}>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
            {required && <span className="text-red-500">*</span>}
            <InfoHint content={hint} />
        </div>
    );
}
`;
    }

    generateHoverCard(): string {
        return `import { useState, useRef, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

interface HoverCardProps {
    trigger: ReactNode;
    children: ReactNode;
    openDelay?: number;
    closeDelay?: number;
    className?: string;
}

export function HoverCard({ trigger, children, openDelay = 300, closeDelay = 200, className = '' }: HoverCardProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const triggerRef = useRef<HTMLDivElement>(null);
    const openTimer = useRef<NodeJS.Timeout>();
    const closeTimer = useRef<NodeJS.Timeout>();

    const handleEnter = () => {
        clearTimeout(closeTimer.current);
        openTimer.current = setTimeout(() => {
            if (triggerRef.current) {
                const rect = triggerRef.current.getBoundingClientRect();
                setPosition({ x: rect.left + rect.width / 2, y: rect.bottom + 8 });
                setIsOpen(true);
            }
        }, openDelay);
    };

    const handleLeave = () => {
        clearTimeout(openTimer.current);
        closeTimer.current = setTimeout(() => setIsOpen(false), closeDelay);
    };

    return (
        <>
            <div ref={triggerRef} onMouseEnter={handleEnter} onMouseLeave={handleLeave} className="inline-block">{trigger}</div>
            {typeof window !== 'undefined' && createPortal(
                <AnimatePresence>
                    {isOpen && (
                        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                            onMouseEnter={() => clearTimeout(closeTimer.current)} onMouseLeave={handleLeave}
                            className={\`fixed z-50 w-72 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-xl border dark:border-gray-700 \${className}\`}
                            style={{ left: position.x, top: position.y, transform: 'translateX(-50%)' }}>
                            {children}
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    );
}
`;
    }
}

export const tooltipGenerator = new TooltipGenerator();
