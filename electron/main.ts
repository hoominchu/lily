import { app, BrowserWindow, Tray, Menu, Event, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as chokidar from 'chokidar';
import * as os from 'os';
import OpenAI from 'openai';;
import { nativeImage } from 'electron';
import Store from 'electron-store';
// import { createCanvas, loadImage } from 'canvas';
// import { screen } from 'electron';

// Initialize store with schema for type safety
const store = new Store({
  schema: {
    apiKey: {
      type: 'string',
      default: ''
    },
    screenshotCount: {
      type: 'number',
      default: 0
    },
    hasRunBefore: {
      type: 'boolean',
      default: false
    }
  }
});

let tray: Tray | null = null;
let isInitialScan = true;  // Flag to track initial file scan
let openai: OpenAI;
let settingsWindow: BrowserWindow | null = null;
let screenshotCount = store.get('screenshotCount', 0);

const initializeServices = async () => {
  try {
    console.log('Initializing services...');

    const apiKey = store.get('apiKey', '') as string;
    if (!apiKey) {
      console.error('No API key found in store');
      return;
    }

    openai = new OpenAI({
      apiKey: apiKey
    });

    console.log('Services initialized successfully');
  } catch (error) {
    console.error('Error initializing services:', error);
    app.quit();
  }
};

const getImageDescription = async (imagePath: string) => {
  try {
    // Read and encode image
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = Buffer.from(imageBuffer).toString('base64');

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `This is a screenshot. Please provide a short, descriptive filename (max 3-4 words) that captures 
                     the main content or purpose of this screenshot. Use underscores between words. 
                     Respond only with the filename, no explanation. Be as specific as possible e.g. if it is a picture of a popular mountain, then include the name of the mountain.`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/png;base64,${base64Image}`,
                detail: "low"
              }
            }
          ]
        }
      ],
      max_tokens: 50
    });

    const suggestedName = response.choices[0].message.content?.trim();
    return suggestedName || 'unnamed_screenshot';
  } catch (error) {
    console.error('Error getting image description:', error);
    return 'unnamed_screenshot';
  }
};

// Replace the rotateTrayIcon function
// const rotateTrayIcon = async (trayInstance: Tray) => {
//   try {
//     // Get the display scale factor (typically 1 for standard, 2 for Retina)
//     const scaleFactor = screen.getPrimaryDisplay().scaleFactor;
//     const size = 20 * scaleFactor; // Base size multiplied by scale factor

//     const canvas = createCanvas(size, size);
//     const ctx = canvas.getContext('2d');
//     if (!ctx) return;

//     // Enable image smoothing for better quality
//     ctx.imageSmoothingEnabled = true;

//     const iconPath = path.join(__dirname, '../renderer/icon@2x.png');
//     const frames = 36;
//     const duration = 1000;
//     const frameDelay = duration / frames;

//     const img = await loadImage(iconPath);

//     for (let i = 0; i <= frames; i++) {
//       const rotation = (i / frames) * 360;
//       ctx.clearRect(0, 0, size, size);
//       ctx.save();
//       ctx.translate(size/2, size/2);
//       ctx.rotate((rotation * Math.PI) / 180);
//       ctx.drawImage(img, -size/2, -size/2, size, size);
//       ctx.restore();

//       const rotatedIcon = nativeImage.createFromDataURL(canvas.toDataURL());
//       // Resize back to the original size while maintaining the higher quality
//       trayInstance.setImage(rotatedIcon.resize({ width: 20, height: 20 }));
//       await new Promise(resolve => setTimeout(resolve, frameDelay));
//     }

//     // Reset to original icon with proper scaling
//     trayInstance.setImage(nativeImage.createFromPath(iconPath).resize({ width: 20, height: 20 }));
//   } catch (error) {
//     console.error('Error rotating tray icon:', error);
//   }
// };

// Update the processScreenshot function
const processScreenshot = async (filepath: string) => {
  if (isInitialScan) return;

  try {
    console.log('Processing file:', filepath);

    // Check if it's a macOS screenshot
    const isScreenshot = /^Screenshot (\d{4}-\d{2}-\d{2}) at \d{1,2}\.\d{1,2}\.\d{1,2}.*\.(png|jpg|jpeg)$/i.test(path.basename(filepath));

    if (!isScreenshot || !fs.existsSync(filepath)) {
      console.log('Not a screenshot:', filepath);
      return;
    }

    // Wait for file to be fully written
    // await new Promise(resolve => setTimeout(resolve, 500));

    // Get AI-generated filename
    console.log('Generating filename...');
    const suggestedName = await getImageDescription(filepath);

    const dir = path.dirname(filepath);
    const ext = path.extname(filepath);
    
    // Format current date and time
    const now = new Date();
    const dateTime = `${now.toLocaleString('en-US', { month: 'long' })}_${now.getDate()}_${now.getFullYear()}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;

    const newPath = path.join(dir, `${suggestedName}_${dateTime}${ext}`);

    fs.renameSync(filepath, newPath);

    // Increment and store screenshot count
    screenshotCount = (screenshotCount as number) + 1;
    store.set('screenshotCount', screenshotCount);

    console.log('Renamed:', path.basename(filepath), '→', path.basename(newPath));

    // if (tray) {
    //   // Animate the tray icon
    //   await rotateTrayIcon(tray);
    //   tray.setToolTip('Screenshot Renamer');
    // }
  } catch (error) {
    console.error('Error processing screenshot:', error);
  }
};

const createSettingsWindow = async () => {
  if (settingsWindow) {
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow({
    width: 480,
    height: 480,
    resizable: false,
    fullscreenable: false,
    frame: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      devTools: !app.isPackaged
    }
  });

  // For development, load from localhost, for production load from file
  await settingsWindow.loadFile(path.join(__dirname, '../renderer/settings.html'));

  // Only add context menu in development
  if (!app.isPackaged) {
    settingsWindow.webContents.on('context-menu', (_, params) => {
      Menu.buildFromTemplate([
        { label: 'Inspect Element', click: () => settingsWindow?.webContents.inspectElement(params.x, params.y) },
        { type: 'separator' },
        { label: 'Toggle Developer Tools', click: () => settingsWindow?.webContents.toggleDevTools() }
      ]).popup();
    });
  }

  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
};

// Modify the createTray function
const createTray = () => {
  const iconPath = path.join(__dirname, '../renderer/icon@2x.png');
  const trayIcon = nativeImage.createFromPath(iconPath).resize({ width: 20, height: 20 });

  tray = new Tray(trayIcon);
  tray.setToolTip('Screenshot Renamer');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Settings',
      click: () => {
        createSettingsWindow().catch(error => {
          console.error('Failed to create settings window:', error);
        });
      }
    },
    // { type: 'separator' },
    {
      label: 'Reset',
      click: async () => {
        const { response } = await dialog.showMessageBox({
          type: 'warning',
          buttons: ['Cancel', 'Reset'],
          defaultId: 0,
          title: 'Reset',
          message: 'Are you sure you want to reset the app?',
          detail: 'This will clear your API key and reset the screenshot counter.',
          icon: path.join(__dirname, '../renderer/assets/icon.png')
        });

        if (response === 1) { // User clicked Reset
          try {
            store.clear();
            screenshotCount = 0;
            // Reinitialize services
            await initializeServices();
            dialog.showMessageBox({
              type: 'info',
              message: 'App has been reset successfully',
              icon: path.join(__dirname, '../renderer/assets/icon.png')
            });
          } catch (error) {
            console.error('Error resetting app:', error);
            dialog.showMessageBox({
              type: 'error',
              message: 'Failed to reset app',
            });
          }
        }
      }
    },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() }
  ]);

  tray.setContextMenu(contextMenu);
  console.log('Tray created successfully');
  return tray;
};

