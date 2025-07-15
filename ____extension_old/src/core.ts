export type Message =
  | { type: 'TRACK_WINDOW'; windowId: number }
  | { type: 'UNTRACK_WINDOW'; windowId: number }
  | { type: 'GET_TRACKED_WINDOWS' }
  | { type: 'CONFIG_UPDATED' }
  | { type: 'SETTINGS_UPDATED' };

export type MessageResponse =
  | { windowIds: number[]; titles?: string[] }
  | { success: boolean }
  | { error: string };

export function asMessage(value: unknown): Message | null {
  if (typeof value !== 'object' || value === null || !('type' in value)) {
    return null;
  }

  const msg = value as Record<string, unknown>;

  switch (msg.type) {
    case 'TRACK_WINDOW':
    case 'UNTRACK_WINDOW':
      if (typeof msg.windowId === 'number') {
        return msg as Message;
      }
      return null;
    case 'GET_TRACKED_WINDOWS':
    case 'CONFIG_UPDATED':
    case 'SETTINGS_UPDATED':
      return msg as Message;
    default:
      return null;
  }
}

export function isMessage(value: unknown): value is Message {
  return asMessage(value) !== null;
}
