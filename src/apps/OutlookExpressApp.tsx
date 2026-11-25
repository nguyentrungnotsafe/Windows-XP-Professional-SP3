import React, { useEffect, useMemo, useState } from 'react';
import type {
  AppId,
  MailAttachment,
  MailFolderId,
  MailMessage,
  ModalPromptRequest,
  SystemState,
  VfsNode,
  VfsState,
  WindowInstance,
} from '../types/os';
import { SYSTEM_IDS } from '../state/vfs';
import { XpIcon } from '../components/xp/XpIcons';
import { XpMenuBar, type XpMenuGroup } from '../components/xp/XpMenuBar';
import { VfsFileDialog, iconForVfsNode } from '../components/xp/XpDialog';

const IDENTITIES = [
  { email: 'admin@xp-workstation.local', label: 'Administrator (admin@xp-workstation.local)' },
  { email: 'alex@xp-workstation.local', label: 'Alex Rivera (alex@xp-workstation.local)' },
];

const FOLDERS: Array<{ id: MailFolderId; label: string }> = [
  { id: 'inbox', label: 'Inbox' },
  { id: 'outbox', label: 'Outbox' },
  { id: 'sent', label: 'Sent Items' },
  { id: 'deleted', label: 'Deleted Items' },
  { id: 'drafts', label: 'Drafts' },
];

interface OutlookExpressAppProps {
  windowId: string;
  vfs: VfsState;
  system: SystemState;
  onUpdateSystem: (updater: (prev: SystemState) => SystemState) => void;
  onOpenVfsNode: (node: VfsNode) => void;
  onLaunchApp: (appId: AppId, payload?: WindowInstance['payload']) => void;
  onCreateFolder: (parentId: string, name: string) => { ok: boolean; error?: string };
  onTitleChange: (title: string) => void;
  onOpenModal: (modal: Omit<ModalPromptRequest, 'id'>) => void;
  onCloseWindow: () => void;
}

