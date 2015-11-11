'use strict'

var shuffle = require('knuth-shuffle-seeded');

var lowercase         = 'abcdefghijklmnopqrstuvwxyz';
var numbers           = '0123456789';
var uppercase         = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
var otherUnreserved   = "-";
var dictionaryAsArray = (lowercase + numbers + uppercase + otherUnreserved).split('');
var dictionary        = arrayToObject(dictionaryAsArray);
var numPossibleChars  = dictionaryAsArray.length;

// example Next url with article uuid is https://next.ft.com/content/b09f4c12-7c75-11e5-98fb-5a6d4728f74e
var uuidRegexChar            = "[a-z0-9]";
var uuidRegexFragmentLengths = [8,4,4,4,12];
var uuidLengthWithoutHyphens = uuidRegexFragmentLengths.reduce(function(tot,n){return tot+n;});
var uuidLengthWithHyphens    = uuidLengthWithoutHyphens + uuidRegexFragmentLengths.length - 1;
var uuidRegexFragments       = uuidRegexFragmentLengths.map(function(n){return "(" + uuidRegexChar + "{" + n +"})";});
var uuidRegexWithHyphens     = new RegExp('^' + uuidRegexFragments.join('-') + '$'); // e.g. ([a-z0-9]{8})-([a-z0-9]{4})-([a-z0-9]{4})-([a-z0-9]{4})-([a-z0-9]{12})
var uuidRegexWithoutHyphens  = new RegExp('^' + uuidRegexFragments.join('')  + '$'); // e.g. ([a-z0-9]{8})([a-z0-9]{4})([a-z0-9]{4})([a-z0-9]{4})([a-z0-9]{12})
var uuidReconstructPattern   = uuidRegexFragmentLengths.map(function(n,i){return '$' + (i+1);}).join('-'); // e.g. "$1-$2-$3-$4-$5"

var unixtimeStringLength  = 10;
var maxTokensStringLength =  4;
var checksumStringLength  =  1;
var shareCodeLength       = uuidLengthWithoutHyphens + unixtimeStringLength + maxTokensStringLength + checksumStringLength;

var codeRegexChar   = '[' + dictionaryAsArray.join('') + ']';
var saltRegexString = '^' + codeRegexChar + '{' + shareCodeLength + '}';
var codeRegex       = new RegExp( saltRegexString + '$' );
var saltRegex       = new RegExp( saltRegexString       ); // salt could be longer - we don't care

var unixtimeRegex  = new RegExp('^[0-9]{' + unixtimeStringLength  + '}$');
var maxTokensRegex = new RegExp('^(-[0-9]{' + (maxTokensStringLength -1) + '}|[0-9]{' + maxTokensStringLength + '})$');

if (process.env.NODE_ENV !== 'production') {
	console.log("share code config dump:\n" + [
		"           uuidRegexChar = " + uuidRegexChar,
		"        numPossibleChars = " + numPossibleChars,
		"uuidRegexFragmentLengths = " + uuidRegexFragmentLengths,
		"uuidLengthWithoutHyphens = " + uuidLengthWithoutHyphens,
		"   uuidLengthWithHyphens = " + uuidLengthWithHyphens,
		"      uuidRegexFragments = " + uuidRegexFragments,
		"    uuidRegexWithHyphens = " + uuidRegexWithHyphens,
		" uuidRegexWithoutHyphens = " + uuidRegexWithoutHyphens,
		"  uuidReconstructPattern = " + uuidReconstructPattern,
		"    unixtimeStringLength = " + unixtimeStringLength,
		"   maxTokensStringLength = " + maxTokensStringLength,
		"         shareCodeLength = " + shareCodeLength,
		"               saltRegex = " + saltRegex,
		"               codeRegex = " + codeRegex,
		"           unixtimeRegex = " + unixtimeRegex,
		"          maxTokensRegex = " + maxTokensRegex

		].join("\n")
		);
}

function dictionaryIndexesToString(dictionaryIndexes) {
	return dictionaryIndexes.map(dictionaryIndexToChar).join('');
}

function dictionaryIndexToChar(index) {
	return dictionary[index];
}

function formatAsUUID(string) {
	return string.replace(uuidRegexWithoutHyphens, uuidReconstructPattern);
}

function toArray(string) {
	return string.split('');
}

function dictionaryIndexes(string) {
	return toArray(string).map(positionWithinDictionary);
}

