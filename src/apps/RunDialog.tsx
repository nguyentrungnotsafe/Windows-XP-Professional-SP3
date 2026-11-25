import React, { useEffect, useRef, useState } from 'react';
import type {
  AppId,
  ModalPromptRequest,
  SystemState,
  VfsNode,
  VfsState,
  WindowInstance,
} from '../types/os';
import { SYSTEM_IDS, isFolderLike, resolveAddressPath, resolvePathFromFolder } from '../state/vfs';
import { APP_REGISTRY_MAP, RUN_ALIAS_MAP, isAppInstalled } from '../state/appRegistry';
import { XpIcon } from '../components/xp/XpIcons';
import { VfsFileDialog } from '../components/xp/XpDialog';

interface RunDialogProps {
  windowId: string;
  isActive: boolean;
  vfs: VfsState;
  system: SystemState;
  onLaunchApp: (appId: AppId, payload?: WindowInstance['payload']) => void;
  onOpenFile: (node: VfsNode) => void;
  onCreateFolder: (parentId: string, name: string) => { ok: boolean; error?: string };
  onOpenModal: (modal: Omit<ModalPromptRequest, 'id'>) => void;
  onClose: () => void;
}

export const RunDialog: React.FC<RunDialogProps> = ({
  windowId,
  isActive,
  vfs,
  system,
  onLaunchApp,
  onOpenFile,
  onCreateFolder,
  onOpenModal,
  onClose,
}) => {
  const [command, setCommand] = useState('');
  const [browseOpen, setBrowseOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isActive && !browseOpen) {
      inputRef.current?.focus();
    }
  }, [isActive, browseOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = command.trim();
    const cleaned = raw.toLowerCase();
    if (!cleaned) return;

    // 1. Check URL
    if (/^https?:\/\//i.test(raw)) {
      onClose();
      onLaunchApp('iexplore', { initialUrl: raw });
      return;
    }

    // 2. Check Run alias registry
    const targetApp = RUN_ALIAS_MAP[cleaned];
    if (targetApp) {
      if (targetApp === 'cmd' && system.groupPolicy.disableCmd) {
        onOpenModal({
          parentWindowId: windowId,
          kind: 'alert',
          icon: 'error',
          title: 'Restrictions',
          message: 'The command prompt has been disabled by your administrator (Group Policy).',
        });
        return;
      }
      if (targetApp === 'regedit' && system.groupPolicy.disableRegedit) {
        onOpenModal({
          parentWindowId: windowId,
          kind: 'alert',
          icon: 'error',
          title: 'Registry Editor',
          message: 'Registry editing has been disabled by your administrator (Group Policy).',
        });
        return;
      }
      if (!isAppInstalled(targetApp, system.optionalComponents)) {
        const meta = APP_REGISTRY_MAP[targetApp];
        onOpenModal({
          parentWindowId: windowId,
          kind: 'confirm',
          icon: 'warning',
          title: 'Windows Component Not Installed',
          message: `${meta.displayName} is an optional Windows XP component that is currently not installed.\n\nOpen Add/Remove Windows Components to install it?`,
          confirmLabel: 'Install...',
          cancelLabel: 'Cancel',
          onConfirm: () => {
            onClose();
            onLaunchApp('wincomp');
          },
        });
        return;
      }
      onClose();
      onLaunchApp(targetApp);
      return;
    }

    // 3. Check VFS path or folder address
    const folderId = resolveAddressPath(vfs, raw);
    if (folderId) {
      onClose();
      onLaunchApp(folderId === SYSTEM_IDS.RECYCLE_BIN ? 'recyclebin' : 'explorer', { folderId });
      return;
    }

    const resolved = resolvePathFromFolder(vfs, SYSTEM_IDS.MY_DOCUMENTS, raw);
    if (resolved.node) {
      onClose();
      if (isFolderLike(resolved.node)) {
        onLaunchApp('explorer', { folderId: resolved.node.id });
      } else {
        onOpenFile(resolved.node);
      }
      return;
    }

    onOpenModal({
      parentWindowId: windowId,
      kind: 'alert',
      icon: 'error',
      title: raw,
      message: `Windows cannot find '${raw}'. Make sure you typed the name correctly, and then try again. To search for a file, click the Start button, and then click Search.`,
      onConfirm: () => {
        inputRef.current?.focus();
        inputRef.current?.select();
      },
    });
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col justify-between bg-[#ece9d8] p-3.5 text-[11px]">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <XpIcon name="run" size={32} />
          <p className="text-[#000000] leading-[1.4]">
            Type the name of a program, folder, document, or Internet resource, and Windows will
            open it for you.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <label htmlFor={`run-open-${windowId}`} className="shrink-0">
            Open:
          </label>
          <input
            id={`run-open-${windowId}`}
            ref={inputRef}
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="e.g. notepad, wordpad, cmd, services.msc"
            className="xp-input flex-1 h-[22px]"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-1">
          <button type="submit" className="xp-button xp-button-default min-w-[74px]">
            OK
          </button>
          <button type="button" onClick={onClose} className="xp-button min-w-[74px]">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => setBrowseOpen(true)}
            className="xp-button min-w-[74px]"
          >
            Browse...
          </button>
        </div>
      </form>

      {browseOpen && (
        <VfsFileDialog
          mode="open"
          title="Browse"
          vfs={vfs}
          initialFolderId={SYSTEM_IDS.MY_DOCUMENTS}
          acceptKinds={['text', 'rtf', 'image', 'audio', 'archive', 'project']}
          fileTypeLabel="All Files (*.*)"
          defaultExtension=""
          zIndex={9950}
          onCreateFolder={onCreateFolder}
          onCancel={() => setBrowseOpen(false)}
          onConfirm={({ selectedNode }) => {
            setBrowseOpen(false);
            if (selectedNode) {
              onClose();
              onOpenFile(selectedNode);
            }
          }}
        />
      )}
    </div>
  );
};
