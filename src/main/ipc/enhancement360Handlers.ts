/**
 * Enhancement 360+ IPC Handlers - IONOS AI Model Hub managed endpoint features
 */

import { ipcMain } from 'electron';

export function setupEnhancement360Handlers(): void {
    // MANAGED ENDPOINT
    ipcMain.handle('endpoint:create', async (_, { name, modelId, region }: any) => {
        try { const { getManagedEndpointEngine } = await import('../managedendpoint/ManagedEndpointEngine'); return { success: true, endpoint: await getManagedEndpointEngine().create(name, modelId, region) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // MODEL DEPLOYMENT
    ipcMain.handle('deployment:deploy', async (_, { modelId, version, environment, replicas }: any) => {
        try { const { getModelDeploymentEngine } = await import('../modeldeploy/ModelDeploymentEngine'); return { success: true, deployment: await getModelDeploymentEngine().deploy(modelId, version, environment, replicas) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // SCALING POLICY
    ipcMain.handle('scaling:addRule', async (_, { endpointId, metric, threshold, operator, action, amount }: any) => {
        try { const { getScalingPolicyEngine } = await import('../scalingpolicy/ScalingPolicyEngine'); return { success: true, rule: getScalingPolicyEngine().addRule(endpointId, metric, threshold, operator, action, amount) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // ENDPOINT MONITOR
    ipcMain.handle('monitor:getHealth', async (_, { endpointId }: any) => {
        try { const { getEndpointMonitorEngine } = await import('../endpointmon/EndpointMonitorEngine'); return { success: true, health: getEndpointMonitorEngine().getHealth(endpointId) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // LOAD BALANCER
    ipcMain.handle('lb:create', async (_, { name, algorithm }: any) => {
        try { const { getLoadBalancerEngine } = await import('../loadbalancer/LoadBalancerEngine'); return { success: true, lb: getLoadBalancerEngine().create(name, algorithm) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // MODEL SERVING CONFIG
    ipcMain.handle('serving:create', async (_, { endpointId, options }: any) => {
        try { const { getModelServingConfigEngine } = await import('../modelserving/ModelServingConfigEngine'); return { success: true, config: getModelServingConfigEngine().create(endpointId, options) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // INFERENCE LATENCY
    ipcMain.handle('latency:getStats', async (_, { endpointId }: any) => {
        try { const { getInferenceLatencyEngine } = await import('../inflatency/InferenceLatencyEngine'); return { success: true, stats: getInferenceLatencyEngine().getStats(endpointId) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // REQUEST QUEUE
    ipcMain.handle('queue:enqueue', async (_, { endpointId, payload, priority }: any) => {
        try { const { getRequestQueueEngine } = await import('../requestqueue/RequestQueueEngine'); return { success: true, request: getRequestQueueEngine().enqueue(endpointId, payload, priority) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // ENDPOINT VERSIONING
    ipcMain.handle('version:create', async (_, { endpointId, modelVersion }: any) => {
        try { const { getEndpointVersioningEngine } = await import('../endpointver/EndpointVersioningEngine'); return { success: true, version: getEndpointVersioningEngine().createVersion(endpointId, modelVersion) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // DEPLOYMENT ROLLBACK
    ipcMain.handle('rollback:execute', async (_, { deploymentId, targetVersion }: any) => {
        try { const { getDeploymentRollbackEngine } = await import('../deployrollback/DeploymentRollbackEngine'); return { success: true, operation: await getDeploymentRollbackEngine().rollback(deploymentId, targetVersion) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    console.log('✅ Enhancement 360+ IPC handlers registered (10 handlers)');
}
