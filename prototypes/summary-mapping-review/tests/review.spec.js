const { test, expect } = require('@playwright/test');

const STORAGE = 'synder-summary-mapping-review-v2';

async function fresh(page) {
  await page.goto('/');
  await page.evaluate((key) => localStorage.removeItem(key), STORAGE);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Mappings list' })).toBeVisible();
}

async function rowState(page, id) {
  return page.evaluate(({ key, id }) => JSON.parse(localStorage.getItem(key)).rows[id], { key: STORAGE, id });
}

async function setAccount(page, rowId, accountName) {
  const input = page.locator(`tr[data-row-id="${rowId}"] input[data-field="account"]`);
  await input.scrollIntoViewIfNeeded();
  await input.click();
  await input.fill(accountName);
  const option = page.locator('#combo-pop').getByRole('option', { name: accountName, exact: true });
  const accountId = await option.getAttribute('data-value');
  await option.click();
  await expect.poll(async () => (await rowState(page, rowId)).draftAccount).toBe(accountId);
}

async function setLocation(page, rowId, locationName) {
  const input = page.locator(`tr[data-row-id="${rowId}"] input[data-field="location"]`);
  await input.scrollIntoViewIfNeeded();
  await input.click();
  await input.fill(locationName);
  const option = page.locator('#combo-pop').getByRole('option', { name: locationName, exact: true });
  await option.click();
  await expect.poll(async () => (await rowState(page, rowId)).draftLocation).toBe(locationName);
}

async function fillBlanks(page) {
  await page.getByTestId('missing-filter').click();
  for (let guard = 0; guard < 40; guard += 1) {
    const row = page.locator('tbody tr[data-row-id]').first();
    if (await row.count() === 0) break;
    const id = await row.getAttribute('data-row-id');
    const name = await row.getAttribute('data-ok-account-name');
    await setAccount(page, id, name);
  }
  await expect(page.getByTestId('missing-count')).toHaveText('0');
}

async function assertMinFont(page) {
  const offenders = await page.evaluate(() => {
    const bad = [];
    document.querySelectorAll('body *').forEach((el) => {
      if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE' || el.closest('script, style, [hidden]')) return;
      const text = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('');
      if (!text.trim()) return;
      if (typeof el.checkVisibility === 'function' && !el.checkVisibility()) return;
      const size = parseFloat(getComputedStyle(el).fontSize);
      if (size < 14) bad.push({ tag: el.tagName, size, text: text.trim().slice(0, 80) });
    });
    return bad;
  });
  expect(offenders).toEqual([]);
}

async function assertLabels(page) {
  const unlabeled = await page.evaluate(() => {
    const bad = [];
    document.querySelectorAll('input, select, textarea, button').forEach((el) => {
      if (el.closest('[hidden]')) return;
      if (typeof el.checkVisibility === 'function' && !el.checkVisibility()) return;
      const labelled = el.getAttribute('aria-label')
        || el.getAttribute('aria-labelledby')
        || (el.id && document.querySelector(`label[for="${CSS.escape(el.id)}"]`))
        || el.closest('label')
        || (el.tagName === 'BUTTON' && el.textContent.trim());
      if (!labelled) bad.push(el.outerHTML.slice(0, 180));
    });
    return bad;
  });
  expect(unlabeled).toEqual([]);
}

test.beforeEach(async ({ page }) => {
  await fresh(page);
});

