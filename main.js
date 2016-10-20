const electron = require('electron')
const open = require("open");
const util  = require('util');
const spawn = require('child_process').spawn;

// Module to control application life.
const app = electron.app;

// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;
const Menu = electron.Menu;
const Tray = electron.Tray;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
let lockMonitor;
let tray;

app.on('ready', function () {

    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: false
        },
        show: false,
        icon: __dirname + '/icon.png'
    });

    mainWindow.loadURL('https://dashboard.tawk.to/');

    mainWindow.on('minimize', function (event) {
        event.preventDefault();
        mainWindow.hide();
    });

    mainWindow.webContents.on('new-window', function(event, url){
        event.preventDefault();
        open(url);
    });


    electron.powerMonitor.on('suspend', () => {
        console.log('The system is going to sleep')
    });

    mainWindow.on('close', function (event) {
        if (!app.isQuiting) {
            event.preventDefault();
            mainWindow.hide();
        }

        return false;
    });

    mainWindow.on('closed', function () {
        mainWindow = null
        lockMonitor.kill();
    });

    tray = new Tray(__dirname + '/icon.png');
    var contextMenu = Menu.buildFromTemplate([
        {
            label: 'Show App',
            click: function () {
                mainWindow.show();
            }
        },
        {
            label: 'Hide App',
            click: function () {
                mainWindow.close();
            }
        },
        {
            label: 'Quit',
            click: function () {
                app.isQuiting = true;
                app.quit();
            }
        }
    ]);
    tray.setToolTip('Tawk.to');
    tray.setContextMenu(contextMenu);

    lockMonitor = spawn('gdbus', ['monitor', '-e', '-d', 'com.canonical.Unity', '-o', '/com/canonical/Unity/Session']);

    lockMonitor.stdout.on('data', function (data) {

        if (~data.indexOf('Unlocked')) {
            console.log('Unlocked');

            mainWindow.webContents.executeJavaScript("$('.status-select').val('online').change();");
        } else if (~data.indexOf('Locked')) {
            console.log('Locked');

            mainWindow.webContents.executeJavaScript("$('.status-select').val('invisible').change();");
        }
    });
});

app.on('window-all-closed', function () {
    app.quit()
});