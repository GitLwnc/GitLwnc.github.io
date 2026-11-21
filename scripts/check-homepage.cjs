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
async function checkCarouselRuntime(browser) {
  const reports=[];
  const state=page=>page.locator("video").evaluateAll(vs=>vs.map(v=>({
    currentSrc:v.currentSrc,src:v.getAttribute("src"),datasetSrc:v.dataset.src,
    muted:v.muted,defaultMuted:v.defaultMuted,paused:v.paused,readyState:v.readyState,
    networkState:v.networkState,currentTime:v.currentTime,duration:Number.isFinite(v.duration)?v.duration:null,
    error:v.error&&{code:v.error.code,message:v.error.message},videoWidth:v.videoWidth,videoHeight:v.videoHeight,
    codec:v.canPlayType('video/mp4; codecs="avc1.42E01E"'),
    soundText:v.closest("[data-slide]").querySelector("[data-sound-toggle]").textContent,
    soundPressed:v.closest("[data-slide]").querySelector("[data-sound-toggle]").getAttribute("aria-pressed"),
    soundLabel:v.closest("[data-slide]").querySelector("[data-sound-toggle]").getAttribute("aria-label")
  })));
  const enter=page=>page.evaluate(()=>{
    const r=document.querySelector(".research-carousel__viewport").getBoundingClientRect();
    scrollTo(0,scrollY+r.top-innerHeight*0.18);
  });
  const allPaused=page=>page.waitForFunction(()=>Array.from(document.querySelectorAll("video")).every(v=>v.paused));
  const progress=async(page,n)=>{
    await page.waitForFunction(n=>Array.from(document.querySelectorAll("video")).every((v,i)=>
      i===n?!v.paused&&!v.error&&v.readyState>=2&&v.videoWidth>0&&v.currentTime>0.05:v.paused),n,{timeout:12000});
    const samples=[];
    for(let i=0;i<3;i++) {
      samples.push((await state(page))[n]);
      if(i<2) await page.waitForTimeout(300);
    }
    for(let i=1;i<samples.length;i++) {
      const a=samples[i-1],b=samples[i];
      const delta=b.currentTime>=a.currentTime?b.currentTime-a.currentTime:b.duration-a.currentTime+b.currentTime;
      assert(delta>0.1&&delta<2,"Decoded video time must continue increasing");
      assert.equal(b.paused,false);assert.equal(b.error,null);
      assert.equal(b.soundText,b.muted?"Unmute":"Mute");
      assert.equal(b.soundPressed,String(!b.muted));
      assert.equal(b.soundLabel,b.muted?"Unmute video":"Mute video");
    }
    return samples;
  };
  const animation=async(page,selector)=> {
    const result=await page.evaluate(selector=>new Promise(resolve=>{
      const track=document.querySelector(".research-carousel__track");
      const x=()=>new DOMMatrixReadOnly(getComputedStyle(track).transform).m41;
      const before=x(),duration=getComputedStyle(track).transitionDuration,positions=[before];
      const start=performance.now();let running=false;
      document.querySelector(selector).click();
      function sample() {
        positions.push(x());
        running=running||track.getAnimations().some(a=>a.playState==="running");
        if(performance.now()-start<460) requestAnimationFrame(sample);
        else resolve({duration,before,after:x(),positions,running});
      }
      requestAnimationFrame(sample);
    }),selector);
    assert.equal(result.duration,"0.36s");
    assert(result.running,"A real transform transition must run");
    assert(Math.abs(result.after-result.before)>10,"Slide must move horizontally");
    assert(result.positions.some(x=>Math.abs(x-result.before)>1&&Math.abs(x-result.after)>1),"Transition must have intermediate horizontal positions");
    return result;
  };
  const instrument=async(context,abortMode)=>{
    await context.addInitScript(({abortMode})=>{
      window.__runtime={plays:[],intersections:[],overlap:[],abortMode,abortCount:0};
      const log=window.__runtime,play=HTMLMediaElement.prototype.play;
      HTMLMediaElement.prototype.play=function(){
        const v=this,record={src:v.dataset.src,readyState:v.readyState,at:performance.now()};
        log.plays.push(record);
        const interrupt=log.abortMode&&(!log.abortCount||log.abortMode==="always");
        // Make native play() genuinely pending, then interrupt it with a new load.
        // When readyState is already 4, play() may resolve before a queued microtask.
        if(interrupt) v.load();
        const result=play.call(v);
        if(interrupt) {log.abortCount++;v.load();}
        if(result&&result.then) result.then(()=>{record.result="resolved";record.time=v.currentTime;},
          e=>{record.result="rejected";record.name=e.name;record.message=e.message;});
        return result;
      };
      const IO=window.IntersectionObserver;
      window.IntersectionObserver=class extends IO {
        constructor(callback,options){super((entries,observer)=>{
          entries.forEach(e=>log.intersections.push({target:e.target.className,isIntersecting:e.isIntersecting,
            intersectionRatio:e.intersectionRatio,boundingClientRect:e.boundingClientRect.toJSON()}));
          callback(entries,observer);
        },options);}
      };
      document.addEventListener("DOMContentLoaded",()=>{
        setInterval(()=>{
          const playing=Array.from(document.querySelectorAll("video")).filter(v=>!v.paused);
          if(playing.length>1) log.overlap.push(playing.map(v=>v.dataset.src));
        },16);
      });
    },{abortMode});
  };
  for(const width of [1440,390]) for(const reducedMotion of ["no-preference","reduce"]) {
    const context=await browser.newContext({viewport:{width,height:480},isMobile:width<768,hasTouch:width<768,reducedMotion});
    const page=await context.newPage(),item={width,reducedMotion,events:[],steps:{}};
    reports.push(item);await instrument(context,null);
    page.on("pageerror",e=>item.events.push({type:"pageerror",message:e.message}));
    page.on("console",m=>{if(m.type()==="error") item.events.push({type:"console.error",message:m.text()});});
    page.on("requestfailed",r=>item.events.push({type:"requestfailed",url:r.url(),error:r.failure()}));
    page.on("response",r=>{if(r.url().includes(".mp4")) item.events.push({type:"mp4",status:r.status(),headers:r.headers(),url:r.url()});});
    try {
      await page.goto("http://127.0.0.1:4000/",{waitUntil:"networkidle"});
      item.steps.initial=await state(page);
      assert(item.steps.initial.every(v=>v.src===null&&v.paused),"Test A requires offscreen media to stay unloaded");
      assert(!item.events.some(e=>e.type==="mp4"),"Offscreen films must not be requested");
      await page.setViewportSize({width,height:width===1440?720:844});
      await enter(page);
      item.steps.first=await progress(page,0);
      assert(item.steps.first[0].muted&&item.steps.first[0].defaultMuted);
      item.steps.nextAnimation=await animation(page,"[data-next]");
      item.steps.second=await progress(page,1);
      item.steps.previousAnimation=await animation(page,"[data-prev]");
      item.steps.returnFirst=await progress(page,0);
      item.steps.dotAnimation=await animation(page,'[data-go="2"]');
      await allPaused(page);item.steps.third=await state(page);
      await animation(page,'[data-go="0"]');item.steps.returnFromThird=await progress(page,0);
      // The picture is offscreen while its caption is still visible.
      await page.evaluate(()=>{
        const viewport=document.querySelector(".research-carousel__viewport").getBoundingClientRect();
        const height=document.querySelector(".research-slide__media").getBoundingClientRect().height;
        scrollTo(0,scrollY+viewport.top+height+24);
      });
      await allPaused(page);item.steps.captionOnly=await state(page);
      assert(item.steps.captionOnly.every(v=>v.src===null),"Caption-only visibility must release media");
      await enter(page);item.steps.reenter=await progress(page,0);
      await page.locator("[data-video-toggle]").first().click();await allPaused(page);
      await page.locator("#contact").scrollIntoViewIfNeeded();await allPaused(page);
      await enter(page);await page.waitForTimeout(700);
      assert((await state(page)).every(v=>v.paused),"Manual pause must persist after re-entry");
      await page.locator("[data-video-toggle]").first().click();item.steps.manualPlay=await progress(page,0);
      await page.locator("[data-sound-toggle]").first().click();
      assert.equal((await state(page))[0].muted,false);
      assert.equal(await page.locator("[data-sound-toggle]").first().innerText(),"Mute");
      await page.locator("[data-sound-toggle]").first().click();
      assert.equal((await state(page))[0].muted,true);
      assert.equal(await page.locator("[data-sound-toggle]").first().innerText(),"Unmute");
      await page.evaluate(()=>{for(let i=0;i<12;i++) document.querySelector("[data-next]").click();});
      item.steps.rapidSwitches=await progress(page,0);
      await page.locator("#contact").scrollIntoViewIfNeeded();await allPaused(page);
      item.steps.leave=await state(page);
      await enter(page);item.steps.resume=await progress(page,0);
      await page.locator(".research-carousel").screenshot({path:"qa-output/autoplay-"+width+"-"+reducedMotion+".png"});
      assert(!item.events.some(e=>e.type==="pageerror"||e.type==="console.error"),"Unexpected browser error");
    } catch(error) {
      item.failure={name:error.name,message:error.message,video:await state(page)};
      await page.screenshot({path:"qa-output/runtime-failure-"+width+"-"+reducedMotion+".png",fullPage:true});
      throw error;
    } finally {
      item.trace=await page.evaluate(()=>window.__runtime);
      fs.writeFileSync("qa-output/carousel-state-machine.json",JSON.stringify(reports,null,2));
      console.log("CAROUSEL_RUNTIME",JSON.stringify(item));
      await context.close();
    }
    assert.deepEqual(item.trace.overlap,[],"Two films must never play together");
    assert(item.trace.intersections.some(e=>e.target==="research-carousel__viewport"&&e.isIntersecting),"Observe the fixed carousel viewport");
    assert(item.trace.plays.every(p=>p.readyState>=2),"Wait for decoded media readiness before play()");
  }
  for(const abortMode of ["once","always"]) {
    const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true});
    const page=await context.newPage(),item={scenario:"native-load-interruption",abortMode};
    reports.push(item);await instrument(context,abortMode);
    try {
      await page.goto("http://127.0.0.1:4000/",{waitUntil:"networkidle"});
      await enter(page);
      if(abortMode==="once") item.progress=await progress(page,0);
      else {
        await page.waitForFunction(()=>document.querySelector("[data-video-toggle]").textContent==="Retry video");
        const before=await page.evaluate(()=>window.__runtime.plays.length);
        await page.waitForTimeout(700);
        assert.equal(await page.evaluate(()=>window.__runtime.plays.length),before,"Abort retries must be bounded");
        assert.equal(before,2,"Only one automatic AbortError retry is allowed");
        await page.evaluate(()=>window.__runtime.abortMode=null);
        await page.locator("[data-video-toggle]").first().click();
        item.retryProgress=await progress(page,0);
      }
      item.trace=await page.evaluate(()=>window.__runtime);
      assert(item.trace.plays.some(p=>p.result==="rejected"&&p.name==="AbortError"),"Exercise native Chromium play rejection");
      assert(item.trace.plays.some(p=>p.result==="resolved"),"Recover after interruption");
      assert.deepEqual(item.trace.overlap,[]);
    } catch(error) {
      item.failure={name:error.name,message:error.message,video:await state(page)};
      item.trace=await page.evaluate(()=>window.__runtime);throw error;
    } finally {
      fs.writeFileSync("qa-output/carousel-state-machine.json",JSON.stringify(reports,null,2));
      console.log("CAROUSEL_RUNTIME",JSON.stringify(item));await context.close();
    }
  }
  return reports;
}

