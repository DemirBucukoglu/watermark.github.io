document.addEventListener('DOMContentLoaded', () => {
    const resultsContainer = document.getElementById('resultsContainer');
    const batchResults = JSON.parse(localStorage.getItem('batchResults') || '[]');

    if (!batchResults.length) {
        resultsContainer.innerHTML = '<p>No batch results found. Please go back and generate watermarks.</p>';
        return;
    }

    // Highlight changes for on-screen display
    function highlightChanges(original, watermarked) {
        let highlighted = '';
        let originalIndex = 0;
    
        for (let i = 0; i < watermarked.length; i++) {
            if (original[originalIndex] !== watermarked[i]) {
                // Add as HTML span for watermarks
                highlighted += `<span class="watermark-indicator">${watermarked[i]}</span>`;
            } else {
                highlighted += watermarked[i]; // Add unchanged text
                originalIndex++;
            }
        }
        return highlighted;
    }
    

    // Display batch results
    batchResults.forEach(result => {
        const groupDiv = document.createElement('div');
        groupDiv.className = 'results-group';

        const highlightedText = highlightChanges(result.original, result.watermarked);

        groupDiv.innerHTML = `
            <div class="results-number">Variation ${result.number}</div>
            <div class="text-box watermarked">
                <strong>Watermarked Text (Highlighted Changes):</strong><br>${highlightedText}
            </div>
        `;

        resultsContainer.appendChild(groupDiv);
    });

    // Function to download plain text for each variation
    function downloadPlainText() {
        batchResults.forEach(result => {
            // Extract plain text from the watermarked text by removing HTML tags
            const plainText = result.watermarked.replace(/<\/?[^>]+(>|$)/g, '');

            // Create a Blob with plain text content
            const blob = new Blob([plainText], { type: 'text/plain' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `Variation_${result.number}.txt`;
            a.click();
        });
    }

    // Attach the plain text download functionality to the button
    document.getElementById('downloadPlainTextButton').addEventListener('click', downloadPlainText);
});
