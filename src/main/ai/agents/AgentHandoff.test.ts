/**
 * AgentHandoff Unit Tests
 */

import { AgentHandoffManager, HandoffRequest, HandoffPolicy, ActiveHandoff } from './AgentHandoff';

describe('AgentHandoffManager', () => {
    let manager: AgentHandoffManager;

    beforeEach(() => {
        manager = (AgentHandoffManager as any).getInstance();
        // Reset state - clear activeHandoffs Map
        manager['activeHandoffs'].clear();
        manager['handoffHistory'] = [];
    });

    describe('Policy Management', () => {
        it('should have default policy', () => {
            const policy = manager.getPolicy();

            expect(policy).toHaveProperty('maxConcurrent');
            expect(policy).toHaveProperty('defaultTimeout');
            expect(policy).toHaveProperty('allowedRoutes');
            expect(policy.maxConcurrent).toBe(5);
        });

        it('should update policy', () => {
            manager.setPolicy({ maxConcurrent: 10 });
            const policy = manager.getPolicy();

            expect(policy.maxConcurrent).toBe(10);

            // Reset
            manager.setPolicy({ maxConcurrent: 5 });
        });
    });

    describe('Route Validation', () => {
        it('should allow valid routes', () => {
            const allowed = manager.isRouteAllowed('coder', 'reviewer');
            expect(allowed).toBe(true);
        });

        it('should handle unknown routes', () => {
            const allowed = manager.isRouteAllowed('unknown' as any, 'other' as any);
            // Default behavior - check implementation
            expect(typeof allowed).toBe('boolean');
        });
    });

    describe('Handoff Lifecycle', () => {
        it('should request handoff', () => {
            const request = manager.requestHandoff(
                'coder',
                'reviewer',
                'Review this code',
                { context: { code: 'test' }, expectations: ['Check for bugs'] }
            );

            expect(request).toHaveProperty('id');
            expect(request.sourceAgent).toBe('coder');
            expect(request.targetAgent).toBe('reviewer');
            expect(request.task).toBe('Review this code');
            // Status is on ActiveHandoff, not HandoffRequest
            const active = manager.getHandoff(request.id);
            expect(active?.status).toBe('in_progress'); // requireAcceptance is false by default
        });

        it('should handle handoff lifecycle', () => {
            // Force requireAcceptance to test pending state
            manager.setPolicy({ requireAcceptance: true });

            const request = manager.requestHandoff('coder', 'reviewer', 'Test task');
            const handoff = manager.getHandoff(request.id);
            expect(handoff?.status).toBe('pending');

            const accepted = manager.accept(request.id);
            expect(accepted).toBe(true);

            const afterAccept = manager.getHandoff(request.id);
            expect(afterAccept?.status).toBe('in_progress');

            // Reset policy
            manager.setPolicy({ requireAcceptance: false });
        });

        it('should complete handoff', () => {
            const request = manager.requestHandoff('coder', 'reviewer', 'Test task');
            // Default policy doesn't require acceptance, so it starts in_progress

            const result = manager.complete(request.id, { reviewed: true }, ['Code is clean']);

            expect(result).toHaveProperty('success');
            expect(result).toHaveProperty('handoffId');
            expect(result.success).toBe(true);
            expect(result.status).toBe('completed');
        });
    });

    describe('Statistics', () => {
        it('should return stats', () => {
            const stats = manager.getStats();

            expect(stats).toHaveProperty('totalHandoffs');
            expect(stats).toHaveProperty('activeHandoffs');
            expect(stats).toHaveProperty('successRate');
            expect(stats).toHaveProperty('averageDuration');
        });

        it('should track pending handoffs', () => {
            manager.setPolicy({ requireAcceptance: true });

            manager.requestHandoff('coder', 'reviewer', 'Task 1');
            manager.requestHandoff('coder', 'reviewer', 'Task 2');

            const pending = manager.getPendingHandoffs('reviewer');
            expect(pending.length).toBeGreaterThanOrEqual(2);

            // Reset
            manager.setPolicy({ requireAcceptance: false });
        });
    });

    describe('Events', () => {
        it('should emit handoffRequested event', (done) => {
            manager.once('handoffRequested', (request: HandoffRequest) => {
                expect(request.task).toBe('Event test');
                done();
            });

            manager.requestHandoff('coder', 'reviewer', 'Event test');
        });

        it('should emit handoffAccepted event', (done) => {
            manager.setPolicy({ requireAcceptance: true });
            const request = manager.requestHandoff('coder', 'reviewer', 'Accept test');

            manager.once('handoffAccepted', (req: HandoffRequest) => {
                expect(req.id).toBe(request.id);
                manager.setPolicy({ requireAcceptance: false });
                done();
            });

            manager.accept(request.id);
        });
    });
});
