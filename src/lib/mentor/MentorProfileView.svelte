<script lang="ts">
  import { onMount } from 'svelte';
  import { apiPost, apiFetch } from '$lib/api';

  // Profile settings state
  let fullName = $state('');
  let emailAddress = $state('');


  // Password Reset
  let oldPassword = $state('');
  let newPassword = $state('');
  let pwdStatus = $state('');
  let isChangingPwd = $state(false);

  // Profile Save Status
  let profileSaveStatus = $state('');
  let isSavingProfile = $state(false);

  onMount(() => {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        fullName = user.name || '';
        emailAddress = user.email || '';
      } catch (e) {
        console.error(e);
      }
    }
  });

  async function saveChanges() {
    if (!fullName || !emailAddress) {
      profileSaveStatus = 'Name and Email are required.';
      return;
    }
    isSavingProfile = true;
    profileSaveStatus = '';
    
    try {
      await apiFetch('/mentor/profile', {
        method: 'PUT',
        body: JSON.stringify({
          name: fullName,
          email: emailAddress
        })
      });
      
      profileSaveStatus = 'Profile updated successfully!';
      
      // Update local storage
      const userJson = localStorage.getItem('user');
      if (userJson) {
        const user = JSON.parse(userJson);
        user.name = fullName;
        user.email = emailAddress;
        localStorage.setItem('user', JSON.stringify(user));
      }
    } catch (err: any) {
      profileSaveStatus = err.message || 'Failed to update profile.';
    } finally {
      isSavingProfile = false;
      setTimeout(() => profileSaveStatus = '', 4000);
    }
  }

  async function handleChangePassword(e: SubmitEvent) {
    e.preventDefault();
    if (!oldPassword || !newPassword) {
      pwdStatus = 'Please enter both passwords.';
      return;
    }
    isChangingPwd = true;
    pwdStatus = '';
    try {
      await apiPost('/auth/reset-password', {
        old_password: oldPassword,
        new_password: newPassword
      });
      pwdStatus = 'Password changed successfully!';
      oldPassword = '';
      newPassword = '';
    } catch (err: any) {
      pwdStatus = err.message || 'Failed to change password.';
    } finally {
      isChangingPwd = false;
    }
  }
</script>

