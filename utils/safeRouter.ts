import { router } from 'expo-router';

let locked = false;

function guard(fn: () => void) {
  if (locked) return;
  locked = true;
  fn();
  setTimeout(() => {
    locked = false;
  }, 600);
}

export const safeRouter = {
  push: (...args: Parameters<typeof router.push>) => guard(() => router.push(...args)),
  replace: (...args: Parameters<typeof router.replace>) => guard(() => router.replace(...args)),
  back: () => guard(() => router.back()),
};