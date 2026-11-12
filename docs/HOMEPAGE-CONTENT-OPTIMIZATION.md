# 首页内容与视觉优化交付记录
## Git 与工作方式
- 仓库：https://github.com/GitLwnc/GitLwnc.github.io
- V2 分支：phase-1-foundation-v2，已核对远程六个分支后唯一确认。
- 修改前 HEAD：5e8e9afd4924fd86d6d122a00e449dd43607c78f。
- 通过完整检查的代码 HEAD：ed5e52dcfb4b3d20da191b149fc8101b014e3f59。
- 本记录在通过检查后单独提交；分支最终 HEAD 以 GitHub 分支页面为准。
- master 保持 607deb41a0b552a8df49eea04474c1da66870841；redesign/phase-1-foundation 保持原基线；未合并、未发布、未修改 Pages 设置、未删除资源。
- 代码通过 GitHub Git objects、commit 和带 expected_sha 的 ref 更新直接写入远程 V2；整个任务没有使用桌面 GUI、鼠标、键盘或当前浏览器。
- 当前工作目录初始没有 Git checkout，因此没有覆盖本地未提交代码；没有检查或修改用户正在使用的 WSL 工作区。后台仅下载活动图片和 CI 截图供核对。

## 结构与四个模块
技术栈仍是 Jekyll Academic Pages、Liquid、YAML、SCSS 和原生 JavaScript；没有更换主题、字体、颜色系统或增加前端库。

### Featured Research
- 标题只保留 Featured Research，增大到比其他模块更高的层级；删除 Research in motion 和宣传性副标题。
- 保留三页手动轮播，没有定时自动切换。
- 前两页显示对应论文真实完整标题、Published Research、期刊年份、论文入口和原始视频。
- 第三页标记 Ongoing Research，保留相场模拟固定尺寸占位，image 数据入口仍为空。
- 媒体区统一 16:9；原视频约 3.05:1，使用 object-fit: contain 保留全部科学内容，因此会有上下留边。
- muted、playsinline、loop、poster；仅当前激活且可见的视频按需加载。切走或离屏后暂停并释放 source，返回时尽可能恢复进度。
- 播放/暂停、静音开关和原尺寸视频入口放在媒体下方，不遮挡画面。静音状态不会在每次同步时被强制重置。
- 保留键盘方向键、箭头、分页、触摸识别、非激活页 inert、减少动画偏好和自动播放被拒时的手动播放回退。

### Research Expertise
改为三组轻量列表，不再用大卡片和解释段落：
- Experimental Methods：Soil Shrinkage Testing、Fracture Toughness Testing、J-integral Evaluation、Digital Image Correlation (DIC)、High-stress Oedometer Testing。
- Research Areas：Unsaturated Soil Mechanics、Soil Desiccation Cracking、Fracture Mechanics、Hydro-mechanical Coupling。
- Numerical Modelling：Phase-field Modelling、Finite Element Modelling、Discrete Element Modelling。
来源为现有 CV、论文方法和 Research 页面。高应力三轴试验、随机场、三维模拟没有足够依据，未加入。J-integral 采用 Evaluation，避免把计算评价方法表述为独立仪器试验。删除 From experiment to prediction。

### Publications
- 标题改为 Publications，按已核实集合数据自动统计 published、under_review、in_preparation。
- 当前显示 4 Published · 0 Under Review · 0 In Preparation，旁注明确为本网站已核实记录的数量，不代表用户实际没有其他稿件。
- 四篇已发表论文时间倒序，连续编号 01–04；未来其他状态排在已发表之后，仍连续编号。
- 左侧编号，右侧完整标题、全部作者、期刊、年份、状态、DOI。作者从原始 citation 提取，未删减作者；不再重复显示整段包含论文标题的引文。
- 条目上下 padding 从桌面 34px / 手机 28px 压缩到 18px / 14px。
- 四份论文原记录只增加 status: published，标题、作者顺序、期刊、日期、DOI、摘要、现有详情路由没有改变。
- 第五篇论文及当前在投、在写稿件资料尚待核对，没有套用预期 5+1+1 数字。

### Academic Activities
- 标题只保留 Academic Activities，删除 Exchange and collaboration。
- 两张简洁卡片，统一 16:9：KAIST Research Visit 与 KSME Conference Presentation。
- 使用仓库已有的 KSME 真实口头报告照片；虽然文件名带 ASME2026，实际照片中的会名和现有 CV 均确认是 KSME 80 周年会议，日期采用 CV 的 December 2025。
- AGU25.png 经核对是报告幻灯片，不作为现场照片使用。
- 未找到合适 KAIST 真实访问照片，保留统一尺寸占位及可替换 image 字段。
- 原有 AGU 2025 口头报告和 GRC 2026 海报经历保留为卡片下方的紧凑记录，详情仍可进入 CV。
- 没有增加 News / Latest News / 新闻轮播。

