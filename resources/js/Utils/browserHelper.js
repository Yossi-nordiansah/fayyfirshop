/**
 * Helper utility for detecting in-app browsers (WebView) on mobile devices
 * and handling external browser redirection.
 */

export const isInAppBrowser = () => {
    if (typeof window === 'undefined') return false;
    const ua = navigator.userAgent || navigator.vendor || window.opera || '';

    // Match common in-app browsers that block or degrade Google OAuth
    const inAppPatterns = [
        /FBAN|FBAV/i,                     // Facebook App
        /Instagram/i,                     // Instagram App
        /TikTok|Bytedance|musical_ly/i,   // TikTok App
        /WhatsApp/i,                      // WhatsApp App
        /Line\//i,                        // Line App
        /Twitter|TwitterAndroid/i,        // Twitter / X
        /Snapchat/i,                      // Snapchat
        /MicroMessenger/i,                // WeChat
        /LinkedInApp/i,                   // LinkedIn
        /; wv\)/i,                        // Android WebView indicator (e.g., "Version/4.0 ... Mobile ... ; wv)")
    ];

    return inAppPatterns.some((pattern) => pattern.test(ua));
};

export const isAndroid = () => {
    if (typeof window === 'undefined') return false;
    return /Android/i.test(navigator.userAgent || '');
};

export const isIOS = () => {
    if (typeof window === 'undefined') return false;
    return /iPhone|iPad|iPod/i.test(navigator.userAgent || '');
};

/**
 * Attempt to open the target URL in Google Chrome via Android Intent.
 */
export const openAndroidChromeIntent = (targetUrl) => {
    if (typeof window === 'undefined') return;
    try {
        const urlToOpen = targetUrl || window.location.href;
        const cleanUrl = urlToOpen.replace(/^https?:\/\//i, '');
        // Android Chrome Intent syntax
        window.location.href = `intent://${cleanUrl}#Intent;scheme=https;package=com.android.chrome;end`;
    } catch (e) {
        console.error('Failed to open Android Chrome intent', e);
    }
};

/**
 * Clean current URL for OAuth redirect parameter.
 */
export const getCleanAuthRedirectUrl = (fallback = '/') => {
    if (typeof window === 'undefined') return fallback;
    try {
        const url = new URL(window.location.href);
        url.searchParams.delete('login');
        url.searchParams.delete('error');
        // Do not redirect back to /login or /register
        if (url.pathname.includes('/login') || url.pathname.includes('/register')) {
            return fallback;
        }
        return url.toString();
    } catch {
        return fallback;
    }
};
