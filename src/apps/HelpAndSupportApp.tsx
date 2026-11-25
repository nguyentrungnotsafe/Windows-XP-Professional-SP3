import React, { useMemo, useState } from 'react';
import type { AppId, SystemState } from '../types/os';
import { XpIcon } from '../components/xp/XpIcons';

interface HelpArticle {
  id: string;
  category: string;
  title: string;
  summary: string;
  body: string[];
  launchAppId?: AppId;
  launchLabel?: string;
}

const HELP_ARTICLES: HelpArticle[] = [
  {
    id: 'getting_started',
    category: 'Windows Basics',
    title: 'Welcome to Windows XP Professional SP3',
    summary: 'Overview of the desktop, Start menu, taskbar, and window controls.',
    body: [
      'Click the green Start button at the bottom-left corner to access installed applications, My Documents, Control Panel, Search, and Run.',
      'Drag any window by its blue Luna title bar, resize from window edges, or minimize/maximize using the top-right caption buttons.',
      'All documents, drawings, system preferences, and Recycle Bin items persist automatically in your browser storage.',
    ],
    launchAppId: 'tour',
    launchLabel: 'Launch Tour Windows XP',
  },
  {
    id: 'files_recycle',
    category: 'Files & Folders',
    title: 'Managing Files, Search Companion, and ZIP Archives',
    summary: 'Create folders, search contents, compress ZIPs, and restore deleted items.',
    body: [
      'Use Windows Explorer (My Computer or My Documents) to create folders, rename items (F2), copy/cut/paste, or move files to the Recycle Bin.',
      'Click Search on the toolbar or open Start -> Search to find files by name, wildcard (*.txt), category, or text content.',
      'Right-click any file or folder and choose Send To -> Compressed (zipped) Folder to create a real Store-mode ZIP archive you can browse and extract.',
    ],
    launchAppId: 'search',
    launchLabel: 'Open Search Companion',
  },
  {
    id: 'editors_paint',
    category: 'Accessories',
    title: 'Notepad, WordPad, Paint, and Picture Viewer',
    summary: 'Author plain text, rich text (.rtf), pixel drawings (.png), and print previews.',
    body: [
      'Notepad supports Find/Replace, Go To Line, Word Wrap, and plain-text .txt files.',
      'WordPad provides font selection, bold/italic/underline, colors, alignment, bullet lists, Print Preview, and prints directly to Printers and Faxes.',
      'Paint supports pencil, brush, eraser, flood fill, shapes, eyedropper, magnifier, selection, and text stamping.',
    ],
    launchAppId: 'wordpad',
    launchLabel: 'Open WordPad',
  },
  {
    id: 'admin_tools',
    category: 'Performance & Maintenance',
    title: 'Administrative Tools, Services, Disk Cleanup & System Restore',
    summary: 'Inspect event logs, toggle services like Print Spooler, clean temp files, and create restore points.',
    body: [
      'Open Control Panel -> Administrative Tools (or Run: services.msc, eventvwr.msc, compmgmt.msc) to monitor simulator services and logs.',
      'Disk Cleanup calculates reclaimable space from C:\\WINDOWS\\Temp and the Recycle Bin.',
      'System Restore captures your system settings (folder options, clock, accessibility, components) without removing personal documents.',
    ],
    launchAppId: 'control',
    launchLabel: 'Open Control Panel',
  },
  {
    id: 'run_aliases',
    category: 'Shortcuts',
    title: 'Useful Start -> Run Commands',
    summary: 'Launch Windows XP programs and MMC consoles directly from Run.',
    body: [
      'Accessories: notepad, wordpad, mspaint, calc, charmap, cmd, wab, wiaacmgr',
      'Internet & Media: iexplore, msimn (Outlook Express), msmsgs, wmplayer, moviemk, sndrec32, sndvol32',
      'Control Panel: desk.cpl, appwiz.cpl, sysdm.cpl, timedate.cpl, intl.cpl, access.cpl, nusrmgr.cpl, ncpa.cpl, firewall.cpl',
      'System & Admin: taskmgr, msconfig, regedit, msinfo32, dxdiag, cleanmgr, rstrui, services.msc, eventvwr.msc, compmgmt.msc, gpedit.msc',
    ],
    launchAppId: 'run',
    launchLabel: 'Open Run Dialog',
  },
];

