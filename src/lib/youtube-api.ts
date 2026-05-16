/**
 * Camada de compatibilidade — toda integração YouTube usa o agente Python (yt-dlp).
 * @see ./youtube-agent.ts
 */
export {
  CHANNEL_IMPORT_VIDEO_LIMIT,
  checkYoutubeAgent,
  fetchChannelFromAgent,
  getAgentBaseUrl,
  getAgentOfflineHelp,
  getYouTubeChannelVideos,
  getYouTubeVideoDetails,
  hasYouTubeApiKey,
  isAgentMisconfiguredInProduction,
  isYoutubeAgentOnline,
  searchYouTubeVideos,
  setYoutubeAgentStatus,
  youtubeWatchUrl,
  type YouTubeChannelInfo,
  type YouTubeChannelPayload,
  type YouTubeSearchItem,
} from "./youtube-agent";
