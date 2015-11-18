'use strict'

var NodeRSA = require('node-rsa');
var crypto = require('crypto');

var pem = '-----BEGIN RSA PRIVATE KEY-----\n'+
          'MIIBOQIBAAJAVY6quuzCwyOWzymJ7C4zXjeV/232wt2ZgJZ1kHzjI73wnhQ3WQcL\n'+
          'DFCSoi2lPUW8/zspk0qWvPdtp6Jg5Lu7hwIDAQABAkBEws9mQahZ6r1mq2zEm3D/\n'+
          'VM9BpV//xtd6p/G+eRCYBT2qshGx42ucdgZCYJptFoW+HEx/jtzWe74yK6jGIkWJ\n'+
          'AiEAoNAMsPqwWwTyjDZCo9iKvfIQvd3MWnmtFmjiHoPtjx0CIQCIMypAEEkZuQUi\n'+
          'pMoreJrOlLJWdc0bfhzNAJjxsTv/8wIgQG0ZqI3GubBxu9rBOAM5EoA4VNjXVigJ\n'+
          'QEEk1jTkp8ECIQCHhsoq90mWM/p9L5cQzLDWkTYoPI49Ji+Iemi2T5MRqwIgQl07\n'+
          'Es+KCn25OKXR/FJ5fu6A6A+MptABL3r8SEjlpLc=\n'+
          '-----END RSA PRIVATE KEY-----';

var key = new NodeRSA(pem);
 
var text = 'ABCDEFghijklMNOPQRstuvWxYz12344466475654jlh64jkgh4hkghk54ghk5';
var signature = key.sign(text, 'base64', 'utf8');
var checkSig = key.verify(text, signature, 'utf8', 'base64');

console.log([
	"node-rsa:",
	"key=" + key,
	"text=" + text,
	"signature=" + signature,
	"checkSig=" + checkSig
	].join("\n"));

var hash = crypto.createHash('sha1');
hash.update( text );
var digest = hash.digest('hex');

console.log([
	"",
	"crypto.createHash:",
	"text=" + text,
	"digest=" + digest
	].join("\n"));

console.log("\nmany hashes:");

for (var i = 0; i < 10; i++) {
	hash = crypto.createHash('sha1');
	var texti = text + i;
	hash.update( texti );
	digest = hash.digest('hex');
	var sig = digest.slice(0,8);
	console.log("texti=" + texti + ", digest=" + digest + ", sig=" + sig);
}

// var signer = crypto.createSign('sha1');
// signer.update(text);
// var sign = signer.sign(pem, 'hex');
// var verifier = crypto.createVerify('sha1');
// verifier.update(text);
// var verify = verifier.verify( pem, sign, 'hex');

// console.log([
// 	"",
// 	"crypto.createSign:",
// 	"text=" + text,
// 	"sign=" + sign,
// 	"verify=" + verify
// 	].join("\n"));

