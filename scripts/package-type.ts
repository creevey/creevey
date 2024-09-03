(async () => {
  const fsp = await import('fs/promises');
  const path = await import('path');
  const sh = await import('shelljs');
  const { default: packageJson } = await import('../package.json', { with: { type: 'json' } });

  function escapeRegExp(string: string): RegExp {
    return new RegExp(string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
  }

  async function getAllFiles(dir: string): Promise<string[]> {
    const dirents = await fsp.readdir(dir, { withFileTypes: true });
    const files = await Promise.all(dirents.map((dirent) => {
      const res = path.resolve(dir, dirent.name);
      return dirent.isDirectory() ? getAllFiles(res) : res;
    }));
    return Array.prototype.concat(...files);
  }

  async function replaceInFile(filePath: string, searchValue: RegExp, replaceValue: string) {
    const data = await fsp.readFile(filePath, 'utf8');
    const result = data.replace(searchValue, replaceValue);
    await fsp.writeFile(filePath, result, 'utf8');
  }

  async function replaceInDirectory(dir: string, searchValue: RegExp, replaceValue: string) {
    const files = await getAllFiles(dir);
    await Promise.all(files.map(file => replaceInFile(file, searchValue, replaceValue)));
  }

  const directoryPath = './src';
  const cjsValue = "require('url').pathToFileURL(__filename).href";
  const esmValue = 'import.meta.url';

  const type = process.argv[2];

  if (!['module', 'commonjs'].includes(type)) {
    throw new Error(`Invalid type: ${type}`);
  }

  if (type === 'module') {
    await replaceInDirectory(directoryPath, escapeRegExp(cjsValue), esmValue);
  } else {
    await replaceInDirectory(directoryPath, escapeRegExp(esmValue), cjsValue);
  }

  await fsp.writeFile('./package.json', JSON.stringify({ ...packageJson, type }, null, 2));

  const dir = type === 'module' ? 'esm' : 'cjs';

  await fsp.mkdir(`./dist/${dir}`, { recursive: true });
  await fsp.writeFile(`./dist/${dir}/package.json`, JSON.stringify({ type }, null, 2));
})()
