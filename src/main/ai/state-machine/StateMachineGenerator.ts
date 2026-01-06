// State Machine Generator - Generate state machine implementations
import Anthropic from '@anthropic-ai/sdk';

interface StateConfig {
    id: string;
    initial: string;
    states: Record<string, { on?: Record<string, string>; entry?: string; exit?: string }>;
}

class StateMachineGenerator {
    private anthropic: Anthropic | null = null;

    generateXStateMachine(config: StateConfig): string {
        const statesObj = Object.entries(config.states).map(([name, state]) => {
            const on = state.on ? Object.entries(state.on).map(([event, target]) => `        ${event}: '${target}'`).join(',\n') : '';
            return `    ${name}: {
${on ? `      on: {\n${on}\n      },` : ''}
${state.entry ? `      entry: '${state.entry}',` : ''}
${state.exit ? `      exit: '${state.exit}',` : ''}
    }`;
        }).join(',\n');

        return `import { createMachine, assign } from 'xstate';

export const ${config.id}Machine = createMachine({
  id: '${config.id}',
  initial: '${config.initial}',
  context: {},
  states: {
${statesObj}
  }
}, {
  actions: {},
  guards: {},
});
`;
    }

    generateXStateReactHook(machineId: string): string {
        return `import { useMachine } from '@xstate/react';
import { ${machineId}Machine } from './${machineId}Machine';

export function use${machineId}() {
    const [state, send] = useMachine(${machineId}Machine);

    return {
        state: state.value,
        context: state.context,
        send,
        matches: state.matches,
        can: (event: string) => state.can(event),
    };
}
`;
    }

    generateZustandStore(name: string, state: Record<string, unknown>): string {
        const stateTypes = Object.entries(state).map(([key, value]) => {
            const type = typeof value === 'string' ? 'string' : typeof value === 'number' ? 'number' : typeof value === 'boolean' ? 'boolean' : 'any';
            return `  ${key}: ${type};`;
        }).join('\n');

        const initialState = Object.entries(state).map(([key, value]) => `  ${key}: ${JSON.stringify(value)},`).join('\n');

        return `import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface ${name}State {
${stateTypes}
  // Actions
  set${name}: (updates: Partial<${name}State>) => void;
  reset: () => void;
}

const initialState = {
${initialState}
};

export const use${name}Store = create<${name}State>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,
        set${name}: (updates) => set((state) => ({ ...state, ...updates })),
        reset: () => set(initialState),
      }),
      { name: '${name.toLowerCase()}-storage' }
    )
  )
);
`;
    }

    generateReduxSlice(name: string, state: Record<string, unknown>): string {
        const stateTypes = Object.entries(state).map(([key, value]) => {
            const type = typeof value === 'string' ? 'string' : typeof value === 'number' ? 'number' : typeof value === 'boolean' ? 'boolean' : 'any';
            return `  ${key}: ${type};`;
        }).join('\n');

        return `import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ${name}State {
${stateTypes}
}

const initialState: ${name}State = ${JSON.stringify(state, null, 2)};

export const ${name.toLowerCase()}Slice = createSlice({
  name: '${name.toLowerCase()}',
  initialState,
  reducers: {
    update${name}: (state, action: PayloadAction<Partial<${name}State>>) => {
      return { ...state, ...action.payload };
    },
    reset${name}: () => initialState,
  },
});

export const { update${name}, reset${name} } = ${name.toLowerCase()}Slice.actions;
export default ${name.toLowerCase()}Slice.reducer;
`;
    }
}

export const stateMachineGenerator = new StateMachineGenerator();