function positionWithinDictionary(character) {
	return dictionaryAsArray.indexOf(character);
}

function addOverArrays(a, b) { // zip -> map(reduce(sum))
	return a.map((x, index) => {
		if (b[index] != null ) {
			return b[index] + x;
		} else {
			return x;
		}
	});
}

function subtractOverArrays(a, b) {
	return a.map((x, index) => {
		if (b[index] != null ) {
			return x - b[index];
		} else {
			return x;
		}
	});
}

function mod(n, m) {
    return (n + (Math.abs(Math.trunc(n))*m)) % m;
}

function arrayToObject(arr) {
	return arr.reduce(function(o, v, i) {
		o[i] = v;
		return o;
	}, {});
}

function addInPairs(arr) {
	return arr.map(function(item, index) {
		if (index % 2 === 0) {
			if (arr[index + 1] !== null) {
				return item + arr[index + 1];
			} else {
				return item;
			}
		}
	}).filter(x => x !== null || x !== undefined )
}

function removeHyphens(string) {
	return string.replace(/-/g,'');
}

function validateStringOrThrow(name, value, regexp){
	if (! regexp.test(value)) {
		throw new Error('Not a valid ' + name + '. value="' + value + '" (length=' + value.length + ') does not match regexp=' + regexp.toString());
	}
}

function validateEqualityOrThrow(v1, v2, message){
	if (v1 !== v2) {
		throw new Error('Failed equality check: ' + v1 + ' !== ' + v2 + ': ' + message);
	}
}

// any -ve num is coerced to -1

function constructMaxTokensString( num, maxLength ) {
	if (maxLength < 2) {
		throw new Error( "constructMaxTokensString: maxLength(" + maxLength + ") is too short to accommodate a possible value of num=-1" );
	}

	// coerce any -ve num to be -1
	if (num < 0) {
		num = -1;
	} else if( num < (1+Math.floor(Math.log10(num))) ) {
		throw new Error("constructMaxTokensString: maxLength(" +  maxLength + ") is too short to accommodate num=" + num);
	}

	return zeroPadNumToN( num, maxLength );
}

// given an integer (num), ensure it is zero-padded to n places,
// e.g. (12,3) -> "012", (12,5) -> "00012", (-1,4) -> "-001" [NB: result is a string of n chars]

function zeroPadNumToN(num, n) {
	var zeroPadded;
	if (num<0) {
		zeroPadded = '-' + zeroPadNumToN(-1 * num, n-1);
	} else {
		var nZeroes = Array(n+1).join('0')
		zeroPadded = (nZeroes + num).slice(-1 * n);
	}

	return zeroPadded;
}

// For shuffling arrays:
// - construct a seed from the salt (just use the salt string)
// - created a seeded prng (via knuth-shuffle-seeded, added to package.json, 
// -- https://www.npmjs.com/package/knuth-shuffle-seeded)
// -- https://github.com/TimothyGu/knuth-shuffle-seeded
// - construct reversible shuffle of article id

function seededShuffle( array, salt ) {
	var clonedArray   = array.slice(0);
	var shuffledArray = shuffle(clonedArray, salt);
	return shuffledArray;
}

function integerSequence( from, to ) {
	var list = [];
	var step = Math.sign( to - from );

	for (var i = from; i <= to; i += step) {
		list.push(i);
	}

	return list;
}

function seededUnShuffle( array, salt ) {
	var         sequence = integerSequence(0, array.length - 1);
	var shuffledSequence = seededShuffle( sequence, salt );
	var shuffledIndicies = [];

	var i;

	for (i = 0; i < shuffledSequence.length; i++) {
		shuffledIndicies[shuffledSequence[i]] = i;
	}

	var  unShuffledArray = [];

	for (i = 0; i < shuffledSequence.length; i++) {
		unShuffledArray[i] = array[shuffledIndicies[i]];
	}

	return unShuffledArray;
}

function calcIndiciesChecksum( indicies ){
	return indicies.reduce(function(prev,current){ return prev+current; }, 0);
}

function calcChecksumAsIndex( checksum, modulus ){
	return mod(checksum, modulus);
}

//------------------------------------------
// exported functions

