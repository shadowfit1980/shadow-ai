/**
 * Accessibility Generator
 * 
 * Generate WCAG-compliant components, ARIA attributes,
 * keyboard navigation, and accessibility testing utilities.
 */

import { EventEmitter } from 'events';

// ============================================================================
// ACCESSIBILITY GENERATOR
// ============================================================================

export class AccessibilityGenerator extends EventEmitter {
    private static instance: AccessibilityGenerator;

    private constructor() {
        super();
    }

    static getInstance(): AccessibilityGenerator {
        if (!AccessibilityGenerator.instance) {
            AccessibilityGenerator.instance = new AccessibilityGenerator();
        }
        return AccessibilityGenerator.instance;
    }

    // ========================================================================
    // ACCESSIBLE COMPONENTS
    // ========================================================================

    generateAccessibleComponents(): string {
        return `import { useState, useRef, useEffect } from 'react';

// ============================================================================
// ACCESSIBLE BUTTON
// ============================================================================

export function AccessibleButton({
    children,
    onClick,
    disabled = false,
    variant = 'primary',
    ariaLabel,
}: {
    children: React.ReactNode;
    onClick: () => void;
    disabled?: boolean;
    variant?: 'primary' | 'secondary';
    ariaLabel?: string;
}) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            aria-label={ariaLabel}
            aria-disabled={disabled}
            className={\`btn btn-\${variant}\`}
            type="button"
        >
            {children}
        </button>
    );
}

// ============================================================================
// ACCESSIBLE MODAL
// ============================================================================

export function AccessibleModal({
    isOpen,
    onClose,
    title,
    children,
}: {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}) {
    const modalRef = useRef<HTMLDivElement>(null);
    const previousFocus = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (isOpen) {
            previousFocus.current = document.activeElement as HTMLElement;
            modalRef.current?.focus();
        } else if (previousFocus.current) {
            previousFocus.current.focus();
        }
    }, [isOpen]);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="modal-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            <div
                ref={modalRef}
                className="modal-content"
                tabIndex={-1}
            >
                <div className="modal-header">
                    <h2 id="modal-title">{title}</h2>
                    <button
                        onClick={onClose}
                        aria-label="Close modal"
                        className="close-button"
                    >
                        ×
                    </button>
                </div>
                <div className="modal-body">{children}</div>
            </div>
        </div>
    );
}

// ============================================================================
// ACCESSIBLE FORM
// ============================================================================

export function AccessibleForm() {
    const [errors, setErrors] = useState<Record<string, string>>({});

    return (
        <form aria-label="User registration form">
            <div className="form-group">
                <label htmlFor="username">
                    Username <span aria-label="required">*</span>
                </label>
                <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    aria-required="true"
                    aria-invalid={!!errors.username}
                    aria-describedby={errors.username ? 'username-error' : undefined}
                />
                {errors.username && (
                    <span id="username-error" className="error" role="alert">
                        {errors.username}
                    </span>
                )}
            </div>

            <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                    id="email"
                    name="email"
                    type="email"
                    aria-describedby="email-hint"
                />
                <span id="email-hint" className="hint">
                    We'll never share your email
                </span>
            </div>

            <button type="submit">Submit</button>
        </form>
    );
}
`;
    }

    // ========================================================================
    // KEYBOARD NAVIGATION
    // ========================================================================

