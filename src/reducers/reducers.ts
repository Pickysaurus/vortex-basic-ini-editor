import * as actions from '../actions/actions';
import { types, util } from 'vortex-api';


const IniEditorReducer: types.IReducerSpec = {
    reducers: {
        [actions.addCustomConfigPath as any]: 
            (state, payload) => {
                let current = util.getSafe(state, [payload.gameId, 'filePaths'], []);
                if (!current.includes(payload.path)) current.push(payload.path);                
                return util.setSafe(state, [ payload.gameId, 'filePaths'], current);
            },
        [actions.deleteCustomConfigPath as any]:
            (state, payload) => {
                let current = util.getSafe(state, [payload.gameId, 'filePaths'], []);
                let index = current.indexOf(payload.path);
                if (index > -1) current.splice(index, 1);              
                return util.setSafe(state, [ payload.gameId, 'filePaths'], current);
            },
    },
    defaults: {}
};

export { IniEditorReducer };