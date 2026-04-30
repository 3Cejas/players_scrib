const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const http = require("http");
const crypto = require("crypto");
const { spawn } = require("child_process");

const puppeteer = require("puppeteer");
const io = require("socket.io-client");

const { compareOrUpdateVisualSnapshot } = require("./visual");
const { smokeSpecs, onePlayerSpecs, coreSpecs, visualSpecs, chaosSpecs } = require("../specs");

const ROOT_DIR = path.resolve(__dirname, "..", "..");
const SERVER_DIR_OVERRIDE = process.env.SCRIB_SERVER_DIR
  ? path.resolve(process.env.SCRIB_SERVER_DIR)
  : "";
const SERVER_REMOTE_URL_OVERRIDE = String(process.env.SCRIB_SERVER_REMOTE_URL || "").trim();
const SERVER_REMOTE_BRANCH = String(process.env.SCRIB_SERVER_REMOTE_BRANCH || "master").trim() || "master";
const LOCAL_SERVER_DIR = SERVER_DIR_OVERRIDE || path.resolve(ROOT_DIR, "..", "server_scrib");
const CACHE_DIR = path.join(ROOT_DIR, ".e2e-cache");
const REMOTE_SERVER_DIR = path.join(CACHE_DIR, "server_scrib-master");
const ARTIFACTS_ROOT = path.join(ROOT_DIR, ".e2e-artifacts");
const VISUAL_BASELINES_DIR = path.join(ROOT_DIR, "e2e", "visual-baselines");
const STATIC_PORT = 4173;
const SOCKET_PORT = 3000;
const DEFAULT_TIMEOUT_MS = 10000;
const PUPPETEER_CI_ARGS = [
  "--no-sandbox",
  "--disable-setuid-sandbox",
  "--disable-dev-shm-usage"
];
const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2"
};

function parseArgs(argv) {
  const args = {
    headed: false,
    suite: "full",
    serverSource: "remote",
    updateVisualBaselines: process.env.SCRIB_UPDATE_VISUAL_BASELINES === "1"
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--headed") {
      args.headed = true;
    } else if (arg === "--suite") {
      args.suite = argv[index + 1] || "full";
      index += 1;
    } else if (arg.startsWith("--suite=")) {
      args.suite = arg.split("=")[1] || "full";
    } else if (arg === "--server-source") {
      args.serverSource = argv[index + 1] || "remote";
      index += 1;
    } else if (arg.startsWith("--server-source=")) {
      args.serverSource = arg.split("=")[1] || "remote";
    } else if (arg === "--update-visual-baselines") {
      args.updateVisualBaselines = true;
    }
  }
  return args;
}

function sanitizeName(value) {
  return String(value || "unnamed").replace(/[^a-z0-9_-]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase();
}

async function ensureDir(dirPath) {
  await fsp.mkdir(dirPath, { recursive: true });
}

async function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const executable = process.platform === "win32" && command === "npm" ? "npm.cmd" : command;
    const spawnCommand = process.platform === "win32" && /\.cmd$/i.test(executable)
      ? "cmd.exe"
      : executable;
    const spawnArgs = process.platform === "win32" && /\.cmd$/i.test(executable)
      ? ["/d", "/s", "/c", executable, ...args]
      : args;
    const child = spawn(spawnCommand, spawnArgs, {
      cwd: options.cwd,
      env: options.env || process.env,
      shell: false,
      windowsHide: true
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`${command} ${args.join(" ")} failed with exit code ${code}\n${stderr || stdout}`));
        return;
      }
      resolve({ stdout, stderr });
    });
  });
}

function hashFile(filePath) {
  const hash = crypto.createHash("sha256");
  hash.update(fs.readFileSync(filePath));
  return hash.digest("hex");
}

