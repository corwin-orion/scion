import 'dotenv/config';
import { InstallGlobalCommands } from './utils.js';

const RESET_DECK_COMMAND = {
  name: 'reset-deck',
  description: 'Reset the poker deck',
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 1, 2],

}

const SHUFFLE_COMMAND = {
  name: 'shuffle',
  description: 'Shuffle a poker deck',
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 1, 2],
};

const DRAW_COMMAND = {
  name: 'draw',
  description: 'Draw a card from the deck',
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 1, 2],
  options: [
    {
      name: 'number',
      description: 'Number of cards to draw',
      type: 4,
      min_value: 1,
      max_value: 52
    }
  ]
};

const ALL_COMMANDS = [RESET_DECK_COMMAND, SHUFFLE_COMMAND, DRAW_COMMAND];

InstallGlobalCommands(process.env.APP_ID, ALL_COMMANDS);
