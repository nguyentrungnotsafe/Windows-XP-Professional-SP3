import React, { useEffect, useMemo, useRef, useState } from 'react';
import type {
  AppId,
  ContextMenuItem,
  ModalPromptRequest,
  SystemState,
  TrashItem,
  VfsNode,
  VfsState,
  WindowInstance,
} from '../types/os';
import {
  SYSTEM_IDS,
  canCreateInside,
  computeNodeSizeBytes,
  formatDisplayFileName,
  getChildren,
  getDisplayPath,
  getNodeTypeLabel,
  isFolderLike,
  listZipEntries,
  resolveAddressPath,
  searchVfs,
} from '../state/vfs';
import { resolveAppForFile } from '../state/appRegistry';
import { XpIcon, type XpIconName } from '../components/xp/XpIcons';
import { XpMenuBar, type XpMenuGroup } from '../components/xp/XpMenuBar';
import { OpenWithDialog, iconForVfsNode } from '../components/xp/XpDialog';

export interface ExplorerClipboard {
  mode: 'copy' | 'cut';
  nodeIds: string[];
}

interface ExplorerAppProps {
  windowId: string;
  isActive: boolean;
  vfs: VfsState;
  system: SystemState;
  initialFolderId?: string;
  initialTab?: string;
  highlightNodeId?: string;
  clipboard: ExplorerClipboard | null;
  onSetClipboard: (clip: ExplorerClipboard | null) => void;
  onTitleChange: (title: string) => void;
  onOpenFile: (node: VfsNode, overrideAppId?: AppId) => void;
  onUpdateFileAssoc: (ext: string, appId: AppId) => void;
  onLaunchApp: (appId: AppId, payload?: WindowInstance['payload']) => void;
  onCreateFolder: (parentId: string, name: string) => { ok: boolean; node?: VfsNode; error?: string };
  onRenameNode: (nodeId: string, newName: string) => { ok: boolean; error?: string };
  onCopyNode: (sourceId: string, destParentId: string) => { ok: boolean; node?: VfsNode; error?: string };
  onMoveNode: (sourceId: string, destParentId: string) => { ok: boolean; node?: VfsNode; error?: string };
  onDeleteNode: (nodeId: string) => void;
  onRestoreTrash: (trashId: string) => void;
  onDeleteTrashPermanently: (trashId: string) => void;
  onEmptyRecycleBin: () => void;
  onCompressToZip: (sourceIds: string[], destParentId: string) => { ok: boolean; node?: VfsNode; error?: string };
  onExtractZip: (zipNodeId: string, destParentId: string) => { ok: boolean; extractedFolder?: VfsNode; error?: string };
  onStageToCd: (nodeIds: string[]) => void;
  onOpenContextMenu: (x: number, y: number, items: ContextMenuItem[]) => void;
  onOpenModal: (modal: Omit<ModalPromptRequest, 'id'>) => void;
  onCloseWindow: () => void;
}

type SortKey = 'name' | 'size' | 'type' | 'date';

function iconForTrash(item: TrashItem): XpIconName {
  return iconForVfsNode(item.node);
}

function formatSizeKb(bytes: number): string {
  if (bytes === 0) return '0 KB';
  return `${Math.max(1, Math.ceil(bytes / 1024)).toLocaleString()} KB`;
}

