const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
require('dotenv').config();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const pdfParse = require("pdf-parse");

const app = express();
app.use(cors());
app.use(express.json());

// Set up OpenAI with your API key from the .env file
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// POST: Simplify plain text
app.post('/api/explain', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'No text provided.' });
    }

    const prompt = `
You are an AI that explains things like someone is five years old.

Break the following down into a short, simple explanation, followed by a glossary of any tricky words.

Text:
"""${text}"""
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
    });

    if (!completion || !completion.choices || !completion.choices.length) {
      return res.status(500).json({ error: 'No valid response from OpenAI.' });
    }

    const explanation = completion.choices[0].message.content;
    res.json({ explanation });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

// POST: Simplify uploaded PDF
app.post('/api/explain-pdf', upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded." });
    }

    const pdfBuffer = req.file.buffer;
    const data = await pdfParse(pdfBuffer);
    const text = data.text.slice(0, 8000); // Trim for GPT limits

    const prompt = `
You are an AI that explains things like someone is five years old.

Break the following down into a short, simple explanation, followed by a glossary of any tricky words.

Text:
"""${text}"""
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    });

    const explanation = completion.choices?.[0]?.message?.content || "No response.";
    res.json({ explanation });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong." });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`ELI5 backend running on port ${PORT}`));
