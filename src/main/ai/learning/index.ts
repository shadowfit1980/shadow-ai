/**
 * Learning System Exports
 */

export * from './types';
export * from './SelfImprovementEngine';
export * from './LearningSystem';
export {
    CrossProjectLearning,
    type PatternType,
    type PatternParameter,
    type PatternExample,
    type PatternMatch,
    type ProjectLearning,
    type Convention,
} from './CrossProjectLearning';
// Note: Pattern type from CrossProjectLearning is not exported to avoid conflict with LearningSystem
