declare global {
  interface Window {
    __CREEVEY_SET_READY_FOR_CAPTURE__?: () => void;
  }
}

export function readyForCapture(): void {
  window.__CREEVEY_SET_READY_FOR_CAPTURE__?.();
}
