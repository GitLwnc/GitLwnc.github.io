const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
(async () => {
  fs.mkdirSync("qa-output", {recursive:true});
  const browser = await chromium.launch();
  const reports = [];
  try {
    for (const width of [1440, 1024, 768, 390, 320]) {
      const context = await browser.newContext({viewport:{width,height:1000}, isMobile:width<768, hasTouch:width<768});
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", e => errors.push(e.message));
      page.on("console", msg => {if(msg.type()==="error") errors.push(msg.text());});
      await page.goto("http://127.0.0.1:4000/", {waitUntil:"networkidle"});
      assert.equal(await page.locator("main").count(), 1);
      for (const id of ["hero-title","highlights","research","selected-work","activities","contact"])
        assert.equal(await page.locator("#"+id).count(), 1);
      assert.equal(await page.locator("[data-slide]").count(), 3);
      assert.equal(await page.locator(".publication-row-v2").count(), 4);
      assert.equal(await page.locator(".activity-card").count(), 2);
      const carousel = page.locator("[data-carousel]");
      await carousel.scrollIntoViewIfNeeded();
      const active = async n => {
        await page.waitForFunction(n => document.querySelectorAll("[data-slide]")[n].getAttribute("aria-hidden")==="false",n);
        assert.equal(await page.locator('[data-slide][aria-hidden="false"]').count(),1);
      };
      await active(0);
      await page.waitForFunction(() => !document.querySelectorAll("video")[0].paused);
      const playing = async n => {
        await page.waitForFunction(n => Array.from(document.querySelectorAll("video")).every((v,i) => i===n ? !v.paused : v.paused),n);
      };
      await playing(0);
      await page.locator("[data-next]").click(); await active(1); await playing(1);
      await page.locator("[data-next]").click(); await active(2); await playing(-1);
      await page.locator("[data-next]").click(); await active(0); await playing(0);
      await page.locator("[data-prev]").click(); await active(2);
      await page.locator('[data-go="1"]').click(); await active(1);
      await carousel.focus(); await page.keyboard.press("ArrowLeft"); await active(0);
      await page.locator("[data-video-toggle]").first().click(); await playing(-1);
      await page.locator("[data-video-toggle]").first().click(); await playing(0);
      // Exercise rapid switches while play() promises may still be pending.
      await page.evaluate(() => {for(let i=0;i<8;i++) document.querySelector("[data-next]").click();});
      await active(2); await playing(-1);
      await page.locator('[data-go="0"]').click(); await playing(0);
      await page.locator("#contact").scrollIntoViewIfNeeded(); await playing(-1);
      await carousel.scrollIntoViewIfNeeded(); await playing(0);
      if(width<768) {
        // Pointer events verify the swipe recognizer; physical-device gestures still need manual review.
        await page.locator(".research-carousel__viewport").evaluate(el => {
          el.setPointerCapture=()=>{};
          el.dispatchEvent(new PointerEvent("pointerdown",{bubbles:true,pointerType:"touch",pointerId:1,clientX:250,clientY:80}));
          el.dispatchEvent(new PointerEvent("pointerup",{bubbles:true,pointerType:"touch",pointerId:1,clientX:70,clientY:85}));
        });
        await active(1); await playing(1);
      }
      await page.locator('[data-go="2"]').click(); await active(2);
      await page.waitForTimeout(450);
      const dimensions = await page.locator("[data-slide]").evaluateAll(els => els.map(el => ({w:el.offsetWidth,h:el.offsetHeight})));
      console.log("Slide dimensions", width, JSON.stringify(dimensions));
      await page.screenshot({path:"qa-output/layout-"+width+".png",fullPage:true});
      assert(await page.locator(".research-placeholder").evaluateAll(els => els.every(el => {
        const box=el.getBoundingClientRect();
        return Array.from(el.children).filter(child=>getComputedStyle(child).display!=="none").every(child=>{
          const r=child.getBoundingClientRect(); return r.top>=box.top-1&&r.bottom<=box.bottom+1;
        });
      })), "Placeholder text is clipped");
      assert(dimensions.every(d=>d.w===dimensions[0].w&&d.h===dimensions[0].h),"Slide dimensions differ");
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),"Page overflows horizontally");
      assert(await page.locator("img").evaluateAll(imgs=>imgs.every(img=>img.complete&&img.naturalWidth>0)),"Broken image");
      // Resolve every local homepage link and media reference against the built site.
      const urls = await page.locator("main a[href], main video source, main img").evaluateAll(els=>els.map(el=>el.href||el.src));
      for(const url of urls) {
        if(new URL(url).origin!=="http://127.0.0.1:4000") continue;
        const response = await page.request.get(url);
        assert(response.ok(), "Broken local resource: "+url);
      }
      assert.deepEqual(errors,[]);
      await page.screenshot({path:"qa-output/home-"+width+".png",fullPage:true});
      reports.push({width,result:"passed",dimensions,consoleErrors:errors});
      await context.close();
    }
    // Reduced-motion users get a still video until they explicitly press Play.
    const context = await browser.newContext({reducedMotion:"reduce"});
    const page = await context.newPage();
    await page.goto("http://127.0.0.1:4000/");
    await page.locator("[data-carousel]").scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    assert(await page.locator("video").evaluateAll(vs=>vs.every(v=>v.paused)));
    await page.locator("[data-video-toggle]").first().click();
    await page.waitForFunction(()=>!document.querySelector("video").paused);
    await context.close();
    fs.writeFileSync("qa-output/report.json",JSON.stringify({reports,reducedMotion:"passed"},null,2));
    console.log(JSON.stringify({reports,reducedMotion:"passed"}));
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exit(1);});
