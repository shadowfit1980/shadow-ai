# Shadow AI v3 🤖

**Autonomous, Self-Evolving AI Engineering Agent**

Shadow AI v3 is a fully capable software engineer, system architect, designer, and problem-solver built with Electron, React, and TypeScript. It combines multiple specialized AI agents to build, debug, design, and deploy complete projects from start to finish.

![Shadow AI Architecture](./docs/architecture-diagram.png)

## ✨ Features

### 🧠 Multi-Agent Intelligence
- **Shadow Architect**: System design and architecture planning
- **Shadow Builder**: Code generation and project scaffolding
- **Shadow Debugger**: Bug detection and automated fixing
- **Shadow UX**: UI/UX design and component creation
- **Shadow Communicator**: User interaction and prompt enhancement

### 🤖 AI Model Support
- **Cloud Models**: OpenAI (GPT-4, GPT-3.5), Anthropic (Claude 3), Mistral, DeepSeek
- **Local Models**: Ollama, GPT4All, LM Studio
- **Auto-Selection**: Automatically chooses the best available model
- **Performance Tracking**: Real-time metrics and optimization

### 🏗️ Project Building
- **Frameworks**: Next.js, React, Vue, Astro, Flask, Express, and more
- **Auto-Scaffolding**: Complete project structure generation
- **Build Optimization**: Image compression, code splitting, caching
- **Multi-Language**: TypeScript, JavaScript, Python, Rust, Go, C++

### 🚀 Deployment & Publishing
- **Platforms**: Vercel, Netlify, Render
- **SEO**: Automatic metadata, sitemaps, robots.txt generation
- **Packaging**: Export as .exe (Windows), .dmg (macOS), .AppImage (Linux)

### 🎨 Visual Interface
- **Smart Prompt Editor**: Command palette with auto-completion
- **Monaco Code Editor**: Full-featured IDE with syntax highlighting
- **Flowchart Viewer**: Interactive architecture diagrams
- **Model Dashboard**: Real-time AI model monitoring
- **Live Preview**: Run and test applications instantly

### 🧬 Self-Improvement
- **Learning System**: Persistent memory and knowledge base
- **Performance Analysis**: Tracks success patterns
- **Auto-Evolution**: Continuously improves based on experience
- **Evolution Log**: Transparent improvement tracking

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- (Optional) Ollama, GPT4All, or LM Studio for local AI models

### Installation

1. **Clone or navigate to the project**:
   ```bash
   cd shadow-ai
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env and add your API keys
   ```

4. **Run in development mode**:
   ```bash
   npm run dev
   ```

5. **Build for production**:
   ```bash
   npm run build
   npm run package      # Package for all platforms
   npm run package:mac  # macOS only
   npm run package:win  # Windows only
   npm run package:linux # Linux only
   ```

## 🎮 Usage

### Commands

Shadow AI supports powerful slash commands:

- `/build` - Build a complete project
- `/debug` - Detect and fix code issues
- `/design` - Generate or import UI design
- `/deploy` - Deploy website or app
- `/evolve` - Improve agent intelligence
- `/analyze` - Analyze files or code

### Example Workflows

**Build a Next.js App**:
```
/build Create a modern e-commerce website with Next.js, TailwindCSS, and Stripe integration
```

**Debug Code**:
```
/debug Find and fix performance issues in my React application
```

**Design UI**:
```
/design Create a dark-themed dashboard with charts and analytics
```

**Deploy**:
```
/deploy Deploy my project to Vercel with automatic SEO optimization
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file with your API keys:

```env
# Cloud AI Models
OPENAI_API_KEY=your-key-here
ANTHROPIC_API_KEY=your-key-here
MISTRAL_API_KEY=your-key-here

# Design Integration (Optional)
FIGMA_TOKEN=your-token
CANVA_CLIENT_ID=your-client-id

# Deployment (Optional)
VERCEL_TOKEN=your-token
NETLIFY_TOKEN=your-token

# Local AI Models (Optional)
OLLAMA_URL=http://localhost:11434
LMSTUDIO_URL=http://localhost:1234

# Application Settings
DEFAULT_MODEL=auto  # or specific model ID
ENABLE_VOICE=true
```

### Model Configuration

Shadow AI automatically detects and uses available models. Priority order:
1. Claude 3 Opus
2. GPT-4 Turbo
3. Claude 3 Sonnet
4. GPT-3.5 Turbo
5. Local models (Ollama, LM Studio)

## 🏗️ Architecture

Shadow AI uses a multi-layered architecture:

```
┌─────────────────────────────────────┐
│         Electron UI Layer           │
│  (React + TailwindCSS + Monaco)     │
└─────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│       Multi-Agent System            │
│  Architect │ Builder │ Debugger     │
│     UX     │ Communicator           │
└─────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│        AI Model Manager             │
│  Cloud Models │ Local Models        │
└─────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│      Core Services Layer            │
│  Security │ Memory │ Builder        │
└─────────────────────────────────────┘
```

## 📚 Documentation

- [Architecture Guide](./docs/ARCHITECTURE.md)
- [API Documentation](./docs/API.md)
- [Plugin Development](./docs/PLUGINS.md)

## 🔒 Security

- **AES-256 Encryption**: All sensitive data encrypted at rest
- **Sandboxed Execution**: Code runs in isolated environments
- **No Hardcoded Secrets**: All credentials in environment variables
- **Input Validation**: Prevents injection attacks

## 🤝 Contributing

Shadow AI is designed to be extensible through plugins. See [Plugin Development Guide](./docs/API.md) for details.

## 📝 License

MIT License - See LICENSE file for details

## 🙏 Acknowledgments

Built with:
- [Electron](https://www.electronjs.org/)
- [React](https://react.dev/)
- [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- [ReactFlow](https://reactflow.dev/)
- [TailwindCSS](https://tailwindcss.com/)
- [Framer Motion](https://www.framer.com/motion/)

---

**Shadow AI v3** - Empowering developers to create, automate, and deploy software effortlessly.
