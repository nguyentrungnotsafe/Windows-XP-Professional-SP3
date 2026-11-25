import React from 'react';
import type { SessionPhase, UserAccount } from '../../types/os';
import { XpIcon } from './XpIcons';

interface LogonScreenProps {
  phase: Exclude<SessionPhase, 'desktop' | 'remote_desktop'>;
  users: UserAccount[];
  activeUsername: string;
  onLogOn: (username: string) => void;
  onTurnOff: () => void;
}

export const LogonScreen: React.FC<LogonScreenProps> = ({
  phase,
  users,
  activeUsername,
  onLogOn,
  onTurnOff,
}) => {
  return (
    <div className="fixed inset-0 z-[10000] flex flex-col justify-between bg-[#5a7edc] text-[#ffffff] select-none">
      {/* Top dark navy bar */}
      <div className="h-[72px] shrink-0 bg-[#00309c] border-b-2 border-[#7ba4f2]" />

      {/* Center Welcome / Shut Down surface */}
      <div
        className="flex-1 flex items-center justify-center p-6 relative"
        style={{
          background:
            'radial-gradient(circle at 22% 22%, rgba(162, 198, 255, 0.55) 0%, rgba(90, 126, 220, 0.95) 45%, #4b6fd1 100%)',
        }}
      >
        {phase === 'shut_down' ? (
          <div className="flex flex-col items-center gap-5 text-center max-w-[420px]">
            <div className="flex items-center gap-3">
              <XpIcon name="windows_flag" size={44} />
              <div className="text-left">
                <div className="text-[11px] opacity-90">Microsoft</div>
                <div className="text-[28px] font-bold tracking-tight leading-none">
                  Windows<span className="text-[#f58a24] text-[18px] align-top ml-0.5">xp</span>
                </div>
              </div>
            </div>
            <p className="text-[16px] font-medium">
              Windows XP is now shut down. Your saved files and settings are preserved.
            </p>
            <button
              type="button"
              onClick={() => onLogOn(activeUsername)}
              className="px-5 py-2 rounded-[4px] bg-[#2f75d8] hover:bg-[#3f86eb] border border-[#b4d1fb] text-[13px] font-bold text-white shadow cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
            >
              Power On &amp; Return to Desktop
            </button>
          </div>
        ) : (
          <div className="w-full max-w-[780px] flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12">
            {/* Left branding */}
            <div className="flex flex-col items-center md:items-end text-center md:text-right">
              <div className="flex items-center gap-3 mb-3">
                <XpIcon name="windows_flag" size={48} />
                <div className="text-left">
                  <div className="text-[11px] opacity-90">Microsoft</div>
                  <div className="text-[30px] font-bold tracking-tight leading-none">
                    Windows<span className="text-[#f58a24] text-[18px] align-top ml-0.5">xp</span>
                  </div>
                </div>
              </div>
              <p className="text-[16px] font-semibold">To begin, click your user name</p>
            </div>

            <div className="hidden md:block w-[1px] h-[210px] bg-gradient-to-b from-transparent via-white/45 to-transparent" />

            {/* Right user tiles */}
            <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto">
              {users.map((u) => {
                const isPrev = u.username === activeUsername;
                return (
                  <button
                    key={u.username}
                    type="button"
                    onClick={() => onLogOn(u.username)}
                    className={`flex items-center gap-3.5 px-4 py-2.5 rounded-[6px] bg-gradient-to-r from-[#1f4eb6] via-[#2b62d2] to-transparent border ${
                      isPrev ? 'border-[#f4c55b]' : 'border-[#8db4f5]/70'
                    } hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white cursor-pointer text-left min-w-[270px]`}
                  >
                    <div className="w-[48px] h-[48px] rounded-[4px] border-2 border-[#f4c55b] overflow-hidden shrink-0">
                      <XpIcon name="user_avatar" size={44} />
                    </div>
                    <div>
                      <div className="text-[16px] font-bold text-white">{u.username}</div>
                      <div className="text-[11px] text-[#cfe0ff]">
                        {u.role} — Click to log on
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Bottom dark navy bar */}
      <div className="h-[64px] shrink-0 bg-[#00309c] border-t-2 border-[#e59235] px-6 flex items-center justify-between">
        {phase === 'logged_off' ? (
          <button
            type="button"
            onClick={onTurnOff}
            className="flex items-center gap-2 text-[14px] font-medium hover:underline focus-visible:outline focus-visible:outline-1 focus-visible:outline-white cursor-pointer"
          >
            <XpIcon name="turn_off" size={24} />
            <span>Turn off computer</span>
          </button>
        ) : (
          <div />
        )}
        <div className="text-[11px] text-[#c7d8f7] text-right hidden sm:block">
          All user accounts, documents, and appearance settings are saved in this browser.
        </div>
      </div>
    </div>
  );
};
