import React, { useEffect, useRef, useState } from 'react';
import type { AppId, ModalPromptRequest, SystemState, WindowInstance } from '../types/os';
import { XpIcon } from '../components/xp/XpIcons';
import { XpMenuBar, type XpMenuGroup } from '../components/xp/XpMenuBar';

const DEFAULT_HOME_URL = 'http://home.xp.local/';

interface LocalPage {
  url: string;
  title: string;
}

const LOCAL_PAGES: Record<string, LocalPage> = {
  'http://home.xp.local/': {
    url: 'http://home.xp.local/',
    title: 'MSN Start Page',
  },
  'http://tour.xp.local/': {
    url: 'http://tour.xp.local/',
    title: 'Windows XP Professional Tour',
  },
  'http://news.xp.local/': {
    url: 'http://news.xp.local/',
    title: 'Technology & Computing Dispatch',
  },
  'http://support.xp.local/': {
    url: 'http://support.xp.local/',
    title: 'Windows XP Help & Reference',
  },
};

interface InternetExplorerAppProps {
  windowId: string;
  system: SystemState;
  initialUrl?: string;
  onUpdateSystem: (updater: (prev: SystemState) => SystemState) => void;
  onLaunchApp: (appId: AppId, payload?: WindowInstance['payload']) => void;
  onTitleChange: (title: string) => void;
  onOpenModal: (modal: Omit<ModalPromptRequest, 'id'>) => void;
  onCloseWindow: () => void;
}

