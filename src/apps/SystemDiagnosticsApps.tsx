import React, { useMemo, useState } from 'react';
import type {
  AppId,
  ModalPromptRequest,
  NodeKind,
  RegistryValue,
  RestorePoint,
  ScheduledTaskItem,
  SystemState,
  VfsNode,
  VfsState,
  WindowInstance,
} from '../types/os';
import {
  SYSTEM_IDS,
  computeDiskCleanupStats,
  purgeTempFiles,
} from '../state/vfs';
import { appendEventLog } from '../state/systemState';
import { XpIcon } from '../components/xp/XpIcons';

// --- 1. System Information (msinfo32) ---
export const SystemInfoApp: React.FC<{ system: SystemState; vfs: VfsState }> = ({
  system,
  vfs,
}) => {
  const [cat, setCat] = useState<'summary' | 'hardware' | 'software' | 'env'>('summary');
  const [filter, setFilter] = useState('');

  const rows: Array<[string, string]> = useMemo(() => {
    if (cat === 'summary') {
      return [
        ['OS Name', 'Microsoft Windows XP Professional'],
        ['Version', '5.1.2600 Service Pack 3 Build 2600'],
        ['System Name', system.computerName],
        ['Registered Owner', system.registeredOwner],
        ['Active User', system.activeUsername],
        ['Processor', 'x86 Family 15 Model 2 Stepping 9 GenuineIntel ~3000 MHz'],
        ['Total Physical Memory', '2,048.00 MB (Simulated)'],
        ['VFS Nodes Stored', String(Object.keys(vfs.nodes).length)],
        ['Time Zone', system.regionalOptions.timezone],
      ];
    }
    if (cat === 'hardware') {
      return system.hardwareDevices.map((d) => [d.category, `${d.name} (${d.enabled ? 'OK' : 'Disabled'})`]);
    }
    if (cat === 'software') {
      return system.services.map((s) => [s.displayName, `${s.status} (${s.startupType})`]);
    }
    return [
      ['TEMP', 'C:\\WINDOWS\\Temp'],
      ['USERNAME', system.activeUsername],
      ['COMPUTERNAME', system.computerName],
      ['OS', 'Windows_NT'],
    ];
  }, [cat, system, vfs.nodes]);

  const filtered = rows.filter(
    ([k, v]) =>
      !filter.trim() ||
      k.toLowerCase().includes(filter.toLowerCase()) ||
      v.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#ece9d8] text-[11px]">
      <div className="flex-1 min-h-0 flex">
        <aside className="w-[175px] bg-white border-r border-[#aca899] p-1.5 flex flex-col gap-1">
          {(
            [
              ['summary', 'System Summary'],
              ['hardware', 'Hardware Resources'],
              ['software', 'Running Services'],
              ['env', 'Environment Variables'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setCat(id)}
              className={`text-left px-2 py-1 rounded-[2px] cursor-default ${
                cat === id ? 'bg-[#316ac5] text-white font-bold' : 'hover:bg-[#eef4fd]'
              }`}
            >
              {label}
            </button>
          ))}
        </aside>
        <div className="flex-1 bg-white overflow-y-auto xp-scroll">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-[#ece9d8] border-b border-[#aca899]">
                <th className="p-1.5 w-[42%]">Item</th>
                <th className="p-1.5">Value</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(([k, v], i) => (
                <tr key={i} className="border-b border-[#f0eee6]">
                  <td className="p-1.5 font-bold">{k}</td>
                  <td className="p-1.5">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="p-1.5 border-t border-[#aca899] flex items-center gap-2">
        <label htmlFor="msinfo-find">Find what:</label>
        <input id="msinfo-find" value={filter} onChange={(e) => setFilter(e.target.value)} className="xp-input flex-1 max-w-[240px]" />
      </div>
    </div>
  );
};

// --- 2. DirectX Diagnostic Tool (dxdiag) ---
export const DxDiagApp: React.FC<{ system: SystemState; onClose: () => void }> = ({
  system,
  onClose,
}) => {
  const [tab, setTab] = useState<'system' | 'display' | 'sound' | 'network'>('system');
  const [testNote, setTestNote] = useState('No problems found.');

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#ece9d8] p-2.5 text-[11px] justify-between">
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="flex gap-1 pl-1">
          {(['system', 'display', 'sound', 'network'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-3 py-1 rounded-t-[3px] border border-b-0 border-[#919b9c] cursor-default ${
                tab === t ? 'bg-[#f9f8f4] font-bold relative z-10 -mb-[1px]' : 'bg-[#e3e0d3]'
              }`}
            >
              {t[0].toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex-1 bg-[#f9f8f4] border border-[#919b9c] p-3 flex flex-col gap-2">
          {tab === 'system' && (
            <>
              <div><strong>Computer Name:</strong> {system.computerName}</div>
              <div><strong>Operating System:</strong> Microsoft Windows XP Professional (5.1, Build 2600)</div>
              <div><strong>Processor:</strong> Intel(R) Pentium(R) 4 CPU 3.00GHz</div>
              <div><strong>DirectX Version:</strong> DirectX 9.0c (4.09.0000.0904)</div>
            </>
          )}
          {tab === 'display' && (
            <>
              <div><strong>Name:</strong> RADEON 9800 PRO (Simulated Direct3D)</div>
              <div><strong>DirectDraw / Direct3D Acceleration:</strong> Enabled</div>
              <button type="button" onClick={() => setTestNote('Direct3D 9 spinning cube test passed.')} className="xp-button self-start">
                Test Direct3D
              </button>
            </>
          )}
          {tab === 'sound' && (
            <>
              <div><strong>Name:</strong> SoundMAX Integrated Digital Audio</div>
              <div><strong>Hardware Sound Acceleration:</strong> Full Acceleration</div>
              <button type="button" onClick={() => setTestNote('DirectSound buffer test passed.')} className="xp-button self-start">
                Test DirectSound
              </button>
            </>
          )}
          {tab === 'network' && (
            <>
              <div><strong>Active Adapters:</strong> {system.networkConnections.filter((c) => c.status === 'Connected').length}</div>
              <div><strong>DirectPlay Service Providers:</strong> TCP/IP, Serial Modem</div>
            </>
          )}
          <div className="mt-auto bg-white border border-[#aca899] p-2">
            <strong>Notes:</strong> {testNote}
          </div>
        </div>
      </div>
      <div className="flex justify-end pt-2">
        <button type="button" onClick={onClose} className="xp-button xp-button-default">Exit</button>
      </div>
    </div>
  );
};

// --- 3. Disk Cleanup (cleanmgr) ---
interface DiskCleanupAppProps {
  vfs: VfsState;
  onCommitVfs: (next: VfsState) => void;
  onUpdateSystem: (updater: (prev: SystemState) => SystemState) => void;
  onClose: () => void;
}

export const DiskCleanupApp: React.FC<DiskCleanupAppProps> = ({
  vfs,
  onCommitVfs,
  onUpdateSystem,
  onClose,
}) => {
  const stats = computeDiskCleanupStats(vfs);
  const [cleanTemp, setCleanTemp] = useState(true);
  const [cleanBin, setCleanBin] = useState(true);

  const totalSelectedBytes =
    (cleanTemp ? stats.tempBytes : 0) + (cleanBin ? stats.trashBytes : 0);

  const handleClean = () => {
    let next = vfs;
    let freedBytes = 0;
    if (cleanTemp) {
      freedBytes += stats.tempBytes;
      next = purgeTempFiles(next);
    }
    if (cleanBin) {
      freedBytes += stats.trashBytes;
      next = { ...next, trash: [] };
    }
    onCommitVfs(next);
    const freedMb = Math.max(1, Math.round(freedBytes / (1024 * 1024)));
    onUpdateSystem((prev) =>
      appendEventLog(
        { ...prev, diskUsedOffsetMb: Math.max(1200, prev.diskUsedOffsetMb - freedMb) },
        {
          logType: 'Application',
          level: 'Information',
          source: 'DiskCleanup',
          eventId: 2010,
          message: `Disk Cleanup freed ${(freedBytes / 1024).toFixed(1)} KB from Local Disk (C:).`,
        }
      )
    );
    onClose();
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#ece9d8] p-3 text-[11px] justify-between gap-2">
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center gap-2 font-bold text-[#0b3c8d]">
          <XpIcon name="cleanmgr" size={26} />
          <span>Disk Cleanup for Local Disk (C:)</span>
        </div>
        <p>You can use Disk Cleanup to free up to {Math.max(1, Math.ceil((stats.tempBytes + stats.trashBytes) / 1024))} KB of disk space on (C:).</p>
        <div className="bg-white border border-[#7f9db9] p-2 flex flex-col gap-1.5">
          <label className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <input type="checkbox" checked={cleanTemp} onChange={(e) => setCleanTemp(e.target.checked)} />
              <span>Temporary files ({stats.tempFiles.length} item(s))</span>
            </span>
            <span>{Math.ceil(stats.tempBytes / 1024)} KB</span>
          </label>
          <label className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <input type="checkbox" checked={cleanBin} onChange={(e) => setCleanBin(e.target.checked)} />
              <span>Recycle Bin ({vfs.trash.length} item(s))</span>
            </span>
            <span>{Math.ceil(stats.trashBytes / 1024)} KB</span>
          </label>
        </div>
        <div className="font-bold">
          Total amount of disk space you gain: {Math.ceil(totalSelectedBytes / 1024)} KB
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-[#aca899]">
        <button type="button" onClick={handleClean} className="xp-button xp-button-default min-w-[74px]">
          OK
        </button>
        <button type="button" onClick={onClose} className="xp-button min-w-[74px]">
          Cancel
        </button>
      </div>
    </div>
  );
};

// --- 4. Disk Defragmenter (dfrg) ---
export const DiskDefragApp: React.FC<{
  system: SystemState;
  onUpdateSystem: (updater: (prev: SystemState) => SystemState) => void;
}> = ({ system, onUpdateSystem }) => {
  const [blocks, setBlocks] = useState<number[]>(() =>
    Array.from({ length: 64 }, (_, i) => (i % 7 === 0 ? 2 : i % 3 === 0 ? 1 : i < 42 ? 1 : 0))
  );
  const [status, setStatus] = useState(
    system.lastDiskDefragAt ? 'Drive (C:) defragmented recently.' : 'Ready — select Analyze or Defragment.'
  );

  const analyze = () => {
    const fragCount = blocks.filter((b) => b === 2).length;
    setStatus(`Analysis Complete: ${Math.round((fragCount / 64) * 100)}% fragmented.`);
  };

  const defrag = () => {
    const used = blocks.filter((b) => b !== 0).length;
    setBlocks(Array.from({ length: 64 }, (_, i) => (i < used ? 1 : 0)));
    setStatus('Defragmentation Complete on Local Disk (C:).');
    onUpdateSystem((prev) => ({ ...prev, lastDiskDefragAt: Date.now() }));
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#ece9d8] p-3 text-[11px] gap-3">
      <div className="bg-white border border-[#aca899] p-2">
        <div className="font-bold">Volume: Local Disk (C:) — NTFS — 80.0 GB</div>
      </div>
      <div className="bg-white border border-[#aca899] p-2">
        <div className="font-bold mb-1">Cluster Allocation Map:</div>
        <div className="grid grid-cols-16 gap-0.5">
          {blocks.map((b, i) => (
            <div
              key={i}
              className="h-[14px]"
              style={{ backgroundColor: b === 2 ? '#ef4444' : b === 1 ? '#2563eb' : '#e5e7eb' }}
            />
          ))}
        </div>
        <div className="text-[10px] mt-1.5 text-[#444444]">
          Red = Fragmented • Blue = Contiguous • Gray = Free Space
        </div>
      </div>
      <div className="flex gap-2 items-center">
        <button type="button" onClick={analyze} className="xp-button">Analyze</button>
        <button type="button" onClick={defrag} className="xp-button xp-button-default">Defragment</button>
        <span className="ml-auto font-bold text-[#0b3c8d]">{status}</span>
      </div>
    </div>
  );
};

// --- 5. Check Disk (chkdsk) ---
export const CheckDiskApp: React.FC<{ vfs: VfsState; onClose: () => void }> = ({
  vfs,
  onClose,
}) => {
  const [result, setResult] = useState<string | null>(null);
  const runScan = () => {
    const nodes = Object.values(vfs.nodes);
    const orphans = nodes.filter((n) => n.parentId && !vfs.nodes[n.parentId]).length;
    setResult(
      `CHKDSK is verifying files (stage 1 of 3)...\n` +
        `Verified ${nodes.length} virtual file system entries.\n` +
        `Orphaned links found: ${orphans}.\n` +
        `Windows has checked the virtual file system and found ${orphans === 0 ? 'no problems' : `${orphans} issue(s)`}.`
    );
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#ece9d8] p-3 text-[11px] justify-between gap-2">
      <div className="flex flex-col gap-2">
        <div className="font-bold text-[#0b3c8d]">Checking Local Disk (C:)</div>
        <button type="button" onClick={runScan} className="xp-button xp-button-default self-start">
          Start Check Disk Scan
        </button>
        {result && (
          <pre className="bg-white border border-[#7f9db9] p-2 font-mono text-[10px] whitespace-pre-wrap">
            {result}
          </pre>
        )}
      </div>
      <div className="flex justify-end">
        <button type="button" onClick={onClose} className="xp-button">Close</button>
      </div>
    </div>
  );
};

// --- 6. System Restore (rstrui) ---
export const SystemRestoreApp: React.FC<{
  system: SystemState;
  onUpdateSystem: (updater: (prev: SystemState) => SystemState) => void;
  onSyncAppearance: (appearance: SystemState['users'][0]['appearance']) => void;
  onOpenModal: (modal: Omit<ModalPromptRequest, 'id'>) => void;
}> = ({ system, onUpdateSystem, onSyncAppearance, onOpenModal }) => {
  const [pointName, setPointName] = useState('Before Software Change');
  const [selectedRpId, setSelectedRpId] = useState<string>(system.restorePoints[0]?.id ?? '');

  const createPoint = (e: React.FormEvent) => {
    e.preventDefault();
    const activeUser = system.users.find((u) => u.username === system.activeUsername) ?? system.users[0];
    const rp: RestorePoint = {
      id: `rp_${Date.now()}`,
      name: pointName.trim() || 'Manual Checkpoint',
      createdAt: Date.now(),
      snapshot: {
        folderOptions: { ...system.folderOptions },
        regionalOptions: { ...system.regionalOptions },
        accessibility: { ...system.accessibility },
        fileAssociations: { ...system.fileAssociations },
        optionalComponents: { ...system.optionalComponents },
        groupPolicy: { ...system.groupPolicy },
        taskbarPrefs: { ...system.taskbarPrefs },
        appearance: { ...activeUser.appearance },
      },
    };
    onUpdateSystem((prev) => ({ ...prev, restorePoints: [rp, ...prev.restorePoints] }));
    setSelectedRpId(rp.id);
    setPointName('');
  };

  const restoreSelected = () => {
    const rp = system.restorePoints.find((r) => r.id === selectedRpId);
    if (!rp) return;
    onUpdateSystem((prev) =>
      appendEventLog(
        {
          ...prev,
          folderOptions: { ...rp.snapshot.folderOptions },
          regionalOptions: { ...rp.snapshot.regionalOptions },
          accessibility: { ...rp.snapshot.accessibility },
          fileAssociations: { ...rp.snapshot.fileAssociations },
          optionalComponents: { ...rp.snapshot.optionalComponents },
          groupPolicy: { ...rp.snapshot.groupPolicy },
          taskbarPrefs: { ...rp.snapshot.taskbarPrefs },
          users: prev.users.map((u) =>
            u.username === prev.activeUsername ? { ...u, appearance: rp.snapshot.appearance } : u
          ),
        },
        {
          logType: 'System',
          level: 'Information',
          source: 'sr',
          eventId: 110,
          message: `System Restore reverted settings to "${rp.name}" while preserving personal documents.`,
        }
      )
    );
    onSyncAppearance(rp.snapshot.appearance);
    onOpenModal({
      kind: 'alert',
      icon: 'info',
      title: 'System Restore',
      message: `Restoration to "${rp.name}" complete.\nYour personal documents in My Documents were left intact.`,
    });
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#eef3fc] p-3 text-[11px] gap-3">
      <div className="font-bold text-[13px] text-[#0b3c8d]">System Restore</div>
      <form onSubmit={createPoint} className="bg-white border border-[#9ebde8] p-2.5 flex gap-2 items-center">
        <input
          value={pointName}
          onChange={(e) => setPointName(e.target.value)}
          placeholder="Restore point description..."
          className="xp-input flex-1"
        />
        <button type="submit" className="xp-button xp-button-default">Create a Restore Point</button>
      </form>

      <div className="flex-1 min-h-0 bg-white border border-[#9ebde8] p-2 overflow-y-auto xp-scroll flex flex-col gap-1">
        <div className="font-bold mb-1">Select a Restore Point (Settings Snapshot):</div>
        {system.restorePoints.map((rp) => (
          <label key={rp.id} className="flex items-center gap-2 p-1 hover:bg-[#eef4fd]">
            <input type="radio" checked={selectedRpId === rp.id} onChange={() => setSelectedRpId(rp.id)} />
            <span>
              <strong>{rp.name}</strong> — {new Date(rp.createdAt).toLocaleString()}
            </span>
          </label>
        ))}
      </div>

      <button type="button" onClick={restoreSelected} className="xp-button xp-button-default self-end">
        Restore My Computer to Selected Point
      </button>
    </div>
  );
};

// --- 7. Backup Utility (ntbackup) & Files/Settings Transfer (migwiz) ---
export const BackupUtilityApp: React.FC<{
  vfs: VfsState;
  system: SystemState;
  onSaveFile: (params: {
    parentId: string;
    name: string;
    content: string;
    kind: Exclude<NodeKind, 'folder' | 'drive' | 'system'>;
    mimeType: string;
    allowOverwrite?: boolean;
  }) => { ok: boolean; node?: VfsNode; error?: string };
  onUpdateSystem: (updater: (prev: SystemState) => SystemState) => void;
  onOpenModal: (modal: Omit<ModalPromptRequest, 'id'>) => void;
}> = ({ vfs, system, onSaveFile, onUpdateSystem, onOpenModal }) => {
  const activeUser = system.users.find((u) => u.username === system.activeUsername) ?? system.users[0];
  const docsId = activeUser?.docsFolderId ?? SYSTEM_IDS.MY_DOCUMENTS;
  const userFiles = Object.values(vfs.nodes).filter(
    (n) => (n.kind === 'text' || n.kind === 'rtf' || n.kind === 'image') && Boolean(n.parentId)
  );
  const existingBackup = Object.values(vfs.nodes).find(
    (n) => n.name.toLowerCase() === 'backup.bkf' && Boolean(n.parentId)
  );

  const backupEntries = useMemo(() => {
    if (!existingBackup?.content) return [];
    try {
      const parsed = JSON.parse(existingBackup.content) as {
        files?: Array<{ name: string; kind: Exclude<NodeKind, 'folder' | 'drive' | 'system'>; content?: string }>;
      };
      return Array.isArray(parsed.files) ? parsed.files : [];
    } catch {
      return [];
    }
  }, [existingBackup]);

  const createBackup = () => {
    const payload = JSON.stringify({
      createdAt: Date.now(),
      files: userFiles.map((f) => ({ name: f.name, kind: f.kind, content: f.content })),
    });
    const res = onSaveFile({
      parentId: docsId,
      name: 'Backup.bkf',
      content: payload,
      kind: 'archive',
      mimeType: 'application/octet-stream',
      allowOverwrite: true,
    });
    if (res.ok) {
      onUpdateSystem((prev) => ({ ...prev, lastBackupAt: Date.now() }));
      onOpenModal({
        kind: 'alert',
        icon: 'info',
        title: 'Backup Utility',
        message: `Backed up ${userFiles.length} file(s) to My Documents\\Backup.bkf.`,
      });
    }
  };

  const restoreBackup = () => {
    if (backupEntries.length === 0) return;
    let restored = 0;
    for (const item of backupEntries) {
      const res = onSaveFile({
        parentId: docsId,
        name: item.name,
        content: item.content ?? '',
        kind: item.kind,
        mimeType: item.kind === 'image' ? 'image/png' : item.kind === 'rtf' ? 'application/rtf' : 'text/plain',
        allowOverwrite: true,
      });
      if (res.ok) restored += 1;
    }
    onOpenModal({
      kind: 'alert',
      icon: 'info',
      title: 'Backup Utility',
      message: `Restored ${restored} file(s) from Backup.bkf into My Documents.`,
    });
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#ece9d8] p-3 text-[11px] gap-3">
      <div className="font-bold text-[13px] text-[#0b3c8d]">Backup or Restore Wizard</div>
      <p>Back up user documents and pictures into a portable <code>.bkf</code> archive in My Documents, or restore from an existing backup.</p>
      <div className="bg-white border border-[#aca899] p-2">
        Files ready for backup: <strong>{userFiles.length}</strong>
        {system.lastBackupAt && (
          <span className="ml-3 text-[#555555]">
            Last backup: {new Date(system.lastBackupAt).toLocaleString()}
          </span>
        )}
      </div>
      <div className="flex gap-2 flex-wrap">
        <button type="button" onClick={createBackup} className="xp-button xp-button-default">
          Create Backup.bkf in My Documents
        </button>
        <button
          type="button"
          disabled={backupEntries.length === 0}
          onClick={restoreBackup}
          className="xp-button"
        >
          Restore from Backup.bkf ({backupEntries.length})
        </button>
      </div>
      {backupEntries.length > 0 && (
        <div className="flex-1 min-h-0 bg-white border border-[#aca899] p-2 overflow-y-auto xp-scroll">
          <div className="font-bold mb-1">Contents of {existingBackup?.name}:</div>
          {backupEntries.map((entry, idx) => (
            <div key={idx} className="py-0.5 border-b border-[#f0eee6]">
              • {entry.name} ({entry.kind})
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const TransferWizardApp: React.FC<{
  system: SystemState;
  onUpdateSystem: (updater: (prev: SystemState) => SystemState) => void;
}> = ({ system, onUpdateSystem }) => {
  const [exported, setExported] = useState('');
  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#ece9d8] p-3 text-[11px] gap-2">
      <div className="font-bold text-[13px] text-[#0b3c8d]">Files and Settings Transfer Wizard</div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() =>
            setExported(
              JSON.stringify(
                {
                  folderOptions: system.folderOptions,
                  regionalOptions: system.regionalOptions,
                  powerScheme: system.powerScheme,
                },
                null,
                2
              )
            )
          }
          className="xp-button xp-button-default"
        >
          Export Settings Package
        </button>
        <button
          type="button"
          disabled={!exported.trim()}
          onClick={() => {
            try {
              const parsed = JSON.parse(exported) as Partial<SystemState>;
              onUpdateSystem((prev) => ({ ...prev, ...parsed }));
            } catch {
              // ignore invalid JSON
            }
          }}
          className="xp-button"
        >
          Import Package
        </button>
      </div>
      <textarea
        value={exported}
        onChange={(e) => setExported(e.target.value)}
        rows={8}
        className="xp-input font-mono flex-1"
        placeholder="Exported settings JSON appears here..."
      />
    </div>
  );
};

// --- 8. Scheduled Tasks (schtasks) ---
export const ScheduledTasksApp: React.FC<{
  system: SystemState;
  onUpdateSystem: (updater: (prev: SystemState) => SystemState) => void;
  onLaunchApp: (appId: AppId) => void;
}> = ({ system, onUpdateSystem, onLaunchApp }) => {
  const [name, setName] = useState('Daily Notepad Check');
  const [appId, setAppId] = useState<AppId>('notepad');

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    const t: ScheduledTaskItem = {
      id: `task_${Date.now()}`,
      name: name.trim() || 'Custom Task',
      appId,
      scheduleText: 'Daily at 9:00 AM (while browser open)',
      enabled: true,
      lastRunAt: null,
    };
    onUpdateSystem((prev) => ({ ...prev, scheduledTasks: [...prev.scheduledTasks, t] }));
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-white p-3 text-[11px] gap-3">
      <div className="font-bold text-[13px] text-[#0b3c8d]">Scheduled Tasks</div>
      <form onSubmit={addTask} className="flex gap-2 flex-wrap">
        <input value={name} onChange={(e) => setName(e.target.value)} className="xp-input flex-1 min-w-[140px]" />
        <select value={appId} onChange={(e) => setAppId(e.target.value as AppId)} className="xp-input">
          <option value="notepad">Notepad</option>
          <option value="cleanmgr">Disk Cleanup</option>
          <option value="calc" disabled>---</option>
          <option value="calculator">Calculator</option>
          <option value="dfrg">Disk Defragmenter</option>
        </select>
        <button type="submit" className="xp-button xp-button-default">Add Task</button>
      </form>

      <div className="flex-1 overflow-y-auto xp-scroll border border-[#aca899]">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-[#ece9d8] border-b border-[#aca899]">
              <th className="p-1.5">Name</th>
              <th className="p-1.5">Schedule</th>
              <th className="p-1.5">Actions</th>
            </tr>
          </thead>
          <tbody>
            {system.scheduledTasks.map((t) => (
              <tr key={t.id} className="border-b border-[#f0eee6]">
                <td className="p-1.5 font-bold">{t.name}</td>
                <td className="p-1.5">{t.scheduleText}</td>
                <td className="p-1.5 flex gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateSystem((prev) => ({
                        ...prev,
                        scheduledTasks: prev.scheduledTasks.map((x) =>
                          x.id === t.id ? { ...x, lastRunAt: Date.now() } : x
                        ),
                      }));
                      onLaunchApp(t.appId);
                    }}
                    className="xp-button"
                  >
                    Run
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateSystem((prev) => ({
                        ...prev,
                        scheduledTasks: prev.scheduledTasks.filter((x) => x.id !== t.id),
                      }))
                    }
                    className="xp-button"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- 9. Windows Task Manager (taskmgr) ---
interface TaskManagerAppProps {
  windows: WindowInstance[];
  system: SystemState;
  onFocusWindow: (winId: string) => void;
  onEndTaskWindow: (winId: string) => void;
  onLaunchApp: (appId: AppId) => void;
}

export const TaskManagerApp: React.FC<TaskManagerAppProps> = ({
  windows,
  system,
  onFocusWindow,
  onEndTaskWindow,
  onLaunchApp,
}) => {
  const [tab, setTab] = useState<'apps' | 'processes' | 'perf'>('apps');
  const [selectedWinId, setSelectedWinId] = useState<string>(windows[0]?.id ?? '');

  const runningApps = windows.filter((w) => w.appId !== 'taskmgr');

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#ece9d8] p-2.5 text-[11px] gap-2">
      <div className="flex gap-1 pl-1">
        {(
          [
            ['apps', 'Applications'],
            ['processes', 'Processes'],
            ['perf', 'Performance'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`px-3 py-1 rounded-t-[3px] border border-b-0 border-[#919b9c] cursor-default ${
              tab === id ? 'bg-[#f9f8f4] font-bold relative z-10 -mb-[1px]' : 'bg-[#e3e0d3]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 bg-[#f9f8f4] border border-[#919b9c] p-2 flex flex-col gap-2">
        {tab === 'apps' && (
          <>
            <div className="flex-1 bg-white border border-[#7f9db9] overflow-y-auto xp-scroll">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-[#ece9d8] border-b border-[#aca899]">
                    <th className="p-1.5">Task</th>
                    <th className="p-1.5 w-[90px]">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {runningApps.map((w) => (
                    <tr
                      key={w.id}
                      onClick={() => setSelectedWinId(w.id)}
                      className={`cursor-default ${
                        selectedWinId === w.id ? 'bg-[#316ac5] text-white' : 'hover:bg-[#eef4fd]'
                      }`}
                    >
                      <td className="p-1.5 truncate">{w.title}</td>
                      <td className="p-1.5">Running</td>
                    </tr>
                  ))}
                  {runningApps.length === 0 && (
                    <tr>
                      <td colSpan={2} className="p-3 text-center text-[#666666]">
                        No other applications running.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                disabled={!selectedWinId}
                onClick={() => selectedWinId && onEndTaskWindow(selectedWinId)}
                className="xp-button"
              >
                End Task
              </button>
              <button
                type="button"
                disabled={!selectedWinId}
                onClick={() => selectedWinId && onFocusWindow(selectedWinId)}
                className="xp-button"
              >
                Switch To
              </button>
              <button type="button" onClick={() => onLaunchApp('run')} className="xp-button xp-button-default">
                New Task...
              </button>
            </div>
          </>
        )}

        {tab === 'processes' && (
          <div className="flex-1 bg-white border border-[#7f9db9] overflow-y-auto xp-scroll">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-[#ece9d8] border-b border-[#aca899]">
                  <th className="p-1.5">Image Name</th>
                  <th className="p-1.5">User Name</th>
                  <th className="p-1.5">Mem Usage</th>
                </tr>
              </thead>
              <tbody>
                <tr><td className="p-1.5">explorer.exe</td><td className="p-1.5">{system.activeUsername}</td><td className="p-1.5">24,120 K</td></tr>
                <tr><td className="p-1.5">svchost.exe</td><td className="p-1.5">SYSTEM</td><td className="p-1.5">14,880 K</td></tr>
                {windows.map((w) => (
                  <tr key={w.id}>
                    <td className="p-1.5">{w.appId}.exe</td>
                    <td className="p-1.5">{system.activeUsername}</td>
                    <td className="p-1.5">8,420 K</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'perf' && (
          <div className="flex flex-col gap-2">
            <div><strong>CPU Usage:</strong> {Math.min(92, 4 + windows.length * 6)}% (Simulated)</div>
            <div><strong>PF Usage:</strong> {240 + windows.length * 18} MB</div>
            <div><strong>Running Windows:</strong> {windows.length}</div>
            <div><strong>Running Services:</strong> {system.services.filter((s) => s.status === 'Running').length}</div>
          </div>
        )}
      </div>

      <div className="text-[10px] text-[#333333] flex justify-between">
        <span>Processes: {windows.length + 2}</span>
        <span>CPU Usage: {Math.min(92, 4 + windows.length * 6)}%</span>
      </div>
    </div>
  );
};

// --- 10. System Configuration Utility (msconfig) ---
export const MsConfigApp: React.FC<{
  system: SystemState;
  onUpdateSystem: (updater: (prev: SystemState) => SystemState) => void;
  onClose: () => void;
}> = ({ system, onUpdateSystem, onClose }) => {
  const [tab, setTab] = useState<'general' | 'services' | 'startup'>('startup');

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#ece9d8] p-2.5 text-[11px] justify-between gap-2">
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="flex gap-1 pl-1">
          {(['general', 'services', 'startup'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-3 py-1 rounded-t-[3px] border border-b-0 border-[#919b9c] cursor-default ${
                tab === t ? 'bg-[#f9f8f4] font-bold relative z-10 -mb-[1px]' : 'bg-[#e3e0d3]'
              }`}
            >
              {t[0].toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex-1 min-h-0 bg-[#f9f8f4] border border-[#919b9c] p-2 overflow-y-auto xp-scroll">
          {tab === 'general' && (
            <div className="flex flex-col gap-2 p-2">
              <div className="font-bold">Startup Selection</div>
              <div>● Selective Startup (Load System Services &amp; Startup Items)</div>
            </div>
          )}
          {tab === 'services' && (
            <div className="flex flex-col gap-1">
              {system.services.map((s) => (
                <div key={s.id} className="flex justify-between p-1 border-b border-[#e3e0d3]">
                  <span>{s.displayName}</span>
                  <span className="font-bold">{s.status}</span>
                </div>
              ))}
            </div>
          )}
          {tab === 'startup' && (
            <div className="flex flex-col gap-1.5">
              {system.startupEntries.map((entry) => (
                <label key={entry.id} className="flex items-center justify-between gap-2 p-1 bg-white border border-[#d4d0c8]">
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={entry.enabled}
                      onChange={(e) =>
                        onUpdateSystem((prev) => ({
                          ...prev,
                          startupEntries: prev.startupEntries.map((x) =>
                            x.id === entry.id ? { ...x, enabled: e.target.checked } : x
                          ),
                        }))
                      }
                    />
                    <strong>{entry.name}</strong>
                  </span>
                  <span className="text-[10px] text-[#555555] font-mono">{entry.command}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onClose} className="xp-button xp-button-default min-w-[74px]">OK</button>
      </div>
    </div>
  );
};

// --- 11. Registry Editor (regedit) ---
export const RegeditApp: React.FC<{
  system: SystemState;
  onUpdateSystem: (updater: (prev: SystemState) => SystemState) => void;
}> = ({ system, onUpdateSystem }) => {
  const keys = Object.keys(system.registry);
  const [selectedKey, setSelectedKey] = useState(keys[0] ?? '');
  const [valName, setValName] = useState('');
  const [valData, setValData] = useState('');

  if (system.groupPolicy.disableRegedit) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#ece9d8] p-6 text-[12px] text-[#b91c1c] font-bold text-center">
        Registry editing has been disabled by your administrator (Group Policy).
      </div>
    );
  }

  const values: RegistryValue[] = system.registry[selectedKey] ?? [];

  const upsertValue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valName.trim() || !selectedKey) return;
    onUpdateSystem((prev) => {
      const existing = prev.registry[selectedKey] ?? [];
      const next = [
        ...existing.filter((v) => v.name !== valName.trim()),
        { name: valName.trim(), type: 'REG_SZ' as const, data: valData },
      ];
      return { ...prev, registry: { ...prev.registry, [selectedKey]: next } };
    });
    setValName('');
    setValData('');
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-white text-[11px]">
      <div className="flex-1 min-h-0 flex">
        <aside className="w-[240px] shrink-0 border-r border-[#aca899] overflow-y-auto xp-scroll p-1.5 flex flex-col gap-0.5">
          {keys.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setSelectedKey(k)}
              className={`text-left px-1.5 py-1 rounded-[2px] truncate cursor-default ${
                selectedKey === k ? 'bg-[#316ac5] text-white font-bold' : 'hover:bg-[#eef4fd]'
              }`}
            >
              📁 {k}
            </button>
          ))}
        </aside>

        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex-1 overflow-y-auto xp-scroll">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-[#ece9d8] border-b border-[#aca899]">
                  <th className="p-1.5">Name</th>
                  <th className="p-1.5">Type</th>
                  <th className="p-1.5">Data</th>
                  <th className="p-1.5 w-[64px]">Action</th>
                </tr>
              </thead>
              <tbody>
                {values.map((v) => (
                  <tr key={v.name} className="border-b border-[#f0eee6]">
                    <td className="p-1.5 font-mono">{v.name}</td>
                    <td className="p-1.5">{v.type}</td>
                    <td className="p-1.5 font-mono">{v.data}</td>
                    <td className="p-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateSystem((prev) => ({
                            ...prev,
                            registry: {
                              ...prev.registry,
                              [selectedKey]: (prev.registry[selectedKey] ?? []).filter((x) => x.name !== v.name),
                            },
                          }))
                        }
                        className="xp-button"
                      >
                        Del
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <form onSubmit={upsertValue} className="p-2 bg-[#ece9d8] border-t border-[#aca899] flex gap-1.5">
            <input value={valName} onChange={(e) => setValName(e.target.value)} placeholder="Value name" className="xp-input w-[130px]" />
            <input value={valData} onChange={(e) => setValData(e.target.value)} placeholder="String data" className="xp-input flex-1" />
            <button type="submit" className="xp-button xp-button-default">Set Value</button>
          </form>
        </div>
      </div>
      <div className="bg-[#ece9d8] border-t border-[#aca899] px-2 py-0.5 text-[10px] truncate">
        My Computer\{selectedKey}
      </div>
    </div>
  );
};

// --- 12. Private Character Editor (eudcedit) ---
export const EudcEditorApp: React.FC<{
  system: SystemState;
  onUpdateSystem: (updater: (prev: SystemState) => SystemState) => void;
}> = ({ system, onUpdateSystem }) => {
  const [code, setCode] = useState('E000');
  const [bits, setBits] = useState<string>(
    () => system.customChars['E000'] || '0'.repeat(256)
  );

  const toggleBit = (idx: number) => {
    const arr = bits.split('');
    arr[idx] = arr[idx] === '1' ? '0' : '1';
    setBits(arr.join(''));
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#ece9d8] p-3 text-[11px] gap-3 items-center">
      <div className="flex items-center gap-2 w-full justify-between">
        <span className="font-bold text-[#0b3c8d]">Private Character Editor (U+{code})</span>
        <select
          value={code}
          onChange={(e) => {
            const c = e.target.value;
            setCode(c);
            setBits(system.customChars[c] || '0'.repeat(256));
          }}
          className="xp-input"
        >
          {['E000', 'E001', 'E002', 'E003'].map((c) => (
            <option key={c} value={c}>U+{c}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-16 border border-[#7f9db9] bg-white">
        {bits.split('').map((b, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => toggleBit(idx)}
            className={`w-[14px] h-[14px] border border-[#e5e7eb] p-0 ${
              b === '1' ? 'bg-[#000000]' : 'bg-[#ffffff]'
            }`}
          />
        ))}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() =>
            onUpdateSystem((prev) => ({
              ...prev,
              customChars: { ...prev.customChars, [code]: bits },
            }))
          }
          className="xp-button xp-button-default"
        >
          Save Character to Registry
        </button>
        <button type="button" onClick={() => setBits('0'.repeat(256))} className="xp-button">
          Clear Grid
        </button>
      </div>
    </div>
  );
};

// --- 13. IExpress Wizard (iexpress) ---
export const IExpressWizardApp: React.FC<{
  vfs: VfsState;
  system: SystemState;
  onSaveFile: (params: {
    parentId: string;
    name: string;
    content: string;
    kind: Exclude<NodeKind, 'folder' | 'drive' | 'system'>;
    mimeType: string;
    allowOverwrite?: boolean;
  }) => { ok: boolean; node?: VfsNode; error?: string };
  onOpenModal: (modal: Omit<ModalPromptRequest, 'id'>) => void;
  onClose: () => void;
}> = ({ vfs, system, onSaveFile, onOpenModal, onClose }) => {
  const activeUser = system.users.find((u) => u.username === system.activeUsername) ?? system.users[0];
  const docsId = activeUser?.docsFolderId ?? SYSTEM_IDS.MY_DOCUMENTS;
  const candidateFiles = Object.values(vfs.nodes).filter((n) => n.kind === 'text' || n.kind === 'rtf');
  const [selectedIds, setSelectedIds] = useState<string[]>(candidateFiles.slice(0, 1).map((f) => f.id));
  const [pkgName, setPkgName] = useState('Package.sed');

  const buildPkg = (e: React.FormEvent) => {
    e.preventDefault();
    const lines = [
      '[Version]',
      'Class=IEXPRESS',
      '[Strings]',
      `TargetName=${pkgName}`,
      '[SourceFiles]',
      ...selectedIds.map((id, i) => `FILE${i}=${vfs.nodes[id]?.name ?? id}`),
    ].join('\n');
    const res = onSaveFile({
      parentId: docsId,
      name: pkgName.endsWith('.sed') ? pkgName : `${pkgName}.sed`,
      content: lines,
      kind: 'text',
      mimeType: 'text/plain',
      allowOverwrite: true,
    });
    if (res.ok) {
      onOpenModal({
        kind: 'alert',
        icon: 'info',
        title: 'IExpress Wizard',
        message: `Created self-extraction directive "${pkgName}" in My Documents.`,
      });
      onClose();
    }
  };

  return (
    <form onSubmit={buildPkg} className="flex-1 min-h-0 flex flex-col bg-[#ece9d8] p-3 text-[11px] justify-between gap-2">
      <div className="flex flex-col gap-2">
        <div className="font-bold text-[13px] text-[#0b3c8d]">IExpress Self-Extracting Directive Wizard</div>
        <label className="flex flex-col gap-1">
          <span>Package directive filename:</span>
          <input value={pkgName} onChange={(e) => setPkgName(e.target.value)} className="xp-input" />
        </label>
        <div className="bg-white border border-[#7f9db9] p-2 max-h-[140px] overflow-y-auto xp-scroll">
          {candidateFiles.map((f) => (
            <label key={f.id} className="flex items-center gap-2 py-0.5">
              <input
                type="checkbox"
                checked={selectedIds.includes(f.id)}
                onChange={(e) =>
                  setSelectedIds((prev) =>
                    e.target.checked ? [...prev, f.id] : prev.filter((x) => x !== f.id)
                  )
                }
              />
              <span>{f.name}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2 border-t border-[#aca899]">
        <button type="submit" className="xp-button xp-button-default">Create Package</button>
        <button type="button" onClick={onClose} className="xp-button">Cancel</button>
      </div>
    </form>
  );
};
