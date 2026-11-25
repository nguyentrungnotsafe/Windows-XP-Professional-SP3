import React, { useEffect, useMemo, useRef, useState } from 'react';
import type {
  ModalPromptRequest,
  NodeKind,
  SystemState,
  VfsNode,
  VfsState,
} from '../types/os';
import { SYSTEM_IDS } from '../state/vfs';
import { xpAudio } from '../utils/audioEngine';
import { XpIcon } from '../components/xp/XpIcons';
import { VfsFileDialog } from '../components/xp/XpDialog';

interface TrackItem {
  id: string;
  title: string;
  artist: string;
  preset: string;
  durationSec: number;
}

function parseAudioSpec(node: VfsNode): TrackItem {
  try {
    if (node.content) {
      const parsed = JSON.parse(node.content) as Partial<TrackItem>;
      return {
        id: node.id,
        title: parsed.title || node.name,
        artist: parsed.artist || 'Windows XP Library',
        preset: parsed.preset || 'xp_title',
        durationSec: parsed.durationSec || 24,
      };
    }
  } catch {
    // ignore malformed content
  }
  return {
    id: node.id,
    title: node.name,
    artist: 'Windows XP Library',
    preset: 'xp_title',
    durationSec: 24,
  };
}

interface MediaPlayerAppProps {
  windowId: string;
  vfs: VfsState;
  system: SystemState;
  initialFileId?: string;
  onTitleChange: (title: string) => void;
  onOpenModal: (modal: Omit<ModalPromptRequest, 'id'>) => void;
}

