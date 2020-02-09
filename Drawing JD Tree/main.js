// Modules
const {app, BrowserWindow, dialog, ipcMain} = require('electron');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow, item, lr;

ipcMain.on('open-dialog', e => {
    dialog.showOpenDialog(mainWindow, {
        buttonLabel: 'Select'
    }, file => {
        e.sender.send('set-filepath-success', file[0])
    })
});

ipcMain.on('open-drawing', (e, item1) => {
    item = item1
    mainWindow.loadFile('./drawing.html')
})

ipcMain.on('get-item', e => {
    e.sender.send('send-item', item)
})

// Create a new BrowserWindow when `app` is ready
function createWindow() {

    mainWindow = new BrowserWindow({
        width: 1000, height: 800,
        webPreferences: {nodeIntegration: true}
    });

    // Load index.html into the new BrowserWindow
    mainWindow.loadFile('app.html');

    // Open DevTools - Remove for PRODUCTION!
    // mainWindow.webContents.openDevTools();

    // Listen for window being closed
    mainWindow.on('closed', () => {
        mainWindow = null
    })
}

// Electron `app` is ready
app.on('ready', createWindow);

// Quit when all windows are closed - (Not macOS - Darwin)
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
});

// When app icon is clicked and app is running, (macOS) recreate the BrowserWindow
app.on('activate', () => {
    if (mainWindow === null) createWindow()
});