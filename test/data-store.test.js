'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { createDataStore } = require('../desktop/data-store');

function createTestStore(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'sistema-vendas-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  return { store: createDataStore(() => path.join(directory, 'dados')), directory };
}

function sampleData(loja) {
  return JSON.stringify({
    loja,
    users: [],
    products: [],
    sales: [],
    purchases: [],
    cashRegisters: [],
    goals: {},
    seq: {}
  });
}

test('stores data persistently and atomically replaces previous contents', t => {
  const { store, directory } = createTestStore(t);
  assert.equal(store.read('pdv_loja_v1'), null);

  store.write('pdv_loja_v1', sampleData('Loja inicial'));
  store.write('pdv_loja_v1', sampleData('Loja atualizada'));

  assert.equal(JSON.parse(store.read('pdv_loja_v1')).loja, 'Loja atualizada');
  assert.deepEqual(fs.readdirSync(path.join(directory, 'dados')), ['dados-sistema-vendas.json']);
});

test('rejects invalid keys and malformed application data without changing stored data', t => {
  const { store } = createTestStore(t);
  const original = sampleData('Loja salva');
  store.write('pdv_loja_v1', original);

  assert.throws(() => store.read('other-key'), /Chave de armazenamento inválida/);
  assert.throws(() => store.write('other-key', original), /Chave de armazenamento inválida/);
  assert.throws(() => store.write('pdv_loja_v1', '{'), /JSON válido/);
  assert.throws(() => store.write('pdv_loja_v1', JSON.stringify({ users: [] })), /estrutura dos dados/);
  assert.equal(store.read('pdv_loja_v1'), original);
});
