/**
 * The film room's controls for the YouTube player, kept apart from React so
 * the "player isn't ready yet" rules can be unit tested.
 *
 * `new YT.Player()` returns straight away, but the object only gets its
 * methods (`getCurrentTime`, `seekTo`, ...) when YouTube fires `onReady`, a
 * second or two later. Calling one before then throws, which used to make
 * every film hotkey fail during that window (B-02).
 */

export type YouTubePlayerHandle = {
  getCurrentTime: () => number;
  seekTo: (seconds: number) => void;
  seekBy: (deltaSeconds: number) => void;
  togglePlay: () => void;
};

/** The parts of YouTube's IFrame player the film room uses. */
export type YTPlayer = {
  getCurrentTime: () => number;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  playVideo: () => void;
  pauseVideo: () => void;
  getPlayerState: () => number;
  destroy: () => void;
};

// YT.PlayerState values from the IFrame API.
const YT_PLAYING = 1;
const YT_BUFFERING = 3;

export function createPlayerHandle({
  getPlayer,
  isReady,
  queueSeek
}: {
  getPlayer: () => YTPlayer | null;
  /** True once YouTube has fired onReady for the current player. */
  isReady: () => boolean;
  /** Remembers a seek asked for before the player is ready, to run at onReady. */
  queueSeek: (seconds: number) => void;
}): YouTubePlayerHandle {
  return {
    getCurrentTime: () => (isReady() ? getPlayer()?.getCurrentTime() ?? 0 : 0),
    seekTo: (seconds: number) => {
      if (isReady()) getPlayer()?.seekTo(seconds, true);
      else queueSeek(seconds);
    },
    seekBy: (deltaSeconds: number) => {
      const player = getPlayer();
      if (!player || !isReady()) return;
      player.seekTo(Math.max(0, player.getCurrentTime() + deltaSeconds), true);
    },
    togglePlay: () => {
      const player = getPlayer();
      if (!player || !isReady()) return;
      const state = player.getPlayerState();
      if (state === YT_PLAYING || state === YT_BUFFERING) player.pauseVideo();
      else player.playVideo();
    }
  };
}
