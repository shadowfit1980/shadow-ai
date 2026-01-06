/**
 * Enhancement 150+ IPC Handlers
 */

import { ipcMain } from 'electron';

export function setupEnhancement150Handlers(): void {
    // SLACK
    ipcMain.handle('slack:sendMessage', async (_, { channel, text }: any) => {
        try { const { getSlackIntegration } = await import('../slack/SlackIntegration'); return { success: await getSlackIntegration().sendMessage(channel, text) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('slack:getChannels', async () => {
        try { const { getSlackIntegration } = await import('../slack/SlackIntegration'); return { success: true, channels: await getSlackIntegration().getChannels() }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // IMAGE
    ipcMain.handle('image:generate', async (_, { prompt, size }: any) => {
        try { const { getImageGenerator } = await import('../imagegen/ImageGenerator'); return { success: true, image: await getImageGenerator().generate(prompt, size) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // SLIDES
    ipcMain.handle('slides:create', async (_, { title, theme }: any) => {
        try { const { getSlidesGenerator } = await import('../slides/SlidesGenerator'); return { success: true, presentation: getSlidesGenerator().create(title, theme) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('slides:generateFromOutline', async (_, { title, outline }: any) => {
        try { const { getSlidesGenerator } = await import('../slides/SlidesGenerator'); return { success: true, presentation: await getSlidesGenerator().generateFromOutline(title, outline) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // CALENDAR
    ipcMain.handle('calendar:createEvent', async (_, { title, start, end, location }: any) => {
        try { const { getCalendarManager } = await import('../calendar/CalendarManager'); return { success: true, event: getCalendarManager().createEvent(title, new Date(start), new Date(end), location) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('calendar:getUpcoming', async (_, { days }: any = {}) => {
        try { const { getCalendarManager } = await import('../calendar/CalendarManager'); return { success: true, events: getCalendarManager().getUpcoming(days) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // EMAIL
    ipcMain.handle('email:compose', async (_, { to, subject, body }: any) => {
        try { const { getEmailManager } = await import('../email/EmailManager'); return { success: true, email: getEmailManager().compose(to, subject, body) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // NOTES
    ipcMain.handle('notes:create', async (_, { title, content, tags }: any) => {
        try { const { getNotesManager } = await import('../notes/NotesManager'); return { success: true, note: getNotesManager().create(title, content, tags) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('notes:search', async (_, { query }: any) => {
        try { const { getNotesManager } = await import('../notes/NotesManager'); return { success: true, notes: getNotesManager().search(query) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // TASKS
    ipcMain.handle('tasks2:create', async (_, { title, priority, dueDate }: any) => {
        try { const { getTasksManager2 } = await import('../tasks2/TasksManager2'); return { success: true, task: getTasksManager2().create(title, priority, dueDate ? new Date(dueDate) : undefined) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // REMINDERS
    ipcMain.handle('reminders:create', async (_, { title, time, repeat }: any) => {
        try { const { getRemindersManager } = await import('../reminders/RemindersManager'); return { success: true, reminder: getRemindersManager().create(title, new Date(time), repeat) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // CONTACTS
    ipcMain.handle('contacts:add', async (_, { name, email, phone, company }: any) => {
        try { const { getContactsManager } = await import('../contacts/ContactsManager'); return { success: true, contact: getContactsManager().add(name, email, phone, company) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('contacts:search', async (_, { query }: any) => {
        try { const { getContactsManager } = await import('../contacts/ContactsManager'); return { success: true, contacts: getContactsManager().search(query) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // SYNC
    ipcMain.handle('sync:sync', async () => {
        try { const { getSyncManager } = await import('../sync/SyncManager'); return { success: await getSyncManager().sync() }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('sync:getStatus', async () => {
        try { const { getSyncManager } = await import('../sync/SyncManager'); return { success: true, status: getSyncManager().getStatus() }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    console.log('✅ Enhancement 150+ IPC handlers registered (16 handlers)');
}
