import StorageHelp from './storageHelp.js';
import Cards from './cards.js';

const playerCardCount = 7;
const userHeader = 'cards-userId';

const dealCards = game => {
  // deal cards
  const playersToFill = game.players.filter(p => p.cards.length <= playerCardCount);

  while (playersToFill.length > 0) {
    for (let i = 0; i < playersToFill.length; i++) {
      const player = playersToFill[i];
      if (player.cards.length < playerCardCount) {
        player.cards.push(game.cards.whiteCards.pop());
      } else {
        playersToFill.splice(i, 1);
      }
    }
  }
};

export default class Game {
  async createGame(context) {
    /*
    expected payload:

    {
        player: {
            name: "Nathan Totten",
            short: "NT"
        }
    }
    */

    const sh = new StorageHelp(context.env);

    const body = context.body;

    if (!body.player) {
      return sh.createValidationError('expected `player` property not found');
    }

    if (typeof body.player.name !== 'string' || body.player.name.length < 3) {
      return sh.createValidationError('`player.name` must be a valid string 3 chars or longer');
    }

    if (typeof body.player.short !== 'string' || body.player.short.length !== 2) {
      return sh.createValidationError('`player.short` must be a 2 character string');
    }

    // need a new id for a new game
    const gameId = sh.newUniqueId();

    const player = {
      id: sh.newUniqueId(),
      name: body.player.name,
      short: body.player.short,
      score: 0,
      isGameOwner: true,
      cards: [],
      redealsLeft: 1,
    };

    const game = {
      id: gameId,
      state: 'NotStarted',
      players: [player],
      submissions: [],
      currentBlackCard: -1,
      currentJudgeIndex: 0,
      lastRound: {
        winningPlayerIndex: -1,
        blackCard: -1,
        whiteCard: -1,
        celebrationId: -1,
      },
    };

    const cards = new Cards(context.env);
    cards.initializeFromSource();
    cards.shuffleCards();

    game.cards = cards.getIds();

    if (player.whiteCard && typeof player.whiteCard === 'string' && player.whiteCard.length > 2) {
      cards.addWhiteCard(player.whiteCard);
    }

    const data = await sh.putGame(game);

    return data;
  }

  async getPlayerState(context) {
    const sh = new StorageHelp(context.env);

    const data = await sh.getGame(context.params.gameId);

    return data;
  }

