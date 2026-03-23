console.log("popup.js loaded");

const askButton = document.getElementById("askBtn");
const questionInput = document.getElementById("question");
const responseEl = document.getElementById("response");
const statusEl = document.getElementById("status");
const voiceBtn = document.getElementById("voiceBtn");
const contextTimeEl = document.getElementById("contextTime");
const contextChannelEl = document.getElementById("contextChannel");
const contextSnippetEl = document.getElementById("contextSnippet");
const contextKickerEl = document.getElementById("contextKicker");
const modePillEl = document.getElementById("modePill");
const BACKEND_URL = "https://your-backend-url.onrender.com";
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;
let isListening = false;

function setStatus(message, tone = "idle") {
    statusEl.textContent = message;
    statusEl.dataset.tone = tone;
}

function setResponse(message, isEmpty = false) {
    responseEl.textContent = message;
    responseEl.classList.toggle("empty", isEmpty);
}

function updateVoiceState(listening) {
    isListening = listening;
    voiceBtn.classList.toggle("listening", listening);
    voiceBtn.textContent = listening ? "◉" : "🎙";
    voiceBtn.title = listening ? "Listening..." : "Use voice input";
}

function formatTimestamp(totalSeconds) {
    const safe = Math.max(0, Math.floor(Number(totalSeconds) || 0));
    const hours = Math.floor(safe / 3600);
    const minutes = Math.floor((safe % 3600) / 60);
    const seconds = safe % 60;
    const parts = [minutes, seconds].map((value) => String(value).padStart(2, "0"));

    if (hours > 0) {
        parts.unshift(String(hours).padStart(2, "0"));
    }

    return parts.join(":");
}

function detectMode(question) {
    const normalized = question.toLowerCase();

    if (/(shoe|brand|dress|shirt|jacket|watch|bag|outfit|wearing|logo|product|car|bike)/.test(normalized)) {
        return { key: "visual-id", label: "Visual ID" };
    }

    if (/(who is|actor|actress|hero|heroine|character|person|celebrity|cast)/.test(normalized)) {
        return { key: "character-id", label: "Character ID" };
    }

    if (/(summarize|summary|gist|what happened in this video|overview)/.test(normalized)) {
        return { key: "summary", label: "Summary" };
    }

    if (/(film|movie|song|series|show|which video|what video|which scene|what scene)/.test(normalized)) {
        return { key: "source-id", label: "Source ID" };
    }

    return { key: "scene-explain", label: "Scene Explain" };
}

function getModeInstruction(mode) {
    if (mode.key === "visual-id") {
        return [
            "The user is asking for visual identification.",
            "Use the screenshots as primary evidence.",
            "Focus on logos, silhouettes, stripe patterns, sole shape, color blocking, stitching, and other product details.",
            "Compare details across frames and only answer confidently if they remain consistent.",
            "If the brand or product cannot be confirmed, say that clearly and give up to three likely possibilities with short reasons.",
        ].join("\n");
    }

    if (mode.key === "character-id") {
        return [
            "The user is asking who a person is.",
            "Use the screenshots first, then use title, channel, chapter, captions, and description to validate identity.",
            "Compare facial features, hairstyle, costume, and scene continuity across frames before naming anyone.",
            "Do not confidently name a person unless the evidence is strong.",
        ].join("\n");
    }

    if (mode.key === "summary") {
        return [
            "The user wants a concise video understanding summary.",
            "Explain what is happening now, why it matters, and what clues support that reading.",
        ].join("\n");
    }

    if (mode.key === "source-id") {
        return [
            "The user is asking which film, song, scene, or source this is from.",
            "Combine image evidence with video metadata and any transcript or captions.",
            "If evidence is weak, say you are not sure instead of guessing.",
        ].join("\n");
    }

    return [
        "The user wants an explanation of the current video moment.",
        "Explain the scene in simple terms, grounded in what is visible and what the page says.",
    ].join("\n");
}

function buildContextSnippet(context) {
    const pieces = [];

    if (context.title) {
        pieces.push(`Title: ${context.title}`);
    }

    if (context.captions) {
        pieces.push(`Captions: ${context.captions}`);
    } else if (context.transcript) {
        pieces.push(`Transcript: ${context.transcript}`);
    }

    if (context.description) {
        pieces.push(`Description: ${context.description.slice(0, 180)}`);
    }

    return pieces.join("\n\n") || "No useful YouTube text context captured yet. The AI will rely more heavily on the frame.";
}