async function ensureRemoteServerCheckout() {
  await ensureDir(CACHE_DIR);

  let remoteUrl = SERVER_REMOTE_URL_OVERRIDE;
  if (!remoteUrl) {
    if (!fs.existsSync(LOCAL_SERVER_DIR)) {
      throw new Error(
        `Missing local server_scrib checkout at ${LOCAL_SERVER_DIR}. ` +
        "Set SCRIB_SERVER_DIR or SCRIB_SERVER_REMOTE_URL for CI/non-sibling layouts."
      );
    }
    const { stdout: remoteUrlOut } = await runCommand("git", ["remote", "get-url", "origin"], {
      cwd: LOCAL_SERVER_DIR
    });
    remoteUrl = remoteUrlOut.trim();
  }
  if (!remoteUrl) {
    throw new Error("Could not resolve origin URL for server_scrib");
  }

  if (!fs.existsSync(path.join(REMOTE_SERVER_DIR, ".git"))) {
    await runCommand("git", ["clone", "--branch", SERVER_REMOTE_BRANCH, remoteUrl, REMOTE_SERVER_DIR], {
      cwd: CACHE_DIR
    });
  }

  await runCommand("git", ["fetch", "origin", SERVER_REMOTE_BRANCH], { cwd: REMOTE_SERVER_DIR });
  await runCommand("git", ["reset", "--hard", `origin/${SERVER_REMOTE_BRANCH}`], { cwd: REMOTE_SERVER_DIR });
  await runCommand("git", ["clean", "-fd"], { cwd: REMOTE_SERVER_DIR });

  const packageLockPath = path.join(REMOTE_SERVER_DIR, "package-lock.json");
  const installHashPath = path.join(REMOTE_SERVER_DIR, ".e2e-install-hash");
  const currentHash = hashFile(packageLockPath);
  const previousHash = fs.existsSync(installHashPath)
    ? fs.readFileSync(installHashPath, "utf8").trim()
    : "";
  const needsInstall = !fs.existsSync(path.join(REMOTE_SERVER_DIR, "node_modules")) || currentHash !== previousHash;
  if (needsInstall) {
    await runCommand("npm", ["ci"], { cwd: REMOTE_SERVER_DIR });
    fs.writeFileSync(installHashPath, `${currentHash}\n`, "utf8");
  }

  return REMOTE_SERVER_DIR;
}

function createStaticServer(rootDir, port) {
  const server = http.createServer(async (req, res) => {
    try {
      const requestUrl = new URL(req.url || "/", `http://127.0.0.1:${port}`);
      let filePath = path.normalize(path.join(rootDir, decodeURIComponent(requestUrl.pathname)));
      if (!filePath.startsWith(rootDir)) {
        res.writeHead(403);
        res.end("Forbidden");
        return;
      }

      let stats = null;
      try {
        stats = await fsp.stat(filePath);
      } catch (_error) {
        stats = null;
      }

      if (stats && stats.isDirectory()) {
        filePath = path.join(filePath, "index.html");
      }
      if (!fs.existsSync(filePath)) {
        res.writeHead(404);
        res.end("Not found");
        return;
      }

      const type = MIME_TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream";
      res.writeHead(200, {
        "Content-Type": type,
        "Cache-Control": "no-store"
      });
      fs.createReadStream(filePath).pipe(res);
    } catch (error) {
      res.writeHead(500);
      res.end(String(error && error.message ? error.message : error));
    }
  });

  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => resolve(server));
  });
}

