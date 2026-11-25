import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  AppId,
  AppearancePrefs,
  ContextMenuItem,
  DesktopIconId,
  ModalPromptRequest,
  NodeKind,
  PrintJob,
  SessionPhase,
  SystemState,
  UserAccount,
  VfsNode,
  VfsState,
  WindowBounds,
  WindowInstance,
} from '../../types/os';
import {
  SYSTEM_IDS,
  compressNodesToZip,
  copyNode,
  createFolder,
  deletePermanentlyFromTrash,
  emptyRecycleBin,
  ensureUserHomeFolders,
  extractZipToFolder,
  moveNode,
  moveToRecycleBin,
  renameNode,
  restoreFromRecycleBin,
  writeFile,
} from '../../state/vfs';
import {
  APP_REGISTRY_MAP,
  isAppInstalled,
  resolveAppForFile,
} from '../../state/appRegistry';
import {
  appendEventLog,
  DEFAULT_APPEARANCE,
} from '../../state/systemState';
import {
  loadAppearancePrefs,
  loadSystemState,
  loadVfsState,
  saveAppearancePrefs,
  saveSystemState,
  saveVfsState,
} from '../../state/storage';
import {
  getModalSoundForIcon,
  getSessionTransitionSound,
  xpAudio,
  type XpSystemSoundId,
} from '../../utils/audioEngine';
import { clampWindowBounds, getCascadedBounds } from '../../utils/windowLayout';
import { XpIcon, type XpIconName } from './XpIcons';
import { WallpaperLayer } from './WallpaperLayer';
import { Taskbar } from './Taskbar';
import { StartMenu } from './StartMenu';
import { ContextMenu } from './ContextMenu';
import { XpWindow } from './XpWindow';
import { XpModalDialog } from './XpDialog';
import { LogonScreen } from './LogonScreen';

// Applications
import { ExplorerApp, type ExplorerClipboard } from '../../apps/ExplorerApp';
import { HelpAndSupportApp, TourWindowsXpApp, WindowsUpdateApp } from '../../apps/HelpAndSupportApp';
import { NotepadApp } from '../../apps/NotepadApp';
import { WordPadApp } from '../../apps/WordPadApp';
import { PaintApp } from '../../apps/PaintApp';
import { ImageViewerApp } from '../../apps/ImageViewerApp';
import { CalculatorApp } from '../../apps/CalculatorApp';
import { CharacterMapApp } from '../../apps/CharacterMapApp';
import { AddressBookApp } from '../../apps/AddressBookApp';
import { CommandPromptApp } from '../../apps/CommandPromptApp';
import { PhotoPrintingWizardApp, ScannerCameraWizardApp } from '../../apps/ImagingWizardsApp';
import {
  CdWritingWizardApp,
  ProgramCompatibilityWizardApp,
  SynchronizeApp,
} from '../../apps/UtilityWizardsApp';
import { InternetExplorerApp, MsnExplorerApp } from '../../apps/InternetExplorerApp';
import { OutlookExpressApp } from '../../apps/OutlookExpressApp';
import { WindowsMessengerApp } from '../../apps/WindowsMessengerApp';
import {
  RemoteAssistanceApp,
  RemoteDesktopConnectionDialog,
  RemoteDesktopSession,
} from '../../apps/RemoteDesktopApps';
import {
  FaxConsoleApp,
  HyperTerminalApp,
  NetworkConnectionsApp,
  NetworkSetupWizardApp,
  NewConnectionWizardApp,
  PhoneDialerApp,
  WirelessSetupWizardApp,
} from '../../apps/NetworkWizardsApp';
import {
  MediaPlayerApp,
  MovieMakerApp,
  SoundRecorderApp,
  VolumeControlApp,
} from '../../apps/MultimediaApps';
import {
  FreeCellApp,
  HeartsApp,
  SolitaireApp,
  SpiderSolitaireApp,
} from '../../apps/CardGamesApp';
import {
  MinesweeperApp,
  PinballApp,
  ZoneBoardGameApp,
} from '../../apps/BoardAndArcadeGamesApp';
import {
  AccessibilityOptionsDialog,
  AccessibilityWizardApp,
  MagnifierControlApp,
  MagnifierOverlay,
  NarratorApp,
  OnScreenKeyboardApp,
  UtilityManagerApp,
} from '../../apps/AccessibilityApps';
import { ControlPanelApp } from '../../apps/ControlPanelApp';
import {
  AddHardwareWizardApp,
  AddRemoveProgramsApp,
  AdministrativeToolsFolderApp,
  AutomaticUpdatesDialog,
  DateTimeDialog,
  FolderOptionsDialog,
  FontsFolderApp,
  GameControllersDialog,
  InternetOptionsDialog,
  KeyboardOptionsDialog,
  MouseOptionsDialog,
  PhoneModemOptionsDialog,
  PowerOptionsDialog,
  PrintersAndFaxesApp,
  RegionalOptionsDialog,
  ScannersAndCamerasDialog,
  SecurityCenterApp,
  SoundsAudioOptionsDialog,
  SpeechPropertiesDialog,
  SystemPropertiesDialog,
  TaskbarPropertiesDialog,
  UserAccountsApp,
  WindowsComponentsWizardApp,
  WindowsFirewallDialog,
} from '../../apps/ControlPanelApplets';
import {
  BackupUtilityApp,
  CheckDiskApp,
  DiskCleanupApp,
  DiskDefragApp,
  DxDiagApp,
  EudcEditorApp,
  IExpressWizardApp,
  MsConfigApp,
  RegeditApp,
  ScheduledTasksApp,
  SystemInfoApp,
  SystemRestoreApp,
  TaskManagerApp,
  TransferWizardApp,
} from '../../apps/SystemDiagnosticsApps';
import { MmcConsolesApp } from '../../apps/MmcConsolesApp';
import { DisplayPropertiesDialog } from '../../apps/DisplayPropertiesDialog';
import { RunDialog } from '../../apps/RunDialog';

function getAppIcon(appId: AppId): XpIconName {
  const entry = APP_REGISTRY_MAP[appId];
  return (entry?.iconName as XpIconName) ?? 'folder';
}

