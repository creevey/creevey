import { BaseReporter } from '../../types.js';
import { CreeveyReporter } from './creevey.js';
import { JUnitReporter } from './junit.js';
import { TeamcityReporter } from './teamcity.js';

export function getReporter(reporter: BaseReporter | 'creevey' | 'teamcity' | 'junit'): BaseReporter {
  if (reporter === 'creevey') return CreeveyReporter;
  if (reporter === 'teamcity') return TeamcityReporter;
  if (reporter === 'junit') return JUnitReporter;
  return reporter;
}
