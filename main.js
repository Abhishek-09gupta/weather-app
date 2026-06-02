/* ----------------------------------------------------
   Skyflow Weather Dashboard - Electron Desktop Main Process
   ---------------------------------------------------- */

const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

let mainWindow;

function createMainWindow() {
    // 1. Instantiate browser window configurations
    mainWindow = new BrowserWindow({
        width: 1240,
        height: 840,
        minWidth: 900,
        minHeight: 650,
        title: "Skyflow Weather Dashboard",
        icon: path.join(__dirname, 'icon.svg'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true
        }
    });

    // 2. Load the local static HTML file
    mainWindow.loadFile(path.join(__dirname, 'index.html'));

    // 3. Remove native menu bar for a clean, custom application frame
    mainWindow.removeMenu();
    Menu.setApplicationMenu(null);

    // 4. Handle close events
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// Electron lifecycle initialization
app.whenReady().then(() => {
    createMainWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createMainWindow();
        }
    });
});

// Terminate application on exit when all windows are closed (standard Windows/Linux)
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
