// Production entry point loader for Cloud Run deployment
import fs from "fs";
import path from "path";

const cjsDist = path.join(process.cwd(), "dist", "server.cjs");

if (fs.existsSync(cjsDist)) {
  // If bundled CJS exists from build step, load it
  import("./dist/server.cjs");
} else {
  // Fallback to direct TypeScript execution natively supported by Node 22
  import("./server.ts");
}
