# 第四轮内容更新与局部优化交付报告（2026-11-13）

## Git 信息与工作方式
- 仓库：https://github.com/GitLwnc/GitLwnc.github.io
- 操作分支：phase-1-foundation-v2。
- 开始时 HEAD：2abb47bf20a9f0316f86221b211b80e8dbb19eb1。
- 已通过完整构建与浏览器检查的代码提交：fb6b499e6a1c7aa9fe1d6954a12e67f8f156829f。
- 本记录随后作为仅文档提交保存；最新 HEAD 以分支页面为准。
- 默认分支 master 保持 607deb41a0b552a8df49eea04474c1da66870841；原设计基线分支保持 8b5bb6a709a605b5bcc3e9260db58d26c463ded1。
- 沿用此前核验的 master / root 发布关系。本轮未改 Pages 设置、未合并、未部署、未删除分支或原媒体。
- 通过 GitHub 连接直接修改远程 V2，使用 expected_sha 核对分支更新；没有覆盖用户本地或 WSL 的未提交工作。
- 未控制本地鼠标、键盘、桌面浏览器。原附件读取、确定性图片缩放与视频封面抽帧均在后台完成；Jekyll 和无头 Chrome 验证在独立 GitHub runner 中进行。
- 保留播放器 JS、轮播结构、宽幅比例、Hero、Research Expertise、字体与色彩体系。本轮没有新增网站运行依赖。

## 用户后续补充要求
已纳入：
1. KAIST 改为 Joint Doctoral Training，描述为与 KAIST 开展博士生联合培养 / 博士研究训练；没有写成授予联合学位。
2. 学术活动增加城市、国家以及官方会议/会址链接；完整会址保留于 venue 字段和链接提示。
3. 在审稿件通讯作者为 Chao Zhang；统计和条目统一显示 Under Review，状态字重为 400。
4. 同年优先 Géotechnique、Transportation Geotechnics 靠后；已发表列表现为 2026 Géotechnique → 2026 CGJ → 2026 Transportation Geotechnics → 2025 PRE → 2024 CGJ。

## Featured Research 与新视频
已发表滑窗通过 publication_id 引用原 _publications 记录，标题、作者、期刊、年份及 DOI 来自同一数据源。作者显示在期刊前，采用已有 APA 缩写姓名并保持完整顺序；没有重复创建研究成果记录。
Ongoing Research 没有新增作者或期刊。空论文引用已显式保护，避免第三页读取到已发表作者。

新视频根据文件名和实际图像内容对应：第一段为高/低孔隙异质性与成核—渗流开裂；第二段为高/低吸力下断裂韧度研究。不是按附件排列顺序匹配。

| 项目 | 旧引用 | 新引用 | 文件大小 | 时长 |
|---|---|---|---:|---:|
| PRE 成核—渗流 | images/网站视屏-nucleation percolation transition.mp4 | images/research/nucleation-percolation-v4.mp4 | 18,834,988 字节 | 25.0143 秒 |
| Géotechnique 断裂韧度 | images/网站视屏-Fracture toughness.mp4 | images/research/fracture-toughness-v4.mp4 | 6,147,794 字节 | 22.0113 秒 |

两个视频均为 H.264 Constrained Baseline / yuv420p / 30.30 fps，2160×708，SAR 1:1，DAR 180:59（约 3.050847:1）。通过 MP4 元数据、FFmpeg 解码和远程浏览器原生元数据交叉核对。没有转码或裁切新视频，仓库字节与上传附件完全一致。

SHA-256：
- PRE：88c072b988224faff59c159004c03ac71fe0fc3a09c6c87388f7ad491e8e9bba
- Géotechnique：6f953e146a195fe11857d70825aea8814ce82789b8d7130cc6a5eb9108551505

两段均低于 GitHub 50 MiB 大文件提醒阈值和 100 MiB 阻止阈值，见 [GitHub 官方说明](https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github)。没有使用新的第三方媒体托管平台。只上传各一份新版视频，旧资源保留供现有引用和回退使用。

封面从新版 PRE 第 12 秒、Géotechnique 第 11 秒提取，生成 1440×472 JPEG。保留 object-fit: contain，桌面媒体框仍为 1078×353.34px；三个滑窗外框仍统一为 1080×594px，没有重新增大桌面高度。手机媒体框仍按真实比例缩小；新增作者自然换行。静音自动播放、循环、暂停、切换、离屏释放、手动播放、错误重试及原尺寸链接均保留。

