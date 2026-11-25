import test from 'node:test';
import assert from 'node:assert/strict';
import {
  base64ToBytes,
  bytesToBase64,
  createZipBytes,
  decodeUtf8,
  encodeUtf8,
  parseZipBytes,
} from './zip';
import {
  APP_REGISTRY,
  APP_REGISTRY_MAP,
  OPTIONAL_COMPONENT_DEFS,
  RUN_ALIAS_MAP,
  resolveAppForFile,
} from '../state/appRegistry';
import {
  SYSTEM_IDS,
  compressNodesToZip,
  copyNode,
  createFolder,
  createInitialVfsState,
  extractZipToFolder,
  moveNode,
  searchVfs,
  writeFile,
} from '../state/vfs';

test('ZIP encode and decode round trip preserves filenames and contents', () => {
  const bytes = createZipBytes([
    { name: 'hello.txt', data: encodeUtf8('Hello Windows XP!') },
    { name: 'Folder/sub.txt', data: encodeUtf8('Nested file content') },
  ]);
  const b64 = bytesToBase64(bytes);
  const parsed = parseZipBytes(base64ToBytes(b64));
  assert.equal(parsed.length, 2);
  assert.equal(parsed[0].name, 'hello.txt');
  assert.equal(decodeUtf8(parsed[0].data), 'Hello Windows XP!');
  assert.equal(parsed[1].name, 'Folder/sub.txt');
  assert.equal(decodeUtf8(parsed[1].data), 'Nested file content');
});

test('VFS compressNodesToZip and extractZipToFolder round-trip preserves files and folders', () => {
  let vfs = createInitialVfsState(1000);
  const fld = createFolder(vfs, SYSTEM_IDS.MY_DOCUMENTS, 'Bundle', 1001);
  vfs = fld.state;
  const f1 = writeFile(vfs, {
    parentId: fld.node!.id,
    name: 'Plan.txt',
    content: 'Launch checklist',
    kind: 'text',
    mimeType: 'text/plain',
    now: 1002,
  });
  vfs = f1.state;

  const zipRes = compressNodesToZip(vfs, [fld.node!.id], SYSTEM_IDS.MY_DOCUMENTS, 'Bundle.zip', 1003);
  assert.equal(zipRes.error, undefined);
  assert.ok(zipRes.node);
  vfs = zipRes.state;

  const extractRes = extractZipToFolder(vfs, zipRes.node!.id, SYSTEM_IDS.C_DRIVE, 1004);
  assert.equal(extractRes.error, undefined);
  assert.ok(extractRes.extractedFolder);
  const restoredFile = Object.values(extractRes.state.nodes).find(
    (n) => n.name === 'Plan.txt' && n.id !== f1.node!.id
  );
  assert.equal(restoredFile?.content, 'Launch checklist');
});

test('VFS searchVfs, copyNode, and moveNode work across folders', () => {
  let vfs = createInitialVfsState(1000);
  const folderA = createFolder(vfs, SYSTEM_IDS.MY_DOCUMENTS, 'FolderA', 1001);
  vfs = folderA.state;
  const copied = copyNode(vfs, 'welcome_txt', folderA.node!.id, 'WelcomeCopy.txt', 1002);
  assert.equal(copied.error, undefined);
  vfs = copied.state;

  const hits = searchVfs(vfs, { nameQuery: 'WelcomeCopy', category: 'documents' });
  assert.equal(hits.length, 1);
  assert.equal(hits[0].parentId, folderA.node!.id);

  const moved = moveNode(vfs, copied.node!.id, SYSTEM_IDS.C_DRIVE, undefined, 1003);
  assert.equal(moved.error, undefined);
  assert.equal(moved.node?.parentId, SYSTEM_IDS.C_DRIVE);
});

test('App Registry covers Run aliases, optional components, and file association resolution', () => {
  assert.ok(APP_REGISTRY.length >= 60);
  for (const entry of APP_REGISTRY) {
    assert.equal(APP_REGISTRY_MAP[entry.id], entry);
    if (entry.optionalComponentId) {
      assert.ok(
        OPTIONAL_COMPONENT_DEFS.some((d) => d.id === entry.optionalComponentId),
        `Missing optional component definition: ${entry.optionalComponentId}`
      );
    }
  }
  assert.equal(RUN_ALIAS_MAP['notepad'], 'notepad');
  assert.equal(RUN_ALIAS_MAP['wordpad'], 'wordpad');
  assert.equal(RUN_ALIAS_MAP['regedit'], 'regedit');
  assert.equal(RUN_ALIAS_MAP['gpedit.msc'], 'gpedit');
  assert.equal(resolveAppForFile('notes.txt', 'text', { '.txt': 'wordpad' }), 'wordpad');
});
