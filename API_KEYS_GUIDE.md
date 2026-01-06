# How to Add API Keys to Shadow AI

## Quick Steps

1. **Launch Shadow AI**
   ```bash
   npm run dev
   ```

2. **Open Settings**
   - Click the **⚙️ Settings** button in the top-right corner

3. **Add Your API Key**
   - Select the **☁️ Cloud Models** tab
   - Choose your provider (OpenAI, Anthropic, Mistral, DeepSeek, or Gemini)
   - Paste your API key in the input field
   - Click **Save**

4. **Verify Connection**
   - You'll see a green success message: "✓ OPENAI API key saved! X models available"
   - The number tells you how many models are now accessible
   - Check the **Model Dashboard** on the right side - your models should appear!

5. **Refresh Models** (if needed)
   - Click "Refresh Models" button in the header
   - Or close and reopen the Settings panel

## Getting API Keys

### OpenAI (GPT-4, GPT-3.5)
1. Go to [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Click "Create new secret key"
3. Copy the key (starts with `sk-`)

### Anthropic (Claude)
1. Go to [console.anthropic.com](https://console.anthropic.com/)
2. Navigate to API Keys
3. Create a new key (starts with `sk-ant-`)

### Mistral AI
1. Go to [console.mistral.ai](https://console.mistral.ai/)
2. Get your API key from the dashboard

### DeepSeek
1. Go to [platform.deepseek.com](https://platform.deepseek.com/)
2. Sign up and get your API key

### Google Gemini
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create an API key

## Local Models (No API Key Needed!)

Shadow AI already detects **Ollama** if it's running on your machine:
- Default URL: `http://localhost:11434`
- Install from [ollama.ai](https://ollama.ai/)
- Run: `ollama run llama2`

## Troubleshooting

**Models not showing up?**
- Make sure you clicked "Save" after pasting the key
- Check the success message shows "X models available"
- Try clicking "Refresh Models" in the header
- Check browser console (F12) for errors

**API key not working?**
- Verify the key is correct (no extra spaces)
- Make sure you have credits/quota with the provider
- Check your API key permissions

**Still having issues?**
- Restart the app: Stop `npm run dev` and run it again
- Check the terminal for error messages
- Make sure you're using the correct API key format

## What Happens When You Save?

1. Key is saved to `localStorage` (browser storage)
2. Sent to main process via IPC
3. ModelManager updates environment variables
4. Models are reinitialized
5. Available models appear in the dashboard

No restart needed! 🚀
