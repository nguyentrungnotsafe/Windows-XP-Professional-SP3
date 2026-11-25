import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  XP_SYSTEM_SOUNDS,
  XP_SYSTEM_SOUND_MAP,
  getModalSoundForIcon,
  getSessionTransitionSound,
  xpAudio,
} from './audioEngine';

test('XP_SYSTEM_SOUNDS maps all 5 XP audio events to existing WAV files on disk', () => {
  assert.equal(XP_SYSTEM_SOUNDS.length, 5);
  const expectedIds = ['startup', 'logon', 'logoff', 'shutdown', 'error'];
  assert.deepEqual(
    XP_SYSTEM_SOUNDS.map((s) => s.id),
    expectedIds
  );

  for (const sound of XP_SYSTEM_SOUNDS) {
    assert.ok(sound.url.startsWith('/assets/aistudio/'), `Expected /assets/aistudio/ prefix for ${sound.id}`);
    assert.ok(sound.url.endsWith('.wav'), `Expected .wav extension for ${sound.id}`);
    const diskPath = path.join(process.cwd(), 'public', sound.url.replace(/^\//, ''));
    assert.equal(fs.existsSync(diskPath), true, `Missing WAV file at ${diskPath}`);
    assert.ok(fs.statSync(diskPath).size > 1024, `WAV file too small at ${diskPath}`);
    assert.equal(XP_SYSTEM_SOUND_MAP[sound.id].url, sound.url);
  }
});

test('getModalSoundForIcon triggers XP Error sound for error and warning dialogs only', () => {
  assert.equal(getModalSoundForIcon('error'), 'error');
  assert.equal(getModalSoundForIcon('warning'), 'error');
  assert.equal(getModalSoundForIcon('info'), null);
  assert.equal(getModalSoundForIcon('question'), null);
  assert.equal(getModalSoundForIcon(undefined), null);
});

test('getSessionTransitionSound maps session transitions to authentic XP WAV events', () => {
  assert.equal(getSessionTransitionSound('power_on'), 'startup');
  assert.equal(getSessionTransitionSound('log_on'), 'logon');
  assert.equal(getSessionTransitionSound('log_off'), 'logoff');
  assert.equal(getSessionTransitionSound('shut_down'), 'shutdown');
});

test('xpAudio.applyState computes effective gain and honors mute', () => {
  xpAudio.applyState({
    masterVolume: 50,
    waveVolume: 80,
    synthVolume: 80,
    muted: false,
    balance: 0,
  });
  assert.ok(Math.abs(xpAudio.getEffectiveGain() - 0.4) < 1e-6);

  xpAudio.applyState({
    masterVolume: 100,
    waveVolume: 100,
    synthVolume: 80,
    muted: true,
    balance: -0.5,
  });
  assert.equal(xpAudio.getEffectiveGain(), 0);
});
