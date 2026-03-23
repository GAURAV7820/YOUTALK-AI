import express from "express";
import fetch from "node-fetch";
import cors from "cors";

app.use(cors());
const app = express();
app.use(express.json());

app.post("/ask", async (req, res) => {
    const { prompt } = req.body;

    const apiKey = "YOUR_API_KEY";

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

    res.json(data);
});

app.listen(3000, () => console.log("Server running on port 3000"));