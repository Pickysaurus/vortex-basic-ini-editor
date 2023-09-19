import * as React from 'react';
import { Modal, Spinner, ComponentEx, Icon, selectors, types, util, actions } from 'vortex-api';
import { Button } from 'react-bootstrap';
import Select from 'react-select';
import { withTranslation, useTranslation } from 'react-i18next';
import { connect, useDispatch, useSelector } from 'react-redux';
import { getGameInis } from '../util/gameSupport';
import { IniFileList } from '../types/types';
import { addCustomConfigPath, deleteCustomConfigPath } from '../actions/actions';
import { getSelectOptions, getAllIniContent, watchIniFile, 
        stopWatchingFile, ensureFile, saveIniContent, 
        getConfigFileData } from '../util/util';

interface IConnectedProps {
    gameId: string;
    game: types.IGame;
    baseInis: string[];
    customInis?: string[];
}

interface IActionProps {
    setDeploymentRequired: (gameId: string, necessary: boolean) => void;
    addCustomIniPath: (gameId:string, path: string) => void;
    deleteCustomIniPath: (gameId:string, path: string) => void;
}

interface IIniEditorProps {
    visible: boolean;
    onHide: () => void;
}

type IProps = IConnectedProps & IActionProps & IIniEditorProps;

interface IIniEditorState {
    bodyState: BodyState;
    iniData?: {[id: string] : string};
    activeIni?: string;
    editableData?: string;
    saving: boolean;
    error?: string;
}


type BodyState = 'loading' | 'editor' | 'settings';

function nop() {
    //nop
}

