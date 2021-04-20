export default class StorageHelp {

  constructor(env) {
    this.GAMESTORAGE = env.GAMESTORAGE;
  }

  newUniqueId() {
    return this.GAMESTORAGE.newUniqueId().toString();
  }

  async getGame(gameId) {
    let id = this.GAMESTORAGE.idFromString(gameId);
    let object = await this.GAMESTORAGE.get(id);

    const request = new Request('/getGame');
    let response = await object.fetch(request);
    let data = await response.json();
    return data;
  }

  async putGame(game) {
    let id = this.GAMESTORAGE.idFromString(game.id);
    let object = await this.GAMESTORAGE.get(id);

    const putRequest = new Request('/putGame', {
      method: 'POST',
      body: JSON.stringify(game),
      headers: { 'Content-Type': 'application/json' },
    });

    let putResponse = await object.fetch(putRequest);

    if (putResponse.status !== 200) {
      throw new Error(await putResponse.text());
    }

    let data = putResponse.json();
    return data;
  }

  async initiateWebSocket(gameId, request) {
    let id = this.GAMESTORAGE.idFromString(gameId);
    let object = await this.GAMESTORAGE.get(id);

    return await object.fetch(request);
  }

  createValidationError(message) {
    return new Response(message, {
      status: 400,
      statusText: 'Bad Request',
    });
  }
}