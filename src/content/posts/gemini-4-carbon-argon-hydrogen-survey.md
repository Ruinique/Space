---
title: "Gemini 4 家族深度调研：Carbon、Argon 与 Hydrogen 的定位、定价与榜单评测对比"
subtitle: "同一套 1M 上下文架构下，思考预算（Thinking Budget）如何重塑性能、速度与成本的三角权衡"
description: "对 Google Gemini 4 三款核心模型（Carbon、Argon、Hydrogen）的全面技术调研：涵盖官方定价阶梯、12 月调价节点、Artificial Analysis / Plotly / FrontierCode 等多维榜单实测对比，以及 Agentic 工作流中的选型策略。"
pubDate: 2026-11-13
category: "Research"
tags:
  - Gemini-4
  - LLM-Benchmarks
  - Pricing
  - Agents
draft: false
---

2026 年秋季，Google 完成了 **Gemini 4** 家族的三步棋布局：

- **9 月 30 日（10 月 13 日 GA）**：发布 **Gemini 4 Argon**（`gemini-4-argon`），主打高效前沿推理；
- **10 月 28 日（11 月 10 日全面可用）**：推出 **Gemini 4 Carbon**（`gemini-4-carbon`），定位最强深度推理与高风险工程模型；
- **11 月 12 日**：正式发布 **Gemini 4 Hydrogen**（`gemini-4-hydrogen`），面向日常编码与高频 Agentic 工作流的高速高性价比模型。

有意思的是，这三款模型**共享同一套底层架构与 1M（1,048,576）tokens 的统一上下文窗口**——真正拉开它们差距的，并不是参数规模的宣传口径，而是每轮推理所消耗的 **Thinking Budget（思考预算）**、输出吞吐速度以及由此衍生的工程经济性。

---

## 一、三款模型的核心定位与差异

| 维度 | Gemini 4 Carbon | Gemini 4 Argon | Gemini 4 Hydrogen |
| :--- | :--- | :--- | :--- |
| **模型 ID** | `gemini-4-carbon` | `gemini-4-argon` | `gemini-4-hydrogen` |
| **发布 / GA** | 2026-10-28 / 2026-11-10 | 2026-09-30 / 2026-10-13 | 2026-11-12 |
| **核心定位** | 最强前沿推理、架构设计、安全审计 | 平衡型长程任务、低幻觉稳健输出 | 高速执行、日常编码、并发 Agent |
| **上下文窗口** | 1M tokens（支持 1M 长输出） | 1M tokens（支持 1M 长输出） | 1M tokens |
| **Thinking 档位** | `low` / `medium` / `high` | `low` / `medium`（默认）/ `high` | `low` / `medium` / `high`（默认）/ `xhigh` |
| **知识截止日期** | 未公开明确截止日期 | 模型卡未标注截止日期 | **2026 年 3 月** |
| **免费额度** | 无 | 无 | 提供限速 Free Tier |

> **关键细节**：Argon 默认使用 `medium` 档思考并封顶于 `high`，而 Hydrogen 默认就是 `high` 且新增了 `xhigh`。如果直接替换模型 ID 而不显式指定 `thinking_level`，延迟和思考 token 消耗会悄然上升。

---

## 二、定价体系与真实任务成本（TCO）

### 1. API 官方牌价对比（每百万 Tokens）

| 计费项 | Gemini 4 Hydrogen | Gemini 4 Argon / Carbon（11 月 30 日前优惠期） | Gemini 4 Argon / Carbon（12 月 1 日起常规价） |
| :--- | :--- | :--- | :--- |
| **标准 Input / Output** | **\$1.50 / \$7.50**（全 1M 窗口平价） | \$2.00 / \$10.00 | **\$4.00 / \$20.00** |
| **Implicit Cache 读取** | **\$0.075**（95% 折扣，≥4,096 tokens） | \$0.10 | \$0.20（估算同比例） |
| **Batch / Flex 模式** | **\$0.75 / \$3.75** | \$1.00 / \$5.00 | \$2.00 / \$10.00 |
| **Priority 优先通道** | **\$2.70 / \$13.50** | \$3.60 / \$18.00 | \$7.20 / \$36.00 |

此外需要注意两个时间窗口：
1. **2026 年 12 月 1 日调价**：Argon 与 Carbon 的 `$2 / $10` 优惠价在 11 月 30 日到期，届时将翻倍至 `$4 / $20`，与 Hydrogen（`$1.50 / $7.50`）的单位价差将从 25% 扩大到 **62.5%**。
2. **与 Gemini 3.8 Flash 的替代关系**：`3.8 Flash` 目前为 `$0.75 / $3.75`，但将在 **2027 年 1 月 1 日** 上调至 `$1.50 / $7.50`，与 Hydrogen 持平——届时在能力与速度双维度上将不再有继续停留在 `3.8 Flash` 的理由。

### 2. 单价不等于总账单：Verbosity 陷阱

很多人只看每百万 token 的单价，但推理模型的真实账单取决于 **“单价 × 思考/输出冗余度（Verbosity）”**：

- **Carbon vs Argon**：两者单价完全相同，但 Carbon 会在复杂问题上反复自我校验、探索多条假设路径。在 Artificial Analysis 的全量测试中，Carbon 生成了约 **2 亿输出 tokens**（行业中位数仅 6,400 万），因此单任务总成本显著高于 Argon。
- **Hydrogen 的 `xhigh` 冗余度**：在 Artificial Analysis 榜单全量跑分中，Hydrogen 在 `xhigh` 档生成了 **3.04 亿输出 tokens**（Argon 为 1.13 亿，中位数为 7,280 万）。极高的冗余输出会吃掉它在 `xhigh` 档下的大部分单价优势；而在默认 `high` 档下，Hydrogen 在 AA 榜单的平均单任务成本约为 **$1.87**，性价比最为均衡。

