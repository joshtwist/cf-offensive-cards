// In order for our ES6 shim to find the class, we must export it
// from the root of the CommonJS bundle
const GameStorage = require('./gamestorage.js');
exports.GameStorage = GameStorage;

import Router from './router.js';
const router = new Router();

import Game from './game.js';
const game = new Game();

router.addRoute('GET', '/', () => 'Welcome');
router.addRoute('GET', '/websocket/:gameId', game.initiateWebSocket);
router.addRoute('GET', '/cards', game.getCards);
router.addRoute('POST', '/games', game.createGame);
router.addRoute('GET', '/games/:gameId', game.getPlayerState, [game.loadGame]);
router.addRoute('POST', '/games/:gameId/join', game.joinGame, [game.loadGame]);
router.addRoute('POST', '/games/:gameId/start', game.startGame, [game.loadGame, game.ensureAndLoadUser]);
router.addRoute('POST', '/games/:gameId/submit', game.submitCard, [game.loadGame, game.ensureAndLoadUser]);
router.addRoute('POST', '/games/:gameId/pickWinner', game.pickWinner, [game.loadGame, game.ensureAndLoadUser]);
router.addRoute('POST', '/games/:gameId/nextRound', game.nextRound, [game.loadGame, game.ensureAndLoadUser]);
router.addRoute('POST', '/games/:gameId/redeal', game.redeal, [game.loadGame, game.ensureAndLoadUser]);
router.addRoute('POST', '/~/games/:gameId/testPut', game.testPut, [game.loadGame]);

exports.handlers = {
  async fetch(request, env) {
    try {
      let response = await handleRequest(request, env);
      return response;
    } catch (err) {
      // handle web sockets differently
      if (request.headers.get('Upgrade') == 'websocket') {
        // Annoyingly, if we return an HTTP error in response to a WebSocket request, Chrome devtools
        // won't show us the response body! So... let's send a WebSocket response with an error
        // frame instead.
        let pair = new WebSocketPair();
        pair[1].accept();
        pair[1].send(JSON.stringify({ error: err.stack, message: err.message }));
        pair[1].close(1011, 'Uncaught exception during session setup');
        return new Response(null, { status: 101, webSocket: pair[0] });
      }

      const errHtml = `<p>Message: ${err.message}</p>
      <p>Name: ${err.name}</p>
      <p>Stack: ${err.stack}</p>
      <p>File Name: ${err.fileName}</p>
      <p>Line Number: ${err.lineNumber}</p>
      <p>Column Number: ${err.columnNumber}</p>`;
      return new Response(errHtml, {
        status: 500,
        statusText: 'Internal Server Error',
        headers: { 'content-type': 'text/HTML' },
      });
    }
  },
};

function corsHeaders() {
  const ch = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,HEAD,POST,OPTIONS',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Expose-Headers': '*',
    'Access-Control-Max-Age': '600',
  };
  return Object.assign({}, ch);
}

function JsonResponse(object) {
  return new Response(JSON.stringify(object), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

async function handleRequest(request, env) {
  var routeAndParams = router.matchRouteAndParams(request);

  if (!routeAndParams) {
    // we are enabling cors fully - any options request not explicitly matched
    // will get this...

    if (request.method.toLowerCase() === 'options') {
      return new Response(null, {
        headers: corsHeaders(),
      });
    }

    return new Response(null, { status: 404, statusText: 'Not Found' });
  }

  var context = {
    request: request,
    params: routeAndParams.params,
    env: env,
    custom: {}, // object for use by routes and pipelines
  };

  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    context.body = await request.json();
  }

  const pipeline = routeAndParams.pipeline;

  if (Array.isArray(pipeline) && pipeline.length > 0) {
    for (let i = 0; i < pipeline.length; i++) {
      const pl = pipeline[i];
      const response = await pl(context);
      if (response) {
        return response;
      }
    }
  }

  var response = await routeAndParams.function(context);

  // prep the corsHeaders (a copy)
  const headers = corsHeaders();

  if (response instanceof Response) {
    // copy CORS headers if not websocket
    if (request.headers.get('upgrade') !== 'websocket') {
      const ch = corsHeaders();
      Object.keys(ch).forEach(k => response.headers.append(k, ch[k]));
    }

    return response;
  } else if (typeof response === 'object') {
    headers['Content-Type'] = 'application/json';

    return new Response(JSON.stringify(response), {
      headers: headers,
    });
  } else {
    headers['Content-Type'] = 'text/plain';

    return new Response(response, {
      headers: headers,
    });
  }
}
