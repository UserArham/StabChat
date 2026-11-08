const modelSelect = document.getElementById('modelSelect');
const chatMessages = document.getElementById('chatMessages');
const chatForm = document.getElementById('chatForm');
const promptInput = document.getElementById('promptInput');
const sendButton = document.getElementById('sendButton');

let activeModels = [];

function addMessage(role, text) {
  const wrapper = document.createElement('div');
  wrapper.className = `message ${role}`;

  const label = document.createElement('span');
  label.className = 'role';
  label.textContent = role === 'user' ? 'You' : 'StabChat';

  const body = document.createElement('div');
  body.textContent = text;

  wrapper.appendChild(label);
  wrapper.appendChild(body);
  chatMessages.appendChild(wrapper);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function loadModels() {
  try {
    const response = await fetch('/api/models');
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to load models');
    }

    activeModels = data.models || [];
    modelSelect.innerHTML = '';

    activeModels.forEach((model) => {
      const option = document.createElement('option');
      option.value = model;
      option.textContent = model;
      modelSelect.appendChild(option);
    });
  } catch (error) {
    console.error(error);
    const fallback = ['llama3.2'];
    activeModels = fallback;
    modelSelect.innerHTML = '<option value="llama3.2">llama3.2</option>';
    addMessage('bot', `Could not load models from LlamaAI. Using fallback model: ${fallback[0]}. Make sure LlamaAI is running.`);
  }
}

async function sendPrompt(event) {
  event.preventDefault();

  const message = promptInput.value.trim();
  if (!message) return;

  const selectedModel = modelSelect.value;
  promptInput.value = '';
  sendButton.disabled = true;
  addMessage('user', message);
  addMessage('bot', 'Thinking...');

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: selectedModel,
        messages: [{ role: 'user', content: message }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Request failed!');
    }

    const lastMessage = chatMessages.lastElementChild;
    if (lastMessage && lastMessage.classList.contains('bot')) {
      lastMessage.remove();
    }

    addMessage('bot', data.reply || 'No reply returned.');
  } catch (error) {
    const lastMessage = chatMessages.lastElementChild;
    if (lastMessage && lastMessage.classList.contains('bot')) {
      lastMessage.remove();
    }

    addMessage('bot', `Error: ${error.message}`);
  } finally {
    sendButton.disabled = false;
    promptInput.focus();
  }
}

chatForm.addEventListener('submit', sendPrompt);
promptInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    chatForm.requestSubmit();
  }
});

loadModels();
