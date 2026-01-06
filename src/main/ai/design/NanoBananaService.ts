import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * NanoBananaService
 * Advanced AI image generation and editing using Gemini
 * Simulates Nano Banana Pro functionality with Imagen-focused prompting
 */
export class NanoBananaService {
    private static instance: NanoBananaService;
    private genAI: GoogleGenerativeAI;
    private model: any;

    private constructor(apiKey: string) {
        this.genAI = new GoogleGenerativeAI(apiKey);
        // Using Gemini for generating detailed image prompts
        // In production, this would use Imagen/Nano Banana Pro API
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    }

    static getInstance(apiKey?: string): NanoBananaService {
        if (!NanoBananaService.instance) {
            if (!apiKey) {
                throw new Error('API key required for first initialization');
            }
            NanoBananaService.instance = new NanoBananaService(apiKey);
        }
        return NanoBananaService.instance;
    }

    /**
     * Generate optimized image prompt for Nano Banana Pro
     * Returns a detailed prompt ready for image generation APIs
     */
    async generateImagePrompt(userPrompt: string, options: ImageOptions = {}): Promise<ImagePromptResult> {
        const {
            resolution = '2K',
            aspectRatio = '16:9',
            lighting = 'natural',
            cameraAngle = 'eye-level',
            colorGrading = 'vibrant',
            style = 'photorealistic'
        } = options;

        const systemPrompt = `You are an expert at crafting prompts for Nano Banana Pro, Google's advanced AI image generation model.

Transform this user request into a detailed, optimized prompt for image generation: "${userPrompt}"

Requirements:
- Resolution: ${resolution}
- Aspect Ratio: ${aspectRatio}
- Lighting: ${lighting}
- Camera Angle: ${cameraAngle}
- Color Grading: ${colorGrading}
- Style: ${style}

Generate a JSON response with:
{
  "optimizedPrompt": "Detailed prompt for Nano Banana Pro with all technical specifications",
  "negativePrompt": "Things to avoid in the generation",
  "suggestedSettings": {
    "resolution": "${resolution}",
    "aspectRatio": "${aspectRatio}",
    "lighting": "${lighting}",
    "camera": "${cameraAngle}",
    "colorGrading": "${colorGrading}"
  },
  "description": "What the generated image will look like",
  "tags": ["relevant", "style", "tags"]
}

The optimized prompt should:
- Be highly detailed and specific
- Include composition details
- Specify mood and atmosphere
- Mention color palette
- Include technical photography terms
- Be ready for professional image generation`;

        try {
            const result = await this.model.generateContent(systemPrompt);
            const response = result.response.text();
            return this.parseImagePrompt(response, options);
        } catch (error: any) {
            console.error('❌ Nano Banana error:', error.message);
            return this.fallbackImagePrompt(userPrompt, options);
        }
    }

    /**
     * Generate prompt for text rendering in images
     */
    async generateTextImage(text: string, style: TextStyle): Promise<ImagePromptResult> {
        const prompt = `Create an image featuring the text "${text}" with ${style} typography. 
        The text should be clear, legible, and professionally rendered with modern design principles.`;

        return this.generateImagePrompt(prompt, {
            style: 'graphic-design',
            resolution: '2K',
            colorGrading: style === 'professional' ? 'clean' : 'vibrant'
        });
    }

    /**
     * Generate diagram/infographic prompt
     */
    async generateDiagram(data: DiagramData): Promise<ImagePromptResult> {
        const { type, title, dataPoints, style = 'modern' } = data;

        const prompt = `Create a ${type} diagram titled "${title}" with ${style} design.
        
Data to visualize: ${JSON.stringify(dataPoints)}

Requirements:
- Clean, professional layout
- Clear labels and legends
- Modern color scheme
- High contrast for readability
- Accurate data representation`;

        return this.generateImagePrompt(prompt, {
            style: 'infographic',
            resolution: '2K',
            aspectRatio: '16:9'
        });
    }

