export function parseRollExpression(expression) {
    const result = { breakout: '', value: 0 };
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
        if (isNaN(Number(dieType))) throw (`Invalid die type: \`d${dieType}\``);
        let rollResult = { breakout: '', value: 0 };
        // max or min dice flags
        if (numDice.startsWith('max') || numDice.startsWith('min')) {
            const mode = numDice.slice(0, 3);
            numDice = numDice.slice(3);
            if (isNaN(Number(numDice))) throw(`Invalid number of dice: \`${numDice}\``);
            rollResult = rollDice(numDice, Number(dieType), mode);
        } else {
            // normal roll
            if (isNaN(Number(numDice))) throw (`Invalid number of dice: \`${numDice}\``);
            numDice = Number(numDice) || 1;
            rollResult = rollDice(numDice, Number(dieType));
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

function rollDice(numDice, numSides, mode) {
    const result = { breakout: '', value: 0 };
    const rolls = [];
    let index = -1;
    
    // Roll dice and add them to the rolls array
    for (let i = 0; i < numDice; i++) {
        const roll = Math.floor(Math.random() * numSides) + 1
        rolls.push(roll);
    
        if (mode === 'max' || mode === 'min') {
            if (i === 0) {
                index = i;
                result.value = roll;
            } else if ((mode === 'max' && roll > result.value) || (mode === 'min' && roll < result.value)) {
                index = i;
                result.value = roll;
            }
        } else {
            result.breakout += `\`${roll}\`${i < (numDice || 1) - 1 ? ' + ' : ''}`;
            result.value += roll;
        }
    }
    
    if (mode === 'max' || mode === 'min') {
        // Construct result.breakout and calculate result.value
        for (let i = 0; i < rolls.length; i++) {
            if (i === index) {
                result.breakout += `**\`${rolls[i]}\`**`;
            } else {
                result.breakout += `\`${rolls[i]}\``;
            }
            if (i < rolls.length - 1) result.breakout += ', '
        }
        result.breakout = `${mode}(${result.breakout})`
    } else if (numDice > 1) {
        result.breakout = `(${result.breakout})`;
    }

    return result;
}