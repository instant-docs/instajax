import fs from 'fs';
import path from 'path';

export function rename(oldName, newName) {
    const cwd = process.cwd();
    const oldPath = path.join(cwd, oldName);
    const newPath = path.join(cwd, newName);

    if (fs.existsSync(oldPath)) {
        fs.rename(oldPath, newPath, (err) => {
            if (err) {
                console.error(`Error renaming file: ${err}`);
            } else {
                console.log('File renamed successfully.');
            }
        });
    } else {
        console.error(`The file "${oldName}" does not exist in the current directory.`);
    }
}