export function parseRollExpression(expression) {
    const result = { breakout: '', value: 0 };
    if (expression.includes('+')) {
        const split = expression.split('+');
        for (let i = 0; i < split.length; i++) {
            const parsedSegment = parseRollExpression(split[i]);
            result.breakout += parsedSegment.breakout;
            if (i < split.length - 1) result.breakout += ' +'
            result.value += parsedSegment.value;
        }
    } else if (expression.includes('-')) {
        const split = expression.split('-');
        for (let i = 0; i < split.length; i++) {
            const parsedSegment = parseRollExpression(split[i]);
            result.breakout += parsedSegment.breakout;
            if (i < split.length - 1) result.breakout += ' -'
            i === 0 ? result.value += parsedSegment.value : result.value -= parsedSegment.value;
        }
    } else if (expression.includes('d')) {
        const split = expression.split('d');
        const numDice = Number(split[0]) || 1;
        if (numDice > 1) result.breakout += ' (';
        for (let i = 0; i < numDice; i++) {
            const rollResult = rollDie(Number(split[1]));
            result.breakout += `${numDice > 1 && i === 0 ? '' : ' '}\`${rollResult}\``;
            if (i < numDice - 1) result.breakout += ' +'
            result.value += rollResult;
        }
        if (numDice > 1) result.breakout += ')';
    } else {
        result.breakout += ` ${Number(expression)}`;
        result.value += Number(expression);
    }

    if (result.breakout.includes("NaN")) throw("NaN detected");

    return result;
};

function rollDie(numSides) {
    return Math.floor(Math.random() * numSides) + 1;
}