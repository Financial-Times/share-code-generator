import test from 'ava';
import fn from './';

const invalidShareCode = '';
const invalidUserId    = '';
const invalidArticleId = '';
const invalidSalt      = '';
const invalidTime      = 'abc';
const invalidMaxTokens = 'abc';
const invalidContext   = '_';
const invalidContext2  = 'AA';

const defaultContext   = '0';

const validUserId     = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const validUserId2    = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaabbb';
const validArticleId  = 'bbbbbbbb-aaaa-bbbb-aaaa-bbbbbbbbbbbb';
const validArticleId2 = 'bbbbbbbb-aaaa-bbbb-aaaa-bbbbbbbbbccc';
const validSalt       = '123456789012345678901234567890123456789012345678';
const validTime       = 1234567890;
const validMaxTokens  = 100;
const validContext    = 'A';

const validPem = '-----BEGIN RSA PRIVATE KEY-----\n'+
          'MIIBOQIBAAJAVY6quuzCwyOWzymJ7C4zXjeV/232wt2ZgJZ1kHzjI73wnhQ3WQcL\n'+
          'DFCSoi2lPUW8/zspk0qWvPdtp6Jg5Lu7hwIDAQABAkBEws9mQahZ6r1mq2zEm3D/\n'+
          'VM9BpV//xtd6p/G+eRCYBT2qshGx42ucdgZCYJptFoW+HEx/jtzWe74yK6jGIkWJ\n'+
          'AiEAoNAMsPqwWwTyjDZCo9iKvfIQvd3MWnmtFmjiHoPtjx0CIQCIMypAEEkZuQUi\n'+
          'pMoreJrOlLJWdc0bfhzNAJjxsTv/8wIgQG0ZqI3GubBxu9rBOAM5EoA4VNjXVigJ\n'+
          'QEEk1jTkp8ECIQCHhsoq90mWM/p9L5cQzLDWkTYoPI49Ji+Iemi2T5MRqwIgQl07\n'+
          'Es+KCn25OKXR/FJ5fu6A6A+MptABL3r8SEjlpLc=\n'+
          '-----END RSA PRIVATE KEY-----';

const invalidPem = "12345";

test('integerSequence should generate an integer sequence', t => {
	var x = 3;
	var d = 4;

	t.is(fn._integerSequence(x,x).length, 1, "integerSequence(x,x).length should be 1");
	t.is(fn._integerSequence(x,x)[0],     x, "integerSequence(x,x)[0] should be x"    );

	t.is(fn._integerSequence(x,x + d).length, d + 1, "integerSequence(x,x+d).length should be d+1");
	t.is(fn._integerSequence(x + d,x).length, d + 1, "integerSequence(x+d,x).length shoudl be d+1");

	var sequence = fn._integerSequence(x, x + d);
	for (var i = 0; i < sequence.length; i++) {
		t.is( sequence[i], i+x, "integerSequence(x, x + d)[" + i + "] should be " + (i + x));
	}

	t.end();
});

test('seededUnShuffle should unshuffle a shuffled list', t => {
	var           sequence = fn._integerSequence(0,9);
	var   shuffledSequence = fn._seededShuffle( sequence, validSalt);
	var unShuffledSequence = fn._seededUnShuffle( shuffledSequence, validSalt);

	t.is(        sequence.length,   shuffledSequence.length, 'sequence should be same length as shuffledSequence');
	t.is(shuffledSequence.length, unShuffledSequence.length, 'shuffledSequence should be same length as unShuffledSequence');

	var countShuffleDifferences   = 0;
	var countUnShuffleDifferences = 0;
	var countSequenceToUnShuffleDifferences = 0;

	for (var i = 0; i < sequence.length; i++) {
		if (        sequence[i] !==   shuffledSequence[i]) { countShuffleDifferences++;             }
		if (shuffledSequence[i] !== unShuffledSequence[i]) { countUnShuffleDifferences++;           }
		if (        sequence[i] !== unShuffledSequence[i]) { countSequenceToUnShuffleDifferences++;	}
	}

	if (process.env.NODE_ENV !== 'production') {
		console.log([
			'sequences:',
			'           sequence = ' + sequence.join(', '),
			'   shuffledSequence = ' + shuffledSequence.join(', '),
			' unShuffledSequence = ' + unShuffledSequence.join(', '),
			].join("\n"));
	}

	t.is(  countShuffleDifferences > 0, true, 'should be >0 differences between sequence and shuffledSequence');
	t.is(countUnShuffleDifferences > 0, true, 'should be >0 differences between shuffledSequence and unShuffledSequence');
	t.is(countSequenceToUnShuffleDifferences, 0, 'should be 0 differences between sequence and unShuffledSequence');

	t.end();
});

