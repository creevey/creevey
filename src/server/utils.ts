import { get } from 'https';
import cluster from 'cluster';
import fsp from 'fs/promises';
import fs, { Stats } from 'fs';
import { promisify } from 'util';
import { dirname, extname, join, isAbsolute } from 'path';
import { createRequire, isBuiltin } from 'module';
import { fileURLToPath, pathToFileURL } from 'url';
import { build } from 'esbuild';
import findCacheDir from 'find-cache-dir';
import { SkipOptions, SkipOption, isDefined, TestData, noop, PackageJson, Config } from '../types.js';
import { emitShutdownMessage, sendShutdownMessage } from './messages.js';

// NOTE: There is an issue in windows which described in vite, that's why we don't use already promisified method
const promisifiedRealpath = promisify(fs.realpath);

export const isShuttingDown = { current: false };

export const LOCALHOST_REGEXP = /(localhost|127\.0\.0\.1)/i;

export const configExt = ['.js', '.mjs', '.ts', '.cjs', '.mts', '.cts'];

export const skipOptionKeys = ['in', 'kinds', 'stories', 'tests', 'reason'];

function matchBy(pattern: string | string[] | RegExp | undefined, value: string): boolean {
  return (
    (typeof pattern == 'string' && pattern == value) ||
    (Array.isArray(pattern) && pattern.includes(value)) ||
    (pattern instanceof RegExp && pattern.test(value)) ||
    !isDefined(pattern)
  );
}

export function shouldSkip(
  browser: string,
  meta: {
    title: string;
    name: string;
  },
  skipOptions: SkipOptions,
  test?: string,
): string | boolean {
  if (typeof skipOptions != 'object') {
    return skipOptions;
  }
  for (const skipKey in skipOptions) {
    const reason = shouldSkipByOption(browser, meta, skipOptions[skipKey], skipKey, test);
    if (reason) return reason;
  }
  return false;
}

export function shouldSkipByOption(
  browser: string,
  meta: {
    title: string;
    name: string;
  },
  skipOption: SkipOption | SkipOption[],
  reason: string,
  test?: string,
): string | boolean {
  if (Array.isArray(skipOption)) {
    for (const skip of skipOption) {
      const result = shouldSkipByOption(browser, meta, skip, reason, test);
      if (result) return result;
    }
    return false;
  }

  const { in: browsers, kinds, stories, tests } = skipOption;
  const { title, name } = meta;
  const skipByBrowser = matchBy(browsers, browser);
  const skipByKind = matchBy(kinds, title);
  const skipByStory = matchBy(stories, name);
  const skipByTest = !isDefined(test) || matchBy(tests, test);

  return skipByBrowser && skipByKind && skipByStory && skipByTest && reason;
}

export async function shutdownWorkers(): Promise<void> {
  isShuttingDown.current = true;
  await Promise.all(
    Object.values(cluster.workers ?? {})
      .filter(isDefined)
      .filter((worker) => worker.isConnected())
      .map(
        (worker) =>
          new Promise<void>((resolve) => {
            const timeout = setTimeout(() => {
              worker.kill();
            }, 10000);
            worker.on('exit', () => {
              clearTimeout(timeout);
              resolve();
            });
            sendShutdownMessage(worker);
          }),
      ),
  );
  emitShutdownMessage();
}

export function shutdown(): void {
  process.exit();
}

export function getCreeveyCache(): string | undefined {
  return findCacheDir({ name: 'creevey', cwd: dirname(fileURLToPath(import.meta.url)) });
}

export async function runSequence(seq: (() => unknown)[], predicate: () => boolean): Promise<void> {
  for (const fn of seq) {
    if (predicate()) await fn();
  }
}

export function testsToImages(tests: (TestData | undefined)[]): Set<string> {
  return new Set(
    ([] as string[]).concat(
      ...tests
        .filter(isDefined)
        .map(({ browser, testName, storyPath, results }) =>
          Object.keys(results?.slice(-1)[0]?.images ?? {}).map(
            (image) =>
              `${[...storyPath, testName, browser, browser == image ? undefined : image]
                .filter(isDefined)
                .join('/')}.png`,
          ),
        ),
    ),
  );
}

// https://tuhrig.de/how-to-know-you-are-inside-a-docker-container/
export const isInsideDocker =
  fs.existsSync('/proc/1/cgroup') && fs.readFileSync('/proc/1/cgroup', 'utf-8').includes('docker');

export const downloadBinary = (downloadUrl: string, destination: string): Promise<void> =>
  new Promise((resolve, reject) =>
    get(downloadUrl, (response) => {
      if (response.statusCode == 302) {
        const { location } = response.headers;
        if (!location) {
          reject(new Error(`Couldn't download selenoid. Status code: ${response.statusCode ?? 'UNKNOWN'}`));
          return;
        }

        resolve(downloadBinary(location, destination));
        return;
      }
      if (response.statusCode != 200) {
        reject(new Error(`Couldn't download selenoid. Status code: ${response.statusCode ?? 'UNKNOWN'}`));
        return;
      }

      const fileStream = fs.createWriteStream(destination);
      response.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });
      fileStream.on('error', (error) => {
        fs.unlink(destination, noop);
        reject(error);
      });
    }),
  );

export function readDirRecursive(dirPath: string): string[] {
  return ([] as string[]).concat(
    ...fs
      .readdirSync(dirPath, { withFileTypes: true })
      .map((dirent) =>
        dirent.isDirectory() ? readDirRecursive(`${dirPath}/${dirent.name}`) : [`${dirPath}/${dirent.name}`],
      ),
  );
}

