import React, { useEffect, useState } from 'react';
import type {
  AppId,
  ModalPromptRequest,
  PrinterDevice,
  SystemState,
} from '../types/os';
import { APP_REGISTRY, OPTIONAL_COMPONENT_DEFS } from '../state/appRegistry';
import { appendEventLog } from '../state/systemState';
import {
  XP_SYSTEM_SOUNDS,
  XP_SYSTEM_SOUND_MAP,
  xpAudio,
  type XpSystemSoundId,
} from '../utils/audioEngine';
import { XpIcon, type XpIconName } from '../components/xp/XpIcons';

// --- 1. Add or Remove Programs ---
interface AddRemoveProgramsAppProps {
  system: SystemState;
  onUpdateSystem: (updater: (prev: SystemState) => SystemState) => void;
  onLaunchApp: (appId: AppId) => void;
}

export const AddRemoveProgramsApp: React.FC<AddRemoveProgramsAppProps> = ({
  system,
  onUpdateSystem,
  onLaunchApp,
}) => {
  const [tab, setTab] = useState<'change' | 'defaults'>('change');
  const installedOptional = OPTIONAL_COMPONENT_DEFS.filter(
    (d) => system.optionalComponents[d.id]
  );

  const removeOptional = (id: string, label: string) => {
    onUpdateSystem((prev) =>
      appendEventLog(
        {
          ...prev,
          optionalComponents: { ...prev.optionalComponents, [id]: false },
        },
        {
          logType: 'Application',
          level: 'Information',
          source: 'MsiInstaller',
          eventId: 1034,
          message: `Removed Windows optional component: ${label}.`,
        }
      )
    );
  };

  return (
    <div className="flex-1 min-h-0 flex bg-[#ece9d8] text-[11px]">
      <div className="w-[155px] shrink-0 bg-[#5273b3] p-2 flex flex-col gap-1.5 text-white">
        <button
          type="button"
          onClick={() => setTab('change')}
          className={`px-2 py-2 rounded-[3px] text-left font-bold cursor-default ${
            tab === 'change' ? 'bg-white text-[#0b3c8d]' : 'hover:bg-white/15'
          }`}
        >
          Change or Remove Programs
        </button>
        <button
          type="button"
          onClick={() => onLaunchApp('wincomp')}
          className="px-2 py-2 rounded-[3px] text-left font-bold hover:bg-white/15 cursor-default"
        >
          Add/Remove Windows Components
        </button>
        <button
          type="button"
          onClick={() => setTab('defaults')}
          className={`px-2 py-2 rounded-[3px] text-left font-bold cursor-default ${
            tab === 'defaults' ? 'bg-white text-[#0b3c8d]' : 'hover:bg-white/15'
          }`}
        >
          Set Program Access and Defaults
        </button>
      </div>

      <div className="flex-1 min-w-0 p-3 bg-white overflow-y-auto xp-scroll flex flex-col gap-2">
        {tab === 'change' ? (
          <>
            <div className="font-bold text-[12px] text-[#0b3c8d]">
              Currently installed optional components &amp; packs
            </div>
            {installedOptional.map((comp) => (
              <div
                key={comp.id}
                className="border border-[#d4d0c8] bg-[#faf9f5] p-2 flex items-center justify-between gap-2"
              >
                <div>
                  <div className="font-bold">{comp.label}</div>
                  <div className="text-[10px] text-[#555555]">
                    {comp.description} ({comp.sizeMb.toFixed(1)} MB)
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeOptional(comp.id, comp.label)}
                  className="xp-button shrink-0"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => onLaunchApp('wincomp')}
              className="xp-button xp-button-default self-start mt-1"
            >
              Open Windows Components Wizard...
            </button>
          </>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="font-bold text-[12px] text-[#0b3c8d]">
              Set Program Access and Defaults
            </div>
            <label className="flex items-center gap-2">
              <span>Default Plain-Text Editor:</span>
              <select
                value={system.fileAssociations['.txt'] ?? 'notepad'}
                onChange={(e) =>
                  onUpdateSystem((prev) => ({
                    ...prev,
                    fileAssociations: {
                      ...prev.fileAssociations,
                      '.txt': e.target.value as AppId,
                    },
                  }))
                }
                className="xp-input"
              >
                <option value="notepad">Notepad</option>
                <option value="wordpad">WordPad</option>
              </select>
            </label>
            <label className="flex items-center gap-2">
              <span>Default Image Viewer:</span>
              <select
                value={system.fileAssociations['.png'] ?? 'imageviewer'}
                onChange={(e) =>
                  onUpdateSystem((prev) => ({
                    ...prev,
                    fileAssociations: {
                      ...prev.fileAssociations,
                      '.png': e.target.value as AppId,
                    },
                  }))
                }
                className="xp-input"
              >
                <option value="imageviewer">Windows Picture and Fax Viewer</option>
                <option value="paint">Paint</option>
              </select>
            </label>
          </div>
        )}
      </div>
    </div>
  );
};

// --- 2. Windows Components Wizard ---
interface WindowsComponentsWizardAppProps {
  system: SystemState;
  onUpdateSystem: (updater: (prev: SystemState) => SystemState) => void;
  onClose: () => void;
}

export const WindowsComponentsWizardApp: React.FC<WindowsComponentsWizardAppProps> = ({
  system,
  onUpdateSystem,
  onClose,
}) => {
  const [draft, setDraft] = useState<Record<string, boolean>>({ ...system.optionalComponents });

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSystem((prev) => {
      const nextServices = prev.services.map((svc) => {
        if (!svc.optionalComponentId) return svc;
        const enabled = Boolean(draft[svc.optionalComponentId]);
        return {
          ...svc,
          status: enabled ? ('Running' as const) : ('Stopped' as const),
        };
      });
      const changed = OPTIONAL_COMPONENT_DEFS.filter(
        (d) => Boolean(prev.optionalComponents[d.id]) !== Boolean(draft[d.id])
      )
        .map((d) => `${d.label}=${draft[d.id] ? 'Installed' : 'Removed'}`)
        .join(', ');

      return appendEventLog(
        {
          ...prev,
          optionalComponents: draft,
          services: nextServices,
        },
        {
          logType: 'Application',
          level: 'Information',
          source: 'Setup',
          eventId: 4002,
          message: changed
            ? `Windows Components Wizard updated: ${changed}.`
            : 'Windows Components Wizard completed with no changes.',
        }
      );
    });
    onClose();
  };

  return (
    <form onSubmit={handleApply} className="flex-1 min-h-0 flex flex-col bg-[#ece9d8] p-3 text-[11px] justify-between gap-2">
      <div className="flex flex-col gap-2 min-h-0 flex-1">
        <div className="font-bold text-[12px] text-[#0b3c8d]">
          Windows Components Wizard
        </div>
        <p>Select components to install or clear check boxes to uninstall:</p>
        <div className="flex-1 min-h-0 bg-white border border-[#7f9db9] overflow-y-auto xp-scroll p-1.5 flex flex-col gap-1">
          {OPTIONAL_COMPONENT_DEFS.map((def) => (
            <label
              key={def.id}
              className="flex items-start gap-2 p-1 hover:bg-[#eef4fd] cursor-default"
            >
              <input
                type="checkbox"
                checked={Boolean(draft[def.id])}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, [def.id]: e.target.checked }))
                }
              />
              <div className="flex-1 min-w-0">
                <div className="font-bold">
                  {def.label} <span className="font-normal text-[#666666]">({def.sizeMb.toFixed(1)} MB)</span>
                </div>
                <div className="text-[10px] text-[#555555]">{def.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-1 border-t border-[#aca899]">
        <button type="submit" className="xp-button xp-button-default min-w-[74px]">
          Next &gt;
        </button>
        <button type="button" onClick={onClose} className="xp-button min-w-[74px]">
          Cancel
        </button>
      </div>
    </form>
  );
};

// --- 3. System Properties (sysdm.cpl) ---
interface SystemPropertiesDialogProps {
  system: SystemState;
  onUpdateSystem: (updater: (prev: SystemState) => SystemState) => void;
  onLaunchApp: (appId: AppId) => void;
  onClose: () => void;
}

export const SystemPropertiesDialog: React.FC<SystemPropertiesDialogProps> = ({
  system,
  onUpdateSystem,
  onLaunchApp,
  onClose,
}) => {
  const [tab, setTab] = useState<'general' | 'name' | 'hardware' | 'restore' | 'updates'>('general');
  const [computerName, setComputerName] = useState(system.computerName);

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#ece9d8] p-2.5 text-[11px] justify-between">
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="flex gap-1 pl-1 flex-wrap">
          {(
            [
              ['general', 'General'],
              ['name', 'Computer Name'],
              ['hardware', 'Hardware'],
              ['restore', 'System Restore'],
              ['updates', 'Automatic Updates'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`px-2.5 py-1 rounded-t-[3px] border border-b-0 border-[#919b9c] cursor-default ${
                tab === id ? 'bg-[#f9f8f4] font-bold relative z-10 -mb-[1px]' : 'bg-[#e3e0d3]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 min-h-0 bg-[#f9f8f4] border border-[#919b9c] p-3 overflow-y-auto xp-scroll flex flex-col gap-2.5">
          {tab === 'general' && (
            <div className="grid grid-cols-[90px_1fr] gap-3 items-start">
              <div className="flex flex-col items-center p-2 bg-white border border-[#d4d0c8]">
                <XpIcon name="windows_flag" size={44} />
              </div>
              <div className="flex flex-col gap-1">
                <div className="font-bold">System:</div>
                <div className="pl-2">Microsoft Windows XP Professional</div>
                <div className="pl-2">Version 2002 • Service Pack 3</div>
                <div className="font-bold mt-2">Registered to:</div>
                <div className="pl-2">{system.registeredOwner}</div>
                <div className="font-bold mt-2">Computer:</div>
                <div className="pl-2">Intel(R) Pentium(R) 4 CPU 3.00GHz</div>
                <div className="pl-2">2.00 GB of RAM (Simulated Profile)</div>
              </div>
            </div>
          )}

          {tab === 'name' && (
            <div className="flex flex-col gap-2">
              <label className="flex flex-col gap-1">
                <span>Full computer name:</span>
                <input
                  value={computerName}
                  onChange={(e) => setComputerName(e.target.value)}
                  className="xp-input max-w-[240px]"
                />
              </label>
              <div>Workgroup: <strong>MSHOME</strong></div>
              <button
                type="button"
                onClick={() =>
                  onUpdateSystem((prev) => ({
                    ...prev,
                    computerName: computerName.trim() || prev.computerName,
                  }))
                }
                className="xp-button self-start"
              >
                Save Computer Name
              </button>
            </div>
          )}

          {tab === 'hardware' && (
            <div className="flex flex-col gap-2.5">
              <p>Inspect virtual drivers or launch the Add Hardware Wizard:</p>
              <div className="flex gap-2">
                <button type="button" onClick={() => onLaunchApp('devmgmt')} className="xp-button xp-button-default">
                  Device Manager
                </button>
                <button type="button" onClick={() => onLaunchApp('add_hardware')} className="xp-button">
                  Add Hardware Wizard
                </button>
              </div>
            </div>
          )}

          {tab === 'restore' && (
            <div className="flex flex-col gap-2">
              <p>System Restore tracks checkpoints ({system.restorePoints.length} saved).</p>
              <button type="button" onClick={() => onLaunchApp('rstrui')} className="xp-button xp-button-default self-start">
                Open System Restore...
              </button>
            </div>
          )}

          {tab === 'updates' && (
            <div className="flex flex-col gap-2">
              <p>Current Automatic Updates setting: <strong>{system.automaticUpdatesMode}</strong></p>
              <button type="button" onClick={() => onLaunchApp('auto_updates')} className="xp-button xp-button-default self-start">
                Configure Automatic Updates...
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onClose} className="xp-button xp-button-default min-w-[74px]">
          OK
        </button>
      </div>
    </div>
  );
};

// --- 4. Date and Time + Regional Options ---
interface DateTimeDialogProps {
  system: SystemState;
  onUpdateSystem: (updater: (prev: SystemState) => SystemState) => void;
  onClose: () => void;
}

export const DateTimeDialog: React.FC<DateTimeDialogProps> = ({
  system,
  onUpdateSystem,
  onClose,
}) => {
  const [timezone, setTimezone] = useState(system.regionalOptions.timezone);
  const now = new Date();

  const apply = () => {
    onUpdateSystem((prev) => ({
      ...prev,
      regionalOptions: { ...prev.regionalOptions, timezone },
    }));
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#ece9d8] p-3 text-[11px] justify-between">
      <div className="bg-[#f9f8f4] border border-[#919b9c] p-3 flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white border border-[#aca899] p-2">
            <div className="font-bold text-[#0b3c8d] mb-1">Date</div>
            <div>{now.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
          </div>
          <div className="bg-white border border-[#aca899] p-2">
            <div className="font-bold text-[#0b3c8d] mb-1">Time</div>
            <div className="text-[14px] font-bold">{now.toLocaleTimeString()}</div>
          </div>
        </div>

        <label className="flex flex-col gap-1">
          <span className="font-bold">Time Zone:</span>
          <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className="xp-input">
            <option>(GMT-08:00) Pacific Time (US &amp; Canada)</option>
            <option>(GMT-05:00) Eastern Time (US &amp; Canada)</option>
            <option>(GMT+00:00) Greenwich Mean Time : Dublin, Edinburgh, London</option>
            <option>(GMT+07:00) Bangkok, Hanoi, Jakarta</option>
            <option>(GMT+09:00) Osaka, Sapporo, Tokyo</option>
          </select>
        </label>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={() => { apply(); onClose(); }} className="xp-button xp-button-default min-w-[72px]">OK</button>
        <button type="button" onClick={onClose} className="xp-button min-w-[72px]">Cancel</button>
      </div>
    </div>
  );
};

export const RegionalOptionsDialog: React.FC<DateTimeDialogProps> = ({
  system,
  onUpdateSystem,
  onClose,
}) => {
  const [draft, setDraft] = useState(system.regionalOptions);

  const apply = () => {
    onUpdateSystem((prev) => ({ ...prev, regionalOptions: draft }));
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#ece9d8] p-3 text-[11px] justify-between">
      <div className="bg-[#f9f8f4] border border-[#919b9c] p-3 flex flex-col gap-2.5">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={draft.clock24h}
            onChange={(e) => setDraft({ ...draft, clock24h: e.target.checked })}
          />
          <span>Use 24-hour clock format on Taskbar</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={draft.showSeconds}
            onChange={(e) => setDraft({ ...draft, showSeconds: e.target.checked })}
          />
          <span>Display seconds in Taskbar tray clock</span>
        </label>
        <label className="flex flex-col gap-1">
          <span>Short date format:</span>
          <select
            value={draft.dateFormat}
            onChange={(e) => setDraft({ ...draft, dateFormat: e.target.value as SystemState['regionalOptions']['dateFormat'] })}
            className="xp-input"
          >
            <option value="M/d/yyyy">M/d/yyyy (US English)</option>
            <option value="yyyy-MM-dd">yyyy-MM-dd (ISO)</option>
            <option value="dd/MM/yyyy">dd/MM/yyyy (UK/Intl)</option>
          </select>
        </label>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={() => { apply(); onClose(); }} className="xp-button xp-button-default min-w-[72px]">OK</button>
        <button type="button" onClick={onClose} className="xp-button min-w-[72px]">Cancel</button>
        <button type="button" onClick={apply} className="xp-button min-w-[72px]">Apply</button>
      </div>
    </div>
  );
};

// --- 5. User Accounts (nusrmgr.cpl) ---
interface UserAccountsAppProps {
  system: SystemState;
  onCreateUser: (username: string, role: 'Administrator' | 'Limited') => { ok: boolean; error?: string };
  onDeleteUser: (username: string) => void;
  onSwitchUser: (username: string) => void;
  onOpenModal: (modal: Omit<ModalPromptRequest, 'id'>) => void;
}

export const UserAccountsApp: React.FC<UserAccountsAppProps> = ({
  system,
  onCreateUser,
  onDeleteUser,
  onSwitchUser,
  onOpenModal,
}) => {
  const [newName, setNewName] = useState('');
  const [role, setRole] = useState<'Administrator' | 'Limited'>('Limited');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const res = onCreateUser(newName.trim(), role);
    if (!res.ok && res.error) {
      onOpenModal({ kind: 'alert', icon: 'error', title: 'User Accounts', message: res.error });
    } else {
      setNewName('');
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#eef3fc] p-4 text-[11px] gap-3 overflow-y-auto xp-scroll">
      <div className="flex items-center gap-2 font-bold text-[14px] text-[#0b3c8d]">
        <XpIcon name="users" size={26} />
        <span>User Accounts</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {system.users.map((u) => (
          <div
            key={u.username}
            className={`bg-white border p-2.5 flex items-center justify-between gap-2 ${
              u.username === system.activeUsername ? 'border-[#316ac5] ring-1 ring-[#316ac5]' : 'border-[#c4d5f0]'
            }`}
          >
            <div>
              <div className="font-bold">
                {u.username} {u.username === system.activeUsername ? '(Current)' : ''}
              </div>
              <div className="text-[10px] text-[#555555]">
                {u.role} • Wallpaper: {u.appearance.wallpaper}
              </div>
            </div>
            <div className="flex gap-1">
              {u.username !== system.activeUsername && (
                <button type="button" onClick={() => onSwitchUser(u.username)} className="xp-button">
                  Switch
                </button>
              )}
              {u.username !== 'Administrator' && u.username !== system.activeUsername && (
                <button type="button" onClick={() => onDeleteUser(u.username)} className="xp-button">
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleCreate} className="bg-white border border-[#c4d5f0] p-3 flex flex-col gap-2">
        <div className="font-bold text-[#0b3c8d]">Create a new account</div>
        <div className="flex flex-wrap gap-2 items-end">
          <label className="flex flex-col gap-0.5 flex-1 min-w-[160px]">
            <span>Type a name for the new account:</span>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} className="xp-input" placeholder="e.g. GuestUser" />
          </label>
          <label className="flex flex-col gap-0.5">
            <span>Account Type:</span>
            <select value={role} onChange={(e) => setRole(e.target.value as 'Administrator' | 'Limited')} className="xp-input">
              <option value="Administrator">Computer administrator</option>
              <option value="Limited">Limited</option>
            </select>
          </label>
          <button type="submit" className="xp-button xp-button-default">Create Account</button>
        </div>
      </form>
    </div>
  );
};

// --- 6. Taskbar & Folder Options ---
export const TaskbarPropertiesDialog: React.FC<DateTimeDialogProps> = ({
  system,
  onUpdateSystem,
  onClose,
}) => {
  const [draft, setDraft] = useState(system.taskbarPrefs);

  const apply = () => onUpdateSystem((prev) => ({ ...prev, taskbarPrefs: draft }));

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#ece9d8] p-3 text-[11px] justify-between">
      <div className="bg-[#f9f8f4] border border-[#919b9c] p-3 flex flex-col gap-2">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={draft.lockTaskbar} onChange={(e) => setDraft({ ...draft, lockTaskbar: e.target.checked })} />
          <span>Lock the taskbar</span>
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={draft.groupSimilar} onChange={(e) => setDraft({ ...draft, groupSimilar: e.target.checked })} />
          <span>Group similar taskbar buttons</span>
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={draft.showQuickLaunch} onChange={(e) => setDraft({ ...draft, showQuickLaunch: e.target.checked })} />
          <span>Show Quick Launch</span>
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={draft.showClock} onChange={(e) => setDraft({ ...draft, showClock: e.target.checked })} />
          <span>Show the clock</span>
        </label>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={() => { apply(); onClose(); }} className="xp-button xp-button-default min-w-[72px]">OK</button>
        <button type="button" onClick={onClose} className="xp-button min-w-[72px]">Cancel</button>
        <button type="button" onClick={apply} className="xp-button min-w-[72px]">Apply</button>
      </div>
    </div>
  );
};

export const FolderOptionsDialog: React.FC<DateTimeDialogProps> = ({
  system,
  onUpdateSystem,
  onClose,
}) => {
  const [draft, setDraft] = useState(system.folderOptions);

  const apply = () => onUpdateSystem((prev) => ({ ...prev, folderOptions: draft }));

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#ece9d8] p-3 text-[11px] justify-between">
      <div className="bg-[#f9f8f4] border border-[#919b9c] p-3 flex flex-col gap-2">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={draft.showExtensions} onChange={(e) => setDraft({ ...draft, showExtensions: e.target.checked })} />
          <span>Show file extensions for known file types</span>
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={draft.showHidden} onChange={(e) => setDraft({ ...draft, showHidden: e.target.checked })} />
          <span>Show hidden files and folders</span>
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={draft.singleClickToOpen} onChange={(e) => setDraft({ ...draft, singleClickToOpen: e.target.checked })} />
          <span>Single-click to open an item (point to select)</span>
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={draft.classicControlPanel} onChange={(e) => setDraft({ ...draft, classicControlPanel: e.target.checked })} />
          <span>Use Windows Classic Control Panel view</span>
        </label>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={() => { apply(); onClose(); }} className="xp-button xp-button-default min-w-[72px]">OK</button>
        <button type="button" onClick={onClose} className="xp-button min-w-[72px]">Cancel</button>
        <button type="button" onClick={apply} className="xp-button min-w-[72px]">Apply</button>
      </div>
    </div>
  );
};

// --- 7. Fonts Folder ---
export const FontsFolderApp: React.FC<{ system: SystemState }> = ({ system }) => {
  const fonts = ['Tahoma', 'Arial', 'Times New Roman', 'Courier New', 'Trebuchet MS', 'Georgia', 'Verdana', 'Lucida Console'];
  const [selectedFont, setSelectedFont] = useState(fonts[0]);

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-white p-3 text-[11px] gap-3">
      <div className="font-bold text-[#0b3c8d] border-b border-[#6fa0e8] pb-1">
        C:\WINDOWS\Fonts ({fonts.length} system fonts, {Object.keys(system.customChars).length} EUDC custom glyphs)
      </div>
      <div className="flex flex-wrap gap-1.5">
        {fonts.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setSelectedFont(f)}
            className={`xp-button ${selectedFont === f ? 'xp-button-default' : ''}`}
          >
            {f}
          </button>
        ))}
      </div>
      <div className="flex-1 border border-[#aca899] bg-[#faf9f5] p-3" style={{ fontFamily: selectedFont }}>
        <div className="text-[18px] font-bold mb-1">{selectedFont}</div>
        <div className="text-[13px]">The quick brown fox jumps over the lazy dog. 0123456789</div>
      </div>
    </div>
  );
};

// --- 8. Mouse, Keyboard, Game Controllers, Sounds, Speech, Power, Internet Options ---
export const MouseOptionsDialog: React.FC<DateTimeDialogProps> = ({ system, onUpdateSystem, onClose }) => {
  const [speed, setSpeed] = useState(system.mouseSpeed);
  const [dbl, setDbl] = useState(system.folderOptions.doubleClickSpeedMs);
  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#ece9d8] p-3 text-[11px] justify-between">
      <div className="bg-[#f9f8f4] border border-[#919b9c] p-3 flex flex-col gap-3">
        <label className="flex flex-col gap-1">
          <span>Pointer speed: {speed}/10</span>
          <input type="range" min={1} max={10} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} />
        </label>
        <label className="flex flex-col gap-1">
          <span>Double-click threshold: {dbl} ms</span>
          <input type="range" min={200} max={900} step={50} value={dbl} onChange={(e) => setDbl(Number(e.target.value))} />
        </label>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={() => {
            onUpdateSystem((prev) => ({
              ...prev,
              mouseSpeed: speed,
              folderOptions: { ...prev.folderOptions, doubleClickSpeedMs: dbl },
            }));
            onClose();
          }}
          className="xp-button xp-button-default"
        >
          OK
        </button>
        <button type="button" onClick={onClose} className="xp-button">Cancel</button>
      </div>
    </div>
  );
};

export const KeyboardOptionsDialog: React.FC<DateTimeDialogProps> = ({ system, onUpdateSystem, onClose }) => {
  const [delay, setDelay] = useState(system.keyboardRepeatDelay);
  const [testText, setTestText] = useState('');
  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#ece9d8] p-3 text-[11px] justify-between">
      <div className="bg-[#f9f8f4] border border-[#919b9c] p-3 flex flex-col gap-3">
        <label className="flex flex-col gap-1">
          <span>Repeat delay: {delay}/4</span>
          <input type="range" min={1} max={4} value={delay} onChange={(e) => setDelay(Number(e.target.value))} />
        </label>
        <label className="flex flex-col gap-1">
          <span>Click here and hold down a key to test repeat rate:</span>
          <input value={testText} onChange={(e) => setTestText(e.target.value)} className="xp-input" />
        </label>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={() => {
            onUpdateSystem((prev) => ({ ...prev, keyboardRepeatDelay: delay }));
            onClose();
          }}
          className="xp-button xp-button-default"
        >
          OK
        </button>
        <button type="button" onClick={onClose} className="xp-button">Cancel</button>
      </div>
    </div>
  );
};

export const GameControllersDialog: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [testBtn, setTestBtn] = useState('None');
  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#ece9d8] p-3 text-[11px] justify-between">
      <div className="bg-[#f9f8f4] border border-[#919b9c] p-3 flex flex-col gap-2">
        <div className="font-bold">Installed Game Controllers:</div>
        <div className="bg-white border border-[#7f9db9] p-1.5">Virtual USB Gamepad (OK)</div>
        <div>Last button test: <strong>{testBtn}</strong></div>
        <div className="flex gap-1.5">
          {['Button 1', 'Button 2', 'D-Pad Up'].map((b) => (
            <button key={b} type="button" onClick={() => setTestBtn(b)} className="xp-button">{b}</button>
          ))}
        </div>
      </div>
      <div className="flex justify-end pt-2">
        <button type="button" onClick={onClose} className="xp-button xp-button-default">OK</button>
      </div>
    </div>
  );
};

export const SoundsAudioOptionsDialog: React.FC<{
  system: SystemState;
  onUpdateSystem: (updater: (prev: SystemState) => SystemState) => void;
  onLaunchApp: (appId: AppId) => void;
  onClose: () => void;
}> = ({ system, onUpdateSystem, onLaunchApp, onClose }) => {
  const [selectedSoundId, setSelectedSoundId] = useState<XpSystemSoundId>('startup');
  const [playingSoundId, setPlayingSoundId] = useState<XpSystemSoundId | null>(() =>
    xpAudio.getPlayingSystemSound()
  );

  useEffect(() => xpAudio.onPlaybackChange(setPlayingSoundId), []);

  const audioSvc = system.services.find((s) => s.id === 'audiosrv');
  const audioServiceStopped = audioSvc?.status === 'Stopped';
  const selectedMeta = XP_SYSTEM_SOUND_MAP[selectedSoundId];

  const updateAudio = (patch: Partial<SystemState['audio']>) => {
    onUpdateSystem((prev) => {
      const nextAudio = { ...prev.audio, ...patch };
      xpAudio.applyState(audioServiceStopped ? { ...nextAudio, muted: true } : nextAudio);
      return { ...prev, audio: nextAudio };
    });
  };

  const playSelected = (soundId: XpSystemSoundId) => {
    xpAudio.applyState(audioServiceStopped ? { ...system.audio, muted: true } : system.audio);
    void xpAudio.playSystemSound(soundId);
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#ece9d8] p-3 text-[11px] gap-2.5">
      {/* Device Volume Section */}
      <div className="bg-[#f9f8f4] border border-[#919b9c] p-2.5 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <XpIcon name="volume" size={20} />
            <div className="min-w-0">
              <div className="font-bold truncate">SoundMAX Integrated Digital Audio</div>
              <div className="text-[10px] text-[#555555]">
                {audioServiceStopped
                  ? 'Windows Audio service stopped'
                  : system.audio.muted
                  ? 'Device status: Muted'
                  : 'Device status: Working properly'}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onLaunchApp('sndvol32')}
            className="xp-button whitespace-nowrap shrink-0"
          >
            Volume Control...
          </button>
        </div>

        <div className="flex items-center gap-3 pt-0.5">
          <label className="flex items-center gap-2 flex-1 min-w-0">
            <span className="shrink-0">Device volume:</span>
            <input
              type="range"
              aria-label="Master Volume"
              min={0}
              max={100}
              value={system.audio.masterVolume}
              onChange={(e) => updateAudio({ masterVolume: Number(e.target.value) })}
              className="flex-1 min-w-0"
            />
            <span className="w-[34px] text-right tabular-nums font-bold shrink-0">
              {system.audio.muted ? '0%' : `${system.audio.masterVolume}%`}
            </span>
          </label>
          <label className="flex items-center gap-1.5 shrink-0 cursor-pointer">
            <input
              type="checkbox"
              checked={system.audio.muted}
              onChange={(e) => updateAudio({ muted: e.target.checked })}
            />
            <span>Mute</span>
          </label>
        </div>

        {audioServiceStopped && (
          <div className="bg-[#fff7e0] border border-[#d6b656] px-2 py-1 text-[10px] text-[#5c4300]">
            Windows Audio service (AudioSrv) is stopped. Start it in Services to hear sound playback.
          </div>
        )}
      </div>

      {/* Program Events / Sound Scheme Section */}
      <div className="bg-[#f9f8f4] border border-[#919b9c] p-2.5 flex-1 min-h-0 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <span className="font-bold">Program events (Windows Default):</span>
          <span className="text-[10px] text-[#555555] tabular-nums">5 sounds</span>
        </div>

        <div
          role="listbox"
          aria-label="Windows XP Program Events"
          className="bg-white border border-[#7f9db9] flex-1 min-h-[116px] overflow-y-auto xp-scroll p-0.5 flex flex-col"
        >
          {XP_SYSTEM_SOUNDS.map((sound) => {
            const isSelected = sound.id === selectedSoundId;
            const isPlaying = sound.id === playingSoundId;
            return (
              <button
                key={sound.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => setSelectedSoundId(sound.id)}
                onDoubleClick={() => {
                  setSelectedSoundId(sound.id);
                  playSelected(sound.id);
                }}
                className={`flex items-center justify-between gap-2 px-2 py-1 text-left cursor-default rounded-[1px] ${
                  isSelected ? 'bg-[#316ac5] text-white' : 'hover:bg-[#eef4fd] text-[#000000]'
                }`}
              >
                <span className="flex items-center gap-1.5 min-w-0">
                  <svg
                    viewBox="0 0 16 16"
                    className="w-3.5 h-3.5 shrink-0"
                    aria-hidden="true"
                  >
                    <path
                      d="M2 6h3l4-3v10L5 10H2z"
                      fill={isSelected ? '#ffffff' : '#3a6ea5'}
                    />
                    <path
                      d="M11 5.5c.9.9.9 4.1 0 5M13 3.5c1.8 2 1.8 7 0 9"
                      fill="none"
                      stroke={isPlaying ? '#ffd54f' : isSelected ? '#dbeafe' : '#5b8cc4'}
                      strokeWidth="1.4"
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="truncate font-medium">{sound.label}</span>
                </span>
                <span
                  className={`text-[10px] shrink-0 ${
                    isSelected ? 'text-[#e3eeff]' : 'text-[#666666]'
                  }`}
                >
                  {isPlaying ? 'Playing...' : sound.fileName}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-2 pt-0.5">
          <div className="min-w-0 text-[10px] text-[#444444]">
            <div className="truncate font-bold text-[#000000]">{selectedMeta.fileName}</div>
            <div className="truncate">{selectedMeta.description}</div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => playSelected(selectedSoundId)}
              disabled={audioServiceStopped || system.audio.muted}
              className="xp-button whitespace-nowrap shrink-0 min-w-[54px]"
            >
              Play
            </button>
            <button
              type="button"
              onClick={() => xpAudio.stopSystemSound()}
              disabled={playingSoundId === null}
              className="xp-button whitespace-nowrap shrink-0 min-w-[54px]"
            >
              Stop
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button type="button" onClick={onClose} className="xp-button xp-button-default min-w-[74px]">
          OK
        </button>
      </div>
    </div>
  );
};

export const SpeechPropertiesDialog: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [text, setText] = useState('You have selected Microsoft Sam as the computer default voice.');
  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#ece9d8] p-3 text-[11px] justify-between">
      <div className="bg-[#f9f8f4] border border-[#919b9c] p-3 flex flex-col gap-2">
        <div className="font-bold">Voice selection: Microsoft Sam (Simulated Browser TTS)</div>
        <input value={text} onChange={(e) => setText(e.target.value)} className="xp-input" />
        <button
          type="button"
          onClick={() => {
            if ('speechSynthesis' in window) {
              try {
                window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
              } catch {
                // ignore
              }
            }
          }}
          className="xp-button self-start"
        >
          Preview Voice
        </button>
      </div>
      <div className="flex justify-end pt-2">
        <button type="button" onClick={onClose} className="xp-button xp-button-default">OK</button>
      </div>
    </div>
  );
};

export const PowerOptionsDialog: React.FC<DateTimeDialogProps> = ({ system, onUpdateSystem, onClose }) => {
  const [scheme, setScheme] = useState(system.powerScheme);
  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#ece9d8] p-3 text-[11px] justify-between">
      <div className="bg-[#f9f8f4] border border-[#919b9c] p-3 flex flex-col gap-2">
        <label className="flex flex-col gap-1">
          <span className="font-bold">Power schemes:</span>
          <select value={scheme} onChange={(e) => setScheme(e.target.value as SystemState['powerScheme'])} className="xp-input">
            <option value="Home/Office Desk">Home/Office Desk</option>
            <option value="Portable/Laptop">Portable/Laptop</option>
            <option value="Always On">Always On</option>
          </select>
        </label>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={() => {
            onUpdateSystem((prev) => ({ ...prev, powerScheme: scheme }));
            onClose();
          }}
          className="xp-button xp-button-default"
        >
          OK
        </button>
        <button type="button" onClick={onClose} className="xp-button">Cancel</button>
      </div>
    </div>
  );
};

export const InternetOptionsDialog: React.FC<DateTimeDialogProps> = ({ system, onUpdateSystem, onClose }) => {
  const [homePage, setHomePage] = useState(system.ieHomePage);
  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#ece9d8] p-3 text-[11px] justify-between">
      <div className="bg-[#f9f8f4] border border-[#919b9c] p-3 flex flex-col gap-2.5">
        <label className="flex flex-col gap-1">
          <span className="font-bold">Home page address:</span>
          <input value={homePage} onChange={(e) => setHomePage(e.target.value)} className="xp-input" />
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onUpdateSystem((prev) => ({ ...prev, ieHistory: [] }))}
            className="xp-button"
          >
            Clear History ({system.ieHistory.length})
          </button>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={() => {
            onUpdateSystem((prev) => ({ ...prev, ieHomePage: homePage.trim() || 'http://home.xp.local/' }));
            onClose();
          }}
          className="xp-button xp-button-default"
        >
          OK
        </button>
        <button type="button" onClick={onClose} className="xp-button">Cancel</button>
      </div>
    </div>
  );
};

// --- 9. Printers and Faxes (with live Spooler queue) ---
interface PrintersAndFaxesAppProps {
  system: SystemState;
  onUpdateSystem: (updater: (prev: SystemState) => SystemState) => void;
  onLaunchApp: (appId: AppId) => void;
}

export const PrintersAndFaxesApp: React.FC<PrintersAndFaxesAppProps> = ({
  system,
  onUpdateSystem,
  onLaunchApp,
}) => {
  const [newPrinterName, setNewPrinterName] = useState('');
  const spoolerService = system.services.find((s) => s.id === 'spooler');

  const addPrinter = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newPrinterName.trim();
    if (!name) return;
    const prt: PrinterDevice = {
      id: `prt_${Date.now()}`,
      name,
      port: 'USB001',
      driver: 'Generic / Text Only',
      isDefault: false,
      paused: false,
    };
    onUpdateSystem((prev) => ({ ...prev, printers: [...prev.printers, prt] }));
    setNewPrinterName('');
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-white p-3 text-[11px] gap-3 overflow-y-auto xp-scroll">
      <div className="flex items-center justify-between border-b border-[#6fa0e8] pb-1.5">
        <div className="font-bold text-[13px] text-[#0b3c8d]">
          Printers and Faxes (Print Spooler: {spoolerService?.status ?? 'Running'})
        </div>
        <button type="button" onClick={() => onLaunchApp('services')} className="xp-button">
          Open Services...
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {system.printers.map((prt) => (
          <div key={prt.id} className="border border-[#c4d5f0] bg-[#f5f9ff] p-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <XpIcon name="printer" size={26} />
              <div>
                <div className="font-bold">{prt.name} {prt.isDefault ? '(Default)' : ''}</div>
                <div className="text-[10px] text-[#555555]">{prt.port} • {prt.paused ? 'Paused' : 'Ready'}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                onUpdateSystem((prev) => ({
                  ...prev,
                  printers: prev.printers.map((p) =>
                    p.id === prt.id ? { ...p, paused: !p.paused } : p
                  ),
                }))
              }
              className="xp-button"
            >
              {prt.paused ? 'Resume' : 'Pause'}
            </button>
          </div>
        ))}
      </div>

      <form onSubmit={addPrinter} className="flex gap-2 items-center">
        <input
          value={newPrinterName}
          onChange={(e) => setNewPrinterName(e.target.value)}
          placeholder="New virtual printer name..."
          className="xp-input flex-1 max-w-[260px]"
        />
        <button type="submit" className="xp-button">Add a printer</button>
      </form>

      <div className="border border-[#aca899] flex-1 min-h-[120px] overflow-y-auto xp-scroll">
        <div className="bg-[#ece9d8] px-2 py-1 font-bold flex items-center justify-between">
          <span>Print Queue ({system.printJobs.length} job(s))</span>
          <button
            type="button"
            onClick={() =>
              onUpdateSystem((prev) => ({
                ...prev,
                printJobs: prev.printJobs.filter((j) => j.status !== 'Completed'),
              }))
            }
            className="xp-button"
          >
            Clear Completed
          </button>
        </div>
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-[#d4d0c8] bg-[#faf9f5]">
              <th className="p-1.5">Document</th>
              <th className="p-1.5">App</th>
              <th className="p-1.5">Status</th>
              <th className="p-1.5">Action</th>
            </tr>
          </thead>
          <tbody>
            {system.printJobs.map((job) => (
              <tr key={job.id} className="border-b border-[#f0eee6]">
                <td className="p-1.5">{job.documentName}</td>
                <td className="p-1.5">{job.appName}</td>
                <td className={`p-1.5 font-bold ${job.status === 'Queued' ? 'text-[#b45309]' : 'text-[#1f622c]'}`}>
                  {job.status}
                </td>
                <td className="p-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateSystem((prev) => ({
                        ...prev,
                        printJobs: prev.printJobs.filter((j) => j.id !== job.id),
                      }))
                    }
                    className="xp-button"
                  >
                    Cancel
                  </button>
                </td>
              </tr>
            ))}
            {system.printJobs.length === 0 && (
              <tr>
                <td colSpan={4} className="p-3 text-center text-[#666666]">
                  Print queue is empty.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- 10. Scanners, Telephony, Add Hardware ---
export const ScannersAndCamerasDialog: React.FC<{
  onLaunchApp: (appId: AppId) => void;
  onClose: () => void;
}> = ({ onLaunchApp, onClose }) => (
  <div className="flex-1 min-h-0 flex flex-col bg-[#ece9d8] p-3 text-[11px] justify-between">
    <div className="bg-white border border-[#aca899] p-3 flex flex-col gap-2">
      <div className="font-bold text-[#0b3c8d]">Imaging Devices</div>
      <div>• Virtual USB Flatbed Scanner (Ready)</div>
      <button type="button" onClick={() => onLaunchApp('wiaacmgr')} className="xp-button xp-button-default self-start">
        Launch Scanner and Camera Wizard...
      </button>
    </div>
    <div className="flex justify-end pt-2">
      <button type="button" onClick={onClose} className="xp-button">Close</button>
    </div>
  </div>
);

export const PhoneModemOptionsDialog: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [areaCode, setAreaCode] = useState('425');
  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#ece9d8] p-3 text-[11px] justify-between">
      <div className="bg-[#f9f8f4] border border-[#919b9c] p-3 flex flex-col gap-2">
        <div className="font-bold">Dialing Rules &amp; Modems</div>
        <div>Modem: Agere Systems PCI Soft Modem (COM1)</div>
        <label className="flex items-center gap-2">
          <span>Area code:</span>
          <input value={areaCode} onChange={(e) => setAreaCode(e.target.value)} className="xp-input w-[70px]" />
        </label>
      </div>
      <div className="flex justify-end pt-2">
        <button type="button" onClick={onClose} className="xp-button xp-button-default">OK</button>
      </div>
    </div>
  );
};

export const AddHardwareWizardApp: React.FC<{
  system: SystemState;
  onClose: () => void;
}> = ({ system, onClose }) => {
  const [scanned, setScanned] = useState(false);
  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#ece9d8] p-4 text-[11px] justify-between">
      <div className="flex flex-col gap-2.5">
        <div className="font-bold text-[13px] text-[#0b3c8d]">Add Hardware Wizard</div>
        <p>Scan the simulated workstation hardware bus for Plug and Play devices.</p>
        <button type="button" onClick={() => setScanned(true)} className="xp-button xp-button-default self-start">
          Scan for Hardware Changes
        </button>
        {scanned && (
          <div className="bg-white border border-[#aca899] p-2 max-h-[150px] overflow-y-auto xp-scroll">
            <div className="font-bold text-[#1f622c] mb-1">All {system.hardwareDevices.length} devices detected and working properly:</div>
            {system.hardwareDevices.map((d) => (
              <div key={d.id}>• {d.name} ({d.enabled ? 'Enabled' : 'Disabled'})</div>
            ))}
          </div>
        )}
      </div>
      <div className="flex justify-end pt-2 border-t border-[#aca899]">
        <button type="button" onClick={onClose} className="xp-button">Close</button>
      </div>
    </div>
  );
};

// --- 11. Security Center, Windows Firewall, Automatic Updates ---
export const SecurityCenterApp: React.FC<{
  system: SystemState;
  onLaunchApp: (appId: AppId) => void;
}> = ({ system, onLaunchApp }) => (
  <div className="flex-1 min-h-0 flex flex-col bg-[#eef3fc] p-4 text-[11px] gap-3 overflow-y-auto xp-scroll">
    <div className="flex items-center gap-2 font-bold text-[14px] text-[#0b3c8d]">
      <XpIcon name="security_shield" size={28} />
      <span>Windows Security Center</span>
    </div>

    <div className="flex flex-col gap-2">
      <div className={`border p-2.5 bg-white flex items-center justify-between ${system.firewallEnabled ? 'border-[#22c55e]' : 'border-[#dc2626]'}`}>
        <div>
          <div className="font-bold">Firewall: {system.firewallEnabled ? 'ON' : 'OFF (At Risk)'}</div>
          <div className="text-[10px] text-[#555555]">Windows Firewall blocks unauthorized incoming connections.</div>
        </div>
        <button type="button" onClick={() => onLaunchApp('firewall')} className="xp-button">Change...</button>
      </div>

      <div className={`border p-2.5 bg-white flex items-center justify-between ${system.automaticUpdatesMode === 'Automatic' ? 'border-[#22c55e]' : 'border-[#f59e0b]'}`}>
        <div>
          <div className="font-bold">Automatic Updates: {system.automaticUpdatesMode}</div>
          <div className="text-[10px] text-[#555555]">Keeps Windows XP Professional SP3 up to date.</div>
        </div>
        <button type="button" onClick={() => onLaunchApp('auto_updates')} className="xp-button">Change...</button>
      </div>

      <div className="border border-[#22c55e] p-2.5 bg-white">
        <div className="font-bold">Virus Protection: Monitored (Simulated Workstation Baseline)</div>
      </div>
    </div>
  </div>
);

export const WindowsFirewallDialog: React.FC<DateTimeDialogProps> = ({
  system,
  onUpdateSystem,
  onClose,
}) => {
  const [enabled, setEnabled] = useState(system.firewallEnabled);

  const apply = () => {
    onUpdateSystem((prev) =>
      appendEventLog(
        { ...prev, firewallEnabled: enabled },
        {
          logType: 'Security',
          level: enabled ? 'Information' : 'Warning',
          source: 'SharedAccess',
          eventId: 5152,
          message: `Windows Firewall turned ${enabled ? 'ON' : 'OFF'}.`,
        }
      )
    );
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#ece9d8] p-3 text-[11px] justify-between">
      <div className="bg-[#f9f8f4] border border-[#919b9c] p-3 flex flex-col gap-2.5">
        <div className="flex items-center gap-2 font-bold text-[#0b3c8d]">
          <XpIcon name="firewall" size={24} />
          <span>Windows Firewall</span>
        </div>
        <label className="flex items-center gap-2 font-bold">
          <input type="radio" checked={enabled} onChange={() => setEnabled(true)} />
          <span>On (recommended)</span>
        </label>
        <label className="flex items-center gap-2 font-bold text-[#b91c1c]">
          <input type="radio" checked={!enabled} onChange={() => setEnabled(false)} />
          <span>Off (not recommended — shows Security Shield alert in Taskbar tray)</span>
        </label>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={() => { apply(); onClose(); }} className="xp-button xp-button-default min-w-[72px]">OK</button>
        <button type="button" onClick={onClose} className="xp-button min-w-[72px]">Cancel</button>
      </div>
    </div>
  );
};

export const AutomaticUpdatesDialog: React.FC<DateTimeDialogProps> = ({
  system,
  onUpdateSystem,
  onClose,
}) => {
  const [mode, setMode] = useState(system.automaticUpdatesMode);
  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#ece9d8] p-3 text-[11px] justify-between">
      <div className="bg-[#f9f8f4] border border-[#919b9c] p-3 flex flex-col gap-2">
        <div className="font-bold text-[#0b3c8d]">Automatic Updates</div>
        {(['Automatic', 'Notify', 'Off'] as const).map((m) => (
          <label key={m} className="flex items-center gap-2">
            <input type="radio" checked={mode === m} onChange={() => setMode(m)} />
            <span>
              {m === 'Automatic'
                ? 'Automatic (recommended)'
                : m === 'Notify'
                ? 'Notify me but do not automatically download or install'
                : 'Turn off Automatic Updates'}
            </span>
          </label>
        ))}
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={() => {
            onUpdateSystem((prev) => ({ ...prev, automaticUpdatesMode: mode }));
            onClose();
          }}
          className="xp-button xp-button-default"
        >
          OK
        </button>
        <button type="button" onClick={onClose} className="xp-button">Cancel</button>
      </div>
    </div>
  );
};

// --- 12. Administrative Tools Folder ---
export const AdministrativeToolsFolderApp: React.FC<{
  system: SystemState;
  onLaunchApp: (appId: AppId) => void;
}> = ({ system, onLaunchApp }) => {
  const tools = APP_REGISTRY.filter(
    (a) =>
      a.category === 'Administrative Tools' &&
      (!a.optionalComponentId || Boolean(system.optionalComponents[a.optionalComponentId]))
  );

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-white p-4 text-[11px] overflow-y-auto xp-scroll">
      <h2 className="text-[13px] font-bold text-[#0b3c8d] border-b border-[#6fa0e8] pb-1 mb-3">
        Administrative Tools
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {tools.map((tool) => (
          <button
            key={tool.id}
            type="button"
            onClick={() => onLaunchApp(tool.id)}
            className="flex items-start gap-2.5 p-2 rounded-[3px] border border-transparent hover:border-[#9ebde8] hover:bg-[#eef4fd] text-left cursor-default"
          >
            <XpIcon name={tool.iconName as XpIconName} size={28} />
            <div className="min-w-0">
              <div className="font-bold text-[#0b3c8d]">{tool.displayName}</div>
              <div className="text-[10px] text-[#555555]">{tool.description}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
