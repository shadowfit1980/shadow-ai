# Shadow AI MCP Server

Model Context Protocol (MCP) server for Shadow AI, exposing AI capabilities, code generation, and external services.

## Features

### 🛠️ **Tools**
- `generate_code` - AI-powered code generation
- `import_figma` - Import Figma designs
- `query_database` - Query Supabase database
- `create_canva_design` - Get Canva design URLs

### 📦 **Resources**
- `shadow://code/current` - Current code in editor
- `shadow://chat/history` - Chat conversation history
- `shadow://services/status` - External services status

### 💡 **Prompts**
- `create_component` - Create React components
- `debug_code` - Debug and fix code
- `optimize_code` - Optimize for performance

## Installation

```bash
npm install @modelcontextprotocol/sdk
```

## Usage

### Standalone Server

```bash
# Build
npm run build:main

# Run
node dist/main/mcp/MCPServer.js
```

### With Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "shadow-ai": {
      "command": "node",
      "args": ["/path/to/shadow-ai/dist/main/mcp/MCPServer.js"]
    }
  }
}
```

### MCP Inspector (Testing)

```bash
npx @modelcontextprotocol/inspector node dist/main/mcp/MCPServer.js
```

## Examples

### Generate Code

```json
{
  "method": "tools/call",
  "params": {
    "name": "generate_code",
    "arguments": {
      "description": "Create a responsive navbar",
      "language": "html"
    }
  }
}
```

### Import Figma Design

```json
{
  "method": "tools/call",
  "params": {
    "name": "import_figma",
    "arguments": {
      "url": "https://www.figma.com/file/ABC123/Design"
    }
  }
}
```

### Query Database

```json
{
  "method": "tools/call",
  "params": {
    "name": "query_database",
    "arguments": {
      "table": "users",
      "filters": { "status": "active" }
    }
  }
}
```

## Architecture

```
MCP Client (e.g., Claude Desktop)
       ↓
  stdio transport
       ↓
Shadow MCP Server
       ↓
    ├─ Tools → Shadow AI Core
    ├─ Resources → App State
    └─ Prompts → Templates
```

## Development

### Add New Tool

```typescript
// In tools.ts
{
  name: 'my_tool',
  description: 'My custom tool',
  inputSchema: {
    type: 'object',
    properties: {
      param: { type: 'string' }
    }
  }
}
```

### Add New Resource

```typescript
// In resources.ts
{
  uri: 'shadow://my/resource',
  name: 'My Resource',
  mimeType: 'application/json'
}
```

## License

MIT