function IniEditorF(props: IIniEditorProps) {
    const { visible, onHide } = props;
    // Get more props from the Vortex state
    const { gameId, game, baseInis, customInis }: IConnectedProps = useSelector(mapStateToProps);
    // Set up dispatches to write to Vortex state
    const dispatch = useDispatch();
    const { setDeploymentRequired, addCustomIniPath, deleteCustomIniPath }: IActionProps = dispatchStateToProps(dispatch);
    const { t } = useTranslation('ini-editor');

    // Set up component state
    const [bodyState, setBodyState] = React.useState<BodyState>('loading');
    const [saving, setSaving] = React.useState<boolean>(false);
    const [iniData, setIniData] = React.useState<{[id: string] : string} | undefined>(undefined);
    const [activeIni, setActiveIni] = React.useState<string|undefined>(undefined);
    const [editableData, setEditableData] = React.useState<string|undefined>(undefined);
    const [error, setError] = React.useState<string|undefined>(undefined);

    const preload = async (): Promise<void> => {
        // Load the INIs into memory.
        const { baseInis, customInis } = this.props;
        const allInis = [...baseInis, ...customInis];
        try {
            const iniData = await getAllIniContent(allInis);
            this.nextState.iniData = iniData;
            this.setActiveIni(Object.keys(iniData)[0]);
        }
        catch(err) {
            console.log(err);
        }

        this.nextState.bodyState = 'editor';
        return Promise.resolve();
    }

    // Set loading state or stop watching the file
    React.useEffect(() => {
        //componentWillReceiveProps
        if (props.visible === true) {
            preload();
            setBodyState('loading');
        }
        else stopWatchingFile();
    }, [ props.visible ]);

    const updateEditable = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setEditableData(event.target.value)
    }

    async function saveIniEdits() {
        setSaving(true);
        try {
            await saveIniContent(activeIni, editableData);
            const newIni = { [activeIni]: editableData, ...iniData };
            setIniData(newIni);
            setDeploymentRequired(gameId, true);
        }
        catch(err) {
            setError(`Unable to save INI: ${err.message}`);
        }
        setSaving(false);
    }

    const deleteIniPath = (gameId: string, path : string) => {
        // If we delete the active INI, reset back to the first one in the list. 
        if (activeIni === path) this.setActiveIni([...baseInis, ...customInis][0]);
        deleteCustomIniPath(gameId, path);
    }

    const browsePath = async () => {
        const allInis = [...baseInis, ...customInis].map(file => file.toLowerCase());
        const newFile: string = await this.context.api.selectFile({
            title: 'Select configuration file', 
            filters: [
                {name: t('Config Files'), extensions: ['ini', 'txt', 'json', 'xml']},
                {name: t('INI File'), extensions: ['ini']},
                {name: t('Text File'), extensions: ['txt']},
                {name: t('JSON File'), extensions: ['json']},
                {name: t('XML File'), extensions: ['xml']}
            ], 
            defaultPath: util.getVortexPath('documents')
        });
        // If no file was selected OR the file is already selected. 
        if (!newFile || allInis.includes(newFile.toLowerCase())) return;
        const newIniData = await getConfigFileData(newFile);
        setIniData({ [newFile]: newIniData, ...iniData })
        return addCustomIniPath(this.props.gameId, newFile);
    }

    function renderLoading(): JSX.Element {
        return (
            <div className='ini-editor-loading'>
                <Spinner className='ini-editor-loading-spinner' />
            </div>
        );
    }

    function renderEditor(): JSX.Element {
        const allInis: string[] = [...baseInis, ...customInis];
        const options = getSelectOptions(allInis);
        const data: string = iniData[activeIni];
        const blockSave: boolean = data == editableData;

        return (
            <div className='ini-editor-edit'>
                <div className='ini-editor-edit-controls'>
                <span className='selector'>
                <Select 
                    options={options}
                    value={activeIni}
                    onChange={ (newValue) => setActiveIni((newValue as any ).value) }
                    clearable={false}
                /> 
                </span>
                <span>
                <Button onClick={() => util.opn(activeIni).catch(() => undefined)}>
                    <Icon name='changelog' /> {t('View')}
                </Button>
                <Button onClick={() => setBodyState('settings')}>
                    <Icon name='settings' /> {t('Settings')}
                </Button>
                </span>
                </div>
                <textarea spellCheck={false} className='ini-editor-textarea' value={editableData} onChange={updateEditable.bind(this)}>

                </textarea>
                <Button disabled={blockSave || saving} className='wide-button' onClick={saveIniEdits.bind(this)}>
                    <Icon name='savegame' /> {t('Save')}
                </Button>
            </div>
        );
    }

    function renderSettings(): JSX.Element {
        const baseNames = getSelectOptions(baseInis);
        const customNames = getSelectOptions(customInis);
        const gameName = game.name;

        return (
            <div className='ini-editor-settings'>
                {t('Using the controls below, you can manage the files that appear in the drop-down selector for {{gameName}}. Hover you cursor over the file name to see the full path.', { replace: { gameName } })}
                {baseInis ? 
                <div>
                <h4>{t('Base INIs')}</h4>
                <ul>
                    {baseNames.map(ini => (<li title={ini.value}>{ini.label}</li>))}
                </ul>
                </div> : undefined}
                <div>
                    <h4>{t('Custom INIs')}</h4>
                    <ul>
                        {customInis ? customNames.map(ini => (<li title={ini.value}>{ini.label} <Button onClick={() => deleteIniPath(gameId, ini.value)}><Icon name='toggle-uninstalled' /></Button></li>)) : undefined}
                        <li><Button onClick={browsePath}> <Icon name='add'/> {t('Add')} </Button></li>
                    </ul>
                </div>
                {t('Valid files must have a .TXT, .JSON, .XML or .INI file extension.')}
                <br />
                <Button onClick={() => setBodyState('editor')}>Back</Button>
            </div>
        );
    }

    function renderBody(bodyState: BodyState): JSX.Element {
        switch (bodyState) {
            case 'loading' : return renderLoading();
            case 'editor' : return renderEditor();
            case 'settings' : return renderSettings();
            default: return null;
        }
    }

    return (
        <Modal id='ini-editor' show={visible} onHide={nop}>
            <Modal.Header>
                <h3>{t('{{game}} - INI Editor', { replace: { game: game?.name || '???' } })}</h3>
            </Modal.Header>
            <Modal.Body>
                {visible ? renderBody(bodyState) : null}
            </Modal.Body>
            <Modal.Footer>
                <Button onClick={onHide}>{t('Close')}</Button>
            </Modal.Footer>
        </Modal>
    );



}

