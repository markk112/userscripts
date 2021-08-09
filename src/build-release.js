const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

const cliArgs = process.argv.slice(2);
const update = chalk.bold.green;
const error = chalk.bold.red;

const incVersion = headers => {
    const ver = headers.match(/(?<=@version     ).*/m)[0];
    const splitVer = ver.split('.');
    splitVer[2] = String(parseInt(splitVer[2]) + 1);
    const newVer = splitVer.join('.');
    let newHeader = headers.split('\n');
    newHeader[2] = `// @version     ${newVer}\r`;
    newHeader = newHeader.join('\n');
    return newHeader;
}

const build = (absPath, projName) => {
    const distPath = path.join(absPath, '../../dist');

    cLog('update', 'Starting build...\n');
    fs.readFile(absPath + '\\' + 'headers.txt', 'utf8', (err, data) => {
        if (err) {
            cLog('error', 'The headers file for the userscript could not be read!');
            return;
        }
        const headers = data;
        const newHeader = incVersion(headers);
        fs.readFile(absPath + '\\' + projName + '.dev.js', 'utf8', (err, data) => {
            if (err) {
                cLog('error', 'The development file for the userscript could not be read!');
                return;
            }
            const distFile = newHeader + data;
            fs.writeFile(distPath + '\\' + projName + '.user.js', distFile, err => {
                if (err) {
                    cLog('error', 'The release file for the userscript could not be written!');
                }
            })
            fs.writeFile(absPath + '\\' + 'headers.txt', newHeader, err => {
                if (err) {
                    cLog('error', 'Could not update the src userscript headers with new version number!');
                }
            });
            cLog('update', `Build completed! Release published to ${distPath + '\\' + projName + '.user.js'}`);
        });
    });
}

const cLog = (type, msg) => {
    const prefix = '[Userscript Release Builder]';
    const fullMsg = prefix + ' ' + msg;
    switch(type){
        case 'update':
            console.log(update(fullMsg));
            break;
        case 'error':
            console.log(error(fullMsg));
    }
}

if (cliArgs.length === 1) {
    const absPath = __dirname + '\\' + cliArgs[0];
    fs.access(absPath, error => {
        if (error) {
            cLog('error', 'The directory you provided does not exist!');
        } else {
            build(absPath, cliArgs[0]);
        }
    });
} else {
    cLog('error', 'You have provided too many arguments!');
}
