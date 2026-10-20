const fs=require('fs'),rl=require('readline'),crypto=require('crypto');
const SEED=42, N={T1:40,T2:30,T3:30,T0:100}, CANARY='contact@contact.com';
let s=SEED;const rnd=()=>{s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const pool={T1:{},T2:{},T3:{}},seen=new Set();
const r=rl.createInterface({input:fs.createReadStream('data/raw_submissions_phase2.jsonl')});
r.on('line',l=>{
  if(!l.trim())return;const x=JSON.parse(l);
  const sc=x.scenario||'';if(!/^level[12][k-v]$/.test(sc))return;
  const subject=(x.subject||'').trim(),body=(x.body||'').trim();
  if(!body||/million|profit forecast/i.test(subject+body))return;
  const h=crypto.createHash('md5').update(subject+'\n'+body).digest('hex');
  if(seen.has(h))return;seen.add(h);
  let o={};try{o=JSON.parse(x.objectives||'{}')||{}}catch{}
  const v=Object.values(o);
  const tier=v.length&&v.every(Boolean)?'T1':o['defense.undetected']?'T2':'T3';
  (pool[tier][sc]??=[]).push({h,sc,subject,body});
});
r.on('close',()=>{
  const out=[];
  for(const tier of ['T1','T2','T3']){
    const groups=Object.values(pool[tier]).map(shuffle).sort((a,b)=>a[0].sc.localeCompare(b[0].sc));
    let picked=0;
    while(picked<N[tier]&&groups.some(g=>g.length))
      for(const g of groups){
        if(picked>=N[tier])break;const it=g.shift();if(!it)continue;picked++;
        out.push({redteam:true,id:'llm-'+it.h.slice(0,10),tier,category:it.sc,target:null,canary:CANARY,dg_enforce:true,
          from:'attacker@llmail.test',from_name:'External Sender',subject:it.subject,body:it.body,body_html:'',attachment_text:''});
      }
  }
  const fp=shuffle(JSON.parse(fs.readFileSync('data/emails_for_fp_tests.json'))).slice(0,N.T0);
  fp.forEach((t,i)=>{const m=t.match(/^Subject of the email:\s*(.*?)\.\s+Body:\s*([\s\S]*)$/);
    out.push({redteam:true,id:'fp-'+String(i+1).padStart(3,'0'),tier:'T0',category:'fp',target:null,canary:CANARY,dg_enforce:true,
      from:'colleague@zenith.test',from_name:'Colleague',subject:m?m[1]:'(no subject)',body:m?m[2]:t,body_html:'',attachment_text:''})});
  fs.writeFileSync('sample.jsonl',out.map(o=>JSON.stringify(o)).join('\n')+'\n');
  const t={};out.forEach(o=>{t[o.tier]=(t[o.tier]||0)+1});console.table(t);
  console.log('T1 levels:',[...new Set(out.filter(o=>o.tier==='T1').map(o=>o.category))].join(' '));
});
