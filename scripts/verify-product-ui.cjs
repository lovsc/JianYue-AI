// Build frontend first. Uses an isolated SQLite database and a deterministic AI stub.
// PLAYWRIGHT_MODULE may point at an existing Playwright installation.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const output = path.join(root, "tmp", "product-ui");
fs.mkdirSync(output, { recursive: true });
const runDir = fs.mkdtempSync(path.join(output, "run-"));
process.env.DATABASE_PATH = path.join(runDir, "test.db");
process.env.SERVE_FRONTEND = "true";
process.env.FRONTEND_DIST = path.join(root, "frontend", "dist");
process.env.JWT_SECRET = "local-browser-test-secret-at-least-32-characters";
process.env.DOUBAO_API_KEY = "test-no-network";
process.env.DOUBAO_MODEL_ENDPOINT = "test-no-network";
const { db, initializeDatabase } = require("../backend/src/database");
initializeDatabase();
const axios = require("../backend/node_modules/axios/dist/node/axios.cjs");
axios.post = async () => ({
  data: {
    choices: [
      {
        message: {
          content: JSON.stringify({
            score: 82,
            summary: "Vue 与工程化经验匹配，建议进一步说明实际成果。",
            strengths: ["有 Vue 实际开发经验"],
            gaps: [
              {
                keyword: "测试",
                importance: "medium",
                advice: "补充实际执行过的测试工作",
              },
            ],
            keywords: { matched: ["Vue", "Node.js"], missing: ["Redis"] },
            suggestions: [
              {
                section: "项目经历",
                original: "使用 Vue 构建简历编辑器",
                optimized: "基于 Vue 实现结构化简历编辑器与实时预览",
                reason: "具体说明承担的工作，不新增事实",
              },
            ],
            interviewQuestions: ["如何处理自动保存的并发问题？"],
          }),
        },
      },
    ],
  },
});
const app = require("../backend/src/app");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
let server, browser;
const failures = [];
const results = [];
async function check(name, action) {
  await action();
  results.push(name);
  console.log("PASS", name);
}
const sample = {
  basics: {
    name: "林晓",
    phone: "13800000000",
    email: "linxiao@example.com",
    location: "上海",
    position: "前端开发工程师",
    salary: "面议",
    jobType: "全职",
    summary:
      "具备 Vue 与 Node.js 项目实践，关注用户体验与工程质量。能够独立完成需求拆分、开发与交付。",
  },
  education: [
    {
      school: "示例大学",
      degree: "本科 · 软件工程",
      period: "2022.09 - 2026.06",
      description:
        "主修数据结构、计算机网络与软件工程，参与课程项目的设计与开发。",
    },
  ],
  experience: [
    {
      company: "示例科技",
      role: "前端开发实习生",
      period: "2025.06 - 2025.09",
      description:
        "参与业务页面开发与组件维护，协助梳理交互流程，完成需求联调与问题修复。",
    },
  ],
  projects: [
    {
      name: "简历服务平台",
      role: "全栈开发",
      period: "2025.10 - 至今",
      description:
        "使用 Vue 构建简历编辑器，支持简历内容管理、岗位匹配与 PDF 导出。\n负责前后端联调、异常处理与版本管理。",
    },
  ],
  skills: ["Vue 3", "Node.js", "SQLite", "Git", "HTML / CSS"],
};
async function main() {
  server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || undefined,
    headless: true,
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => failures.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") failures.push(message.text());
  });
  let resumeId, reportId, accessToken;
  const api = async (route, method = "GET", body) => {
    const response = await context.request.fetch(base + "/api/v1" + route, {
      method,
      headers: { Authorization: `Bearer ${accessToken}` },
      ...(body ? { data: body } : {}),
    });
    assert.ok(response.ok(), `${route}: ${await response.text()}`);
    return (await response.json()).data;
  };
  await check("anonymous homepage and public templates", async () => {
    await page.goto(base);
    await page.getByRole("heading", { name: /把经历写清楚/ }).waitFor();
    assert.equal(new URL(page.url()).pathname, "/");
    assert.equal(
      await page.locator(".template-grid>.template-card").count(),
      3,
    );
    assert.equal(
      (await page.locator(".site-filing a").textContent()).trim(),
      "黔ICP备2025053618号-1",
    );
    const iconHref = await page
      .locator('link[rel="icon"]')
      .getAttribute("href");
    assert.match(iconHref, /brand-mark\.svg/);
    const icon = await context.request.get(base + iconHref);
    assert.ok(icon.ok());
    assert.match(await icon.text(), /#6d4aff/);
    assert.ok(
      parseFloat(
        await page
          .locator(".hero-description")
          .evaluate((element) => getComputedStyle(element).fontSize),
      ) >= 15,
    );
    await page.getByRole("button", { name: "放大阅读示例简历" }).click();
    await page.locator(".sample-dialog .resume-document").waitFor();
    assert.ok(
      parseFloat(
        await page
          .locator(".sample-dialog .resume-document")
          .evaluate((element) => getComputedStyle(element).fontSize),
      ) >= 15,
    );
    await page.locator(".el-dialog__headerbtn:visible").click();
    await page.locator(".el-dialog:visible").waitFor({ state: "hidden" });
    assert.equal(
      await page.locator(".site-filing a").getAttribute("href"),
      "https://beian.miit.gov.cn/",
    );
    await context.route("https://beian.miit.gov.cn/**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "text/html",
        body: "<title>Filing navigation test</title>",
      }),
    );
    const opened = context.waitForEvent("page");
    await page.locator(".site-filing a").click();
    const filingTab = await opened;
    await filingTab.waitForURL("https://beian.miit.gov.cn/");
    await filingTab.close();
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({
      path: path.join(output, "homepage.png"),
      fullPage: true,
    });
    await page.screenshot({
      path: path.join(output, "homepage-public-desktop.png"),
    });
    await page
      .locator("#templates")
      .screenshot({ path: path.join(output, "template-gallery.png") });
    await page.getByRole("button", { name: "创建第一份简历" }).click();
    await page.waitForURL(/\/login\?redirect=/);
    assert.equal(new URL(page.url()).searchParams.get("redirect"), "/resumes");
  });
  await check(
    "required fields, password mismatch and registration return to login",
    async () => {
      assert.equal(await page.locator(".character-group .char").count(), 4);
      await page.mouse.move(250, 350);
      const pupils = await page.locator(".pupil").first().getAttribute("style");
      await page.mouse.move(600, 500);
      assert.notEqual(
        await page.locator(".pupil").first().getAttribute("style"),
        pupils,
      );
      await page.getByRole("button", { name: "登录并继续" }).click();
      await page
        .getByText("用户名长度应为 3 到 20 个字符", { exact: true })
        .waitFor();
      await page.getByRole("tab", { name: "注册", exact: true }).click();
      await page.getByLabel("用户名", { exact: true }).fill("browser_test");
      await page.getByLabel("密码", { exact: true }).fill("Browser123");
      await page.getByLabel("确认密码", { exact: true }).fill("Mismatch123");
      await page.getByRole("button", { name: "注册账号" }).click();
      await page.getByText("两次密码输入不一致", { exact: true }).waitFor();
      await page.getByLabel("确认密码", { exact: true }).fill("Browser123");
      await page.getByRole("button", { name: "注册账号" }).click();
      await page.locator(".auth-notice.success").waitFor();
      await page
        .locator('button[aria-label="登录并继续"]:not(.is-loading)')
        .waitFor();
      assert.equal(
        await page.evaluate(() => localStorage.getItem("access_token")),
        null,
      );
      assert.match(page.url(), /\/login/);
      await page.waitForTimeout(450);
      await page.screenshot({
        path: path.join(output, "registration-success.png"),
      });
    },
  );
  await check(
    "failed login, Enter submission and return to requested feature",
    async () => {
      await page.getByLabel("密码", { exact: true }).fill("Wrong123");
      await page.getByLabel("密码", { exact: true }).press("Enter");
      await page.locator(".auth-notice.error").waitFor();
      assert.match(
        await page.locator(".auth-notice").textContent(),
        /用户名或密码错误/,
      );
      await page.getByLabel("密码", { exact: true }).fill("Browser123");
      await page.getByLabel("密码", { exact: true }).press("Enter");
      await page.waitForURL(base + "/resumes");
      accessToken = await page.evaluate(() =>
        localStorage.getItem("access_token"),
      );
      assert.ok(accessToken);
      await page.getByRole("button", { name: "新建母简历" }).click();
      await page.waitForURL(/\/resumes\/\d+$/);
      resumeId = Number(new URL(page.url()).pathname.split("/").pop());
      await api("/resumes/" + resumeId, "PATCH", {
        content: sample,
        expectedRevision: 1,
        status: "completed",
      });
      await page.reload();
      await page.locator(".form-card").waitFor();
    },
  );
  await check(
    "autosave and cross-tab conflict retain newer server content",
    async () => {
      let release,
        notifyStarted,
        held = false;
      const started = new Promise((resolve) => {
        notifyStarted = resolve;
      });
      await page.route("**/api/v1/resumes/" + resumeId, async (route) => {
        if (route.request().method() === "PATCH" && !held) {
          held = true;
          notifyStarted();
          await new Promise((resolve) => {
            release = resolve;
          });
        }
        await route.continue();
      });
      await page
        .locator(".form-card textarea")
        .first()
        .fill("保存请求中途继续编辑的第一段");
      await page.getByRole("button", { name: "保存简历", exact: true }).click();
      await started;
      await page
        .locator(".form-card textarea")
        .first()
        .fill("保存请求中途继续编辑的最终内容");
      release();
      await page.locator(".save-state.saved").waitFor();
      assert.equal(
        (await api("/resumes/" + resumeId)).resume.content.basics.summary,
        "保存请求中途继续编辑的最终内容",
      );
      await page.unroute("**/api/v1/resumes/" + resumeId);
      const second = await context.newPage();
      await second.goto(base + "/resumes/" + resumeId);
      await second.locator(".form-card").waitFor();
      await page
        .locator(".form-card textarea")
        .first()
        .fill("第一页面的最新内容，保留此文本。");
      await page.getByRole("button", { name: "保存简历", exact: true }).click();
      await page.locator(".save-state.saved").waitFor();
      await second
        .locator(".form-card textarea")
        .first()
        .fill("第二页面的过时修改");
      await second.locator(".conflict-banner").waitFor();
      assert.equal(
        (await api("/resumes/" + resumeId)).resume.content.basics.summary,
        "第一页面的最新内容，保留此文本。",
      );
      await second.close();
      await page.screenshot({
        path: path.join(output, "editor.png"),
        fullPage: true,
      });
    },
  );
  await check(
    "version comparison and restore do not race with autosave",
    async () => {
      await page.getByRole("button", { name: "版本历史", exact: true }).click();
      await page
        .getByPlaceholder("版本备注，例如：投递前最终版")
        .fill("浏览器测试快照");
      await page.getByRole("button", { name: "创建快照", exact: true }).click();
      await page.getByText("浏览器测试快照", { exact: true }).waitFor();
      await page
        .locator(".version-list article")
        .first()
        .getByRole("button", { name: "对比", exact: true })
        .click();
      await page.locator(".el-dialog .no-changes").waitFor();
      await page.locator(".el-dialog__headerbtn").click();
      await page.locator(".el-drawer__close-btn").click();
      await page
        .locator(".form-card textarea")
        .first()
        .fill("恢复之前的未保存修改，先保存再恢复");
      await page.getByRole("button", { name: "版本历史", exact: true }).click();
      await page
        .locator(".version-list article")
        .filter({ hasText: "浏览器测试快照" })
        .getByRole("button", { name: "恢复", exact: true })
        .click();
      await page
        .locator(".el-message-box")
        .getByRole("button", { name: "确定", exact: true })
        .click();
      await page.locator(".el-drawer").waitFor({ state: "hidden" });
      assert.equal(
        await page.locator(".form-card textarea").first().inputValue(),
        "第一页面的最新内容，保留此文本。",
      );
      assert.equal(
        (await api("/resumes/" + resumeId)).resume.content.basics.summary,
        "第一页面的最新内容，保留此文本。",
      );
    },
  );
  await check(
    "job variant, evidence, snapshot, suggestion comparison and export entry",
    async () => {
      await page.goto(base + "/analysis");
      await page
        .getByPlaceholder("例如：行政专员、销售顾问、运营助理")
        .fill("前端开发工程师");
      await page
        .locator(".fields textarea")
        .fill(
          "负责 Vue 前端开发与组件化设计，使用 Node.js 和 SQLite，了解 Redis 者优先。",
        );
      await page
        .getByRole("button", { name: "开始匹配分析", exact: true })
        .click();
      await page.waitForURL(/\/analysis\/\d+$/);
      reportId = Number(new URL(page.url()).pathname.split("/").pop());
      await page
        .getByRole("button", { name: "对比并采纳", exact: true })
        .click();
      await page.locator(".apply-comparison").waitFor();
      assert.match(
        await page.locator(".apply-comparison section").last().textContent(),
        /前后端联调/,
      );
      await page
        .getByRole("button", { name: "保存快照并采纳", exact: true })
        .click();
      await page.getByText("✓ 已采纳到简历", { exact: true }).waitFor();
      await page.getByRole("button", { name: "修改对比", exact: true }).click();
      await page.locator(".resume-diff article").first().waitFor();
      await page.locator(".el-dialog__headerbtn:visible").click();
      await page.locator(".el-dialog:visible").waitFor({ state: "hidden" });
      const data = (await api("/analyses/" + reportId)).analysis;
      assert.notEqual(data.resume_id, resumeId);
      assert.match(
        (await api("/resumes/" + resumeId)).resume.content.projects[0]
          .description,
        /使用 Vue 构建简历编辑器/,
      );
      await page.screenshot({
        path: path.join(output, "analysis-report.png"),
        fullPage: true,
      });
      await page.getByRole("link", { name: "选择模板并导出" }).click();
      await page.locator(".template-options button").first().waitFor();
      assert.equal(await page.locator(".template-options button").count(), 3);
      const sidebarColor = await page
        .locator(".app-sidebar")
        .evaluate((element) => getComputedStyle(element).backgroundColor);
      assert.equal(sidebarColor, "rgb(23, 28, 44)");
      await page.getByRole("button", { name: "100% 阅读" }).click();
      await page.locator(".el-dialog:visible .resume-document").waitFor();
      await page.screenshot({ path: path.join(output, "resume-reading.png") });
      await page.locator(".el-dialog__headerbtn:visible").click();
      await page.locator(".el-dialog:visible").waitFor({ state: "hidden" });
      await page.screenshot({
        path: path.join(output, "export-center.png"),
        fullPage: true,
      });
    },
  );
  await check("three A4 print styles and mobile navigation", async () => {
    for (const template of ["classic", "modern", "elegant"]) {
      await page.goto(
        base + "/resumes/" + resumeId + "/print?template=" + template,
      );
      await page.locator(".screen-paper .resume-document").waitFor();
      assert.ok(await page.locator(".screen-paper .portrait").isVisible());
      if (template !== "classic")
        assert.ok(
          await page
            .locator(".screen-paper .section-label svg")
            .first()
            .isVisible(),
        );
      await page.evaluate(() => document.fonts.ready);
      await page.emulateMedia({ media: "print" });
      const bounds = await page.locator(".print-paper").evaluate((paper) => {
        const header = paper
            .querySelector(".document-header")
            .getBoundingClientRect(),
          document = paper
            .querySelector(".resume-document")
            .getBoundingClientRect(),
          title = paper
            .querySelector(".document-title")
            ?.getBoundingClientRect();
        return {
          headerTop: header.top - document.top,
          headerLeft: header.left - document.left,
          headerRight: header.right - document.right,
          titleTop: title ? title.top - document.top : 0,
        };
      });
      assert.ok(
        bounds.headerTop >= 0 &&
          bounds.headerLeft >= -1 &&
          bounds.headerRight <= 1 &&
          bounds.titleTop >= 0,
        template + " printable header bounds " + JSON.stringify(bounds),
      );
      await page.pdf({
        path: path.join(output, template + ".pdf"),
        format: "A4",
        preferCSSPageSize: true,
        printBackground: true,
      });
      await page.emulateMedia({ media: "screen" });
      await page.screenshot({
        path: path.join(output, template + ".png"),
        fullPage: true,
      });
    }
    await page.goto(base + "/");
    await page.locator(".hero-visual").waitFor();
    await page.screenshot({ path: path.join(output, "homepage-desktop.png") });
    await page.screenshot({
      path: path.join(output, "homepage-authenticated.png"),
      fullPage: true,
    });
    await page.setViewportSize({ width: 390, height: 844 });
    for (const route of [
      "/",
      "/dashboard",
      "/resumes",
      "/resumes/" + resumeId,
      "/analysis",
      "/analysis/" + reportId,
      "/exports",
      "/chat",
      "/profile",
    ]) {
      await page.goto(base + route);
      await page.locator(".app-main").waitFor();
      await page.waitForTimeout(150);
      const sizes = await page.evaluate(() => ({
        width: innerWidth,
        scroll: document.documentElement.scrollWidth,
      }));
      assert.ok(
        sizes.scroll <= sizes.width + 1,
        route + " horizontal overflow: " + JSON.stringify(sizes),
      );
      assert.ok(
        await page
          .getByRole("link", { name: /我的简历/ })
          .first()
          .isVisible(),
      );
      assert.equal(
        await page.locator(".site-filing a").getAttribute("href"),
        "https://beian.miit.gov.cn/",
      );
      if (route === "/exports")
        await page.screenshot({
          path: path.join(output, "mobile-export.png"),
          fullPage: true,
        });
      if (route === "/")
        await page.screenshot({
          path: path.join(output, "mobile-homepage.png"),
          fullPage: true,
        });
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    for (const [route, file] of [
      ["/dashboard", "dashboard"],
      ["/resumes", "resume-library"],
      ["/analysis", "job-workspace"],
      ["/profile", "profile"],
      ["/chat", "chat"],
    ]) {
      await page.goto(base + route);
      await page.locator(".app-main").waitFor();
      await page.waitForTimeout(180);
      await page.screenshot({
        path: path.join(output, file + ".png"),
        fullPage: true,
      });
    }
    await page.goto(base + "/profile");
    await page
      .locator(".page-head")
      .getByRole("button", { name: "退出登录", exact: true })
      .click();
    await page.waitForURL(base + "/");
    assert.ok(
      await page.getByRole("link", { name: "登录 / 注册" }).isVisible(),
    );
    const guest = await browser.newContext({
      viewport: { width: 390, height: 844 },
    });
    const login = await guest.newPage();
    await login.goto(base + "/login");
    await login.locator(".character-group").waitFor();
    assert.ok(await login.locator(".site-filing a").isVisible());
    const mobileWidth = await login.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      width: innerWidth,
    }));
    await login.screenshot({
      path: path.join(output, "mobile-login.png"),
      fullPage: true,
    });
    assert.ok(
      mobileWidth.scroll <= mobileWidth.width + 1,
      JSON.stringify(mobileWidth) +
        " " +
        JSON.stringify(
          await login.evaluate(() =>
            [...document.querySelectorAll("body *")]
              .filter(
                (element) =>
                  element.getBoundingClientRect().right > innerWidth + 1,
              )
              .slice(0, 8)
              .map((element) => element.className),
          ),
        ),
    );
    await login.setViewportSize({ width: 1440, height: 1000 });
    await login.screenshot({
      path: path.join(output, "login-restored.png"),
      fullPage: true,
    });
    await guest.close();
  });
  // HTTP 401 in the intentional failed login is expected; page JS errors are not.
  assert.deepEqual(
    failures.filter((item) => !item.includes("401 (Unauthorized)")),
    [],
  );
  fs.writeFileSync(
    path.join(output, "results.json"),
    JSON.stringify({ results, errors: failures }, null, 2),
  );
  console.log("Artifacts:", output);
}
main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (browser) await browser.close();
    if (server) await new Promise((resolve) => server.close(resolve));
    db.close();
  });
