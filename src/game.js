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

function winnerGif() {
  var urls = [
    "https://media.giphy.com/media/6oMKugqovQnjW/giphy.gif",
    "https://media.giphy.com/media/5Yl08OSg4AckeNHpDc/giphy.gif",
    "https://media.giphy.com/media/ddHhhUBn25cuQ/giphy.gif",
    "https://media.giphy.com/media/YTbZzCkRQCEJa/giphy.gif",
    "https://media.giphy.com/media/87NS05bya11mg/giphy.gif",
    "https://media.giphy.com/media/8j3CTd8YJtAv6/giphy.gif",
    "https://media.giphy.com/media/jzaZ23z45UxK8/giphy.gif",
    "https://media.giphy.com/media/13hxeOYjoTWtK8/giphy.gif",
    "https://media.giphy.com/media/zQLjk9d31jlMQ/giphy.gif",
    "https://media.giphy.com/media/Bl10664xbIVkk/giphy.gif",
    "https://media.giphy.com/media/4ci8d3rJNrdAY/giphy.gif",
    "https://media.giphy.com/media/PhNgTdjTzXULbKfCnI/giphy.gif",
    "https://media.giphy.com/media/JrLxgem3knPxCTx7Ux/giphy.gif",
    "https://media.giphy.com/media/MZpxwpavVlCE2sRWK3/giphy.gif",
    "https://media.giphy.com/media/K9MPm9A3CaSkw/giphy.gif",
    "https://media.giphy.com/media/7aRG17VMgsGek/giphy.gif",
    "https://media.giphy.com/media/6Yp3H44rgBHZm/giphy.gif",
    "https://media.giphy.com/media/l44Q6Etd5kdSGttXa/giphy.gif",
    "https://media.giphy.com/media/KEVNWkmWm6dm8/giphy.gif",
    "https://media.giphy.com/media/3ohryhNgUwwZyxgktq/giphy.gif",
    "https://media.giphy.com/media/6brH8dM3zeMyA/giphy.gif",
    "https://media.giphy.com/media/rhfxbPtm4m5uo/giphy.gif",
    "https://media.giphy.com/media/1zkMbX7k4nd1AM4i4k/giphy.gif",
    "https://media.giphy.com/media/xT1R9D4BTqrv8nXig0/giphy.gif",
    "https://media.giphy.com/media/dUYf5sSU3qVRCCZMSz/giphy.gif",
    "https://media.giphy.com/media/nqi89GMgyT3va/giphy.gif",
    "https://media.giphy.com/media/UWEcHpY9k3rxe/giphy.gif",
    "https://media.giphy.com/media/3ohzdX7Wzbebc3Y0qA/giphy.gif",
    "https://media.giphy.com/media/3oz8xDLuiN1GcDA3xC/giphy.gif",
    "https://media.giphy.com/media/UdckZOAQrtXMI/giphy.gif",
    "https://media.giphy.com/media/kmqCVSHi5phMk/giphy.gif",
    "https://media.giphy.com/media/ngyRZcPbJim4g/giphy.gif",
    "https://media.giphy.com/media/xMIlfwRRQNEcw/giphy.gif",
    "https://media.giphy.com/media/EWWdvQngcLt6g/giphy.gif",
    "https://media.giphy.com/media/26u4cqiYI30juCOGY/giphy.gif",
    "https://media.giphy.com/media/ReyXCAwJYFm9rb2HxD/giphy.gif",
    "https://media.giphy.com/media/3rXna9rZacY8RUvgTO/giphy.gif",
    "https://media.giphy.com/media/7J7lD2hdRbuxACr6f8/giphy.gif",
    "https://media.giphy.com/media/gEvxDHigKYErhWpQmt/giphy.gif",
    "https://media.giphy.com/media/3ocosrDjgxHDPDqVIA/giphy.gif",
    "https://media.giphy.com/media/W0cDzGKbC1Oh3NqlgX/giphy.gif",
    "https://media.giphy.com/media/skmziDEEjiin6/giphy.gif",
    "https://media.giphy.com/media/26uTrC4SJaczkWqmQ/giphy.gif",
    "https://media.giphy.com/media/fZ1gAEXeCV8F2tAjYr/giphy.gif",
    "https://media.giphy.com/media/IbaY786fr0miugw2Pk/giphy.gif",
    "https://media.giphy.com/media/26AHAw0aMmWwRI4Hm/giphy.gif",
    "https://media.giphy.com/media/l5cjzhHD43vZS/giphy.gif",
    "https://media.giphy.com/media/xHMIDAy1qkzNS/giphy.gif",
    "https://media.giphy.com/media/26BRBKqUiq586bRVm/giphy.gif",
  ];

  return urls[Math.floor(Math.random() * urls.length)];
}

