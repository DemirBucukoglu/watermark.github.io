// State variables
let currentTransformationType = 'words'; // default transformation type
let isWordMode = true;
const changes = new Map();

// Define which transformations work with which modes
const compatibleModes = {
    words: ['word'],               // words only works with word mode
    invisible: ['word', 'letter'], // invisible works with both modes
    spacing: ['word'],            // spacing only works with word mode
    combining: ['letter'],        // combining only works with letter mode
    heightVariation: ['letter'],  // height variation only works with letter mode
    doubleSpace: ['word']         // doubleSpace only works with word mode
};


// DOM Elements
const elements = {
    inputText: document.getElementById('inputText'),
    patternInput: document.getElementById('patternInput'),
    fileInput: document.getElementById('fileInput'),
    uploadButton: document.getElementById('uploadButton'),
    watermarkButton: document.getElementById('watermarkButton'),
    downloadButton: document.getElementById('downloadButton'),
    loadingIndicator: document.getElementById('loadingIndicator'),
    visualOutput: document.getElementById('visualOutput'),
    cleanOutput: document.getElementById('cleanOutput'),
    hexOutput: document.getElementById('hexOutput'),
    changesLog: document.getElementById('changesLog'),
    toggleMode: document.getElementById('toggleMode'),
    transformationType: document.getElementById('transformationType'),
    helpButton: document.getElementById('helpButton'),
    helpModal: document.getElementById('helpModal'),
    closeModal: document.getElementById('closeModal'),
    verificationText: document.getElementById('verificationText'),
    verificationPattern: document.getElementById('verificationPattern'),
    verifyButton: document.getElementById('verifyButton'),
    verificationResults: document.getElementById('verificationResults')
};

function showLoading(show) {
    elements.loadingIndicator.style.display = show ? 'flex' : 'none';
    elements.watermarkButton.disabled = show;
}

function updateToggleButtonState() {
    const currentType = elements.transformationType.value;
    const supportedModes = compatibleModes[currentType];
    const toggleButton = elements.toggleMode;

    // If the current transformation type only supports one mode
    if (supportedModes.length === 1) {
        toggleButton.disabled = true;
        toggleButton.style.opacity = '0.5';
        toggleButton.style.cursor = 'not-allowed';
        // Force the correct mode
        isWordMode = supportedModes[0] === 'word';
    } else {
        toggleButton.disabled = false;
        toggleButton.style.opacity = '1';
        toggleButton.style.cursor = 'pointer';
    }

    // Update the toggle button text
    toggleButton.querySelector('span').textContent = `Toggle Mode: ${isWordMode ? 'Word' : 'Letter'}`;
}

function toggleWatermarkMode() {
    const currentType = elements.transformationType.value;
    const supportedModes = compatibleModes[currentType];
    
    // Only toggle if the transformation type supports multiple modes
    if (supportedModes.length > 1) {
        isWordMode = !isWordMode;
        updateToggleButtonState();
    }
}

// Watermark Detection Functions
function detectWatermarks(text) {
    const results = {
        found: false,
        patterns: [],
        transformationTypes: new Set(),
        positions: []
    };

    // Check for each type of transformation
    Object.entries(transformations).forEach(([type, transform]) => {
        if (type === 'heightVariation') {
            const scalesRegex = new RegExp(transform.chars.join('|'), 'g');
            let match;

            while ((match = scalesRegex.exec(text)) !== null) {
                results.found = true;
                results.transformationTypes.add(transform.name);
                results.positions.push({
                    position: match.index,
                    char: match[0],
                    type: transform.name
                });
            }
        } else if (type === 'doubleSpace') {
            const doubleSpaceRegex = /  /g; // Matches all double spaces in the text
            let match;

            while ((match = doubleSpaceRegex.exec(text)) !== null) {
                results.found = true;
                results.transformationTypes.add(transform.name);
                results.positions.push({
                    position: match.index,
                    char: match[0],
                    type: transform.name
                });
            }
            
        } else {
            // Original detection logic for other transformation types
            transform.chars.forEach(char => {
                let position = -1;
                while ((position = text.indexOf(char, position + 1)) !== -1) {
                    results.found = true;
                    results.transformationTypes.add(transform.name);
                    results.positions.push({
                        position,
                        char,
                        type: transform.name
                    });

                    const potentialPattern = text.slice(position + 1, position + 33);
                    const binaryPattern = extractBinaryPattern(potentialPattern);
                    if (binaryPattern) {
                        results.patterns.push({
                            pattern: binaryPattern,
                            position,
                            type: transform.name
                        });
                    }
                }
            });
        }
    });

    // Sort positions for cleaner output
    results.positions.sort((a, b) => a.position - b.position);
    return results;
}

