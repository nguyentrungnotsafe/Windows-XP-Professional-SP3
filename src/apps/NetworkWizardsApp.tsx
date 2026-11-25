import React, { useEffect, useState } from 'react';
import type {
  AppId,
  FaxJob,
  ModalPromptRequest,
  NetworkConnectionProfile,
  SystemState,
} from '../types/os';
import { appendEventLog } from '../state/systemState';
import { XpIcon } from '../components/xp/XpIcons';

interface NetworkConnectionsAppProps {
  system: SystemState;
  onUpdateSystem: (updater: (prev: SystemState) => SystemState) => void;
  onLaunchApp: (appId: AppId) => void;
}

export const NetworkConnectionsApp: React.FC<NetworkConnectionsAppProps> = ({
  system,
  onUpdateSystem,
  onLaunchApp,
}) => {
  const [selectedId, setSelectedId] = useState<string>(
    system.networkConnections[0]?.id ?? ''
  );
  const [editingTcp, setEditingTcp] = useState(false);

  const selected =
    system.networkConnections.find((c) => c.id === selectedId) ??
    system.networkConnections[0];

  const [ipAddr, setIpAddr] = useState(selected?.ipAddress ?? '');
  const [mask, setMask] = useState(selected?.subnetMask ?? '');
  const [gw, setGw] = useState(selected?.gateway ?? '');
  const [dns, setDns] = useState(selected?.dnsServer ?? '');

  useEffect(() => {
    if (selected) {
      setIpAddr(selected.ipAddress);
      setMask(selected.subnetMask);
      setGw(selected.gateway);
      setDns(selected.dnsServer);
    }
  }, [selected]);

  const toggleConnection = (conn: NetworkConnectionProfile) => {
    const nextStatus = conn.status === 'Connected' ? 'Disconnected' : 'Connected';
    onUpdateSystem((prev) =>
      appendEventLog(
        {
          ...prev,
          networkConnections: prev.networkConnections.map((c) =>
            c.id === conn.id
              ? {
                  ...c,
                  status: nextStatus,
                  ipAddress:
                    nextStatus === 'Connected' && c.ipAddress === '0.0.0.0'
                      ? '192.168.1.112'
                      : c.ipAddress,
                  subnetMask:
                    nextStatus === 'Connected' && c.subnetMask === '0.0.0.0'
                      ? '255.255.255.0'
                      : c.subnetMask,
                }
              : c
          ),
        },
        {
          logType: 'System',
          level: 'Information',
          source: 'Tcpip',
          eventId: 4201,
          message: `Adapter "${conn.name}" state changed to ${nextStatus}.`,
        }
      )
    );
  };

  return (
    <div className="flex-1 min-h-0 flex bg-white text-[11px]">
      <aside className="hidden sm:flex w-[180px] shrink-0 xp-taskpane-bg p-2.5 flex-col gap-2">
        <div className="rounded-t-[4px] overflow-hidden shadow-sm">
          <div className="xp-taskpane-card-header px-2.5 py-1.5 font-bold text-[#215dc6]">
            Network Tasks
          </div>
          <div className="bg-[#d6dff7] p-2 text-[#215dc6] flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() => onLaunchApp('newconn')}
              className="text-left hover:underline cursor-default"
            >
              Create a new connection
            </button>
            <button
              type="button"
              onClick={() => onLaunchApp('netsetup')}
              className="text-left hover:underline cursor-default"
            >
              Set up a home or small office network
            </button>
            <button
              type="button"
              onClick={() => onLaunchApp('wirelesssetup')}
              className="text-left hover:underline cursor-default"
            >
              Set up a wireless network
            </button>
            <button
              type="button"
              onClick={() => onLaunchApp('firewall')}
              className="text-left hover:underline cursor-default"
            >
              Windows Firewall settings
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 min-w-0 p-3 flex flex-col gap-3 overflow-y-auto xp-scroll">
        <h2 className="text-[13px] font-bold text-[#0b3c8d] border-b border-[#6fa0e8] pb-1">
          LAN, Wireless, Dial-up, and Virtual Private Connections
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {system.networkConnections.map((conn) => (
            <button
              key={conn.id}
              type="button"
              onClick={() => setSelectedId(conn.id)}
              className={`flex items-start gap-2.5 p-2 rounded-[3px] border text-left cursor-default ${
                selected?.id === conn.id
                  ? 'border-[#316ac5] bg-[#eef4fd]'
                  : 'border-transparent hover:bg-[#f5f8fd]'
              }`}
            >
              <XpIcon name={conn.kind === 'Wireless' ? 'wireless' : 'network'} size={28} />
              <div className="min-w-0">
                <div className="font-bold truncate">{conn.name}</div>
                <div className="text-[10px] text-[#444444]">
                  {conn.status} • {conn.kind}
                </div>
                <div className="text-[10px] text-[#666666] truncate">{conn.deviceName}</div>
              </div>
            </button>
          ))}
        </div>

        {selected && (
          <div className="bg-[#f5f3ea] border border-[#aca899] p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="font-bold text-[#0b3c8d]">
                {selected.name} — {selected.status}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => toggleConnection(selected)}
                  className="xp-button"
                >
                  {selected.status === 'Connected' ? 'Disable' : 'Enable'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingTcp((v) => !v)}
                  className="xp-button"
                >
                  TCP/IP Properties
                </button>
              </div>
            </div>

            {!editingTcp ? (
              <div className="grid grid-cols-2 gap-1 text-[11px]">
                <div>IP Address: {selected.ipAddress}</div>
                <div>Subnet Mask: {selected.subnetMask}</div>
                <div>Default Gateway: {selected.gateway || 'None'}</div>
                <div>DNS Server: {selected.dnsServer || 'None'}</div>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  onUpdateSystem((prev) => ({
                    ...prev,
                    networkConnections: prev.networkConnections.map((c) =>
                      c.id === selected.id
                        ? { ...c, ipAddress: ipAddr, subnetMask: mask, gateway: gw, dnsServer: dns }
                        : c
                    ),
                  }));
                  setEditingTcp(false);
                }}
                className="grid grid-cols-2 gap-2 bg-white p-2 border border-[#aca899]"
              >
                <label className="flex flex-col gap-0.5">
                  <span>IP address:</span>
                  <input value={ipAddr} onChange={(e) => setIpAddr(e.target.value)} className="xp-input" />
                </label>
                <label className="flex flex-col gap-0.5">
                  <span>Subnet mask:</span>
                  <input value={mask} onChange={(e) => setMask(e.target.value)} className="xp-input" />
                </label>
                <label className="flex flex-col gap-0.5">
                  <span>Default gateway:</span>
                  <input value={gw} onChange={(e) => setGw(e.target.value)} className="xp-input" />
                </label>
                <label className="flex flex-col gap-0.5">
                  <span>Preferred DNS:</span>
                  <input value={dns} onChange={(e) => setDns(e.target.value)} className="xp-input" />
                </label>
                <div className="col-span-2 flex justify-end gap-2">
                  <button type="submit" className="xp-button xp-button-default">Save TCP/IP</button>
                  <button type="button" onClick={() => setEditingTcp(false)} className="xp-button">Cancel</button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

interface NewConnectionWizardAppProps {
  onUpdateSystem: (updater: (prev: SystemState) => SystemState) => void;
  onClose: () => void;
}

export const NewConnectionWizardApp: React.FC<NewConnectionWizardAppProps> = ({
  onUpdateSystem,
  onClose,
}) => {
  const [kind, setKind] = useState<'Dial-up' | 'VPN'>('VPN');
  const [name, setName] = useState('Corporate VPN');
  const [server, setServer] = useState('vpn.xp-workstation.local');

  const handleFinish = (e: React.FormEvent) => {
    e.preventDefault();
    const newConn: NetworkConnectionProfile = {
      id: `nic_${Date.now()}`,
      name: name.trim() || `${kind} Connection`,
      kind,
      deviceName: kind === 'VPN' ? 'WAN Miniport (PPTP)' : 'Agere Systems PCI Soft Modem',
      status: 'Disconnected',
      ipAddress: '10.0.0.18',
      subnetMask: '255.255.255.0',
      gateway: server.trim(),
      dnsServer: '192.168.1.1',
      packetsSent: 0,
      packetsReceived: 0,
    };
    onUpdateSystem((prev) => ({
      ...prev,
      networkConnections: [...prev.networkConnections, newConn],
    }));
    onClose();
  };

  return (
    <form onSubmit={handleFinish} className="flex-1 min-h-0 flex flex-col bg-[#ece9d8] p-4 text-[11px] justify-between">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 font-bold text-[#0b3c8d] text-[13px]">
          <XpIcon name="network_wizard" size={24} />
          <span>New Connection Wizard</span>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="flex items-center gap-2">
            <input type="radio" checked={kind === 'VPN'} onChange={() => setKind('VPN')} />
            <span>Connect to the network at my workplace (Virtual Private Network)</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" checked={kind === 'Dial-up'} onChange={() => setKind('Dial-up')} />
            <span>Connect using a dial-up modem</span>
          </label>
        </div>
        <label className="flex flex-col gap-1">
          <span>Connection Name:</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className="xp-input" />
        </label>
        <label className="flex flex-col gap-1">
          <span>{kind === 'VPN' ? 'Host name or IP address:' : 'Phone number:'}</span>
          <input value={server} onChange={(e) => setServer(e.target.value)} className="xp-input" />
        </label>
      </div>
      <div className="flex justify-end gap-2 border-t border-[#aca899] pt-2">
        <button type="submit" className="xp-button xp-button-default">Finish</button>
        <button type="button" onClick={onClose} className="xp-button">Cancel</button>
      </div>
    </form>
  );
};

interface NetworkSetupWizardAppProps {
  system: SystemState;
  onUpdateSystem: (updater: (prev: SystemState) => SystemState) => void;
  onClose: () => void;
}

export const NetworkSetupWizardApp: React.FC<NetworkSetupWizardAppProps> = ({
  system,
  onUpdateSystem,
  onClose,
}) => {
  const [computerName, setComputerName] = useState(system.computerName);
  const [owner, setOwner] = useState(system.registeredOwner);

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSystem((prev) =>
      appendEventLog(
        {
          ...prev,
          computerName: computerName.trim() || prev.computerName,
          registeredOwner: owner.trim() || prev.registeredOwner,
        },
        {
          logType: 'System',
          level: 'Information',
          source: 'NetSetup',
          eventId: 3005,
          message: `Workgroup settings updated for ${computerName.trim() || prev.computerName}.`,
        }
      )
    );
    onClose();
  };

  return (
    <form onSubmit={handleApply} className="flex-1 min-h-0 flex flex-col bg-[#ece9d8] p-4 text-[11px] justify-between">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 font-bold text-[#0b3c8d] text-[13px]">
          <XpIcon name="network_wizard" size={24} />
          <span>Network Setup Wizard</span>
        </div>
        <p>Configure your computer identification and local file sharing on MSHOME workgroup.</p>
        <label className="flex flex-col gap-1">
          <span>Computer name:</span>
          <input value={computerName} onChange={(e) => setComputerName(e.target.value)} className="xp-input" />
        </label>
        <label className="flex flex-col gap-1">
          <span>Registered owner:</span>
          <input value={owner} onChange={(e) => setOwner(e.target.value)} className="xp-input" />
        </label>
      </div>
      <div className="flex justify-end gap-2 border-t border-[#aca899] pt-2">
        <button type="submit" className="xp-button xp-button-default">Finish</button>
        <button type="button" onClick={onClose} className="xp-button">Cancel</button>
      </div>
    </form>
  );
};

interface WirelessSetupWizardAppProps {
  onUpdateSystem: (updater: (prev: SystemState) => SystemState) => void;
  onClose: () => void;
}

export const WirelessSetupWizardApp: React.FC<WirelessSetupWizardAppProps> = ({
  onUpdateSystem,
  onClose,
}) => {
  const [ssid, setSsid] = useState('XP_STUDIO_WIFI');
  const [security, setSecurity] = useState('WPA-PSK');

  const handleFinish = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSsid = ssid.trim() || 'XP_WIRELESS';
    const profile: NetworkConnectionProfile = {
      id: `wlan_${Date.now()}`,
      name: `Wireless (${cleanSsid})`,
      kind: 'Wireless',
      deviceName: 'Intel(R) PRO/Wireless 2200BG',
      status: 'Connected',
      ipAddress: '192.168.1.120',
      subnetMask: '255.255.255.0',
      gateway: '192.168.1.1',
      dnsServer: '192.168.1.1',
      ssid: cleanSsid,
      packetsSent: 12,
      packetsReceived: 18,
    };
    onUpdateSystem((prev) => ({
      ...prev,
      networkConnections: [...prev.networkConnections, profile],
    }));
    onClose();
  };

  return (
    <form onSubmit={handleFinish} className="flex-1 min-h-0 flex flex-col bg-[#ece9d8] p-4 text-[11px] justify-between">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 font-bold text-[#0b3c8d] text-[13px]">
          <XpIcon name="wireless" size={24} />
          <span>Wireless Network Setup Wizard</span>
        </div>
        <label className="flex flex-col gap-1">
          <span>Network name (SSID):</span>
          <input value={ssid} onChange={(e) => setSsid(e.target.value)} className="xp-input" />
        </label>
        <label className="flex flex-col gap-1">
          <span>Security mode:</span>
          <select value={security} onChange={(e) => setSecurity(e.target.value)} className="xp-input">
            <option value="WPA-PSK">WPA-PSK (Recommended)</option>
            <option value="WEP">WEP 128-bit</option>
          </select>
        </label>
      </div>
      <div className="flex justify-end gap-2 border-t border-[#aca899] pt-2">
        <button type="submit" className="xp-button xp-button-default">Save Profile</button>
        <button type="button" onClick={onClose} className="xp-button">Cancel</button>
      </div>
    </form>
  );
};

export const HyperTerminalApp: React.FC = () => {
  const [port, setPort] = useState('COM1 (Agere Soft Modem)');
  const [connected, setConnected] = useState(true);
  const [cmd, setCmd] = useState('');
  const [log, setLog] = useState<string[]>([
    'HyperTerminal Private Edition — Local Serial Loopback',
    'Connected to COM1 @ 115200 bps, 8-N-1. Type AT, ATI, ATZ, or HELP.',
  ]);

  const sendCommand = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = cmd.trim();
    if (!raw) return;
    const upper = raw.toUpperCase();
    const replies: string[] = [raw];
    if (!connected) {
      replies.push('[Disconnected — click Connect first]');
    } else if (upper === 'AT' || upper === 'ATZ') {
      replies.push('OK');
    } else if (upper === 'ATI') {
      replies.push('Agere Systems PCI Soft Modem Rev 2.1.48', 'OK');
    } else if (upper.startsWith('ATDT')) {
      replies.push(`DIALING ${raw.slice(4).trim() || '555-0100'}...`, 'CONNECT 57600');
    } else if (upper === 'HELP') {
      replies.push('Supported commands: AT, ATZ, ATI, ATDT <num>, CLS');
    } else if (upper === 'CLS') {
      setLog([]);
      setCmd('');
      return;
    } else {
      replies.push(`ECHO: ${raw}`);
    }
    setLog((prev) => [...prev, ...replies]);
    setCmd('');
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#ece9d8] text-[11px]">
      <div className="p-1.5 border-b border-[#aca899] flex items-center gap-2">
        <select value={port} onChange={(e) => setPort(e.target.value)} className="xp-input">
          <option>COM1 (Agere Soft Modem)</option>
          <option>COM3 (Serial Loopback)</option>
        </select>
        <button
          type="button"
          onClick={() => setConnected((c) => !c)}
          className="xp-button"
        >
          {connected ? 'Disconnect' : 'Connect'}
        </button>
      </div>
      <div className="flex-1 min-h-0 bg-white border border-[#7f9db9] m-1.5 p-2 font-mono text-[12px] overflow-y-auto xp-scroll">
        {log.map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>
      <form onSubmit={sendCommand} className="p-1.5 flex gap-1.5">
        <input
          type="text"
          value={cmd}
          onChange={(e) => setCmd(e.target.value)}
          placeholder="Enter AT command..."
          className="xp-input flex-1 font-mono"
        />
        <button type="submit" className="xp-button xp-button-default">
          Send
        </button>
      </form>
    </div>
  );
};

export const PhoneDialerApp: React.FC = () => {
  const [number, setNumber] = useState('555-0199');
  const [status, setStatus] = useState<'Idle' | 'Dialing...' | 'Connected'>('Idle');
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (status !== 'Connected') return;
    const id = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [status]);

  const dial = () => {
    if (!number.trim()) return;
    setStatus('Dialing...');
    setSeconds(0);
    window.setTimeout(() => setStatus('Connected'), 400);
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#ece9d8] p-3 text-[11px] gap-3">
      <div className="flex items-center gap-2">
        <label htmlFor="dialer-num" className="font-bold">Number to dial:</label>
        <input
          id="dialer-num"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          className="xp-input flex-1"
        />
      </div>

      <div className="grid grid-cols-3 gap-1.5 max-w-[200px]">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((digit) => (
          <button
            key={digit}
            type="button"
            onClick={() => setNumber((prev) => prev + digit)}
            className="xp-button font-bold py-1.5"
          >
            {digit}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={status !== 'Idle'}
          onClick={dial}
          className="xp-button xp-button-default"
        >
          Dial
        </button>
        <button
          type="button"
          disabled={status === 'Idle'}
          onClick={() => {
            setStatus('Idle');
            setSeconds(0);
          }}
          className="xp-button"
        >
          Hang Up
        </button>
        <span className="ml-auto font-bold text-[#0b3c8d]">
          {status} {status === 'Connected' ? `(${seconds}s)` : ''}
        </span>
      </div>
    </div>
  );
};

interface FaxConsoleAppProps {
  system: SystemState;
  onUpdateSystem: (updater: (prev: SystemState) => SystemState) => void;
  onOpenModal: (modal: Omit<ModalPromptRequest, 'id'>) => void;
}

export const FaxConsoleApp: React.FC<FaxConsoleAppProps> = ({
  system,
  onUpdateSystem,
  onOpenModal,
}) => {
  const [recipientName, setRecipientName] = useState('Contoso Receiving');
  const [recipientNumber, setRecipientNumber] = useState('555-0177');
  const [subject, setSubject] = useState('Purchase Order #1042');
  const [body, setBody] = useState('Attached order summary from XP Workstation.');

  const sendFax = (e: React.FormEvent) => {
    e.preventDefault();
    const job: FaxJob = {
      id: `fax_${Date.now()}`,
      recipientName: recipientName.trim() || 'Recipient',
      recipientNumber: recipientNumber.trim() || '555-0100',
      subject: subject.trim() || 'Untitled Fax',
      body,
      status: 'Sent',
      pages: Math.max(1, Math.ceil(body.length / 200)),
      timestamp: Date.now(),
    };
    onUpdateSystem((prev) =>
      appendEventLog(
        {
          ...prev,
          faxJobs: [job, ...prev.faxJobs],
        },
        {
          logType: 'Application',
          level: 'Information',
          source: 'Microsoft Fax',
          eventId: 3201,
          message: `Fax "${job.subject}" sent to ${job.recipientNumber}.`,
        }
      )
    );
    onOpenModal({
      kind: 'alert',
      icon: 'info',
      title: 'Send Fax Wizard',
      message: `Fax "${job.subject}" was transmitted to ${job.recipientNumber}.`,
    });
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#ece9d8] p-3 text-[11px] gap-3 overflow-y-auto xp-scroll">
      <div className="flex items-center gap-2 font-bold text-[13px] text-[#0b3c8d]">
        <XpIcon name="fax" size={24} />
        <span>Microsoft Fax Console</span>
      </div>

      <form onSubmit={sendFax} className="bg-white border border-[#aca899] p-3 flex flex-col gap-2">
        <div className="font-bold">Send a Fax Wizard</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <label className="flex flex-col gap-0.5">
            <span>To (Name):</span>
            <input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} className="xp-input" />
          </label>
          <label className="flex flex-col gap-0.5">
            <span>Fax number:</span>
            <input value={recipientNumber} onChange={(e) => setRecipientNumber(e.target.value)} className="xp-input" />
          </label>
        </div>
        <label className="flex flex-col gap-0.5">
          <span>Subject:</span>
          <input value={subject} onChange={(e) => setSubject(e.target.value)} className="xp-input" />
        </label>
        <label className="flex flex-col gap-0.5">
          <span>Cover page note:</span>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} className="xp-input" />
        </label>
        <button type="submit" className="xp-button xp-button-default self-end">
          Send Fax
        </button>
      </form>

      <div className="bg-white border border-[#aca899] flex-1 min-h-[120px] overflow-y-auto xp-scroll">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-[#ece9d8] border-b border-[#aca899]">
              <th className="p-1.5">Subject</th>
              <th className="p-1.5">Recipient</th>
              <th className="p-1.5">Pages</th>
              <th className="p-1.5">Status</th>
            </tr>
          </thead>
          <tbody>
            {system.faxJobs.map((job) => (
              <tr key={job.id} className="border-b border-[#f0eee6]">
                <td className="p-1.5">{job.subject}</td>
                <td className="p-1.5">{job.recipientName} ({job.recipientNumber})</td>
                <td className="p-1.5">{job.pages}</td>
                <td className="p-1.5 font-bold text-[#1f622c]">{job.status}</td>
              </tr>
            ))}
            {system.faxJobs.length === 0 && (
              <tr>
                <td colSpan={4} className="p-3 text-center text-[#666666]">
                  No sent or queued faxes yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
