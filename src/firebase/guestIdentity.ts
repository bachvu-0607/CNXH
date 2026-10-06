const GUEST_ID_KEY = 'boardgame_user_id';

/** Keep a stable local player ID so visitors can play without Firebase Auth. */
export function getGuestUserId(): string {
  let id = localStorage.getItem(GUEST_ID_KEY);
  if (!id || !/^[A-Za-z0-9_-]{1,128}$/.test(id)) {
    id = `guest_${crypto.randomUUID()}`;
    localStorage.setItem(GUEST_ID_KEY, id);
  }
  return id;
}