## 修改文件（13 个）
| 文件 | 作用 |
|---|---|
| _data/featured-research.yml | 真实论文标题、状态与已有媒体路径；删冗余描述 |
| _data/home-expertise.yml | 三组有依据的专业词条 |
| _data/home-activities.yml | 活动类型、日期、照片和占位配置 |
| _includes/home/foundation-sections.html | 四模块标题、列表、统计、编号、媒体与活动卡片 |
| _sass/_homepage.scss | 四模块字体、密度、16:9 媒体、响应式与样式整合 |
| assets/js/home-carousel.js | 延迟加载、资源释放、播放与声音状态 |
| _publications/2024-03-01-Role of substrate roughness in soil desiccation cracking.md | 仅增加 published 状态 |
| _publications/2025-05-08-Nucleation-percolation transition in desiccation cracking of clay.md | 仅增加 published 状态 |
| _publications/2026-03-26-Measuring fracture toughness of clayey soils in a wide suction range.md | 仅增加 published 状态 |
| _publications/2026-03-28-Suction and Volume Evolutions of Clayey Soils upon High-Stress Unloading and Subsequent Soaking.md | 仅增加 published 状态 |
| scripts/check-homepage.cjs | 内容、作者/DOI、编号、媒体生命周期与截图检查 |
| .github/workflows/homepage-check.yml | 增加 JavaScript 语法检查；保留纯构建检查，不发布 |
| docs/HOMEPAGE-CONTENT-OPTIMIZATION.md | 本记录 |

Hero、导航、SEO、其他页面模板及媒体原文件没有修改。

## 实际媒体路径
- PRE：images/网站视屏-nucleation percolation transition.mp4；poster 为 images/research/pre-poster.jpg。
- Géotechnique：images/网站视屏-Fracture toughness.mp4；poster 为 images/research/fracture-poster.jpg。
- KSME 现场照片：images/Oral presentation_ASME2026.jpg。
- 相场图片与 KAIST 访问照片仍待补充。两个视频已接入，无需重新提供。
- 所有现有媒体名称和路径保持不变，没有重复上传或重新制作视频。

## 测试与视觉核对
通过的 GitHub 检查：https://github.com/GitLwnc/GitLwnc.github.io/actions/runs/43231526340
- JavaScript syntax：通过。
- Jekyll Build：通过。
- Lint：项目没有配置 Lint 脚本，未新增第三方 lint 依赖。
- Type Check：项目没有 TypeScript / 类型检查配置，不适用。
- Chromium：1440、1024、768、390、320px 全部通过。
- 三页等宽等高、16:9 媒体、占位文字、无横向溢出、紧凑论文间距：通过。
- 真实论文视频单页播放、切页暂停、释放非激活源、快速切换、离屏暂停、播放/暂停和静音状态：通过。
- 模拟禁止自动播放后保留 poster、无未处理异常、点击可播放：通过。
- 减少动画偏好：通过。
- 论文全部标题、作者和 DOI 与源数据一致；连续编号和分状态数量：通过。
- 图片加载、站内链接和媒体路径：通过；各宽度控制台错误为空。
- 生成桌面/手机整页截图，以及桌面/手机三个研究页面截图；已在后台查看桌面、手机整页和真实视频页。
- 触摸识别采用合成 PointerEvent 检查，未声称真实手机、Safari 或 Firefox 实测。
- 最初的播放检查曾受截图临时改变视口影响；截图现移到功能验证后。延迟媒体 URL 的检查也已修正为按站点地址解析。没有通过删除功能来通过测试。
- 没有部署独立网站预览；Actions 的 homepage-check 附件包含 PNG 和 report.json，可下载查看。

## 待补充
1. 第五篇已发表论文的准确记录。
2. 在投与在写稿件的真实标题、作者及当前状态；旧 CV 的在投描述不足以确定当前状态。
3. 正式相场模拟图。
4. KAIST 访问或实验室的真实照片。
5. 若希望展示更多会议现场，可后续补充 AGU / GRC 现场照片。

## WSL 同步预览
在自己的项目终端先 Ctrl+C 停止旧服务，再执行：
```bash
cd ~/projects/GitLwnc.github.io
git status
git switch phase-1-foundation-v2
git pull --ff-only origin phase-1-foundation-v2
bundle exec jekyll serve --livereload --host 127.0.0.1
```
浏览器打开 http://localhost:4000。工作区若有未提交修改，先保留，不要丢弃或强制重置。
