import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
const apiKey = process.env.GEMINI_API_KEY;

app.use(express.json());
app.use(cors());

app.post("/ask", async (req, res) => {
    const { prompt } = req.body;

    if (!apiKey) {
        return res.status(500).json({ error: "Missing GEMINI_API_KEY" });
    }

    if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
    }

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                }),
            }
        );

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json(data);
        }

        res.json(data);
    } catch (error) {
        console.error("Gemini request failed", error);
        res.status(500).json({ error: "Failed to reach Gemini API" });
    }
});

app.listen(3000, () => console.log("Server running on port 3000"));
