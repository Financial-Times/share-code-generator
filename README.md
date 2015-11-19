## Share Code Generator [![Circle CI](https://circleci.com/gh/Financial-Times/share-code-generator/tree/master.svg?style=svg)](https://circleci.com/gh/Financial-Times/share-code-generator/tree/master)

This is an NPM module which exposes two functions which are used for generating and helping verify share codes for the FT.

### Encrypt

The encrypt function, encrypt(userId, articleId, salt, time, tokens, context=defaultContext), will return a share code for your application to use.

### Decrypt

The decrypt function, decrypt(code, article, salt), will return
```
{
	tokens:  tokens,
	time:    time,
	user:    user,
	context: context
};
```

The decrypt function does not verify if the User ID actually corresponds with a User account, it if for your application to do those checks.

## Development

This requires Node.JS to be installed on your system alongside NPM.
Check-out the repository and run `npm install` in the directory. If that has worked you should now be able to run `npm test`, which should return all tests as passing. You are now ready to develop.

## Test

```
npm test
```

# Notes

## signing

https://www.npmjs.com/package/node-rsa

```
var NodeRSA = require('node-rsa');
var key = new NodeRSA({b: 512});
 
var text = 'Hello RSA!';
var signature = key.sign(text, 'base64', 'utf8');

var checkSig = key.verify(buffer, signature, 'utf8', 'base64');

```