export const OutlookExpressApp: React.FC<OutlookExpressAppProps> = ({
  windowId,
  vfs,
  system,
  onUpdateSystem,
  onOpenVfsNode,
  onLaunchApp,
  onCreateFolder,
  onTitleChange,
  onOpenModal,
  onCloseWindow,
}) => {
  const [currentFolder, setCurrentFolder] = useState<MailFolderId>('inbox');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeTo, setComposeTo] = useState('alex@xp-workstation.local');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [composeAttachments, setComposeAttachments] = useState<MailAttachment[]>([]);
  const [draftEditingId, setDraftEditingId] = useState<string | null>(null);
  const [attachPickerOpen, setAttachPickerOpen] = useState(false);
  const [contactPickerOpen, setContactPickerOpen] = useState(false);

  const activeIdentity = system.activeMailIdentity || 'admin@xp-workstation.local';

  const folderLabel = FOLDERS.find((f) => f.id === currentFolder)?.label ?? 'Inbox';

  useEffect(() => {
    onTitleChange(`${folderLabel} - Outlook Express (${activeIdentity})`);
  }, [folderLabel, activeIdentity, onTitleChange]);

  const folderMessages = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return system.mailMessages
      .filter((m) => m.ownerIdentity === activeIdentity && m.folder === currentFolder)
      .filter(
        (m) =>
          !q ||
          m.subject.toLowerCase().includes(q) ||
          m.from.toLowerCase().includes(q) ||
          m.to.toLowerCase().includes(q) ||
          m.body.toLowerCase().includes(q)
      )
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [system.mailMessages, activeIdentity, currentFolder, searchText]);

  const selectedMsg = useMemo(
    () => folderMessages.find((m) => m.id === selectedId) ?? folderMessages[0] ?? null,
    [folderMessages, selectedId]
  );

  const selectMessage = (msg: MailMessage) => {
    setSelectedId(msg.id);
    if (!msg.read) {
      onUpdateSystem((prev) => ({
        ...prev,
        mailMessages: prev.mailMessages.map((m) =>
          m.id === msg.id ? { ...m, read: true } : m
        ),
      }));
    }
  };

  const openCompose = (mode: 'new' | 'reply' | 'forward' | 'draft', msg?: MailMessage) => {
    if (mode === 'new') {
      setDraftEditingId(null);
      setComposeTo(
        activeIdentity === 'admin@xp-workstation.local'
          ? 'alex@xp-workstation.local'
          : 'admin@xp-workstation.local'
      );
      setComposeSubject('');
      setComposeBody('');
      setComposeAttachments([]);
    } else if (mode === 'reply' && msg) {
      setDraftEditingId(null);
      setComposeTo(msg.from);
      setComposeSubject(msg.subject.startsWith('Re:') ? msg.subject : `Re: ${msg.subject}`);
      setComposeBody(`\n\n----- Original Message -----\nFrom: ${msg.from}\n\n${msg.body}`);
      setComposeAttachments([]);
    } else if (mode === 'forward' && msg) {
      setDraftEditingId(null);
      setComposeTo('');
      setComposeSubject(msg.subject.startsWith('Fwd:') ? msg.subject : `Fwd: ${msg.subject}`);
      setComposeBody(`\n\n----- Forwarded Message -----\nFrom: ${msg.from}\n\n${msg.body}`);
      setComposeAttachments(msg.attachments);
    } else if (mode === 'draft' && msg) {
      setDraftEditingId(msg.id);
      setComposeTo(msg.to);
      setComposeSubject(msg.subject);
      setComposeBody(msg.body);
      setComposeAttachments(msg.attachments);
    }
    setComposeOpen(true);
  };

  const handleSend = () => {
    const to = composeTo.trim();
    if (!to) {
      onOpenModal({
        parentWindowId: windowId,
        kind: 'alert',
        icon: 'warning',
        title: 'Outlook Express',
        message: 'Please specify at least one recipient e-mail address.',
      });
      return;
    }

    const now = Date.now();
    const sentMsg: MailMessage = {
      id: `mail_sent_${now}_${Math.random().toString(36).slice(2, 6)}`,
      ownerIdentity: activeIdentity,
      folder: 'sent',
      from: activeIdentity,
      to,
      subject: composeSubject.trim() || '(no subject)',
      body: composeBody,
      attachments: composeAttachments,
      read: true,
      timestamp: now,
    };

    const recipientIdentity = IDENTITIES.find(
      (i) => i.email.toLowerCase() === to.toLowerCase()
    )?.email;

    const inboxDeliveries: MailMessage[] = recipientIdentity
      ? [
          {
            id: `mail_in_${now}_${Math.random().toString(36).slice(2, 6)}`,
            ownerIdentity: recipientIdentity,
            folder: 'inbox',
            from: activeIdentity,
            to: recipientIdentity,
            subject: sentMsg.subject,
            body: sentMsg.body,
            attachments: sentMsg.attachments,
            read: false,
            timestamp: now,
          },
        ]
      : [];

    onUpdateSystem((prev) => ({
      ...prev,
      mailMessages: [
        ...prev.mailMessages.filter((m) => m.id !== draftEditingId),
        sentMsg,
        ...inboxDeliveries,
      ],
    }));

    setComposeOpen(false);
    setDraftEditingId(null);
    setCurrentFolder('sent');
    setSelectedId(sentMsg.id);
  };

  const handleSaveDraft = () => {
    const now = Date.now();
    const draftMsg: MailMessage = {
      id: draftEditingId ?? `mail_draft_${now}`,
      ownerIdentity: activeIdentity,
      folder: 'drafts',
      from: activeIdentity,
      to: composeTo.trim(),
      subject: composeSubject.trim() || '(no subject)',
      body: composeBody,
      attachments: composeAttachments,
      read: true,
      timestamp: now,
    };
    onUpdateSystem((prev) => ({
      ...prev,
      mailMessages: [...prev.mailMessages.filter((m) => m.id !== draftMsg.id), draftMsg],
    }));
    setComposeOpen(false);
    setCurrentFolder('drafts');
    setSelectedId(draftMsg.id);
  };

  const handleDeleteSelected = () => {
    if (!selectedMsg) return;
    if (selectedMsg.folder === 'deleted') {
      onUpdateSystem((prev) => ({
        ...prev,
        mailMessages: prev.mailMessages.filter((m) => m.id !== selectedMsg.id),
      }));
    } else {
      onUpdateSystem((prev) => ({
        ...prev,
        mailMessages: prev.mailMessages.map((m) =>
          m.id === selectedMsg.id ? { ...m, folder: 'deleted' } : m
        ),
      }));
    }
    setSelectedId(null);
  };

  const menuGroups: XpMenuGroup[] = [
    {
      id: 'file',
      label: 'File',
      items: [
        { id: 'new_msg', label: 'New Mail Message', onSelect: () => openCompose('new') },
        {
          id: 'switch_id',
          label: 'Switch Identity...',
          separatorBefore: true,
          onSelect: () => {
            const nextId =
              activeIdentity === 'admin@xp-workstation.local'
                ? 'alex@xp-workstation.local'
                : 'admin@xp-workstation.local';
            onUpdateSystem((prev) => ({ ...prev, activeMailIdentity: nextId }));
            setSelectedId(null);
          },
        },
        { id: 'close', label: 'Exit', separatorBefore: true, onSelect: onCloseWindow },
      ],
    },
    {
      id: 'tools',
      label: 'Tools',
      items: [
        {
          id: 'wab',
          label: 'Address Book...',
          onSelect: () => onLaunchApp('wab'),
        },
      ],
    },
  ];

  const countForFolder = (fid: MailFolderId) =>
    system.mailMessages.filter((m) => m.ownerIdentity === activeIdentity && m.folder === fid).length;

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#ece9d8] text-[11px] relative">
      <XpMenuBar groups={menuGroups} />

      {/* Toolbar */}
      <div className="h-[34px] shrink-0 bg-[#ece9d8] border-b border-[#aca899] px-2 flex items-center gap-1.5 overflow-x-auto">
        <button
          type="button"
          onClick={() => openCompose('new')}
          className="xp-button flex items-center gap-1 shrink-0"
        >
          <XpIcon name="outlook_express" size={14} />
          <span>Create Mail</span>
        </button>
        <button
          type="button"
          disabled={!selectedMsg}
          onClick={() => selectedMsg && openCompose('reply', selectedMsg)}
          className="xp-button shrink-0"
        >
          Reply
        </button>
        <button
          type="button"
          disabled={!selectedMsg}
          onClick={() => selectedMsg && openCompose('forward', selectedMsg)}
          className="xp-button shrink-0"
        >
          Forward
        </button>
        <button
          type="button"
          disabled={!selectedMsg}
          onClick={handleDeleteSelected}
          className="xp-button shrink-0"
        >
          Delete
        </button>
        {selectedMsg?.folder === 'deleted' && (
          <button
            type="button"
            onClick={() =>
              onUpdateSystem((prev) => ({
                ...prev,
                mailMessages: prev.mailMessages.map((m) =>
                  m.id === selectedMsg.id ? { ...m, folder: 'inbox' } : m
                ),
              }))
            }
            className="xp-button shrink-0"
          >
            Restore to Inbox
          </button>
        )}

        <div className="ml-auto flex items-center gap-1.5 shrink-0">
          <label htmlFor={`oe-id-${windowId}`} className="font-bold">
            Identity:
          </label>
          <select
            id={`oe-id-${windowId}`}
            aria-label="Mail Identity"
            value={activeIdentity}
            onChange={(e) => {
              onUpdateSystem((prev) => ({ ...prev, activeMailIdentity: e.target.value }));
              setSelectedId(null);
            }}
            className="xp-input h-[21px]"
          >
            {IDENTITIES.map((ident) => (
              <option key={ident.email} value={ident.email}>
                {ident.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Split */}
      <div className="flex-1 min-h-0 flex">
        {/* Folders & Contacts */}
        <aside className="w-[165px] shrink-0 bg-white border-r border-[#aca899] flex flex-col">
          <div className="bg-[#ece9d8] border-b border-[#aca899] px-2 py-1 font-bold text-[#0b3c8d]">
            Local Folders
          </div>
          <div className="p-1 flex flex-col gap-0.5">
            {FOLDERS.map((f) => {
              const count = countForFolder(f.id);
              const unread =
                f.id === 'inbox'
                  ? system.mailMessages.filter(
                      (m) => m.ownerIdentity === activeIdentity && m.folder === 'inbox' && !m.read
                    ).length
                  : 0;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    setCurrentFolder(f.id);
                    setSelectedId(null);
                  }}
                  className={`flex items-center justify-between px-2 py-1 text-left rounded-[2px] cursor-default ${
                    currentFolder === f.id
                      ? 'bg-[#316ac5] text-white'
                      : 'hover:bg-[#eef4fd] text-[#000000]'
                  }`}
                >
                  <span className="truncate">{f.label}</span>
                  <span className="text-[10px]">
                    {unread > 0 ? `(${unread})` : count > 0 ? count : ''}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="bg-[#ece9d8] border-y border-[#aca899] px-2 py-1 font-bold text-[#0b3c8d] mt-2">
            Contacts
          </div>
          <div className="flex-1 overflow-y-auto xp-scroll p-1 flex flex-col gap-0.5">
            {system.contacts.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  openCompose('new');
                  setComposeTo(c.email);
                }}
                className="text-left px-1.5 py-0.5 hover:bg-[#eef4fd] truncate"
                title={c.email}
              >
                {c.displayName}
              </button>
            ))}
          </div>
        </aside>

        {/* Message List + Preview */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="bg-[#f5f3ea] border-b border-[#aca899] px-2 py-1 flex items-center gap-2">
            <label htmlFor={`oe-search-${windowId}`}>Find:</label>
            <input
              id={`oe-search-${windowId}`}
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search subject, sender, or body..."
              className="xp-input flex-1 max-w-[260px]"
            />
            <span className="ml-auto text-[#555555]">
              {folderMessages.length} message(s)
            </span>
          </div>

          {/* List */}
          <div className="h-[155px] shrink-0 bg-white border-b border-[#aca899] overflow-y-auto xp-scroll">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-[#ece9d8] border-b border-[#aca899]">
                  <th className="px-2 py-1 w-[32%]">From / To</th>
                  <th className="px-2 py-1">Subject</th>
                  <th className="px-2 py-1 w-[110px]">Received</th>
                </tr>
              </thead>
              <tbody>
                {folderMessages.map((msg) => {
                  const selected = selectedMsg?.id === msg.id;
                  return (
                    <tr
                      key={msg.id}
                      onClick={() => selectMessage(msg)}
                      onDoubleClick={() => {
                        if (msg.folder === 'drafts') openCompose('draft', msg);
                      }}
                      className={`cursor-default ${
                        selected
                          ? 'bg-[#316ac5] text-white'
                          : 'hover:bg-[#eef4fd] text-[#000000]'
                      } ${!msg.read ? 'font-bold' : ''}`}
                    >
                      <td className="px-2 py-1 truncate">
                        {msg.folder === 'sent' ? `To: ${msg.to}` : msg.from}
                      </td>
                      <td className="px-2 py-1 truncate">
                        {msg.attachments.length > 0 ? '📎 ' : ''}
                        {msg.subject}
                      </td>
                      <td className="px-2 py-1 text-[10px]">
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  );
                })}
                {folderMessages.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-4 text-center text-[#666666]">
                      There are no items to show in this view.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Reading Pane */}
          <div className="flex-1 min-h-0 bg-white overflow-y-auto xp-scroll p-3">
            {selectedMsg ? (
              <div className="flex flex-col gap-2">
                <div className="bg-[#f5f3ea] border border-[#d4d0c8] p-2 flex flex-col gap-0.5">
                  <div>
                    <span className="font-bold">From:</span> {selectedMsg.from}
                  </div>
                  <div>
                    <span className="font-bold">To:</span> {selectedMsg.to}
                  </div>
                  <div>
                    <span className="font-bold">Subject:</span> {selectedMsg.subject}
                  </div>
                  {selectedMsg.folder === 'drafts' && (
                    <button
                      type="button"
                      onClick={() => openCompose('draft', selectedMsg)}
                      className="xp-button self-start mt-1"
                    >
                      Edit Draft
                    </button>
                  )}
                </div>

                {selectedMsg.attachments.length > 0 && (
                  <div className="bg-[#eef4fd] border border-[#9ebde8] p-2 flex flex-wrap items-center gap-2">
                    <span className="font-bold text-[#0b3c8d]">Attachments:</span>
                    {selectedMsg.attachments.map((att, idx) => {
                      const node = vfs.nodes[att.vfsNodeId];
                      return (
                        <button
                          key={`${att.vfsNodeId}_${idx}`}
                          type="button"
                          onClick={() => {
                            if (node) {
                              onOpenVfsNode(node);
                            } else {
                              onOpenModal({
                                parentWindowId: windowId,
                                kind: 'alert',
                                icon: 'warning',
                                title: 'Attachment Unavailable',
                                message: `The file "${att.name}" is currently in the Recycle Bin or was permanently deleted.`,
                              });
                            }
                          }}
                          className="xp-button flex items-center gap-1"
                        >
                          <XpIcon name={node ? iconForVfsNode(node) : 'text_file'} size={14} />
                          <span>{att.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="whitespace-pre-wrap leading-[1.5] pt-1 text-[12px]">
                  {selectedMsg.body}
                </div>
              </div>
            ) : (
              <div className="text-[#666666] p-3">Select a message to read its contents.</div>
            )}
          </div>
        </div>
      </div>

      {/* Compose Overlay */}
      {composeOpen && (
        <div className="absolute inset-0 bg-black/25 z-20 flex items-center justify-center p-3">
          <div className="w-full max-w-[540px] bg-[#ece9d8] border-2 border-[#0054e3] rounded-t-[6px] shadow-xl flex flex-col">
            <div className="h-[26px] xp-titlebar-active px-2 flex items-center justify-between text-white font-bold">
              <span>New Message ({activeIdentity})</span>
              <button
                type="button"
                onClick={() => setComposeOpen(false)}
                className="xp-caption-close w-[19px] h-[19px] text-white"
              >
                ×
              </button>
            </div>
            <div className="p-3 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <label htmlFor={`oe-to-${windowId}`} className="w-[54px] font-bold">
                  To:
                </label>
                <input
                  id={`oe-to-${windowId}`}
                  type="text"
                  value={composeTo}
                  onChange={(e) => setComposeTo(e.target.value)}
                  className="xp-input flex-1"
                />
                <button
                  type="button"
                  onClick={() => setContactPickerOpen((o) => !o)}
                  className="xp-button"
                >
                  Contacts...
                </button>
              </div>

              {contactPickerOpen && (
                <div className="bg-white border border-[#7f9db9] p-2 flex flex-wrap gap-1.5">
                  {system.contacts.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setComposeTo(c.email);
                        setContactPickerOpen(false);
                      }}
                      className="xp-button"
                    >
                      {c.displayName} &lt;{c.email}&gt;
                    </button>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2">
                <label htmlFor={`oe-subj-${windowId}`} className="w-[54px] font-bold">
                  Subject:
                </label>
                <input
                  id={`oe-subj-${windowId}`}
                  type="text"
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  className="xp-input flex-1"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setAttachPickerOpen(true)}
                  className="xp-button"
                >
                  Attach File...
                </button>
                {composeAttachments.map((att, idx) => (
                  <span
                    key={`${att.vfsNodeId}_${idx}`}
                    className="bg-white border border-[#aca899] px-1.5 py-0.5 flex items-center gap-1"
                  >
                    <span>📎 {att.name}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setComposeAttachments((prev) => prev.filter((_, i) => i !== idx))
                      }
                      className="text-[#b91c1c] font-bold"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              <textarea
                aria-label="Message body"
                value={composeBody}
                onChange={(e) => setComposeBody(e.target.value)}
                rows={8}
                className="xp-input w-full resize-none font-sans"
              />

              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={handleSaveDraft} className="xp-button">
                  Save to Drafts
                </button>
                <button
                  type="button"
                  onClick={handleSend}
                  className="xp-button xp-button-default"
                >
                  Send
                </button>
                <button
                  type="button"
                  onClick={() => setComposeOpen(false)}
                  className="xp-button"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {attachPickerOpen && (
        <VfsFileDialog
          mode="open"
          title="Insert Attachment"
          vfs={vfs}
          initialFolderId={SYSTEM_IDS.MY_PICTURES}
          acceptKinds={['text', 'rtf', 'image', 'audio', 'archive', 'project']}
          fileTypeLabel="All Virtual Files (*.*)"
          defaultExtension=""
          zIndex={9950}
          onCreateFolder={onCreateFolder}
          onConfirm={({ selectedNode }) => {
            setAttachPickerOpen(false);
            if (selectedNode) {
              setComposeAttachments((prev) => [
                ...prev,
                { vfsNodeId: selectedNode.id, name: selectedNode.name, kind: selectedNode.kind },
              ]);
            }
          }}
          onCancel={() => setAttachPickerOpen(false)}
        />
      )}
    </div>
  );
};
