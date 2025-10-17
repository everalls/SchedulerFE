import * as cheerio from 'cheerio';

/**
 * Decodes a secret message from a Google Doc containing Unicode characters and their 2D grid positions.
 * Takes a Google Doc URL, retrieves the data, and prints the grid of characters that form uppercase letters.
 *
 * @param {string} documentUrl - The URL of the published Google Document containing coordinate data
 * @returns {Promise<string>} The reconstructed grid showing the secret message
 */
async function decodeSecretMessage(documentUrl) {
  if (!documentUrl) {
    return 'ERROR: No URL provided.';
  }

  try {
    const response = await fetch(documentUrl);
    if (!response.ok) {
      return `ERROR: Failed to fetch document. Status: ${response.status}`;
    }
    const html = await response.text();
    const $ = cheerio.load(html);

    const $table = $('#contents table').first();
    if ($table.length === 0) return 'ERROR: Could not find table.';

    const coordinates = [];
    $table.find('tr').each((rowIndex, row) => {
      const $cells = $(row).find('td');
      if ($cells.length >= 3) {
        // Skip header row if it contains text like "x", "y", "character"
        if (rowIndex === 0) {
          const firstCellText = $cells.eq(0).text().trim().toLowerCase();
          if (
            firstCellText.includes('x') ||
            firstCellText.includes('coordinate') ||
            firstCellText.includes('character') ||
            firstCellText.includes('unicode')
          ) {
            return; // Skip header row
          }
        }

        // Use the original working format: x, character, y
        let x = parseInt($cells.eq(0).text().trim(), 10);
        let character = $cells.eq(1).text().trim();
        let y = parseInt($cells.eq(2).text().trim(), 10);

        // If we have valid coordinates and character
        if (!isNaN(x) && !isNaN(y) && character) {
          // Replace light block character with space for readability
          if (character === '░' || character === '▢' || character === '□') {
            character = ' ';
          }

          coordinates.push({
            x: x,
            y: y,
            char: character,
          });
        }
      }
    });

    if (coordinates.length === 0) {
      return 'ERROR: No coordinates found.';
    }

    // 1. Sort the coordinates: by Y (row) first, then by X (column).
    const sortedCoordinates = coordinates.sort((a, b) => {
      if (a.y !== b.y) return a.y - b.y;
      return a.x - b.x;
    });

    // 2. Find grid dimensions
    const maxX = Math.max(...coordinates.map((c) => c.x));
    const maxY = Math.max(...coordinates.map((c) => c.y));

    // Validate grid dimensions
    if (maxX < 0 || maxY < 0) {
      return 'ERROR: Invalid coordinates found.';
    }

    // 3. Create a 2D grid filled with spaces
    const grid = [];
    for (let y = 0; y <= maxY; y++) {
      grid[y] = [];
      for (let x = 0; x <= maxX; x++) {
        grid[y][x] = ' '; // Fill with spaces initially
      }
    }

    // 4. Place characters at their coordinates
    // Fix ONLY extra Y-flip (vertical flip)
    for (const coord of coordinates) {
      const flippedY = maxY - coord.y;
      grid[flippedY][coord.x] = coord.char;
    }

    // 5. Convert grid to string with newlines
    const finalOutput = grid.map((row) => row.join('')).join('\n');

    return finalOutput;
  } catch (error) {
    return `ERROR: Unhandled exception during processing: ${error.message}`;
  }
}

/**
 * Main function that takes a URL and handles the complete decoding process.
 * This function handles all async operations internally and outputs the result.
 *
 * @param {string} url - The URL of the Google Document to decode
 */
async function runDecoding(url) {
  const secretMessage = await decodeSecretMessage(url);
  // Output the secret message as required by the task.
  console.log(secretMessage);
  if (secretMessage.startsWith('ERROR')) {
    process.exit(1);
  }
}

// ----------------------------------------------------------------------
// --- EXECUTION BLOCK: Getting argument and PASSING IT TO FUNCTION ---
// ----------------------------------------------------------------------

export { runDecoding };

//One way to run it: mport it and use in custom code: import {runDecoding} from <path to the file>; runDecoding(DOCUMENT_URL)
//Other way: Save code in a file, uncomment 2 lines below, then: node <path tovhte file> <URL of the google doc>
//const DOCUMENT_URL = process.argv[2];
//runDecoding(DOCUMENT_URL);
