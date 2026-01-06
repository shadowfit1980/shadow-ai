/**
 * ✨ Shader Generator
 * 
 * Procedural shader code generation:
 * - GLSL shaders
 * - Post-processing effects
 * - Material shaders
 * - Particle shaders
 */

import { EventEmitter } from 'events';

export type ShaderType = 'vertex' | 'fragment' | 'compute';
export type ShaderEffect = 'blur' | 'glow' | 'dissolve' | 'wave' | 'pixelate' | 'chromatic' | 'vignette';

export interface ShaderConfig {
    name: string;
    type: ShaderType;
    effect?: ShaderEffect;
    uniforms: { name: string; type: string; default: any }[];
}

export class ShaderGenerator extends EventEmitter {
    private static instance: ShaderGenerator;

    private constructor() { super(); }

    static getInstance(): ShaderGenerator {
        if (!ShaderGenerator.instance) {
            ShaderGenerator.instance = new ShaderGenerator();
        }
        return ShaderGenerator.instance;
    }

    generateEffect(effect: ShaderEffect): { vertex: string; fragment: string } {
        const vertex = this.getBasicVertexShader();
        let fragment = '';

        switch (effect) {
            case 'blur':
                fragment = this.getBlurShader();
                break;
            case 'glow':
                fragment = this.getGlowShader();
                break;
            case 'dissolve':
                fragment = this.getDissolveShader();
                break;
            case 'wave':
                fragment = this.getWaveShader();
                break;
            case 'pixelate':
                fragment = this.getPixelateShader();
                break;
            case 'chromatic':
                fragment = this.getChromaticShader();
                break;
            case 'vignette':
                fragment = this.getVignetteShader();
                break;
        }

        return { vertex, fragment };
    }

    private getBasicVertexShader(): string {
        return `
attribute vec2 a_position;
attribute vec2 a_texCoord;
varying vec2 v_texCoord;
uniform mat3 u_matrix;

void main() {
    gl_Position = vec4((u_matrix * vec3(a_position, 1)).xy, 0, 1);
    v_texCoord = a_texCoord;
}`;
    }

    private getBlurShader(): string {
        return `
precision mediump float;
varying vec2 v_texCoord;
uniform sampler2D u_texture;
uniform vec2 u_resolution;
uniform float u_blur;

void main() {
    vec4 color = vec4(0.0);
    float total = 0.0;
    
    for (float x = -4.0; x <= 4.0; x++) {
        for (float y = -4.0; y <= 4.0; y++) {
            vec2 offset = vec2(x, y) * u_blur / u_resolution;
            float weight = 1.0 - length(vec2(x, y)) / 5.65;
            color += texture2D(u_texture, v_texCoord + offset) * weight;
            total += weight;
        }
    }
    
    gl_FragColor = color / total;
}`;
    }

    private getGlowShader(): string {
        return `
precision mediump float;
varying vec2 v_texCoord;
uniform sampler2D u_texture;
uniform vec2 u_resolution;
uniform float u_intensity;
uniform vec3 u_glowColor;

void main() {
    vec4 color = texture2D(u_texture, v_texCoord);
    vec4 glow = vec4(0.0);
    
    for (float i = -3.0; i <= 3.0; i++) {
        for (float j = -3.0; j <= 3.0; j++) {
            vec2 offset = vec2(i, j) * 2.0 / u_resolution;
            glow += texture2D(u_texture, v_texCoord + offset);
        }
    }
    
    glow /= 49.0;
    glow.rgb = u_glowColor * glow.a;
    
    gl_FragColor = color + glow * u_intensity;
}`;
    }

    private getDissolveShader(): string {
        return `
precision mediump float;
varying vec2 v_texCoord;
uniform sampler2D u_texture;
uniform sampler2D u_noise;
uniform float u_threshold;
uniform vec3 u_edgeColor;
uniform float u_edgeWidth;

void main() {
    vec4 color = texture2D(u_texture, v_texCoord);
    float noise = texture2D(u_noise, v_texCoord).r;
    
    if (noise < u_threshold) {
        discard;
    }
    
    float edge = smoothstep(u_threshold, u_threshold + u_edgeWidth, noise);
    color.rgb = mix(u_edgeColor, color.rgb, edge);
    
    gl_FragColor = color;
}`;
    }

