document.getElementById("askBtn").addEventListener("click", () => {
    let question = document.getElementById("question").value;

    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {

        if (!tabs[0] || !tabs[0].url.includes("youtube.com")) {
            alert("❌ Please open a YouTube video first");
            return;
        }

        chrome.tabs.sendMessage(
            tabs[0].id,
            { question: question },
            (response) => {
                if (chrome.runtime.lastError) {
                    console.log("Error:", chrome.runtime.lastError.message);
                    alert("⚠️ Refresh the YouTube page and try again");
                }
            }
        );
    });
});