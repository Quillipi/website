// The setup guide (start.html): ticking steps off, remembering them, the GitHub username shown in
// step 3, and opening the address Cloudflare gives. Everything is kept in this browser only. The
// page works without this file: every step is open and nothing is ticked.
'use strict';

(() => {
  const KEY = 'quillipi-start';
  const steps = [...document.querySelectorAll('.gstep')].filter((step) => !step.hidden);
  if (!steps.length) return;

  // Storage can be missing or refused (private windows, blocked cookies); the page still works.
  const load = () => {
    try { return JSON.parse(localStorage.getItem(KEY)) ?? {}; } catch { return {}; }
  };
  const state = { done: {}, user: '', address: '', ...load() };
  const save = () => {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* kept for this visit only */ }
  };

  const progress = document.getElementById('progress');
  const progressText = document.getElementById('progress-text');
  const progressBar = document.getElementById('progress-bar');
  const end = document.getElementById('end');
  progress.hidden = false;
  progressBar.max = steps.length;

  const parts = (step) => ({
    body: step.querySelector('.gbody'),
    toggle: step.querySelector('.gtoggle'),
    heading: step.querySelector('h2'),
  });

  const open = (step, isOpen) => {
    const { body, toggle } = parts(step);
    body.hidden = !isOpen;
    toggle.setAttribute('aria-expanded', String(isOpen));
    toggle.textContent = isOpen ? 'Hide' : 'Show';
  };

  const render = () => {
    const count = steps.filter((step) => state.done[step.dataset.step]).length;
    progressText.textContent = `${count} of ${steps.length} steps done`;
    progressBar.value = count;
    end.hidden = count < steps.length;
    for (const step of steps) {
      const done = Boolean(state.done[step.dataset.step]);
      step.classList.toggle('done', done);
      parts(step).toggle.hidden = !done;
      for (const button of step.querySelectorAll('.gdone')) {
        button.hidden = done && button.dataset.had === 'true';
        if (!button.dataset.label) button.dataset.label = button.textContent;
        button.textContent = done && !button.dataset.had ? 'Not done yet' : button.dataset.label;
      }
    }
  };

  // Done steps fold away, and the first step not done stays open.
  const fold = () => {
    for (const step of steps) open(step, !state.done[step.dataset.step]);
  };

  const next = (after) => steps.slice(steps.indexOf(after) + 1).find((step) => !state.done[step.dataset.step])
    ?? steps.find((step) => !state.done[step.dataset.step]);

  for (const step of steps) {
    step.querySelector('.gactions').hidden = false;
    parts(step).toggle.addEventListener('click', () => open(step, parts(step).body.hidden));
    for (const button of step.querySelectorAll('.gdone')) {
      button.addEventListener('click', () => {
        const id = step.dataset.step;
        if (state.done[id] && !button.dataset.had) {
          delete state.done[id];
          save();
          render();
          return;
        }
        state.done[id] = true;
        save();
        render();
        open(step, false);
        const following = next(step);
        const target = following ? parts(following).heading : end.querySelector('h2');
        if (following) open(following, true);
        target.focus({ preventScroll: true });
        (following ?? end).scrollIntoView({ block: 'start' });
      });
    }
  }

  document.getElementById('reset').addEventListener('click', () => {
    state.done = {};
    save();
    render();
    fold();
    steps[0].scrollIntoView({ block: 'start' });
    parts(steps[0]).heading.focus({ preventScroll: true });
  });

  // The GitHub username: typed in step 1, shown in step 3 where it goes into GITHUB_USER_LOGIN.
  // GitHub's rule: letters, numbers and single hyphens inside, at most 39 characters.
  const userInput = document.getElementById('gh-user');
  const userNote = document.getElementById('gh-user-note');
  const userNoteText = userNote.textContent;
  const validUser = /^[A-Za-z0-9](?:[A-Za-z0-9]|-(?=[A-Za-z0-9])){0,38}$/;
  const showUser = () => {
    const user = userInput.value.trim().replace(/^@/, '');
    const ok = validUser.test(user);
    for (const slot of document.querySelectorAll('.js-user')) slot.textContent = ok ? user : slot.dataset.empty;
    userNote.textContent = user && !ok
      ? 'A GitHub username has only letters, numbers and single hyphens, and no spaces.'
      : userNoteText;
    return ok ? user : '';
  };
  userInput.value = state.user;
  showUser();
  userInput.addEventListener('input', () => {
    state.user = showUser();
    save();
  });

  // The address from the build log. People copy it with extra bits, or without https://.
  const opener = document.getElementById('opener');
  const addressInput = document.getElementById('qp-address');
  const openLink = document.getElementById('qp-open');
  const addressNote = document.getElementById('qp-note');
  const addressNoteText = addressNote.textContent;
  const toAddress = (text) => {
    const found = text.trim().match(/(?:https?:\/\/)?([a-z0-9-]+(?:\.[a-z0-9-]+)*\.workers\.dev)\b/i);
    return found ? `https://${found[1].toLowerCase()}/` : '';
  };
  const showAddress = () => {
    const address = toAddress(addressInput.value);
    openLink.href = address || '#opener';
    openLink.setAttribute('aria-disabled', String(!address));
    addressNote.textContent = addressInput.value.trim() && !address
      ? "That isn't a .workers.dev address yet. Copy the line from the build log that ends with .workers.dev."
      : addressNoteText;
    return address;
  };
  opener.hidden = false;
  addressInput.value = state.address;
  showAddress();
  addressInput.addEventListener('input', () => {
    state.address = showAddress() ? addressInput.value.trim() : '';
    save();
  });
  addressInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && showAddress()) openLink.click();
  });
  openLink.addEventListener('click', (event) => {
    if (!showAddress()) { event.preventDefault(); addressInput.focus(); }
  });

  render();
  fold();
  // Coming back after a break: start where they stopped.
  const firstOpen = steps.find((step) => !state.done[step.dataset.step]);
  if (Object.keys(state.done).length && firstOpen && !location.hash) firstOpen.scrollIntoView({ block: 'start' });
})();
