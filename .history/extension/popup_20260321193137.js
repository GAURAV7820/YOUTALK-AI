console.log("popup.js loaded");

const askButton = document.getElementById("askBtn");
const questionInput = document.getElementById("question");
const responseEl = document.getElementById("response");
const statusEl = document.getElementById("status");

function setStatus(message, tone = "idle") {
    statusEl.textContent = message;
    statusEl.dataset.tone = tone;
}

function setResponse(message, isEmpty = false) {
    responseEl.textContent = message;
    responseEl.classList.toggle("empty", isEmpty);
}

function captureVisibleFrame(windowId) {
    return new Promise((resolve, reject) => {
        chrome.tabs.captureVisibleTab(windowId, { format: "png" }, (dataUrl) => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
                return;
            }

            resolve(dataUrl);
        });
    });
}

questionInput.addEventListener("input", () => {
    if (questionInput.value.trim()) {
        setStatus("Ready to analyze", "ready");
        return;
    }

    setStatus("Waiting for your question", "idle");
});

askButton.addEventListener("click", async () => {
    const question = questionInput.value.trim();

    if (!question) {
        setStatus("Question needed", "idle");
        setResponse("Enter a question first so YouTalk knows what to explain.", true);
        return;
    }

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab?.url?.includes("youtube.com")) {
        setStatus("Wrong tab", "idle");
        setResponse("Open a YouTube video first, then ask again from the popup.", true);
        return;
    }

    askButton.disabled = true;
    askButton.textContent = "Analyzing...";
    setStatus("Reading the current scene", "loading");
    await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content.js"],
    });

    const response = await new Promise((resolve) => {
        chrome.tabs.sendMessage(tab.id, { action: "GET_TIME" }, resolve);
    });
    setStatus("Capturing the current frame", "loading");
    const imageData = await captureVisibleFrame(tab.windowId);

    const time = Math.floor(response?.time || 0);
    const title = response?.title || "";
    const description = response?.description || "";
    const captions = response?.captions || "";
    const url = response?.url || tab.url || "";
    const prompt = `You are answering questions about a YouTube video.

Video URL: ${url}
Video title: ${title}
Video description: ${description}
Visible captions near current moment: ${captions || "No visible captions found"}
Current timestamp: ${time} seconds
User question: ${question}

Rules:
- Only identify the film, show, or source if the provided context strongly supports it.
- If the context is insufficient, say clearly that you are not sure instead of guessing.
- Use the screenshot as primary evidence for visual questions such as clothing, shoes, objects, or brands.
- Base the answer on the screenshot, video title, visible captions, and timestamp context.
- Keep the answer simple and direct.`;

    setResponse("Thinking through the current moment in the video...", true);

    try {
        setStatus("Sending frame to AI", "loading");
        const res = await fetch("http://127.0.0.1:3000/ask", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ prompt, imageData }),
        });

        const raw = await res.text();
        let data;

        try {
            data = JSON.parse(raw);
        } catch (parseError) {
            throw new Error(raw.startsWith("<!DOCTYPE") ? "Server returned HTML. Restart the local backend and reload the extension." : raw || "Server returned an invalid response.");
        }

        if (!res.ok) {
            const message =
                data?.error?.message ||
                data?.error ||
                `Request failed with status ${res.status}`;
            throw new Error(message);
        }

        const answer = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
        setStatus("Answer ready", "ready");
        setResponse(answer);
    } catch (error) {
        console.error("Failed to fetch answer", error);
        setStatus("Request failed", "idle");
        setResponse(error.message || "Could not get a response. Check that the local server is running.", true);
    } finally {
        askButton.disabled = false;
        askButton.textContent = "Explain This Moment";
    }
});
