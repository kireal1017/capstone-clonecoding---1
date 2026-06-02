import { validationError } from '../utils/errors.js';

export const FLOW_BY_TYPE = Object.freeze({
  move_in: 'whole',
  periodic: 'whole',
  move_out_pre: 'issue',
  move_out_post: 'issue',
  urgent: 'issue',
  repair_pre: 'issue',
  repair_post: 'issue',
});

export function resolveFlow(inspectionType) {
  const flow = FLOW_BY_TYPE[inspectionType];
  if (!flow) {
    throw validationError('invalid inspectionType', { inspectionType, allowed: Object.keys(FLOW_BY_TYPE) });
  }
  return flow;
}
