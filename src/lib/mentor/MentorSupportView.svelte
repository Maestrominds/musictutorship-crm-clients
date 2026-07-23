<script lang="ts">
  import Icon from '$lib/Icon.svelte';
  import { onMount, onDestroy } from 'svelte';
  import { apiGet, apiPost } from '$lib/api';
  import { PUBLIC_API_URL } from '$env/static/public';

  interface Ticket {
    id: number;
    title: string;
    description?: string;
    status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
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
  
  // Create Modal
  let showCreateModal = $state(false);
  let newTicketTitle = $state('');
  let newTicketDesc = $state('');
  let isSubmitting = $state(false);

  // Chat Modal
  let showChatModal = $state(false);
  let activeTicketId = $state<number | null>(null);
  let chatMessages = $state<ChatMessage[]>([]);
  let newMessage = $state('');
  let ws: WebSocket | null = null;
  let isChatLoading = $state(false);
  let currentUserId = 0;

  onMount(async () => {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      try {
        currentUserId = JSON.parse(userJson).id;
      } catch(e) {}
    }

    try {
      const data = await apiGet<Ticket[]>('/mentor/tickets');
      tickets = data || [];
    } catch (err) {
      // Backend endpoint might not exist yet
      tickets = [];
    } finally {
      isLoading = false;
    }
  });

  onDestroy(() => {
    if (ws) ws.close();
  });

  async function handleCreateTicket(e: Event) {
    e.preventDefault();
    if (!newTicketTitle) return;
    
    isSubmitting = true;
    try {
      const res = await apiPost<any>('/mentor/tickets', {
        title: newTicketTitle,
        description: newTicketDesc
      });
      if (res && res.id) {
        tickets = [res, ...tickets];
      }
      showCreateModal = false;
      newTicketTitle = '';
      newTicketDesc = '';
    } catch (err) {
      alert('Failed to create ticket. Please try again later.');
    } finally {
      isSubmitting = false;
    }
  }

  async function openChat(ticketId: number) {
    activeTicketId = ticketId;
    showChatModal = true;
    isChatLoading = true;
    chatMessages = [];

    try {
      const pastMessages = await apiGet<any[]>(`/tickets/${ticketId}/messages`);
      if (pastMessages) {
        chatMessages = pastMessages;
      }
    } catch (err) {
      console.warn('Failed to load messages:', err);
    } finally {
      isChatLoading = false;
    }

    const token = localStorage.getItem('token');
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${PUBLIC_API_URL || 'http://localhost:3000'}`.replace(/^http/, wsProtocol === 'wss:' ? 'wss' : 'ws');
    
    ws = new WebSocket(`${wsUrl}/api/tickets/${ticketId}/chat?token=${token}`);
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'message') {
          chatMessages = [...chatMessages, data];
        }
      } catch (e) {
        console.error('WS message error', e);
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

  function sendMessage(e: Event) {
    e.preventDefault();
    if (!newMessage.trim() || !ws || ws.readyState !== WebSocket.OPEN) return;

    const payload = {
      type: 'message',
      message: newMessage.trim()
    };
    ws.send(JSON.stringify(payload));
    newMessage = '';
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'Open': return '#e53e3e';
      case 'In Progress': return '#d69e2e';
      case 'Resolved': return '#38a169';
      case 'Closed': return '#718096';
      default: return '#718096';
    }
  }
</script>

<div class="support-view">
  <div class="header-row">
    <div class="header-text">
      <h2>Support Tickets</h2>
      <p>Need help with a student, schedule, or system issue? Raise a ticket.</p>
    </div>
    <div class="header-actions">
      <button class="new-ticket-btn" onclick={() => showCreateModal = true}>
        <Icon name="plus" size={16} /> New Ticket
      </button>
    </div>
  </div>

  {#if isLoading}
    <div class="loading-state">Loading tickets...</div>
  {:else if tickets.length === 0}
    <div class="empty-state">
      <Icon name="inbox" size={48} />
      <h3>No tickets yet</h3>
      <p>If you encounter any issues, feel free to open a support ticket.</p>
    </div>
  {:else}
    <div class="tickets-list">
      {#each tickets as ticket}
        <div class="ticket-card">
          <div class="ticket-main">
            <div class="ticket-header">
              <span class="ticket-id">#{ticket.id}</span>
              <span class="status-badge" style="background: {getStatusColor(ticket.status)}15; color: {getStatusColor(ticket.status)}">
                {ticket.status}
              </span>
              <span class="ticket-date">{new Date(ticket.created_at).toLocaleDateString()}</span>
            </div>
            <h3 class="ticket-title">{ticket.title}</h3>
            {#if ticket.description}
              <p class="ticket-desc">{ticket.description}</p>
            {/if}
          </div>
          <div class="ticket-actions">
            <button class="chat-btn" onclick={() => openChat(ticket.id)}>
              <Icon name="message-square" size={16} /> Open Chat
            </button>
          </div>
        </div>
      {/each}
    </div>
  {/if}

  <!-- Create Ticket Modal -->
  {#if showCreateModal}
    <div class="modal-overlay" onclick={() => showCreateModal = false} aria-hidden="true">
      <div class="modal-content" onclick={e => e.stopPropagation()} role="dialog" tabindex="-1">
        <div class="modal-header">
          <h3>Create Support Ticket</h3>
          <button class="close-btn" onclick={() => showCreateModal = false}>&times;</button>
        </div>
        <form class="modal-form" onsubmit={handleCreateTicket}>
          <div class="form-group">
            <label for="title">Subject / Title</label>
            <input id="title" type="text" bind:value={newTicketTitle} required placeholder="e.g. Schedule sync issue" />
          </div>
          <div class="form-group">
            <label for="desc">Description</label>
            <textarea id="desc" bind:value={newTicketDesc} rows="4" placeholder="Please describe your issue in detail..."></textarea>
          </div>
          <div class="modal-actions">
            <button type="button" class="cancel-btn" onclick={() => showCreateModal = false}>Cancel</button>
            <button type="submit" class="save-btn" disabled={isSubmitting || !newTicketTitle}>
              {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  {/if}

  <!-- Chat Modal -->
  {#if showChatModal}
    <div class="modal-overlay" onclick={closeChat} aria-hidden="true">
      <div class="modal-content chat-modal-content" onclick={e => e.stopPropagation()} role="dialog" tabindex="-1">
        <div class="modal-header">
          <h3>Ticket #{activeTicketId} Chat</h3>
          <button class="close-btn" onclick={closeChat}>&times;</button>
        </div>
        <div class="chat-body">
          {#if isChatLoading}
            <div class="loading-state">Loading messages...</div>
          {:else}
            <!-- Original Request Bubble -->
            {#if tickets.find(t => t.id === activeTicketId)?.description}
              <div class="chat-message my-message">
                <div class="msg-bubble original-request">
                  <strong>Original Request:</strong><br/>
                  {tickets.find(t => t.id === activeTicketId)?.description}
                </div>
                <div class="msg-time">{new Date(tickets.find(t => t.id === activeTicketId)?.created_at || '').toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
              </div>
            {/if}

            {#if chatMessages.length === 0}
              <div class="empty-state">No replies yet. Say hello!</div>
            {/if}
            {#each chatMessages as msg}
              <div class="chat-message {msg.sender_id === currentUserId ? 'my-message' : 'other-message'}">
                <div class="msg-bubble">
                  {msg.message}
                </div>
                <div class="msg-time">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
              </div>
            {/each}
          {/if}
        </div>
        <form class="chat-input-area" onsubmit={sendMessage}>
          <input type="text" bind:value={newMessage} placeholder="Type your message..." />
          <button type="submit" disabled={!newMessage.trim()}><Icon name="send" size={16} /></button>
        </form>
      </div>
    </div>
  {/if}
</div>

<style>
  .support-view {
    padding: 24px;
    max-width: 1000px;
    margin: 0 auto;
  }
  .header-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 30px;
  }
  .header-text h2 { margin: 0 0 8px 0; font-size: 1.8rem; color: var(--text-main); }
  .header-text p { margin: 0; color: var(--text-muted); }
  .new-ticket-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--primary);
    color: white;
    border: none;
    padding: 10px 16px;
    border-radius: var(--radius-md);
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.2s;
  }
  .new-ticket-btn:hover { opacity: 0.9; }

  .loading-state, .empty-state {
    text-align: center;
    padding: 60px 20px;
    background: var(--bg-card);
    border-radius: var(--radius-lg);
    border: 1px solid var(--border-color);
    color: var(--text-muted);
  }
  .empty-state h3 { margin: 16px 0 8px 0; color: var(--text-main); }

  .tickets-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .ticket-card {
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    padding: 20px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }
  .ticket-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
    font-size: 0.85rem;
  }
  .ticket-id { font-weight: 600; color: var(--text-muted); }
  .status-badge {
    padding: 4px 10px;
    border-radius: 12px;
    font-weight: 600;
  }
  .ticket-date { color: var(--text-muted); }
  .ticket-title { margin: 0 0 8px 0; font-size: 1.1rem; color: var(--text-main); }
  .ticket-desc { margin: 0; color: var(--text-muted); font-size: 0.95rem; line-height: 1.5; }
  
  .chat-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    background: transparent;
    border: 1px solid var(--border-color);
    padding: 8px 16px;
    border-radius: var(--radius-md);
    color: var(--text-main);
    font-weight: 500;
    cursor: pointer;
    white-space: nowrap;
  }
  .chat-btn:hover { background: var(--bg-page); }

  /* Modal Styles */
  .modal-overlay {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  .modal-content {
    background: var(--bg-card);
    width: 90%;
    max-width: 500px;
    border-radius: var(--radius-lg);
    padding: 24px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.2);
  }
  .chat-modal-content {
    max-width: 600px;
    height: 80vh;
    display: flex;
    flex-direction: column;
    padding: 0;
  }
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
  .chat-modal-content .modal-header {
    padding: 20px;
    border-bottom: 1px solid var(--border-color);
    margin-bottom: 0;
  }
  .modal-header h3 { margin: 0; }
  .close-btn {
    background: transparent;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: var(--text-muted);
  }
  .form-group { margin-bottom: 16px; }
  .form-group label {
    display: block;
    margin-bottom: 6px;
    font-weight: 500;
    font-size: 0.9rem;
  }
  .form-group input, .form-group textarea {
    width: 100%;
    padding: 10px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    background: var(--bg-page);
    color: var(--text-main);
  }
  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 24px;
  }
  .cancel-btn {
    padding: 10px 16px;
    background: transparent;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    cursor: pointer;
  }
  .save-btn {
    padding: 10px 16px;
    background: var(--primary);
    color: white;
    border: none;
    border-radius: var(--radius-md);
    cursor: pointer;
    font-weight: 600;
  }

  /* Chat area */
  .chat-body {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    background: var(--bg-page);
  }
  .chat-message { display: flex; flex-direction: column; max-width: 80%; }
  .my-message { align-self: flex-end; align-items: flex-end; }
  .other-message { align-self: flex-start; align-items: flex-start; }
  .msg-bubble {
    padding: 12px 16px;
    border-radius: 16px;
    margin-bottom: 4px;
    line-height: 1.4;
  }
  .original-request {
    background: #fdf6e3 !important;
    color: var(--text-main) !important;
    border: 1px solid #f6e0b5;
    border-bottom-right-radius: 4px;
  }
  .my-message .msg-bubble:not(.original-request) {
    background: var(--primary);
    color: white;
    border-bottom-right-radius: 4px;
  }
  .other-message .msg-bubble {
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-bottom-left-radius: 4px;
  }
  .msg-time { font-size: 0.75rem; color: var(--text-muted); }
  .chat-input-area {
    padding: 16px 20px;
    border-top: 1px solid var(--border-color);
    display: flex;
    gap: 10px;
    background: var(--bg-card);
    border-bottom-left-radius: var(--radius-lg);
    border-bottom-right-radius: var(--radius-lg);
  }
  .chat-input-area input {
    flex: 1;
    padding: 12px 16px;
    border: 1px solid var(--border-color);
    border-radius: 20px;
    background: var(--bg-page);
    color: var(--text-main);
  }
  .chat-input-area button {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: none;
    background: var(--primary);
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .chat-input-area button:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
