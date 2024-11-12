const crypto = require("crypto");

class DiceConfigParser {
  static parseDiceConfig(args) {
    if (args.length < 3) {
      throw new Error(
        "Invalid number of dice. Provide at least 3 sets of 6 integers."
      );
    }
    return args.map((arg) => {
      const dice = arg.split(",").map(Number);
      if (dice.length !== 6 || dice.some(isNaN)) {
        throw new Error(
          `Invalid dice format: "${arg}". Each dice should contain exactly 6 integers.`
        );
      }
      return dice;
    });
  }
}

class RandomGenerator {
  static generateSecureRandomKey() {
    return crypto.randomBytes(32).toString("hex"); // 256-bit key
  }

  static generateSecureRandomNumber(range) {
    const byteSize = Math.ceil(Math.log2(range) / 8);
    let num;
    do {
      num = parseInt(crypto.randomBytes(byteSize).toString("hex"), 16);
    } while (num >= range);
    return num;
  }

  static generateHMAC(key, message) {
    return crypto
      .createHmac("sha3-256", key)
      .update(message.toString())
      .digest("hex");
  }
}

class FairNumberProtocol {
  constructor(range) {
    this.range = range;
    this.secretKey = RandomGenerator.generateSecureRandomKey();
    this.computerNumber = RandomGenerator.generateSecureRandomNumber(range);
    this.hmac = RandomGenerator.generateHMAC(
      this.secretKey,
      this.computerNumber
    );
  }

  getHMAC() {
    return this.hmac;
  }

  revealKey() {
    return this.secretKey;
  }

  getComputerNumber() {
    return this.computerNumber;
  }

  calculateResult(userNumber) {
    return (this.computerNumber + userNumber) % this.range;
  }
}

class Dice {
  constructor(values) {
    this.values = values;
  }

  roll() {
    const randomIndex = RandomGenerator.generateSecureRandomNumber(
      this.values.length
    );
    return this.values[randomIndex];
  }
}

class GameFlow {
  constructor(diceConfigurations) {
    this.diceSet = diceConfigurations.map((config) => new Dice(config));
  }

  startGame() {
    console.log("Let's determine who makes the first move.");
    const protocol = new FairNumberProtocol(2);
    console.log(
      `I selected a random value in the range 0..1 (HMAC=${protocol.getHMAC()}).`
    );

    // Simulate user guessing the computer's random number (0 or 1)
    const userGuess = this.getUserInput("Try to guess my selection (0 or 1): ");
    const computerNumber = protocol.getComputerNumber();
    console.log(
      `My selection: ${computerNumber} (KEY=${protocol.revealKey()}).`
    );

    // Determine who goes first
    if (parseInt(userGuess) === computerNumber) {
      console.log("You guessed correctly. You go first.");
    } else {
      console.log("I go first.");
    }
    this.playRounds();
  }

  playRounds() {
    // Main game rounds where each player selects dice and rolls
    const userDice = this.selectUserDice();
    const computerDice = this.diceSet[1]; // Example: Computer selects the second dice

    const userRoll = userDice.roll();
    const computerRoll = computerDice.roll();
    console.log(`Your throw is ${userRoll}.`);
    console.log(`My throw is ${computerRoll}.`);

    if (userRoll > computerRoll) {
      console.log("You win!");
    } else if (userRoll < computerRoll) {
      console.log("I win!");
    } else {
      console.log("It's a draw!");
    }
  }

  selectUserDice() {
    console.log("Choose your dice:");
    this.diceSet.forEach((dice, index) => {
      console.log(`${index} - [${dice.values.join(", ")}]`);
    });
    const choice = parseInt(this.getUserInput("Your selection: "));
    return this.diceSet[choice];
  }

  getUserInput(promptText) {
    const readlineSync = require("readline-sync");
    return readlineSync.question(promptText);
  }
}

function main() {
  try {
    const args = process.argv.slice(2);
    const diceConfigurations = DiceConfigParser.parseDiceConfig(args);
    const game = new GameFlow(diceConfigurations);
    game.startGame();
  } catch (error) {
    console.error("Error:", error.message);
    console.log(
      "Usage example: node task3.js 2,2,4,4,9,9 6,8,1,1,8,6 7,5,3,7,5,3"
    );
  }
}

main();
