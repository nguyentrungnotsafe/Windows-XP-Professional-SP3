import type { NodeKind, TrashItem, VfsNode, VfsState } from '../types/os';
import {
  base64ToBytes,
  bytesToBase64,
  createZipBytes,
  decodeUtf8,
  encodeUtf8,
  parseZipBytes,
} from '../utils/zip';

export const INVALID_NAME_CHARS = /[\\/:*?"<>|]/;

export const SYSTEM_IDS = {
  MY_COMPUTER: 'my_computer',
  C_DRIVE: 'c_drive',
  D_DRIVE: 'd_drive',
  MY_DOCUMENTS: 'my_documents',
  MY_PICTURES: 'my_pictures',
  MY_MUSIC: 'my_music',
  MY_NETWORK_PLACES: 'my_network_places',
  NETWORK_WORKGROUP: 'network_workgroup',
  NETWORK_SHARED: 'network_shared',
  RECYCLE_BIN: 'recycle_bin',
  WINDOWS_DIR: 'windows_dir',
  WINDOWS_TEMP: 'windows_temp',
  PROGRAM_FILES: 'program_files',
  DOCUMENTS_AND_SETTINGS: 'docs_and_settings',
} as const;

export function computeNodeSizeBytes(node: VfsNode): number {
  if (typeof node.sizeBytes === 'number' && node.sizeBytes >= 0) return node.sizeBytes;
  if (!node.content) return 0;
  return new TextEncoder().encode(node.content).length;
}

export function createSampleImageSvgUrl(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="220" viewBox="0 0 320 220">
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#1d6fd6"/>
        <stop offset="100%" stop-color="#8cd3ff"/>
      </linearGradient>
    </defs>
    <rect width="320" height="220" fill="url(#sky)"/>
    <circle cx="245" cy="56" r="24" fill="#ffe66d"/>
    <path d="M0 155 Q90 120 185 150 T320 140 L320 220 L0 220 Z" fill="#46a336"/>
    <path d="M0 180 Q130 160 320 175 L320 220 L0 220 Z" fill="#2e7d22"/>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function createInitialVfsState(now = Date.now()): VfsState {
  const nodes: Record<string, VfsNode> = {
    [SYSTEM_IDS.MY_COMPUTER]: {
      id: SYSTEM_IDS.MY_COMPUTER,
      name: 'My Computer',
      kind: 'system',
      parentId: null,
      createdAt: now,
      updatedAt: now,
      readOnly: true,
      systemKey: 'my_computer',
    },
    [SYSTEM_IDS.C_DRIVE]: {
      id: SYSTEM_IDS.C_DRIVE,
      name: 'Local Disk (C:)',
      kind: 'drive',
      parentId: SYSTEM_IDS.MY_COMPUTER,
      createdAt: now,
      updatedAt: now,
      readOnly: true,
      systemKey: 'c_drive',
    },
    [SYSTEM_IDS.D_DRIVE]: {
      id: SYSTEM_IDS.D_DRIVE,
      name: 'CD-RW Drive (D:)',
      kind: 'drive',
      parentId: SYSTEM_IDS.MY_COMPUTER,
      createdAt: now,
      updatedAt: now,
      readOnly: true,
      systemKey: 'd_drive',
    },
    [SYSTEM_IDS.MY_DOCUMENTS]: {
      id: SYSTEM_IDS.MY_DOCUMENTS,
      name: 'My Documents',
      kind: 'folder',
      parentId: SYSTEM_IDS.MY_COMPUTER,
      createdAt: now,
      updatedAt: now,
      readOnly: true,
      systemKey: 'my_documents',
    },
    [SYSTEM_IDS.MY_PICTURES]: {
      id: SYSTEM_IDS.MY_PICTURES,
      name: 'My Pictures',
      kind: 'folder',
      parentId: SYSTEM_IDS.MY_DOCUMENTS,
      createdAt: now,
      updatedAt: now,
      readOnly: true,
      systemKey: 'my_pictures',
    },
    [SYSTEM_IDS.MY_MUSIC]: {
      id: SYSTEM_IDS.MY_MUSIC,
      name: 'My Music',
      kind: 'folder',
      parentId: SYSTEM_IDS.MY_DOCUMENTS,
      createdAt: now,
      updatedAt: now,
      readOnly: true,
      systemKey: 'my_music',
    },
    [SYSTEM_IDS.MY_NETWORK_PLACES]: {
      id: SYSTEM_IDS.MY_NETWORK_PLACES,
      name: 'My Network Places',
      kind: 'system',
      parentId: null,
      createdAt: now,
      updatedAt: now,
      readOnly: true,
      systemKey: 'my_network_places',
    },
    [SYSTEM_IDS.NETWORK_WORKGROUP]: {
      id: SYSTEM_IDS.NETWORK_WORKGROUP,
      name: 'WORKGROUP (XP-SERVER)',
      kind: 'folder',
      parentId: SYSTEM_IDS.MY_NETWORK_PLACES,
      createdAt: now,
      updatedAt: now,
      readOnly: true,
    },
    [SYSTEM_IDS.NETWORK_SHARED]: {
      id: SYSTEM_IDS.NETWORK_SHARED,
      name: 'SharedDocs',
      kind: 'folder',
      parentId: SYSTEM_IDS.NETWORK_WORKGROUP,
      createdAt: now,
      updatedAt: now,
      readOnly: true,
    },
    [SYSTEM_IDS.PROGRAM_FILES]: {
      id: SYSTEM_IDS.PROGRAM_FILES,
      name: 'Program Files',
      kind: 'folder',
      parentId: SYSTEM_IDS.C_DRIVE,
      createdAt: now,
      updatedAt: now,
      readOnly: true,
    },
    [SYSTEM_IDS.WINDOWS_DIR]: {
      id: SYSTEM_IDS.WINDOWS_DIR,
      name: 'WINDOWS',
      kind: 'folder',
      parentId: SYSTEM_IDS.C_DRIVE,
      createdAt: now,
      updatedAt: now,
      readOnly: true,
    },
    [SYSTEM_IDS.WINDOWS_TEMP]: {
      id: SYSTEM_IDS.WINDOWS_TEMP,
      name: 'Temp',
      kind: 'folder',
      parentId: SYSTEM_IDS.WINDOWS_DIR,
      hidden: true,
      createdAt: now,
      updatedAt: now,
      readOnly: true,
    },
    [SYSTEM_IDS.DOCUMENTS_AND_SETTINGS]: {
      id: SYSTEM_IDS.DOCUMENTS_AND_SETTINGS,
      name: 'Documents and Settings',
      kind: 'folder',
      parentId: SYSTEM_IDS.C_DRIVE,
      createdAt: now,
      updatedAt: now,
      readOnly: true,
    },
    welcome_txt: {
      id: 'welcome_txt',
      name: 'Welcome.txt',
      kind: 'text',
      parentId: SYSTEM_IDS.MY_DOCUMENTS,
      content:
        'Welcome to Windows XP Professional SP3!\r\n\r\n' +
        'You can use Notepad or WordPad to write and save notes in My Documents,\r\n' +
        'Paint to draw and save pictures in My Pictures, and\r\n' +
        'the Recycle Bin to delete and restore files or folders.',
      mimeType: 'text/plain',
      createdAt: now,
      updatedAt: now,
    },
    sample_hills_img: {
      id: 'sample_hills_img',
      name: 'Blue Hills.png',
      kind: 'image',
      parentId: SYSTEM_IDS.MY_PICTURES,
      content: createSampleImageSvgUrl(),
      mimeType: 'image/svg+xml',
      createdAt: now,
      updatedAt: now,
    },
    sample_music_1: {
      id: 'sample_music_1',
      name: "Beethoven's Symphony No. 9.wma",
      kind: 'audio',
      parentId: SYSTEM_IDS.MY_MUSIC,
      content: JSON.stringify({
        title: "Beethoven's Symphony No. 9 (Scherzo)",
        artist: 'XP Sample Classics',
        durationSec: 18,
        preset: 'beethoven',
      }),
      mimeType: 'audio/x-ms-wma',
      sizeBytes: 342016,
      createdAt: now,
      updatedAt: now,
    },
    sample_music_2: {
      id: 'sample_music_2',
      name: 'XP Title Theme.wma',
      kind: 'audio',
      parentId: SYSTEM_IDS.MY_MUSIC,
      content: JSON.stringify({
        title: 'Windows XP Welcome Music',
        artist: 'Stan LePard (Synthesized Tribute)',
        durationSec: 16,
        preset: 'xp_title',
      }),
      mimeType: 'audio/x-ms-wma',
      sizeBytes: 298400,
      createdAt: now,
      updatedAt: now,
    },
    cd_track_1: {
      id: 'cd_track_1',
      name: 'Track01 - Sample Breeze.wma',
      kind: 'audio',
      parentId: SYSTEM_IDS.D_DRIVE,
      content: JSON.stringify({
        title: 'CD Track 01 - Summer Breeze',
        artist: 'Audio CD (D:)',
        durationSec: 14,
        preset: 'breeze',
      }),
      mimeType: 'audio/x-ms-wma',
      sizeBytes: 412000,
      readOnly: true,
      createdAt: now,
      updatedAt: now,
    },
    cd_readme_txt: {
      id: 'cd_readme_txt',
      name: 'DISC_INFO.txt',
      kind: 'text',
      parentId: SYSTEM_IDS.D_DRIVE,
      content:
        'Windows XP Sample Media Disc (D:)\r\n\r\n' +
        'Contains sample audio track playable in Windows Media Player.\r\n' +
        'Use "Write these files to CD" from CD-RW Drive (D:) tasks to stage & burn your own virtual disc.',
      mimeType: 'text/plain',
      readOnly: true,
      createdAt: now,
      updatedAt: now,
    },
    shared_notice_txt: {
      id: 'shared_notice_txt',
      name: 'Workgroup Notice.txt',
      kind: 'text',
      parentId: SYSTEM_IDS.NETWORK_SHARED,
      content:
        'SharedDocs on \\\\XP-SERVER\r\n\r\n' +
        'This network share is available offline via Synchronize and My Network Places.',
      mimeType: 'text/plain',
      createdAt: now,
      updatedAt: now,
    },
    temp_setup_log: {
      id: 'temp_setup_log',
      name: 'xp_install_cache.tmp',
      kind: 'text',
      parentId: SYSTEM_IDS.WINDOWS_TEMP,
      content: 'Temporary installation cache bytes (safe to remove with Disk Cleanup).',
      mimeType: 'text/plain',
      sizeBytes: 2048000,
      createdAt: now,
      updatedAt: now,
    },
    temp_update_tmp: {
      id: 'temp_update_tmp',
      name: 'wu_staging_01.tmp',
      kind: 'text',
      parentId: SYSTEM_IDS.WINDOWS_TEMP,
      content: 'Temporary Windows Update staging artifact.',
      mimeType: 'text/plain',
      sizeBytes: 1536000,
      createdAt: now,
      updatedAt: now,
    },
    sys_boot_ini: {
      id: 'sys_boot_ini',
      name: 'boot.ini',
      kind: 'text',
      parentId: SYSTEM_IDS.C_DRIVE,
      hidden: true,
      content:
        '[boot loader]\r\ntimeout=30\r\ndefault=multi(0)disk(0)rdisk(0)partition(1)\\WINDOWS\r\n[operating systems]\r\nmulti(0)disk(0)rdisk(0)partition(1)\\WINDOWS="Microsoft Windows XP Professional" /noexecute=optin /fastdetect',
      mimeType: 'text/plain',
      createdAt: now,
      updatedAt: now,
    },
  };

  return {
    nodes,
    trash: [],
    initialized: true,
  };
}

export function ensureVfsMigrations(state: VfsState): VfsState {
  const seed = createInitialVfsState();
  let changed = false;
  const nextNodes = { ...state.nodes };

  const requiredIds = [
    SYSTEM_IDS.D_DRIVE,
    SYSTEM_IDS.MY_MUSIC,
    SYSTEM_IDS.MY_NETWORK_PLACES,
    SYSTEM_IDS.NETWORK_WORKGROUP,
    SYSTEM_IDS.NETWORK_SHARED,
    SYSTEM_IDS.WINDOWS_TEMP,
    SYSTEM_IDS.DOCUMENTS_AND_SETTINGS,
    'sample_hills_img',
    'sample_music_1',
    'sample_music_2',
    'cd_track_1',
    'cd_readme_txt',
    'shared_notice_txt',
    'temp_setup_log',
    'temp_update_tmp',
    'sys_boot_ini',
  ];

  for (const id of requiredIds) {
    if (!nextNodes[id] && seed.nodes[id]) {
      nextNodes[id] = seed.nodes[id];
      changed = true;
    }
  }

  return changed ? { ...state, nodes: nextNodes } : state;
}

export function ensureUserHomeFolders(
  state: VfsState,
  username: string,
  now = Date.now()
): {
  state: VfsState;
  docsFolderId: string;
  picturesFolderId: string;
  musicFolderId: string;
} {
  if (username.toLowerCase() === 'administrator') {
    return {
      state,
      docsFolderId: SYSTEM_IDS.MY_DOCUMENTS,
      picturesFolderId: SYSTEM_IDS.MY_PICTURES,
      musicFolderId: SYSTEM_IDS.MY_MUSIC,
    };
  }

  const slug = username.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'user';
  const userRootId = `user_root_${slug}`;
  const docsId = `user_docs_${slug}`;
  const picsId = `user_pics_${slug}`;
  const musicId = `user_music_${slug}`;

  const nextNodes = { ...state.nodes };
  let changed = false;

  if (!nextNodes[SYSTEM_IDS.DOCUMENTS_AND_SETTINGS]) {
    nextNodes[SYSTEM_IDS.DOCUMENTS_AND_SETTINGS] = {
      id: SYSTEM_IDS.DOCUMENTS_AND_SETTINGS,
      name: 'Documents and Settings',
      kind: 'folder',
      parentId: SYSTEM_IDS.C_DRIVE,
      createdAt: now,
      updatedAt: now,
      readOnly: true,
    };
    changed = true;
  }

  if (!nextNodes[userRootId]) {
    nextNodes[userRootId] = {
      id: userRootId,
      name: username,
      kind: 'folder',
      parentId: SYSTEM_IDS.DOCUMENTS_AND_SETTINGS,
      createdAt: now,
      updatedAt: now,
      readOnly: true,
    };
    changed = true;
  }
  if (!nextNodes[docsId]) {
    nextNodes[docsId] = {
      id: docsId,
      name: `${username}'s Documents`,
      kind: 'folder',
      parentId: userRootId,
      createdAt: now,
      updatedAt: now,
      readOnly: true,
      systemKey: 'my_documents',
    };
    changed = true;
  }
  if (!nextNodes[picsId]) {
    nextNodes[picsId] = {
      id: picsId,
      name: 'My Pictures',
      kind: 'folder',
      parentId: docsId,
      createdAt: now,
      updatedAt: now,
      readOnly: true,
      systemKey: 'my_pictures',
    };
    changed = true;
  }
  if (!nextNodes[musicId]) {
    nextNodes[musicId] = {
      id: musicId,
      name: 'My Music',
      kind: 'folder',
      parentId: docsId,
      createdAt: now,
      updatedAt: now,
      readOnly: true,
      systemKey: 'my_music',
    };
    changed = true;
  }

  return {
    state: changed ? { ...state, nodes: nextNodes } : state,
    docsFolderId: docsId,
    picturesFolderId: picsId,
    musicFolderId: musicId,
  };
}

export function validateFileName(rawName: string): { valid: boolean; name: string; error?: string } {
  const trimmed = rawName.trim();
  if (!trimmed) {
    return { valid: false, name: trimmed, error: 'You must type a file name.' };
  }
  if (trimmed === '.' || trimmed === '..') {
    return { valid: false, name: trimmed, error: 'The file name you specified is not valid.' };
  }
  if (INVALID_NAME_CHARS.test(trimmed)) {
    return {
      valid: false,
      name: trimmed,
      error: 'A file name cannot contain any of the following characters:\n\\ / : * ? " < > |',
    };
  }
  return { valid: true, name: trimmed };
}

export function getChildren(
  state: VfsState,
  parentId: string,
  options?: { includeHidden?: boolean }
): VfsNode[] {
  const includeHidden = options?.includeHidden ?? true;
  return Object.values(state.nodes)
    .filter((n) => n.parentId === parentId && (includeHidden || !n.hidden))
    .sort((a, b) => {
      const rank = (kind: NodeKind) =>
        kind === 'drive' ? 0 : kind === 'folder' || kind === 'system' ? 1 : 2;
      const diff = rank(a.kind) - rank(b.kind);
      if (diff !== 0) return diff;
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    });
}

export function findChildByName(
  state: VfsState,
  parentId: string,
  name: string,
  excludeId?: string
): VfsNode | undefined {
  const lower = name.trim().toLowerCase();
  return Object.values(state.nodes).find(
    (n) => n.parentId === parentId && n.id !== excludeId && n.name.toLowerCase() === lower
  );
}

export function isFolderLike(node: VfsNode | undefined): boolean {
  if (!node) return false;
  return node.kind === 'folder' || node.kind === 'drive' || node.kind === 'system';
}

export function canCreateInside(node: VfsNode | undefined): boolean {
  if (!node) return false;
  if (node.systemKey === 'd_drive') return false;
  return node.kind === 'folder' || node.kind === 'drive';
}

export function getDisplayPath(state: VfsState, folderId: string): string {
  if (folderId === SYSTEM_IDS.RECYCLE_BIN) return 'Recycle Bin';
  if (folderId === SYSTEM_IDS.MY_COMPUTER) return 'My Computer';
  if (folderId === SYSTEM_IDS.MY_NETWORK_PLACES) return 'My Network Places';
  if (folderId === SYSTEM_IDS.C_DRIVE) return 'C:\\';
  if (folderId === SYSTEM_IDS.D_DRIVE) return 'D:\\';
  if (folderId === SYSTEM_IDS.MY_DOCUMENTS) {
    return 'C:\\Documents and Settings\\Administrator\\My Documents';
  }
  if (folderId === SYSTEM_IDS.MY_PICTURES) {
    return 'C:\\Documents and Settings\\Administrator\\My Documents\\My Pictures';
  }
  if (folderId === SYSTEM_IDS.MY_MUSIC) {
    return 'C:\\Documents and Settings\\Administrator\\My Documents\\My Music';
  }
  if (folderId === SYSTEM_IDS.NETWORK_SHARED) {
    return '\\\\XP-SERVER\\SharedDocs';
  }

  const parts: string[] = [];
  let cursor: VfsNode | undefined = state.nodes[folderId];
  const guard = new Set<string>();

  while (cursor && !guard.has(cursor.id)) {
    guard.add(cursor.id);
    if (cursor.id === SYSTEM_IDS.MY_DOCUMENTS) {
      parts.unshift('C:\\Documents and Settings\\Administrator\\My Documents');
      break;
    }
    if (cursor.id === SYSTEM_IDS.C_DRIVE) {
      parts.unshift('C:');
      break;
    }
    if (cursor.id === SYSTEM_IDS.D_DRIVE) {
      parts.unshift('D:');
      break;
    }
    if (cursor.id === SYSTEM_IDS.MY_COMPUTER) {
      parts.unshift('My Computer');
      break;
    }
    if (cursor.id === SYSTEM_IDS.MY_NETWORK_PLACES) {
      parts.unshift('My Network Places');
      break;
    }
    parts.unshift(cursor.name);
    cursor = cursor.parentId ? state.nodes[cursor.parentId] : undefined;
  }

  if (parts.length === 0) return 'My Computer';
  if (parts.length === 1 && (parts[0] === 'C:' || parts[0] === 'D:')) return `${parts[0]}\\`;
  return parts.join('\\');
}

export function resolveAddressPath(state: VfsState, rawAddress: string): string | null {
  const trimmed = rawAddress.trim();
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase().replace(/\/+$/, '').replace(/\\+$/, '');

  if (lower === 'my computer' || lower === 'computer') return SYSTEM_IDS.MY_COMPUTER;
  if (lower === 'recycle bin') return SYSTEM_IDS.RECYCLE_BIN;
  if (lower === 'my network places' || lower === 'network') return SYSTEM_IDS.MY_NETWORK_PLACES;
  if (lower === '\\\\xp-server\\shareddocs' || lower === 'shareddocs') {
    return SYSTEM_IDS.NETWORK_SHARED;
  }
  if (lower === 'c:' || lower === 'local disk (c:)') return SYSTEM_IDS.C_DRIVE;
  if (lower === 'd:' || lower === 'cd-rw drive (d:)') return SYSTEM_IDS.D_DRIVE;
  if (
    lower === 'my documents' ||
    lower === 'c:\\documents and settings\\administrator\\my documents'
  ) {
    return SYSTEM_IDS.MY_DOCUMENTS;
  }
  if (
    lower === 'my pictures' ||
    lower === 'c:\\documents and settings\\administrator\\my documents\\my pictures'
  ) {
    return SYSTEM_IDS.MY_PICTURES;
  }
  if (
    lower === 'my music' ||
    lower === 'c:\\documents and settings\\administrator\\my documents\\my music'
  ) {
    return SYSTEM_IDS.MY_MUSIC;
  }

  for (const node of Object.values(state.nodes)) {
    if (!isFolderLike(node)) continue;
    const path = getDisplayPath(state, node.id).toLowerCase().replace(/\\+$/, '');
    if (path === lower || node.name.toLowerCase() === lower) {
      return node.id;
    }
  }
  return null;
}

export function resolvePathFromFolder(
  state: VfsState,
  currentFolderId: string,
  rawPath: string
): { node?: VfsNode; parentId?: string; targetName?: string } {
  const cleaned = rawPath.trim().replace(/^"(.*)"$/, '$1');
  if (!cleaned) return { node: state.nodes[currentFolderId] };

  // Handle direct absolute address shortcuts
  const lower = cleaned.toLowerCase();
  if (lower === '\\' || lower === 'c:\\' || lower === 'c:') {
    return { node: state.nodes[SYSTEM_IDS.C_DRIVE] };
  }
  if (lower === 'd:\\' || lower === 'd:') {
    return { node: state.nodes[SYSTEM_IDS.D_DRIVE] };
  }

  let cursorId = currentFolderId;
  let rel = cleaned;

  if (/^[a-z]:[\\/]/i.test(cleaned)) {
    const driveChar = cleaned[0].toLowerCase();
    cursorId = driveChar === 'd' ? SYSTEM_IDS.D_DRIVE : SYSTEM_IDS.C_DRIVE;
    rel = cleaned.slice(3);
  } else if (cleaned.startsWith('\\') || cleaned.startsWith('/')) {
    cursorId = SYSTEM_IDS.C_DRIVE;
    rel = cleaned.slice(1);
  }

  const segments = rel.split(/[\\/]+/).filter(Boolean);
  if (segments.length === 0) {
    return { node: state.nodes[cursorId] };
  }

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (seg === '.') continue;
    if (seg === '..') {
      const cur = state.nodes[cursorId];
      if (cur?.parentId && state.nodes[cur.parentId] && cur.id !== SYSTEM_IDS.C_DRIVE) {
        cursorId = cur.parentId;
      }
      continue;
    }

    // Handle Administrator shortcut folder alias inside C:\Documents and Settings\Administrator\My Documents
    if (
      cursorId === SYSTEM_IDS.DOCUMENTS_AND_SETTINGS &&
      seg.toLowerCase() === 'administrator'
    ) {
      // Virtual bridge to Administrator's folders
      const nextSeg = segments[i + 1]?.toLowerCase();
      if (nextSeg === 'my documents') {
        cursorId = SYSTEM_IDS.MY_DOCUMENTS;
        i += 1;
        continue;
      }
    }

    const child = findChildByName(state, cursorId, seg);
    if (!child) {
      if (i === segments.length - 1) {
        return { parentId: cursorId, targetName: seg };
      }
      return {};
    }
    if (i === segments.length - 1) {
      return { node: child, parentId: cursorId, targetName: child.name };
    }
    if (!isFolderLike(child)) {
      return {};
    }
    cursorId = child.id;
  }

  return { node: state.nodes[cursorId] };
}

export function generateUniqueName(state: VfsState, parentId: string, baseName: string): string {
  const dotIdx = baseName.lastIndexOf('.');
  const hasExt = dotIdx > 0;
  const stem = hasExt ? baseName.slice(0, dotIdx) : baseName;
  const ext = hasExt ? baseName.slice(dotIdx) : '';

  if (!findChildByName(state, parentId, baseName)) {
    return baseName;
  }
  let counter = 2;
  while (counter < 1000) {
    const candidate = `${stem} (${counter})${ext}`;
    if (!findChildByName(state, parentId, candidate)) {
      return candidate;
    }
    counter += 1;
  }
  return `${stem} (${Date.now()})${ext}`;
}

export interface VfsMutationResult {
  state: VfsState;
  node?: VfsNode;
  error?: string;
  needsOverwriteConfirm?: boolean;
  existingNode?: VfsNode;
}

export function createFolder(
  state: VfsState,
  parentId: string,
  rawName: string,
  now = Date.now()
): VfsMutationResult {
  const parent = state.nodes[parentId];
  if (!canCreateInside(parent)) {
    return { state, error: 'You cannot create a folder in this location.' };
  }
  const check = validateFileName(rawName);
  if (!check.valid) {
    return { state, error: check.error };
  }
  const dup = findChildByName(state, parentId, check.name);
  if (dup) {
    return {
      state,
      error: `This destination already contains a folder or file named "${check.name}".`,
    };
  }

  const id = `fld_${now}_${Math.random().toString(36).slice(2, 7)}`;
  const node: VfsNode = {
    id,
    name: check.name,
    kind: 'folder',
    parentId,
    createdAt: now,
    updatedAt: now,
  };

  return {
    state: {
      ...state,
      nodes: {
        ...state.nodes,
        [id]: node,
      },
    },
    node,
  };
}

export function writeFile(
  state: VfsState,
  params: {
    parentId: string;
    name: string;
    content: string;
    kind: Exclude<NodeKind, 'folder' | 'drive' | 'system'>;
    mimeType: string;
    sizeBytes?: number;
    existingFileId?: string;
    allowOverwrite?: boolean;
    now?: number;
  }
): VfsMutationResult {
  const now = params.now ?? Date.now();
  const parent = state.nodes[params.parentId];
  if (!canCreateInside(parent)) {
    return { state, error: 'The selected folder is not available for saving files.' };
  }

  const check = validateFileName(params.name);
  if (!check.valid) {
    return { state, error: check.error };
  }

  if (params.existingFileId && state.nodes[params.existingFileId]) {
    const target = state.nodes[params.existingFileId];
    if (
      target.parentId === params.parentId &&
      target.name.toLowerCase() === check.name.toLowerCase()
    ) {
      const updated: VfsNode = {
        ...target,
        name: check.name,
        kind: params.kind,
        content: params.content,
        mimeType: params.mimeType,
        sizeBytes: params.sizeBytes,
        updatedAt: now,
      };
      return {
        state: {
          ...state,
          nodes: { ...state.nodes, [updated.id]: updated },
        },
        node: updated,
      };
    }
  }

  const collision = findChildByName(state, params.parentId, check.name);
  if (collision) {
    if (isFolderLike(collision)) {
      return {
        state,
        error: `A folder named "${check.name}" already exists in this location.`,
      };
    }
    if (!params.allowOverwrite) {
      return {
        state,
        needsOverwriteConfirm: true,
        existingNode: collision,
        error: `${check.name} already exists.\nDo you want to replace it?`,
      };
    }
    const overwritten: VfsNode = {
      ...collision,
      name: check.name,
      kind: params.kind,
      content: params.content,
      mimeType: params.mimeType,
      sizeBytes: params.sizeBytes,
      updatedAt: now,
    };
    return {
      state: {
        ...state,
        nodes: { ...state.nodes, [overwritten.id]: overwritten },
      },
      node: overwritten,
    };
  }

  const id = `file_${now}_${Math.random().toString(36).slice(2, 7)}`;
  const created: VfsNode = {
    id,
    name: check.name,
    kind: params.kind,
    parentId: params.parentId,
    content: params.content,
    mimeType: params.mimeType,
    sizeBytes: params.sizeBytes,
    createdAt: now,
    updatedAt: now,
  };

  return {
    state: {
      ...state,
      nodes: { ...state.nodes, [id]: created },
    },
    node: created,
  };
}

export function renameNode(
  state: VfsState,
  nodeId: string,
  rawNewName: string,
  now = Date.now()
): VfsMutationResult {
  const node = state.nodes[nodeId];
  if (!node) {
    return { state, error: 'Cannot find the specified file or folder.' };
  }
  if (node.readOnly) {
    return { state, error: `"${node.name}" is a Windows system item and cannot be renamed.` };
  }
  const check = validateFileName(rawNewName);
  if (!check.valid) {
    return { state, error: check.error };
  }
  if (node.parentId) {
    const dup = findChildByName(state, node.parentId, check.name, node.id);
    if (dup) {
      return {
        state,
        error: `Cannot rename ${node.name}: A file with the name you specified already exists. Specify a different file name.`,
      };
    }
  }
  const updated: VfsNode = {
    ...node,
    name: check.name,
    updatedAt: now,
  };
  return {
    state: {
      ...state,
      nodes: { ...state.nodes, [nodeId]: updated },
    },
    node: updated,
  };
}

function collectDescendantIds(state: VfsState, rootId: string): string[] {
  const result: string[] = [];
  const queue = [rootId];
  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const child of Object.values(state.nodes)) {
      if (child.parentId === current) {
        result.push(child.id);
        queue.push(child.id);
      }
    }
  }
  return result;
}

