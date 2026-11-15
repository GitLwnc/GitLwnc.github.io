const {chromium}=require("playwright");
const fs=require("node:fs");
(async()=>{
  fs.mkdirSync("qa-output",{recursive:true});
  const browser=await chromium.launch({channel:"chrome"});
  const report=[];
  try {
    for(const [width,height,mode] of [[1440,720,"caption-only"],[390,844,"native-abort"]]) {
      const context=await browser.newContext({viewport:{width,height},isMobile:width<768,hasTouch:width<768});
      const page=await context.newPage(),events=[];
      page.on("console",m=>{if(m.type()==="error") events.push({type:"console.error",text:m.text()});});
      page.on("pageerror",e=>events.push({type:"pageerror",name:e.name,message:e.message}));
      page.on("requestfailed",r=>events.push({type:"requestfailed",url:r.url(),error:r.failure()}));
      page.on("response",r=>{if(r.url().includes(".mp4")) events.push({type:"mp4",url:r.url(),status:r.status(),headers:r.headers()});});
      await page.addInitScript(({nativeAbort})=>{
        window.__mediaTrace=[];
        const log=detail=>window.__mediaTrace.push({at:performance.now(),...detail});
        window.__mediaLog=log;
        const IO=window.IntersectionObserver;
        window.IntersectionObserver=class extends IO {
          constructor(callback,options) {super((entries,observer)=>{
            entries.forEach(e=>log({type:"intersection",target:e.target.className,isIntersecting:e.isIntersecting,ratio:e.intersectionRatio,rect:e.boundingClientRect.toJSON(),intersection:e.intersectionRect.toJSON()}));
            callback(entries,observer);
          },options);}
        };
        let aborted=false;
        const play=HTMLMediaElement.prototype.play;
        HTMLMediaElement.prototype.play=function(){
          const video=this,id=video.dataset.src;
          log({type:"play-call",id,ready:video.readyState,src:video.getAttribute("src")});
          const result=play.call(video);
          if(nativeAbort&&!aborted) {aborted=true;queueMicrotask(()=>{log({type:"injected-native-load",id});video.load();});}
          if(result&&result.then) result.then(()=>log({type:"play-resolved",id,time:video.currentTime}),e=>log({type:"play-rejected",id,name:e.name,message:e.message}));
          return result;
        };
        for(const name of ["load","pause"]) {
          const original=HTMLMediaElement.prototype[name];
          HTMLMediaElement.prototype[name]=function(){log({type:name,id:this.dataset.src,src:this.getAttribute("src"),ready:this.readyState,time:this.currentTime});return original.call(this);};
        }
        document.addEventListener("DOMContentLoaded",()=>{
          document.querySelectorAll("video").forEach(v=>{
            for(const name of ["loadstart","loadedmetadata","loadeddata","canplay","playing","waiting","emptied","abort","error"])
              v.addEventListener(name,()=>log({type:"video-"+name,id:v.dataset.src,ready:v.readyState,error:v.error&&{code:v.error.code,message:v.error.message}}));
          });
        });
      },{nativeAbort:mode==="native-abort"});
      await page.route("**/assets/js/home-carousel.js",async route=>{
        const response=await route.fetch();
        const source=(await response.text()).replace("function syncMedia() {",'function syncMedia() { window.__mediaLog({type:"syncMedia",inView:inView,index:index,hidden:document.hidden});');
        await route.fulfill({response,body:source});
      });
      const samples=[];
      const sample=async label=>{
        const state=await page.evaluate(()=>({
          scrollY,innerHeight,scripts:Array.from(document.scripts,s=>s.src),
          rects:Object.fromEntries(["[data-carousel]",".research-carousel__viewport",".research-slide__media"].map(s=>[s,document.querySelector(s).getBoundingClientRect().toJSON()])),
          videos:Array.from(document.querySelectorAll("video"),v=>({currentSrc:v.currentSrc,src:v.getAttribute("src"),datasetSrc:v.dataset.src,muted:v.muted,defaultMuted:v.defaultMuted,paused:v.paused,readyState:v.readyState,networkState:v.networkState,currentTime:v.currentTime,duration:Number.isFinite(v.duration)?v.duration:null,error:v.error&&{code:v.error.code,message:v.error.message},videoWidth:v.videoWidth,videoHeight:v.videoHeight,codec:v.canPlayType('video/mp4; codecs="avc1.42E01E"')}))
        }));
        samples.push({label,...state});
        console.log("RUNTIME_SAMPLE",JSON.stringify({width,height,mode,label,...state}));
      };
      await page.goto("http://127.0.0.1:4000/",{waitUntil:"networkidle"});
      await sample("initial");
      await page.evaluate(caption=>window.__captionOnly=caption,mode==="caption-only");
      await page.evaluate(()=>{const r=document.querySelector(".research-slide__media").getBoundingClientRect();window.scrollTo(0,scrollY+(window.__captionOnly?r.bottom+24:r.top-innerHeight*0.2));});
      await page.waitForTimeout(1600);await sample("enter");
      await page.waitForTimeout(900);await sample("time-progress");
      await page.screenshot({path:"qa-output/runtime-"+mode+"-"+width+".png"});
      const trace=await page.evaluate(()=>window.__mediaTrace);
      const item={width,height,mode,events,samples,trace};report.push(item);
      console.log("RUNTIME_TRACE",JSON.stringify(item));
      await context.close();
    }
  } finally {fs.writeFileSync("qa-output/carousel-boundaries.json",JSON.stringify(report,null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
