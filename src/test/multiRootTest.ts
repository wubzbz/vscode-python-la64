import * as path from 'path';
import { runTests } from '@vscode/test-electron';
import { EXTENSION_ROOT_DIR_FOR_TESTS } from './constants';
import { initializeLogger } from './testLogger';
// import { getChannel } from './utils/vscode';
import * as fs from 'fs';
import { spawnSync } from 'child_process';

const workspacePath = path.join(__dirname, '..', '..', 'src', 'testMultiRootWkspc', 'multi.code-workspace');
process.env.IS_CI_SERVER_TEST_DEBUGGER = '';
process.env.VSC_PYTHON_CI_TEST = '1';

initializeLogger();

async function getVSCodeExecutablePath(): Promise<string> {
    const fixedPath = '/usr/bin/codium';
    if (fs.existsSync(fixedPath)) {
        console.log(`Using fixed Codium path: ${fixedPath}`);
        return fixedPath;
    }

    try {
        const whichResult = spawnSync('which', ['codium'], { encoding: 'utf8' });
        if (whichResult.status === 0 && whichResult.stdout.trim()) {
            const whichPath = whichResult.stdout.trim();
            console.log(`Found Codium using which: ${whichPath}`);
            return whichPath;
        }
    } catch (error) {
        console.log('which command failed, trying fallback methods...');
    }

    console.log('Codium not found locally, downloading VSCode as fallback...');
    const { downloadAndUnzipVSCode } = await import('@vscode/test-electron');
    const downloadedPath = await downloadAndUnzipVSCode('stable');
    console.log(`Downloaded VSCode to: ${downloadedPath}`);
    return downloadedPath;
}

async function start() {
    console.log('*'.repeat(100));
    console.log('Start Multiroot tests');
    const vscodeExecutablePath = await getVSCodeExecutablePath();
    await runTests({
        extensionDevelopmentPath: EXTENSION_ROOT_DIR_FOR_TESTS,
        extensionTestsPath: path.join(EXTENSION_ROOT_DIR_FOR_TESTS, 'out', 'test', 'index'),
        launchArgs: [workspacePath],
        vscodeExecutablePath,
        extensionTestsEnv: { ...process.env, UITEST_DISABLE_INSIDERS: '1' },
    });
}

start().catch((ex) => {
    console.error('End Multiroot tests (with errors)', ex);
    process.exit(1);
});
