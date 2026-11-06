'use strict';

const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const { createDataStore } = require('./data-store');
const path = require('node:path');
const { fileURLToPath, pathToFileURL } = require('node:url');

const DATA_KEY = 'pdv_loja_v1';
let mainWindow;
const testUserDataPath = process.env.SISTEMA_VENDAS_TEST_USER_DATA;
if (!app.isPackaged && testUserDataPath) {
  app.setPath('userData', path.resolve(testUserDataPath));
}
const dataStore = createDataStore(() => app.getPath('userData'));

function appHtmlPath() {
  return path.join(app.getAppPath(), 'sistema-vendas.html');
}

function isTrustedRenderer(event) {
  if (!mainWindow || event.sender !== mainWindow.webContents || event.senderFrame !== mainWindow.webContents.mainFrame) {
    return false;
  }

  try {
    return path.resolve(fileURLToPath(event.senderFrame.url)) === path.resolve(appHtmlPath());
  } catch {
    return false;
  }
}

ipcMain.on('data-store:read', (event, key) => {
  if (!isTrustedRenderer(event)) {
    event.returnValue = { error: 'Origem não autorizada para leitura dos dados.' };
    return;
  }

  try {
    event.returnValue = { value: dataStore.read(key) };
  } catch (error) {
    event.returnValue = { error: error.message };
  }
});

ipcMain.on('data-store:write', (event, request) => {
  if (!isTrustedRenderer(event)) {
    event.returnValue = { error: 'Origem não autorizada para gravação dos dados.' };
    return;
  }

  try {
    if (!request || typeof request !== 'object') {
      throw new Error('Solicitação de armazenamento inválida.');
    }
    dataStore.write(request.key, request.value);
    event.returnValue = { value: true };
  } catch (error) {
    event.returnValue = { error: error.message };
  }
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 850,
    minWidth: 800,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true
    }
  });

  const localUrl = pathToFileURL(appHtmlPath()).href;
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (url !== localUrl) event.preventDefault();
  });
  mainWindow.webContents.on('will-attach-webview', event => event.preventDefault());
  mainWindow.webContents.on('did-fail-load', (_event, code, description, validatedURL, isMainFrame) => {
    if (isMainFrame && !mainWindow.isDestroyed()) {
      dialog.showErrorBox('Falha ao abrir o sistema', `${description} (${code})\n${validatedURL}`);
    }
  });
  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
  mainWindow.loadFile(appHtmlPath());
}

const hasSingleInstance = app.requestSingleInstanceLock();
if (!hasSingleInstance) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(createWindow).catch(error => {
    dialog.showErrorBox('Falha ao iniciar o sistema', error.message);
    app.quit();
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