    /**
     * Generate product mockup prompt
     */
    async generateMockup(description: string, productType: string): Promise<ImagePromptResult> {
        const prompt = `Create a professional product mockup for ${productType}: ${description}

Requirements:
- Studio lighting
- Clean background
- Professional photography style
- High-end product presentation
- Show product details clearly`;

        return this.generateImagePrompt(prompt, {
            lighting: 'studio',
            resolution: '4K',
            style: 'photorealistic',
            colorGrading: 'clean'
        });
    }

    /**
     * Generate character-consistent prompt
     */
    async generateCharacterPrompt(characterDescription: string, scene: string): Promise<ImagePromptResult> {
        const prompt = `Character: ${characterDescription}
Scene: ${scene}

Maintain character consistency:
- Same facial features
- Same body proportions
- Same clothing style
- Same color palette

Generate the character in this new scene while preserving all identifying characteristics.`;

        return this.generateImagePrompt(prompt, {
            style: 'illustration',
            resolution: '2K'
        });
    }

    /**
     * Generate editing instructions
     */
    async generateEditInstructions(originalDescription: string, edits: ImageEdits): Promise<EditInstructions> {
        const { lighting, camera, color, elements } = edits;

        const editPrompt = `Original image: ${originalDescription}

Apply these edits:
${lighting ? `- Lighting: Change to ${lighting}` : ''}
${camera ? `- Camera: Adjust to ${camera}` : ''}
${color ? `- Color: Apply ${color} grading` : ''}
${elements ? `- Elements: ${elements.join(', ')}` : ''}

Generate detailed instructions for applying these edits.`;

        try {
            const result = await this.model.generateContent(editPrompt);
            const response = result.response.text();

            return {
                instructions: response,
                edits,
                originalDescription
            };
        } catch (error) {
            return {
                instructions: 'Edit instructions generation failed',
                edits,
                originalDescription
            };
        }
    }

    /**
     * Parse image prompt response
     */
    private parseImagePrompt(response: string, options: ImageOptions): ImagePromptResult {
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return {
                    optimizedPrompt: parsed.optimizedPrompt || response,
                    negativePrompt: parsed.negativePrompt || 'low quality, blurry, distorted',
                    settings: parsed.suggestedSettings || options,
                    description: parsed.description || 'AI-generated image',
                    tags: parsed.tags || []
                };
            }

            return this.fallbackImagePrompt(response, options);
        } catch (error) {
            return this.fallbackImagePrompt(response, options);
        }
    }

    /**
     * Fallback image prompt generation
     */
    private fallbackImagePrompt(userPrompt: string, options: ImageOptions): ImagePromptResult {
        const { resolution, aspectRatio, lighting, cameraAngle, colorGrading } = options;

        return {
            optimizedPrompt: `${userPrompt}, ${resolution} resolution, ${aspectRatio} aspect ratio, ${lighting} lighting, ${cameraAngle} camera angle, ${colorGrading} color grading, highly detailed, professional quality`,
            negativePrompt: 'low quality, blurry, distorted, watermark, text, logo',
            settings: options,
            description: userPrompt,
            tags: ['ai-generated', 'high-quality']
        };
    }
}

// Types
export interface ImageOptions {
    resolution?: '2K' | '4K' | '8K';
    aspectRatio?: string;
    lighting?: 'natural' | 'studio' | 'dramatic' | 'soft' | 'golden-hour';
    cameraAngle?: string;
    colorGrading?: string;
    style?: string;
}

export interface ImagePromptResult {
    optimizedPrompt: string;
    negativePrompt: string;
    settings: ImageOptions;
    description: string;
    tags: string[];
}

export interface DiagramData {
    type: 'bar' | 'line' | 'pie' | 'flow' | 'network' | 'timeline';
    title: string;
    dataPoints: any[];
    style?: 'modern' | 'minimal' | 'corporate' | 'creative';
}

export interface ImageEdits {
    lighting?: string;
    camera?: string;
    color?: string;
    elements?: string[];
}

export interface EditInstructions {
    instructions: string;
    edits: ImageEdits;
    originalDescription: string;
}

export type TextStyle = 'modern' | 'professional' | 'creative' | 'bold' | 'elegant';

// Export singleton getter
export function getNanoBananaService(apiKey?: string): NanoBananaService {
    return NanoBananaService.getInstance(apiKey);
}
