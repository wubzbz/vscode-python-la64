import { spawnSync } from 'child_process';
import * as fs from '../client/common/platform/fs-paths';
// import * as os from 'os';
import * as path from 'path';
import { downloadAndUnzipVSCode, resolveCliArgsFromVSCodeExecutablePath, runTests } from '@vscode/test-electron';
import { JUPYTER_EXTENSION_ID, PYLANCE_EXTENSION_ID } from '../client/common/constants';
import { EXTENSION_ROOT_DIR_FOR_TESTS } from './constants';
import { getChannel } from './utils/vscode';
import { TestOptions } from '@vscode/test-electron/out/runTest';

// If running smoke tests, we don't have access to this.
if (process.env.TEST_FILES_SUFFIX !== 'smoke.test') {
    const logger = require('./testLogger');
    logger.initializeLogger();
}
function requiresJupyterExtensionToBeInstalled() {
    return process.env.INSTALL_JUPYTER_EXTENSION === 'true';
}
function requiresPylanceExtensionToBeInstalled() {
    return process.env.INSTALL_PYLANCE_EXTENSION === 'true';
}

process.env.IS_CI_SERVER_TEST_DEBUGGER = '';
process.env.VSC_PYTHON_CI_TEST = '1';
const workspacePath = process.env.CODE_TESTS_WORKSPACE
    ? process.env.CODE_TESTS_WORKSPACE
    : path.join(__dirname, '..', '..', 'src', 'test');
const extensionDevelopmentPath = process.env.CODE_EXTENSIONS_PATH
    ? process.env.CODE_EXTENSIONS_PATH
    : EXTENSION_ROOT_DIR_FOR_TESTS;

/**
 * Try to find a local Codium installation, fallback to downloaded VSCode.
 * Returns the executable path and a flag indicating if it was downloaded.
 */
async function getVSCodeExecutablePath(): Promise<{ executablePath: string; isDownloaded: boolean }> {
    const fixedPath = '/usr/bin/codium';
    if (fs.existsSync(fixedPath)) {
        console.log(`Using fixed Codium path: ${fixedPath}`);
        return { executablePath: fixedPath, isDownloaded: false };
    }

    try {
        const whichResult = spawnSync('which', ['codium'], { encoding: 'utf8' });
        if (whichResult.status === 0 && whichResult.stdout.trim()) {
            const whichPath = whichResult.stdout.trim();
            console.log(`Found Codium using which: ${whichPath}`);
            return { executablePath: whichPath, isDownloaded: false };
        }
    } catch (error) {
        console.log('which command failed, trying fallback methods...');
    }

    console.log('Codium not found locally, downloading VSCode as fallback...');
    try {
        const downloadedPath = await downloadAndUnzipVSCode('stable');
        console.log(`Downloaded VSCode to: ${downloadedPath}`);
        return { executablePath: downloadedPath, isDownloaded: true };
    } catch (downloadError) {
        console.error('Failed to download VSCode:', downloadError);
        throw new Error('Could not find local Codium and failed to download VSCode as fallback');
    }
}

/**
 * Get the CLI command arguments for the given executable path.
 * For downloaded VSCode we use the official resolver; for local Codium we just use the executable path.
 */
function getCliPath(executablePath: string, isDownloaded: boolean): [string, ...string[]] {
    if (isDownloaded) {
        try {
            const [cliPath, ...args] = resolveCliArgsFromVSCodeExecutablePath(executablePath);
            return [cliPath, ...args];
        } catch (error) {
            console.warn('Failed to resolve CLI path for downloaded VSCode, using executable path');
            return [executablePath];
        }
    }
    // For local Codium, just use the executable path directly
    return [executablePath];
}

/**
 * Install an extension using the VSCode/Codium CLI.
 * @param cliPath The main CLI executable path.
 * @param cliArgs Additional arguments (e.g., for VSCode downloaded version).
 * @param extensionId The extension ID to install.
 */
function installExtension(cliPath: string, cliArgs: string[], extensionId: string): void {
    const args = [...cliArgs, '--install-extension', extensionId];
    const result = spawnSync(cliPath, args, {
        encoding: 'utf-8',
        stdio: 'inherit',
        cwd: path.dirname(cliPath),
        shell: process.platform === 'win32',
    });
    if (result.status !== 0) {
        console.error(`Failed to install extension ${extensionId} with exit code ${result.status}`);
    } else {
        console.log(`Successfully installed extension ${extensionId}`);
    }
}

async function installJupyterExtension(executablePath: string, isDownloaded: boolean) {
    if (!requiresJupyterExtensionToBeInstalled()) {
        console.info('Jupyter Extension not required');
        return;
    }
    console.info('Installing Jupyter Extension');
    const [cliPath, ...cliArgs] = getCliPath(executablePath, isDownloaded);
    installExtension(cliPath, cliArgs, JUPYTER_EXTENSION_ID);
}

async function installPylanceExtension(executablePath: string, isDownloaded: boolean) {
    if (!requiresPylanceExtensionToBeInstalled()) {
        console.info('Pylance Extension not required');
        return;
    }
    console.info('Installing Pylance Extension');
    const [cliPath, ...cliArgs] = getCliPath(executablePath, isDownloaded);
    installExtension(cliPath, cliArgs, PYLANCE_EXTENSION_ID);

    // Make sure to enable it by writing to our workspace path settings
    await fs.ensureDir(path.join(workspacePath, '.vscode'));
    const settingsPath = path.join(workspacePath, '.vscode', 'settings.json');
    if (await fs.pathExists(settingsPath)) {
        let settings = JSON.parse(await fs.readFile(settingsPath, 'utf-8'));
        settings = { ...settings, 'python.languageServer': 'Pylance' };
        await fs.writeFile(settingsPath, JSON.stringify(settings));
    } else {
        const settings = `{ "python.languageServer": "Pylance" }`;
        await fs.writeFile(settingsPath, settings);
    }
}

async function start() {
    console.log('*'.repeat(100));
    console.log('Start Standard tests');
    const channel = getChannel();
    console.log(`Using ${channel} build of VS Code.`);

    const { executablePath: vscodeExecutablePath, isDownloaded } = await getVSCodeExecutablePath();

    const baseLaunchArgs =
        requiresJupyterExtensionToBeInstalled() || requiresPylanceExtensionToBeInstalled()
            ? []
            : ['--disable-extensions'];

    await installJupyterExtension(vscodeExecutablePath, isDownloaded);
    await installPylanceExtension(vscodeExecutablePath, isDownloaded);

    console.log('VS Code executable', vscodeExecutablePath);
    const launchArgs = baseLaunchArgs
        .concat([workspacePath])
        .concat(['--enable-proposed-api'])
        .concat(['--timeout', '5000']);
    console.log(`Starting vscode ${channel} with args ${launchArgs.join(' ')}`);
    const options: TestOptions = {
        extensionDevelopmentPath: extensionDevelopmentPath,
        extensionTestsPath: path.join(EXTENSION_ROOT_DIR_FOR_TESTS, 'out', 'test'),
        launchArgs,
        version: channel,
        extensionTestsEnv: { ...process.env, UITEST_DISABLE_INSIDERS: '1' },
        vscodeExecutablePath, // use the resolved executable
    };
    await runTests(options);
}
start().catch((ex) => {
    console.error('End Standard tests (with errors)', ex);
    process.exit(1);
});
