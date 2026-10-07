# Pi Durable Mini Agent

这个仓库是视频《用 Pi Durable 写自己的第一个 Agent》的完整可运行示例。我们从一个只会调用模型、用 SQLite 保存状态的最小 Agent 开始，分四步加入工具、Skills 和中断恢复。

## 你会做出什么

1. **V1：模型 + SQLite** — 用 DeepSeek 回答问题，把会话持久化到本地 SQLite。
2. **V2：Tools** — 安装 `CodingTools`，让 Agent 可以 `read`、`write`、`edit` 和执行 `bash`。
3. **V3：Skills** — 加载用户级和项目级 Skills，把操作规范加入 Agent 的 system prompt。
4. **V4：中断恢复** — 杀掉正在执行长任务的进程，再打开同一份 SQLite；安全工具会重放，不安全的副作用不会自动重试。

V1–V3 使用 DeepSeek。V4 使用 Pi AI 的确定性 faux provider，目的是让中断恢复实验可以离线、稳定地重复运行。

## 环境要求

- Node.js 22.6 或更新版本
- 一个 DeepSeek API Key（仅 V1–V3 需要）

## 安装

```bash
git clone https://github.com/sugarforever/pi-durable-mini-agent.git
cd pi-durable-mini-agent
npm install
```

配置 Key：

```bash
export DEEPSEEK_API_KEY="你的 Key"
```

也可以复制 `.env.example` 作为记录，但本项目不会自动读取 `.env`；请确保 Key 已进入当前 shell 环境。`.env` 和所有 SQLite 文件均已加入 `.gitignore`。

## V1：最小 Agent

在仓库根目录运行：

```bash
npm run v1
```

输入一句话并回车。程序会在当前目录创建 `.mini-agent.sqlite`。输入 `exit` 退出；再次启动后仍然使用同一份数据库。

## V2：添加 Tools

```bash
npm run v2
```

可以尝试：

```text
读取 src/checkout.ts，告诉我这里有哪些待办事项。
```

这一版通过 `CodingTools` 给 Agent 安装文件读写、编辑和 shell 工具。终端会打印实际的工具调用。

## V3：添加 Skills

在仓库根目录运行：

```bash
npm run v3
```

输入：

```text
扫描项目中的 TODO 和 FIXME，按项目 Skill 生成报告。
```

Agent 会发现 `workspace/.pi/skills/todo-report/SKILL.md`，按其中的步骤生成 `workspace/TODO-REPORT.md`。生成文件已被 Git 忽略，可以放心重复实验。

## V4：模拟进程崩溃与恢复

回到仓库根目录：

```bash
npm run demo:resume
```

脚本会：

1. 同时启动 `fetch_report` 和 `send_email` 两个慢工具；
2. 在它们执行到一半时强制终止 Node.js 进程；
3. 使用同一份 `workspace/.resume.sqlite` 重新启动 Harness；
4. 调用 `harness.resume()` 恢复任务。

`fetch_report` 声明为 `replay: "safe"`，因此会从头重放并完成；`send_email` 声明为 `replay: "unsafe"`，Harness 不会擅自重发可能已经产生外部副作用的操作。

如果想在两个终端中手工观察，可以分别执行：

```bash
npm run v4:start
npm run v4:resume
```

在第一个命令完成前终止它，再运行第二个命令。

## 项目结构

```text
src/
  v1-basic.ts       # DeepSeek + SQLite
  v2-tools.ts       # 安装 CodingTools
  v3-skills.ts      # 加载并注入 Skills
  v4-resume.ts      # 安全/不安全工具的恢复实验
workspace/
  .pi/skills/       # 项目级 Skill
  src/              # 供 Agent 检查的示例代码
scripts/
  demo-resume.sh    # 自动制造中断并恢复
```

## 验证

```bash
npm run typecheck
npm run demo:resume
```

DeepSeek 示例会产生真实 API 调用和费用，因此没有放入默认自动化测试。

## 安全说明

`CodingTools` 可以读取、修改当前工作目录中的文件并执行命令。请在这个示例仓库或其他受控目录中运行，不要把不可信内容直接交给拥有敏感凭据的 Agent。

## License

MIT
