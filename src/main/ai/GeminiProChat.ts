/**
 * Dedicated Gemini Pro Chat Service
 * 
 * Provides direct access to Gemini Pro for intelligent chat responses.
 * Uses a dedicated API key for consistent, smart interactions.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// Dedicated Gemini Pro API key for chat
const GEMINI_PRO_API_KEY = 'AIzaSyDrspFjr7NcWX9mRP515ik8iaR20Gn3Tfo';

let genAI: GoogleGenerativeAI | null = null;
let model: any = null;

/**
 * Initialize the Gemini Pro chat service
 */
export function initializeGeminiChat(): void {
    try {
        genAI = new GoogleGenerativeAI(GEMINI_PRO_API_KEY);
        // Use gemini-2.0-flash which is fast and highly capable
        model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash',
            generationConfig: {
                temperature: 0.7,
                topP: 0.95,
                topK: 40,
                maxOutputTokens: 8192,
            }
        });
        console.log('✅ Gemini Pro Chat Service initialized with gemini-2.0-flash');
    } catch (error) {
        console.error('❌ Failed to initialize Gemini Pro Chat:', error);
    }
}

/**
 * Chat with Gemini Pro directly
 */
export async function geminiProChat(
    messages: Array<{ role: string; content: string }>
): Promise<string> {
    if (!model) {
        initializeGeminiChat();
    }

    if (!model) {
        throw new Error('Gemini Pro not initialized');
    }

    try {
        // Convert messages to Gemini format
        const parts = messages.map(msg => {
            const role = msg.role === 'agent' || msg.role === 'assistant' ? 'model' : 'user';
            return {
                role,
                parts: [{ text: msg.content }]
            };
        });

        // Filter out system messages and convert to chat history format
        const history = parts
            .filter(p => p.role === 'model' || p.role === 'user')
            .slice(0, -1); // All but the last message

        const lastMessage = parts[parts.length - 1];
        const userInput = lastMessage.parts[0].text;

        // Get system prompt if exists
        const systemPrompt = messages.find(m => m.role === 'system')?.content || '';

        // Start chat with history
        const chat = model.startChat({
            history: history.length > 0 ? history : undefined,
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 8192,
            }
        });

        // Build the full prompt with system context
        const fullPrompt = systemPrompt
            ? `${systemPrompt}\n\nUser: ${userInput}`
            : userInput;

        // Send message and get response
        const result = await chat.sendMessage(fullPrompt);
        const response = await result.response;
        return response.text();

    } catch (error: any) {
        console.error('Gemini Pro chat error:', error);

        // Handle rate limiting
        if (error.message?.includes('quota') || error.message?.includes('429')) {
            throw new Error('Gemini Pro rate limit exceeded. Please wait a moment and try again.');
        }

        throw error;
    }
}

/**
 * Stream chat with Gemini Pro
 */
export async function* geminiProChatStream(
    messages: Array<{ role: string; content: string }>
): AsyncGenerator<string, string, unknown> {
    if (!model) {
        initializeGeminiChat();
    }

    if (!model) {
        throw new Error('Gemini Pro not initialized');
    }

    try {
        // Convert messages to Gemini format
        const parts = messages.map(msg => {
            const role = msg.role === 'agent' || msg.role === 'assistant' ? 'model' : 'user';
            return {
                role,
                parts: [{ text: msg.content }]
            };
        });

        // Filter out system messages and convert to chat history format
        const history = parts
            .filter(p => p.role === 'model' || p.role === 'user')
            .slice(0, -1);

        const lastMessage = parts[parts.length - 1];
        const userInput = lastMessage.parts[0].text;

        const systemPrompt = messages.find(m => m.role === 'system')?.content || '';

        const chat = model.startChat({
            history: history.length > 0 ? history : undefined,
        });

        const fullPrompt = systemPrompt
            ? `${systemPrompt}\n\nUser: ${userInput}`
            : userInput;

        // Stream the response
        const result = await chat.sendMessageStream(fullPrompt);

        let fullResponse = '';
        for await (const chunk of result.stream) {
            const text = chunk.text();
            fullResponse += text;
            yield text;
        }

        return fullResponse;

    } catch (error: any) {
        console.error('Gemini Pro stream error:', error);
        throw error;
    }
}

// Initialize on module load
initializeGeminiChat();