class IniEditor extends ComponentEx<IProps, IIniEditorState> {
    constructor(props) {
        super(props);

        this.initState({
            bodyState: 'loading',
            saving: false,
        });
    }

    UNSAFE_componentWillReceiveProps(newProps: IProps) {
        if (!this.props.visible && newProps.visible) {
            this.preload()
            this.nextState.bodyState = 'loading';
        }
        else if (!newProps.visible) stopWatchingFile();
    }

    private async preload(): Promise<void> {
        // Load the INIs into memory.
        const { baseInis, customInis } = this.props;
        const allInis = [...baseInis, ...customInis];
        try {
            const iniData = await getAllIniContent(allInis);
            this.nextState.iniData = iniData;
            this.setActiveIni(Object.keys(iniData)[0]);
        }
        catch(err) {
            console.log(err);
        }

        this.nextState.bodyState = 'editor';
        return Promise.resolve();
    }

    async setActiveIni(filePath: string) {
        stopWatchingFile();
        if (this.state.iniData[filePath] === '') await ensureFile(filePath);
        watchIniFile(filePath, (data: string) => {
            this.nextState.iniData[filePath] = data;
            this.nextState.editableData = data;
        });
        this.nextState.activeIni = filePath;
        this.nextState.editableData = `${this.nextState.iniData[filePath]}`;
        return Promise.resolve();
    }

    updateEditable(event) {
        this.nextState.editableData = event.target.value;
    }

    render() {
        const { t, onHide, visible, game } = this.props;
        const { bodyState } = this.state;
        return (
            <Modal id='ini-editor' show={visible} onHide={nop}>
                <Modal.Header>
                    <h3>{t('{{game}} - INI Editor', { replace: { game: game?.name || '???' } })}</h3>
                </Modal.Header>
                <Modal.Body>
                    {visible ? this.renderBody(bodyState) : null}
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={onHide}>{t('Close')}</Button>
                </Modal.Footer>
            </Modal>
        )
    }

    renderBody(bodyState: BodyState): JSX.Element {
        switch (bodyState) {
            case 'loading' : return this.renderLoading();
            case 'editor' : return this.renderEditor();
            case 'settings' : return this.renderSettings();
            default: return null;
        }
    }

    renderLoading(): JSX.Element {
        return (
            <div className='ini-editor-loading'>
                <Spinner className='ini-editor-loading-spinner' />
            </div>
        );
    }

    renderEditor(): JSX.Element {
        const { baseInis, customInis, t } = this.props;
        const { activeIni, iniData, editableData, saving } = this.state;

        const allInis: string[] = [...baseInis, ...customInis];

        const options = getSelectOptions(allInis);

        const data: string = iniData[activeIni];

        const blockSave: boolean = data == editableData;

        return (
            <div className='ini-editor-edit'>
                <div className='ini-editor-edit-controls'>
                <span className='selector'>
                <Select 
                    options={options}
                    value={activeIni}
                    onChange={ (newValue) => this.setActiveIni((newValue as any ).value) }
                    clearable={false}
                /> 
                </span>
                <span>
                <Button onClick={() => util.opn(activeIni).catch(() => undefined)}>
                    <Icon name='changelog' /> {t('View')}
                </Button>
                <Button onClick={() => this.nextState.bodyState = 'settings'}>
                    <Icon name='settings' /> {t('Settings')}
                </Button>
                </span>
                </div>
                <textarea spellCheck={false} className='ini-editor-textarea' value={editableData} onChange={this.updateEditable.bind(this)}>

                </textarea>
                <Button disabled={blockSave || saving} className='wide-button' onClick={this.saveIniEdits.bind(this)}>
                    <Icon name='savegame' /> {t('Save')}
                </Button>
            </div>
        );
    }