export const ExplorerApp: React.FC<ExplorerAppProps> = ({
  windowId,
  isActive,
  vfs,
  system,
  initialFolderId = SYSTEM_IDS.MY_COMPUTER,
  initialTab,
  highlightNodeId,
  clipboard,
  onSetClipboard,
  onTitleChange,
  onOpenFile,
  onUpdateFileAssoc,
  onLaunchApp,
  onCreateFolder,
  onRenameNode,
  onCopyNode,
  onMoveNode,
  onDeleteNode,
  onRestoreTrash,
  onDeleteTrashPermanently,
  onEmptyRecycleBin,
  onCompressToZip,
  onExtractZip,
  onStageToCd,
  onOpenContextMenu,
  onOpenModal,
  onCloseWindow,
}) => {
  const activeUser =
    system.users.find((u) => u.username === system.activeUsername) ?? system.users[0];
  const userDocsId = activeUser?.docsFolderId ?? SYSTEM_IDS.MY_DOCUMENTS;
  const userPicsId = activeUser?.picturesFolderId ?? SYSTEM_IDS.MY_PICTURES;
  const userMusicId = activeUser?.musicFolderId ?? SYSTEM_IDS.MY_MUSIC;

  const [history, setHistory] = useState<string[]>([initialFolderId]);
  const [historyIdx, setHistoryIdx] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>(
    highlightNodeId ? [highlightNodeId] : []
  );
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState('');
  const [addressInput, setAddressInput] = useState('');
  const [viewMode, setViewMode] = useState<'icons' | 'details'>('icons');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortAsc, setSortAsc] = useState(true);
  const [leftPane, setLeftPane] = useState<'tasks' | 'search' | 'folders'>(
    initialTab === 'search' ? 'search' : 'tasks'
  );

  // Search Companion state
  const [searchName, setSearchName] = useState('');
  const [searchContent, setSearchContent] = useState('');
  const [searchCategory, setSearchCategory] = useState<'all' | 'pictures' | 'music' | 'documents'>(
    'all'
  );
  const [searchRootId, setSearchRootId] = useState<string>(SYSTEM_IDS.MY_COMPUTER);
  const [searchResults, setSearchResults] = useState<VfsNode[] | null>(null);

  // Properties & Open With dialogs
  const [propertiesTarget, setPropertiesTarget] = useState<VfsNode | null>(null);
  const [propertiesTab, setPropertiesTab] = useState<'general' | 'tools'>('general');
  const [openWithNode, setOpenWithNode] = useState<VfsNode | null>(null);
  const [expandedTreeIds, setExpandedTreeIds] = useState<Record<string, boolean>>({
    [SYSTEM_IDS.MY_COMPUTER]: true,
    [SYSTEM_IDS.C_DRIVE]: true,
    [userDocsId]: true,
  });

  const renameInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const rawCurrentId = history[historyIdx] ?? SYSTEM_IDS.MY_COMPUTER;
  const currentId =
    rawCurrentId === SYSTEM_IDS.RECYCLE_BIN || vfs.nodes[rawCurrentId]
      ? rawCurrentId
      : SYSTEM_IDS.MY_COMPUTER;

  const isRecycleBin = currentId === SYSTEM_IDS.RECYCLE_BIN;
  const currentNode = isRecycleBin ? undefined : vfs.nodes[currentId];
  const isZipView = Boolean(currentNode && currentNode.kind === 'archive');
  const isBurnedCdView = currentId === SYSTEM_IDS.D_DRIVE && Boolean(system.burnedCdVolumeName);

  const displayPath = useMemo(() => {
    if (leftPane === 'search' && searchResults !== null) return 'Search Results';
    return getDisplayPath(vfs, currentId);
  }, [vfs, currentId, leftPane, searchResults]);

  const onTitleChangeRef = useRef(onTitleChange);
  onTitleChangeRef.current = onTitleChange;

  useEffect(() => {
    setAddressInput(displayPath);
    const title =
      leftPane === 'search' && searchResults !== null
        ? 'Search Results'
        : isRecycleBin
        ? 'Recycle Bin'
        : currentId === SYSTEM_IDS.D_DRIVE && system.burnedCdVolumeName
        ? `${system.burnedCdVolumeName} (D:)`
        : currentNode?.name ?? 'My Computer';
    onTitleChangeRef.current(title);
  }, [
    currentId,
    displayPath,
    isRecycleBin,
    currentNode?.name,
    leftPane,
    searchResults,
    system.burnedCdVolumeName,
  ]);

  useEffect(() => {
    if (renamingId) {
      renameInputRef.current?.focus();
      renameInputRef.current?.select();
    }
  }, [renamingId]);

  const rawChildren = useMemo(() => {
    if (isRecycleBin || isZipView) return [];
    const list = getChildren(vfs, currentId, { includeHidden: system.folderOptions.showHidden });
    return [...list].sort((a, b) => {
      const dir = sortAsc ? 1 : -1;
      if (sortKey === 'name') {
        const rank = (k: VfsNode['kind']) =>
          k === 'drive' ? 0 : k === 'folder' || k === 'system' ? 1 : 2;
        const rdiff = rank(a.kind) - rank(b.kind);
        if (rdiff !== 0) return rdiff;
        return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }) * dir;
      }
      if (sortKey === 'size') {
        return (computeNodeSizeBytes(a) - computeNodeSizeBytes(b)) * dir;
      }
      if (sortKey === 'type') {
        return getNodeTypeLabel(a).localeCompare(getNodeTypeLabel(b)) * dir;
      }
      return (a.updatedAt - b.updatedAt) * dir;
    });
  }, [vfs, currentId, isRecycleBin, isZipView, system.folderOptions.showHidden, sortKey, sortAsc]);

  const zipEntries = useMemo(() => {
    if (!isZipView || !currentNode) return [];
    return listZipEntries(currentNode);
  }, [isZipView, currentNode]);

  const primarySelectedId = selectedIds[0] ?? null;
  const selectedNode =
    !isRecycleBin && primarySelectedId ? vfs.nodes[primarySelectedId] : undefined;
  const selectedTrash =
    isRecycleBin && primarySelectedId
      ? vfs.trash.find((t) => t.id === primarySelectedId)
      : undefined;

  const navigateTo = (targetId: string, clearSearch = true) => {
    if (clearSearch && searchResults !== null) {
      setSearchResults(null);
    }
    if (targetId === currentId && !clearSearch) return;
    if (targetId !== currentId) {
      const nextHistory = history.slice(0, historyIdx + 1);
      nextHistory.push(targetId);
      setHistory(nextHistory);
      setHistoryIdx(nextHistory.length - 1);
    }
    setSelectedIds([]);
    setRenamingId(null);
  };

  const canGoBack = historyIdx > 0;
  const canGoForward = historyIdx < history.length - 1;
  const canGoUp = !isRecycleBin && Boolean(currentNode?.parentId);

  const handleBack = () => {
    if (!canGoBack) return;
    setSearchResults(null);
    setHistoryIdx((i) => i - 1);
    setSelectedIds([]);
    setRenamingId(null);
  };

  const handleForward = () => {
    if (!canGoForward) return;
    setSearchResults(null);
    setHistoryIdx((i) => i + 1);
    setSelectedIds([]);
    setRenamingId(null);
  };

  const handleUp = () => {
    if (currentNode?.parentId && vfs.nodes[currentNode.parentId]) {
      navigateTo(currentNode.parentId);
    }
  };

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = addressInput.trim();
    if (/^https?:\/\//i.test(trimmed)) {
      onLaunchApp('iexplore', { initialUrl: trimmed });
      return;
    }
    const resolved = resolveAddressPath(vfs, trimmed);
    if (!resolved) {
      onOpenModal({
        parentWindowId: windowId,
        kind: 'alert',
        icon: 'error',
        title: 'Address Bar',
        message: `Windows cannot find '${addressInput}'. Check the spelling and try again.`,
      });
      return;
    }
    navigateTo(resolved);
  };

  const handleNewFolder = () => {
    if (isRecycleBin || isZipView || !canCreateInside(currentNode)) return;
    let candidate = 'New Folder';
    let idx = 2;
    while (rawChildren.some((c) => c.name.toLowerCase() === candidate.toLowerCase())) {
      candidate = `New Folder (${idx++})`;
    }
    const res = onCreateFolder(currentId, candidate);
    if (!res.ok) {
      onOpenModal({
        parentWindowId: windowId,
        kind: 'alert',
        icon: 'error',
        title: 'New Folder',
        message: res.error ?? 'Could not create folder.',
      });
      return;
    }
    if (res.node) {
      setSelectedIds([res.node.id]);
      setRenamingId(res.node.id);
      setRenameText(res.node.name);
    }
  };

  const startRename = (node: VfsNode) => {
    if (node.readOnly) return;
    setRenamingId(node.id);
    setRenameText(node.name);
  };

  const commitRename = () => {
    if (!renamingId) return;
    const node = vfs.nodes[renamingId];
    if (!node) {
      setRenamingId(null);
      return;
    }
    const res = onRenameNode(renamingId, renameText);
    if (!res.ok) {
      const failedName = renameText;
      onOpenModal({
        parentWindowId: windowId,
        kind: 'alert',
        icon: 'error',
        title: 'Error Renaming File or Folder',
        message: res.error ?? 'Invalid name.',
        onConfirm: () => {
          setRenamingId(node.id);
          setRenameText(failedName);
        },
      });
      return;
    }
    setRenamingId(null);
  };

  const activateNode = (node: VfsNode) => {
    if (isFolderLike(node) || node.kind === 'archive') {
      navigateTo(node.id);
    } else {
      onOpenFile(node);
    }
  };

  const handleCopy = () => {
    if (selectedIds.length === 0) return;
    onSetClipboard({ mode: 'copy', nodeIds: selectedIds });
  };

  const handleCut = () => {
    const movable = selectedIds.filter((id) => !vfs.nodes[id]?.readOnly);
    if (movable.length === 0) return;
    onSetClipboard({ mode: 'cut', nodeIds: movable });
  };

  const handlePaste = () => {
    if (!clipboard || !canCreateInside(currentNode)) return;
    let firstError: string | undefined;
    for (const srcId of clipboard.nodeIds) {
      const res =
        clipboard.mode === 'copy'
          ? onCopyNode(srcId, currentId)
          : onMoveNode(srcId, currentId);
      if (!res.ok && !firstError) {
        firstError = res.error;
      }
    }
    if (clipboard.mode === 'cut') {
      onSetClipboard(null);
    }
    if (firstError) {
      onOpenModal({
        parentWindowId: windowId,
        kind: 'alert',
        icon: 'error',
        title: 'Paste Error',
        message: firstError,
      });
    }
  };

  const handleExtractArchive = (archiveNode: VfsNode) => {
    const destParentId =
      archiveNode.parentId && canCreateInside(vfs.nodes[archiveNode.parentId])
        ? archiveNode.parentId
        : userDocsId;
    const res = onExtractZip(archiveNode.id, destParentId);
    if (!res.ok) {
      onOpenModal({
        parentWindowId: windowId,
        kind: 'alert',
        icon: 'error',
        title: 'Compressed (zipped) Folders Error',
        message: res.error ?? 'Failed to extract archive.',
      });
      return;
    }
    if (res.extractedFolder) {
      navigateTo(res.extractedFolder.id);
    }
  };

  const handleRunSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    const results = searchVfs(vfs, {
      nameQuery: searchName,
      contentQuery: searchContent,
      category: searchCategory,
      rootFolderId: searchRootId,
      includeHidden: system.folderOptions.showHidden,
    });
    setSearchResults(results);
    setSelectedIds([]);
  };

  useEffect(() => {
    if (!isActive) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handleCopy();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'x') {
        e.preventDefault();
        handleCut();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        handlePaste();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a' && !isRecycleBin) {
        e.preventDefault();
        setSelectedIds(rawChildren.map((c) => c.id));
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setLeftPane('search');
      } else if (e.key === 'F2' && selectedNode && !selectedNode.readOnly) {
        e.preventDefault();
        startRename(selectedNode);
      } else if (e.key === 'Enter' && selectedNode && !renamingId) {
        e.preventDefault();
        activateNode(selectedNode);
      } else if (e.key === 'Delete' && !renamingId) {
        if (selectedIds.length > 0 && !isRecycleBin) {
          e.preventDefault();
          selectedIds.forEach((id) => {
            if (!vfs.nodes[id]?.readOnly) onDeleteNode(id);
          });
          setSelectedIds([]);
        } else if (selectedTrash) {
          e.preventDefault();
          onDeleteTrashPermanently(selectedTrash.id);
          setSelectedIds([]);
        }
      } else if (e.key === 'Backspace' && canGoUp && !renamingId) {
        e.preventDefault();
        handleUp();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((a) => !a);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const openPropertiesFor = (node: VfsNode) => {
    setPropertiesTarget(node);
    setPropertiesTab('general');
  };

  const menuGroups: XpMenuGroup[] = [
    {
      id: 'file',
      label: 'File',
      items: isRecycleBin
        ? [
            {
              id: 'restore',
              label: 'Restore',
              disabled: !selectedTrash,
              onSelect: () => {
                if (selectedTrash) {
                  onRestoreTrash(selectedTrash.id);
                  setSelectedIds([]);
                }
              },
            },
            {
              id: 'delete_perm',
              label: 'Delete',
              disabled: !selectedTrash,
              onSelect: () => {
                if (selectedTrash) {
                  onDeleteTrashPermanently(selectedTrash.id);
                  setSelectedIds([]);
                }
              },
            },
            {
              id: 'empty_bin',
              label: 'Empty Recycle Bin',
              disabled: vfs.trash.length === 0,
              separatorBefore: true,
              onSelect: onEmptyRecycleBin,
            },
            { id: 'close', label: 'Close', separatorBefore: true, onSelect: onCloseWindow },
          ]
        : [
            {
              id: 'open',
              label: 'Open',
              disabled: !selectedNode,
              onSelect: () => selectedNode && activateNode(selectedNode),
            },
            {
              id: 'open_with',
              label: 'Open With...',
              disabled: !selectedNode || isFolderLike(selectedNode),
              onSelect: () => selectedNode && setOpenWithNode(selectedNode),
            },
            {
              id: 'new_folder',
              label: 'New Folder',
              disabled: !canCreateInside(currentNode) || isZipView,
              separatorBefore: true,
              onSelect: handleNewFolder,
            },
            {
              id: 'zip_selected',
              label: 'Send To Compressed (zipped) Folder',
              disabled: selectedIds.length === 0 || !canCreateInside(currentNode),
              onSelect: () => {
                const res = onCompressToZip(selectedIds, currentId);
                if (!res.ok) {
                  onOpenModal({
                    parentWindowId: windowId,
                    kind: 'alert',
                    icon: 'error',
                    title: 'Compressed (zipped) Folders',
                    message: res.error ?? 'Could not compress selection.',
                  });
                } else if (res.node) {
                  setSelectedIds([res.node.id]);
                }
              },
            },
            {
              id: 'rename',
              label: 'Rename',
              disabled: !selectedNode || Boolean(selectedNode.readOnly),
              separatorBefore: true,
              onSelect: () => selectedNode && startRename(selectedNode),
            },
            {
              id: 'delete',
              label: 'Delete',
              disabled: !selectedNode || Boolean(selectedNode.readOnly),
              onSelect: () => {
                if (selectedNode) {
                  onDeleteNode(selectedNode.id);
                  setSelectedIds([]);
                }
              },
            },
            {
              id: 'properties',
              label: 'Properties',
              disabled: !selectedNode && !currentNode,
              separatorBefore: true,
              onSelect: () => {
                const t = selectedNode ?? currentNode;
                if (t) openPropertiesFor(t);
              },
            },
            { id: 'close', label: 'Close', separatorBefore: true, onSelect: onCloseWindow },
          ],
    },
    {
      id: 'edit',
      label: 'Edit',
      items: [
        { id: 'cut', label: 'Cut', disabled: selectedIds.length === 0 || isRecycleBin, onSelect: handleCut },
        { id: 'copy', label: 'Copy', disabled: selectedIds.length === 0 || isRecycleBin, onSelect: handleCopy },
        {
          id: 'paste',
          label: 'Paste',
          disabled: !clipboard || !canCreateInside(currentNode) || isRecycleBin,
          onSelect: handlePaste,
        },
        {
          id: 'select_all',
          label: 'Select All',
          disabled: isRecycleBin || rawChildren.length === 0,
          separatorBefore: true,
          onSelect: () => setSelectedIds(rawChildren.map((c) => c.id)),
        },
      ],
    },
    {
      id: 'view',
      label: 'View',
      items: [
        {
          id: 'view_icons',
          label: 'Icons',
          checked: viewMode === 'icons',
          onSelect: () => setViewMode('icons'),
        },
        {
          id: 'view_details',
          label: 'Details',
          checked: viewMode === 'details',
          onSelect: () => setViewMode('details'),
        },
        {
          id: 'pane_search',
          label: 'Explorer Bar -> Search',
          checked: leftPane === 'search',
          separatorBefore: true,
          onSelect: () => setLeftPane((p) => (p === 'search' ? 'tasks' : 'search')),
        },
        {
          id: 'pane_folders',
          label: 'Explorer Bar -> Folders',
          checked: leftPane === 'folders',
          onSelect: () => setLeftPane((p) => (p === 'folders' ? 'tasks' : 'folders')),
        },
        {
          id: 'refresh',
          label: 'Refresh',
          separatorBefore: true,
          onSelect: () => setSelectedIds([]),
        },
      ],
    },
    {
      id: 'favorites',
      label: 'Favorites',
      items: [
        { id: 'fav_docs', label: 'My Documents', onSelect: () => navigateTo(userDocsId) },
        { id: 'fav_pics', label: 'My Pictures', onSelect: () => navigateTo(userPicsId) },
        { id: 'fav_music', label: 'My Music', onSelect: () => navigateTo(userMusicId) },
        { id: 'fav_comp', label: 'My Computer', onSelect: () => navigateTo(SYSTEM_IDS.MY_COMPUTER) },
        {
          id: 'fav_net',
          label: 'My Network Places',
          onSelect: () => navigateTo(SYSTEM_IDS.MY_NETWORK_PLACES),
        },
      ],
    },
    {
      id: 'tools',
      label: 'Tools',
      items: [
        {
          id: 'folder_opts',
          label: 'Folder Options...',
          onSelect: () => onLaunchApp('folder_opts'),
        },
      ],
    },
    {
      id: 'help',
      label: 'Help',
      items: [
        {
          id: 'help_center',
          label: 'Help and Support Center',
          onSelect: () => onLaunchApp('help'),
        },
        {
          id: 'about',
          label: 'About Windows',
          separatorBefore: true,
          onSelect: () =>
            onOpenModal({
              parentWindowId: windowId,
              kind: 'alert',
              icon: 'info',
              title: 'About Windows',
              message: 'Microsoft Windows XP Professional\nVersion 5.1 (Service Pack 3)',
            }),
        },
      ],
    },
  ];

  const handleEmptyAreaContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedIds([]);
    if (isRecycleBin) {
      onOpenContextMenu(e.clientX, e.clientY, [
        {
          id: 'empty_bin',
          label: 'Empty Recycle Bin',
          disabled: vfs.trash.length === 0,
          onSelect: onEmptyRecycleBin,
        },
        {
          id: 'refresh',
          label: 'Refresh',
          separatorBefore: true,
          onSelect: () => setSelectedIds([]),
        },
      ]);
      return;
    }
    onOpenContextMenu(e.clientX, e.clientY, [
      {
        id: 'view_icons',
        label: 'View: Icons',
        checked: viewMode === 'icons',
        onSelect: () => setViewMode('icons'),
      },
      {
        id: 'view_details',
        label: 'View: Details',
        checked: viewMode === 'details',
        onSelect: () => setViewMode('details'),
      },
      {
        id: 'paste',
        label: 'Paste',
        disabled: !clipboard || !canCreateInside(currentNode),
        separatorBefore: true,
        onSelect: handlePaste,
      },
      {
        id: 'new_folder',
        label: 'New Folder',
        disabled: !canCreateInside(currentNode) || isZipView,
        separatorBefore: true,
        onSelect: handleNewFolder,
      },
      {
        id: 'properties',
        label: 'Properties',
        disabled: !currentNode,
        separatorBefore: true,
        onSelect: () => currentNode && openPropertiesFor(currentNode),
      },
    ]);
  };

  const handleItemContextMenu = (e: React.MouseEvent, node: VfsNode) => {
    e.preventDefault();
    e.stopPropagation();
    const targetIds = selectedIds.includes(node.id) ? selectedIds : [node.id];
    if (!selectedIds.includes(node.id)) {
      setSelectedIds([node.id]);
    }
    const items: ContextMenuItem[] = [
      {
        id: 'open',
        label: 'Open',
        bold: true,
        onSelect: () => activateNode(node),
      },
    ];
    if (!isFolderLike(node)) {
      items.push({
        id: 'open_with',
        label: 'Open With...',
        onSelect: () => setOpenWithNode(node),
      });
    }
    if (node.kind === 'archive') {
      items.push({
        id: 'extract_all',
        label: 'Extract All...',
        onSelect: () => handleExtractArchive(node),
      });
    }
    if (canCreateInside(vfs.nodes[node.parentId ?? ''])) {
      items.push({
        id: 'send_zip',
        label: 'Send To: Compressed (zipped) Folder',
        separatorBefore: true,
        onSelect: () => {
          const destId = node.parentId ?? currentId;
          const res = onCompressToZip(targetIds, destId);
          if (res.node) setSelectedIds([res.node.id]);
        },
      });
    }
    if (!isFolderLike(node)) {
      items.push({
        id: 'send_cd',
        label: 'Send To: CD-RW Drive (D:)',
        onSelect: () => {
          onStageToCd(targetIds);
          onOpenModal({
            parentWindowId: windowId,
            kind: 'alert',
            icon: 'info',
            title: 'CD Writing',
            message: `${targetIds.length} file(s) staged for CD-RW Drive (D:). Open CD-RW Drive (D:) and click "Write these files to CD".`,
          });
        },
      });
    }
    if (node.systemKey === 'my_computer') {
      items.push({
        id: 'manage',
        label: 'Manage',
        onSelect: () => onLaunchApp('compmgmt'),
      });
    }
    items.push(
      {
        id: 'cut',
        label: 'Cut',
        disabled: Boolean(node.readOnly),
        separatorBefore: true,
        onSelect: () => onSetClipboard({ mode: 'cut', nodeIds: targetIds }),
      },
      {
        id: 'copy',
        label: 'Copy',
        onSelect: () => onSetClipboard({ mode: 'copy', nodeIds: targetIds }),
      },
      {
        id: 'rename',
        label: 'Rename',
        disabled: Boolean(node.readOnly),
        separatorBefore: true,
        onSelect: () => startRename(node),
      },
      {
        id: 'delete',
        label: 'Delete',
        disabled: Boolean(node.readOnly),
        onSelect: () => {
          onDeleteNode(node.id);
          setSelectedIds([]);
        },
      },
      {
        id: 'properties',
        label: 'Properties',
        separatorBefore: true,
        onSelect: () => openPropertiesFor(node),
      }
    );
    onOpenContextMenu(e.clientX, e.clientY, items);
  };

  const handleTrashContextMenu = (e: React.MouseEvent, item: TrashItem) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedIds([item.id]);
    onOpenContextMenu(e.clientX, e.clientY, [
      {
        id: 'restore',
        label: 'Restore',
        bold: true,
        onSelect: () => {
          onRestoreTrash(item.id);
          setSelectedIds([]);
        },
      },
      {
        id: 'delete_perm',
        label: 'Delete Permanently',
        separatorBefore: true,
        onSelect: () => {
          onDeleteTrashPermanently(item.id);
          setSelectedIds([]);
        },
      },
    ]);
  };

  const renderIconGridItem = (node: VfsNode) => {
    const isSelected = selectedIds.includes(node.id);
    const isRenaming = renamingId === node.id;
    const isCut = clipboard?.mode === 'cut' && clipboard.nodeIds.includes(node.id);
    const displayName = formatDisplayFileName(
      node.name,
      node.kind,
      system.folderOptions.showExtensions
    );
    return (
      <div
        key={node.id}
        onClick={(e) => {
          e.stopPropagation();
          if (e.ctrlKey || e.metaKey) {
            setSelectedIds((prev) =>
              prev.includes(node.id) ? prev.filter((id) => id !== node.id) : [...prev, node.id]
            );
          } else {
            setSelectedIds([node.id]);
            if (system.folderOptions.singleClickToOpen && !isRenaming) {
              activateNode(node);
            }
          }
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          if (!isRenaming) activateNode(node);
        }}
        onContextMenu={(e) => handleItemContextMenu(e, node)}
        className={`w-[86px] flex flex-col items-center p-1.5 rounded-[2px] cursor-default ${
          isCut ? 'opacity-50' : ''
        }`}
      >
        <div className={isSelected ? 'opacity-85' : ''}>
          <XpIcon name={iconForVfsNode(node)} size={32} />
        </div>
        {isRenaming ? (
          <input
            ref={renameInputRef}
            type="text"
            aria-label="Rename item"
            value={renameText}
            onChange={(e) => setRenameText(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                commitRename();
              } else if (e.key === 'Escape') {
                e.preventDefault();
                setRenamingId(null);
              }
            }}
            onClick={(e) => e.stopPropagation()}
            className="xp-input mt-1 w-full text-center text-[11px] px-0.5 py-0"
          />
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (e.ctrlKey || e.metaKey) {
                setSelectedIds((prev) =>
                  prev.includes(node.id) ? prev.filter((id) => id !== node.id) : [...prev, node.id]
                );
              } else {
                setSelectedIds([node.id]);
                if (system.folderOptions.singleClickToOpen) activateNode(node);
              }
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              activateNode(node);
            }}
            className={`mt-1 px-1 text-[11px] text-center leading-[1.25] break-words max-w-full rounded-[1px] cursor-default focus:outline-none ${
              isSelected
                ? 'bg-[#316ac5] text-[#ffffff]'
                : system.folderOptions.singleClickToOpen
                ? 'text-[#0044cc] underline'
                : 'text-[#000000] focus-visible:outline focus-visible:outline-1 focus-visible:outline-dotted focus-visible:outline-[#316ac5]'
            }`}
          >
            {displayName}
          </button>
        )}
      </div>
    );
  };

  const renderTreeNode = (nodeId: string, depth: number): React.ReactNode => {
    const node = vfs.nodes[nodeId];
    if (!node || !isFolderLike(node)) return null;
    const childFolders = getChildren(vfs, nodeId, { includeHidden: system.folderOptions.showHidden }).filter(
      isFolderLike
    );
    const expanded = Boolean(expandedTreeIds[nodeId]);
    const isCurr = currentId === nodeId && searchResults === null;

    return (
      <div key={nodeId}>
        <div
          style={{ paddingLeft: `${depth * 12 + 4}px` }}
          className={`flex items-center gap-1 py-0.5 pr-1 text-[11px] cursor-default ${
            isCurr ? 'bg-[#316ac5] text-white' : 'hover:bg-[#eef4fd]'
          }`}
        >
          {childFolders.length > 0 ? (
            <button
              type="button"
              aria-label={`Toggle ${node.name}`}
              onClick={(e) => {
                e.stopPropagation();
                setExpandedTreeIds((prev) => ({ ...prev, [nodeId]: !prev[nodeId] }));
              }}
              className="w-[12px] h-[12px] border border-[#888] bg-white text-black text-[9px] leading-none flex items-center justify-center shrink-0"
            >
              {expanded ? '-' : '+'}
            </button>
          ) : (
            <span className="w-[12px] shrink-0" />
          )}
          <button
            type="button"
            onClick={() => {
              navigateTo(nodeId);
              setExpandedTreeIds((prev) => ({ ...prev, [nodeId]: true }));
            }}
            className="flex items-center gap-1 min-w-0 flex-1 text-left cursor-default"
          >
            <XpIcon name={iconForVfsNode(node)} size={14} />
            <span className="truncate">{node.name}</span>
          </button>
        </div>
        {expanded && childFolders.map((ch) => renderTreeNode(ch.id, depth + 1))}
      </div>
    );
  };

  // Drive capacity stats for Properties dialog
  const totalVfsBytes = useMemo(
    () =>
      Object.values(vfs.nodes).reduce(
        (sum, n) => sum + (isFolderLike(n) ? 0 : computeNodeSizeBytes(n)),
        0
      ),
    [vfs.nodes]
  );
  const cUsedMb = system.diskUsedOffsetMb + Math.round(totalVfsBytes / (1024 * 1024));
  const cTotalMb = 40960;

  return (
    <div ref={containerRef} className="flex-1 min-h-0 flex flex-col bg-[#ece9d8] text-[11px]">
      <XpMenuBar groups={menuGroups} />

      {/* Standard Buttons Toolbar */}
      <div className="h-[34px] shrink-0 bg-[#ece9d8] border-b border-[#d4d0c8] px-1.5 flex items-center gap-1 overflow-x-auto">
        <button
          type="button"
          onClick={handleBack}
          disabled={!canGoBack}
          aria-label="Back"
          className="flex items-center gap-1 px-2 py-1 rounded-[3px] border border-transparent hover:border-[#aca899] hover:bg-[#f5f3ea] disabled:opacity-45 cursor-default shrink-0"
        >
          <span className="w-[18px] h-[18px] rounded-full bg-[#3f9d39] text-white flex items-center justify-center text-[11px] font-bold">
            ←
          </span>
          <span>Back</span>
        </button>

        <button
          type="button"
          onClick={handleForward}
          disabled={!canGoForward}
          aria-label="Forward"
          title="Forward"
          className="flex items-center gap-1 px-1.5 py-1 rounded-[3px] border border-transparent hover:border-[#aca899] hover:bg-[#f5f3ea] disabled:opacity-45 cursor-default shrink-0"
        >
          <span className="w-[18px] h-[18px] rounded-full bg-[#3f9d39] text-white flex items-center justify-center text-[11px] font-bold">
            →
          </span>
        </button>

        <button
          type="button"
          onClick={handleUp}
          disabled={!canGoUp}
          aria-label="Up"
          title="Up One Level"
          className="flex items-center gap-1 px-2 py-1 rounded-[3px] border border-transparent hover:border-[#aca899] hover:bg-[#f5f3ea] disabled:opacity-45 cursor-default shrink-0"
        >
          <XpIcon name="folder" size={16} />
          <span className="hidden sm:inline">Up</span>
        </button>

        <div className="h-[22px] w-[1px] bg-[#aca899] mx-0.5 shrink-0" />

        <button
          type="button"
          aria-pressed={leftPane === 'search'}
          onClick={() => setLeftPane((p) => (p === 'search' ? 'tasks' : 'search'))}
          className={`flex items-center gap-1 px-2 py-1 rounded-[3px] border cursor-default shrink-0 ${
            leftPane === 'search'
              ? 'border-[#aca899] bg-[#dcd7c2] shadow-inner'
              : 'border-transparent hover:border-[#aca899] hover:bg-[#f5f3ea]'
          }`}
        >
          <XpIcon name="search" size={16} />
          <span>Search</span>
        </button>

        <button
          type="button"
          aria-pressed={leftPane === 'folders'}
          onClick={() => setLeftPane((p) => (p === 'folders' ? 'tasks' : 'folders'))}
          className={`flex items-center gap-1 px-2 py-1 rounded-[3px] border cursor-default shrink-0 ${
            leftPane === 'folders'
              ? 'border-[#aca899] bg-[#dcd7c2] shadow-inner'
              : 'border-transparent hover:border-[#aca899] hover:bg-[#f5f3ea]'
          }`}
        >
          <XpIcon name="folder" size={16} />
          <span>Folders</span>
        </button>

        <div className="h-[22px] w-[1px] bg-[#aca899] mx-0.5 shrink-0" />

        <button
          type="button"
          onClick={() => setViewMode((m) => (m === 'icons' ? 'details' : 'icons'))}
          className="flex items-center gap-1 px-2 py-1 rounded-[3px] border border-transparent hover:border-[#aca899] hover:bg-[#f5f3ea] cursor-default shrink-0"
        >
          <span>Views: {viewMode === 'icons' ? 'Icons' : 'Details'}</span>
        </button>

        {!isRecycleBin && !isZipView && canCreateInside(currentNode) && (
          <button
            type="button"
            onClick={handleNewFolder}
            className="flex items-center gap-1 px-2 py-1 rounded-[3px] border border-transparent hover:border-[#aca899] hover:bg-[#f5f3ea] cursor-default shrink-0"
          >
            <XpIcon name="folder" size={16} />
            <span>New Folder</span>
          </button>
        )}

        {isZipView && currentNode && (
          <button
            type="button"
            onClick={() => handleExtractArchive(currentNode)}
            className="flex items-center gap-1 px-2 py-1 rounded-[3px] border border-[#aca899] bg-[#f5f3ea] hover:bg-white cursor-default shrink-0 font-bold"
          >
            <XpIcon name="archive_zip" size={16} />
            <span>Extract All Files</span>
          </button>
        )}

        {isRecycleBin && (
          <>
            <button
              type="button"
              disabled={!selectedTrash}
              onClick={() => {
                if (selectedTrash) {
                  onRestoreTrash(selectedTrash.id);
                  setSelectedIds([]);
                }
              }}
              className="px-2 py-1 rounded-[3px] border border-transparent hover:border-[#aca899] hover:bg-[#f5f3ea] disabled:opacity-45 cursor-default shrink-0"
            >
              Restore this item
            </button>
            <button
              type="button"
              disabled={vfs.trash.length === 0}
              onClick={onEmptyRecycleBin}
              className="px-2 py-1 rounded-[3px] border border-transparent hover:border-[#aca899] hover:bg-[#f5f3ea] disabled:opacity-45 cursor-default shrink-0"
            >
              Empty Recycle Bin
            </button>
          </>
        )}
      </div>

      {/* Address Bar */}
      <form
        onSubmit={handleAddressSubmit}
        className="h-[26px] shrink-0 bg-[#ece9d8] border-b border-[#aca899] px-2 flex items-center gap-1.5"
      >
        <label htmlFor={`addr-${windowId}`} className="text-[#555555] shrink-0">
          Address
        </label>
        <div className="flex-1 min-w-0 h-[20px] bg-[#ffffff] border border-[#7f9db9] flex items-center px-1 gap-1.5">
          <XpIcon
            name={
              leftPane === 'search' && searchResults !== null
                ? 'search'
                : isRecycleBin
                ? vfs.trash.length > 0
                  ? 'recycle_bin_full'
                  : 'recycle_bin_empty'
                : currentNode
                ? iconForVfsNode(currentNode)
                : 'my_computer'
            }
            size={14}
          />
          <input
            id={`addr-${windowId}`}
            type="text"
            value={addressInput}
            onChange={(e) => setAddressInput(e.target.value)}
            className="w-full bg-transparent outline-none text-[11px] text-[#000000]"
          />
        </div>
        <button type="submit" className="xp-button h-[20px] min-h-0 px-2.5">
          Go
        </button>
      </form>

      {/* Main Split: Left Pane + File Area */}
      <div className="flex-1 min-h-0 flex">
        {leftPane === 'folders' ? (
          <aside className="w-[196px] shrink-0 bg-white border-r border-[#aca899] flex flex-col">
            <div className="h-[22px] px-2 bg-[#ece9d8] border-b border-[#aca899] flex items-center justify-between font-bold text-[#333]">
              <span>Folders</span>
              <button
                type="button"
                aria-label="Close Folders pane"
                onClick={() => setLeftPane('tasks')}
                className="text-[#555] hover:text-black px-1"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto xp-scroll py-1">
              {renderTreeNode(SYSTEM_IDS.MY_COMPUTER, 0)}
              {userDocsId !== SYSTEM_IDS.MY_DOCUMENTS && renderTreeNode(userDocsId, 0)}
              {renderTreeNode(SYSTEM_IDS.MY_NETWORK_PLACES, 0)}
              <button
                type="button"
                onClick={() => navigateTo(SYSTEM_IDS.RECYCLE_BIN)}
                className={`w-full pl-5 py-0.5 flex items-center gap-1 text-left text-[11px] cursor-default ${
                  isRecycleBin ? 'bg-[#316ac5] text-white' : 'hover:bg-[#eef4fd]'
                }`}
              >
                <XpIcon
                  name={vfs.trash.length > 0 ? 'recycle_bin_full' : 'recycle_bin_empty'}
                  size={14}
                />
                <span>Recycle Bin</span>
              </button>
            </div>
          </aside>
        ) : leftPane === 'search' ? (
          <aside className="w-[216px] shrink-0 xp-taskpane-bg p-2.5 flex flex-col gap-2.5 overflow-y-auto xp-scroll">
            <form
              onSubmit={handleRunSearch}
              className="rounded-t-[4px] overflow-hidden shadow-sm bg-[#d6dff7] flex flex-col"
            >
              <div className="xp-taskpane-card-header px-2.5 py-1.5 font-bold text-[#215dc6] flex items-center justify-between">
                <span>Search Companion</span>
                <button
                  type="button"
                  aria-label="Close Search pane"
                  onClick={() => {
                    setSearchResults(null);
                    setLeftPane('tasks');
                  }}
                  className="text-[#215dc6] hover:text-black px-1"
                >
                  ×
                </button>
              </div>
              <div className="p-2.5 flex flex-col gap-2 text-[#00136b]">
                <label className="flex flex-col gap-0.5">
                  <span className="font-bold">What do you want to search for?</span>
                  <select
                    aria-label="Search category"
                    value={searchCategory}
                    onChange={(e) =>
                      setSearchCategory(
                        e.target.value as 'all' | 'pictures' | 'music' | 'documents'
                      )
                    }
                    className="xp-input h-[22px] bg-white"
                  >
                    <option value="all">All files and folders</option>
                    <option value="pictures">Pictures and photos</option>
                    <option value="music">Music &amp; audio</option>
                    <option value="documents">Documents (txt, rtf)</option>
                  </select>
                </label>

                <label className="flex flex-col gap-0.5">
                  <span>All or part of the file name:</span>
                  <input
                    type="text"
                    placeholder="e.g. *.txt or report"
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                    className="xp-input h-[22px] bg-white"
                  />
                </label>

                <label className="flex flex-col gap-0.5">
                  <span>A word or phrase in the file:</span>
                  <input
                    type="text"
                    value={searchContent}
                    onChange={(e) => setSearchContent(e.target.value)}
                    className="xp-input h-[22px] bg-white"
                  />
                </label>

                <label className="flex flex-col gap-0.5">
                  <span>Look in:</span>
                  <select
                    aria-label="Look in"
                    value={searchRootId}
                    onChange={(e) => setSearchRootId(e.target.value)}
                    className="xp-input h-[22px] bg-white"
                  >
                    <option value={SYSTEM_IDS.MY_COMPUTER}>My Computer</option>
                    <option value={SYSTEM_IDS.C_DRIVE}>Local Disk (C:)</option>
                    <option value={userDocsId}>My Documents</option>
                    <option value={userPicsId}>My Pictures</option>
                    <option value={userMusicId}>My Music</option>
                  </select>
                </label>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSearchName('');
                      setSearchContent('');
                      setSearchCategory('all');
                      setSearchResults(null);
                    }}
                    className="xp-button px-2.5"
                  >
                    Reset
                  </button>
                  <button type="submit" className="xp-button xp-button-default px-3.5 font-bold">
                    Search
                  </button>
                </div>
              </div>
            </form>
          </aside>
        ) : (
          <aside className="hidden sm:flex w-[192px] shrink-0 xp-taskpane-bg p-2.5 flex-col gap-2.5 overflow-y-auto xp-scroll">
            {/* Tasks Card */}
            <div className="rounded-t-[4px] overflow-hidden shadow-sm">
              <div className="xp-taskpane-card-header px-2.5 py-1.5 font-bold text-[#215dc6]">
                {isRecycleBin
                  ? 'Recycle Bin Tasks'
                  : isZipView
                  ? 'Folder Tasks'
                  : currentId === SYSTEM_IDS.D_DRIVE
                  ? 'CD Writing Tasks'
                  : 'File and Folder Tasks'}
              </div>
              <div className="bg-[#d6dff7] p-2 flex flex-col gap-1.5 text-[#215dc6]">
                {isRecycleBin ? (
                  <>
                    <button
                      type="button"
                      disabled={vfs.trash.length === 0}
                      onClick={onEmptyRecycleBin}
                      className="text-left hover:underline disabled:text-[#7c8cb8] disabled:no-underline cursor-default"
                    >
                      Empty the Recycle Bin
                    </button>
                    <button
                      type="button"
                      disabled={!selectedTrash}
                      onClick={() => {
                        if (selectedTrash) {
                          onRestoreTrash(selectedTrash.id);
                          setSelectedIds([]);
                        }
                      }}
                      className="text-left hover:underline disabled:text-[#7c8cb8] disabled:no-underline cursor-default"
                    >
                      Restore this item
                    </button>
                    <button
                      type="button"
                      disabled={!selectedTrash}
                      onClick={() => {
                        if (selectedTrash) {
                          onDeleteTrashPermanently(selectedTrash.id);
                          setSelectedIds([]);
                        }
                      }}
                      className="text-left hover:underline disabled:text-[#7c8cb8] disabled:no-underline cursor-default"
                    >
                      Delete permanently
                    </button>
                  </>
                ) : isZipView && currentNode ? (
                  <button
                    type="button"
                    onClick={() => handleExtractArchive(currentNode)}
                    className="text-left font-bold hover:underline cursor-default"
                  >
                    Extract all files
                  </button>
                ) : currentId === SYSTEM_IDS.D_DRIVE ? (
                  <button
                    type="button"
                    onClick={() => onLaunchApp('cdburn')}
                    className="text-left font-bold hover:underline cursor-default"
                  >
                    Write these files to CD
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      disabled={!canCreateInside(currentNode)}
                      onClick={handleNewFolder}
                      className="text-left hover:underline disabled:text-[#7c8cb8] disabled:no-underline cursor-default"
                    >
                      Make a new folder
                    </button>
                    <button
                      type="button"
                      disabled={!selectedNode || Boolean(selectedNode.readOnly)}
                      onClick={() => selectedNode && startRename(selectedNode)}
                      className="text-left hover:underline disabled:text-[#7c8cb8] disabled:no-underline cursor-default"
                    >
                      Rename this item
                    </button>
                    <button
                      type="button"
                      disabled={!selectedNode || Boolean(selectedNode.readOnly)}
                      onClick={() => {
                        if (selectedNode) {
                          onDeleteNode(selectedNode.id);
                          setSelectedIds([]);
                        }
                      }}
                      className="text-left hover:underline disabled:text-[#7c8cb8] disabled:no-underline cursor-default"
                    >
                      Move to Recycle Bin
                    </button>
                    {selectedNode?.kind === 'image' && (
                      <button
                        type="button"
                        onClick={() =>
                          onLaunchApp('photoprint', { initialNodeIds: [selectedNode.id] })
                        }
                        className="text-left hover:underline cursor-default"
                      >
                        Print this picture
                      </button>
                    )}
                    {selectedNode && canCreateInside(currentNode) && (
                      <button
                        type="button"
                        onClick={() => {
                          const res = onCompressToZip(selectedIds, currentId);
                          if (res.node) setSelectedIds([res.node.id]);
                        }}
                        className="text-left hover:underline cursor-default"
                      >
                        Compress to ZIP folder
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Other Places Card */}
            <div className="rounded-t-[4px] overflow-hidden shadow-sm">
              <div className="xp-taskpane-card-header px-2.5 py-1.5 font-bold text-[#215dc6]">
                Other Places
              </div>
              <div className="bg-[#d6dff7] p-2 flex flex-col gap-1.5 text-[#215dc6]">
                <button
                  type="button"
                  onClick={() => navigateTo(userDocsId)}
                  className="flex items-center gap-1.5 text-left hover:underline cursor-default"
                >
                  <XpIcon name="my_documents" size={14} />
                  <span>My Documents</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigateTo(userPicsId)}
                  className="flex items-center gap-1.5 text-left hover:underline cursor-default"
                >
                  <XpIcon name="my_pictures" size={14} />
                  <span>My Pictures</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigateTo(userMusicId)}
                  className="flex items-center gap-1.5 text-left hover:underline cursor-default"
                >
                  <XpIcon name="my_music" size={14} />
                  <span>My Music</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigateTo(SYSTEM_IDS.MY_COMPUTER)}
                  className="flex items-center gap-1.5 text-left hover:underline cursor-default"
                >
                  <XpIcon name="my_computer" size={14} />
                  <span>My Computer</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigateTo(SYSTEM_IDS.MY_NETWORK_PLACES)}
                  className="flex items-center gap-1.5 text-left hover:underline cursor-default"
                >
                  <XpIcon name="network" size={14} />
                  <span>My Network Places</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigateTo(SYSTEM_IDS.RECYCLE_BIN)}
                  className="flex items-center gap-1.5 text-left hover:underline cursor-default"
                >
                  <XpIcon
                    name={vfs.trash.length > 0 ? 'recycle_bin_full' : 'recycle_bin_empty'}
                    size={14}
                  />
                  <span>Recycle Bin</span>
                </button>
              </div>
            </div>

            {/* Details Card */}
            <div className="rounded-t-[4px] overflow-hidden shadow-sm">
              <div className="xp-taskpane-card-header px-2.5 py-1.5 font-bold text-[#215dc6]">
                Details
              </div>
              <div className="bg-[#d6dff7] p-2 text-[#000000] leading-[1.4]">
                {selectedNode ? (
                  <>
                    <div className="font-bold break-words">{selectedNode.name}</div>
                    <div className="text-[#334678]">{getNodeTypeLabel(selectedNode)}</div>
                    {!isFolderLike(selectedNode) && (
                      <div className="text-[#4a5c8a]">
                        Size: {formatSizeKb(computeNodeSizeBytes(selectedNode))}
                      </div>
                    )}
                    <div className="text-[#4a5c8a] mt-1">
                      Modified: {new Date(selectedNode.updatedAt).toLocaleDateString()}
                    </div>
                  </>
                ) : selectedTrash ? (
                  <>
                    <div className="font-bold break-words">{selectedTrash.node.name}</div>
                    <div className="text-[#334678]">{getNodeTypeLabel(selectedTrash.node)}</div>
                    <div className="text-[#4a5c8a] mt-1 break-words">
                      Origin: {selectedTrash.originalPathLabel}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="font-bold">
                      {isRecycleBin ? 'Recycle Bin' : currentNode?.name ?? 'My Computer'}
                    </div>
                    <div className="text-[#334678]">
                      {isRecycleBin
                        ? `${vfs.trash.length} item${vfs.trash.length === 1 ? '' : 's'}`
                        : isZipView
                        ? `${zipEntries.length} archived entry`
                        : `${rawChildren.length} object${rawChildren.length === 1 ? '' : 's'}`}
                    </div>
                  </>
                )}
              </div>
            </div>
          </aside>
        )}

        {/* Right Content Area */}
        <div
          onClick={() => {
            setSelectedIds([]);
            setRenamingId(null);
          }}
          onContextMenu={handleEmptyAreaContextMenu}
          className="flex-1 min-w-0 bg-[#ffffff] overflow-y-auto xp-scroll p-3"
        >
          {searchResults !== null ? (
            searchResults.length === 0 ? (
              <div className="p-4 text-[#666666]">
                Search is complete. There are no results to display.
              </div>
            ) : (
              <table className="w-full border-collapse text-left text-[11px]">
                <thead>
                  <tr className="bg-[#f4f2eb] border-b border-[#d4d0c8] text-[#333333]">
                    <th className="py-1 px-2 font-normal">Name</th>
                    <th className="py-1 px-2 font-normal">In Folder</th>
                    <th className="py-1 px-2 font-normal">Type</th>
                    <th className="py-1 px-2 font-normal">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {searchResults.map((node) => {
                    const parentPath = node.parentId ? getDisplayPath(vfs, node.parentId) : '';
                    return (
                      <tr
                        key={node.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedIds([node.id]);
                        }}
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          activateNode(node);
                        }}
                        className={`cursor-default ${
                          selectedIds.includes(node.id)
                            ? 'bg-[#316ac5] text-white'
                            : 'hover:bg-[#eef4fd]'
                        }`}
                      >
                        <td className="py-1 px-2 flex items-center gap-1.5">
                          <XpIcon name={iconForVfsNode(node)} size={16} />
                          <span>{node.name}</span>
                        </td>
                        <td className="py-1 px-2 truncate max-w-[200px]">{parentPath}</td>
                        <td className="py-1 px-2">{getNodeTypeLabel(node)}</td>
                        <td className="py-1 px-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (node.parentId) {
                                setSearchResults(null);
                                navigateTo(node.parentId, true);
                                setSelectedIds([node.id]);
                              }
                            }}
                            className="xp-button px-2 py-0 text-[10px]"
                          >
                            Open containing folder
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )
          ) : isZipView && currentNode ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between bg-[#eef4fd] border border-[#b7ceec] px-3 py-2 rounded-[3px]">
                <div className="flex items-center gap-2">
                  <XpIcon name="archive_zip" size={24} />
                  <div>
                    <div className="font-bold">{currentNode.name}</div>
                    <div className="text-[10px] text-[#4a5c8a]">
                      Compressed (zipped) Folder — {zipEntries.length} item(s)
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleExtractArchive(currentNode)}
                  className="xp-button xp-button-default px-3"
                >
                  Extract All...
                </button>
              </div>
              <table className="w-full border-collapse text-left text-[11px]">
                <thead>
                  <tr className="bg-[#f4f2eb] border-b border-[#d4d0c8]">
                    <th className="py-1 px-2 font-normal">Archived Entry</th>
                    <th className="py-1 px-2 font-normal">Original Size</th>
                    <th className="py-1 px-2 font-normal">Preview</th>
                  </tr>
                </thead>
                <tbody>
                  {zipEntries.map((entry) => (
                    <tr key={entry.name} className="border-b border-[#f1efe9]">
                      <td className="py-1 px-2 font-medium">{entry.name}</td>
                      <td className="py-1 px-2">{entry.sizeBytes} bytes</td>
                      <td className="py-1 px-2 text-[#555] truncate max-w-[240px]">
                        {entry.contentPreview}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : isRecycleBin ? (
            vfs.trash.length === 0 ? (
              <div className="p-4 text-[#666666]">Recycle Bin is empty.</div>
            ) : (
              <table className="w-full border-collapse text-left text-[11px]">
                <thead>
                  <tr className="bg-[#f4f2eb] border-b border-[#d4d0c8] text-[#333333]">
                    <th className="py-1 px-2 font-normal">Name</th>
                    <th className="py-1 px-2 font-normal">Original Location</th>
                    <th className="py-1 px-2 font-normal">Type</th>
                    <th className="py-1 px-2 font-normal">Date Deleted</th>
                  </tr>
                </thead>
                <tbody>
                  {vfs.trash.map((item) => {
                    const isSel = selectedIds.includes(item.id);
                    return (
                      <tr
                        key={item.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedIds([item.id]);
                        }}
                        onContextMenu={(e) => handleTrashContextMenu(e, item)}
                        className={`cursor-default ${
                          isSel ? 'bg-[#316ac5] text-[#ffffff]' : 'hover:bg-[#eef4fd]'
                        }`}
                      >
                        <td className="py-1 px-2 flex items-center gap-1.5">
                          <XpIcon name={iconForTrash(item)} size={16} />
                          <span>{item.node.name}</span>
                        </td>
                        <td className="py-1 px-2 break-all">{item.originalPathLabel}</td>
                        <td className="py-1 px-2">{getNodeTypeLabel(item.node)}</td>
                        <td className="py-1 px-2 whitespace-nowrap">
                          {new Date(item.deletedAt).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )
          ) : currentId === SYSTEM_IDS.MY_COMPUTER ? (
            <div className="flex flex-col gap-4">
              <div>
                <div className="font-bold text-[#000000] border-b border-[#6fa0e8] pb-0.5 mb-2">
                  Files Stored on This Computer
                </div>
                <div className="flex flex-wrap gap-2">
                  {rawChildren.filter((n) => n.kind === 'folder').map(renderIconGridItem)}
                  {userDocsId !== SYSTEM_IDS.MY_DOCUMENTS && vfs.nodes[userDocsId] &&
                    renderIconGridItem(vfs.nodes[userDocsId])}
                </div>
              </div>
              <div>
                <div className="font-bold text-[#000000] border-b border-[#6fa0e8] pb-0.5 mb-2">
                  Hard Disk Drives &amp; Devices with Removable Storage
                </div>
                <div className="flex flex-wrap gap-2">
                  {rawChildren.filter((n) => n.kind === 'drive').map(renderIconGridItem)}
                </div>
              </div>
            </div>
          ) : isBurnedCdView ? (
            <div className="flex flex-col gap-3">
              <div className="bg-[#eef4fd] border border-[#b7ceec] px-3 py-2 rounded-[3px] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <XpIcon name="cd_drive" size={24} />
                  <div>
                    <div className="font-bold">
                      {system.burnedCdVolumeName} (CD-RW Drive D:)
                    </div>
                    <div className="text-[10px] text-[#4a5c8a]">
                      {system.burnedCdFiles.length} burned file(s) on disc
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onLaunchApp('cdburn')}
                  className="xp-button px-2.5"
                >
                  Burn another disc...
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {system.burnedCdFiles.map((f, idx) => (
                  <div
                    key={`${f.name}-${idx}`}
                    className="w-[90px] flex flex-col items-center p-1.5 text-center"
                  >
                    <XpIcon
                      name={f.kind === 'image' ? 'image_file' : f.kind === 'audio' ? 'wmp' : 'text_file'}
                      size={32}
                    />
                    <span className="mt-1 text-[11px] break-words max-w-full">{f.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : rawChildren.length === 0 ? (
            <div className="p-4 text-[#666666]">This folder is empty.</div>
          ) : viewMode === 'details' ? (
            <table className="w-full border-collapse text-left text-[11px]">
              <thead>
                <tr className="bg-[#f4f2eb] border-b border-[#d4d0c8] text-[#333333]">
                  <th className="py-1 px-2 font-normal">
                    <button type="button" onClick={() => handleSort('name')} className="hover:underline">
                      Name {sortKey === 'name' ? (sortAsc ? '▲' : '▼') : ''}
                    </button>
                  </th>
                  <th className="py-1 px-2 font-normal">
                    <button type="button" onClick={() => handleSort('size')} className="hover:underline">
                      Size {sortKey === 'size' ? (sortAsc ? '▲' : '▼') : ''}
                    </button>
                  </th>
                  <th className="py-1 px-2 font-normal">
                    <button type="button" onClick={() => handleSort('type')} className="hover:underline">
                      Type {sortKey === 'type' ? (sortAsc ? '▲' : '▼') : ''}
                    </button>
                  </th>
                  <th className="py-1 px-2 font-normal">
                    <button type="button" onClick={() => handleSort('date')} className="hover:underline">
                      Date Modified {sortKey === 'date' ? (sortAsc ? '▲' : '▼') : ''}
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rawChildren.map((node) => {
                  const isSel = selectedIds.includes(node.id);
                  const displayName = formatDisplayFileName(
                    node.name,
                    node.kind,
                    system.folderOptions.showExtensions
                  );
                  return (
                    <tr
                      key={node.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedIds([node.id]);
                        if (system.folderOptions.singleClickToOpen) activateNode(node);
                      }}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        activateNode(node);
                      }}
                      onContextMenu={(e) => handleItemContextMenu(e, node)}
                      className={`cursor-default ${
                        isSel ? 'bg-[#316ac5] text-[#ffffff]' : 'hover:bg-[#eef4fd]'
                      }`}
                    >
                      <td className="py-1 px-2 flex items-center gap-1.5">
                        <XpIcon name={iconForVfsNode(node)} size={16} />
                        <span>{displayName}</span>
                      </td>
                      <td className="py-1 px-2 whitespace-nowrap">
                        {isFolderLike(node) ? '' : formatSizeKb(computeNodeSizeBytes(node))}
                      </td>
                      <td className="py-1 px-2">{getNodeTypeLabel(node)}</td>
                      <td className="py-1 px-2 whitespace-nowrap">
                        {new Date(node.updatedAt).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="flex flex-wrap gap-2 content-start">{rawChildren.map(renderIconGridItem)}</div>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="h-[20px] shrink-0 bg-[#ece9d8] border-t border-[#aca899] px-2 flex items-center justify-between text-[11px] text-[#333333]">
        <span>
          {searchResults !== null
            ? `${searchResults.length} file(s) found`
            : isRecycleBin
            ? `${vfs.trash.length} object${vfs.trash.length === 1 ? '' : 's'}`
            : isZipView
            ? `${zipEntries.length} archived entry`
            : `${rawChildren.length} object${rawChildren.length === 1 ? '' : 's'}`}
        </span>
        <span className="truncate ml-3">{displayPath}</span>
      </div>

      {/* Properties Modal */}
      {propertiesTarget && (
        <div className="fixed inset-0 z-[9940] flex items-center justify-center bg-black/20 p-3">
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`${propertiesTarget.name} Properties`}
            className="w-full max-w-[360px] rounded-t-[7px] xp-window-active-border bg-[#ece9d8] flex flex-col shadow-xl"
          >
            <div className="h-[27px] xp-titlebar-active rounded-t-[5px] px-2 flex items-center justify-between">
              <span className="text-[12px] font-bold text-white truncate">
                {propertiesTarget.name} Properties
              </span>
              <button
                type="button"
                aria-label="Close Properties"
                onClick={() => setPropertiesTarget(null)}
                className="xp-caption-close w-[21px] h-[21px] flex items-center justify-center"
              >
                ×
              </button>
            </div>
            <div className="p-3 flex flex-col gap-3 text-[11px]">
              <div className="flex gap-1 border-b border-[#aca899] pb-1">
                <button
                  type="button"
                  onClick={() => setPropertiesTab('general')}
                  className={`px-3 py-1 rounded-t-[3px] border border-b-0 ${
                    propertiesTab === 'general'
                      ? 'bg-white border-[#aca899] font-bold'
                      : 'bg-[#e3dfd0] border-[#c4bfb0]'
                  }`}
                >
                  General
                </button>
                {propertiesTarget.systemKey === 'c_drive' && (
                  <button
                    type="button"
                    onClick={() => setPropertiesTab('tools')}
                    className={`px-3 py-1 rounded-t-[3px] border border-b-0 ${
                      propertiesTab === 'tools'
                        ? 'bg-white border-[#aca899] font-bold'
                        : 'bg-[#e3dfd0] border-[#c4bfb0]'
                    }`}
                  >
                    Tools
                  </button>
                )}
              </div>

              {propertiesTab === 'general' ? (
                <div className="bg-white border border-[#aca899] p-3 flex flex-col gap-2">
                  <div className="flex items-center gap-3 pb-2 border-b border-[#e5e2d8]">
                    <XpIcon name={iconForVfsNode(propertiesTarget)} size={32} />
                    <div className="font-bold">{propertiesTarget.name}</div>
                  </div>
                  <div>Type: {getNodeTypeLabel(propertiesTarget)}</div>
                  <div>Location: {getDisplayPath(vfs, propertiesTarget.parentId ?? SYSTEM_IDS.MY_COMPUTER)}</div>
                  {propertiesTarget.systemKey === 'c_drive' ? (
                    <>
                      <div>File system: NTFS</div>
                      <div>
                        Used space: {(cUsedMb / 1024).toFixed(2)} GB ({cUsedMb.toLocaleString()} MB)
                      </div>
                      <div>
                        Free space: {((cTotalMb - cUsedMb) / 1024).toFixed(2)} GB (
                        {(cTotalMb - cUsedMb).toLocaleString()} MB)
                      </div>
                      <div className="h-[14px] w-full bg-[#e6e6e6] border border-[#888] overflow-hidden">
                        <div
                          className="h-full bg-[#316ac5]"
                          style={{ width: `${Math.min(100, Math.round((cUsedMb / cTotalMb) * 100))}%` }}
                        />
                      </div>
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setPropertiesTarget(null);
                            onLaunchApp('cleanmgr');
                          }}
                          className="xp-button px-3"
                        >
                          Disk Cleanup
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        Size:{' '}
                        {isFolderLike(propertiesTarget)
                          ? 'Folder'
                          : `${computeNodeSizeBytes(propertiesTarget).toLocaleString()} bytes`}
                      </div>
                      <div>
                        Modified: {new Date(propertiesTarget.updatedAt).toLocaleString()}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="bg-white border border-[#aca899] p-3 flex flex-col gap-3">
                  <div className="border border-[#d4d0c8] p-2.5 flex items-center justify-between gap-2">
                    <div>
                      <div className="font-bold">Error-checking</div>
                      <div className="text-[#555]">Check the volume for file system errors.</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setPropertiesTarget(null);
                        onLaunchApp('chkdsk');
                      }}
                      className="xp-button px-3 shrink-0"
                    >
                      Check Now...
                    </button>
                  </div>
                  <div className="border border-[#d4d0c8] p-2.5 flex items-center justify-between gap-2">
                    <div>
                      <div className="font-bold">Defragmentation</div>
                      <div className="text-[#555]">Defragment files on this volume.</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setPropertiesTarget(null);
                        onLaunchApp('dfrg');
                      }}
                      className="xp-button px-3 shrink-0"
                    >
                      Defragment Now...
                    </button>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPropertiesTarget(null)}
                  className="xp-button xp-button-default min-w-[74px]"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Open With Dialog */}
      {openWithNode && (
        <OpenWithDialog
          node={openWithNode}
          currentAssocAppId={resolveAppForFile(
            openWithNode.name,
            openWithNode.kind,
            system.fileAssociations
          )}
          zIndex={9945}
          onCancel={() => setOpenWithNode(null)}
          onConfirm={(appId, makeDefault) => {
            if (makeDefault) {
              const dot = openWithNode.name.lastIndexOf('.');
              if (dot >= 0) {
                onUpdateFileAssoc(openWithNode.name.slice(dot).toLowerCase(), appId);
              }
            }
            const target = openWithNode;
            setOpenWithNode(null);
            onOpenFile(target, appId);
          }}
        />
      )}
    </div>
  );
};
