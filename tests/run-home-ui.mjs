import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const electron=createRequire(import.meta.url)('electron');
const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;
const child=spawn(electron,[fileURLToPath(new URL('./home-ui-scenario.cjs',import.meta.url))],{env,windowsHide:true,stdio:'inherit'});
const timeout=setTimeout(()=>{child.kill();process.exitCode=1;},90000);timeout.unref();
child.once('error',e=>{clearTimeout(timeout);console.error(e);process.exitCode=1;});
child.once('exit',code=>{clearTimeout(timeout);process.exitCode=code||0;});
