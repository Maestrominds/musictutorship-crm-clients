<script lang="ts">
  import Icon from '$lib/Icon.svelte';
  import { onMount } from 'svelte';

  // Profile settings state
  let fullName = $state('');
  let emailAddress = $state('');
  let phoneNumber = $state('');
  let specialty = $state('');

  // Availability Settings
  let isMonEnabled = $state(true);
  let isTueEnabled = $state(true);
  let isWedEnabled = $state(false);

  // Notification Preferences
  let reminderEmail = $state(true);
  let reminderPush = $state(true);
  let messageAlerts = $state(true);

  onMount(() => {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        fullName = user.name || 'Instructor';
        emailAddress = user.email || '';
        phoneNumber = user.phone || '+1 (555) 000-1234';
        specialty = user.specialty || 'Classical Piano';
      } catch (e) {
        console.error(e);
      }
    }
  });

  function saveChanges() {
    alert('Changes saved successfully!');
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
      <button class="save-btn" onclick={saveChanges}>Save Changes</button>
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

        <div class="form-row">
          <div class="form-group">
            <label for="prof-phone">Phone Number</label>
            <input type="text" id="prof-phone" bind:value={phoneNumber} />
          </div>
          <div class="form-group">
            <label for="prof-spec">Teaching Specialty</label>
            <select id="prof-spec" bind:value={specialty}>
              <option value="Classical Piano">Classical Piano</option>
              <option value="Vocal Training">Vocal Training</option>
              <option value="Guitar Mastery">Guitar Mastery</option>
              <option value="Violin Intro">Violin Intro</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Availability Settings Card -->
  <div class="settings-card">
    <div class="card-header-row">
      <div class="avail-title-row">
        <h3>Availability Settings</h3>
        <span class="active-badge">ACTIVE SCHEDULE</span>
      </div>
      <button class="reset-link" onclick={() => { isMonEnabled = true; isTueEnabled = true; isWedEnabled = false; }}>Reset to Default</button>
    </div>

    <div class="availability-roster">
      <div class="day-header-row">
        <span>MON</span>
        <span>TUE</span>
        <span>WED</span>
        <span>THU</span>
        <span>FRI</span>
        <span>SAT</span>
        <span>SUN</span>
      </div>

      <div class="days-list">
        <!-- Monday -->
        <div class="day-row" class:disabled={!isMonEnabled}>
          <span class="day-label">Monday</span>
          <div class="slots-group">
            <span class="time-slot">08:00 AM - 12:00 PM <span class="remove-x">×</span></span>
            <span class="time-slot">02:00 PM - 05:00 PM <span class="remove-x">×</span></span>
            <button class="add-slot-btn">+ Add Slot</button>
          </div>
          <div class="toggle-control">
            <span class="toggle-status">{isMonEnabled ? 'Enabled' : 'Disabled'}</span>
            <label class="switch">
              <input type="checkbox" bind:checked={isMonEnabled} />
              <span class="slider round"></span>
            </label>
          </div>
        </div>

        <!-- Tuesday -->
        <div class="day-row" class:disabled={!isTueEnabled}>
          <span class="day-label">Tuesday</span>
          <div class="slots-group">
            <span class="time-slot">10:00 AM - 04:00 PM <span class="remove-x">×</span></span>
            <button class="add-slot-btn">+ Add Slot</button>
          </div>
          <div class="toggle-control">
            <span class="toggle-status">{isTueEnabled ? 'Enabled' : 'Disabled'}</span>
            <label class="switch">
              <input type="checkbox" bind:checked={isTueEnabled} />
              <span class="slider round"></span>
            </label>
          </div>
        </div>

        <!-- Wednesday -->
        <div class="day-row" class:disabled={!isWedEnabled}>
          <span class="day-label">Wednesday</span>
          <div class="slots-group">
            {#if isWedEnabled}
              <button class="add-slot-btn">+ Add Slot</button>
            {:else}
              <span class="no-hours-text">No teaching hours set</span>
            {/if}
          </div>
          <div class="toggle-control">
            <span class="toggle-status">{isWedEnabled ? 'Enabled' : 'Disabled'}</span>
            <label class="switch">
              <input type="checkbox" bind:checked={isWedEnabled} />
              <span class="slider round"></span>
            </label>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Bottom cards: Preferences & Security -->
  <div class="preferences-grid">
    <!-- Notification Preferences -->
    <div class="settings-card">
      <div class="card-header-row">
        <h3>Notification Preferences</h3>
      </div>
      
      <div class="preference-item">
        <div class="pref-text">
          <span class="title">Class Reminders</span>
          <span class="desc">Get notified 15 minutes before your class starts</span>
        </div>
        <div class="switches-col">
          <label class="pref-toggle">
            <span class="lbl">Email</span>
            <label class="switch">
              <input type="checkbox" bind:checked={reminderEmail} />
              <span class="slider round"></span>
            </label>
          </label>
          <label class="pref-toggle">
            <span class="lbl">Push</span>
            <label class="switch">
              <input type="checkbox" bind:checked={reminderPush} />
              <span class="slider round"></span>
            </label>
          </label>
        </div>
      </div>

      <div class="preference-item">
        <div class="pref-text">
          <span class="title">Student Messages</span>
          <span class="desc">Alerts when students send you direct messages</span>
        </div>
        <div class="switches-col">
          <label class="pref-toggle">
            <span class="lbl">Alerts</span>
            <label class="switch">
              <input type="checkbox" bind:checked={messageAlerts} />
              <span class="slider round"></span>
            </label>
          </label>
        </div>
      </div>
    </div>

    <!-- Account Security -->
    <div class="settings-card">
      <div class="card-header-row">
        <h3>Account Security</h3>
      </div>

      <div class="security-item">
        <div class="sec-left">
          <span class="icon"><Icon name="admin" size={18} /></span>
          <div class="sec-text">
            <span class="title">Password Management</span>
            <span class="desc">Last changed 4 months ago</span>
          </div>
        </div>
        <button class="action-btn">Change</button>
      </div>
    </div>
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

  /* Availability Settings */
  .avail-title-row {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .active-badge {
    background-color: #e6fffa;
    color: #319795;
    font-size: 0.65rem;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: var(--radius-sm);
  }

  .reset-link {
    background: transparent;
    border: none;
    color: var(--primary);
    font-weight: 700;
    font-size: 0.85rem;
    cursor: pointer;
  }

  .day-header-row {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--text-muted);
    padding-bottom: 12px;
    border-bottom: 1px solid var(--border-color);
    text-align: center;
  }

  .days-list {
    display: flex;
    flex-direction: column;
    margin-top: 8px;
  }

  .day-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 0;
    border-bottom: 1px solid var(--border-color);
  }

  .day-row.disabled {
    opacity: 0.55;
  }

  .day-label {
    width: 100px;
    font-weight: 700;
    color: var(--text-main);
  }

  .slots-group {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-grow: 1;
    padding-left: 20px;
  }

  .time-slot {
    background-color: #fff5f5;
    color: #e53e3e;
    font-size: 0.8rem;
    font-weight: 600;
    padding: 6px 12px;
    border-radius: var(--radius-sm);
    display: inline-flex;
    align-items: center;
    gap: 8px;
    border: 1px solid #fed7d7;
  }

  .remove-x {
    cursor: pointer;
    font-weight: 700;
  }

  .add-slot-btn {
    border: 1px solid var(--border-color);
    background-color: var(--bg-card);
    color: var(--text-main);
    font-size: 0.8rem;
    font-weight: 600;
    padding: 6px 12px;
    border-radius: var(--radius-sm);
    cursor: pointer;
  }

  .no-hours-text {
    font-size: 0.85rem;
    color: var(--text-muted);
    font-weight: 500;
  }

  .toggle-control {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .toggle-status {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text-muted);
  }

  /* Switches (Slider) */
  .switch {
    position: relative;
    display: inline-block;
    width: 44px;
    height: 22px;
  }

  .switch input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #cbd5e0;
    transition: .3s;
  }

  .slider:before {
    position: absolute;
    content: "";
    height: 14px;
    width: 14px;
    left: 4px;
    bottom: 4px;
    background-color: white;
    transition: .3s;
  }

  input:checked + .slider {
    background-color: #e53e3e;
  }

  input:checked + .slider:before {
    transform: translateX(22px);
  }

  .slider.round {
    border-radius: 34px;
  }

  .slider.round:before {
    border-radius: 50%;
  }

  /* Preferences Grid split */
  .preferences-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
  }

  .preference-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid var(--border-color);
    padding-top: 16px;
    margin-top: 4px;
  }

  .pref-text {
    display: flex;
    flex-direction: column;
  }

  .pref-text .title {
    font-weight: 700;
    font-size: 0.9rem;
    color: var(--text-main);
  }

  .pref-text .desc {
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  .switches-col {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .pref-toggle {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--text-muted);
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
