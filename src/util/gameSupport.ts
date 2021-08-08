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
    "fallout4" : {
        filePaths: [
            path.join(util.getVortexPath('documents'), 'My Games', 'Fallout 4', 'Fallout4.ini'),
            path.join(util.getVortexPath('documents'), 'My Games', 'Fallout 4', 'Fallout4Prefs.ini'),
            path.join(util.getVortexPath('documents'), 'My Games', 'Fallout 4', 'Fallout4Custom.ini')
        ]
    },
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
            path.join(util.getVortexPath('documents'), 'My Games', 'Fallout 4 MS', 'Fallout4.ini'),
            path.join(util.getVortexPath('documents'), 'My Games', 'Fallout 4 MS', 'Fallout4Prefs.ini'),
            path.join(util.getVortexPath('documents'), 'My Games', 'Fallout 4 MS', 'Fallout4Custom.ini')
        ]
    },
}

function getGameInis(gameId: string, state: types.IState): IniFileList {
    if (!gameId) return undefined;

    const discovery: types.IDiscoveryResult = util.getSafe(state, ['settings', 'gameMode', 'discovered', gameId], undefined);
    const game = util.getGame(gameId);
    const ini: (context: types.IState) => IniFileList = util.getSafe(game, ['iniFiles'], undefined);
    let iniFiles: IniFileList = ini ? ini(state) : gameSupport[gameId];

    if (discovery?.path && isXboxPath(discovery.path)) iniFiles = xboxGamePassSupport[gameId];

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