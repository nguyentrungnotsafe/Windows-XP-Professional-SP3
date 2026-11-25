import React, { useEffect, useRef, useState } from 'react';
import type { ModalPromptRequest, PrinterDevice, VfsNode, VfsState } from '../types/os';
import { SYSTEM_IDS } from '../state/vfs';
import { XpMenuBar, type XpMenuGroup } from '../components/xp/XpMenuBar';
import { VfsFileDialog } from '../components/xp/XpDialog';

interface WordPadDocPayload {
  format: 'xp_wordpad_v1';
  html: string;
}

function sanitizeRichHtml(rawHtml: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${rawHtml}</div>`, 'text/html');
  const root = doc.body.firstElementChild;
  if (!root) return '';
  const allowedTags = new Set([
    'DIV',
    'P',
    'BR',
    'B',
    'STRONG',
    'I',
    'EM',
    'U',
    'FONT',
    'SPAN',
    'UL',
    'OL',
    'LI',
  ]);
  const walk = (el: Element) => {
    const children = Array.from(el.children);
    for (const ch of children) {
      if (!allowedTags.has(ch.tagName)) {
        const span = doc.createElement('span');
        span.textContent = ch.textContent ?? '';
        ch.replaceWith(span);
      } else {
        // Strip unsafe attributes like onclick, onerror, javascript:
        for (const attr of Array.from(ch.attributes)) {
          const name = attr.name.toLowerCase();
          if (name !== 'style' && name !== 'color' && name !== 'face' && name !== 'size') {
            ch.removeAttribute(attr.name);
          }
        }
        walk(ch);
      }
    }
  };
  walk(root);
  return root.innerHTML;
}

function decodeWordPadContent(raw?: string): string {
  if (!raw) return '<p><br></p>';
  try {
    const parsed = JSON.parse(raw) as Partial<WordPadDocPayload>;
    if (parsed.format === 'xp_wordpad_v1' && typeof parsed.html === 'string') {
      return sanitizeRichHtml(parsed.html) || '<p><br></p>';
    }
  } catch {
    // Plain text fallback
  }
  const escaped = raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\r?\n/g, '<br>');
  return `<p>${escaped || '<br>'}</p>`;
}

interface WordPadAppProps {
  windowId: string;
  isActive: boolean;
  vfs: VfsState;
  printers: PrinterDevice[];
  initialFileId?: string;
  defaultFolderId?: string;
  registerCloseGuard: (windowId: string, guard: () => boolean) => void;
  onTitleChange: (title: string) => void;
  onSaveFile: (params: {
    parentId: string;
    name: string;
    content: string;
    kind: 'rtf';
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
  onSubmitPrintJob: (printerId: string, documentName: string, appName: string, pages: number) => void;
  onOpenModal: (modal: Omit<ModalPromptRequest, 'id'>) => void;
  onForceCloseWindow: () => void;
}

export const WordPadApp: React.FC<WordPadAppProps> = ({
  windowId,
  isActive,
  vfs,
  printers,
  initialFileId,
  defaultFolderId = SYSTEM_IDS.MY_DOCUMENTS,
  registerCloseGuard,
  onTitleChange,
  onSaveFile,
  onCreateFolder,
  onSubmitPrintJob,
  onOpenModal,
  onForceCloseWindow,
}) => {
  const initialNode = initialFileId ? vfs.nodes[initialFileId] : undefined;
  const [fileId, setFileId] = useState<string | undefined>(initialNode?.id);
  const [fileName, setFileName] = useState<string>(initialNode?.name ?? 'Document.rtf');
  const [folderId, setFolderId] = useState<string>(initialNode?.parentId ?? defaultFolderId);
  const [dirty, setDirty] = useState(false);
  const [showRuler, setShowRuler] = useState(true);
  const [fontName, setFontName] = useState('Times New Roman');
  const [fontSize, setFontSize] = useState('3');
  const [textColor, setTextColor] = useState('#000000');
  const [printPreviewOpen, setPrintPreviewOpen] = useState(false);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [selectedPrinterId, setSelectedPrinterId] = useState(
    printers.find((p) => p.isDefault)?.id ?? printers[0]?.id ?? ''
  );
  const [fileDialog, setFileDialog] = useState<null | {
    mode: 'open' | 'save';
    afterSave?: () => void;
  }>(null);

  const editorRef = useRef<HTMLDivElement>(null);
  const onTitleChangeRef = useRef(onTitleChange);
  onTitleChangeRef.current = onTitleChange;

  useEffect(() => {
    onTitleChangeRef.current(`${fileName} - WordPad`);
  }, [fileName]);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = decodeWordPadContent(initialNode?.content);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isActive && !fileDialog && !printPreviewOpen && !printDialogOpen) {
      editorRef.current?.focus();
    }
  }, [isActive, fileDialog, printPreviewOpen, printDialogOpen]);

  const execFmt = (cmd: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, value);
    setDirty(true);
  };

  const serializeHtml = () => {
    const html = sanitizeRichHtml(editorRef.current?.innerHTML ?? '');
    return JSON.stringify({ format: 'xp_wordpad_v1', html } satisfies WordPadDocPayload);
  };

  const performSaveToTarget = (
    targetFolderId: string,
    targetName: string,
    existingId: string | undefined,
    allowOverwrite: boolean,
    afterSave?: () => void
  ) => {
    const res = onSaveFile({
      parentId: targetFolderId,
      name: targetName,
      content: serializeHtml(),
      kind: 'rtf',
      mimeType: 'application/rtf',
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
        onConfirm: () =>
          performSaveToTarget(targetFolderId, targetName, existingId, true, afterSave),
      });
      return;
    }

    if (!res.ok || !res.node) {
      onOpenModal({
        parentWindowId: windowId,
        kind: 'alert',
        icon: 'error',
        title: 'WordPad',
        message: res.error ?? 'Could not save document.',
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
      title: 'WordPad',
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

  const handlePrintSubmit = () => {
    const printerId = selectedPrinterId || printers[0]?.id;
    if (!printerId) return;
    onSubmitPrintJob(printerId, fileName, 'WordPad', 1);
    setPrintDialogOpen(false);
    onOpenModal({
      parentWindowId: windowId,
      kind: 'alert',
      icon: 'info',
      title: 'WordPad Print',
      message: `"${fileName}" was sent to the Print Spooler queue. Open Printers and Faxes to inspect job status.`,
    });
  };

  const menuGroups: XpMenuGroup[] = [
    {
      id: 'file',
      label: 'File',
      items: [
        {
          id: 'new',
          label: 'New...',
          onSelect: () =>
            confirmDiscardIfDirty(() => {
              setFileId(undefined);
              setFileName('Document.rtf');
              setFolderId(defaultFolderId);
              if (editorRef.current) editorRef.current.innerHTML = '<p><br></p>';
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
          id: 'print_preview',
          label: 'Print Preview',
          separatorBefore: true,
          onSelect: () => setPrintPreviewOpen(true),
        },
        {
          id: 'print',
          label: 'Print...',
          onSelect: () => setPrintDialogOpen(true),
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
        { id: 'undo', label: 'Undo', onSelect: () => execFmt('undo') },
        { id: 'cut', label: 'Cut', separatorBefore: true, onSelect: () => execFmt('cut') },
        { id: 'copy', label: 'Copy', onSelect: () => execFmt('copy') },
        { id: 'select_all', label: 'Select All', separatorBefore: true, onSelect: () => execFmt('selectAll') },
      ],
    },
    {
      id: 'view',
      label: 'View',
      items: [
        {
          id: 'ruler',
          label: 'Ruler',
          checked: showRuler,
          onSelect: () => setShowRuler((r) => !r),
        },
      ],
    },
    {
      id: 'insert',
      label: 'Insert',
      items: [
        {
          id: 'date_time',
          label: 'Date and Time...',
          onSelect: () => execFmt('insertText', new Date().toLocaleString()),
        },
      ],
    },
    {
      id: 'format',
      label: 'Format',
      items: [
        { id: 'bold', label: 'Bold', onSelect: () => execFmt('bold') },
        { id: 'italic', label: 'Italic', onSelect: () => execFmt('italic') },
        { id: 'underline', label: 'Underline', onSelect: () => execFmt('underline') },
        { id: 'bullets', label: 'Bullet Style', separatorBefore: true, onSelect: () => execFmt('insertUnorderedList') },
      ],
    },
    {
      id: 'help',
      label: 'Help',
      items: [
        {
          id: 'about',
          label: 'About WordPad',
          onSelect: () =>
            onOpenModal({
              parentWindowId: windowId,
              kind: 'alert',
              icon: 'info',
              title: 'About WordPad',
              message: 'Microsoft Windows XP WordPad\nVersion 5.1 (Service Pack 3)',
            }),
        },
      ],
    },
  ];

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#ece9d8] text-[11px]">
      <XpMenuBar groups={menuGroups} />

      {/* Format Toolbar */}
      <div className="bg-[#ece9d8] border-b border-[#aca899] px-2 py-1 flex flex-wrap items-center gap-1.5">
        <button type="button" onClick={() => handleSave()} className="xp-button px-2">
          Save
        </button>
        <button type="button" onClick={() => setPrintDialogOpen(true)} className="xp-button px-2">
          Print...
        </button>
        <div className="h-[18px] w-[1px] bg-[#aca899]" />

        <select
          aria-label="Font family"
          value={fontName}
          onChange={(e) => {
            setFontName(e.target.value);
            execFmt('fontName', e.target.value);
          }}
          className="xp-input h-[22px] bg-white"
        >
          <option value="Times New Roman">Times New Roman</option>
          <option value="Arial">Arial</option>
          <option value="Tahoma">Tahoma</option>
          <option value="Courier New">Courier New</option>
          <option value="Verdana">Verdana</option>
        </select>

        <select
          aria-label="Font size"
          value={fontSize}
          onChange={(e) => {
            setFontSize(e.target.value);
            execFmt('fontSize', e.target.value);
          }}
          className="xp-input h-[22px] bg-white w-[56px]"
        >
          <option value="1">8 pt</option>
          <option value="2">10 pt</option>
          <option value="3">12 pt</option>
          <option value="4">14 pt</option>
          <option value="5">18 pt</option>
          <option value="6">24 pt</option>
        </select>

        <button
          type="button"
          aria-label="Bold"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => execFmt('bold')}
          className="xp-button px-2 font-bold min-w-[24px]"
        >
          B
        </button>
        <button
          type="button"
          aria-label="Italic"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => execFmt('italic')}
          className="xp-button px-2 italic min-w-[24px]"
        >
          I
        </button>
        <button
          type="button"
          aria-label="Underline"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => execFmt('underline')}
          className="xp-button px-2 underline min-w-[24px]"
        >
          U
        </button>

        <label className="flex items-center gap-1" title="Text color">
          <span className="sr-only">Text Color</span>
          <input
            type="color"
            aria-label="Text Color"
            value={textColor}
            onChange={(e) => {
              setTextColor(e.target.value);
              execFmt('foreColor', e.target.value);
            }}
            className="w-[22px] h-[22px] border border-[#7f9db9] bg-white p-0"
          />
        </label>

        <div className="h-[18px] w-[1px] bg-[#aca899]" />

        <button
          type="button"
          aria-label="Align Left"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => execFmt('justifyLeft')}
          className="xp-button px-2"
        >
          Left
        </button>
        <button
          type="button"
          aria-label="Align Center"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => execFmt('justifyCenter')}
          className="xp-button px-2"
        >
          Center
        </button>
        <button
          type="button"
          aria-label="Align Right"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => execFmt('justifyRight')}
          className="xp-button px-2"
        >
          Right
        </button>
        <button
          type="button"
          aria-label="Bullets"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => execFmt('insertUnorderedList')}
          className="xp-button px-2"
        >
          • List
        </button>
      </div>

      {/* Ruler */}
      {showRuler && (
        <div
          aria-hidden="true"
          className="h-[18px] shrink-0 bg-[#f6f4ec] border-b border-[#aca899] px-4 flex items-center text-[9px] text-[#555] font-mono overflow-hidden"
        >
          <div className="flex-1 flex justify-between border-b border-[#888] pb-0.5">
            {['1', '2', '3', '4', '5', '6', '7'].map((inch) => (
              <span key={inch}>| · · {inch} · ·</span>
            ))}
          </div>
        </div>
      )}

      {/* Rich-Text Editor */}
      <div className="flex-1 min-h-0 bg-[#808080] p-3 overflow-y-auto xp-scroll flex justify-center">
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          aria-label="WordPad rich text editor"
          onInput={() => setDirty(true)}
          className="w-full max-w-[600px] min-h-full bg-white text-black p-6 shadow-md outline-none text-[14px] leading-[1.45]"
          style={{ fontFamily: '"Times New Roman", Times, serif' }}
        />
      </div>

      <div className="h-[20px] shrink-0 bg-[#ece9d8] border-t border-[#aca899] px-2 flex items-center justify-between text-[#333]">
        <span>For Help, press F1</span>
        <span>{dirty ? 'Modified' : 'Saved'}</span>
      </div>

      {/* Print Preview */}
      {printPreviewOpen && (
        <div className="fixed inset-0 z-[9945] bg-black/25 flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Print Preview"
            className="w-full max-w-[540px] h-[460px] rounded-t-[7px] xp-window-active-border bg-[#ece9d8] flex flex-col shadow-xl"
          >
            <div className="h-[27px] xp-titlebar-active rounded-t-[5px] px-2 flex items-center justify-between">
              <span className="text-[12px] font-bold text-white">Print Preview — {fileName}</span>
              <button
                type="button"
                onClick={() => setPrintPreviewOpen(false)}
                className="xp-caption-close w-[21px] h-[21px] flex items-center justify-center"
              >
                ×
              </button>
            </div>
            <div className="p-2 border-b border-[#aca899] flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setPrintPreviewOpen(false);
                  setPrintDialogOpen(true);
                }}
                className="xp-button xp-button-default px-3"
              >
                Print...
              </button>
              <button
                type="button"
                onClick={() => setPrintPreviewOpen(false)}
                className="xp-button px-3"
              >
                Close
              </button>
            </div>
            <div className="flex-1 bg-[#808080] p-4 overflow-auto flex justify-center">
              <div
                className="w-[380px] min-h-[420px] bg-white p-6 shadow text-black text-[12px]"
                dangerouslySetInnerHTML={{
                  __html: sanitizeRichHtml(editorRef.current?.innerHTML ?? ''),
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Print Dialog */}
      {printDialogOpen && (
        <div className="fixed inset-0 z-[9950] bg-black/20 flex items-center justify-center p-3">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Print"
            className="w-full max-w-[360px] rounded-t-[7px] xp-window-active-border bg-[#ece9d8] flex flex-col shadow-xl"
          >
            <div className="h-[27px] xp-titlebar-active rounded-t-[5px] px-2 flex items-center justify-between">
              <span className="text-[12px] font-bold text-white">Print</span>
              <button
                type="button"
                onClick={() => setPrintDialogOpen(false)}
                className="xp-caption-close w-[21px] h-[21px] flex items-center justify-center"
              >
                ×
              </button>
            </div>
            <div className="p-3.5 flex flex-col gap-3">
              <label className="flex flex-col gap-1">
                <span className="font-bold">Select Printer:</span>
                <select
                  aria-label="Select Printer"
                  value={selectedPrinterId}
                  onChange={(e) => setSelectedPrinterId(e.target.value)}
                  className="xp-input h-[24px] bg-white"
                >
                  {printers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.port})
                    </option>
                  ))}
                </select>
              </label>
              <div className="text-[#444]">Document: {fileName}</div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={handlePrintSubmit}
                  className="xp-button xp-button-default min-w-[74px]"
                >
                  Print
                </button>
                <button
                  type="button"
                  onClick={() => setPrintDialogOpen(false)}
                  className="xp-button min-w-[74px]"
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
          defaultFileName={fileDialog.mode === 'save' ? fileName : ''}
          acceptKinds={['rtf', 'text']}
          fileTypeLabel="Rich Text Format (*.rtf)"
          defaultExtension=".rtf"
          zIndex={9950}
          onCreateFolder={onCreateFolder}
          onCancel={() => setFileDialog(null)}
          onConfirm={({ folderId: targetFolder, fileName: targetName, selectedNode }) => {
            if (fileDialog.mode === 'open' && selectedNode) {
              setFileId(selectedNode.id);
              setFileName(selectedNode.name);
              setFolderId(selectedNode.parentId ?? defaultFolderId);
              if (editorRef.current) {
                editorRef.current.innerHTML = decodeWordPadContent(selectedNode.content);
              }
              setDirty(false);
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
