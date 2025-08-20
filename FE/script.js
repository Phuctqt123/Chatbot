import { sendMessage } from "./GetAPI.js";
const $ = (q, root=document) => root.querySelector(q);
const $$ = (q, root=document) => Array.from(root.querySelectorAll(q));
const uid = () => Math.random().toString(36).slice(2, 10);
const state = { chats: [], activeId: null, sending: false, dark: false, sidebarClosed: false, totalTokens: 0 };
const STORAGE_KEY = 'demoai_html_v2';
const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
const load = () => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch { return null; } };
function countTokens(t) { return Math.round(t.length / 4); }
function updateTokenCount(text) { state.totalTokens += countTokens(text); $('#tokenCount').textContent = `Tổng token: ${state.totalTokens}`; save(); }
function escapeHtml(str) { return str.replace(/[&<>"']/g, s => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' })[s]); }
function currentChat() { return state.chats.find(c => c.id === state.activeId) || null; }
function renderList() {
    const list = $('#chatList');
    list.innerHTML = '';
    state.chats.forEach(c => {
        const btn = document.createElement('button');
        btn.className = 'chat-item' + (c.id === state.activeId ? ' active' : '');
        btn.innerHTML = `<span class="title">${escapeHtml(c.title)}</span><span class="del" data-del>✖</span>`;
        btn.addEventListener('click', () => setActive(c.id));
        btn.querySelector('[data-del]').addEventListener('click', e => { e.stopPropagation(); delChat(c.id); });
        list.appendChild(btn);
    });
}
function renderMessages() {
    const wrap = $('#msgContainer');
    wrap.innerHTML = '';
    const chat = currentChat();
    const messagesEl = $('.messages');
    const composerWrap = $('.composer-wrap');
    const startText = $('#startText');
    if (!chat || chat.messages.length === 0) {
        messagesEl.classList.add('empty-state');
        composerWrap.classList.remove('bottom');
        if (startText) startText.style.display = 'block';
        return;
    }
    messagesEl.classList.remove('empty-state');
    composerWrap.classList.add('bottom');
    if (startText) startText.style.display = 'none';
    chat.messages.forEach(m => {
        const sec = document.createElement('div');
        sec.className = 'section ' + m.role;
        const avatar = m.role === 'user' ? '' : '<div class="avatar">✨</div>';
        sec.innerHTML = `<div class="bubble ${m.role}">${avatar}<div class="content">${escapeHtml(m.content)}</div>
                                    <button class="copy-btn" title="Sao chép" onclick="copyText(this)">📄</button>
                                </div>`;
        wrap.appendChild(sec);
    });
    messagesEl.scrollTop = messagesEl.scrollHeight;
}
function setActive(id) { state.activeId = id; renderList(); renderMessages(); save(); }
function createChat(initialMsg) {
    const chat = { id: uid(), title: 'New chat', createdAt: Date.now(), messages: [] };
    state.chats.unshift(chat);
    state.activeId = chat.id;
    if (initialMsg) pushMsg('user', initialMsg);
    renderList();
    renderMessages();
    save();
}
function delChat(id) {
    // Thêm hộp thoại xác nhận
    if (confirm("Bạn có chắc chắn muốn xóa cuộc trò chuyện này không?")) {
        const idx = state.chats.findIndex(c => c.id === id);
        if (idx > -1) state.chats.splice(idx, 1);
        if (state.activeId === id) state.activeId = state.chats[0]?.id || null;
        
        // Nếu không còn cuộc trò chuyện nào, tạo một cuộc trò chuyện mới
        if (state.chats.length === 0) {
            createChat();
        }
        
        renderList();
        renderMessages();
        save();
    }
}

function renameActive(title) {
    const c = currentChat();
    if (!c) return;
    c.title = title;
    renderList();
    save();
}
function pushMsg(role, content) {
    const c = currentChat();
    if (!c) return;
    c.messages.push({ id: uid(), role, content });
    renderMessages();
    save();
}


async function pushMsgWithTyping(role, content, speed = 20) {
    const c = currentChat();
    if (!c) return;
    const sec = document.createElement('div');
    sec.className = 'section ' + role;
    const avatar = role === 'user' ? '' : '<div class="avatar">✨</div>';
    sec.innerHTML = `<div class="bubble ${role}">${avatar}<div class="content"></div>
                            <button class="copy-btn" title="Sao chép" onclick="copyText(this)">📄</button>
                            </div>`;
    const wrap = $('#msgContainer');
    wrap.appendChild(sec);
    const contentEl = sec.querySelector('.content');

    for (let i = 0; i < content.length; i++) {
        contentEl.textContent += content[i];
        // scroll tới tin nhắn mới
        sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
        await new Promise(r => setTimeout(r, speed));
    }

    // lưu tin nhắn vào state
    c.messages.push({ id: uid(), role, content });
    save();
}
async function handleSend() {
  const ta = $('#input');
  const text = ta.value.trim();
  if (!text || state.sending) return;

  let chat = currentChat();
  const isNewChat = !chat || chat.messages.length === 0;

  if (!chat) {
    createChat();
    chat = currentChat();
  }

  ta.value = '';
  autosize(ta);
  state.sending = true;
  pushMsg('user', text);
  updateTokenCount(text);

  if (isNewChat && chat) {
    renameActive(text);
  }

  try {
    const reply = await sendMessage(text);
    await pushMsgWithTyping('assistant', reply);
  } catch (error) {
    console.error("Error sending message:", error);
    pushMsg('assistant', 'Đã có lỗi xảy ra, vui lòng thử lại.');
  } finally {
    state.sending = false;
  }
}

function autosize(el) {
    el.style.height = '0px';
    el.style.height = Math.min(220, Math.max(20, el.scrollHeight)) + 'px';
}
function setDark(d) {
    document.documentElement.classList.toggle('light', d);
    document.documentElement.classList.toggle('dark', !d);
    $('#themeBtn').textContent = d ? '☀️' : '🌙';
    state.dark = d;
    save();
}
const toggleSidebar = () => {
    const sidebar = $('#sidebar');
    state.sidebarClosed = !state.sidebarClosed;
    sidebar.classList.toggle('closed', state.sidebarClosed);
    save();
};
function copyText(btn) {
    const contentEl = btn.parentNode.querySelector('.content');
    const textToCopy = contentEl.textContent;
    const tempInput = document.createElement('textarea');
    tempInput.value = textToCopy;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);
    const originalTitle = btn.title;
    btn.title = 'Đã sao chép!';
    setTimeout(() => { btn.title = originalTitle; }, 2000);
}
window.copyText = copyText;
(function init() {
    const saved = load();
    if (saved) { Object.assign(state, saved); }
    if (state.chats.length === 0) {
        state.chats = [{ id: uid(), title: 'New chat', createdAt: Date.now(), messages: [] }];
        state.activeId = state.chats[0].id;
    }
    if (window.innerWidth < 900) {
        state.sidebarClosed = true;
    } else {
        state.sidebarClosed = false;
    }
    $('#sidebar').classList.toggle('closed', state.sidebarClosed);
    renderList();
    renderMessages();
    $('#tokenCount').textContent = `Tổng token: ${state.totalTokens}`;
    setDark(false);
})();
$('#newChat').addEventListener('click', () => createChat());
$('#sendBtn').addEventListener('click', handleSend);
$('#regenBtn').addEventListener('click', () => {
    const c = currentChat();
    if (!c) return;
    const lastUser = [...c.messages].reverse().find(m => m.role === 'user');
    if (!lastUser) return;
    state.sending = true;
    updateTokenCount(lastUser.content);
    pushMsg('assistant', 'Đây là phản hồi mô phỏng từ DemoAI.');
    state.sending = false;
});
$('#menuBtn').addEventListener('click', toggleSidebar);
$('#closeBtn').addEventListener('click', toggleSidebar);
$('#themeBtn').addEventListener('click', () => setDark(!state.dark));
const ta = $('#input');
ta.addEventListener('input', () => autosize(ta));
ta.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
});
$('#demoAI').addEventListener('click', e => {
    e.preventDefault();
    $('#dropdown').classList.toggle('active');
});
$$('.dropdown-item').forEach(item => {
    item.addEventListener('click', () => {
        const action = item.getAttribute('data-action');
        $('#dropdown').classList.remove('active');
        if (action === 'chat') createChat('Bắt đầu trò chuyện');
        else if (action === 'ideas') createChat('Gợi ý ý tưởng cho tôi');
        else if (action === 'tasks') createChat('Giúp tôi quản lý công việc');
        else if (action === 'learn') createChat('Hỗ trợ học tập');
    });
});
document.addEventListener('click', e => {
    if (!e.target.closest('#demoAI')) $('#dropdown').classList.remove('active');
});