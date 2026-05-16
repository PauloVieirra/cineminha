import { useEffect, useState } from "react";
import { checkYoutubeAgent, setYoutubeAgentStatus } from "../lib/youtube-agent";

export function useYoutubeAgent() {
  const [online, setOnline] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  const refresh = async () => {
    setChecking(true);
    const ok = await checkYoutubeAgent();
    setYoutubeAgentStatus(ok);
    setOnline(ok);
    setChecking(false);
    return ok;
  };

  useEffect(() => {
    refresh();
  }, []);

  return { online, checking, refresh };
}
