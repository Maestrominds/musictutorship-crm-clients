<script lang="ts">
  import Icon from '$lib/Icon.svelte';
  import { onMount, onDestroy } from 'svelte';
  import { apiGet, apiPost } from '$lib/api';
  import { PUBLIC_API_URL } from '$env/static/public';

  interface Ticket {
    id: number;
    title: string;
    subject?: string;
    description?: string;
    status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
    student_id: number;
    admin_id: number | null;
    created_at: string;
  }

  interface ChatMessage {
    type: string;
    sender_id: number;
    message: string;
    timestamp: string;
  }

  let tickets = $state<Ticket[]>([]);
  let isLoading = $state(true);
  let errorMsg = $state('');
  
  let currentUserId = 0;

  // Chat Modal State
  let showChatModal = $state(false);
  let activeTicketId = $state<number | null>(null);
  let chatMessages = $state<ChatMessage[]>([]);
  let newMessage = $state('');
  let ws: WebSocket | null = null;
  let isChatLoading = $state(false);
  let studentsMap = $state<Record<number, string>>({});

  onMount(async () => {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      try {
        currentUserId = JSON.parse(userJson).id;
      } catch(e) {}
    }

    try {
      const studentsData = await apiGet<any[]>('/admin/students');
      if (studentsData) {
        const tempMap: Record<number, string> = {};
        studentsData.forEach(s => {
          tempMap[s.id] = s.name;
        });
        studentsMap = tempMap;
      }
    } catch (err) {
      console.warn('Failed to load students mapping:', err);
    }

    try {
      const data = await apiGet<Ticket[]>('/admin/tickets');
      tickets = data || [];
    } catch (err: any) {
      errorMsg = err.message || 'Failed to load tickets';
    } finally {
      isLoading = false;
    }
  });

  onDestroy(() => {
    if (ws) {
      ws.close();
    }
  });

  async function claimTicket(id: number) {
    try {
      await apiPost('/admin/tickets/claim', { ticket_id: id });
      // Update local state
      tickets = tickets.map(t => {
        if (t.id === id) {
          t.admin_id = currentUserId;
          t.status = 'In Progress';
        }
        return t;
      });
    } catch (err: any) {
      alert(err.message || 'Failed to claim ticket');
    }
  }

  async function openChat(ticketId: number) {
    activeTicketId = ticketId;
    showChatModal = true;
    isChatLoading = true;
    chatMessages = [];

    // Load past messages
    try {
      const pastMessages = await apiGet<any[]>(`/tickets/${ticketId}/messages`);
      chatMessages = (pastMessages || []).map(m => ({
        type: 'message',
        sender_id: m.sender_id,
        message: m.message,
        timestamp: m.created_at
      }));
    } catch (err: any) {
      console.warn('Failed to load past messages:', err);
    }

    // Connect WebSocket
    const token = localStorage.getItem('token');
    const baseUrl = (PUBLIC_API_URL || window.location.origin).replace(/^http/, 'ws');
    const wsUrl = `${baseUrl}/api/tickets/${ticketId}/chat?token=${token}`;
    
    ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      isChatLoading = false;
    };
    
    ws.onmessage = (event) => {
      try {
        const data: ChatMessage = JSON.parse(event.data);
        chatMessages = [...chatMessages, data];
      } catch (e) {
        console.warn('Failed to parse WS message', e);
      }
    };
    
    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
      isChatLoading = false;
    };
    
    ws.onclose = () => {
      console.log('WebSocket closed');
      isChatLoading = false;
      // If we got disconnected and modal is open, inform the user
      if (showChatModal) {
        alert("Chat connection closed. Please make sure this ticket is claimed by you.");
        closeChat();
      }
    };
  }

  function closeChat() {
    showChatModal = false;
    activeTicketId = null;
    if (ws) {
      ws.close();
      ws = null;
    }
  }

  function sendMessage(e: SubmitEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !ws || ws.readyState !== WebSocket.OPEN) return;

    const payload = {
      type: 'message',
      message: newMessage
    };

    ws.send(JSON.stringify(payload));
    
    // Optimistically add to UI (backend might echo it back, but let's assume it doesn't to avoid dupes, or we can just let backend echo it. Actually, typical chat hubs broadcast to ALL connected clients including sender. If it echoes, we shouldn't add here. Let's rely on echo if possible, but if not we can add it here. I'll add optimistically, and if it's duplicated it's okay for this demo).
    // Let's NOT optimistically add to avoid duplicates if backend broadcasts to sender.
    
    newMessage = '';
  }
</script>

