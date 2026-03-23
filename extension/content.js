console.log("Content script loaded ✅");

function cleanText(text) {
    const value = text?.replace(/\s+/g, " ").trim() || "";

    if (!value || value === "•") {
        return "";
    }

    return value;
}

function pickText(selectors) {
    for (const selector of selectors) {
        const element = document.querySelector(selector);
        const text = cleanText(element?.textContent);

        if (text) {
            return text;
        }
    }

    return "";
}

function getJsonLdChannelName() {
    const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));

    for (const script of scripts) {
        try {
            const parsed = JSON.parse(script.textContent || "");
            const entries = Array.isArray(parsed) ? parsed : [parsed];

            for (const entry of entries) {
                const channelName = cleanText(
                    entry?.author?.name ||
                    entry?.itemListElement?.[0]?.item?.author?.name
                );

                if (channelName) {
                    return channelName;
                }
            }
        } catch (error) {
            continue;
        }
    }

    return "";
}

function getMetaChannelName() {
    return cleanText(
        document.querySelector('link[itemprop="name"]')?.getAttribute("content") ||
        document.querySelector('meta[itemprop="author"]')?.getAttribute("content") ||
        document.querySelector('meta[name="author"]')?.getAttribute("content")
    );
}

function getChannelFromLinks() {
    const links = Array.from(document.querySelectorAll('a[href^="/@"], a[href^="/channel/"], a[href^="/c/"]'));

    for (const link of links) {
        const text = cleanText(link.textContent);

        if (text && text.length > 1) {
            return text;
        }
    }

    return "";
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    const video = document.querySelector("video");

    if (!video) return;

    if (request.action === "GET_TIME") {
        const heading = pickText([
            "h1.ytd-watch-metadata",
            "h1.slim-video-metadata-title",
        ]) || cleanText(document.querySelector('meta[property="og:title"]')?.content) || cleanText(document.title);
        const description = cleanText(document.querySelector('meta[name="description"]')?.content) ||
            cleanText(document.querySelector('meta[property="og:description"]')?.content) ||
            "";
        const channel = pickText([
            "#owner #channel-name a",
            "#channel-name #text a",
            "ytd-watch-metadata #owner a",
            "ytd-channel-name a",
            "ytd-video-owner-renderer #channel-name a",
            "yt-formatted-string.ytd-channel-name a",
            ".slim-owner-text a",
        ]) || getMetaChannelName() || getJsonLdChannelName() || getChannelFromLinks();
        const chapter = pickText([
            ".ytp-chapter-title-content",
            ".ytp-chapter-title-prefix",
        ]);
        const visibleCaptions = Array.from(document.querySelectorAll(".ytp-caption-segment"))
            .map((node) => node.textContent?.trim())
            .filter(Boolean)
            .join(" ");
        const transcript = Array.from(
            document.querySelectorAll(
                "ytd-transcript-segment-renderer .segment-text, ytd-transcript-segment-renderer .yt-core-attributed-string"
            )
        )
            .map((node) => node.textContent?.trim())
            .filter(Boolean)
            .slice(0, 20)
            .join(" ");

        sendResponse({
            time: video.currentTime,
            title: heading || "",
            description,
            channel,
            chapter,
            captions: visibleCaptions,
            transcript,
            paused: video.paused,
            url: window.location.href,
        });
    }
});
