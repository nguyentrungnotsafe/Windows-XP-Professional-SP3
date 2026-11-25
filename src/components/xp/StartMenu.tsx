import React, { useEffect, useRef, useState } from 'react';
import type { AppId, SystemState, VfsNode, WindowInstance } from '../../types/os';
import { SYSTEM_IDS } from '../../state/vfs';
import { APP_REGISTRY_MAP, isAppInstalled } from '../../state/appRegistry';
import { XpIcon, type XpIconName } from './XpIcons';
import { iconForVfsNode } from './XpDialog';

interface StartMenuProps {
  open: boolean;
  system: SystemState;
  recentFiles: VfsNode[];
  onClose: () => void;
  onLaunchApp: (appId: AppId, payload?: WindowInstance['payload']) => void;
  onOpenRecentFile: (node: VfsNode) => void;
  onLogOff: () => void;
  onTurnOff: () => void;
}

type SubmenuState =
  | 'none'
  | 'recent'
  | 'all_programs'
  | 'accessories'
  | 'accessibility'
  | 'communications'
  | 'entertainment'
  | 'system_tools'
  | 'games'
  | 'admin_tools'
  | 'startup';

export const StartMenu: React.FC<StartMenuProps> = ({
  open,
  system,
  recentFiles,
  onClose,
  onLaunchApp,
  onOpenRecentFile,
  onLogOff,
  onTurnOff,
}) => {
  const [submenu, setSubmenu] = useState<SubmenuState>('none');
  const menuRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<number | null>(null);

  const activeUser =
    system.users.find((u) => u.username === system.activeUsername) ?? system.users[0];
  const userDocsId = activeUser?.docsFolderId ?? SYSTEM_IDS.MY_DOCUMENTS;
  const userPicsId = activeUser?.picturesFolderId ?? SYSTEM_IDS.MY_PICTURES;
  const userMusicId = activeUser?.musicFolderId ?? SYSTEM_IDS.MY_MUSIC;

  useEffect(() => {
    if (!open) {
      setSubmenu('none');
      return;
    }

    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('button[aria-label="Start"]')) return;
      if (menuRef.current && !menuRef.current.contains(target)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        if (
          submenu === 'accessibility' ||
          submenu === 'communications' ||
          submenu === 'entertainment' ||
          submenu === 'system_tools'
        ) {
          setSubmenu('accessories');
        } else if (submenu !== 'none') {
          setSubmenu('none');
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('pointerdown', handlePointerDown, true);
    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown, true);
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [open, submenu, onClose]);

  if (!open) return null;

  const scheduleSubmenu = (next: SubmenuState, delay = 180) => {
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = window.setTimeout(() => setSubmenu(next), delay);
  };

  const keepSubmenuOpen = () => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const launch = (appId: AppId, payload?: WindowInstance['payload']) => {
    onClose();
    onLaunchApp(appId, payload);
  };

  const isInstalled = (id: AppId) => isAppInstalled(id, system.optionalComponents);

  const allLeftPrograms: Array<{
    id: string;
    label: string;
    sublabel?: string;
    icon: XpIconName;
    appId: AppId;
    pinned?: boolean;
  }> = [
    {
      id: 'ie',
      label: 'Internet',
      sublabel: 'Internet Explorer',
      icon: 'internet_explorer',
      appId: 'iexplore',
      pinned: true,
    },
    {
      id: 'oe',
      label: 'E-mail',
      sublabel: 'Outlook Express',
      icon: 'outlook_express',
      appId: 'outlook',
      pinned: true,
    },
    {
      id: 'notepad',
      label: 'Notepad',
      icon: 'notepad',
      appId: 'notepad',
    },
    {
      id: 'paint',
      label: 'Paint',
      icon: 'paint',
      appId: 'paint',
    },
    {
      id: 'wmplayer',
      label: 'Windows Media Player',
      icon: 'wmp',
      appId: 'wmplayer',
    },
    {
      id: 'messenger',
      label: 'Windows Messenger',
      icon: 'messenger',
      appId: 'messenger',
    },
    {
      id: 'cmd',
      label: 'Command Prompt',
      icon: 'cmd',
      appId: 'cmd',
    },
    {
      id: 'tour',
      label: 'Tour Windows XP',
      icon: 'tour',
      appId: 'tour',
    },
  ];
  const leftPrograms = allLeftPrograms.filter((item) => isInstalled(item.appId));

  const renderAppRow = (appId: AppId, labelOverride?: string, payload?: WindowInstance['payload']) => {
    if (!isInstalled(appId)) return null;
    const meta = APP_REGISTRY_MAP[appId];
    return (
      <button
        key={appId}
        type="button"
        role="menuitem"
        onClick={() => launch(appId, payload)}
        className="w-full px-2 py-1 flex items-center gap-2 text-[11px] text-[#000000] hover:bg-[#316ac5] hover:text-[#ffffff] focus-visible:bg-[#316ac5] focus-visible:text-[#ffffff] focus:outline-none cursor-default text-left"
      >
        <XpIcon name={meta.iconName} size={16} />
        <span className="truncate">{labelOverride ?? meta.displayName}</span>
      </button>
    );
  };

  const inAllProgramsTree =
    submenu === 'all_programs' ||
    submenu === 'accessories' ||
    submenu === 'accessibility' ||
    submenu === 'communications' ||
    submenu === 'entertainment' ||
    submenu === 'system_tools' ||
    submenu === 'games' ||
    submenu === 'admin_tools' ||
    submenu === 'startup';

  const inAccessoriesTree =
    submenu === 'accessories' ||
    submenu === 'accessibility' ||
    submenu === 'communications' ||
    submenu === 'entertainment' ||
    submenu === 'system_tools';

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label="Start menu"
      className="fixed bottom-[30px] left-0 z-[9500] w-[min(392px,calc(100vw-8px))] max-h-[calc(100vh-38px)] flex flex-col rounded-t-[8px] border border-[#0b3e9c] shadow-[3px_-2px_12px_rgba(0,0,0,0.42)] bg-[#1f62d6] overflow-visible"
    >
      {/* Top User Header */}
      <div className="h-[54px] shrink-0 px-2.5 flex items-center gap-2.5 rounded-t-[7px] bg-gradient-to-b from-[#4089ec] via-[#2262d3] to-[#1a55c6] border-b border-[#0e3f9c] shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]">
        <div className="w-[42px] h-[42px] rounded-[4px] border-2 border-[#d4e3f9] shadow overflow-hidden bg-[#5c2512] shrink-0">
          <XpIcon name="user_avatar" size={38} />
        </div>
        <span
          className="text-[14px] font-bold text-[#ffffff] truncate"
          style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.65)' }}
        >
          {system.activeUsername}
        </span>
      </div>

      {/* Orange accent divider */}
      <div className="h-[2px] shrink-0 bg-gradient-to-r from-[#f2b25c] via-[#f88c24] to-transparent" />

      {/* Two-column body */}
      <div className="flex flex-1 min-h-0 overflow-y-auto bg-[#ffffff] border-x border-[#3c7fe8]">
        {/* Left white column */}
        <div className="w-[51%] bg-[#ffffff] p-1.5 flex flex-col justify-between border-r border-[#9cbde8]">
          <div className="flex flex-col gap-0.5">
            {leftPrograms.map((item, idx) => (
              <React.Fragment key={item.id}>
                {idx === 2 && <div className="my-1 mx-2 border-t border-[#d6d6d6]" />}
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => launch(item.appId)}
                  onMouseEnter={() => scheduleSubmenu('none', 120)}
                  className="w-full px-1.5 py-1.5 flex items-center gap-2 text-left rounded-[2px] cursor-default hover:bg-[#316ac5] hover:text-[#ffffff] focus-visible:bg-[#316ac5] focus-visible:text-[#ffffff] focus:outline-none group"
                >
                  <XpIcon name={item.icon} size={24} />
                  <div className="min-w-0 leading-tight">
                    <div className={`text-[11px] truncate ${item.pinned ? 'font-bold' : ''}`}>
                      {item.label}
                    </div>
                    {item.sublabel && (
                      <div className="text-[10px] text-[#666666] group-hover:text-[#dce9ff] group-focus-visible:text-[#dce9ff] truncate">
                        {item.sublabel}
                      </div>
                    )}
                  </div>
                </button>
              </React.Fragment>
            ))}
          </div>

          <div className="pt-1">
            <div className="my-1 mx-2 border-t border-[#d6d6d6]" />
            <div
              className="relative"
              onMouseEnter={() => {
                keepSubmenuOpen();
                setSubmenu((prev) => (inAllProgramsTree ? prev : 'all_programs'));
              }}
              onMouseLeave={() => scheduleSubmenu('none', 260)}
            >
              <button
                type="button"
                role="menuitem"
                aria-haspopup="menu"
                aria-expanded={inAllProgramsTree}
                onClick={() => setSubmenu((prev) => (inAllProgramsTree ? 'none' : 'all_programs'))}
                className={`w-full px-2 py-1.5 flex items-center justify-center gap-2 font-bold text-[11px] rounded-[2px] cursor-default focus:outline-none ${
                  inAllProgramsTree
                    ? 'bg-[#316ac5] text-[#ffffff]'
                    : 'text-[#000000] hover:bg-[#316ac5] hover:text-[#ffffff] focus-visible:bg-[#316ac5] focus-visible:text-[#ffffff]'
                }`}
              >
                <span>All Programs</span>
                <svg viewBox="0 0 12 12" className="w-3.5 h-3.5 shrink-0" aria-hidden="true">
                  <circle cx="6" cy="6" r="5.5" fill="#3fa13b" stroke="#ffffff" strokeWidth="0.8" />
                  <polygon points="4.5,3.5 8.5,6 4.5,8.5" fill="#ffffff" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Right pale-blue column */}
        <div className="w-[49%] bg-[#d3e5fa] p-1.5 flex flex-col gap-0.5 text-[#00136b]">
          <button
            type="button"
            role="menuitem"
            onClick={() => launch('explorer', { folderId: userDocsId })}
            onMouseEnter={() => scheduleSubmenu('none', 120)}
            className="w-full px-1.5 py-1 flex items-center gap-2 text-left font-bold text-[11px] rounded-[2px] cursor-default hover:bg-[#316ac5] hover:text-[#ffffff] focus-visible:bg-[#316ac5] focus-visible:text-[#ffffff] focus:outline-none"
          >
            <XpIcon name="my_documents" size={20} />
            <span className="truncate">My Documents</span>
          </button>

          <div
            className="relative"
            onMouseEnter={() => {
              keepSubmenuOpen();
              setSubmenu('recent');
            }}
            onMouseLeave={() => scheduleSubmenu('none', 260)}
          >
            <button
              type="button"
              role="menuitem"
              aria-haspopup="menu"
              aria-expanded={submenu === 'recent'}
              onClick={() => setSubmenu((prev) => (prev === 'recent' ? 'none' : 'recent'))}
              className={`w-full px-1.5 py-1 flex items-center justify-between gap-1 text-left font-bold text-[11px] rounded-[2px] cursor-default focus:outline-none ${
                submenu === 'recent'
                  ? 'bg-[#316ac5] text-[#ffffff]'
                  : 'hover:bg-[#316ac5] hover:text-[#ffffff] focus-visible:bg-[#316ac5] focus-visible:text-[#ffffff]'
              }`}
            >
              <span className="flex items-center gap-2 min-w-0">
                <XpIcon name="text_file" size={20} />
                <span className="truncate">My Recent Documents</span>
              </span>
              <span aria-hidden="true" className="text-[9px]">▶</span>
            </button>
          </div>

          <button
            type="button"
            role="menuitem"
            onClick={() => launch('explorer', { folderId: userPicsId })}
            onMouseEnter={() => scheduleSubmenu('none', 120)}
            className="w-full px-1.5 py-1 flex items-center gap-2 text-left font-bold text-[11px] rounded-[2px] cursor-default hover:bg-[#316ac5] hover:text-[#ffffff] focus-visible:bg-[#316ac5] focus-visible:text-[#ffffff] focus:outline-none"
          >
            <XpIcon name="my_pictures" size={20} />
            <span className="truncate">My Pictures</span>
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={() => launch('explorer', { folderId: userMusicId })}
            onMouseEnter={() => scheduleSubmenu('none', 120)}
            className="w-full px-1.5 py-1 flex items-center gap-2 text-left font-bold text-[11px] rounded-[2px] cursor-default hover:bg-[#316ac5] hover:text-[#ffffff] focus-visible:bg-[#316ac5] focus-visible:text-[#ffffff] focus:outline-none"
          >
            <XpIcon name="my_music" size={20} />
            <span className="truncate">My Music</span>
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={() => launch('explorer', { folderId: SYSTEM_IDS.MY_COMPUTER })}
            onMouseEnter={() => scheduleSubmenu('none', 120)}
            className="w-full px-1.5 py-1 flex items-center gap-2 text-left font-bold text-[11px] rounded-[2px] cursor-default hover:bg-[#316ac5] hover:text-[#ffffff] focus-visible:bg-[#316ac5] focus-visible:text-[#ffffff] focus:outline-none"
          >
            <XpIcon name="my_computer" size={20} />
            <span className="truncate">My Computer</span>
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={() => launch('explorer', { folderId: SYSTEM_IDS.MY_NETWORK_PLACES })}
            onMouseEnter={() => scheduleSubmenu('none', 120)}
            className="w-full px-1.5 py-1 flex items-center gap-2 text-left font-bold text-[11px] rounded-[2px] cursor-default hover:bg-[#316ac5] hover:text-[#ffffff] focus-visible:bg-[#316ac5] focus-visible:text-[#ffffff] focus:outline-none"
          >
            <XpIcon name="network" size={20} />
            <span className="truncate">My Network Places</span>
          </button>

          <div className="my-1 mx-1.5 border-t border-[#9fbfe8]" />

          <button
            type="button"
            role="menuitem"
            onClick={() => launch('control')}
            onMouseEnter={() => scheduleSubmenu('none', 120)}
            className="w-full px-1.5 py-1 flex items-center gap-2 text-left text-[11px] rounded-[2px] cursor-default hover:bg-[#316ac5] hover:text-[#ffffff] focus-visible:bg-[#316ac5] focus-visible:text-[#ffffff] focus:outline-none"
          >
            <XpIcon name="control_panel" size={20} />
            <span className="truncate">Control Panel</span>
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={() => launch('printers')}
            onMouseEnter={() => scheduleSubmenu('none', 120)}
            className="w-full px-1.5 py-1 flex items-center gap-2 text-left text-[11px] rounded-[2px] cursor-default hover:bg-[#316ac5] hover:text-[#ffffff] focus-visible:bg-[#316ac5] focus-visible:text-[#ffffff] focus:outline-none"
          >
            <XpIcon name="printer" size={20} />
            <span className="truncate">Printers and Faxes</span>
          </button>

          <div className="my-1 mx-1.5 border-t border-[#9fbfe8]" />

          <button
            type="button"
            role="menuitem"
            onClick={() => launch('help')}
            onMouseEnter={() => scheduleSubmenu('none', 120)}
            className="w-full px-1.5 py-1 flex items-center gap-2 text-left text-[11px] rounded-[2px] cursor-default hover:bg-[#316ac5] hover:text-[#ffffff] focus-visible:bg-[#316ac5] focus-visible:text-[#ffffff] focus:outline-none"
          >
            <XpIcon name="help" size={20} />
            <span className="truncate">Help and Support</span>
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={() => launch('search', { folderId: userDocsId, initialTab: 'search' })}
            onMouseEnter={() => scheduleSubmenu('none', 120)}
            className="w-full px-1.5 py-1 flex items-center gap-2 text-left text-[11px] rounded-[2px] cursor-default hover:bg-[#316ac5] hover:text-[#ffffff] focus-visible:bg-[#316ac5] focus-visible:text-[#ffffff] focus:outline-none"
          >
            <XpIcon name="search" size={20} />
            <span className="truncate">Search</span>
          </button>

          {!system.groupPolicy.hideRunFromStart && (
            <button
              type="button"
              role="menuitem"
              onClick={() => launch('run')}
              onMouseEnter={() => scheduleSubmenu('none', 120)}
              className="w-full px-1.5 py-1 flex items-center gap-2 text-left text-[11px] rounded-[2px] cursor-default hover:bg-[#316ac5] hover:text-[#ffffff] focus-visible:bg-[#316ac5] focus-visible:text-[#ffffff] focus:outline-none"
            >
              <XpIcon name="run" size={20} />
              <span className="truncate">Run...</span>
            </button>
          )}
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="h-[38px] shrink-0 px-3 flex items-center justify-end gap-3 bg-gradient-to-b from-[#3d86ea] via-[#2667d4] to-[#1a4eb8] border-t border-[#1444a1]">
        <button
          type="button"
          role="menuitem"
          onClick={() => {
            onClose();
            onLogOff();
          }}
          className="flex items-center gap-1.5 px-2 py-1 rounded-[3px] text-[11px] text-[#ffffff] hover:bg-[#3a7ef0] focus-visible:outline focus-visible:outline-1 focus-visible:outline-white cursor-default"
        >
          <XpIcon name="log_off" size={20} />
          <span>Log Off</span>
        </button>
        <button
          type="button"
          role="menuitem"
          onClick={() => {
            onClose();
            onTurnOff();
          }}
          className="flex items-center gap-1.5 px-2 py-1 rounded-[3px] text-[11px] text-[#ffffff] hover:bg-[#3a7ef0] focus-visible:outline focus-visible:outline-1 focus-visible:outline-white cursor-default"
        >
          <XpIcon name="turn_off" size={20} />
          <span>Turn Off Computer</span>
        </button>
      </div>

      {/* Cascading All Programs Submenu */}
      {inAllProgramsTree && (
        <div
          role="menu"
          aria-label="All Programs"
          onMouseEnter={keepSubmenuOpen}
          onMouseLeave={() => scheduleSubmenu('none', 260)}
          className="fixed sm:absolute bottom-[38px] left-2 sm:left-[48%] w-[212px] max-h-[calc(100vh-80px)] overflow-y-auto bg-[#ffffff] border border-[#aca899] shadow-[3px_3px_6px_rgba(0,0,0,0.32)] py-1 px-0.5 z-[9600]"
        >
          {renderAppRow('appwiz', 'Set Program Access and Defaults')}
          {renderAppRow('wupdmgr', 'Windows Update')}
          <div className="my-1 mx-2 border-t border-[#d6d6d6]" />

          {/* Accessories Folder */}
          <button
            type="button"
            role="menuitem"
            aria-haspopup="menu"
            aria-expanded={inAccessoriesTree}
            onMouseEnter={() => {
              keepSubmenuOpen();
              setSubmenu('accessories');
            }}
            onClick={() => setSubmenu('accessories')}
            className={`w-full px-2 py-1 flex items-center justify-between text-[11px] cursor-default ${
              inAccessoriesTree ? 'bg-[#316ac5] text-white' : 'text-black hover:bg-[#316ac5] hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2">
              <XpIcon name="folder" size={16} />
              <span>Accessories</span>
            </span>
            <span className="text-[9px]">▶</span>
          </button>

          {/* Games Folder */}
          <button
            type="button"
            role="menuitem"
            aria-haspopup="menu"
            aria-expanded={submenu === 'games'}
            onMouseEnter={() => {
              keepSubmenuOpen();
              setSubmenu('games');
            }}
            onClick={() => setSubmenu('games')}
            className={`w-full px-2 py-1 flex items-center justify-between text-[11px] cursor-default ${
              submenu === 'games' ? 'bg-[#316ac5] text-white' : 'text-black hover:bg-[#316ac5] hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2">
              <XpIcon name="folder" size={16} />
              <span>Games</span>
            </span>
            <span className="text-[9px]">▶</span>
          </button>

          {/* Administrative Tools Folder */}
          <button
            type="button"
            role="menuitem"
            aria-haspopup="menu"
            aria-expanded={submenu === 'admin_tools'}
            onMouseEnter={() => {
              keepSubmenuOpen();
              setSubmenu('admin_tools');
            }}
            onClick={() => setSubmenu('admin_tools')}
            className={`w-full px-2 py-1 flex items-center justify-between text-[11px] cursor-default ${
              submenu === 'admin_tools'
                ? 'bg-[#316ac5] text-white'
                : 'text-black hover:bg-[#316ac5] hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2">
              <XpIcon name="folder" size={16} />
              <span>Administrative Tools</span>
            </span>
            <span className="text-[9px]">▶</span>
          </button>

          {/* Startup Folder */}
          <button
            type="button"
            role="menuitem"
            aria-haspopup="menu"
            aria-expanded={submenu === 'startup'}
            onMouseEnter={() => {
              keepSubmenuOpen();
              setSubmenu('startup');
            }}
            onClick={() => setSubmenu('startup')}
            className={`w-full px-2 py-1 flex items-center justify-between text-[11px] cursor-default ${
              submenu === 'startup' ? 'bg-[#316ac5] text-white' : 'text-black hover:bg-[#316ac5] hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2">
              <XpIcon name="folder" size={16} />
              <span>Startup</span>
            </span>
            <span className="text-[9px]">▶</span>
          </button>

          <div className="my-1 mx-2 border-t border-[#d6d6d6]" />
          {renderAppRow('iexplore')}
          {renderAppRow('msnexplorer')}
          {renderAppRow('outlook')}
          {renderAppRow('msra')}
          {renderAppRow('messenger')}
          {renderAppRow('wmplayer')}
          {renderAppRow('moviemaker')}
        </div>
      )}

      {/* Accessories Submenu */}
      {inAccessoriesTree && (
        <div
          role="menu"
          aria-label="Accessories"
          onMouseEnter={keepSubmenuOpen}
          onMouseLeave={() => scheduleSubmenu('none', 260)}
          className="fixed sm:absolute bottom-[68px] right-2 sm:right-auto sm:left-[calc(48%+210px)] w-[210px] bg-[#ffffff] border border-[#aca899] shadow-[3px_3px_6px_rgba(0,0,0,0.32)] py-1 px-0.5 z-[9700]"
        >
          {(
            [
              ['accessibility', 'Accessibility'],
              ['communications', 'Communications'],
              ['entertainment', 'Entertainment'],
              ['system_tools', 'System Tools'],
            ] as Array<[SubmenuState, string]>
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="menuitem"
              aria-haspopup="menu"
              aria-expanded={submenu === key}
              onMouseEnter={() => {
                keepSubmenuOpen();
                setSubmenu(key);
              }}
              onClick={() => setSubmenu(key)}
              className={`w-full px-2 py-1 flex items-center justify-between text-[11px] cursor-default ${
                submenu === key ? 'bg-[#316ac5] text-white' : 'text-black hover:bg-[#316ac5] hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2">
                <XpIcon name="folder" size={16} />
                <span>{label}</span>
              </span>
              <span className="text-[9px]">▶</span>
            </button>
          ))}
          <div className="my-1 mx-2 border-t border-[#d6d6d6]" />
          {renderAppRow('wab')}
          {renderAppRow('calculator')}
          {renderAppRow('cmd')}
          {renderAppRow('notepad')}
          {renderAppRow('paint')}
          {renderAppRow('compatwizard')}
          {renderAppRow('wiaacmgr')}
          {renderAppRow('mobsync')}
          {renderAppRow('tour')}
          {renderAppRow('explorer', 'Windows Explorer', { folderId: userDocsId })}
          {renderAppRow('wordpad')}
        </div>
      )}

      {/* Nested Accessories Sub-folders */}
      {submenu === 'accessibility' && (
        <div
          role="menu"
          aria-label="Accessibility"
          onMouseEnter={keepSubmenuOpen}
          onMouseLeave={() => scheduleSubmenu('none', 260)}
          className="fixed sm:absolute bottom-[130px] right-2 sm:right-auto sm:left-[calc(48%+416px)] w-[190px] bg-[#ffffff] border border-[#aca899] shadow-[3px_3px_6px_rgba(0,0,0,0.32)] py-1 px-0.5 z-[9800]"
        >
          {renderAppRow('accwiz')}
          {renderAppRow('magnify')}
          {renderAppRow('narrator')}
          {renderAppRow('osk')}
          {renderAppRow('utilman')}
        </div>
      )}

      {submenu === 'communications' && (
        <div
          role="menu"
          aria-label="Communications"
          onMouseEnter={keepSubmenuOpen}
          onMouseLeave={() => scheduleSubmenu('none', 260)}
          className="fixed sm:absolute bottom-[110px] right-2 sm:right-auto sm:left-[calc(48%+416px)] w-[215px] bg-[#ffffff] border border-[#aca899] shadow-[3px_3px_6px_rgba(0,0,0,0.32)] py-1 px-0.5 z-[9800]"
        >
          {renderAppRow('hypertrm')}
          {renderAppRow('ncpa')}
          {renderAppRow('netsetup')}
          {renderAppRow('newconn')}
          {renderAppRow('mstsc')}
          {renderAppRow('wirelesssetup')}
          {renderAppRow('fax')}
          {renderAppRow('dialer')}
        </div>
      )}

      {submenu === 'entertainment' && (
        <div
          role="menu"
          aria-label="Entertainment"
          onMouseEnter={keepSubmenuOpen}
          onMouseLeave={() => scheduleSubmenu('none', 260)}
          className="fixed sm:absolute bottom-[110px] right-2 sm:right-auto sm:left-[calc(48%+416px)] w-[190px] bg-[#ffffff] border border-[#aca899] shadow-[3px_3px_6px_rgba(0,0,0,0.32)] py-1 px-0.5 z-[9800]"
        >
          {renderAppRow('sndrec32')}
          {renderAppRow('sndvol32')}
          {renderAppRow('wmplayer')}
        </div>
      )}

      {submenu === 'system_tools' && (
        <div
          role="menu"
          aria-label="System Tools"
          onMouseEnter={keepSubmenuOpen}
          onMouseLeave={() => scheduleSubmenu('none', 260)}
          className="fixed sm:absolute bottom-[70px] right-2 sm:right-auto sm:left-[calc(48%+416px)] w-[225px] bg-[#ffffff] border border-[#aca899] shadow-[3px_3px_6px_rgba(0,0,0,0.32)] py-1 px-0.5 z-[9800]"
        >
          {renderAppRow('ntbackup')}
          {renderAppRow('charmap')}
          {renderAppRow('cleanmgr')}
          {renderAppRow('dfrg')}
          {renderAppRow('migwiz')}
          {renderAppRow('schtasks')}
          {renderAppRow('msinfo32')}
          {renderAppRow('rstrui')}
          {renderAppRow('eudcedit')}
          {renderAppRow('iexpress')}
        </div>
      )}

      {submenu === 'games' && (
        <div
          role="menu"
          aria-label="Games"
          onMouseEnter={keepSubmenuOpen}
          onMouseLeave={() => scheduleSubmenu('none', 260)}
          className="fixed sm:absolute bottom-[68px] right-2 sm:right-auto sm:left-[calc(48%+210px)] w-[195px] bg-[#ffffff] border border-[#aca899] shadow-[3px_3px_6px_rgba(0,0,0,0.32)] py-1 px-0.5 z-[9700]"
        >
          {renderAppRow('freecell')}
          {renderAppRow('hearts')}
          {renderAppRow('zone_backgammon')}
          {renderAppRow('zone_checkers')}
          {renderAppRow('zone_hearts')}
          {renderAppRow('zone_reversi')}
          {renderAppRow('zone_spades')}
          {renderAppRow('minesweeper')}
          {renderAppRow('pinball')}
          {renderAppRow('solitaire')}
          {renderAppRow('spider')}
        </div>
      )}

      {submenu === 'admin_tools' && (
        <div
          role="menu"
          aria-label="Administrative Tools"
          onMouseEnter={keepSubmenuOpen}
          onMouseLeave={() => scheduleSubmenu('none', 260)}
          className="fixed sm:absolute bottom-[68px] right-2 sm:right-auto sm:left-[calc(48%+210px)] w-[210px] bg-[#ffffff] border border-[#aca899] shadow-[3px_3px_6px_rgba(0,0,0,0.32)] py-1 px-0.5 z-[9700]"
        >
          {renderAppRow('dcomcnfg')}
          {renderAppRow('compmgmt')}
          {renderAppRow('odbcad32')}
          {renderAppRow('eventvwr')}
          {renderAppRow('secpol')}
          {renderAppRow('perfmon')}
          {renderAppRow('services')}
          {renderAppRow('iis_mgr')}
          {renderAppRow('indexing_mgr')}
        </div>
      )}

      {submenu === 'startup' && (
        <div
          role="menu"
          aria-label="Startup"
          onMouseEnter={keepSubmenuOpen}
          onMouseLeave={() => scheduleSubmenu('none', 260)}
          className="fixed sm:absolute bottom-[68px] right-2 sm:right-auto sm:left-[calc(48%+210px)] w-[200px] bg-[#ffffff] border border-[#aca899] shadow-[3px_3px_6px_rgba(0,0,0,0.32)] py-1 px-0.5 z-[9700]"
        >
          {system.startupEntries.filter((s) => s.enabled).length === 0 ? (
            <div className="px-3 py-1.5 text-[11px] text-[#8d8b7e]">(Empty)</div>
          ) : (
            system.startupEntries
              .filter((s) => s.enabled)
              .map((s) => renderAppRow(s.appId, s.name))
          )}
        </div>
      )}

      {/* My Recent Documents Submenu */}
      {submenu === 'recent' && (
        <div
          role="menu"
          aria-label="My Recent Documents"
          onMouseEnter={keepSubmenuOpen}
          onMouseLeave={() => scheduleSubmenu('none', 260)}
          className="fixed sm:absolute top-[110px] right-2 sm:left-full sm:right-auto w-[215px] max-h-[260px] overflow-y-auto bg-[#ffffff] border border-[#aca899] shadow-[3px_3px_6px_rgba(0,0,0,0.32)] py-1 px-0.5 z-[9600]"
        >
          {recentFiles.length === 0 ? (
            <div className="px-3 py-1.5 text-[11px] text-[#8d8b7e]">(Empty)</div>
          ) : (
            recentFiles.slice(0, 10).map((file) => (
              <button
                key={file.id}
                type="button"
                role="menuitem"
                onClick={() => {
                  onClose();
                  onOpenRecentFile(file);
                }}
                className="w-full px-2 py-1.5 flex items-center gap-2 text-[11px] text-[#000000] hover:bg-[#316ac5] hover:text-[#ffffff] focus-visible:bg-[#316ac5] focus-visible:text-[#ffffff] focus:outline-none cursor-default"
              >
                <XpIcon name={iconForVfsNode(file)} size={16} />
                <span className="truncate">{file.name}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};
