const regex = '@[a-z0-9][\\w-.]+/[a-z0-9][\\w-.]*';
const scopedRegex = opts =>
  opts && opts.exact ? new RegExp(`^${regex}$`, 'i') : new RegExp(regex, 'gi');
export const isScopedPackageName = input =>
  scopedRegex({ exact: true }).test(input);
