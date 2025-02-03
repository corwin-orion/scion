import 'dotenv/config';
import express from 'express';
import {
  ButtonStyleTypes,
  InteractionResponseFlags,
  InteractionResponseType,
  InteractionType,
  MessageComponentTypes,
  verifyKeyMiddleware,
} from 'discord-interactions';
import { DiscordRequest } from './utils.js';
import { drawCardsFromDeck, getPokerCardByNumber, getNewPokerDeck, shuffleDeck, discardCardsFromDeck } from './features/deck.js';
import { getNewQuietYearDeck, getQuietYearCardByNumber, getNewFleetingYearDeck } from './features/quiet-year.js';

// Create an express app
const app = express();
// Get port, or default to 3000
const PORT = process.env.PORT || 3000;
// To keep track of the deck
const deck = { type: "poker", cards: getNewPokerDeck() };
shuffleDeck(deck);
let quietYearGame = null;

/**
 * Interactions endpoint URL where Discord will send HTTP requests
 * Parse request body and verifies incoming requests using discord-interactions package
 */
app.post('/interactions', verifyKeyMiddleware(process.env.PUBLIC_KEY), async function (req, res) {
  // Interaction id, type and data
  const { id, type, data } = req.body;

  /**
   * Handle verification requests
   */
  if (type === InteractionType.PING) {
    return res.send({ type: InteractionResponseType.PONG });
  }

  /**
   * Handle slash command requests
   * See https://discord.com/developers/docs/interactions/application-commands#slash-commands
   */
  if (type === InteractionType.APPLICATION_COMMAND) {
    const { name, options } = data;

    // "reset-deck" command
    if (name === 'reset-deck') {
      try {
        deck.cards = getNewPokerDeck();
      } catch {
        return res.status(400).json({ error: 'could not reset deck' });
      }
      // Send a message into the channel where command was triggered from
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: "Reset the deck. Want to shuffle it?",
          flags: InteractionResponseFlags.SUPPRESS_NOTIFICATIONS,
          components: [
            {
              type: MessageComponentTypes.ACTION_ROW,
              components: [
                {
                  type: MessageComponentTypes.BUTTON,
                  custom_id: 'shuffle_deck_button',
                  label: 'Yes please',
                  style: ButtonStyleTypes.PRIMARY,
                },
              ],
            },
          ],
        },
      });
    }

    // "shuffle" command
    if (name === 'shuffle') {
      try {
        deck.type = "poker"
        shuffleDeck(deck);
      } catch (err) {
        return res.status(400).json({ error: 'could not shuffle', err });
      }
      // Send a message into the channel where command was triggered from
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: "Shuffled the deck",
          flags: InteractionResponseFlags.SUPPRESS_NOTIFICATIONS,
        },
      });
    }

    // "draw" command
    if (name === 'draw') {
      let numCardsToDraw = 1;
      options?.forEach(option => {
        if (option.name === 'number' && deck.type !== "quiet year") numCardsToDraw = option.value;
      });
      const cardNumbers = drawCardsFromDeck(deck, numCardsToDraw);
      if (cardNumbers.length === 0) {
        // Deck is empty, prompt to reshuffle
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: "The deck is empty; reset it?",
            flags: InteractionResponseFlags.SUPPRESS_NOTIFICATIONS,
            components: [
              {
                type: MessageComponentTypes.ACTION_ROW,
                components: [
                  {
                    type: MessageComponentTypes.BUTTON,
                    // Value for your app to identify the button
                    custom_id: 'reset_deck_button',
                    label: 'Yes please',
                    style: ButtonStyleTypes.PRIMARY,
                  },
                ],
              },
            ],
          },
        });
      }
      const cards = deck.type === 'poker' ?
        cardNumbers.map(cardNumber => getPokerCardByNumber(cardNumber)) :
        cardNumbers.map(cardNumber => getQuietYearCardByNumber(cardNumber));
      let message = deck.type === 'poker' ?
        `Drew ${cards.length} card${cards.length === 1 ? '' : 's'}:` :
        '';
      cards.forEach(card => message += '\n' + card);
      // Send a message into the channel where command was triggered from
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: message,
          flags: InteractionResponseFlags.SUPPRESS_NOTIFICATIONS,
        },
      });
    }

    // "discard" command
    if (name === 'discard') {
      let numCardsToDiscard = 1;
      options?.forEach(option => {
        if (option.name === 'number') numCardsToDiscard = option.value;
      });
      let numCardsDiscarded;
      try {
        numCardsDiscarded = discardCardsFromDeck(deck, numCardsToDiscard);
      } catch (err) {
        return res.status(400).json({ error: 'could not discard', err });
      }
      if (numCardsDiscarded === 1) {
        // Deck is empty, prompt to reshuffle
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: "The deck is empty; reset it?",
            flags: InteractionResponseFlags.SUPPRESS_NOTIFICATIONS,
            components: [
              {
                type: MessageComponentTypes.ACTION_ROW,
                components: [
                  {
                    type: MessageComponentTypes.BUTTON,
                    // Value for your app to identify the button
                    custom_id: 'reset_deck_button',
                    label: 'Yes please',
                    style: ButtonStyleTypes.PRIMARY,
                  },
                ],
              },
            ],
          },
        });
      }
      // Send a message into the channel where command was triggered from
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: `Discarded ${numCardsDiscarded} cards`,
          flags: InteractionResponseFlags.SUPPRESS_NOTIFICATIONS,
        },
      });
    }

    // "quiet-year-setup" command
    if (name === 'quiet-year-setup') {
      let fleeting = false;
      options?.forEach(option => {
        if (option.name === 'fleeting') fleeting = option.value;
      });
      if (quietYearGame && quietYearGame.week > 0) {
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: "There's already a game in progress. Overwrite it with a new game, or continue?",
            flags: InteractionResponseFlags.SUPPRESS_NOTIFICATIONS,
            components: [
              {
                type: MessageComponentTypes.ACTION_ROW,
                components: [
                  {
                    type: MessageComponentTypes.BUTTON,
                    custom_id: `quiet_year_reset_button_fleeting?=${fleeting ? 'true' : 'false'}`,
                    label: 'Overwrite',
                    style: ButtonStyleTypes.PRIMARY,
                  },
                  {
                    type: MessageComponentTypes.BUTTON,
                    custom_id: 'quiet_year_next_week_button',
                    label: 'Continue',
                    style: ButtonStyleTypes.SECONDARY,
                  }
                ],
              }
            ]
          },
        });
      }
      try {
        quietYearGame = {
          week: 0,
          deck: { cards: fleeting ? getNewFleetingYearDeck() : getNewQuietYearDeck() }
        }
        deck.type = "quiet year";
        deck.cards = fleeting ? getNewFleetingYearDeck() : getNewQuietYearDeck();
      } catch (err) {
        return res.status(400).json({ error: 'could not shuffle', err });
      }
      // Send a message into the channel where command was triggered from
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: `<@${req.body.member.user.id}> has started *The Quiet Year.*\n\n1. ***Introduction:*** begin by reading *The Opening Story* aloud, then *Explaining the Tools*, then *Who We Are*.\n2. ***Sketching Terrain:*** briefly discuss the general terrain as a group, then take turns introducing and sketching one environmental detail.\n3. ***Starting Resources:*** each player names a resource that is important to the community. Once you have written down these resources, decide as a group which resource is in Abundance. The rest are Scarcities within the community. Draw a representation of each Abundance and Scarcity on the map.\n\nClick the button below when you are ready to begin Week 1.`,
          flags: InteractionResponseFlags.SUPPRESS_NOTIFICATIONS,
          components: [
            {
              type: MessageComponentTypes.ACTION_ROW,
              components: [
                {
                  type: MessageComponentTypes.BUTTON,
                  custom_id: 'quiet_year_next_week_button',
                  label: 'Week 1',
                  style: ButtonStyleTypes.PRIMARY,
                },
              ],
            },
          ],
        },
      });
    }

    // "quiet-year-discard" command
    if (name === 'quiet-year-discard') {
      let numCardsToDiscard = 1;
      options?.forEach(option => {
        if (option.name === 'number') numCardsToDiscard = option.value;
      });
      let numCardsDiscarded;
      try {
        numCardsDiscarded = discardCardsFromDeck(quietYearGame.deck, numCardsToDiscard);
      } catch (err) {
        return res.status(400).json({ error: 'could not discard', err });
      }
      if (numCardsDiscarded < numCardsToDiscard) {
        // Deck is empty, end game
        quietYearGame = null;
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: "The deck is empty; the game has ended.",
            flags: InteractionResponseFlags.SUPPRESS_NOTIFICATIONS,
          },
        });
      }
      // Send a message into the channel where command was triggered from
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: `Discarded ${numCardsDiscarded} cards`,
          flags: InteractionResponseFlags.SUPPRESS_NOTIFICATIONS,
        },
      });
    }

    console.error(`unknown command: ${name}`);
    return res.status(400).json({ error: 'unknown command' });
  }

  /**
   * Handle requests from interactive components
   */
  if (type === InteractionType.MESSAGE_COMPONENT) {
    // custom_id set in payload when sending message component
    const componentId = data.custom_id;
    const endpoint = `webhooks/${process.env.APP_ID}/${req.body.token}/messages/${req.body.message.id}`;

    if (componentId === 'shuffle_deck_button') {
      try {
        shuffleDeck(deck);
        DiscordRequest(endpoint, {
          method: 'PATCH',
          body: {
            components: []
          }
        });
      } catch (err) {
        return res.status(400).json({ error: 'could not shuffle:', err });
      }
      // Send a message into the channel where command was triggered from
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: `<@${req.body.member.user.id}> Shuffled the deck`,
          flags: InteractionResponseFlags.SUPPRESS_NOTIFICATIONS,
        },
      });
    }

    if (componentId === 'reset_deck_button') {
      try {
        deck.cards = getNewPokerDeck();
        shuffleDeck(deck);
        DiscordRequest(endpoint, {
          method: 'PATCH',
          body: {
            components: []
          }
        });
      } catch (err) {
        return res.status(400).json({ error: 'could not refresh:', err });
      }
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: `<@${req.body.member.user.id}> Reset the deck. Want to shuffle it?`,
          flags: InteractionResponseFlags.SUPPRESS_NOTIFICATIONS,
          components: [
            {
              type: MessageComponentTypes.ACTION_ROW,
              components: [
                {
                  type: MessageComponentTypes.BUTTON,
                  custom_id: 'shuffle_deck_button',
                  label: 'Yes please',
                  style: ButtonStyleTypes.PRIMARY,
                },
              ],
            },
          ],
        },
      });
    }

    if (componentId.startsWith('quiet_year_reset_button')) {
      const fleeting = componentId.replace('quiet_year_reset_button_fleeting?=', '') === 'true';
      try {
        quietYearGame = {
          week: 0,
          deck: { cards: fleeting ? getNewFleetingYearDeck() : getNewQuietYearDeck() }
        }
      } catch (err) {
        return res.status(400).json({ error: 'could not reset:', err });
      }
      return res.send({
        type: InteractionResponseType.UPDATE_MESSAGE,
        data: {
          content: `<@${req.body.member.user.id}> has started *The Quiet Year.*\n\n1. Begin by reading *The Opening Story* aloud, then *Explaining the Tools*, then *Who We Are*.\n2. ***Sketching Terrain:*** As a group, take turns drawing one geographical feature.\n3. ***Starting Resources:*** Each player names a resource that is important to the community. Once you have written down these resources, decide as a group which resource is in Abundance. The rest are Scarcities within the community. Draw a representation of each Abundance and Scarcity on the map.\n\nClick the button below when you are ready to begin Week 1.`,
          flags: InteractionResponseFlags.SUPPRESS_NOTIFICATIONS,
          components: [
            {
              type: MessageComponentTypes.ACTION_ROW,
              components: [
                {
                  type: MessageComponentTypes.BUTTON,
                  custom_id: 'quiet_year_next_week_button',
                  label: 'Week 1',
                  style: ButtonStyleTypes.PRIMARY,
                },
              ],
            },
          ],
        },
      });
    }

    if (componentId === 'quiet_year_next_week_button') {
      let card;
      let week;
      console.log("Next week.", quietYearGame);
      try {
        week = ++quietYearGame.week;
        const drawnCards = drawCardsFromDeck(quietYearGame.deck);
        console.log("Drew", drawnCards);
        card = getQuietYearCardByNumber(drawnCards);
        if (drawnCards[0] === 12) quietYearGame = null;
        DiscordRequest(endpoint, {
          method: 'PATCH',
          body: {
            components: []
          }
        });
      } catch (err) {
        return res.status(400).json({ error: 'could not increment week:', err });
      }
      if (quietYearGame) {
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: `**Week ${week}**: ${card}`,
            flags: InteractionResponseFlags.SUPPRESS_NOTIFICATIONS,
            components: [
              {
                type: MessageComponentTypes.ACTION_ROW,
                components: [
                  {
                    type: MessageComponentTypes.BUTTON,
                    custom_id: 'quiet_year_next_week_button',
                    label: `Week ${quietYearGame.week + 1}`,
                    style: ButtonStyleTypes.PRIMARY,
                  },
                ],
              },
            ],
          },
        });
      } else {
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: `**Week ${week}**: ${card}`,
            flags: InteractionResponseFlags.SUPPRESS_NOTIFICATIONS,
          },
        });
      }
    }
  }

  console.error('unknown interaction type', type);
  return res.status(400).json({ error: 'unknown interaction type' });
});

app.listen(PORT, () => {
  console.log('Listening on port', PORT);
});
