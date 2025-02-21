import { pathToFileURL } from 'url';
import { CreeveyStoryParams, CreeveyTestFunction } from '../../types.js';
import { loadThroughTSX } from '../utils.js';

// NOTE: Copy-pasted from @storybook/csf
function toStartCaseStr(str: string) {
  return str
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\./g, ' ')
    .replace(/([^\n])([A-Z])([a-z])/g, (_, $1, $2, $3) => `${$1} ${$2}${$3}`)
    .replace(/([a-z])([A-Z])/g, (_, $1, $2) => `${$1} ${$2}`)
    .replace(/([a-z])([0-9])/gi, (_, $1, $2) => `${$1} ${$2}`)
    .replace(/([0-9])([a-z])/gi, (_, $1, $2) => `${$1} ${$2}`)
    .replace(/(\s|^)(\w)/g, (_, $1, $2: string) => `${$1}${$2.toUpperCase()}`)
    .replace(/ +/g, ' ')
    .trim();
}

/**
 * Remove punctuation and illegal characters from a story ID.
 *
 * See https://gist.github.com/davidjrice/9d2af51100e41c6c4b4a
 */
const sanitize = (string: string) => {
  return (
    string
      .toLowerCase()
      // eslint-disable-next-line no-useless-escape
      .replace(/[ ’–—―′¿'`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '-')
      .replace(/-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '')
  );
};

const sanitizeSafe = (string: string, part: string) => {
  const sanitized = sanitize(string);
  if (sanitized === '') {
    throw new Error(`Invalid ${part} '${string}', must include alphanumeric characters`);
  }
  return sanitized;
};

/**
 * Generate a storybook ID from a component/kind and story name.
 */
const toId = (kind: string, name?: string) =>
  `${sanitizeSafe(kind, 'kind')}${name ? `--${sanitizeSafe(name, 'name')}` : ''}`;

/**
 * Transform a CSF named export into a readable story name
 */
const storyNameFromExport = (key: string) => toStartCaseStr(key);

export type CreeveyParamsByStoryId = Record<string, CreeveyStoryParams>;

export default async function parse(files: string[]): Promise<CreeveyParamsByStoryId> {
  result = {};

  await loadThroughTSX(async (load) =>
    Promise.all(
      files.map(async (file) => {
        const fileUrl = pathToFileURL(file).toString();
        await load(fileUrl);
      }),
    ),
  );

  return result as CreeveyParamsByStoryId;
}

let result: Partial<CreeveyParamsByStoryId> = {};

let kindTitle = '';
let storyTitle = '';
let storyParams: CreeveyStoryParams | null = null;

const setStoryParameters = (params: CreeveyStoryParams): void => {
  storyParams = params;
};

const getStoryId = (kindTitle: string, storyTitle: string): string => {
  return toId(kindTitle, storyNameFromExport(storyTitle));
};

export const kind = (title: string, kindFn: () => void): void => {
  kindTitle = title;
  kindFn();
  kindTitle = '';
};

export const story = (
  title: string,
  storyFn: (arg: { setStoryParameters: (params: CreeveyStoryParams) => void }) => void,
): void => {
  storyTitle = title;
  storyParams = null;
  storyFn({ setStoryParameters });
  const storyId = getStoryId(kindTitle, storyTitle);
  result[storyId] = Object.assign({}, storyParams, { tests: result[storyId]?.tests });
  storyTitle = '';
  storyParams = null;
};

export const test = (title: string, testFn: CreeveyTestFunction): void => {
  const storyId = getStoryId(kindTitle, storyTitle);
  if (!result[storyId]) {
    result[storyId] = {};
  }
  result[storyId].tests = Object.assign({}, result[storyId].tests, { [title]: testFn });
};
