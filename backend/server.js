import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Resolve __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, "../.env");

// Load .env manually
function loadLocalEnvFile(filePath) {
    if (!fs.existsSync(filePath)) return;

    const lines = fs.readFileSync(filePath, "utf8").split("\n");

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;

        const separatorIndex = trimmed.indexOf("=");
        if (separatorIndex === -1) continue;

        const key = trimmed.slice(0, separatorIndex).trim();
        const value = trimmed.slice(separatorIndex + 1).trim();

        if (key && !process.env[key]) {
            process.env[key] = value;
        }
    }
}

loadLocalEnvFile(envPath);

// App setup
const app = express();
const apiKey = process.env.GEMINI_API_KEY;
const port = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: "10mb" }));
app.use(cors());

// ✅ Root route (IMPORTANT for Render + README)
app.get("/", (req, res) => {
    res.json({
        message: "YOUTALK-AI Backend is running 🚀",
        endpoint: "/ask",
        method: "POST"
    });
});

// Helper function
function appendInlineImage(parts, imageData) {
    if (typeof imageData !== "string" || !imageData.startsWith("data:")) return;

    const match = imageData.match(/^data:(.+);base64,(.+)$/);
    if (!match) return;

    const [, mimeType, data] = match;

    parts.push({
        inline_data: {
            mime_type: mimeType,
            data,
        },
    });
}

// Main API
app.post("/ask", async (req, res) => {
    const { prompt, imageData, imageFrames } = req.body;

    if (!apiKey) {
        return res.status(500).json({ error: "Missing GEMINI_API_KEY" });
    }

    if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
    }

    try {
        const parts = [{ text: prompt }];

        if (Array.isArray(imageFrames) && imageFrames.length > 0) {
            imageFrames.forEach((frame) => appendInlineImage(parts, frame));
        } else {
            appendInlineImage(parts, imageData);
        }

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    contents: [{ parts }],
                }),
            }
        );

        const data = await response.json();

        // ✅ Safety check
        if (!response.ok || !data || !data.candidates) {
            return res.status(response.status || 500).json({
                error: "Invalid response from Gemini API",
                details: data,
            });
        }

        res.json(data);

    } catch (error) {
        console.error("Gemini request failed:", error);
        res.status(500).json({
            error: "Failed to reach Gemini API",
            details: error.message,
        });
    }
});

// Start server
app.listen(port, "0.0.0.0", () => {
    console.log(`Server running on port ${port}`);
});