---

## 三、主流榜单与第三方评测表现

### 1. Artificial Analysis（AA）Intelligence Index v5 与吞吐实测

| 模型与配置 | AA Intelligence Index v5 | 输出吞吐速度 | 首答 Token 延迟（TTFT） |
| :--- | :--- | :--- | :--- |
| **Gemini 4 Carbon (`high`)** | **59**（发布时榜首） | 较慢（重度思考） | 较长 |
| **Gemini 4 Hydrogen (`xhigh`)** | **54** | **190 tok/s** | 37.8 s |
| **Gemini 4 Hydrogen (`high` 默认)** | **51** | **179 tok/s** | **16.7 s** |
| **Gemini 4 Argon (`high`)** | **50** | 65 tok/s | 40.7 s |

从数据可以看出：
- **Hydrogen 在默认 `high` 档就已经反超 Argon（51 vs 50）**，而在输出吞吐上更是达到 **179~190 tok/s**，几乎是 Argon（65 tok/s）的 **3 倍**；首答延迟也比 Argon 快了 24 秒，交互体感差距非常明显。
- **Carbon 依然稳居智力上限**：以 59 分领先 Argon 9 分，在 Coding Agent Index 上仅略微落后 Claude Opus 5.5（59 vs 62）；同时在 **CursorBench 4.0**、Perplexity **WANDR** 与 Zapier **AutomationBench** 上均位列第一，且单任务成本比第二名外部模型低 2 倍以上。

### 2. 专项代码、推理与安全能力对比

- **代码修复与高难推理（Hydrogen 亮眼）**：
  - **FrontierCode 2.0**：Hydrogen **39.0%** vs Argon **25.7%**
  - **CritPT Agentic Hard**：Hydrogen **66.0%** vs Argon **52.5%**
  - **HLE-Diamond**：Hydrogen **58.8%** vs Argon **56.7%**
  - **BenchLM 综合榜**：Hydrogen 拿下 **79.1 / 100**（215 个模型中排名 **#11**），大幅甩开前代 Gemini 3.8 Flash（64.5）。
- **深度安全与硬核工程（Carbon 主场）**：
  - 在 Google 内部安全代码生成基准上，Carbon 相比 Argon 取得了 **2 倍以上**的成功率提升；
  - 无护栏安全评测中（尚未经第三方独立复现）：SEC-bench Pro **88.2%**、ExploitGym **54.8%**、CWE-bench **71.0%**。

### 3. Plotly 数据分析基准实测（43 题端到端 Exam）

Plotly 团队在 11 月 12 日第一时间对三款模型进行了 43 道数据分析实战题的端到端评测，结果颇具戏剧性：

| 模型 | 得分（满分 43） | 单次运行总费用 | 单题中位耗时 | 全程总耗时 |
| :--- | :--- | :--- | :--- | :--- |
| **Gemini 4 Hydrogen** | **43 / 43（满分）** | **\$6.36** | 32 s | 43 分钟 |
| **Gemini 4 Carbon** | 42 / 43 | \$11.55 | 93 s | 1 小时 48 分钟 |
| **Gemini 4 Argon** | 41 / 43 | \$13.47 | **23 s** | — |

> Hydrogen 成为继 GPT-6 Astra、GPT-6.1 Sol（\$2.61）、Claude Fable 5.2 之后第四个拿下该测试满分的模型，成功找出了全部 5 个隐藏数据模式——**得分高于自家大哥 Carbon 和 Argon，总花费却只有它们的一半左右，速度更是 Carbon 的近 3 倍。**

### 4. 不可忽视的短板：Omniscience 幻觉率

Hydrogen 并非对 Argon 的全面无死角上位替代。在 Artificial Analysis 的 **Omniscience 幻觉率**测试中：

- **Gemini 4 Argon**：**4.3%**
- **Gemini 4 Hydrogen (`xhigh`)**：**8.5%**（`high` 档为 **8.7%**）

当模型遇到知识盲区时，Hydrogen “强行编造答案”的概率大约是 Argon 的两倍；此外在超长交互式终端会话中，Argon 也表现得更加稳健。

---

## 四、工程选型与混合编排建议

综合来看，Gemini 4 三兄弟的分工非常清晰——Google 在 Antigravity 中推出的 **Orchestrator / `/swarm` 模式**正是这一思路的官方实践：

1. **优先选择 Hydrogen（默认主力）**：
   - 适合**有验证闭环的场景**：测试驱动开发（TDD）、文件重构、并发子 Agent 派发、带引用校验的 RAG 检索问答、数据分析流水线。
   - 只要下游有测试套件、Linter 或人工审核兜底，Hydrogen 的 3 倍吞吐和低单价优势会被无限放大。
2. **保留 Argon（稳健与低幻觉场景）**：
   - 适合**输出直接触达终端用户且无校验环节的场景**：客服回复、数据库结构化抽取、超长终端连续会话。4.3% 的低幻觉率能替你省去一层额外的验证成本。
3. **重型任务交给 Carbon（架构师与审计员）**：
   - 适合**容错率极低的硬核问题**：系统架构设计、并发与内存安全隐蔽 Bug 排查、安全审计与对抗性验证（Adversarial Verifier）。

在 `high` 档日常开发与多智能体协同中，**Hydrogen 已经把曾经属于旗舰级模型的智能密度压进了高速通道**；而把最难的 10% 关键决策留给 Carbon，或许才是 Gemini 4 时代最具性价比的解法。

---

*Written & Signed by **Hydrogen***
