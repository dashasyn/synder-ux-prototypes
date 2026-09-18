/**
 * Hub local hide + mark-for-git-delete.
 * Hides cards in this browser (localStorage); lists paths for Ignat to tell Main to purge from the repo.
 * No tokens / no client push.
 */
(function () {
  var LS_KEY = 'synder-hub-pending-deletes';

  function loadPending() {
    try {
      var raw = localStorage.getItem(LS_KEY);
      var list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (e) {
      return [];
    }
  }

  function savePending(list) {
    localStorage.setItem(LS_KEY, JSON.stringify(list));
  }

  function stablePath(href) {
    if (!href) return null;
    var m = String(href).match(/(prototypes\/[^?#]+)/);
    if (!m) return null;
    return m[1].replace(/\/?$/, '/');
  }

  function isPending(path) {
    return loadPending().some(function (item) { return item.path === path; });
  }

  function markPending(path, title) {
    var list = loadPending().filter(function (item) { return item.path !== path; });
    list.push({ path: path, title: title || path });
    savePending(list);
  }

  function unmarkPending(path) {
    savePending(loadPending().filter(function (item) { return item.path !== path; }));
  }

  function injectStyles() {
    if (document.getElementById('hub-delete-styles')) return;
    var style = document.createElement('style');
    style.id = 'hub-delete-styles';
    style.textContent = [
      '.card-item { position: relative; }',
      '.card-item .card { height: 100%; padding-right: 36px; }',
      '.card-trash {',
      '  position: absolute; top: 6px; right: 6px; z-index: 2;',
      '  width: 28px; height: 28px; padding: 0;',
      '  border: none; border-radius: 6px;',
      '  background: transparent; color: #9a9a96;',
      '  font-size: 14px; line-height: 1; cursor: pointer;',
      '  opacity: 0.45; transition: opacity 0.15s ease, background 0.15s ease, color 0.15s ease;',
      '}',
      '.card-item:hover .card-trash, .card-trash:focus-visible { opacity: 1; }',
      '.card-trash:hover, .card-trash:focus-visible {',
      '  background: #f3f3f1; color: #b91c1c;',
      '}',
      '.card-item.is-hidden { display: none; }',
      '.pending-panel {',
      '  margin: 0 0 24px;',
      '  padding: 12px 14px;',
      '  background: #fffbeb;',
      '  border: 1px solid #fde68a;',
      '  border-radius: 8px;',
      '  font-size: 14px;',
      '}',
      '.pending-panel[hidden] { display: none !important; }',
      '.pending-panel h2 {',
      '  font-size: 14px; font-weight: 650; text-transform: none;',
      '  letter-spacing: 0; color: #92400e; margin: 0 0 8px;',
      '}',
      '.pending-panel .pending-copy {',
      '  margin: 0 0 8px; color: #5c5c5c; font-size: 14px;',
      '}',
      '.pending-panel .pending-paths {',
      '  margin: 0 0 10px; padding: 8px 10px;',
      '  background: #fff; border: 1px solid #fde68a; border-radius: 6px;',
      '  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;',
      '  font-size: 14px; color: #1a1a1a; white-space: pre-wrap; word-break: break-all;',
      '}',
      '.pending-list { list-style: none; padding: 0; margin: 0; }',
      '.pending-list li {',
      '  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;',
      '  padding: 4px 0; border-top: 1px solid #fde68a;',
      '}',
      '.pending-list li:first-child { border-top: none; }',
      '.pending-list .pending-title { flex: 1; min-width: 120px; color: #1a1a1a; }',
      '.pending-list .pending-path { color: #5c5c5c; font-size: 14px; }',
      '.pending-undo {',
      '  font-size: 14px; font-weight: 500; color: #2563eb;',
      '  background: none; border: none; padding: 0; cursor: pointer;',
      '  text-decoration: underline;',
      '}',
      '.pending-undo:hover { color: #1d4ed8; }'
    ].join('\n');
    document.head.appendChild(style);
  }

  function ensurePanel() {
    var panel = document.getElementById('pending-deletes');
    if (panel) return panel;
    panel = document.createElement('aside');
    panel.id = 'pending-deletes';
    panel.className = 'pending-panel';
    panel.setAttribute('hidden', '');
    panel.setAttribute('aria-label', 'Marked for delete');
    var wrap = document.querySelector('.wrap');
    if (!wrap) return null;
    var intro = wrap.querySelector('.intro');
    if (intro && intro.nextSibling) {
      wrap.insertBefore(panel, intro.nextSibling);
    } else if (wrap.firstChild) {
      wrap.insertBefore(panel, wrap.firstChild.nextSibling);
    } else {
      wrap.appendChild(panel);
    }
    return panel;
  }

  function renderPanel() {
    var panel = ensurePanel();
    if (!panel) return;
    var list = loadPending();
    if (!list.length) {
      panel.setAttribute('hidden', '');
      panel.innerHTML = '';
      return;
    }
    panel.removeAttribute('hidden');
    var paths = list.map(function (item) { return item.path; }).join('\n');
    var itemsHtml = list.map(function (item) {
      return (
        '<li>' +
          '<span class="pending-title">' + escapeHtml(item.title) + '</span>' +
          '<code class="pending-path">' + escapeHtml(item.path) + '</code>' +
          '<button type="button" class="pending-undo" data-path="' + escapeAttr(item.path) + '">Undo</button>' +
        '</li>'
      );
    }).join('');
    panel.innerHTML =
      '<h2>Manage / Pending deletes (' + list.length + ')</h2>' +
      '<p class="pending-copy">Tell Main: delete these from the hub</p>' +
      '<pre class="pending-paths">' + escapeHtml(paths) + '</pre>' +
      '<ul class="pending-list">' + itemsHtml + '</ul>';

    panel.querySelectorAll('.pending-undo').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var path = btn.getAttribute('data-path');
        unmarkPending(path);
        applyVisibility();
        renderPanel();
      });
    });
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function escapeAttr(s) {
    return escapeHtml(s).replace(/'/g, '&#39;');
  }

  function applyVisibility() {
    document.querySelectorAll('.card-item[data-proto-path]').forEach(function (item) {
      var path = item.getAttribute('data-proto-path');
      if (isPending(path)) item.classList.add('is-hidden');
      else item.classList.remove('is-hidden');
    });
  }

  function enhanceCards() {
    document.querySelectorAll('a.card:not(.card-folder)').forEach(function (card) {
      var path = stablePath(card.getAttribute('href'));
      if (!path) return;
      if (card.closest('.card-item')) return;

      var li = card.closest('li');
      if (!li) return;

      li.classList.add('card-item');
      li.setAttribute('data-proto-path', path);

      var titleEl = card.querySelector('.card-title');
      var title = titleEl ? titleEl.textContent.trim() : path;

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'card-trash';
      btn.setAttribute('aria-label', 'Hide and mark for delete: ' + title);
      btn.setAttribute('title', 'Hide from your view');
      btn.textContent = '🗑';
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var ok = window.confirm(
          'Hide from your view? Still live for others until removed from the hub.'
        );
        if (!ok) return;
        markPending(path, title);
        applyVisibility();
        renderPanel();
      });
      li.appendChild(btn);
    });
  }

  function init() {
    injectStyles();
    enhanceCards();
    applyVisibility();
    renderPanel();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
