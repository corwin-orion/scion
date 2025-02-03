export function removeRandomElementsFromArray(array, numElements) {
    for (let i = 0; i < numElements; i++) {
        const indexToRemove = Math.floor(Math.random() * array.length);
        array.splice(indexToRemove, 1)
    }
}