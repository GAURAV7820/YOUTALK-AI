console.log("Content script loaded ✅");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Message received:", request);

    let video = document.querySelector("video");

    if (video) {
        let time = video.currentTime;

        alert(`Time: ${Math.floor(time)}s\nQuestion: ${request.question}`);
    } else {
        alert("❌ Video not found");
    }
});