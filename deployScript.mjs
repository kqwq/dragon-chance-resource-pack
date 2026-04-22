import http from "http";
import fs from "fs";
import path from "path";
import archiver from "archiver";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 32567;
const ZIP_NAME = "resourcepack.zip";
const ZIP_PATH = path.join(__dirname, ZIP_NAME);

// Create zip
function zipDirectory() {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(ZIP_PATH);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", () => {
      console.log(`Zipped: ${archive.pointer()} bytes`);
      resolve();
    });

    archive.on("error", (err) => reject(err));

    archive.pipe(output);

    // Zip only pack.mcmeta and assets/
    archive.file(path.join(__dirname, "pack.mcmeta"), { name: "pack.mcmeta" });
    archive.directory(path.join(__dirname, "assets"), "assets");

    archive.finalize();
  });
}

// Create HTTP server
function startServer() {
  const server = http.createServer((req, res) => {
    if (req.url === `/${ZIP_NAME}`) {
      fs.readFile(ZIP_PATH, (err, data) => {
        if (err) {
          res.writeHead(500);
          return res.end("Error reading zip");
        }

        res.writeHead(200, {
          "Content-Type": "application/zip",
          "Content-Length": data.length,
        });
        res.end(data);
      });
    } else {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end(
        `Resource pack server running.\nDownload: http://localhost:${PORT}/${ZIP_NAME}`,
      );
    }
  });

  server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/${ZIP_NAME}`);
  });
}

// Run everything
(async () => {
  try {
    console.log("Zipping resource pack...");
    await zipDirectory();
    console.log("Starting server...");
    startServer();
  } catch (err) {
    console.error("Error:", err);
  }
})();
