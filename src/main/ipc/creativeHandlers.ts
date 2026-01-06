/**
 * Creative Tools IPC Handlers
 * IPC bridge for Templates, PDF, Brand, and SVG features
 */

import { ipcMain } from 'electron';

// Lazy-loaded services
let projectTemplates: any = null;
let pdfGenerator: any = null;
let brandManager: any = null;
let svgGenerator: any = null;

async function getProjectTemplates() {
    if (!projectTemplates) {
        try {
            const { getProjectTemplates: getPT } = await import('../templates/ProjectTemplates');
            projectTemplates = getPT();
        } catch (error) {
            console.warn('⚠️ ProjectTemplates not available:', (error as Error).message);
            return null;
        }
    }
    return projectTemplates;
}

async function getPDFGenerator() {
    if (!pdfGenerator) {
        try {
            const { getPDFGenerator: getPDF } = await import('../export/PDFGenerator');
            pdfGenerator = getPDF();
        } catch (error) {
            console.warn('⚠️ PDFGenerator not available:', (error as Error).message);
            return null;
        }
    }
    return pdfGenerator;
}

async function getBrandManager() {
    if (!brandManager) {
        try {
            const { getBrandManager: getBM } = await import('../branding/BrandManager');
            brandManager = getBM();
        } catch (error) {
            console.warn('⚠️ BrandManager not available:', (error as Error).message);
            return null;
        }
    }
    return brandManager;
}

async function getSVGGenerator() {
    if (!svgGenerator) {
        try {
            const { getSVGGenerator: getSVG } = await import('../graphics/SVGGenerator');
            svgGenerator = getSVG();
        } catch (error) {
            console.warn('⚠️ SVGGenerator not available:', (error as Error).message);
            return null;
        }
    }
    return svgGenerator;
}

/**
 * Setup creative tools IPC handlers
 */
export function setupCreativeHandlers(): void {
    // === PROJECT TEMPLATES HANDLERS ===

    ipcMain.handle('templates:list', async () => {
        try {
            const pt = await getProjectTemplates();
            if (!pt) return { success: false, error: 'Templates not available' };

            const templates = pt.getAllTemplates();
            return { success: true, templates };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('templates:get', async (_, { id }: { id: string }) => {
        try {
            const pt = await getProjectTemplates();
            if (!pt) return { success: false, error: 'Templates not available' };

            const template = pt.getTemplate(id);
            return { success: true, template };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('templates:search', async (_, { query }: { query: string }) => {
        try {
            const pt = await getProjectTemplates();
            if (!pt) return { success: false, error: 'Templates not available' };

            const templates = pt.searchTemplates(query);
            return { success: true, templates };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('templates:create', async (_, { templateId, targetPath, variables }: any) => {
        try {
            const pt = await getProjectTemplates();
            if (!pt) return { success: false, error: 'Templates not available' };

            const result = await pt.createFromTemplate(templateId, targetPath, variables);
            return result;
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('templates:categories', async () => {
        try {
            const pt = await getProjectTemplates();
            if (!pt) return { success: false, error: 'Templates not available' };

            const categories = pt.getCategories();
            return { success: true, categories };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // === PDF GENERATOR HANDLERS ===

    ipcMain.handle('pdf:fromMarkdown', async (_, { markdown, options }: any) => {
        try {
            const pdf = await getPDFGenerator();
            if (!pdf) return { success: false, error: 'PDF generator not available' };

            const html = await pdf.fromMarkdown(markdown, options);
            return { success: true, html };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('pdf:generateReport', async (_, { data, options }: any) => {
        try {
            const pdf = await getPDFGenerator();
            if (!pdf) return { success: false, error: 'PDF generator not available' };

            const html = await pdf.generateReport(data, options);
            return { success: true, html };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('pdf:generateInvoice', async (_, invoice: any) => {
        try {
            const pdf = await getPDFGenerator();
            if (!pdf) return { success: false, error: 'PDF generator not available' };

            const html = await pdf.generateInvoice(invoice);
            return { success: true, html };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('pdf:generateResume', async (_, resume: any) => {
        try {
            const pdf = await getPDFGenerator();
            if (!pdf) return { success: false, error: 'PDF generator not available' };

            const html = await pdf.generateResume(resume);
            return { success: true, html };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // === BRAND MANAGER HANDLERS ===

    ipcMain.handle('brand:create', async (_, options: any) => {
        try {
            const bm = await getBrandManager();
            if (!bm) return { success: false, error: 'Brand manager not available' };

            const brand = await bm.createBrand(options);
            return { success: true, brand };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('brand:list', async () => {
        try {
            const bm = await getBrandManager();
            if (!bm) return { success: false, error: 'Brand manager not available' };

            const brands = bm.getAllBrands();
            return { success: true, brands };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('brand:getActive', async () => {
        try {
            const bm = await getBrandManager();
            if (!bm) return { success: false, error: 'Brand manager not available' };

            const brand = bm.getActiveBrand();
            return { success: true, brand };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('brand:setActive', async (_, { id }: { id: string }) => {
        try {
            const bm = await getBrandManager();
            if (!bm) return { success: false, error: 'Brand manager not available' };

            const brand = await bm.setActiveBrand(id);
            return { success: true, brand };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('brand:generateCSS', async (_, { id }: { id?: string } = {}) => {
        try {
            const bm = await getBrandManager();
            if (!bm) return { success: false, error: 'Brand manager not available' };

            const css = bm.generateCSSVariables(id);
            return { success: true, css };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('brand:generateTailwind', async (_, { id }: { id?: string } = {}) => {
        try {
            const bm = await getBrandManager();
            if (!bm) return { success: false, error: 'Brand manager not available' };

            const config = bm.generateTailwindConfig(id);
            return { success: true, config };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // === SVG GENERATOR HANDLERS ===

    ipcMain.handle('svg:barChart', async (_, { data, options }: any) => {
        try {
            const svg = await getSVGGenerator();
            if (!svg) return { success: false, error: 'SVG generator not available' };

            const svgContent = svg.createBarChart(data, options);
            return { success: true, svg: svgContent };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('svg:lineChart', async (_, { data, options }: any) => {
        try {
            const svg = await getSVGGenerator();
            if (!svg) return { success: false, error: 'SVG generator not available' };

            const svgContent = svg.createLineChart(data, options);
            return { success: true, svg: svgContent };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('svg:pieChart', async (_, { data, options }: any) => {
        try {
            const svg = await getSVGGenerator();
            if (!svg) return { success: false, error: 'SVG generator not available' };

            const svgContent = svg.createPieChart(data, options);
            return { success: true, svg: svgContent };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('svg:diagram', async (_, { nodes, edges, options }: any) => {
        try {
            const svg = await getSVGGenerator();
            if (!svg) return { success: false, error: 'SVG generator not available' };

            const svgContent = svg.createDiagram(nodes, edges, options);
            return { success: true, svg: svgContent };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('svg:icon', async (_, { name, size, color }: any) => {
        try {
            const svg = await getSVGGenerator();
            if (!svg) return { success: false, error: 'SVG generator not available' };

            const svgContent = svg.createIcon(name, size, color);
            return { success: true, svg: svgContent };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('svg:logo', async (_, { text, options }: any) => {
        try {
            const svg = await getSVGGenerator();
            if (!svg) return { success: false, error: 'SVG generator not available' };

            const svgContent = svg.createLogoPlaceholder(text, options);
            return { success: true, svg: svgContent };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    console.log('✅ Creative tools IPC handlers registered');
}
