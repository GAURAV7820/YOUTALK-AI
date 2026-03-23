chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    let video = document.querySelector("video");

    if (video) {
        let time = video.currentTime;

        alert(`Time: ${Math.floor(time)}s\nQuestion: ${request.question}`);
    }
});