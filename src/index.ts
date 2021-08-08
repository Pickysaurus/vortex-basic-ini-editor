import { actions, types } from 'vortex-api';
import * as path from 'path';
import IniEditor from './views/IniEditor';
import { gameHasIniFiles } from './util/gameSupport';
import { IniEditorReducer } from './reducers/reducers';

function main(context: types.IExtensionContext) {

  context.registerReducer(['settings', 'ini-editor'], IniEditorReducer);

  context.registerDialog('ini-editor', IniEditor);

  context.registerAction('mod-icons', 25, 'mods', {}, 'INI Editor', () => {
    context.api.store.dispatch(actions.setDialogVisible('ini-editor'));
  }, () => gameHasIniFiles(context.api));

  context.once(() => {
    context.api.setStylesheet('ini-editor', path.join(__dirname, 'ini-editor.scss'));
  });


  return true;
}

export default main;

/*
Intended features:

- View INIs listed in the extension or on the game details.
- Allow the user to define extra INI paths to check.
- Open INIs with your preferred text editor.
- Track changes to INIs while the file is open. 
- Validate INIs?

*/