console.log("Content script loaded ✅");

function pickText(selectors) {
    for (const selector of selectors) {
        const element = document.querySelector(selector);
        const text = element?.textContent?.trim();

        if (text) {
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
        ]) || document.querySelector('meta[property="og:title"]')?.content?.trim() || document.title;
        const description = document.querySelector('meta[name="description"]')?.content?.trim() ||
            document.querySelector('meta[property="og:description"]')?.content?.trim() ||
            "";
        const channel = pickText([
            "#owner #channel-name a",
            "ytd-channel-name a",
            ".slim-owner-text a",
        ]);
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
