import React, { useEffect, useRef, useState } from 'react';
import type { SystemState, VfsNode, VfsState } from '../types/os';
import {
  SYSTEM_IDS,
  computeNodeSizeBytes,
  copyNode,
  createFolder,
  getChildren,
  getDisplayPath,
  isFolderLike,
  moveNode,
  moveToRecycleBin,
  renameNode,
  resolvePathFromFolder,
  writeFile,
} from '../state/vfs';

interface CommandPromptAppProps {
  windowId: string;
  isActive: boolean;
  vfs: VfsState;
  system: SystemState;
  onCommitVfs: (next: VfsState) => void;
  onCloseWindow: () => void;
}

function tokenizeArgs(line: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (/\s/.test(ch) && !inQuotes) {
      if (current) {
        tokens.push(current);
        current = '';
      }
    } else {
      current += ch;
    }
  }
  if (current) tokens.push(current);
  return tokens;
}

export const CommandPromptApp: React.FC<CommandPromptAppProps> = ({
  windowId,
  isActive,
  vfs,
  system,
  onCommitVfs,
  onCloseWindow,
}) => {
  const activeUser =
    system.users.find((u) => u.username === system.activeUsername) ?? system.users[0];
  const initialDir = activeUser?.docsFolderId ?? SYSTEM_IDS.MY_DOCUMENTS;

  const [cwdId, setCwdId] = useState<string>(initialDir);
  const [input, setInput] = useState('');
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [histCursor, setHistCursor] = useState<number>(-1);
  const [lines, setLines] = useState<string[]>(() =>
    system.groupPolicy.disableCmd
      ? ['The command prompt has been disabled by your administrator (Group Policy).']
      : [
          'Microsoft Windows XP [Version 5.1.2600]',
          '(C) Copyright 1985-2001 Microsoft Corp.',
          '',
          'Type HELP for a list of supported commands.',
          '',
        ]
  );

  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const promptPath = getDisplayPath(vfs, cwdId);

  useEffect(() => {
    if (isActive) inputRef.current?.focus();
  }, [isActive]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  const appendOut = (out: string[]) => {
    setLines((prev) => [...prev, ...out]);
  };

  const executeCommand = (rawLine: string) => {
    const trimmed = rawLine.trim();
    const prefix = `${promptPath}>${rawLine}`;
    if (!trimmed) {
      appendOut([prefix]);
      return;
    }

    if (system.groupPolicy.disableCmd) {
      appendOut([prefix, 'The command prompt has been disabled by your administrator.', '']);
      return;
    }

    setCmdHistory((prev) => [trimmed, ...prev.slice(0, 49)]);
    setHistCursor(-1);

    // Handle echo redirection: echo text > file.txt
    const redirMatch = trimmed.match(/^echo\s+(.+?)\s*(>>?)\s*(.+)$/i);
    if (redirMatch) {
      const textBody = redirMatch[1].replace(/^"(.*)"$/, '$1');
      const appendMode = redirMatch[2] === '>>';
      const targetPath = redirMatch[3].trim();
      const resolved = resolvePathFromFolder(vfs, cwdId, targetPath);
      const targetParentId = resolved.node?.parentId ?? resolved.parentId;
      const targetName = resolved.node?.name ?? resolved.targetName;
      if (!targetParentId || !targetName) {
        appendOut([prefix, 'The system cannot find the path specified.', '']);
        return;
      }
      const nextContent =
        appendMode && resolved.node?.content ? `${resolved.node.content}\r\n${textBody}` : textBody;
      const res = writeFile(vfs, {
        parentId: targetParentId,
        name: targetName,
        content: nextContent,
        kind: 'text',
        mimeType: 'text/plain',
        existingFileId: resolved.node?.id,
        allowOverwrite: true,
      });
      if (res.error) {
        appendOut([prefix, res.error, '']);
      } else {
        onCommitVfs(res.state);
        appendOut([prefix, '']);
      }
      return;
    }

    const parts = tokenizeArgs(trimmed);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    if (cmd === 'cls') {
      setLines([]);
      return;
    }
    if (cmd === 'exit') {
      onCloseWindow();
      return;
    }
    if (cmd === 'ver') {
      appendOut([prefix, '', 'Microsoft Windows XP [Version 5.1.2600 Service Pack 3]', '']);
      return;
    }
    if (cmd === 'date') {
      appendOut([prefix, `The current date is: ${new Date().toLocaleDateString()}`, '']);
      return;
    }
    if (cmd === 'time') {
      appendOut([prefix, `The current time is: ${new Date().toLocaleTimeString()}`, '']);
      return;
    }
    if (cmd === 'echo') {
      appendOut([prefix, args.join(' '), '']);
      return;
    }
    if (cmd === 'help') {
      appendOut([
        prefix,
        'Supported VFS commands:',
        '  DIR [path]       Displays a list of files and subdirectories.',
        '  CD [path]        Displays or changes the current directory.',
        '  TREE             Graphically displays the folder structure.',
        '  TYPE <file>      Displays the contents of a text file.',
        '  ECHO <text>      Displays messages or writes > file.txt.',
        '  MKDIR / MD <dir> Creates a directory.',
        '  COPY <src> <dst> Copies a file to another location or name.',
        '  MOVE <src> <dst> Moves a file or folder.',
        '  REN <old> <new>  Renames a file or folder.',
        '  DEL <file>       Moves a file to the Recycle Bin.',
        '  VER / DATE / TIME / CLS / EXIT',
        '',
      ]);
      return;
    }

    if (cmd === 'c:' || cmd === 'd:') {
      const targetId = cmd === 'd:' ? SYSTEM_IDS.D_DRIVE : SYSTEM_IDS.C_DRIVE;
      setCwdId(targetId);
      appendOut([prefix, '']);
      return;
    }

    if (cmd === 'cd' || cmd === 'chdir') {
      if (args.length === 0) {
        appendOut([prefix, promptPath, '']);
        return;
      }
      const res = resolvePathFromFolder(vfs, cwdId, args.join(' '));
      if (!res.node || !isFolderLike(res.node)) {
        appendOut([prefix, 'The system cannot find the path specified.', '']);
        return;
      }
      setCwdId(res.node.id);
      appendOut([prefix, '']);
      return;
    }

    if (cmd === 'dir') {
      const targetFolder = args[0] ? resolvePathFromFolder(vfs, cwdId, args[0]).node : vfs.nodes[cwdId];
      if (!targetFolder || !isFolderLike(targetFolder)) {
        appendOut([prefix, 'File Not Found', '']);
        return;
      }
      const list = getChildren(vfs, targetFolder.id, {
        includeHidden: system.folderOptions.showHidden,
      });
      const dirLines = [
        prefix,
        ` Volume in drive C has no label.`,
        ` Directory of ${getDisplayPath(vfs, targetFolder.id)}`,
        '',
      ];
      let fileCount = 0;
      let dirCount = 0;
      let totalBytes = 0;
      for (const n of list) {
        const dt = new Date(n.updatedAt).toLocaleDateString();
        if (isFolderLike(n)) {
          dirCount++;
          dirLines.push(`${dt.padEnd(12)}   <DIR>          ${n.name}`);
        } else {
          fileCount++;
          const sz = computeNodeSizeBytes(n);
          totalBytes += sz;
          dirLines.push(`${dt.padEnd(12)}   ${String(sz).padStart(14)} ${n.name}`);
        }
      }
      dirLines.push(`               ${fileCount} File(s)   ${totalBytes.toLocaleString()} bytes`);
      dirLines.push(`               ${dirCount} Dir(s)`);
      dirLines.push('');
      appendOut(dirLines);
      return;
    }

    if (cmd === 'tree') {
      const out = [prefix, getDisplayPath(vfs, cwdId)];
      const walk = (parentId: string, indent: string) => {
        const subs = getChildren(vfs, parentId, { includeHidden: false }).filter(isFolderLike);
        subs.forEach((s: VfsNode, idx: number) => {
          const last = idx === subs.length - 1;
          out.push(`${indent}${last ? '└───' : '├───'}${s.name}`);
          walk(s.id, indent + (last ? '    ' : '│   '));
        });
      };
      walk(cwdId, '');
      out.push('');
      appendOut(out);
      return;
    }

    if (cmd === 'type') {
      if (!args[0]) {
        appendOut([prefix, 'The syntax of the command is incorrect.', '']);
        return;
      }
      const res = resolvePathFromFolder(vfs, cwdId, args.join(' '));
      if (!res.node || isFolderLike(res.node)) {
        appendOut([prefix, 'The system cannot find the file specified.', '']);
        return;
      }
      appendOut([prefix, res.node.content ?? '', '']);
      return;
    }

    if (cmd === 'mkdir' || cmd === 'md') {
      if (!args[0]) {
        appendOut([prefix, 'The syntax of the command is incorrect.', '']);
        return;
      }
      const res = resolvePathFromFolder(vfs, cwdId, args.join(' '));
      const parentId = res.parentId ?? cwdId;
      const dirName = res.targetName ?? args.join(' ');
      const created = createFolder(vfs, parentId, dirName);
      if (created.error) {
        appendOut([prefix, created.error, '']);
      } else {
        onCommitVfs(created.state);
        appendOut([prefix, '']);
      }
      return;
    }

    if (cmd === 'ren' || cmd === 'rename') {
      if (args.length < 2) {
        appendOut([prefix, 'The syntax of the command is incorrect.', '']);
        return;
      }
      const src = resolvePathFromFolder(vfs, cwdId, args[0]);
      if (!src.node) {
        appendOut([prefix, 'The system cannot find the file specified.', '']);
        return;
      }
      const renamed = renameNode(vfs, src.node.id, args[1]);
      if (renamed.error) {
        appendOut([prefix, renamed.error, '']);
      } else {
        onCommitVfs(renamed.state);
        appendOut([prefix, '']);
      }
      return;
    }

    if (cmd === 'del' || cmd === 'erase') {
      if (!args[0]) {
        appendOut([prefix, 'The syntax of the command is incorrect.', '']);
        return;
      }
      const src = resolvePathFromFolder(vfs, cwdId, args.join(' '));
      if (!src.node) {
        appendOut([prefix, `Could Not Find ${args.join(' ')}`, '']);
        return;
      }
      const delRes = moveToRecycleBin(vfs, src.node.id);
      if (delRes.error) {
        appendOut([prefix, delRes.error, '']);
      } else {
        onCommitVfs(delRes.state);
        appendOut([prefix, '']);
      }
      return;
    }

    if (cmd === 'copy' || cmd === 'move') {
      if (args.length < 2) {
        appendOut([prefix, 'The syntax of the command is incorrect.', '']);
        return;
      }
      const src = resolvePathFromFolder(vfs, cwdId, args[0]);
      if (!src.node) {
        appendOut([prefix, 'The system cannot find the file specified.', '']);
        return;
      }
      const dst = resolvePathFromFolder(vfs, cwdId, args[1]);
      const destParentId = dst.node && isFolderLike(dst.node) ? dst.node.id : dst.parentId ?? cwdId;
      const explicitName = dst.node && isFolderLike(dst.node) ? undefined : dst.targetName;
      const mut =
        cmd === 'copy'
          ? copyNode(vfs, src.node.id, destParentId, explicitName)
          : moveNode(vfs, src.node.id, destParentId, explicitName);
      if (mut.error) {
        appendOut([prefix, mut.error, '']);
      } else {
        onCommitVfs(mut.state);
        appendOut([prefix, `        1 file(s) ${cmd === 'copy' ? 'copied' : 'moved'}.`, '']);
      }
      return;
    }

    appendOut([
      prefix,
      `'${parts[0]}' is not recognized as an internal or external command, operable program or batch file.`,
      '',
    ]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = input;
    setInput('');
    executeCommand(val);
  };

  return (
    <div
      onClick={() => inputRef.current?.focus()}
      className="flex-1 min-h-0 flex flex-col bg-[#000000] text-[#c0c0c0] font-mono text-[12px] leading-[1.35] p-2 overflow-hidden"
    >
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto xp-scroll whitespace-pre-wrap break-words">
        {lines.map((line, i) => (
          <div key={i}>{line || ' '}</div>
        ))}
        <form onSubmit={handleSubmit} className="flex items-center gap-1 mt-0.5">
          <label htmlFor={`cmd-input-${windowId}`} className="shrink-0 text-[#c0c0c0]">
            {promptPath}&gt;
          </label>
          <input
            id={`cmd-input-${windowId}`}
            ref={inputRef}
            type="text"
            value={input}
            disabled={system.groupPolicy.disableCmd}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowUp' && cmdHistory.length > 0) {
                e.preventDefault();
                const next = Math.min(cmdHistory.length - 1, histCursor + 1);
                setHistCursor(next);
                setInput(cmdHistory[next] ?? '');
              } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (histCursor <= 0) {
                  setHistCursor(-1);
                  setInput('');
                } else {
                  const next = histCursor - 1;
                  setHistCursor(next);
                  setInput(cmdHistory[next] ?? '');
                }
              }
            }}
            className="flex-1 bg-transparent text-[#ffffff] outline-none font-mono text-[12px] caret-white"
            autoComplete="off"
            spellCheck={false}
          />
        </form>
      </div>
    </div>
  );
};
