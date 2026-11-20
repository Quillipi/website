// Quillipi's homepage: the menu on phones, the line under the nav, the section the nav marks, and
// the notebook page in the hero. Everything on the page works without this file.
'use strict';

const calm = matchMedia('(prefers-reduced-motion: reduce)');

// The nav gets a line once the page moves.
const nav = document.getElementById('nav');
const onScroll = () => nav.classList.toggle('scrolled', scrollY > 8);
addEventListener('scroll', onScroll, { passive: true });
onScroll();

// The menu on phones.
(() => {
  const button = document.getElementById('menu');
  const list = document.getElementById('nav-links');
  if (!button || !list) return;
  button.hidden = false;
  const set = (open) => {
    button.setAttribute('aria-expanded', String(open));
    list.classList.toggle('open', open);
  };
  button.addEventListener('click', () => set(button.getAttribute('aria-expanded') !== 'true'));
  list.addEventListener('click', (event) => { if (event.target.closest('a')) set(false); });
  addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && button.getAttribute('aria-expanded') === 'true') { set(false); button.focus(); }
  });
  matchMedia('(min-width: 861px)').addEventListener('change', () => set(false));
})();

// The nav marks the section on screen.
(() => {
  const links = [...document.querySelectorAll('#nav-links a[href^="#"]')];
  const sections = links.map((link) => document.querySelector(link.getAttribute('href'))).filter(Boolean);
  if (!('IntersectionObserver' in window) || !sections.length) return;
  const seen = new Map();
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) seen.set(entry.target.id, entry.isIntersecting);
    const current = sections.find((section) => seen.get(section.id));
    for (const link of links) {
      if (current && link.getAttribute('href') === `#${current.id}`) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    }
  }, { rootMargin: '-35% 0px -55% 0px' });
  for (const section of sections) observer.observe(section);
})();

// The notebook page in the hero: Claude writes its change, then you commit it or undo it.
(() => {
  const para = document.getElementById('demo-para');
  if (!para) return;
  const state = document.getElementById('demo-state');
  const msg = document.getElementById('demo-msg');
  const log = document.getElementById('demo-log');
  const undo = document.getElementById('demo-undo');
  const commit = document.getElementById('demo-commit');
  const reset = document.getElementById('demo-reset');
  const before = 'Teams pay per seat, $15 a person.';
  const after = 'Teams pay one flat price, so adding a person never changes the bill.';
  const who = 'Claude via Claude Code · not committed';
  let timer = 0;
  let observer = null; // waits for the page to come on screen, until someone uses the buttons first

  const el = (tag, text, className) => {
    const node = document.createElement(tag);
    if (text) node.textContent = text;
    if (className) node.className = className;
    return node;
  };
  const setState = (ok, text) => {
    state.replaceChildren(el('span', '', ok ? 'dot ok' : 'dot'), document.createTextNode(text));
  };
  const showChange = () => {
    para.replaceChildren(el('del', before), document.createTextNode(' '), el('ins', after), el('span', who, 'who'));
    para.classList.add('changed');
  };
  const buttons = (writing) => {
    undo.hidden = commit.hidden = false;
    reset.hidden = true;
    undo.disabled = commit.disabled = writing;
  };

  // Claude's edit writes itself in, a few letters at a time. People who asked for less motion,
  // and browsers that hide the tab, get the finished change at once.
  const play = () => {
    clearTimeout(timer);
    buttons(true);
    setState(false, '1 change not committed');
    msg.textContent = 'Claude is changing one paragraph…';
    if (calm.matches || document.hidden) {
      showChange();
      buttons(false);
      msg.textContent = 'Claude changed one paragraph. Nothing else was touched.';
      return;
    }
    para.classList.remove('drawn');
    para.classList.add('changed');
    void para.offsetWidth;
    para.classList.add('drawn');
    const del = el('del', before);
    const ins = el('ins', '');
    const caret = el('span', '', 'caret');
    para.setAttribute('aria-busy', 'true');
    para.replaceChildren(del, document.createTextNode(' '), ins, caret);
    let shown = 0;
    const step = () => {
      shown = Math.min(after.length, shown + 2);
      ins.textContent = after.slice(0, shown);
      if (shown < after.length) { timer = setTimeout(step, 28); return; }
      caret.remove();
      para.append(el('span', who, 'who'));
      para.removeAttribute('aria-busy');
      buttons(false);
      msg.textContent = 'Claude changed one paragraph. Nothing else was touched.';
    };
    timer = setTimeout(step, 700);
  };

  const done = (text, stateText) => {
    observer?.disconnect();
    clearTimeout(timer);
    para.classList.remove('changed', 'drawn');
    para.removeAttribute('aria-busy');
    setState(true, stateText);
    msg.textContent = text;
    undo.hidden = commit.hidden = true;
    reset.hidden = false;
    reset.focus({ preventScroll: true });
  };

  commit.addEventListener('click', () => {
    para.textContent = after;
    const li = el('li', '', 'new');
    li.append(el('span', '#42', 'n'), el('span', 'Switch teams to one flat price'), el('span', 'Claude via Claude Code · just now', 'by claude'));
    log.prepend(li);
    done('Committed as #42. The commit names Claude as the AI that made it.', 'Everything is committed');
  });
  undo.addEventListener('click', () => {
    para.textContent = before;
    done('Undone. The paragraph is back the way you wrote it.', 'Nothing to commit');
  });
  reset.addEventListener('click', () => {
    log.querySelector('li.new')?.remove();
    play();
    commit.focus({ preventScroll: true });
  });

  // Start when the page is on screen, so a visitor sees the edit happen.
  const page = document.getElementById('demo');
  if ('IntersectionObserver' in window && !calm.matches) {
    observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) { observer.disconnect(); play(); }
    }, { threshold: 0.4 });
    observer.observe(page);
  } else {
    buttons(false);
  }
})();
