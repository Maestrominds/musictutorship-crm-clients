<script lang="ts">
  import { PUBLIC_API_URL } from '$env/static/public';
  import { goto } from '$app/navigation';
  import Icon from '$lib/Icon.svelte';

  let email = $state('');
  let password = $state('');
  let isLoading = $state(false);
  let errorMsg = $state('');
  let showPassword = $state(false);

  async function handleLogin(e: SubmitEvent) {
    e.preventDefault();
    errorMsg = '';

    if (!email || !password) {
      errorMsg = 'Please fill in all fields';
      return;
    }

    isLoading = true;

    try {
      const res = await fetch(`${PUBLIC_API_URL || ''}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Invalid email or password');
      }

      const data = await res.json();
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      const role = data.user.role;
      if (role === 'admin') {
        goto('/admin/dashboard');
      } else if (role === 'mentor') {
        goto('/mentors/dashboard');
      } else if (role === 'student') {
        goto('/student/dashboard');
      } else {
        throw new Error('Unknown user role');
      }
    } catch (err: any) {
      errorMsg = err.message || 'Login failed';
    } finally {
      isLoading = false;
    }
  }
</script>

<svelte:head>
  <title>Login — MelodyFlow</title>
  <meta name="description" content="Sign in to MelodyFlow Academy Management to manage students, mentors, and courses." />
</svelte:head>

<div class="login-wrapper">
  <!-- Decorative Left Panel -->
  <div class="hero-panel">
    <div class="hero-overlay"></div>
    <div class="hero-content">
      <div class="brand-logo-large">
        <svg viewBox="0 0 24 24" width="48" height="48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="white" fill-opacity="0.15" />
          <path d="M9 17C7.9 17 7 16.1 7 15C7 13.9 7.9 13 9 13C10.1 13 11 13.9 11 15V9C11 8.45 11.45 8 12 8H16C16.55 8 17 8.45 17 9V11C17 11.55 16.55 12 16 12H13V15C13 16.1 12.1 17 11 17H9Z" fill="white" />
        </svg>
      </div>
      <h2>Orchestrate Your Academy</h2>
      <p>MelodyFlow brings harmony to music education. Seamlessly connect mentors, engage students, and streamline your management.</p>
    </div>
    <div class="floating-elements">
      <div class="note n1"><Icon name="music" size={28} /></div>
      <div class="note n2"><Icon name="music" size={40} /></div>
      <div class="note n3"><Icon name="music" size={24} /></div>
    </div>
  </div>

  <!-- Right Panel -->
  <div class="form-panel">
    <div class="login-card">
      <div class="brand-mobile">
        <div class="logo-circle-small">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" fill="white" />
            <path d="M9 17C7.9 17 7 16.1 7 15C7 13.9 7.9 13 9 13C10.1 13 11 13.9 11 15V9C11 8.45 11.45 8 12 8H16C16.55 8 17 8.45 17 9V11C17 11.55 16.55 12 16 12H13V15C13 16.1 12.1 17 11 17H9Z" fill="var(--primary)" />
          </svg>
        </div>
        <span>MelodyFlow</span>
      </div>

      <div class="login-header">
        <h1>Welcome Back</h1>
        <p>Sign in to your MelodyFlow account.</p>
      </div>



      <form onsubmit={handleLogin} class="login-form">
        {#if errorMsg}
          <div class="error-banner">
            <Icon name="x" size={16} />
            <span>{errorMsg}</span>
          </div>
        {/if}

        <div class="form-group">
          <label for="email">Email Address</label>
          <div class="input-wrapper">
            <span class="input-icon"><Icon name="mail" size={18} /></span>
            <input
              type="email"
              id="email"
              bind:value={email}
              placeholder="name@melodyflow.com"
              required
              autocomplete="email"
            />
          </div>
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <div class="input-wrapper">
            <span class="input-icon"><Icon name="shield" size={18} /></span>
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              bind:value={password}
              placeholder="••••••••"
              required
              autocomplete="current-password"
            />
            <button
              type="button"
              class="toggle-password"
              onclick={() => showPassword = !showPassword}
              aria-label="Toggle password visibility"
            >
              <Icon name="eye" size={18} />
            </button>
          </div>
        </div>

        <div class="form-options">
          <label class="remember-me">
            <input type="checkbox" id="remember" />
            <span>Remember me</span>
          </label>
          <a href="/forgot-password" class="forgot-link" onclick={(e) => e.preventDefault()}>Forgot password?</a>
        </div>

        <button type="submit" class="submit-btn" disabled={isLoading}>
          {#if isLoading}
            <span class="spinner"></span>
            Authenticating...
          {:else}
            Sign In <span style="margin-left: 6px; display: flex;"><Icon name="log-out" size={16} /></span>
          {/if}
        </button>
      </form>
    </div>
  </div>
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    overflow-x: hidden;
  }

  .login-wrapper {
    display: flex;
    min-height: 100vh;
    background-color: var(--bg-page);
  }

  /* Left Panel */
  .hero-panel {
    display: none;
    position: relative;
    width: 45%;
    background: linear-gradient(135deg, var(--primary) 0%, #c53030 100%);
    color: white;
    overflow: hidden;
    padding: 60px;
    align-items: center;
    justify-content: center;
  }

  @media (min-width: 900px) {
    .hero-panel {
      display: flex;
    }
  }

  .hero-overlay {
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at top left, rgba(255,255,255,0.15) 0%, transparent 50%),
                radial-gradient(circle at bottom right, rgba(0,0,0,0.2) 0%, transparent 50%);
    z-index: 1;
  }

  .hero-content {
    position: relative;
    z-index: 2;
    max-width: 460px;
    text-align: left;
    animation: slideRight 0.8s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .brand-logo-large {
    background: rgba(255, 255, 255, 0.15);
    width: 88px;
    height: 88px;
    border-radius: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 32px;
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255,255,255,0.3);
    box-shadow: 0 8px 32px rgba(0,0,0,0.15);
  }

  .hero-content h2 {
    font-size: 2.8rem;
    font-weight: 800;
    line-height: 1.15;
    margin-bottom: 20px;
    letter-spacing: -1.5px;
    color: white;
  }

  .hero-content p {
    font-size: 1.15rem;
    line-height: 1.6;
    color: rgba(255,255,255,0.9);
    font-weight: 400;
  }

  /* Floating Elements */
  .floating-elements {
    position: absolute;
    inset: 0;
    z-index: 1;
    pointer-events: none;
  }

  .note {
    position: absolute;
    color: rgba(255,255,255,0.12);
    animation: float 8s infinite ease-in-out;
  }

  .n1 { top: 20%; left: 15%; animation-delay: 0s; }
  .n2 { top: 65%; right: 15%; animation-delay: -2.5s; transform: scale(1.2); }
  .n3 { bottom: 25%; left: 35%; animation-delay: -5s; }

  @keyframes float {
    0%, 100% { transform: translateY(0) rotate(0deg); }
    50% { transform: translateY(-30px) rotate(15deg); }
  }

  @keyframes slideRight {
    from { opacity: 0; transform: translateX(-40px); }
    to { opacity: 1; transform: translateX(0); }
  }

  /* Right Panel */
  .form-panel {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    position: relative;
    background: var(--bg-page);
    overflow: hidden;
  }

  /* Decorative blobs for form panel */
  .form-panel::before, .form-panel::after {
    content: '';
    position: absolute;
    width: 500px;
    height: 500px;
    border-radius: 50%;
    filter: blur(100px);
    z-index: 0;
    opacity: 0.35;
    pointer-events: none;
  }

  .form-panel::before {
    top: -150px;
    right: -150px;
    background: rgba(229, 62, 62, 0.15);
  }

  .form-panel::after {
    bottom: -150px;
    left: -150px;
    background: rgba(49, 130, 206, 0.12);
  }

  .login-card {
    position: relative;
    z-index: 10;
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(16px);
    border-radius: var(--radius-lg);
    box-shadow: 0 20px 40px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04);
    border: 1px solid rgba(255,255,255,1);
    width: 100%;
    max-width: 460px;
    padding: 56px 48px;
    animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  }

  @keyframes slideUp {
    from { opacity: 0; transform: translateY(40px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .brand-mobile {
    display: none;
    align-items: center;
    gap: 10px;
    margin-bottom: 32px;
    font-weight: 800;
    font-size: 1.3rem;
    color: var(--primary);
    letter-spacing: -0.5px;
  }

  @media (max-width: 899px) {
    .brand-mobile { display: flex; }
    .login-card { padding: 40px 24px; background: var(--bg-card); backdrop-filter: none; }
  }

  .logo-circle-small {
    background: var(--primary-light);
    width: 36px;
    height: 36px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 10px rgba(229, 62, 62, 0.15);
  }

  .login-header { margin-bottom: 32px; }
  .login-header h1 { font-size: 1.85rem; font-weight: 800; color: var(--text-main); margin-bottom: 8px; letter-spacing: -0.8px; }
  .login-header p { color: var(--text-muted); font-size: 1rem; font-weight: 500;}



  .login-form { display: flex; flex-direction: column; gap: 22px; }

  .error-banner {
    display: flex;
    align-items: center;
    gap: 10px;
    background: #fff5f5;
    border: 1px solid #fed7d7;
    color: #c53030;
    padding: 12px 16px;
    border-radius: var(--radius-sm);
    font-size: 0.95rem;
    font-weight: 600;
    animation: shake 0.4s ease-in-out;
  }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-4px); }
    75% { transform: translateX(4px); }
  }

  .form-group { display: flex; flex-direction: column; gap: 8px; }

  .form-group label {
    font-size: 0.9rem;
    font-weight: 700;
    color: var(--text-main);
  }

  .input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .input-icon {
    position: absolute;
    left: 16px;
    color: #a0aec0;
    display: flex;
    align-items: center;
    pointer-events: none;
    transition: color 0.2s;
  }

  .input-wrapper input {
    width: 100%;
    padding: 14px 44px 14px 44px;
    border: 1px solid #e2e8f0;
    border-radius: var(--radius-md);
    background: white;
    font-size: 1rem;
    color: var(--text-main);
    transition: all 0.2s ease;
    box-shadow: 0 1px 2px rgba(0,0,0,0.02) inset;
  }

  .input-wrapper input:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 4px rgba(229, 62, 62, 0.15);
  }

  .input-wrapper input:focus ~ .input-icon {
    color: var(--primary);
  }

  .toggle-password {
    position: absolute;
    right: 14px;
    background: none;
    border: none;
    color: #a0aec0;
    cursor: pointer;
    display: flex;
    align-items: center;
    padding: 6px;
    border-radius: 6px;
    transition: all 0.15s;
  }

  .toggle-password:hover { color: var(--text-main); background: #f7fafc; }

  .form-options {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 0.9rem;
    margin-top: 4px;
  }

  .remember-me {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    color: var(--text-muted);
    font-weight: 600;
  }

  .remember-me input {
    accent-color: var(--primary);
    width: 16px;
    height: 16px;
    cursor: pointer;
  }

  .forgot-link { color: var(--primary); font-weight: 700; transition: color 0.2s; }
  .forgot-link:hover { color: var(--primary-hover); text-decoration: underline; }

  .submit-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 15px;
    border: none;
    background: linear-gradient(135deg, var(--primary) 0%, #c53030 100%);
    color: white;
    font-weight: 700;
    font-size: 1.05rem;
    border-radius: var(--radius-md);
    cursor: pointer;
    box-shadow: 0 8px 20px rgba(229, 62, 62, 0.25);
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    margin-top: 12px;
  }

  .submit-btn:hover:not(:disabled) {
    box-shadow: 0 10px 25px rgba(229, 62, 62, 0.35);
    transform: translateY(-2px);
  }

  .submit-btn:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: 0 4px 10px rgba(229, 62, 62, 0.2);
  }

  .submit-btn:disabled { opacity: 0.7; cursor: not-allowed; }

  .spinner {
    width: 20px;
    height: 20px;
    border: 3px solid rgba(255,255,255,0.3);
    border-radius: 50%;
    border-top-color: white;
    animation: spin 0.6s linear infinite;
  }
</style>
