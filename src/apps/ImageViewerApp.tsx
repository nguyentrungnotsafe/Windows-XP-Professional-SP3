import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { VfsNode, VfsState } from '../types/os';
import { getChildren } from '../state/vfs';

interface ImageViewerAppProps {
  vfs: VfsState;
  fileId?: string;
  onTitleChange: (title: string) => void;
  onOpenInPaint: (fileId: string) => void;
  onPrintPhoto: (fileId: string) => void;
  onDeleteNode: (nodeId: string) => void;
}

export const ImageViewerApp: React.FC<ImageViewerAppProps> = ({
  vfs,
  fileId,
  onTitleChange,
  onOpenInPaint,
  onPrintPhoto,
  onDeleteNode,
}) => {
  const [currentId, setCurrentId] = useState<string | undefined>(fileId);
  const [zoom, setZoom] = useState<number>(1);
  const [fitMode, setFitMode] = useState<boolean>(true);
  const [rotation, setRotation] = useState<number>(0);
  const [slideshow, setSlideshow] = useState<boolean>(false);

  const node: VfsNode | undefined = currentId ? vfs.nodes[currentId] : undefined;

  const siblings = useMemo(() => {
    if (!node?.parentId) return node ? [node] : [];
    return getChildren(vfs, node.parentId, { includeHidden: false }).filter(
      (n) => n.kind === 'image'
    );
  }, [vfs, node]);

  const currentIdx = siblings.findIndex((s) => s.id === node?.id);

  const onTitleChangeRef = useRef(onTitleChange);
  onTitleChangeRef.current = onTitleChange;

  useEffect(() => {
    onTitleChangeRef.current(
      node ? `${node.name} - Windows Picture and Fax Viewer` : 'Windows Picture and Fax Viewer'
    );
  }, [node]);

  useEffect(() => {
    if (!slideshow || siblings.length <= 1) return;
    const id = window.setInterval(() => {
      setCurrentId((prev) => {
        const idx = siblings.findIndex((s) => s.id === prev);
        return siblings[(idx + 1) % siblings.length]?.id ?? prev;
      });
    }, 2500);
    return () => window.clearInterval(id);
  }, [slideshow, siblings]);

  const goPrev = () => {
    if (siblings.length <= 1) return;
    const prevIdx = (currentIdx - 1 + siblings.length) % siblings.length;
    setCurrentId(siblings[prevIdx].id);
    setRotation(0);
  };

  const goNext = () => {
    if (siblings.length <= 1) return;
    const nextIdx = (currentIdx + 1) % siblings.length;
    setCurrentId(siblings[nextIdx].id);
    setRotation(0);
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#eef2fb] text-[11px]">
      <div className="flex-1 min-h-0 flex items-center justify-center p-4 overflow-auto">
        {node?.content ? (
          <img
            src={node.content}
            alt={node.name}
            data-testid="viewer-image"
            className="border border-[#aca899] bg-white shadow transition-transform duration-150"
            style={{
              maxWidth: fitMode ? '100%' : 'none',
              maxHeight: fitMode ? '100%' : 'none',
              transform: `scale(${fitMode ? 1 : zoom}) rotate(${rotation}deg)`,
            }}
          />
        ) : (
          <div className="text-[#555555]">No preview available.</div>
        )}
      </div>

      {/* XP Viewer Bottom Control Bar */}
      <div className="h-[40px] shrink-0 bg-[#ece9d8] border-t border-[#aca899] px-2.5 flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            disabled={siblings.length <= 1}
            onClick={goPrev}
            aria-label="Previous image"
            className="xp-button px-2"
          >
            ◀ Prev
          </button>
          <button
            type="button"
            disabled={siblings.length <= 1}
            onClick={goNext}
            aria-label="Next image"
            className="xp-button px-2"
          >
            Next ▶
          </button>
          <button
            type="button"
            onClick={() => setFitMode(true)}
            className="xp-button px-2"
          >
            Best Fit
          </button>
          <button
            type="button"
            onClick={() => {
              setFitMode(false);
              setZoom(1);
            }}
            className="xp-button px-2"
          >
            Actual Size
          </button>
          <button
            type="button"
            aria-label="Zoom In"
            onClick={() => {
              setFitMode(false);
              setZoom((z) => Math.min(3, +(z + 0.25).toFixed(2)));
            }}
            className="xp-button px-2"
          >
            +
          </button>
          <button
            type="button"
            aria-label="Zoom Out"
            onClick={() => {
              setFitMode(false);
              setZoom((z) => Math.max(0.25, +(z - 0.25).toFixed(2)));
            }}
            className="xp-button px-2"
          >
            -
          </button>
          <button
            type="button"
            aria-label="Rotate Clockwise"
            onClick={() => setRotation((r) => (r + 90) % 360)}
            className="xp-button px-2"
          >
            ↻ 90°
          </button>
          <button
            type="button"
            aria-label="Rotate Counterclockwise"
            onClick={() => setRotation((r) => (r + 270) % 360)}
            className="xp-button px-2"
          >
            ↺ 90°
          </button>
          <button
            type="button"
            aria-pressed={slideshow}
            onClick={() => setSlideshow((s) => !s)}
            className="xp-button px-2"
          >
            {slideshow ? 'Stop Slideshow' : 'Slideshow'}
          </button>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {node && (
            <>
              <button
                type="button"
                onClick={() => onPrintPhoto(node.id)}
                className="xp-button px-2"
              >
                Print
              </button>
              <button
                type="button"
                disabled={Boolean(node.readOnly)}
                onClick={() => {
                  const deletedId = node.id;
                  const next = siblings.find((s) => s.id !== deletedId);
                  onDeleteNode(deletedId);
                  setCurrentId(next?.id);
                }}
                className="xp-button px-2"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={() => onOpenInPaint(node.id)}
                className="xp-button px-2"
              >
                Edit in Paint
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
