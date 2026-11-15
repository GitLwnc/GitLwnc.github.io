# 本地预览视频播放修复（2026-11-12）

## 原因与复现
本地 Jekyll 预览支持 MP4 视频。本次在真实 Jekyll 3.10.0 / WEBrick 1.9.2 服务及 Google Chrome 中复现故障：
首次请求返回 206；浏览器随后带 If-Range 请求其他视频片段时，WEBrick 错误返回 304 空响应，最终出现 MEDIA_ERR_SRC_NOT_SUPPORTED / FFmpegDemuxer data source error。
普通 HTTP GET 200、无条件 Range 206 或 video.paused === false 均不足以证明视频真正播放。

两个原始文件均经 FFprobe 确认为 H.264 Constrained Baseline / yuv420p，尺寸 2160×708、时长约 25 秒。没有转码、替换或删除视频。
WEBrick 实现参考：https://github.com/ruby/webrick/blob/v1.9.2/lib/webrick/httpservlet/filehandler.rb
If-Range 语义：https://httpwg.org/specs/rfc9110.html#field.if-range

## 修改
- scripts/webrick_video_ranges.rb：修正开发服务的 If-Range；匹配的验证值返回所需片段，过期验证值返回完整文件。请求头在处理后恢复。
- Gemfile：通过现有 webrick 依赖加载修复。github-pages 会禁用本地 _plugins，因此没有依赖该机制；未新增 gem。
- assets/js/home-carousel.js：使用 video 自身的 src 管理加载与释放；忽略旧加载的 Promise 结果和释放资源时的错误；失败后保留 Retry video；不支持 H.264 时提供明确说明。
- _includes/home/foundation-sections.html：错误提示放在视频控件下方；原尺寸链接使用原文件的普通新标签页链接。
- _sass/_homepage.scss：移除遮挡视频的巨大错误覆盖层。
- scripts/check-homepage.cjs、.github/workflows/homepage-check.yml：改用正常启动的 Jekyll 服务及 Google Chrome，要求 readyState、videoWidth 和播放时间等实际解码证据，并验证请求和交互。

## 验证
代码提交：9e59b3a52a0c4d16c7e66d807f49215d1cf71dfc
检查运行：https://github.com/GitLwnc/GitLwnc.github.io/actions/runs/43242611708
结果：全部通过。JavaScript / Ruby 语法、Bundler 自动加载、Jekyll 构建、五种宽度（1440 / 1024 / 768 / 390 / 320）、实际解码和时间推进、切页/离屏暂停、手动播放、减少动画、自动播放拒绝回退、网络失败重试、H.264 不支持时的说明、两个原尺寸链接，及首页内容/资源检查均通过。匹配与过期 If-Range 的状态码及响应字节也已核对。浏览器检查使用远程 Linux Google Chrome，并非用户 Windows 实机。

## WSL 更新与本地复核
先在运行 Jekyll 的终端按 Ctrl+C 停止旧服务：
```bash
cd ~/projects/GitLwnc.github.io
git status
```
如果工作区干净，再执行：
```bash
git switch phase-1-foundation-v2
git pull --ff-only origin phase-1-foundation-v2
bundle install
bundle exec jekyll serve --livereload --host 127.0.0.1
```
有未提交内容时先保留，不使用 reset --hard 或丢弃更改。
在 Windows Edge / Chrome 打开 http://localhost:4000 ，按 Ctrl+Shift+R 刷新。
依次检查两个视频播放、切换/暂停/继续、原尺寸新标签页和第三页占位。
必须重启服务，刷新页面无法加载 Ruby 服务修复。使用以上正常启动命令，不添加 --skip-initial-build。

只修改 phase-1-foundation-v2；未合并、未发布、未改动默认分支或原始媒体。远程 Chrome 检查不能替代用户 Windows 环境的最后复核。