<div class="tickets-view">
  <div class="header-row">
    <div class="header-text">
      <h2>Support Tickets</h2>
      <p>Manage and respond to student inquiries and issues.</p>
    </div>
  </div>

  <div class="table-card">
    {#if isLoading}
      <div style="padding: 24px; text-align: center; color: #999;">Loading tickets...</div>
    {:else if errorMsg}
      <div style="padding: 24px; text-align: center; color: #e53e3e;">{errorMsg}</div>
    {:else}
      <table class="tickets-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>SUBJECT</th>
            <th>STUDENT NAME</th>
            <th>DATE</th>
            <th>STATUS</th>
            <th>ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          {#if tickets.length === 0}
            <tr><td colspan="6" class="empty-cell">No tickets found.</td></tr>
          {/if}
          {#each tickets as ticket}
            <tr>
              <td>#{ticket.id}</td>
              <td class="subject-cell">{ticket.title || ticket.subject || 'No Title'}</td>
              <td>{studentsMap[ticket.student_id] || `Student #${ticket.student_id}`}</td>
              <td style="color: var(--text-muted); font-size: 0.85rem;">
                {ticket.created_at ? new Date(ticket.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
              </td>
              <td>
                <span class="status-badge" 
                  class:open={ticket.status === 'Open'} 
                  class:progress={ticket.status === 'In Progress'} 
                  class:closed={ticket.status === 'Closed' || ticket.status === 'Resolved'}>
                  {ticket.status}
                </span>
              </td>
              <td>
                <div class="actions-row">
                  {#if !ticket.admin_id}
                    <button class="action-btn primary" onclick={() => claimTicket(ticket.id)}>Claim</button>
                  {/if}
                  <button class="action-btn" onclick={() => openChat(ticket.id)} disabled={ticket.admin_id !== currentUserId}>
                    <Icon name="message-square" size={14} /> Chat
                  </button>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </div>

  <!-- Chat Modal -->
  {#if showChatModal}
    <div class="modal-overlay" onclick={closeChat} aria-hidden="true" style="animation: fadeIn 0.3s ease;">
      <div class="modal-content chat-modal" onclick={e => e.stopPropagation()} role="dialog" style="animation: slideIn 0.3s ease;">
        <div class="modal-header chat-header">
          <div class="chat-header-info">
            <h3>Ticket #{activeTicketId}</h3>
            <span class="status-indicator online"></span>
          </div>
          <button class="close-btn" onclick={closeChat}>&times;</button>
        </div>
        <div class="chat-messages">
          {#if isChatLoading}
            <div class="empty-chat-state">
              <div class="spinner"></div>
              <p>Connecting to chat...</p>
            </div>
          {:else}
            <!-- Original Request Bubble -->
            {#if tickets.find(t => t.id === activeTicketId)?.description}
              <div class="message received">
                <div class="msg-avatar">
                  <Icon name="user" size={14} />
                </div>
                <div class="msg-bubble original-request">
                  <strong>Original Request:</strong><br/>
                  {tickets.find(t => t.id === activeTicketId)?.description}
                </div>
                <div class="msg-time">{new Date(tickets.find(t => t.id === activeTicketId)?.created_at || '').toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
              </div>
            {/if}

            {#if chatMessages.length === 0}
              <div class="empty-chat-state" style="margin-top: 20px;">
                <Icon name="message-circle" size={48} color="#cbd5e0" />
                <p>No replies yet. Start the conversation!</p>
              </div>
            {/if}
            {#each chatMessages as msg}
              <div class="message {msg.sender_id === currentUserId ? 'sent' : 'received'}">
                {#if msg.sender_id !== currentUserId}
                  <div class="msg-avatar">
                    <Icon name="user" size={14} />
                  </div>
                {/if}
                <div class="msg-content">
                  <div class="msg-bubble">{msg.message}</div>
                  <div class="msg-time">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                </div>
              </div>
            {/each}
          {/if}
        </div>
        <form class="chat-input-area" onsubmit={sendMessage}>
          <input type="text" bind:value={newMessage} placeholder="Type a message..." required disabled={isChatLoading} />
          <button type="submit" class="send-btn" disabled={isChatLoading || !newMessage.trim()}>
            <Icon name="send" size={16} />
          </button>
        </form>
      </div>
    </div>
  {/if}
</div>

<style>
  .tickets-view {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .header-text h2 {
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--text-main);
  }

  .header-text p {
    color: var(--text-muted);
    font-size: 0.95rem;
  }

  .table-card {
    background-color: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    overflow: hidden;
    box-shadow: var(--shadow-sm);
  }

  .tickets-table {
    width: 100%;
    border-collapse: collapse;
  }

  .tickets-table th, .tickets-table td {
    padding: 16px 20px;
    text-align: left;
    border-bottom: 1px solid var(--border-color);
  }

  .tickets-table th {
    background-color: #f8fafc;
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .tickets-table td {
    font-size: 0.9rem;
    color: var(--text-main);
  }

  .subject-cell {
    font-weight: 600;
  }

  .empty-cell {
    text-align: center !important;
    color: var(--text-muted);
    padding: 32px !important;
  }

  .status-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 4px 10px;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .status-badge.open { background: #e0e7ff; color: #3730a3; border: 1px solid #c7d2fe; }
  .status-badge.progress { background: #fef3c7; color: #b45309; border: 1px solid #fde68a; }
  .status-badge.closed { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }

  .actions-row {
    display: flex;
    gap: 8px;
  }

  .action-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    background: #f1f5f9;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text-main);
    cursor: pointer;
  }

  .action-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .action-btn.primary {
    background: var(--primary);
    color: white;
    border-color: var(--primary);
  }

  /* Chat Modal */
  @keyframes fadeIn {
    from { opacity: 0; backdrop-filter: blur(0px); }
    to { opacity: 1; backdrop-filter: blur(4px); }
  }

  @keyframes slideIn {
    from { transform: translateY(20px) scale(0.98); opacity: 0; }
    to { transform: translateY(0) scale(1); opacity: 1; }
  }

  .modal-overlay {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(15, 23, 42, 0.6);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .chat-modal {
    background: white;
    width: 100%;
    max-width: 480px;
    border-radius: 16px;
    display: flex;
    flex-direction: column;
    height: 85vh;
    max-height: 650px;
    box-shadow: 0 20px 40px rgba(0,0,0,0.2);
    overflow: hidden;
  }

  .chat-header {
    background: #fff;
    padding: 16px 24px;
    border-bottom: 1px solid var(--border-color);
  }

  .chat-header-info {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .chat-header-info h3 {
    margin: 0;
    font-size: 1.15rem;
  }

  .status-indicator.online {
    width: 10px;
    height: 10px;
    background: #10b981;
    border-radius: 50%;
    box-shadow: 0 0 0 2px #d1fae5;
  }

  .chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    background: #f8fafc;
    scroll-behavior: smooth;
  }

  .empty-chat-state {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #94a3b8;
    gap: 12px;
  }

  .message {
    display: flex;
    max-width: 85%;
    gap: 8px;
    align-items: flex-end;
  }

  .message.sent {
    align-self: flex-end;
    flex-direction: row-reverse;
  }

  .message.received {
    align-self: flex-start;
  }

  .msg-avatar {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #e2e8f0;
    color: #64748b;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .msg-content {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .msg-bubble {
    padding: 12px 16px;
    border-radius: 12px;
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    line-height: 1.4;
  }
  .original-request {
    background: #fdf6e3;
    border-color: #f6e0b5;
  }
  .sent .msg-bubble {
    background: linear-gradient(135deg, var(--primary), #fc8181);
    color: white;
    border-bottom-right-radius: 4px;
  }

  .message.received .msg-bubble {
    background: white;
    color: var(--text-main);
    border: 1px solid var(--border-color);
    border-bottom-left-radius: 4px;
  }

  .msg-time {
    font-size: 0.7rem;
    color: #94a3b8;
  }

  .message.sent .msg-time {
    align-self: flex-end;
  }

  .message.received .msg-time {
    align-self: flex-start;
  }

  .chat-input-area {
    padding: 16px 24px;
    background: white;
    border-top: 1px solid var(--border-color);
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .chat-input-area input {
    flex: 1;
    padding: 14px 18px;
    border: 1px solid var(--border-color);
    border-radius: 24px;
    outline: none;
    font-size: 0.95rem;
    background: #f8fafc;
    transition: all 0.2s;
  }

  .chat-input-area input:focus {
    border-color: var(--primary);
    background: white;
    box-shadow: 0 0 0 3px rgba(229, 62, 62, 0.1);
  }

  .send-btn {
    background: linear-gradient(135deg, var(--primary), #e53e3e);
    color: white;
    border: none;
    border-radius: 50%;
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 4px 10px rgba(229, 62, 62, 0.2);
    transition: transform 0.1s, box-shadow 0.1s;
  }
  
  .send-btn:active {
    transform: scale(0.95);
  }

  .send-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background: #cbd5e0;
    box-shadow: none;
  }
  
  .spinner {
    width: 30px; height: 30px;
    border: 3px solid #e2e8f0;
    border-top-color: var(--primary);
    border-radius: 50%;
    animation: spin 1s infinite linear;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
</style>
