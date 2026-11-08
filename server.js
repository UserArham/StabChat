const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const DEFAULT_MODEL = process.env.DEFAULT_MODEL || 'llama3.2';

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/models', async (req, res) => {
  try {
    const response = await fetch(`${LlamaAI_BASE_URL}/api/tags`);

    if (!response.ok) {
      throw new Error(`LlamaAI responded with status ${response.status}`);
    }

    const data = await response.json();
    const models = (data.models || []).map((model) => model.name);
    res.json({ models: models.length ? models : [DEFAULT_MODEL] });
  } catch (error) {
    console.error('Failed to fetch models from LlamaAI:', error.message);
    res.status(502).json({
      error: 'Could not reach the local LlamaAI server.',
      details: error.message,
      fallbackModel: DEFAULT_MODEL,
    });
  }
});

app.post('/api/chat', async (req, res) => {
  const { model = DEFAULT_MODEL, messages = [] } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Messages array is required.' });
  }

  try {
    const response = await fetch(`${LlamaAI_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        stream: false,
        messages,
      }),
    });

    if (!response.ok) {
      throw new Error(`LlamaAI responded with status ${response.status}`);
    }

    const data = await response.json();
    const reply = data.message?.content || 'No response returned.';
    res.json({ reply });
  } catch (error) {
    console.error('Chat request failed:', error.message);
    res.status(502).json({
      error: 'The local model could not respond.',
      details: error.message,
    });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`VoxelChat running at http://localhost:${PORT}`);
  console.log(`Using LlamaAI at ${LlamaAI_BASE_URL}`);
});
