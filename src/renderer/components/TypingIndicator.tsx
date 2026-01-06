import { motion } from 'framer-motion';
import { forwardRef } from 'react';

interface TypingIndicatorProps {
    visible: boolean;
}

const TypingIndicator = forwardRef<HTMLDivElement, TypingIndicatorProps>(
    ({ visible }, ref) => {
        if (!visible) return null;

        return (
            <motion.div
                ref={ref}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-3 rounded-lg bg-gray-800/50 border border-gray-700/30 mr-8"
            >
                <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-400">Shadow AI</span>
                    <div className="flex space-x-1">
                        {[0, 1, 2].map((i) => (
                            <motion.div
                                key={i}
                                className="w-2 h-2 bg-neon-cyan rounded-full"
                                animate={{
                                    scale: [1, 1.2, 1],
                                    opacity: [0.5, 1, 0.5],
                                }}
                                transition={{
                                    duration: 1,
                                    repeat: Infinity,
                                    delay: i * 0.2,
                                }}
                            />
                        ))}
                    </div>
                </div>
            </motion.div>
        );
    }
);

TypingIndicator.displayName = 'TypingIndicator';

export default TypingIndicator;
