'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { randomBytes } = require('node:crypto');

const DATA_KEY = 'pdv_loja_v1';
const DATA_FILE = 'dados-sistema-vendas.json';
const MAX_DATA_BYTES = 50 * 1024 * 1024;

function validateData(value) {
  if (typeof value !== 'string' || Buffer.byteLength(value, 'utf8') > MAX_DATA_BYTES) {
    throw new Error('Os dados recebidos são inválidos ou excedem o limite permitido.');
  }

  let data;
  try {
    data = JSON.parse(value);
  } catch {
    throw new Error('O conteúdo enviado ao armazenamento não é um JSON válido.');
  }

  if (!data || typeof data !== 'object' ||
      !Array.isArray(data.users) || !Array.isArray(data.products) ||
      !Array.isArray(data.sales) || !Array.isArray(data.purchases) ||
      !Array.isArray(data.cashRegisters) || !data.goals ||
      typeof data.goals !== 'object' || Array.isArray(data.goals) ||
      !data.seq || typeof data.seq !== 'object' || Array.isArray(data.seq)) {
    throw new Error('A estrutura dos dados do sistema é inválida.');
  }
}

function createDataStore(getUserDataPath) {
  function getDataPath() {
    return path.join(getUserDataPath(), DATA_FILE);
  }

  function read(key) {
    if (key !== DATA_KEY) throw new Error('Chave de armazenamento inválida.');
    try {
      return fs.readFileSync(getDataPath(), 'utf8');
    } catch (error) {
      if (error.code === 'ENOENT') return null;
      throw new Error(`Não foi possível ler os dados locais: ${error.message}`);
    }
  }

  function write(key, value) {
    if (key !== DATA_KEY) throw new Error('Chave de armazenamento inválida.');
    validateData(value);

    const file = getDataPath();
    const directory = path.dirname(file);
    const tempFile = `${file}.${process.pid}.${randomBytes(8).toString('hex')}.tmp`;

    try {
      fs.mkdirSync(directory, { recursive: true });
      fs.writeFileSync(tempFile, value, { encoding: 'utf8', flag: 'wx', mode: 0o600 });
      fs.renameSync(tempFile, file);
    } catch (error) {
      try {
        fs.unlinkSync(tempFile);
      } catch (cleanupError) {
        if (cleanupError.code !== 'ENOENT') {
          console.error('Falha ao limpar arquivo temporário de dados:', cleanupError);
        }
      }
      throw new Error(`Não foi possível salvar os dados locais: ${error.message}`);
    }
  }

  return Object.freeze({ read, write });
}

module.exports = { createDataStore };
