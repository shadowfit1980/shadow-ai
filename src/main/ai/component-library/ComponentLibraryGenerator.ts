// Component Library Generator - Generate reusable UI component libraries
import Anthropic from '@anthropic-ai/sdk';

class ComponentLibraryGenerator {
    private anthropic: Anthropic | null = null;

    generateButtonComponent(): string {
        return `import React, { forwardRef } from 'react';
import './Button.css';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ variant = 'primary', size = 'md', isLoading, leftIcon, rightIcon, children, disabled, className = '', ...props }, ref) => {
        return (
            <button
                ref={ref}
                className={\`btn btn-\${variant} btn-\${size} \${isLoading ? 'loading' : ''} \${className}\`}
                disabled={disabled || isLoading}
                {...props}
            >
                {isLoading && <span className="spinner" />}
                {leftIcon && <span className="btn-icon left">{leftIcon}</span>}
                <span className="btn-content">{children}</span>
                {rightIcon && <span className="btn-icon right">{rightIcon}</span>}
            </button>
        );
    }
);

Button.displayName = 'Button';
`;
    }

    generateInputComponent(): string {
        return `import React, { forwardRef } from 'react';
import './Input.css';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
    leftElement?: React.ReactNode;
    rightElement?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, helperText, leftElement, rightElement, className = '', id, ...props }, ref) => {
        const inputId = id || \`input-\${Math.random().toString(36).slice(2)}\`;
        
        return (
            <div className={\`input-wrapper \${error ? 'has-error' : ''} \${className}\`}>
                {label && <label htmlFor={inputId} className="input-label">{label}</label>}
                <div className="input-container">
                    {leftElement && <span className="input-element left">{leftElement}</span>}
                    <input ref={ref} id={inputId} className="input-field" {...props} />
                    {rightElement && <span className="input-element right">{rightElement}</span>}
                </div>
                {error && <span className="input-error">{error}</span>}
                {helperText && !error && <span className="input-helper">{helperText}</span>}
            </div>
        );
    }
);

Input.displayName = 'Input';
`;
    }

    generateModalComponent(): string {
        return `import React, { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import './Modal.css';

export interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    closeOnOverlay?: boolean;
    closeOnEsc?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
    isOpen, onClose, title, children, size = 'md', closeOnOverlay = true, closeOnEsc = true
}) => {
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (closeOnEsc && e.key === 'Escape') onClose();
    }, [closeOnEsc, onClose]);

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isOpen, handleKeyDown]);

    if (!isOpen) return null;

    return createPortal(
        <div className="modal-overlay" onClick={closeOnOverlay ? onClose : undefined}>
            <div className={\`modal modal-\${size}\`} onClick={e => e.stopPropagation()}>
                {title && (
                    <div className="modal-header">
                        <h2>{title}</h2>
                        <button className="modal-close" onClick={onClose}>&times;</button>
                    </div>
                )}
                <div className="modal-body">{children}</div>
            </div>
        </div>,
        document.body
    );
};
`;
    }

    generateSelectComponent(): string {
        return `import React, { useState, useRef, useEffect } from 'react';
import './Select.css';

export interface SelectOption { value: string; label: string; disabled?: boolean; }

export interface SelectProps {
    options: SelectOption[];
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    label?: string;
    error?: string;
    disabled?: boolean;
    searchable?: boolean;
}

export const Select: React.FC<SelectProps> = ({
    options, value, onChange, placeholder = 'Select...', label, error, disabled, searchable
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const ref = useRef<HTMLDivElement>(null);

    const selected = options.find(o => o.value === value);
    const filtered = searchable ? options.filter(o => o.label.toLowerCase().includes(search.toLowerCase())) : options;

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    return (
        <div ref={ref} className={\`select-wrapper \${disabled ? 'disabled' : ''} \${error ? 'has-error' : ''}\`}>
            {label && <label className="select-label">{label}</label>}
            <div className="select-trigger" onClick={() => !disabled && setIsOpen(!isOpen)}>
                <span className={selected ? '' : 'placeholder'}>{selected?.label || placeholder}</span>
                <span className="select-arrow">▼</span>
            </div>
            {isOpen && (
                <div className="select-dropdown">
                    {searchable && <input className="select-search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." />}
                    {filtered.map(opt => (
                        <div key={opt.value} className={\`select-option \${opt.disabled ? 'disabled' : ''} \${opt.value === value ? 'selected' : ''}\`}
                            onClick={() => { if (!opt.disabled) { onChange?.(opt.value); setIsOpen(false); } }}>
                            {opt.label}
                        </div>
                    ))}
                </div>
            )}
            {error && <span className="select-error">{error}</span>}
        </div>
    );
};
`;
    }

    generateToastComponent(): string {
        return `import React, { createContext, useContext, useState, useCallback } from 'react';
import './Toast.css';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast { id: string; message: string; type: ToastType; duration?: number; }

interface ToastContextType { toast: (message: string, type?: ToastType, duration?: number) => void; }

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within ToastProvider');
    return ctx;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const toast = useCallback((message: string, type: ToastType = 'info', duration = 3000) => {
        const id = Math.random().toString(36).slice(2);
        setToasts(prev => [...prev, { id, message, type, duration }]);
        if (duration > 0) setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
    }, []);

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}
            <div className="toast-container">
                {toasts.map(t => (
                    <div key={t.id} className={\`toast toast-\${t.type}\`}>
                        <span>{t.message}</span>
                        <button onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}>&times;</button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};
`;
    }
}

export const componentLibraryGenerator = new ComponentLibraryGenerator();
