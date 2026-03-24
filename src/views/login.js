import { login, register } from '../auth.js';
import { navigate }        from '../app.js';

// ── Login ────────────────────────────────────────────────────────────────────
export function renderLogin(container) {
  container.innerHTML = `
    <div style="min-height:100vh;display:flex;flex-direction:column;align-items:center;
      justify-content:center;padding:24px 20px;">

      <!-- Logo -->
      <div style="text-align:center;margin-bottom:36px;">
        <div style="font-family:'Newsreader',serif;font-size:72px;font-weight:800;
          color:#1E2643;line-height:1;">Ψ</div>
        <div style="font-family:'Newsreader',serif;font-size:22px;font-weight:700;
          color:#1E2643;margin-top:2px;">SnowOS</div>
        <div style="font-size:11px;color:#7f756d;letter-spacing:1.8px;text-transform:uppercase;
          margin-top:5px;">Club Med Ski School</div>
      </div>

      <!-- Card -->
      <div class="glass-strong" style="width:100%;max-width:400px;padding:32px 28px;">
        <h2 style="font-family:'Newsreader',serif;font-size:26px;font-weight:700;
          color:#000;margin:0 0 24px;">Sign in</h2>

        <div id="login-err" style="display:none;margin-bottom:16px;"></div>

        <div style="margin-bottom:16px;">
          <label class="field-label">Email</label>
          <input id="l-email" type="email" class="field-input" placeholder="you@example.com"
            autocomplete="email" inputmode="email">
        </div>
        <div style="margin-bottom:24px;">
          <label class="field-label">Password</label>
          <input id="l-pw" type="password" class="field-input" placeholder="••••••••"
            autocomplete="current-password">
        </div>

        <button id="l-btn" class="btn btn-primary btn-lg btn-full">Sign In</button>

        <div style="text-align:center;margin-top:18px;">
          <a href="#/register" style="color:#1E2643;font-size:14px;font-weight:500;
            text-decoration:none;">Create an account →</a>
        </div>

        <!-- Demo accounts -->
        <div style="margin-top:24px;padding-top:20px;border-top:1px solid rgba(30,38,67,0.08);">
          <div style="font-size:11px;color:#8b8077;text-align:center;margin-bottom:10px;
            letter-spacing:0.5px;font-family:'Inter',sans-serif;">Demo accounts</div>
          <div style="display:flex;gap:8px;">
            <button class="demo-btn" data-email="guest@snowos.com" data-pw="guest123"
              style="flex:1;padding:8px 4px;border:1px solid var(--line-soft);border-radius:8px;
              background:var(--bg-section-soft);cursor:pointer;font-size:12px;font-weight:600;
              color:#1E2643;font-family:'Inter',sans-serif;transition:background 0.15s;">
              Guest
            </button>
            <button class="demo-btn" data-email="instructor@snowos.com" data-pw="inst123"
              style="flex:1;padding:8px 4px;border:1px solid var(--line-soft);border-radius:8px;
              background:var(--bg-section-soft);cursor:pointer;font-size:12px;font-weight:600;
              color:#1E2643;font-family:'Inter',sans-serif;transition:background 0.15s;">
              Instructor
            </button>
            <button class="demo-btn" data-email="supervisor@snowos.com" data-pw="sup123"
              style="flex:1;padding:8px 4px;border:1px solid var(--line-soft);border-radius:8px;
              background:var(--bg-section-soft);cursor:pointer;font-size:12px;font-weight:600;
              color:#1E2643;font-family:'Inter',sans-serif;transition:background 0.15s;">
              Supervisor
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  function doLogin() {
    const email = container.querySelector('#l-email').value.trim();
    const pw    = container.querySelector('#l-pw').value;
    const errEl = container.querySelector('#login-err');
    const res   = login(email, pw);
    if (res.ok) {
      navigate(`/${res.user.role}/dashboard`);
    } else {
      errEl.innerHTML = `<div class="err-box">${res.error}</div>`;
      errEl.style.display = 'block';
    }
  }

  container.querySelector('#l-btn').addEventListener('click', doLogin);
  container.querySelector('#l-pw').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
  container.querySelector('#l-email').addEventListener('keydown', e => { if (e.key === 'Enter') container.querySelector('#l-pw').focus(); });

  container.querySelectorAll('.demo-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelector('#l-email').value = btn.dataset.email;
      container.querySelector('#l-pw').value    = btn.dataset.pw;
      doLogin();
    });
  });
}

// ── Register ─────────────────────────────────────────────────────────────────
export function renderRegister(container) {
  container.innerHTML = `
    <div style="min-height:100vh;display:flex;flex-direction:column;align-items:center;
      justify-content:center;padding:24px 20px;">

      <div style="text-align:center;margin-bottom:28px;">
        <div style="font-family:'Newsreader',serif;font-size:52px;font-weight:800;
          color:#1E2643;line-height:1;">Ψ</div>
        <div style="font-size:11px;color:#7f756d;letter-spacing:1.8px;text-transform:uppercase;
          margin-top:6px;">Create Account</div>
      </div>

      <div class="glass-strong" style="width:100%;max-width:400px;padding:32px 28px;">
        <h2 style="font-family:'Newsreader',serif;font-size:26px;font-weight:700;
          color:#000;margin:0 0 6px;">Join SnowOS</h2>
        <p style="color:#6b625d;font-size:14px;margin:0 0 24px;">Your ski school account gives you access to book group lessons on the mountain.</p>

        <div id="reg-err" style="display:none;margin-bottom:16px;"></div>

        <div style="margin-bottom:16px;">
          <label class="field-label">Full name</label>
          <input id="r-name" type="text" class="field-input" placeholder="Sophie Laurent"
            autocomplete="name">
        </div>
        <div style="margin-bottom:16px;">
          <label class="field-label">Email</label>
          <input id="r-email" type="email" class="field-input" placeholder="you@example.com"
            autocomplete="email" inputmode="email">
        </div>
        <div style="margin-bottom:24px;">
          <label class="field-label">Password</label>
          <input id="r-pw" type="password" class="field-input" placeholder="Min. 6 characters"
            autocomplete="new-password">
        </div>

        <button id="r-btn" class="btn btn-primary btn-lg btn-full">Create Account</button>

        <div style="text-align:center;margin-top:18px;">
          <a href="#/login" style="color:#1E2643;font-size:14px;font-weight:500;
            text-decoration:none;">← Back to sign in</a>
        </div>
      </div>
    </div>
  `;

  container.querySelector('#r-btn').addEventListener('click', () => {
    const name  = container.querySelector('#r-name').value;
    const email = container.querySelector('#r-email').value;
    const pw    = container.querySelector('#r-pw').value;
    const errEl = container.querySelector('#reg-err');
    const res   = register(name, email, pw);
    if (res.ok) {
      navigate('/guest/dashboard');
    } else {
      errEl.innerHTML = `<div class="err-box">${res.error}</div>`;
      errEl.style.display = 'block';
    }
  });
}
