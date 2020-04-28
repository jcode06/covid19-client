
const addSpacesToWord = word => {
    var newWord = [];
    newWord.push(word[0]);
    for(let i=1; i < word.length; i++) {
        let char = word.charAt(i);
        let charCode = word.charCodeAt(i);

        if(charCode >= 65 && charCode <= 90) {
            newWord.push(' ');
        }
        newWord.push(char);
    }
    return newWord.join('');
};

module.exports = { 
    addSpacesToWord
}