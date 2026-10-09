import { test } from "node:test";
import assert from "node:assert/strict";
import {
  hashReference,
  noteVariant,
  NEUTRAL_VARIANT,
} from "../../src/features/girlhood/paper/paperStyle";

test("note variation is deterministic for the same public reference", () => {
  assert.deepEqual(noteVariant("gh-abc123"), noteVariant("gh-abc123"));
  assert.equal(hashReference("gh-abc123"), hashReference("gh-abc123"));
});

test("note variation stays subtle for any reference", () => {
  for (let i = 0; i < 2000; i++) {
    const v = noteVariant("ref-" + i * 7919);
    assert.ok(v.rotate >= -2 && v.rotate <= 2, "rotation within +/-2 degrees");
    assert.ok(v.tapeShift >= -8 && v.tapeShift <= 8, "tape stays near centre");
    assert.ok(v.tapeTilt >= -3 && v.tapeTilt <= 3, "tape tilt within +/-3");
    assert.ok([0, 1, 2].includes(v.tone), "only three paper shades");
  }
});

test("note variation actually varies across references", () => {
  const rotations = new Set<number>();
  const tones = new Set<number>();
  for (let i = 0; i < 200; i++) {
    const v = noteVariant("note-" + i);
    rotations.add(v.rotate);
    tones.add(v.tone);
  }
  assert.ok(rotations.size > 10);
  assert.equal(tones.size, 3);
});

test("neutral variant is flat enough for full-size notes", () => {
  assert.equal(NEUTRAL_VARIANT.rotate, 0);
  assert.equal(NEUTRAL_VARIANT.tapeShift, 0);
});
