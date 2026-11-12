const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const publicationRecords = fs.readdirSync("_publications").filter(f=>f.endsWith(".md")).map(file=>{
  const text=fs.readFileSync("_publications/"+file,"utf8");
  const field=name=>(text.match(new RegExp("^"+name+": ['\\\"]?(.*?)['\\\"]?$","m"))||[])[1];
  return {title:field("title"),status:field("status"),citation:field("citation"),paperurl:field("paperurl")};
});
assert(publicationRecords.every(p=>["published","under_review","in_preparation"].includes(p.status)),"Unclassified publication record");
const expectedCounts = Object.fromEntries(["published","under_review","in_preparation"].map(status=>[status,publicationRecords.filter(p=>p.status===status).length]));
(async () => {
  fs.mkdirSync("qa-output", {recursive:true});
  const browser = await chromium.launch({channel:"chrome"});
  const reports = [];
  try {
    for (const width of [1440, 1024, 768, 390, 320]) {
      const context = await browser.newContext({viewport:{width,height:1000}, isMobile:width<768, hasTouch:width<768});
      const page = await context.newPage();
      const errors = [], videoRequests = [];
      page.on("request", request => {if(request.url().includes(".mp4")) videoRequests.push(decodeURI(request.url()));});
      page.on("pageerror", e => errors.push(e.message));
      page.on("console", msg => {if(msg.type()==="error") errors.push(msg.text());});
      await page.goto("http://127.0.0.1:4000/", {waitUntil:"networkidle"});
      assert.equal(await page.locator("main").count(), 1);
      for (const id of ["hero-title","highlights","research","selected-work","activities","contact"])
        assert.equal(await page.locator("#"+id).count(), 1);
      assert.equal(await page.locator("[data-slide]").count(), 3);
      assert.equal(await page.locator(".publication-row-v2").count(), publicationRecords.length);
      assert.equal(await page.locator("#highlights-title").textContent(), "Featured Research");
      assert.equal(await page.locator("#research-title").textContent(), "Research Expertise");
      assert.equal(await page.locator("#selected-work-title").textContent(), "Publications");
      assert.equal(await page.locator("#activities-title").textContent(), "Academic Activities");
      for(const phrase of ["Research in motion","From experiment to prediction","Exchange and collaboration"])
        assert(!(await page.locator("main").innerText()).includes(phrase));
      assert.equal(await page.locator(".expertise-group").count(),3);
      assert.equal(await page.locator(".expertise-group p").count(),0);
      const numbers=await page.locator(".publication-row-v2__number").allTextContents();
      assert.deepEqual(numbers.map(s=>s.trim()),publicationRecords.map((_,i)=>String(i+1).padStart(2,"0")));
      for(const [status,count] of Object.entries(expectedCounts))
        assert.equal(await page.locator('[data-publication-status="'+status+'"]').count(),count);
      for(const record of publicationRecords) {
        const row=page.locator(".publication-row-v2").filter({has:page.locator("h3",{hasText:record.title})});
        assert.equal(await row.locator("h3").innerText(),record.title);
        assert.equal(await row.locator(".publication-row-v2__authors").innerText(),record.citation.split(" (")[0]);
        if(record.paperurl) assert.equal(await row.locator(".publication-row-v2__details a").getAttribute("href"),record.paperurl);
      }
      assert(!videoRequests.some(url=>url.includes("Fracture toughness.mp4")),"Inactive film loaded at startup");
      assert.equal(await page.locator(".activity-card").count(), 2);
      const carousel = page.locator("[data-carousel]");
      await carousel.scrollIntoViewIfNeeded();
      const active = async n => {
        await page.waitForFunction(n => document.querySelectorAll("[data-slide]")[n].getAttribute("aria-hidden")==="false",n);
        assert.equal(await page.locator('[data-slide][aria-hidden="false"]').count(),1);
      };
      if(width===1440) {
        for(const path of await page.locator("video").evaluateAll(ss=>ss.map(s=>s.dataset.src))) {
          const response=await page.request.get(new URL(path,page.url()).href);
          console.log("MEDIA_HTTP", JSON.stringify({path,status:response.status(),type:response.headers()["content-type"],bytes:(await response.body()).length}));
          const ranged=await page.request.get(new URL(path,page.url()).href,{headers:{Range:"bytes=0-1023"}});
          console.log("MEDIA_RANGE",JSON.stringify({path,status:ranged.status(),headers:ranged.headers(),bytes:(await ranged.body()).length}));
        }
      }
      assert(await page.locator("video").first().evaluate(v=>!!v.canPlayType('video/mp4; codecs="avc1.42E01E"')),"The test browser must decode H.264");
      await active(0);
      await page.waitForFunction(() => !document.querySelectorAll("video")[0].paused);
      const playing = async n => {
        try {
          await page.waitForFunction(n => Array.from(document.querySelectorAll("video")).every((v,i) => i===n ? (!v.paused && !v.error && v.readyState >= 2 && v.currentTime > 0.05) : v.paused),n);
        } catch(error) {
          console.log("MEDIA_DIAGNOSTIC",JSON.stringify(await page.locator("video").evaluateAll(vs=>vs.map(v=>({
            paused:v.paused,muted:v.muted,ready:v.readyState,network:v.networkState,error:v.error&&{code:v.error.code,message:v.error.message},time:v.currentTime,videoWidth:v.videoWidth,
            src:v.currentSrc,source:v.getAttribute("src"),hidden:v.closest("[data-slide]").getAttribute("aria-hidden"),
            rootRect:JSON.stringify(v.closest("[data-carousel]").getBoundingClientRect())
          })))));
          await page.screenshot({path:"qa-output/failure-"+width+".png",fullPage:true});
          throw error;
        }
      };
      await playing(0);
      assert.equal(await page.locator("video").nth(1).getAttribute("src"),null);
      await page.locator("[data-sound-toggle]").first().click();
      assert.equal(await page.locator("video").first().evaluate(v=>v.muted),false);
      await page.locator("[data-next]").click(); await active(1); await playing(1);
      assert.equal(await page.locator("video").first().getAttribute("src"),null);
      await page.locator("[data-next]").click(); await active(2); await playing(-1);
      assert(await page.locator("video").evaluateAll(ss=>ss.every(s=>!s.hasAttribute("src"))));
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
      await page.locator("img").evaluateAll(imgs=>imgs.forEach(img=>img.loading="eager"));
      await page.waitForFunction(()=>Array.from(document.images).every(img=>img.complete&&img.naturalWidth>0));
      assert(await page.locator(".research-slide__media, .activity-card__media").evaluateAll(els=>els.every(el=>{
        const r=el.getBoundingClientRect(); return Math.abs(r.width/r.height-16/9)<0.02;
      })),"Media frames must be 16:9");
      assert(await page.locator(".publication-row-v2").evaluateAll(rows=>rows.every(row=>parseFloat(getComputedStyle(row).paddingTop)<=18)),"Publication rows are too loose");
      // Resolve every local homepage link and media reference against the built site.
      const urls = await page.locator("main a[href], main video[data-src], main img").evaluateAll(els=>els.map(el=>el.href||el.dataset.src||el.src));
      for(const target of urls) {
        const url=new URL(target,"http://127.0.0.1:4000/").href;
        if(new URL(url).origin!=="http://127.0.0.1:4000") continue;
        const response = await page.request.get(url);
        assert(response.ok(), "Broken local resource: "+url);
      }
      assert.deepEqual(errors,[]);
      // Capture after behavior checks: full-element screenshots can resize the viewport.
      if(width===1440||width===390) {
        for(let slide=0;slide<3;slide++) {
          await page.locator('[data-go="'+slide+'"]').click(); await active(slide);
          await page.waitForTimeout(450);
          await carousel.screenshot({path:"qa-output/research-"+width+"-0"+(slide+1)+".png"});
        }
      }
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
    // Exercise denied autoplay without disabling the user's manual play control.
    const deniedContext = await browser.newContext();
    const deniedPage = await deniedContext.newPage();
    const deniedErrors=[];
    deniedPage.on("pageerror",error=>deniedErrors.push(error.message));
    await deniedPage.addInitScript(()=>{
      const play=HTMLMediaElement.prototype.play;
      let userAllowed=false;
      document.addEventListener("click",event=>{if(event.target.closest("[data-video-toggle]")) userAllowed=true;},true);
      HTMLMediaElement.prototype.play=function(){
        return userAllowed?play.call(this):Promise.reject(new DOMException("Autoplay denied","NotAllowedError"));
      };
    });
    await deniedPage.goto("http://127.0.0.1:4000/");
    await deniedPage.locator("[data-carousel]").scrollIntoViewIfNeeded();
    await deniedPage.waitForTimeout(500);
    assert(await deniedPage.locator("video").first().evaluate(v=>v.paused&&!!v.poster));
    await deniedPage.locator("[data-video-toggle]").first().click();
    await deniedPage.waitForFunction(()=>!document.querySelector("video").paused);
    assert.deepEqual(deniedErrors,[]);
    await deniedContext.close();
    // Unsupported preview engines must get useful fallback guidance, not a blocked UI.
    const unsupportedContext=await browser.newContext();
    const unsupportedPage=await unsupportedContext.newPage();
    await unsupportedPage.addInitScript(()=>{HTMLMediaElement.prototype.canPlayType=function(){return "";};});
    await unsupportedPage.goto("http://127.0.0.1:4000/");
    await unsupportedPage.locator("[data-carousel]").scrollIntoViewIfNeeded();
    await unsupportedPage.waitForFunction(()=>document.querySelector("[data-video-message]").textContent.includes("H.264"));
    assert(await unsupportedPage.locator("[data-video-toggle]").first().isVisible());
    assert.equal(await unsupportedPage.locator("[data-full-video]").first().getAttribute("target"),"_blank");
    await unsupportedContext.close();
    // Click the actual full-size links and require native video decoding, not merely HTTP 200.
    const linkContext=await browser.newContext();
    const linkPage=await linkContext.newPage();
    await linkPage.goto("http://127.0.0.1:4000/");
    for(let film=0;film<2;film++) {
      await linkPage.locator('[data-go="'+film+'"]').click();
      const popupPromise=linkPage.waitForEvent("popup");
      await linkPage.locator("[data-full-video]").nth(film).click();
      const popup=await popupPromise;
      await popup.waitForLoadState("domcontentloaded");
      await popup.waitForFunction(()=>document.querySelector("video")&&document.querySelector("video").readyState>=2);
      assert(await popup.locator("video").evaluate(v=>!v.error&&v.videoWidth>0));
      await popup.close();
    }
    await linkContext.close();
    fs.writeFileSync("qa-output/report.json",JSON.stringify({reports,reducedMotion:"passed",autoplayDenied:"passed",publicationCounts:expectedCounts,jekyllPreview:"passed",decodedPlayback:"passed",fullSizeLinks:"passed",unsupportedCodecFallback:"passed"},null,2));
    console.log(JSON.stringify({reports,reducedMotion:"passed"}));
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exit(1);});
