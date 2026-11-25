import React, { useState } from 'react';
import type { AppId, SystemState, WindowInstance } from '../types/os';
import { XpIcon, type XpIconName } from '../components/xp/XpIcons';

interface ControlPanelAppProps {
  system: SystemState;
  onUpdateSystem: (updater: (prev: SystemState) => SystemState) => void;
  onLaunchApp: (appId: AppId, payload?: WindowInstance['payload']) => void;
}

type CategoryId =
  | 'all'
  | 'appearance'
  | 'network'
  | 'add_remove'
  | 'sounds'
  | 'performance'
  | 'printers'
  | 'users'
  | 'regional'
  | 'accessibility'
  | 'security';

interface AppletEntry {
  appId: AppId;
  label: string;
  description: string;
  icon: XpIconName;
  category: CategoryId;
  payload?: WindowInstance['payload'];
}

const CATEGORIES: Array<{ id: CategoryId; label: string; icon: XpIconName }> = [
  { id: 'appearance', label: 'Appearance and Themes', icon: 'display' },
  { id: 'network', label: 'Network and Internet Connections', icon: 'network' },
  { id: 'add_remove', label: 'Add or Remove Programs', icon: 'appwiz' },
  { id: 'sounds', label: 'Sounds, Speech, and Audio Devices', icon: 'volume' },
  { id: 'performance', label: 'Performance and Maintenance', icon: 'admin_tools' },
  { id: 'printers', label: 'Printers and Other Hardware', icon: 'printer' },
  { id: 'users', label: 'User Accounts', icon: 'users' },
  { id: 'regional', label: 'Date, Time, Language, and Regional Options', icon: 'timedate' },
  { id: 'accessibility', label: 'Accessibility Options', icon: 'accessibility' },
  { id: 'security', label: 'Security Center', icon: 'security_shield' },
];

const APPLETS: AppletEntry[] = [
  { appId: 'access_opts', label: 'Accessibility Options', description: 'Adjust High Contrast, StickyKeys, and SoundSentry.', icon: 'accessibility', category: 'accessibility' },
  { appId: 'add_hardware', label: 'Add Hardware', description: 'Scan and inspect installed hardware devices.', icon: 'hardware', category: 'printers' },
  { appId: 'appwiz', label: 'Add or Remove Programs', description: 'Change or remove programs and Windows components.', icon: 'appwiz', category: 'add_remove' },
  { appId: 'admin_tools', label: 'Administrative Tools', description: 'Configure Event Viewer, Services, Computer Management, and Policy.', icon: 'admin_tools', category: 'performance' },
  { appId: 'auto_updates', label: 'Automatic Updates', description: 'Set how Windows handles system updates.', icon: 'windows_update', category: 'security' },
  { appId: 'timedate', label: 'Date and Time', description: 'Set the date, time, and time zone.', icon: 'timedate', category: 'regional' },
  { appId: 'display', label: 'Display', description: 'Change desktop wallpaper, screen preview, and background colors.', icon: 'display', category: 'appearance' },
  { appId: 'folder_opts', label: 'Folder Options', description: 'Customize file extensions, hidden files, and click behavior.', icon: 'folder', category: 'appearance' },
  { appId: 'fonts', label: 'Fonts', description: 'View installed TrueType and custom EUDC fonts.', icon: 'fonts', category: 'appearance' },
  { appId: 'game_opts', label: 'Game Controllers', description: 'Test and calibrate simulated game pads.', icon: 'game_controller', category: 'printers' },
  { appId: 'inet_opts', label: 'Internet Options', description: 'Configure IE home page, history, and security zones.', icon: 'internet_explorer', category: 'network' },
  { appId: 'keyboard_opts', label: 'Keyboard', description: 'Adjust character repeat delay and cursor blink rate.', icon: 'keyboard', category: 'printers' },
  { appId: 'mouse_opts', label: 'Mouse', description: 'Customize pointer speed and double-click sensitivity.', icon: 'mouse', category: 'printers' },
  { appId: 'ncpa', label: 'Network Connections', description: 'Connect to LAN, Wireless, Dial-up, and VPN adapters.', icon: 'network', category: 'network' },
  { appId: 'power_opts', label: 'Power Options', description: 'Select energy-saving power schemes.', icon: 'power', category: 'performance' },
  { appId: 'printers', label: 'Printers and Faxes', description: 'Manage virtual printers and the Print Spooler queue.', icon: 'printer', category: 'printers' },
  { appId: 'intl', label: 'Regional and Language Options', description: 'Customize 24-hour clock, seconds display, and date format.', icon: 'regional', category: 'regional' },
  { appId: 'scanners', label: 'Scanners and Cameras', description: 'Launch the Scanner and Camera Wizard.', icon: 'scanner', category: 'printers' },
  { appId: 'schtasks', label: 'Scheduled Tasks', description: 'Schedule automated maintenance tasks.', icon: 'schtasks', category: 'performance' },
  { appId: 'security_center', label: 'Security Center', description: 'Check Windows Firewall, Automatic Updates, and protection status.', icon: 'security_shield', category: 'security' },
  { appId: 'sounds_opts', label: 'Sounds and Audio Devices', description: 'Preview XP sound chimes and open Volume Control.', icon: 'volume', category: 'sounds' },
  { appId: 'speech_opts', label: 'Speech', description: 'Configure and test text-to-speech synthesis.', icon: 'narrator', category: 'sounds' },
  { appId: 'sysdm', label: 'System', description: 'View computer name, hardware profile, System Restore, and updates.', icon: 'sysdm', category: 'performance' },
  { appId: 'taskbar_opts', label: 'Taskbar and Start Menu', description: 'Configure taskbar clock, Quick Launch, and grouping.', icon: 'taskbar', category: 'appearance' },
  { appId: 'telephon', label: 'Phone and Modem Options', description: 'Configure dialing rules and modem properties.', icon: 'phone', category: 'printers' },
  { appId: 'nusrmgr', label: 'User Accounts', description: 'Create, switch, and manage workstation user accounts.', icon: 'users', category: 'users' },
  { appId: 'firewall', label: 'Windows Firewall', description: 'Turn Windows Firewall on or off.', icon: 'firewall', category: 'security' },
];

