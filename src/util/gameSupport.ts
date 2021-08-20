import { selectors, types, util } from 'vortex-api';
import * as path from 'path';
import { IniFileList } from '../types/types';

const gameSupport: {[id: string]: IniFileList} = {
    "skyrim" : {
        filePaths: [
            path.join(util.getVortexPath('documents'), 'My Games', 'Skyrim', 'Skyrim.ini'),
            path.join(util.getVortexPath('documents'), 'My Games', 'Skyrim', 'SkyrimPrefs.ini'),
            path.join(util.getVortexPath('documents'), 'My Games', 'Skyrim', 'SkyrimCustom.ini')
        ]
    },
    "skyrimse" : {
        filePaths: [
            path.join(util.getVortexPath('documents'), 'My Games', 'Skyrim Special Edition', 'Skyrim.ini'),
            path.join(util.getVortexPath('documents'), 'My Games', 'Skyrim Special Edition', 'SkyrimPrefs.ini'),
            path.join(util.getVortexPath('documents'), 'My Games', 'Skyrim Special Edition', 'SkyrimCustom.ini')
        ]
    },
    "skyrimVR" : {
        filePaths: [
            path.join(util.getVortexPath('documents'), 'My Games', 'Skyrim VR', 'Skyrim.ini'),
            path.join(util.getVortexPath('documents'), 'My Games', 'Skyrim VR', 'SkyrimVR.ini'),
            path.join(util.getVortexPath('documents'), 'My Games', 'Skyrim VR', 'SkyrimPrefs.ini'),
            path.join(util.getVortexPath('documents'), 'My Games', 'Skyrim VR', 'SkyrimCustom.ini')
        ]
    },
    "fallout4" : {
        filePaths: [
            path.join(util.getVortexPath('documents'), 'My Games', 'Fallout4', 'Fallout4.ini'),
            path.join(util.getVortexPath('documents'), 'My Games', 'Fallout4', 'Fallout4Prefs.ini'),
            path.join(util.getVortexPath('documents'), 'My Games', 'Fallout4', 'Fallout4Custom.ini')
        ]
    },
    "fallout4vr" : {
        filePaths: [
            path.join(util.getVortexPath('documents'), 'My Games', 'Fallout4VR', 'Fallout4.ini'),
            path.join(util.getVortexPath('documents'), 'My Games', 'Fallout4VR', 'Fallout4Prefs.ini'),
            path.join(util.getVortexPath('documents'), 'My Games', 'Fallout4VR', 'Fallout4Custom.ini')
        ]
    },
    "falloutnv" : {
        filePaths: [
            path.join(util.getVortexPath('documents'), 'My Games', 'FalloutNV', 'Fallout.ini'),
            path.join(util.getVortexPath('documents'), 'My Games', 'FalloutNV', 'FalloutPrefs.ini'),
            path.join(util.getVortexPath('documents'), 'My Games', 'FalloutNV', 'FalloutCustom.ini'),
        ]
    },
    "fallout3" : {
        filePaths: [
            path.join(util.getVortexPath('documents'), 'My Games', 'Fallout3', 'Fallout.ini'),
            path.join(util.getVortexPath('documents'), 'My Games', 'Fallout3', 'FalloutPrefs.ini'),
        ]
    },
    "oblivion" : {
        filePaths: [
            path.join(util.getVortexPath('documents'), 'My Games', 'Oblivion', 'Oblivion.ini'),
        ]
    },
    "enderal" : {
        filePaths: [
            path.join(util.getVortexPath('documents'), 'My Games', 'Enderal', 'Enderal.ini'),
            path.join(util.getVortexPath('documents'), 'My Games', 'Enderal', 'EnderalPrefs.ini'),
        ]
    },
    "enderalspecialedition" : {
        filePaths: [
            path.join(util.getVortexPath('documents'), 'My Games', 'Enderal', 'Enderal.ini'),
            path.join(util.getVortexPath('documents'), 'My Games', 'Enderal', 'EnderalPrefs.ini'),
        ]
    },
    "morrowind" : {
        filePaths: [
            path.join('{gamepath}', 'Morrowind.ini')
        ]
    }
}

const xboxGamePassSupport: {[id: string]: IniFileList} = {
    "skyrimse" : {
        filePaths: [
            path.join(util.getVortexPath('documents'), 'My Games', 'Skyrim Special Edition MS', 'Skyrim.ini'),
            path.join(util.getVortexPath('documents'), 'My Games', 'Skyrim Special Edition MS', 'SkyrimPrefs.ini'),
            path.join(util.getVortexPath('documents'), 'My Games', 'Skyrim Special Edition MS', 'SkyrimCustom.ini')
        ]
    },
    "fallout4" : {
        filePaths: [
            path.join(util.getVortexPath('documents'), 'My Games', 'Fallout4 MS', 'Fallout4.ini'),
            path.join(util.getVortexPath('documents'), 'My Games', 'Fallout4 MS', 'Fallout4Prefs.ini'),
            path.join(util.getVortexPath('documents'), 'My Games', 'Fallout4 MS', 'Fallout4Custom.ini')
        ]
    },
}

function getGameInis(gameId: string, state: types.IState): IniFileList {
    if (!gameId) return undefined;

    const discovery: types.IDiscoveryResult = util.getSafe(state, ['settings', 'gameMode', 'discovered', gameId], undefined);
    const game = util.getGame(gameId);
    const ini: (context: types.IState) => IniFileList = util.getSafe(game, ['iniFiles'], undefined);
    let iniFiles: IniFileList = ini ? ini(state) : gameSupport[gameId];

    if (discovery?.path && isXboxPath(discovery.path)) iniFiles = xboxGamePassSupport[gameId] || iniFiles;

    // If the gamepath is being referenced, replace it with the proper location. 
    if (!!iniFiles) iniFiles.filePaths = iniFiles.filePaths.map(path => path.replace('{gamepath}', discovery.path));

    return iniFiles;

} 

function gameHasIniFiles(api: types.IExtensionApi): boolean {
    const state = api.store.getState();
    const gameId = selectors.activeGameId(state);

    if (!gameId) return false;

    // Defined by the extension
    if (gameSupport[gameId]) return true;

    // Get game details
    const game: types.IGame = util.getGame(gameId);
    const ini: IniFileList = util.getSafe(game, ['iniFiles'], undefined);

    return (!!ini);

}


function isXboxPath(discoveryPath: string) {
    const hasPathElement = (element) =>
      discoveryPath.toLowerCase().includes(element);
    return ['modifiablewindowsapps', '3275kfvn8vcwc'].find(hasPathElement) !== undefined;
}

export { gameHasIniFiles, getGameInis }; 