// Watch Screenshots directory
const watchScreenshots = () => {
  try {
    const homeDir = os.homedir();
    const screenshotsPath = path.join(homeDir, 'Desktop', '*.png'); // Only watch PNG files

    const watcher = chokidar.watch(screenshotsPath, {
      ignored: (path: string) => /(^|[\/\\])\../.test(path),
      depth: 0,
      persistent: true,
      awaitWriteFinish: {
        stabilityThreshold: 1000,
        pollInterval: 50
      },
      alwaysStat: true,
      usePolling: false
    });

    watcher.on('ready', () => {
      isInitialScan = false;
      console.log('Watching for new PNG files on Desktop');
    });

    watcher.on('add', processScreenshot);
  } catch (error) {
    console.error('Error setting up file watcher:', error);
  }
};

// Update IPC handlers
ipcMain.handle('get-api-key', () => {
  return store.get('apiKey', '');
});

ipcMain.handle('save-api-key', async (_, key: string) => {
  try {
    store.set('apiKey', key);

    // Reinitialize services with new key
    await initializeServices();

    return true;
  } catch (error) {
    console.error('Error saving API key:', error);
    return false;
  }
});

ipcMain.on('close-settings', () => {
  if (settingsWindow) {
    settingsWindow.close();
  }
});

const showTemporaryTrayMessage = (tray: Tray) => {
  console.log('Showing tray message, platform:', process.platform);

  if (process.platform === 'win32') {
    tray.displayBalloon({
      title: 'Screenshot Renamer',
      content: 'App is running in the background',
      iconType: 'info'
    });
  } else {
    // Store original tooltip text in a variable
    const originalTooltip = 'Screenshot Renamer';
    console.log('Setting temporary tooltip');
    tray.setToolTip('Screenshot Renamer - App is running in the background');

    setTimeout(() => {
      console.log('Resetting tooltip');
      tray.setToolTip(originalTooltip);
    }, 3000);
  }
};

// Update the get-screenshot-count handler
ipcMain.handle('get-screenshot-count', async () => {
  return store.get('screenshotCount', 0);
});

// Add this near your other IPC handlers
ipcMain.handle('clear-app-data', async () => {
  try {
    // Clear the stored API key
    await store.delete('apiKey');
    // Reset the screenshot counter
    await store.delete('screenshotCount');
    // Clear any other stored data you might have

    return true;
  } catch (error) {
    console.error('Error clearing app data:', error);
    return false;
  }
});

app.whenReady().then(async () => {
  // Hide dock icon on macOS
  if (process.platform === 'darwin') {
    app.dock.hide();
  }

  const trayInstance = createTray();
  if (!trayInstance) {
    console.error('Tray instance is null');
    return;
  }

  // Check if this is the first run
  const isFirstRun = !store.get('hasRunBefore');
  if (isFirstRun) {
    await createSettingsWindow();
    store.set('hasRunBefore', true);
  }

  // Update tray tooltip without count
  trayInstance.setToolTip('Screenshot Renamer');

  console.log('Tray created, showing message');
  showTemporaryTrayMessage(trayInstance);

  // Initialize services in the background
  initializeServices().then(() => {
    console.log('Starting screenshot watcher');
    watchScreenshots();
  }).catch(error => {
    console.error('Failed to initialize services:', error);
    if (tray) {
      const errorMenu = Menu.buildFromTemplate([
        { label: 'Error: Failed to initialize services', enabled: false },
        { type: 'separator' },
        { label: 'Quit', click: () => app.quit() }
      ]);
      tray.setContextMenu(errorMenu);
    }
  });
});

app.on('window-all-closed', (e: Event) => {
  e.preventDefault();
});