import PostHog from 'posthog-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const POSTHOG_KEY = 'phc_rkoqTAg6LVwCBq4GavT3brNXm3bo82s6RQYZ4WWqSWUe';

let initialized = false;

export async function initPostHog() {
  if (initialized) return;
  if (typeof window === 'undefined') return;

  // Get or create anonymous ID
  let distinctId = await AsyncStorage.getItem('@pbl_posthog_id');
  if (!distinctId) {
    distinctId = 'pbl_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    await AsyncStorage.setItem('@pbl_posthog_id', distinctId);
  }

  PostHog.init(POSTHOG_KEY, {
    api_host: 'https://app.posthog.com',
    autocapture: false,          // disable auto click/scroll tracking
    capture_pageview: true,      // track page views
    disable_session_recording: true,
    loaded: (posthog) => {
      posthog.identify(distinctId);
    },
  });

  initialized = true;
}

export function capture(event, properties = {}) {
  if (!initialized) return;
  try {
    PostHog.capture(event, properties);
  } catch (e) {
    console.log('PostHog error:', e.message);
  }
}
