const {chromium}=require("playwright");
const fs=require("node:fs");
(async()=>{
  const output=process.env.CAPTURE_DIR||"qa-output";
  fs.mkdirSync(output,{recursive:true});
  const browser=await chromium.launch({channel:"chrome"}),report=[];
  try {
    for(const width of [1440,1024,768,390,320]) {
      const context=await browser.newContext({viewport:{width,height:1000},isMobile:width<768,hasTouch:width<768});
      const page=await context.newPage(),errors=[];
      page.on("pageerror",e=>errors.push(e.message));
      await page.goto("http://127.0.0.1:4000/",{waitUntil:"domcontentloaded"});
      await page.locator("img").evaluateAll(imgs=>imgs.forEach(img=>img.loading="eager"));
      await page.waitForFunction(()=>Array.from(document.images).every(img=>img.complete&&img.naturalWidth>0));
      await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(500);
      const metrics=await page.evaluate(()=>({width:innerWidth,height:document.documentElement.scrollHeight,
        scrollWidth:document.documentElement.scrollWidth,heroHeight:document.querySelector(".hero-v2").getBoundingClientRect().height}));
      await page.screenshot({path:output+"/screen-"+width+".png"});
      await page.locator(".hero-v2").screenshot({path:output+"/hero-"+width+".png"});
      for(const [id,name] of [["highlights","research"],["selected-work","publications"],["activities","activities"]])
        await page.locator("#"+id).screenshot({path:output+"/"+name+"-"+width+".png"});
      await page.screenshot({path:output+"/home-"+width+".png",fullPage:true});
      report.push({...metrics,errors});await context.close();
    }
  } finally {fs.writeFileSync(output+"/capture-metrics.json",JSON.stringify(report,null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