function updateContextPreview(context, mode) {
    contextTimeEl.textContent = `${formatTimestamp(context.time)}${context.paused ? " paused" : " live"}`;
    contextChannelEl.textContent = [context.channel, context.chapter].filter(Boolean).join(" / ") || "Metadata not detected";
    contextSnippetEl.textContent = buildContextSnippet(context);
    contextKickerEl.textContent = `${mode.label} mode`;
    modePillEl.textContent = mode.label;
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

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function captureFrameSequence(windowId, frameCount = 3, delayMs = 220) {
    const frames = [];

    for (let index = 0; index < frameCount; index += 1) {
        frames.push(await captureVisibleFrame(windowId));

        if (index < frameCount - 1) {
            await sleep(delayMs);
        }
    }

    return frames;
}

function buildPrompt(question, context, mode) {
    return `You are YouTalk AI, a focused YouTube video understanding assistant.

Your job:
- Answer the user's question about the current YouTube moment.
- Use the screenshots as visual evidence.
- Use video metadata and any on-screen text as supporting evidence.
- Never invent names, brands, actors, films, or events when the evidence is weak.
- If uncertain, say that directly and explain what evidence is missing.
- You may receive multiple nearby frames from the same moment. Compare them before answering.

Analysis mode: ${mode.label}
Mode instructions:
${getModeInstruction(mode)}

Video evidence:
URL: ${context.url}
Title: ${context.title || "Unknown"}
Channel: ${context.channel || "Unknown"}
Chapter: ${context.chapter || "Unknown"}
Timestamp: ${formatTimestamp(context.time)}
Paused: ${context.paused ? "yes" : "no"}
Visible captions: ${context.captions || "None visible"}
Transcript text if available: ${context.transcript || "No transcript panel text captured"}
Description: ${context.description || "No description captured"}

User question:
${question}

Response rules:
- Start with a direct answer in 1-2 sentences.
- Then add a short "Why:" line explaining the evidence used.
- If confidence is not high, include a "Confidence: low" or "Confidence: medium" line.
- For identification questions, do not force a single answer unless the evidence is strong.
- Keep the response compact and useful.`;
}

async function fetchVideoContext(tab) {
    await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content.js"],
    });

    return new Promise((resolve) => {
        chrome.tabs.sendMessage(tab.id, { action: "GET_TIME" }, resolve);
    });
}

async function runAnalysis() {
    const question = questionInput.value.trim();

    if (!question) {
        setStatus("Question needed", "idle");
        setResponse("Enter a question first so YouTalk knows what to analyze.", true);
        return;
    }

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab?.url?.includes("youtube.com")) {
        setStatus("Wrong tab", "idle");
        setResponse("Open a YouTube video first, then ask again from the popup.", true);
        return;
    }

    const mode = detectMode(question);
    askButton.disabled = true;
    askButton.textContent = "Analyzing...";
    setStatus("Reading YouTube context", "loading");

    try {
        const response = await fetchVideoContext(tab);

        if (!response) {
            throw new Error("Could not read the current YouTube video context.");
        }

        const context = {
            time: Math.floor(response?.time || 0),
            title: response?.title || "",
            description: response?.description || "",
            captions: response?.captions || "",
            transcript: response?.transcript || "",
            chapter: response?.chapter || "",
            channel: response?.channel || "",
            paused: Boolean(response?.paused),
            url: response?.url || tab.url || "",
        };

        updateContextPreview(context, mode);
        setStatus("Capturing nearby frames", "loading");
        const imageFrames = await captureFrameSequence(tab.windowId);
        const prompt = buildPrompt(question, context, mode);

        setResponse("Analyzing nearby frames, metadata, and current video context...", true);
        setStatus("Asking AI", "loading");
        const res = await fetch(`${BACKEND_URL}/ask`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                prompt,
                imageFrames,
            }),
        });

        const raw = await res.text();
        let data;

        try {
            data = JSON.parse(raw);
        } catch (parseError) {
            throw new Error(raw || "Gemini returned an invalid response.");
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
        setResponse(error.message || "Could not get a response from the backend. Check the deployed API and try again.", true);
    } finally {
        askButton.disabled = false;
        askButton.textContent = "Analyze Video";
    }
}

questionInput.addEventListener("input", () => {
    const value = questionInput.value.trim();

    if (value) {
        const mode = detectMode(value);
        modePillEl.textContent = mode.label;
        contextKickerEl.textContent = `${mode.label} mode`;
        setStatus("Ready to analyze", "ready");
        return;
    }

    modePillEl.textContent = "Scene Explain";
    contextKickerEl.textContent = "Nothing captured yet";
    setStatus("Waiting for your question", "idle");
});

questionInput.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        runAnalysis();
    }
});

function initVoiceInput() {
    if (!SpeechRecognition) {
        voiceBtn.disabled = true;
        voiceBtn.title = "Voice input is not supported in this browser";
        voiceBtn.textContent = "×";
        return;
    }

    recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
        updateVoiceState(true);
        setStatus("Listening...", "loading");
    };

    recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
            .map((result) => result[0]?.transcript || "")
            .join(" ")
            .trim();

        if (transcript) {
            questionInput.value = transcript;
            const mode = detectMode(transcript);
            modePillEl.textContent = mode.label;
            contextKickerEl.textContent = `${mode.label} mode`;
        }
    };

    recognition.onerror = (event) => {
        updateVoiceState(false);

        if (event.error === "not-allowed") {
            setStatus("Mic blocked", "idle");
            setResponse("Microphone access was blocked. Allow mic access for Chrome and try again.", true);
            return;
        }

        setStatus("Voice failed", "idle");
        setResponse("Voice input did not work this time. You can still type your question.", true);
    };

    recognition.onend = () => {
        updateVoiceState(false);

        if (questionInput.value.trim()) {
            setStatus("Voice captured", "ready");
        } else {
            setStatus("Waiting for your question", "idle");
        }
    };
}

voiceBtn.addEventListener("click", () => {
    if (!recognition) {
        setStatus("Voice unavailable", "idle");
        setResponse("Voice input is not supported in this browser popup. You can still type your question.", true);
        return;
    }

    if (isListening) {
        recognition.stop();
        return;
    }

    recognition.start();
});

askButton.addEventListener("click", runAnalysis);
initVoiceInput();
