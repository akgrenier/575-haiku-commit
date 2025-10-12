import * as vscode from 'vscode';

export interface HaikuLogger {
  debug(message: string): void;
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
  isDebugEnabled(): boolean;
}

export function createChannelLogger(
  channel: vscode.LogOutputChannel,
  getDebugEnabled: () => boolean
): HaikuLogger {
  return {
    debug(message: string) {
      if (getDebugEnabled()) channel.debug(message);
    },
    info(message: string) {
      channel.info(message);
    },
    warn(message: string) {
      channel.warn(message);
    },
    error(message: string) {
      channel.error(message);
    },
    isDebugEnabled() {
      return getDebugEnabled();
    },
  };
}
