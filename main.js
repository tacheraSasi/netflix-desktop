const { app, components, BrowserWindow, Tray, Menu, Notification, nativeImage, nativeTheme, shell, globalShortcut } = require('electron');
const path = require('path');
const isOnlineImport = import('is-online');

let tray = null;
let isQuitting = false;
let mainWindow;
const URL = 'https://netflix.com/';
const OFFLINE_URL = 'offline.html';
const GITHUB_URL = 'https://github.com/tacheraSasi/netflix-desktop.git';

app.setName('Netflix');
app.setVersion('1.0.0');

app.setAboutPanelOptions({
  applicationName: 'Netflix',
  applicationVersion: '1.0.0',
  copyright: '© 2025 Tachera Sasi',
  credits: 'Unofficial wrapper around Netflix\nMade with ❤️ by Tachera Sasi.',
  website: URL
});

app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');//allows autoplay of notifications 


async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 992,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: false,
      nodeIntegration: false,
    },
    icon: path.join(__dirname, 'build/icon.png'),
    frame: true,
    autoHideMenuBar: true,
    show: false
  });

  mainWindow.once('ready-to-show', () => mainWindow.show());

  
  app.on('before-quit', () => {
    isQuitting = true;
  });
  
  mainWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });


  // mainWindow.webContents.setUserAgent("Mozilla/5.0 (Google Chat Desktop)");

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  const isOnline = (await isOnlineImport).default;
  const online = await isOnline();

  if (online) {
    mainWindow.loadURL(URL);
  } else {
    mainWindow.loadFile(OFFLINE_URL);
  }
  mainWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    if (permission === 'notifications') {
      return callback(true); // allows notifications
    }
    callback(false);
  });


  setInterval(() => {
    mainWindow.webContents.executeJavaScript(
      `document.title.includes("•")`
    ).then((hasUnread) => {
      app.setBadgeCount(hasUnread ? 1 : 0);
    });
  }, 5000);
}

function createTray() {
  const trayIcon = nativeImage.createFromPath(path.join(__dirname, 'build/icon.png')).resize({ width: 16, height: 16 });

  tray = new Tray(trayIcon);
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show App', click: () => mainWindow.show() },
    { label: 'Toggle Dark Mode', click: toggleDarkMode },
    { label: 'Open GitHub', click: () => shell.openExternal(GITHUB_URL) },
    { label: 'Quit', click: () => app.quit() }
  ]);

  tray.setToolTip('Netflix Desktop');
  tray.setContextMenu(contextMenu);
}

function toggleDarkMode() {
  const newTheme = nativeTheme.shouldUseDarkColors ? 'light' : 'dark';
  nativeTheme.themeSource = newTheme;
}

function scheduleMorningNotification() {
  if (Notification.isSupported()) {
    new Notification({
      title: 'Netflix',
      body: 'Welcome to Netflix! Click to open.\nTachera Sasi',
      icon: path.join(__dirname, 'build/icon.png'),
    }).show();
  }
}

Menu.setApplicationMenu(Menu.buildFromTemplate([
  {
    label: 'View',
    submenu: [
      { role: 'reload' },
      { role: 'toggleDevTools' },
      { label: 'Toggle Dark Mode', click: toggleDarkMode },
    ],
  },
  {
    label: 'Help',
    submenu: [
      { label: 'GitHub Repo', click: () => shell.openExternal(GITHUB_URL) }
    ]
  }
]));

app.whenReady().then(async () => {
  await components.whenReady();
  console.log('components ready:', components.status());
  createWindow();
  createTray();
  scheduleMorningNotification();

  globalShortcut.register('CommandOrControl+Shift+C', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
    }
  });

  app.setLoginItemSettings({ openAtLogin: true });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
