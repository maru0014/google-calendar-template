import type { LatestTask } from '../types';

/** 実行中のUI操作は完了を待ち、待機中の要求は最後の1件だけ実行する。 */
export const create_latest_task_runner = (): ((task: LatestTask) => Promise<void>) => {
  let tail = Promise.resolve();
  let revision = 0;
  let running = false;
  return async (task) => {
    const requested_revision = ++revision;
    const previous = tail;
    const must_wait = running;
    running = true;
    let release!: () => void;
    // taskが失敗しても後続を止めないため、待機列には常にfulfilledになる完了通知を積む。
    tail = new Promise<void>((resolve) => { release = resolve; });
    try {
      // 最初の要求は従来どおり直ちに読込を始め、後続だけ待機する。
      if (must_wait) await previous;
      if (requested_revision === revision) await task(() => requested_revision === revision);
    } finally {
      if (requested_revision === revision) running = false;
      release();
    }
  };
};
