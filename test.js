import test from 'ava';
import fn from './';

const invalidShareCode = '';
const invalidUserId    = '';
const invalidArticleId = '';
const invalidSalt      = '';
const invalidTime      = 'abc';
const invalidMaxTokens = 'abc';

const validUserId     = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const validUserId2    = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaabbb';
const validArticleId  = 'bbbbbbbb-aaaa-bbbb-aaaa-bbbbbbbbbbbb';
const validArticleId2 = 'bbbbbbbb-aaaa-bbbb-aaaa-bbbbbbbbbccc';
const validSalt       = '1234567890123456789012345678901234567890123456';
const validTime       = 1234567890;
const validMaxTokens  = 100;

test('encrypting should throw for invalid values', t => {
	t.throws(fn.encrypt.bind(fn,invalidUserId,   validArticleId,   validSalt,   validTime,   validMaxTokens), Error);
	t.throws(fn.encrypt.bind(fn,  validUserId, invalidArticleId,   validSalt,   validTime,   validMaxTokens), Error);
	t.throws(fn.encrypt.bind(fn,  validUserId,   validArticleId, invalidSalt,   validTime,   validMaxTokens), Error);
	t.throws(fn.encrypt.bind(fn,  validUserId,   validArticleId,   validSalt, invalidTime,   validMaxTokens), Error);
	t.throws(fn.encrypt.bind(fn,  validUserId,   validArticleId,   validSalt,   validTime, invalidMaxTokens), Error);
	t.end();
});

test('encrypting should return a string', t => {
	t.is(typeof fn.encrypt(validUserId, validArticleId, validSalt, validTime, validMaxTokens), 'string');
	t.end();
});

test('decrypting should throw for invalid values', t => {
	t.throws(fn.decrypt.bind(fn,invalidUserId, validArticleId, validSalt), Error);
	t.throws(fn.decrypt.bind(fn,validUserId, invalidArticleId, validSalt), Error);
	t.throws(fn.decrypt.bind(fn,validUserId, validArticleId, invalidSalt), Error);
	t.end();
});

test('decrypting should return the User ID when given an encrypted string', t => {
	var code = fn.encrypt(validUserId, validArticleId, validSalt, validTime, validMaxTokens);
	t.is(fn.decrypt(code, validArticleId, validSalt)['user'], validUserId);
	t.end()
});

test('decrypting should return the tokens when given an encrypted string', t => {
	var code = fn.encrypt(validUserId, validArticleId, validSalt, validTime, validMaxTokens);
	t.is(parseInt(fn.decrypt(code, validArticleId, validSalt)['tokens']), validMaxTokens);
	t.end()
});

test('decrypting should return the time when given an encrypted string', t => {
	var code = fn.encrypt(validUserId, validArticleId, validSalt, validTime, validMaxTokens);
	t.is(parseInt(fn.decrypt(code, validArticleId, validSalt)['time']), validTime);
	t.end()
});

test('should return true if code conforms to share code pattern', t => {
	var code = fn.encrypt(validUserId, validArticleId, validSalt, validTime, validMaxTokens);
	t.is(fn.isShareCodePattern(code), true);
	t.end();
});

test('should return false if code does not conform to share code pattern', t => {
	t.is(fn.isShareCodePattern(invalidShareCode), false);
	t.end();
});

test('decrypting with a different articleId should not return the original User ID', t => {
	var code = fn.encrypt(validUserId, validArticleId, validSalt, validTime, validMaxTokens);
	t.not(fn.decrypt(code, validArticleId2, validSalt)['user'], validUserId);
	t.end();
});
