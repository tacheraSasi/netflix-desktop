const { app, BrowserWindow, Tray, Menu, Notification, nativeImage } = require('electron');
const path = require('path');

let tray = null;
let mainWindow;
const URL = 'https://instagram.com/';
const OFFLINE_URL = 'offline.html';

app.setName('Instagram Desktop');
app.setVersion('1.0.0');

app.setAboutPanelOptions({
  applicationName: 'Instagram Desktop',
  applicationVersion: '1.0.0',
  copyright: '© 2025 Tachera Sasi',
  credits: 'This is an unofficial wrapper around Instagram.\nMade with ❤️ using Electron by Tachera Sasi.',
  website: URL
});

// Create the main browser window
async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 992,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      sandbox: false
    },
    icon: path.join(__dirname, 'assets/images/magreth.png'),
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

// Create the tray icon and menu
function createTray() {
  // Load and resize tray icon properly
  const trayIcon = nativeImage.createFromPath(
    path.join(__dirname, 'build/icon.png')
  ).resize({ width: 16, height: 16 });

  tray = new Tray(trayIcon);
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show App', click: () => mainWindow.show() },
    { label: 'Quit', click: () => app.quit() }
  ]);

  tray.setToolTip('Instagram Desktop');
  tray.setContextMenu(contextMenu);
}

// Schedule a placeholder notification (can be removed/edited later)
function scheduleMorningNotification() {
  if (Notification.isSupported()) {
    new Notification({
      title: 'IG App',
      body: 'Instagram Desktop is running in the background.'
    }).show();
  }
}

// Electron lifecycle
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