export const MediaPlayerApp: React.FC<MediaPlayerAppProps> = ({
  windowId,
  vfs,
  system,
  initialFileId,
  onTitleChange,
  onOpenModal,
}) => {
  const tracks = useMemo<TrackItem[]>(() => {
    const vfsAudio = Object.values(vfs.nodes)
      .filter((n) => n.kind === 'audio')
      .map(parseAudioSpec);
    const cdAudio = system.burnedCdFiles
      .filter((f) => f.kind === 'audio')
      .map((f, idx) => ({
        id: `cd_audio_${idx}`,
        title: f.name,
        artist: system.burnedCdVolumeName || 'Audio CD (D:)',
        preset: 'breeze',
        durationSec: 22,
      }));
    const list = [...vfsAudio, ...cdAudio];
    if (list.length === 0) {
      list.push({
        id: 'builtin_beethoven',
        title: "Beethoven's Symphony No. 9 (Scherzo).wma",
        artist: 'Sample Music',
        preset: 'beethoven',
        durationSec: 24,
      });
    }
    return list;
  }, [vfs.nodes, system.burnedCdFiles, system.burnedCdVolumeName]);

  const [activeTrackId, setActiveTrackId] = useState<string>(
    initialFileId && vfs.nodes[initialFileId]?.kind === 'audio'
      ? initialFileId
      : tracks[0].id
  );
  const [playing, setPlaying] = useState(false);
  const [positionSec, setPositionSec] = useState(0);
  const [viewMode, setViewMode] = useState<'nowplaying' | 'library'>('nowplaying');
  const [visStyle, setVisStyle] = useState<'bars' | 'scope'>('bars');

  const stepRef = useRef(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const warnedUnsupportedRef = useRef<string | null>(null);

  const activeTrack = tracks.find((t) => t.id === activeTrackId) ?? tracks[0];

  useEffect(() => {
    onTitleChange(`${activeTrack.title} - Windows Media Player`);
  }, [activeTrack.title, onTitleChange]);

  // Check if launched with an unsupported non-audio file (e.g. via Open With)
  useEffect(() => {
    if (!initialFileId) return;
    const node = vfs.nodes[initialFileId];
    if (node && node.kind !== 'audio' && warnedUnsupportedRef.current !== initialFileId) {
      warnedUnsupportedRef.current = initialFileId;
      onOpenModal({
        parentWindowId: windowId,
        kind: 'alert',
        icon: 'error',
        title: 'Windows Media Player',
        message: `Windows Media Player cannot play "${node.name}". The file format (${node.kind}) is not supported by the player.`,
      });
    }
  }, [initialFileId, vfs.nodes, windowId, onOpenModal]);

  useEffect(() => {
    xpAudio.applyState(system.audio);
  }, [system.audio]);

  // Playback timer + audio synthesizer ticks
  useEffect(() => {
    if (!playing) {
      xpAudio.stopAll();
      return;
    }
    xpAudio.playMelodyStep(activeTrack.preset, stepRef.current);
    const id = window.setInterval(() => {
      stepRef.current += 1;
      xpAudio.playMelodyStep(activeTrack.preset, stepRef.current);
      setPositionSec((sec) => {
        if (sec + 1 >= activeTrack.durationSec) {
          const idx = tracks.findIndex((t) => t.id === activeTrack.id);
          const next = tracks[(idx + 1) % tracks.length];
          setActiveTrackId(next.id);
          return 0;
        }
        return sec + 1;
      });
    }, 520);
    return () => {
      window.clearInterval(id);
      xpAudio.stopAll();
    };
  }, [playing, activeTrack, tracks]);

  // Animated visualizer canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    let phase = 0;
    const draw = () => {
      phase += playing ? 0.14 : 0.02;
      const w = canvas.width;
      const h = canvas.height;
      ctx.fillStyle = '#070b18';
      ctx.fillRect(0, 0, w, h);

      const gain = system.audio.muted ? 0 : system.audio.masterVolume / 100;
      const amp = playing ? Math.max(0.18, gain) : 0.06;

      if (visStyle === 'bars') {
        const count = 24;
        const bw = Math.floor((w - 20) / count);
        for (let i = 0; i < count; i++) {
          const val =
            (Math.sin(phase + i * 0.55) * 0.5 + 0.5) *
            (Math.cos(phase * 0.7 - i * 0.3) * 0.4 + 0.6) *
            amp;
          const bh = Math.max(4, Math.floor(val * (h - 24)));
          const grad = ctx.createLinearGradient(0, h - bh, 0, h);
          grad.addColorStop(0, '#7fe3ff');
          grad.addColorStop(0.5, '#2b82ff');
          grad.addColorStop(1, '#12337d');
          ctx.fillStyle = grad;
          ctx.fillRect(10 + i * bw, h - 10 - bh, bw - 3, bh);
        }
      } else {
        ctx.strokeStyle = '#53e2ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let x = 0; x < w; x += 4) {
          const y =
            h / 2 +
            Math.sin(x * 0.05 + phase) * 28 * amp +
            Math.cos(x * 0.02 - phase * 1.4) * 14 * amp;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      rafId = window.requestAnimationFrame(draw);
    };
    draw();
    return () => window.cancelAnimationFrame(rafId);
  }, [playing, visStyle, system.audio.muted, system.audio.masterVolume]);

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#1b2d56] text-white text-[11px] select-none">
      {/* Top Tabs */}
      <div className="bg-gradient-to-r from-[#214596] to-[#3f75d6] px-3 py-1.5 flex items-center justify-between border-b border-[#0d214f]">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setViewMode('nowplaying')}
            className={`px-3 py-1 rounded-[3px] font-bold cursor-default ${
              viewMode === 'nowplaying'
                ? 'bg-[#63a4ff] text-[#051a40]'
                : 'bg-[#173678] text-white hover:bg-[#234ca2]'
            }`}
          >
            Now Playing
          </button>
          <button
            type="button"
            onClick={() => setViewMode('library')}
            className={`px-3 py-1 rounded-[3px] font-bold cursor-default ${
              viewMode === 'library'
                ? 'bg-[#63a4ff] text-[#051a40]'
                : 'bg-[#173678] text-white hover:bg-[#234ca2]'
            }`}
          >
            Media Library
          </button>
        </div>
        <div className="text-[10px] text-[#cde0ff]">
          {system.audio.muted ? 'Audio Muted' : `Master: ${system.audio.masterVolume}%`}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-0 flex">
        <div className="flex-1 min-w-0 flex flex-col p-2.5 gap-2">
          {viewMode === 'nowplaying' ? (
            <>
              <div className="flex-1 min-h-[140px] bg-[#070b18] border border-[#4a74c9] rounded-[4px] relative overflow-hidden flex flex-col">
                <canvas
                  ref={canvasRef}
                  width={420}
                  height={200}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2.5 text-[12px] font-bold text-[#9fd2ff] drop-shadow">
                  {activeTrack.title}
                </div>
                <div className="absolute bottom-2 right-2.5 flex gap-1">
                  <button
                    type="button"
                    onClick={() => setVisStyle((s) => (s === 'bars' ? 'scope' : 'bars'))}
                    className="px-2 py-0.5 bg-[#19356e]/90 border border-[#4b7fe0] rounded-[2px] text-[10px]"
                  >
                    Visualizer: {visStyle === 'bars' ? 'Bars' : 'Scope'}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 min-h-0 bg-white text-black border border-[#4a74c9] overflow-y-auto xp-scroll p-2">
              <div className="font-bold text-[#0b3c8d] mb-2">All Audio Tracks (My Music &amp; CD)</div>
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-[#ece9d8] border-b border-[#aca899]">
                    <th className="p-1.5">Title</th>
                    <th className="p-1.5">Artist</th>
                    <th className="p-1.5">Length</th>
                  </tr>
                </thead>
                <tbody>
                  {tracks.map((t) => (
                    <tr
                      key={t.id}
                      onClick={() => {
                        setActiveTrackId(t.id);
                        setPositionSec(0);
                      }}
                      onDoubleClick={() => {
                        setActiveTrackId(t.id);
                        setPositionSec(0);
                        setPlaying(true);
                        setViewMode('nowplaying');
                      }}
                      className={`cursor-default ${
                        t.id === activeTrack.id ? 'bg-[#316ac5] text-white' : 'hover:bg-[#eef4fd]'
                      }`}
                    >
                      <td className="p-1.5">{t.title}</td>
                      <td className="p-1.5">{t.artist}</td>
                      <td className="p-1.5">0:{String(t.durationSec).padStart(2, '0')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Playlist Sidebar */}
        <aside className="w-[185px] shrink-0 bg-[#122247] border-l border-[#355ca8] p-2 flex flex-col gap-1 overflow-y-auto xp-scroll">
          <div className="font-bold text-[#9ec4ff] mb-1">Now Playing List</div>
          {tracks.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setActiveTrackId(t.id);
                setPositionSec(0);
                setPlaying(true);
              }}
              className={`text-left px-2 py-1 rounded-[2px] truncate cursor-default ${
                t.id === activeTrack.id
                  ? 'bg-[#3672e0] text-white font-bold'
                  : 'text-[#d4e4ff] hover:bg-[#1e3770]'
              }`}
            >
              ♪ {t.title}
            </button>
          ))}
        </aside>
      </div>

      {/* Transport Deck */}
      <div className="bg-gradient-to-b from-[#345ea8] to-[#1a346b] border-t border-[#5b8ae0] px-3 py-2 flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <span className="text-[10px] w-[34px]">
            0:{String(positionSec).padStart(2, '0')}
          </span>
          <input
            type="range"
            aria-label="Seek track position"
            min={0}
            max={activeTrack.durationSec}
            value={positionSec}
            onChange={(e) => setPositionSec(Number(e.target.value))}
            className="flex-1"
          />
          <span className="text-[10px] w-[34px] text-right">
            0:{String(activeTrack.durationSec).padStart(2, '0')}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setPlaying((p) => !p)}
              className="px-3 py-1 rounded-full bg-gradient-to-b from-[#6db5ff] to-[#1b59c9] border border-white/50 text-white font-bold"
            >
              {playing ? 'Pause' : 'Play'}
            </button>
            <button
              type="button"
              onClick={() => {
                setPlaying(false);
                setPositionSec(0);
              }}
              className="px-2.5 py-1 rounded-[3px] bg-[#244a96] border border-[#6e98e6]"
            >
              Stop
            </button>
            <button
              type="button"
              onClick={() => {
                const idx = tracks.findIndex((t) => t.id === activeTrack.id);
                setActiveTrackId(tracks[(idx - 1 + tracks.length) % tracks.length].id);
                setPositionSec(0);
              }}
              className="px-2 py-1 rounded-[3px] bg-[#244a96] border border-[#6e98e6]"
            >
              Prev
            </button>
            <button
              type="button"
              onClick={() => {
                const idx = tracks.findIndex((t) => t.id === activeTrack.id);
                setActiveTrackId(tracks[(idx + 1) % tracks.length].id);
                setPositionSec(0);
              }}
              className="px-2 py-1 rounded-[3px] bg-[#244a96] border border-[#6e98e6]"
            >
              Next
            </button>
          </div>
          <span className="text-[10px] text-[#cce0ff]">
            {playing ? 'Playing' : 'Ready'}
          </span>
        </div>
      </div>
    </div>
  );
};

interface TimelineClip {
  id: string;
  nodeId: string;
  name: string;
  trimStartSec: number;
  trimEndSec: number;
  titleOverlay: string;
}

interface MovieMakerAppProps {
  windowId: string;
  vfs: VfsState;
  system: SystemState;
  initialFileId?: string;
  onSaveFile: (params: {
    parentId: string;
    name: string;
    content: string;
    kind: Exclude<NodeKind, 'folder' | 'drive' | 'system'>;
    mimeType: string;
    existingFileId?: string;
    allowOverwrite?: boolean;
  }) => { ok: boolean; node?: VfsNode; error?: string; needsOverwriteConfirm?: boolean };
  onCreateFolder: (parentId: string, name: string) => { ok: boolean; error?: string };
  onTitleChange: (title: string) => void;
  onOpenModal: (modal: Omit<ModalPromptRequest, 'id'>) => void;
}

export const MovieMakerApp: React.FC<MovieMakerAppProps> = ({
  windowId,
  vfs,
  system,
  initialFileId,
  onSaveFile,
  onCreateFolder,
  onTitleChange,
  onOpenModal,
}) => {
  const activeUser =
    system.users.find((u) => u.username === system.activeUsername) ?? system.users[0];
  const defaultFolderId = activeUser?.docsFolderId ?? SYSTEM_IDS.MY_DOCUMENTS;

  const mediaNodes = useMemo(
    () => Object.values(vfs.nodes).filter((n) => n.kind === 'image' || n.kind === 'audio'),
    [vfs.nodes]
  );

  const [clips, setClips] = useState<TimelineClip[]>(() => {
    if (initialFileId && vfs.nodes[initialFileId]?.content) {
      try {
        const parsed = JSON.parse(vfs.nodes[initialFileId].content!) as { clips?: TimelineClip[] };
        if (Array.isArray(parsed.clips)) return parsed.clips;
      } catch {
        // fallback below
      }
    }
    return mediaNodes.slice(0, 2).map((n, i) => ({
      id: `clip_${n.id}_${i}`,
      nodeId: n.id,
      name: n.name,
      trimStartSec: 0,
      trimEndSec: 4,
      titleOverlay: i === 0 ? 'Windows XP Movie' : '',
    }));
  });

  const [selectedClipId, setSelectedClipId] = useState<string | null>(clips[0]?.id ?? null);
  const [previewIdx, setPreviewIdx] = useState<number>(0);
  const [playingPreview, setPlayingPreview] = useState(false);
  const [currentFileId, setCurrentFileId] = useState<string | undefined>(initialFileId);
  const [fileDialog, setFileDialog] = useState<'open' | 'save' | null>(null);

  useEffect(() => {
    const fileName = currentFileId ? vfs.nodes[currentFileId]?.name : 'Untitled.mswmm';
    onTitleChange(`${fileName || 'Untitled.mswmm'} - Windows Movie Maker`);
  }, [currentFileId, vfs.nodes, onTitleChange]);

  useEffect(() => {
    if (!playingPreview || clips.length === 0) return;
    const id = window.setInterval(() => {
      setPreviewIdx((idx) => (idx + 1) % clips.length);
    }, 1200);
    return () => window.clearInterval(id);
  }, [playingPreview, clips.length]);

  const selectedClip = clips.find((c) => c.id === selectedClipId) ?? clips[0];
  const previewClip = clips[previewIdx] ?? clips[0];
  const previewNode = previewClip ? vfs.nodes[previewClip.nodeId] : undefined;

  const addClipFromNode = (node: VfsNode) => {
    const next: TimelineClip = {
      id: `clip_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      nodeId: node.id,
      name: node.name,
      trimStartSec: 0,
      trimEndSec: 4,
      titleOverlay: '',
    };
    setClips((prev) => [...prev, next]);
    setSelectedClipId(next.id);
  };

  const handleSaveProject = (folderId: string, fileName: string) => {
    const finalName = fileName.toLowerCase().endsWith('.mswmm') ? fileName : `${fileName}.mswmm`;
    const res = onSaveFile({
      parentId: folderId,
      name: finalName,
      content: JSON.stringify({ clips }, null, 2),
      kind: 'project',
      mimeType: 'application/x-mswmm',
      existingFileId: currentFileId,
      allowOverwrite: true,
    });
    if (res.ok && res.node) {
      setCurrentFileId(res.node.id);
      setFileDialog(null);
      onOpenModal({
        parentWindowId: windowId,
        kind: 'alert',
        icon: 'info',
        title: 'Windows Movie Maker',
        message: `Project saved to "${finalName}".`,
      });
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#ece9d8] text-[11px]">
      {/* Toolbar */}
      <div className="p-1.5 border-b border-[#aca899] flex items-center gap-1.5 flex-wrap">
        <button type="button" onClick={() => setFileDialog('open')} className="xp-button">
          Open Project...
        </button>
        <button type="button" onClick={() => setFileDialog('save')} className="xp-button xp-button-default">
          Save Project (.mswmm)...
        </button>
        <button
          type="button"
          onClick={() => setPlayingPreview((p) => !p)}
          disabled={clips.length === 0}
          className="xp-button"
        >
          {playingPreview ? 'Stop Preview' : 'Play Storyboard Preview'}
        </button>
      </div>

      {/* Collections + Preview */}
      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[190px_1fr_240px] gap-1 p-1.5">
        <div className="bg-white border border-[#aca899] p-2 overflow-y-auto xp-scroll flex flex-col gap-1">
          <div className="font-bold text-[#0b3c8d] mb-1">Collections (VFS Media)</div>
          {mediaNodes.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => addClipFromNode(n)}
              className="text-left px-1.5 py-1 border border-[#e3e0d3] hover:bg-[#eef4fd] rounded-[2px] flex items-center justify-between gap-1"
            >
              <span className="truncate">{n.name}</span>
              <span className="text-[10px] text-[#0b3c8d] font-bold">+ Add</span>
            </button>
          ))}
        </div>

        {/* Clip Trim & Title Inspector */}
        <div className="bg-white border border-[#aca899] p-3 flex flex-col gap-2">
          <div className="font-bold text-[#0b3c8d]">Clip Properties &amp; Titles</div>
          {selectedClip ? (
            <>
              <div><strong>Selected Clip:</strong> {selectedClip.name}</div>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex flex-col gap-0.5">
                  <span>Trim Start (sec):</span>
                  <input
                    type="number"
                    min={0}
                    max={selectedClip.trimEndSec}
                    value={selectedClip.trimStartSec}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setClips((prev) =>
                        prev.map((c) => (c.id === selectedClip.id ? { ...c, trimStartSec: val } : c))
                      );
                    }}
                    className="xp-input"
                  />
                </label>
                <label className="flex flex-col gap-0.5">
                  <span>Trim End (sec):</span>
                  <input
                    type="number"
                    min={selectedClip.trimStartSec + 1}
                    max={60}
                    value={selectedClip.trimEndSec}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setClips((prev) =>
                        prev.map((c) => (c.id === selectedClip.id ? { ...c, trimEndSec: val } : c))
                      );
                    }}
                    className="xp-input"
                  />
                </label>
              </div>
              <label className="flex flex-col gap-0.5">
                <span>Title Overlay Text:</span>
                <input
                  type="text"
                  value={selectedClip.titleOverlay}
                  onChange={(e) =>
                    setClips((prev) =>
                      prev.map((c) =>
                        c.id === selectedClip.id ? { ...c, titleOverlay: e.target.value } : c
                      )
                    )
                  }
                  placeholder="Optional title overlay..."
                  className="xp-input"
                />
              </label>
              <button
                type="button"
                onClick={() => {
                  setClips((prev) => prev.filter((c) => c.id !== selectedClip.id));
                  setSelectedClipId(null);
                }}
                className="xp-button self-start"
              >
                Remove Clip from Storyboard
              </button>
            </>
          ) : (
            <div className="text-[#666666]">Add a clip from Collections or select one on the Storyboard below.</div>
          )}
        </div>

        {/* Monitor Preview */}
        <div className="bg-[#1b2436] border border-[#aca899] p-2 flex flex-col items-center justify-center relative text-white">
          {previewNode?.kind === 'image' && previewNode.content ? (
            <img
              src={previewNode.content}
              alt={previewNode.name}
              className="max-h-[150px] object-contain"
            />
          ) : previewClip ? (
            <div className="text-center p-4">
              <XpIcon name="movie_maker" size={32} />
              <div className="mt-1 font-bold">{previewClip.name}</div>
            </div>
          ) : (
            <div className="text-[#9eb1d4]">No clips in storyboard</div>
          )}
          {previewClip?.titleOverlay && (
            <div className="absolute bottom-3 left-2 right-2 text-center bg-black/65 px-2 py-1 font-bold text-[12px]">
              {previewClip.titleOverlay}
            </div>
          )}
        </div>
      </div>

      {/* Storyboard Strip */}
      <div className="h-[92px] shrink-0 bg-white border-t border-[#aca899] p-2 flex items-center gap-2 overflow-x-auto xp-scroll">
        {clips.map((c, idx) => (
          <button
            key={c.id}
            type="button"
            onClick={() => {
              setSelectedClipId(c.id);
              setPreviewIdx(idx);
            }}
            className={`w-[130px] h-full shrink-0 border p-1.5 text-left flex flex-col justify-between cursor-default ${
              selectedClip?.id === c.id
                ? 'border-[#316ac5] bg-[#e5effd]'
                : 'border-[#aca899] bg-[#f8f7f2]'
            }`}
          >
            <div className="font-bold truncate">{idx + 1}. {c.name}</div>
            <div className="text-[10px] text-[#555555]">
              {c.trimStartSec}s – {c.trimEndSec}s ({c.trimEndSec - c.trimStartSec}s)
            </div>
          </button>
        ))}
      </div>

      {fileDialog && (
        <VfsFileDialog
          mode={fileDialog}
          title={fileDialog === 'open' ? 'Open Movie Maker Project' : 'Save Project'}
          vfs={vfs}
          initialFolderId={defaultFolderId}
          defaultFileName="My Movie.mswmm"
          acceptKinds={['project']}
          fileTypeLabel="Movie Maker Projects (*.mswmm)"
          defaultExtension=".mswmm"
          zIndex={9950}
          onCreateFolder={onCreateFolder}
          onConfirm={({ folderId, fileName, selectedNode }) => {
            if (fileDialog === 'open' && selectedNode?.content) {
              try {
                const parsed = JSON.parse(selectedNode.content) as { clips?: TimelineClip[] };
                if (Array.isArray(parsed.clips)) {
                  setClips(parsed.clips);
                  setCurrentFileId(selectedNode.id);
                }
              } catch {
                // ignore
              }
              setFileDialog(null);
            } else {
              handleSaveProject(folderId, fileName);
            }
          }}
          onCancel={() => setFileDialog(null)}
        />
      )}
    </div>
  );
};

interface SoundRecorderAppProps {
  windowId: string;
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
  onCreateFolder: (parentId: string, name: string) => { ok: boolean; error?: string };
  onOpenModal: (modal: Omit<ModalPromptRequest, 'id'>) => void;
}

export const SoundRecorderApp: React.FC<SoundRecorderAppProps> = ({
  windowId,
  vfs,
  system,
  onSaveFile,
  onCreateFolder,
  onOpenModal,
}) => {
  const activeUser =
    system.users.find((u) => u.username === system.activeUsername) ?? system.users[0];
  const musicFolderId = activeUser?.musicFolderId ?? SYSTEM_IDS.MY_MUSIC;

  const [recording, setRecording] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [lengthSec, setLengthSec] = useState(3.2);
  const [statusNote, setStatusNote] = useState('Ready (Sample waveform loaded)');
  const [saveOpen, setSaveOpen] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = async () => {
    setRecording(true);
    setLengthSec(0);
    setStatusNote('Recording...');
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
        setStatusNote('Recording from microphone...');
      } else {
        setStatusNote('Microphone unavailable — synthesizing sample audio...');
      }
    } catch {
      setStatusNote('Microphone denied — recording simulated audio waveform...');
    }
  };

  const stopAll = () => {
    setRecording(false);
    setPlaying(false);
    xpAudio.stopAll();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setStatusNote((prev) =>
      prev.startsWith('Recording') ? `Recorded ${lengthSec.toFixed(1)}s` : 'Stopped'
    );
  };

  useEffect(() => {
    if (!recording) return;
    const id = window.setInterval(() => {
      setLengthSec((s) => Math.min(60, Number((s + 0.2).toFixed(1))));
    }, 200);
    return () => window.clearInterval(id);
  }, [recording]);

  useEffect(() => {
    if (!playing) return;
    xpAudio.applyState(system.audio);
    xpAudio.playTone(440, 450, 'sine', 0.22);
    const tid = window.setTimeout(() => xpAudio.playTone(587.33, 450, 'sine', 0.22), 450);
    const doneId = window.setTimeout(() => setPlaying(false), 1100);
    return () => {
      window.clearTimeout(tid);
      window.clearTimeout(doneId);
    };
  }, [playing, system.audio]);

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#ece9d8] p-3 text-[11px] gap-2.5 justify-between">
      <div className="flex items-center justify-between">
        <div>Position: 0.00 sec</div>
        <div>Length: {lengthSec.toFixed(2)} sec</div>
      </div>

      {/* Oscilloscope box */}
      <div className="h-[52px] bg-[#000000] border border-[#7f9db9] flex items-center justify-center px-2">
        <svg viewBox="0 0 260 40" className="w-full h-full" aria-hidden="true">
          <path
            d={
              recording || playing
                ? 'M0 20 Q15 4 30 20 T60 20 T90 20 T120 20 T150 20 T180 20 T210 20 T240 20 L260 20'
                : 'M0 20 L70 20 L80 12 L90 28 L100 8 L110 32 L120 14 L130 24 L140 20 L260 20'
            }
            fill="none"
            stroke="#22ff44"
            strokeWidth="1.5"
          />
        </svg>
      </div>

      <div className="text-[10px] text-[#333333] truncate">{statusNote}</div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={recording}
          onClick={() => setPlaying(true)}
          className="xp-button flex-1"
        >
          Play
        </button>
        <button type="button" onClick={stopAll} className="xp-button flex-1">
          Stop
        </button>
        <button
          type="button"
          disabled={recording}
          onClick={startRecording}
          className="xp-button flex-1 text-[#b91c1c] font-bold"
        >
          ● Record
        </button>
        <button
          type="button"
          onClick={() => setSaveOpen(true)}
          className="xp-button xp-button-default flex-1"
        >
          Save .wav...
        </button>
      </div>

      {saveOpen && (
        <VfsFileDialog
          mode="save"
          title="Save Sound As"
          vfs={vfs}
          initialFolderId={musicFolderId}
          defaultFileName="Voice Note.wav"
          acceptKinds={['audio']}
          fileTypeLabel="Waveform Audio (*.wav)"
          defaultExtension=".wav"
          zIndex={9950}
          onCreateFolder={onCreateFolder}
          onConfirm={({ folderId, fileName }) => {
            const name = fileName.toLowerCase().endsWith('.wav') ? fileName : `${fileName}.wav`;
            const res = onSaveFile({
              parentId: folderId,
              name,
              content: JSON.stringify({
                title: name,
                artist: system.activeUsername,
                preset: 'xp_title',
                durationSec: Math.max(3, Math.round(lengthSec)),
              }),
              kind: 'audio',
              mimeType: 'audio/wav',
              allowOverwrite: true,
            });
            setSaveOpen(false);
            if (res.ok) {
              onOpenModal({
                parentWindowId: windowId,
                kind: 'alert',
                icon: 'info',
                title: 'Sound Recorder',
                message: `Saved "${name}" to My Music.`,
              });
            }
          }}
          onCancel={() => setSaveOpen(false)}
        />
      )}
    </div>
  );
};

interface VolumeControlAppProps {
  system: SystemState;
  onUpdateSystem: (updater: (prev: SystemState) => SystemState) => void;
}

export const VolumeControlApp: React.FC<VolumeControlAppProps> = ({
  system,
  onUpdateSystem,
}) => {
  const { audio } = system;

  const updateAudio = (patch: Partial<SystemState['audio']>) => {
    onUpdateSystem((prev) => {
      const nextAudio = { ...prev.audio, ...patch };
      xpAudio.applyState(nextAudio);
      return { ...prev, audio: nextAudio };
    });
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#ece9d8] p-3 text-[11px] gap-3">
      <div className="grid grid-cols-3 gap-2 flex-1">
        {/* Master */}
        <div className="bg-[#f5f3ea] border border-[#aca899] p-2 flex flex-col items-center justify-between">
          <span className="font-bold">Volume Control</span>
          <label className="text-[10px] flex flex-col items-center gap-1 w-full">
            <span>{audio.masterVolume}%</span>
            <input
              type="range"
              aria-label="Master Volume"
              min={0}
              max={100}
              value={audio.masterVolume}
              onChange={(e) => updateAudio({ masterVolume: Number(e.target.value) })}
              className="w-full"
            />
          </label>
          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={audio.muted}
              onChange={(e) => updateAudio({ muted: e.target.checked })}
            />
            <span>Mute all</span>
          </label>
        </div>

        {/* Wave */}
        <div className="bg-[#f5f3ea] border border-[#aca899] p-2 flex flex-col items-center justify-between">
          <span className="font-bold">Wave</span>
          <label className="text-[10px] flex flex-col items-center gap-1 w-full">
            <span>{audio.waveVolume}%</span>
            <input
              type="range"
              aria-label="Wave Volume"
              min={0}
              max={100}
              value={audio.waveVolume}
              onChange={(e) => updateAudio({ waveVolume: Number(e.target.value) })}
              className="w-full"
            />
          </label>
          <span className="text-[10px] text-[#555555]">WMP / WAV</span>
        </div>

        {/* SW Synth */}
        <div className="bg-[#f5f3ea] border border-[#aca899] p-2 flex flex-col items-center justify-between">
          <span className="font-bold">SW Synth</span>
          <label className="text-[10px] flex flex-col items-center gap-1 w-full">
            <span>{audio.synthVolume}%</span>
            <input
              type="range"
              aria-label="SW Synth Volume"
              min={0}
              max={100}
              value={audio.synthVolume}
              onChange={(e) => updateAudio({ synthVolume: Number(e.target.value) })}
              className="w-full"
            />
          </label>
          <span className="text-[10px] text-[#555555]">MIDI</span>
        </div>
      </div>

      <div className="bg-[#f5f3ea] border border-[#aca899] p-2 flex items-center justify-between gap-3">
        <span className="font-bold">Balance (L / R):</span>
        <input
          type="range"
          aria-label="Stereo Balance"
          min={-1}
          max={1}
          step={0.1}
          value={audio.balance}
          onChange={(e) => updateAudio({ balance: Number(e.target.value) })}
          className="flex-1"
        />
        <button
          type="button"
          onClick={() => xpAudio.playXpStartupChime()}
          className="xp-button"
        >
          Test Startup
        </button>
      </div>
    </div>
  );
};
