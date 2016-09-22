# Setup

## Prerequisites:

Following tools need to be installed:

- [node.js](https://nodejs.org)
- [mongodb](https://www.mongodb.com)
- [git](https://git-scm.com/)

## Global npm libs

Install some global npm libs by executing

```
npm install -g webpack webpack-dev-server gulp
```

## Get the code

Open folder where app will be located and type

```
git clone https://github.com/nidu/co-test
cd co-test
npm install
```

# Tests

Run tests with

```
npm test
```

# Build

Build front-end with

```
webpack --config webpack.production.config.js --progress --profile --colors
```

No need to build server.

# Run

## Development

Run front-end compilation with `npm start`.
Run server with `node Code/server.js` (unfortunately no hot reload for server).

## Production

Set `NODE_ENV=production` environment variable and run `node Code/server.js`

# Feedback

The only thing that actually confused me is that it's not specified if MEAN stack should be used or [MEAN template](http://mean.io/).