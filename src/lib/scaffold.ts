import { ProjectFile } from "../types";

export interface ScaffoldRule {
  path: string;
  description: string;
  generate: (existingFiles: ProjectFile[], targetFrontend?: string, targetBackend?: string) => string;
}

export const TARGET_SCAFFOLD_MAP: Record<string, {
  requiredFiles: ScaffoldRule[];
  filesToRemove?: string[];
}> = {
  typescript: {
    requiredFiles: [
      {
        path: "tsconfig.json",
        description: "TypeScript compiler configuration with strict mode and JSX support",
        generate: (existingFiles, targetFrontend) => {
          const isReact = (targetFrontend || "").toLowerCase().includes("react");
          return JSON.stringify(
            {
              compilerOptions: {
                target: "ES2022",
                module: "NodeNext",
                moduleResolution: "NodeNext",
                lib: ["DOM", "DOM.Iterable", "ES2022"],
                jsx: isReact ? "react-jsx" : "preserve",
                strict: true,
                esModuleInterop: true,
                skipLibCheck: true,
                forceConsistentCasingInFileNames: true,
                isolatedModules: true,
                resolveJsonModule: true,
              },
              include: ["src/**/*", "**/*.ts", "**/*.tsx"],
              exclude: ["node_modules", "dist", "build"],
            },
            null,
            2
          );
        },
      },
    ],
  },
  javascript: {
    requiredFiles: [],
    filesToRemove: ["tsconfig.json", "tsconfig.node.json", "tsconfig.app.json"],
  },
  node: {
    requiredFiles: [
      {
        path: "package.json",
        description: "Node.js dependencies and run scripts",
        generate: (existingFiles, targetFrontend, targetBackend) => {
          const isTs = existingFiles.some((f) => f.path.endsWith(".ts") || f.path.endsWith(".tsx"));
          return JSON.stringify(
            {
              name: "converted-app",
              version: "1.0.0",
              private: true,
              type: "module",
              scripts: {
                start: isTs ? "tsx server.ts" : "node server.js",
                dev: isTs ? "tsx watch server.ts" : "node --watch server.js",
                build: isTs ? "tsc" : "echo 'No build step required'",
              },
              dependencies: {
                express: "^4.21.2",
                dotenv: "^16.4.7",
                cors: "^2.8.5",
              },
              devDependencies: isTs
                ? {
                    "@types/express": "^4.17.21",
                    "@types/node": "^22.10.0",
                    "@types/cors": "^2.8.17",
                    typescript: "^5.4.0",
                    tsx: "^4.19.2",
                  }
                : {},
            },
            null,
            2
          );
        },
      },
    ],
  },
  python: {
    requiredFiles: [
      {
        path: "requirements.txt",
        description: "Python project package dependencies",
        generate: (existingFiles, targetFrontend, targetBackend) => {
          const tb = (targetBackend || "").toLowerCase();
          if (tb.includes("flask")) {
            return [
              "Flask>=3.0.0",
              "python-dotenv>=1.0.1",
              "requests>=2.31.0",
              "gunicorn>=21.2.0",
            ].join("\n");
          } else if (tb.includes("django")) {
            return [
              "Django>=5.0.0",
              "python-dotenv>=1.0.1",
              "gunicorn>=21.2.0",
            ].join("\n");
          }
          // Default FastAPI
          return [
            "fastapi>=0.110.0",
            "uvicorn[standard]>=0.28.0",
            "python-dotenv>=1.0.1",
            "pydantic>=2.6.0",
            "requests>=2.31.0",
          ].join("\n");
        },
      },
    ],
  },
  go: {
    requiredFiles: [
      {
        path: "go.mod",
        description: "Go module definition",
        generate: () => {
          return `module converted_project

go 1.21

require (
\tgithub.com/gin-gonic/gin v1.9.1
)
`;
        },
      },
    ],
  },
  java: {
    requiredFiles: [
      {
        path: "pom.xml",
        description: "Maven project build and dependency definition",
        generate: (existingFiles) => {
          return `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <groupId>com.example</groupId>
    <artifactId>converted-project</artifactId>
    <version>1.0.0</version>
    <properties>
        <maven.compiler.source>17</maven.compiler.source>
        <maven.compiler.target>17</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    </properties>
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
            <version>3.2.3</version>
        </dependency>
    </dependencies>
</project>
`;
        },
      },
    ],
  },
  rust: {
    requiredFiles: [
      {
        path: "Cargo.toml",
        description: "Cargo package manifest and dependencies",
        generate: () => {
          return `[package]
name = "converted_project"
version = "0.1.0"
edition = "2021"

[dependencies]
tokio = { version = "1.36", features = ["full"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
`;
        },
      },
    ],
  },
};

