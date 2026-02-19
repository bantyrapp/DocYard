const { app, BrowserWindow } = require('electron');
const path = require('path');
const { createServer } = require('http');
const { parse } = require('url');
const fs = require('fs');

let mainWindow;
let server;

function getDistPath() {
  return path.join(__dirname, '../client/dist');
}

/** MIME types for static files */
const MIME = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
};

/** Serve static files from dist; SPA fallback so client-side routes work. */
function serveDist(port) {
  return new Promise((resolve) => {
    const dist = getDistPath();
    server = createServer((req, res) => {
      let p = (parse(req.url).pathname || '/').replace(/^\//, '') || 'index.html';
      if (!path.extname(p)) p = 'index.html';
      const file = path.join(dist, p);
      fs.readFile(file, (err, data) => {
        if (err) {
          const fallback = path.join(dist, 'index.html');
          fs.readFile(fallback, (err2, html) => {
            if (err2) {
              res.writeHead(404);
              res.end();
              return;
            }
            res.setHeader('Content-Type', 'text/html');
            res.end(html);
          });
          return;
        }
        const ext = path.extname(p);
        res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
        res.end(data);
      });
    });
    server.listen(port, () => resolve(port));
  });
}

function createWindow() {
  const isDev = !app.isPackaged;

  if (isDev) {
    mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: { nodeIntegration: false, contextIsolation: true },
      icon: path.join(__dirname, '../client/public/icon.png'),
    });
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    serveDist(0).then((port) => {
      const { address, port: p } = server.address();
      const url = `http://${address === '::' ? '127.0.0.1' : address}:${p}`;
      mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: { nodeIntegration: false, contextIsolation: true },
        icon: path.join(__dirname, '../client/public/icon.png'),
        show: false,
      });
      mainWindow.once('ready-to-show', () => mainWindow.show());
      mainWindow.loadURL(url);
    });
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (server) server.close();
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (server) server.close();
  app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});
