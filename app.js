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
import { getRandomEmoji, DiscordRequest } from './utils.js';
import { drawCardsFromDeck, getPokerCardByNumber, getNewPokerDeck, shuffleDeck, discardCardsFromDeck } from './deck.js';
import { getNewQuietYearDeck, getQuietYearCardByNumber } from './quiet-year.js';

// Create an express app
const app = express();
// Get port, or default to 3000
const PORT = process.env.PORT || 3000;
// To keep track of the deck
const deck = { type: "poker", cards: getNewPokerDeck() };
shuffleDeck(deck);

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
									// Value for your app to identify the button
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

		// "shuffle-quiet-year" command
		if (name === 'shuffle-quiet-year') {
			let fleeting = false;
			options?.forEach(option => {
				if (option.name === 'fleeting') fleeting = option.value;
			});
			try {
				deck.type = "quiet year";
				deck.cards = getNewQuietYearDeck();
			} catch (err) {
				return res.status(400).json({ error: 'could not shuffle', err });
			}
			// Send a message into the channel where command was triggered from
			return res.send({
				type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
				data: {
					content: "The deck is now set up for The Quiet Year. Cards drawn will be accompanied by an Oracle result.",
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
				return res.status(400).json({ error: 'could not shuffle', err });
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
			// Send a message into the channel where command was triggered from
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
									// Value for your app to identify the button
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
	}

	console.error('unknown interaction type', type);
	return res.status(400).json({ error: 'unknown interaction type' });
});

app.listen(PORT, () => {
	console.log('Listening on port', PORT);
});
