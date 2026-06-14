const FIRST_RUN_KEY = 'stripesync_first_run_complete';

export function hasCompletedFirstRun(): boolean {
  try {
    return localStorage.getItem(FIRST_RUN_KEY) === '1';
  } catch {
    return false;
  }
}

export function markFirstRunComplete(): void {
  try {
    localStorage.setItem(FIRST_RUN_KEY, '1');
  } catch {
    // ignore
  }
}
