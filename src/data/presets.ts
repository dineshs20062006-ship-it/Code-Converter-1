import { LanguageOption, FrameworkOption, PresetProject } from "../types";

export const TARGET_FRONTEND_OPTIONS: FrameworkOption[] = [
  { id: "react_tailwind", name: "React 18 + Tailwind CSS (Vite)", category: "frontend", description: "Modern React SPA with Tailwind utility classes & Lucide icons", defaultLang: "typescript" },
  { id: "jsp", name: "JSP (JavaServer Pages)", category: "frontend", description: "JavaServer Pages with embedded Java scriptlets, expressions, and JSTL tags", defaultLang: "html" },
  { id: "html_css_js", name: "HTML5 + Modern Vanilla JS + CSS", category: "frontend", description: "Clean standalone web bundle with responsive styles & DOM scripts", defaultLang: "html" },
  { id: "vue_tailwind", name: "Vue 3 (Composition API) + Tailwind", category: "frontend", description: "Vue Single File Components with reactive state & Tailwind", defaultLang: "typescript" },
  { id: "nextjs", name: "Next.js 14+ (App Router)", category: "frontend", description: "Modern React fullstack framework with server & client components", defaultLang: "typescript" },
  { id: "svelte", name: "Svelte 4 / SvelteKit", category: "frontend", description: "Compiler-based reactive frontend with scoped styling", defaultLang: "javascript" },
  { id: "none_cli", name: "None (CLI / Pure Console / Backend)", category: "frontend", description: "No browser UI - output terminal/CLI scripts", defaultLang: "python" },
];

export const TARGET_BACKEND_OPTIONS: FrameworkOption[] = [
  { id: "fastapi", name: "Python (FastAPI + Pydantic)", category: "backend", description: "Async REST API with automatic docs and type validation", defaultLang: "python" },
  { id: "flask", name: "Python (Flask)", category: "backend", description: "Lightweight WSGI web microframework", defaultLang: "python" },
  { id: "express", name: "Node.js (Express.js)", category: "backend", description: "Fast, unopinionated minimalist web server for Node.js", defaultLang: "javascript" },
  { id: "springboot", name: "Java (Spring Boot 3 + Maven)", category: "backend", description: "Enterprise Java backend with REST controllers and Spring Data", defaultLang: "java" },
  { id: "gin", name: "Go (Gin Gonic)", category: "backend", description: "High-performance HTTP web framework written in Go", defaultLang: "go" },
  { id: "actix", name: "Rust (Actix-web)", category: "backend", description: "Blazing fast, type-safe async actor framework for Rust", defaultLang: "rust" },
  { id: "none_static", name: "None (Pure Client-Side / Static Web)", category: "backend", description: "No server-side API needed - browser-contained logic", defaultLang: "javascript" },
];

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { id: "python", name: "Python", monacoLang: "python", ext: ".py" },
  { id: "javascript", name: "JavaScript (Web)", monacoLang: "javascript", ext: ".js" },
  { id: "typescript", name: "TypeScript (Web)", monacoLang: "typescript", ext: ".ts" },
  { id: "html", name: "HTML5 / Web App", monacoLang: "html", ext: ".html" },
  { id: "java", name: "Java", monacoLang: "java", ext: ".java" },
  { id: "go", name: "Go", monacoLang: "go", ext: ".go" },
  { id: "rust", name: "Rust", monacoLang: "rust", ext: ".rs" },
  { id: "cpp", name: "C++", monacoLang: "cpp", ext: ".cpp" },
  { id: "csharp", name: "C# (.NET)", monacoLang: "csharp", ext: ".cs" },
  { id: "ruby", name: "Ruby", monacoLang: "ruby", ext: ".rb" },
  { id: "php", name: "PHP", monacoLang: "php", ext: ".php" },
  { id: "kotlin", name: "Kotlin", monacoLang: "kotlin", ext: ".kt" },
  { id: "swift", name: "Swift", monacoLang: "swift", ext: ".swift" },
  { id: "bash", name: "Bash / Shell", monacoLang: "shell", ext: ".sh" },
  { id: "sql", name: "SQL", monacoLang: "sql", ext: ".sql" },
];

