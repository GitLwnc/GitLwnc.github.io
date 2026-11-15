# Windows 本地同步与预览
正式开发分支为 `phase-1-foundation-v2`。GitHub Pages 当前从 `master` 的根目录发布。此分支的 Homepage check 只构建、检查并保存截图，不发布网站。

## GitHub Desktop
1. 打开 GitHub Desktop，登录你的 GitHub 账号。
2. 首次使用：File → Clone repository → URL，填入 https://github.com/GitLwnc/GitLwnc.github.io ，选择本地文件夹，点击 Clone。
3. 点击 Current branch，选择 phase-1-foundation-v2。看不到时先点击 Fetch origin。
4. 每次同步，先查看 Changes。有自己尚未提交的改动时先保留，避免点击 Discard changes。
5. 确认 Current branch 后点击 Fetch origin；出现 Pull origin 时点击它。History 中应能看到本轮首页重构提交。
6. Repository → Open in Visual Studio Code。只检查网站不需要 Commit、Push、Merge 或创建 Pull Request。

## VS Code 与 Jekyll
网站使用 Gemfile 中的 github-pages（Jekyll）和旧版 Sass；VS Code Live Server 不能处理 Liquid 模板。
如果已按以前教程在 WSL Ubuntu 安装 Ruby/Bundler，优先使用现有环境，打开项目的 WSL 窗口和终端。

第一次预览需在已有 Ruby/Bundler 环境的项目终端运行：
```sh
bundle install
bundle exec jekyll serve --livereload --host 127.0.0.1
```
浏览器访问 http://127.0.0.1:4000 。停止服务按 Ctrl+C。更改 _config.yml、Gemfile 或 scripts/webrick_video_ranges.rb 后需要重启服务。

本分支已修复 WEBrick 导致本地 MP4 播放中断的 If-Range 问题。同步本次修改后，先停止旧服务，运行 bundle install，再用上述正常命令启动；不要添加 --skip-initial-build。详见 [视频播放修复说明](VIDEO-PLAYBACK-FIX.md)。

Windows 原生预览可使用 RubyInstaller 官方 Ruby+Devkit，安装 MSYS2 开发工具后重开 VS Code 终端，运行：
```powershell
ruby -v
gem install bundler
bundle install
bundle exec jekyll serve --livereload --host 127.0.0.1
```
若现有环境能运行，无需另装 Ruby。不要通过删除 Gemfile.lock 或强制覆盖文件处理错误，保留完整报错再排查。
没有 Ruby 环境时，GitHub Actions → Homepage check 的 homepage-check 附件提供桌面与手机宽度截图；可先查看它们。

## 浏览器检查
- 主页保留 Hero，后续依次为 Featured Research、Research Expertise、Publications、Academic Activities、Contact。
- 左右箭头、三个数字按钮和键盘方向键均可切换，第三页明确为 Ongoing Research。
- 当前页视频静音循环；切换离开后暂停；滚离整个轮播也暂停。暂停按钮可手动控制；浏览器阻止自动播放时点击 Play video。
- 浏览器 F12 → 切换设备工具栏，检查 390px、320px 手机宽度；视频容器采用实际 2160:708 比例，不裁切科研图像。
- 相场模拟图目前是稳定尺寸的文字占位，不是正式研究结果。
- 检查论文 DOI、CV、Research 和联系入口；F12 → Console 检查报错。
- GitHub Homepage check 用真实视频检查播放/暂停、桌面和移动宽度、链接及图片。触摸识别另有指针事件检查，真实手机仍建议查看一次。

## 后续补充
在 _data/featured-research.yml 管理轮播素材：video、poster、image 均为站点根目录路径。第三项 image 留空时显示占位。仅填入已上传的真实资源路径。
第四轮已更新为 5 Published · 1 Under Review · 1 In Preparation。已发表论文和手稿统一维护于 _publications；详情与后续字段说明见 [第三轮交付记录](HOMEPAGE-ROUND-3.md)。KAIST 照片和 CGJ 2026 页码已在第四轮补齐；正式相场模拟图仍待提供。最新素材、作者与活动地点说明见 [第四轮报告](HOMEPAGE-ROUND-4.md)。
