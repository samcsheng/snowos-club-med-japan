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
        <div style="font-size:11px;color:#999;letter-spacing:1.8px;text-transform:uppercase;
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
          <button id="demo-toggle" style="background:none;border:none;cursor:pointer;
            color:#AAA;font-size:12px;font-family:'Inter',sans-serif;width:100%;
            display:flex;align-items:center;justify-content:center;gap:5px;padding:0;">
            <span id="demo-arrow" style="font-size:9px;">▶</span> Demo accounts
          </button>
          <div id="demo-creds" style="display:none;margin-top:12px;background:rgba(30,38,67,0.04);
            border-radius:8px;padding:14px 16px;font-size:13px;color:#333;
            font-family:'Inter',sans-serif;line-height:2;">
            <div><strong style="color:#1E2643;font-weight:600;">Guest</strong>&ensp;guest@snowos.com&ensp;/&ensp;guest123</div>
            <div><strong style="color:#1E2643;font-weight:600;">Instructor</strong>&ensp;instructor@snowos.com&ensp;/&ensp;inst123</div>
            <div><strong style="color:#1E2643;font-weight:600;">Supervisor</strong>&ensp;supervisor@snowos.com&ensp;/&ensp;sup123</div>
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

  container.querySelector('#demo-toggle').addEventListener('click', () => {
    const el  = container.querySelector('#demo-creds');
    const arr = container.querySelector('#demo-arrow');
    const vis = el.style.display !== 'none';
    el.style.display  = vis ? 'none' : 'block';
    arr.textContent   = vis ? '▶' : '▼';
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
        <div style="font-size:11px;color:#999;letter-spacing:1.8px;text-transform:uppercase;
          margin-top:6px;">Create Account</div>
      </div>

      <div class="glass-strong" style="width:100%;max-width:400px;padding:32px 28px;">
        <h2 style="font-family:'Newsreader',serif;font-size:26px;font-weight:700;
          color:#000;margin:0 0 6px;">Join SnowOS</h2>
        <p style="color:#888;font-size:14px;margin:0 0 24px;">Your ski school account gives you access to book group lessons on the mountain.</p>

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
