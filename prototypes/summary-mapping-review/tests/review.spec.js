const { test, expect } = require('@playwright/test');

const STORAGE = 'synder-summary-mapping-review-v1';

async function fresh(page) {
  await page.goto('/');
  await page.evaluate((key) => localStorage.removeItem(key), STORAGE);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Mappings list' })).toBeVisible();
}

async function rowState(page, id) {
  return page.evaluate(({ key, id }) => {
    const data = JSON.parse(localStorage.getItem(key));
    return data.rows[id];
  }, { key: STORAGE, id });
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

async function clearAccount(page, rowId) {
  const input = page.locator(`tr[data-row-id="${rowId}"] input[data-field="account"]`);
  await input.scrollIntoViewIfNeeded();
  await input.click();
  await input.fill('');
  await page.locator('#combo-pop').getByRole('option', { name: 'Clear account', exact: true }).click();
  await expect(input).toHaveValue('');
}

async function setLocation(page, rowId, locationName) {
  const input = page.locator(`tr[data-row-id="${rowId}"] input[data-field="location"]`);
  await input.scrollIntoViewIfNeeded();
  await input.click();
  await input.fill(locationName);
  await page.locator('#combo-pop').getByRole('option', { name: locationName, exact: true }).click();
  await expect(input).toHaveValue(locationName);
}

async function assertMinFont(page) {
  const offenders = await page.evaluate(() => {
    const bad = [];
    document.querySelectorAll('body *').forEach((el) => {
      const tag = el.tagName;
      if (tag === 'SCRIPT' || tag === 'STYLE') return;
      if (el.closest('script, style, [hidden]')) return;
      const text = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('');
      if (!text.trim()) return;
      if (typeof el.checkVisibility === 'function' && !el.checkVisibility()) return;
      const size = parseFloat(getComputedStyle(el).fontSize);
      if (size < 14) bad.push({ tag, size, text: text.trim().slice(0, 80) });
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

test('completion stays blocked until every account is confirmed', async ({ page }) => {
  const continueBtn = page.getByTestId('continue');
  const total = Number(await page.locator('[data-total-rows]').first().getAttribute('data-total-rows'));
  expect(total).toBeGreaterThanOrEqual(100);

  await expect(continueBtn).toBeDisabled();
  await expect(continueBtn).toHaveAttribute('data-block-reason', 'zero');
  await expect(page.getByTestId('count-confirmed')).toHaveText('0');

  await page.locator('[data-testid="toggle-integration"][data-integration="stripe-1"]').click();
  await page.locator('[data-testid="inspect-batch"][data-batch-key="Record sales||stripe-sales||stripe-1"]').click();
  await page.getByTestId('save-accept').click();
  await page.getByTestId('bulk-commit').click();
  await expect(page.getByTestId('count-confirmed')).toHaveText('4');
  await expect(continueBtn).toBeDisabled();
  await expect(continueBtn).toHaveAttribute('data-block-reason', 'missing');
  await page.getByTestId('back-batches').click();

  const exceptionIds = await page.locator('[data-exception-id]').evaluateAll((els) => els.map((el) => el.dataset.exceptionId));
  expect(exceptionIds.length).toBeGreaterThan(0);
  for (const id of exceptionIds) {
    const name = await page.locator(`tr[data-row-id="${id}"]`).getAttribute('data-ok-account-name');
    await setAccount(page, id, name);
  }
  await expect(page.getByTestId('count-needs')).toHaveText('0');
  await expect(continueBtn).toBeDisabled();
  await expect(continueBtn).toHaveAttribute('data-block-reason', 'unconfirmed');

  await page.getByRole('radio', { name: /All results/ }).check();
  await page.getByTestId('save-accept').click();
  await page.getByTestId('bulk-commit').click();
  await expect(page.getByTestId('count-needs')).toHaveText('0');
  await expect(page.getByTestId('count-suggested')).toHaveText('0');
  await expect(page.getByTestId('count-pending')).toHaveText('0');
  await expect(page.getByTestId('count-confirmed')).toHaveText(String(total));
  await expect(continueBtn).toBeEnabled();
  await expect(continueBtn).toHaveAttribute('data-block-reason', '');

  await page.getByLabel('Groups').selectOption('Sales');
  const sales = page.locator('tr[data-row-id="stripe-1:sales"]');
  await expect(sales).toHaveAttribute('data-class', '');
  await expect(sales).toHaveAttribute('data-location', '');

  await clearAccount(page, 'stripe-1:sales');
  await expect(continueBtn).toBeDisabled();
  await expect(continueBtn).toHaveAttribute('data-block-reason', 'missing');
  await page.getByRole('button', { name: 'Revert Sales, Test account_1 (Stripe)' }).click();
  await expect(continueBtn).toBeEnabled();

  await setLocation(page, 'stripe-1:sales', 'Berlin');
  await expect(sales).toHaveAttribute('data-pending', 'true');
  await expect(continueBtn).toBeDisabled();
  await expect(continueBtn).toHaveAttribute('data-block-reason', 'pending');
  await page.getByTestId('discard').click();
  await expect(sales).toHaveAttribute('data-location', '');
  await expect(sales).toHaveAttribute('data-pending', 'false');
  await expect(continueBtn).toBeEnabled();

  await continueBtn.click();
  await expect(page.getByTestId('summaries-simulated')).toBeVisible();
  await expect(page.getByText('This is a simulated Summaries destination. Nothing is sent to your books.')).toBeVisible();
  await assertMinFont(page);
});

test('a one-row bulk change does not change another row with the same group', async ({ page }) => {
  await page.getByLabel('Groups').selectOption('Sales');
  await page.locator('tr[data-row-id="stripe-1:sales"] input[type="checkbox"]').check();
  await expect(page.getByTestId('n-page')).toHaveText('1');
  await expect(page.getByTestId('n-results')).toHaveText('3');
  await page.getByTestId('save-accept').click();
  await page.getByRole('radio', { name: 'Set one account for these rows' }).check();
  await page.locator('#bulk-account').selectOption({ label: 'Shipping income' });
  await expect(page.getByTestId('change-count')).toHaveText('1');
  await expect(page.locator('[data-preview-id]')).toHaveCount(1);
  await expect(page.locator('[data-preview-id="stripe-1:sales"]')).toHaveCount(1);
  await expect(page.getByTestId('overwrite-warning')).toBeHidden();
  await page.getByTestId('bulk-commit').click();

  expect((await rowState(page, 'stripe-1:sales')).account).toBe('shipping-income');
  expect((await rowState(page, 'paypal-1:sales')).account).toBe('paypal-sales');
  expect((await rowState(page, 'paypal-1:sales')).confirmed).toBe(false);
  expect((await rowState(page, 'shopify-1:sales')).account).toBe('shopify-sales');
  expect((await rowState(page, 'stripe-1:refunds')).account).toBe('stripe-sales');
  expect((await rowState(page, 'stripe-1:wholesale')).account).toBe('stripe-sales');
  expect((await rowState(page, 'stripe-1:sales-ex1')).account).toBe('stripe-sales');

  await page.locator('tr[data-row-id="stripe-1:sales"] input[type="checkbox"]').check();
  await page.getByTestId('save-accept').click();
  await page.getByRole('radio', { name: 'Set one account for these rows' }).check();
  await page.locator('#bulk-account').selectOption({ label: 'Tips income' });
  await expect(page.getByTestId('overwrite-warning')).toBeVisible();
  await expect(page.getByTestId('overwrite-count')).toHaveText('1');
  await expect(page.locator('[data-preview-id]')).toHaveCount(1);
  await page.getByTestId('bulk-commit').click();
  expect((await rowState(page, 'stripe-1:sales')).account).toBe('tips');
  expect((await rowState(page, 'paypal-1:sales')).account).toBe('paypal-sales');
});

test('cross-page selection and integration scope stay exact', async ({ page }) => {
  const total = Number(await page.locator('[data-total-rows]').first().getAttribute('data-total-rows'));
  await expect(page.getByTestId('n-results')).toHaveText(String(total));

  const first = page.locator('tbody tr').first();
  const id1 = await first.getAttribute('data-row-id');
  await first.locator('input[type="checkbox"]').check();
  await page.getByTestId('next-page').click();
  const second = page.locator('tbody tr').first();
  const id2 = await second.getAttribute('data-row-id');
  expect(id2).not.toBe(id1);
  await second.locator('input[type="checkbox"]').check();
  await expect(page.getByTestId('selected-total')).toHaveText('2');
  await expect(page.getByTestId('n-page')).toHaveText('1');
  await expect(page.getByTestId('n-results')).toHaveText(String(total));
  await page.getByTestId('prev-page').click();
  await expect(page.locator(`tr[data-row-id="${id1}"] input[type="checkbox"]`)).toBeChecked();
  await expect(page.getByTestId('selected-total')).toHaveText('2');
  await page.getByTestId('next-page').click();
  await page.getByRole('radio', { name: /Selected on this page/ }).check();
  await page.getByTestId('save-accept').click();
  await expect(page.locator('[data-preview-id]')).toHaveCount(1);
  await expect(page.locator(`[data-preview-id="${id2}"]`)).toHaveCount(1);
  await expect(page.locator(`[data-preview-id="${id1}"]`)).toHaveCount(0);
  await page.getByTestId('bulk-cancel').click();

  await page.getByTestId('clear-selection').click();
  await page.locator('#sel-page').check();
  const onPage = await page.locator('tbody tr').count();
  await expect(page.getByTestId('selected-total')).toHaveText(String(onPage));
  await expect(page.getByTestId('n-page')).toHaveText(String(onPage));
  expect(onPage).toBeLessThan(total);
  await page.getByTestId('prev-page').click();
  await expect(page.locator('#sel-page')).not.toBeChecked();
  await expect(page.getByTestId('selected-total')).toHaveText(String(onPage));

  await page.getByTestId('clear-selection').click();
  await page.getByTestId('tab-paypal-1').click();
  const paypalCount = await page.evaluate((key) => {
    return Object.keys(JSON.parse(localStorage.getItem(key)).rows).filter((id) => id.startsWith('paypal-1:')).length;
  }, STORAGE);
  await expect(page.getByTestId('n-results')).toHaveText(String(paypalCount));
  expect(paypalCount).toBeLessThan(total);
  await page.getByRole('radio', { name: /All results/ }).check();
  await page.getByTestId('save-accept').click();
  const previewIds = await page.locator('[data-preview-id]').evaluateAll((els) => els.map((el) => el.dataset.previewId));
  const skipIds = await page.locator('[data-skip-id]').evaluateAll((els) => els.map((el) => el.dataset.skipId));
  expect(previewIds.length).toBeGreaterThan(0);
  expect(previewIds.every((id) => id.startsWith('paypal-1:'))).toBe(true);
  expect(skipIds).toContain('paypal-1:bank');
  expect(previewIds.concat(skipIds).some((id) => id.startsWith('stripe-1:'))).toBe(false);
  await page.getByTestId('bulk-cancel').click();
  expect((await rowState(page, 'stripe-1:sales')).confirmed).toBe(false);
});

test('search and filters cannot bypass completion', async ({ page }) => {
  const needs = await page.getByTestId('count-needs').innerText();
  const suggested = await page.getByTestId('count-suggested').innerText();
  const confirmed = await page.getByTestId('count-confirmed').innerText();
  await page.getByTestId('next-page').click();
  await expect(page.getByTestId('count-needs')).toHaveText(needs);
  await expect(page.getByTestId('count-suggested')).toHaveText(suggested);
  await expect(page.getByTestId('count-confirmed')).toHaveText(confirmed);

  await page.getByRole('searchbox', { name: 'Search' }).fill('Morning blend');
  await expect(page.locator('tbody tr')).toHaveCount(3);
  await expect(page.getByTestId('count-needs')).toHaveText(needs);
  await expect(page.getByTestId('continue')).toBeDisabled();
  await expect(page.getByTestId('continue')).toHaveAttribute('data-block-reason', 'zero');

  await page.getByLabel('Mapping status').selectOption('not');
  await expect(page.getByTestId('count-needs')).toHaveText(needs);
  await page.getByLabel('Mapping status').selectOption('all');
  await page.getByRole('button', { name: 'Reset filters' }).click();

  await page.getByLabel('Groups').selectOption('Sales');
  await page.getByTestId('select-page').click();
  await page.getByTestId('save-accept').click();
  await page.getByTestId('bulk-commit').click();
  await expect(page.getByTestId('count-confirmed')).toHaveText('3');
  await expect(page.getByTestId('count-needs')).toHaveText(needs);
  await expect(page.getByTestId('continue')).toBeDisabled();
  await page.getByLabel('Mapping status').selectOption('mapped');
  await expect(page.getByTestId('count-needs')).toHaveText(needs);
  await expect(page.getByTestId('count-suggested')).not.toHaveText('0');
  await expect(page.getByTestId('continue')).toBeDisabled();
});

test('invalid accounts are rejected and bank rows are not auto-confirmed', async ({ page }) => {
  await expect(page.locator('tr[data-row-id="stripe-1:bank"]')).toHaveAttribute('data-manual', 'true');
  await expect(page.locator('tr[data-row-id="stripe-1:bank"]')).toHaveAttribute('data-batch-key', '');
  await expect(page.locator('tr[data-row-id="stripe-1:bank"]')).toHaveAttribute('data-confirmed', 'false');
  await expect(page.getByText('Bank accounts are entered by hand. Synder does not suggest an account for this row.').first()).toBeVisible();
  await expect(page.getByText('No compatible account was proposed for this group.').first()).toBeVisible();

  await page.getByTestId('save-accept').click();
  const previewIds = await page.locator('[data-preview-id]').evaluateAll((els) => els.map((el) => el.dataset.previewId));
  const skipIds = await page.locator('[data-skip-id]').evaluateAll((els) => els.map((el) => el.dataset.skipId));
  expect(previewIds).not.toContain('stripe-1:bank');
  expect(previewIds).not.toContain('paypal-1:bank');
  expect(previewIds).not.toContain('shopify-1:bank');
  expect(skipIds).toEqual(expect.arrayContaining(['stripe-1:bank', 'paypal-1:bank', 'shopify-1:bank']));
  await page.getByTestId('bulk-cancel').click();
  expect((await rowState(page, 'stripe-1:bank')).confirmed).toBe(false);

  await setAccount(page, 'stripe-1:fees', 'Stripe sales');
  const fees = page.locator('tr[data-row-id="stripe-1:fees"]');
  await expect(fees).toHaveAttribute('data-state', 'needs');
  await expect(fees.getByRole('alert')).toContainText('Income account');
  await expect(page.getByTestId('continue')).toBeDisabled();

  await page.locator('tr[data-row-id="stripe-1:bank"] input[type="checkbox"]').check();
  await page.locator('tr[data-row-id="stripe-1:fees"] input[type="checkbox"]').check();
  await page.getByRole('radio', { name: /Selected on this page/ }).check();
  await page.getByTestId('save-accept').click();
  await page.getByRole('radio', { name: 'Set one account for these rows' }).check();
  await page.locator('#bulk-account').selectOption({ label: 'Stripe expenses' });
  await expect(page.locator('[data-preview-id]')).toHaveCount(1);
  await expect(page.locator('[data-preview-id="stripe-1:fees"]')).toHaveCount(1);
  await expect(page.locator('[data-skip-id="stripe-1:bank"]')).toContainText('Bank');
  await page.getByTestId('bulk-commit').click();

  expect((await rowState(page, 'stripe-1:fees')).account).toBe('stripe-expenses');
  expect((await rowState(page, 'stripe-1:fees')).confirmed).toBe(true);
  expect((await rowState(page, 'stripe-1:bank')).account).toBe('');
  expect((await rowState(page, 'stripe-1:bank')).confirmed).toBe(false);
  expect((await rowState(page, 'paypal-1:fees')).account).toBe('paypal-fees');
  expect((await rowState(page, 'paypal-1:fees')).confirmed).toBe(false);

  await page.locator('[data-testid="toggle-integration"][data-integration="stripe-1"]').click();
  const batchText = await page.locator('.batch-list').innerText();
  expect(batchText).not.toContain('Stripe transfers');
  expect(batchText).toContain('Record sales');
  expect(batchText).toContain('Record sales tax collected');
});

test('batches accept only an exact shared purpose', async ({ page }) => {
  const needs = await page.getByTestId('count-needs').innerText();
  await page.locator('[data-testid="toggle-integration"][data-integration="stripe-1"]').click();
  await page.locator('[data-testid="inspect-batch"][data-batch-key="Record sales||stripe-sales||stripe-1"]').click();
  await expect(page.getByTestId('n-batch')).toHaveText('4');
  await expect(page.getByTestId('count-needs')).toHaveText(needs);
  await expect(page.locator('tr[data-row-id="stripe-1:tax"]')).toHaveCount(0);
  await expect(page.locator('tr[data-row-id="stripe-1:bank"]')).toHaveCount(0);
  await expect(page.locator('tr[data-row-id="stripe-1:wholesale"]')).toHaveCount(0);
  await expect(page.locator('tr[data-row-id="paypal-1:sales"]')).toHaveCount(0);

  await setAccount(page, 'stripe-1:sales-ex1', 'Shipping income');
  await expect(page.getByTestId('n-batch')).toHaveText('3');
  await expect(page.locator('tr[data-row-id="stripe-1:sales-ex1"]')).toContainText('Not in this exact batch');
  await page.getByTestId('save-accept').click();
  const ids = await page.locator('[data-preview-id]').evaluateAll((els) => els.map((el) => el.dataset.previewId).sort());
  expect(ids).toEqual(['stripe-1:sales', 'stripe-1:sales-ex2', 'stripe-1:sales-ex3']);
  await page.getByTestId('bulk-commit').click();

  expect((await rowState(page, 'stripe-1:sales')).confirmed).toBe(true);
  expect((await rowState(page, 'stripe-1:sales-ex2')).confirmed).toBe(true);
  expect((await rowState(page, 'stripe-1:sales-ex1')).confirmed).toBe(false);
  expect((await rowState(page, 'stripe-1:sales-ex1')).draftAccount).toBe('shipping-income');
  expect((await rowState(page, 'stripe-1:tax')).confirmed).toBe(false);
  expect((await rowState(page, 'stripe-1:wholesale')).confirmed).toBe(false);
  expect((await rowState(page, 'stripe-1:refunds')).confirmed).toBe(false);
  expect((await rowState(page, 'stripe-1:bank')).confirmed).toBe(false);
  expect((await rowState(page, 'paypal-1:sales')).confirmed).toBe(false);
});

test('revert, discard, reset, and refresh persistence', async ({ page }) => {
  await page.getByLabel('Groups').selectOption('Sales');
  await setLocation(page, 'stripe-1:sales', 'Berlin');
  await expect(page.locator('tr[data-row-id="stripe-1:sales"]')).toHaveAttribute('data-pending', 'true');
  await page.reload();
  await page.getByLabel('Groups').selectOption('Sales');
  await expect(page.locator('tr[data-row-id="stripe-1:sales"]')).toHaveAttribute('data-location', 'Berlin');
  await expect(page.locator('tr[data-row-id="stripe-1:sales"]')).toHaveAttribute('data-pending', 'true');

  await page.getByRole('button', { name: 'Revert Sales, Test account_1 (Stripe)' }).click();
  await expect(page.locator('tr[data-row-id="stripe-1:sales"]')).toHaveAttribute('data-location', '');
  await expect(page.locator('tr[data-row-id="stripe-1:sales"]')).toHaveAttribute('data-pending', 'false');

  await setLocation(page, 'stripe-1:sales', 'Test');
  await page.getByTestId('discard').click();
  await expect(page.locator('tr[data-row-id="stripe-1:sales"]')).toHaveAttribute('data-location', '');

  await setLocation(page, 'stripe-1:sales', 'Stripe');
  await page.locator('tr[data-row-id="stripe-1:sales"] input[type="checkbox"]').check();
  await page.getByTestId('save-accept').click();
  await page.getByTestId('bulk-commit').click();
  await page.reload();
  await page.getByLabel('Groups').selectOption('Sales');
  await expect(page.locator('tr[data-row-id="stripe-1:sales"]')).toHaveAttribute('data-location', 'Stripe');
  await expect(page.locator('tr[data-row-id="stripe-1:sales"]')).toHaveAttribute('data-pending', 'false');
  await expect(page.locator('tr[data-row-id="stripe-1:sales"]')).toHaveAttribute('data-confirmed', 'true');

  await page.getByTestId('reset-demo').click();
  await page.getByLabel('Groups').selectOption('Sales');
  await expect(page.locator('tr[data-row-id="stripe-1:sales"]')).toHaveAttribute('data-location', '');
  await expect(page.locator('tr[data-row-id="stripe-1:sales"]')).toHaveAttribute('data-confirmed', 'false');
  await page.reload();
  await page.getByLabel('Groups').selectOption('Sales');
  await expect(page.locator('tr[data-row-id="stripe-1:sales"]')).toHaveAttribute('data-location', '');
  await expect(page.locator('tr[data-row-id="stripe-1:sales"]')).toHaveAttribute('data-confirmed', 'false');
});

test('keyboard access and labelled controls', async ({ page }) => {
  await assertLabels(page);
  await expect(page.getByRole('button', { name: 'Continue to Summaries' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Reset demo' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Group' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Account subtype' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Payment gateway' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Integration' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Location' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Class' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Account', exact: true })).toBeVisible();
  await expect(page.getByLabel('Mapping status').locator('option')).toHaveText(['All', 'Mapped', 'Not mapped']);
  await expect(page.locator('tr[data-row-id="stripe-1:bank"] input[data-field="account"]')).toHaveAttribute('placeholder', 'Search or start typing...');

  const search = page.getByRole('searchbox', { name: 'Search' });
  await search.focus();
  await page.keyboard.type('Fees');
  await expect(search).toHaveValue('Fees');
  await search.fill('');

  const account = page.locator('tr[data-row-id="stripe-1:fees"] input[data-field="account"]');
  await account.focus();
  await page.keyboard.press('ArrowDown');
  await expect(account).toHaveAttribute('aria-expanded', 'true');
  await account.fill('Stripe expenses');
  await page.keyboard.press('Enter');
  await expect(account).toHaveValue('Stripe expenses');

  await page.locator('tr[data-row-id="stripe-1:sales"] input[data-field="location"]').click();
  await expect(page.locator('#combo-pop').getByRole('option', { name: 'Berlin', exact: true })).toBeVisible();
  await expect(page.locator('#combo-pop').getByRole('option', { name: 'Stripe', exact: true })).toBeVisible();
  await expect(page.locator('#combo-pop').getByRole('option', { name: 'Test', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');

  await page.locator('tr[data-row-id="stripe-1:sales"] input[data-field="class"]').click();
  await expect(page.getByText('No classes found in your books')).toBeVisible();
  await expect(page.getByText('The classes list in your books seems to be empty. Create classes in your accounting first to map them in Synder.')).toBeVisible();
  await page.keyboard.press('Escape');

  const checkbox = page.getByRole('checkbox', { name: 'Select Fees, Test account_1 (Stripe)' });
  await checkbox.focus();
  await page.keyboard.press('Space');
  await expect(checkbox).toBeChecked();

  await page.getByTestId('save-accept').click();
  await assertLabels(page);
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('bulk-dialog')).toHaveCount(0);
});

test('no visible text is under 14px', async ({ page }) => {
  await assertMinFont(page);
  await page.locator('tr[data-row-id="stripe-1:sales"] input[data-field="class"]').click();
  await expect(page.getByText('No classes found in your books')).toBeVisible();
  await assertMinFont(page);
  await page.keyboard.press('Escape');
  await page.getByTestId('save-accept').click();
  await expect(page.getByTestId('bulk-dialog')).toBeVisible();
  await assertMinFont(page);
});