function saveState() {
    const state = {
        inputText: elements.inputText.value,
        patternInput: elements.patternInput.value,
        transformationType: elements.transformationType.value,
        batchCount: document.getElementById('batchCount')?.value || '',
        isWordMode: isWordMode
    };
    localStorage.setItem('homePageState', JSON.stringify(state));
}
function extractBinaryPattern(text) {
    let binaryString = '';
    for (let i = 0; i < text.length; i++) {
        if (text[i] === '\u200B') {
            binaryString += '0';
        } else if (text[i] === '\u200C') {
            binaryString += '1';
        } else {
            break;
        }
    }
    return binaryString.length > 0 ? binaryString : null;
}

function verifyPattern(text, pattern) {
    const detectionResults = detectWatermarks(text);
    if (!detectionResults.found) {
        return {
            verified: false,
            message: 'No watermarks found in the text.'
        };
    }

    let textToCheck = text;
    if (text.includes('transform:scaleY')) {
        // Extract height variations and convert to binary pattern
        const heightVariations = Array.from(text.matchAll(/<span style="display:inline-block; transform:scaleY\(([\d.]+)\)">/g))
            .map(match => match[1]);
        
        textToCheck = heightVariations.map(scale => {
            return transformations.heightVariation.scales.indexOf(scale) !== -1 ? '1' : '0';
        }).join('');
    }

    const binaryPattern = pattern.includes('0') || pattern.includes('1') 
        ? pattern 
        : Array.from(pattern).map(char => 
            char === '\u200B' ? '0' : char === '\u200C' ? '1' : ''
        ).join('');

    const patternFound = textToCheck.includes(binaryPattern);

    return {
        verified: patternFound,
        message: patternFound 
            ? 'Pattern verified! The text contains your watermark.' 
            : 'Pattern not found. The text contains other watermarks, but not the one you specified.',
        detectionResults
    };
}
function generateBatchWatermarks() {
    const input = elements.inputText.value;
    const userPattern = elements.patternInput.value;
    const batchCount = parseInt(document.getElementById('batchCount').value, 10);

    if (!input) {
        alert('Input text cannot be empty.');
        return;
    }
    if (!batchCount || batchCount <= 0) {
        alert('Please enter a valid number of variations.');
        return;
    }

    currentTransformationType = elements.transformationType.value;
    const transformation = transformations[currentTransformationType];
    const batchResults = [];

    for (let i = 1; i <= batchCount; i++) {
        let pattern = generateUniquePattern(input, `${userPattern}_${i}`);
        let watermarked = '';

        if (currentTransformationType === 'heightVariation') {
            watermarked = [...input].map((char, index) => {
                return /[a-zA-Z]/.test(char)
                    ? transformation.getVariation(char, index + i) // Offset by batch number
                    : char;
            }).join('');
        } else if (isWordMode) {
            const words = input.split(/(\s+)/);
            const positions = new Set();
            while (positions.size < Math.min(Math.floor(words.length / 10), 20)) {
                positions.add(Math.floor(Math.random() * words.length));
            }
            watermarked = words.map((word, index) =>
                positions.has(index)
                    ? word + transformation.chars[(index + i) % transformation.chars.length]
                    : word
            ).join('');
        } else {
            const chars = [...input];
            const positions = new Set();
            while (positions.size < Math.min(Math.floor(chars.length / 10), 20)) {
                positions.add(Math.floor(Math.random() * chars.length));
            }
            watermarked = chars.map((char, index) =>
                positions.has(index)
                    ? char + transformation.chars[(index + i) % transformation.chars.length]
                    : char
            ).join('');
        }

        batchResults.push({
            number: i,
            original: input,
            watermarked: watermarked,
            changes: `${currentTransformationType} changes applied in variation ${i}`
        });
    }

    // Handle single-variation case

        // Save batch results to localStorage and navigate to results page
        localStorage.setItem('batchResults', JSON.stringify(batchResults));
        document.getElementById('viewResultsButton').style.display = 'block';
    }






function highlightWatermarks(text, detectionResults) {
    let result = '';
    let lastPos = 0;
    
    detectionResults.positions.forEach(({position, type, scale, char}) => {
        result += text.substring(lastPos, position);
        if (type === "Height Variation") {
            result += `<span class="watermark-indicator" data-type="heightVariation">
                ${char}
                <span class="watermark-tooltip">Height Variation: ${scale}x</span>
            </span>`;
        } else {
            result += `<span class="watermark-indicator">|<span class="watermark-tooltip">Detected: ${type}</span></span>`;
        }
        lastPos = position + (type === "Height Variation" ? char.length : 1);
    });
    result += text.substring(lastPos);
    
    return result;
}

