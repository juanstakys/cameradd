import React, { createContext, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Item = {
  id: string;
  cents: number; // positive only
  createdAt: number; // epoch ms
};

type State = {
  items: Item[];
  hydrated: boolean;
};

type Action =
  | { type: 'HYDRATE'; items: Item[] }
  | { type: 'ADD'; item: Item }
  | { type: 'EDIT'; id: string; cents: number }
  | { type: 'DELETE'; id: string }
  | { type: 'RESET' };

const initialState: State = { items: [], hydrated: false };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'HYDRATE':
      return { items: action.items, hydrated: true };
    case 'ADD':
      return { ...state, items: [action.item, ...state.items] };
    case 'EDIT':
      return {
        ...state,
        items: state.items.map((it) => (it.id === action.id ? { ...it, cents: action.cents } : it)),
      };
    case 'DELETE':
      return { ...state, items: state.items.filter((it) => it.id !== action.id) };
    case 'RESET':
      return { ...state, items: [] };
    default:
      return state;
  }
}

type Ctx = {
  items: Item[];
  totalCents: number;
  hydrated: boolean;
  add: (cents: number) => void;
  edit: (id: string, cents: number) => void;
  remove: (id: string) => void;
  clearAll: () => void;
};

const ItemsContext = createContext<Ctx | undefined>(undefined);

const STORAGE_KEY = 'cameradd/items.v1';

export function ItemsProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hydrate
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Item[];
          dispatch({ type: 'HYDRATE', items: parsed });
        } else {
          dispatch({ type: 'HYDRATE', items: [] });
        }
      } catch (e) {
        console.warn('Failed to load items', e);
        dispatch({ type: 'HYDRATE', items: [] });
      }
    })();
  }, []);

  // Persist with debounce
  useEffect(() => {
    if (!state.hydrated) return;
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state.items)).catch((e) =>
        console.warn('Failed to save items', e)
      );
    }, 150);
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, [state.items, state.hydrated]);

  const value = useMemo<Ctx>(() => {
    const total = state.items.reduce((sum, it) => sum + it.cents, 0);
    return {
      items: state.items,
      totalCents: total,
      hydrated: state.hydrated,
      add: (cents: number) =>
        dispatch({ type: 'ADD', item: { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, cents, createdAt: Date.now() } }),
      edit: (id: string, cents: number) => dispatch({ type: 'EDIT', id, cents }),
      remove: (id: string) => dispatch({ type: 'DELETE', id }),
      clearAll: () => dispatch({ type: 'RESET' }),
    };
  }, [state.items, state.hydrated]);

  return <ItemsContext.Provider value={value}>{children}</ItemsContext.Provider>;
}

export function useItems() {
  const ctx = useContext(ItemsContext);
  if (!ctx) throw new Error('useItems must be used within ItemsProvider');
  return ctx;
}
