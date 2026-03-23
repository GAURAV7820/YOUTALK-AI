console.log("🔥 popup.js loaded");
document.getElementById("askBtn").addEventListener("click", async () => {
    let question = document.getElementById("question").value;
    console.log("✅ Button clicked");
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
    console.log("🚀 Calling Gemini...");
    // Get timestamp from content.js
    chrome.tabs.sendMessage(tab.id, { action: "GET_TIME" }, async (response) => {

        let time = response?.time || 0;

        // 🔥 Call Gemini API
        let apiKey = "AIzaSyB-RK3_5mnpRtH_Z0qFRgBNzvHZxPXriYI";

        let prompt = `
        Video timestamp: ${Math.floor(time)} seconds
        User question: ${question}

        Explain in simple terms like teaching a beginner.
        Also explain why it is important.
        `;
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
        let res = await fetch(url, {
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
         console.log("📦 Response received");
           
        let data = await res.json();
         console.log("📦 Response received:", data);
        let answer = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
        console.log("FULL DATA:", JSON.stringify(data, null, 2));
        document.getElementById("response").innerText = answer;
    });
});