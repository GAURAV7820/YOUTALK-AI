document.getElementById("askBtn").addEventListener("click", async () => {
    let question = document.getElementById("question").value;

    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab.url.includes("youtube.com")) {
        alert("❌ Open a YouTube video first");
        return;
    }

    try {
        // 🔥 Inject content.js manually
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ["content.js"]
        });

        // 🔥 Now send message
        chrome.tabs.sendMessage(tab.id, { question: question });

    } catch (err) {
        console.error(err);
        alert("❌ Injection failed");
    }
});