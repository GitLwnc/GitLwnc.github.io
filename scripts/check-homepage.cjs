const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const {execFileSync}=require("node:child_process");
const publicationRecords=JSON.parse(execFileSync("ruby",["scripts/check-publications.rb"],{encoding:"utf8"}));
const expectedCounts=Object.fromEntries(["published","under_review","in_preparation"].map(status=>[status,publicationRecords.filter(p=>p.status===status).length]));
const publishedRecords=publicationRecords.filter(p=>p.status==="published").sort((a,b)=>a.display_order-b.display_order);
const manuscriptRecords=["under_review","in_preparation"].flatMap(status=>publicationRecords.filter(p=>p.status===status).sort((a,b)=>a.display_order-b.display_order));
const markedAuthors=record=>(record.corresponding_authors||[]).reduce((text,name)=>text.replace(name,name+"*"),record.authors||"");
const normalized=s=>s.replace(/\s+/g," ").trim();
(async () => {
  fs.mkdirSync("qa-output", {recursive:true});
  const browser = await chromium.launch({channel:"chrome"});
  const reports = [], mediaReports=[];
  try {
    for (const width of [1440, 1024, 768, 390, 320]) {
      const context = await browser.newContext({viewport:{width,height:1000}, isMobile:width<768, hasTouch:width<768});
      const page = await context.newPage();
      const errors = [], videoRequests = [];
      page.on("request", request => {if(request.url().includes(".mp4")) videoRequests.push(decodeURI(request.url()));});
      page.on("response", async response=>{if(response.url().includes(".mp4")) console.log("MEDIA_BROWSER_HTTP",JSON.stringify({url:response.url(),status:response.status(),headers:response.headers()}));});
      page.on("requestfailed",request=>{if(request.url().includes(".mp4")) console.log("MEDIA_BROWSER_FAILED",JSON.stringify({url:request.url(),failure:request.failure()}));});
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
      assert.deepEqual(numbers.map(s=>s.trim()),[...publishedRecords.map((_,i)=>String(i+1).padStart(2,"0")),...manuscriptRecords.map((_,i)=>"M"+(i+1))]);
      assert.equal(normalized(await page.locator(".publication-counts").innerText()),expectedCounts.published+" Published · "+expectedCounts.under_review+" Under Review · "+expectedCounts.in_preparation+" In Preparation");
      for(const [status,count] of Object.entries(expectedCounts))
        assert.equal(await page.locator('[data-publication-status="'+status+'"]').count(),count);
      for(const record of publicationRecords) {
        const row=page.locator('[data-publication-id="'+record.record_id+'"]');
        assert.equal(await row.locator(".publication-title").innerText(),record.title);
        const own=row.locator('.publication-author[data-author-name="Yang, Y."] strong');
        assert.equal(await own.count(),record.authors?1:0);
        if(record.authors) {
          assert.equal(await row.locator(".publication-author strong").count(),1,"Only Yuhan Yang's author name should be bold");
          assert.equal(await own.innerText(),"Yang, Y.");
          assert.equal(await own.evaluate(el=>getComputedStyle(el).fontWeight),"700");
          const marked=await row.locator(".publication-author:has(.corresponding-mark)").evaluateAll(els=>els.map(el=>el.dataset.authorName));
          assert.deepEqual(marked,record.corresponding_authors||[]);
        }
        const citation=normalized(await row.locator(".publication-citation").innerText());
        if(record.status==="published") {
          const pagination=record.pages?", "+record.pages:record.article_number?", Article "+record.article_number:"";
          const expected=markedAuthors(record)+" ("+record.year+"). "+record.title+". "+record.venue+", "+record.volume+(record.issue?"("+record.issue+")":"")+pagination+". https://doi.org/"+record.doi;
          assert.equal(citation,expected,"Incomplete or repeated APA citation");
          assert.equal(await row.locator(".publication-doi").getAttribute("href"),"https://doi.org/"+record.doi);
          assert.equal(await row.locator("em").innerText(),record.venue+", "+record.volume);
          assert.equal(await row.locator(".publication-status").count(),0);
        } else {
          assert.equal(await row.locator(".publication-doi").count(),0);
          assert(citation.includes(record.status==="under_review"?"Under Review":"In Preparation"));
          assert.equal(await row.locator(".publication-status").evaluate(el=>getComputedStyle(el).fontWeight),"400");
          assert(!/\(20\d{2}\)/.test(citation),"Unpublished manuscript has a publication year");
        }
      }
      assert.equal(await page.locator(".publication-author-key").count(),1);
      assert.equal(await page.locator(".publication-author-key").innerText(),"Bold: Yuhan Yang; *: Corresponding author.");
      assert.deepEqual(publishedRecords.slice(0,3).map(p=>p.record_id),["fracture-toughness-measurement","suction-volume-evolution","stress-stiffness-anisotropies"]);
      assert(publishedRecords.every((p,i,ps)=>i===0||ps[i-1].year>=p.year));
      for(const [slide,recordId] of [[0,"nucleation-percolation"],[1,"fracture-toughness-measurement"]]) {
        const record=publicationRecords.find(p=>p.record_id===recordId),item=page.locator("[data-slide]").nth(slide);
        assert.equal(await item.locator(".research-slide__authors").innerText(),markedAuthors(record));
        assert.equal(normalized(await item.locator(".research-slide__venue").innerText()),markedAuthors(record)+" · "+record.venue+" · "+record.year);
        assert.equal(await item.locator(".research-slide__body > .text-link").getAttribute("href"),"https://doi.org/"+record.doi);
      }
      assert.equal(await page.locator("[data-slide]").nth(2).locator(".research-slide__authors").count(),0);
      assert(!videoRequests.some(url=>url.includes("fracture-toughness-v4.mp4")),"Inactive film loaded at startup");
      assert.equal(await page.locator(".activity-card").count(), 4);
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
          const body=await response.body();
          const {createHash}=require("node:crypto");
          const expectedVideo=path.includes("nucleation-percolation-v4")?{bytes:18834988,sha256:"88c072b988224faff59c159004c03ac71fe0fc3a09c6c87388f7ad491e8e9bba"}:{bytes:6147794,sha256:"6f953e146a195fe11857d70825aea8814ce82789b8d7130cc6a5eb9108551505"};
          assert.equal(body.length,expectedVideo.bytes);
          assert.equal(createHash("sha256").update(body).digest("hex"),expectedVideo.sha256,"Preview must serve the newly supplied video bytes");
          for(const range of ["bytes=0-1023","bytes="+(body.length-1024)+"-"]) {
            const conditional=await page.request.get(new URL(path,page.url()).href,{headers:{Range:range,"If-Range":response.headers().etag}});
            assert.equal(conditional.status(),206,"Matching If-Range must return video bytes");
            const expected=range==="bytes=0-1023"?body.subarray(0,1024):body.subarray(-1024);
            assert((await conditional.body()).equals(expected),"Conditional video range returned incorrect bytes");
          }
          const stale=await page.request.get(new URL(path,page.url()).href,{headers:{Range:"bytes=0-1023","If-Range":'"stale-validator"'}});
          assert.equal(stale.status(),200,"Stale If-Range must return the full file");
          assert((await stale.body()).equals(body));
          const ranged=await page.request.get(new URL(path,page.url()).href,{headers:{Range:"bytes=0-1023"}});
          console.log("MEDIA_RANGE",JSON.stringify({path,status:ranged.status(),headers:ranged.headers(),bytes:(await ranged.body()).length}));
        }
      }
      assert(await page.locator("video").first().evaluate(v=>!!v.canPlayType('video/mp4; codecs="avc1.42E01E"')),"The test browser must decode H.264");
      await active(0);
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
      const recordMedia=async film=>{
        if(width!==1440) return;
        const video=page.locator("video").nth(film);
        const metadata=await video.evaluate(v=>({width:v.videoWidth,height:v.videoHeight,ratio:v.videoWidth/v.videoHeight,duration:v.duration}));
        assert.equal(metadata.width,2160); assert.equal(metadata.height,708);
        assert(Math.abs(metadata.duration-(film===0?25.0143:22.0113))<0.1,"Unexpected new video duration");
        const frames=[];
        for(const time of [0.12,0.5,0.92].map(f=>Math.round(metadata.duration*f*100)/100)) {
          await video.evaluate((v,time)=>{v.currentTime=time;},time);
          await page.waitForFunction(({film,time})=>{const v=document.querySelectorAll("video")[film];return !v.seeking&&v.readyState>=2&&v.currentTime>=time;},{film,time});
          const bands=await video.evaluate(v=>{
            const canvas=document.createElement("canvas");canvas.width=v.videoWidth;canvas.height=v.videoHeight;
            const ctx=canvas.getContext("2d");ctx.drawImage(v,0,0);
            const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;
            const darkRow=y=>{let dark=0;for(let x=0;x<canvas.width;x++){const i=(y*canvas.width+x)*4;if(pixels[i]<16&&pixels[i+1]<16&&pixels[i+2]<16)dark++;}return dark/canvas.width>0.98;};
            let top=0,bottom=0;while(top<canvas.height&&darkRow(top))top++;while(bottom<canvas.height-top&&darkRow(canvas.height-1-bottom))bottom++;
            return {top,bottom};
          });
          frames.push({time,darkHorizontalBands:bands});
          if(time===Math.round(metadata.duration*0.5*100)/100) await video.screenshot({path:"qa-output/video-"+(film+1)+"-natural-frame.png"});
        }
        mediaReports.push({film:film+1,...metadata,frames});
      };
      await playing(0);
      await recordMedia(0);
      assert.equal(await page.locator("video").nth(1).getAttribute("src"),null);
      await page.locator("[data-sound-toggle]").first().click();
      assert.equal(await page.locator("video").first().evaluate(v=>v.muted),false);
      await page.locator("[data-next]").click(); await active(1); await playing(1);
      await recordMedia(1);
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
      const mediaDimensions=await page.locator(".research-slide__media").evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect();return {width:r.width,height:r.height,ratio:r.width/r.height};}));
      assert(mediaDimensions.every(r=>Math.abs(r.ratio-2160/708)<0.02),"Research media must match the real video ratio");
      assert(mediaDimensions.every(r=>r.width<=1080&&r.height<360),"Research media should remain compact");
      assert(await page.locator(".research-slide__media video, .research-slide__media img").evaluateAll(els=>els.every(el=>getComputedStyle(el).objectFit==="contain")),"Research images must not be cropped");
      const publicationLayout=await page.locator(".publication-row-v2").evaluateAll(rows=>rows.map(row=>{const css=getComputedStyle(row);return {fontSize:parseFloat(css.fontSize),lineHeight:parseFloat(css.lineHeight)/parseFloat(css.fontSize),padding:parseFloat(css.paddingTop)};}));
      assert(publicationLayout.every(r=>r.fontSize>=14&&r.fontSize<=15&&r.lineHeight>=1.4&&r.lineHeight<=1.5&&r.padding===0),"APA list density is incorrect");
      const activityLayout=await page.locator(".activity-card").evaluateAll(cards=>cards.map(card=>{
        const image=card.querySelector(".activity-card__media").getBoundingClientRect(),body=card.querySelector(".activity-card__body").getBoundingClientRect(),r=card.getBoundingClientRect();
        return {width:r.width,height:r.height,imageWidth:image.width,imageHeight:image.height,textFirst:body.left<image.left,noOverlap:body.right<=image.left};
      }));
      assert(activityLayout.every(r=>r.imageWidth===(width<768?80:120)&&Math.abs(r.imageWidth/r.imageHeight-4/3)<0.02&&r.textFirst&&r.noOverlap),"Activities must use small right-aligned thumbnails");
      if(width>=1024) assert(activityLayout.every(r=>r.height<=125),"Desktop activity rows are too tall");
      const footerLayout=await page.evaluate(()=>{
        const contact=document.querySelector("#contact"),footer=document.querySelector(".page__footer"),cr=contact.getBoundingClientRect(),fr=footer.getBoundingClientRect();
        return {gap:fr.top-cr.bottom,bodyBottomPadding:getComputedStyle(document.body).paddingBottom,footerPosition:getComputedStyle(footer).position,contactBackground:getComputedStyle(contact).backgroundColor,footerBackground:getComputedStyle(footer).backgroundColor};
      });
      assert(Math.abs(footerLayout.gap)<1,"Unexpected blank space after Contact");
      assert.equal(footerLayout.bodyBottomPadding,"0px");
      assert.equal(footerLayout.footerPosition,"static");
      assert.equal(footerLayout.contactBackground,footerLayout.footerBackground);
      assert.equal(await page.locator(".contact-links a").count(),3);
      const locations=await page.locator(".activity-card__location a").allTextContents();
      assert.deepEqual(locations,["Les Diablerets, Switzerland","New Orleans, USA","Jeongseon, South Korea","Daejeon, South Korea"]);
      assert((await page.locator(".activity-card").last().innerText()).includes("Joint Doctoral Training"));
      assert.equal(await page.locator(".activity-card__media img").count(),4);
      console.log("ROUND4_LAYOUT",JSON.stringify({width,mediaDimensions,publicationLayout,activityLayout,footerLayout}));
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
      if(width===1440||width===390) {
        await page.locator("#selected-work").screenshot({path:"qa-output/publications-"+width+".png"});
        await page.locator("#activities").screenshot({path:"qa-output/activities-"+width+".png"});
        await page.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));
        await page.screenshot({path:"qa-output/bottom-"+width+".png"});
      }
      await page.screenshot({path:"qa-output/home-"+width+".png",fullPage:true});
      reports.push({width,result:"passed",dimensions,mediaDimensions,publicationLayout,activityLayout,footerLayout,consoleErrors:errors});
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
    await page.waitForFunction(()=>{const v=document.querySelector("video");return !v.paused&&!v.error&&v.readyState>=2&&v.currentTime>0.1;});
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
    await deniedPage.waitForFunction(()=>{const v=document.querySelector("video");return !v.paused&&!v.error&&v.readyState>=2&&v.currentTime>0.1;});
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
    // A real failed request must keep Retry available and recover after the network returns.
    const retryContext=await browser.newContext();
    const retryPage=await retryContext.newPage();
    let denyMedia=true;
    await retryPage.route("**/*.mp4",route=>denyMedia?route.abort("failed"):route.continue());
    await retryPage.goto("http://127.0.0.1:4000/");
    await retryPage.locator("[data-carousel]").scrollIntoViewIfNeeded();
    await retryPage.waitForFunction(()=>document.querySelector("video").error!==null);
    await retryPage.waitForFunction(()=>document.querySelector("[data-video-toggle]").textContent==="Retry video");
    assert(await retryPage.locator("[data-video-toggle]").first().isVisible());
    assert.equal(await retryPage.locator("[data-video-message]").first().evaluate(el=>getComputedStyle(el).position),"static");
    denyMedia=false;
    await retryPage.locator("[data-video-toggle]").first().click();
    await retryPage.waitForFunction(()=>{const v=document.querySelector("video");return !v.error&&v.readyState>=2&&v.currentTime>0.1;});
    assert(await retryPage.locator("[data-video-message]").first().isHidden());
    await retryContext.close();
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
    // Existing publication URLs and navigation must survive the data update.
    const contentContext=await browser.newContext();
    const contentPage=await contentContext.newPage();
    for(const route of ["/publications/","/cv/","/research/",...publicationRecords.map(p=>p.permalink)]) {
      const response=await contentPage.goto("http://127.0.0.1:4000"+route);
      assert(response.ok(),"Broken publication or navigation route: "+route);
      if(route==="/publications/"||route==="/cv/") assert.equal(await contentPage.locator(".publication-row-v2").count(),publicationRecords.length);
    }
    for(const manuscript of manuscriptRecords) {
      await contentPage.goto("http://127.0.0.1:4000"+manuscript.permalink);
      assert(!(await contentPage.locator(".page__inner-wrap header").innerText()).includes("Published"));
      assert.equal(await contentPage.locator('meta[property="article:published_time"],meta[itemprop="datePublished"]').count(),0);
    }
    await contentContext.close();
    fs.writeFileSync("qa-output/report.json",JSON.stringify({reports,mediaReports,reducedMotion:"passed",autoplayDenied:"passed",publicationCounts:expectedCounts,jekyllPreview:"passed",decodedPlayback:"passed",fullSizeLinks:"passed",unsupportedCodecFallback:"passed",networkRetry:"passed"},null,2));
    console.log(JSON.stringify({reports,reducedMotion:"passed"}));
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exit(1);});
