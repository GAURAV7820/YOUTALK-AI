document.getElementById("askBtn").addEventListener("click", async () => {
    let question = document.getElementById("question").value;

    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab.url.includes("youtube.com")) {
        alert("❌ Open a YouTube video first");
        return;
    }

    // Inject content.js
    await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content.js"]
    });

    // Get timestamp from content.js
    chrome.tabs.sendMessage(tab.id, { action: "GET_TIME" }, async (response) => {

        let time = response?.time || 0;

        // 🔥 Call Gemini API
        let apiKey = AIzaSyB-RK3_5mnpRtH_Z0qFRgBNzvHZxPXriYI;

        let prompt = `
        Video timestamp: ${Math.floor(time)} seconds
        User question: ${question}

        Explain in simple terms like teaching a beginner.
        Also explain why it is important.
        `;

        let res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [{ text: prompt }]
                    }
                ]
            })
        });

        let data = await res.json();

        let answer = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response";

        document.getElementById("response").innerText = answer;
    });
});