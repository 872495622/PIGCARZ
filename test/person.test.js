import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';

globalThis.document = {
  createElement() {
    return {
      width: 4,
      height: 1,
      getContext() {
        return { fillStyle: '', fillRect() {} };
      },
    };
  },
};

const { createPerson, LOOKS } = await import('../src/person.js');

function shownBounds(root) {
  const box = new THREE.Box3();
  const tmp = new THREE.Box3();
  root.updateWorldMatrix(true, true);
  root.traverse((obj) => {
    if (!obj.geometry) return;
    let p = obj;
    while (p) {
      if (p.visible === false) return;
      p = p.parent;
    }
    if (!obj.geometry.boundingBox) obj.geometry.computeBoundingBox();
    tmp.copy(obj.geometry.boundingBox).applyMatrix4(obj.matrixWorld);
    box.union(tmp);
  });
  return box;
}

function finiteTree(root) {
  root.traverse((obj) => {
    const p = obj.position;
    assert.ok(Number.isFinite(p.x + p.y + p.z), obj.name || obj.type);
  });
}

test('every look stands on the ground and keeps a readable height', () => {
  for (const [id, look] of Object.entries(LOOKS)) {
    const person = createPerson({ look: { ...look, sit: false } });
    let minY = Infinity;
    let maxY = -Infinity;
    for (let i = 0; i < 24; i += 1) person.update(0.07, i < 8 ? 0 : 3.2, false);
    const box = shownBounds(person.group);
    minY = box.min.y;
    maxY = box.max.y;
    finiteTree(person.group);
    assert.ok(minY > -0.08 && minY < 0.12, `${id} feet at ${minY.toFixed(3)}`);
    assert.ok(maxY > 1.55 && maxY < 2.15, `${id} height ${maxY.toFixed(3)}`);
  }
});

test('a seated figure stays on the cushion', () => {
  const person = createPerson({ look: LOOKS.calm });
  for (let i = 0; i < 8; i += 1) person.update(0.1, 0, false);
  const box = shownBounds(person.group);
  finiteTree(person.group);
  assert.ok(box.min.y > -0.1 && box.min.y < 0.12, `seat contact ${box.min.y.toFixed(3)}`);
  assert.ok(box.max.y > 1.0 && box.max.y < 1.7, `seated height ${box.max.y.toFixed(3)}`);
});

test('wardrobe, weather, and the parcel keep the rig finite', () => {
  const person = createPerson({ look: LOOKS.nia });
  person.setOutfit({ hair: 3, top: 4, bottom: 2, shoes: 0, skin: 3, glasses: true });
  person.setParcel('#f3c258');
  person.setTalking(true);
  person.setWet(1, 1);
  person.update(0.2, 2, false);
  finiteTree(person.group);
  assert.equal(person.outfit.hair, 3);
  assert.equal(person.outfit.glasses, true);
});
