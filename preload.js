'use strict';

const { contextBridge, ipcRenderer } = require('electron');

function request(channel, payload) {
  const result = ipcRenderer.sendSync(channel, payload);
  if (!result || result.error) {
    throw new Error(result && result.error ? result.error : 'Falha ao acessar o armazenamento local.');
  }
  return result.value;
}

contextBridge.exposeInMainWorld('desktopDataStore', Object.freeze({
  read(key) {
    return request('data-store:read', key);
  },
  write(key, value) {
    request('data-store:write', { key, value });
  }
}));
