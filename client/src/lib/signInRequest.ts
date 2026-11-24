export const SIGN_IN_EVENT = "cfop:open-sign-in";

export function requestSignIn() {
  window.dispatchEvent(new Event(SIGN_IN_EVENT));
}
