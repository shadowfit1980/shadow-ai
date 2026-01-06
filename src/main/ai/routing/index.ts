/**
 * Routing System Index
 */

export * from './ModelRouter';
export * from './ModelProfiler';
export * from './FallbackChain';

import { ModelRouter, modelRouter } from './ModelRouter';
import { ModelProfiler, modelProfiler } from './ModelProfiler';
import { FallbackChain, fallbackChain } from './FallbackChain';

export {
    ModelRouter,
    modelRouter,
    ModelProfiler,
    modelProfiler,
    FallbackChain,
    fallbackChain
};