远程检查对实际 HTTP 视频响应逐一核对文件大小、SHA-256、分段响应、解码与时间推进。按各视频时长取样，未发现横贯上下边缘的黑条；没有为了去掉图形本身的留白而裁切研究内容。

## Publications 姓名、通讯作者与顺序
保留 APA 结构、15px / 14px 字号、1.48 行高、10px 条目间距及原编号机制。
仅在作者字段中按完整 APA 姓名匹配：Yang, Y. 使用 strong；通讯作者在姓名后显示上标 *。没有对整个引用或页面做全局姓名替换。
原作者字符串保留用于兼容；corresponding_authors 和 correspondence_source 分别保存明确标记及依据。格式化组件检查通讯作者确实存在于该条作者名单内。

| 顺序 | 论文 | 通讯作者 | 依据 |
|---|---|---|---|
| 01 | Measuring fracture toughness of clayey soils in a wide suction range | Chao Zhang | [Emerald 正式页面](https://www.emerald.com/jgeot/article/76/3/437/1334542/Measuring-fracture-toughness-of-clayey-soils-in-a) 明示 Corresponding author |
| 02 | Suction and volume evolutions of clayey soils upon high-stress unloading and subsequent soaking | Chao Zhang | [Canadian Science Publishing 提供的论文预览](https://www.researchgate.net/publication/402741977_Suction_and_volume_evolutions_of_clayey_soils_upon_high-stress_unloading_and_subsequent_soaking)，首页明示 Corresponding author |
| 03 | Stress and stiffness anisotropies of sands during high-stress oedometer test | Chao Zhang，唯一 | 用户本轮明确确认；未声称从出版社页面独立读取到了通讯作者标记 |
| 04 | Nucleation-percolation transition in desiccation cracking of clay | Chao Zhang | [APS 正式页面](https://journals.aps.org/pre/abstract/10.1103/PhysRevE.111.L053501) 的 * / Contact author |
| 05 | Role of substrate roughness in soil desiccation cracking | Chao Zhang，唯一 | 用户本轮明确确认；未声称从出版社页面独立读取到了通讯作者标记 |
| M1 | Fracture toughness model of variably saturated clayey soils | Chao Zhang | 用户本轮补充明确确认 |
| M2 | Role of fracture toughness evolution in desiccation cracking of clayey soils | 不添加 | 作者名单尚未确认，维持 In Preparation / Working title |

未将 Yuhan Yang 标为通讯作者，也没有把最后一位作者直接当作通讯作者。
说明文字每个 Publications 列表仅出现一次：Bold: Yuhan Yang; *: Corresponding author.
首页、Publications 页面和 CV 的论文列表复用同一作者组件与数据。

统计现为 5 Published · 1 Under Review · 1 In Preparation。
M1 的真实标题、目标期刊和 2026-11 投稿月份保留，没有添加 DOI、卷期或发表年份；Under Review 与 In Preparation 的条目标记均为 font-weight: 400。
CGJ 2026 的出版社预览已确认卷 63、页码 1–17，因此补齐此前暂缺页码；仍不编造期号或出版日。

## 图片素材与活动对应
原始 网站更新素材.zip 未修改，SHA-256 为 C49EF4C48EDD1186377DEE1AA90D9F4796E2D917230DF533439219F50EB2CEF2。
图片均先检查实际内容、分辨率及方向。六张图的方向标记均为正常方向；网页副本保留完整画面，不裁切人物、会议标识或演讲内容，没有 AI 修图或图像增强。

| 原素材 | 原尺寸 | 网页引用 | 网页尺寸 | 用途 |
|---|---|---|---|---|
| KAIST照片.jpg | 4032×3024 | images/activities/kaist-joint-training.jpg | 960×720 | 首页 KAIST 联合培养 |
| GRC 2026 文件夹内合影 | 4032×3024 | images/activities/grc-2026-group.jpg | 960×720 | 首页与 CV 的 GRC 2026 |
| AGU25 / Oral presentation_AGU25.png | 1791×1007 | images/activities/agu-2025-slide.jpg | 960×540 | 首页与 CV 的 AGU25 报告幻灯片 |
| AGU24 文件夹内合影 | 1440×1080 | images/activities/agu-2024-group.jpg | 1440×1080 | 仅更新 CV 已有 AGU24 经历配图 |
| IUTAM / Interface.png | 1280×736 | images/activities/iutam-2024-group.jpg | 1200×690 | 仅更新 CV 已有 IUTAM 2024 配图 |
| InterPore 文件夹内合影 | 1440×1080 | images/activities/interpore-2024-group.jpg | 1200×900 | 仅更新 CV 已有 InterPore 2024 配图 |

AGU24 原始 JPEG 已较小，直接保留原字节；其他网页副本等比例缩小并按 JPEG quality 85 编码，尺寸四舍五入至整数像素。原包及其高质量附件保留作为素材来源。旧仓库图片没有删除。
InterPore 文件夹名带 2024.3，但照片横幅显示 13–16 May，CV 原有 May 2024 正确，本轮没有采用文件夹中的错误月份。
AGU24 合影没有放到 AGU25。AGU25 附件仍为幻灯片，alt 明确说明不是现场照片。
本次没有提供 KSME 新照片，因此首页继续使用已核实的原 KSME 报告照片。没有凭猜测配图，也没有新增首页活动卡片。

### 活动地点
首页显示城市/国家，地点文字可点击官方页面；完整会址保存在 venue 和链接提示中：

| 活动 | 显示地点 | 会址 / 官方依据 |
|---|---|---|
| KAIST 联合培养 | Daejeon, South Korea | KAIST Main Campus, 291 Daehak-ro, Yuseong-gu；[KAIST 地址](https://kaist.edu/en/html/kaist/01200201.html) |
| KSME 80 周年会议 | Jeongseon, South Korea | High1 Grand Hotel Convention Tower, Jeongseon, Gangwon；[KSME 官方记录](https://ksme.or.kr/Proceedings/2025a/sub09_4.asp) |
| AGU25 | New Orleans, USA | Ernest N. Morial Convention Center, 900 Convention Center Blvd, New Orleans, LA 70130；[AGU 官方会议信息](https://news.agu.org/press-release/press-registration-open-for-2025-agu-annual-meeting/) |
| GRC 2026 | Les Diablerets, Switzerland | Les Diablerets Conference Center / Eurotel Victoria；[GRC 官方页面](https://www.grc.org/flow-and-transport-in-permeable-media-conference/2026/) |

AGU25 旧 CV 的 Washington, D.C. 已同步更正。该项表示会议会址，没有把未确认的个人参会方式写成线下出席。
活动仍为文字在左、图片在右；桌面图 120×90px、1024/1440px 视口行高 116px；手机图 80×60px，文字自然换行。图片 contain、不变形。KAIST 表述为联合博士研究训练，不暗示授予联合学位。

## Contact 下方空白的原因与处理
实际不是无内容卡片，而是旧主题的 sticky footer 机制：
1. _sass/_base.scss 给 body 预留 padding-bottom: 9em；旧版截图对应约 162px 浅色带。
2. _sass/_footer.scss 把 .page__footer 绝对定位。
3. 旧 assets/js/_main.js 的 bumpIt 会在加载和调整窗口时，按页脚高度写入 body 的 inline margin-bottom。

首页现在增加 home-page 作用域：清除上述 padding 和 inline margin 的预留，让页脚回到正常文档流，并让其背景与 Contact 一致。
没有 display:none 隐藏未知结构，没有删除共享页脚或版权信息；其他页面保留原主题的页脚方式。Contact 的邮箱、ResearchGate、GitHub 链接和内容完整保留。

最终五种宽度中，Contact 与页脚间距为 0px，body 下边距与下内边距均为 0px；页脚底部与文档末尾的差值小于 1px（浏览器像素取整误差）。人工查看了最终桌面和手机底部截图，页脚后没有残留白条。

## 修改文件
本轮代码/数据共 20 个文件：
- `_data/featured-research.yml`
- `_data/home-activities.yml`
- `_data/publication-author-display.yml`
- `_includes/archive-single.html`
- `_includes/home/foundation-sections.html`
- `_includes/publication-authors.html`
- `_includes/publication-citation.html`
- `_includes/publication-list.html`
- `_layouts/default.html`
- `_layouts/single.html`
- `_pages/cv.md`
- `_publications/2024-03-01-Role of substrate roughness in soil desiccation cracking.md`
- `_publications/2025-05-08-Nucleation-percolation transition in desiccation cracking of clay.md`
- `_publications/2026-03-26-Measuring fracture toughness of clayey soils in a wide suction range.md`
- `_publications/2026-03-28-Suction and Volume Evolutions of Clayey Soils upon High-Stress Unloading and Subsequent Soaking.md`
- `_publications/manuscript-fracture-toughness-model.md`
- `_publications/stress-stiffness-anisotropies.md`
- `_sass/_homepage.scss`
- `scripts/check-homepage.cjs`
- `scripts/check-publications.rb`

新增媒体共 10 个文件，均已核对 Git blob SHA 与来源字节：
| 文件 | 字节数 |
|---|---:|
| `images/research/nucleation-percolation-v4.mp4` | 18,834,988 |
| `images/research/fracture-toughness-v4.mp4` | 6,147,794 |
| `images/research/pre-poster-v4.jpg` | 139,617 |
| `images/research/fracture-poster-v4.jpg` | 67,243 |
| `images/activities/kaist-joint-training.jpg` | 159,358 |
| `images/activities/grc-2026-group.jpg` | 210,881 |
| `images/activities/agu-2025-slide.jpg` | 93,826 |
| `images/activities/agu-2024-group.jpg` | 171,221 |
| `images/activities/iutam-2024-group.jpg` | 192,710 |
| `images/activities/interpore-2024-group.jpg` | 213,264 |

另新增本报告，更新旧阶段报告的历史标识与本地预览说明。未改播放器 JS、Gemfile、导航或 Research Expertise。

## 验证与独立预览
最终通过的代码：fb6b499e6a1c7aa9fe1d6954a12e67f8f156829f
检查运行：https://github.com/GitLwnc/GitLwnc.github.io/actions/runs/43423758774
homepage-check 附件 ID：14036160071。包含 report.json、桌面/手机整页、三个研究滑窗、论文列表、活动区、视频抽帧和 bottom 截图。

通过项目：
- JavaScript / Ruby 语法、论文 YAML / 唯一 ID / DOI、作者与通讯标记约束、Jekyll build。
- 1440、1024、768、390、320px：无横向溢出，三页等高，媒体真实比例一致。
- 新视频字节大小 / SHA-256、HTTP 200、普通和条件 Range、真实解码、时长、播放时间推进。
- 自动播放、静音、暂停/继续、快速切换、非激活页暂停与源释放、离屏暂停、原尺寸链接、减少动画和错误重试。
- 作者顺序、本名唯一加粗、通讯标记、说明仅一条、两种稿件状态字重 400、统计与排序。
- Featured Research 作者/期刊/DOI 与对应论文一致，Ongoing Research 不显示未经确认的作者。
- 活动图片与位置、地点链接字段、照片小尺寸比例、文字在左且不重叠。
- Contact 链接、Contact—footer 间距及 footer—文档末尾间距均验证，避免仅检查前一处空隙。
- 所有首页本地资源及论文/CV/Research 路由；未发表详情页无 Published 或 datePublished。
- 各屏幕首页控制台错误为空。实际查看最终桌面/手机论文、活动、新视频和底部截图。

环境为独立 GitHub Ubuntu 22.04 runner、Ruby 3.1、Jekyll 3.10.0、Google Chrome（Playwright）。触摸仍是合成 PointerEvent；未声称真实手机或 Windows Edge / Safari / Firefox 全测。
没有发布新的线上预览地址；远程临时 Jekyll 地址只用于检查，可通过截图附件查看结果。

## 未完成或素材限制
- 本轮可完成的代码与素材更新均已完成，没有未通过的构建检查。
- 未提供新的 KSME 照片、AGU25 现场照片，已如实使用原 KSME 照片与提供的 AGU25 幻灯片；没有误配年份。
- 正式相场模拟图仍未提供，第三页保留现有 Ongoing Research 占位，不补造作者。
- Transportation Geotechnics 和 CGJ 2024 的通讯作者由用户明确确认，未伪称已在出版社页面独立核实。
- 用户本地可再复核实际设备显示。先停止旧 Jekyll 服务，确认工作区干净后同步并启动：

```bash
cd ~/projects/GitLwnc.github.io
git status
git switch phase-1-foundation-v2
git pull --ff-only origin phase-1-foundation-v2
bundle exec jekyll serve --livereload --host 127.0.0.1
```

在 Windows Edge / Chrome 打开 http://localhost:4000 ，Ctrl+Shift+R 刷新。有未提交修改时先保留，不使用强制重置或丢弃更改。本轮没有新增依赖。
