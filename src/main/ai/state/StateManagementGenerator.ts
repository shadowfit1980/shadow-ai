/**
 * State Management Generator
 * 
 * Generate state management boilerplate for React, Vue,
 * Flutter, and mobile apps.
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

export type StateLibrary = 'redux' | 'zustand' | 'jotai' | 'mobx' | 'pinia' | 'vuex' | 'riverpod' | 'bloc';

export interface StateSlice {
    name: string;
    state: Record<string, { type: string; default: any }>;
    actions: string[];
    selectors?: string[];
}

// ============================================================================
// STATE MANAGEMENT GENERATOR
// ============================================================================

export class StateManagementGenerator extends EventEmitter {
    private static instance: StateManagementGenerator;

    private constructor() {
        super();
    }

    static getInstance(): StateManagementGenerator {
        if (!StateManagementGenerator.instance) {
            StateManagementGenerator.instance = new StateManagementGenerator();
        }
        return StateManagementGenerator.instance;
    }

    // ========================================================================
    // REACT STATE
    // ========================================================================

    /**
     * Generate Zustand store
     */
    generateZustandStore(slice: StateSlice): string {
        const { name, state, actions } = slice;
        const stateName = name.charAt(0).toLowerCase() + name.slice(1);

        return `import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface ${name}State {
${Object.entries(state).map(([key, val]) => `  ${key}: ${val.type};`).join('\n')}
${actions.map(action => `  ${action}: (${this.getActionParams(action)}) => void;`).join('\n')}
}

export const use${name}Store = create<${name}State>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
${Object.entries(state).map(([key, val]) => `        ${key}: ${JSON.stringify(val.default)},`).join('\n')}

        // Actions
${actions.map(action => `        ${action}: (${this.getActionParams(action)}) => {
          set((state) => ({
            // TODO: Implement ${action}
          }));
        },`).join('\n')}
      }),
      { name: '${stateName}-storage' }
    )
  )
);

// Selectors
${slice.selectors?.map(sel => `export const select${this.capitalize(sel)} = (state: ${name}State) => state.${sel};`).join('\n') || ''}
`;
    }

    /**
     * Generate Redux Toolkit slice
     */
    generateReduxSlice(slice: StateSlice): string {
        const { name, state, actions } = slice;
        const sliceName = name.toLowerCase();

        return `import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';

interface ${name}State {
${Object.entries(state).map(([key, val]) => `  ${key}: ${val.type};`).join('\n')}
}

const initialState: ${name}State = {
${Object.entries(state).map(([key, val]) => `  ${key}: ${JSON.stringify(val.default)},`).join('\n')}
};

export const ${sliceName}Slice = createSlice({
  name: '${sliceName}',
  initialState,
  reducers: {
${actions.map(action => `    ${action}: (state, action: PayloadAction<any>) => {
      // TODO: Implement ${action}
    },`).join('\n')}
    reset: () => initialState,
  },
});

// Actions
export const { ${actions.join(', ')}, reset } = ${sliceName}Slice.actions;

// Selectors
${Object.keys(state).map(key => `export const select${this.capitalize(key)} = (state: RootState) => state.${sliceName}.${key};`).join('\n')}

export default ${sliceName}Slice.reducer;
`;
    }

    /**
     * Generate Jotai atoms
     */
    generateJotaiAtoms(slice: StateSlice): string {
        const { name, state, actions } = slice;

        return `import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

// Atoms
${Object.entries(state).map(([key, val]) => `export const ${key}Atom = atomWithStorage('${name.toLowerCase()}-${key}', ${JSON.stringify(val.default)});`).join('\n')}

// Derived atoms
${slice.selectors?.map(sel => `export const ${sel}DerivedAtom = atom((get) => {
  // TODO: Compute derived value
  return get(${Object.keys(state)[0]}Atom);
});`).join('\n') || ''}

// Action atoms
${actions.map(action => `export const ${action}Atom = atom(
  null,
  (get, set, ${this.getActionParams(action) || 'update: any'}) => {
    // TODO: Implement ${action}
  }
);`).join('\n')}
`;
    }

    // ========================================================================
    // VUE STATE
    // ========================================================================

    /**
     * Generate Pinia store
     */
    generatePiniaStore(slice: StateSlice): string {
        const { name, state, actions } = slice;

        return `import { defineStore } from 'pinia';

interface ${name}State {
${Object.entries(state).map(([key, val]) => `  ${key}: ${val.type};`).join('\n')}
}

export const use${name}Store = defineStore('${name.toLowerCase()}', {
  state: (): ${name}State => ({
${Object.entries(state).map(([key, val]) => `    ${key}: ${JSON.stringify(val.default)},`).join('\n')}
  }),

  getters: {
${slice.selectors?.map(sel => `    ${sel}: (state) => {
      // TODO: Compute ${sel}
      return state.${Object.keys(state)[0]};
    },`).join('\n') || ''}
  },

  actions: {
${actions.map(action => `    ${action}(${this.getActionParams(action)}) {
      // TODO: Implement ${action}
    },`).join('\n')}

    reset() {
      this.$reset();
    },
  },

  persist: true,
});
`;
    }

    // ========================================================================
    // FLUTTER STATE
    // ========================================================================

    /**
     * Generate Riverpod providers
     */
    generateRiverpodProviders(slice: StateSlice): string {
        const { name, state, actions } = slice;

        return `import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

part '${name.toLowerCase()}_state.freezed.dart';

// State class with Freezed
@freezed
class ${name}State with _\$${name}State {
  const factory ${name}State({
${Object.entries(state).map(([key, val]) => `    @Default(${JSON.stringify(val.default)}) ${this.toDartType(val.type)} ${key},`).join('\n')}
  }) = _${name}State;
}

// Notifier
class ${name}Notifier extends StateNotifier<${name}State> {
  ${name}Notifier() : super(const ${name}State());

${actions.map(action => `  void ${action}(${this.getDartActionParams(action)}) {
    state = state.copyWith(
      // TODO: Update state
    );
  }`).join('\n\n')}

  void reset() {
    state = const ${name}State();
  }
}

// Provider
final ${name.toLowerCase()}Provider = StateNotifierProvider<${name}Notifier, ${name}State>((ref) {
  return ${name}Notifier();
});

// Selectors
${Object.keys(state).map(key => `final ${key}Provider = Provider<${this.toDartType(state[key].type)}>((ref) {
  return ref.watch(${name.toLowerCase()}Provider).${key};
});`).join('\n\n')}
`;
    }

    /**
     * Generate BLoC pattern
     */
    generateBloc(slice: StateSlice): string {
        const { name, state, actions } = slice;

        return `import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';

// Events
abstract class ${name}Event extends Equatable {
  const ${name}Event();

  @override
  List<Object> get props => [];
}

${actions.map(action => `class ${this.capitalize(action)}Event extends ${name}Event {
  const ${this.capitalize(action)}Event();
}`).join('\n\n')}

class Reset${name}Event extends ${name}Event {
  const Reset${name}Event();
}

// State
class ${name}State extends Equatable {
${Object.entries(state).map(([key, val]) => `  final ${this.toDartType(val.type)} ${key};`).join('\n')}

  const ${name}State({
${Object.entries(state).map(([key, val]) => `    this.${key} = ${JSON.stringify(val.default)},`).join('\n')}
  });

  ${name}State copyWith({
${Object.entries(state).map(([key, val]) => `    ${this.toDartType(val.type)}? ${key},`).join('\n')}
  }) {
    return ${name}State(
${Object.keys(state).map(key => `      ${key}: ${key} ?? this.${key},`).join('\n')}
    );
  }

  @override
  List<Object?> get props => [${Object.keys(state).join(', ')}];
}

// BLoC
class ${name}Bloc extends Bloc<${name}Event, ${name}State> {
  ${name}Bloc() : super(const ${name}State()) {
${actions.map(action => `    on<${this.capitalize(action)}Event>(_on${this.capitalize(action)});`).join('\n')}
    on<Reset${name}Event>(_onReset);
  }

${actions.map(action => `  void _on${this.capitalize(action)}(${this.capitalize(action)}Event event, Emitter<${name}State> emit) {
    // TODO: Implement ${action}
    emit(state.copyWith());
  }`).join('\n\n')}

  void _onReset(Reset${name}Event event, Emitter<${name}State> emit) {
    emit(const ${name}State());
  }
}
`;
    }

    // ========================================================================
    // UTILITIES
    // ========================================================================

    private capitalize(str: string): string {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    private getActionParams(action: string): string {
        if (action.startsWith('set')) {
            const field = action.slice(3).charAt(0).toLowerCase() + action.slice(4);
            return `${field}: any`;
        }
        if (action.startsWith('add') || action.startsWith('remove')) {
            return 'item: any';
        }
        if (action.startsWith('update')) {
            return 'id: string, data: any';
        }
        return '';
    }

    private getDartActionParams(action: string): string {
        const params = this.getActionParams(action);
        return params.replace(/: any/g, '').replace(/: string/g, ' String');
    }

    private toDartType(type: string): string {
        const map: Record<string, string> = {
            string: 'String',
            number: 'int',
            boolean: 'bool',
            'string[]': 'List<String>',
            'any[]': 'List<dynamic>',
        };
        return map[type] || type;
    }

    /**
     * Generate store configuration
     */
    generateStoreConfig(library: StateLibrary): string {
        switch (library) {
            case 'redux':
                return `import { configureStore } from '@reduxjs/toolkit';
// Import reducers here

export const store = configureStore({
  reducer: {
    // Add reducers here
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
`;
            case 'zustand':
                return `// Zustand doesn't require store configuration
// Each store is independent and can be used directly
// See individual store files for usage
`;
            default:
                return '';
        }
    }
}

// Export singleton
export const stateManagementGenerator = StateManagementGenerator.getInstance();