test('encrypting should throw for invalid values', t => {
	t.throws(fn.encrypt.bind(fn,invalidUserId,   validArticleId,   validTime,   validMaxTokens,    validContext,   validPem), Error);
	t.throws(fn.encrypt.bind(fn,  validUserId, invalidArticleId,   validTime,   validMaxTokens,    validContext,   validPem), Error);
	t.throws(fn.encrypt.bind(fn,  validUserId,   validArticleId, invalidTime,   validMaxTokens,    validContext,   validPem), Error);
	t.throws(fn.encrypt.bind(fn,  validUserId,   validArticleId,   validTime, invalidMaxTokens,    validContext,   validPem), Error);
	t.throws(fn.encrypt.bind(fn,  validUserId,   validArticleId,   validTime,   validMaxTokens,  invalidContext,   validPem), Error);
	t.throws(fn.encrypt.bind(fn,  validUserId,   validArticleId,   validTime,   validMaxTokens, invalidContext2,   validPem), Error);
	t.throws(fn.encrypt.bind(fn,  validUserId,   validArticleId,   validTime,   validMaxTokens,    validContext, invalidPem), Error);
	t.end();
});

test('encrypting should return a string', t => {
	var context;

	t.is(typeof fn.encrypt(validUserId, validArticleId, validTime, validMaxTokens, validContext, validPem), 'string');

	t.end();
});

test('encrypting should accept a negative maxTokens', t => {
	t.is(typeof fn.encrypt(validUserId, validArticleId, validTime, -1, validContext, validPem), 'string');
	t.end();
});

test('decrypting should throw for invalid values', t => {
	t.throws(fn.decrypt.bind(fn,invalidUserId, validArticleId,   validPem), Error);
	t.throws(fn.decrypt.bind(fn,validUserId, invalidArticleId,   validPem), Error);
	t.throws(fn.decrypt.bind(fn,validUserId,   validArticleId, invalidPem), Error);
	t.end();
});

test('decrypting should throw for corrupted sharecode', t => {
	var shareCode = fn.encrypt(validUserId, validArticleId, validTime, validMaxTokens, validContext, validPem);
	var shuffledShareCode = fn._seededShuffle( shareCode.split(''), validPem ).join('');

	t.throws(fn.decrypt.bind(fn, shuffledShareCode, validArticleId, validContext, validPem), Error);
	t.end();
});

test('decrypting should throw for incremented max tokens char', t => {
	var shareCode = fn.encrypt(validUserId, validArticleId, validTime, validMaxTokens, validContext, validPem);
	var indexes = fn._dictionaryIndexes( shareCode );
	indexes[indexes.length - 1] = fn._mod( indexes[indexes.length - 1] + 1, fn._numPossibleChars);
	var twiddledShareCode = fn._dictionaryIndexesToString( indexes );
	t.throws(fn.decrypt.bind(fn, twiddledShareCode, validArticleId, validContext, validPem), Error);
	t.end();
});

test('decrypting should return the original User ID (and time and tokens) when given an encrypted string and the original article ID', t => {
	var code = fn.encrypt(validUserId, validArticleId, validTime, validMaxTokens, validContext, validPem);
	var decryptedOutput = fn.decrypt(code, validArticleId, validPem);

	t.is(         decryptedOutput['user'   ]     , validUserId   );
	t.is(parseInt(decryptedOutput['time'   ], 10), validTime     );
	t.is(parseInt(decryptedOutput['tokens' ], 10), validMaxTokens);

	t.is(         decryptedOutput['context'],      validContext  , 'context(' + decryptedOutput['context'] + ') should be ' + validContext);
	t.end();
});

test('decrypting should return the original context when given an encrypted string and the original article ID', t => {

	var contexts = ['0', '1', '2', 'a', 'A'];

	contexts.map(function(context){
		var code = fn.encrypt(validUserId, validArticleId, validTime, validMaxTokens, context, validPem);
		var decryptedOutput = fn.decrypt(code, validArticleId, validPem);

		t.is( decryptedOutput['context'], context, 'context(' + decryptedOutput['context'] + ') should be ' + context);
	});

	t.end();
});

test('decrypting should return the tokens when given an encrypted string', t => {
	var code = fn.encrypt(validUserId, validArticleId, validTime,  validMaxTokens, validContext, validPem);
	t.is(parseInt(fn.decrypt(code, validArticleId, validPem)['tokens'], 10), validMaxTokens);
	t.end();
});

test('decrypting should return the tokens==-1 when given an encrypted string with tokens==-123', t => {
	var code = fn.encrypt(validUserId, validArticleId, validTime, -123, validContext, validPem);
	t.is(parseInt(fn.decrypt(code, validArticleId, validPem)['tokens'], 10), -1);
	t.end();
});

test('decrypting should return the time when given an encrypted string', t => {
	var code = fn.encrypt(validUserId, validArticleId, validTime, validMaxTokens, validContext, validPem);
	t.is(parseInt(fn.decrypt(code, validArticleId, validPem)['time'], 10), validTime);
	t.end();
});

test('should return true if code conforms to share code pattern', t => {
	var code = fn.encrypt(validUserId, validArticleId, validTime, validMaxTokens, validContext, validPem);
	t.is(fn.isShareCodePattern(code), true);
	t.end();
});

test('should return false if code does not conform to share code pattern', t => {
	t.is(fn.isShareCodePattern(invalidShareCode), false);
	t.end();
});

test('decrypting with a different articleId should throw', t => {
	var code = fn.encrypt(validUserId, validArticleId, validTime, validMaxTokens, validContext, validPem);
	t.throws(fn.decrypt.bind(code, validArticleId2, validPem), Error);
	t.end();
});

