/**
 * 👤 UserPersonaGeneratorService
 * 
 * GLM Vision: Genesis Layer - Product Intelligence
 * Creates data-driven user personas with pain points and motivations
 */

import { EventEmitter } from 'events';

export class UserPersonaGeneratorService extends EventEmitter {
    private static instance: UserPersonaGeneratorService;
    private constructor() { super(); }
    static getInstance(): UserPersonaGeneratorService {
        if (!UserPersonaGeneratorService.instance) {
            UserPersonaGeneratorService.instance = new UserPersonaGeneratorService();
        }
        return UserPersonaGeneratorService.instance;
    }

    generate(): string {
        return `// User Persona Generator Service - GLM Genesis Layer
// Data-driven persona creation

class UserPersonaGenerator {
    // Generate personas from product description
    async generatePersonas(product: string, count: number = 3): Promise<UserPersona[]> {
        const response = await llm.chat([{
            role: 'system',
            content: \`Create \${count} detailed user personas for this product.
            
            Each persona should include:
            - Name, age, occupation, location
            - Demographics
            - Tech-savviness level (1-10)
            - Goals and motivations
            - Pain points and frustrations
            - Typical day/workflow
            - Preferred devices and platforms
            - Willingness to pay
            - Decision-making factors
            - Quotes that represent their mindset
            
            Return JSON: [{ name, age, occupation, demographics, techSavvy, goals, painPoints, typicalDay, devices, willingnessToPay, decisionFactors, quote }]\`
        }, {
            role: 'user',
            content: product
        }]);
        
        return JSON.parse(response.content);
    }
    
    // Segment users
    async segmentUsers(userData: any): Promise<UserSegment[]> {
        const response = await llm.chat([{
            role: 'system',
            content: 'Segment users based on behavior, demographics, and value. Return distinct segments with characteristics.'
        }, {
            role: 'user',
            content: JSON.stringify(userData)
        }]);
        
        return JSON.parse(response.content);
    }
    
    // Map pain points to features
    async mapPainPointsToFeatures(personas: UserPersona[]): Promise<FeatureMapping[]> {
        const response = await llm.chat([{
            role: 'system',
            content: 'Map each persona pain point to specific product features that would solve them.'
        }, {
            role: 'user',
            content: JSON.stringify(personas)
        }]);
        
        return JSON.parse(response.content);
    }
    
    // Generate user stories
    async generateUserStories(persona: UserPersona): Promise<UserStory[]> {
        const response = await llm.chat([{
            role: 'system',
            content: 'Generate user stories in the format: As a [persona], I want [goal] so that [benefit].'
        }, {
            role: 'user',
            content: JSON.stringify(persona)
        }]);
        
        return JSON.parse(response.content);
    }
}

export { UserPersonaGenerator };
`;
    }
}

export const userPersonaGeneratorService = UserPersonaGeneratorService.getInstance();
