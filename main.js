const { app, BrowserWindow, Tray, Menu, Notification } = require('electron');
const path = require('path');

let tray = null;
let mainWindow;
const URL = 'https://instagram.com/'; 
const OFFLINE_URL = 'offline.html';

app.setName('Instagram desktop');
app.setVersion('1.0.0');

// Function to create the main window
async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 992,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      sandbox: false, // Disabling sandboxing
    },
    icon: path.join(__dirname, 'assets/images/magreth.png'),  
    frame: true , // Using system window frame for native window controls
    menu:null,
  });

  // Dynamically importing `is-online` module
  const isOnline = (await import('is-online')).default;

  // Checking internet connectivity and load appropriate page
  const online = await isOnline();
  if (online) {
    mainWindow.loadURL(URL);  
  } else {
    mainWindow.loadFile(OFFLINE_URL);  
  }
}


// Create tray icon for system tray integration
function createTray() {
  tray = new Tray(path.join(__dirname, 'assets/images/magreth.png'));  
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show App', click: () => { mainWindow.show(); } },
    { label: 'Quit', click: () => { app.quit(); } }
  ]);
  tray.setToolTip('magreth');
  tray.setContextMenu(contextMenu);
}

// App initialization
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

// Quit app when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