export const ControlPanelApp: React.FC<ControlPanelAppProps> = ({
  system,
  onUpdateSystem,
  onLaunchApp,
}) => {
  const classicView = system.folderOptions.classicControlPanel;
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('all');

  const toggleView = () => {
    onUpdateSystem((prev) => ({
      ...prev,
      folderOptions: {
        ...prev.folderOptions,
        classicControlPanel: !prev.folderOptions.classicControlPanel,
      },
    }));
  };

  const visibleApplets =
    selectedCategory === 'all'
      ? APPLETS
      : APPLETS.filter((a) => a.category === selectedCategory);

  return (
    <div className="flex-1 min-h-0 flex bg-[#ffffff] text-[11px]">
      <aside className="hidden sm:flex w-[196px] shrink-0 xp-taskpane-bg p-2.5 flex-col gap-2.5 overflow-y-auto xp-scroll">
        <div className="rounded-t-[4px] overflow-hidden shadow-sm">
          <div className="xp-taskpane-card-header px-2.5 py-1.5 font-bold text-[#215dc6]">
            Control Panel
          </div>
          <div className="bg-[#d6dff7] p-2 text-[#215dc6] flex flex-col gap-1.5">
            <button
              type="button"
              onClick={toggleView}
              className="text-left hover:underline cursor-default font-bold"
            >
              {classicView ? 'Switch to Category View' : 'Switch to Classic View'}
            </button>
            {!classicView && selectedCategory !== 'all' && (
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className="text-left hover:underline cursor-default"
              >
                ← Back to Control Panel Home
              </button>
            )}
          </div>
        </div>

        <div className="rounded-t-[4px] overflow-hidden shadow-sm">
          <div className="xp-taskpane-card-header px-2.5 py-1.5 font-bold text-[#215dc6]">
            See Also
          </div>
          <div className="bg-[#d6dff7] p-2 text-[#215dc6] flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() => onLaunchApp('wincomp')}
              className="text-left hover:underline cursor-default"
            >
              Add/Remove Windows Components
            </button>
            <button
              type="button"
              onClick={() => onLaunchApp('wupdmgr')}
              className="text-left hover:underline cursor-default"
            >
              Windows Update
            </button>
            <button
              type="button"
              onClick={() => onLaunchApp('help')}
              className="text-left hover:underline cursor-default"
            >
              Help and Support
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 min-w-0 p-4 overflow-y-auto xp-scroll">
        <div className="flex items-center justify-between border-b border-[#6fa0e8] pb-1.5 mb-3">
          <h2 className="text-[14px] font-bold text-[#003c74]">
            {classicView
              ? 'Control Panel (Classic View)'
              : selectedCategory === 'all'
              ? 'Pick a category'
              : CATEGORIES.find((c) => c.id === selectedCategory)?.label ?? 'Control Panel'}
          </h2>
          <button type="button" onClick={toggleView} className="xp-button sm:hidden">
            {classicView ? 'Category View' : 'Classic View'}
          </button>
        </div>

        {!classicView && selectedCategory === 'all' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className="flex items-center gap-3 p-2.5 rounded-[3px] border border-transparent hover:border-[#9ebde8] hover:bg-[#eef4fd] text-left cursor-default"
              >
                <XpIcon name={cat.icon} size={32} />
                <span className="font-bold text-[#0b3c8d] text-[12px]">{cat.label}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {!classicView && (
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className="xp-button self-start"
              >
                ← Back to Categories
              </button>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {visibleApplets.map((item) => (
                <button
                  key={item.appId}
                  type="button"
                  onClick={() => onLaunchApp(item.appId, item.payload)}
                  className="flex items-start gap-2.5 p-2 rounded-[3px] border border-transparent hover:border-[#9ebde8] hover:bg-[#eef4fd] text-left cursor-default"
                >
                  <XpIcon name={item.icon} size={28} />
                  <div className="min-w-0">
                    <div className="font-bold text-[#0b3c8d]">{item.label}</div>
                    <div className="text-[10px] text-[#555555] mt-0.5 leading-[1.3]">
                      {item.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
