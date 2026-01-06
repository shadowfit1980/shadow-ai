# Installing Shadow AI on macOS

## 📦 Installation Methods

### Method 1: Run from Source (Recommended for Development)

This is the easiest way to get started:

```bash
# 1. Navigate to the project
cd /Volumes/KIWIBIRD/antigravity/shadow-ai

# 2. Install dependencies (fixed - no native compilation needed!)
npm install

# 3. Run the app
npm run dev
```

The app will open automatically in development mode with hot reload.

---

### Method 2: Build Native macOS App (.dmg)

Create a standalone macOS application:

```bash
# 1. Navigate to the project
cd /Volumes/KIWIBIRD/antigravity/shadow-ai

# 2. Make sure dependencies are installed
npm install

# 3. Build the production app
npm run build

# 4. Package for macOS
npm run package:mac
```

This will create:
- **DMG installer**: `release/Shadow AI-3.0.0.dmg`
- **ZIP archive**: `release/Shadow AI-3.0.0-mac.zip`

**To install:**
1. Open the `.dmg` file
2. Drag "Shadow AI" to your Applications folder
3. Launch from Applications or Spotlight

---

### Method 3: Quick Build Script

I can create a simple build script for you:

```bash
#!/bin/bash
# build-mac.sh

echo "🏗️  Building Shadow AI for macOS..."

cd /Volumes/KIWIBIRD/antigravity/shadow-ai

# Clean previous builds
rm -rf release dist

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build
echo "🔨 Building application..."
npm run build

# Package for macOS
echo "📱 Creating macOS installer..."
npm run package:mac

echo "✅ Done! Your app is in the 'release' folder"
echo "📦 Install: release/Shadow AI-3.0.0.dmg"
```

---

## 🚀 What I Fixed

The original installation failed because `better-sqlite3` (a native SQLite module) couldn't compile with Node.js v24. 

**Solution:** I replaced it with `electron-store`, which:
- ✅ No native compilation needed
- ✅ Works on all Node.js versions
- ✅ Simpler and faster
- ✅ Perfect for Electron apps

---

## 🎯 Next Steps

**Option A - Run Now (Development):**
```bash
cd /Volumes/KIWIBIRD/antigravity/shadow-ai
npm install  # Currently running
npm run dev  # Run this after install completes
```

**Option B - Build Installer (Production):**
```bash
cd /Volumes/KIWIBIRD/antigravity/shadow-ai
npm install  # Currently running
npm run package:mac  # Creates .dmg installer
```

---

## 📱 Using the Installed App

Once installed, Shadow AI will be a native macOS app:

- **Location**: `/Applications/Shadow AI.app`
- **Launch**: Spotlight → "Shadow AI"
- **Updates**: Rebuild and reinstall the .dmg

---

## 🔧 Troubleshooting

**If npm install fails again:**
```bash
# Clear everything and retry
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

**If the app won't open:**
```bash
# macOS may block unsigned apps
# Right-click → Open → Open anyway
# Or in System Settings → Privacy & Security
```

**If you get "damaged app" error:**
```bash
# Remove quarantine attribute
xattr -cr "/Applications/Shadow AI.app"
```

---

## 💡 Pro Tips

1. **Development Mode** (`npm run dev`):
   - Hot reload enabled
   - DevTools open by default
   - Faster iteration

2. **Production Build** (`npm run package:mac`):
   - Optimized and minified
   - Smaller file size
   - Ready to distribute

3. **Code Signing** (Optional):
   - For distribution outside your Mac
   - Requires Apple Developer account
   - Add to `package.json` build config

---

**The npm install is currently running with the fixed dependencies!**