export function copyNode(
  state: VfsState,
  sourceId: string,
  destParentId: string,
  explicitName?: string,
  now = Date.now()
): VfsMutationResult {
  const source = state.nodes[sourceId];
  const dest = state.nodes[destParentId];
  if (!source || !canCreateInside(dest)) {
    return { state, error: 'The source or destination folder is invalid.' };
  }

  // Prevent copying a folder into itself or its descendant
  if (source.id === destParentId || collectDescendantIds(state, source.id).includes(destParentId)) {
    return { state, error: 'Cannot copy a folder into itself.' };
  }

  const finalName = explicitName
    ? explicitName
    : generateUniqueName(state, destParentId, source.name);

  if (explicitName && findChildByName(state, destParentId, explicitName)) {
    return { state, error: `A file or folder named "${explicitName}" already exists.` };
  }

  const nextNodes = { ...state.nodes };
  const idMap = new Map<string, string>();

  const cloneRecursive = (node: VfsNode, newParentId: string, overrideName?: string): VfsNode => {
    const newId = `${node.kind === 'folder' ? 'fld' : 'file'}_${now}_${Math.random()
      .toString(36)
      .slice(2, 8)}`;
    idMap.set(node.id, newId);
    const cloned: VfsNode = {
      ...node,
      id: newId,
      name: overrideName ?? node.name,
      parentId: newParentId,
      readOnly: false,
      systemKey: undefined,
      createdAt: now,
      updatedAt: now,
    };
    nextNodes[newId] = cloned;

    for (const child of Object.values(state.nodes)) {
      if (child.parentId === node.id) {
        cloneRecursive(child, newId);
      }
    }
    return cloned;
  };

  const rootClone = cloneRecursive(source, destParentId, finalName);
  return {
    state: { ...state, nodes: nextNodes },
    node: rootClone,
  };
}

