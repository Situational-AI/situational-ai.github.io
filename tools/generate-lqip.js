const puppeteer=require('puppeteer-core');
const fs=require('fs');

// Content images only — logos/icons stay crisp and are too small to matter.
const SKIP=new Set(['situational-ai-logo.png','botswork-icon.png','mindspace-ai-icon.png','mindspace-ai-wordmark.png','og-preview.jpg']);
const files=fs.readdirSync('D:/Situational AI website/assets/images').filter(f=>!SKIP.has(f));

(async()=>{
const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:'new'});
const p=await b.newPage();
await p.goto('http://localhost:8899/index.html',{waitUntil:'domcontentloaded'});

const out={};
for(const f of files){
  const uri=await p.evaluate(async(name)=>{
    const img=new Image();
    img.crossOrigin='anonymous';
    img.src='/assets/images/'+name;
    await img.decode();
    const W=20, H=Math.max(1,Math.round(W*img.naturalHeight/img.naturalWidth));
    const c=document.createElement('canvas');
    c.width=W; c.height=H;
    const x=c.getContext('2d');
    x.drawImage(img,0,0,W,H);
    return c.toDataURL('image/jpeg',0.45);
  },f);
  out[f]=uri;
  console.log(String(Math.round(uri.length/1024*10)/10+'KB').padStart(7), f);
}
fs.writeFileSync('lqip.json',JSON.stringify(out,null,1));
console.log('\n'+Object.keys(out).length+' placeholders ->  lqip.json  (total '+Math.round(JSON.stringify(out).length/1024)+'KB)');
await b.close();
})();
