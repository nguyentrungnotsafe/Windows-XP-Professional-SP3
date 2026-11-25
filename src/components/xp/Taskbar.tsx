import React, { useEffect, useState } from 'react';
import type { AppId, ContextMenuItem, SystemState, WindowInstance } from '../../types/os';
import { XpIcon, type XpIconName } from './XpIcons';

interface TaskbarProps {
  windows: WindowInstance[];
  activeWindowId: string | null;
  startMenuOpen: boolean;
  system: SystemState;
  getAppIcon: (appId: WindowInstance['appId']) => XpIconName;
  onToggleStartMenu: () => void;
  onTaskButtonClick: (win: WindowInstance) => void;
  onLaunchApp: (appId: AppId) => void;
  onShowDesktop: () => void;
  onOpenContextMenu: (x: number, y: number, items: ContextMenuItem[]) => void;
}

export const Taskbar: React.FC<TaskbarProps> = ({
  windows,
  activeWindowId,
  startMenuOpen,
  system,
  getAppIcon,
  onToggleStartMenu,
  onTaskButtonClick,
  onLaunchApp,
  onShowDesktop,
  onOpenContextMenu,
}) => {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const intervalMs = system.regionalOptions.showSeconds ? 1000 : 15000;
    const id = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(id);
  }, [system.regionalOptions.showSeconds]);

  const timeString = now.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
    second: system.regionalOptions.showSeconds ? '2-digit' : undefined,
    hour12: !system.regionalOptions.clock24h,
  });

  const fullDateString = now.toLocaleDateString([], {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handleTaskbarContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onOpenContextMenu(e.clientX, e.clientY, [
      {
        id: 'taskmgr',
        label: 'Task Manager',
        bold: true,
        onSelect: () => onLaunchApp('taskmgr'),
      },
      {
        id: 'show_desktop',
        label: 'Show the Desktop',
        separatorBefore: true,
        onSelect: onShowDesktop,
      },
      {
        id: 'properties',
        label: 'Properties',
        separatorBefore: true,
        onSelect: () => onLaunchApp('taskbar_opts'),
      },
    ]);
  };

  return (
    <div
      role="region"
      aria-label="Taskbar"
      onContextMenu={handleTaskbarContextMenu}
      className="fixed bottom-0 left-0 right-0 h-[30px] xp-taskbar-bg flex items-center justify-between z-[9000] select-none"
    >
      {/* Start Button */}
      <button
        type="button"
        aria-label="Start"
        aria-expanded={startMenuOpen}
        aria-haspopup="menu"
        onClick={(e) => {
          e.stopPropagation();
          onToggleStartMenu();
        }}
        className={`h-[30px] pl-2.5 pr-4 rounded-r-[11px] flex items-center gap-1.5 shrink-0 cursor-default focus-visible:outline focus-visible:outline-1 focus-visible:outline-white ${
          startMenuOpen ? 'xp-start-btn-active' : 'xp-start-btn'
        }`}
      >
        <XpIcon name="windows_flag" size={18} />
        <span
          className="text-[14px] font-bold italic text-[#ffffff] tracking-tight leading-none"
          style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.65)' }}
        >
          start
        </span>
      </button>

      {/* Quick Launch Toolbar */}
      {system.taskbarPrefs.showQuickLaunch && (
        <div
          aria-label="Quick Launch"
          className="hidden sm:flex items-center gap-1 px-2 border-r border-[#1746a2] h-[22px] shrink-0"
        >
          <button
            type="button"
            title="Show Desktop"
            aria-label="Show Desktop"
            onClick={onShowDesktop}
            className="w-[20px] h-[20px] flex items-center justify-center rounded-[2px] hover:bg-[#3c81f3] cursor-default"
          >
            <XpIcon name="display" size={14} />
          </button>
          <button
            type="button"
            title="Launch Internet Explorer Browser"
            aria-label="Quick Launch Internet Explorer"
            onClick={() => onLaunchApp('iexplore')}
            className="w-[20px] h-[20px] flex items-center justify-center rounded-[2px] hover:bg-[#3c81f3] cursor-default"
          >
            <XpIcon name="internet_explorer" size={14} />
          </button>
          <button
            type="button"
            title="Windows Media Player"
            aria-label="Quick Launch Windows Media Player"
            onClick={() => onLaunchApp('wmplayer')}
            className="w-[20px] h-[20px] flex items-center justify-center rounded-[2px] hover:bg-[#3c81f3] cursor-default"
          >
            <XpIcon name="wmp" size={14} />
          </button>
        </div>
      )}

      {/* Open Window Task Buttons */}
      <div className="flex-1 min-w-0 h-full flex items-center px-1.5 gap-1 overflow-hidden">
        {windows.map((win) => {
          const isActive = !win.minimized && win.id === activeWindowId;
          return (
            <button
              key={win.id}
              type="button"
              onClick={() => onTaskButtonClick(win)}
              title={win.title}
              aria-pressed={isActive}
              className={`h-[22px] min-w-[44px] max-w-[162px] flex-1 basis-0 px-2 rounded-[3px] flex items-center gap-1.5 text-[11px] text-[#ffffff] cursor-default focus-visible:outline focus-visible:outline-1 focus-visible:outline-white ${
                isActive
                  ? 'bg-[#1b49b3] border border-[#0c2d7a] shadow-[inset_1px_1px_3px_rgba(0,0,0,0.45)]'
                  : 'bg-[#3c81f3] hover:bg-[#5394f8] border border-[#245cc9] shadow-[inset_0_1px_0_rgba(255,255,255,0.28)]'
              }`}
            >
              <XpIcon name={getAppIcon(win.appId)} size={15} />
              <span className="truncate text-left">{win.title}</span>
            </button>
          );
        })}
      </div>

      {/* Notification Area & Clock */}
      <div className="h-[30px] xp-tray-bg pl-2 pr-2.5 flex items-center gap-2 shrink-0 text-[#ffffff]">
        {!system.firewallEnabled && (
          <button
            type="button"
            title="Windows Security Alerts: Windows Firewall is turned off"
            aria-label="Windows Security Alert"
            onClick={() => onLaunchApp('security_center')}
            className="p-0.5 rounded hover:bg-white/15 cursor-default"
          >
            <XpIcon name="security_shield" size={14} />
          </button>
        )}

        <button
          type="button"
          title={system.audio.muted ? 'Volume (Muted)' : `Volume (${system.audio.masterVolume}%)`}
          aria-label="Volume Control"
          onClick={() => onLaunchApp('sndvol32')}
          className="p-0.5 rounded hover:bg-white/15 hidden sm:flex items-center justify-center cursor-default"
        >
          <XpIcon name="volume" size={14} />
        </button>

        {system.taskbarPrefs.showClock && (
          <button
            type="button"
            onDoubleClick={() => onLaunchApp('timedate')}
            onClick={() => onLaunchApp('timedate')}
            title={`${fullDateString} (click for Date and Time)`}
            aria-label={`Clock: ${timeString}, ${fullDateString}`}
            className="text-[11px] whitespace-nowrap tabular-nums px-1 py-0.5 rounded hover:bg-white/10 cursor-default"
          >
            {timeString}
          </button>
        )}
      </div>
    </div>
  );
};
