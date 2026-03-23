console.log("popup.js loaded");

const askButton = document.getElementById("askBtn");
const questionInput = document.getElementById("question");
const responseEl = document.getElementById("response");

askButton.addEventListener("click", async () => {
    const question = questionInput.value.trim();

    if (!question) {
        responseEl.textContent = "Enter a question first.";
        return;
    }

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab?.url?.includes("youtube.com")) {
        responseEl.textContent = "Open a YouTube video first.";
        return;
    }

    await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content.js"],
    });

    const response = await new Promise((resolve) => {
        chrome.tabs.sendMessage(tab.id, { action: "GET_TIME" }, resolve);
    });

    const time = Math.floor(response?.time || 0);
    const prompt = `Video timestamp: ${time} seconds
User question: ${question}

Explain in simple terms like teaching a beginner. Also explain why it is important.`;

    responseEl.textContent = "Thinking...";

    try {
        const res = await fetch("http://127.0.0.1:3000/ask", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ prompt }),
        });

        if (!res.ok) {
            throw new Error(`Request failed with status ${res.status}`);
        }

        const data = await res.json();
        const answer = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
        responseEl.textContent = answer;
    } catch (error) {
        console.error("Failed to fetch answer", error);
        responseEl.textContent = "Could not get a response. Check that the local server is running.";
    }
});
