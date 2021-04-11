const WebSocketHelper = require('./webSocketHelper');

module.exports = class GameStorage {
  constructor(state, env) {
    this.state = state;
    this.env = env;

    this.wsh = new WebSocketHelper();
  }

  async initialize() {
    let stored = await this.state.storage.get('data');
    this.data = stored;
  }

  // Handle HTTP requests from clients.
  async fetch(request) {
    // Make sure we're fully initialized from storage.
    if (!this.initializePromise) {
      this.initializePromise = this.initialize().catch(err => {
        // If anything throws during initialization then we need to be
        // sure sure that a future request will retry initialize().
        // Note that the concurrency involved in resetting this shared
        // promise on an error can be tricky to get right -- we don't
        // recommend customizing it.
        this.initializePromise = undefined;
        throw err;
      });
    }
    await this.initializePromise;

    // Apply requested action.
    let url = new URL(request.url);

    // get the userId
    const clientId = request.headers.get('cards-userId');

    // handle web sockets
    if (url.pathname.startsWith("/websocket"))
      return this.wsh.handleWebSocketUpgrade(request, clientId);

    switch (url.pathname) {        
      case '/putGame':
        let update = await request.json();
        // first, check if there is any state - for first write there may not be, then we don't care
        if (typeof(this.data) !== 'undefined') {
          if (!update.versionToken) {
            return new Response("No versionToken provided.", { status: 400, statusText: "Bad request" });
          }
          if (update.versionToken !== this.data.versionToken) {
            return new Response("Conflict: update blocked due to versionToken mismatch.", { status: 409, statusText: "Conflict" });
          }
        }
        // lazy, letting durable objects do the work of uuid generation - it's fast
        update.versionToken = this.env.GAMESTORAGE.newUniqueId().toString();
        await this.state.storage.put('data', update);
        this.data = update;
        // broadcast via sockets - don't send to originating client
        this.wsh.broadcast(JSON.stringify(update), clientId);
        return new Response(JSON.stringify(this.data), { headers: { 'Content-Type' : 'application/json' }});
      case '/getGame':
        // Just serve the current value. No storage calls needed!
        this.data = await this.state.storage.get('data');
        return new Response(JSON.stringify(this.data), { headers: { 'Content-Type' : 'application/json' }});
      default:
        return new Response('Not found', { status: 404 });
    }
  }
};
