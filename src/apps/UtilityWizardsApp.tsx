import React, { useMemo, useState } from 'react';
import type { AppId, CompatibilityProfile, SystemState, VfsNode, VfsState } from '../types/os';
import { APP_REGISTRY } from '../state/appRegistry';
import { isFolderLike } from '../state/vfs';
import { XpIcon } from '../components/xp/XpIcons';

interface CompatWizardProps {
  system: SystemState;
  onUpdateSystem: (updater: (prev: SystemState) => SystemState) => void;
  onLaunchApp: (appId: AppId) => void;
  onClose: () => void;
}

export const ProgramCompatibilityWizardApp: React.FC<CompatWizardProps> = ({
  system,
  onUpdateSystem,
  onLaunchApp,
  onClose,
}) => {
  const candidates = useMemo(
    () => APP_REGISTRY.filter((a) => a.category === 'Accessories' || a.category === 'Games'),
    []
  );
  const [selectedApp, setSelectedApp] = useState<AppId>('pinball');
  const existing = system.compatibilityProfiles[selectedApp];
  const [mode, setMode] = useState<CompatibilityProfile['mode']>(
    existing?.mode ?? 'Windows 98 / Me'
  );
  const [colors256, setColors256] = useState<boolean>(existing?.colors256 ?? false);
  const [res640x480, setRes640x480] = useState<boolean>(existing?.res640x480 ?? false);
  const [disableThemes, setDisableThemes] = useState<boolean>(existing?.disableThemes ?? false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onUpdateSystem((prev) => ({
      ...prev,
      compatibilityProfiles: {
        ...prev.compatibilityProfiles,
        [selectedApp]: { mode, colors256, res640x480, disableThemes },
      },
    }));
    setSaved(true);
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#ece9d8] text-[11px]">
      <div className="bg-white border-b border-[#aca899] p-3 flex items-center justify-between">
        <div>
          <div className="font-bold text-[12px]">Program Compatibility Wizard</div>
          <div className="text-[#555]">Configure compatibility modes for older Windows programs.</div>
        </div>
        <XpIcon name="compat" size={32} />
      </div>

      <div className="flex-1 min-h-0 p-3.5 flex flex-col gap-3 overflow-auto">
        <label className="flex flex-col gap-1">
          <span className="font-bold">Program:</span>
          <select
            aria-label="Program"
            value={selectedApp}
            onChange={(e) => {
              const id = e.target.value as AppId;
              setSelectedApp(id);
              const prof = system.compatibilityProfiles[id];
              setMode(prof?.mode ?? 'Windows 98 / Me');
              setColors256(prof?.colors256 ?? false);
              setRes640x480(prof?.res640x480 ?? false);
              setDisableThemes(prof?.disableThemes ?? false);
              setSaved(false);
            }}
            className="xp-input h-[22px] bg-white"
          >
            {candidates.map((c) => (
              <option key={c.id} value={c.id}>
                {c.displayName}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="font-bold">Compatibility mode:</span>
          <select
            aria-label="Compatibility mode"
            value={mode}
            onChange={(e) => setMode(e.target.value as CompatibilityProfile['mode'])}
            className="xp-input h-[22px] bg-white"
          >
            <option value="None">None (Native Windows XP)</option>
            <option value="Windows 95">Windows 95</option>
            <option value="Windows 98 / Me">Windows 98 / Windows Me</option>
            <option value="Windows NT 4.0 (SP5)">Windows NT 4.0 (Service Pack 5)</option>
            <option value="Windows 2000">Windows 2000</option>
          </select>
        </label>

        <div className="flex flex-col gap-1.5 pt-1">
          <span className="font-bold">Display settings:</span>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={colors256}
              onChange={(e) => setColors256(e.target.checked)}
            />
            <span>Run in 256 colors</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={res640x480}
              onChange={(e) => setRes640x480(e.target.checked)}
            />
            <span>Run in 640 x 480 screen resolution</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={disableThemes}
              onChange={(e) => setDisableThemes(e.target.checked)}
            />
            <span>Disable visual themes</span>
          </label>
        </div>

        {saved && (
          <div className="bg-[#eef4fd] border border-[#8db4f5] p-2 text-[#00309c] flex items-center justify-between">
            <span>Compatibility profile saved for {selectedApp}.</span>
            <button
              type="button"
              onClick={() => onLaunchApp(selectedApp)}
              className="xp-button px-2.5"
            >
              Test Program
            </button>
          </div>
        )}
      </div>

      <div className="h-[42px] shrink-0 border-t border-[#aca899] px-3 flex items-center justify-end gap-2">
        <button type="button" onClick={handleSave} className="xp-button xp-button-default min-w-[74px]">
          Apply
        </button>
        <button type="button" onClick={onClose} className="xp-button min-w-[74px]">
          Close
        </button>
      </div>
    </div>
  );
};

interface SynchronizeAppProps {
  system: SystemState;
  onUpdateSystem: (updater: (prev: SystemState) => SystemState) => void;
  onClose: () => void;
}

export const SynchronizeApp: React.FC<SynchronizeAppProps> = ({
  system,
  onUpdateSystem,
  onClose,
}) => {
  const [syncing, setSyncing] = useState(false);

  const toggleItem = (id: string) => {
    onUpdateSystem((prev) => ({
      ...prev,
      offlineSyncItems: prev.offlineSyncItems.map((it) =>
        it.id === id ? { ...it, enabled: !it.enabled } : it
      ),
    }));
  };

  const runSync = () => {
    setSyncing(true);
    window.setTimeout(() => {
      const now = Date.now();
      onUpdateSystem((prev) => ({
        ...prev,
        offlineSyncItems: prev.offlineSyncItems.map((it) =>
          it.enabled ? { ...it, lastSyncedAt: now } : it
        ),
      }));
      setSyncing(false);
    }, 350);
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#ece9d8] p-3 gap-2.5 text-[11px]">
      <div className="flex items-center gap-2.5">
        <XpIcon name="sync" size={28} />
        <div>Select the check boxes for the offline items you want to synchronize:</div>
      </div>

      <div className="flex-1 min-h-0 bg-white border border-[#7f9db9] overflow-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-[#f4f2eb] border-b border-[#d4d0c8]">
              <th className="py-1 px-2 font-normal">Item</th>
              <th className="py-1 px-2 font-normal">Location</th>
              <th className="py-1 px-2 font-normal">Last Synchronized</th>
            </tr>
          </thead>
          <tbody>
            {system.offlineSyncItems.map((it) => (
              <tr key={it.id} className="border-b border-[#f0ede4]">
                <td className="py-1.5 px-2">
                  <label className="flex items-center gap-2 cursor-default">
                    <input
                      type="checkbox"
                      checked={it.enabled}
                      onChange={() => toggleItem(it.id)}
                    />
                    <span>{it.label}</span>
                  </label>
                </td>
                <td className="py-1.5 px-2 text-[#555]">{it.location}</td>
                <td className="py-1.5 px-2 text-[#444]">
                  {it.lastSyncedAt ? new Date(it.lastSyncedAt).toLocaleTimeString() : 'Never'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          disabled={syncing}
          onClick={runSync}
          className="xp-button xp-button-default min-w-[84px]"
        >
          {syncing ? 'Synchronizing...' : 'Synchronize'}
        </button>
        <button type="button" onClick={onClose} className="xp-button min-w-[74px]">
          Close
        </button>
      </div>
    </div>
  );
};

interface CdWritingWizardProps {
  vfs: VfsState;
  system: SystemState;
  onUpdateSystem: (updater: (prev: SystemState) => SystemState) => void;
  onClose: () => void;
}

export const CdWritingWizardApp: React.FC<CdWritingWizardProps> = ({
  vfs,
  system,
  onUpdateSystem,
  onClose,
}) => {
  const allFiles = useMemo(
    () => Object.values(vfs.nodes).filter((n): n is VfsNode => !isFolderLike(n) && Boolean(n.parentId)),
    [vfs.nodes]
  );
  const [stagedIds, setStagedIds] = useState<string[]>(() =>
    system.cdStagingNodeIds.length > 0 ? system.cdStagingNodeIds : allFiles.slice(0, 2).map((f) => f.id)
  );
  const [cdName, setCdName] = useState(
    system.burnedCdVolumeName ?? new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
  );
  const [done, setDone] = useState(false);

  const toggleStage = (id: string) => {
    setStagedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleBurn = () => {
    const files = stagedIds
      .map((id) => vfs.nodes[id])
      .filter((n): n is VfsNode => Boolean(n) && !isFolderLike(n))
      .map((n) => ({ name: n.name, kind: n.kind, content: n.content }));

    onUpdateSystem((prev) => ({
      ...prev,
      cdStagingNodeIds: [],
      burnedCdVolumeName: cdName.trim() || 'XP_DATA_CD',
      burnedCdFiles: files,
    }));
    setDone(true);
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#ece9d8] text-[11px]">
      <div className="bg-white border-b border-[#aca899] p-3 flex items-center justify-between">
        <div>
          <div className="font-bold text-[12px]">CD Writing Wizard</div>
          <div className="text-[#555]">Write staged virtual files to CD-RW Drive (D:).</div>
        </div>
        <XpIcon name="cd_drive" size={32} />
      </div>

      <div className="flex-1 min-h-0 p-3 flex flex-col gap-3 overflow-auto">
        {done ? (
          <div className="bg-white border border-[#aca899] p-4 flex flex-col gap-2">
            <div className="font-bold text-[#215dc6]">Completing the CD Writing Wizard</div>
            <p>
              Virtual disc <strong>{cdName}</strong> was successfully written to{' '}
              <strong>CD-RW Drive (D:)</strong>. Open My Computer -&gt; CD-RW Drive (D:) to inspect the burned files.
            </p>
          </div>
        ) : (
          <>
            <label className="flex items-center gap-2">
              <span className="font-bold shrink-0">CD name:</span>
              <input
                type="text"
                maxLength={16}
                value={cdName}
                onChange={(e) => setCdName(e.target.value)}
                className="xp-input h-[22px] bg-white flex-1"
              />
            </label>
            <div className="flex-1 min-h-0 bg-white border border-[#7f9db9] p-2 overflow-y-auto flex flex-col gap-1">
              <div className="font-bold mb-1">Files ready to be written to the CD:</div>
              {allFiles.map((f) => (
                <label key={f.id} className="flex items-center gap-2 cursor-default">
                  <input
                    type="checkbox"
                    checked={stagedIds.includes(f.id)}
                    onChange={() => toggleStage(f.id)}
                  />
                  <span className="truncate">{f.name}</span>
                </label>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="h-[42px] shrink-0 border-t border-[#aca899] px-3 flex items-center justify-end gap-2">
        {done ? (
          <button type="button" onClick={onClose} className="xp-button xp-button-default min-w-[74px]">
            Finish
          </button>
        ) : (
          <>
            <button
              type="button"
              disabled={stagedIds.length === 0}
              onClick={handleBurn}
              className="xp-button xp-button-default min-w-[90px]"
            >
              Write to CD
            </button>
            <button type="button" onClick={onClose} className="xp-button min-w-[74px]">
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
};
