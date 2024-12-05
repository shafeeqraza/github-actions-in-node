import { exec } from "child_process";
import fs from "fs";
import { expect } from "chai";

const inputFile = "large-input.txt";
const outputFile = "processed-output.txt";

describe("Worker-Based File Processing Script", function () {
  this.timeout(10000); // Increase timeout for async processing

  beforeEach(() => {
    // Create a test input file
    fs.writeFileSync(inputFile, "hello world this is a test file");
  });

  afterEach(() => {
    // Clean up files
    if (fs.existsSync(inputFile)) fs.unlinkSync(inputFile);
    if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);
  });

  it("should process the input file and create the correct output file", (done) => {
    exec(`node app.js`, (error, stdout, stderr) => {
      if (error) return done(error);
      expect(stderr).to.be.empty;

      // Check if output file exists
      const outputExists = fs.existsSync(outputFile);
      expect(outputExists).to.be.true;

      // Verify content
      const outputContent = fs.readFileSync(outputFile, "utf8");
      const expectedContent = "HELLO WORLD THIS IS A TEST FILE";
      expect(outputContent).to.equal(expectedContent);

      done();
    });
  });

  it("should fail gracefully if the input file does not exist", (done) => {
    // Ensure input file is deleted
    if (fs.existsSync(inputFile)) fs.unlinkSync(inputFile);

    exec(`node app.js`, (error, stdout, stderr) => {
      expect(stderr).to.contain("Error: Input file not found");
      done();
    });
  });

  it("should produce an empty output file for an empty input file", (done) => {
    // Create an empty input file
    fs.writeFileSync(inputFile, "");

    exec(`node app.js`, (error, stdout, stderr) => {
      if (error) return done(error);
      expect(stderr).to.be.empty;

      // Check if output file is empty
      const outputContent = fs.readFileSync(outputFile, "utf8");
      expect(outputContent).to.equal("");

      done();
    });
  });
});
