import React, { useEffect, useRef, useState } from 'react';
import type { ModalPromptRequest, VfsNode, VfsState } from '../types/os';
import { SYSTEM_IDS } from '../state/vfs';
import { XpMenuBar, type XpMenuGroup } from '../components/xp/XpMenuBar';
import { VfsFileDialog } from '../components/xp/XpDialog';

type PaintTool =
  | 'select'
  | 'pencil'
  | 'brush'
  | 'eraser'
  | 'fill'
  | 'eyedropper'
  | 'magnifier'
  | 'line'
  | 'curve'
  | 'rect'
  | 'ellipse'
  | 'polygon'
  | 'text';

const PAINT_COLORS = [
  '#000000', '#808080', '#800000', '#808000', '#008000', '#008080', '#000080', '#800080',
  '#808040', '#004040', '#0080ff', '#004080', '#4000ff', '#804000',
  '#ffffff', '#c0c0c0', '#ff0000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff',
  '#ffff80', '#00ff80', '#80ffff', '#8080ff', '#ff0080', '#ff8040',
];

interface PaintAppProps {
  windowId: string;
  vfs: VfsState;
  initialFileId?: string;
  defaultFolderId?: string;
  registerCloseGuard: (windowId: string, guard: () => boolean) => void;
  onTitleChange: (title: string) => void;
  onSaveFile: (params: {
    parentId: string;
    name: string;
    content: string;
    kind: 'image';
    mimeType: string;
    existingFileId?: string;
    allowOverwrite?: boolean;
  }) => {
    ok: boolean;
    node?: VfsNode;
    error?: string;
    needsOverwriteConfirm?: boolean;
  };
  onCreateFolder: (parentId: string, name: string) => { ok: boolean; error?: string };
  onOpenModal: (modal: Omit<ModalPromptRequest, 'id'>) => void;
  onForceCloseWindow: () => void;
}