async function waitForPort(port, host = "127.0.0.1", timeoutMs = 15000) {
  const start = Date.now();
  while ((Date.now() - start) < timeoutMs) {
    const ok = await new Promise((resolve) => {
      const socket = require("net").createConnection({ port, host });
      socket.once("connect", () => {
        socket.destroy();
        resolve(true);
      });
      socket.once("error", () => {
        resolve(false);
      });
    });
    if (ok) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error(`Timed out waiting for ${host}:${port}`);
}

async function isPortListening(port, host = "127.0.0.1") {
  return new Promise((resolve) => {
    const socket = require("net").createConnection({ port, host });
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("error", () => resolve(false));
  });
}

function createSocketClient(port) {
  return new Promise((resolve, reject) => {
    const socket = io(`http://127.0.0.1:${port}`, {
      transports: ["websocket"],
      reconnection: false,
      forceNew: true
    });
    const timeout = setTimeout(() => {
      socket.close();
      reject(new Error("Timed out connecting test socket"));
    }, 10000);
    socket.on("connect", () => {
      clearTimeout(timeout);
      resolve(socket);
    });
    socket.on("connect_error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}

async function emitAck(socket, eventName, payload = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timed out waiting ack for ${eventName}`));
    }, timeoutMs);

    socket.emit(eventName, payload, (response) => {
      clearTimeout(timer);
      resolve(response);
    });
  });
}

function createSpecList(suite) {
  if (suite === "smoke") {
    return smokeSpecs;
  }
  if (suite === "1p" || suite === "one-player") {
    return onePlayerSpecs;
  }
  if (suite === "visual") {
    return visualSpecs;
  }
  if (suite === "chaos") {
    return chaosSpecs;
  }
  return [...smokeSpecs, ...onePlayerSpecs, ...coreSpecs];
}

const ROLE_CONFIG = {
  control: {
    url: "/game/control/index.html",
    readySelector: "#boton_escribir",
    viewport: { width: 1600, height: 1100 }
  },
  writer1: {
    url: "/game/players/index.html?player=1",
    readySelector: "#texto",
    viewport: { width: 1400, height: 1000 }
  },
  writer2: {
    url: "/game/players/index.html?player=2",
    readySelector: "#texto",
    viewport: { width: 1400, height: 1000 }
  },
  spectator: {
    url: "/game/spectator/index.html",
    readySelector: "#contenedor_espectador",
    viewport: { width: 1600, height: 1000 }
  },
  musa1: {
    url: "/game/public/players/index.html?player=1&name=E2E_Musa_1",
    readySelector: "#musa_world_entry",
    viewport: { width: 430, height: 932, isMobile: true }
  },
  musa1b: {
    url: "/game/public/players/index.html?player=1&name=E2E_Musa_1_B",
    readySelector: "#musa_world_entry",
    viewport: { width: 430, height: 932, isMobile: true }
  },
  musa2: {
    url: "/game/public/players/index.html?player=2&name=E2E_Musa_2",
    readySelector: "#musa_world_entry",
    viewport: { width: 430, height: 932, isMobile: true }
  },
  musa2b: {
    url: "/game/public/players/index.html?player=2&name=E2E_Musa_2_B",
    readySelector: "#musa_world_entry",
    viewport: { width: 430, height: 932, isMobile: true }
  },
  actor1: {
    url: "/game/actors/source/index.html?player=1",
    readySelector: "#texto",
    viewport: { width: 1400, height: 900 }
  },
  actor2: {
    url: "/game/actors/source/index.html?player=2",
    readySelector: "#texto",
    viewport: { width: 1400, height: 900 }
  },
  onep: {
    url: "/1p_scrib/game/index.html?name=E2E_1P",
    readySelector: "#btn_escribir",
    viewport: { width: 1400, height: 1000 }
  }
};

class E2EHarness {
  constructor(options) {
    this.options = options;
    this.staticServer = null;
    this.serverProcess = null;
    this.serverLogs = [];
    this.browser = null;
    this.socket = null;
    this.pages = new Map();
    this.runId = new Date().toISOString().replace(/[:.]/g, "-");
    this.runArtifactsDir = path.join(ARTIFACTS_ROOT, this.runId);
    this.staticBaseUrl = `http://127.0.0.1:${STATIC_PORT}`;
    this.serverDir = null;
    this.testHooksEnabled = false;
  }

  assert(condition, message) {
    if (!condition) {
      throw new Error(message);
    }
  }

  async sleep(ms) {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  async start() {
    await ensureDir(this.runArtifactsDir);
    if (await isPortListening(SOCKET_PORT)) {
      throw new Error(`Port ${SOCKET_PORT} is already in use. Stop the existing server before running E2E.`);
    }
    if (await isPortListening(STATIC_PORT)) {
      throw new Error(`Port ${STATIC_PORT} is already in use. Stop the existing static server before running E2E.`);
    }
    this.serverDir = this.options.serverSource === "local"
      ? LOCAL_SERVER_DIR
      : await ensureRemoteServerCheckout();

    this.staticServer = await createStaticServer(ROOT_DIR, STATIC_PORT);
    this.serverProcess = spawn(process.execPath, ["server.js"], {
      cwd: this.serverDir,
      env: {
        ...process.env,
        PORT: String(SOCKET_PORT),
        NODE_ENV: "test",
        SCRIB_TEST_HOOKS: "1"
      },
      windowsHide: true
    });
    this.serverProcess.stdout.on("data", (chunk) => {
      this.pushServerLog("stdout", chunk.toString());
    });
    this.serverProcess.stderr.on("data", (chunk) => {
      this.pushServerLog("stderr", chunk.toString());
    });
    this.serverProcess.on("exit", (code) => {
      this.pushServerLog("exit", `server exited with code ${code}`);
    });

    await waitForPort(SOCKET_PORT);
    this.socket = await createSocketClient(SOCKET_PORT);

    try {
      await emitAck(this.socket, "scrib_test:get_state", {}, 5000);
      this.testHooksEnabled = true;
    } catch (error) {
      this.testHooksEnabled = false;
      const suiteWithoutStateHooks = new Set(["smoke", "visual", "1p", "one-player"]);
      if (!suiteWithoutStateHooks.has(this.options.suite)) {
        throw new Error("The fresh origin/master copy of server_scrib does not expose the required test hooks yet.");
      }
    }

    this.browser = await puppeteer.launch({
      headless: this.options.headed ? false : true,
      defaultViewport: null,
      args: process.env.CI ? PUPPETEER_CI_ARGS : []
    });
  }

  async stop() {
    await this.closeAllPages();
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
    if (this.staticServer) {
      await new Promise((resolve) => this.staticServer.close(resolve));
      this.staticServer = null;
    }
    if (this.serverProcess) {
      this.serverProcess.kill();
      this.serverProcess = null;
    }
  }

  pushServerLog(kind, message) {
    const lines = String(message || "")
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => `[${kind}] ${line}`);
    this.serverLogs.push(...lines);
    if (this.serverLogs.length > 400) {
      this.serverLogs = this.serverLogs.slice(-400);
    }
  }

  async closeAllPages() {
    const entries = Array.from(this.pages.values());
    this.pages.clear();
    await Promise.all(entries.map(async (entry) => {
      try {
        await entry.page.close({ runBeforeUnload: true });
      } catch (_error) {
      }
      try {
        await entry.context.close();
      } catch (_error) {
      }
    }));
  }

  async closeRole(roleName) {
    const entry = this.pages.get(roleName);
    if (!entry) {
      return;
    }
    this.pages.delete(roleName);
    try {
      await entry.page.close({ runBeforeUnload: true });
    } catch (_error) {
    }
    try {
      await entry.context.close();
    } catch (_error) {
    }
  }

  async beforeSpec() {
    await this.closeAllPages();
    if (this.testHooksEnabled) {
      await this.emitHook("scrib_test:reset", {});
    }
  }

  async afterSpec() {
    await this.closeAllPages();
    if (this.testHooksEnabled) {
      await this.emitHook("scrib_test:reset", {});
    }
  }

  async getState() {
    if (!this.testHooksEnabled) {
      throw new Error("Test hooks are not available for this run");
    }
    return emitAck(this.socket, "scrib_test:get_state", {}, 8000);
  }

  async emitHook(eventName, payload) {
    if (!this.testHooksEnabled) {
      throw new Error(`Test hook ${eventName} is not available for this run`);
    }
    return emitAck(this.socket, eventName, payload || {}, 12000);
  }

  async waitForState(description, predicate, timeoutMs = DEFAULT_TIMEOUT_MS) {
    return this.waitFor(description, async () => {
      const state = await this.getState();
      return predicate(state) ? state : false;
    }, timeoutMs);
  }

  async waitFor(description, fn, timeoutMs = DEFAULT_TIMEOUT_MS, intervalMs = 150) {
    const start = Date.now();
    let lastError = null;
    while ((Date.now() - start) < timeoutMs) {
      try {
        const result = await fn();
        if (result) {
          return result;
        }
      } catch (error) {
        lastError = error;
      }
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
    throw new Error(lastError ? `${description}: ${lastError.message}` : `Timed out waiting for ${description}`);
  }

  async openRoles(roleNames) {
    for (const roleName of roleNames) {
      if (this.pages.has(roleName)) {
        continue;
      }
      const config = ROLE_CONFIG[roleName];
      if (!config) {
        throw new Error(`Unknown role: ${roleName}`);
      }
      const context = this.browser.createBrowserContext
        ? await this.browser.createBrowserContext()
        : await this.browser.createIncognitoBrowserContext();
      const page = await context.newPage();
      page.setDefaultTimeout(DEFAULT_TIMEOUT_MS);
      page.setDefaultNavigationTimeout(20000);
      await page.setViewport(config.viewport);

      const logs = [];
      page.on("console", (msg) => {
        logs.push(`[console:${msg.type()}] ${msg.text()}`);
        if (logs.length > 120) logs.shift();
      });
      page.on("pageerror", (error) => {
        logs.push(`[pageerror] ${error.message}`);
        if (logs.length > 120) logs.shift();
      });
      page.on("requestfailed", (request) => {
        logs.push(`[requestfailed] ${request.url()} ${request.failure() ? request.failure().errorText : ""}`);
        if (logs.length > 120) logs.shift();
      });

      await page.goto(`${this.staticBaseUrl}${config.url}`, { waitUntil: "domcontentloaded" });
      await page.waitForSelector(config.readySelector, { visible: true, timeout: 15000 });

      this.pages.set(roleName, {
        roleName,
        context,
        page,
        logs,
        config
      });
    }
  }

  getPageEntry(roleName) {
    const entry = this.pages.get(roleName);
    if (!entry) {
      throw new Error(`Role page not open: ${roleName}`);
    }
    return entry;
  }

  isRoleOpen(roleName) {
    return this.pages.has(roleName);
  }

  async evaluate(roleName, fn, ...args) {
    return this.getPageEntry(roleName).page.evaluate(fn, ...args);
  }

  async waitForPageFunction(roleName, fn, timeoutMs = DEFAULT_TIMEOUT_MS, ...args) {
    const page = this.getPageEntry(roleName).page;
    await page.waitForFunction(fn, { timeout: timeoutMs }, ...args);
  }

  async invoke(roleName, functionName, ...args) {
    return this.evaluate(roleName, ({ name, params }) => {
      const fn = window[name];
      if (typeof fn !== "function") {
        throw new Error(`Missing global function: ${name}`);
      }
      return fn(...params);
    }, { name: functionName, params: args });
  }

  async click(roleName, selector) {
    const page = this.getPageEntry(roleName).page;
    await page.waitForSelector(selector, { visible: true, timeout: DEFAULT_TIMEOUT_MS });
    await page.$eval(selector, (node) => node.click());
  }

  async clickFirst(roleName, selector) {
    return this.evaluate(roleName, (css) => {
      const node = document.querySelector(css);
      if (!node) throw new Error(`No node found for ${css}`);
      node.click();
    }, selector);
  }

  async clickLast(roleName, selector) {
    return this.evaluate(roleName, (css) => {
      const nodes = Array.from(document.querySelectorAll(css));
      const node = nodes[nodes.length - 1];
      if (!node) throw new Error(`No node found for ${css}`);
      node.click();
    }, selector);
  }

  async fillValue(roleName, selector, value) {
    return this.evaluate(roleName, ({ css, nextValue }) => {
      const input = document.querySelector(css);
      if (!input) throw new Error(`Missing input ${css}`);
      input.focus();
      input.value = nextValue;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }, { css: selector, nextValue: value });
  }

  async setWriterText(roleName, text) {
    await this.getPageEntry(roleName).page.waitForSelector("#texto", { timeout: DEFAULT_TIMEOUT_MS });
    return this.evaluate(roleName, (value) => {
      const el = document.querySelector("#texto");
      if (!el) throw new Error("Missing writer text node");
      el.focus();
      el.textContent = value;
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true, key: "e" }));
      if (typeof window.countChars === "function") {
        window.countChars(el);
      }
      if (typeof window.sendText === "function") {
        window.sendText();
      }
    }, text);
  }

  async sendMusaWord(roleName, word) {
    await this.getPageEntry(roleName).page.waitForSelector("#palabra", { visible: true, timeout: 20000 });
    await this.evaluate(roleName, (value) => {
      if (typeof window.limpiar_colddown === "function") {
        window.limpiar_colddown();
      }
      const input = document.querySelector("#palabra");
      const button = document.querySelector("#progressButton");
      if (!input || !button) {
        throw new Error("Missing musa input/button");
      }
      input.value = value;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      button.click();
    }, word);
  }

  async sendWarmupWord(roleName, word) {
    await this.getPageEntry(roleName).page.waitForSelector("#calentamiento_input", { timeout: 20000 });
    await this.fillValue(roleName, "#calentamiento_input", word);
    await this.click(roleName, "#calentamiento_enviar");
  }

  async clickWarmupWord(roleName, word) {
    await this.evaluate(roleName, (targetWord) => {
      const candidates = Array.from(document.querySelectorAll("#calentamiento_nube_escritor *"));
      const match = candidates.find((node) => String(node.textContent || "").toLowerCase().includes(String(targetWord).toLowerCase()));
      if (!match) {
        throw new Error(`Warmup word not found: ${targetWord}`);
      }
      match.click();
    }, word);
  }

  async readText(roleName, selector) {
    return this.evaluate(roleName, (css) => {
      const node = document.querySelector(css);
      if (!node) return "";
      return String(node.innerText || node.textContent || "").trim();
    }, selector);
  }

  async waitForText(roleName, selector, predicate, description, timeoutMs = DEFAULT_TIMEOUT_MS) {
    return this.waitFor(description, async () => {
      const value = await this.readText(roleName, selector);
      return predicate(value) ? value : false;
    }, timeoutMs);
  }

  async waitForVisible(roleName, selector, visible, description, timeoutMs = DEFAULT_TIMEOUT_MS) {
    return this.waitFor(description, async () => {
      const isVisible = await this.evaluate(roleName, (css) => {
        const node = document.querySelector(css);
        if (!node) return false;
        const style = window.getComputedStyle(node);
        return style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0";
      }, selector);
      return isVisible === visible;
    }, timeoutMs);
  }

  async waitForChildCount(roleName, selector, minimumCount, description, timeoutMs = DEFAULT_TIMEOUT_MS) {
    return this.waitFor(description, async () => {
      const count = await this.evaluate(roleName, (css) => {
        const node = document.querySelector(css);
        return node ? node.children.length : 0;
      }, selector);
      return count >= minimumCount ? count : false;
    }, timeoutMs);
  }

  async stabilizeVisual(roleName, options = {}) {
    const hideSelectors = Array.isArray(options.hideSelectors) ? options.hideSelectors : [];
    const extraCss = String(options.extraCss || "");
    await this.evaluate(roleName, ({ nextHideSelectors, nextExtraCss }) => {
      if (document.activeElement && typeof document.activeElement.blur === "function") {
        document.activeElement.blur();
      }
      let style = document.getElementById("__scrib_e2e_visual_style");
      if (!style) {
        style = document.createElement("style");
        style.id = "__scrib_e2e_visual_style";
        document.head.appendChild(style);
      }
      const hiddenRule = nextHideSelectors.filter(Boolean).join(", ");
      style.textContent = `
        *, *::before, *::after {
          animation: none !important;
          transition: none !important;
          caret-color: transparent !important;
          scroll-behavior: auto !important;
        }
        html, body {
          scroll-behavior: auto !important;
        }
        ${hiddenRule ? `${hiddenRule} { visibility: hidden !important; opacity: 0 !important; }` : ""}
        ${nextExtraCss}
      `;
      window.scrollTo(0, 0);
    }, { nextHideSelectors: hideSelectors, nextExtraCss: extraCss });

    try {
      await this.getPageEntry(roleName).page.evaluate(() => (
        document.fonts && typeof document.fonts.ready?.then === "function"
          ? document.fonts.ready
          : Promise.resolve()
      ));
    } catch (_error) {
    }
    await this.sleep(Number.isFinite(options.settleMs) ? options.settleMs : 250);
  }

  async assertVisualSnapshot(roleName, snapshotName, options = {}) {
    const page = this.getPageEntry(roleName).page;
    const selector = options.selector || "";
    const threshold = Number.isFinite(options.threshold) ? options.threshold : 12;
    const currentDir = path.join(this.runArtifactsDir, "visual");
    const currentPath = path.join(currentDir, `${sanitizeName(snapshotName)}.png`);
    const baselinePath = path.join(VISUAL_BASELINES_DIR, `${sanitizeName(snapshotName)}.png`);

    await ensureDir(currentDir);
    await this.stabilizeVisual(roleName, options);

    if (selector) {
      await page.waitForSelector(selector, { visible: true, timeout: DEFAULT_TIMEOUT_MS });
      const handle = await page.$(selector);
      if (!handle) {
        throw new Error(`Missing visual selector ${selector} for ${snapshotName}`);
      }
      await handle.screenshot({ path: currentPath });
      await handle.dispose();
    } else {
      await page.screenshot({
        path: currentPath,
        fullPage: options.fullPage === true
      });
    }

    const comparison = await compareOrUpdateVisualSnapshot({
      baselinePath,
      currentPath,
      update: this.options.updateVisualBaselines === true,
      threshold
    });

    if (comparison.updated) {
      console.log(`UPDATED visual baseline ${snapshotName}`);
      return comparison;
    }

    if (!comparison.pass) {
      const sizeMessage = comparison.sizeMatches === false
        ? `size ${comparison.current.width}x${comparison.current.height} != ${comparison.baseline.width}x${comparison.baseline.height}`
        : `distance ${comparison.distance} > ${comparison.threshold}`;
      throw new Error(`Visual snapshot mismatch for ${snapshotName}: ${sizeMessage}`);
    }

    return comparison;
  }

  async captureFailure(specName, error) {
    const specDir = path.join(this.runArtifactsDir, sanitizeName(specName));
    await ensureDir(specDir);

    let state = null;
    try {
      state = await this.getState();
    } catch (_stateError) {
      state = { error: "could not fetch state" };
    }

    await fsp.writeFile(
      path.join(specDir, "state.json"),
      JSON.stringify(state, null, 2),
      "utf8"
    );
    await fsp.writeFile(
      path.join(specDir, "server.log.txt"),
      `${this.serverLogs.join("\n")}\n`,
      "utf8"
    );
    await fsp.writeFile(
      path.join(specDir, "error.txt"),
      `${error.stack || error.message}\n`,
      "utf8"
    );

    for (const [roleName, entry] of this.pages.entries()) {
      try {
        await entry.page.screenshot({
          path: path.join(specDir, `${sanitizeName(roleName)}.png`),
          fullPage: true
        });
      } catch (_error) {
      }
      try {
        await fsp.writeFile(
          path.join(specDir, `${sanitizeName(roleName)}.console.log.txt`),
          `${entry.logs.join("\n")}\n`,
          "utf8"
        );
      } catch (_error) {
      }
    }
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const harness = new E2EHarness(options);
  const specs = createSpecList(options.suite);
  const results = [];

  let failures = 0;

  try {
    await harness.start();
    console.log(`E2E run started with ${specs.length} spec(s), serverSource=${options.serverSource}, suite=${options.suite}`);

    for (const spec of specs) {
      const startedAt = Date.now();
      try {
        await harness.beforeSpec();
        await spec.run(harness);
        await harness.afterSpec();
        const durationMs = Date.now() - startedAt;
        results.push({ name: spec.name, status: "passed", durationMs });
        console.log(`PASS ${spec.name} (${durationMs}ms)`);
      } catch (error) {
        failures += 1;
        const durationMs = Date.now() - startedAt;
        results.push({
          name: spec.name,
          status: "failed",
          durationMs,
          error: error.message
        });
        console.error(`FAIL ${spec.name}: ${error.message}`);
        await harness.captureFailure(spec.name, error);
        try {
          await harness.afterSpec();
        } catch (_afterError) {
        }
      }
    }
  } finally {
    await harness.stop();
  }

  const summary = {
    runId: harness.runId,
    suite: options.suite,
    serverSource: options.serverSource,
    failures,
    passed: results.filter((result) => result.status === "passed").length,
    total: results.length,
    artifactsDir: harness.runArtifactsDir,
    results
  };
  await ensureDir(ARTIFACTS_ROOT);
  await fsp.writeFile(
    path.join(harness.runArtifactsDir, "run-summary.json"),
    JSON.stringify(summary, null, 2),
    "utf8"
  );
  await fsp.writeFile(
    path.join(ARTIFACTS_ROOT, "latest-run-summary.json"),
    JSON.stringify(summary, null, 2),
    "utf8"
  );

  if (failures > 0) {
    console.error(`E2E finished with ${failures} failing spec(s). Artifacts: ${ARTIFACTS_ROOT}`);
    process.exit(1);
  }

  console.log("E2E finished successfully.");
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
