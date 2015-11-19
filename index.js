'use strict'

var shuffle = require('knuth-shuffle-seeded');

var crypto      = require('crypto');
var sha         = 'RSA-SHA256';
var sigEncoding = 'hex';
var sigLength   = 8;
var pemRegex    = new RegExp('^-----BEGIN.*-----');
var sigRegex    = new RegExp('^[a-f0-9]{' + sigLength + '}$');

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
var contextStringLength   =  1;
var checksumStringLength  =  sigLength;
var shareDetailsLength    = uuidLengthWithoutHyphens + unixtimeStringLength + maxTokensStringLength + contextStringLength;
var shareCodeLength       = shareDetailsLength + checksumStringLength;

var defaultContext = '0';

var codeRegexChar   = '[' + dictionaryAsArray.join('') + ']';
var codeRegex       = new RegExp( '^' + codeRegexChar + '{' + shareCodeLength + '}$' );
var detailsRegex    = new RegExp( '^' + codeRegexChar + '{' + shareDetailsLength + '}' + '$' );
var checksumRegex   = new RegExp('^' + codeRegexChar + '$');
var unixtimeRegex   = new RegExp('^[0-9]{' + unixtimeStringLength  + '}$');
var maxTokensRegex  = new RegExp('^(-[0-9]{' + (maxTokensStringLength -1) + '}|[0-9]{' + maxTokensStringLength + '})$');
var contextRegex    = new RegExp('^' + codeRegexChar + '{' + contextStringLength + '}$');

if (process.env.NODE_ENV !== 'production') {
	console.log("share code config dump:\n" + [
		"                     sha = " + sha,
		"             sigEncoding = " + sigEncoding, 
		"               sigLength = " + sigLength,
		"                pemRegex = " + pemRegex,
		"                sigRegex = " + sigRegex,
		"           checksumRegex = " + checksumRegex,
		"      shareDetailsLength = " + shareDetailsLength,
		"            detailsRegex = " + detailsRegex,
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
		"     contextStringLength = " + contextStringLength,
		"         shareCodeLength = " + shareCodeLength,
		"          defaultContext = " + defaultContext,
		"               codeRegex = " + codeRegex,
		"           unixtimeRegex = " + unixtimeRegex,
		"          maxTokensRegex = " + maxTokensRegex,
		"            contextRegex = " + contextRegex

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

function seededShuffle( array, seed ) {
	var clonedArray   = array.slice(0);
	var shuffledArray = shuffle(clonedArray, seed);
	return shuffledArray;
}

function integerSequence( from, to ) {
	var list = [];
	var step = Math.sign( to - from );
	if (step === 0){
		step = 1;
	} else if (step === -1) {
		var temp = from;
		from = to;
		to = temp;
	}

	for (var i = from; i <= to; i += 1) {
		list.push(i);
	}

	return (step === 1)? list : list.reverse();
}

function seededUnShuffle( array, seed ) {
	var         sequence = integerSequence(0, array.length - 1);
	var shuffledSequence = seededShuffle( sequence, seed );
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

function calcSigOfText(text, pem){
	var signer = crypto.createSign(sha);
	signer.update(text);
	var sign   = signer.sign(pem, sigEncoding);
	var sig    = sign.slice(0,sigLength);
	return sig;
}

function calcSigOfShareDetails(shareDetails, articleId, pem){
	validateStringOrThrow('shareDetails', shareDetails,         detailsRegex);
	validateStringOrThrow(   'articleId',    articleId, uuidRegexWithHyphens);
	var sig = calcSigOfText(shareDetails + articleId, pem);
	validateStringOrThrow( 'sig', sig, sigRegex );
	return sig;
}

//------------------------------------------
// exported functions

function encrypt(userId, articleId, time, tokens, context, pem) {
	var timeString   = '' + time;
	var tokensString = constructMaxTokensString(tokens, maxTokensStringLength);

	validateStringOrThrow(       'userId',        userId, uuidRegexWithHyphens);
	validateStringOrThrow(    'articleId',     articleId, uuidRegexWithHyphens);
	validateStringOrThrow(   'timeString',    timeString, unixtimeRegex       );
	validateStringOrThrow( 'tokensString',  tokensString, maxTokensRegex      );
	validateStringOrThrow('contextString',       context, contextRegex        );
	validateStringOrThrow(          'pem',           pem, pemRegex            );

	var user         = removeHyphens(userId);
	var shareDetails = user + timeString + tokensString + context;
	validateStringOrThrow( 'shareDetails', shareDetails, detailsRegex );

	var sig = calcSigOfShareDetails( shareDetails, articleId, pem );

	var shareCodeUnshuffled      = shareDetails + sig;
	var shareCodeUnshuffledArray = shareCodeUnshuffled.split('');
	var shareCodeArray           = seededShuffle(shareCodeUnshuffledArray, pem+articleId);
	var shareCode                = shareCodeArray.join('');
	validateStringOrThrow( 'shareCode', shareCode, codeRegex );

	return shareCode;
}

function decrypt(code, articleId, pem) {

	validateStringOrThrow(     'code',      code, codeRegex           );
	validateStringOrThrow('articleId', articleId, uuidRegexWithHyphens);
	validateStringOrThrow(      'pem',       pem, pemRegex            );

	var codeArray           = code.split('');
	var codeUnshuffledArray = seededUnShuffle( codeArray, pem+articleId );
	var codeUnshuffled      = codeUnshuffledArray.join('');
	var shareDetails        = codeUnshuffled.slice(0,shareDetailsLength);
	var sig                 = codeUnshuffled.slice(shareDetailsLength);
	validateStringOrThrow( 'sig', sig, sigRegex );

	var recalcSig = calcSigOfShareDetails( shareDetails, articleId, pem);

	if ( sig !== recalcSig ) {
		throw new Error('Corrupt sharecode: sig mismatch');
	}

	var context = shareDetails.slice(uuidLengthWithoutHyphens + unixtimeStringLength + maxTokensStringLength);
	var tokens  = shareDetails.slice(uuidLengthWithoutHyphens + unixtimeStringLength, uuidLengthWithoutHyphens + unixtimeStringLength + maxTokensStringLength);
	var time    = shareDetails.slice(uuidLengthWithoutHyphens, uuidLengthWithoutHyphens + unixtimeStringLength);
	var user    = formatAsUUID(shareDetails.slice(0,uuidLengthWithoutHyphens));

	// Barf if we produce invalid values from the decryption.
	// In this case, the requirements that the unixtime and maxTokens are valid integer strings is acting as a sort of checksum.

	validateStringOrThrow('decrypted unixtime',       time, unixtimeRegex        );
	validateStringOrThrow('decrypted maxTokens',    tokens, maxTokensRegex       );
	validateStringOrThrow('decrypted sharer UUID',    user, uuidRegexWithHyphens );
	validateStringOrThrow('decrypted context',     context, contextRegex         );

	return {
		tokens:  tokens,
		time:    time,
		user:    user,
		context: context
	};
}

function isShareCodePattern(code) {
	return codeRegex.test(code);
}

module.exports = {
	encrypt: encrypt,
	decrypt: decrypt,
	isShareCodePattern: isShareCodePattern,
	_seededShuffle: seededShuffle,
	_seededUnShuffle: seededUnShuffle,
	_integerSequence: integerSequence
};
