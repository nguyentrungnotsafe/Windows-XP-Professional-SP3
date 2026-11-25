import React, { useEffect, useRef, useState } from 'react';
import type { AppId, ModalPromptRequest, NodeKind, VfsNode, VfsState } from '../../types/os';
import {
  SYSTEM_IDS,
  getChildren,
  getDisplayPath,
  isFolderLike,
} from '../../state/vfs';
import { APP_REGISTRY_MAP } from '../../state/appRegistry';
import { XpIcon, type XpIconName } from './XpIcons';

interface XpModalDialogProps {
  modal: ModalPromptRequest;
  zIndex: number;
  onDismiss: () => void;
}

export const XpModalDialog: React.FC<XpModalDialogProps> = ({ modal, zIndex, onDismiss }) => {
  const [inputValue, setInputValue] = useState(modal.defaultValue ?? '');
  const inputRef = useRef<HTMLInputElement>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setInputValue(modal.defaultValue ?? '');
  }, [modal.id, modal.defaultValue]);

  useEffect(() => {
    if (modal.kind === 'rename') {
      inputRef.current?.focus();
      inputRef.current?.select();
    } else {
      confirmBtnRef.current?.focus();
    }
  }, [modal.id, modal.kind]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        modal.onCancel?.();
        onDismiss();
      }
    };
    window.addEventListener('keydown', handleKey, true);
    return () => window.removeEventListener('keydown', handleKey, true);
  }, [modal, onDismiss]);

  const iconName: XpIconName =
    modal.icon === 'error'
      ? 'alert_error'
      : modal.icon === 'warning'
      ? 'alert_warning'
      : modal.icon === 'question'
      ? 'alert_question'
      : 'alert_info';

  return (
    <div
      style={{ zIndex }}
      className="fixed inset-0 flex items-center justify-center bg-black/15 p-3"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) {
          e.stopPropagation();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={modal.title}
        className="w-full max-w-[400px] rounded-t-[7px] xp-window-active-border bg-[#ece9d8] flex flex-col shadow-xl"
      >
        <div className="h-[27px] xp-titlebar-active rounded-t-[5px] px-2 flex items-center justify-between">
          <span className="text-[12px] font-bold text-white truncate">{modal.title}</span>
          <button
            type="button"
            aria-label={`Close ${modal.title}`}
            onClick={() => {
              modal.onCancel?.();
              onDismiss();
            }}
            className="xp-caption-close w-[21px] h-[21px] flex items-center justify-center"
          >
            <svg viewBox="0 0 12 12" className="w-3 h-3" aria-hidden="true">
              <path d="M3 3 L9 9 M9 3 L3 9" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            modal.onConfirm?.(inputValue);
            onDismiss();
          }}
          className="p-4 flex flex-col gap-4"
        >
          <div className="flex items-start gap-3">
            <XpIcon name={iconName} size={32} />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-[#000000] whitespace-pre-line leading-[1.45]">
                {modal.message}
              </p>
              {modal.kind === 'rename' && (
                <div className="mt-2.5">
                  <label htmlFor="xp-modal-input" className="sr-only">
                    Name
                  </label>
                  <input
                    id="xp-modal-input"
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="xp-input w-full"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1 flex-wrap">
            {modal.kind === 'save_discard_cancel' ? (
              <>
                <button
                  ref={confirmBtnRef}
                  type="submit"
                  className="xp-button xp-button-default min-w-[76px]"
                >
                  {modal.confirmLabel ?? 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    modal.onSecondary?.();
                    onDismiss();
                  }}
                  className="xp-button min-w-[82px]"
                >
                  {modal.secondaryLabel ?? "Don't Save"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    modal.onCancel?.();
                    onDismiss();
                  }}
                  className="xp-button min-w-[74px]"
                >
                  {modal.cancelLabel ?? 'Cancel'}
                </button>
              </>
            ) : modal.kind === 'restore_conflict' ? (
              <>
                <button
                  ref={confirmBtnRef}
                  type="submit"
                  className="xp-button xp-button-default min-w-[84px]"
                >
                  {modal.confirmLabel ?? 'Replace'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    modal.onSecondary?.();
                    onDismiss();
                  }}
                  className="xp-button min-w-[88px]"
                >
                  {modal.secondaryLabel ?? 'Keep Both'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    modal.onCancel?.();
                    onDismiss();
                  }}
                  className="xp-button min-w-[74px]"
                >
                  {modal.cancelLabel ?? 'Cancel'}
                </button>
              </>
            ) : modal.kind === 'confirm' || modal.kind === 'rename' ? (
              <>
                <button
                  ref={confirmBtnRef}
                  type="submit"
                  className="xp-button xp-button-default min-w-[74px]"
                >
                  {modal.confirmLabel ?? 'OK'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    modal.onCancel?.();
                    onDismiss();
                  }}
                  className="xp-button min-w-[74px]"
                >
                  {modal.cancelLabel ?? 'Cancel'}
                </button>
              </>
            ) : (
              <button
                ref={confirmBtnRef}
                type="submit"
                className="xp-button xp-button-default min-w-[74px]"
              >
                {modal.confirmLabel ?? 'OK'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

interface VfsFileDialogProps {
  mode: 'open' | 'save';
  title: string;
  vfs: VfsState;
  initialFolderId: string;
  defaultFileName?: string;
  acceptKinds: Array<Exclude<NodeKind, 'folder' | 'drive' | 'system'>>;
  fileTypeLabel: string;
  defaultExtension: string;
  zIndex: number;
  onCreateFolder: (parentId: string, name: string) => { ok: boolean; error?: string };
  onConfirm: (result: { folderId: string; fileName: string; selectedNode?: VfsNode }) => void;
  onCancel: () => void;
}

export function iconForVfsNode(node: VfsNode): XpIconName {
  if (node.systemKey === 'c_drive') return 'drive';
  if (node.systemKey === 'd_drive') return 'cd_drive';
  if (node.systemKey === 'my_documents') return 'my_documents';
  if (node.systemKey === 'my_pictures') return 'my_pictures';
  if (node.systemKey === 'my_music') return 'my_music';
  if (node.systemKey === 'my_network_places') return 'network';
  if (node.systemKey === 'my_computer') return 'my_computer';
  if (node.kind === 'folder') return 'folder';
  if (node.kind === 'image') return 'image_file';
  if (node.kind === 'rtf') return 'wordpad';
  if (node.kind === 'audio') return 'wmp';
  if (node.kind === 'archive') return 'archive_zip';
  if (node.kind === 'project') return 'movie_maker';
  return 'text_file';
}

export const VfsFileDialog: React.FC<VfsFileDialogProps> = ({
  mode,
  title,
  vfs,
  initialFolderId,
  defaultFileName = '',
  acceptKinds,
  fileTypeLabel,
  defaultExtension,
  zIndex,
  onCreateFolder,
  onConfirm,
  onCancel,
}) => {
  const [currentFolderId, setCurrentFolderId] = useState(
    vfs.nodes[initialFolderId] ? initialFolderId : SYSTEM_IDS.MY_DOCUMENTS
  );
  const [fileName, setFileName] = useState(defaultFileName);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newFolderMode, setNewFolderMode] = useState(false);
  const [newFolderName, setNewFolderName] = useState('New Folder');
  const [inlineError, setInlineError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKey, true);
    return () => window.removeEventListener('keydown', handleKey, true);
  }, [onCancel]);

  const currentFolder = vfs.nodes[currentFolderId];
  const children = getChildren(vfs, currentFolderId).filter(
    (node) =>
      isFolderLike(node) ||
      acceptKinds.includes(node.kind as Exclude<NodeKind, 'folder' | 'drive' | 'system'>)
  );

  const handleGoUp = () => {
    if (currentFolder?.parentId && vfs.nodes[currentFolder.parentId]) {
      setCurrentFolderId(currentFolder.parentId);
      setSelectedId(null);
      setInlineError(null);
    }
  };

  const handleItemActivate = (node: VfsNode) => {
    setInlineError(null);
    if (isFolderLike(node)) {
      setCurrentFolderId(node.id);
      setSelectedId(null);
      return;
    }
    setSelectedId(node.id);
    setFileName(node.name);
    onConfirm({ folderId: currentFolderId, fileName: node.name, selectedNode: node });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setInlineError(null);
    let trimmed = fileName.trim();
    if (!trimmed) {
      setInlineError('Please enter a file name.');
      return;
    }
    if (mode === 'save' && !trimmed.includes('.') && defaultExtension) {
      trimmed = `${trimmed}${defaultExtension}`;
    }

    if (mode === 'open') {
      const match = children.find(
        (n) => !isFolderLike(n) && n.name.toLowerCase() === trimmed.toLowerCase()
      );
      if (!match) {
        const folderMatch = children.find(
          (n) => isFolderLike(n) && n.name.toLowerCase() === trimmed.toLowerCase()
        );
        if (folderMatch) {
          setCurrentFolderId(folderMatch.id);
          setFileName('');
          return;
        }
        setInlineError(`"${trimmed}" was not found in this folder.`);
        return;
      }
      onConfirm({ folderId: currentFolderId, fileName: match.name, selectedNode: match });
      return;
    }

    if (currentFolderId === SYSTEM_IDS.MY_COMPUTER || currentFolderId === SYSTEM_IDS.D_DRIVE) {
      setInlineError('Select My Documents, My Pictures, My Music, or a writable folder on Local Disk (C:) to save.');
      return;
    }
    onConfirm({ folderId: currentFolderId, fileName: trimmed });
  };

  const handleCreateNewFolder = () => {
    const res = onCreateFolder(currentFolderId, newFolderName);
    if (!res.ok) {
      setInlineError(res.error ?? 'Could not create folder.');
      return;
    }
    setNewFolderMode(false);
    setNewFolderName('New Folder');
    setInlineError(null);
  };

  return (
    <div
      style={{ zIndex }}
      className="fixed inset-0 flex items-center justify-center bg-black/15 p-3"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-[520px] rounded-t-[7px] xp-window-active-border bg-[#ece9d8] flex flex-col shadow-xl"
      >
        <div className="h-[27px] xp-titlebar-active rounded-t-[5px] px-2 flex items-center justify-between">
          <span className="text-[12px] font-bold text-white">{title}</span>
          <button
            type="button"
            aria-label={`Close ${title}`}
            onClick={onCancel}
            className="xp-caption-close w-[21px] h-[21px] flex items-center justify-center"
          >
            <svg viewBox="0 0 12 12" className="w-3 h-3" aria-hidden="true">
              <path d="M3 3 L9 9 M9 3 L3 9" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-3 flex flex-col gap-2.5 text-[11px]">
          <div className="flex items-center gap-2">
            <label htmlFor="vfs-dlg-folder" className="w-[54px] shrink-0 text-right">
              {mode === 'open' ? 'Look in:' : 'Save in:'}
            </label>
            <select
              id="vfs-dlg-folder"
              value={currentFolderId}
              onChange={(e) => {
                setCurrentFolderId(e.target.value);
                setSelectedId(null);
                setInlineError(null);
              }}
              className="xp-input flex-1 h-[22px]"
            >
              <option value={SYSTEM_IDS.MY_COMPUTER}>My Computer</option>
              <option value={SYSTEM_IDS.C_DRIVE}>Local Disk (C:)</option>
              <option value={SYSTEM_IDS.MY_DOCUMENTS}>My Documents</option>
              <option value={SYSTEM_IDS.MY_PICTURES}>My Pictures</option>
              <option value={SYSTEM_IDS.MY_MUSIC}>My Music</option>
              {!([
                SYSTEM_IDS.MY_COMPUTER,
                SYSTEM_IDS.C_DRIVE,
                SYSTEM_IDS.MY_DOCUMENTS,
                SYSTEM_IDS.MY_PICTURES,
                SYSTEM_IDS.MY_MUSIC,
              ] as string[]).includes(currentFolderId) &&
                currentFolder && (
                  <option value={currentFolder.id}>
                    {getDisplayPath(vfs, currentFolder.id)}
                  </option>
                )}
            </select>
            <button
              type="button"
              onClick={handleGoUp}
              disabled={!currentFolder?.parentId}
              title="Up One Level"
              aria-label="Up One Level"
              className="xp-button px-2 min-w-[26px]"
            >
              ↑
            </button>
            <button
              type="button"
              onClick={() => {
                setNewFolderMode((v) => !v);
                setInlineError(null);
              }}
              disabled={currentFolderId === SYSTEM_IDS.MY_COMPUTER || currentFolderId === SYSTEM_IDS.D_DRIVE}
              title="Create New Folder"
              aria-label="Create New Folder"
              className="xp-button px-2"
            >
              New Folder
            </button>
          </div>

          {newFolderMode && (
            <div className="flex items-center gap-2 bg-[#f5f3ea] border border-[#aca899] p-1.5">
              <label htmlFor="vfs-new-folder-name" className="shrink-0">
                Folder name:
              </label>
              <input
                id="vfs-new-folder-name"
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="xp-input flex-1"
              />
              <button
                type="button"
                onClick={handleCreateNewFolder}
                className="xp-button px-2.5"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setNewFolderMode(false)}
                className="xp-button px-2"
              >
                Cancel
              </button>
            </div>
          )}

          <div className="flex gap-2 h-[205px]">
            <div className="w-[92px] shrink-0 bg-[#ece9d8] border border-[#aca899] p-1 flex flex-col gap-1 overflow-y-auto xp-scroll">
              {[
                { id: SYSTEM_IDS.MY_DOCUMENTS, label: 'My Documents', icon: 'my_documents' as XpIconName },
                { id: SYSTEM_IDS.MY_PICTURES, label: 'My Pictures', icon: 'my_pictures' as XpIconName },
                { id: SYSTEM_IDS.MY_MUSIC, label: 'My Music', icon: 'my_music' as XpIconName },
                { id: SYSTEM_IDS.MY_COMPUTER, label: 'My Computer', icon: 'my_computer' as XpIconName },
                { id: SYSTEM_IDS.C_DRIVE, label: 'Local Disk (C:)', icon: 'drive' as XpIconName },
              ].map((place) => (
                <button
                  key={place.id}
                  type="button"
                  onClick={() => {
                    setCurrentFolderId(place.id);
                    setSelectedId(null);
                    setInlineError(null);
                  }}
                  className={`flex flex-col items-center p-1 rounded-[2px] text-[10px] text-center cursor-default ${
                    currentFolderId === place.id
                      ? 'bg-[#316ac5] text-white'
                      : 'hover:bg-[#d8e4f8] text-black'
                  }`}
                >
                  <XpIcon name={place.icon} size={20} />
                  <span className="mt-0.5 leading-tight">{place.label}</span>
                </button>
              ))}
            </div>

            <div className="flex-1 bg-[#ffffff] border border-[#7f9db9] overflow-y-auto xp-scroll p-1.5">
              {children.length === 0 ? (
                <div className="text-[#666666] p-2">This folder is empty.</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                  {children.map((node) => {
                    const icon = iconForVfsNode(node);
                    const isSel = selectedId === node.id;
                    return (
                      <button
                        key={node.id}
                        type="button"
                        onClick={() => {
                          setSelectedId(node.id);
                          setInlineError(null);
                          if (!isFolderLike(node)) setFileName(node.name);
                        }}
                        onDoubleClick={() => handleItemActivate(node)}
                        className={`flex items-center gap-1.5 px-1.5 py-1 text-left rounded-[2px] cursor-default ${
                          isSel
                            ? 'bg-[#316ac5] text-white'
                            : 'hover:bg-[#eef4fd] text-black'
                        }`}
                      >
                        <XpIcon name={icon} size={16} />
                        <span className="truncate">{node.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {inlineError && (
            <div role="alert" className="text-[#b32017] bg-[#fff3f2] border border-[#e29a94] px-2 py-1">
              {inlineError}
            </div>
          )}

          <div className="flex items-center gap-2">
            <label htmlFor="vfs-dlg-filename" className="w-[64px] shrink-0 text-right">
              File name:
            </label>
            <input
              id="vfs-dlg-filename"
              ref={inputRef}
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="xp-input flex-1 h-[22px]"
            />
            <button type="submit" className="xp-button xp-button-default min-w-[78px]">
              {mode === 'open' ? 'Open' : 'Save'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-[64px] shrink-0 text-right">Files of type:</span>
            <div className="xp-input flex-1 h-[22px] flex items-center bg-[#f4f2eb] text-[#333333]">
              {fileTypeLabel}
            </div>
            <button type="button" onClick={onCancel} className="xp-button min-w-[78px]">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface OpenWithDialogProps {
  node: VfsNode;
  currentAssocAppId: AppId;
  zIndex: number;
  onConfirm: (appId: AppId, makeDefault: boolean) => void;
  onCancel: () => void;
}

const OPEN_WITH_CANDIDATES: AppId[] = [
  'notepad',
  'wordpad',
  'paint',
  'imageviewer',
  'wmplayer',
  'moviemaker',
  'iexplore',
  'explorer',
];

export const OpenWithDialog: React.FC<OpenWithDialogProps> = ({
  node,
  currentAssocAppId,
  zIndex,
  onConfirm,
  onCancel,
}) => {
  const [selectedApp, setSelectedApp] = useState<AppId>(currentAssocAppId);
  const [makeDefault, setMakeDefault] = useState(false);

  return (
    <div style={{ zIndex }} className="fixed inset-0 flex items-center justify-center bg-black/20 p-3">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Open With"
        className="w-full max-w-[390px] rounded-t-[7px] xp-window-active-border bg-[#ece9d8] flex flex-col shadow-xl"
      >
        <div className="h-[27px] xp-titlebar-active rounded-t-[5px] px-2 flex items-center justify-between">
          <span className="text-[12px] font-bold text-white">Open With</span>
          <button
            type="button"
            aria-label="Close Open With"
            onClick={onCancel}
            className="xp-caption-close w-[21px] h-[21px] flex items-center justify-center"
          >
            <svg viewBox="0 0 12 12" className="w-3 h-3" aria-hidden="true">
              <path d="M3 3 L9 9 M9 3 L3 9" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="p-3.5 flex flex-col gap-3 text-[11px]">
          <div className="flex items-center gap-2.5">
            <XpIcon name={iconForVfsNode(node)} size={28} />
            <div className="min-w-0">
              <div className="text-[#333333]">Choose the program you want to use to open this file:</div>
              <div className="font-bold truncate mt-0.5">{node.name}</div>
            </div>
          </div>

          <div className="bg-white border border-[#7f9db9] h-[160px] overflow-y-auto xp-scroll p-1 flex flex-col gap-0.5">
            {OPEN_WITH_CANDIDATES.map((appId) => {
              const meta = APP_REGISTRY_MAP[appId];
              const sel = selectedApp === appId;
              return (
                <button
                  key={appId}
                  type="button"
                  onClick={() => setSelectedApp(appId)}
                  onDoubleClick={() => onConfirm(appId, makeDefault)}
                  className={`flex items-center gap-2 px-2 py-1 text-left rounded-[2px] cursor-default ${
                    sel ? 'bg-[#316ac5] text-white' : 'hover:bg-[#eef4fd]'
                  }`}
                >
                  <XpIcon name={meta.iconName} size={18} />
                  <span>{meta.displayName}</span>
                </button>
              );
            })}
          </div>

          <label className="flex items-center gap-2 cursor-default">
            <input
              type="checkbox"
              checked={makeDefault}
              onChange={(e) => setMakeDefault(e.target.checked)}
            />
            <span>Always use the selected program to open this kind of file</span>
          </label>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => onConfirm(selectedApp, makeDefault)}
              className="xp-button xp-button-default min-w-[74px]"
            >
              OK
            </button>
            <button type="button" onClick={onCancel} className="xp-button min-w-[74px]">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
