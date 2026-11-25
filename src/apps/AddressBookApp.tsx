import React, { useMemo, useState } from 'react';
import type { ContactItem, SystemState } from '../types/os';

interface AddressBookAppProps {
  system: SystemState;
  onUpdateSystem: (updater: (prev: SystemState) => SystemState) => void;
}

export const AddressBookApp: React.FC<AddressBookAppProps> = ({ system, onUpdateSystem }) => {
  const [groupFilter, setGroupFilter] = useState<'All Contacts' | 'Family' | 'Friends' | 'Work'>(
    'All Contacts'
  );
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(system.contacts[0]?.id ?? null);
  const [editing, setEditing] = useState<ContactItem | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return system.contacts.filter((c) => {
      if (groupFilter !== 'All Contacts' && c.group !== groupFilter) return false;
      if (!q) return true;
      return (
        c.displayName.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q)
      );
    });
  }, [system.contacts, groupFilter, search]);

  const selected = system.contacts.find((c) => c.id === selectedId) ?? null;

  const startNewContact = () => {
    setEditing({
      id: `cnt_${Date.now()}`,
      firstName: '',
      lastName: '',
      displayName: '',
      email: '',
      phone: '',
      company: '',
      group: groupFilter === 'All Contacts' ? 'Work' : groupFilter,
      notes: '',
    });
  };

  const saveContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const displayName =
      editing.displayName.trim() ||
      `${editing.firstName} ${editing.lastName}`.trim() ||
      editing.email.trim() ||
      'Unnamed Contact';
    const finalized: ContactItem = { ...editing, displayName };
    onUpdateSystem((prev) => {
      const exists = prev.contacts.some((c) => c.id === finalized.id);
      return {
        ...prev,
        contacts: exists
          ? prev.contacts.map((c) => (c.id === finalized.id ? finalized : c))
          : [...prev.contacts, finalized],
      };
    });
    setSelectedId(finalized.id);
    setEditing(null);
  };

  const deleteSelected = () => {
    if (!selected) return;
    onUpdateSystem((prev) => ({
      ...prev,
      contacts: prev.contacts.filter((c) => c.id !== selected.id),
    }));
    setSelectedId(null);
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#ece9d8] text-[11px]">
      {/* Toolbar */}
      <div className="bg-[#ece9d8] border-b border-[#aca899] p-1.5 flex flex-wrap items-center gap-1.5">
        <button type="button" onClick={startNewContact} className="xp-button xp-button-default px-2.5">
          New Contact...
        </button>
        <button
          type="button"
          disabled={!selected}
          onClick={() => selected && setEditing({ ...selected })}
          className="xp-button px-2.5"
        >
          Properties
        </button>
        <button
          type="button"
          disabled={!selected}
          onClick={deleteSelected}
          className="xp-button px-2.5"
        >
          Delete
        </button>
        <div className="flex-1" />
        <label className="flex items-center gap-1">
          <span>Find:</span>
          <input
            type="text"
            placeholder="Name or e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="xp-input h-[22px] w-[150px] bg-white"
          />
        </label>
      </div>

      {/* Main Split */}
      <div className="flex-1 min-h-0 flex">
        <aside className="w-[140px] shrink-0 bg-white border-r border-[#aca899] p-1 flex flex-col gap-0.5">
          {(['All Contacts', 'Work', 'Friends', 'Family'] as const).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGroupFilter(g)}
              className={`px-2 py-1 text-left rounded-[2px] cursor-default ${
                groupFilter === g ? 'bg-[#316ac5] text-white font-bold' : 'hover:bg-[#eef4fd]'
              }`}
            >
              {g}
            </button>
          ))}
        </aside>

        <div className="flex-1 min-w-0 flex flex-col bg-white">
          <div className="flex-1 min-h-0 overflow-auto xp-scroll">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-[#f4f2eb] border-b border-[#d4d0c8]">
                  <th className="py-1 px-2 font-normal">Name</th>
                  <th className="py-1 px-2 font-normal">E-mail Address</th>
                  <th className="py-1 px-2 font-normal">Phone</th>
                  <th className="py-1 px-2 font-normal">Group</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const sel = c.id === selectedId;
                  return (
                    <tr
                      key={c.id}
                      onClick={() => setSelectedId(c.id)}
                      onDoubleClick={() => setEditing({ ...c })}
                      className={`cursor-default ${
                        sel ? 'bg-[#316ac5] text-white' : 'hover:bg-[#eef4fd]'
                      }`}
                    >
                      <td className="py-1 px-2 font-medium">{c.displayName}</td>
                      <td className="py-1 px-2">{c.email}</td>
                      <td className="py-1 px-2">{c.phone}</td>
                      <td className="py-1 px-2">{c.group}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {selected && (
            <div className="h-[74px] shrink-0 bg-[#f6f4ec] border-t border-[#aca899] p-2 text-[11px] overflow-auto">
              <div className="font-bold">
                {selected.displayName} {selected.company ? `(${selected.company})` : ''}
              </div>
              <div className="text-[#444]">
                E-mail: {selected.email || '—'} | Phone: {selected.phone || '—'}
              </div>
              {selected.notes && <div className="text-[#666] mt-0.5">{selected.notes}</div>}
            </div>
          )}
        </div>
      </div>

      {/* Contact Properties Modal */}
      {editing && (
        <div className="fixed inset-0 z-[9945] flex items-center justify-center bg-black/20 p-3">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Contact Properties"
            className="w-full max-w-[380px] rounded-t-[7px] xp-window-active-border bg-[#ece9d8] flex flex-col shadow-xl"
          >
            <div className="h-[27px] xp-titlebar-active rounded-t-[5px] px-2 flex items-center justify-between">
              <span className="text-[12px] font-bold text-white">Contact Properties</span>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="xp-caption-close w-[21px] h-[21px] flex items-center justify-center"
              >
                ×
              </button>
            </div>
            <form onSubmit={saveContact} className="p-3.5 flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-2">
                <label className="flex flex-col gap-0.5">
                  <span>First name:</span>
                  <input
                    type="text"
                    value={editing.firstName}
                    onChange={(e) => setEditing({ ...editing, firstName: e.target.value })}
                    className="xp-input h-[22px]"
                  />
                </label>
                <label className="flex flex-col gap-0.5">
                  <span>Last name:</span>
                  <input
                    type="text"
                    value={editing.lastName}
                    onChange={(e) => setEditing({ ...editing, lastName: e.target.value })}
                    className="xp-input h-[22px]"
                  />
                </label>
              </div>
              <label className="flex flex-col gap-0.5">
                <span>Display name:</span>
                <input
                  type="text"
                  value={editing.displayName}
                  onChange={(e) => setEditing({ ...editing, displayName: e.target.value })}
                  className="xp-input h-[22px]"
                />
              </label>
              <label className="flex flex-col gap-0.5">
                <span>E-mail address:</span>
                <input
                  type="email"
                  value={editing.email}
                  onChange={(e) => setEditing({ ...editing, email: e.target.value })}
                  className="xp-input h-[22px]"
                />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex flex-col gap-0.5">
                  <span>Phone:</span>
                  <input
                    type="text"
                    value={editing.phone}
                    onChange={(e) => setEditing({ ...editing, phone: e.target.value })}
                    className="xp-input h-[22px]"
                  />
                </label>
                <label className="flex flex-col gap-0.5">
                  <span>Group:</span>
                  <select
                    value={editing.group}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        group: e.target.value as ContactItem['group'],
                      })
                    }
                    className="xp-input h-[22px] bg-white"
                  >
                    <option value="Work">Work</option>
                    <option value="Friends">Friends</option>
                    <option value="Family">Family</option>
                  </select>
                </label>
              </div>
              <label className="flex flex-col gap-0.5">
                <span>Company:</span>
                <input
                  type="text"
                  value={editing.company}
                  onChange={(e) => setEditing({ ...editing, company: e.target.value })}
                  className="xp-input h-[22px]"
                />
              </label>
              <label className="flex flex-col gap-0.5">
                <span>Notes:</span>
                <input
                  type="text"
                  value={editing.notes}
                  onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
                  className="xp-input h-[22px]"
                />
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button type="submit" className="xp-button xp-button-default min-w-[74px]">
                  OK
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="xp-button min-w-[74px]"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
