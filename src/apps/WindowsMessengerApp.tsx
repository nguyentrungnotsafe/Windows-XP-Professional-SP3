import React, { useEffect, useState } from 'react';
import type { MessengerMessage, SystemState } from '../types/os';
import { XpIcon } from '../components/xp/XpIcons';

interface WindowsMessengerAppProps {
  system: SystemState;
  onUpdateSystem: (updater: (prev: SystemState) => SystemState) => void;
  onTitleChange: (title: string) => void;
}

const CANNED_REPLIES: Record<string, string[]> = {
  'sam.chen@contoso.local': [
    'Got it! Running smoothly here on Windows XP Professional SP3.',
    'Nice! Try sending a drawing through Outlook Express or checking Sound Recorder.',
    'Sounds good — let me know if you need help testing anything else on the workstation.',
  ],
  'alex@xp-workstation.local': [
    'Thanks for the ping! I also check my local Outlook Express inbox.',
    'I am wrapping up the Q4 notes — talk soon!',
  ],
};

export const WindowsMessengerApp: React.FC<WindowsMessengerAppProps> = ({
  system,
  onUpdateSystem,
  onTitleChange,
}) => {
  const [activePeerEmail, setActivePeerEmail] = useState<string>(
    system.messengerContacts[0]?.email ?? 'sam.chen@contoso.local'
  );
  const [draft, setDraft] = useState('');

  useEffect(() => {
    onTitleChange(
      system.messengerSignedIn
        ? `Windows Messenger (${system.messengerStatus})`
        : 'Windows Messenger'
    );
  }, [system.messengerSignedIn, system.messengerStatus, onTitleChange]);

  const activeContact =
    system.messengerContacts.find((c) => c.email === activePeerEmail) ??
    system.messengerContacts[0];
  const thread = activeContact ? system.messengerHistory[activeContact.email] ?? [] : [];

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !activeContact) return;

    const now = Date.now();
    const userMsg: MessengerMessage = {
      id: `im_u_${now}`,
      sender: system.activeUsername,
      text,
      timestamp: now,
    };

    const replyPool = CANNED_REPLIES[activeContact.email] ?? ['Message received!'];
    const replyText = replyPool[thread.length % replyPool.length];
    const replyMsg: MessengerMessage = {
      id: `im_p_${now + 1}`,
      sender: activeContact.displayName,
      text: replyText,
      timestamp: now + 350,
    };

    onUpdateSystem((prev) => ({
      ...prev,
      messengerHistory: {
        ...prev.messengerHistory,
        [activeContact.email]: [
          ...(prev.messengerHistory[activeContact.email] ?? []),
          userMsg,
          replyMsg,
        ],
      },
    }));
    setDraft('');
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#f5f8fc] text-[11px]">
      <div className="bg-gradient-to-r from-[#1d5bb8] to-[#5694e8] text-white px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <XpIcon name="messenger" size={22} />
          <div>
            <div className="font-bold">Windows Messenger</div>
            <div className="text-[10px] text-[#dcebff]">
              {system.messengerSignedIn
                ? `${system.activeUsername} (${system.messengerStatus})`
                : 'Not signed in (Local simulated contacts)'}
            </div>
          </div>
        </div>
        {system.messengerSignedIn && (
          <button
            type="button"
            onClick={() =>
              onUpdateSystem((prev) => ({ ...prev, messengerSignedIn: false }))
            }
            className="xp-button text-black"
          >
            Sign Out
          </button>
        )}
      </div>

      {!system.messengerSignedIn ? (
        <div className="flex-1 flex flex-col items-center justify-center p-5 gap-3 text-center">
          <XpIcon name="messenger" size={44} />
          <div className="font-bold text-[13px] text-[#0b3c8d]">
            Sign in to Windows Messenger
          </div>
          <p className="text-[#444444] max-w-[240px]">
            Connect to your local XP contact list and send persisted messages to Sam Chen or Alex Rivera.
          </p>
          <button
            type="button"
            onClick={() =>
              onUpdateSystem((prev) => ({ ...prev, messengerSignedIn: true }))
            }
            className="xp-button xp-button-default px-4"
          >
            Sign In as {system.activeUsername}
          </button>
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="bg-[#ece9d8] border-b border-[#aca899] px-2 py-1 flex items-center justify-between">
            <span>My Status:</span>
            <select
              aria-label="Messenger Status"
              value={system.messengerStatus}
              onChange={(e) =>
                onUpdateSystem((prev) => ({
                  ...prev,
                  messengerStatus: e.target.value as SystemState['messengerStatus'],
                }))
              }
              className="xp-input"
            >
              <option value="Online">Online</option>
              <option value="Busy">Busy</option>
              <option value="Away">Away</option>
              <option value="Appear Offline">Appear Offline</option>
            </select>
          </div>

          {/* Contacts List */}
          <div className="border-b border-[#aca899] bg-white p-1.5 flex flex-col gap-1 max-h-[110px] overflow-y-auto xp-scroll">
            {system.messengerContacts.map((c) => {
              const selected = c.email === activeContact?.email;
              return (
                <button
                  key={c.email}
                  type="button"
                  onClick={() => setActivePeerEmail(c.email)}
                  className={`flex items-center justify-between px-2 py-1 rounded-[2px] text-left cursor-default ${
                    selected ? 'bg-[#316ac5] text-white' : 'hover:bg-[#eef4fd]'
                  }`}
                >
                  <span className="font-bold">● {c.displayName}</span>
                  <span className="text-[10px] opacity-85">{c.status}</span>
                </button>
              );
            })}
          </div>

          {/* Conversation */}
          {activeContact && (
            <>
              <div className="px-2 py-1 bg-[#e5effd] border-b border-[#c2d4f0] font-bold text-[#0b3c8d]">
                Chat with {activeContact.displayName} — {activeContact.personalMessage}
              </div>
              <div className="flex-1 min-h-0 bg-white overflow-y-auto xp-scroll p-2 flex flex-col gap-1.5">
                {thread.map((msg) => (
                  <div key={msg.id} className="leading-[1.4]">
                    <span className="font-bold text-[#0b3c8d]">{msg.sender}: </span>
                    <span>{msg.text}</span>
                  </div>
                ))}
              </div>
              <form
                onSubmit={handleSend}
                className="p-2 bg-[#ece9d8] border-t border-[#aca899] flex gap-1.5"
              >
                <input
                  type="text"
                  aria-label="Instant message text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={`Message ${activeContact.displayName}...`}
                  className="xp-input flex-1"
                />
                <button type="submit" className="xp-button xp-button-default">
                  Send
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
};