// NOTE: Functions copied from vite project to load config file
export function tryStatSync(file: string): Stats | undefined {
  try {
    // The "throwIfNoEntry" is a performance optimization for cases where the file does not exist
    return fs.statSync(file, { throwIfNoEntry: false });
  } catch {
    // Ignore errors
  }
}

export function findNearestPackageData(basedir: string): PackageJson | null {
  while (basedir) {
    const pkgPath = join(basedir, 'package.json');
    if (tryStatSync(pkgPath)?.isFile()) {
      try {
        return JSON.parse(fs.readFileSync(pkgPath, 'utf-8')) as PackageJson;
      } catch {
        /* noop */
      }
    }

    const nextBasedir = dirname(basedir);
    if (nextBasedir === basedir) break;
    basedir = nextBasedir;
  }

  return null;
}

export function isFilePathESM(filePath: string): boolean {
  if (/\.m[jt]s$/.test(filePath)) {
    return true;
  } else if (/\.c[jt]s$/.test(filePath)) {
    return false;
  } else {
    // check package.json for type: "module"
    try {
      const pkg = findNearestPackageData(dirname(filePath));
      return pkg?.type === 'module';
    } catch {
      return false;
    }
  }
}

export async function buildConfigBundle(configPath: string, isESM: boolean) {
  // NOTE: Oversimplified config build call from vite project, which doesn't include whole externalize deps logic
  const dirnameVarName = '__creevey_injected_original_dirname';
  const filenameVarName = '__creevey_injected_original_filename';
  const importMetaUrlVarName = '__creevey_injected_original_import_meta_url';
  const {
    outputFiles: [{ text: code }],
  } = await build({
    entryPoints: [configPath],
    write: false,
    target: [`node${process.versions.node}`],
    platform: 'node',
    bundle: true,
    format: isESM ? 'esm' : 'cjs',
    mainFields: ['main'],
    sourcemap: 'inline',
    metafile: true,
    define: {
      __dirname: dirnameVarName,
      __filename: filenameVarName,
      'import.meta.url': importMetaUrlVarName,
      'import.meta.dirname': dirnameVarName,
      'import.meta.filename': filenameVarName,
    },
    plugins: [
      {
        name: 'externalize-deps',
        setup(build) {
          build.onResolve({ filter: /^[^.].*/ }, ({ path: id, kind }) => {
            if (kind === 'entry-point' || isAbsolute(id) || isBuiltin(id)) return;

            if (!id.startsWith('.')) return { external: true };
          });
        },
      },
      {
        name: 'inject-file-scope-variables',
        setup(build) {
          build.onLoad({ filter: /\.[cm]?[jt]s$/ }, async (args) => {
            const contents = await fsp.readFile(args.path, 'utf-8');
            const injectValues =
              `const ${dirnameVarName} = ${JSON.stringify(dirname(args.path))};` +
              `const ${filenameVarName} = ${JSON.stringify(args.path)};` +
              `const ${importMetaUrlVarName} = ${JSON.stringify(pathToFileURL(args.path).href)};`;

            return {
              loader: args.path.endsWith('ts') ? 'ts' : 'js',
              contents: injectValues + contents,
            };
          });
        },
      },
    ],
  });

  return code;
}

interface NodeModuleWithCompile extends NodeModule {
  _compile(code: string, filename: string): unknown;
}

const _require = createRequire(import.meta.url);
export async function loadConfigFromBundledFile(
  fileName: string,
  bundledCode: string,
  isESM: boolean,
): Promise<Config> {
  // for esm, before we can register loaders without requiring users to run node
  // with --experimental-loader themselves, we have to do a hack here:
  // write it to disk, load it with native Node ESM, then delete the file.
  if (isESM) {
    const fileBase = `${fileName}.timestamp-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const fileNameTmp = `${fileBase}.mjs`;
    const fileUrl = `${pathToFileURL(fileBase).toString()}.mjs`;
    await fsp.writeFile(fileNameTmp, bundledCode);
    try {
      return ((await import(fileUrl)) as { default: Config }).default;
    } finally {
      fs.unlink(fileNameTmp, () => void 0); // Ignore errors
    }
  }
  // for cjs, we can register a custom loader via `_require.extensions`
  else {
    /* eslint-disable */
    const extension = extname(fileName);
    // We don't use fsp.realpath() here because it has the same behaviour as
    // fs.realpath.native. On some Windows systems, it returns uppercase volume
    // letters (e.g. "C:\") while the Node.js loader uses lowercase volume letters.
    // See https://github.com/vitejs/vite/issues/12923
    const realFileName = await promisifiedRealpath(fileName);
    const loaderExt = extension in _require.extensions ? extension : '.js';
    const defaultLoader = _require.extensions[loaderExt]!;
    _require.extensions[loaderExt] = (module: NodeModule, filename: string) => {
      if (filename === realFileName) {
        (module as NodeModuleWithCompile)._compile(bundledCode, filename);
      } else {
        defaultLoader(module, filename);
      }
    };
    // clear cache in case of server restart
    delete _require.cache[_require.resolve(fileName)];
    const raw = _require(fileName);
    _require.extensions[loaderExt] = defaultLoader;
    return raw.__esModule ? raw.default : raw;
    /* eslint-enable */
  }
}
