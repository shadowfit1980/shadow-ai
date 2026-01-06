/**
 * Final Feature IPC Handlers
 */

import { ipcMain } from 'electron';

export function setupFinalHandlers(): void {
    // DIFF
    ipcMain.handle('diff:lines', async (_, { a, b }: any) => {
        try { const { getDiffEngine } = await import('../diff/DiffEngine'); return { success: true, result: getDiffEngine().diffLines(a, b) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // MINIFIER
    ipcMain.handle('minify:js', async (_, { code }: any) => {
        try { const { getMinifier } = await import('../minifier/Minifier'); return { success: true, result: getMinifier().minifyJS(code) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('minify:css', async (_, { code }: any) => {
        try { const { getMinifier } = await import('../minifier/Minifier'); return { success: true, result: getMinifier().minifyCSS(code) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('minify:html', async (_, { code }: any) => {
        try { const { getMinifier } = await import('../minifier/Minifier'); return { success: true, result: getMinifier().minifyHTML(code) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // ENCODER
    ipcMain.handle('encode:base64', async (_, { text, decode }: any) => {
        try { const { getEncoder } = await import('../encoder/Encoder'); return { success: true, result: decode ? getEncoder().base64Decode(text) : getEncoder().base64Encode(text) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('encode:url', async (_, { text, decode }: any) => {
        try { const { getEncoder } = await import('../encoder/Encoder'); return { success: true, result: decode ? getEncoder().urlDecode(text) : getEncoder().urlEncode(text) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // VALIDATOR
    ipcMain.handle('validate:email', async (_, { text }: any) => {
        try { const { getValidator } = await import('../validator/Validator'); return { success: true, valid: getValidator().isEmail(text) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('validate:url', async (_, { text }: any) => {
        try { const { getValidator } = await import('../validator/Validator'); return { success: true, valid: getValidator().isURL(text) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('validate:json', async (_, { text }: any) => {
        try { const { getValidator } = await import('../validator/Validator'); return { success: true, valid: getValidator().isJSON(text) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // HASH
    ipcMain.handle('hash:generate', async (_, { text, algo }: any) => {
        try {
            const { getHashGenerator } = await import('../hash/HashGenerator');
            const h = getHashGenerator();
            const hash = algo === 'md5' ? h.md5(text) : algo === 'sha1' ? h.sha1(text) : algo === 'sha512' ? h.sha512(text) : h.sha256(text);
            return { success: true, hash };
        } catch (error: any) { return { success: false, error: error.message }; }
    });

    // UUID
    ipcMain.handle('uuid:generate', async (_, { count }: any = {}) => {
        try { const { getUUIDGenerator } = await import('../uuid/UUIDGenerator'); return { success: true, uuids: getUUIDGenerator().generate(count || 1) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // DATETIME
    ipcMain.handle('datetime:now', async () => {
        try { const { getDateTimeUtils } = await import('../datetime/DateTimeUtils'); return { success: true, now: getDateTimeUtils().now(), unix: getDateTimeUtils().unix() }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('datetime:format', async (_, { date, format }: any) => {
        try { const { getDateTimeUtils } = await import('../datetime/DateTimeUtils'); return { success: true, formatted: getDateTimeUtils().format(date, format) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // NETWORK
    ipcMain.handle('network:getLocalIP', async () => {
        try { const { getNetworkUtils } = await import('../network/NetworkUtils'); return { success: true, ip: getNetworkUtils().getLocalIP() }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('network:lookup', async (_, { hostname }: any) => {
        try { const { getNetworkUtils } = await import('../network/NetworkUtils'); return { success: true, ip: await getNetworkUtils().lookup(hostname) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // SYSTEM
    ipcMain.handle('system:info', async () => {
        try { const { getSystemInfo } = await import('../system/SystemInfo'); return { success: true, info: getSystemInfo().getInfo() }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    console.log('✅ Final feature IPC handlers registered (16 handlers)');
}