export const DesktopShell: React.FC = () => {
  const initialVfsLoad = useMemo(() => loadVfsState(), []);
  const initialSystem = useMemo(() => loadSystemState(loadAppearancePrefs()), []);

  const [vfs, setVfs] = useState<VfsState>(() => {
    const activeName = initialSystem.activeUsername || 'Administrator';
    const ensured = ensureUserHomeFolders(initialVfsLoad.value, activeName);
    return ensured.state;
  });
  const [system, setSystem] = useState<SystemState>(initialSystem);
  const [windows, setWindows] = useState<WindowInstance[]>([]);
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
  const [selectedDesktopIcon, setSelectedDesktopIcon] = useState<DesktopIconId | null>(null);
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [clipboard, setClipboard] = useState<ExplorerClipboard | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    items: ContextMenuItem[];
  } | null>(null);
  const [modals, setModals] = useState<ModalPromptRequest[]>([]);
  const [sessionPhase, setSessionPhase] = useState<SessionPhase>('desktop');
  const [remoteTarget, setRemoteTarget] = useState<{ host: string; username: string }>({
    host: 'XP-LAB-02',
    username: initialSystem.activeUsername,
  });
  const [magnifierOpen, setMagnifierOpen] = useState(false);

  const zCounterRef = useRef(100);
  const closeGuardsRef = useRef<Record<string, () => boolean>>({});
  const storageWarnedRef = useRef(false);
  const touchLongPressRef = useRef<number | null>(null);
  const lastEditableRef = useRef<HTMLElement[]>([]);
  const titleHandlersRef = useRef<Record<string, (title: string) => void>>({});
  const boundsHandlersRef = useRef<Record<string, (bounds: WindowBounds) => void>>({});
  const bootSoundDoneRef = useRef(false);
  const gestureArmedRef = useRef(false);
  const sessionPhaseRef = useRef<SessionPhase>(sessionPhase);

  useEffect(() => {
    sessionPhaseRef.current = sessionPhase;
  }, [sessionPhase]);

  const activeUser = useMemo(
    () => system.users.find((u) => u.username === system.activeUsername) ?? system.users[0],
    [system.users, system.activeUsername]
  );

  const activeAppearance: AppearancePrefs = activeUser?.appearance ?? DEFAULT_APPEARANCE;

  const enqueueModal = useCallback((modal: Omit<ModalPromptRequest, 'id'>) => {
    const id = `mdl_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const soundId = getModalSoundForIcon(modal.icon);
    if (soundId) {
      void xpAudio.playSystemSound(soundId);
    }
    setModals((prev) => [...prev, { ...modal, id }]);
  }, []);

  useEffect(() => {
    if (initialVfsLoad.error && !storageWarnedRef.current) {
      storageWarnedRef.current = true;
      enqueueModal({
        kind: 'alert',
        icon: 'warning',
        title: 'Storage Notice',
        message: initialVfsLoad.error,
      });
    }
  }, [initialVfsLoad.error, enqueueModal]);

  const commitVfs = useCallback(
    (next: VfsState) => {
      setVfs(next);
      const res = saveVfsState(next);
      if (!res.ok && !storageWarnedRef.current) {
        storageWarnedRef.current = true;
        enqueueModal({
          kind: 'alert',
          icon: 'warning',
          title: 'Storage Limit Reached',
          message: res.error ?? 'Could not persist changes to browser storage.',
        });
      }
    },
    [enqueueModal]
  );

  const updateSystem = useCallback((updater: (prev: SystemState) => SystemState) => {
    setSystem((prev) => {
      const next = updater(prev);
      saveSystemState(next);
      return next;
    });
  }, []);

  // Sync audio hardware state & Windows Audio service
  useEffect(() => {
    const audioSvc = system.services.find((s) => s.id === 'audiosrv');
    const serviceStopped = audioSvc?.status === 'Stopped';
    xpAudio.applyState(serviceStopped ? { ...system.audio, muted: true } : system.audio);
  }, [system.audio, system.services]);

  // Preload XP WAV sound effects & play Windows XP Startup sound on boot or first user gesture
  useEffect(() => {
    xpAudio.preloadSystemSounds();
    if (bootSoundDoneRef.current || sessionPhase !== 'desktop') return;

    let cancelled = false;
    let cleanupGesture: (() => void) | null = null;

    const armGestureFallback = () => {
      if (gestureArmedRef.current || bootSoundDoneRef.current || cancelled) return;
      gestureArmedRef.current = true;
      const triggerOnFirstGesture = () => {
        cleanupGesture?.();
        if (bootSoundDoneRef.current || sessionPhaseRef.current !== 'desktop') return;
        bootSoundDoneRef.current = true;
        void xpAudio.playSystemSound('startup', { interrupt: false });
      };
      window.addEventListener('pointerdown', triggerOnFirstGesture, { capture: true, once: true });
      window.addEventListener('keydown', triggerOnFirstGesture, { capture: true, once: true });
      cleanupGesture = () => {
        window.removeEventListener('pointerdown', triggerOnFirstGesture, { capture: true });
        window.removeEventListener('keydown', triggerOnFirstGesture, { capture: true });
      };
    };

    void xpAudio
      .playSystemSound('startup', { interrupt: false, allowBlockedReturn: true })
      .then((res) => {
        if (cancelled) return;
        if (res === 'played' || res === 'muted') {
          bootSoundDoneRef.current = true;
        } else {
          armGestureFallback();
        }
      });

    return () => {
      cancelled = true;
      cleanupGesture?.();
    };
  }, [sessionPhase]);

  // Process queued print jobs automatically when Print Spooler starts running
  useEffect(() => {
    const spoolerRunning =
      system.services.find((s) => s.id === 'spooler')?.status === 'Running';
    if (!spoolerRunning) return;

    const hasCompletableQueue = system.printJobs.some((job) => {
      if (job.status !== 'Queued') return false;
      const printer = system.printers.find((p) => p.id === job.printerId);
      return printer ? !printer.paused : true;
    });

    if (hasCompletableQueue) {
      updateSystem((prev) => {
        let count = 0;
        const nextJobs = prev.printJobs.map((job) => {
          if (job.status !== 'Queued') return job;
          const printer = prev.printers.find((p) => p.id === job.printerId);
          if (printer?.paused) return job;
          count += 1;
          return { ...job, status: 'Completed' as const };
        });
        if (count === 0) return prev;
        return appendEventLog(
          { ...prev, printJobs: nextJobs },
          {
            logType: 'System',
            level: 'Information',
            source: 'PrintSpooler',
            eventId: 6161,
            message: `Print Spooler processed ${count} queued print job(s).`,
          }
        );
      });
    }
  }, [system.services, system.printJobs, system.printers, updateSystem]);

  // Track recent connected editable targets for On-Screen Keyboard injection
  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.id.startsWith('run-open-')) return;
      if (
        target instanceof HTMLTextAreaElement ||
        (target instanceof HTMLInputElement &&
          !['checkbox', 'radio', 'range', 'color', 'button', 'submit', 'file'].includes(target.type)) ||
        target.isContentEditable
      ) {
        lastEditableRef.current = [
          target,
          ...lastEditableRef.current.filter((el) => el !== target && document.contains(el)),
        ].slice(0, 8);
      }
    };
    document.addEventListener('focusin', handleFocusIn);
    return () => document.removeEventListener('focusin', handleFocusIn);
  }, []);

  const handleInjectKey = useCallback((key: string) => {
    lastEditableRef.current = lastEditableRef.current.filter((el) => document.contains(el));
    const target = lastEditableRef.current[0];
    if (!target) return;

    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
      const start = target.selectionStart ?? target.value.length;
      const end = target.selectionEnd ?? target.value.length;
      let nextVal = target.value;
      let nextCaret = start;

      if (key === 'Backspace') {
        if (start !== end) {
          nextVal = target.value.slice(0, start) + target.value.slice(end);
          nextCaret = start;
        } else if (start > 0) {
          nextVal = target.value.slice(0, start - 1) + target.value.slice(end);
          nextCaret = start - 1;
        }
      } else if (key === 'Enter') {
        if (target instanceof HTMLTextAreaElement) {
          nextVal = target.value.slice(0, start) + '\n' + target.value.slice(end);
          nextCaret = start + 1;
        } else {
          target.form?.requestSubmit();
          return;
        }
      } else {
        nextVal = target.value.slice(0, start) + key + target.value.slice(end);
        nextCaret = start + key.length;
      }

      const proto =
        target instanceof HTMLTextAreaElement
          ? HTMLTextAreaElement.prototype
          : HTMLInputElement.prototype;
      const descriptor = Object.getOwnPropertyDescriptor(proto, 'value');
      if (descriptor?.set) {
        descriptor.set.call(target, nextVal);
      } else {
        target.value = nextVal;
      }
      target.dispatchEvent(new Event('input', { bubbles: true }));
      target.focus();
      try {
        target.setSelectionRange(nextCaret, nextCaret);
      } catch {
        // ignore inputs that disallow selectionRange
      }
    } else if (target.isContentEditable) {
      target.focus();
      if (key === 'Backspace') {
        document.execCommand('delete', false);
      } else if (key === 'Enter') {
        document.execCommand('insertParagraph', false);
      } else {
        document.execCommand('insertText', false, key);
      }
      target.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }, []);

  // Keep windows inside viewport on browser resize
  useEffect(() => {
    const handleResize = () => {
      setWindows((prev) =>
        prev.map((w) => ({
          ...w,
          bounds: clampWindowBounds(
            w.bounds,
            window.innerWidth,
            window.innerHeight,
            w.minWidth,
            w.minHeight
          ),
        }))
      );
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const focusWindow = useCallback((windowId: string) => {
    const nextZ = ++zCounterRef.current;
    setWindows((prev) =>
      prev.map((w) => (w.id === windowId ? { ...w, zIndex: nextZ, minimized: false } : w))
    );
    setActiveWindowId(windowId);
  }, []);

  const getTitleUpdater = useCallback((windowId: string) => {
    if (!titleHandlersRef.current[windowId]) {
      titleHandlersRef.current[windowId] = (title: string) => {
        setWindows((prev) => {
          const target = prev.find((w) => w.id === windowId);
          if (!target || target.title === title) return prev;
          return prev.map((w) => (w.id === windowId ? { ...w, title } : w));
        });
      };
    }
    return titleHandlersRef.current[windowId];
  }, []);

  const getBoundsUpdater = useCallback((windowId: string) => {
    if (!boundsHandlersRef.current[windowId]) {
      boundsHandlersRef.current[windowId] = (bounds: WindowBounds) => {
        setWindows((prev) => {
          const target = prev.find((w) => w.id === windowId);
          if (
            !target ||
            (target.bounds.x === bounds.x &&
              target.bounds.y === bounds.y &&
              target.bounds.width === bounds.width &&
              target.bounds.height === bounds.height)
          ) {
            return prev;
          }
          return prev.map((w) => (w.id === windowId ? { ...w, bounds } : w));
        });
      };
    }
    return boundsHandlersRef.current[windowId];
  }, []);

  const forceCloseWindow = useCallback((windowId: string) => {
    delete closeGuardsRef.current[windowId];
    delete titleHandlersRef.current[windowId];
    delete boundsHandlersRef.current[windowId];
    setWindows((prev) => {
      const remaining = prev.filter((w) => w.id !== windowId);
      setActiveWindowId((curr) => {
        if (curr !== windowId) return curr;
        const visible = remaining.filter((w) => !w.minimized);
        if (visible.length === 0) return null;
        return visible.reduce((a, b) => (a.zIndex > b.zIndex ? a : b)).id;
      });
      return remaining;
    });
  }, []);

  const requestCloseWindow = useCallback(
    (windowId: string) => {
      const guard = closeGuardsRef.current[windowId];
      if (guard && !guard()) {
        return;
      }
      forceCloseWindow(windowId);
    },
    [forceCloseWindow]
  );

  const launchApp = useCallback(
    (appId: AppId, payload?: WindowInstance['payload']) => {
      setStartMenuOpen(false);
      setContextMenu(null);

      // Group policy checks
      if (appId === 'run' && system.groupPolicy.hideRunFromStart) {
        enqueueModal({
          kind: 'alert',
          icon: 'error',
          title: 'Restrictions',
          message:
            'This operation has been cancelled due to restrictions in effect on this computer (Group Policy).',
        });
        return;
      }
      if (appId === 'display' && system.groupPolicy.hideDisplayPanel) {
        enqueueModal({
          kind: 'alert',
          icon: 'error',
          title: 'Display Properties',
          message:
            'Your administrator disabled the Display Control Panel via Group Policy.',
        });
        return;
      }

      const reg = APP_REGISTRY_MAP[appId];
      if (!reg) return;

      // Optional Windows component check
      if (!isAppInstalled(appId, system.optionalComponents)) {
        enqueueModal({
          kind: 'confirm',
          icon: 'info',
          title: 'Windows Component Not Installed',
          message: `"${reg.displayName}" is an optional Windows component that is currently not installed.\nWould you like to open the Windows Components Wizard to install it?`,
          confirmLabel: 'Yes',
          cancelLabel: 'No',
          onConfirm: () => {
            launchApp('wincomp');
          },
        });
        return;
      }

      // Single-instance check
      if (reg.singleInstance) {
        const existing = windows.find((w) => w.appId === appId);
        if (existing) {
          focusWindow(existing.id);
          return;
        }
      }

      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const openCount = windows.length;
      const id = `win_${appId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const nextZ = ++zCounterRef.current;

      const { width, height, minWidth, minHeight } = reg.defaultSize;
      const bounds =
        appId === 'run'
          ? clampWindowBounds(
              {
                x: Math.min(28, Math.max(8, vw - 360)),
                y: Math.max(8, vh - 30 - 190),
                width: Math.min(width, vw - 16),
                height,
              },
              vw,
              vh,
              minWidth,
              minHeight
            )
          : appId === 'osk'
          ? clampWindowBounds(
              {
                x: Math.max(8, Math.round((vw - width) / 2)),
                y: Math.max(8, vh - 30 - height - 8),
                width: Math.min(width, vw - 16),
                height,
              },
              vw,
              vh,
              minWidth,
              minHeight
            )
          : getCascadedBounds(width, height, openCount, vw, vh, minWidth, minHeight);

      let title = reg.displayName;
      if (appId === 'explorer') {
        const targetFolderId = payload?.folderId ?? SYSTEM_IDS.MY_COMPUTER;
        title =
          targetFolderId === SYSTEM_IDS.RECYCLE_BIN
            ? 'Recycle Bin'
            : vfs.nodes[targetFolderId]?.name ?? 'My Computer';
      } else if (appId === 'search') {
        title = 'Search Results';
      } else if (appId === 'notepad') {
        const fileNode = payload?.fileId ? vfs.nodes[payload.fileId] : undefined;
        title = `${fileNode?.name ?? 'Untitled'} - Notepad`;
      } else if (appId === 'wordpad') {
        const fileNode = payload?.fileId ? vfs.nodes[payload.fileId] : undefined;
        title = `${fileNode?.name ?? 'Document'} - WordPad`;
      } else if (appId === 'paint') {
        const fileNode = payload?.fileId ? vfs.nodes[payload.fileId] : undefined;
        title = `${fileNode?.name ?? 'untitled'} - Paint`;
      } else if (appId === 'imageviewer') {
        const fileNode = payload?.fileId ? vfs.nodes[payload.fileId] : undefined;
        title = fileNode
          ? `${fileNode.name} - Windows Picture and Fax Viewer`
          : 'Windows Picture and Fax Viewer';
      } else if (appId === 'iexplore') {
        title = 'MSN Start Page - Microsoft Internet Explorer';
      }

      const newWin: WindowInstance = {
        id,
        appId,
        title,
        bounds,
        resizable: reg.resizable,
        canMaximize: reg.canMaximize,
        canMinimize: reg.canMinimize,
        minWidth,
        minHeight,
        zIndex: nextZ,
        minimized: false,
        maximized: false,
        payload:
          appId === 'explorer'
            ? { ...payload, folderId: payload?.folderId ?? SYSTEM_IDS.MY_COMPUTER }
            : appId === 'recyclebin'
            ? { ...payload, folderId: SYSTEM_IDS.RECYCLE_BIN }
            : appId === 'search'
            ? { ...payload, folderId: payload?.folderId ?? SYSTEM_IDS.MY_COMPUTER, initialTab: 'search' }
            : payload,
      };

      setWindows((prev) => [...prev, newWin]);
      setActiveWindowId(id);
    },
    [windows, vfs.nodes, system.groupPolicy, system.optionalComponents, focusWindow, enqueueModal]
  );

  const openVfsFile = useCallback(
    (node: VfsNode, overrideAppId?: AppId) => {
      const targetApp =
        overrideAppId ?? resolveAppForFile(node.name, node.kind, system.fileAssociations);
      if (targetApp === 'explorer') {
        launchApp('explorer', {
          folderId: node.parentId ?? SYSTEM_IDS.MY_DOCUMENTS,
          highlightNodeId: node.id,
        });
        return;
      }
      launchApp(targetApp, { fileId: node.id });
    },
    [launchApp, system.fileAssociations]
  );

  // VFS action handlers
  const handleCreateFolder = useCallback(
    (parentId: string, name: string) => {
      const res = createFolder(vfs, parentId, name);
      if (res.error) return { ok: false, error: res.error };
      commitVfs(res.state);
      return { ok: true, node: res.node };
    },
    [vfs, commitVfs]
  );

  const handleRenameNode = useCallback(
    (nodeId: string, newName: string) => {
      const res = renameNode(vfs, nodeId, newName);
      if (res.error) return { ok: false, error: res.error };
      commitVfs(res.state);
      return { ok: true };
    },
    [vfs, commitVfs]
  );

  const handleCopyNode = useCallback(
    (sourceId: string, destParentId: string) => {
      const res = copyNode(vfs, sourceId, destParentId);
      if (res.error) return { ok: false, error: res.error };
      commitVfs(res.state);
      return { ok: true, node: res.node };
    },
    [vfs, commitVfs]
  );

  const handleMoveNode = useCallback(
    (sourceId: string, destParentId: string) => {
      const res = moveNode(vfs, sourceId, destParentId);
      if (res.error) return { ok: false, error: res.error };
      commitVfs(res.state);
      return { ok: true, node: res.node };
    },
    [vfs, commitVfs]
  );

  const handleSaveFile = useCallback(
    (params: {
      parentId: string;
      name: string;
      content: string;
      kind: Exclude<NodeKind, 'folder' | 'drive' | 'system'>;
      mimeType: string;
      existingFileId?: string;
      allowOverwrite?: boolean;
    }) => {
      const res = writeFile(vfs, params);
      if (res.needsOverwriteConfirm) {
        return { ok: false, needsOverwriteConfirm: true, error: res.error };
      }
      if (res.error || !res.node) {
        return { ok: false, error: res.error };
      }
      commitVfs(res.state);
      return { ok: true, node: res.node };
    },
    [vfs, commitVfs]
  );

  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      const res = moveToRecycleBin(vfs, nodeId);
      if (res.error) {
        enqueueModal({
          kind: 'alert',
          icon: 'error',
          title: 'Error Deleting File or Folder',
          message: res.error,
        });
        return;
      }
      commitVfs(res.state);
    },
    [vfs, commitVfs, enqueueModal]
  );

  const handleRestoreTrash = useCallback(
    (trashId: string) => {
      const res = restoreFromRecycleBin(vfs, trashId);
      if (res.conflict) {
        enqueueModal({
          kind: 'restore_conflict',
          icon: 'warning',
          title: 'Confirm File Replace',
          message: `This folder already contains an item named "${res.conflict.existingNode.name}".\nDo you want to replace it or keep both?`,
          confirmLabel: 'Replace',
          secondaryLabel: 'Keep Both',
          cancelLabel: 'Cancel',
          onConfirm: () => {
            const replaced = restoreFromRecycleBin(vfs, trashId, 'replace');
            if (replaced.error) {
              enqueueModal({
                kind: 'alert',
                icon: 'error',
                title: 'Restore Error',
                message: replaced.error,
              });
            } else {
              commitVfs(replaced.state);
            }
          },
          onSecondary: () => {
            const kept = restoreFromRecycleBin(vfs, trashId, 'keep_both');
            if (kept.error) {
              enqueueModal({
                kind: 'alert',
                icon: 'error',
                title: 'Restore Error',
                message: kept.error,
              });
            } else {
              commitVfs(kept.state);
            }
          },
        });
        return;
      }
      if (res.error) {
        enqueueModal({
          kind: 'alert',
          icon: 'error',
          title: 'Restore Error',
          message: res.error,
        });
        return;
      }
      commitVfs(res.state);
    },
    [vfs, commitVfs, enqueueModal]
  );

  const handleDeleteTrashPermanently = useCallback(
    (trashId: string) => {
      const item = vfs.trash.find((t) => t.id === trashId);
      enqueueModal({
        kind: 'confirm',
        icon: 'warning',
        title: 'Confirm File Delete',
        message: `Are you sure you want to permanently delete "${item?.node.name ?? 'this item'}"?`,
        confirmLabel: 'Yes',
        cancelLabel: 'No',
        onConfirm: () => {
          commitVfs(deletePermanentlyFromTrash(vfs, trashId));
        },
      });
    },
    [vfs, commitVfs, enqueueModal]
  );

  const handleEmptyRecycleBin = useCallback(() => {
    if (vfs.trash.length === 0) return;
    enqueueModal({
      kind: 'confirm',
      icon: 'warning',
      title: 'Confirm Multiple File Delete',
      message: `Are you sure you want to permanently delete all ${vfs.trash.length} item(s) in the Recycle Bin?`,
      confirmLabel: 'Yes',
      cancelLabel: 'No',
      onConfirm: () => {
        commitVfs(emptyRecycleBin(vfs));
      },
    });
  }, [vfs, commitVfs, enqueueModal]);

  const handleCompressToZip = useCallback(
    (sourceIds: string[], destParentId: string) => {
      const res = compressNodesToZip(vfs, sourceIds, destParentId);
      if (res.error) return { ok: false, error: res.error };
      commitVfs(res.state);
      return { ok: true, node: res.node };
    },
    [vfs, commitVfs]
  );

  const handleExtractZip = useCallback(
    (zipNodeId: string, destParentId: string) => {
      const res = extractZipToFolder(vfs, zipNodeId, destParentId);
      if (res.error) return { ok: false, error: res.error };
      commitVfs(res.state);
      return { ok: true, extractedFolder: res.extractedFolder };
    },
    [vfs, commitVfs]
  );

  const handleStageToCd = useCallback(
    (nodeIds: string[]) => {
      updateSystem((prev) => ({
        ...prev,
        cdStagingNodeIds: Array.from(new Set([...prev.cdStagingNodeIds, ...nodeIds])),
      }));
      launchApp('cdburn');
    },
    [updateSystem, launchApp]
  );

  const handleSubmitPrintJob = useCallback(
    (printerId: string, documentName: string, appName: string, pages: number) => {
      updateSystem((prev) => {
        const spoolerRunning =
          prev.services.find((s) => s.id === 'spooler')?.status === 'Running';
        const printer = prev.printers.find((p) => p.id === printerId) ?? prev.printers[0];
        const status: PrintJob['status'] =
          spoolerRunning && !printer?.paused ? 'Completed' : 'Queued';
        const job: PrintJob = {
          id: `pj_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
          printerId: printer?.id ?? printerId,
          documentName,
          appName,
          owner: prev.activeUsername,
          pages,
          status,
          submittedAt: Date.now(),
        };
        return appendEventLog(
          { ...prev, printJobs: [job, ...prev.printJobs] },
          {
            logType: 'System',
            level: 'Information',
            source: 'PrintSpooler',
            eventId: 6160,
            message: `Document "${documentName}" (${appName}) -> ${printer?.name ?? printerId} [${status}].`,
          }
        );
      });
    },
    [updateSystem]
  );

  const handleSwitchUser = useCallback(
    (username: string, options?: { transitionSound?: XpSystemSoundId | null }) => {
      const ensured = ensureUserHomeFolders(vfs, username);
      if (ensured.state !== vfs) {
        commitVfs(ensured.state);
      }
      updateSystem((prev) => {
        const target = prev.users.find((u) => u.username === username);
        if (target) {
          saveAppearancePrefs(target.appearance);
        }
        return {
          ...prev,
          activeUsername: username,
          users: prev.users.map((u) =>
            u.username === username
              ? {
                  ...u,
                  docsFolderId: ensured.docsFolderId,
                  picturesFolderId: ensured.picturesFolderId,
                  musicFolderId: ensured.musicFolderId,
                }
              : u
          ),
        };
      });
      bootSoundDoneRef.current = true;
      const soundToPlay =
        options?.transitionSound === undefined
          ? getSessionTransitionSound('log_on')
          : options.transitionSound;
      if (soundToPlay) {
        void xpAudio.playSystemSound(soundToPlay);
      }
      setSessionPhase('desktop');
    },
    [vfs, commitVfs, updateSystem]
  );

  const handleCreateUser = useCallback(
    (username: string, role: 'Administrator' | 'Limited') => {
      const clean = username.trim();
      if (!clean) return { ok: false, error: 'Please type a user name.' };
      if (system.users.some((u) => u.username.toLowerCase() === clean.toLowerCase())) {
        return { ok: false, error: `User "${clean}" already exists.` };
      }
      const ensured = ensureUserHomeFolders(vfs, clean);
      commitVfs(ensured.state);
      const newAccount: UserAccount = {
        username: clean,
        role,
        appearance: { ...DEFAULT_APPEARANCE },
        docsFolderId: ensured.docsFolderId,
        picturesFolderId: ensured.picturesFolderId,
        musicFolderId: ensured.musicFolderId,
      };
      updateSystem((prev) =>
        appendEventLog(
          { ...prev, users: [...prev.users, newAccount] },
          {
            logType: 'Security',
            level: 'Information',
            source: 'SAM',
            eventId: 624,
            message: `Created local user account "${clean}" (${role}).`,
          }
        )
      );
      return { ok: true };
    },
    [system.users, vfs, commitVfs, updateSystem]
  );

  const handleDeleteUser = useCallback(
    (username: string) => {
      if (username === 'Administrator' || username === system.activeUsername) return;
      updateSystem((prev) => ({
        ...prev,
        users: prev.users.filter((u) => u.username !== username),
      }));
    },
    [system.activeUsername, updateSystem]
  );

  const userDocsId = activeUser?.docsFolderId ?? SYSTEM_IDS.MY_DOCUMENTS;
  const userPicsId = activeUser?.picturesFolderId ?? SYSTEM_IDS.MY_PICTURES;

  const desktopIcons: Array<{
    id: DesktopIconId;
    label: string;
    icon: XpIconName;
    onOpen: () => void;
    onContext: (x: number, y: number) => void;
  }> = [
    {
      id: 'my_documents',
      label: 'My Documents',
      icon: 'my_documents',
      onOpen: () => launchApp('explorer', { folderId: userDocsId }),
      onContext: (x, y) =>
        setContextMenu({
          x,
          y,
          items: [
            {
              id: 'open',
              label: 'Open',
              bold: true,
              onSelect: () => launchApp('explorer', { folderId: userDocsId }),
            },
            {
              id: 'explore',
              label: 'Explore',
              onSelect: () => launchApp('explorer', { folderId: userDocsId }),
            },
          ],
        }),
    },
    {
      id: 'my_computer',
      label: 'My Computer',
      icon: 'my_computer',
      onOpen: () => launchApp('explorer', { folderId: SYSTEM_IDS.MY_COMPUTER }),
      onContext: (x, y) =>
        setContextMenu({
          x,
          y,
          items: [
            {
              id: 'open',
              label: 'Open',
              bold: true,
              onSelect: () => launchApp('explorer', { folderId: SYSTEM_IDS.MY_COMPUTER }),
            },
            {
              id: 'manage',
              label: 'Manage',
              onSelect: () => launchApp('compmgmt'),
            },
            {
              id: 'properties',
              label: 'Properties',
              separatorBefore: true,
              onSelect: () => launchApp('sysdm'),
            },
          ],
        }),
    },
    {
      id: 'my_network_places',
      label: 'My Network Places',
      icon: 'network',
      onOpen: () => launchApp('explorer', { folderId: SYSTEM_IDS.MY_NETWORK_PLACES }),
      onContext: (x, y) =>
        setContextMenu({
          x,
          y,
          items: [
            {
              id: 'open',
              label: 'Open',
              bold: true,
              onSelect: () => launchApp('explorer', { folderId: SYSTEM_IDS.MY_NETWORK_PLACES }),
            },
            {
              id: 'properties',
              label: 'Properties',
              separatorBefore: true,
              onSelect: () => launchApp('ncpa'),
            },
          ],
        }),
    },
    {
      id: 'recycle_bin',
      label: 'Recycle Bin',
      icon: vfs.trash.length > 0 ? 'recycle_bin_full' : 'recycle_bin_empty',
      onOpen: () => launchApp('recyclebin'),
      onContext: (x, y) =>
        setContextMenu({
          x,
          y,
          items: [
            {
              id: 'open',
              label: 'Open',
              bold: true,
              onSelect: () => launchApp('recyclebin'),
            },
            {
              id: 'empty',
              label: 'Empty Recycle Bin',
              disabled: vfs.trash.length === 0,
              separatorBefore: true,
              onSelect: handleEmptyRecycleBin,
            },
          ],
        }),
    },
    {
      id: 'internet_explorer',
      label: 'Internet Explorer',
      icon: 'internet_explorer',
      onOpen: () => launchApp('iexplore'),
      onContext: (x, y) =>
        setContextMenu({
          x,
          y,
          items: [
            {
              id: 'open',
              label: 'Open Home Page',
              bold: true,
              onSelect: () => launchApp('iexplore'),
            },
            {
              id: 'properties',
              label: 'Properties',
              separatorBefore: true,
              onSelect: () => launchApp('inet_opts'),
            },
          ],
        }),
    },
  ];

  const recentFiles = useMemo(
    () =>
      Object.values(vfs.nodes)
        .filter(
          (n) =>
            Boolean(n.parentId) &&
            (n.kind === 'text' || n.kind === 'rtf' || n.kind === 'image' || n.kind === 'project')
        )
        .sort((a, b) => b.updatedAt - a.updatedAt),
    [vfs.nodes]
  );

  const handleDesktopKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget && !(e.target as HTMLElement).dataset.desktopIcon) return;
    if (e.key === 'Enter' && selectedDesktopIcon) {
      e.preventDefault();
      desktopIcons.find((i) => i.id === selectedDesktopIcon)?.onOpen();
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const idx = desktopIcons.findIndex((i) => i.id === selectedDesktopIcon);
      const nextIdx =
        idx === -1
          ? 0
          : e.key === 'ArrowDown'
          ? (idx + 1) % desktopIcons.length
          : (idx - 1 + desktopIcons.length) % desktopIcons.length;
      setSelectedDesktopIcon(desktopIcons[nextIdx].id);
    }
  };

  const handleTaskButtonClick = (win: WindowInstance) => {
    if (win.minimized) {
      focusWindow(win.id);
    } else if (win.id === activeWindowId) {
      setWindows((prev) =>
        prev.map((w) => (w.id === win.id ? { ...w, minimized: true } : w))
      );
      setActiveWindowId((curr) => {
        if (curr !== win.id) return curr;
        const nextTop = windows
          .filter((w) => w.id !== win.id && !w.minimized)
          .sort((a, b) => b.zIndex - a.zIndex)[0];
        return nextTop?.id ?? null;
      });
    } else {
      focusWindow(win.id);
    }
  };

  const handleMaximizeToggle = (winId: string) => {
    setWindows((prev) =>
      prev.map((w) => {
        if (w.id !== winId || !w.canMaximize) return w;
        if (w.maximized) {
          const restored = clampWindowBounds(
            w.restoreBounds ?? w.bounds,
            window.innerWidth,
            window.innerHeight,
            w.minWidth,
            w.minHeight
          );
          return { ...w, maximized: false, bounds: restored, restoreBounds: undefined };
        }
        return { ...w, maximized: true, restoreBounds: w.bounds };
      })
    );
  };

  const handleMinimize = (winId: string) => {
    setWindows((prev) => prev.map((w) => (w.id === winId ? { ...w, minimized: true } : w)));
    setActiveWindowId((curr) => {
      if (curr !== winId) return curr;
      const nextTop = windows
        .filter((w) => w.id !== winId && !w.minimized)
        .sort((a, b) => b.zIndex - a.zIndex)[0];
      return nextTop?.id ?? null;
    });
  };

  const handleShowDesktop = () => {
    const anyVisible = windows.some((w) => !w.minimized);
    setWindows((prev) => prev.map((w) => ({ ...w, minimized: anyVisible })));
    if (anyVisible) setActiveWindowId(null);
  };

  const handleDesktopContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setSelectedDesktopIcon(null);
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      items: [
        {
          id: 'refresh',
          label: 'Refresh',
          onSelect: () => setSelectedDesktopIcon(null),
        },
        {
          id: 'new_notepad',
          label: 'New Text Document',
          separatorBefore: true,
          onSelect: () => launchApp('notepad'),
        },
        {
          id: 'new_wordpad',
          label: 'New WordPad Document',
          onSelect: () => launchApp('wordpad'),
        },
        {
          id: 'properties',
          label: 'Properties',
          separatorBefore: true,
          onSelect: () => launchApp('display'),
        },
      ],
    });
  };

  if (sessionPhase === 'remote_desktop') {
    return (
      <RemoteDesktopSession
        host={remoteTarget.host}
        username={remoteTarget.username}
        onDisconnect={() => setSessionPhase('desktop')}
      />
    );
  }

  if (sessionPhase !== 'desktop') {
    return (
      <LogonScreen
        phase={sessionPhase}
        users={system.users}
        activeUsername={system.activeUsername}
        onLogOn={(username) =>
          handleSwitchUser(username, {
            transitionSound:
              sessionPhase === 'shut_down'
                ? getSessionTransitionSound('power_on')
                : getSessionTransitionSound('log_on'),
          })
        }
        onTurnOff={() => {
          bootSoundDoneRef.current = true;
          void xpAudio.playSystemSound(getSessionTransitionSound('shut_down'));
          setSessionPhase('shut_down');
        }}
      />
    );
  }

  return (
    <main
      tabIndex={0}
      aria-label="Windows XP Desktop"
      onKeyDown={handleDesktopKeyDown}
      onClick={() => {
        setSelectedDesktopIcon(null);
        setActiveWindowId(null);
      }}
      onContextMenu={handleDesktopContextMenu}
      className={`relative w-screen h-screen overflow-hidden select-none focus:outline-none ${
        system.accessibility.highContrast ? 'xp-high-contrast' : ''
      }`}
    >
      <WallpaperLayer appearance={activeAppearance} />

      {magnifierOpen && (
        <MagnifierOverlay
          accessibility={system.accessibility}
          onClose={() => setMagnifierOpen(false)}
        />
      )}

      {/* Desktop Icons Column */}
      <div className="relative z-10 inline-flex flex-col gap-2.5 p-3 items-start">
        {desktopIcons.map((item) => {
          const isSelected = selectedDesktopIcon === item.id;
          return (
            <button
              key={item.id}
              type="button"
              data-desktop-icon={item.id}
              aria-label={item.label}
              aria-pressed={isSelected}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedDesktopIcon(item.id);
                setActiveWindowId(null);
                if (system.folderOptions.singleClickToOpen) {
                  item.onOpen();
                }
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                item.onOpen();
              }}
              onPointerDown={(e) => {
                if (e.pointerType === 'touch') {
                  if (touchLongPressRef.current) window.clearTimeout(touchLongPressRef.current);
                  const cx = e.clientX;
                  const cy = e.clientY;
                  touchLongPressRef.current = window.setTimeout(() => {
                    setSelectedDesktopIcon(item.id);
                    item.onContext(cx, cy);
                  }, 550);
                }
              }}
              onPointerUp={(e) => {
                if (touchLongPressRef.current) {
                  window.clearTimeout(touchLongPressRef.current);
                  touchLongPressRef.current = null;
                }
                if (e.pointerType === 'touch' && isSelected) {
                  item.onOpen();
                }
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setSelectedDesktopIcon(item.id);
                item.onContext(e.clientX, e.clientY);
              }}
              className="w-[74px] flex flex-col items-center p-1 cursor-default rounded-[2px] focus:outline-none"
            >
              <div className={isSelected ? 'opacity-85' : ''}>
                <XpIcon name={item.icon} size={32} />
              </div>
              <span
                className={`mt-1 px-1 py-[1px] text-[11px] leading-[1.2] text-center break-words max-w-full rounded-[1px] ${
                  isSelected
                    ? 'bg-[#316ac5] text-[#ffffff] outline outline-1 outline-dotted outline-[#ffffff]'
                    : 'xp-desktop-label'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Application Windows */}
      {windows.map((win) => {
        const isTopModalForWin = modals.some((m) => m.parentWindowId === win.id);
        const isActive = win.id === activeWindowId && !isTopModalForWin && modals.length === 0;
        const iconName: XpIconName =
          win.appId === 'recyclebin'
            ? vfs.trash.length > 0
              ? 'recycle_bin_full'
              : 'recycle_bin_empty'
            : getAppIcon(win.appId);

        const updateTitle = getTitleUpdater(win.id);
        const updateBounds = getBoundsUpdater(win.id);

        return (
          <XpWindow
            key={win.id}
            win={win}
            active={isActive}
            blockedByModal={isTopModalForWin}
            iconName={iconName}
            onFocus={() => focusWindow(win.id)}
            onClose={() => requestCloseWindow(win.id)}
            onMinimize={() => handleMinimize(win.id)}
            onMaximizeToggle={() => handleMaximizeToggle(win.id)}
            onBoundsChange={updateBounds}
          >
            {/* Shell & File Management */}
            {(win.appId === 'explorer' || win.appId === 'recyclebin' || win.appId === 'search') && (
              <ExplorerApp
                windowId={win.id}
                isActive={isActive}
                vfs={vfs}
                system={system}
                initialFolderId={
                  win.appId === 'recyclebin'
                    ? SYSTEM_IDS.RECYCLE_BIN
                    : win.payload?.folderId ?? SYSTEM_IDS.MY_COMPUTER
                }
                initialTab={win.appId === 'search' ? 'search' : win.payload?.initialTab}
                highlightNodeId={win.payload?.highlightNodeId}
                clipboard={clipboard}
                onSetClipboard={setClipboard}
                onTitleChange={updateTitle}
                onOpenFile={openVfsFile}
                onUpdateFileAssoc={(ext, appId) =>
                  updateSystem((prev) => ({
                    ...prev,
                    fileAssociations: { ...prev.fileAssociations, [ext]: appId },
                  }))
                }
                onLaunchApp={launchApp}
                onCreateFolder={handleCreateFolder}
                onRenameNode={handleRenameNode}
                onCopyNode={handleCopyNode}
                onMoveNode={handleMoveNode}
                onDeleteNode={handleDeleteNode}
                onRestoreTrash={handleRestoreTrash}
                onDeleteTrashPermanently={handleDeleteTrashPermanently}
                onEmptyRecycleBin={handleEmptyRecycleBin}
                onCompressToZip={handleCompressToZip}
                onExtractZip={handleExtractZip}
                onStageToCd={handleStageToCd}
                onOpenContextMenu={(x, y, items) => setContextMenu({ x, y, items })}
                onOpenModal={enqueueModal}
                onCloseWindow={() => forceCloseWindow(win.id)}
              />
            )}

            {win.appId === 'help' && <HelpAndSupportApp onLaunchApp={(id) => launchApp(id)} />}
            {win.appId === 'tour' && <TourWindowsXpApp onClose={() => forceCloseWindow(win.id)} />}
            {win.appId === 'wupdmgr' && (
              <WindowsUpdateApp
                system={system}
                onInstallUpdates={(ids) =>
                  updateSystem((prev) =>
                    appendEventLog(
                      {
                        ...prev,
                        windowsUpdates: prev.windowsUpdates.map((u) =>
                          ids.includes(u.id) ? { ...u, installed: true, installedAt: Date.now() } : u
                        ),
                      },
                      {
                        logType: 'System',
                        level: 'Information',
                        source: 'WindowsUpdateAgent',
                        eventId: 19,
                        message: `Installed ${ids.length} Windows XP SP3 update(s).`,
                      }
                    )
                  )
                }
              />
            )}

            {win.appId === 'run' && (
              <RunDialog
                windowId={win.id}
                isActive={isActive}
                vfs={vfs}
                system={system}
                onLaunchApp={launchApp}
                onOpenFile={openVfsFile}
                onCreateFolder={handleCreateFolder}
                onOpenModal={enqueueModal}
                onClose={() => forceCloseWindow(win.id)}
              />
            )}

            {/* Accessories & Document Apps */}
            {win.appId === 'notepad' && (
              <NotepadApp
                windowId={win.id}
                isActive={isActive}
                vfs={vfs}
                initialFileId={win.payload?.fileId}
                defaultFolderId={userDocsId}
                registerCloseGuard={(id, guard) => {
                  closeGuardsRef.current[id] = guard;
                }}
                onTitleChange={updateTitle}
                onDirtyChange={(dirty) => {
                  setWindows((prev) => {
                    const target = prev.find((w) => w.id === win.id);
                    if (!target || Boolean(target.payload?.dirty) === dirty) return prev;
                    return prev.map((w) =>
                      w.id === win.id ? { ...w, payload: { ...w.payload, dirty } } : w
                    );
                  });
                }}
                onSaveFile={handleSaveFile}
                onCreateFolder={handleCreateFolder}
                onOpenModal={enqueueModal}
                onForceCloseWindow={() => forceCloseWindow(win.id)}
              />
            )}

            {win.appId === 'wordpad' && (
              <WordPadApp
                windowId={win.id}
                isActive={isActive}
                vfs={vfs}
                printers={system.printers}
                initialFileId={win.payload?.fileId}
                defaultFolderId={userDocsId}
                registerCloseGuard={(id, guard) => {
                  closeGuardsRef.current[id] = guard;
                }}
                onTitleChange={updateTitle}
                onSaveFile={handleSaveFile}
                onCreateFolder={handleCreateFolder}
                onSubmitPrintJob={handleSubmitPrintJob}
                onOpenModal={enqueueModal}
                onForceCloseWindow={() => forceCloseWindow(win.id)}
              />
            )}

            {win.appId === 'paint' && (
              <PaintApp
                windowId={win.id}
                vfs={vfs}
                initialFileId={win.payload?.fileId}
                defaultFolderId={userPicsId}
                registerCloseGuard={(id, guard) => {
                  closeGuardsRef.current[id] = guard;
                }}
                onTitleChange={updateTitle}
                onSaveFile={handleSaveFile}
                onCreateFolder={handleCreateFolder}
                onOpenModal={enqueueModal}
                onForceCloseWindow={() => forceCloseWindow(win.id)}
              />
            )}

            {win.appId === 'imageviewer' && (
              <ImageViewerApp
                vfs={vfs}
                fileId={win.payload?.fileId}
                onTitleChange={updateTitle}
                onOpenInPaint={(fileId) => {
                  forceCloseWindow(win.id);
                  launchApp('paint', { fileId });
                }}
                onPrintPhoto={(fileId) => launchApp('photoprint', { initialNodeIds: [fileId] })}
                onDeleteNode={handleDeleteNode}
              />
            )}

            {win.appId === 'calculator' && (
              <CalculatorApp windowId={win.id} isActive={isActive} onOpenModal={enqueueModal} />
            )}

            {win.appId === 'charmap' && <CharacterMapApp system={system} />}
            {win.appId === 'wab' && <AddressBookApp system={system} onUpdateSystem={updateSystem} />}
            {win.appId === 'cmd' && (
              <CommandPromptApp
                windowId={win.id}
                isActive={isActive}
                vfs={vfs}
                system={system}
                onCommitVfs={commitVfs}
                onCloseWindow={() => forceCloseWindow(win.id)}
              />
            )}
            {win.appId === 'wiaacmgr' && (
              <ScannerCameraWizardApp
                system={system}
                onImportImage={(parentId, name, dataUrl) =>
                  handleSaveFile({
                    parentId,
                    name,
                    content: dataUrl,
                    kind: 'image',
                    mimeType: 'image/png',
                    allowOverwrite: true,
                  })
                }
                onClose={() => forceCloseWindow(win.id)}
              />
            )}
            {win.appId === 'photoprint' && (
              <PhotoPrintingWizardApp
                vfs={vfs}
                printers={system.printers}
                initialNodeIds={win.payload?.initialNodeIds}
                onSubmitPrintJob={handleSubmitPrintJob}
                onClose={() => forceCloseWindow(win.id)}
              />
            )}
            {win.appId === 'compatwizard' && (
              <ProgramCompatibilityWizardApp
                system={system}
                onUpdateSystem={updateSystem}
                onLaunchApp={(id) => launchApp(id)}
                onClose={() => forceCloseWindow(win.id)}
              />
            )}
            {win.appId === 'mobsync' && (
              <SynchronizeApp
                system={system}
                onUpdateSystem={updateSystem}
                onClose={() => forceCloseWindow(win.id)}
              />
            )}
            {win.appId === 'cdburn' && (
              <CdWritingWizardApp
                vfs={vfs}
                system={system}
                onUpdateSystem={updateSystem}
                onClose={() => forceCloseWindow(win.id)}
              />
            )}

            {/* Internet & Communications */}
            {win.appId === 'iexplore' && (
              <InternetExplorerApp
                windowId={win.id}
                system={system}
                initialUrl={win.payload?.initialUrl}
                onUpdateSystem={updateSystem}
                onLaunchApp={launchApp}
                onTitleChange={updateTitle}
                onOpenModal={enqueueModal}
                onCloseWindow={() => forceCloseWindow(win.id)}
              />
            )}
            {win.appId === 'msnexplorer' && (
              <MsnExplorerApp
                system={system}
                onLaunchApp={(id) => launchApp(id)}
                onTitleChange={updateTitle}
              />
            )}
            {win.appId === 'outlook' && (
              <OutlookExpressApp
                windowId={win.id}
                vfs={vfs}
                system={system}
                onUpdateSystem={updateSystem}
                onOpenVfsNode={(node) => openVfsFile(node)}
                onLaunchApp={launchApp}
                onCreateFolder={handleCreateFolder}
                onTitleChange={updateTitle}
                onOpenModal={enqueueModal}
                onCloseWindow={() => forceCloseWindow(win.id)}
              />
            )}
            {win.appId === 'messenger' && (
              <WindowsMessengerApp
                system={system}
                onUpdateSystem={updateSystem}
                onTitleChange={updateTitle}
              />
            )}
            {win.appId === 'mstsc' && (
              <RemoteDesktopConnectionDialog
                defaultUsername={system.activeUsername}
                onConnect={(host, username) => {
                  setRemoteTarget({ host, username });
                  forceCloseWindow(win.id);
                  setSessionPhase('remote_desktop');
                }}
                onClose={() => forceCloseWindow(win.id)}
              />
            )}
            {win.appId === 'msra' && <RemoteAssistanceApp username={system.activeUsername} />}
            {win.appId === 'ncpa' && (
              <NetworkConnectionsApp
                system={system}
                onUpdateSystem={updateSystem}
                onLaunchApp={(id) => launchApp(id)}
              />
            )}
            {win.appId === 'newconn' && (
              <NewConnectionWizardApp
                onUpdateSystem={updateSystem}
                onClose={() => forceCloseWindow(win.id)}
              />
            )}
            {win.appId === 'netsetup' && (
              <NetworkSetupWizardApp
                system={system}
                onUpdateSystem={updateSystem}
                onClose={() => forceCloseWindow(win.id)}
              />
            )}
            {win.appId === 'wirelesssetup' && (
              <WirelessSetupWizardApp
                onUpdateSystem={updateSystem}
                onClose={() => forceCloseWindow(win.id)}
              />
            )}
            {win.appId === 'hypertrm' && <HyperTerminalApp />}
            {win.appId === 'dialer' && <PhoneDialerApp />}
            {win.appId === 'fax' && (
              <FaxConsoleApp
                system={system}
                onUpdateSystem={updateSystem}
                onOpenModal={enqueueModal}
              />
            )}

            {/* Multimedia */}
            {win.appId === 'wmplayer' && (
              <MediaPlayerApp
                windowId={win.id}
                vfs={vfs}
                system={system}
                initialFileId={win.payload?.fileId}
                onTitleChange={updateTitle}
                onOpenModal={enqueueModal}
              />
            )}
            {win.appId === 'moviemaker' && (
              <MovieMakerApp
                windowId={win.id}
                vfs={vfs}
                system={system}
                initialFileId={win.payload?.fileId}
                onSaveFile={handleSaveFile}
                onCreateFolder={handleCreateFolder}
                onTitleChange={updateTitle}
                onOpenModal={enqueueModal}
              />
            )}
            {win.appId === 'sndrec32' && (
              <SoundRecorderApp
                windowId={win.id}
                vfs={vfs}
                system={system}
                onSaveFile={handleSaveFile}
                onCreateFolder={handleCreateFolder}
                onOpenModal={enqueueModal}
              />
            )}
            {win.appId === 'sndvol32' && (
              <VolumeControlApp system={system} onUpdateSystem={updateSystem} />
            )}

            {/* Games */}
            {win.appId === 'solitaire' && (
              <SolitaireApp
                system={system}
                onUpdateSystem={updateSystem}
                onOpenModal={enqueueModal}
              />
            )}
            {win.appId === 'spider' && (
              <SpiderSolitaireApp
                system={system}
                onUpdateSystem={updateSystem}
              />
            )}
            {win.appId === 'freecell' && (
              <FreeCellApp system={system} onUpdateSystem={updateSystem} />
            )}
            {win.appId === 'hearts' && (
              <HeartsApp system={system} onUpdateSystem={updateSystem} />
            )}
            {win.appId === 'minesweeper' && (
              <MinesweeperApp system={system} onUpdateSystem={updateSystem} />
            )}
            {win.appId === 'pinball' && (
              <PinballApp system={system} onUpdateSystem={updateSystem} />
            )}
            {(win.appId === 'zone_backgammon' ||
              win.appId === 'zone_checkers' ||
              win.appId === 'zone_hearts' ||
              win.appId === 'zone_reversi' ||
              win.appId === 'zone_spades') && (
              <ZoneBoardGameApp
                appId={win.appId}
                system={system}
                onUpdateSystem={updateSystem}
              />
            )}

            {/* Accessibility */}
            {win.appId === 'accwiz' && (
              <AccessibilityWizardApp
                system={system}
                onUpdateSystem={updateSystem}
                onClose={() => forceCloseWindow(win.id)}
              />
            )}
            {win.appId === 'access_opts' && (
              <AccessibilityOptionsDialog
                system={system}
                onUpdateSystem={updateSystem}
                onClose={() => forceCloseWindow(win.id)}
              />
            )}
            {win.appId === 'magnify' && (
              <MagnifierControlApp
                system={system}
                magnifierOpen={magnifierOpen}
                onSetMagnifierOpen={setMagnifierOpen}
                onUpdateSystem={updateSystem}
              />
            )}
            {win.appId === 'narrator' && (
              <NarratorApp system={system} onUpdateSystem={updateSystem} />
            )}
            {win.appId === 'osk' && <OnScreenKeyboardApp onInjectKey={handleInjectKey} />}
            {win.appId === 'utilman' && (
              <UtilityManagerApp
                magnifierOpen={magnifierOpen}
                onSetMagnifierOpen={setMagnifierOpen}
                system={system}
                onLaunchApp={(id) => launchApp(id)}
                onUpdateSystem={updateSystem}
              />
            )}

            {/* Control Panel & Applets */}
            {win.appId === 'control' && (
              <ControlPanelApp
                system={system}
                onUpdateSystem={updateSystem}
                onLaunchApp={launchApp}
              />
            )}
            {win.appId === 'display' && (
              <DisplayPropertiesDialog
                committedAppearance={activeAppearance}
                onApply={(prefs) => {
                  saveAppearancePrefs(prefs);
                  updateSystem((prev) => ({
                    ...prev,
                    users: prev.users.map((u) =>
                      u.username === prev.activeUsername ? { ...u, appearance: prefs } : u
                    ),
                  }));
                }}
                onClose={() => forceCloseWindow(win.id)}
              />
            )}
            {win.appId === 'appwiz' && (
              <AddRemoveProgramsApp
                system={system}
                onUpdateSystem={updateSystem}
                onLaunchApp={(id) => launchApp(id)}
              />
            )}
            {win.appId === 'wincomp' && (
              <WindowsComponentsWizardApp
                system={system}
                onUpdateSystem={updateSystem}
                onClose={() => forceCloseWindow(win.id)}
              />
            )}
            {win.appId === 'sysdm' && (
              <SystemPropertiesDialog
                system={system}
                onUpdateSystem={updateSystem}
                onLaunchApp={(id) => launchApp(id)}
                onClose={() => forceCloseWindow(win.id)}
              />
            )}
            {win.appId === 'timedate' && (
              <DateTimeDialog
                system={system}
                onUpdateSystem={updateSystem}
                onClose={() => forceCloseWindow(win.id)}
              />
            )}
            {win.appId === 'intl' && (
              <RegionalOptionsDialog
                system={system}
                onUpdateSystem={updateSystem}
                onClose={() => forceCloseWindow(win.id)}
              />
            )}
            {win.appId === 'nusrmgr' && (
              <UserAccountsApp
                system={system}
                onCreateUser={handleCreateUser}
                onDeleteUser={handleDeleteUser}
                onSwitchUser={handleSwitchUser}
                onOpenModal={enqueueModal}
              />
            )}
            {win.appId === 'taskbar_opts' && (
              <TaskbarPropertiesDialog
                system={system}
                onUpdateSystem={updateSystem}
                onClose={() => forceCloseWindow(win.id)}
              />
            )}
            {win.appId === 'folder_opts' && (
              <FolderOptionsDialog
                system={system}
                onUpdateSystem={updateSystem}
                onClose={() => forceCloseWindow(win.id)}
              />
            )}
            {win.appId === 'fonts' && <FontsFolderApp system={system} />}
            {win.appId === 'mouse_opts' && (
              <MouseOptionsDialog
                system={system}
                onUpdateSystem={updateSystem}
                onClose={() => forceCloseWindow(win.id)}
              />
            )}
            {win.appId === 'keyboard_opts' && (
              <KeyboardOptionsDialog
                system={system}
                onUpdateSystem={updateSystem}
                onClose={() => forceCloseWindow(win.id)}
              />
            )}
            {win.appId === 'game_opts' && (
              <GameControllersDialog onClose={() => forceCloseWindow(win.id)} />
            )}
            {win.appId === 'sounds_opts' && (
              <SoundsAudioOptionsDialog
                system={system}
                onUpdateSystem={updateSystem}
                onLaunchApp={(id) => launchApp(id)}
                onClose={() => forceCloseWindow(win.id)}
              />
            )}
            {win.appId === 'speech_opts' && (
              <SpeechPropertiesDialog onClose={() => forceCloseWindow(win.id)} />
            )}
            {win.appId === 'power_opts' && (
              <PowerOptionsDialog
                system={system}
                onUpdateSystem={updateSystem}
                onClose={() => forceCloseWindow(win.id)}
              />
            )}
            {win.appId === 'inet_opts' && (
              <InternetOptionsDialog
                system={system}
                onUpdateSystem={updateSystem}
                onClose={() => forceCloseWindow(win.id)}
              />
            )}
            {win.appId === 'printers' && (
              <PrintersAndFaxesApp
                system={system}
                onUpdateSystem={updateSystem}
                onLaunchApp={(id) => launchApp(id)}
              />
            )}
            {win.appId === 'scanners' && (
              <ScannersAndCamerasDialog
                onLaunchApp={(id) => launchApp(id)}
                onClose={() => forceCloseWindow(win.id)}
              />
            )}
            {win.appId === 'telephon' && (
              <PhoneModemOptionsDialog onClose={() => forceCloseWindow(win.id)} />
            )}
            {win.appId === 'add_hardware' && (
              <AddHardwareWizardApp system={system} onClose={() => forceCloseWindow(win.id)} />
            )}
            {win.appId === 'security_center' && (
              <SecurityCenterApp system={system} onLaunchApp={(id) => launchApp(id)} />
            )}
            {win.appId === 'firewall' && (
              <WindowsFirewallDialog
                system={system}
                onUpdateSystem={updateSystem}
                onClose={() => forceCloseWindow(win.id)}
              />
            )}
            {win.appId === 'auto_updates' && (
              <AutomaticUpdatesDialog
                system={system}
                onUpdateSystem={updateSystem}
                onClose={() => forceCloseWindow(win.id)}
              />
            )}
            {win.appId === 'admin_tools' && (
              <AdministrativeToolsFolderApp system={system} onLaunchApp={(id) => launchApp(id)} />
            )}

            {/* System Diagnostics & Maintenance */}
            {win.appId === 'msinfo32' && <SystemInfoApp system={system} vfs={vfs} />}
            {win.appId === 'dxdiag' && (
              <DxDiagApp system={system} onClose={() => forceCloseWindow(win.id)} />
            )}
            {win.appId === 'cleanmgr' && (
              <DiskCleanupApp
                vfs={vfs}
                onCommitVfs={commitVfs}
                onUpdateSystem={updateSystem}
                onClose={() => forceCloseWindow(win.id)}
              />
            )}
            {win.appId === 'dfrg' && (
              <DiskDefragApp system={system} onUpdateSystem={updateSystem} />
            )}
            {win.appId === 'chkdsk' && (
              <CheckDiskApp vfs={vfs} onClose={() => forceCloseWindow(win.id)} />
            )}
            {win.appId === 'rstrui' && (
              <SystemRestoreApp
                system={system}
                onUpdateSystem={updateSystem}
                onSyncAppearance={(prefs) => saveAppearancePrefs(prefs)}
                onOpenModal={enqueueModal}
              />
            )}
            {win.appId === 'ntbackup' && (
              <BackupUtilityApp
                vfs={vfs}
                system={system}
                onSaveFile={handleSaveFile}
                onUpdateSystem={updateSystem}
                onOpenModal={enqueueModal}
              />
            )}
            {win.appId === 'migwiz' && (
              <TransferWizardApp system={system} onUpdateSystem={updateSystem} />
            )}
            {win.appId === 'schtasks' && (
              <ScheduledTasksApp
                system={system}
                onUpdateSystem={updateSystem}
                onLaunchApp={(id) => launchApp(id)}
              />
            )}
            {win.appId === 'taskmgr' && (
              <TaskManagerApp
                windows={windows}
                system={system}
                onFocusWindow={focusWindow}
                onEndTaskWindow={forceCloseWindow}
                onLaunchApp={(id) => launchApp(id)}
              />
            )}
            {win.appId === 'msconfig' && (
              <MsConfigApp
                system={system}
                onUpdateSystem={updateSystem}
                onClose={() => forceCloseWindow(win.id)}
              />
            )}
            {win.appId === 'regedit' && (
              <RegeditApp system={system} onUpdateSystem={updateSystem} />
            )}
            {win.appId === 'eudcedit' && (
              <EudcEditorApp system={system} onUpdateSystem={updateSystem} />
            )}
            {win.appId === 'iexpress' && (
              <IExpressWizardApp
                vfs={vfs}
                system={system}
                onSaveFile={handleSaveFile}
                onOpenModal={enqueueModal}
                onClose={() => forceCloseWindow(win.id)}
              />
            )}

            {/* MMC Administrative Consoles */}
            {(win.appId === 'compmgmt' ||
              win.appId === 'eventvwr' ||
              win.appId === 'services' ||
              win.appId === 'devmgmt' ||
              win.appId === 'diskmgmt' ||
              win.appId === 'fsmgmt' ||
              win.appId === 'lusrmgr' ||
              win.appId === 'perfmon' ||
              win.appId === 'dcomcnfg' ||
              win.appId === 'odbcad32' ||
              win.appId === 'secpol' ||
              win.appId === 'gpedit' ||
              win.appId === 'iis_mgr' ||
              win.appId === 'indexing_mgr') && (
              <MmcConsolesApp
                appId={win.appId}
                vfs={vfs}
                system={system}
                onUpdateSystem={updateSystem}
                onLaunchApp={launchApp}
                onTitleChange={updateTitle}
              />
            )}
          </XpWindow>
        );
      })}

      {/* Start Menu */}
      <StartMenu
        open={startMenuOpen}
        system={system}
        recentFiles={recentFiles}
        onClose={() => setStartMenuOpen(false)}
        onLaunchApp={launchApp}
        onOpenRecentFile={(node) => openVfsFile(node)}
        onLogOff={() =>
          enqueueModal({
            kind: 'confirm',
            icon: 'question',
            title: 'Log Off Windows',
            message: 'Are you sure you want to log off?',
            confirmLabel: 'Log Off',
            cancelLabel: 'Cancel',
            onConfirm: () => {
              bootSoundDoneRef.current = true;
              void xpAudio.playSystemSound(getSessionTransitionSound('log_off'));
              setSessionPhase('logged_off');
            },
          })
        }
        onTurnOff={() =>
          enqueueModal({
            kind: 'confirm',
            icon: 'warning',
            title: 'Turn Off Computer',
            message: 'Are you sure you want to turn off the computer?',
            confirmLabel: 'Turn Off',
            cancelLabel: 'Cancel',
            onConfirm: () => {
              bootSoundDoneRef.current = true;
              void xpAudio.playSystemSound(getSessionTransitionSound('shut_down'));
              setSessionPhase('shut_down');
            },
          })
        }
      />

      {/* Taskbar */}
      <Taskbar
        windows={windows}
        activeWindowId={activeWindowId}
        startMenuOpen={startMenuOpen}
        system={system}
        getAppIcon={(appId) =>
          appId === 'recyclebin'
            ? vfs.trash.length > 0
              ? 'recycle_bin_full'
              : 'recycle_bin_empty'
            : getAppIcon(appId)
        }
        onToggleStartMenu={() => {
          setContextMenu(null);
          setStartMenuOpen((o) => !o);
        }}
        onTaskButtonClick={handleTaskButtonClick}
        onLaunchApp={(appId) => launchApp(appId)}
        onShowDesktop={handleShowDesktop}
        onOpenContextMenu={(x, y, items) => setContextMenu({ x, y, items })}
      />

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenu.items}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Modal Dialog Queue */}
      {modals.map((modal, index) => (
        <XpModalDialog
          key={modal.id}
          modal={modal}
          zIndex={9900 + index * 2}
          onDismiss={() => {
            setModals((prev) => prev.filter((m) => m.id !== modal.id));
            if (modal.parentWindowId) {
              focusWindow(modal.parentWindowId);
            }
          }}
        />
      ))}
    </main>
  );
};