test('the first 1280x800 screen is the mapping table', async ({ page }) => {
  expect(page.viewportSize()).toEqual({ width: 1280, height: 800 });
  const table = page.getByRole('table', { name: 'Mappings' });
  await expect(table).toBeVisible();
  const tableBox = await table.boundingBox();
  const firstRow = page.locator('tbody tr[data-row-id]').first();
  const rowBox = await firstRow.boundingBox();
  expect(tableBox.y).toBeGreaterThan(0);
  expect(tableBox.y).toBeLessThan(800);
  expect(rowBox.y).toBeLessThan(800);
  expect(rowBox.y + rowBox.height).toBeLessThanOrEqual(800);

  const note = await page.getByTestId('save-note').boundingBox();
  expect(tableBox.y - note.y).toBeLessThan(220);
  await expect(page.getByText('Review the proposed accounts. Fill any blanks, then save.')).toBeVisible();
  await expect(page.locator('[data-exception-id]')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Suggested batches' })).toHaveCount(0);
  await expect(page.getByTestId('inspect-batch')).toHaveCount(0);
  await expect(page.getByTestId('selection-bar')).toHaveCount(0);
  await expect(page.getByRole('radiogroup', { name: 'Save scope' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Accept/ })).toHaveCount(0);
  await expect(page.getByTestId('continue')).toHaveCount(0);
  await expect(page.getByTestId('missing-count')).toBeVisible();

  const headers = await page.locator('thead th').allTextContents();
  const names = headers.map((text) => text.trim());
  expect(names.indexOf('Group')).toBeLessThan(names.indexOf('Account'));
  expect(names[names.indexOf('Account') + 1]).toBe('Status');
  expect(names.indexOf('Account')).toBeLessThan(names.indexOf('Location'));
  expect(names.indexOf('Account')).toBeLessThan(names.indexOf('Class'));
  expect(names.indexOf('Integration')).toBeGreaterThan(names.indexOf('Status'));
  const total = Number(await page.locator('[data-total-rows]').first().getAttribute('data-total-rows'));
  expect(total).toBe(123);
  await expect(firstRow).toHaveAttribute('data-status', 'needs');
});

test('one edited row saves that account and does not copy it onto another row', async ({ page }) => {
  await page.getByLabel('Groups').selectOption('Sales');
  await setAccount(page, 'stripe-1:sales', 'Shipping income');
  await expect(page.locator('tr[data-row-id="stripe-1:sales"] .status')).toHaveText('Unsaved');
  expect((await rowState(page, 'paypal-1:sales')).draftAccount).toBe('paypal-sales');
  expect((await rowState(page, 'paypal-1:sales')).confirmed).toBe(false);

  await page.getByTestId('save-mappings').click();
  expect((await rowState(page, 'stripe-1:sales')).account).toBe('shipping-income');
  expect((await rowState(page, 'stripe-1:sales')).confirmed).toBe(true);
  expect((await rowState(page, 'paypal-1:sales')).account).toBe('paypal-sales');
  expect((await rowState(page, 'paypal-1:sales')).confirmed).toBe(true);
  expect((await rowState(page, 'shopify-1:sales')).account).toBe('shopify-sales');
});

test('save confirms proposals on other pages and leaves blanks unresolved', async ({ page }) => {
  await expect(page.locator('tr[data-row-id="stripe-1:sales"]')).toHaveCount(0);
  expect((await rowState(page, 'stripe-1:sales')).confirmed).toBe(false);
  expect((await rowState(page, 'shopify-1:packaging')).confirmed).toBe(false);
  await page.getByTestId('save-mappings').click();
  expect((await rowState(page, 'stripe-1:sales')).confirmed).toBe(true);
  expect((await rowState(page, 'stripe-1:sales')).account).toBe('stripe-sales');
  expect((await rowState(page, 'shopify-1:packaging')).confirmed).toBe(true);
  expect((await rowState(page, 'stripe-1:bank')).confirmed).toBe(false);
  expect((await rowState(page, 'stripe-1:bank')).account).toBe('');
  expect((await rowState(page, 'paypal-1:withheld')).confirmed).toBe(false);
  expect((await rowState(page, 'paypal-1:withheld')).account).toBe('');
  await expect(page.getByTestId('missing-count')).toHaveText('18');
  await expect(page.getByTestId('continue')).toHaveCount(0);

  await page.getByLabel('Groups').selectOption('Fees');
  await setAccount(page, 'stripe-1:fees', 'Stripe sales');
  await page.getByTestId('save-mappings').click();
  expect((await rowState(page, 'stripe-1:fees')).confirmed).toBe(false);
  await expect(page.getByTestId('continue')).toHaveCount(0);
});

test('finishing every account reveals Continue, and a changed confirmed account is unsaved', async ({ page }) => {
  await fillBlanks(page);
  await page.getByTestId('missing-filter').click();
  await page.getByTestId('save-mappings').click();
  await expect(page.getByTestId('continue')).toBeVisible();
  await page.getByLabel('Groups').selectOption('Sales');
  const sales = page.locator('tr[data-row-id="stripe-1:sales"]');
  await expect(sales).toHaveAttribute('data-class', '');
  await expect(sales).toHaveAttribute('data-location', '');
  await expect(sales.locator('.status')).toHaveText('Confirmed');

  await setLocation(page, 'stripe-1:sales', 'Berlin');
  await expect(sales).toHaveAttribute('data-status', 'confirmed');
  await expect(sales).toContainText('Unsaved location');
  await expect(page.getByTestId('continue')).toBeVisible();

  await setAccount(page, 'stripe-1:sales', 'Tips income');
  await expect(sales).toHaveAttribute('data-status', 'unsaved');
  await expect(sales.locator('.status')).toHaveText('Unsaved');
  await expect(sales.locator('.status')).not.toHaveText('Confirmed');
  await expect(page.getByTestId('continue')).toHaveCount(0);
  expect((await rowState(page, 'stripe-1:sales')).account).toBe('stripe-sales');

  await page.getByRole('button', { name: 'Revert Sales, Test account_1 (Stripe)' }).click();
  await expect(sales.locator('.status')).toHaveText('Confirmed');
  await expect(page.getByTestId('continue')).toBeVisible();
  await page.getByTestId('continue').click();
  await expect(page.getByTestId('summaries-simulated')).toBeVisible();
  await expect(page.getByText('This is a simulated Summaries destination. Nothing is sent to your books.')).toBeVisible();
});

test('deselecting one row excludes it from the bulk account change', async ({ page }) => {
  await page.locator('#sel-page').check();
  const ids = await page.locator('tbody tr[data-row-id]').evaluateAll((els) => els.map((el) => el.dataset.rowId));
  expect(ids.length).toBeGreaterThan(1);
  const drop = ids[0];
  await page.locator(`tr[data-row-id="${drop}"] input[type="checkbox"]`).uncheck();
  await expect(page.getByTestId('selected-total')).toHaveText(String(ids.length - 1));
  await page.getByTestId('change-account').click();
  await page.locator('#bulk-account').selectOption({ label: 'Sales tax payable' });
  await expect(page.locator(`[data-preview-id="${drop}"]`)).toHaveCount(0);
  await expect(page.locator(`[data-skip-id="${drop}"]`)).toHaveCount(0);
  const staged = await page.locator('[data-preview-id]').evaluateAll((els) => els.map((el) => el.dataset.previewId));
  expect(staged).not.toContain(drop);
  expect(staged.length).toBeGreaterThan(0);
  await page.getByTestId('bulk-stage').click();
  expect((await rowState(page, drop)).draftAccount).toBe('');
  for (const id of staged) expect((await rowState(page, id)).draftAccount).toBe('sales-tax');
  expect((await rowState(page, staged[0])).confirmed).toBe(false);

  await page.getByTestId('reset-demo').click();
  await page.getByTestId('save-mappings').click();
  await page.getByLabel('Groups').selectOption('Sales');
  await setLocation(page, 'stripe-1:sales', 'Berlin');
  await page.locator('#sel-page').check();
  await page.locator('tr[data-row-id="paypal-1:sales"] input[type="checkbox"]').uncheck();
  await page.getByTestId('change-account').click();
  await page.locator('#bulk-account').selectOption({ label: 'Tips income' });
  await expect(page.getByTestId('overwrite-warning')).toBeVisible();
  await expect(page.getByTestId('overwrite-count')).toHaveText('2');
  await expect(page.getByTestId('stage-count')).toHaveText('2');
  await expect(page.getByTestId('selected-in-dialog')).toHaveText('2');
  await expect(page.getByTestId('bulk-scope')).toContainText('Class and location are not changed');
  await expect(page.locator('[data-preview-id="paypal-1:sales"]')).toHaveCount(0);
  await page.getByTestId('bulk-stage').click();
  expect((await rowState(page, 'stripe-1:sales')).draftAccount).toBe('tips');
  expect((await rowState(page, 'stripe-1:sales')).draftLocation).toBe('Berlin');
  expect((await rowState(page, 'stripe-1:sales')).account).toBe('stripe-sales');
  expect((await rowState(page, 'paypal-1:sales')).draftAccount).toBe('paypal-sales');
  await expect(page.locator('tr[data-row-id="stripe-1:sales"] .status')).toHaveText('Unsaved');
  await page.getByTestId('save-mappings').click();
  expect((await rowState(page, 'stripe-1:sales')).account).toBe('tips');
  expect((await rowState(page, 'stripe-1:sales')).location).toBe('Berlin');
  expect((await rowState(page, 'paypal-1:sales')).account).toBe('paypal-sales');
  expect((await rowState(page, 'stripe-1:refunds')).account).toBe('stripe-sales');
});

test('selection stays on the chosen ids across pages and filters', async ({ page }) => {
  const first = page.locator('tbody tr[data-row-id]').first();
  const id1 = await first.getAttribute('data-row-id');
  await first.locator('input[type="checkbox"]').check();
  await page.getByTestId('next-page').click();
  const second = page.locator('tbody tr[data-row-id]').first();
  const id2 = await second.getAttribute('data-row-id');
  expect(id2).not.toBe(id1);
  await second.locator('input[type="checkbox"]').check();
  await expect(page.getByTestId('selected-total')).toHaveText('2');
  await expect(page.getByTestId('selected-visible')).toHaveText('1');
  await expect(page.getByTestId('selected-hidden')).toHaveText('1');
  const bar = await page.getByTestId('selection-bar').boundingBox();
  const table = await page.getByRole('table', { name: 'Mappings' }).boundingBox();
  expect(bar.y).toBeLessThan(table.y);
  expect(table.y - (bar.y + bar.height)).toBeLessThan(8);
  await page.getByTestId('change-account').click();
  const listed = await page.locator('[data-preview-id], [data-skip-id]').evaluateAll((els) => els.map((el) => el.dataset.previewId || el.dataset.skipId).sort());
  expect(listed).toEqual([id1, id2].sort());
  await page.getByTestId('bulk-cancel').click();

  await page.locator(`tr[data-row-id="${id2}"] input[type="checkbox"]`).uncheck();
  await page.getByTestId('change-account').click();
  const after = await page.locator('[data-preview-id], [data-skip-id]').evaluateAll((els) => els.map((el) => el.dataset.previewId || el.dataset.skipId));
  expect(after).toEqual([id1]);
  await page.getByTestId('bulk-cancel').click();

  await page.getByTestId('prev-page').click();
  await expect(page.locator(`tr[data-row-id="${id1}"] input[type="checkbox"]`)).toBeChecked();
  await page.locator('#sel-page').check();
  const pageCount = await page.locator('tbody tr[data-row-id]').count();
  await expect(page.getByTestId('selected-total')).toHaveText(String(pageCount));
  await page.getByTestId('next-page').click();
  await expect(page.locator('#sel-page')).not.toBeChecked();
  await expect(page.getByTestId('selected-visible')).toHaveText('0');
  await expect(page.getByTestId('selected-hidden')).toHaveText(String(pageCount));

  await page.getByTestId('clear-selection').click();
  await expect(page.getByTestId('selection-bar')).toHaveCount(0);
  await page.getByTestId('prev-page').click();
  const kept = await page.locator('tbody tr[data-row-id]').first().getAttribute('data-row-id');
  await page.locator(`tr[data-row-id="${kept}"] input[type="checkbox"]`).check();
  await page.getByTestId('tab-paypal-1').click();
  await expect(page.getByTestId('selected-total')).toHaveText('1');
  await expect(page.getByTestId('selected-visible')).toHaveText('0');
  await expect(page.getByTestId('selected-hidden')).toHaveText('1');
  await expect(page.locator('tbody tr input[type="checkbox"]:checked')).toHaveCount(0);
  await page.getByTestId('change-account').click();
  const only = await page.locator('[data-preview-id], [data-skip-id]').evaluateAll((els) => els.map((el) => el.dataset.previewId || el.dataset.skipId));
  expect(only).toEqual([kept]);
});

test('discard, reset, and refresh keep or clear drafts as asked', async ({ page }) => {
  await page.getByLabel('Groups').selectOption('Sales');
  await setLocation(page, 'stripe-1:sales', 'Berlin');
  await page.reload();
  await page.getByLabel('Groups').selectOption('Sales');
  const sales = page.locator('tr[data-row-id="stripe-1:sales"]');
  await expect(sales).toHaveAttribute('data-location', 'Berlin');
  await expect(sales).toHaveAttribute('data-pending', 'true');
  await page.getByTestId('discard').click();
  await expect(sales).toHaveAttribute('data-location', '');
  await expect(sales).toHaveAttribute('data-pending', 'false');

  await setLocation(page, 'stripe-1:sales', 'Stripe');
  await page.getByTestId('save-mappings').click();
  await page.reload();
  await page.getByLabel('Groups').selectOption('Sales');
  await expect(sales).toHaveAttribute('data-location', 'Stripe');
  await expect(sales).toHaveAttribute('data-pending', 'false');
  await expect(sales).toHaveAttribute('data-confirmed', 'true');

  await page.getByTestId('reset-demo').click();
  await page.getByLabel('Groups').selectOption('Sales');
  await expect(sales).toHaveAttribute('data-location', '');
  await expect(sales).toHaveAttribute('data-confirmed', 'false');
  await page.reload();
  await page.getByLabel('Groups').selectOption('Sales');
  await expect(sales).toHaveAttribute('data-location', '');
  await expect(sales).toHaveAttribute('data-confirmed', 'false');
});

test('keyboard access and labelled controls', async ({ page }) => {
  await assertLabels(page);
  await expect(page.getByRole('button', { name: 'Save mappings' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Reset demo' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Account', exact: true })).toBeVisible();
  await expect(page.getByLabel('Mapping status').locator('option')).toHaveText(['All', 'Mapped', 'Not mapped']);
  await expect(page.locator('tr[data-row-id="stripe-1:withheld"] input[data-field="account"]')).toHaveAttribute('placeholder', 'Search or start typing...');

  const search = page.getByRole('searchbox', { name: 'Search' });
  await search.focus();
  await page.keyboard.type('Fees');
  await expect(search).toHaveValue('Fees');
  await search.fill('');

  const account = page.locator('tbody tr[data-row-id] input[data-field="account"]').first();
  const rowId = await account.getAttribute('data-row-id');
  await account.focus();
  await page.keyboard.press('ArrowDown');
  await expect(account).toHaveAttribute('aria-expanded', 'true');
  await account.fill('Sales tax payable');
  await page.keyboard.press('Enter');
  expect((await rowState(page, rowId)).draftAccount).toBe('sales-tax');

  await page.getByLabel('Groups').selectOption('Sales');
  await page.locator('tr[data-row-id="stripe-1:sales"] input[data-field="location"]').click();
  await expect(page.locator('#combo-pop').getByRole('option', { name: 'Berlin', exact: true })).toBeVisible();
  await expect(page.locator('#combo-pop').getByRole('option', { name: 'Stripe', exact: true })).toBeVisible();
  await expect(page.locator('#combo-pop').getByRole('option', { name: 'Test', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await page.locator('tr[data-row-id="stripe-1:sales"] input[data-field="class"]').click();
  await expect(page.getByText('No classes found in your books')).toBeVisible();
  await expect(page.getByText('The classes list in your books seems to be empty. Create classes in your accounting first to map them in Synder.')).toBeVisible();
  await page.keyboard.press('Escape');

  const checkbox = page.getByRole('checkbox', { name: 'Select Sales, Test account_1 (Stripe)' });
  await checkbox.focus();
  await page.keyboard.press('Space');
  await expect(checkbox).toBeChecked();
  await page.getByTestId('change-account').click();
  await assertLabels(page);
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('bulk-dialog')).toHaveCount(0);
});

test('visible text stays at least 14px', async ({ page }) => {
  await assertMinFont(page);
  await page.locator('tbody tr[data-row-id] input[data-field="class"]').first().click();
  await expect(page.getByText('No classes found in your books')).toBeVisible();
  await assertMinFont(page);
  await page.keyboard.press('Escape');
  await page.locator('tbody tr[data-row-id] input[type="checkbox"]').first().check();
  await page.getByTestId('change-account').click();
  await assertMinFont(page);
});
