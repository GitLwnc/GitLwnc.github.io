# Phase 1 Foundation V2 交付审计（2026-11-12）

> 这是历史阶段快照。当前素材、作者标注、5 Published · 1 Under Review · 1 In Preparation 及布局状态，以 [第四轮交付报告](HOMEPAGE-ROUND-4.md) 为准。

> 视频验证更正：本记录此前的播放检查只核对暂停状态，未证明成功解码。用户本地预览故障后，已在真实 Jekyll + Google Chrome 中复现并修复 WEBrick 的 If-Range 错误；新增检查要求画面数据就绪及播放时间推进。请以 [视频修复记录](VIDEO-PLAYBACK-FIX.md) 的原因、结果和更新步骤为准。
## 仓库与发布边界
- 仓库：https://github.com/GitLwnc/GitLwnc.github.io
- 操作分支：phase-1-foundation-v2。
- 初始提交：8b5bb6a709a605b5bcc3e9260db58d26c463ded1；开始时与基线没有差异。
- 默认分支 master 保持 607deb41a0b552a8df49eea04474c1da66870841。
- 已通过登录状态的 GitHub Settings → Pages 实际核验：Deploy from a branch，master，/ (root)。未改变发布设置，未合并、未发布、未删除分支或原有资源。
- 所有正式代码和视频均直接写入远程 V2 分支；Windows 仅读取历史附件、下载检查截图和查看结果，没有建立本地开发副本。当前项目工作目录最初没有可接续代码文件。
- 六个现有分支只有两种 HEAD：master 与三个 legacy 分支相同；两个设计分支初始相同。另检查了 44 个 images 历史快照，只找到 SoilArching.mp4，不能代替论文视频。
- 原始论文视频最终从项目聊天“分析项目进展”的两个附件中恢复，并上传至远程；中断会话在 GitHub 没有留下额外首页实现提交。

## 首页实际实现
1. Hero：保留原有人像、简介、圆形快捷入口和主视觉；优化中等屏幕的网格宽度。
2. Featured Research：一个三页交互式轮播，完整 2160:708 宽幅画面；前两页为 PRE 和 Géotechnique 已发表研究，第三页明确标记 Ongoing Research / Phase-field Modelling。左右箭头、数字指示器、键盘方向键和触摸指针切换；不按计时器自动切换。
3. Research Expertise：实验、理论与数值研究合并为五项能力卡片；移除重复 Core Research、Research Toolkit 和 Latest 分区。
4. Publications：首页由现有论文集合生成全部四篇已核实记录，显示作者引文、期刊、年份及 DOI；保留独立论文列表和详情体系。四篇详情改为目录式 permalink，并保留旧路径跳转；未改论文标题、作者或 DOI。
5. Academic Activities：两张卡片，KAIST 访问（2025-09 至 2026-03，CSC 支持）及 GRC 2026、AGU 2025、KSME 2025。事实取自仓库 CV。
6. Contact：保留 Email、ResearchGate、GitHub，Hero 仍有 CV 入口。
7. 修复基础资源路径：共享 base_path 仅使用 baseurl，避免本地预览从正式旧版站点加载样式/图片；更正 _config.yml 的 URL 为 Jekyll 使用的 url；移除不存在图标和失效 polyfill 引用。

## 视频与封面
| 内容 | 视频路径 | 封面路径 |
|---|---|---|
| PRE 成核—渗流研究 | images/网站视屏-nucleation percolation transition.mp4 | images/research/pre-poster.jpg |
| Géotechnique 断裂韧度研究 | images/网站视屏-Fracture toughness.mp4 | images/research/fracture-poster.jpg |

视频为原始附件，分别 22,356,485 与 9,100,032 字节。未找回历史封面，因此在 GitHub runner 用 FFmpeg 从真实视频第 20 秒提取 1440px 宽封面；生成后提交成固定资源，一次性提取步骤已移除。
- muted、playsinline、loop；仅激活且在视口中的视频尝试播放。
- 切页、页面隐藏或滚离轮播时暂停。手动暂停会被保留。
- play() 的 Promise 拒绝被处理，浏览器阻止自动播放时仍有 Play video 按钮。
- 减少动画偏好下默认暂停，可手动播放。
- 手机端可点 Open full-size video 查看原始完整视频。
- 第三页 image 配置为空，显示固定比例占位；替换时在 _data/featured-research.yml 填真实图片路径即可。

