const STARTING_PIECES_PER_HOUSE = 7;

const PLAYER_ONE = true;
const PLAYER_TWO = false;
const STEPS = {
  TAKE: "Take",
  MOVE: "Move",
  DROP: "Drop"
};

Vue.component("house", {
  props: ["value", "move", "isPlayerTwo"],
  template: `<div class="house" v-bind:class="{'house--blocked': value.isBlocked}" v-on:click="move(isPlayerTwo, value.id)">{{ value.isBlocked ? 'X' : value.count }}</div>`
});

Vue.component("store", {
  props: ["count"],
  template: '<div class="store">{{ count }}</div>'
});

const app = new Vue({
  el: "#app",
  data: {
    distributeDelayMillis: 250,
    playerOneHouses: [],
    playerTwoHouses: [],
    isInitialMove: true,
    whoseTurn: PLAYER_ONE,
    areSettingsVisible: false,
    arePiecesInHandVisible: false,
    housesPerRow: 7,
    move: null,
    playerOne: {
      isMoving: false,
      isInPlayerHouse: true,
      isInStore: false,
      position: 0,
      piecesInHand: 0,
      store: 0
    },
    playerTwo: {
      isMoving: false,
      isInPlayerHouse: true,
      isInStore: false,
      position: 0,
      piecesInHand: 0,
      store: 0
    }
  },
  methods: {
    setup() {
      this.areSettingsVisible = false;
      clearInterval(this.move);
      this.playerOne = {
        isMoving: false,
        isInPlayerHouse: true,
        isInStore: false,
        position: 0,
        piecesInHand: 0,
        store: 0
      }
      this.playerTwo = {
        isMoving: false,
        isInPlayerHouse: true,
        isInStore: false,
        position: 0,
        piecesInHand: 0,
        store: 0
      }
      this.playerOneHouses = [];
      this.playerTwoHouses = [];
      for (let i = 0; i < this.housesPerRow; i++) {
        this.playerOneHouses.push({
          id: i,
          count: STARTING_PIECES_PER_HOUSE,
          isBlocked: false
        });
        this.playerTwoHouses.push({
          id: i,
          count: STARTING_PIECES_PER_HOUSE,
          isBlocked: false
        });
      }
      this.whoseTurn = PLAYER_ONE;
    },
    showSettings() {
      this.areSettingsVisible = !this.areSettingsVisible;
    },
    setSpeed(delay) {
      this.distributeDelayMillis = delay;
      this.areSettingsVisible = false;
    },
    setPiecesInHandVisibility(isVisible) {
      this.arePiecesInHandVisible = isVisible;
      this.areSettingsVisible = false;
    },
    setNumberOfHouses(houses) {
      this.housesPerRow = houses;
      this.areSettingsVisible = false;
      this.setup();
    },
    initiateMove(isPlayerTwo, position) {
      // Can't move if someone is already moving (unless initial turn)
      if (
        // (isPlayerTwo && this.playerTwo.isMoving) ||
        // (!isPlayerTwo && this.playerOne.isMoving) ||
        // (!this.isInitialMove && isPlayerTwo && this.playerOne.isMoving) ||
        // (!this.isInitialMove && !isPlayerTwo && this.playerTwo.isMoving)
        this.playerOne.isMoving ||
        this.playerTwo.isMoving
      ) {
        return;
      }
      let player = isPlayerTwo ? this.playerTwo : this.playerOne;
      player.position = position;
      player.isInStore = false;

      // Can't begin move on opponent's house
      if (
        // !this.isInitialMove &&
        (isPlayerTwo && this.whoseTurn === PLAYER_ONE) ||
        (!isPlayerTwo && this.whoseTurn === PLAYER_TWO)
      ) {
        alert("You need to click on a house on your side to start.");
        return;
      }
      player.isInPlayerHouse = true;

      let array = isPlayerTwo ? this.playerTwoHouses : this.playerOneHouses;

      // Can't start on a house without shells
      if (array[position].count === 0) {
        alert("The house you choose needs to have at least one shell inside.");
        return;
      }

      player.isMoving = true;

      let nextStep = STEPS.TAKE;

      this.move = setInterval(() => {
        if (nextStep === STEPS.TAKE) {
          console.warn(
            `TAKE: ${
              player.isInPlayerHouse ? "player" : "opponent"
            } house, position ${position}.`
          );
          player.piecesInHand = array[player.position].count;
          array[player.position].count = 0;
          nextStep = STEPS.MOVE;
        } else if (nextStep === STEPS.MOVE) {
          if (player.isInStore) {
            console.log(`MOVE`);
            player.isInPlayerHouse = !player.isInPlayerHouse;
            array = isPlayerTwo ?
              player.isInPlayerHouse ?
              this.playerTwoHouses :
              this.playerOneHouses :
              player.isInPlayerHouse ?
              this.playerOneHouses :
              this.playerTwoHouses;
            player.position = 0;
            player.isInStore = false;
          } else {
            console.log("MOVE");
            player.position++;
            if (player.position === this.housesPerRow) {
              if (player.isInPlayerHouse) {
                player.isInStore = true;
              } else {
                player.isInPlayerHouse = !player.isInPlayerHouse;
                array = isPlayerTwo ?
                  player.isInPlayerHouse ?
                  this.playerTwoHouses :
                  this.playerOneHouses :
                  player.isInPlayerHouse ?
                  this.playerOneHouses :
                  this.playerTwoHouses;
                player.position = 0;
              }
            }
          }
          nextStep = !player.isInStore && array[player.position].isBlocked ?
            STEPS.MOVE :
            STEPS.DROP;
        } else if (nextStep === STEPS.DROP) {
          if (player.isInStore) {
            console.log(
              `DROP: ${player.isInPlayerHouse ? "player" : "opponent"} store.`
            );
            player.store++;
            player.piecesInHand--;
            if (player.piecesInHand === 0) {
              clearInterval(this.move);
              this.checkRoundEnd();
              player.isMoving = false;
              return;
            } else {
              nextStep = STEPS.MOVE;
            }
          } else {
            console.log(
              `DROP: ${
                player.isInPlayerHouse ? "player" : "opponent"
              } house, position ${player.position}.`
            );
            array[player.position].count++;
            player.piecesInHand--;
            if (player.piecesInHand === 0) {
              // End of player turn
              if (array[player.position].count <= 1) {
                clearInterval(this.move);
                if (player.isInPlayerHouse) {
                  let opponentArray = isPlayerTwo ?
                    this.playerOneHouses :
                    this.playerTwoHouses;
                  player.store +=
                    opponentArray[
                      this.housesPerRow - player.position - 1
                    ].count;
                  opponentArray[
                    this.housesPerRow - player.position - 1
                  ].count = 0;
                  player.store += array[player.position].count;
                  array[player.position].count = 0;
                }
                player.isMoving = false;
                this.whoseTurn = !this.whoseTurn;
                this.checkRoundEnd();
                return;
              }
              // Take and keep moving
              nextStep = STEPS.TAKE;
            } else {
              nextStep = STEPS.MOVE;
            }
          }
        }
      }, this.distributeDelayMillis);
    },
    checkRoundEnd() {
      let isPlayerOneEmpty = true;
      let isPlayerTwoEmpty = true;
      for (let i = 0; i < this.housesPerRow; i++) {
        if (this.playerOneHouses[i].count > 0) {
          isPlayerOneEmpty = false;
        }
        if (this.playerTwoHouses[i].count > 0) {
          isPlayerTwoEmpty = false;
        }
      }

      if (isPlayerOneEmpty || isPlayerTwoEmpty) {
        this.setupNextRound();
        return true;
      }
      return false;
    },
    setupNextRound() {
      // Clean
      for (let i = 0; i < this.housesPerRow; i++) {
        this.playerOne.store += this.playerOneHouses[i].count;
        this.playerOneHouses[i].count = 0;
        this.playerTwo.store += this.playerTwoHouses[i].count;
        this.playerTwoHouses[i].count = 0;
      }

      // Check for game end
      if (this.playerOne.store < STARTING_PIECES_PER_HOUSE) {
        alert("Game over! Player two wins!");
        this.setup();
        return;
      } else if (this.playerTwo.store < STARTING_PIECES_PER_HOUSE) {
        alert("Game over! Player one wins!");
        this.setup();
        return;
      }

      // Start
      this.whoseTurn =
        this.playerOne.store >= this.playerTwo.store ? PLAYER_ONE : PLAYER_TWO;

      // Distribute
      for (let i = 0; i < this.housesPerRow; i++) {
        if (this.playerOne.store >= STARTING_PIECES_PER_HOUSE) {
          this.playerOne.store -= STARTING_PIECES_PER_HOUSE;
          this.playerOneHouses[i].count = STARTING_PIECES_PER_HOUSE;
          this.playerOneHouses[i].isBlocked = false;
        } else {
          this.playerOneHouses[i].count = 0;
          this.playerOneHouses[i].isBlocked = true;
        }

        if (this.playerTwo.store >= STARTING_PIECES_PER_HOUSE) {
          this.playerTwo.store -= STARTING_PIECES_PER_HOUSE;
          this.playerTwoHouses[i].count = STARTING_PIECES_PER_HOUSE;
          this.playerTwoHouses[i].isBlocked = false;
        } else {
          this.playerTwoHouses[i].count = 0;
          this.playerTwoHouses[i].isBlocked = true;
        }
      }
    }
  }
});

app.setup();