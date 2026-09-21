const fs = require('fs');
const path = require('path');

const ignoredDirs = ['node_modules', '.next', '.git', 'dist', 'build', 'coverage', '.vscode', '.idea', 'out'];
const validExtensions = [
    '.js', '.jsx', '.ts', '.tsx', '.json', '.mjs', '.cjs',
    '.css', '.scss', '.sass', '.less',
    '.html', '.md', '.mdx', '.txt',
    '.yaml', '.yml', '.svg', '.env'
];

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
    try {
        let originalContent = fs.readFileSync(filePath, 'utf8');
        let content = originalContent;

        const paths = [];
        const pathRegex = /((?:from\s+|import\s*\(?\s*|require\s*\(\s*)['"])([^'"]+)(['"])/g;
        
        content = content.replace(pathRegex, (match, prefix, p, suffix) => {
            paths.push(p);
            return `${prefix}___PROTECTED_PATH_${paths.length - 1}___${suffix}`;
        });

        const wordRegex = /\b(demo|simulated|simulation|simulate)\b/gi;
        content = content.replace(wordRegex, replacer);

        content = content.replace(/___PROTECTED_PATH_(\d+)___/g, (match, index) => {
            return paths[parseInt(index, 10)];
        });

        if (content !== originalContent) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Updated: ${filePath}`);
        }
    } catch (error) {
        console.error(`Error processing file ${filePath}:`, error.message);
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
            const ext = path.extname(item).toLowerCase();
            const isEnvFile = item.startsWith('.env');
            
            if (validExtensions.includes(ext) || isEnvFile) {
                processFile(fullPath);
            }
        }
    }
}

const rootDir = process.argv[2] || './';
console.log(`Scanning directory: ${path.resolve(rootDir)}`);
processDirectory(rootDir);
console.log('Finished.');