## 文件清单
- _data/featured-research.yml：轮播内容和素材配置。
- _includes/home/foundation-sections.html：首页六段结构中 Hero 以下的内容。
- _layouts/home.html：仅首页加载轮播脚本。
- assets/js/home-carousel.js：切换、触摸、可访问性和媒体生命周期。
- _sass/_homepage.scss：响应式布局、轮播、能力及活动卡片；清除旧模块样式。
- _includes/base_path：本分支和本地预览的资源解析。
- _includes/head/custom.html：清理无效图标与脚本引用。
- _config.yml：url 字段与开发文档/检查脚本排除规则。
- _publications/2024-03-01-Role of substrate roughness in soil desiccation cracking.md：详情路由与旧路径跳转。
- _publications/2025-05-08-Nucleation-percolation transition in desiccation cracking of clay.md：详情路由与旧路径跳转。
- _publications/2026-03-26-Measuring fracture toughness of clayey soils in a wide suction range.md：详情路由与旧路径跳转。
- _publications/2026-03-28-Suction and Volume Evolutions of Clayey Soils upon High-Stress Unloading and Subsequent Soaking.md：详情路由与旧路径跳转。
- 两段 MP4 与两张 JPG：路径见上表。
- .github/workflows/homepage-check.yml：仅 V2 分支运行的构建与浏览器检查，没有 deployment 步骤，权限 contents: read。
- scripts/check-homepage.cjs：真实浏览器检查和截图保存。
- docs/LOCAL-PREVIEW-WINDOWS.md：GitHub Desktop、VS Code、WSL/Ruby 预览步骤。
- docs/PHASE-1-V2-AUDIT.md：本报告。

## 验证
被验证的最终代码提交：d625d2cf01f14de850825a45c41309b3daeac158。
最终检查：https://github.com/GitLwnc/GitLwnc.github.io/actions/runs/43222401919
环境：GitHub Ubuntu 22.04 runner，Ruby 3.1，github-pages 233 / Jekyll 3.10.0，Chromium。
- Jekyll 构建：通过。
- 1440、1024、768、390、320px：通过；三个滑窗等宽等高，无页面横向溢出，占位文字不裁切。
- 左右循环、数字选择、键盘切换、快速连续切换：通过。
- 使用真实论文视频检查单视频播放、切页暂停、手动暂停/继续、离屏暂停：通过。
- 减少动画模式：通过。
- 手机触摸识别：通过合成 PointerEvent 检查；没有声称真实手机实测。
- 首页图片和站内链接、视频路径：通过；控制台错误数组为空。
- 查看了远程生成的桌面和手机整页截图，并据手机截图修复占位文字裁切。
- 外部期刊、ResearchGate 等目标沿用已核验仓库记录；没有发送邮件，也没有验证邮箱实际投递或每个外站的可达性。
- Safari、Firefox、真实 iPhone/Android 未测；原始超宽视频在手机上仍需放大才能阅读小字。
- 早期检查发现资源误连正式站、滑窗尺寸和本地论文路由问题，均已修复后重跑；最终结果以上述检查为准。
- Actions 的旧版本 action 运行时弃用提示为工具链警告，不是网页控制台错误。

## 待补充资料
- 正式相场模拟图，使用真实计算输出。
- 第五篇已发表论文的完整作者、标题、期刊、年份和 DOI。
- 在投和在写稿件的准确标题及当前状态。CV 有一项 Acta Geotechnica 在投记录，但不能据旧 CV 推断当前状态，因此未增造首页手稿条目。
- 如希望增加活动照片，可提供 KAIST 或会议真实照片；目前两张卡片为文字形式。

## 本地检查
参见 [Windows 本地预览说明](LOCAL-PREVIEW-WINDOWS.md)。先在 GitHub Desktop 选择 phase-1-foundation-v2，再 Fetch origin / Pull origin；VS Code 打开同一文件夹，在已有 Ruby/Bundler 或 WSL 环境执行 bundle install 和 bundle exec jekyll serve --livereload --host 127.0.0.1，访问 http://127.0.0.1:4000。无需推送、合并或更改 Pages 即可查看。

辅助截图公开日志方案被自动审批拒绝，未进入仓库；采用 Actions 截图附件下载查看。正式交付不依赖该被拒方案。