export const PRESET_PROJECTS: PresetProject[] = [
  {
    name: "Particle Physics & Canvas Simulation",
    sourceLang: "python",
    defaultTargetFrontend: "React 18 + Tailwind CSS (Vite)",
    defaultTargetBackend: "None (Pure Client-Side / Static Web)",
    description: "Multi-directory simulation engine with nested physics, particle collision, and config modules.",
    files: [
      {
        path: "src/main.py",
        content: `from physics.simulation import ParticleSimulation
from config.settings import SIM_CONFIG

def main():
    print("=== Starting Particle Physics Engine ===")
    sim = ParticleSimulation(
        count=SIM_CONFIG["particle_count"],
        speed=SIM_CONFIG["max_speed"]
    )
    for step in range(5):
        stats = sim.update(0.16)
        print(f"[Step {step + 1}] Active: {stats['count']} | Kinetic Energy: {stats['energy']:.2f}")
    print("Simulation initial state ready for canvas rendering.")

if __name__ == "__main__":
    main()
`,
      },
      {
        path: "src/physics/simulation.py",
        content: `import random
import math

class ParticleSimulation:
    def __init__(self, count=50, speed=2.0):
        self.particles = []
        self.count = count
        for i in range(count):
            self.particles.append({
                "id": i,
                "x": random.uniform(50, 450),
                "y": random.uniform(50, 250),
                "vx": random.uniform(-speed, speed),
                "vy": random.uniform(-speed, speed),
                "radius": random.uniform(3, 8),
                "hue": random.randint(180, 280)
            })

    def update(self, dt):
        total_energy = 0
        for p in self.particles:
            p["x"] += p["vx"] * dt * 10
            p["y"] += p["vy"] * dt * 10
            # Boundary reflection
            if p["x"] < 10 or p["x"] > 590:
                p["vx"] *= -1
            if p["y"] < 10 or p["y"] > 390:
                p["vy"] *= -1
            speed_sq = p["vx"]**2 + p["vy"]**2
            total_energy += 0.5 * p["radius"] * speed_sq
        return {"count": self.count, "energy": total_energy}
`,
      },
      {
        path: "src/config/settings.py",
        content: `SIM_CONFIG = {
    "particle_count": 45,
    "max_speed": 2.5,
    "canvas_width": 600,
    "canvas_height": 400,
    "theme": "dark_galaxy"
}
`,
      },
      {
        path: "requirements.txt",
        content: `numpy>=1.24.0
pygame>=2.5.0
`,
      },
    ],
  },
  {
    name: "Task & Expense REST Service",
    sourceLang: "python",
    defaultTargetFrontend: "React 18 + Tailwind CSS (Vite)",
    defaultTargetBackend: "Node.js (Express.js)",
    description: "FastAPI REST backend with Pydantic models, JSON storage, and CRUD routes.",
    files: [
      {
        path: "app/main.py",
        content: `from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI(title="Task & Expense API")

class Task(BaseModel):
    id: int
    title: str
    amount: float
    category: str
    completed: bool = False

db: List[Task] = [
    Task(id=1, title="Cloud Hosting Invoice", amount=45.0, category="Infrastructure", completed=True),
    Task(id=2, title="API Subscription", amount=20.0, category="SaaS", completed=False),
]

@app.get("/api/tasks", response_model=List[Task])
def get_tasks():
    return db

@app.post("/api/tasks", response_model=Task)
def create_task(task: Task):
    db.append(task)
    return task

@app.delete("/api/tasks/{task_id}")
def delete_task(task_id: int):
    global db
    db = [t for t in db if t.id != task_id]
    return {"status": "deleted"}
`,
      },
      {
        path: "requirements.txt",
        content: `fastapi>=0.110.0
uvicorn>=0.28.0
pydantic>=2.6.0
`,
      },
    ],
  },
  {
    name: "Token Bucket Rate Limiter Service",
    sourceLang: "javascript",
    defaultTargetFrontend: "HTML5 + Modern Vanilla JS + CSS",
    defaultTargetBackend: "Python (FastAPI + Pydantic)",
    description: "Node.js rate limiter module with token bucket algorithm and Express verification routes.",
    files: [
      {
        path: "server/index.js",
        content: `const express = require('express');
const { TokenBucket } = require('./lib/limiter');

const app = express();
const limiter = new TokenBucket(10, 2); // 10 tokens max, refills 2 tokens/sec

app.get('/api/resource', (req, res) => {
  const allowed = limiter.tryAcquire(1);
  if (allowed) {
    res.json({ status: 200, message: "Request processed successfully", remaining: limiter.tokens });
  } else {
    res.status(429).json({ status: 429, error: "Too Many Requests - Rate limit exceeded" });
  }
});

console.log("=== Rate Limiter Verification ===");
for (let i = 1; i <= 6; i++) {
  const allowed = limiter.tryAcquire(1);
  console.log(\`Test Request #\${i}: \${allowed ? "ALLOWED [200]" : "RATE LIMITED [429]"}\`);
}
`,
      },
      {
        path: "server/lib/limiter.js",
        content: `class TokenBucket {
  constructor(capacity, refillRatePerSec) {
    this.capacity = capacity;
    this.tokens = capacity;
    this.refillRate = refillRatePerSec;
    this.lastRefill = Date.now();
  }

  refill() {
    const now = Date.now();
    const elapsedSeconds = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(this.capacity, this.tokens + elapsedSeconds * this.refillRate);
    this.lastRefill = now;
  }

  tryAcquire(cost = 1) {
    this.refill();
    if (this.tokens >= cost) {
      this.tokens -= cost;
      return true;
    }
    return false;
  }
}

module.exports = { TokenBucket };
`,
      },
      {
        path: "package.json",
        content: `{
  "name": "rate-limiter-service",
  "version": "1.0.0",
  "main": "server/index.js",
  "dependencies": {
    "express": "^4.18.2"
  }
}
`,
      },
    ],
  },
  {
    name: "Java Spring Boot & React Fullstack",
    sourceLang: "java",
    defaultTargetFrontend: "React 18 + Tailwind CSS (Vite)",
    defaultTargetBackend: "Python (FastAPI + Pydantic)",
    description: "Enterprise Java Spring Boot REST backend with controllers, models, and React SPA client.",
    files: [
      {
        path: "backend/src/main/java/com/example/demo/Application.java",
        content: `package com.example.demo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
        System.out.println("Spring Boot Server running on port 8080");
    }
}
`,
      },
      {
        path: "backend/src/main/java/com/example/demo/controller/TaskController.java",
        content: `package com.example.demo.controller;

import com.example.demo.model.Task;
import com.example.demo.service.TaskService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/tasks")
@CrossOrigin(origins = "*")
public class TaskController {
    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @GetMapping
    public ResponseEntity<List<Task>> getAllTasks() {
        return ResponseEntity.ok(taskService.findAll());
    }

    @PostMapping
    public ResponseEntity<Task> createTask(@RequestBody Task task) {
        Task created = taskService.save(task);
        return ResponseEntity.ok(created);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTask(@PathVariable Long id) {
        taskService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
`,
      },
      {
        path: "backend/src/main/java/com/example/demo/model/Task.java",
        content: `package com.example.demo.model;

public class Task {
    private Long id;
    private String title;
    private String category;
    private boolean completed;

    public Task() {}

    public Task(Long id, String title, String category, boolean completed) {
        this.id = id;
        this.title = title;
        this.category = category;
        this.completed = completed;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public boolean isCompleted() { return completed; }
    public void setCompleted(boolean completed) { this.completed = completed; }
}
`,
      },
      {
        path: "backend/src/main/java/com/example/demo/service/TaskService.java",
        content: `package com.example.demo.service;

import com.example.demo.model.Task;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class TaskService {
    private final List<Task> tasks = new ArrayList<>();
    private final AtomicLong counter = new AtomicLong(1);

    public TaskService() {
        tasks.add(new Task(counter.getAndIncrement(), "Deploy Cloud Migration", "DevOps", true));
        tasks.add(new Task(counter.getAndIncrement(), "Refactor Backend Controllers", "Architecture", false));
    }

    public List<Task> findAll() {
        return new ArrayList<>(tasks);
    }

    public Task save(Task task) {
        if (task.getId() == null) {
            task.setId(counter.getAndIncrement());
        }
        tasks.add(task);
        return task;
    }

    public void deleteById(Long id) {
        tasks.removeIf(t -> t.getId().equals(id));
    }
}
`,
      },
      {
        path: "backend/pom.xml",
        content: `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <groupId>com.example</groupId>
    <artifactId>demo</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>demo</name>
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
            <version>3.2.0</version>
        </dependency>
    </dependencies>
</project>
`,
      },
      {
        path: "frontend/src/App.tsx",
        content: `import React, { useState, useEffect } from "react";

interface Task {
  id: number;
  title: string;
  category: string;
  completed: boolean;
}

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [category, setCategory] = useState("Engineering");

  useEffect(() => {
    fetch("/api/tasks")
      .then(res => res.json())
      .then(data => setTasks(data))
      .catch(err => console.error("Error fetching tasks:", err));
  }, []);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newTask = {
      title: newTitle,
      category,
      completed: false,
    };

    fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newTask),
    })
      .then(res => res.json())
      .then(saved => {
        setTasks(prev => [...prev, saved]);
        setNewTitle("");
      });
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <header className="border-b border-slate-800 pb-4">
          <h1 className="text-2xl font-bold text-cyan-400">Task Management Portal</h1>
          <p className="text-sm text-slate-400">Full-Stack React + Spring Boot connected client</p>
        </header>

        <form onSubmit={handleAddTask} className="flex gap-2">
          <input
            type="text"
            placeholder="Add new task..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded text-white"
          />
          <button type="submit" className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 rounded font-medium">
            Add
          </button>
        </form>

        <ul className="space-y-2">
          {tasks.map((t) => (
            <li key={t.id} className="p-4 bg-slate-800/80 rounded border border-slate-700/60 flex justify-between items-center">
              <div>
                <span className="font-semibold text-white">{t.title}</span>
                <span className="ml-3 text-xs px-2 py-0.5 rounded bg-slate-700 text-cyan-300">{t.category}</span>
              </div>
              <span className={t.completed ? "text-emerald-400 text-xs" : "text-amber-400 text-xs"}>
                {t.completed ? "Done" : "Pending"}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
`,
      },
      {
        path: "frontend/package.json",
        content: `{
  "name": "fullstack-client",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  }
}
`,
      },
    ],
  },
];