    generateKeyboardNavigation(): string {
        return `import { useEffect, useRef, useState } from 'react';

// ============================================================================
// KEYBOARD NAVIGATION HOOK
// ============================================================================

export function useKeyboardNavigation(
    items: any[],
    onSelect: (item: any) => void
) {
    const [activeIndex, setActiveIndex] = useState(0);
    const itemRefs = useRef<(HTMLElement | null)[]>([]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    setActiveIndex(prev => 
                        prev < items.length - 1 ? prev + 1 : prev
                    );
                    break;

                case 'ArrowUp':
                    e.preventDefault();
                    setActiveIndex(prev => prev > 0 ? prev - 1 : prev);
                    break;

                case 'Home':
                    e.preventDefault();
                    setActiveIndex(0);
                    break;

                case 'End':
                    e.preventDefault();
                    setActiveIndex(items.length - 1);
                    break;

                case 'Enter':
                case ' ':
                    e.preventDefault();
                    onSelect(items[activeIndex]);
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [items, activeIndex, onSelect]);

    useEffect(() => {
        itemRefs.current[activeIndex]?.focus();
    }, [activeIndex]);

    return { activeIndex, itemRefs };
}

// ============================================================================
// SKIP LINK
// ============================================================================

export function SkipLink() {
    return (
        <a
            href="#main-content"
            className="skip-link"
            style={{
                position: 'absolute',
                left: '-9999px',
                ':focus': {
                    position: 'static',
                },
            }}
        >
            Skip to main content
        </a>
    );
}

// ============================================================================
// FOCUS TRAP
// ============================================================================

export function useFocusTrap (containerRef: React.RefObject<HTMLElement>) {
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const focusableElements = container.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        const handleTabKey = (e: KeyboardEvent) => {
            if (e.key !== 'Tab') return;

            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                }
            } else {
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        };

        container.addEventListener('keydown', handleTabKey as any);
        return () => container.removeEventListener('keydown', handleTabKey as any);
    }, [containerRef]);
}
`;
    }

    // ========================================================================
    // SCREEN READER UTILITIES
    // ========================================================================

    generateScreenReaderUtils(): string {
        return `// ============================================================================
// SCREEN READER ANNOUNCEMENTS
// ============================================================================

export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    setTimeout(() => {
        document.body.removeChild(announcement);
    }, 1000);
}

// ============================================================================
// VISUALLY HIDDEN TEXT
// ============================================================================

export function VisuallyHidden({ children }: { children: React.ReactNode }) {
    return (
        <span
            style={{
                position: 'absolute',
                width: '1px',
                height: '1px',
                padding: 0,
                margin: '-1px',
                overflow: 'hidden',
                clip: 'rect(0, 0, 0, 0)',
                whiteSpace: 'nowrap',
                border: 0,
            }}
        >
            {children}
        </span>
    );
}

// ============================================================================
// ARIA LIVE REGION
// ============================================================================

export function LiveRegion({
    children,
    priority = 'polite',
}: {
    children: React.ReactNode;
    priority?: 'polite' | 'assertive';
}) {
    return (
        <div
            role="status"
            aria-live={priority}
            aria-atomic="true"
            className="sr-only"
        >
            {children}
        </div>
    );
}
`;
    }

    // ========================================================================
    // ACCESSIBILITY TESTING
    // ========================================================================

    generateAccessibilityTesting(): string {
        return `import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

// ============================================================================
// ACCESSIBILITY TESTS
// ============================================================================

describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
        const { container } = render(<MyComponent />);
        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA labels', () => {
        const { getByRole } = render(<MyButton />);
        const button = getByRole('button', { name: 'Submit form' });
        expect(button).toBeInTheDocument();
    });

    it('should be keyboard navigable', () => {
        const { getByRole } = render(<MyForm />);
        const input = getByRole('textbox', { name: 'Username' });
        
        input.focus();
        expect(input).toHaveFocus();
        
        // Simulate Tab key
        userEvent.tab();
        // Check next element has focus
    });
});

// ============================================================================
// PLAYWRIGHT ACCESSIBILITY TESTS
// ============================================================================

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility', () => {
    test('should not have accessibility violations', async ({ page }) => {
        await page.goto('http://localhost:3000');
        
        const accessibilityScanResults = await new AxeBuilder({ page })
            .analyze();

        expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('should be keyboard navigable', async ({ page }) => {
        await page.goto('http://localhost:3000');
        
        await page.keyboard.press('Tab');
        const focused = await page.evaluate(() => document.activeElement?.tagName);
        expect(focused).toBe('BUTTON');
    });
});
`;
    }
}

export const accessibilityGenerator = AccessibilityGenerator.getInstance();
