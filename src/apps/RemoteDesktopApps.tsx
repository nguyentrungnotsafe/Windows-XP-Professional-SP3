import React, { useState } from 'react';
import { XpIcon } from '../components/xp/XpIcons';

interface RemoteDesktopConnectionDialogProps {
  defaultUsername: string;
  onConnect: (host: string, username: string) => void;
  onClose: () => void;
}

export const RemoteDesktopConnectionDialog: React.FC<RemoteDesktopConnectionDialogProps> = ({
  defaultUsername,
  onConnect,
  onClose,
}) => {
  const [host, setHost] = useState('XP-LAB-02');
  const [username, setUsername] = useState(defaultUsername);
  const [showOptions, setShowOptions] = useState(false);

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#ece9d8] text-[11px]">
      <div className="bg-gradient-to-r from-[#1c59ba] via-[#4c8be4] to-[#1c59ba] text-white px-4 py-3 flex items-center gap-3">
        <XpIcon name="remote_desktop" size={32} />
        <div>
          <div className="text-[15px] font-bold">Remote Desktop Connection</div>
          <div className="text-[10px] text-[#dcebff]">Simulated Windows XP Remote Terminal</div>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onConnect(host.trim() || 'XP-LAB-02', username.trim() || defaultUsername);
        }}
        className="flex-1 p-4 flex flex-col justify-between gap-3"
      >
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2">
            <label htmlFor="mstsc-host" className="w-[82px] font-bold">
              Computer:
            </label>
            <input
              id="mstsc-host"
              type="text"
              value={host}
              onChange={(e) => setHost(e.target.value)}
              className="xp-input flex-1"
            />
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="mstsc-user" className="w-[82px]">
              User name:
            </label>
            <input
              id="mstsc-user"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="xp-input flex-1"
            />
          </div>

          {showOptions && (
            <div className="bg-[#f5f3ea] border border-[#aca899] p-2 text-[10px] text-[#333333]">
              Display: Full Screen (32-bit True Color) • Local drives mapped: C:\
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-[#aca899]">
          <button
            type="button"
            onClick={() => setShowOptions((o) => !o)}
            className="xp-button"
          >
            {showOptions ? 'Options <<' : 'Options >>'}
          </button>
          <div className="flex gap-2">
            <button type="submit" className="xp-button xp-button-default min-w-[74px]">
              Connect
            </button>
            <button type="button" onClick={onClose} className="xp-button min-w-[74px]">
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

interface RemoteDesktopSessionProps {
  host: string;
  username: string;
  onDisconnect: () => void;
}

export const RemoteDesktopSession: React.FC<RemoteDesktopSessionProps> = ({
  host,
  username,
  onDisconnect,
}) => {
  const [remoteNote, setRemoteNote] = useState(
    `Connected to ${host} as ${username}.\nRemote Workstation Status: Healthy\nUptime: 14 days, 06:12:44`
  );
  const [openTool, setOpenTool] = useState<'notepad' | 'sysinfo'>('notepad');

  return (
    <div
      className="fixed inset-0 z-[9800] bg-[#1d5bb8] flex flex-col select-none text-[11px]"
      aria-label={`Remote Desktop Session ${host}`}
    >
      {/* XP Connection Bar */}
      <div className="h-[26px] mx-auto px-4 bg-[#245edc] border-x border-b border-[#80b4ff] rounded-b-[6px] text-white flex items-center gap-3 shadow-md">
        <XpIcon name="remote_desktop" size={14} />
        <span className="font-bold">{host} ({username})</span>
        <button
          type="button"
          onClick={onDisconnect}
          className="px-2 py-0.5 bg-[#ece9d8] text-black border border-[#003c74] rounded-[2px] font-bold hover:bg-white cursor-default"
        >
          Disconnect
        </button>
      </div>

      {/* Simulated Remote Desktop Workspace */}
      <div className="flex-1 p-4 flex flex-col justify-between">
        <div className="flex gap-6 items-start">
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => setOpenTool('notepad')}
              className="w-[74px] flex flex-col items-center text-white gap-1 p-1 hover:bg-white/15 rounded-[2px]"
            >
              <XpIcon name="notepad" size={32} />
              <span className="text-center drop-shadow">Remote Notes</span>
            </button>
            <button
              type="button"
              onClick={() => setOpenTool('sysinfo')}
              className="w-[74px] flex flex-col items-center text-white gap-1 p-1 hover:bg-white/15 rounded-[2px]"
            >
              <XpIcon name="sysinfo" size={32} />
              <span className="text-center drop-shadow">Server Status</span>
            </button>
          </div>

          <div className="w-full max-w-[500px] bg-[#ece9d8] border-2 border-[#0054e3] rounded-t-[6px] shadow-2xl">
            <div className="h-[26px] xp-titlebar-active px-2 flex items-center justify-between text-white font-bold">
              <span>
                {openTool === 'notepad'
                  ? `Remote Notepad on ${host}`
                  : `Remote System Status - ${host}`}
              </span>
            </div>
            <div className="p-3 bg-white">
              {openTool === 'notepad' ? (
                <textarea
                  aria-label="Remote notepad editor"
                  value={remoteNote}
                  onChange={(e) => setRemoteNote(e.target.value)}
                  rows={8}
                  className="xp-input w-full font-mono"
                />
              ) : (
                <div className="flex flex-col gap-1.5">
                  <div><strong>Remote Host:</strong> {host}</div>
                  <div><strong>OS:</strong> Microsoft Windows XP Professional SP3</div>
                  <div><strong>Logged On User:</strong> {username}</div>
                  <div><strong>Network Latency:</strong> 4 ms (Simulated LAN)</div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="h-[28px] -mx-4 -mb-4 px-2 xp-taskbar flex items-center justify-between text-white">
          <span className="font-bold">Remote Session: {host}</span>
          <button
            type="button"
            onClick={onDisconnect}
            className="xp-button text-black"
          >
            Disconnect Session
          </button>
        </div>
      </div>
    </div>
  );
};

interface RemoteAssistanceAppProps {
  username: string;
}

export const RemoteAssistanceApp: React.FC<RemoteAssistanceAppProps> = ({ username }) => {
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [helperActive, setHelperActive] = useState(false);
  const [messages, setMessages] = useState<Array<{ who: string; text: string }>>([]);
  const [chatInput, setChatInput] = useState('');

  const createInvite = () => {
    const code = `XP-${Math.floor(1000 + Math.random() * 8999)}-${Math.floor(100 + Math.random() * 899)}`;
    setInviteCode(code);
    setHelperActive(false);
  };

  const startDemoHelper = () => {
    setHelperActive(true);
    setMessages([
      {
        who: 'Helper (Support Technician)',
        text: `Connected via invitation ${inviteCode}. Viewing ${username}'s desktop in read-only demo mode.`,
      },
    ]);
  };

  const sendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const text = chatInput.trim();
    setMessages((prev) => [
      ...prev,
      { who: username, text },
      { who: 'Helper (Support Technician)', text: `Received: "${text}". Everything looks normal!` },
    ]);
    setChatInput('');
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#ece9d8] p-3 text-[11px] gap-3">
      <div className="bg-white border border-[#9ebde8] p-3 flex items-center gap-3">
        <XpIcon name="remote_assistance" size={32} />
        <div>
          <div className="font-bold text-[13px] text-[#0b3c8d]">Remote Assistance</div>
          <div className="text-[#444444]">
            Create a local invitation ticket or simulate a Remote Assistance support session.
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <button type="button" onClick={createInvite} className="xp-button xp-button-default">
          Invite someone to help you
        </button>
        {inviteCode && !helperActive && (
          <button type="button" onClick={startDemoHelper} className="xp-button">
            Simulate Helper Connect
          </button>
        )}
        {helperActive && (
          <button
            type="button"
            onClick={() => setHelperActive(false)}
            className="xp-button"
          >
            End Assistance Session
          </button>
        )}
      </div>

      {inviteCode && (
        <div className="bg-[#f5f3ea] border border-[#aca899] p-2">
          <strong>Invitation Ticket:</strong> <code>{inviteCode}</code>{' '}
          {helperActive ? '— Helper Connected' : '— Waiting for helper'}
        </div>
      )}

      {helperActive && (
        <div className="flex-1 min-h-0 bg-white border border-[#7f9db9] flex flex-col">
          <div className="flex-1 overflow-y-auto xp-scroll p-2 flex flex-col gap-1">
            {messages.map((m, i) => (
              <div key={i}>
                <strong className="text-[#0b3c8d]">{m.who}:</strong> {m.text}
              </div>
            ))}
          </div>
          <form onSubmit={sendChat} className="p-2 border-t border-[#d4d0c8] flex gap-1.5">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Send message to helper..."
              className="xp-input flex-1"
            />
            <button type="submit" className="xp-button">
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
