import fs from "node:fs";
import path from "node:path";
import { chromium } from "file:///D:/nodesetup/node_global/node_modules/playwright/index.mjs";

const ROOT = "C:\\Users\\Administrator\\campus-job-collection";
const TODAY = "2026-03-19";

async function fetchKuaishou(pageNum) {
  const payload = {
    recruitSubProjectCodes: ["20261749721165", "20271772783534"],
    pageSize: 10,
    pageNum,
    positionNatureCode: "fulltime",
  };

  const response = await fetch(
    "https://campus.kuaishou.cn/recruit/campus/e/api/v1/open/positions/simple",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    throw new Error(`Kuaishou request failed: ${response.status}`);
  }

  const data = await response.json();
  return (data.result?.list || []).map((item) => ({
    company: "快手",
    source: "Kuaishou campus",
    title: item.name || "",
    category: item.positionCategoryCode || "",
    location: (item.workLocationDicts || []).map((x) => x.name).join("、"),
    published_at: item.releaseTime || "",
    project: item.recruitSubProjectCode || "",
    position_code: item.code || "",
    detail_url: item.code
      ? `https://campus.kuaishou.cn/recruit/campus/e/#/campus/job-info/${item.code}`
      : "https://campus.kuaishou.cn/recruit/campus/e/#/campus/jobs?positionNatureCode=fulltime",
    source_url:
      "https://campus.kuaishou.cn/recruit/campus/e/#/campus/jobs?positionNatureCode=fulltime",
  }));
}

async function fetchByteDance(pageNum) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1200 } });
  const url = `https://jobs.bytedance.com/campus/position?keywords=&category=&location=&project=&type=2&job_hot_flag=&current=${pageNum}&limit=10`;

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.waitForTimeout(12000);

  const jobs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("a"))
      .map((a) => ({
        text: (a.innerText || "").trim(),
        href: a.href,
      }))
      .filter((item) => /\/campus\/position\/.+\/detail/.test(item.href))
      .slice(0, 10)
      .map((item) => {
        const lines = item.text
          .split("\n")
          .map((x) => x.trim())
          .filter(Boolean);
        const meta = lines[1] || "";
        return {
          company: "字节跳动",
          source: "ByteDance campus",
          title: lines[0] || "",
          meta,
          location: meta.match(/北京|上海|深圳|杭州|成都|广州|珠海|南京|厦门|武汉/g)?.join("、") || "",
          published_at: (meta.match(/\d{4}-\d{2}-\d{2}/) || [""])[0],
          project: meta.includes("Top Seed")
            ? "Top Seed"
            : meta.includes("筋斗云")
              ? "筋斗云人才计划"
              : meta.includes("校园招聘")
                ? "2026届校园招聘"
                : "",
          position_code: (meta.match(/职位 ID[:：]\s*([A-Z0-9]+)/) || ["", ""])[1],
          detail_url: item.href,
          source_url: "https://jobs.bytedance.com/campus/position",
        };
      });
  });

  await browser.close();
  return jobs;
}

function toMarkdown(items) {
  const lines = [];
  lines.push(`# Open Campus Jobs - ${TODAY}`);
  lines.push("");
  lines.push(`- CollectedAt: ${TODAY}`);
  lines.push("- Scope: Official public campus/full-time job pages that were visibly open on collection day.");
  lines.push("- Sources: ByteDance campus site, Kuaishou campus site.");
  lines.push("- Notes: Publication date is the date shown on the source page, not necessarily the deadline.");
  lines.push("");

  const grouped = items.reduce((acc, item) => {
    acc[item.company] ||= [];
    acc[item.company].push(item);
    return acc;
  }, {});

  for (const [company, jobs] of Object.entries(grouped)) {
    lines.push(`## ${company}`);
    lines.push("");
    lines.push("| Title | Location | Published | Project | Link |");
    lines.push("| --- | --- | --- | --- | --- |");
    for (const job of jobs) {
      const title = job.title.replace(/\|/g, "\\|");
      const location = (job.location || "").replace(/\|/g, "\\|");
      const published = job.published_at || "";
      const project = (job.project || "").replace(/\|/g, "\\|");
      lines.push(`| ${title} | ${location} | ${published} | ${project} | [source](${job.detail_url}) |`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

async function main() {
  const all = [];
  all.push(...(await fetchByteDance(1)));
  all.push(...(await fetchByteDance(2)));
  all.push(...(await fetchKuaishou(1)));
  all.push(...(await fetchKuaishou(2)));

  const outDir = path.join(ROOT, "collections");
  fs.mkdirSync(outDir, { recursive: true });

  const markdownPath = path.join(outDir, `${TODAY}-open-campus-jobs.md`);
  const jsonPath = path.join(outDir, `${TODAY}-open-campus-jobs.json`);

  fs.writeFileSync(markdownPath, toMarkdown(all), "utf8");
  fs.writeFileSync(jsonPath, JSON.stringify(all, null, 2), "utf8");

  console.log(JSON.stringify({ markdownPath, jsonPath, count: all.length }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
