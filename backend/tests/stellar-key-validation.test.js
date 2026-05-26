'use strict';

const StellarSdk = require('@stellar/stellar-sdk');
const { validateStellarPublicKey } = require('../src/middleware/wallet');

// Helper: run the middleware synchronously and return the result
function run(value) {
  const req = { body: { wallet: value } };
  let status = null;
  let body = null;
  const res = {
    status(s) { status = s; return this; },
    json(b) { body = b; },
  };
  const next = jest.fn();
  validateStellarPublicKey('body', 'wallet')(req, res, next);
  return { status, body, next };
}

const VALID_KEY = StellarSdk.Keypair.random().publicKey(); // real 56-char G-prefixed key

describe('validateStellarPublicKey', () => {
  it('returns true (calls next) for a valid 56-char G-prefixed key', () => {
    const { next, status } = run(VALID_KEY);
    expect(next).toHaveBeenCalled();
    expect(status).toBeNull();
  });

  it('returns false (400) for a key with wrong prefix (not G)', () => {
    // Replace G with A, keep valid base32 chars and length
    const wrongPrefix = 'A' + VALID_KEY.slice(1);
    const { next, status } = run(wrongPrefix);
    expect(next).not.toHaveBeenCalled();
    expect(status).toBe(400);
  });

  it('returns false (400) for a key shorter than 56 chars', () => {
    const { next, status } = run(VALID_KEY.slice(0, 55));
    expect(next).not.toHaveBeenCalled();
    expect(status).toBe(400);
  });

  it('returns false (400) for a key longer than 56 chars', () => {
    const { next, status } = run(VALID_KEY + 'A');
    expect(next).not.toHaveBeenCalled();
    expect(status).toBe(400);
  });

  it('returns false (400) for a key with invalid base32 characters', () => {
    // base32 alphabet is A-Z and 2-7; '0', '1', '8', '9' are invalid
    const invalidChars = 'G' + '0'.repeat(55);
    const { next, status } = run(invalidChars);
    expect(next).not.toHaveBeenCalled();
    expect(status).toBe(400);
  });
});
