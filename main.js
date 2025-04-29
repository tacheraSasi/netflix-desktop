const { app, BrowserWindow, Tray, Menu, Notification, nativeImage, nativeTheme, shell, globalShortcut } = require('electron');
const path = require('path');
const isOnlineImport = import('is-online');

let Store;
(async () => {
  Store = (await import('electron-store')).default;

  app.whenReady().then(() => {
    if (store.get('theme')) {
      nativeTheme.themeSource = store.get('theme');
    }

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
})();


let tray = null;
let mainWindow;
const URL = 'https://chat.google.com/';
const OFFLINE_URL = 'offline.html';
const GITHUB_URL = 'https://github.com/tacheraSasi/googleChat-desktop.git';

const store = new Store();

app.setName('Google Chat');
app.setVersion('1.0.0');

app.setAboutPanelOptions({
  applicationName: 'Google Chat',
  applicationVersion: '1.0.0',
  copyright: '© 2025 Tachera Sasi',
  credits: 'Unofficial wrapper around Google Chat\nMade with ❤️ by Tachera Sasi.',
  website: URL
});

// Persist window state
function getWindowState() {
  return store.get('windowState') || { width: 992, height: 600 };
}

function saveWindowState() {
  if (mainWindow) {
    store.set('windowState', mainWindow.getBounds());
  }
}

async function createWindow() {
  const { width, height, x, y } = getWindowState();

  mainWindow = new BrowserWindow({
    width,
    height,
    x,
    y,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      sandbox: false
    },
    icon: path.join(__dirname, 'build/icon.png'),
    frame: true,
    autoHideMenuBar: true,
    show: false
  });

  mainWindow.once('ready-to-show', () => mainWindow.show());

  mainWindow.on('close', (e) => {
    e.preventDefault();
    mainWindow.hide();
  });

  mainWindow.on('move', saveWindowState);
  mainWindow.on('resize', saveWindowState);

  // Set custom user agent
  mainWindow.webContents.setUserAgent("Mozilla/5.0 (Google Chat Desktop)");

  // Prevent external links from opening in the same window
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

  // Track unread messages
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
    { label: 'Mute Notifications', type: 'checkbox', click: toggleMute },
    { label: 'Toggle Dark Mode', click: toggleDarkMode },
    { label: 'Open GitHub', click: () => shell.openExternal(GITHUB_URL) },
    { label: 'Quit', click: () => app.quit() }
  ]);

  tray.setToolTip('Google Chat Desktop');
  tray.setContextMenu(contextMenu);
}

function toggleDarkMode() {
  const newTheme = nativeTheme.shouldUseDarkColors ? 'light' : 'dark';
  nativeTheme.themeSource = newTheme;
  store.set('theme', newTheme);
}

function toggleMute(menuItem) {
  store.set('notificationsMuted', menuItem.checked);
}

function scheduleMorningNotification() {
  if (Notification.isSupported() && !store.get('notificationsMuted')) {
    new Notification({
      title: 'Google Chat App',
      body: 'Welcome to Google Chat! Click to open.\nTachera Sasi',
      icon: path.join(__dirname, 'build/icon.png'),
    }).show();
  }
}

// App Menu with View Options
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

app.whenReady().then(() => {
  if (store.get('theme')) {
    nativeTheme.themeSource = store.get('theme');
  }

  createWindow();
  createTray();
  scheduleMorningNotification();

  // Register global shortcut to toggle window
  globalShortcut.register('CommandOrControl+Shift+C', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
    }
  });

  // Launch at startup
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
