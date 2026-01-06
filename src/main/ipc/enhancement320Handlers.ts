/**
 * Enhancement 320+ IPC Handlers - Verdent-inspired MLOps features
 */

import { ipcMain } from 'electron';

export function setupEnhancement320Handlers(): void {
    // DATA PIPELINE
    ipcMain.handle('pipeline:create', async (_, { name, steps }: any) => {
        try { const { getDataPipelineEngine } = await import('../datapipeline/DataPipelineEngine'); return { success: true, pipeline: getDataPipelineEngine().create(name, steps) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // MODEL TRAINER
    ipcMain.handle('trainer:createJob', async (_, { modelName, dataset, epochs, hyperparams }: any) => {
        try { const { getModelTrainerEngine } = await import('../modeltrainer/ModelTrainerEngine'); return { success: true, job: getModelTrainerEngine().createJob(modelName, dataset, epochs, hyperparams) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // DATA ANNOTATOR
    ipcMain.handle('annotator:createProject', async (_, { name, type, labels }: any) => {
        try { const { getDataAnnotatorEngine } = await import('../dataannotator/DataAnnotatorEngine'); return { success: true, project: getDataAnnotatorEngine().createProject(name, type, labels) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // FEATURE STORE
    ipcMain.handle('features:register', async (_, { name, type, source, version }: any) => {
        try { const { getFeatureStoreEngine } = await import('../featurestore/FeatureStoreEngine'); return { success: true, feature: getFeatureStoreEngine().register(name, type, source, version) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // MODEL REGISTRY
    ipcMain.handle('registry:register', async (_, { name, version, framework, metrics }: any) => {
        try { const { getModelRegistryEngine } = await import('../modelregistry/ModelRegistryEngine'); return { success: true, model: getModelRegistryEngine().register(name, version, framework, metrics) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // EXPERIMENT TRACKER
    ipcMain.handle('experiment:create', async (_, { name, params, tags }: any) => {
        try { const { getExperimentTrackerEngine } = await import('../exptracker/ExperimentTrackerEngine'); return { success: true, experiment: getExperimentTrackerEngine().create(name, params, tags) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // DATA VALIDATOR
    ipcMain.handle('validator:validate', async (_, { data, ruleIds }: any) => {
        try { const { getDataValidatorEngine } = await import('../datavalidator/DataValidatorEngine'); return { success: true, result: getDataValidatorEngine().validate(data, ruleIds) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // MLOPS
    ipcMain.handle('mlops:createJob', async (_, { type, modelId, config }: any) => {
        try { const { getMLOpsEngine } = await import('../mlops/MLOpsEngine'); return { success: true, job: getMLOpsEngine().createJob(type, modelId, config) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // INFERENCE
    ipcMain.handle('inference:predict', async (_, { modelId, input }: any) => {
        try { const { getInferencePipelineEngine } = await import('../inference/InferencePipelineEngine'); return { success: true, result: await getInferencePipelineEngine().predict(modelId, input) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // MODEL MONITOR
    ipcMain.handle('monitor:logMetrics', async (_, { modelId, metrics }: any) => {
        try { const { getModelMonitorEngine } = await import('../modelmonitor/ModelMonitorEngine'); getModelMonitorEngine().logMetrics(modelId, metrics); return { success: true }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    console.log('✅ Enhancement 320+ IPC handlers registered (10 handlers)');
}
