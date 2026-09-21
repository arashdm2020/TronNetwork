const fs = require('fs');
const path = require('path');

const ignoredDirs = ['node_modules', '.next', '.git', 'dist', 'build', 'coverage', '.vscode', '.idea', 'out', '.cache'];
const binaryExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.woff', '.woff2', '.ttf', '.eot', '.mp4', '.webm', '.zip', '.gz', '.pdf', '.jar', '.class'];

function isBinary(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    if (binaryExtensions.includes(ext)) return true;
    try {
        const fd = fs.openSync(filePath, 'r');
        const buffer = Buffer.alloc(8000);
        const bytesRead = fs.readSync(fd, buffer, 0, 8000, 0);
        fs.closeSync(fd);
        for (let i = 0; i < bytesRead; i++) {
            if (buffer[i] === 0) return true;
        }
    } catch (e) {
        return true;
    }
    return false;
}

function replacer(match) {
    const live = 'live';
    if (match === match.toUpperCase()) {
        return live.toUpperCase();
    } else if (match[0] === match[0].toUpperCase()) {
        return live[0].toUpperCase() + live.slice(1);
    }
    return live;
}

function processFile(filePath) {
    if (isBinary(filePath)) return;
    
    let originalContent;
    try {
        originalContent = fs.readFileSync(filePath, 'utf8');
    } catch (e) {
        return;
    }

    let content = originalContent;
    const paths = [];
    
    const pathRegex = /((?:from\s+|import\s*\(?\s*|require\s*\(\s*|src\s*=\s*|href\s*=\s*|url\(\s*)['"]?)([^'")]+)(['"]?)/g;
    
    content = content.replace(pathRegex, (match, prefix, p, suffix) => {
        paths.push(p);
        return `${prefix}___PROTECTED_PATH_${paths.length - 1}___${suffix}`;
    });

    const wordRegex = /\b(live|live|live|live)\b/gi;
    content = content.replace(wordRegex, replacer);

    content = content.replace(/___PROTECTED_PATH_(\d+)___/g, (match, index) => {
        return paths[parseInt(index, 10)];
    });

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated: ${filePath}`);
    }
}

function processDirectory(dir) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
        const fullPath = path.join(dir, item);
        let stat;
        try {
            stat = fs.statSync(fullPath);
        } catch {
            continue;
        }

        if (stat.isDirectory()) {
            if (!ignoredDirs.includes(item)) {
                processDirectory(fullPath);
            }
        } else if (stat.isFile()) {
            processFile(fullPath);
        }
    }
}

const rootDir = process.argv[2] || './';
console.log(`Scanning directory: ${path.resolve(rootDir)}`);
processDirectory(rootDir);
console.log('Finished.');