export function moveNode(
  state: VfsState,
  sourceId: string,
  destParentId: string,
  explicitName?: string,
  now = Date.now()
): VfsMutationResult {
  const source = state.nodes[sourceId];
  const dest = state.nodes[destParentId];
  if (!source || !canCreateInside(dest)) {
    return { state, error: 'The source or destination folder is invalid.' };
  }
  if (source.readOnly) {
    return { state, error: `"${source.name}" is a protected system item and cannot be moved.` };
  }
  if (source.id === destParentId || collectDescendantIds(state, source.id).includes(destParentId)) {
    return { state, error: 'Cannot move a folder into itself.' };
  }

  const targetName = explicitName ?? source.name;
  const dup = findChildByName(state, destParentId, targetName, source.id);
  if (dup) {
    return { state, error: `Destination already contains "${targetName}".` };
  }

  const updated: VfsNode = {
    ...source,
    name: targetName,
    parentId: destParentId,
    updatedAt: now,
  };
  return {
    state: {
      ...state,
      nodes: { ...state.nodes, [source.id]: updated },
    },
    node: updated,
  };
}

export function moveToRecycleBin(
  state: VfsState,
  nodeId: string,
  now = Date.now()
): VfsMutationResult {
  const node = state.nodes[nodeId];
  if (!node) {
    return { state, error: 'The item could not be found.' };
  }
  if (node.readOnly || !node.parentId) {
    return { state, error: `Cannot delete "${node.name}": It is a protected system item.` };
  }

  const descendantIds = collectDescendantIds(state, nodeId);
  const descendants = descendantIds.map((id) => state.nodes[id]).filter(Boolean);
  const nextNodes = { ...state.nodes };
  delete nextNodes[nodeId];
  for (const id of descendantIds) {
    delete nextNodes[id];
  }

  const trashItem: TrashItem = {
    id: node.id,
    node,
    descendants,
    originalParentId: node.parentId,
    originalPathLabel: getDisplayPath(state, node.parentId),
    deletedAt: now,
  };

  return {
    state: {
      ...state,
      nodes: nextNodes,
      trash: [trashItem, ...state.trash],
    },
    node,
  };
}