// Help Modal Functions
function openHelpModal() {
    elements.helpModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeHelpModal() {
    elements.helpModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

function watermarkText() {
    showLoading(true);
    setTimeout(() => {
        try {
            changes.clear();
            let watermarked = '';
            let visualText = '';
            let changeCount = 0;

            const input = elements.inputText.value;
            const userPattern = elements.patternInput.value;
            if (!input) throw new Error('Input text cannot be empty.');

            currentTransformationType = elements.transformationType.value;
            const transformation = transformations[currentTransformationType];
            const pattern = generateUniquePattern(input, userPattern);

            // Process text based on transformation type
            if (currentTransformationType === 'heightVariation') {
                // Process each character for height variation
                [...input].forEach((char, index) => {
                    if (/[a-zA-Z]/.test(char)) {  // Only modify letters
                        const scale = transformation.chars[changeCount % transformation.chars.length];
                        
                        // Add the modified character
                        watermarked += transformation.getVariation(char, changeCount);
                        
                        // Add visual indicator
                        visualText += `<span class="watermark-indicator" data-type="heightVariation">
                            ${transformation.getVariation(char, changeCount)}
                            <span class="watermark-tooltip">Height: ${scale}x</span>
                        </span>`;
                        
                        changes.set(changeCount++, {
                            position: index,
                            originalChar: char,
                            scale: scale,
                            type: 'heightVariation'
                        });
                    } else {
                        // Keep non-letters unchanged
                        watermarked += char;
                        visualText += char;
                    }
                });
            } else if (isWordMode) {
                // Word-level watermarking
                const words = input.split(/(\s+)/);
                const nonSpaceWords = words.filter((word, idx) => word.trim() && idx % 2 === 0);
                const insertCount = Math.min(Math.floor(nonSpaceWords.length / 10), 20);
                const positions = new Set();

                // Select random word positions for watermarking
                while (positions.size < insertCount) {
                    const randomIndex = Math.floor(Math.random() * nonSpaceWords.length) * 2;
                    positions.add(randomIndex);
                }

                words.forEach((word, index) => {
                    if (positions.has(index)) {
                        const watermarkChar = transformation.chars[changeCount % transformation.chars.length] + 
                                           pattern[changeCount % pattern.length];
                        
                        changes.set(changeCount++, {
                            position: index,
                            originalWord: word,
                            watermark: watermarkChar,
                            type: currentTransformationType
                        });

                        watermarked += word + watermarkChar;
                        visualText += `<span class="watermark-indicator">
                            ${word}
                            <span class="watermark-tooltip">Word Watermark: ${transformation.name}</span>
                        </span>`;
                    } else {
                        watermarked += word;
                        visualText += word;
                    }
                });
            } else {
                // Character-level watermarking
                const insertCount = Math.min(Math.floor(input.length / 10), 20);
                const positions = new Set();
                
                while (positions.size < insertCount) {
                    positions.add(Math.floor(Math.random() * input.length));
                }

                const sortedPositions = Array.from(positions).sort((a, b) => a - b);
                let lastPos = 0;

                sortedPositions.forEach((pos, index) => {
                    // Add text before the current position
                    watermarked += input.substring(lastPos, pos);
                    visualText += input.substring(lastPos, pos);

                    // Add watermark
                    const watermarkChar = transformation.chars[index % transformation.chars.length] + 
                                       pattern[index % pattern.length];
                    
                    changes.set(changeCount++, {
                        position: pos,
                        originalChar: input[pos],
                        watermark: watermarkChar,
                        type: currentTransformationType
                    });

                    watermarked += input[pos] + watermarkChar;
                    visualText += `<span class="watermark-indicator">
                        ${input[pos]}
                        <span class="watermark-tooltip">Character Watermark: ${transformation.name}</span>
                    </span>`;
                    
                    lastPos = pos + 1;
                });

                // Add remaining text
                watermarked += input.substring(lastPos);
                visualText += input.substring(lastPos);
            }

            // Update Visual Output
            elements.visualOutput.innerHTML = visualText;

            // Update Clean Output
            elements.cleanOutput.innerHTML = '';
            const textDiv = document.createElement('div');
            if (currentTransformationType === 'heightVariation') {
                textDiv.innerHTML = watermarked; // Preserve HTML for height variations
            } else {
                textDiv.textContent = watermarked; // Plain text for other transformations
            }
            elements.cleanOutput.appendChild(textDiv);

            // Add copy button
            const copyButton = document.createElement('button');
            copyButton.className = 'button success';
            copyButton.innerHTML = `
                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
                Copy to Clipboard
            `;
            copyButton.onclick = async () => {
                const textToCopy = currentTransformationType === 'heightVariation' 
                    ? watermarked.replace(/<[^>]+>/g, '') 
                    : watermarked;
                await navigator.clipboard.writeText(textToCopy);
                copyButton.innerHTML = `
                    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Copied!
                `;
                setTimeout(() => {
                    copyButton.innerHTML = `
                        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                        </svg>
                        Copy to Clipboard
                    `;
                }, 2000);
            };
            elements.cleanOutput.appendChild(copyButton);

            // Update Hex Output
            elements.hexOutput.innerHTML = toHexString(watermarked);

            // Update Changes Log
            if (currentTransformationType === 'heightVariation') {
                elements.changesLog.innerHTML = `
                    <h3>Watermark Information:</h3>
                    <div>Transformation Type: Height Variation</div>
                    <div>Letters modified: ${changes.size}</div>
                    <div>Height variations used: ${transformation.chars.map(scale => `${scale}x`).join(', ')}</div>
                `;
            } else {
                elements.changesLog.innerHTML = `
                    <h3>Watermark Information:</h3>
                    <div>Transformation Type: ${transformation.name}</div>
                    <div>Mode: ${isWordMode ? 'Word' : 'Letter'}</div>
                    <div>Number of watermarks inserted: ${changes.size}</div>
                    <div>Pattern length: ${pattern.length} characters</div>
                    <div>Positions of watermarks: ${Array.from(changes.keys()).join(', ')}</div>
                `;
            }

        } catch (err) {
            console.error('Watermarking error:', err);
            alert(err.message);
        } finally {
            showLoading(false);
        }
    }, 1000);
}

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            elements.inputText.value = e.target.result;
        };
        reader.readAsText(file);
    }
}