export default class Game {

  constructor() {
    this.joinGame = this.retryWrap(5, this.joinGame);
    this.submitCard = this.retryWrap(5, this.submitCard);
    this.redeal = this.retryWrap(5, this.redeal);
  }

  retryWrap(count, fn) {
    const wrapper = async (context) => {
      let remainingRetryCount = 5;

      while (remainingRetryCount > 0) {
        try {
          return await fn(context);
        }
        catch (err) {
          if (err instanceof ConflictError) {
            // reload game and run logic again
            context.custom.game = await sh.getGame(context.params.gameId);
            remainingRetryCount--;
          }
          else {
            throw err;
          }
        }
      }
      
      throw new ConflictError('Retries exhausted')
    }

    return wrapper;
  }

  async createGame(context) {
    /* 
    expected payload:

    {
        player: {
            name: "Nathan Totten",
            short: "NT"
        },
        minimumPlayers: 2

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
      created: new Date().toISOString(),
      minimumPlayers: context.body.minimumPlayers || 3,
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

    const response = new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'cards-userId': player.id,
      },
    });

    return response;
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
      return sh.createValidationError(`No gameId found`);
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

    if (game.players.length < game.minimumPlayers) {
      return sh.createValidationError(`You need at least ${game.minPlayers} players to start`);
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
      id: sh.newUniqueId(),
      cardId: card,
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
      winningSubmissionId: 'slajfsdlkafdjslkjflkjalfkdjdkfs'
    }

    */

    const sh = new StorageHelp(context.env);
    const game = context.custom.game;
    const currentPlayer = context.custom.currentPlayer;

    if (game.state !== 'Judging') {
      return sh.createValidationError(`Cannot pick a winner during ${game.state} stage.`);
    }

    if (!context.body.winningSubmissionId) {
      return sh.createValidationError('No `winningSubmissionId` property found');
    }
    if (currentPlayer.id !== game.players[game.currentJudgeIndex].id) {
      return sh.createValidationError(`Only judges can pick a winner, you're not the judge this round.`);
    }

    const wsid = context.body.winningSubmissionId;
    const matchingSubmissions = game.submissions.filter(s => s.id === wsid);
    if (matchingSubmissions.length !== 1) {
      return sh.createValidationError(`Invalid ${wsid}, it matched ${matchingSubmissions.length} submissions.`);
    }
    const winningSubmission = matchingSubmissions[0];
    const winningPlayer = game.players[winningSubmission.playerIndex];
    winningPlayer.score++;
    game.lastRound.winningPlayerIndex = winningSubmission.playerIndex;
    game.lastRound.blackCard = game.currentBlackCard;
    game.lastRound.whiteCard = winningSubmission.cardId;
    game.lastRound.gifUrl = winnerGif();

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

  async testPut(context) {
    const sh = new StorageHelp(context.env);
    const game = context.custom.game;
    return await sh.putGame(context.body);
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

  async initiateWebSocket(context) {
    const sh = new StorageHelp(context.env);
    return await sh.initiateWebSocket(context.params.gameId, context.request);
  }
}
