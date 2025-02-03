import { Emoji } from 'discord.js';
import { capitalize } from './utils.js';

export function getCardByNumber(cardNumber) {
  let result = "";
  const numericValue = cardNumber % 13;
  const suit = cardNumber / 13;

  // Get card value
  let cardValue = "";
  if (numericValue === 9) cardValue = "Jack";
  else if (numericValue === 10) cardValue = "Queen";
  else if (numericValue === 11) cardValue = "King";
  else if (numericValue === 12) cardValue = "Ace";
  else cardValue = ` ${numericValue + 2}`;

  // Combine card value with suit
  if (suit < 1) result += `♣️ ${cardValue} of Clubs`;
  else if (suit < 2) result += `♦️ ${cardValue} of Diamonds`;
  else if (suit < 3) result += `♥️ ${cardValue} of Hearts`;
  else result += `♠️ ${cardValue} of Spades`;

  return result
}

export function getNewDeck() {
  return [...Array(52).keys()];
}

export function shuffleDeck(deck) {
  const { cards } = deck;
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
}

export function drawCardsFromDeck(deck, number) {  
  const result = [];
  for (let i = 0; i < number; i++) {
    if (deck.cards.length == 0) break;
    result.push(deck.cards.pop());
  }
  return result;
}