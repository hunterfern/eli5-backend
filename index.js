const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Set up OpenAI with your API key from the .env file
// Create OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// POST endpoint to receive text and return simplified explanation
app.post('/api/explain', async (req, res) => {
  try {
    const { text } = req.body;

    // Validate the incoming text
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'No text provided.' });
    }

    // GPT prompt: Explain like I’m 5 + include glossary
    const prompt = `
You are an AI that explains things like someone is five years old.

Break the following down into a short, simple explanation, followed by a glossary of any tricky words.

Text:
"""${text}"""
`;

    // Send prompt to GPT-4
    const completion = await openai.chat.completions.create({
  model: 'gpt-3.5-turbo',
  messages: [{ role: 'user', content: prompt }],
});


    // Extract the response text
    if (!completion || !completion.choices || !completion.choices.length) {
  return res.status(500).json({ error: 'No valid response from OpenAI.' });
}
const explanation = completion.choices[0].message.content;


    // Send back the explanation to the frontend
    res.json({ explanation });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

// Start the server 
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`ELI5 backend running on port ${PORT}`));
