import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { gettextToI18next } from 'i18next-conv';
import minimist from 'minimist';

// __dirname is not defined by default in ES module scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function save(target) {
  return (result) => {
    fs.writeFileSync(target, JSON.stringify(JSON.parse(result), null, 2));
  };
}

function processFile(fileName, language) {
  if (fileName.includes('.DS_Store')) {
    return;
  }
  let newFilePath;
  const newFileName = path.basename(fileName, '.po');

  if (!fs.existsSync(path.join(__dirname, `../../locales/${language}/`))) {
    fs.mkdirSync(path.join(__dirname, `../../locales/${language}/`), {
      recursive: true,
    });
  }
  newFilePath = path.join(
    __dirname,
    `../../locales/${language}/${newFileName}.json`
  );
  console.log(`Saving locales/${language}/${newFileName}.json`);

  gettextToI18next(language, fs.readFileSync(fileName))
    .then(save(newFilePath))
    .catch((e) => console.error(fileName, e));
}

function processDirectory(directory, language) {
  if (fs.existsSync(directory)) {
    (async () => {
      try {
        const files = await fs.promises.readdir(directory);
        for (const file of files) {
          const filePath = path.join(directory, file);
          processFile(filePath, language);
        }
      } catch (e) {
        console.error(`Failed to processDirectory ${directory}:`, e);
      }
    })();
  } else {
    console.error('Directory does not exist.');
  }
}

const options = {
  string: ['language', 'directory'],
  boolean: ['help'],
  alias: {
    h: 'help',
    d: 'directory',
    l: 'language',
  },
};

const args = minimist(process.argv.slice(2), options);

if (args.help) {
  console.log(
    "-h: help\n-l: language (i.e. 'ja')\n-d: directory to convert files in (i.e. './new-pos')"
  );
} else if (args.directory && args.language) {
  processDirectory(args.directory, args.language);
}
