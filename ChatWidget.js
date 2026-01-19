class ChatWidget {
    constructor() {
        console.log('VGG ChatWidget Initialized');
        this.isOpen = false;
        this.messages = [];
        this.init();
    }

    init() {
        this.createStyles();
        this.createDOM();
        this.attachEvents();
    }

    createStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .chat-widget {
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 9999;
                font-family: 'Inter', sans-serif;
            }
            
            .chat-toggle {
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background: var(--gold);
                border: none;
                cursor: pointer;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            }
            
            .chat-toggle:hover {
                transform: scale(1.1);
            }
            
            .chat-toggle i {
                font-size: 24px;
                color: #000;
            }
            
            .chat-window {
                position: absolute;
                bottom: 80px;
                right: 0;
                width: 350px;
                height: 500px;
                background: #1a1a1a;
                border: 1px solid #333;
                border-radius: 12px;
                box-shadow: 0 5px 20px rgba(0,0,0,0.5);
                display:flex;
                flex-direction: column;
                transform-origin: bottom right;
                transform: scale(0);
                opacity: 0;
                transition: all 0.3s ease;
                overflow: hidden;
            }
            
            .chat-window.open {
                transform: scale(1);
                opacity: 1;
            }
            
            .chat-header {
                background: #0f0f0f;
                padding: 15px;
                border-bottom: 1px solid #333;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .chat-header img {
                width: 30px;
                height: auto;
            }
            
            .chat-header h3 {
                margin: 0;
                font-size: 1rem;
                color: var(--gold);
            }
            
            .chat-messages {
                flex: 1;
                padding: 15px;
                overflow-y: auto;
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            
            .message {
                max-width: 80%;
                padding: 10px 15px;
                border-radius: 15px;
                font-size: 0.9rem;
                line-height: 1.4;
            }
            
            .message.bot {
                align-self: flex-start;
                background: #333;
                color: #fff;
                border-bottom-left-radius: 2px;
            }
            
            .message.user {
                align-self: flex-end;
                background: var(--gold);
                color: #000;
                border-bottom-right-radius: 2px;
            }
            
            .chat-input-area {
                padding: 15px;
                border-top: 1px solid #333;
                background: #0f0f0f;
                display: flex;
                gap: 10px;
            }
            
            .chat-input {
                flex: 1;
                background: #222;
                border: 1px solid #444;
                color: #fff;
                padding: 10px;
                border-radius: 20px;
                outline: none;
                font-family: inherit;
            }
            
            .chat-input:focus {
                border-color: var(--gold);
            }
            
            .chat-send {
                background: none;
                border: none;
                color: var(--gold);
                cursor: pointer;
                font-size: 1.2rem;
                padding: 0 5px;
            }
            
            .typing-indicator {
                font-size: 0.8rem;
                color: #666;
                margin-left: 10px;
                display: none;
            }
        `;
        document.head.appendChild(style);
    }



    createDOM() {
        this.container = document.createElement('div');
        this.container.className = 'chat-widget';

        this.container.innerHTML = `
            <div class="chat-window" id="chatWindow">
                <div class="chat-header">
                    <img src="/assets/logo-shield.png" alt="VGG">
                    <h3>Veteran Schedule Assistant</h3>
                </div>
                <div class="chat-messages" id="chatMessages">
                    <div class="message bot">
                        Hello! I'm the Veteran Gutters AI Assistant. I can help you check availability and book a free estimate. How can I help you today?
                    </div>
                </div>
                <div class="typing-indicator" id="typingIndicator">Assistant is typing...</div>
                <div class="chat-input-area">
                    <input type="text" class="chat-input" id="chatInput" placeholder="Type a message...">
                    <button class="chat-send" id="chatSend"><i class="fa-solid fa-paper-plane"></i></button>
                </div>
            </div>
            <button class="chat-toggle" id="chatToggle">
                <i class="fa-solid fa-comment-dots"></i>
                <span class="chat-notification-badge" style="position: absolute; top: -5px; right: -5px; background: red; color: white; border-radius: 50%; width: 20px; height: 20px; font-size: 12px; display: flex; align-items: center; justify-content: center; border: 2px solid #1a1a1a;">1</span>
            </button>
        `;

        document.body.appendChild(this.container);

        this.window = this.container.querySelector('#chatWindow');
        this.messagesContainer = this.container.querySelector('#chatMessages');
        this.input = this.container.querySelector('#chatInput');
        this.sendBtn = this.container.querySelector('#chatSend');
        this.toggleBtn = this.container.querySelector('#chatToggle');
        this.typingIndicator = this.container.querySelector('#typingIndicator');

        // Auto-show badge logic could go here (it's hardcoded visible for now for immediate impact)
    }

    attachEvents() {
        this.toggleBtn.addEventListener('click', () => this.toggleChat());
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });
    }

    toggleChat() {
        this.isOpen = !this.isOpen;
        this.window.classList.toggle('open', this.isOpen);
        this.toggleBtn.innerHTML = this.isOpen ?
            '<i class="fa-solid fa-xmark"></i>' :
            '<i class="fa-solid fa-comment-dots"></i>';

        if (this.isOpen) setTimeout(() => this.input.focus(), 300);
    }

    addMessage(text, sender) {
        const div = document.createElement('div');
        div.className = `message ${sender}`;
        div.textContent = text;
        this.messagesContainer.appendChild(div);
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    async sendMessage() {
        const text = this.input.value.trim();
        if (!text) return;

        // Add user message
        this.addMessage(text, 'user');
        this.messages.push({ role: 'user', content: text }); // Add to history
        this.input.value = '';

        // Show typing
        this.typingIndicator.style.display = 'block';

        try {
            // Call Backend API
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: this.messages }) // Send full history
            });

            const data = await response.json();

            this.typingIndicator.style.display = 'none';

            if (data.error) {
                this.addMessage("I'm having trouble connecting right now. Please call us directly.", 'bot');
            } else {
                this.addMessage(data.response, 'bot');

                // Add bot response to history
                this.messages.push({ role: 'assistant', content: data.response });

            }

        } catch (err) {
            console.error(err);
            this.typingIndicator.style.display = 'none';
            this.addMessage("Sorry, I seem to be offline. Please call (321) 278-7996.", 'bot');
        }
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    new ChatWidget();
});
