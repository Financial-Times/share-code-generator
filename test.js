import test from 'ava';
import fn from './';

const invalidShareCode = '';
const invalidUserId = '';
const invalidArticleId = '';
const invalidSalt = '';

const validShareCode = 'kevj9c864ph74yza7d0pt9vfjzs765kk';
const validUserId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const validArticleId = 'bbbbbbbb-aaaa-bbbb-aaaa-bbbbbbbbbbbb';
const validSalt = '12345678901234567890123456789012';

test('encrypting should throw for invalid values', t => {
	t.throws(fn.encrypt.bind(fn,invalidUserId, validArticleId, validSalt), Error);
	t.throws(fn.encrypt.bind(fn,validUserId, invalidArticleId, validSalt), Error);
	t.throws(fn.encrypt.bind(fn,validUserId, validArticleId, invalidSalt), Error);
	t.end();
});

test('encrypting should return a string', t => {
	t.is(typeof fn.encrypt(validUserId, validArticleId, validSalt), 'string');
	t.end();
});

test('decrypting should throw for invalid values', t => {
	t.throws(fn.decrypt.bind(fn,invalidUserId, validArticleId, validSalt), Error);
	t.throws(fn.decrypt.bind(fn,validUserId, invalidArticleId, validSalt), Error);
	t.throws(fn.decrypt.bind(fn,validUserId, validArticleId, invalidSalt), Error);
	t.end();
});

test('decrypting should return a string', t => {
	t.is(typeof fn.decrypt(validShareCode, validArticleId, validSalt), 'string');
	t.end();
});

test('decrypting should return the User ID when given an encrypted string', t => {
	t.is(fn.decrypt(fn.encrypt(validUserId, validArticleId, validSalt), validArticleId, validSalt), validUserId);
	t.end()
});

test('should return true if code conforms to share code pattern', t => {
	t.is(fn.isShareCodePattern(validShareCode), true);
	t.end();
});

test('should return false if code does not conform to share code pattern', t => {
	t.is(fn.isShareCodePattern(invalidShareCode), false);
	t.end();
});
