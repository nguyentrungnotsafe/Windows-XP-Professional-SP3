import type { AppearancePrefs, SystemState, VfsState } from '../types/os';
import { isValidWallpaperId } from '../components/xp/WallpaperLayer';
import { createInitialVfsState, ensureVfsMigrations } from './vfs';
import { DEFAULT_APPEARANCE, createInitialSystemState } from './systemState';

const VFS_STORAGE_KEY = 'winxp_vfs_v1';
const APPEARANCE_STORAGE_KEY = 'winxp_appearance_v1';
const SYSTEM_STORAGE_KEY = 'winxp_system_v1';

export { DEFAULT_APPEARANCE };

export interface LoadResult<T> {
  value: T;
  error?: string;
}

export function loadVfsState(): LoadResult<VfsState> {
  try {
    const raw = window.localStorage.getItem(VFS_STORAGE_KEY);
    if (!raw) {
      const seeded = createInitialVfsState();
      saveVfsState(seeded);
      return { value: seeded };
    }
    const parsed = JSON.parse(raw) as VfsState;
    if (!parsed || !parsed.nodes || !parsed.initialized) {
      const seeded = createInitialVfsState();
      saveVfsState(seeded);
      return { value: seeded };
    }
    const migrated = ensureVfsMigrations(parsed);
    if (migrated !== parsed) {
      saveVfsState(migrated);
    }
    return { value: migrated };
  } catch {
    return {
      value: createInitialVfsState(),
      error: 'Saved files could not be read from browser storage. A temporary session is active.',
    };
  }
}

export function saveVfsState(state: VfsState): { ok: boolean; error?: string } {
  try {
    window.localStorage.setItem(VFS_STORAGE_KEY, JSON.stringify(state));
    return { ok: true };
  } catch {
    return {
      ok: false,
      error:
        'Browser storage is full or unavailable. Your current files remain open in memory, but changes may not persist after refreshing.',
    };
  }
}

export function loadAppearancePrefs(): AppearancePrefs {
  try {
    const raw = window.localStorage.getItem(APPEARANCE_STORAGE_KEY);
    if (!raw) return DEFAULT_APPEARANCE;
    const parsed = JSON.parse(raw) as Partial<AppearancePrefs>;
    return {
      wallpaper: isValidWallpaperId(parsed.wallpaper)
        ? parsed.wallpaper
        : DEFAULT_APPEARANCE.wallpaper,
      backgroundColor:
        typeof parsed.backgroundColor === 'string' && parsed.backgroundColor
          ? parsed.backgroundColor
          : DEFAULT_APPEARANCE.backgroundColor,
    };
  } catch {
    return DEFAULT_APPEARANCE;
  }
}

export function saveAppearancePrefs(prefs: AppearancePrefs): { ok: boolean; error?: string } {
  try {
    window.localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify(prefs));
    return { ok: true };
  } catch {
    return {
      ok: false,
      error: 'Could not save Display Properties to browser storage.',
    };
  }
}

export function loadSystemState(initialAppearance: AppearancePrefs): SystemState {
  const defaults = createInitialSystemState(initialAppearance);
  try {
    const raw = window.localStorage.getItem(SYSTEM_STORAGE_KEY);
    if (!raw) {
      saveSystemState(defaults);
      return defaults;
    }
    const parsed = JSON.parse(raw) as Partial<SystemState>;
    if (!parsed || !Array.isArray(parsed.users) || parsed.users.length === 0) {
      saveSystemState(defaults);
      return defaults;
    }
    // Deep-merge top-level sections with defaults so upgrades never miss newly added keys
    return {
      ...defaults,
      ...parsed,
      folderOptions: { ...defaults.folderOptions, ...(parsed.folderOptions ?? {}) },
      regionalOptions: { ...defaults.regionalOptions, ...(parsed.regionalOptions ?? {}) },
      accessibility: { ...defaults.accessibility, ...(parsed.accessibility ?? {}) },
      audio: { ...defaults.audio, ...(parsed.audio ?? {}) },
      taskbarPrefs: { ...defaults.taskbarPrefs, ...(parsed.taskbarPrefs ?? {}) },
      fileAssociations: { ...defaults.fileAssociations, ...(parsed.fileAssociations ?? {}) },
      optionalComponents: { ...defaults.optionalComponents, ...(parsed.optionalComponents ?? {}) },
      groupPolicy: { ...defaults.groupPolicy, ...(parsed.groupPolicy ?? {}) },
      gameStats: {
        ...defaults.gameStats,
        ...(parsed.gameStats ?? {}),
        minesweeperBest: {
          ...defaults.gameStats.minesweeperBest,
          ...(parsed.gameStats?.minesweeperBest ?? {}),
        },
      },
      registry: { ...defaults.registry, ...(parsed.registry ?? {}) },
    };
  } catch {
    return defaults;
  }
}

export function saveSystemState(state: SystemState): { ok: boolean; error?: string } {
  try {
    window.localStorage.setItem(SYSTEM_STORAGE_KEY, JSON.stringify(state));
    return { ok: true };
  } catch {
    return {
      ok: false,
      error: 'Browser storage is full or unavailable. Some system settings may not persist.',
    };
  }
}
