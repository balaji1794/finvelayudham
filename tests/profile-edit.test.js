const test = require('node:test');
const assert = require('node:assert');

const {
  registerAccount,
  verifyCredentials,
  updateAccount,
  hashPassword,
} = require('../src/lib/server-auth-store.ts');

test('Account profile editing: Name update', () => {
  const email = `profile_${Date.now()}@finvelayudham.app`;
  registerAccount(email, 'Original Name', 'StrongPassword123');

  const updateResult = updateAccount(email, { name: 'Updated Full Name' });
  assert.strictEqual(updateResult.success, true);
  assert.strictEqual(updateResult.account.name, 'Updated Full Name');
  assert.strictEqual(updateResult.account.email, email);
});

test('Account profile editing: Password change enforces new credentials', () => {
  const email = `pwd_change_${Date.now()}@finvelayudham.app`;
  const oldPassword = 'OldSecretPassword#123';
  const newPassword = 'NewSecretPassword#456';

  registerAccount(email, 'Password User', oldPassword);

  // Update password
  const updateResult = updateAccount(email, { newPassword });
  assert.strictEqual(updateResult.success, true);

  // Verify OLD password is now REJECTED
  const oldAttempt = verifyCredentials(email, oldPassword);
  assert.strictEqual(oldAttempt.success, false, 'Old password must be rejected after change');

  // Verify NEW password SUCCEEDS
  const newAttempt = verifyCredentials(email, newPassword);
  assert.strictEqual(newAttempt.success, true, 'New password must succeed');
});

test('Account profile editing: Short new password (< 8 chars) is rejected', () => {
  const email = `short_pwd_${Date.now()}@finvelayudham.app`;
  registerAccount(email, 'Short Test', 'OriginalPassword#123');

  const updateResult = updateAccount(email, { newPassword: 'short' });
  assert.strictEqual(updateResult.success, false);
  assert.match(updateResult.error, /at least 8 characters/i);
});

test('Account profile editing: Email change migrates account and updates deterministic ID', () => {
  const oldEmail = `old_email_${Date.now()}@finvelayudham.app`;
  const newEmail = `new_email_${Date.now()}@finvelayudham.app`;
  const password = 'PasswordForBoth#123';

  registerAccount(oldEmail, 'Migrating User', password);

  const updateResult = updateAccount(oldEmail, { newEmail });
  assert.strictEqual(updateResult.success, true);
  assert.strictEqual(updateResult.account.email, newEmail);
  assert.notStrictEqual(updateResult.account.id, undefined);

  // Old email should no longer log in
  const oldAttempt = verifyCredentials(oldEmail, password);
  assert.strictEqual(oldAttempt.success, false);

  // New email logs in successfully
  const newAttempt = verifyCredentials(newEmail, password);
  assert.strictEqual(newAttempt.success, true);
});
