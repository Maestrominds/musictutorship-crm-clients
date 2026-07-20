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

<div class="login-container">
  <div class="login-card">
    <!-- Brand -->
    <div class="brand">
      <div class="logo-circle">
        <svg viewBox="0 0 24 24" width="26" height="26" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="white" />
          <path d="M9 17C7.9 17 7 16.1 7 15C7 13.9 7.9 13 9 13C10.1 13 11 13.9 11 15V9C11 8.45 11.45 8 12 8H16C16.55 8 17 8.45 17 9V11C17 11.55 16.55 12 16 12H13V15C13 16.1 12.1 17 11 17H9Z" fill="#e53e3e" />
        </svg>
      </div>
      <div class="brand-text">
        <span class="brand-name">MelodyFlow</span>
        <span class="brand-sub">Academy Management</span>
      </div>
    </div>

    <div class="login-header">
      <h1>Welcome Back</h1>
      <p>Enter your credentials to access your account.</p>
    </div>

    <!-- Credentials Hint Cards -->
    <div class="hint-grid">
      <div class="hint-card">
        <span class="hint-role-icon"><Icon name="admin" size={14} /></span>
        <div class="hint-info">
          <span class="hint-role">Admin</span>
          <span class="hint-cred">admin@melodyflow.com / admin123</span>
        </div>
      </div>
      <div class="hint-card">
        <span class="hint-role-icon"><Icon name="mentor" size={14} /></span>
        <div class="hint-info">
          <span class="hint-role">Mentor</span>
          <span class="hint-cred">mentor@melodyflow.com / mentor123</span>
        </div>
      </div>
      <div class="hint-card">
        <span class="hint-role-icon"><Icon name="student" size={14} /></span>
        <div class="hint-info">
          <span class="hint-role">Student</span>
          <span class="hint-cred">student@melodyflow.com / student123</span>
        </div>
      </div>
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
          <span class="input-icon"><Icon name="mail" size={16} /></span>
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
          <span class="input-icon"><Icon name="admin" size={16} /></span>
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
            <Icon name="eye" size={16} />
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
          Signing in...
        {:else}
          <Icon name="log-out" size={16} />
          Sign In
        {/if}
      </button>
    </form>
  </div>
</div>

<style>
  .login-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background:
      radial-gradient(ellipse at 80% 10%, rgba(229, 62, 62, 0.06) 0%, transparent 50%),
      radial-gradient(ellipse at 20% 90%, rgba(229, 62, 62, 0.04) 0%, transparent 50%),
      var(--bg-page);
    padding: 24px;
  }

  .login-card {
    background: var(--bg-card);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    border: 1px solid var(--border-color);
    width: 100%;
    max-width: 460px;
    padding: 40px;
    animation: slideUp 0.35s ease;
  }

  @keyframes slideUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 28px;
  }

  .logo-circle {
    background: var(--primary);
    width: 44px;
    height: 44px;
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(229, 62, 62, 0.28);
    flex-shrink: 0;
  }

  .brand-text { display: flex; flex-direction: column; }
  .brand-name { font-size: 1.1rem; font-weight: 700; color: var(--text-main); line-height: 1.2; }
  .brand-sub { font-size: 0.75rem; font-weight: 500; color: var(--text-muted); }

  .login-header { margin-bottom: 20px; }
  .login-header h1 { font-size: 1.6rem; font-weight: 700; color: var(--text-main); margin-bottom: 6px; letter-spacing: -0.4px; }
  .login-header p { color: var(--text-muted); font-size: 0.9rem; }

  /* Credential hint cards */
  .hint-grid {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 24px;
    background: #f8fafc;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    padding: 10px;
  }

  .hint-card {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 10px;
    border-radius: var(--radius-sm);
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    transition: border-color 0.15s;
  }

  .hint-card:hover { border-color: var(--primary); }

  .hint-role-icon {
    color: var(--primary);
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }

  .hint-info { display: flex; flex-direction: column; gap: 1px; min-width: 0; }

  .hint-role {
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--text-main);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .hint-cred {
    font-size: 0.7rem;
    color: var(--text-muted);
    font-family: 'Courier New', monospace;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .login-form { display: flex; flex-direction: column; gap: 18px; }

  .error-banner {
    display: flex;
    align-items: center;
    gap: 8px;
    background: #fff5f5;
    border: 1px solid #fed7d7;
    color: #c53030;
    padding: 10px 14px;
    border-radius: var(--radius-sm);
    font-size: 0.875rem;
    font-weight: 500;
  }

  .form-group { display: flex; flex-direction: column; gap: 6px; }

  .form-group label {
    font-size: 0.82rem;
    font-weight: 600;
    color: var(--text-main);
  }

  .input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .input-icon {
    position: absolute;
    left: 13px;
    color: var(--text-muted);
    display: flex;
    align-items: center;
    pointer-events: none;
  }

  .input-wrapper input {
    width: 100%;
    padding: 11px 42px 11px 40px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    background: #f8fafc;
    font-size: 0.92rem;
    color: var(--text-main);
    transition: all 0.2s ease;
  }

  .input-wrapper input:focus {
    outline: none;
    border-color: var(--primary);
    background: var(--bg-card);
    box-shadow: 0 0 0 3px rgba(229, 62, 62, 0.1);
  }

  .toggle-password {
    position: absolute;
    right: 12px;
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    display: flex;
    align-items: center;
    padding: 2px;
    border-radius: 4px;
    transition: color 0.15s;
  }

  .toggle-password:hover { color: var(--text-main); }

  .form-options {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 0.83rem;
  }

  .remember-me {
    display: flex;
    align-items: center;
    gap: 7px;
    cursor: pointer;
    color: var(--text-muted);
    font-weight: 500;
  }

  .remember-me input { accent-color: var(--primary); width: 15px; height: 15px; }

  .forgot-link { color: var(--primary); font-weight: 600; font-size: 0.83rem; transition: color 0.15s; }
  .forgot-link:hover { color: var(--primary-hover); }

  .submit-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 13px;
    border: none;
    background: var(--primary);
    color: white;
    font-weight: 600;
    font-size: 0.95rem;
    border-radius: var(--radius-md);
    cursor: pointer;
    box-shadow: 0 4px 14px rgba(229, 62, 62, 0.22);
    transition: all 0.2s ease;
  }

  .submit-btn:hover:not(:disabled) {
    background: var(--primary-hover);
    box-shadow: 0 6px 18px rgba(229, 62, 62, 0.32);
    transform: translateY(-1px);
  }

  .submit-btn:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }

  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255,255,255,0.3);
    border-radius: 50%;
    border-top-color: white;
    animation: spin 0.6s linear infinite;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  @media (max-width: 480px) {
    .login-card { padding: 28px 20px; }
    .hint-cred { font-size: 0.65rem; }
  }
</style>
