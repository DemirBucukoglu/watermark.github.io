// Define all transformation types and their characters
const transformations = {
    words: {
        name: "Word Replacement",
        chars: [
            '\u200E', // left-to-right mark
            '\u200F', // right-to-left mark
            '\u202A', // left-to-right embedding
            '\u202B'  // right-to-left embedding
        ]
    },
    invisible: {
        name: "Zero-Width Characters",
        chars: [
            '\u200B', // zero-width space
            '\u200C', // zero-width non-joiner
            '\u200D', // zero-width joiner
            '\uFEFF'  // zero-width no-break space
        ]
    },
    spacing: {
        name: "Special Spaces",
        chars: [
            '\u2004', // three-per-em space
            '\u2006', // six-per-em space
            '\u2009', // thin space
            '\u200A'  // hair space
        ]
    },
    combining: {
        name: "Combining Characters",
        chars: [
            '\u034F', // combining grapheme joiner
            '\u0305', // combining overline
            '\u0335', // combining short stroke overlay
            '\u0323'  // combining dot below
        ]
    },
    heightVariation: {
        name: "Height Variation",
        chars: [
            '\u200B\u034F', // zero-width space + combining grapheme joiner for 1.001
            '\u200C\u034F', // zero-width non-joiner + combining grapheme joiner for 0.999
            '\u200D\u034F', // zero-width joiner + combining grapheme joiner for 1.002
            '\uFEFF\u034F'  // zero-width no-break space + combining grapheme joiner for 0.998
        ],
        scales: ['1.001', '0.999', '1.002', '0.998'],
        getVariation: function(char, index) {
            const scale = this.scales[index % this.scales.length];
            const marker = this.chars[index % this.chars.length];
            return `${char}${marker}`; // Return only the character with any markers
            ;
        }
    },
    doubleSpace: {
        name: "Double Space",
        chars: [
            '  ', // double space
            '  ', // double space (repeated for consistency)
            '  ', // double space
            '  '  // double space
        ]
    }
};

// Function to generate a unique pattern for watermarking
function generateUniquePattern(input, userPattern = '') {
    const timestamp = Date.now().toString(2);
    let pattern = userPattern ? userPattern : timestamp;
    
    const binaryMapping = {
        '0': '\u200B',
        '1': '\u200C'
    };

    // For height variation, we'll use actual visible modifiers
    if (currentTransformationType === 'heightVariation') {
        return pattern.split('').map((char, index) => {
            if (/\d/.test(char)) {
                const heightMarks = transformations.heightVariation.chars;
                return heightMarks[index % heightMarks.length];
            }
            return char;
        }).join('');
    }

    return pattern.split('').map(bit => binaryMapping[bit] || bit).join('');
}

// Function to convert text to hexadecimal representation
function toHexString(str) {
    let result = '';
    for (let i = 0; i < str.length; i++) {
        const hex = str.charCodeAt(i).toString(16).padStart(4, '0');
        const char = str[i];
        if (char.charCodeAt(0) >= 0x200B) { // Special character
            result += `<span class="hex-special">${hex}</span> `;
        } else {
            result += `${hex} `;
        }
    }
    return result;
}

// Helper function for better height variation
function applyHeightVariation(text) {
    return text.replace(/\d+/g, (match) => {
        return match.split('').map((digit, index) => {
            const heightMark = transformations.heightVariation.chars[index % transformations.heightVariation.chars.length];
            return digit + heightMark;
        }).join('');
    });
}