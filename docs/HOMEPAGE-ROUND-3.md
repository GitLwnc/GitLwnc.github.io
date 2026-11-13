# 第三轮首页优化与论文数据更新交付记录（2026-11-13）

> 历史阶段记录。最新视频/照片、作者与通讯标记、Under Review 状态、论文顺序及页脚修复，见 [第四轮交付报告](HOMEPAGE-ROUND-4.md)。

## 仓库、分支与范围
- 仓库：https://github.com/GitLwnc/GitLwnc.github.io
- 开发分支：phase-1-foundation-v2。修改前 HEAD：c546626316851744aab8c3a47ccc0f0c5dcd9d15。
- 通过全部检查的代码提交：c23b628b01f4e243929f2daa27871dc36acc9aee。
- 默认分支 master 保持 607deb41a0b552a8df49eea04474c1da66870841；原设计分支基线保持 8b5bb6a709a605b5bcc3e9260db58d26c463ded1。
- 发布关系沿用此前已核验的 master / root；本轮没有修改 Pages 设置，没有发布、合并或删除原始分支、视频和图片。
- 唯一 Actions workflow 为 Homepage check (no deployment)，仅 V2 push 触发，contents: read，无部署步骤。
- 代码通过 GitHub 连接在远程分支修改，以 expected_sha 核对后更新 ref。没有访问用户正在使用的 WSL checkout，没有覆盖用户本地未提交文件，也没有控制鼠标、键盘或桌面浏览器。
- 构建和无头 Chrome 预览均在独立 GitHub Ubuntu runner 中执行。后台只下载检查报告与截图到工作目录。
- Hero、导航、Research Expertise、Contact、全局字体、色彩及页面宽度没有重做。播放器 JavaScript 与上一轮 WEBrick 视频修复保持原样。

## Featured Research 实测与尺寸
浏览器原生 videoWidth / videoHeight 读取两个真实视频，结果一致：

| 视频 | 原始尺寸 | 真实比例 |
|---|---|---|
| Nucleation-percolation transition | 2160 × 708 | 180:59，约 3.050847:1 |
| Measuring fracture toughness | 2160 × 708 | 180:59，约 3.050847:1 |

在第 3、12、23 秒抽帧，未发现横贯上下边缘的近黑色条带；人工查看了原比例画面。此结论是抽样检查，不是对每帧进行裁切分析。没有转码、裁切或改动视频内容。

原容器强制 16:9。本轮改为 aspect-ratio: 2160 / 708，轮播最大宽度 1080px 并水平居中，保留 object-fit: contain。三页使用同一媒体框；相场图片仍为空，保留 Ongoing Research 的宽幅占位，没有生成虚构模拟图。

| 视口 | 修改前媒体框（约，旧版 16:9 与保存截图对照） | 本轮实际媒体框 | 三页外框实际尺寸（不含切换按钮） |
|---|---|---|---|
| 1440px | 1278 × 719px | 1078 × 353.34px | 三页均 1080 × 594px |
| 1024px | 926 × 521px | 926 × 303.52px | 三页均 928 × 545px |
| 390px | 348 × 195.75px | 348 × 114.06px | 三页均 350 × 385px |
| 320px | 278 × 156.38px | 278 × 91.11px | 三页均 280 × 387px |

媒体区在 1440px 视口下高度减少约 51%。三页媒体尺寸和外框高度一致。完整保留自动播放、默认静音、循环、左右/数字/键盘/触摸切换、非激活页暂停和资源释放、手动暂停、原尺寸链接、减少动画偏好、错误重试与播放进度恢复。移动端没有用 cover 或拉伸放大科研画面。

## 完整论文与手稿列表
统计和编号由现有 _publications 集合生成：5 Published · 1 Submitted · 1 In Preparation。没有另建重复论文数据库。

### Published Papers
01. Yang, Y., Liu, Z., Zhang, C., Huang, Q., Ding, W., & Chen, R. (2026). **Stress and stiffness anisotropies of sands during high-stress oedometer test.** *Transportation Geotechnics, 66*, Article 102417. https://doi.org/10.1016/j.trgeo.2026.102417

02. Yang, Y., Zhang, C., Liu, Z., Yuan, J., & Chen, R. (2026). **Suction and volume evolutions of clayey soils upon high-stress unloading and subsequent soaking.** *Canadian Geotechnical Journal, 63*. https://doi.org/10.1139/cgj-2026-0045

03. Yang, Y., & Zhang, C. (2026). **Measuring fracture toughness of clayey soils in a wide suction range.** *Géotechnique, 76*(3), 437–451. https://doi.org/10.1680/jgeot.25.00080

04. Yang, Y., Zhang, C., Kim, H., & Chen, R. (2025). **Nucleation-percolation transition in desiccation cracking of clay.** *Physical Review E, 111*(5), Article L053501. https://doi.org/10.1103/PhysRevE.111.L053501

