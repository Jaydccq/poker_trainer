import { useEffect, useRef, useCallback } from "react";

interface UsePollingOptions<T> {
  /** URL to poll */
  url: string;
  /** Polling interval in milliseconds (default: 1500ms) */
  interval?: number;
  /** Whether polling is enabled */
  enabled?: boolean;
  /** Callback when data is received */
  onData?: (data: T) => void;
  /** Callback when an error occurs */
  onError?: (error: Error) => void;
  /** Optional transform function for the response */
  transform?: (response: unknown) => T;
}

interface UsePollingReturn {
  /** Trigger an immediate poll */
  poll: () => Promise<void>;
  /** Stop polling */
  stop: () => void;
  /** Start polling */
  start: () => void;
}

/**
 * A simple polling hook that fetches data at regular intervals
 * Designed to replace WebSocket/Ably for Vercel serverless compatibility
 */
export function usePolling<T>({
  url,
  interval = 1500,
  enabled = true,
  onData,
  onError,
  transform,
}: UsePollingOptions<T>): UsePollingReturn {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const enabledRef = useRef(enabled);
  const isPollingRef = useRef(false);
  const onDataRef = useRef(onData);
  const onErrorRef = useRef(onError);

  // Keep refs updated
  useEffect(() => {
    onDataRef.current = onData;
    onErrorRef.current = onError;
  }, [onData, onError]);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  // Single poll function
  const poll = useCallback(async () => {
    if (isPollingRef.current) return;
    
    isPollingRef.current = true;
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Poll failed: ${response.status}`);
      }

      const data = await response.json();
      const transformedData = transform ? transform(data) : data;

      if (onDataRef.current) {
        onDataRef.current(transformedData);
      }
    } catch (error) {
      if (onErrorRef.current) {
        onErrorRef.current(error instanceof Error ? error : new Error("Unknown error"));
      }
    } finally {
      isPollingRef.current = false;
    }
  }, [url, transform]);

  // Start polling
  const start = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Immediate first poll
    poll();

    // Set up interval
    intervalRef.current = setInterval(() => {
      if (enabledRef.current) {
        poll();
      }
    }, interval);
  }, [poll, interval]);

  // Stop polling
  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Auto start/stop based on enabled flag
  useEffect(() => {
    if (enabled && url) {
      start();
    } else {
      stop();
    }

    return () => {
      stop();
    };
  }, [enabled, url, start, stop]);

  return {
    poll,
    stop,
    start,
  };
}
