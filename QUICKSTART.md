# Shadow AI v3 - Quick Start Guide

## 🚀 Getting Started

### Step 1: Navigate to Project Directory

```bash
cd /Volumes/KIWIBIRD/antigravity/shadow-ai
```

**Important:** Make sure you're in the `shadow-ai` directory, not just `antigravity`!

### Step 2: Wait for Installation to Complete

The `npm install` is currently running. Wait for it to finish (you'll see "added XXX packages" message).

### Step 3: Configure Environment (Optional)

If you have API keys for cloud AI models:

```bash
cp .env.example .env
nano .env  # or use your preferred editor
```

Add your API keys:
```env
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
# etc.
```

**Note:** Shadow AI works with local models too (Ollama, LM Studio), so API keys are optional!

### Step 4: Run Development Mode

```bash
npm run dev
```

This will:
- Start the Vite dev server
- Launch the Electron app
- Open DevTools for debugging

### Step 5: Try Your First Command

Once the app opens, try these commands in the Smart Prompt Editor:

**Build a simple React app:**
```
/build Create a simple React counter app with increment and decrement buttons
```

**Analyze code:**
```
/analyze What are the key components in this project?
```

**Get architecture diagram:**
```
Click on the "Flowchart" tab to see the multi-agent architecture
```

## 🎮 Available Commands

- `/build` - Build a complete project
- `/debug` - Find and fix bugs
- `/design` - Create UI designs
- `/deploy` - Deploy to Vercel/Netlify
- `/evolve` - Analyze and improve
- `/analyze` - Analyze files/code

## 🐛 Troubleshooting

### If npm install fails:

```bash
# Clear cache and retry
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### If Electron won't start:

```bash
# Rebuild native modules
npm run build
```

### If you get "model not found" errors:

Either:
1. Add API keys to `.env` file, OR
2. Install Ollama: `brew install ollama` and run `ollama serve`

## 📚 Next Steps

1. **Explore the UI** - Check out all the panels and tabs
2. **Try building a project** - Use `/build` to create something
3. **View the flowchart** - See how agents work together
4. **Check the Model Dashboard** - See which AI models are available

## 🎯 Example Workflows

### Build a Next.js Blog:
```
/build Create a Next.js blog with:
- MDX support for posts
- Dark mode toggle
- Responsive design
- SEO optimization
```

### Debug Performance:
```
/debug Analyze this React component for performance issues and suggest optimizations
```

### Design a Dashboard:
```
/design Create a modern analytics dashboard with charts, metrics cards, and a sidebar navigation
```

---

**Need help?** Check the README.md or walkthrough.md for detailed documentation!
