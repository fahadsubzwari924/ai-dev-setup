const MAX_LEN = 256;
/** Branch/tag names: alphanumerics, separators common in semver and paths */
const SAFE_REF = /^[a-zA-Z0-9._/-]+$/;

/**
 * Validate a git ref before passing to `git clone -b`.
 * @param {unknown} ref
 * @returns {string}
 */
export function assertSafeGitRef(ref) {
  if (ref == null || ref === '') {
    throw new Error('Git ref must be non-empty');
  }
  const s = String(ref).trim();
  if (s.length > MAX_LEN) {
    throw new Error(`Git ref exceeds maximum length (${MAX_LEN})`);
  }
  if (s.includes('..')) {
    throw new Error('Invalid git ref');
  }
  if (s.startsWith('-')) {
    throw new Error('Invalid git ref');
  }
  if (!SAFE_REF.test(s)) {
    throw new Error('Invalid git ref: use only letters, digits, and . _ / -');
  }
  return s;
}
