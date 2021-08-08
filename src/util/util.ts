import { fs, log } from 'vortex-api';
import * as path from 'path';

let watcher: fs.FSWatcher = undefined;
let watchPath: string;
let updater: (data: string) => void;

function getSelectOptions(iniList: string[]): {value: string, label: string}[] {
    return iniList.map(ini => ({ value: ini, label: path.basename(ini) }));
}


async function getAllIniContent(iniList: string[]): Promise<{[id: string]: string}> {
    // Iterate across the INI files and load the current content of the documents into memory. 
    let result = {};
    for (const ini of iniList) {
        result[ini] = await getConfigFileData(ini);
    }

    return Promise.resolve(result);
}

async function getConfigFileData(filePath: string): Promise<string> {
    try {
        const data = await fs.readFileAsync(filePath, { encoding: 'utf8' });
        return data;
    }
    catch(err) {
        if (err.code !== 'ENOENT') log('warn', 'Error loading config file data', { err, filePath });
        return '';
    }
}

async function ensureFile(path:string): Promise<void> {
    // When we come across a blank INI, we want to ensure it exists. 
    try {
        await fs.ensureFileAsync(path);
    }
    catch(err) {
        log('error', 'Error ensuring INI file exists', { err, path });
        throw err;
    }
}

function watchIniFile(path: string, updateFunc: (data: string) => void) {
    watcher = fs.watch(path); 
    watchPath = path;   
    updater = updateFunc;

    watcher.on("change", async (eventType: string, filename: string) => {
        if (eventType === 'rename') {
            // File has been deleted.
            if (updater) updater('');
            return;
        }
        try {
            const data = await fs.readFileAsync(watchPath, { encoding: 'utf8' });
            if (updater) updater(data);
        }
        catch(err) {
            log('error', 'Error reading changed file', { err, filename });
        }
    });
}

function stopWatchingFile(keepUpdater?:boolean) {
    if (watcher) watcher.close();
    if (!keepUpdater) {
        updater = undefined;
        watchPath = undefined;
    };
}

async function saveIniContent(path: string, data: string): Promise<void> {
    try {
        // Stop the watcher
        stopWatchingFile(true);
        // Write the changes
        await fs.writeFileAsync(path, data, { encoding: 'utf8' });
        // Start the watcher again. 
        watchIniFile(path, updater);
    }
    catch(err) {
        log('error', 'Could not save INI file', {err, path});
    }
}

export { getSelectOptions, getAllIniContent, saveIniContent, watchIniFile, stopWatchingFile, ensureFile, getConfigFileData };