export const PaintApp: React.FC<PaintAppProps> = ({
  windowId,
  vfs,
  initialFileId,
  defaultFolderId = SYSTEM_IDS.MY_PICTURES,
  registerCloseGuard,
  onTitleChange,
  onSaveFile,
  onCreateFolder,
  onOpenModal,
  onForceCloseWindow,
}) => {
  const initialNode = initialFileId ? vfs.nodes[initialFileId] : undefined;
  const [fileId, setFileId] = useState<string | undefined>(initialNode?.id);
  const [fileName, setFileName] = useState<string>(initialNode?.name ?? 'untitled');
  const [folderId, setFolderId] = useState<string>(initialNode?.parentId ?? defaultFolderId);
  const [canvasW, setCanvasW] = useState(520);
  const [canvasH, setCanvasH] = useState(340);
  const [tool, setTool] = useState<PaintTool>('pencil');
  const [color, setColor] = useState<string>('#000000');
  const [zoom, setZoom] = useState<1 | 2 | 4>(1);
  const [dirty, setDirty] = useState<boolean>(false);
  const [pointerPos, setPointerPos] = useState<{ x: number; y: number } | null>(null);
  const [undoCount, setUndoCount] = useState<number>(0);
  const [fileDialog, setFileDialog] = useState<null | { mode: 'open' | 'save'; afterSave?: () => void }>(null);
  const [selectionRect, setSelectionRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [textOverlay, setTextOverlay] = useState<{ x: number; y: number; value: string } | null>(null);
  const [attrDialog, setAttrDialog] = useState<{ open: boolean; w: string; h: string }>({
    open: false,
    w: '520',
    h: '340',
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const undoStackRef = useRef<ImageData[]>([]);
  const polyPointsRef = useRef<Array<{ x: number; y: number }>>([]);
  const drawingRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    lastX: number;
    lastY: number;
    snapshot: ImageData | null;
  }>({ active: false, startX: 0, startY: 0, lastX: 0, lastY: 0, snapshot: null });

  const onTitleChangeRef = useRef(onTitleChange);
  onTitleChangeRef.current = onTitleChange;

  useEffect(() => {
    onTitleChangeRef.current(`${fileName} - Paint`);
  }, [fileName]);

  const fillWhite = (ctx: CanvasRenderingContext2D, w = canvasW, h = canvasH) => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
  };

  const loadDataUrlOntoCanvas = (dataUrl: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    const img = new Image();
    img.onload = () => {
      fillWhite(ctx);
      ctx.drawImage(img, 0, 0, canvasW, canvasH);
      undoStackRef.current = [];
      setUndoCount(0);
      setDirty(false);
    };
    img.src = dataUrl;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    fillWhite(ctx);
    if (initialNode?.content) {
      loadDataUrlOntoCanvas(initialNode.content);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pushUndo = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const snap = ctx.getImageData(0, 0, canvasW, canvasH);
    undoStackRef.current = [...undoStackRef.current.slice(-24), snap];
    setUndoCount(undoStackRef.current.length);
  };

  const handleUndo = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || undoStackRef.current.length === 0) return;
    const prev = undoStackRef.current[undoStackRef.current.length - 1];
    undoStackRef.current = undoStackRef.current.slice(0, -1);
    ctx.putImageData(prev, 0, 0);
    setUndoCount(undoStackRef.current.length);
    setDirty(true);
  };

  const mapPointer = (e: React.PointerEvent<HTMLCanvasElement>): { x: number; y: number } => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(canvasW - 1, Math.floor(((e.clientX - rect.left) / rect.width) * canvasW)));
    const y = Math.max(0, Math.min(canvasH - 1, Math.floor(((e.clientY - rect.top) / rect.height) * canvasH)));
    return { x, y };
  };

  const floodFill = (ctx: CanvasRenderingContext2D, startX: number, startY: number, hexColor: string) => {
    const imgData = ctx.getImageData(0, 0, canvasW, canvasH);
    const data = imgData.data;
    const idx0 = (startY * canvasW + startX) * 4;
    const targetR = data[idx0];
    const targetG = data[idx0 + 1];
    const targetB = data[idx0 + 2];

    const r = Number.parseInt(hexColor.slice(1, 3), 16);
    const g = Number.parseInt(hexColor.slice(3, 5), 16);
    const b = Number.parseInt(hexColor.slice(5, 7), 16);

    if (targetR === r && targetG === g && targetB === b) return;

    const stack: number[] = [startX, startY];
    const visited = new Uint8Array(canvasW * canvasH);

    while (stack.length > 0) {
      const y = stack.pop()!;
      const x = stack.pop()!;
      const p = y * canvasW + x;
      if (visited[p]) continue;
      visited[p] = 1;
      const i = p * 4;
      if (
        Math.abs(data[i] - targetR) > 12 ||
        Math.abs(data[i + 1] - targetG) > 12 ||
        Math.abs(data[i + 2] - targetB) > 12
      ) {
        continue;
      }
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = 255;

      if (x > 0) stack.push(x - 1, y);
      if (x < canvasW - 1) stack.push(x + 1, y);
      if (y > 0) stack.push(x, y - 1);
      if (y < canvasH - 1) stack.push(x, y + 1);
    }

    ctx.putImageData(imgData, 0, 0);
  };

  const commitTextOverlay = () => {
    if (!textOverlay || !textOverlay.value.trim()) {
      setTextOverlay(null);
      return;
    }
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      pushUndo();
      ctx.fillStyle = color;
      ctx.font = '14px Tahoma, sans-serif';
      ctx.fillText(textOverlay.value, textOverlay.x, textOverlay.y + 12);
      setDirty(true);
    }
    setTextOverlay(null);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d', { willReadFrequently: true });
    if (!canvas || !ctx) return;

    const pt = mapPointer(e);
    setPointerPos(pt);

    if (tool === 'eyedropper') {
      const px = ctx.getImageData(pt.x, pt.y, 1, 1).data;
      const hex = `#${[px[0], px[1], px[2]].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
      setColor(hex);
      return;
    }

    if (tool === 'magnifier') {
      setZoom((z) => (z === 1 ? 2 : z === 2 ? 4 : 1));
      return;
    }

    if (tool === 'text') {
      commitTextOverlay();
      setTextOverlay({ x: pt.x, y: pt.y, value: '' });
      return;
    }

    if (tool === 'polygon') {
      const pts = polyPointsRef.current;
      if (pts.length === 0) {
        pushUndo();
        polyPointsRef.current = [pt];
      } else {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
        ctx.lineTo(pt.x, pt.y);
        ctx.stroke();
        pts.push(pt);
        setDirty(true);
      }
      return;
    }

    canvas.setPointerCapture(e.pointerId);
    if (tool !== 'select') {
      pushUndo();
      setDirty(true);
      setSelectionRect(null);
    }

    if (tool === 'fill') {
      floodFill(ctx, pt.x, pt.y, color);
      return;
    }

    const snap = ctx.getImageData(0, 0, canvasW, canvasH);
    drawingRef.current = {
      active: true,
      startX: pt.x,
      startY: pt.y,
      lastX: pt.x,
      lastY: pt.y,
      snapshot: snap,
    };

    if (tool === 'pencil' || tool === 'brush' || tool === 'eraser') {
      ctx.beginPath();
      ctx.fillStyle = tool === 'eraser' ? '#ffffff' : color;
      const radius = tool === 'eraser' ? 6 : tool === 'brush' ? 3 : 1;
      ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const pt = mapPointer(e);
    setPointerPos(pt);
    const d = drawingRef.current;
    if (!d.active) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    if (tool === 'select') {
      setSelectionRect({
        x: Math.min(d.startX, pt.x),
        y: Math.min(d.startY, pt.y),
        w: Math.abs(pt.x - d.startX),
        h: Math.abs(pt.y - d.startY),
      });
      return;
    }

    if (tool === 'pencil' || tool === 'brush' || tool === 'eraser') {
      ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
      ctx.lineWidth = tool === 'eraser' ? 12 : tool === 'brush' ? 6 : 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(d.lastX, d.lastY);
      ctx.lineTo(pt.x, pt.y);
      ctx.stroke();
      d.lastX = pt.x;
      d.lastY = pt.y;
    } else if (
      (tool === 'line' || tool === 'curve' || tool === 'rect' || tool === 'ellipse') &&
      d.snapshot
    ) {
      ctx.putImageData(d.snapshot, 0, 0);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      if (tool === 'line') {
        ctx.moveTo(d.startX, d.startY);
        ctx.lineTo(pt.x, pt.y);
        ctx.stroke();
      } else if (tool === 'curve') {
        const cx = (d.startX + pt.x) / 2;
        const cy = Math.min(d.startY, pt.y) - 35;
        ctx.moveTo(d.startX, d.startY);
        ctx.quadraticCurveTo(cx, cy, pt.x, pt.y);
        ctx.stroke();
      } else if (tool === 'rect') {
        ctx.strokeRect(d.startX, d.startY, pt.x - d.startX, pt.y - d.startY);
      } else if (tool === 'ellipse') {
        const rx = Math.abs(pt.x - d.startX) / 2;
        const ry = Math.abs(pt.y - d.startY) / 2;
        const cx = Math.min(d.startX, pt.x) + rx;
        const cy = Math.min(d.startY, pt.y) + ry;
        ctx.ellipse(cx, cy, Math.max(1, rx), Math.max(1, ry), 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas?.hasPointerCapture(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId);
    }
    drawingRef.current.active = false;
    drawingRef.current.snapshot = null;
  };

  const handleDoubleClick = () => {
    if (tool === 'polygon' && polyPointsRef.current.length >= 2) {
      const ctx = canvasRef.current?.getContext('2d');
      const pts = polyPointsRef.current;
      if (ctx) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
        ctx.lineTo(pts[0].x, pts[0].y);
        ctx.stroke();
      }
      polyPointsRef.current = [];
    }
  };

  const applyCanvasResize = () => {
    const nw = Math.max(64, Math.min(1200, Number.parseInt(attrDialog.w, 10) || canvasW));
    const nh = Math.max(64, Math.min(900, Number.parseInt(attrDialog.h, 10) || canvasH));
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      const snapshotDataUrl = canvas.toDataURL('image/png');
      setCanvasW(nw);
      setCanvasH(nh);
      window.setTimeout(() => {
        const c2 = canvasRef.current;
        const ctx2 = c2?.getContext('2d');
        if (!c2 || !ctx2) return;
        fillWhite(ctx2, nw, nh);
        const img = new Image();
        img.onload = () => ctx2.drawImage(img, 0, 0);
        img.src = snapshotDataUrl;
        setDirty(true);
      }, 0);
    }
    setAttrDialog((a) => ({ ...a, open: false }));
  };

  const performSaveToTarget = (
    targetFolderId: string,
    targetName: string,
    existingId: string | undefined,
    allowOverwrite: boolean,
    afterSave?: () => void
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const res = onSaveFile({
      parentId: targetFolderId,
      name: targetName,
      content: dataUrl,
      kind: 'image',
      mimeType: 'image/png',
      existingFileId: existingId,
      allowOverwrite,
    });

    if (res.needsOverwriteConfirm) {
      onOpenModal({
        parentWindowId: windowId,
        kind: 'confirm',
        icon: 'warning',
        title: 'Confirm Save As',
        message: `${targetName} already exists.\nDo you want to replace it?`,
        confirmLabel: 'Yes',
        cancelLabel: 'No',
        onConfirm: () => performSaveToTarget(targetFolderId, targetName, existingId, true, afterSave),
      });
      return;
    }

    if (!res.ok || !res.node) {
      onOpenModal({
        parentWindowId: windowId,
        kind: 'alert',
        icon: 'error',
        title: 'Paint',
        message: res.error ?? 'Could not save picture.',
      });
      return;
    }

    setFileId(res.node.id);
    setFileName(res.node.name);
    setFolderId(res.node.parentId ?? defaultFolderId);
    setDirty(false);
    setFileDialog(null);
    afterSave?.();
  };

  const handleSave = (afterSave?: () => void) => {
    if (fileId && vfs.nodes[fileId]) {
      performSaveToTarget(folderId, fileName, fileId, true, afterSave);
    } else {
      setFileDialog({ mode: 'save', afterSave });
    }
  };

  const confirmDiscardIfDirty = (proceed: () => void) => {
    if (!dirty) {
      proceed();
      return;
    }
    onOpenModal({
      parentWindowId: windowId,
      kind: 'save_discard_cancel',
      icon: 'warning',
      title: 'Paint',
      message: `Save changes to ${fileName}?`,
      confirmLabel: 'Save',
      secondaryLabel: "Don't Save",
      cancelLabel: 'Cancel',
      onConfirm: () => handleSave(proceed),
      onSecondary: proceed,
    });
  };

  useEffect(() => {
    registerCloseGuard(windowId, () => {
      if (!dirty) return true;
      confirmDiscardIfDirty(() => onForceCloseWindow());
      return false;
    });
  });

  const handleDownloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = fileName.endsWith('.png') ? fileName : `${fileName}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const clearCanvasAction = () => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    pushUndo();
    if (selectionRect && selectionRect.w > 2 && selectionRect.h > 2) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(selectionRect.x, selectionRect.y, selectionRect.w, selectionRect.h);
      setSelectionRect(null);
    } else {
      fillWhite(ctx);
    }
    setDirty(true);
  };

  const tools: Array<{ id: PaintTool; label: string; glyph: string }> = [
    { id: 'select', label: 'Select', glyph: '⬚' },
    { id: 'eraser', label: 'Eraser', glyph: '▭' },
    { id: 'fill', label: 'Fill With Color', glyph: '🪣' },
    { id: 'eyedropper', label: 'Pick Color', glyph: '💧' },
    { id: 'magnifier', label: 'Magnifier', glyph: '🔍' },
    { id: 'pencil', label: 'Pencil', glyph: '✎' },
    { id: 'brush', label: 'Brush', glyph: '🖌' },
    { id: 'text', label: 'Text', glyph: 'A' },
    { id: 'line', label: 'Line', glyph: '╱' },
    { id: 'curve', label: 'Curve', glyph: '∿' },
    { id: 'rect', label: 'Rectangle', glyph: '▢' },
    { id: 'polygon', label: 'Polygon', glyph: '⬠' },
    { id: 'ellipse', label: 'Ellipse', glyph: '◯' },
  ];

  const menuGroups: XpMenuGroup[] = [
    {
      id: 'file',
      label: 'File',
      items: [
        {
          id: 'new',
          label: 'New',
          onSelect: () =>
            confirmDiscardIfDirty(() => {
              const ctx = canvasRef.current?.getContext('2d');
              if (ctx) fillWhite(ctx);
              undoStackRef.current = [];
              setUndoCount(0);
              setFileId(undefined);
              setFileName('untitled');
              setFolderId(defaultFolderId);
              setDirty(false);
            }),
        },
        {
          id: 'open',
          label: 'Open...',
          onSelect: () => confirmDiscardIfDirty(() => setFileDialog({ mode: 'open' })),
        },
        { id: 'save', label: 'Save', onSelect: () => handleSave() },
        { id: 'save_as', label: 'Save As...', onSelect: () => setFileDialog({ mode: 'save' }) },
        {
          id: 'download',
          label: 'Download PNG...',
          separatorBefore: true,
          onSelect: handleDownloadPng,
        },
        {
          id: 'exit',
          label: 'Exit',
          separatorBefore: true,
          onSelect: () => confirmDiscardIfDirty(() => onForceCloseWindow()),
        },
      ],
    },
    {
      id: 'edit',
      label: 'Edit',
      items: [
        {
          id: 'undo',
          label: 'Undo',
          shortcut: 'Ctrl+Z',
          disabled: undoCount === 0,
          onSelect: handleUndo,
        },
        {
          id: 'clear_sel',
          label: 'Clear Selection',
          disabled: !selectionRect,
          onSelect: clearCanvasAction,
        },
      ],
    },
    {
      id: 'view',
      label: 'View',
      items: [
        { id: 'z1', label: 'Zoom: 100%', checked: zoom === 1, onSelect: () => setZoom(1) },
        { id: 'z2', label: 'Zoom: 200%', checked: zoom === 2, onSelect: () => setZoom(2) },
        { id: 'z4', label: 'Zoom: 400%', checked: zoom === 4, onSelect: () => setZoom(4) },
      ],
    },
    {
      id: 'image',
      label: 'Image',
      items: [
        {
          id: 'attributes',
          label: 'Attributes / Resize...',
          onSelect: () => setAttrDialog({ open: true, w: String(canvasW), h: String(canvasH) }),
        },
        {
          id: 'clear',
          label: 'Clear Image',
          separatorBefore: true,
          onSelect: () => confirmDiscardIfDirty(() => clearCanvasAction()),
        },
      ],
    },
    {
      id: 'help',
      label: 'Help',
      items: [
        {
          id: 'about',
          label: 'About Paint',
          onSelect: () =>
            onOpenModal({
              parentWindowId: windowId,
              kind: 'alert',
              icon: 'info',
              title: 'About Paint',
              message: 'Microsoft Windows XP Paint\nVersion 5.1 (Service Pack 3)',
            }),
        },
      ],
    },
  ];

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#ece9d8] text-[11px]">
      <XpMenuBar groups={menuGroups} />

      <div className="flex-1 min-h-0 flex">
        {/* Left Toolbox */}
        <div className="w-[62px] shrink-0 bg-[#ece9d8] border-r border-[#aca899] p-1.5 flex flex-col items-center gap-1 overflow-y-auto">
          <div className="grid grid-cols-2 gap-1 w-full">
            {tools.map((t) => {
              const active = tool === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  title={t.label}
                  aria-label={t.label}
                  aria-pressed={active}
                  onClick={() => {
                    polyPointsRef.current = [];
                    setTool(t.id);
                  }}
                  className={`h-[24px] flex items-center justify-center border text-[12px] cursor-default ${
                    active
                      ? 'bg-[#ffffff] border-[#7f9db9] shadow-[inset_1px_1px_2px_rgba(0,0,0,0.2)]'
                      : 'bg-[#ece9d8] border-transparent hover:border-[#aca899] hover:bg-[#f6f4ec]'
                  }`}
                >
                  <span aria-hidden="true">{t.glyph}</span>
                </button>
              );
            })}
          </div>
          <div className="mt-2 w-full border-t border-[#aca899] pt-2 flex flex-col gap-1">
            <button
              type="button"
              disabled={undoCount === 0}
              onClick={handleUndo}
              title="Undo"
              className="xp-button w-full px-1 text-[10px]"
            >
              Undo
            </button>
            <button
              type="button"
              onClick={() => handleSave()}
              title="Save to My Pictures"
              className="xp-button w-full px-1 text-[10px]"
            >
              Save
            </button>
          </div>
        </div>

        {/* Canvas Workspace */}
        <div className="flex-1 min-w-0 min-h-0 bg-[#808080] p-2 overflow-auto xp-scroll flex items-start justify-start">
          <div className="relative inline-block">
            <canvas
              ref={canvasRef}
              width={canvasW}
              height={canvasH}
              data-testid="paint-canvas"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onDoubleClick={handleDoubleClick}
              onPointerLeave={() => setPointerPos(null)}
              style={{
                width: `${canvasW * zoom}px`,
                height: `${canvasH * zoom}px`,
              }}
              className="bg-[#ffffff] shadow-[2px_2px_4px_rgba(0,0,0,0.4)] cursor-crosshair touch-none"
            />
            {selectionRect && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute border border-dashed border-[#316ac5] bg-[#316ac5]/10"
                style={{
                  left: selectionRect.x * zoom,
                  top: selectionRect.y * zoom,
                  width: selectionRect.w * zoom,
                  height: selectionRect.h * zoom,
                }}
              />
            )}
            {textOverlay && (
              <input
                type="text"
                autoFocus
                aria-label="Paint text input"
                value={textOverlay.value}
                onChange={(e) =>
                  setTextOverlay((prev) => (prev ? { ...prev, value: e.target.value } : null))
                }
                onBlur={commitTextOverlay}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    commitTextOverlay();
                  } else if (e.key === 'Escape') {
                    setTextOverlay(null);
                  }
                }}
                style={{
                  left: textOverlay.x * zoom,
                  top: textOverlay.y * zoom,
                  color,
                }}
                className="absolute bg-white/85 border border-dashed border-[#316ac5] px-1 text-[13px] outline-none min-w-[100px]"
              />
            )}
          </div>
        </div>
      </div>

      {/* Color Palette */}
      <div className="shrink-0 bg-[#ece9d8] border-t border-[#aca899] px-2 py-1.5 flex items-center gap-2 overflow-x-auto">
        <div
          className="w-[28px] h-[28px] shrink-0 bg-[#f4f2eb] border border-[#7f9db9] relative shadow-inner"
          title={`Selected color: ${color}`}
        >
          <div
            className="w-[14px] h-[14px] border border-[#ffffff] shadow-sm absolute top-1 left-1"
            style={{ backgroundColor: color }}
          />
          <div className="w-[12px] h-[12px] border border-[#7f9db9] bg-[#ffffff] absolute bottom-1 right-1 -z-0" />
        </div>

        <div className="grid grid-cols-14 gap-[2px]">
          {PAINT_COLORS.map((swatch) => (
            <button
              key={swatch}
              type="button"
              aria-label={`Color ${swatch}`}
              aria-pressed={color === swatch}
              onClick={() => setColor(swatch)}
              className={`w-[15px] h-[15px] border cursor-default ${
                color === swatch ? 'border-[#000000] ring-1 ring-[#316ac5]' : 'border-[#7f9db9]'
              }`}
              style={{ backgroundColor: swatch }}
            />
          ))}
        </div>
      </div>

      {/* Status Bar */}
      <div className="h-[20px] shrink-0 bg-[#ece9d8] border-t border-[#aca899] px-2 flex items-center justify-between text-[11px] text-[#333333]">
        <span>
          Tool: {tools.find((t) => t.id === tool)?.label} | Color: {color} | Zoom: {zoom}x
        </span>
        <span className="tabular-nums">
          {pointerPos ? `${pointerPos.x}, ${pointerPos.y}px` : `${canvasW} x ${canvasH}`}
        </span>
      </div>

      {/* Attributes / Resize Modal */}
      {attrDialog.open && (
        <div className="fixed inset-0 z-[9945] flex items-center justify-center bg-black/20 p-3">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Image Attributes"
            className="w-full max-w-[290px] rounded-t-[7px] xp-window-active-border bg-[#ece9d8] flex flex-col shadow-xl"
          >
            <div className="h-[27px] xp-titlebar-active rounded-t-[5px] px-2 flex items-center justify-between">
              <span className="text-[12px] font-bold text-white">Attributes</span>
              <button
                type="button"
                onClick={() => setAttrDialog((a) => ({ ...a, open: false }))}
                className="xp-caption-close w-[21px] h-[21px] flex items-center justify-center"
              >
                ×
              </button>
            </div>
            <div className="p-3.5 flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-2">
                <label className="flex flex-col gap-1">
                  <span>Width (px):</span>
                  <input
                    type="number"
                    min={64}
                    max={1200}
                    value={attrDialog.w}
                    onChange={(e) => setAttrDialog((a) => ({ ...a, w: e.target.value }))}
                    className="xp-input h-[22px]"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span>Height (px):</span>
                  <input
                    type="number"
                    min={64}
                    max={900}
                    value={attrDialog.h}
                    onChange={(e) => setAttrDialog((a) => ({ ...a, h: e.target.value }))}
                    className="xp-input h-[22px]"
                  />
                </label>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={applyCanvasResize}
                  className="xp-button xp-button-default min-w-[70px]"
                >
                  OK
                </button>
                <button
                  type="button"
                  onClick={() => setAttrDialog((a) => ({ ...a, open: false }))}
                  className="xp-button min-w-[70px]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {fileDialog && (
        <VfsFileDialog
          mode={fileDialog.mode}
          title={fileDialog.mode === 'open' ? 'Open' : 'Save As'}
          vfs={vfs}
          initialFolderId={folderId}
          defaultFileName={
            fileDialog.mode === 'save'
              ? fileName === 'untitled'
                ? 'Drawing.png'
                : fileName
              : ''
          }
          acceptKinds={['image']}
          fileTypeLabel="PNG (*.png)"
          defaultExtension=".png"
          zIndex={9950}
          onCreateFolder={onCreateFolder}
          onCancel={() => setFileDialog(null)}
          onConfirm={({ folderId: targetFolder, fileName: targetName, selectedNode }) => {
            if (fileDialog.mode === 'open' && selectedNode?.content) {
              loadDataUrlOntoCanvas(selectedNode.content);
              setFileId(selectedNode.id);
              setFileName(selectedNode.name);
              setFolderId(selectedNode.parentId ?? defaultFolderId);
              setFileDialog(null);
              return;
            }
            const after = fileDialog.afterSave;
            performSaveToTarget(targetFolder, targetName, undefined, false, after);
          }}
        />
      )}
    </div>
  );
};