<div class="profile-settings-view">
  <div class="header-row">
    <div class="header-text">
      <h2>Profile & Settings</h2>
      <p>Manage your academy profile and teaching preferences.</p>
    </div>
  </div>

  <!-- Profile Information Card -->
  <div class="settings-card">
    <div class="card-header-row">
      <h3>Profile Information</h3>
      <div style="display: flex; align-items: center; gap: 12px;">
        {#if profileSaveStatus}
          <span style="font-size: 0.85rem; font-weight: 600; color: {profileSaveStatus.includes('success') ? 'green' : '#e53e3e'}">{profileSaveStatus}</span>
        {/if}
        <button class="save-btn" onclick={saveChanges} disabled={isSavingProfile}>
          {isSavingProfile ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>

    <div class="profile-info-grid">
      <!-- Avatar Section -->
      <div class="avatar-column">
        <div class="avatar-wrapper" style="display: flex; align-items: center; justify-content: center; background: #2b6cb0; color: white; border-radius: 50%; font-weight: 700; width: 100px; height: 100px; font-size: 2.5rem; position: relative;">
          {fullName ? fullName.charAt(0).toUpperCase() : ''}
        </div>
      </div>

      <!-- Inputs Fields -->
      <div class="fields-column">
        <div class="form-row">
          <div class="form-group">
            <label for="prof-name">Full Name</label>
            <input type="text" id="prof-name" bind:value={fullName} />
          </div>
          <div class="form-group">
            <label for="prof-email">Email Address</label>
            <input type="email" id="prof-email" bind:value={emailAddress} />
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Bottom cards: Security -->
    <!-- Account Security -->
    <div class="settings-card">
      <div class="card-header-row">
        <h3>Change Password</h3>
      </div>
      <form class="password-form" onsubmit={handleChangePassword} style="margin-top: 15px;">
        <div class="form-group">
          <label for="old-pwd">Current Password</label>
          <input type="password" id="old-pwd" bind:value={oldPassword} required style="padding: 10px; width: 100%; border: 1px solid var(--border-color); border-radius: 6px; margin-bottom: 10px;" />
        </div>
        <div class="form-group">
          <label for="new-pwd">New Password</label>
          <input type="password" id="new-pwd" bind:value={newPassword} required style="padding: 10px; width: 100%; border: 1px solid var(--border-color); border-radius: 6px; margin-bottom: 15px;" />
        </div>
        <button type="submit" class="save-btn" disabled={isChangingPwd}>
          {isChangingPwd ? 'Updating...' : 'Update Password'}
        </button>
        {#if pwdStatus}
          <div style="margin-top: 10px; font-size: 0.9rem; color: {pwdStatus.includes('success') ? 'green' : '#e53e3e'}">
            {pwdStatus}
          </div>
        {/if}
      </form>
    </div>

  <!-- Danger Zone -->
  <div class="danger-zone-box">
    <div class="danger-text">
      <h4>Danger Zone</h4>
      <p>Deactivating your account will remove your visibility in the student directory.</p>
    </div>
    <button class="deactivate-btn">Deactivate Account</button>
  </div>
</div>

<style>
  .profile-settings-view {
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
    letter-spacing: -0.5px;
  }

  .header-text p {
    color: var(--text-muted);
    font-size: 0.95rem;
  }

  /* Cards basic */
  .settings-card {
    background-color: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    padding: 24px;
    box-shadow: var(--shadow-sm);
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .card-header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 16px;
  }

  .card-header-row h3 {
    font-size: 1rem;
    font-weight: 700;
    color: var(--text-main);
  }

  .save-btn {
    background-color: var(--primary);
    color: white;
    border: none;
    border-radius: var(--radius-sm);
    padding: 8px 18px;
    font-weight: 600;
    cursor: pointer;
    font-size: 0.85rem;
    box-shadow: 0 4px 10px rgba(229, 62, 62, 0.2);
  }

  /* Profile layout */
  .profile-info-grid {
    display: grid;
    grid-template-columns: 180px 1fr;
    gap: 24px;
    align-items: flex-start;
  }

  .avatar-column {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 12px;
  }

  .avatar-wrapper {
    position: relative;
    width: 110px;
    height: 110px;
  }

  .avatar-wrapper img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
  }

  .upload-badge {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 32px;
    height: 32px;
    background-color: var(--primary);
    color: white;
    border: none;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 0.95rem;
    box-shadow: var(--shadow-md);
  }

  .file-info {
    font-size: 0.7rem;
    color: var(--text-muted);
    line-height: 1.3;
  }

  .fields-column {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .form-group label {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text-main);
  }

  .form-group input, .form-group select {
    padding: 10px 14px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    background-color: #f8fafc;
    color: var(--text-main);
    outline: none;
    font-size: 0.9rem;
    width: 100%;
  }

  .form-group input:focus, .form-group select:focus {
    border-color: var(--primary);
    background-color: var(--bg-card);
    box-shadow: 0 0 0 3px rgba(229, 62, 62, 0.1);
  }

  /* Security details */
  .security-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid var(--border-color);
    padding-top: 16px;
  }

  .sec-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .sec-left .icon {
    font-size: 1.4rem;
  }

  .sec-text {
    display: flex;
    flex-direction: column;
  }

  .sec-text .title {
    font-weight: 700;
    font-size: 0.9rem;
    color: var(--text-main);
  }

  .sec-text .desc {
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  .security-item .action-btn {
    border: 1px solid var(--border-color);
    background-color: transparent;
    color: var(--text-main);
    font-size: 0.8rem;
    font-weight: 700;
    padding: 6px 14px;
    border-radius: var(--radius-sm);
    cursor: pointer;
  }

  .security-item .action-btn.select {
    color: var(--primary);
    border-color: var(--primary);
  }

  /* Danger zone */
  .danger-zone-box {
    border: 1px solid #fed7d7;
    background-color: #fff5f5;
    padding: 20px;
    border-radius: var(--radius-md);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .danger-text h4 {
    color: #c53030;
    font-size: 0.95rem;
    font-weight: 700;
    margin-bottom: 4px;
  }

  .danger-text p {
    font-size: 0.8rem;
    color: #9b2c2c;
  }

  .deactivate-btn {
    border: 1px solid #fed7d7;
    background-color: var(--bg-card);
    color: #e53e3e;
    font-weight: 700;
    padding: 8px 18px;
    border-radius: var(--radius-sm);
    cursor: pointer;
  }

  @media (max-width: 768px) {
    .profile-info-grid { grid-template-columns: 1fr; }
    .preferences-grid { grid-template-columns: 1fr; }
    .danger-zone-box { flex-direction: column; align-items: stretch; gap: 14px; }
  }
</style>