  async joinGame(context) {
    /* expected payload

    { 
        player: {
            name: "Josh Twist",
            short: "JT" // must be unique
        }
    }

    */

    const sh = new StorageHelp(context.env);
    const game = context.custom.game;
    const body = context.body;

    if (!body.player) {
      return sh.createValidationError('expected `player` property not found');
    }

    if (typeof body.player.name !== 'string' || body.player.name.length < 3) {
      return sh.createValidationError('`player.name` must be a valid string 3 chars or longer');
    }

    if (typeof body.player.short !== 'string' || body.player.short.length !== 2) {
      return sh.createValidationError('`player.short` must be a 2 character string');
    }

    if (game.state !== 'NotStarted') {
      return sh.createValidationError('Game has already started');
    }

    body.player.short = body.player.short.toUpperCase();

    // does it contain a player with this short?
    var sameShorts = game.players.filter(p => p.short === body.player.short);
    if (sameShorts.length > 0) {
      return sh.createValidationError('A player with the same short name already joined the game');
    }

    const player = body.player;
    player.id = sh.newUniqueId();
    player.score = 0;
    player.cards = [];
    player.redealsLeft = 1;

    game.players.push(body.player);

    const data = await sh.putGame(game);
    const response = new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'cards-userId': player.id,
      },
    });

    return response;
  }

  async loadGame(context) {
    const sh = new StorageHelp(context.env);

    if (!context.params.gameId) {
      return sh.createValidationError(`No gameId found`)
    }
  
    const gameId = context.params.gameId;
    const game = await sh.getGame(gameId);
    context.custom.game = game;
  }
  
  async ensureAndLoadUser(context) {
    const sh = new StorageHelp(context.env);
    const userId = context.request.headers.get(userHeader);
    const game = context.custom.game;

    if (!userId || typeof userId !== 'string') {
      return sh.createValidationError(`No ${userHeader} header found`);
    }

    const players = game.players.filter(p => p.id === userId);

    if (players.length !== 1) {
      return sh.createValidationError(
        `${players.length} players found matching ${userHeader}: ${userId} from ${game.players.length} players.`,
      );
    }

    context.custom.userId = userId;
    context.custom.currentPlayer = players[0];
  }

  async startGame(context) {
    const sh = new StorageHelp(context.env);
    const game = context.custom.game;
    const currentPlayer = context.custom.currentPlayer;

    if (game.state != 'NotStarted') {
      return sh.createValidationError('Game has already started');
    }

    const owners = game.players.filter(p => p.isGameOwner === true);
    const owner = owners[0];
    if (owner.id !== currentPlayer.id) {
      return sh.createValidationError('Game can only be started by the game owner');
    }

    if (game.players.length < 3) {
      return sh.createValidationError('You need at least 3 players to start');
    }

    // TODO - do all the work with the deck etc
    game.state = 'Playing';

    dealCards(game);

    game.currentBlackCard = game.cards.blackCards.pop();

    return await sh.putGame(game);
  }

  async submitCard(context) {
    const sh = new StorageHelp(context.env);
    const game = context.custom.game;
    const currentPlayer = context.custom.currentPlayer;

    if (game.state !== 'Playing') {
      return sh.createValidationError('Cannot submit a card at this stage of the game');
    }

    if (currentPlayer.id === game.players[game.currentJudgeIndex].id) {
      return sh.createValidationError(`You are judging this round, you cannot submit a card.`);
    }

    if (currentPlayer.submitted === true) {
      return sh.createValidationError('This player has already submitted a card this round');
    }

    /* expected payload 

    {
      submittedCard: 4
    }

    */

    if (isNaN(context.body.submittedCard)) {
      return sh.createValidationError('No `submittedCard` property found');
    }

    const index = currentPlayer.cards.indexOf(context.body.submittedCard);

    if (index < 0) {
      return sh.createValidationError(`${context.body.submittedCard} is not a valid card for this player`);
    }

    const card = currentPlayer.cards[index];
    game.submissions.push({
      card: card,
      playerIndex: game.players.indexOf(currentPlayer),
    });
    currentPlayer.submitted = true;
    currentPlayer.cards.splice(index, 1);

    // -1 because one player is judging
    if (game.submissions.length === game.players.length - 1) {
      game.state = 'Judging';
    }

    return await sh.putGame(game);
  }

  async pickWinner(context) {
    /*
    expected payload
    
    {
      winningSubmissionIndex: 4
    }

    */

    const sh = new StorageHelp(context.env);
    const game = context.custom.game;
    const currentPlayer = context.custom.currentPlayer;

    if (game.state !== 'Judging') {
      return sh.createValidationError(`Cannot pick a winner during ${game.state} stage.`);
    }

    if (isNaN(context.body.winningSubmissionIndex)) {
      return sh.createValidationError('No `winningSubmissionIndex` property found');
    }
    if (currentPlayer.id !== game.players[game.currentJudgeIndex].id) {
      return sh.createValidationError(`Only judges can pick a winner, you're not the judge this round.`);
    }

    const wsi = context.body.winningSubmissionIndex;

    if (wsi < 0 || wsi > game.submissions.length - 1) {
      return sh.createValidationError(`${wsi} is an invalid submission index.`);
    }
    const winningSubmission = game.submissions[context.body.winningSubmissionIndex];
    const winningPlayer = game.players[winningSubmission.playerIndex];
    winningPlayer.score++;
    game.lastRound.winningPlayerIndex = winningSubmission.playerIndex;
    game.lastRound.blackCard = game.currentBlackCard;
    game.lastRound.whiteCard = winningSubmission.card;
    game.lastRound.celebrationId = -1; // TODO pick random gif

    game.players.forEach(p => {
      p.submitted = false;
    });

    // setup next round
    game.submissions = [];

    game.state = 'Reveal';

    return await sh.putGame(game);
  }

  async nextRound(context) {
    const sh = new StorageHelp(context.env);
    const game = context.custom.game;
    const currentPlayer = context.custom.currentPlayer;

    if (game.state !== 'Reveal') {
      return sh.createValidationError(`Cannot move to next round at ${game.state} stage.`);
    }

    if (currentPlayer.id !== game.players[game.currentJudgeIndex].id) {
      return sh.createValidationError(`Only judges can kick off the next round, you're not the judge this round.`);
    }

    // setup next round
    game.players.forEach(p => {
      p.submitted = false;
    });

    game.submissions = [];
    if (game.cards.blackCards.length == 0) {
      return sh.createValidationError('Out of black cards, sorry');
    }
    game.currentBlackCard = game.cards.blackCards.pop();
    game.currentJudgeIndex++;
    if (game.currentJudgeIndex > game.players.length - 1) {
      game.currentJudgeIndex = 0;
    }

    dealCards(game);

    game.state = 'Playing';

    return await sh.putGame(game);
  }

  async redeal(context) {
    const sh = new StorageHelp(context.env);
    const game = context.custom.game;
    const currentPlayer = context.custom.currentPlayer;

    if (game.state !== 'Playing') {
      return sh.createValidationError(`Cannot redeal at '${game.state}' stage, only 'Playing'`);
    }

    if (currentPlayer.redealsLeft <= 0) {
      return sh.createValidationError('You have no redeals remaining, sorry');
    }

    game.cards.whiteCards = currentPlayer.cards.concat(game.cards.whiteCards);
    currentPlayer.cards = [];
    dealCards(game);

    currentPlayer.redealsLeft--;

    return await sh.putGame(game);
  }

  async getCards(context) {
    const cards = new Cards();
    cards.initializeFromSource();
    const data = {
      blackCards: cards.blackCards,
      whiteCards: cards.whiteCards,
    };
    return data;
  }
}
