export type Message =
  | { type: 'TRACK_WINDOW'; windowId: number }
  | { type: 'UNTRACK_WINDOW'; windowId: number }
  | { type: 'GET_TRACKED_WINDOWS' };

export type MessageResponse = { windowIds: number[] } | { success: boolean } | { error: string };
