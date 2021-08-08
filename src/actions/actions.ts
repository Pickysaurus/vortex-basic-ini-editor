import { createAction } from 'redux-act';

export const addCustomConfigPath = createAction('ADD_CUSTOM_CONFIG_PATH', 
    (gameId: string, path: string) => ({ gameId, path }));

export const deleteCustomConfigPath = createAction('DELETE_CUSTOM_CONFIG_PATH', 
    (gameId: string, path: string) => ({ gameId, path }));