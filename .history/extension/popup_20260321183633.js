console.log("🔥 popup.js loaded");

document.getElementById("askBtn").addEventListener("click", async () => {
    console.log("✅ Button clicked");

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

    // ✅ FIXED MESSAGE HANDLING
    let response = await new Promise((resolve) => {
        chrome.tabs.sendMessage(tab.id, { action: "GET_TIME" }, resolve);
    });

    let time = response?.time || 0;

    console.log("⏱ Time:", time);

    let apiKey = "AIzaSyCqvBjlgkYvA2CJdZlfWAFvmujO0UPylkc"; // ⚠️ regenerate this later

    let prompt = `
    Video timestamp: ${Math.floor(time)} seconds
    User question: ${question}

    Explain in simple terms like teaching a beginner.
    Also explain why it is important.
    `;

    console.log("🚀 Calling Gemini...");

   const url = `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions?key=${apiKey}`;

console.log("🚀 Calling Gemini...");

let res = await fetch(url, {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify({
        model: "gemini-1.5-flash",
        messages: [
            {
                role: "user",
                content: [
                    {
                        type: "text",
                        text: prompt
                    }
                ]
            }
        ]
    })
});

let data = await res.json();

console.log("FULL DATA:", data);

let answer = data.choices?.[0]?.message?.content || "No response";

document.getElementById("response").innerText = answer;
});