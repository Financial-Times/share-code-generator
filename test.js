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

test('encrypting should accept a negative maxTokens', t => {
	t.is(typeof fn.encrypt(validUserId, validArticleId, validSalt, validTime, -1), 'string');
	t.end();
});

test('decrypting should throw for invalid values', t => {
	t.throws(fn.decrypt.bind(fn,invalidUserId, validArticleId, validSalt), Error);
	t.throws(fn.decrypt.bind(fn,validUserId, invalidArticleId, validSalt), Error);
	t.throws(fn.decrypt.bind(fn,validUserId, validArticleId, invalidSalt), Error);
	t.end();
});

test('decrypting should return the original User ID (and time and tokens) when given an encrypted string and the original article ID', t => {
	var code = fn.encrypt(validUserId, validArticleId, validSalt, validTime, validMaxTokens);
	var decryptedOutput = fn.decrypt(code, validArticleId, validSalt);

	t.is(         decryptedOutput['user'  ] , validUserId   );
	t.is(parseInt(decryptedOutput['time'  ]), validTime     );
	t.is(parseInt(decryptedOutput['tokens']), validMaxTokens);
	t.end()
});

test('decrypting should return the tokens when given an encrypted string', t => {
	var code = fn.encrypt(validUserId, validArticleId, validSalt, validTime, validMaxTokens);
	t.is(parseInt(fn.decrypt(code, validArticleId, validSalt)['tokens']), validMaxTokens);
	t.end()
});

test('decrypting should return the tokens==-1 when given an encrypted string with tokens==-10', t => {
	var code = fn.encrypt(validUserId, validArticleId, validSalt, validTime, -10);
	t.is(parseInt(fn.decrypt(code, validArticleId, validSalt)['tokens']), -1);
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

test('subtracting the articleId from the sharecode and adding a different articleId should not result in a valid code', t => {
	var code = fn.encrypt(validUserId, validArticleId, validSalt, validTime, validMaxTokens);
	var indexesMinusArticleId = fn._subtractOverArrays( fn._dictionaryIndexes(code) , fn._dictionaryIndexes( fn._removeHyphens(validArticleId)));
	var indexesPlusArticleId2 = fn._addOverArrays( indexesMinusArticleId, fn._dictionaryIndexes(fn._removeHyphens(validArticleId2)) );
	var codeWithArticleId2    = fn._dictionaryIndexesToString( indexesPlusArticleId2 );

	t.not(fn.decrypt(codeWithArticleId2, validArticleId2, validSalt)['user'], validUserId);
	t.end();
});
