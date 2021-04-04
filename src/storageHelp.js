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
    let data = putResponse.json();
    return data;
  }

  createValidationError(message) {
    return new Response(message, {
      status: 400,
      statusText: 'Bad Request',
    });
  }
}