import React, { useEffect, useState } from 'react';
import type {
  AppId,
  ServiceItem,
  SystemState,
  VfsState,
  WindowInstance,
} from '../types/os';
import { appendEventLog } from '../state/systemState';
import { XpIcon } from '../components/xp/XpIcons';

interface MmcConsolesAppProps {
  appId: AppId;
  vfs: VfsState;
  system: SystemState;
  onUpdateSystem: (updater: (prev: SystemState) => SystemState) => void;
  onLaunchApp: (appId: AppId, payload?: WindowInstance['payload']) => void;
  onTitleChange: (title: string) => void;
}

type SnapInId =
  | 'eventvwr'
  | 'services'
  | 'devmgmt'
  | 'diskmgmt'
  | 'fsmgmt'
  | 'lusrmgr'
  | 'perfmon'
  | 'dcomcnfg'
  | 'odbcad32'
  | 'secpol'
  | 'gpedit'
  | 'iis_mgr'
  | 'indexing_mgr';

export const MmcConsolesApp: React.FC<MmcConsolesAppProps> = ({
  appId,
  vfs,
  system,
  onUpdateSystem,
  onLaunchApp,
  onTitleChange,
}) => {
  const initialSnap: SnapInId =
    appId === 'compmgmt' ? 'eventvwr' : (appId as SnapInId);
  const [activeSnap, setActiveSnap] = useState<SnapInId>(initialSnap);
  const [eventFilter, setEventFilter] = useState<'All' | 'System' | 'Application' | 'Security'>('All');
  const [odbcDsnName, setOdbcDsnName] = useState('XP_Local_SQL');
  const [odbcList, setOdbcList] = useState<Array<{ name: string; driver: string }>>([
    { name: 'dBASE Files', driver: 'Microsoft dBase Driver (*.dbf)' },
    { name: 'MS Access Database', driver: 'Microsoft Access Driver (*.mdb)' },
  ]);
  const [iisSiteRunning, setIisSiteRunning] = useState(
    system.services.find((s) => s.id === 'w3svc')?.status === 'Running'
  );

  useEffect(() => {
    const titles: Record<string, string> = {
      compmgmt: 'Computer Management',
      eventvwr: 'Event Viewer',
      services: 'Services',
      devmgmt: 'Device Manager',
      diskmgmt: 'Disk Management',
      fsmgmt: 'Shared Folders',
      lusrmgr: 'Local Users and Groups',
      perfmon: 'Performance',
      dcomcnfg: 'Component Services',
      odbcad32: 'ODBC Data Source Administrator',
      secpol: 'Local Security Settings',
      gpedit: 'Group Policy Object Editor',
      iis_mgr: 'Internet Information Services (IIS) Manager',
      indexing_mgr: 'Indexing Service',
    };
    onTitleChange(titles[appId] ?? 'Microsoft Management Console');
  }, [appId, onTitleChange]);

  const toggleService = (svc: ServiceItem) => {
    const nextStatus = svc.status === 'Running' ? 'Stopped' : 'Running';
    onUpdateSystem((prev) =>
      appendEventLog(
        {
          ...prev,
          services: prev.services.map((s) =>
            s.id === svc.id ? { ...s, status: nextStatus } : s
          ),
        },
        {
          logType: 'System',
          level: 'Information',
          source: 'Service Control Manager',
          eventId: nextStatus === 'Running' ? 7035 : 7036,
          message: `The ${svc.displayName} service entered the ${nextStatus.toLowerCase()} state.`,
        }
      )
    );
  };

  const renderSnapContent = () => {
    if (activeSnap === 'eventvwr') {
      const entries = system.eventLog.filter(
        (e) => eventFilter === 'All' || e.logType === eventFilter
      );
      return (
        <div className="flex-1 min-h-0 flex flex-col gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            {(['All', 'System', 'Application', 'Security'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setEventFilter(cat)}
                className={`xp-button ${eventFilter === cat ? 'xp-button-default' : ''}`}
              >
                {cat}
              </button>
            ))}
            <span className="ml-auto text-[#555555]">{entries.length} event(s)</span>
          </div>
          <div className="flex-1 bg-white border border-[#aca899] overflow-y-auto xp-scroll">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-[#ece9d8] border-b border-[#aca899]">
                  <th className="p-1.5">Type</th>
                  <th className="p-1.5">Log</th>
                  <th className="p-1.5">Source</th>
                  <th className="p-1.5">Event</th>
                  <th className="p-1.5">Description</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((ev) => (
                  <tr key={ev.id} className="border-b border-[#f0eee6]">
                    <td className="p-1.5 font-bold">{ev.level}</td>
                    <td className="p-1.5">{ev.logType}</td>
                    <td className="p-1.5">{ev.source}</td>
                    <td className="p-1.5">{ev.eventId}</td>
                    <td className="p-1.5">{ev.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    if (activeSnap === 'services') {
      return (
        <div className="flex-1 min-h-0 bg-white border border-[#aca899] overflow-y-auto xp-scroll">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-[#ece9d8] border-b border-[#aca899]">
                <th className="p-1.5">Name</th>
                <th className="p-1.5">Status</th>
                <th className="p-1.5">Startup Type</th>
                <th className="p-1.5">Action</th>
              </tr>
            </thead>
            <tbody>
              {system.services.map((svc) => (
                <tr key={svc.id} className="border-b border-[#f0eee6]">
                  <td className="p-1.5">
                    <div className="font-bold">{svc.displayName}</div>
                    <div className="text-[10px] text-[#555555]">{svc.description}</div>
                  </td>
                  <td
                    className={`p-1.5 font-bold ${
                      svc.status === 'Running' ? 'text-[#1f622c]' : 'text-[#7f1d1d]'
                    }`}
                  >
                    {svc.status}
                  </td>
                  <td className="p-1.5">
                    <select
                      aria-label={`Startup type for ${svc.displayName}`}
                      value={svc.startupType}
                      onChange={(e) =>
                        onUpdateSystem((prev) => ({
                          ...prev,
                          services: prev.services.map((s) =>
                            s.id === svc.id
                              ? { ...s, startupType: e.target.value as ServiceItem['startupType'] }
                              : s
                          ),
                        }))
                      }
                      className="xp-input"
                    >
                      <option value="Automatic">Automatic</option>
                      <option value="Manual">Manual</option>
                      <option value="Disabled">Disabled</option>
                    </select>
                  </td>
                  <td className="p-1.5">
                    <button
                      type="button"
                      onClick={() => toggleService(svc)}
                      className="xp-button"
                    >
                      {svc.status === 'Running' ? 'Stop' : 'Start'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (activeSnap === 'devmgmt') {
      return (
        <div className="flex-1 min-h-0 bg-white border border-[#aca899] overflow-y-auto xp-scroll p-2 flex flex-col gap-1.5">
          <div className="font-bold text-[#0b3c8d]">{system.computerName} Devices</div>
          {system.hardwareDevices.map((dev) => (
            <div
              key={dev.id}
              className="border border-[#e5e2d5] p-2 flex items-center justify-between gap-2"
            >
              <div>
                <div className="font-bold">{dev.name}</div>
                <div className="text-[10px] text-[#555555]">
                  {dev.category} • {dev.manufacturer} • Driver {dev.driverVersion} •{' '}
                  <strong>{dev.enabled ? 'Enabled' : 'Disabled'}</strong>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  onUpdateSystem((prev) => ({
                    ...prev,
                    hardwareDevices: prev.hardwareDevices.map((d) =>
                      d.id === dev.id ? { ...d, enabled: !d.enabled } : d
                    ),
                  }))
                }
                className="xp-button"
              >
                {dev.enabled ? 'Disable' : 'Enable'}
              </button>
            </div>
          ))}
        </div>
      );
    }

    if (activeSnap === 'diskmgmt') {
      return (
        <div className="flex-1 bg-white border border-[#aca899] p-3 flex flex-col gap-3">
          <div className="font-bold text-[#0b3c8d]">Disk Management</div>
          <table className="w-full border-collapse border border-[#aca899] text-left">
            <thead>
              <tr className="bg-[#ece9d8]">
                <th className="border border-[#aca899] p-1.5">Volume</th>
                <th className="border border-[#aca899] p-1.5">File System</th>
                <th className="border border-[#aca899] p-1.5">Capacity</th>
                <th className="border border-[#aca899] p-1.5">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-[#aca899] p-1.5 font-bold">Local Disk (C:)</td>
                <td className="border border-[#aca899] p-1.5">NTFS (Virtual)</td>
                <td className="border border-[#aca899] p-1.5">80.00 GB</td>
                <td className="border border-[#aca899] p-1.5">Healthy (System)</td>
              </tr>
              <tr>
                <td className="border border-[#aca899] p-1.5 font-bold">CD-RW Drive (D:)</td>
                <td className="border border-[#aca899] p-1.5">CDFS</td>
                <td className="border border-[#aca899] p-1.5">700 MB</td>
                <td className="border border-[#aca899] p-1.5">
                  {system.burnedCdFiles.length > 0 ? 'Disc Loaded' : 'Empty'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      );
    }

    if (activeSnap === 'fsmgmt') {
      return (
        <div className="flex-1 bg-white border border-[#aca899] p-3 flex flex-col gap-2">
          <div className="font-bold text-[#0b3c8d]">Shared Folders</div>
          <div>• <code>\\{system.computerName}\SharedDocs</code> — C:\Documents and Settings\All Users\Documents</div>
          <div>• <code>\\XP-SERVER\Public</code> — Network Workgroup Demo Share</div>
          <div>Active Sessions: 1 ({system.activeUsername})</div>
        </div>
      );
    }

    if (activeSnap === 'lusrmgr') {
      return (
        <div className="flex-1 bg-white border border-[#aca899] p-3 flex flex-col gap-2">
          <div className="font-bold text-[#0b3c8d]">Local Users and Groups</div>
          {system.users.map((u) => (
            <div key={u.username} className="border-b border-[#f0eee6] py-1">
              <strong>{u.username}</strong> — Member of: {u.role === 'Administrator' ? 'Administrators' : 'Users'}
            </div>
          ))}
        </div>
      );
    }

    if (activeSnap === 'perfmon') {
      const counters = [
        { name: '% Processor Time', val: Math.min(85, 8 + system.services.filter((s) => s.status === 'Running').length * 2) },
        { name: 'Available MBytes', val: 1420 },
        { name: 'VFS File Operations/sec', val: Object.keys(vfs.nodes).length },
      ];
      return (
        <div className="flex-1 bg-white border border-[#aca899] p-3 flex flex-col gap-3">
          <div className="font-bold text-[#0b3c8d]">System Monitor (Simulated Counters)</div>
          {counters.map((c) => (
            <div key={c.name} className="flex flex-col gap-1">
              <div className="flex justify-between">
                <span>{c.name}</span>
                <strong>{c.val}</strong>
              </div>
              <div className="h-[10px] bg-[#ece9d8] border border-[#aca899]">
                <div
                  className="h-full bg-[#22c55e]"
                  style={{ width: `${Math.min(100, c.val)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (activeSnap === 'dcomcnfg') {
      return (
        <div className="flex-1 bg-white border border-[#aca899] p-3 flex flex-col gap-2">
          <div className="font-bold text-[#0b3c8d]">Component Services — DCOM Config</div>
          <div>• Computers → My Computer → COM+ Applications (System Application, EventSystem)</div>
          <div>• Default Authentication Level: Connect</div>
          <div>• Default Impersonation Level: Identify</div>
        </div>
      );
    }

    if (activeSnap === 'odbcad32') {
      return (
        <div className="flex-1 bg-white border border-[#aca899] p-3 flex flex-col gap-2">
          <div className="font-bold text-[#0b3c8d]">ODBC User Data Sources (Local Demo)</div>
          <div className="flex gap-2">
            <input value={odbcDsnName} onChange={(e) => setOdbcDsnName(e.target.value)} className="xp-input" />
            <button
              type="button"
              onClick={() =>
                odbcDsnName.trim() &&
                setOdbcList((p) => [...p, { name: odbcDsnName.trim(), driver: 'SQL Server (Simulated)' }])
              }
              className="xp-button"
            >
              Add User DSN
            </button>
          </div>
          {odbcList.map((d, i) => (
            <div key={i} className="border-b border-[#f0eee6] py-1">
              <strong>{d.name}</strong> — {d.driver}
            </div>
          ))}
        </div>
      );
    }

    if (activeSnap === 'gpedit' || activeSnap === 'secpol') {
      const gp = system.groupPolicy;
      const togglePolicy = (key: keyof SystemState['groupPolicy'], label: string) => {
        onUpdateSystem((prev) => {
          const nextVal = !prev.groupPolicy[key];
          return appendEventLog(
            {
              ...prev,
              groupPolicy: { ...prev.groupPolicy, [key]: nextVal },
            },
            {
              logType: 'Security',
              level: 'Information',
              source: 'SceCli',
              eventId: 1704,
              message: `Group Policy "${label}" set to ${nextVal ? 'Enabled' : 'Disabled'}.`,
            }
          );
        });
      };

      return (
        <div className="flex-1 bg-white border border-[#aca899] p-3 flex flex-col gap-2.5 overflow-y-auto xp-scroll">
          <div className="font-bold text-[#0b3c8d]">
            {activeSnap === 'gpedit'
              ? 'Local Computer Policy — User & Administrative Templates'
              : 'Local Security Policy — Security Options'}
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={gp.hideRunFromStart}
              onChange={() => togglePolicy('hideRunFromStart', 'Remove Run menu from Start Menu')}
            />
            <span>Remove Run menu from Start Menu</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={gp.disableCmd}
              onChange={() => togglePolicy('disableCmd', 'Prevent access to the command prompt')}
            />
            <span>Prevent access to the command prompt (cmd.exe)</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={gp.disableRegedit}
              onChange={() => togglePolicy('disableRegedit', 'Prevent access to registry editing tools')}
            />
            <span>Prevent access to registry editing tools (regedit.exe)</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={gp.hideDisplayPanel}
              onChange={() => togglePolicy('hideDisplayPanel', 'Remove Display in Control Panel')}
            />
            <span>Disable Display Properties dialog</span>
          </label>
        </div>
      );
    }

    if (activeSnap === 'iis_mgr') {
      return (
        <div className="flex-1 bg-white border border-[#aca899] p-3 flex flex-col gap-2.5">
          <div className="font-bold text-[#0b3c8d]">Internet Information Services (IIS 5.1)</div>
          <div>
            Default Web Site (<code>http://localhost/</code>):{' '}
            <strong className={iisSiteRunning ? 'text-[#1f622c]' : 'text-[#b91c1c]'}>
              {iisSiteRunning ? 'Running' : 'Stopped'}
            </strong>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIisSiteRunning((r) => !r)}
              className="xp-button"
            >
              {iisSiteRunning ? 'Stop Web Site' : 'Start Web Site'}
            </button>
            <button
              type="button"
              onClick={() => onLaunchApp('iexplore', { initialUrl: 'http://localhost/' })}
              className="xp-button xp-button-default"
            >
              Browse http://localhost/ in IE
            </button>
          </div>
        </div>
      );
    }

    // indexing_mgr
    const indexedDocs = Object.values(vfs.nodes).filter(
      (n) => n.kind === 'text' || n.kind === 'rtf'
    );
    return (
      <div className="flex-1 bg-white border border-[#aca899] p-3 flex flex-col gap-2">
        <div className="font-bold text-[#0b3c8d]">Indexing Service Catalog (System)</div>
        <div>Indexed Documents in VFS: <strong>{indexedDocs.length}</strong></div>
        <div>Catalog Status: Ready (Local VFS Index)</div>
      </div>
    );
  };

  const snapList: Array<{ id: SnapInId; label: string }> =
    appId === 'compmgmt'
      ? [
          { id: 'eventvwr', label: 'Event Viewer' },
          { id: 'fsmgmt', label: 'Shared Folders' },
          { id: 'lusrmgr', label: 'Local Users and Groups' },
          { id: 'perfmon', label: 'Performance Logs' },
          { id: 'devmgmt', label: 'Device Manager' },
          { id: 'diskmgmt', label: 'Disk Management' },
          { id: 'services', label: 'Services' },
        ]
      : [{ id: activeSnap, label: activeSnap.toUpperCase() }];

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#ece9d8] text-[11px]">
      <div className="flex-1 min-h-0 flex p-1.5 gap-1.5">
        <aside className="w-[180px] shrink-0 bg-white border border-[#aca899] p-1.5 flex flex-col gap-1">
          <div className="font-bold text-[#0b3c8d] px-1 flex items-center gap-1.5">
            <XpIcon name="admin_tools" size={16} />
            <span>Console Root</span>
          </div>
          {snapList.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveSnap(item.id)}
              className={`text-left px-2 py-1 rounded-[2px] cursor-default ${
                activeSnap === item.id
                  ? 'bg-[#316ac5] text-white font-bold'
                  : 'hover:bg-[#eef4fd]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </aside>
        <div className="flex-1 min-w-0 flex flex-col">{renderSnapContent()}</div>
      </div>
    </div>
  );
};