export interface RestoreResult {
  state: VfsState;
  restoredNode?: VfsNode;
  error?: string;
  conflict?: {
    trashItem: TrashItem;
    existingNode: VfsNode;
    destinationId: string;
  };
}

export function restoreFromRecycleBin(
  state: VfsState,
  trashId: string,
  resolution?: 'replace' | 'keep_both',
  now = Date.now()
): RestoreResult {
  const item = state.trash.find((t) => t.id === trashId);
  if (!item) {
    return { state, error: 'The selected item is no longer in the Recycle Bin.' };
  }

  const destinationId = state.nodes[item.originalParentId]
    ? item.originalParentId
    : SYSTEM_IDS.MY_DOCUMENTS;

  const destination = state.nodes[destinationId];
  if (!canCreateInside(destination)) {
    return { state, error: 'The original folder is unavailable.' };
  }

  const conflictNode = findChildByName(state, destinationId, item.node.name);
  if (conflictNode && !resolution) {
    return {
      state,
      conflict: {
        trashItem: item,
        existingNode: conflictNode,
        destinationId,
      },
    };
  }

  const nextNodes = { ...state.nodes };
  let restoredName = item.node.name;

  if (conflictNode) {
    if (resolution === 'replace') {
      if (conflictNode.readOnly) {
        return {
          state,
          error: `Cannot replace "${conflictNode.name}" because it is a protected system folder.`,
        };
      }
      const conflictDescendants = collectDescendantIds(state, conflictNode.id);
      delete nextNodes[conflictNode.id];
      for (const id of conflictDescendants) {
        delete nextNodes[id];
      }
    } else if (resolution === 'keep_both') {
      restoredName = generateUniqueName(state, destinationId, item.node.name);
    }
  }

  const restoredRoot: VfsNode = {
    ...item.node,
    name: restoredName,
    parentId: destinationId,
    updatedAt: now,
  };
  nextNodes[restoredRoot.id] = restoredRoot;

  for (const desc of item.descendants) {
    nextNodes[desc.id] = { ...desc };
  }

  return {
    state: {
      ...state,
      nodes: nextNodes,
      trash: state.trash.filter((t) => t.id !== trashId),
    },
    restoredNode: restoredRoot,
  };
}