export const HelpAndSupportApp: React.FC<{
  onLaunchApp: (appId: AppId) => void;
}> = ({ onLaunchApp }) => {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(HELP_ARTICLES[0].id);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return HELP_ARTICLES;
    return HELP_ARTICLES.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.summary.toLowerCase().includes(q) ||
        a.body.some((p) => p.toLowerCase().includes(q))
    );
  }, [query]);

  const activeArticle =
    filtered.find((a) => a.id === selectedId) ?? filtered[0] ?? HELP_ARTICLES[0];

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#ffffff] text-[11px]">
      <div className="bg-gradient-to-r from-[#0e4bb5] via-[#2976e2] to-[#68aef7] text-white px-4 py-2.5 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <XpIcon name="help" size={28} />
          <div>
            <div className="text-[14px] font-bold">Help and Support Center</div>
            <div className="text-[10px] text-[#dcebff]">Microsoft Windows XP Professional SP3</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <label htmlFor="xp-help-search" className="text-[11px]">
            Search
          </label>
          <input
            id="xp-help-search"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search help topics..."
            className="xp-input w-[180px] text-black"
          />
        </div>
      </div>

      <div className="flex-1 min-h-0 flex">
        <aside className="w-[220px] shrink-0 bg-[#eef3fc] border-r border-[#aca899] p-2.5 overflow-y-auto xp-scroll flex flex-col gap-1">
          <div className="font-bold text-[#0b3c8d] mb-1">Pick a Help topic</div>
          {filtered.length === 0 ? (
            <div className="text-[#666666] p-1">No matching topics found.</div>
          ) : (
            filtered.map((art) => (
              <button
                key={art.id}
                type="button"
                onClick={() => setSelectedId(art.id)}
                className={`text-left px-2 py-1.5 rounded-[2px] cursor-default ${
                  activeArticle.id === art.id
                    ? 'bg-[#316ac5] text-white font-bold'
                    : 'hover:bg-[#d8e6fb] text-[#002868]'
                }`}
              >
                <div className="text-[10px] opacity-80">{art.category}</div>
                <div className="truncate">{art.title}</div>
              </button>
            ))
          )}
        </aside>

        <div className="flex-1 min-w-0 p-4 overflow-y-auto xp-scroll flex flex-col gap-3">
          <div className="border-b border-[#8db2e8] pb-2">
            <div className="text-[10px] uppercase tracking-wide text-[#316ac5] font-bold">
              {activeArticle.category}
            </div>
            <h2 className="text-[16px] font-bold text-[#003399] mt-0.5">{activeArticle.title}</h2>
            <p className="text-[#444444] mt-0.5">{activeArticle.summary}</p>
          </div>
          <div className="flex flex-col gap-2.5 leading-[1.55]">
            {activeArticle.body.map((para, i) => (
              <p key={i} className="text-[#111111]">
                {para}
              </p>
            ))}
          </div>
          {activeArticle.launchAppId && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => onLaunchApp(activeArticle.launchAppId!)}
                className="xp-button xp-button-default"
              >
                {activeArticle.launchLabel ?? 'Open Program'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const TOUR_SLIDES = [
  {
    title: 'Safe and Easy Personal Computing',
    subtitle: 'Clean Luna Blue Desktop & Two-Column Start Menu',
    points: [
      'Your most frequently used tools—Internet Explorer, Outlook Express, Notepad, Paint, and Windows Media Player—sit cleanly on the left column.',
      'Your personal libraries—My Documents, My Pictures, My Music, My Computer, and Control Panel—are always one click away on the right.',
    ],
    color: 'from-[#1755c4] to-[#4b95f0]',
  },
  {
    title: 'Unlock the World of Digital Media',
    subtitle: 'Windows Media Player, Movie Maker & Sound Recorder',
    points: [
      'Play sample music tracks and audio CDs in Windows Media Player with live audio visualization and Master Volume control.',
      'Assemble photos and music onto the Windows Movie Maker storyboard, preview your movie, and save .mswmm projects into My Documents.',
    ],
    color: 'from-[#287833] to-[#56b54f]',
  },
  {
    title: 'Connected Office & Communications',
    subtitle: 'Outlook Express, Windows Messenger, Address Book & Remote Desktop',
    points: [
      'Switch between local email identities in Outlook Express, compose messages with Paint attachments, and pick recipients from Address Book.',
      'Chat with demo buddies in Windows Messenger or connect to XP-LAB-02 using Remote Desktop Connection.',
    ],
    color: 'from-[#b85214] to-[#ee8e35]',
  },
  {
    title: 'Built-In Maintenance & Classic Games',
    subtitle: 'Administrative Tools, Disk Cleanup, System Restore & Games',
    points: [
      'Manage Print Spooler services, view live Event Viewer entries, clean Temp files, or roll back settings with System Restore.',
      'Take a break with Solitaire, Spider Solitaire, FreeCell, Minesweeper, Hearts, Space Cadet Pinball, and Zone Board Games.',
    ],
    color: 'from-[#5f2f9c] to-[#9057d6]',
  },
];

export const TourWindowsXpApp: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [slideIdx, setSlideIdx] = useState(0);
  const slide = TOUR_SLIDES[slideIdx];

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#0d3a8a] text-white text-[11px]">
      <div className={`p-5 bg-gradient-to-r ${slide.color} border-b border-white/25 flex items-center justify-between`}>
        <div>
          <div className="text-[11px] uppercase tracking-wider opacity-85">
            Tour Windows XP Professional ({slideIdx + 1} of {TOUR_SLIDES.length})
          </div>
          <h2 className="text-[19px] font-bold mt-1">{slide.title}</h2>
          <div className="text-[12px] text-white/90">{slide.subtitle}</div>
        </div>
        <XpIcon name="windows_flag" size={44} />
      </div>

      <div className="flex-1 bg-[#f5f8fe] text-[#111111] p-6 flex flex-col justify-between">
        <ul className="list-disc pl-5 flex flex-col gap-3 text-[12px] leading-[1.55]">
          {slide.points.map((pt, idx) => (
            <li key={idx}>{pt}</li>
          ))}
        </ul>

        <div className="flex items-center justify-between border-t border-[#c7d6ed] pt-3">
          <div className="flex gap-1.5">
            {TOUR_SLIDES.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Chapter ${i + 1}`}
                onClick={() => setSlideIdx(i)}
                className={`w-6 h-5 rounded-[2px] border text-[10px] ${
                  i === slideIdx
                    ? 'bg-[#316ac5] text-white border-[#1b4a96] font-bold'
                    : 'bg-white text-black border-[#7f9db9]'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={slideIdx === 0}
              onClick={() => setSlideIdx((i) => Math.max(0, i - 1))}
              className="xp-button"
            >
              &lt; Back
            </button>
            {slideIdx < TOUR_SLIDES.length - 1 ? (
              <button
                type="button"
                onClick={() => setSlideIdx((i) => Math.min(TOUR_SLIDES.length - 1, i + 1))}
                className="xp-button xp-button-default"
              >
                Next &gt;
              </button>
            ) : (
              <button type="button" onClick={onClose} className="xp-button xp-button-default">
                Finish Tour
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const WindowsUpdateApp: React.FC<{
  system: SystemState;
  onInstallUpdates: (ids: string[]) => void;
}> = ({ system, onInstallUpdates }) => {
  const [phase, setPhase] = useState<'idle' | 'scanning' | 'results' | 'installing' | 'history'>('idle');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);

  const available = system.windowsUpdates.filter((u) => !u.installed);
  const installed = system.windowsUpdates.filter((u) => u.installed);

  const runScan = () => {
    setPhase('scanning');
    setProgress(0);
    window.setTimeout(() => {
      setSelectedIds(available.map((u) => u.id));
      setPhase('results');
    }, 350);
  };

  const startInstall = () => {
    if (selectedIds.length === 0) return;
    setPhase('installing');
    setProgress(35);
    window.setTimeout(() => setProgress(75), 250);
    window.setTimeout(() => {
      setProgress(100);
      onInstallUpdates(selectedIds);
      setPhase('history');
    }, 550);
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#ffffff] text-[11px]">
      <div className="bg-gradient-to-r from-[#0e4bb5] via-[#2674de] to-[#5ea6f5] text-white px-4 py-2.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <XpIcon name="windows_update" size={28} />
          <div>
            <div className="text-[14px] font-bold">Microsoft Windows Update</div>
            <div className="text-[10px] text-[#dcebff]">
              Simulated offline SP3 update catalog ({available.length} available, {installed.length} installed)
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setPhase(phase === 'history' ? 'idle' : 'history')}
          className="xp-button text-black"
        >
          {phase === 'history' ? 'Check for Updates' : 'Review Installation History'}
        </button>
      </div>

      <div className="flex-1 min-h-0 p-4 overflow-y-auto xp-scroll flex flex-col gap-3">
        {phase === 'idle' && (
          <div className="flex flex-col gap-3 max-w-[560px]">
            <h2 className="text-[14px] font-bold text-[#0b3c8d]">
              Keep your computer up to date
            </h2>
            <p className="text-[#333333] leading-[1.5]">
              Windows Update checks a local historical catalog of XP Service Pack 3 updates so you
              can test update installation and inspect persistent history without network access.
            </p>
            <div className="flex gap-2">
              <button type="button" onClick={runScan} className="xp-button xp-button-default">
                Express (Recommended)
              </button>
              <button type="button" onClick={runScan} className="xp-button">
                Custom Scan
              </button>
            </div>
          </div>
        )}

        {phase === 'scanning' && (
          <div className="p-4 border border-[#9ebde8] bg-[#f5f9ff]">
            <div className="font-bold text-[#0b3c8d]">Checking for the latest updates for your computer...</div>
            <div className="h-3 mt-2 bg-[#d6e4f7] border border-[#7f9db9] overflow-hidden">
              <div className="h-full bg-[#36a036] w-2/3 animate-pulse" />
            </div>
          </div>
        )}

        {phase === 'results' && (
          <div className="flex flex-col gap-3">
            <h3 className="text-[13px] font-bold text-[#0b3c8d]">
              {available.length === 0
                ? 'No high-priority or optional updates remaining.'
                : `${available.length} update(s) available for Windows XP SP3:`}
            </h3>
            {available.map((u) => {
              const checked = selectedIds.includes(u.id);
              return (
                <label
                  key={u.id}
                  className="border border-[#c7d6ed] bg-[#f8fbff] p-2.5 flex items-start gap-2.5 cursor-default"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) =>
                      setSelectedIds((prev) =>
                        e.target.checked ? [...prev, u.id] : prev.filter((id) => id !== u.id)
                      )
                    }
                  />
                  <div className="flex-1">
                    <div className="font-bold text-[#0b3c8d]">
                      {u.title} ({u.kb}) — <span className="text-[#555555]">{u.sizeLabel}</span>
                    </div>
                    <div className="text-[#444444] mt-0.5">{u.description}</div>
                  </div>
                </label>
              );
            })}
            {available.length > 0 && (
              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={selectedIds.length === 0}
                  onClick={startInstall}
                  className="xp-button xp-button-default"
                >
                  Install Updates ({selectedIds.length})
                </button>
              </div>
            )}
          </div>
        )}

        {phase === 'installing' && (
          <div className="p-4 border border-[#9ebde8] bg-[#f5f9ff]">
            <div className="font-bold text-[#0b3c8d]">Installing selected updates... ({progress}%)</div>
            <div className="h-4 mt-2 bg-[#ffffff] border border-[#7f9db9] p-[1px]">
              <div className="h-full bg-[#36a036] transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {phase === 'history' && (
          <div className="flex flex-col gap-2">
            <h3 className="text-[13px] font-bold text-[#0b3c8d]">Installation History</h3>
            <table className="w-full border-collapse border border-[#aca899] text-left">
              <thead>
                <tr className="bg-[#ece9d8]">
                  <th className="border border-[#aca899] p-1.5">KB</th>
                  <th className="border border-[#aca899] p-1.5">Update</th>
                  <th className="border border-[#aca899] p-1.5">Status</th>
                  <th className="border border-[#aca899] p-1.5">Date</th>
                </tr>
              </thead>
              <tbody>
                {system.windowsUpdates.map((u) => (
                  <tr key={u.id}>
                    <td className="border border-[#aca899] p-1.5 font-mono">{u.kb}</td>
                    <td className="border border-[#aca899] p-1.5">{u.title}</td>
                    <td className="border border-[#aca899] p-1.5">
                      {u.installed ? (
                        <span className="text-[#237a23] font-bold">Succeeded</span>
                      ) : (
                        <span className="text-[#666666]">Pending</span>
                      )}
                    </td>
                    <td className="border border-[#aca899] p-1.5">
                      {u.installedAt ? new Date(u.installedAt).toLocaleString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
