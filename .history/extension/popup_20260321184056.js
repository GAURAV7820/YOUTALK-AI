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

   let res = await fetch("http://localhost:3000/ask", {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify({ prompt })
});

let data = await res.json();

let answer = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response";

document.getElementById("response").innerText = answer;
});