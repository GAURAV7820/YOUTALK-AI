console.log("Content script loaded ✅");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    let video = document.querySelector("video");

    if (!video) return;

    if (request.action === "GET_TIME") {
        sendResponse({ time: video.currentTime });
    }
});