const KNOWN_SCAFFOLD_NAMES = new Set([
  "tsconfig.json",
  "tsconfig.app.json",
  "tsconfig.node.json",
  "package.json",
  "requirements.txt",
  "pyproject.toml",
  "go.mod",
  "go.sum",
  "pom.xml",
  "build.gradle",
  "build.gradle.kts",
  "cargo.toml",
  "cargo.lock",
  "gemfile",
  "gemfile.lock",
  "composer.json",
]);

export function isScaffoldFile(path: string): boolean {
  const filename = path.split(/[\/\\]/).pop()?.toLowerCase() || "";
  return KNOWN_SCAFFOLD_NAMES.has(filename);
}

/**
 * Ensures the translated output includes all necessary buildable scaffolding
 * according to the target language, frontend, and backend specifications.
 */
export function reconcileTargetScaffold(
  files: ProjectFile[],
  targetLang: string,
  targetFrontend?: string,
  targetBackend?: string
): {
  files: ProjectFile[];
  generatedScaffolds: string[];
} {
  let result = [...files];
  const generatedScaffolds: string[] = [];

  const langKey = targetLang.toLowerCase().trim();
  const tf = (targetFrontend || "").toLowerCase();
  const tb = (targetBackend || "").toLowerCase();

  const isTypeScriptTarget =
    langKey === "typescript" ||
    langKey === "ts" ||
    tf.includes("react") ||
    tf.includes("vite") ||
    tf.includes("next") ||
    tf.includes("svelte");

  const isJavaScriptTarget =
    (langKey === "javascript" || langKey === "js") &&
    !isTypeScriptTarget;

  // 1. Handle JavaScript Target: Explicitly remove/skip tsconfig.json
  if (isJavaScriptTarget) {
    const prevCount = result.length;
    result = result.filter(
      (f) => !TARGET_SCAFFOLD_MAP.javascript.filesToRemove?.includes(f.path.toLowerCase())
    );
    if (result.length < prevCount) {
      console.log("[Scaffold] Removed tsconfig.json for pure JavaScript target");
    }
  }

  // 2. Handle TypeScript Target: Ensure tsconfig.json and devDependencies
  if (isTypeScriptTarget) {
    const hasTsConfig = result.some(
      (f) => f.path.toLowerCase() === "tsconfig.json" || f.path.toLowerCase().endsWith("/tsconfig.json")
    );

    if (!hasTsConfig) {
      const tsRule = TARGET_SCAFFOLD_MAP.typescript.requiredFiles[0];
      const content = tsRule.generate(result, targetFrontend, targetBackend);
      result.unshift({
        path: "tsconfig.json",
        content,
        isScaffold: true,
      });
      generatedScaffolds.push("tsconfig.json");
    }

    // Check package.json for @types and typescript
    const pkgIdx = result.findIndex(
      (f) => f.path.toLowerCase() === "package.json" || f.path.toLowerCase().endsWith("/package.json")
    );

    if (pkgIdx !== -1) {
      try {
        const pkg = JSON.parse(result[pkgIdx].content);
        pkg.devDependencies = pkg.devDependencies || {};
        let modified = false;

        if (!pkg.devDependencies["typescript"]) {
          pkg.devDependencies["typescript"] = "^5.4.0";
          modified = true;
        }
        if (!pkg.devDependencies["@types/node"]) {
          pkg.devDependencies["@types/node"] = "^22.10.0";
          modified = true;
        }
        if (tf.includes("react") && !pkg.devDependencies["@types/react"]) {
          pkg.devDependencies["@types/react"] = "^18.2.0";
          pkg.devDependencies["@types/react-dom"] = "^18.2.0";
          modified = true;
        }

        if (modified) {
          result[pkgIdx] = {
            ...result[pkgIdx],
            content: JSON.stringify(pkg, null, 2),
            isScaffold: true,
          };
          if (!generatedScaffolds.includes(result[pkgIdx].path)) {
            generatedScaffolds.push(result[pkgIdx].path);
          }
        }
      } catch {}
    } else if (tf.includes("react") || tf.includes("vite") || tb.includes("node") || tb.includes("express")) {
      // Create missing package.json
      const nodeRule = TARGET_SCAFFOLD_MAP.node.requiredFiles[0];
      const content = nodeRule.generate(result, targetFrontend, targetBackend);
      result.unshift({
        path: "package.json",
        content,
        isScaffold: true,
      });
      generatedScaffolds.push("package.json");
    }
  }

  // 3. Handle Python Target (Language or Backend)
  if (langKey === "python" || tb.includes("python") || tb.includes("fastapi") || tb.includes("flask") || tb.includes("django")) {
    const hasPythonConfig = result.some((f) => {
      const lower = f.path.toLowerCase();
      return lower.endsWith("requirements.txt") || lower.endsWith("pyproject.toml") || lower.endsWith("pipfile");
    });

    if (!hasPythonConfig) {
      const pyRule = TARGET_SCAFFOLD_MAP.python.requiredFiles[0];
      const content = pyRule.generate(result, targetFrontend, targetBackend);
      result.push({
        path: "requirements.txt",
        content,
        isScaffold: true,
      });
      generatedScaffolds.push("requirements.txt");
    }
  }

  // 4. Handle Go Target (Language or Backend)
  if (langKey === "go" || tb.includes("go") || tb.includes("gin")) {
    const hasGoMod = result.some((f) => f.path.toLowerCase().endsWith("go.mod"));
    if (!hasGoMod) {
      const goRule = TARGET_SCAFFOLD_MAP.go.requiredFiles[0];
      const content = goRule.generate(result, targetFrontend, targetBackend);
      result.unshift({
        path: "go.mod",
        content,
        isScaffold: true,
      });
      generatedScaffolds.push("go.mod");
    }
  }

  // 5. Handle Java Target (Language or Backend)
  if (langKey === "java" || tb.includes("java") || tb.includes("spring")) {
    const hasJavaBuild = result.some((f) => {
      const lower = f.path.toLowerCase();
      return lower.endsWith("pom.xml") || lower.endsWith("build.gradle") || lower.endsWith("build.gradle.kts");
    });
    if (!hasJavaBuild) {
      const javaRule = TARGET_SCAFFOLD_MAP.java.requiredFiles[0];
      const content = javaRule.generate(result, targetFrontend, targetBackend);
      result.unshift({
        path: "pom.xml",
        content,
        isScaffold: true,
      });
      generatedScaffolds.push("pom.xml");
    }
  }

  // 6. Handle Rust Target
  if (langKey === "rust" || tb.includes("rust") || tb.includes("actix")) {
    const hasCargo = result.some((f) => f.path.toLowerCase().endsWith("cargo.toml"));
    if (!hasCargo) {
      const rustRule = TARGET_SCAFFOLD_MAP.rust.requiredFiles[0];
      const content = rustRule.generate(result, targetFrontend, targetBackend);
      result.unshift({
        path: "Cargo.toml",
        content,
        isScaffold: true,
      });
      generatedScaffolds.push("Cargo.toml");
    }
  }

  // Mark all matching scaffold files with isScaffold property
  result = result.map((f) => {
    if (isScaffoldFile(f.path) || generatedScaffolds.includes(f.path)) {
      return { ...f, isScaffold: true };
    }
    return f;
  });

  return { files: result, generatedScaffolds };
}