function encrypt(userId, articleId, salt, time, tokens) {
	var timeString   = '' + time;
	var tokensString = constructMaxTokensString(tokens, maxTokensStringLength);

	validateStringOrThrow(      'userId',       userId, uuidRegexWithHyphens);
	validateStringOrThrow(   'articleId',    articleId, uuidRegexWithHyphens);
	validateStringOrThrow(        'salt',         salt, saltRegex           );
	validateStringOrThrow(  'timeString',   timeString, unixtimeRegex       );
	validateStringOrThrow('tokensString', tokensString, maxTokensRegex      );

	var user    = removeHyphens(userId);
	var article = removeHyphens(articleId);

	var userTimeTokens = user + timeString + tokensString;

	var userTimeTokensDictionaryIndexes  = dictionaryIndexes(userTimeTokens);
	var checksumIndex 					 = calcChecksumAsIndex(calcIndiciesChecksum(userTimeTokensDictionaryIndexes), numPossibleChars);
	userTimeTokensDictionaryIndexes.push( checksumIndex );

	var articleDictionaryIndexes         = dictionaryIndexes(article);
	var shuffledArticleDictionaryIndexes = seededShuffle(articleDictionaryIndexes, salt);
	var saltDictionaryIndexes            = dictionaryIndexes(salt);

	// ensure salt is always 2nd arg to addOverArrays
	var tokenIndexes = addOverArrays(addOverArrays(userTimeTokensDictionaryIndexes, shuffledArticleDictionaryIndexes), saltDictionaryIndexes)
	.map(a => mod(a, numPossibleChars));

	var code = dictionaryIndexesToString(tokenIndexes);

	return code;
}

function decrypt(code, article, salt) {

	validateStringOrThrow(     'code',    code, codeRegex           );
	validateStringOrThrow('articleId', article, uuidRegexWithHyphens);
	validateStringOrThrow(     'salt',    salt, saltRegex           );

	var codeDictionaryIndexes            = dictionaryIndexes(code);
	var articleDictionaryIndexes         = dictionaryIndexes(removeHyphens(article));
	var shuffledArticleDictionaryIndexes = seededShuffle(articleDictionaryIndexes, salt);
	var saltDictionaryIndexes            = dictionaryIndexes(salt);

	// ensure salt is always 2nd arg to addOverArrays
	var userTimeTokensDictionaryIndexes = subtractOverArrays(subtractOverArrays(codeDictionaryIndexes, shuffledArticleDictionaryIndexes), saltDictionaryIndexes)
	.map(a => mod(a, numPossibleChars));

	var suppliedChecksumIndex   = userTimeTokensDictionaryIndexes.pop();
	var calculatedChecksumIndex = calcChecksumAsIndex(calcIndiciesChecksum( userTimeTokensDictionaryIndexes ), numPossibleChars);
	validateEqualityOrThrow(suppliedChecksumIndex, calculatedChecksumIndex, 'checksum mismatch');

	var userTimeTokens = dictionaryIndexesToString(userTimeTokensDictionaryIndexes);
	
	var tokens = userTimeTokens.slice(uuidLengthWithoutHyphens + unixtimeStringLength);
	var time   = userTimeTokens.slice(uuidLengthWithoutHyphens, uuidLengthWithoutHyphens + unixtimeStringLength);
	var user   = formatAsUUID(userTimeTokens.slice(0,uuidLengthWithoutHyphens));

	// Baaf if we produce invalid values from the decryption.
	// In this case, the requirements that the unixtime and maxTokens are valid integer strings is acting as a sort of checksum.

	validateStringOrThrow('decrypted unixtime',    time,   unixtimeRegex        );
	validateStringOrThrow('decrypted maxTokens',   tokens, maxTokensRegex       );
	validateStringOrThrow('decrypted sharer UUID', user,   uuidRegexWithHyphens );

	return {
		tokens: tokens,
		time:   time,
		user:   user
	};
}

function isShareCodePattern(code) {
	return codeRegex.test(code);
}

module.exports = {
	encrypt: encrypt,
	decrypt: decrypt,
	isShareCodePattern: isShareCodePattern,
	_removeHyphens: removeHyphens,
	_dictionaryIndexes: dictionaryIndexes,
	_addOverArrays: addOverArrays,
	_subtractOverArrays: subtractOverArrays,
	_dictionaryIndexesToString: dictionaryIndexesToString,
	_seededShuffle: seededShuffle,
	_seededUnShuffle: seededUnShuffle,
	_integerSequence: integerSequence,
	_mod: mod,

	_numPossibleChars: numPossibleChars
};