05. Yang, Y., Zhang, C., Gou, L., Chen, R., & Dong, Y. (2024). **Role of substrate roughness in soil desiccation cracking.** *Canadian Geotechnical Journal, 61*(12), 2686–2703. https://doi.org/10.1139/cgj-2023-0638

### Manuscripts
- M1：Yang, Y., & Zhang, C. **Fracture toughness model of variably saturated clayey soils.** Submitted to *Journal of Geotechnical and Geoenvironmental Engineering (ASCE)*，2026 年 11 月投稿。没有 DOI、卷期或发表年份。标题未使用旧版 dataset and model。
- M2：**Role of fracture toughness evolution in desiccation cracking of clayey soils.** In Preparation · Working title。没有编造作者、期刊、DOI 或发表年份。

### 核验依据与限制
- 五个 DOI 均通过 Crossref API 返回对应记录；作者顺序、年份、期刊和已填卷期/编号逐项核对。
- Paper 1：出版社 ScienceDirect 索引页与 Elsevier 向 Crossref 登记的信息一致：[出版社页面](https://www.sciencedirect.com/science/article/pii/S2214391226005271)。
- Paper 3：直接读取 [Emerald 正式页面](https://www.emerald.com/jgeot/article/76/3/437/1334542/Measuring-fracture-toughness-of-clayey-soils-in-a)，确认 2026、76(3)、437–451。
- Paper 4：直接读取 [APS 正式页面](https://journals.aps.org/pre/abstract/10.1103/PhysRevE.111.L053501)，确认作者及 111(5)、L053501。
- Paper 2 与 Paper 5：Canadian Science Publishing 页面向本环境返回 403，使用出版社登记的 [Paper 2 Crossref 记录](https://api.crossref.org/works/10.1139/cgj-2026-0045) 和 [Paper 5 Crossref 记录](https://api.crossref.org/works/10.1139/cgj-2023-0638) 交叉核对。Paper 5 的最终卷期页码与用户核对信息一致。
- Paper 2 的 Crossref page 为 1–17，但无法直接确认出版社当前是否将其列为最终分页；首页和详情引用保留卷 63，暂不填期号与页码。没有把登记中的 January 1 当作已确认的实际出版日。
- 两篇手稿的状态和标题来自用户本轮明确提供的最新信息，不声称进行了公开出版记录验证。
- DOI 已注册且链接按原 DOI 保留；出版社的访问控制并不等于 DOI 失效。本轮没有声称所有出版社页面均能匿名完整打开。

### 排版与维护
- 桌面 15px、手机 14px，行高 1.48，条目间距 10px；编号宽桌面 32px、手机 28px，编号与正文间距 10px / 8px。
- 每条无内部大面积 padding，不使用独立论文卡片背景；作者、年份、标题、斜体期刊/卷号、期号与页码/文章编号、DOI 顺序连续呈现。
- 已发表项编号 01–05，不重复显示 Published 标签。手稿编号 M1/M2，独立分组并明确状态。
- 论文详情 URL 保留，新增三项各有稳定 permalink；未删除四篇既有摘要。
- 集合字段：record_id（避免与 Jekyll 自带 id 冲突）、authors、year、title、venue（沿用原字段作为 journal）、volume、issue、pages / article_number、doi、status、display_order、permalink；可选 pdfurl。未发表字段按实际信息省略。
- 新增论文只更新集合数据；计数、编号、首页、Publications 页面与 CV 引用复用 publication-list / publication-citation。
- CV 中旧 Acta Geotechnica 在审描述及两处过时出版信息已改为读取当前论文记录。没有更改 CV 的其他经历。
- 未发表稿件的详情页和搜索元信息不再从 Jekyll 自动文件日期生成虚假的 Published / datePublished。

## Academic Activities
改为单列横向轻卡片，文字在左、缩略图在右，保持原色彩、圆角和边框。按已有记录的开始月份倒序；同月活动不虚构具体日期。

| 记录 | 日期 | 类别与素材 |
|---|---|---|
| Gordon Research Conference | July 2026 | Conference Presentation / Poster；复用真实研究海报 |
| AGU Fall Meeting 2025 | December 2025 | Conference Presentation / Oral；现有素材是幻灯片，没有称为现场照片，也没有声称线下参加 |
| 80th Anniversary Conference of KSME | December 2025 | Conference Presentation / Oral；复用已核对的真实报告照片 |
| KAIST | September 2025 – March 2026 | Research Visit；保留 CSC 支持说明，真实访问照片仍缺，使用简洁 KAIST 文字占位 |

桌面缩略图 120×90px（4:3），四行实测各高 116px；图片列占行宽约 9%（1440px 视口）至 13%（1024px 视口），实际图像面积占整行约 7%–10%，文字占主要区域。手机为 80×60px；390px 下行高约 130–150px，320px 下文字自然换行，图片不占据大面积高度。图片均 contain，不拉伸、不裁掉海报或幻灯片信息。

## 构建、测试与独立预览
最终通过运行：https://github.com/GitLwnc/GitLwnc.github.io/actions/runs/43358613568
附件 homepage-check ID：14006943670，包含 report.json、两个原比例视频抽帧、桌面/手机各研究页、Publications、Academic Activities 和整页截图。

环境：GitHub Ubuntu 22.04 runner、Ruby 3.1、Jekyll 3.10.0、Playwright 驱动 Google Chrome。真实 Jekyll 服务启动在 runner 的 127.0.0.1:4000，未使用用户电脑或桌面浏览器，也未部署公开预览地址。

通过项：
- JavaScript / Ruby 语法，论文 YAML 字段、唯一 ID / DOI、五篇已确认 DOI、未发表字段约束及 Bundler 自动加载视频修复。
- Jekyll build，以及真实 Jekyll serve 下的首页检查。
- 1440、1024、768、390、320px：无横向溢出，三页等高，真实比例一致，占位文字不裁切。
- 两段实际视频解码、时间推进、切页/快速切换、非激活页暂停与释放、离屏暂停、手动控制、静音开关、原尺寸链接。
- 减少动画、自动播放拒绝回退、不支持 H.264 时提示、网络错误后重试。
- 五篇 APA 文本的作者/年份/标题/期刊/卷期/编号/DOI 与集合数据一致；统计与 01–05 / M1–M2 编号正确。
- 手机/桌面排版字号、行高、零内部 padding、活动小图宽度、比例、左右顺序与不重叠。
- 所有首页本地图片、媒体、详情和导航链接；/publications/、/cv/、/research/ 及七条论文/手稿详情路由。
- 两篇手稿不显示 Published 或发表日期元数据。各屏幕首页控制台错误为空。
- 人工查看最终桌面/手机论文与活动截图、两段原比例抽帧及相场占位截图。
- 触摸仍采用合成 PointerEvent；没有声称真实 iPhone、Android、Safari、Firefox 或 Windows Edge 实机全测。

最初构建发现活动描述中的冒号需要 YAML 引号，已修复。最终结果以上述完整通过的运行和 report.json 为准。

## 修改文件
本轮代码共修改/新增 20 个文件：
- `.github/workflows/homepage-check.yml`
- `_data/home-activities.yml`
- `_includes/archive-single.html`
- `_includes/home/foundation-sections.html`
- `_includes/publication-citation.html`
- `_includes/publication-list.html`
- `_includes/seo.html`
- `_layouts/single.html`
- `_pages/cv.md`
- `_pages/publications.html`
- `_publications/2024-03-01-Role of substrate roughness in soil desiccation cracking.md`
- `_publications/2025-05-08-Nucleation-percolation transition in desiccation cracking of clay.md`
- `_publications/2026-03-26-Measuring fracture toughness of clayey soils in a wide suction range.md`
- `_publications/2026-03-28-Suction and Volume Evolutions of Clayey Soils upon High-Stress Unloading and Subsequent Soaking.md`
- `_publications/manuscript-fracture-toughness-evolution.md`
- `_publications/manuscript-fracture-toughness-model.md`
- `_publications/stress-stiffness-anisotropies.md`
- `_sass/_homepage.scss`
- `scripts/check-homepage.cjs`
- `scripts/check-publications.rb`

此外新增本交付记录，更新旧审计文档的历史标识及本地预览说明。未修改播放器 JS、原始图片/视频、Gemfile、导航、Hero 或研究能力数据。

## 待补充与本地检查
1. CGJ 2026 的最终期号 / 页码尚需出版社正式页面再次确认；当前不填。
2. 相场模拟结果图、KAIST 真实访问照片仍待补充。
3. 如后续提供 AGU 的实际参会方式或现场照片，可继续补充；本轮没有把未确认方式写成线下。
4. 真实设备和其他浏览器可在本地进一步复核；当前无构建失败或失效本地静态路径。

WSL 已有项目的更新方式：停止旧服务（Ctrl+C），确认 git status 干净后执行：
```bash
cd ~/projects/GitLwnc.github.io
git switch phase-1-foundation-v2
git pull --ff-only origin phase-1-foundation-v2
bundle exec jekyll serve --livereload --host 127.0.0.1
```
在 Windows Edge / Chrome 打开 http://localhost:4000 并 Ctrl+Shift+R。存在未提交改动时先保留，不丢弃或强制重置。本轮未增加依赖，已有可用环境无需重新安装 Ruby。
