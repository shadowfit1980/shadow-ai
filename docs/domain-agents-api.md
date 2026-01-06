/**
 * API Documentation for Domain-Specific Agents
 * 
 * Complete reference for MobileAgent, GameAgent, DesktopAgent, and supporting services.
 */

# Shadow AI Domain Agent API Reference

## Table of Contents

1. [Domain Agents](#domain-agents)
2. [Intelligence Services](#intelligence-services)
3. [React Hooks](#react-hooks)
4. [IPC Channels](#ipc-channels)
5. [Domain Tools](#domain-tools)

---

## Domain Agents

### MobileAgent

Specializes in iOS, Android, React Native, and Flutter development.

#### Capabilities
| Name | Confidence | Description |
|------|------------|-------------|
| `mobile_platform_detection` | 0.95 | Detect mobile platform and framework |
| `cross_platform_code_gen` | 0.9 | Generate RN/Flutter code |
| `native_code_gen` | 0.88 | Generate Swift/Kotlin code |
| `app_store_optimization` | 0.85 | ASO metadata generation |
| `mobile_performance_analysis` | 0.87 | Analyze app performance |
| `ui_component_generation` | 0.9 | Generate platform-specific UI |

#### Methods
```typescript
detectPlatform(task): Promise<MobilePlatform>
generateMobileSolution(task, platform): Promise<any>
generateAppStoreMetadata(description, platform): Promise<any>
analyzePerformance(task, platform): Promise<any>
```

---

### GameAgent

Specializes in Unity, Unreal Engine, and Godot game development.

#### Capabilities
| Name | Confidence | Description |
|------|------------|-------------|
| `game_engine_detection` | 0.93 | Detect game engine |
| `game_architecture_design` | 0.88 | Design ECS/patterns |
| `unity_development` | 0.9 | C# scripts |
| `unreal_development` | 0.85 | C++/Blueprints |
| `godot_development` | 0.87 | GDScript |
| `procedural_generation` | 0.85 | PCG algorithms |
| `multiplayer_architecture` | 0.82 | Netcode design |
| `game_balance` | 0.78 | Balance analysis |

#### Methods
```typescript
detectGameProject(task): Promise<GameProject>
generateGameSolution(task, project): Promise<any>
designArchitecture(task, project): Promise<any>
generateProcedural(asset, project): Promise<any>
designMultiplayer(task, project): Promise<any>
```

---

### DesktopAgent

Specializes in Windows, macOS, and Linux native development.

#### Capabilities
| Name | Confidence | Description |
|------|------------|-------------|
| `native_api_generation` | 0.85 | Win32/Cocoa/GTK bindings |
| `cross_platform_abstraction` | 0.9 | Platform-agnostic code |
| `installer_creation` | 0.92 | MSI/DMG/AppImage |
| `electron_development` | 0.93 | Electron patterns |
| `tauri_development` | 0.88 | Tauri/Rust backend |
| `system_integration` | 0.85 | OS integration |
| `native_performance` | 0.82 | Optimization |

#### Methods
```typescript
detectDesktopProject(task): Promise<DesktopProject>
generateDesktopSolution(task, project): Promise<any>
generateInstallerConfig(config, project): Promise<any>
analyzeCrossPlatform(task, project): Promise<any>
```

---

## Intelligence Services

### TemporalContextEngine
```typescript
analyzeCodeArchaeology(filePath): Promise<CodeArchaeology>
learnDeveloperPatterns(developerId): Promise<DeveloperPattern>
predictNextAction(developerId, file, actions): Promise<Prediction[]>
analyzeFutureCompatibility(code, deps): Promise<FutureCompatibility>
```

### HiveMindService
```typescript
learnPattern(problem, solution, category): Promise<KnowledgePattern>
queryPatterns(query): Promise<PatternMatch[]>
getBestSolution(problem, context): Promise<PatternMatch | null>
contributePatterns(): Promise<number>
```

### RealitySimulatorService
```typescript
createShadowDeployment(config): Promise<SimulationResult>
simulateUsers(options): Promise<SimulationResult>
runChaosExperiment(experiment): Promise<SimulationResult>
runLoadTest(options): Promise<SimulationResult>
testResilience(components): Promise<ResilienceResult>
```

### DeveloperMindMerge
```typescript
learnFromCode(code, context): void
learnFromDebugging(problem, solution): void
predictCompletion(partialCode): string[]
getInsights(): DeveloperInsights
```

---

## React Hooks

```typescript
useMobileAgent()   // capabilities, detectPlatform, execute
useGameAgent()     // capabilities, detectEngine, generateProcedural
useDesktopAgent()  // capabilities, detectFramework, generateInstaller
useHiveMind()      // stats, query, learnPattern
useSimulator()     // stats, runLoadTest, runChaos
useTemporalContext() // stats, analyzeArchaeology, predictNext
useDomainTools()   // tools, listByCategory, execute
```

---

## IPC Channels

### Mobile
- `mobile:execute`, `mobile:detectPlatform`, `mobile:generateMetadata`

### Game
- `game:execute`, `game:detectEngine`, `game:generateProcedural`, `game:designMultiplayer`

### Desktop
- `desktop:execute`, `desktop:detectFramework`, `desktop:generateInstaller`

### Services
- `temporal:analyzeArchaeology`, `temporal:learnPatterns`, `temporal:predictNext`
- `hivemind:learnPattern`, `hivemind:query`, `hivemind:getBestSolution`
- `simulator:createShadow`, `simulator:simulateUsers`, `simulator:runChaos`

---

## Domain Tools

### Mobile (4)
- `detectMobilePlatform`, `generateAppStoreMetadata`, `analyzeAppPerformance`, `generateMobileComponent`

### Game (5)
- `detectGameEngine`, `generateProceduralContent`, `designGameStateMachine`, `analyzeGameBalance`, `generateMultiplayerArchitecture`

### Desktop (4)
- `detectDesktopFramework`, `generateInstallerConfig`, `generateNativeBinding`, `testCrossPlatform`
