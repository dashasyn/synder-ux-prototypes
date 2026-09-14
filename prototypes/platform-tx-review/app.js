/* Platform transactions — Draft B prototype (groups → tabs) */
(function () {
  'use strict';

  /** Conceptual "today" so April 2026 sketch dates sit near Last 90 days edge */
  const TODAY = new Date('2026-04-20T12:00:00');

  const STATUS_META = {
    failed: { label: 'Failed', group: 'needs-attention', pill: 'status-red' },
    'rollback-failed': { label: 'Rollback failed', group: 'needs-attention', pill: 'status-red' },
    'rule-failed': { label: 'Rule failed', group: 'needs-attention', pill: 'status-red' },
    'not-parsed': { label: 'Not parsed', group: 'needs-attention', pill: 'status-red' },
    canceled: { label: 'Canceled', group: 'needs-attention', pill: 'status-yellow' },
    'rollback-canceled': { label: 'Rollback canceled', group: 'needs-attention', pill: 'status-yellow' },
    'synced-with-warnings': { label: 'Synced with warnings', group: 'needs-attention', pill: 'status-yellow' },
    'ready-to-sync': { label: 'Ready to sync', group: 'ready', pill: 'status-blue' },
    syncing: { label: 'Syncing', group: 'in-progress', pill: 'status-blue' },
    'rollback-in-progress': { label: 'Rollback in progress', group: 'in-progress', pill: 'status-purple' },
    synced: { label: 'Synced', group: 'successful', pill: 'status-green' },
    skipped: { label: 'Skipped', group: 'not-synced', pill: 'status-grey' },
    excluded: { label: 'Excluded', group: 'not-synced', pill: 'status-grey' },
    deleted: { label: 'Deleted', group: 'deleted', pill: 'status-black' },
  };

  const TABS = [
    { id: 'all', label: 'All' },
    { id: 'needs-attention', label: 'Needs attention', alert: true },
    { id: 'ready', label: 'Ready to sync' },
    { id: 'in-progress', label: 'In progress' },
    { id: 'successful', label: 'Successful' },
    { id: 'not-synced', label: 'Not synced' },
    { id: 'deleted', label: 'Deleted' },
  ];

  const DATE_LABELS = {
    '30': 'Last 30 days',
    '90': 'Last 90 days',
    '365': 'Last year',
    all: 'All dates',
  };

  /** ~32 realistic rows spanning all groups */
  const TRANSACTIONS = [
    // Needs attention (8)
    { id: 'ch_3TKnP2E4pygkgelb1a9mOX', account: 'mzkt.by', platform: 'Stripe', name: 'Nadia Rahman', type: 'Invoice payment', amount: 340.0, currency: 'USD', date: '2026-04-14T09:12:00', status: 'rollback-failed' },
    { id: 'ord_9012CHG', account: 'Changolivia', platform: 'Shopify', name: 'Changolivia', type: 'Order', amount: 128.5, currency: 'USD', date: '2026-04-13T16:40:00', status: 'rule-failed' },
    { id: 'ch_3TKmC1E4pygkgelb1ha9mOZ', account: 'mzkt.by', platform: 'Stripe', name: 'Elena Voss', type: 'Subscription payment', amount: 49.0, currency: 'USD', date: '2026-04-12T11:05:00', status: 'canceled' },
    { id: 'po_1PayoutNA01', account: 'mzkt.by', platform: 'Stripe', name: null, type: 'Payout', amount: -890.25, currency: 'USD', date: '2026-04-11T08:22:00', status: 'not-parsed' },
    { id: 're_3TRefundFail', account: 'mzkt.by', platform: 'Stripe', name: 'Marcus Lee', type: 'Refund', amount: -24.0, currency: 'USD', date: '2026-04-10T14:18:00', status: 'failed' },
    { id: 'inv_CHG4412', account: 'Changolivia', platform: 'Shopify', name: 'Sofia Berg', type: 'Invoice payment', amount: 210.0, currency: 'USD', date: '2026-04-09T19:33:00', status: 'synced-with-warnings' },
    { id: 'ch_3TRollCancel', account: 'mzkt.by', platform: 'Stripe', name: 'Omar Haddad', type: 'Subscription payment', amount: 99.0, currency: 'USD', date: '2026-04-08T07:01:00', status: 'rollback-canceled' },
    { id: 'ord_7788CHG', account: 'Changolivia', platform: 'Shopify', name: 'Ivy Chen', type: 'Order', amount: 67.4, currency: 'USD', date: '2026-03-28T12:45:00', status: 'failed' },

    // Ready to sync (7)
    { id: 'ch_3TKmC1E4pygkgelb1ha9mOZQ', account: 'mzkt.by', platform: 'Stripe', name: 'Pamela Andersen', type: 'Subscription payment', amount: 30.0, currency: 'USD', date: '2026-04-11T00:02:00', status: 'ready-to-sync' },
    { id: 'po_1ReadyPay02', account: 'mzkt.by', platform: 'Stripe', name: null, type: 'Payout', amount: -412.8, currency: 'USD', date: '2026-04-10T22:10:00', status: 'ready-to-sync' },
    { id: 're_3TReadyRef', account: 'mzkt.by', platform: 'Stripe', name: 'Jonas Pike', type: 'Refund', amount: -4.4, currency: 'USD', date: '2026-04-10T15:20:00', status: 'ready-to-sync' },
    { id: 'ord_READY01', account: 'Changolivia', platform: 'Shopify', name: 'Lina Ortiz', type: 'Order', amount: 156.0, currency: 'USD', date: '2026-04-09T10:11:00', status: 'ready-to-sync' },
    { id: 'inv_READY02', account: 'Changolivia', platform: 'Shopify', name: 'Tom Hughes', type: 'Invoice payment', amount: 88.0, currency: 'USD', date: '2026-04-08T18:00:00', status: 'ready-to-sync' },
    { id: 'ch_3TReadySub', account: 'mzkt.by', platform: 'Stripe', name: 'Ava Moreau', type: 'Subscription payment', amount: 19.99, currency: 'USD', date: '2026-04-07T09:30:00', status: 'ready-to-sync' },
    { id: 'ord_READY03', account: 'Changolivia', platform: 'Shopify', name: 'Noah Kim', type: 'Order', amount: 42.25, currency: 'USD', date: '2026-03-25T13:14:00', status: 'ready-to-sync' },

    // In progress (6)
    { id: 'ch_3TSyncing01', account: 'mzkt.by', platform: 'Stripe', name: 'Grace Park', type: 'Subscription payment', amount: 59.0, currency: 'USD', date: '2026-04-14T06:40:00', status: 'syncing' },
    { id: 'ord_SYNC02', account: 'Changolivia', platform: 'Shopify', name: 'Ethan Brooks', type: 'Order', amount: 301.1, currency: 'USD', date: '2026-04-13T21:05:00', status: 'syncing' },
    { id: 'po_1SyncPay', account: 'mzkt.by', platform: 'Stripe', name: null, type: 'Payout', amount: -1200.0, currency: 'USD', date: '2026-04-12T04:55:00', status: 'syncing' },
    { id: 'ch_3TRollProg', account: 'mzkt.by', platform: 'Stripe', name: 'Mia Santos', type: 'Invoice payment', amount: 175.0, currency: 'USD', date: '2026-04-11T17:22:00', status: 'rollback-in-progress' },
    { id: 're_3TRollProg2', account: 'Changolivia', platform: 'Shopify', name: 'Leo Tran', type: 'Refund', amount: -18.5, currency: 'USD', date: '2026-04-10T11:48:00', status: 'rollback-in-progress' },
    { id: 'inv_SYNC06', account: 'mzkt.by', platform: 'Stripe', name: 'Clara Nunez', type: 'Invoice payment', amount: 64.0, currency: 'USD', date: '2026-03-22T08:09:00', status: 'syncing' },

    // Successful (6)
    { id: 'ch_3TSynced01', account: 'mzkt.by', platform: 'Stripe', name: 'Henry Cole', type: 'Subscription payment', amount: 30.0, currency: 'USD', date: '2026-04-14T01:15:00', status: 'synced' },
    { id: 'ord_OK02', account: 'Changolivia', platform: 'Shopify', name: 'Yuki Tanaka', type: 'Order', amount: 92.75, currency: 'USD', date: '2026-04-12T14:00:00', status: 'synced' },
    { id: 'po_1SyncedPay', account: 'mzkt.by', platform: 'Stripe', name: null, type: 'Payout', amount: -650.4, currency: 'USD', date: '2026-04-09T23:40:00', status: 'synced' },
    { id: 'inv_OK04', account: 'Changolivia', platform: 'Shopify', name: 'Priya Shah', type: 'Invoice payment', amount: 440.0, currency: 'USD', date: '2026-04-06T12:12:00', status: 'synced' },
    { id: 're_3TSyncedRef', account: 'mzkt.by', platform: 'Stripe', name: 'Dan Weber', type: 'Refund', amount: -12.0, currency: 'USD', date: '2026-03-30T16:33:00', status: 'synced' },
    { id: 'ch_3TSynced06', account: 'mzkt.by', platform: 'Stripe', name: 'Rosa Diaz', type: 'Subscription payment', amount: 15.0, currency: 'USD', date: '2026-03-18T10:20:00', status: 'synced' },

    // Not synced (2)
    { id: 'ch_3TSkipped01', account: 'mzkt.by', platform: 'Stripe', name: 'Test Account', type: 'Subscription payment', amount: 1.0, currency: 'USD', date: '2026-04-05T09:00:00', status: 'skipped' },
    { id: 'ord_EXCL02', account: 'Changolivia', platform: 'Shopify', name: 'Internal Sample', type: 'Order', amount: 0.5, currency: 'USD', date: '2026-04-03T11:11:00', status: 'excluded' },

    // Deleted (2)
    { id: 'ch_3TDeleted01', account: 'mzkt.by', platform: 'Stripe', name: 'Archived User', type: 'Invoice payment', amount: 55.0, currency: 'USD', date: '2026-03-15T08:08:00', status: 'deleted' },
    { id: 'ord_DEL02', account: 'Changolivia', platform: 'Shopify', name: 'Removed Store', type: 'Order', amount: 33.0, currency: 'USD', date: '2026-03-10T19:19:00', status: 'deleted' },

    // Outside 90-day window (from TODAY 2026-04-20 → before ~2026-01-20)
    { id: 'ch_3TOldFail', account: 'mzkt.by', platform: 'Stripe', name: 'Old Customer', type: 'Subscription payment', amount: 120.0, currency: 'USD', date: '2026-01-05T10:00:00', status: 'failed' },
    { id: 'ord_OLDReady', account: 'Changolivia', platform: 'Shopify', name: 'Winter Sale', type: 'Order', amount: 250.0, currency: 'USD', date: '2025-12-20T15:30:00', status: 'ready-to-sync' },
  ];

  // ——— state ———
  const state = {
    tab: 'all',
    search: '',
    sortKey: 'date',
    sortDir: 'desc',
    selected: new Set(),
    filters: {
      dateRange: '90',
      platform: '',
      type: '',
      amountMin: '',
      amountMax: '',
      customer: '',
      failureReasons: [],
    },
    draft: null,
  };

  // ——— DOM ———
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  const els = {
    tabs: $('#tabs'),
    tbody: $('#tx-tbody'),
    selectAll: $('#select-all'),
    search: $('#search-input'),
    chips: $('#filter-chips'),
    filtersBadge: $('#filters-badge'),
    bulkBar: $('#bulk-bar'),
    bulkCount: $('#bulk-count'),
    bulkSync: $('#bulk-sync'),
    bulkRollback: $('#bulk-rollback'),
    bulkExport: $('#bulk-export'),
    bulkClear: $('#bulk-clear'),
    tablePanel: $('#table-panel'),
    empty: $('#empty-state'),
    sheet: $('#side-sheet'),
    overlay: $('#sheet-overlay'),
    toast: $('#toast'),
    dateModal: $('#date-modal'),
  };

  // ——— helpers ———
  function groupOf(row) {
    return (STATUS_META[row.status] || {}).group || 'all';
  }

  function parseDate(iso) {
    return new Date(iso);
  }

  function formatDate(iso) {
    const d = parseDate(iso);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const pad = (n) => String(n).padStart(2, '0');
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function formatAmount(amount, currency) {
    const abs = Math.abs(amount).toFixed(2);
    const sign = amount < 0 ? '-' : '';
    return `${sign}$${abs} ${currency}`;
  }

  function daysAgo(n) {
    const d = new Date(TODAY);
    d.setDate(d.getDate() - n);
    return d;
  }

  function inDateRange(iso, range) {
    if (range === 'all') return true;
    const days = Number(range);
    const cutoff = daysAgo(days);
    return parseDate(iso) >= cutoff;
  }

  function readTabFromUrl() {
    const q = new URLSearchParams(location.search);
    const t = q.get('tab');
    if (t && TABS.some((x) => x.id === t)) return t;
    return 'all';
  }

  function writeTabToUrl(tab) {
    const url = new URL(location.href);
    if (tab === 'all') url.searchParams.delete('tab');
    else url.searchParams.set('tab', tab);
    history.replaceState(null, '', url);
  }

  function toast(msg) {
    els.toast.textContent = msg;
    els.toast.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => els.toast.classList.remove('show'), 2200);
  }

  // ——— filtering / sorting ———
  function matchesFilters(row, f) {
    if (!inDateRange(row.date, f.dateRange)) return false;
    if (f.platform && row.platform !== f.platform) return false;
    if (f.type && row.type !== f.type) return false;
    if (f.customer) {
      const c = (row.name || '').toLowerCase();
      if (!c.includes(f.customer.toLowerCase())) return false;
    }
    if (f.amountMin !== '' && !Number.isNaN(Number(f.amountMin))) {
      if (row.amount < Number(f.amountMin)) return false;
    }
    if (f.amountMax !== '' && !Number.isNaN(Number(f.amountMax))) {
      if (row.amount > Number(f.amountMax)) return false;
    }
    if (f.failureReasons && f.failureReasons.length) {
      if (!f.failureReasons.includes(row.status)) return false;
    }
    return true;
  }

  function matchesSearch(row, q) {
    if (!q) return true;
    const s = q.toLowerCase();
    return (
      (row.name || '').toLowerCase().includes(s) ||
      row.id.toLowerCase().includes(s) ||
      row.type.toLowerCase().includes(s) ||
      row.account.toLowerCase().includes(s)
    );
  }

  function baseFiltered() {
    return TRANSACTIONS.filter(
      (r) => matchesFilters(r, state.filters) && matchesSearch(r, state.search)
    );
  }

  function tabCounts() {
    const rows = baseFiltered();
    const counts = { all: rows.length };
    TABS.forEach((t) => {
      if (t.id === 'all') return;
      counts[t.id] = rows.filter((r) => groupOf(r) === t.id).length;
    });
    return counts;
  }

  function visibleRows() {
    let rows = baseFiltered();
    if (state.tab !== 'all') {
      rows = rows.filter((r) => groupOf(r) === state.tab);
    }
    const dir = state.sortDir === 'asc' ? 1 : -1;
    rows = rows.slice().sort((a, b) => {
      if (state.sortKey === 'amount') return (a.amount - b.amount) * dir;
      return (parseDate(a.date) - parseDate(b.date)) * dir;
    });
    return rows;
  }

  // ——— render ———
  function renderTabs() {
    const counts = tabCounts();
    els.tabs.innerHTML = TABS.map((t) => {
      const active = state.tab === t.id ? ' active' : '';
      const alert = t.alert && counts[t.id] > 0 ? ' tab-count--alert' : '';
      return `<button type="button" class="tab synder-tab${active}" role="tab" data-tab="${t.id}" aria-selected="${state.tab === t.id}">
        ${t.label}<span class="tab-count${alert}">${counts[t.id]}</span>
      </button>`;
    }).join('');
  }

  function statusCell(row) {
    const meta = STATUS_META[row.status];
    const group = meta.group;
    const quiet =
      state.tab === 'ready' ||
      state.tab === 'successful' ||
      state.tab === 'in-progress';
    if (quiet) {
      return `<span class="status status-muted">${meta.label}</span>`;
    }
    return `<span class="status ${meta.pill}">${meta.label}</span>`;
  }

  function actionFor(row) {
    const g = groupOf(row);
    if (g === 'ready') return `<button type="button" class="btn-text-plain row-action" data-action="sync" data-id="${row.id}">Sync</button>`;
    if (g === 'needs-attention' || g === 'successful') {
      return `<button type="button" class="btn-text-plain row-action" data-action="explain" data-id="${row.id}">Explain</button>`;
    }
    return `<button type="button" class="btn-text-plain row-action" data-action="more" data-id="${row.id}">···</button>`;
  }

  function txInfo(row) {
    if (row.type === 'Payout' && !row.name) {
      return `<div class="tx-info-primary">Payout</div>
        <span class="tx-info-secondary"><a class="tx-id-link" href="#">${escapeHtml(row.id)}</a></span>`;
    }
    return `<div class="tx-info-primary">${escapeHtml(row.name || '—')}</div>
      <span class="tx-info-secondary"><a class="tx-id-link" href="#">${escapeHtml(row.id)}</a></span>`;
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderTable() {
    const rows = visibleRows();
    const ids = new Set(rows.map((r) => r.id));
    // drop selections no longer visible
    state.selected.forEach((id) => {
      if (!ids.has(id)) state.selected.delete(id);
    });

    if (!rows.length) {
      els.tablePanel.classList.add('has-empty');
      els.empty.classList.add('visible');
      els.tbody.innerHTML = '';
    } else {
      els.tablePanel.classList.remove('has-empty');
      els.empty.classList.remove('visible');
      els.tbody.innerHTML = rows
        .map((row) => {
          const checked = state.selected.has(row.id) ? ' checked' : '';
          const selected = state.selected.has(row.id) ? ' row-selected' : '';
          const mark = row.platform === 'Stripe' ? 'S' : 'Sh';
          const markCls = row.platform === 'Stripe' ? 'stripe' : 'shopify';
          const amtCls = row.amount < 0 ? ' amount-neg' : '';
          return `<tr class="${selected}" data-id="${row.id}">
            <td class="col-check"><input type="checkbox" class="checkbox row-check" data-id="${row.id}"${checked} aria-label="Select row" /></td>
            <td>
              <div class="integration-cell">
                <span class="integration-mark ${markCls}">${mark}</span>
                <span class="integration-label">${escapeHtml(row.account)} (${escapeHtml(row.platform)})</span>
              </div>
            </td>
            <td>${txInfo(row)}</td>
            <td>${escapeHtml(row.type)}</td>
            <td class="amount-cell${amtCls}">${formatAmount(row.amount, row.currency)}</td>
            <td>${formatDate(row.date)}</td>
            <td>${statusCell(row)}</td>
            <td class="actions-cell">${actionFor(row)}</td>
          </tr>`;
        })
        .join('');
    }

    const allChecked = rows.length > 0 && rows.every((r) => state.selected.has(r.id));
    const someChecked = rows.some((r) => state.selected.has(r.id));
    els.selectAll.checked = allChecked;
    els.selectAll.indeterminate = someChecked && !allChecked;

    renderBulk();
    updateSortHeaders();
  }

  function updateSortHeaders() {
    $$('#tx-table th.sortable').forEach((th) => {
      const key = th.dataset.sort;
      th.classList.toggle('sorted', key === state.sortKey);
      th.classList.toggle('desc', key === state.sortKey && state.sortDir === 'desc');
      th.classList.toggle('asc', key === state.sortKey && state.sortDir === 'asc');
      const hint = th.querySelector('.sort-hint');
      if (hint) {
        if (key === state.sortKey) hint.textContent = state.sortDir === 'desc' ? '▼' : '▲';
        else hint.textContent = '↕';
      }
    });
  }

  function refinementCount(f) {
    let n = 0;
    if (f.platform) n++;
    if (f.type) n++;
    if (f.customer) n++;
    if (f.amountMin !== '') n++;
    if (f.amountMax !== '') n++;
    if (f.failureReasons && f.failureReasons.length) n++;
    return n;
  }

  function renderChips() {
    const f = state.filters;
    const chips = [];
    const dateLabel = DATE_LABELS[f.dateRange] || f.dateRange;
    if (f.dateRange !== 'all') {
      chips.push(chipHtml(`Date range: ${dateLabel}`, 'date'));
    }
    if (f.platform) chips.push(chipHtml(`Platform: ${f.platform}`, 'platform'));
    if (f.type) chips.push(chipHtml(`Type: ${f.type}`, 'type'));
    if (f.customer) chips.push(chipHtml(`Customer: ${f.customer}`, 'customer'));
    if (f.amountMin !== '') chips.push(chipHtml(`Min: ${f.amountMin}`, 'amountMin'));
    if (f.amountMax !== '') chips.push(chipHtml(`Max: ${f.amountMax}`, 'amountMax'));
    if (f.failureReasons && f.failureReasons.length) {
      const labels = f.failureReasons.map((s) => (STATUS_META[s] || {}).label || s);
      chips.push(chipHtml(`Failure: ${labels.join(', ')}`, 'failureReasons'));
    }
    const showClear = chips.length > 0;
    els.chips.innerHTML =
      chips.join('') +
      (showClear ? `<button type="button" class="clear-all-link" id="clear-all-filters">Clear all</button>` : '');

    const badgeN = refinementCount(f);
    if (badgeN > 0) {
      els.filtersBadge.textContent = String(badgeN);
      els.filtersBadge.classList.remove('hidden');
    } else {
      els.filtersBadge.classList.add('hidden');
    }
  }

  function chipHtml(label, key) {
    const dateCls = key === 'date' ? ' is-date' : '';
    return `<span class="chip-input${dateCls}" data-chip="${key}">${escapeHtml(label)}
      <button type="button" class="chip-remove" data-remove="${key}" aria-label="Remove ${escapeHtml(label)}">×</button>
    </span>`;
  }

  function renderBulk() {
    const n = state.selected.size;
    if (n > 0) {
      els.bulkBar.classList.add('visible');
      els.bulkCount.textContent = `${n} selected`;
      els.bulkRollback.hidden = state.tab !== 'successful';
    } else {
      els.bulkBar.classList.remove('visible');
    }
  }

  function renderAll() {
    renderTabs();
    renderChips();
    renderTable();
  }

  // ——— sheet ———
  function openSheet() {
    state.draft = JSON.parse(JSON.stringify(state.filters));
    fillSheet(state.draft);
    els.overlay.hidden = false;
    requestAnimationFrame(() => {
      els.overlay.classList.add('open');
      els.sheet.classList.add('open');
      els.sheet.setAttribute('aria-hidden', 'false');
    });
    updateFailureVisibility();
  }

  function closeSheet() {
    els.overlay.classList.remove('open');
    els.sheet.classList.remove('open');
    els.sheet.setAttribute('aria-hidden', 'true');
    setTimeout(() => {
      els.overlay.hidden = true;
    }, 220);
    state.draft = null;
  }

  function fillSheet(f) {
    $('#f-date').value = f.dateRange;
    $('#f-platform').value = f.platform;
    $('#f-type').value = f.type;
    $('#f-amount-min').value = f.amountMin;
    $('#f-amount-max').value = f.amountMax;
    $('#f-customer').value = f.customer;
    $$('[data-fail]').forEach((cb) => {
      cb.checked = (f.failureReasons || []).includes(cb.value);
    });
  }

  function readSheet() {
    const reasons = $$('[data-fail]:checked').map((cb) => cb.value);
    return {
      dateRange: $('#f-date').value,
      platform: $('#f-platform').value,
      type: $('#f-type').value,
      amountMin: $('#f-amount-min').value,
      amountMax: $('#f-amount-max').value,
      customer: $('#f-customer').value.trim(),
      failureReasons: state.tab === 'needs-attention' ? reasons : [],
    };
  }

  function updateFailureVisibility() {
    const box = $('#failure-reasons');
    if (state.tab === 'needs-attention') box.classList.add('visible');
    else box.classList.remove('visible');
  }

  function applySheet() {
    state.filters = readSheet();
    state.selected.clear();
    closeSheet();
    renderAll();
  }

  function resetSheet() {
    state.draft = {
      dateRange: '90',
      platform: '',
      type: '',
      amountMin: '',
      amountMax: '',
      customer: '',
      failureReasons: [],
    };
    fillSheet(state.draft);
  }

  // ——— chip remove / clear ———
  function removeChip(key) {
    if (key === 'date') {
      openDateModal();
      return;
    }
    if (key === 'failureReasons') state.filters.failureReasons = [];
    else if (key === 'amountMin') state.filters.amountMin = '';
    else if (key === 'amountMax') state.filters.amountMax = '';
    else state.filters[key] = '';
    state.selected.clear();
    renderAll();
  }

  function clearAllFilters() {
    state.filters = {
      dateRange: '90',
      platform: '',
      type: '',
      amountMin: '',
      amountMax: '',
      customer: '',
      failureReasons: [],
    };
    state.search = '';
    els.search.value = '';
    state.selected.clear();
    renderAll();
  }

  function openDateModal() {
    els.dateModal.classList.add('show');
  }
  function closeDateModal() {
    els.dateModal.classList.remove('show');
  }

  // ——— events ———
  function bind() {
    els.tabs.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-tab]');
      if (!btn) return;
      state.tab = btn.dataset.tab;
      writeTabToUrl(state.tab);
      state.selected.clear();
      if (state.tab !== 'needs-attention') state.filters.failureReasons = [];
      updateFailureVisibility();
      renderAll();
    });

    els.search.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        state.search = els.search.value.trim();
        state.selected.clear();
        renderAll();
      }
    });
    els.search.addEventListener('input', () => {
      if (els.search.value === '' && state.search) {
        state.search = '';
        renderAll();
      }
    });

    $('#filters-open').addEventListener('click', openSheet);
    $('#sheet-close').addEventListener('click', closeSheet);
    els.overlay.addEventListener('click', closeSheet);
    $('#sheet-apply').addEventListener('click', applySheet);
    $('#sheet-reset').addEventListener('click', resetSheet);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (els.dateModal.classList.contains('show')) closeDateModal();
        else if (els.sheet.classList.contains('open')) closeSheet();
      }
    });

    els.chips.addEventListener('click', (e) => {
      const rm = e.target.closest('[data-remove]');
      if (rm) {
        removeChip(rm.dataset.remove);
        return;
      }
      if (e.target.id === 'clear-all-filters' || e.target.closest('#clear-all-filters')) {
        clearAllFilters();
      }
    });

    $('#date-keep').addEventListener('click', () => {
      state.filters.dateRange = '90';
      closeDateModal();
      renderAll();
    });
    $('#date-show-all').addEventListener('click', () => {
      state.filters.dateRange = 'all';
      closeDateModal();
      state.selected.clear();
      renderAll();
      toast('Showing all dates');
    });

    $('#empty-clear').addEventListener('click', clearAllFilters);

    $$('#tx-table th.sortable').forEach((th) => {
      th.addEventListener('click', () => {
        const key = th.dataset.sort;
        if (state.sortKey === key) {
          state.sortDir = state.sortDir === 'desc' ? 'asc' : 'desc';
        } else {
          state.sortKey = key;
          state.sortDir = 'desc';
        }
        renderTable();
      });
    });

    els.selectAll.addEventListener('change', () => {
      const rows = visibleRows();
      if (els.selectAll.checked) rows.forEach((r) => state.selected.add(r.id));
      else rows.forEach((r) => state.selected.delete(r.id));
      renderTable();
    });

    els.tbody.addEventListener('change', (e) => {
      const cb = e.target.closest('.row-check');
      if (!cb) return;
      if (cb.checked) state.selected.add(cb.dataset.id);
      else state.selected.delete(cb.dataset.id);
      renderBulk();
      const tr = cb.closest('tr');
      if (tr) tr.classList.toggle('row-selected', cb.checked);
      const rows = visibleRows();
      const allChecked = rows.length > 0 && rows.every((r) => state.selected.has(r.id));
      const someChecked = rows.some((r) => state.selected.has(r.id));
      els.selectAll.checked = allChecked;
      els.selectAll.indeterminate = someChecked && !allChecked;
    });

    els.tbody.addEventListener('click', (e) => {
      const btn = e.target.closest('.row-action');
      if (!btn) return;
      e.preventDefault();
      const action = btn.dataset.action;
      const id = btn.dataset.id;
      if (action === 'sync') toast(`Sync started for ${id}`);
      else if (action === 'explain') toast(`Explain: ${id}`);
      else toast(`More actions: ${id}`);
    });

    els.bulkClear.addEventListener('click', () => {
      state.selected.clear();
      renderTable();
    });
    els.bulkSync.addEventListener('click', () => {
      toast(`Syncing ${state.selected.size} transaction(s)`);
    });
    els.bulkRollback.addEventListener('click', () => {
      toast(`Rollback queued for ${state.selected.size}`);
    });
    els.bulkExport.addEventListener('click', () => {
      toast(`Exporting ${state.selected.size} row(s)`);
    });
  }

  // ——— init ———
  state.tab = readTabFromUrl();
  bind();
  renderAll();
})();