function downloadWatermarkedText() {
    const watermarkedText = elements.cleanOutput.textContent;
    if (!watermarkedText) {
        alert('Please generate a watermarked text first!');
        return;
    }

    const blob = new Blob([watermarkedText], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'watermarked_text.txt';
    a.click();
}

// Event Listeners
elements.watermarkButton.addEventListener('click', watermarkText);
elements.downloadButton.addEventListener('click', downloadWatermarkedText);
elements.uploadButton.addEventListener('click', () => elements.fileInput.click());
elements.fileInput.addEventListener('change', handleFileUpload);
elements.toggleMode.addEventListener('click', toggleWatermarkMode);
elements.helpButton.addEventListener('click', openHelpModal);
elements.closeModal.addEventListener('click', closeHelpModal);
document.getElementById('batchProcessButton').addEventListener('click', generateBatchWatermarks);
elements.transformationType.addEventListener('change', () => {
    currentTransformationType = elements.transformationType.value;
    updateToggleButtonState();
});
document.getElementById('viewResultsButton').addEventListener('click', () => {
    saveState();
    window.location.href = 'results.html';
});
document.addEventListener('DOMContentLoaded', () => {
    const savedState = JSON.parse(localStorage.getItem('homePageState'));

    if (savedState) {
        // Restore input values
        elements.inputText.value = savedState.inputText || '';
        elements.patternInput.value = savedState.patternInput || '';
        elements.transformationType.value = savedState.transformationType || 'words';
        document.getElementById('batchCount').value = savedState.batchCount || '';

        // Restore mode and update toggle button
        isWordMode = savedState.isWordMode;
        updateToggleButtonState();
    }
});
// Add event listener for verify button
elements.verifyButton.addEventListener('click', () => {
    const verificationText = elements.verificationText.value;
    const patternToVerify = elements.verificationPattern.value;
    const resultsDiv = elements.verificationResults;
    
    if (!verificationText) {
        alert('Please enter text to verify.');
        return;
    }
    
    const results = patternToVerify 
        ? verifyPattern(verificationText, patternToVerify)
        : detectWatermarks(verificationText);
        
    // Display results
    resultsDiv.className = 'verification-results active';
    
    let summaryClass = 'verification-summary ';
    if (patternToVerify) {
        summaryClass += results.verified ? 'success' : 'warning';
    } else {
        summaryClass += results.found ? 'success' : 'error';
    }
    
    let html = `
        <div class="${summaryClass}">
            ${patternToVerify ? results.message : (results.found ? 'Watermarks detected!' : 'No watermarks found in the text.')}
        </div>
    `;
    
    if (results.found || (results.detectionResults && results.detectionResults.found)) {
        const detectedResults = results.detectionResults || results;
        
        html += `
            <div class="verification-details">
                <h4>Detection Details:</h4>
                <ul>
                    <li>Types of watermarks found: ${Array.from(detectedResults.transformationTypes).join(', ')}</li>
                    <li>Number of watermarks: ${detectedResults.positions.length}</li>
                    ${detectedResults.patterns.length ? `<li>Patterns found: ${detectedResults.patterns.map(p => p.pattern).join(', ')}</li>` : ''}
                </ul>
                
                <h4>Preview:</h4>
                <div class="verification-preview">
                    ${highlightWatermarks(verificationText, detectedResults)}
                </div>
            </div>
        `;
    }
    
    resultsDiv.innerHTML = html;
});