export function deletePermanentlyFromTrash(state: VfsState, trashId: string): VfsState {
  return {
    ...state,
    trash: state.trash.filter((t) => t.id !== trashId),
  };
}

export function emptyRecycleBin(state: VfsState): VfsState {
  return {
    ...state,
    trash: [],
  };
}

export interface VfsSearchParams {
  nameQuery: string;
  contentQuery?: string;
  category?: 'all' | 'pictures' | 'music' | 'documents';
  rootFolderId?: string;
  includeHidden?: boolean;
}

export function searchVfs(state: VfsState, params: VfsSearchParams): VfsNode[] {
  const nameLower = params.nameQuery.trim().toLowerCase();
  const contentLower = (params.contentQuery ?? '').trim().toLowerCase();
  const rootId = params.rootFolderId;

  const allowedSet =
    rootId && rootId !== SYSTEM_IDS.MY_COMPUTER
      ? new Set([rootId, ...collectDescendantIds(state, rootId)])
      : null;

  return Object.values(state.nodes)
    .filter((node) => {
      if (!node.parentId) return false;
      if (!params.includeHidden && node.hidden) return false;
      if (allowedSet && !allowedSet.has(node.id)) return false;

      if (params.category === 'pictures' && node.kind !== 'image') return false;
      if (params.category === 'music' && node.kind !== 'audio') return false;
      if (params.category === 'documents' && node.kind !== 'text' && node.kind !== 'rtf') {
        return false;
      }

      if (nameLower) {
        // Basic wildcard (* and ?) or substring match
        if (nameLower.includes('*') || nameLower.includes('?')) {
          const escaped = nameLower
            .replace(/[.+^${}()|[\]\\]/g, '\\$&')
            .replace(/\*/g, '.*')
            .replace(/\?/g, '.');
          const re = new RegExp(`^${escaped}$`, 'i');
          if (!re.test(node.name) && !node.name.toLowerCase().includes(nameLower.replace(/[*?]/g, ''))) {
            return false;
          }
        } else if (!node.name.toLowerCase().includes(nameLower)) {
          return false;
        }
      }

      if (contentLower) {
        const hay = (node.content ?? '').toLowerCase();
        if (!hay.includes(contentLower)) return false;
      }

      return true;
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

// --- Compressed (zipped) Folders ---
function encodeArchivedPayload(node: VfsNode): Uint8Array {
  const meta = JSON.stringify({
    kind: node.kind,
    mimeType: node.mimeType ?? 'text/plain',
    content: node.content ?? '',
  });
  // For plain text files without special metadata, store pure UTF-8 text; for binary/image/rtf, store UTF-8 text or marker
  if (node.kind === 'text') {
    return encodeUtf8(node.content ?? '');
  }
  return encodeUtf8(`__XPVFS_META__${meta}`);
}

function decodeArchivedPayload(
  entryName: string,
  bytes: Uint8Array
): { kind: Exclude<NodeKind, 'folder' | 'drive' | 'system'>; mimeType: string; content: string } {
  const text = decodeUtf8(bytes);
  if (text.startsWith('__XPVFS_META__')) {
    try {
      const parsed = JSON.parse(text.slice('__XPVFS_META__'.length)) as {
        kind: Exclude<NodeKind, 'folder' | 'drive' | 'system'>;
        mimeType: string;
        content: string;
      };
      return parsed;
    } catch {
      // fall back to plain text
    }
  }
  const lower = entryName.toLowerCase();
  if (lower.endsWith('.rtf') || lower.endsWith('.wri')) {
    return { kind: 'rtf', mimeType: 'application/rtf', content: text };
  }
  if (lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg')) {
    return { kind: 'image', mimeType: 'image/png', content: text };
  }
  return { kind: 'text', mimeType: 'text/plain', content: text };
}

export function compressNodesToZip(
  state: VfsState,
  sourceIds: string[],
  destParentId: string,
  zipName?: string,
  now = Date.now()
): VfsMutationResult {
  if (sourceIds.length === 0) {
    return { state, error: 'Select at least one file or folder to compress.' };
  }
  const firstNode = state.nodes[sourceIds[0]];
  if (!firstNode) {
    return { state, error: 'Selected item not found.' };
  }

  const entries: Array<{ name: string; data: Uint8Array }> = [];

  const appendNode = (node: VfsNode, prefix: string) => {
    const path = prefix ? `${prefix}/${node.name}` : node.name;
    if (isFolderLike(node)) {
      const children = getChildren(state, node.id, { includeHidden: true });
      for (const ch of children) {
        appendNode(ch, path);
      }
    } else {
      entries.push({ name: path, data: encodeArchivedPayload(node) });
    }
  };

  for (const id of sourceIds) {
    const n = state.nodes[id];
    if (n) appendNode(n, '');
  }

  if (entries.length === 0) {
    entries.push({ name: 'empty.txt', data: encodeUtf8('') });
  }

  const zipBytes = createZipBytes(entries);
  const base = firstNode.name.replace(/\.[^.]+$/, '');
  const rawZipName = zipName ?? `${base}.zip`;
  const finalZipName = generateUniqueName(
    state,
    destParentId,
    rawZipName.toLowerCase().endsWith('.zip') ? rawZipName : `${rawZipName}.zip`
  );

  return writeFile(state, {
    parentId: destParentId,
    name: finalZipName,
    kind: 'archive',
    mimeType: 'application/zip',
    content: bytesToBase64(zipBytes),
    sizeBytes: zipBytes.length,
    now,
  });
}

export function listZipEntries(zipNode: VfsNode): Array<{ name: string; sizeBytes: number; contentPreview: string }> {
  if (zipNode.kind !== 'archive' || !zipNode.content) return [];
  try {
    const entries = parseZipBytes(base64ToBytes(zipNode.content));
    return entries.map((e) => {
      const decoded = decodeArchivedPayload(e.name, e.data);
      return {
        name: e.name,
        sizeBytes: e.data.length,
        contentPreview: decoded.kind === 'text' ? decoded.content.slice(0, 120) : `[${decoded.kind}]`,
      };
    });
  } catch {
    return [];
  }
}

export function extractZipToFolder(
  state: VfsState,
  zipNodeId: string,
  destParentId: string,
  now = Date.now()
): { state: VfsState; extractedFolder?: VfsNode; error?: string } {
  const zipNode = state.nodes[zipNodeId];
  if (!zipNode || zipNode.kind !== 'archive' || !zipNode.content) {
    return { state, error: 'The selected file is not a valid ZIP archive.' };
  }

  let entries;
  try {
    entries = parseZipBytes(base64ToBytes(zipNode.content));
  } catch (err) {
    return { state, error: err instanceof Error ? err.message : 'Failed to parse ZIP archive.' };
  }

  const folderBase = zipNode.name.replace(/\.zip$/i, '') || 'Extracted';
  const targetFolderName = generateUniqueName(state, destParentId, folderBase);
  const folderRes = createFolder(state, destParentId, targetFolderName, now);
  if (folderRes.error || !folderRes.node) {
    return { state: folderRes.state, error: folderRes.error };
  }

  let nextState = folderRes.state;
  const rootFolder = folderRes.node;

  for (const entry of entries) {
    const segments = entry.name.split('/').filter(Boolean);
    if (segments.length === 0) continue;

    let cursorParentId = rootFolder.id;
    for (let i = 0; i < segments.length - 1; i++) {
      const subName = segments[i];
      const existing = findChildByName(nextState, cursorParentId, subName);
      if (existing && isFolderLike(existing)) {
        cursorParentId = existing.id;
      } else {
        const subRes = createFolder(nextState, cursorParentId, subName, now);
        if (subRes.node) {
          nextState = subRes.state;
          cursorParentId = subRes.node.id;
        }
      }
    }

    const fileName = segments[segments.length - 1];
    const decoded = decodeArchivedPayload(fileName, entry.data);
    const writeRes = writeFile(nextState, {
      parentId: cursorParentId,
      name: fileName,
      kind: decoded.kind,
      mimeType: decoded.mimeType,
      content: decoded.content,
      sizeBytes: entry.data.length,
      allowOverwrite: true,
      now,
    });
    if (!writeRes.error) {
      nextState = writeRes.state;
    }
  }

  return { state: nextState, extractedFolder: rootFolder };
}

export function computeDiskCleanupStats(state: VfsState): {
  tempFiles: VfsNode[];
  tempBytes: number;
  trashItems: TrashItem[];
  trashBytes: number;
} {
  const tempFiles = Object.values(state.nodes).filter(
    (n) => n.parentId === SYSTEM_IDS.WINDOWS_TEMP && !isFolderLike(n)
  );
  const tempBytes = tempFiles.reduce((acc, f) => acc + computeNodeSizeBytes(f), 0);
  const trashBytes = state.trash.reduce((acc, item) => {
    const rootSize = Math.max(1024, computeNodeSizeBytes(item.node));
    const descSize = item.descendants.reduce(
      (s, d) => s + (isFolderLike(d) ? 0 : Math.max(512, computeNodeSizeBytes(d))),
      0
    );
    return acc + rootSize + descSize;
  }, 0);

  return {
    tempFiles,
    tempBytes,
    trashItems: state.trash,
    trashBytes,
  };
}

export function purgeTempFiles(state: VfsState): VfsState {
  const nextNodes = { ...state.nodes };
  for (const [id, node] of Object.entries(nextNodes)) {
    if (node.parentId === SYSTEM_IDS.WINDOWS_TEMP && !isFolderLike(node)) {
      delete nextNodes[id];
    }
  }
  return { ...state, nodes: nextNodes };
}

export function getNodeTypeLabel(node: VfsNode): string {
  if (node.systemKey === 'd_drive') return 'CD Drive';
  switch (node.kind) {
    case 'drive':
      return 'Local Disk';
    case 'system':
      return 'System Folder';
    case 'folder':
      return 'File Folder';
    case 'text':
      return 'Text Document';
    case 'rtf':
      return 'Rich Text Document';
    case 'image':
      return 'PNG Image';
    case 'audio':
      return 'Windows Media Audio';
    case 'archive':
      return 'Compressed (zipped) Folder';
    case 'project':
      return 'Windows Movie Maker Project';
    default:
      return 'File';
  }
}

export function formatDisplayFileName(name: string, kind: NodeKind, showExtensions: boolean): string {
  if (showExtensions) return name;
  if (kind === 'folder' || kind === 'drive' || kind === 'system') return name;
  const dot = name.lastIndexOf('.');
  if (dot <= 0) return name;
  return name.slice(0, dot);
}
