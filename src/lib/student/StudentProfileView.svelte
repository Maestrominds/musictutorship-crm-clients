<script lang="ts">
  import Icon from '$lib/Icon.svelte';
  import { apiPost } from '$lib/api';

  const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  const user = userStr ? JSON.parse(userStr) : null;
  
  let oldPassword = $state('');
  let newPassword = $state('');
  let confirmPassword = $state('');
  let isSubmitting = $state(false);
  let message = $state<{ type: 'success' | 'error', text: string } | null>(null);

  async function handlePasswordReset(e: Event) {
    e.preventDefault();
    message = null;

    if (newPassword !== confirmPassword) {
      message = { type: 'error', text: 'New passwords do not match.' };
      return;
    }

    if (newPassword.length < 6) {
      message = { type: 'error', text: 'Password must be at least 6 characters.' };
      return;
    }

    isSubmitting = true;
    try {
      await apiPost('/auth/reset-password', {
        old_password: oldPassword,
        new_password: newPassword
      });
      message = { type: 'success', text: 'Password reset successfully!' };
      oldPassword = '';
      newPassword = '';
      confirmPassword = '';
    } catch (err: any) {
      message = { type: 'error', text: err.message || 'Failed to reset password.' };
    } finally {
      isSubmitting = false;
    }
  }
</script>

<div class="profile-view">
  <div class="header-row">
    <div class="header-text">
      <h2>My Profile</h2>
      <p>Manage your account settings and update your password.</p>
    </div>
  </div>

  <div class="profile-content">
    <div class="card user-info-card">
      <div class="avatar-large">
        {user?.name?.charAt(0).toUpperCase() || 'S'}
      </div>
      <div class="info-details">
        <h3>{user?.name || 'Student Name'}</h3>
        <p class="role-badge">Student</p>
        <div class="info-row">
          <Icon name="mail" size={16} />
          <span>{user?.email || 'student@example.com'}</span>
        </div>
      </div>
    </div>

    <div class="card password-reset-card">
      <h3>Reset Password</h3>
      <p class="card-desc">Ensure your account is using a long, random password to stay secure.</p>
      
      {#if message}
        <div class="alert {message.type}">
          {message.text}
        </div>
      {/if}

      <form onsubmit={handlePasswordReset} class="password-form">
        <div class="form-group">
          <label for="oldPassword">Current Password</label>
          <input type="password" id="oldPassword" bind:value={oldPassword} required />
        </div>
        
        <div class="form-group">
          <label for="newPassword">New Password</label>
          <input type="password" id="newPassword" bind:value={newPassword} required />
        </div>

        <div class="form-group">
          <label for="confirmPassword">Confirm New Password</label>
          <input type="password" id="confirmPassword" bind:value={confirmPassword} required />
        </div>

        <button type="submit" class="save-btn" disabled={isSubmitting || !oldPassword || !newPassword || !confirmPassword}>
          {isSubmitting ? 'Resetting...' : 'Update Password'}
        </button>
      </form>
    </div>
  </div>
</div>

<style>
  .profile-view {
    padding: 24px;
    max-width: 900px;
    margin: 0 auto;
  }
  
  .header-row {
    margin-bottom: 30px;
  }
  
  .header-text h2 { margin: 0 0 8px 0; font-size: 1.8rem; color: var(--text-main); }
  .header-text p { margin: 0; color: var(--text-muted); }

  .profile-content {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .card {
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    padding: 24px;
  }

  .user-info-card {
    display: flex;
    align-items: center;
    gap: 24px;
  }

  .avatar-large {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: var(--primary);
    color: white;
    font-size: 2rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .info-details h3 {
    margin: 0 0 8px 0;
    font-size: 1.4rem;
    color: var(--text-main);
  }

  .role-badge {
    display: inline-block;
    padding: 4px 10px;
    background: #e2e8f0;
    color: #4a5568;
    border-radius: 12px;
    font-size: 0.8rem;
    font-weight: 600;
    margin-bottom: 12px;
  }

  .info-row {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--text-muted);
    font-size: 0.95rem;
  }

  .password-reset-card h3 {
    margin: 0 0 8px 0;
    font-size: 1.2rem;
  }

  .card-desc {
    margin: 0 0 20px 0;
    color: var(--text-muted);
    font-size: 0.9rem;
  }

  .password-form {
    max-width: 400px;
  }

  .form-group {
    margin-bottom: 16px;
  }

  .form-group label {
    display: block;
    margin-bottom: 6px;
    font-size: 0.9rem;
    font-weight: 500;
    color: var(--text-main);
  }

  .form-group input {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    background: var(--bg-page);
    color: var(--text-main);
  }

  .save-btn {
    background: var(--primary);
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: var(--radius-md);
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.2s;
  }

  .save-btn:hover { opacity: 0.9; }
  .save-btn:disabled { opacity: 0.6; cursor: not-allowed; }

  .alert {
    padding: 12px 16px;
    border-radius: var(--radius-md);
    margin-bottom: 20px;
    font-size: 0.9rem;
    font-weight: 500;
  }

  .alert.success {
    background: #f0fff4;
    color: #276749;
    border: 1px solid #c6f6d5;
  }

  .alert.error {
    background: #fff5f5;
    color: #c53030;
    border: 1px solid #fed7d7;
  }
</style>
