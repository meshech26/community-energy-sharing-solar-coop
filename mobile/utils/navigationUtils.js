/**
 * Safely navigates back in the navigation stack.
 * If navigation.canGoBack() is false (e.g. after a browser refresh or direct deep link),
 * it falls back to navigating to the designated fallback route.
 *
 * @param {object} navigation - The React Navigation object.
 * @param {string} fallbackRoute - Route name to navigate to if unable to go back (default: 'MainTabs').
 * @param {object} [fallbackParams] - Optional parameters to pass to the fallback route.
 */
export const safeGoBack = (navigation, fallbackRoute = 'MainTabs', fallbackParams = undefined) => {
  if (navigation && typeof navigation.canGoBack === 'function' && navigation.canGoBack()) {
    navigation.goBack();
  } else if (navigation && typeof navigation.navigate === 'function') {
    if (fallbackParams !== undefined) {
      navigation.navigate(fallbackRoute, fallbackParams);
    } else {
      navigation.navigate(fallbackRoute);
    }
  }
};