(async () => {
  fs.mkdirSync("qa-output", {recursive:true});
  const browser = await chromium.launch({channel:"chrome"});
  const reports = [], mediaReports=[];
  try {
    const carouselRuntime=await checkCarouselRuntime(browser);
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
      const initialCarouselVisible=await page.locator(".research-carousel__viewport").evaluate(el=>{
        const r=el.getBoundingClientRect();
        return r.bottom>0&&r.top<innerHeight&&r.right>0&&r.left<innerWidth;
      });
      if(!initialCarouselVisible) {
        assert.equal(await page.locator("video").first().getAttribute("src"),null,"Video must not load before Featured Research enters the viewport");
        assert.equal(await page.locator("video").first().evaluate(v=>v.paused),true,"Video must remain paused outside the viewport");
      }
      const posterPaths=await page.locator("video").evaluateAll(vs=>vs.map(v=>new URL(v.poster).pathname));
      assert.deepEqual(posterPaths,["/images/research/pre-poster-v4.jpg","/images/research/fracture-poster-v4.jpg"]);
      for(const posterPath of posterPaths) {
        const posterResponse=await page.request.get(new URL(posterPath,page.url()).href);
        assert(posterResponse.ok(),"Video poster must load: "+posterPath);
        assert((posterResponse.headers()["content-type"]||"").includes("image/jpeg"),"Video poster must be JPEG");
      }
      const hero=page.locator(".hero-v2");
      assert.equal(await hero.locator("#hero-title").innerText(),"Yuhan Yang");
      assert.deepEqual(await hero.locator(".hero-background__institution h3").allTextContents(),["Hunan University","KAIST"]);
      assert.deepEqual(await hero.locator(".hero-background__role").allTextContents(),[
        "Ph.D. Candidate · Geotechnical Engineering","Visiting Ph.D. Researcher · Mechanical Engineering"
      ]);
      assert.deepEqual(await hero.locator(".hero-background__date").allTextContents(),["Sep. 2021 – Expected Dec. 2026","Sep. 2025 – Mar. 2026"]);
      assert.deepEqual(await hero.locator(".hero-background__supervisor").allTextContents(),[
        "Supervisor: Prof. Chao Zhang","Supervisor: Prof. Hyoungsoo Kim"
      ]);
      assert.equal(await hero.locator(".hero-background__institution").nth(0).locator('a').getAttribute("href"),"https://chaozhanghnu.github.io/");
      assert.equal(await hero.locator(".hero-background__institution").nth(1).locator('a').getAttribute("href"),"https://fil.kaist.ac.kr/");
      assert.equal(await hero.locator(".hero-identity__links a").first().getAttribute("href"),"mailto:yhyang@hnu.edu.cn");
      assert.deepEqual(await hero.locator(".hero-identity__links a").allTextContents(),["Email","Google Scholar"]);
      assert.equal(await hero.locator(".hero-identity__links a").nth(1).getAttribute("href"),"https://scholar.google.com/citations?user=yfE9jJkAAAAJ&hl=zh-CN");
      assert(!(await hero.locator(".hero-identity__person").innerText()).includes("Ph.D. Candidate"),"Doctoral identity belongs to Hunan University");
      assert.equal(await hero.locator(".hero-background .hero-research, .hero-background .hero-v2__bio").count(),0);
      assert.equal(await hero.locator("h2").count(),1);
      assert.equal(await hero.locator("#hero-research-title").innerText(),"Research Profile");
      assert.equal(await hero.locator(".hero-research").getAttribute("aria-labelledby"),"hero-research-title");
      assert.equal(await hero.locator(".hero-focus, #research-focus-title").count(),0,"No duplicate Research Focus section");
      const focus="My doctoral research focuses on desiccation cracking and the hydro-mechanical behavior of variably saturated clayey soils.";
      const output="I have published five first-author papers in peer-reviewed journals, including Géotechnique and Physical Review E.";
      const future="My broader research interests include fracture in other porous media and soft materials, as well as the implications of soil desiccation cracking for engineering and geoscience.";
      const paragraphs=hero.locator(".hero-research .hero-v2__bio > p");
      assert.deepEqual(await paragraphs.allTextContents(),[focus,output,future]);
      assert.deepEqual(await paragraphs.nth(0).locator("strong").allTextContents(),["desiccation cracking"]);
      assert.deepEqual(await paragraphs.nth(1).locator("strong").allTextContents(),["five first-author papers","Géotechnique","Physical Review E"]);
      assert.deepEqual(await paragraphs.nth(1).locator("strong > em").allTextContents(),["Géotechnique","Physical Review E"]);
      assert.equal(await paragraphs.nth(2).locator("strong, b").count(),0);
      const heroText=await hero.innerText();
      for(const sentence of [focus,output,future]) assert.equal(heroText.split(sentence).length-1,1,"Research sentence repeated or missing");
      assert.equal(await page.locator("header nav[aria-label='Primary navigation']").count(),1);
      assert.deepEqual(await page.locator(".site-nav-v2 a").allTextContents(),["Publications","CV","Contact"]);
      assert.deepEqual(await page.locator(".site-nav-v2 a").evaluateAll(els=>els.map(el=>el.getAttribute("href"))),["/publications/","/cv/","/#contact"]);
      const heroLayout=await hero.evaluate(el=>{
        const pick=s=>el.querySelector(s);
        const rect=node=>{const r=node.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};};
        const info=node=>{const s=getComputedStyle(node);return {size:parseFloat(s.fontSize),weight:s.fontWeight,line:parseFloat(s.lineHeight)/parseFloat(s.fontSize),color:s.color};};
        const identity=pick(".hero-identity"),background=pick(".hero-background"),research=pick(".hero-research");
        const baseline=node=>{
          const probe=document.createElement("span");
          probe.setAttribute("aria-hidden","true");
          probe.style.cssText="display:inline-block;width:0;height:0;margin:0;padding:0;border:0;vertical-align:baseline";
          node.append(probe);
          const y=probe.getBoundingClientRect().top;
          probe.remove();
          return y;
        };
        const researchParagraphs=Array.from(pick(".hero-v2__bio").children);
        const paragraphRects=researchParagraphs.map(rect);
        const lastBaselines={
          left:baseline(background.querySelector(".hero-background__institution:last-child .hero-background__supervisor")),
          right:baseline(researchParagraphs[researchParagraphs.length-1])
        };
        return {
          siblings:identity.parentElement===research.parentElement,
          backgroundOnLeft:identity.contains(background),
          pictureSharesIdentity:pick(".hero-identity__person").contains(pick("#hero-title"))&&pick(".hero-identity__person").contains(pick("img")),
          linksUnderName:pick(".hero-identity__person h1").parentElement.contains(pick(".hero-identity__links")),
          identity:rect(identity),background:rect(background),research:rect(research),shell:rect(pick(".site-shell")),
          portrait:rect(pick("img")),name:rect(pick("h1")),nameType:info(pick("h1")),links:rect(pick(".hero-identity__links")),
          paragraphs:researchParagraphs.map(p=>({...info(p),margin:getComputedStyle(p).marginTop})),
          lastBaselines,
          researchTitle:{...info(pick("#hero-research-title")),...rect(pick("#hero-research-title"))},
          firstParagraph:rect(researchParagraphs[0]),
          paragraphGaps:paragraphRects.slice(1).map((r,i)=>r.top-paragraphRects[i].bottom),
          emphasis:Array.from(pick(".hero-v2__bio").querySelectorAll("strong, strong em")).map(node=>({
            weight:getComputedStyle(node).fontWeight,style:getComputedStyle(node).fontStyle,tag:node.tagName
          })),
          schools:Array.from(background.querySelectorAll(".hero-background__institution")).map(group=>({
            title:rect(group.querySelector("h3")),date:rect(group.querySelector(".hero-background__date")),
            titleType:info(group.querySelector("h3")),dateType:info(group.querySelector(".hero-background__date")),
            supervisorType:info(group.querySelector(".hero-background__supervisor")),roleType:info(group.querySelector(".hero-background__role"))
          })),
          linkType:info(pick(".hero-identity__links a")),
          height:el.getBoundingClientRect().height,pageHeight:document.documentElement.scrollHeight
        };
      });
      assert(heroLayout.siblings&&heroLayout.backgroundOnLeft,"Education belongs inside the left column, research is its right sibling");
      assert(heroLayout.pictureSharesIdentity&&heroLayout.linksUnderName,"Photo, name and identity links must stay grouped");
      assert(heroLayout.nameType.size>=30&&heroLayout.nameType.size<=32);
      assert.equal(heroLayout.nameType.weight,"700");
      assert.equal(heroLayout.linkType.size,14);
      assert.equal(heroLayout.linkType.weight,"400");
      assert(heroLayout.schools.every(g=>g.titleType.size===18&&g.titleType.weight==="600"&&g.dateType.size===14&&g.supervisorType.size===14&&g.roleType.size===16));
      assert(heroLayout.paragraphs.every(p=>p.size===18&&p.weight==="400"&&p.line>=1.5&&p.line<=1.6));
      assert(heroLayout.paragraphs.every(p=>p.color===heroLayout.paragraphs[0].color&&p.line===heroLayout.paragraphs[0].line));
      assert.equal(heroLayout.paragraphs[1].margin,heroLayout.paragraphs[2].margin);
      assert(heroLayout.emphasis.length===6&&heroLayout.emphasis.every(e=>e.weight==="600"),"All research emphasis must use semibold 600");
      assert(heroLayout.emphasis.filter(e=>e.tag==="EM").every(e=>e.style==="italic"),"Journal names must remain italic");
      assert(heroLayout.paragraphGaps.every(g=>g>=16&&g<=20)&&Math.abs(heroLayout.paragraphGaps[0]-heroLayout.paragraphGaps[1])<0.75,"Research paragraph spacing must stay consistent within 16–20px");
      assert.equal(heroLayout.researchTitle.size,await page.locator("#highlights-title").evaluate(el=>parseFloat(getComputedStyle(el).fontSize)),"Hero and Featured Research headings must use the same font size");
      assert.equal(heroLayout.researchTitle.weight,"600");
      assert(heroLayout.firstParagraph.top-heroLayout.researchTitle.bottom>=23.5&&heroLayout.firstParagraph.top-heroLayout.researchTitle.bottom>Math.max(...heroLayout.paragraphGaps),"Research title spacing must be at least 24px and exceed paragraph spacing");
      assert(heroLayout.schools.every(g=>Math.abs(g.roleType.line-1.45)<0.01&&Math.abs(g.supervisorType.line-1.45)<0.01),"School information should use compact, readable line height");
      assert(heroLayout.portrait.right<heroLayout.name.left,"Photo must be left of the name");
      assert(heroLayout.links.top>=heroLayout.name.bottom);
      assert(heroLayout.portrait.width>=90&&heroLayout.portrait.width<=100);
      assert(heroLayout.shell.width<=1120);
      if(width>900) {
        assert(heroLayout.identity.right<heroLayout.research.left);
        assert(Math.abs(heroLayout.identity.top-heroLayout.research.top)<1,"Columns must align at the top");
        assert(Math.abs(heroLayout.lastBaselines.left-heroLayout.lastBaselines.right)<0.75,"Final text baselines must align across desktop columns");
        assert(heroLayout.schools.every(g=>Math.abs(g.title.top+g.title.height-g.date.top-g.date.height)<5),"School and date should share a baseline when desktop space allows");
      } else assert(heroLayout.background.bottom<heroLayout.research.top,"Mobile order: identity, education, research");
      assert(await hero.locator("*").evaluateAll(els=>els.every(el=>el.getBoundingClientRect().right<=innerWidth+1)),"Hero content must not overflow");
      const typography=await page.locator(".home-v2 h2, .home-v2 h3, .expertise-group li, .publication-row-v2, .activity-card__description").evaluateAll(els=>els.map(el=>({
        tag:el.tagName,size:parseFloat(getComputedStyle(el).fontSize),weight:getComputedStyle(el).fontWeight
      })));
      assert(typography.every(t=>t.size===(t.tag==="H2"?(width<768?24:26):t.tag==="H3"?18:16)),"Shared typography must remain consistent across modules");
      if(width<768) {
        await page.locator(".site-nav-v2__button").click();
        assert(await page.locator(".site-nav-v2").isVisible(),"Mobile menu must open");
        await page.locator(".site-nav-v2__button").click();
        assert(await page.locator(".site-nav-v2").isHidden(),"Mobile menu must close");
      }
      const projects=page.locator(".research-index [data-go]");
      assert.equal(await projects.count(),3);
      for(const project of await projects.all()) assert(await project.isVisible(),"All project titles must be visible without switching");
      assert.equal(await page.locator(".research-index__item").nth(2).locator(".card-meta").innerText(),"Ongoing Research");
      const directoryLayout=await page.locator(".research-carousel").evaluate(root=>{
        const media=root.querySelector(".research-carousel__viewport").getBoundingClientRect(),index=root.querySelector(".research-index").getBoundingClientRect();
        return {mediaLeft:media.left,mediaRight:media.right,indexLeft:index.left,indexTop:index.top,mediaBottom:media.bottom};
      });
      if(width>900) assert(directoryLayout.mediaRight<directoryLayout.indexLeft,"Research directory must sit beside the media");
      else assert(directoryLayout.indexTop>directoryLayout.mediaBottom,"Narrow layouts must keep the directory beneath the media");
      console.log("HERO_LAYOUT",JSON.stringify({width,...heroLayout,typography,directoryLayout}));
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
      const sectionOrder=await page.locator("main > section[id]").evaluateAll(nodes=>nodes.map(node=>node.id));
      assert.deepEqual(sectionOrder,["highlights","selected-work","research","activities","contact"]);
      assert.equal(await page.locator(".expertise-group").count(),3);
      assert.equal(await page.locator(".expertise-group p").count(),0);
      assert.deepEqual(await page.locator(".expertise-group h3").allTextContents(),[
        "Experimental Methods","Theory & Analysis","Numerical Modelling"
      ]);
      const expertiseSkills=await page.locator(".expertise-group").evaluateAll(groups=>
        groups.map(group=>Array.from(group.querySelectorAll("li"),li=>li.textContent.trim()))
      );
      assert.deepEqual(expertiseSkills,[
        ["Fracture Toughness Testing","Digital Image Correlation (DIC)","High-Speed Imaging","Micro-PIV","Microstructural Characterization (MIP, SEM, SAXS)"],
        ["Fracture Mechanics","Unsaturated Soil Mechanics","Fractal & Scaling Analysis","Percolation & Critical Phenomena","Interfacial Mechanics"],
        ["Phase-Field Fracture Modelling","Finite Element Method (FEM)","Discrete Element Method (DEM)"]
      ]);
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
          assert.equal(await row.locator(".publication-doi").evaluate(el=>getComputedStyle(el).fontSize),"14px");
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
        const record=publicationRecords.find(p=>p.record_id===recordId),item=page.locator("[data-research-item]").nth(slide);
        assert.equal(await item.locator(".research-slide__authors").innerText(),markedAuthors(record));
        assert.equal(normalized(await item.locator(".research-slide__venue").innerText()),markedAuthors(record)+" · "+record.venue+" · "+record.year);
        assert.equal(await item.locator(":scope > .text-link").getAttribute("href"),"https://doi.org/"+record.doi);
      }
      assert.equal(await page.locator("[data-research-item]").nth(2).locator(".research-slide__authors").count(),0);
      // Autoplay is viewport-gated: it starts only if the carousel is visible on arrival.
      if(initialCarouselVisible) {
        await page.waitForFunction(() => {
          const video=document.querySelector("[data-slide] video");
          return video && !video.paused && !video.error && video.readyState>=2 && video.currentTime>0.05;
        }, null, {timeout:15000});
      } else {
        assert.equal(await page.locator("video").first().getAttribute("src"),null,
          "Hidden carousel must not preload its video on page entry");
      }
      assert.equal(await page.locator("video").first().evaluate(v=>v.muted),true,"Autoplay must start muted");
      assert.equal(await page.locator("video").nth(1).getAttribute("src"),null,"Only the active video should load on page entry");
      assert(!videoRequests.some(url=>url.includes("fracture-toughness-v4.mp4")),"Inactive film loaded at startup");
      assert.equal(await page.locator(".activity-card").count(), 4);
      const carousel = page.locator("[data-carousel]");
      await carousel.scrollIntoViewIfNeeded();
      await page.waitForFunction(() => {
        const video=document.querySelector("[data-slide] video");
        return video && !video.paused && !video.error && video.readyState>=2 && video.currentTime>0.05;
      },null,{timeout:15000});
      const active = async n => {
        await page.waitForFunction(n => document.querySelectorAll("[data-slide]")[n].getAttribute("aria-hidden")==="false",n);
        assert.equal(await page.locator('[data-slide][aria-hidden="false"]').count(),1);
      };
      if(width===1440) {
        for(const path of await page.locator("video").evaluateAll(ss=>ss.map(s=>s.dataset.src))) {
          const response=await page.request.get(new URL(path,page.url()).href);
          console.log("MEDIA_HTTP", JSON.stringify({path,status:response.status(),type:response.headers()["content-type"],bytes:(await response.body()).length}));
          assert.equal(response.status(),200); assert((response.headers()["content-type"]||"").includes("video/mp4"));
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
          assert.equal(ranged.status(),206);
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
      assert.equal(await page.locator("video").first().evaluate(v=>v.paused),true,"Previous slide video must pause when switching");
      assert.equal(await page.locator("video").nth(1).evaluate(v=>!v.paused),true,"New active slide video must autoplay");
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
      assert(await page.locator("video").evaluateAll(vs=>vs.every(v=>v.paused)),"Videos must pause when the carousel leaves the viewport");
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
      assert(mediaDimensions.every(r=>r.width<=1120&&r.height<360),"Research media should remain compact");
      assert(await page.locator(".research-slide__media video, .research-slide__media img").evaluateAll(els=>els.every(el=>getComputedStyle(el).objectFit==="contain")),"Research images must not be cropped");
      const publicationLayout=await page.locator(".publication-row-v2").evaluateAll(rows=>rows.map(row=>{const css=getComputedStyle(row);return {fontSize:parseFloat(css.fontSize),lineHeight:parseFloat(css.lineHeight)/parseFloat(css.fontSize),padding:parseFloat(css.paddingTop)};}));
      assert(publicationLayout.every(r=>r.fontSize===16&&r.lineHeight>=1.5&&r.lineHeight<=1.6&&r.padding===0),"APA list density is incorrect");
      const activityLayout=await page.locator(".activity-card").evaluateAll(cards=>cards.map(card=>{
        const image=card.querySelector(".activity-card__media").getBoundingClientRect(),body=card.querySelector(".activity-card__body").getBoundingClientRect(),r=card.getBoundingClientRect();
        return {width:r.width,height:r.height,imageWidth:image.width,imageHeight:image.height,textFirst:body.left<image.left,noOverlap:body.right<=image.left};
      }));
      assert(activityLayout.every(r=>r.imageWidth===(width<=360?64:width<768?80:96)&&Math.abs(r.imageWidth/r.imageHeight-4/3)<0.02&&r.textFirst&&r.noOverlap),"Activities must use small right-aligned thumbnails");
      if(width>=1024) assert(activityLayout.every(r=>r.height<=260),"Desktop activity cards should remain compact");
      const footerLayout=await page.evaluate(()=>{
        const contact=document.querySelector("#contact"),footer=document.querySelector(".page__footer"),cr=contact.getBoundingClientRect(),fr=footer.getBoundingClientRect();
        return {gap:fr.top-cr.bottom,bottomGap:document.documentElement.scrollHeight-(fr.bottom+window.scrollY),bodyBottomMargin:getComputedStyle(document.body).marginBottom,bodyBottomPadding:getComputedStyle(document.body).paddingBottom,footerPosition:getComputedStyle(footer).position,contactBackground:getComputedStyle(contact).backgroundColor,footerBackground:getComputedStyle(footer).backgroundColor};
      });
      assert(Math.abs(footerLayout.gap)<1,"Unexpected blank space after Contact");
      assert.equal(footerLayout.bodyBottomPadding,"0px");
      assert.equal(footerLayout.bodyBottomMargin,"0px");
      assert(Math.abs(footerLayout.bottomGap)<1,"Unexpected blank space below the footer");
      assert.equal(footerLayout.footerPosition,"static");
      assert.equal(footerLayout.contactBackground,footerLayout.footerBackground);
      assert.equal(await page.locator(".contact-links a").count(),3);
      const locations=await page.locator(".activity-card__location a").allTextContents();
      assert.deepEqual(locations,["Les Diablerets, Switzerland","New Orleans, USA","Jeongseon, South Korea","Daejeon, South Korea"]);
      assert((await page.locator(".activity-card").last().innerText()).includes("Joint Doctoral Training"));
      const descriptions=await page.locator(".activity-card").evaluateAll(cards=>Object.fromEntries(
        cards.map(card=>[card.querySelector("h3").textContent.trim(),card.querySelector(".activity-card__description").textContent.trim()])
      ));
      assert.deepEqual(descriptions,{
        "Gordon Research Conference":"Poster presentation: Patterns, mechanisms, and modeling of clay desiccation cracking.",
        "AGU Fall Meeting 2025":"Oral presentation: Measuring the fracture toughness of clayey soils across a wide suction range.",
        "80th Anniversary Conference of KSME":"Oral presentation: Role of pore-structure heterogeneity on clay desiccation cracking.",
        "KAIST":"Research topic: Crack suppression in drying colloidal suspensions via slippery substrates."
      });
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
      await hero.screenshot({path:"qa-output/hero-"+width+".png"});
      await page.screenshot({path:"qa-output/home-"+width+".png",fullPage:true});
      reports.push({width,result:"passed",dimensions,mediaDimensions,publicationLayout,activityLayout,footerLayout,consoleErrors:errors});
      await context.close();
    }
    // The homepage keeps muted autoplay and slide transitions active
    // even when the OS/browser requests reduced motion.
    const context = await browser.newContext({reducedMotion:"reduce"});
    const page = await context.newPage();
    await page.goto("http://127.0.0.1:4000/");
    await page.locator("[data-carousel]").scrollIntoViewIfNeeded();
    await page.waitForFunction(()=>{const v=document.querySelector("video");return !v.paused&&!v.error&&v.readyState>=2&&v.currentTime>0.1;});
    const track=page.locator(".research-carousel__track");
    assert.equal(await track.evaluate(el=>getComputedStyle(el).transitionDuration),"0.36s",
      "Research carousel slide transition must remain enabled");
    await page.locator("[data-next]").click();
    await page.waitForFunction(()=>Array.from(document.querySelector(".research-carousel__track").getAnimations())
      .some(animation=>animation.playState==="running"),null,{timeout:1000});
    assert(await page.locator("video").first().evaluate(v=>v.paused),
      "Previous video must pause during the slide transition");
    await page.waitForFunction(()=>{const v=document.querySelectorAll("video")[1];return !v.paused&&!v.error&&v.readyState>=2&&v.currentTime>0.1;});
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
    // Verify real mobile menu navigation as well as its open/close state.
    for(const width of [390,320]) {
      const menuContext=await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true});
      const menuPage=await menuContext.newPage();
      await menuPage.goto("http://127.0.0.1:4000/",{waitUntil:"domcontentloaded"});
      await menuPage.locator(".site-nav-v2__button").click();
      await menuPage.locator('.site-nav-v2 a[href="/cv/"]').click();
      await menuPage.waitForURL("**/cv/");
      assert.equal(await menuPage.locator(".publication-row-v2").count(),publicationRecords.length);
      await menuPage.goto("http://127.0.0.1:4000/",{waitUntil:"domcontentloaded"});
      await menuPage.locator(".site-nav-v2__button").click();
      await menuPage.locator('.site-nav-v2 a[href="/#contact"]').click();
      // The existing smooth-scroll plugin prevents the native hash update.
      await menuPage.waitForFunction(()=>{
        const r=document.querySelector("#contact").getBoundingClientRect();
        return scrollY>0&&r.top<innerHeight&&r.bottom>0;
      });
      assert.equal(new URL(menuPage.url()).pathname,"/");
      await menuContext.close();
    }
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
    fs.writeFileSync("qa-output/report.json",JSON.stringify({reports,mediaReports,carouselRuntime:carouselRuntime.map(r=>({width:r.width,reducedMotion:r.reducedMotion,scenario:r.scenario,abortMode:r.abortMode,result:"passed"})),reducedMotion:"autoplay-and-transition-enabled",autoplayDenied:"passed",publicationCounts:expectedCounts,jekyllPreview:"passed",decodedPlayback:"passed",fullSizeLinks:"passed",unsupportedCodecFallback:"passed",networkRetry:"passed"},null,2));
    console.log(JSON.stringify({reports,reducedMotion:"passed"}));
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exit(1);});
