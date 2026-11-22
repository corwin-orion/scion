export function parseRollExpression(expression) {
    const result = { breakout: '', value: 0 };
    let modes = [];
    if (expression.includes('+')) {
        const split = expression.split('+');
        for (let i = 0; i < split.length; i++) {
            const parsedSegment = parseRollExpression(split[i]);
            result.breakout += parsedSegment.breakout;
            if (i < split.length - 1) result.breakout += ' + '
            result.value += parsedSegment.value;
        }
    } else if (expression.includes('-')) {
        const split = expression.split('-');
        for (let i = 0; i < split.length; i++) {
            const parsedSegment = parseRollExpression(split[i]);
            result.breakout += parsedSegment.breakout;
            if (i < split.length - 1) result.breakout += ' - '
            i === 0 ? result.value += parsedSegment.value : result.value -= parsedSegment.value;
        }
    } else if (expression.includes('d')) {
        let [numDice, ...dieType] = expression.split('d');
        dieType = dieType.join('d');
        // If dieType ends in <>, remove it and set the cpr_explode flag
        if (dieType.endsWith('<>')) {
            dieType = dieType.slice(0, -2);
            modes.push('cpr_explode');
        }
        if (isNaN(Number(dieType))) throw (`Invalid die type: \`d${dieType}\``);
        let rollResult = { breakout: '', value: 0 };
        // max or min dice flags
        if (numDice.startsWith('max') || numDice.startsWith('min')) {
            modes.push(numDice.slice(0, 3));
            numDice = numDice.slice(3);
            if (isNaN(Number(numDice))) throw (`Invalid number of dice: \`${numDice}\``);
            rollResult = rollDice(numDice, Number(dieType), modes);
        } else {
            // normal roll
            if (isNaN(Number(numDice))) throw (`Invalid number of dice: \`${numDice}\``);
            numDice = Number(numDice) || 1;
            rollResult = rollDice(numDice, Number(dieType), modes);
        }
        result.breakout += rollResult.breakout;
        result.value += rollResult.value;
    } else {
        result.breakout += `${Number(expression)}`;
        result.value += Number(expression);
    }

    if (result.breakout.includes("NaN")) throw ("Invalid roll expression.");

    return result;
};

function rollDice(numDice, numSides, modes) {
    const result = { breakout: '', value: 0 };
    const rolls = [];
    let index = -1;


    // Roll dice and add them to the rolls array
    for (let i = 0; i < numDice; i++) {
        let roll = Math.floor(Math.random() * numSides) + 1

        if (modes.includes('cpr_explode')) {
            if (roll === numSides || roll === 1) {
                let explodeRoll = Math.floor(Math.random() * numSides) + 1;
                if (roll === numSides) {
                    rolls.push(`<${roll}+${explodeRoll}>`);
                    roll += explodeRoll;
                } else {
                    rolls.push(`<${roll}-${explodeRoll}>`);
                    roll -= explodeRoll;
                }
            } else rolls.push(roll);
        } else rolls.push(roll);

        if (modes.includes('max') || modes.includes('min')) {
            if (i === 0) {
                index = i;
                result.value = roll;
            } else if ((modes.includes('max') && roll > result.value) || (modes.includes('min') && roll < result.value)) {
                index = i;
                result.value = roll;
            }
        } else {
            result.value += roll;
        }
    }

    // Construct the result.breakout
    if (modes.includes('max') || modes.includes('min')) {
        for (let i = 0; i < rolls.length; i++) {
            if (i === index) {
                result.breakout += `**\`${rolls[i]}\`**`;
            } else {
                result.breakout += `\`${rolls[i]}\``;
            }
            if (i < rolls.length - 1) result.breakout += ', '
        }
        result.breakout = `${modes.includes('max') ? 'max' : 'min'}(${result.breakout})`
    } else if (numDice > 1) {
        for (let i = 0; i < rolls.length; i++) {
            result.breakout += `\`${rolls[i]}\``;
            if (i < rolls.length - 1) result.breakout += ', '
        }
    } else if (numDice === 1) {
        result.breakout += `\`${rolls[0]}\``;
    }

    return result;
}