export const InternetExplorerApp: React.FC<InternetExplorerAppProps> = ({
  windowId,
  system,
  initialUrl,
  onUpdateSystem,
  onLaunchApp,
  onTitleChange,
  onOpenModal,
  onCloseWindow,
}) => {
  const homeUrl = system.ieHomePage || DEFAULT_HOME_URL;
  const startUrl = initialUrl || homeUrl;

  const [history, setHistory] = useState<string[]>([startUrl]);
  const [historyIdx, setHistoryIdx] = useState<number>(0);
  const [addressInput, setAddressInput] = useState<string>(startUrl);
  const [refreshTick, setRefreshTick] = useState<number>(0);
  const [sidePanel, setSidePanel] = useState<'none' | 'favorites' | 'history'>('none');
  const [showFindBar, setShowFindBar] = useState(false);
  const [findQuery, setFindQuery] = useState('');
  const [findStatus, setFindStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const pageContainerRef = useRef<HTMLDivElement>(null);
  const onTitleChangeRef = useRef(onTitleChange);
  onTitleChangeRef.current = onTitleChange;

  const currentUrl = history[historyIdx] ?? homeUrl;
  const localPage = LOCAL_PAGES[currentUrl];
  const isExternal = !localPage && /^https?:\/\//i.test(currentUrl);
  const iisInstalled = Boolean(system.optionalComponents.iis);
  const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)/i.test(currentUrl);

  const pageTitle = localPage
    ? localPage.title
    : isLocalhost && iisInstalled
    ? 'IIS 5.1 Local Web Server'
    : isExternal
    ? currentUrl
    : 'Cannot find server';

  useEffect(() => {
    onTitleChangeRef.current(`${pageTitle} - Microsoft Internet Explorer`);
    setAddressInput(currentUrl);
  }, [currentUrl, pageTitle]);

  const normalizeInputUrl = (raw: string): string => {
    const trimmed = raw.trim();
    if (!trimmed) return homeUrl;
    const lower = trimmed.toLowerCase();
    if (lower === 'home' || lower === 'about:home' || lower === 'home.xp.local') {
      return 'http://home.xp.local/';
    }
    if (lower === 'tour' || lower === 'tour.xp.local') {
      return 'http://tour.xp.local/';
    }
    if (lower === 'news' || lower === 'news.xp.local') {
      return 'http://news.xp.local/';
    }
    if (lower === 'support' || lower === 'support.xp.local') {
      return 'http://support.xp.local/';
    }
    if (lower === 'localhost' || lower === 'http://localhost' || lower === 'http://localhost/') {
      return 'http://localhost/';
    }
    if (/^https?:\/\//i.test(trimmed)) {
      if (LOCAL_PAGES[trimmed]) return trimmed;
      if (LOCAL_PAGES[trimmed + '/']) return trimmed + '/';
      return trimmed;
    }
    const withProto = `http://${trimmed}`;
    if (LOCAL_PAGES[withProto]) return withProto;
    if (LOCAL_PAGES[withProto + '/']) return withProto + '/';
    return withProto;
  };

  const recordHistory = (url: string, title: string) => {
    onUpdateSystem((prev) => ({
      ...prev,
      ieHistory: [
        { url, title, visitedAt: Date.now() },
        ...prev.ieHistory.filter((h) => h.url !== url),
      ].slice(0, 40),
    }));
  };

  const navigate = (rawTarget: string) => {
    const nextUrl = normalizeInputUrl(rawTarget);
    setLoading(true);
    window.setTimeout(() => setLoading(false), 120);

    const nextTitle = LOCAL_PAGES[nextUrl]?.title ?? nextUrl;
    recordHistory(nextUrl, nextTitle);

    if (nextUrl === currentUrl) {
      setRefreshTick((t) => t + 1);
      return;
    }
    const nextHistory = history.slice(0, historyIdx + 1);
    nextHistory.push(nextUrl);
    setHistory(nextHistory);
    setHistoryIdx(nextHistory.length - 1);
  };

  const handleAddFavorite = () => {
    onUpdateSystem((prev) => {
      if (prev.ieFavorites.some((f) => f.url === currentUrl)) return prev;
      return {
        ...prev,
        ieFavorites: [...prev.ieFavorites, { url: currentUrl, title: pageTitle }],
      };
    });
  };

  const runFindInPage = () => {
    const q = findQuery.trim().toLowerCase();
    if (!q || !pageContainerRef.current) {
      setFindStatus('');
      return;
    }
    const text = pageContainerRef.current.innerText.toLowerCase();
    const count = text.split(q).length - 1;
    setFindStatus(count > 0 ? `${count} match(es) on page` : 'No matches found');
  };

  const canGoBack = historyIdx > 0;
  const canGoForward = historyIdx < history.length - 1;

  const menuGroups: XpMenuGroup[] = [
    {
      id: 'file',
      label: 'File',
      items: [
        { id: 'home', label: 'Home Page', onSelect: () => navigate(homeUrl) },
        { id: 'close', label: 'Close', separatorBefore: true, onSelect: onCloseWindow },
      ],
    },
    {
      id: 'edit',
      label: 'Edit',
      items: [
        {
          id: 'find',
          label: 'Find on This Page...',
          shortcut: 'Ctrl+F',
          onSelect: () => setShowFindBar((s) => !s),
        },
      ],
    },
    {
      id: 'view',
      label: 'View',
      items: [
        {
          id: 'fav_bar',
          label: 'Favorites Explorer Bar',
          checked: sidePanel === 'favorites',
          onSelect: () => setSidePanel((p) => (p === 'favorites' ? 'none' : 'favorites')),
        },
        {
          id: 'hist_bar',
          label: 'History Explorer Bar',
          checked: sidePanel === 'history',
          onSelect: () => setSidePanel((p) => (p === 'history' ? 'none' : 'history')),
        },
        {
          id: 'refresh',
          label: 'Refresh',
          shortcut: 'F5',
          separatorBefore: true,
          onSelect: () => setRefreshTick((t) => t + 1),
        },
      ],
    },
    {
      id: 'favorites',
      label: 'Favorites',
      items: [
        { id: 'add_fav', label: 'Add to Favorites...', onSelect: handleAddFavorite },
        ...system.ieFavorites.map((fav, idx) => ({
          id: `fav_${idx}`,
          label: fav.title,
          separatorBefore: idx === 0,
          onSelect: () => navigate(fav.url),
        })),
      ],
    },
    {
      id: 'tools',
      label: 'Tools',
      items: [
        {
          id: 'opts',
          label: 'Internet Options...',
          onSelect: () => onLaunchApp('inet_opts'),
        },
      ],
    },
    {
      id: 'help',
      label: 'Help',
      items: [
        {
          id: 'about',
          label: 'About Internet Explorer',
          onSelect: () =>
            onOpenModal({
              parentWindowId: windowId,
              kind: 'alert',
              icon: 'info',
              title: 'About Internet Explorer',
              message: 'Microsoft Internet Explorer 6.0 SP3\n128-bit Local Intranet & Offline Channels',
            }),
        },
      ],
    },
  ];

  const renderPageContent = () => {
    if (isLocalhost && iisInstalled) {
      return (
        <div className="max-w-[700px] mx-auto p-5 flex flex-col gap-3">
          <div className="bg-[#003399] text-white p-4 rounded-[3px] flex items-center justify-between">
            <div>
              <h1 className="text-[17px] font-bold">Internet Information Services 5.1</h1>
              <div className="text-[11px] text-[#cfe0ff]">Local Web Server running on {system.computerName}</div>
            </div>
            <XpIcon name="iis" size={34} />
          </div>
          <p className="text-[12px] text-[#222222] leading-[1.5]">
            Default Web Site is active. Manage virtual directories and service status in Administrative Tools → Internet Information Services.
          </p>
          <button
            type="button"
            onClick={() => onLaunchApp('iis_mgr')}
            className="xp-button self-start"
          >
            Open IIS Manager
          </button>
        </div>
      );
    }

    if (currentUrl === 'http://home.xp.local/') {
      return (
        <div className="max-w-[740px] mx-auto p-5 flex flex-col gap-4">
          <div className="bg-gradient-to-r from-[#124aa3] via-[#2776db] to-[#68b0f8] text-white p-4 rounded-[3px] flex items-center justify-between">
            <div>
              <div className="text-[18px] font-bold">MSN Windows XP Portal</div>
              <div className="text-[11px] text-[#dcebff]">
                Local offline edition — fast navigation across bundled channels
              </div>
            </div>
            <XpIcon name="internet_explorer" size={38} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="border border-[#9ebde8] bg-[#f5f9ff] p-3 flex flex-col justify-between gap-2">
              <div>
                <h2 className="text-[13px] font-bold text-[#0b3c8d] mb-1">
                  Discover Windows XP SP3
                </h2>
                <p className="text-[11px] text-[#333333] leading-[1.45]">
                  Explore desktop shortcuts, WordPad rich editing, Paint canvas tools, and Recycle Bin recovery.
                </p>
              </div>
              <a
                href="http://tour.xp.local/"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('http://tour.xp.local/');
                }}
                className="text-[#0033cc] underline font-bold self-start"
              >
                Take the Windows XP Tour &gt;
              </a>
            </div>

            <div className="border border-[#9ebde8] bg-[#f5f9ff] p-3 flex flex-col justify-between gap-2">
              <div>
                <h2 className="text-[13px] font-bold text-[#0b3c8d] mb-1">
                  Computing Dispatch
                </h2>
                <p className="text-[11px] text-[#333333] leading-[1.45]">
                  Read highlights on Luna Blue ergonomics, ClearType clarity, and desktop productivity.
                </p>
              </div>
              <a
                href="http://news.xp.local/"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('http://news.xp.local/');
                }}
                className="text-[#0033cc] underline font-bold self-start"
              >
                Read Today&apos;s Dispatch &gt;
              </a>
            </div>

            <div className="border border-[#9ebde8] bg-[#f5f9ff] p-3 flex flex-col justify-between gap-2">
              <div>
                <h2 className="text-[13px] font-bold text-[#0b3c8d] mb-1">
                  Help &amp; Quick Reference
                </h2>
                <p className="text-[11px] text-[#333333] leading-[1.45]">
                  View Run aliases, administrative consoles, and keyboard tips for this workstation.
                </p>
              </div>
              <a
                href="http://support.xp.local/"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('http://support.xp.local/');
                }}
                className="text-[#0033cc] underline font-bold self-start"
              >
                Open Quick Reference &gt;
              </a>
            </div>
          </div>
        </div>
      );
    }

    if (currentUrl === 'http://tour.xp.local/') {
      return (
        <div className="max-w-[700px] mx-auto p-5 flex flex-col gap-3">
          <div className="border-b-2 border-[#316ac5] pb-2 flex items-center justify-between">
            <h1 className="text-[17px] font-bold text-[#0b3c8d]">
              Windows XP Professional Tour
            </h1>
            <a
              href="http://home.xp.local/"
              onClick={(e) => {
                e.preventDefault();
                navigate('http://home.xp.local/');
              }}
              className="text-[#0033cc] underline"
            >
              Return to Start Page
            </a>
          </div>
          <p className="text-[12px] text-[#222222] leading-[1.55]">
            Windows XP combines the Luna Blue visual style with a task-based Explorer sidebar,
            two-column Start menu, integrated accessories, and MMC administrative tools.
          </p>
          <ul className="list-disc pl-5 flex flex-col gap-1.5 text-[11px] text-[#222222]">
            <li>Use <strong>Start → Run</strong> to launch <code>notepad</code>, <code>wordpad</code>, <code>mspaint</code>, <code>calc</code>, <code>cmd</code>, or <code>services.msc</code>.</li>
            <li>Organize files inside <strong>My Documents</strong>, <strong>My Pictures</strong>, and <strong>Compressed (zipped) Folders</strong>.</li>
            <li>Deleted folders keep their contents intact inside the <strong>Recycle Bin</strong> until restored.</li>
          </ul>
          <div className="pt-2 flex gap-4">
            <a
              href="http://news.xp.local/"
              onClick={(e) => {
                e.preventDefault();
                navigate('http://news.xp.local/');
              }}
              className="text-[#0033cc] underline font-bold"
            >
              Next: Computing Dispatch &gt;
            </a>
            <a
              href="http://support.xp.local/"
              onClick={(e) => {
                e.preventDefault();
                navigate('http://support.xp.local/');
              }}
              className="text-[#0033cc] underline"
            >
              View Run Commands &gt;
            </a>
          </div>
        </div>
      );
    }

    if (currentUrl === 'http://news.xp.local/') {
      return (
        <div className="max-w-[700px] mx-auto p-5 flex flex-col gap-3">
          <div className="border-b-2 border-[#2a7f3a] pb-2 flex items-center justify-between">
            <h1 className="text-[17px] font-bold text-[#1f622c]">
              Technology &amp; Computing Dispatch
            </h1>
            <a
              href="http://home.xp.local/"
              onClick={(e) => {
                e.preventDefault();
                navigate('http://home.xp.local/');
              }}
              className="text-[#0033cc] underline"
            >
              Back to Home
            </a>
          </div>
          <article className="bg-[#f8fafc] border border-[#cbd5e1] p-3">
            <h2 className="text-[13px] font-bold text-[#0f172a]">
              Why the Luna Blue Desktop Remains Iconic
            </h2>
            <p className="text-[11px] text-[#334155] mt-1 leading-[1.5]">
              Introduced in 2001, the Luna interface paired the rolling green hills of Bliss with
              rounded royal-blue title bars, high-contrast Tahoma menus, and a clean two-column Start
              menu separating personal folders from installed applications.
            </p>
          </article>
          <div className="flex gap-4">
            <a
              href="http://support.xp.local/"
              onClick={(e) => {
                e.preventDefault();
                navigate('http://support.xp.local/');
              }}
              className="text-[#0033cc] underline font-bold"
            >
              Read Quick Reference &gt;
            </a>
            <a
              href="http://tour.xp.local/"
              onClick={(e) => {
                e.preventDefault();
                navigate('http://tour.xp.local/');
              }}
              className="text-[#0033cc] underline"
            >
              Windows XP Tour &gt;
            </a>
          </div>
        </div>
      );
    }

    if (currentUrl === 'http://support.xp.local/') {
      return (
        <div className="max-w-[700px] mx-auto p-5 flex flex-col gap-3">
          <div className="border-b-2 border-[#316ac5] pb-2 flex items-center justify-between">
            <h1 className="text-[17px] font-bold text-[#0b3c8d]">
              Windows XP Quick Reference
            </h1>
            <a
              href="http://home.xp.local/"
              onClick={(e) => {
                e.preventDefault();
                navigate('http://home.xp.local/');
              }}
              className="text-[#0033cc] underline"
            >
              Home
            </a>
          </div>
          <table className="w-full border-collapse border border-[#aca899] text-[11px]">
            <thead>
              <tr className="bg-[#ece9d8] text-left">
                <th className="border border-[#aca899] p-1.5">Run Command</th>
                <th className="border border-[#aca899] p-1.5">Opens</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className="border border-[#aca899] p-1.5 font-mono">notepad / wordpad</td><td className="border border-[#aca899] p-1.5">Plain &amp; Rich-Text Editors</td></tr>
              <tr><td className="border border-[#aca899] p-1.5 font-mono">mspaint / calc / cmd</td><td className="border border-[#aca899] p-1.5">Paint, Calculator, Command Prompt</td></tr>
              <tr><td className="border border-[#aca899] p-1.5 font-mono">services.msc / gpedit.msc</td><td className="border border-[#aca899] p-1.5">Services &amp; Group Policy Editor</td></tr>
              <tr><td className="border border-[#aca899] p-1.5 font-mono">taskmgr / regedit / msinfo32</td><td className="border border-[#aca899] p-1.5">Task Manager, Registry, System Info</td></tr>
              <tr><td className="border border-[#aca899] p-1.5 font-mono">appwiz.cpl / desk.cpl / ncpa.cpl</td><td className="border border-[#aca899] p-1.5">Add/Remove Programs, Display, Network</td></tr>
            </tbody>
          </table>
        </div>
      );
    }

    return (
      <div className="max-w-[560px] mx-auto p-6 flex flex-col gap-3">
        <h1 className="text-[16px] font-bold text-[#000000]">
          {isExternal ? 'External Web Address' : 'The page cannot be displayed'}
        </h1>
        <p className="text-[11px] text-[#333333] leading-[1.5]">
          {isExternal
            ? `This simulated browser operates offline with bundled local pages. You can open "${currentUrl}" directly in your host browser below.`
            : `The local address "${currentUrl}" was not found.`}
        </p>
        <div className="flex items-center gap-3 pt-1">
          {isExternal && (
            <a
              href={currentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="xp-button no-underline"
            >
              Open in New Browser Tab
            </a>
          )}
          <button
            type="button"
            onClick={() => navigate(homeUrl)}
            className="xp-button"
          >
            Return to Home Page
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#ece9d8] text-[11px]">
      <XpMenuBar groups={menuGroups} />

      {/* Browser Toolbar */}
      <div className="h-[34px] shrink-0 bg-[#ece9d8] border-b border-[#d4d0c8] px-1.5 flex items-center gap-1 overflow-x-auto">
        <button
          type="button"
          onClick={() => canGoBack && setHistoryIdx((i) => i - 1)}
          disabled={!canGoBack}
          aria-label="Back"
          className="flex items-center gap-1 px-2 py-1 rounded-[3px] border border-transparent hover:border-[#aca899] hover:bg-[#f5f3ea] disabled:opacity-45 cursor-default shrink-0"
        >
          <span className="w-[18px] h-[18px] rounded-full bg-[#3f9d39] text-white flex items-center justify-center font-bold">
            ←
          </span>
          <span>Back</span>
        </button>

        <button
          type="button"
          onClick={() => canGoForward && setHistoryIdx((i) => i + 1)}
          disabled={!canGoForward}
          aria-label="Forward"
          className="flex items-center gap-1 px-1.5 py-1 rounded-[3px] border border-transparent hover:border-[#aca899] hover:bg-[#f5f3ea] disabled:opacity-45 cursor-default shrink-0"
        >
          <span className="w-[18px] h-[18px] rounded-full bg-[#3f9d39] text-white flex items-center justify-center font-bold">
            →
          </span>
        </button>

        <button
          type="button"
          onClick={() => setLoading(false)}
          disabled={!loading}
          aria-label="Stop"
          className="px-2 py-1 rounded-[3px] border border-transparent hover:border-[#aca899] hover:bg-[#f5f3ea] disabled:opacity-45 cursor-default shrink-0"
        >
          Stop
        </button>

        <button
          type="button"
          onClick={() => setRefreshTick((t) => t + 1)}
          aria-label="Refresh"
          className="px-2 py-1 rounded-[3px] border border-transparent hover:border-[#aca899] hover:bg-[#f5f3ea] cursor-default shrink-0"
        >
          Refresh
        </button>

        <button
          type="button"
          onClick={() => navigate(homeUrl)}
          aria-label="Home"
          className="px-2 py-1 rounded-[3px] border border-transparent hover:border-[#aca899] hover:bg-[#f5f3ea] cursor-default shrink-0"
        >
          Home
        </button>

        <div className="h-5 w-[1px] bg-[#aca899] mx-0.5 shrink-0" />

        <button
          type="button"
          onClick={() => setSidePanel((p) => (p === 'favorites' ? 'none' : 'favorites'))}
          className={`px-2 py-1 rounded-[3px] border cursor-default shrink-0 ${
            sidePanel === 'favorites'
              ? 'border-[#316ac5] bg-[#dde8fb]'
              : 'border-transparent hover:border-[#aca899] hover:bg-[#f5f3ea]'
          }`}
        >
          Favorites
        </button>

        <button
          type="button"
          onClick={() => setSidePanel((p) => (p === 'history' ? 'none' : 'history'))}
          className={`px-2 py-1 rounded-[3px] border cursor-default shrink-0 ${
            sidePanel === 'history'
              ? 'border-[#316ac5] bg-[#dde8fb]'
              : 'border-transparent hover:border-[#aca899] hover:bg-[#f5f3ea]'
          }`}
        >
          History
        </button>

        <button
          type="button"
          onClick={handleAddFavorite}
          className="px-2 py-1 rounded-[3px] border border-transparent hover:border-[#aca899] hover:bg-[#f5f3ea] cursor-default shrink-0"
        >
          + Favorite
        </button>
      </div>

      {/* Address Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          navigate(addressInput);
        }}
        className="h-[26px] shrink-0 bg-[#ece9d8] border-b border-[#aca899] px-2 flex items-center gap-1.5"
      >
        <label htmlFor={`ie-addr-${windowId}`} className="text-[#555555] shrink-0">
          Address
        </label>
        <div className="flex-1 min-w-0 h-[20px] bg-[#ffffff] border border-[#7f9db9] flex items-center px-1 gap-1.5">
          <XpIcon name="internet_explorer" size={14} />
          <input
            id={`ie-addr-${windowId}`}
            type="text"
            value={addressInput}
            onChange={(e) => setAddressInput(e.target.value)}
            className="w-full bg-transparent outline-none text-[11px] text-[#000000]"
          />
        </div>
        <button type="submit" className="xp-button h-[20px] min-h-0 px-2.5">
          Go
        </button>
      </form>

      {/* Find Bar */}
      {showFindBar && (
        <div className="bg-[#f3f1e6] border-b border-[#aca899] px-2 py-1 flex items-center gap-2">
          <label htmlFor={`ie-find-${windowId}`} className="font-bold">
            Find:
          </label>
          <input
            id={`ie-find-${windowId}`}
            type="text"
            value={findQuery}
            onChange={(e) => setFindQuery(e.target.value)}
            className="xp-input w-[180px]"
            placeholder="Text on page..."
          />
          <button type="button" onClick={runFindInPage} className="xp-button min-h-0 py-0.5">
            Find
          </button>
          {findStatus && <span className="text-[#333333]">{findStatus}</span>}
          <button
            type="button"
            onClick={() => {
              setShowFindBar(false);
              setFindStatus('');
            }}
            className="ml-auto xp-button min-h-0 py-0.5"
          >
            Close
          </button>
        </div>
      )}

      {/* Body with optional Explorer Bar */}
      <div className="flex-1 min-h-0 flex">
        {sidePanel !== 'none' && (
          <aside className="w-[210px] shrink-0 bg-[#f6f5ee] border-r border-[#aca899] flex flex-col">
            <div className="px-2 py-1.5 bg-[#ece9d8] border-b border-[#aca899] flex items-center justify-between font-bold">
              <span>{sidePanel === 'favorites' ? 'Favorites' : 'History'}</span>
              <button
                type="button"
                onClick={() => setSidePanel('none')}
                className="px-1 hover:bg-[#ddd9c8]"
                aria-label="Close Explorer Bar"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto xp-scroll p-1.5 flex flex-col gap-1">
              {sidePanel === 'favorites'
                ? system.ieFavorites.map((fav, idx) => (
                    <div key={`${fav.url}_${idx}`} className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => navigate(fav.url)}
                        className="flex-1 min-w-0 text-left px-1.5 py-1 hover:bg-[#e5effd] rounded-[2px] truncate"
                      >
                        ★ {fav.title}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateSystem((prev) => ({
                            ...prev,
                            ieFavorites: prev.ieFavorites.filter((f) => f.url !== fav.url),
                          }))
                        }
                        title="Remove favorite"
                        className="px-1 text-[#777777] hover:text-[#b91c1c]"
                      >
                        ×
                      </button>
                    </div>
                  ))
                : system.ieHistory.map((item, idx) => (
                    <button
                      key={`${item.url}_${idx}`}
                      type="button"
                      onClick={() => navigate(item.url)}
                      className="text-left px-1.5 py-1 hover:bg-[#e5effd] rounded-[2px]"
                    >
                      <div className="font-bold truncate text-[#0b3c8d]">{item.title}</div>
                      <div className="text-[10px] text-[#666666] truncate">{item.url}</div>
                    </button>
                  ))}
            </div>
          </aside>
        )}

        <div
          ref={pageContainerRef}
          key={`${currentUrl}-${refreshTick}`}
          className="flex-1 min-w-0 bg-[#ffffff] overflow-y-auto xp-scroll"
        >
          {renderPageContent()}
        </div>
      </div>

      {/* Status Bar */}
      <div className="h-[20px] shrink-0 bg-[#ece9d8] border-t border-[#aca899] px-2 flex items-center justify-between text-[11px] text-[#333333]">
        <span>{loading ? 'Opening page...' : 'Done'}</span>
        <span className="truncate ml-3">{localPage ? 'Local Intranet' : 'Internet'}</span>
      </div>
    </div>
  );
};

