## Share Code Generator [![Circle CI](https://circleci.com/gh/Financial-Times/share-code-generator/tree/master.svg?style=svg)](https://circleci.com/gh/Financial-Times/share-code-generator/tree/master)

This is an NPM module which exposes two functions which are used for generating and helping verify share codes for the FT.

### Encrypt

The encrypt function, when given a User ID and an article ID will return a share code for your application to use.

### Decrypt

The decrypt function, when given a share code and an article ID will return a User ID for your application to use. The decrypt function does not verify if the User ID actually corresponds with a User account, it if for your application to do those checks.

## Development

This requires Node.JS to be installed on your system alongside NPM.
Check-out the repository and run `npm install` in the directory. If that has worked you should now be able to run `npm test`, which should return all tests as passing. You are now ready to develop.