    private getWaveShader(): string {
        return `
precision mediump float;
varying vec2 v_texCoord;
uniform sampler2D u_texture;
uniform float u_time;
uniform float u_amplitude;
uniform float u_frequency;

void main() {
    vec2 uv = v_texCoord;
    uv.x += sin(uv.y * u_frequency + u_time) * u_amplitude;
    uv.y += cos(uv.x * u_frequency + u_time) * u_amplitude * 0.5;
    
    gl_FragColor = texture2D(u_texture, uv);
}`;
    }

    private getPixelateShader(): string {
        return `
precision mediump float;
varying vec2 v_texCoord;
uniform sampler2D u_texture;
uniform vec2 u_resolution;
uniform float u_pixelSize;

void main() {
    vec2 uv = v_texCoord;
    vec2 pixelated = floor(uv * u_resolution / u_pixelSize) * u_pixelSize / u_resolution;
    
    gl_FragColor = texture2D(u_texture, pixelated);
}`;
    }

    private getChromaticShader(): string {
        return `
precision mediump float;
varying vec2 v_texCoord;
uniform sampler2D u_texture;
uniform float u_offset;

void main() {
    vec2 uv = v_texCoord;
    vec2 center = vec2(0.5, 0.5);
    vec2 dir = normalize(uv - center);
    
    float r = texture2D(u_texture, uv + dir * u_offset).r;
    float g = texture2D(u_texture, uv).g;
    float b = texture2D(u_texture, uv - dir * u_offset).b;
    float a = texture2D(u_texture, uv).a;
    
    gl_FragColor = vec4(r, g, b, a);
}`;
    }

    private getVignetteShader(): string {
        return `
precision mediump float;
varying vec2 v_texCoord;
uniform sampler2D u_texture;
uniform float u_intensity;
uniform float u_radius;

void main() {
    vec4 color = texture2D(u_texture, v_texCoord);
    
    vec2 uv = v_texCoord;
    uv = (uv - 0.5) * 2.0;
    float dist = length(uv);
    float vignette = smoothstep(u_radius, u_radius - 0.5, dist);
    
    color.rgb *= mix(1.0 - u_intensity, 1.0, vignette);
    
    gl_FragColor = color;
}`;
    }

    getAllEffects(): ShaderEffect[] {
        return ['blur', 'glow', 'dissolve', 'wave', 'pixelate', 'chromatic', 'vignette'];
    }

    generateShaderClass(): string {
        return `
class ShaderProgram {
    constructor(gl, vertexSrc, fragmentSrc) {
        this.gl = gl;
        this.program = this.createProgram(vertexSrc, fragmentSrc);
        this.uniforms = {};
        this.attributes = {};
    }

    createProgram(vertexSrc, fragmentSrc) {
        const gl = this.gl;
        const vertex = this.compileShader(gl.VERTEX_SHADER, vertexSrc);
        const fragment = this.compileShader(gl.FRAGMENT_SHADER, fragmentSrc);
        
        const program = gl.createProgram();
        gl.attachShader(program, vertex);
        gl.attachShader(program, fragment);
        gl.linkProgram(program);
        
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            throw new Error('Shader link failed: ' + gl.getProgramInfoLog(program));
        }
        
        return program;
    }

    compileShader(type, source) {
        const gl = this.gl;
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            throw new Error('Shader compile failed: ' + gl.getShaderInfoLog(shader));
        }
        
        return shader;
    }

    use() {
        this.gl.useProgram(this.program);
    }

    getUniform(name) {
        if (!this.uniforms[name]) {
            this.uniforms[name] = this.gl.getUniformLocation(this.program, name);
        }
        return this.uniforms[name];
    }

    setFloat(name, value) {
        this.gl.uniform1f(this.getUniform(name), value);
    }

    setVec2(name, x, y) {
        this.gl.uniform2f(this.getUniform(name), x, y);
    }

    setVec3(name, x, y, z) {
        this.gl.uniform3f(this.getUniform(name), x, y, z);
    }
}`;
    }
}

export const shaderGenerator = ShaderGenerator.getInstance();
