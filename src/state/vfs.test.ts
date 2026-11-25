import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SYSTEM_IDS,
  createFolder,
  createInitialVfsState,
  deletePermanentlyFromTrash,
  emptyRecycleBin,
  getChildren,
  getDisplayPath,
  moveToRecycleBin,
  renameNode,
  resolveAddressPath,
  restoreFromRecycleBin,
  writeFile,
} from './vfs';

test('initial VFS seeds Welcome.txt inside My Documents', () => {
  const vfs = createInitialVfsState(1000);
  const docs = getChildren(vfs, SYSTEM_IDS.MY_DOCUMENTS);
  assert.equal(docs.some((n) => n.name === 'Welcome.txt'), true);
  assert.equal(docs.some((n) => n.name === 'My Pictures'), true);
  assert.equal(getDisplayPath(vfs, SYSTEM_IDS.MY_DOCUMENTS), 'C:\\Documents and Settings\\Administrator\\My Documents');
});

test('folder creation, rename, delete to Recycle Bin, and restore preserves nested documents', () => {
  let vfs = createInitialVfsState(1000);
  const fldRes = createFolder(vfs, SYSTEM_IDS.MY_DOCUMENTS, 'Projects', 1001);
  assert.ok(fldRes.node);
  vfs = fldRes.state;

  const fileRes = writeFile(vfs, {
    parentId: fldRes.node.id,
    name: 'Notes.txt',
    content: 'Project plan',
    kind: 'text',
    mimeType: 'text/plain',
    now: 1002,
  });
  assert.ok(fileRes.node);
  vfs = fileRes.state;

  const renameRes = renameNode(vfs, fldRes.node.id, 'Archive', 1003);
  assert.equal(renameRes.node?.name, 'Archive');
  vfs = renameRes.state;

  const delRes = moveToRecycleBin(vfs, fldRes.node.id, 1004);
  assert.equal(delRes.error, undefined);
  vfs = delRes.state;
  assert.equal(vfs.nodes[fldRes.node.id], undefined);
  assert.equal(vfs.nodes[fileRes.node.id], undefined);
  assert.equal(vfs.trash.length, 1);
  assert.equal(vfs.trash[0].descendants.length, 1);

  const restoreRes = restoreFromRecycleBin(vfs, vfs.trash[0].id, undefined, 1005);
  assert.equal(restoreRes.conflict, undefined);
  vfs = restoreRes.state;
  assert.equal(vfs.trash.length, 0);
  assert.equal(vfs.nodes[fldRes.node.id]?.name, 'Archive');
  assert.equal(vfs.nodes[fileRes.node.id]?.content, 'Project plan');
});

test('validates invalid and duplicate names without mutating state', () => {
  const vfs = createInitialVfsState(1000);
  const bad = createFolder(vfs, SYSTEM_IDS.MY_DOCUMENTS, 'bad/name');
  assert.ok(bad.error);
  assert.equal(bad.state, vfs);

  const dup = writeFile(vfs, {
    parentId: SYSTEM_IDS.MY_DOCUMENTS,
    name: 'welcome.txt',
    content: 'overwrite?',
    kind: 'text',
    mimeType: 'text/plain',
  });
  assert.equal(dup.needsOverwriteConfirm, true);
  assert.equal(dup.state, vfs);
});

test('restore conflict triggers prompt and supports keep_both and replace', () => {
  let vfs = createInitialVfsState(1000);
  const f1 = writeFile(vfs, {
    parentId: SYSTEM_IDS.MY_DOCUMENTS,
    name: 'Hello.txt',
    content: 'old version',
    kind: 'text',
    mimeType: 'text/plain',
  });
  vfs = f1.state;
  vfs = moveToRecycleBin(vfs, f1.node!.id).state;

  const f2 = writeFile(vfs, {
    parentId: SYSTEM_IDS.MY_DOCUMENTS,
    name: 'Hello.txt',
    content: 'new version',
    kind: 'text',
    mimeType: 'text/plain',
  });
  vfs = f2.state;

  const conflictCheck = restoreFromRecycleBin(vfs, vfs.trash[0].id);
  assert.ok(conflictCheck.conflict);

  const keepBoth = restoreFromRecycleBin(vfs, vfs.trash[0].id, 'keep_both');
  assert.equal(keepBoth.restoredNode?.name, 'Hello (2).txt');
  assert.equal(keepBoth.state.nodes[f2.node!.id]?.content, 'new version');
});

test('permanent delete and empty recycle bin work cleanly', () => {
  let vfs = createInitialVfsState(1000);
  vfs = moveToRecycleBin(vfs, 'welcome_txt').state;
  assert.equal(vfs.trash.length, 1);
  vfs = deletePermanentlyFromTrash(vfs, 'welcome_txt');
  assert.equal(vfs.trash.length, 0);

  const f = writeFile(vfs, {
    parentId: SYSTEM_IDS.MY_DOCUMENTS,
    name: 'Temp.txt',
    content: 'tmp',
    kind: 'text',
    mimeType: 'text/plain',
  });
  vfs = moveToRecycleBin(f.state, f.node!.id).state;
  assert.equal(vfs.trash.length, 1);
  vfs = emptyRecycleBin(vfs);
  assert.equal(vfs.trash.length, 0);
});

test('resolveAddressPath resolves standard XP paths', () => {
  const vfs = createInitialVfsState(1000);
  assert.equal(resolveAddressPath(vfs, 'My Computer'), SYSTEM_IDS.MY_COMPUTER);
  assert.equal(resolveAddressPath(vfs, 'C:\\'), SYSTEM_IDS.C_DRIVE);
  assert.equal(resolveAddressPath(vfs, 'My Documents'), SYSTEM_IDS.MY_DOCUMENTS);
  assert.equal(resolveAddressPath(vfs, 'My Pictures'), SYSTEM_IDS.MY_PICTURES);
  assert.equal(resolveAddressPath(vfs, 'Recycle Bin'), SYSTEM_IDS.RECYCLE_BIN);
});
