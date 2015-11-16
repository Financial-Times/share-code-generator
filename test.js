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
const validSalt       = '12345678901234567890123456789012345678901234567';
const validTime       = 1234567890;
const validMaxTokens  = 100;

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

test('decrypting should throw for corrupted sharecode', t => {
	var shareCode = fn.encrypt(validUserId, validArticleId, validSalt, validTime, validMaxTokens);
	var shuffledShareCode = fn._seededShuffle( shareCode.split(''), validSalt ).join('');

	t.throws(fn.decrypt.bind(fn, shuffledShareCode, validArticleId, validSalt), Error);
	t.end();
});

test('decrypting should throw for incremented max tokens char', t => {
	var shareCode = fn.encrypt(validUserId, validArticleId, validSalt, validTime, validMaxTokens);
	var indexes = fn._dictionaryIndexes( shareCode );
	indexes[indexes.length - 1] = fn._mod( indexes[indexes.length - 1] + 1, fn._numPossibleChars);
	var twiddledShareCode = fn._dictionaryIndexesToString( indexes );
	t.throws(fn.decrypt.bind(fn, twiddledShareCode, validArticleId, validSalt), Error);
	t.end();
});

test('decrypting should return the original User ID (and time and tokens) when given an encrypted string and the original article ID', t => {
	var code = fn.encrypt(validUserId, validArticleId, validSalt, validTime, validMaxTokens);
	var decryptedOutput = fn.decrypt(code, validArticleId, validSalt);

	t.is(         decryptedOutput['user'  ]     , validUserId   );
	t.is(parseInt(decryptedOutput['time'  ], 10), validTime     );
	t.is(parseInt(decryptedOutput['tokens'], 10), validMaxTokens);
	t.end();
});

test('decrypting should return the tokens when given an encrypted string', t => {
	var code = fn.encrypt(validUserId, validArticleId, validSalt, validTime,  validMaxTokens);
	t.is(parseInt(fn.decrypt(code, validArticleId, validSalt)['tokens'], 10), validMaxTokens);
	t.end();
});

test('decrypting should return the tokens==-1 when given an encrypted string with tokens==-123', t => {
	var code = fn.encrypt(validUserId, validArticleId, validSalt, validTime, -123);
	t.is(parseInt(fn.decrypt(code, validArticleId, validSalt)['tokens'], 10), -1);
	t.end();
});

test('decrypting should return the time when given an encrypted string', t => {
	var code = fn.encrypt(validUserId, validArticleId, validSalt, validTime, validMaxTokens);
	t.is(parseInt(fn.decrypt(code, validArticleId, validSalt)['time'], 10), validTime);
	t.end();
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

test('decrypting with a different articleId should throw', t => {
	var code = fn.encrypt(validUserId, validArticleId, validSalt, validTime, validMaxTokens);
	t.throws(fn.decrypt.bind(code, validArticleId2, validSalt), Error);
	t.end();
});

// now that the articleID is shuffled before being added to the shareCode, this is pretty much irrelevant.
test('subtracting the articleId from the sharecode and adding a different articleId should not result in a valid code', t => {
	var code = fn.encrypt(validUserId, validArticleId, validSalt, validTime, validMaxTokens);
	var indexesMinusArticleId = fn._subtractOverArrays( fn._dictionaryIndexes(code) , fn._dictionaryIndexes( fn._removeHyphens(validArticleId)));
	var indexesPlusArticleId2 = fn._addOverArrays( indexesMinusArticleId, fn._dictionaryIndexes(fn._removeHyphens(validArticleId2)) );
	var codeWithArticleId2    = fn._dictionaryIndexesToString( indexesPlusArticleId2 );

	t.throws(fn.decrypt.bind(codeWithArticleId2, validArticleId2, validSalt), Error);
	t.end();
});
