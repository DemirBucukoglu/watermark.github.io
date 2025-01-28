# Text Watermarking Tool  https://demirbucukoglu.github.io/watermark.github.io/


A web-based application to create invisible watermarks for text. This tool is perfect for embedding unique identifiers into text, allowing you to track and verify your text even after copy-pasting operations.

---

## Features

- **Batch Processing**: Generate multiple variations of watermarked text for redundancy and uniqueness.
- **Custom Patterns**: Add your unique watermarking patterns for easy tracking.
- **Invisible Watermarking Options**:
  1. **Word Replacement**: Embed marks at the word level.
  2. **Zero-Width Characters**: Add invisible characters between letters.
  3. **Special Spaces**: Use non-breaking or fancy spaces.
  4. **Combining Characters**: Add tiny dots and lines to letters.
  5. **Double Space**: Add double spaces between words for a subtle watermark.
  6. **Height Variation**: Slightly adjust the height of letters for a natural-looking watermark.
- **Verification**: Detect and verify embedded watermarks in text.

---

## Demo

1. Input your text in the input box.
2. Select a watermarking option from the dropdown menu.
3. Optionally, add a unique pattern.
4. Choose the number of watermark variations to generate.
5. Click "Generate Watermark."
6. View the batch results by clicking the "View Batch Results" button.

---
### 2. **Core Components**
- **Input Section**: Paste or type the text you want to watermark.
- **Batch Processing**: Enter the number of watermark variations to create.
- **View Results**: Click "View Batch Results" to review all generated variations.
- **Download**: Save watermarked text as plain text files.

---

## File Structure

```
.
├── index.html          # Main interface of the application
├── results.html        # Displays batch-generated watermarks
├── app.js              # Core JavaScript for functionality
├── results.js          # Logic for displaying batch results
├── transformations.js  # Defines watermarking methods
├── styles.css          # Application styling
└── README.md           # Documentation
```

---

## Technical Details

### Technologies Used:
- **HTML/CSS**: For layout and design.
- **JavaScript**: For interactive functionality.

### Key Functions:
- `generateBatchWatermarks()`: Generates multiple variations of watermarked text.
- `detectWatermarks(text)`: Detects and verifies watermarks in input text.
- `highlightChanges()`: Highlights differences in batch results.

---

## How It Works

1. **Invisible Watermarking**: Uses Unicode characters (e.g., zero-width spaces, combining characters) to embed unique markers without altering visible text.
2. **Batch Variations**: Generates multiple variations to ensure each watermark is unique.
3. **Verification**: Detects embedded watermarks by analyzing text for specific patterns or markers.

---



## License

This project is licensed under the MIT License. Feel free to use, modify, and distribute it.


