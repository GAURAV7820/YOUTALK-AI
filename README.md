# 🎬 YOUTALK-AI

### AI that understands YouTube like a human

---
## ❗ Problem

Users struggle to understand video content quickly and contextually.
---

## 💡 Solution

YOUTALK-AI provides real-time AI understanding of YouTube videos using frames + metadata.
---

## 🚀 Overview

**YOUTALK-AI** is a Chrome extension that analyzes YouTube videos in real time and answers user questions using AI.

It combines **video frames + captions + metadata** to give accurate, context-aware answers.

---

## 🌐 Live Demo

🔗 Backend API:
https://youtalk-ai.onrender.com

> ⚠️ Note: First request may take 10–30 seconds due to free hosting (cold start).

---

##  Features

*  **Real-time video understanding**
*  **Scene explanation**
*  **Product detection (shoes, clothes, etc.)**
*  **Character / actor identification**
*  **Video summarization**
*  **Multi-frame analysis for better accuracy**
*  **Smart mode detection (visual, summary, source, etc.)**

---

## 🛠️ Tech Stack

* **Frontend:** Chrome Extension (JavaScript, HTML, CSS)
* **Backend:** Node.js + Express
* **AI Model:** Google Gemini API
* **Deployment:** Render

---

##  How It Works

1. Captures current YouTube frame
2. Extracts:

   * Title
   * Captions
   * Transcript
   * Metadata
3. Sends data to backend
4. AI analyzes and returns a contextual answer

---

## ⚙️ Setup Instructions

### 1️⃣ Clone Repository

```bash
git clone https://github.com/GAURAV7820/YOUTALK-AI.git
cd YOUTALK-AI
```

---

### 2️⃣ Backend Setup

```bash
cd backend
npm install
```

Create `.env` file:

```env
GEMINI_API_KEY=your_api_key_here
```

Run server locally:

```bash
node server.js
```

---

### 3️⃣ Load Chrome Extension

1. Open Chrome → `chrome://extensions`
2. Enable **Developer Mode**
3. Click **Load Unpacked**
4. Select `extension/` folder

---

## 💡 Example Questions

* “What is happening in this scene?”
* “Which shoe brand is this?”
* “Who is this actor?”
* “Summarize this moment”

---

## 🏆 Hackathon Project

Built for **ET Gen AI Hackathon 2026** 🚀

---

## 📌 Future Improvements

* 🔊 Voice input support
* 📌 Save/bookmark important moments
* 🧠 Follow-up question memory
* 🎯 Object highlighting on video

---

## 🔐 Security

* API keys are stored securely using environment variables
* No sensitive data is exposed in the repository

---

## 👨‍💻 Author

**Gaurav Singh**
