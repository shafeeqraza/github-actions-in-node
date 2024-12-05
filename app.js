import { Worker, isMainThread, parentPort, workerData } from "worker_threads";
import { promises as fsPromises } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

// ESM replacements for __filename and __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// File paths
const inputFile = resolve(__dirname, "large-input.txt");
const outputFile = resolve(__dirname, "processed-output.txt");

// Function to process data chunks (used in workers)
function processChunk(chunk) {
  return chunk.toUpperCase(); // Example transformation
}

// Worker logic
if (!isMainThread) {
  const processedChunk = processChunk(workerData.chunk);
  parentPort.postMessage(processedChunk); // Send processed chunk back to main thread
} else {
  /**
   * Reads a file, processes it in chunks using workers, and writes the result to an output file.
   *
   * @param {string} inputPath - Path to the input file.
   * @param {string} outputPath - Path to the output file.
   */
  async function processFileWithWorkers(inputPath, outputPath) {
    try {
      // Check if the input file exists
      await fsPromises.access(inputPath);

      const inputContent = await fsPromises.readFile(inputPath, "utf8");
      const chunks = inputContent.match(/.{1,1024}/g) || []; // Split file into chunks of 1024 chars

      const results = await Promise.all(
        chunks.map((chunk) => {
          return new Promise((resolve, reject) => {
            const worker = new Worker(__filename, { workerData: { chunk } });
            worker.on("message", resolve); // Receive processed chunk
            worker.on("error", reject); // Handle worker errors
            worker.on("exit", (code) => {
              if (code !== 0)
                reject(new Error(`Worker stopped with exit code ${code}`));
            });
          });
        })
      );

      // Combine processed chunks and write to the output file
      const outputContent = results.join("");
      await fsPromises.writeFile(outputPath, outputContent, "utf8");
      console.log(
        `File processed successfully! Output saved to: ${outputPath}`
      );
    } catch (err) {
      if (err.code === "ENOENT") {
        console.error(`Error: Input file not found at ${inputPath}`);
      } else {
        console.error(`Unexpected error: ${err.message}`);
      }
    }
  }

  // Execute the script
  processFileWithWorkers(inputFile, outputFile);
}