interface MsnExplorerAppProps {
  system: SystemState;
  onLaunchApp: (appId: AppId, payload?: WindowInstance['payload']) => void;
  onTitleChange: (title: string) => void;
}

export const MsnExplorerApp: React.FC<MsnExplorerAppProps> = ({
  system,
  onLaunchApp,
  onTitleChange,
}) => {
  const [signedInUser, setSignedInUser] = useState<string | null>(null);
  const [accountInput, setAccountInput] = useState(
    `${system.activeUsername.toLowerCase()}@msn.local`
  );
  const [channel, setChannel] = useState<'home' | 'mail' | 'news' | 'music'>('home');

  useEffect(() => {
    onTitleChange(signedInUser ? `MSN Explorer - ${signedInUser}` : 'MSN Explorer');
  }, [signedInUser, onTitleChange]);

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#eef5ff] text-[11px]">
      <div className="h-[46px] shrink-0 bg-gradient-to-r from-[#0e4fa8] via-[#277be3] to-[#5ea8f5] text-white px-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <XpIcon name="msn_butterfly" size={28} />
          <div>
            <div className="text-[14px] font-bold">MSN Explorer</div>
            <div className="text-[10px] text-[#dbeaff]">Local Offline Portal</div>
          </div>
        </div>
        {signedInUser && (
          <div className="flex items-center gap-2">
            <span className="text-[11px]">{signedInUser}</span>
            <button
              type="button"
              onClick={() => setSignedInUser(null)}
              className="xp-button text-[#000000]"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>

      {!signedInUser ? (
        <div className="flex-1 flex items-center justify-center p-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSignedInUser(accountInput.trim() || 'guest@msn.local');
            }}
            className="w-full max-w-[340px] bg-white border border-[#9ebde8] rounded-[4px] p-4 shadow-sm flex flex-col gap-3"
          >
            <div className="flex items-center gap-2">
              <XpIcon name="msn_butterfly" size={24} />
              <h2 className="text-[13px] font-bold text-[#0b3c8d]">Sign in to MSN</h2>
            </div>
            <p className="text-[#444444]">
              Enter a local fictional MSN handle to browse channels offline.
            </p>
            <div>
              <label htmlFor="msn-account-input" className="block font-bold mb-1">
                MSN E-mail Address:
              </label>
              <input
                id="msn-account-input"
                type="text"
                value={accountInput}
                onChange={(e) => setAccountInput(e.target.value)}
                className="xp-input w-full"
              />
            </div>
            <button type="submit" className="xp-button xp-button-default self-end px-4">
              Sign In
            </button>
          </form>
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="bg-[#dce8fb] border-b border-[#9ebde8] px-3 py-1.5 flex items-center gap-2">
            {(['home', 'mail', 'news', 'music'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setChannel(tab)}
                className={`px-3 py-1 rounded-[3px] font-bold cursor-default ${
                  channel === tab
                    ? 'bg-[#1a5ec4] text-white'
                    : 'bg-white text-[#0b3c8d] border border-[#9ebde8]'
                }`}
              >
                {tab === 'home'
                  ? 'MSN Home'
                  : tab === 'mail'
                  ? 'My E-mail'
                  : tab === 'news'
                  ? 'Computing News'
                  : 'Music & Media'}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto xp-scroll p-4">
            {channel === 'home' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-[660px]">
                <div className="bg-white border border-[#9ebde8] p-3">
                  <h3 className="font-bold text-[#0b3c8d] text-[13px] mb-1">
                    Welcome back, {signedInUser}
                  </h3>
                  <p className="text-[#333333] mb-2">
                    Your offline MSN Explorer dashboard connects directly to Outlook Express, Windows Messenger, and Windows Media Player.
                  </p>
                  <button
                    type="button"
                    onClick={() => onLaunchApp('iexplore')}
                    className="xp-button"
                  >
                    Open Internet Explorer
                  </button>
                </div>
                <div className="bg-white border border-[#9ebde8] p-3">
                  <h3 className="font-bold text-[#0b3c8d] text-[13px] mb-1">Inbox Summary</h3>
                  <p className="text-[#333333] mb-2">
                    {system.mailMessages.filter((m) => m.folder === 'inbox' && !m.read).length} unread message(s) in local Outlook Express.
                  </p>
                  <button
                    type="button"
                    onClick={() => onLaunchApp('outlook')}
                    className="xp-button"
                  >
                    Open Outlook Express
                  </button>
                </div>
              </div>
            )}

            {channel === 'mail' && (
              <div className="bg-white border border-[#9ebde8] p-4 max-w-[540px] flex flex-col gap-2">
                <h3 className="font-bold text-[13px] text-[#0b3c8d]">Local Mail Integration</h3>
                <p>Click below to open Outlook Express with your local identities.</p>
                <button
                  type="button"
                  onClick={() => onLaunchApp('outlook')}
                  className="xp-button xp-button-default self-start"
                >
                  Launch Outlook Express
                </button>
              </div>
            )}

            {channel === 'news' && (
              <div className="bg-white border border-[#9ebde8] p-4 max-w-[560px] flex flex-col gap-2">
                <h3 className="font-bold text-[13px] text-[#0b3c8d]">MSN Tech Headlines</h3>
                <p>Windows XP Professional SP3 continues delivering reliable 32-bit productivity with Luna Blue visual styles.</p>
                <button
                  type="button"
                  onClick={() => onLaunchApp('iexplore', { initialUrl: 'http://news.xp.local/' })}
                  className="xp-button self-start"
                >
                  Read Full Dispatch in IE
                </button>
              </div>
            )}

            {channel === 'music' && (
              <div className="bg-white border border-[#9ebde8] p-4 max-w-[540px] flex flex-col gap-2">
                <h3 className="font-bold text-[13px] text-[#0b3c8d]">MSN Music &amp; Media</h3>
                <p>Listen to bundled sample tracks in Windows Media Player.</p>
                <button
                  type="button"
                  onClick={() => onLaunchApp('wmplayer')}
                  className="xp-button xp-button-default self-start"
                >
                  Open Windows Media Player
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
