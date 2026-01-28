// 1. Toggle Chat Window
function toggleChat() {
    const windowEl = document.getElementById('chatWindow');
    const triggerEl = document.getElementById('chatTrigger');
    
    if (windowEl.style.display === 'none' || windowEl.style.display === '') {
        windowEl.style.display = 'flex';
        triggerEl.style.display = 'none';
    } else {
        windowEl.style.display = 'none';
        triggerEl.style.display = 'block';
    }
}

// 2. Handle Chatting
const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('input');
const messagesCont = document.getElementById('messages');

function addMessage(text, isUser) {
    const msgDiv = document.createElement('div');
    msgDiv.className = isUser ? 'msg msg--user' : 'msg msg--bot';
    msgDiv.textContent = text;
    messagesCont.appendChild(msgDiv);
    messagesCont.scrollTop = messagesCont.scrollHeight;
}

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const message = chatInput.value.trim();
    if (!message) return;

    addMessage(message, true);
    chatInput.value = '';

    try {
        // Point to the Netlify Function redirect (configured in netlify.toml)
        const response = await fetch('/api/chat', {
            method: 'POST',
            body: JSON.stringify({ question: message }),
            headers: { 'Content-Type': 'application/json' }
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            addMessage(data.error || "Sorry, I'm having trouble thinking right now.", false);
            return;
        }
        
        addMessage(data.answer || "Sorry, I'm having trouble thinking right now.", false);
    } catch (err) {
        console.error('Chat error:', err);
        addMessage("Connection error. Please try again later.", false);
    }
});