    async saveIniEdits() {
        const { activeIni, editableData } = this.state;
        const { setDeploymentRequired, gameId } = this.props;
        this.nextState.saving = true;
        try {
            await saveIniContent(activeIni, editableData);
            this.nextState.iniData[activeIni] = editableData;
            setDeploymentRequired(gameId, true);
        }
        catch(err) {
            this.nextState.error = `Unable to save INI: ${err.message}`;
        }
        this.nextState.saving = false;
    }

    renderSettings(): JSX.Element {
        const { t, customInis, baseInis, deleteCustomIniPath, gameId, game } = this.props;

        const baseNames = getSelectOptions(baseInis);
        const customNames = getSelectOptions(customInis);

        const gameName = game.name;

        return (
            <div className='ini-editor-settings'>
                {t('Using the controls below, you can manage the files that appear in the drop-down selector for {{gameName}}. Hover you cursor over the file name to see the full path.', { replace: { gameName } })}
                {baseInis ? 
                <div>
                <h4>{t('Base INIs')}</h4>
                <ul>
                    {baseNames.map(ini => (<li title={ini.value}>{ini.label}</li>))}
                </ul>
                </div> : undefined}
                <div>
                    <h4>{t('Custom INIs')}</h4>
                    <ul>
                        {customInis ? customNames.map(ini => (<li title={ini.value}>{ini.label} <Button onClick={() => this.deleteIniPath(gameId, ini.value)}><Icon name='toggle-uninstalled' /></Button></li>)) : undefined}
                        <li><Button onClick={this.browsePath}> <Icon name='add'/> {t('Add')} </Button></li>
                    </ul>
                </div>
                {t('Valid files must have a .TXT, .JSON, .XML or .INI file extension.')}
                <br />
                <Button onClick={() => this.nextState.bodyState = 'editor'}>Back</Button>
            </div>
        );
    }

    deleteIniPath = (gameId, path) => {
        const { deleteCustomIniPath, baseInis, customInis } = this.props;
        const { activeIni } = this.state;
        // If we delete the active INI, reset back to the first one in the list. 
        if (activeIni === path) this.setActiveIni([...baseInis, ...customInis][0]);
        deleteCustomIniPath(gameId, path);
    }

    browsePath = async () => {
        const { t, baseInis, customInis } = this.props;
        const allInis = [...baseInis, ...customInis].map(file => file.toLowerCase());
        const newFile: string = await this.context.api.selectFile({
            title: 'Select configuration file', 
            filters: [
                {name: t('Config Files'), extensions: ['ini', 'txt', 'json', 'xml']},
                {name: t('INI File'), extensions: ['ini']},
                {name: t('Text File'), extensions: ['txt']},
                {name: t('JSON File'), extensions: ['json']},
                {name: t('XML File'), extensions: ['xml']}
            ], 
            defaultPath: util.getVortexPath('documents')
        });
        // If no file was selected OR the file is already selected. 
        if (!newFile || allInis.includes(newFile.toLowerCase())) return;
        this.nextState.iniData[newFile] = await getConfigFileData(newFile);
        return this.props.addCustomIniPath(this.props.gameId, newFile);
    }
}

function mapStateToProps(state: types.IState): IConnectedProps {
    const gameId: string = selectors.activeGameId(state);
    const game: types.IGame = util.getGame(gameId);
    const gameInis: IniFileList = getGameInis(gameId, state);
    const customInis: IniFileList = util.getSafe(state, ['settings', 'ini-editor', gameId], undefined);
    return {
        gameId,
        game,
        baseInis: gameInis?.filePaths || [],
        customInis: customInis?.filePaths || [],
    };
}

function dispatchStateToProps(dispatch: any): IActionProps {
    return {
        setDeploymentRequired: (gameId, necessary) => dispatch(actions.setDeploymentNecessary(gameId, necessary)),
        addCustomIniPath: (gameId:string, path: string) => dispatch(addCustomConfigPath(gameId, path)),
        deleteCustomIniPath: (gameId:string, path: string) => dispatch(deleteCustomConfigPath(gameId, path))
    }
}

export default IniEditorF;

// export default withTranslation([ 'ini-editor' ])(connect(mapStateToProps, dispatchStateToProps)(IniEditor));