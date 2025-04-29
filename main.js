const { app, BrowserWindow, Tray, Menu, Notification, nativeImage } = require('electron');
const path = require('path');

let tray = null;
let mainWindow;
const URL = 'https://chat.google.com/';
const OFFLINE_URL = 'offline.html';
const GITHUB_URL = 'https://github.com/tacheraSasi/googleChat-desktop.git'

app.setName('Instagram Desktop');
app.setVersion('1.0.0');

app.setAboutPanelOptions({
  applicationName: 'Google Chat',
  applicationVersion: '1.0.0',
  copyright: '© 2025 Tachera Sasi',
  credits: 'This is an unofficial wrapper around Google chat\nTachera Sasi Does not claim ownership of google chat.\nMade with ❤️ using Electron by Tachera Sasi.',
  website: URL
});

// Creates the main browser window
async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 992,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      sandbox: false
    },
    icon: path.join(__dirname, 'build/icon.png'),
    frame: true,
    autoHideMenuBar: true,
    show: false  // Show later after ready
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  const isOnline = (await import('is-online')).default;
  const online = await isOnline();

  if (online) {
    mainWindow.loadURL(URL);
  } else {
    mainWindow.loadFile(OFFLINE_URL);
  }
}

// Creates the tray icon and menu
function createTray() {
  const trayIcon = nativeImage.createFromPath(
    path.join(__dirname, 'build/icon.png')
  ).resize({ width: 16, height: 16 });

  tray = new Tray(trayIcon);
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show App', click: () => mainWindow.show() },
    {label:'Github',click:()=>{require('electron').shell.openExternal(GITHUB_URL)}},
    { label: 'Quit', click: () => app.quit() }
  ]);

  tray.setToolTip('Google Chat Desktop');
  tray.setContextMenu(contextMenu);
}

// Schedules a placeholder notification (can be removed/edited later)
function scheduleMorningNotification() {
  if (Notification.isSupported()) {
    new Notification({
      title: 'Google Chat App',
      body: 'Welcome to Google Chat! Click to open the app.\n \nTachera Sasi',
      icon: path.join(__dirname, 'build/icon.png'),
    }).show();
  }
}

// Electrons lifecycle
app.whenReady().then(() => {
  createWindow();
  createTray();
  scheduleMorningNotification();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
