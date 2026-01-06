// Animation Library Generator - Generate animation utilities
import Anthropic from '@anthropic-ai/sdk';

class AnimationLibraryGenerator {
    private anthropic: Anthropic | null = null;

    generateFramerMotionComponents(): string {
        return `import { motion, AnimatePresence, Variants } from 'framer-motion';
import React from 'react';

// Fade In/Out Animation
export const FadeIn: React.FC<{ children: React.ReactNode; delay?: number }> = ({ children, delay = 0 }) => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay, duration: 0.3 }}>
        {children}
    </motion.div>
);

// Slide In Animation
export const SlideIn: React.FC<{ children: React.ReactNode; direction?: 'left' | 'right' | 'up' | 'down' }> = 
    ({ children, direction = 'up' }) => {
    const variants: Record<string, { x?: number; y?: number }> = {
        left: { x: -50 }, right: { x: 50 }, up: { y: 50 }, down: { y: -50 }
    };
    return (
        <motion.div initial={{ opacity: 0, ...variants[direction] }} animate={{ opacity: 1, x: 0, y: 0 }} transition={{ type: 'spring', stiffness: 100 }}>
            {children}
        </motion.div>
    );
};

// Stagger Children
export const StaggerContainer: React.FC<{ children: React.ReactNode; stagger?: number }> = ({ children, stagger = 0.1 }) => (
    <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: stagger } } }}>
        {children}
    </motion.div>
);

// Scale on Hover
export const ScaleOnHover: React.FC<{ children: React.ReactNode; scale?: number }> = ({ children, scale = 1.05 }) => (
    <motion.div whileHover={{ scale }} whileTap={{ scale: 0.95 }} transition={{ type: 'spring', stiffness: 400 }}>
        {children}
    </motion.div>
);

// Page Transition Wrapper
export const PageTransition: React.FC<{ children: React.ReactNode; key: string }> = ({ children, key }) => (
    <AnimatePresence mode="wait">
        <motion.div key={key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
            {children}
        </motion.div>
    </AnimatePresence>
);
`;
    }

    generateCSSAnimations(): string {
        return `/* Animation Utility Classes */

/* Fade Animations */
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
@keyframes fadeInDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }

.animate-fadeIn { animation: fadeIn 0.3s ease-out; }
.animate-fadeOut { animation: fadeOut 0.3s ease-out; }
.animate-fadeInUp { animation: fadeInUp 0.4s ease-out; }
.animate-fadeInDown { animation: fadeInDown 0.4s ease-out; }

/* Slide Animations */
@keyframes slideInLeft { from { transform: translateX(-100%); } to { transform: translateX(0); } }
@keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
@keyframes slideInUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
@keyframes slideInDown { from { transform: translateY(-100%); } to { transform: translateY(0); } }

.animate-slideInLeft { animation: slideInLeft 0.3s ease-out; }
.animate-slideInRight { animation: slideInRight 0.3s ease-out; }
.animate-slideInUp { animation: slideInUp 0.3s ease-out; }
.animate-slideInDown { animation: slideInDown 0.3s ease-out; }

/* Scale Animations */
@keyframes scaleIn { from { transform: scale(0); } to { transform: scale(1); } }
@keyframes scaleOut { from { transform: scale(1); } to { transform: scale(0); } }
@keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
@keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }

.animate-scaleIn { animation: scaleIn 0.2s ease-out; }
.animate-scaleOut { animation: scaleOut 0.2s ease-out; }
.animate-pulse { animation: pulse 2s infinite; }
.animate-bounce { animation: bounce 1s infinite; }

/* Spin & Rotate */
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes wiggle { 0%, 100% { transform: rotate(0); } 25% { transform: rotate(-5deg); } 75% { transform: rotate(5deg); } }

.animate-spin { animation: spin 1s linear infinite; }
.animate-wiggle { animation: wiggle 0.3s ease-in-out; }

/* Skeleton Loading */
@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }

.skeleton {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
}
`;
    }

    generateGSAPAnimations(): string {
        return `import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Fade in elements on scroll
export function fadeInOnScroll(selector: string) {
    gsap.from(selector, {
        opacity: 0,
        y: 50,
        duration: 0.8,
        stagger: 0.1,
        scrollTrigger: { trigger: selector, start: 'top 80%', toggleActions: 'play none none reverse' }
    });
}

// Parallax effect
export function parallax(selector: string, speed: number = 0.5) {
    gsap.to(selector, {
        y: () => window.innerHeight * speed,
        ease: 'none',
        scrollTrigger: { trigger: selector, start: 'top bottom', end: 'bottom top', scrub: true }
    });
}

// Text reveal animation
export function textReveal(selector: string) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
        const text = el.textContent || '';
        el.innerHTML = text.split('').map(char => \`<span class="char">\${char}</span>\`).join('');
        gsap.from(el.querySelectorAll('.char'), {
            opacity: 0,
            y: 20,
            duration: 0.5,
            stagger: 0.02,
            scrollTrigger: { trigger: el, start: 'top 80%' }
        });
    });
}

// Counter animation
export function animateCounter(selector: string, target: number, duration: number = 2) {
    gsap.to(selector, {
        textContent: target,
        duration,
        snap: { textContent: 1 },
        scrollTrigger: { trigger: selector, start: 'top 80%' }
    });
}
`;
    }

    generateSpringAnimations(): string {
        return `// React Spring Animation Hooks
import { useSpring, useSprings, useTrail, animated, config } from '@react-spring/web';

// Fade animation hook
export function useFade(show: boolean) {
    return useSpring({ opacity: show ? 1 : 0, config: config.gentle });
}

// Slide animation hook
export function useSlide(show: boolean, direction: 'left' | 'right' | 'up' | 'down' = 'up') {
    const transforms = { left: 'translateX(-100%)', right: 'translateX(100%)', up: 'translateY(100%)', down: 'translateY(-100%)' };
    return useSpring({ transform: show ? 'translate(0)' : transforms[direction], config: config.wobbly });
}

// Number counter hook
export function useCounter(value: number) {
    const { number } = useSpring({ number: value, from: { number: 0 }, config: { mass: 1, tension: 20, friction: 10 } });
    return number.to(n => Math.floor(n));
}

// Trail animation for lists
export function useListTrail<T>(items: T[], show: boolean) {
    return useTrail(items.length, { opacity: show ? 1 : 0, y: show ? 0 : 20, config: { mass: 1, tension: 280, friction: 20 } });
}

// Animated components
export const AnimatedDiv = animated.div;
export const AnimatedSpan = animated.span;
`;
    }
}

export const animationLibraryGenerator = new AnimationLibraryGenerator();
