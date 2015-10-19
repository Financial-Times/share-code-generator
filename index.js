var lowercase = 'abcdefghijklmnopqrstuvwxyz';
var numbers = '0123456789';
var uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
var specials = ":@-._~!$&'()*+,=;";
var dictionaryAsArray = (lowercase + numbers + uppercase + specials).split('');
var dictionary = arrayToObject(dictionaryAsArray);

function dictionaryIndexesToString(dictionaryIndexes) {
	return dictionaryIndexes.map(dictionaryIndexToChar).join('');
}

function dictionaryIndexToChar(index) {
	return dictionary[index];
}

function formatAsUUID(string) {
	return string.replace(/([a-z0-9]{8})([a-z0-9]{4})([a-z0-9]{4})([a-z0-9]{4})([a-z0-9]{12})/, "$1-$2-$3-$4-$5");
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
			if (arr[index + 1] != null) {
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

function isValidCode(code) {
	return /[a-z0-9]{32}/.test(code);
}

function isValidUuid(uuid) {
	return /([a-z0-9]{8})-([a-z0-9]{4})-([a-z0-9]{4})-([a-z0-9]{4})-([a-z0-9]{12})/.test(uuid);
}

function isValidSalt(salt) {
	return /[a-z0-9]{32}/.test(salt);
}

function encrypt(userId, articleId, salt, time, tokens) {

	var validUserId = isValidUuid(userId);
	var validArticleId = isValidUuid(articleId);
	var validSalt = isValidSalt(salt);

	if (validUserId) {
		if (validArticleId) {
			if (validSalt) {
				var user = removeHyphens(userId);
				var article = removeHyphens(articleId);

				var userTimeTokens = user + time + tokens;

				var userTimeTokensDictionaryIndexes = dictionaryIndexes(userTimeTokens);
				var articleDictionaryIndexes = dictionaryIndexes(article);
				var saltDictionaryIndexes = dictionaryIndexes(salt);

				var tokenIndexes = addOverArrays(addOverArrays(userTimeTokensDictionaryIndexes, saltDictionaryIndexes), articleDictionaryIndexes)
				.map(a => mod(a, 36));

				var code = dictionaryIndexesToString(tokenIndexes);

				return code;
			} else {
				throw new Error('Not a valid salt. Needs to be a string that follows this regex pattern, `/[a-z0-9]{32}/` .');
			}
		} else {
			throw new Error('Not a valid Article ID. Needs to be a uuid.');
		}
	} else {
		throw new Error('Not a valid User ID. Needs to be a uuid.');
	}
}

function decrypt(code, article, salt) {
	if (isValidCode(code)) {
		if (isValidUuid(article)) {
			if (isValidSalt(salt)) {
				var codeDictionaryIndexes = dictionaryIndexes(code);
				var articleDictionaryIndexes = dictionaryIndexes(removeHyphens(article));
				var saltDictionaryIndexes = dictionaryIndexes(salt);

				var userTimeTokensDictionaryIndexes = subtractOverArrays(subtractOverArrays(codeDictionaryIndexes, articleDictionaryIndexes), saltDictionaryIndexes)
				.map(a => mod(a, 36));

				var userTimeTokens = dictionaryIndexesToString(userTimeTokensDictionaryIndexes);
				
				var tokens = userTimeTokens.slice(45);
				var time = userTimeTokens.slice(32,45);
				var user = formatAsUUID(userTimeTokens.slice(0,32));

				return {
					tokens: tokens,
					time: time,
					user: user
				};
			} else {
				throw new Error('Not a valid salt. Needs to be a string that follows this regex pattern, `/[a-z0-9]{32}/` .');
			}
		} else {
			throw new Error('Not a valid Article ID. Needs to be a uuid.');
		}
	} else {
		throw new Error('Not a valid User ID. Needs to be a uuid.');
	}
}

function isShareCodePattern(code) {
	return /[a-z0-9]{46}/.test(code) || /[a-z0-9]{47}/.test(code) || /[a-z0-9]{48}/.test(code) || /[a-z0-9]{49}/.test(code);
}

module.exports = {
	encrypt: encrypt,
	decrypt: decrypt,
	isShareCodePattern: isShareCodePattern
};