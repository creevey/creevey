import { emitTestMessage } from '../../messages.js';
import { CreeveyUpdate } from '../../../types.js';

export function testsHandler({ tests }: { tests: CreeveyUpdate['tests'] }): void {
  emitTestMessage({ type: 'update', payload: tests });
}
