import React, { useEffect, useRef, useState } from 'react';
import type { ModalPromptRequest, VfsNode, VfsState } from '../types/os';
import { SYSTEM_IDS } from '../state/vfs';
import { XpMenuBar, type XpMenuGroup } from '../components/xp/XpMenuBar';
import { VfsFileDialog } from '../components/xp/XpDialog';

interface NotepadAppProps {
  windowId: string;
  isActive: boolean;
  vfs: VfsState;
  initialFileId?: string;
  defaultFolderId?: string;
  registerCloseGuard: (windowId: string, guard: () => boolean) => void;
  onTitleChange: (title: string) => void;
  onDirtyChange: (dirty: boolean) => void;
  onSaveFile: (params: {
    parentId: string;
    name: string;
    content: string;
    kind: 'text';
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

export const NotepadApp: React.FC<NotepadAppProps> = ({
  windowId,
  isActive,
  vfs,
  initialFileId,
  defaultFolderId = SYSTEM_IDS.MY_DOCUMENTS,
  registerCloseGuard,
  onTitleChange,
  onDirtyChange,
  onSaveFile,
  onCreateFolder,
  onOpenModal,
  onForceCloseWindow,
}) => {
  const initialNode = initialFileId ? vfs.nodes[initialFileId] : undefined;
  const [fileId, setFileId] = useState<string | undefined>(initialNode?.id);
  const [fileName, setFileName] = useState<string>(initialNode?.name ?? 'Untitled');
  const [folderId, setFolderId] = useState<string>(initialNode?.parentId ?? defaultFolderId);
  const [text, setText] = useState<string>(initialNode?.content ?? '');
  const [savedText, setSavedText] = useState<string>(initialNode?.content ?? '');
  const [wordWrap, setWordWrap] = useState<boolean>(true);
  const [showStatusBar, setShowStatusBar] = useState<boolean>(true);
  const [caretPos, setCaretPos] = useState<{ ln: number; col: number }>({ ln: 1, col: 1 });
  const [fileDialog, setFileDialog] = useState<null | {
    mode: 'open' | 'save';
    afterSave?: () => void;
  }>(null);

  // Find / Replace / Go To dialogs
  const [findMode, setFindMode] = useState<null | 'find' | 'replace' | 'goto'>(null);
  const [findQuery, setFindQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [matchCase, setMatchCase] = useState(false);
  const [gotoLine, setGotoLine] = useState('1');
  const [findFeedback, setFindFeedback] = useState('');

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isDirty = text !== savedText;
  const onTitleChangeRef = useRef(onTitleChange);
  onTitleChangeRef.current = onTitleChange;
  const onDirtyChangeRef = useRef(onDirtyChange);
  onDirtyChangeRef.current = onDirtyChange;

  useEffect(() => {
    onTitleChangeRef.current(`${fileName} - Notepad`);
  }, [fileName]);

  useEffect(() => {
    onDirtyChangeRef.current(isDirty);
  }, [isDirty]);

  useEffect(() => {
    if (isActive && !fileDialog && !findMode) {
      textareaRef.current?.focus();
    }
  }, [isActive, fileDialog, findMode]);

  const syncCaret = () => {
    const el = textareaRef.current;
    if (!el) return;
    const pos = el.selectionStart ?? 0;
    const before = text.slice(0, pos);
    const lines = before.split(/\r?\n/);
    setCaretPos({ ln: lines.length, col: lines[lines.length - 1].length + 1 });
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
      content: text,
      kind: 'text',
      mimeType: 'text/plain',
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
        onConfirm: () => {
          performSaveToTarget(targetFolderId, targetName, existingId, true, afterSave);
        },
      });
      return;
    }

    if (!res.ok || !res.node) {
      onOpenModal({
        parentWindowId: windowId,
        kind: 'alert',
        icon: 'error',
        title: 'Notepad',
        message: res.error ?? 'Could not save file.',
      });
      return;
    }

    setFileId(res.node.id);
    setFileName(res.node.name);
    setFolderId(res.node.parentId ?? defaultFolderId);
    setSavedText(text);
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
    if (!isDirty) {
      proceed();
      return;
    }
    onOpenModal({
      parentWindowId: windowId,
      kind: 'save_discard_cancel',
      icon: 'warning',
      title: 'Notepad',
      message: `Do you want to save changes to ${fileName}?`,
      confirmLabel: 'Save',
      secondaryLabel: "Don't Save",
      cancelLabel: 'Cancel',
      onConfirm: () => {
        handleSave(proceed);
      },
      onSecondary: () => {
        proceed();
      },
      onCancel: () => {
        textareaRef.current?.focus();
      },
    });
  };

  useEffect(() => {
    registerCloseGuard(windowId, () => {
      if (!isDirty) return true;
      confirmDiscardIfDirty(() => {
        onForceCloseWindow();
      });
      return false;
    });
  });

  const handleFindNext = () => {
    if (!findQuery) {
      setFindMode('find');
      return;
    }
    const hay = matchCase ? text : text.toLowerCase();
    const needle = matchCase ? findQuery : findQuery.toLowerCase();
    const startFrom = (textareaRef.current?.selectionEnd ?? 0);
    let idx = hay.indexOf(needle, startFrom);
    if (idx === -1 && startFrom > 0) {
      idx = hay.indexOf(needle, 0);
    }
    if (idx === -1) {
      setFindFeedback(`Cannot find "${findQuery}"`);
      return;
    }
    setFindFeedback('');
    const el = textareaRef.current;
    if (el) {
      el.focus();
      el.setSelectionRange(idx, idx + findQuery.length);
      syncCaret();
    }
  };

  const handleReplaceOne = () => {
    const el = textareaRef.current;
    if (!el || !findQuery) return;
    const sel = text.slice(el.selectionStart, el.selectionEnd);
    const matches = matchCase ? sel === findQuery : sel.toLowerCase() === findQuery.toLowerCase();
    if (matches) {
      const start = el.selectionStart;
      const next = text.slice(0, start) + replaceQuery + text.slice(el.selectionEnd);
      setText(next);
      window.setTimeout(() => {
        el.focus();
        el.setSelectionRange(start, start + replaceQuery.length);
      }, 0);
    } else {
      handleFindNext();
    }
  };

  const handleReplaceAll = () => {
    if (!findQuery) return;
    const escaped = findQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(escaped, matchCase ? 'g' : 'gi');
    const matches = text.match(re)?.length ?? 0;
    setText(text.replace(re, replaceQuery));
    setFindFeedback(`Replaced ${matches} occurrence(s).`);
  };

  const handleGoToLine = (e: React.FormEvent) => {
    e.preventDefault();
    const targetLn = Math.max(1, Number.parseInt(gotoLine, 10) || 1);
    const lines = text.split(/\r?\n/);
    const clamped = Math.min(lines.length, targetLn);
    let offset = 0;
    for (let i = 0; i < clamped - 1; i++) {
      offset += lines[i].length + 1;
    }
    setFindMode(null);
    const el = textareaRef.current;
    if (el) {
      el.focus();
      el.setSelectionRange(offset, offset);
      syncCaret();
    }
  };

  useEffect(() => {
    if (!isActive) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSave();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setFindFeedback('');
        setFindMode('find');
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        setFindFeedback('');
        setFindMode('replace');
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'g') {
        e.preventDefault();
        setFindMode('goto');
      } else if (e.key === 'F3') {
        e.preventDefault();
        handleFindNext();
      } else if (e.key === 'F5') {
        e.preventDefault();
        setText((t) => t + new Date().toLocaleString());
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const handleNew = () => {
    confirmDiscardIfDirty(() => {
      setFileId(undefined);
      setFileName('Untitled');
      setFolderId(defaultFolderId);
      setText('');
      setSavedText('');
    });
  };

  const handleOpen = () => {
    confirmDiscardIfDirty(() => {
      setFileDialog({ mode: 'open' });
    });
  };

  const handleExit = () => {
    if (!isDirty) {
      onForceCloseWindow();
      return;
    }
    confirmDiscardIfDirty(() => {
      onForceCloseWindow();
    });
  };

  const handleSelectAll = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.focus();
    el.select();
  };

  const menuGroups: XpMenuGroup[] = [
    {
      id: 'file',
      label: 'File',
      items: [
        { id: 'new', label: 'New', shortcut: 'Ctrl+N', onSelect: handleNew },
        { id: 'open', label: 'Open...', shortcut: 'Ctrl+O', onSelect: handleOpen },
        { id: 'save', label: 'Save', shortcut: 'Ctrl+S', onSelect: () => handleSave() },
        { id: 'save_as', label: 'Save As...', onSelect: () => setFileDialog({ mode: 'save' }) },
        { id: 'exit', label: 'Exit', separatorBefore: true, onSelect: handleExit },
      ],
    },
    {
      id: 'edit',
      label: 'Edit',
      items: [
        {
          id: 'find',
          label: 'Find...',
          shortcut: 'Ctrl+F',
          onSelect: () => {
            setFindFeedback('');
            setFindMode('find');
          },
        },
        {
          id: 'find_next',
          label: 'Find Next',
          shortcut: 'F3',
          onSelect: handleFindNext,
        },
        {
          id: 'replace',
          label: 'Replace...',
          shortcut: 'Ctrl+H',
          onSelect: () => {
            setFindFeedback('');
            setFindMode('replace');
          },
        },
        {
          id: 'goto',
          label: 'Go To...',
          shortcut: 'Ctrl+G',
          onSelect: () => setFindMode('goto'),
        },
        {
          id: 'select_all',
          label: 'Select All',
          shortcut: 'Ctrl+A',
          separatorBefore: true,
          onSelect: handleSelectAll,
        },
        {
          id: 'delete_all',
          label: 'Clear Document',
          disabled: text.length === 0,
          onSelect: () => setText(''),
        },
        {
          id: 'time_date',
          label: 'Time/Date',
          shortcut: 'F5',
          separatorBefore: true,
          onSelect: () => setText((t) => t + new Date().toLocaleString()),
        },
      ],
    },
    {
      id: 'format',
      label: 'Format',
      items: [
        {
          id: 'word_wrap',
          label: 'Word Wrap',
          checked: wordWrap,
          onSelect: () => setWordWrap((w) => !w),
        },
      ],
    },
    {
      id: 'view',
      label: 'View',
      items: [
        {
          id: 'status_bar',
          label: 'Status Bar',
          checked: showStatusBar,
          onSelect: () => setShowStatusBar((s) => !s),
        },
      ],
    },
    {
      id: 'help',
      label: 'Help',
      items: [
        {
          id: 'about',
          label: 'About Notepad',
          onSelect: () =>
            onOpenModal({
              parentWindowId: windowId,
              kind: 'alert',
              icon: 'info',
              title: 'About Notepad',
              message: 'Microsoft Windows XP Notepad\nVersion 5.1 (Service Pack 3)',
            }),
        },
      ],
    },
  ];

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#ece9d8] relative">
      <XpMenuBar groups={menuGroups} />

      {findMode && (
        <div className="bg-[#ece9d8] border-b border-[#aca899] p-2 flex flex-wrap items-center gap-2 text-[11px]">
          {findMode === 'goto' ? (
            <form onSubmit={handleGoToLine} className="flex items-center gap-2">
              <label htmlFor={`goto-${windowId}`}>Line number:</label>
              <input
                id={`goto-${windowId}`}
                type="number"
                min={1}
                value={gotoLine}
                onChange={(e) => setGotoLine(e.target.value)}
                className="xp-input w-[80px] h-[22px]"
              />
              <button type="submit" className="xp-button xp-button-default px-3">
                Go To
              </button>
              <button type="button" onClick={() => setFindMode(null)} className="xp-button px-2.5">
                Close
              </button>
            </form>
          ) : (
            <div className="flex flex-wrap items-center gap-2 w-full">
              <label className="flex items-center gap-1">
                <span>Find what:</span>
                <input
                  type="text"
                  value={findQuery}
                  onChange={(e) => setFindQuery(e.target.value)}
                  className="xp-input w-[150px] h-[22px]"
                />
              </label>
              {findMode === 'replace' && (
                <label className="flex items-center gap-1">
                  <span>Replace with:</span>
                  <input
                    type="text"
                    value={replaceQuery}
                    onChange={(e) => setReplaceQuery(e.target.value)}
                    className="xp-input w-[140px] h-[22px]"
                  />
                </label>
              )}
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={matchCase}
                  onChange={(e) => setMatchCase(e.target.checked)}
                />
                <span>Match case</span>
              </label>
              <button
                type="button"
                onClick={handleFindNext}
                className="xp-button xp-button-default px-2.5"
              >
                Find Next
              </button>
              {findMode === 'replace' && (
                <>
                  <button type="button" onClick={handleReplaceOne} className="xp-button px-2.5">
                    Replace
                  </button>
                  <button type="button" onClick={handleReplaceAll} className="xp-button px-2.5">
                    Replace All
                  </button>
                </>
              )}
              <button type="button" onClick={() => setFindMode(null)} className="xp-button px-2.5">
                Close
              </button>
              {findFeedback && <span className="text-[#a31515] font-medium">{findFeedback}</span>}
            </div>
          )}
        </div>
      )}

      <textarea
        ref={textareaRef}
        aria-label="Notepad editor"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          syncCaret();
        }}
        onClick={syncCaret}
        onKeyUp={syncCaret}
        wrap={wordWrap ? 'soft' : 'off'}
        spellCheck={false}
        className="flex-1 min-h-0 w-full resize-none bg-[#ffffff] text-[#000000] p-1.5 outline-none border-t border-[#7f9db9] xp-scroll text-[13px] leading-[1.35]"
        style={{ fontFamily: '"Lucida Console", Consolas, "Courier New", monospace' }}
      />

      {showStatusBar && (
        <div className="h-[20px] shrink-0 bg-[#ece9d8] border-t border-[#aca899] px-2 flex items-center justify-end gap-4 text-[11px] text-[#333333]">
          <span>
            Ln {caretPos.ln}, Col {caretPos.col}
          </span>
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
              ? fileName === 'Untitled'
                ? 'Untitled.txt'
                : fileName
              : ''
          }
          acceptKinds={['text']}
          fileTypeLabel="Text Documents (*.txt)"
          defaultExtension=".txt"
          zIndex={9950}
          onCreateFolder={onCreateFolder}
          onCancel={() => setFileDialog(null)}
          onConfirm={({ folderId: targetFolder, fileName: targetName, selectedNode }) => {
            if (fileDialog.mode === 'open' && selectedNode) {
              setFileId(selectedNode.id);
              setFileName(selectedNode.name);
              setFolderId(selectedNode.parentId ?? defaultFolderId);
              setText(selectedNode.content ?? '');
              setSavedText(selectedNode.content ?? '');
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
