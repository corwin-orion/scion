import { removeRandomElementsFromArray } from "./helpers/removeRandomElementsFromArray.js";
import { shuffleArray } from "./helpers/shuffleArray.js";

export function getQuietYearCardByNumber(cardNumber) {
	let result = "";
	const numericValue = cardNumber % 13;
	const suit = cardNumber / 13;

	// Get card value
	let cardValue = "";
	if (numericValue === 0) cardValue = "Ace";
	else if (numericValue === 10) cardValue = "Jack";
	else if (numericValue === 11) cardValue = "Queen";
	else if (numericValue === 12) cardValue = "King";
	else cardValue = ` ${numericValue + 2}`;

	// Combine card value with suit
	if (suit < 1) result += `♠️ **${cardValue} of Spades**`;
	else if (suit < 2) result += `♣️ **${cardValue} of Clubs**`;
	else if (suit < 3) result += `♦️ **${cardValue} of Diamonds**`;
	else result += `♥️ **${cardValue} of Hearts**`;

	// Add an Oracle result
	const oracle = [
		// Spades: Winter
		"\n- Now is the time to conserve energy and resources. __A project fails, but gain an Abundance.__\nor...\n- Now is the time for hurried labour and final efforts. __A project finishes early, but gain a Scarcity.__",
		"\n- A headstrong community member takes charge of the community's work efforts. __A project fails, and then a different project finishes early.__\nor...\n- A headstrong community member tries to take control of the community. How are they prevented from doing this? Due to the conflict, __project dice are not reduced this week.__",
		"\n- Someone comes up with an ingenious solution to a big problem and as a result __a project finishes early__. What was their idea?\nor...\n- Someone comes up with a plan to ensure safety and comfort during the coldest months. __Start a project related to this.__",
		"\n- All the animals and young children are crying and won't stop. __Hold a discussion about this__, in addition to your regular action for the week.\nor...\n- A great atrocity is revealed. What is it? Who uncovers it?",
		"\n- Winter elements destroy a food source. If this was your only food source, __add a Scarcity.__\nor...\n- Winter elements leave everyone cold, tired, and miserable. __Project dice are not reduced this week.__",
		"\n- The time has come to consolidate your efforts and your borders. __Projects located outside the settlement fail, and all remaining projects are reduced by 2 this week.__\nor...\n- Someone finds a curious opportunity on the edge of the map. __Start a project related to this discovery.__",
		"\nWhat is winter like in this area? How do community members react to the weather?",
		"\nWinter is harsh, and desperation gives rise to fear mongering. Choose one:\n- Spend the week calming the masses and dispelling their violent sentiments. __The week ends immediately.__\n- Declare war on someone or something. __This counts as starting a project.__",
		"\nSomeone goes missing. They're alone in the winter elements. Choose one:\n- The community organizes constant search parties and eventually the person is found. __Project dice are not reduced this week.__\n- No one ever hears from that person again.",
		"\nIn preparation for the coming year, the community begins a huge undertaking. __Start a project that will take at least 5 weeks to complete.__",
		"\nAn infected outsider arrives, seeking amnesty. They have some much-needed resources with them. Choose one:\n- Welcome them into the community. __Remove a Scarcity__, but also introduce an infection into the community.\n- Bar them from entry. What Scarcity could they have addressed? How does its need become more dire this week?",
		"\nYou see a good omen. What is it?",
		"\nThe Frost Shepherds arrive. __The game is over.__",
		// Clubs: Autumn
		"\nThe community becomes obsessed with a single project. Which one? Why? Choose one:\n- They decide to take more time to ensure that it is perfect. __Add 3 weeks to the project die.__\n- They drop everything else to work on it. __All other projects fail.__\n\n*If there are no projects underway,* the community becomes obsessed with a grandiose vision. __Hold a discussion about this vision, in addition to your regular action for the week.__",
		"\n- Someone returns to the community. Who? Where were they?\nor...\n- You find a body. Do people recognize who it is? What happened?",
		"\n- Someone leaves the community after issuing a dire warning. Who? What is the warning?\nor...\n- Someone issues a dire warning, and the community leaps into action to avoid disaster. What is the warning? __Start a contentious project that relates to it.__",
		"\n- The strongest among you dies. What caused the death?\nor...\n- The weakest among you dies. Who's to blame for their death?",
		"\n- The Parish arrives. Who are they? Why have they chosen your community, and for what?\nor...\n- A small gang of marauders is making its way through local terrain. How many are there? What weapons do they carry?",
		"\n- Introduce a dark mystery among the members of the community.\nor...\n- Conflict flares up among community members, and as a result, __a project fails.__",
		"\n- A project just isn't working out as expected. __Radically change the nature of this project (don't modify the project die). When it resolves, you'll be responsible for telling the community how it went.__\nor...\n- Something goes foul and supplies are ruined. __Add a new Scarcity.__",
		"\n- Someone sabotages a project, and __the project fails__ as a result. Who did this? Why?\nor...\n- Someone is caught trying to sabotage the efforts of the community. How does the community respond?",
		"\n- The community works constantly and as a result __a project finishes early.__\nor...\n- A group goes out to explore the map more thoroughly, and finds something that had been previously overlooked.",
		"\n- Harvest is here and plentiful. __Add an Abundance.__\nor...\n- Cold autumn winds drive out your enemies. __Remove a threatening force from the map and the area.__",
		"\n__A project finishes early.__ Which one? Why?\n\n*If there are no projects underway,* restlessness creates animosity, and animosity leads to violence. Who gets hurt?",
		"\nDisease spreads through the community. Choose one:\n- You spend the week quarantining and treating the disease. __Project dice are not reduced this week.__\n- Nobody knows what to do about it. __Add “Health and Fertility” as a Scarcity.__",
		"\nA natural disaster strikes the area. What is it? Choose one:\n- You focus on getting everyone to safety. __Remove an Abundance and a project fails.__\n- You focus on protecting your supplies and hard work at any cost. Several people die as a result.",
		// Diamonds: Summer    
		"\n- A contingent within the community demand to be heard. Who are they? What are they asking for?\nor...\n- A contingent within the community have acted on their frustrations. What have they damaged, and why did they damage it? Is it permanent?",
		"\n- Someone new arrives. Who? Why are they in distress?\nor...\n- Someone leaves the community. Who? What are they looking for?",
		"\n- Summer is a time for production and tending to the earth. __Start a project related to food production.__\nor...\n- Summer is a time for conquest and the gathering of might. __Start a project related to military readiness and conquest.__",
		"\n- The eldest among you dies. What caused the death?\nor...\n- The eldest among you is very sick. Caring for them and searching for a cure requires the help of the entire community. __Do not reduce project dice this week.__",
		"\n- __A project finishes early.__ What led to its early completion?\nor...\n- The weather is nice and people can feel the potential all around them. __Start a new project.__",
		"\n- Outsiders arrive in the area. Why are they a threat? How are they vulnerable?\nor...\n- Outsiders arrive in the area. How many? How are they greeted?",
		"\n- Introduce a mystery at the edge of the map.\nor...\n- An unattended situation becomes problematic and scary. What is it? How does it go awry?",
		"\n- Someone tries to take control of the community by force. Do they succeed? Why do they do this?\nor...\n- A headstrong community member decides to put one of their ideas in motion. __Start a foolish project.__",
		"\n- __A project fails.__ Which one? Why?\nor...\n- Something goes foul and supplies are ruined. __Add a new Scarcity.__",
		"\n- You discover a cache of supplies or resources. __Add a new Abundance.__\nor...\n- A Scarcity has gone unaddressed for too long! __Start a project that will alleviate that Scarcity.__",
		"\n- Predators and bad omens are afoot. You are careless, and someone goes missing under ominous circumstances. Who?\nor...\n- Predators and bad omens are afoot. What measures do you take to keep everyone safe and under surveillance? __Do not reduce project dice this week.__",
		"\n__A project finishes early.__ Which one? Why?\n\n*If there are no projects underway,* boredom leads to quarrel. A fight breaks out between two people. What is it about?",
		"\n- Summer is fleeting. __Discard the top two cards off the top of the deck and take two actions this week.__",
		// Hearts: Spring    
		"\n- What group has the highest status in the community? What must people do to gain inclusion in this group?\nor...\n- Are there distinct family units in the community? If so, what family structures are common?",
		"\n- There's a large body of water on the map. Where is it? What does it look like?\nor...\n- There's a giant, man-made structure on the map. Where is it? Why is it abandoned?",
		"\n- Someone new arrives. Who?\nor...\n- Two of the community's younger members get into a fight. What provoked them?",
		"\n- What important and basic tools does the community lack?\nor...\n- Where are you storing your food? Why is this a risky place to store things?",
		"\n- There is a disquieting legend about this place. What is it?\nor...\n- Alarming weather patterns destroy something. How and what?",
		"\n- Are there children in your community? If there are, what is their role in the community?\nor...\n- How old are the eldest members of the community? What special needs do they have?",
		"\n- Where does everyone sleep? Who is unhappy with this arrangement, and why?\nor...\n- What natural predators roam this area? Are you safe?",
		"\n- An old piece of machinery is discovered, broken but perhaps repairable. What is it? What would it be useful for?\nor...\n- An old piece of machinery is discovered, cursed and dangerous. How does the community destroy it?",
		"\n- A charismatic young girl convinces many to help her with an elaborate scheme. What is it? Who joins her endeavors? __Start a project to reflect.__\nor...\n- A charismatic young girl tries to tempt many into sinful or dangerous activity. Why does she do this? How does the community respond?",
		"\n- There's another community somewhere on the map. Where are they? What sets them apart from you?\nor...\n- What belief or practice helps to unify your community?",
		"\n- You see a good omen. What is it?\nor...\n- You see a bad omen. What is it?",
		"\n- What's the most beautiful thing in this area?\nor...\n- What's the most hideous thing in this area?",
		"\n- A young boy starts digging in the ground, and discovers something unexpected. What is it?\nor...\n- An old man confesses to past crimes and atrocities. What has he done?",
	]
	result += oracle[cardNumber];

	return result
}

export function getNewQuietYearDeck() {
	const spades = [...Array(13).keys()];
	shuffleArray(spades);
	let result = [...spades]
	for (let i = 1; i < 4; i++) {
		const nextQuarter = [...Array(13).keys()]
		const nextQuarterSuited = nextQuarter.map(num => num + 13 * i);
		shuffleArray(nextQuarterSuited);
		result = [...result, ...nextQuarterSuited];
	}
	return result;
}

export function getNewFleetingYearDeck() {
	const spades = [...Array(12).keys()];
  removeRandomElementsFromArray(spades, 4);
  spades.push(12); // Add King of Spades
	shuffleArray(spades);
	let result = [...spades]
	for (let i = 1; i < 4; i++) {
		const nextQuarter = i === 2 ?
      [...Array(12).keys()]: // Remove King of Diamonds
      [...Array(13).keys()];
    removeRandomElementsFromArray(nextQuarter, i === 2 ? 3 : 4)
		const nextQuarterSuited = nextQuarter.map(num => num + 13 * i);
		shuffleArray(nextQuarterSuited);
		result = [...result, ...nextQuarterSuited];
	}
	return result;
}