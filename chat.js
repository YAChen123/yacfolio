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

    // 1. Add user message and clear input
    addMessage(message, true);
    chatInput.value = '';

    // 2. Create the animated "Ocean Wave" typing indicator
    const typingDiv = document.createElement('div');
    typingDiv.className = 'msg msg--bot typing-indicator';

    // Create the three dots for the animation
    for (let i = 0; i < 3; i++) {
        const dot = document.createElement('span');
        typingDiv.appendChild(dot);
    }

    messagesCont.appendChild(typingDiv);
    messagesCont.scrollTop = messagesCont.scrollHeight;

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            body: JSON.stringify({
                question: message
            }),
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        // 3. Remove the typing indicator once data arrives
        if (messagesCont.contains(typingDiv)) {
            messagesCont.removeChild(typingDiv);
        }

        if (!response.ok) {
            addMessage(data.error || "Sorry, I'm having trouble thinking right now.", false);
            return;
        }

        // 4. Split the answer by newlines (matching your updated System Prompt)
        const parts = data.answer.split('\n');

        parts.forEach((part, index) => {
            const cleanText = part.replace(/\*/g, '').trim();

            if (cleanText.length > 0) {
                // Staggered appearance for the "Multi-Bubble" effect
                setTimeout(() => {
                    addMessage(cleanText, false);
                }, index * 600);
            }
        });

    } catch (err) {
        if (messagesCont.contains(typingDiv)) {
            messagesCont.removeChild(typingDiv);
        }
        console.error('Chat error:', err);
        addMessage("Connection error. Please try again later.", false);
    }
});