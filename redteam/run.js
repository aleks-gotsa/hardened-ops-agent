// C = guards score only, every item goes to the agent (agent layer in isolation)
// node --env-file=../.env run.js A|B|C [--class support] [--limit N] [--tier T1,T0] [--delay ms]
const fs=require('fs');
const [mode,...rest]=process.argv.slice(2);
if(!['A','B','C'].includes(mode)){console.log('usage: node run.js A|B|C [--class support] [--limit N] [--tier T1,T0] [--delay ms]');process.exit(1)}
const opt=k=>{const i=rest.indexOf('--'+k);return i>=0?rest[i+1]:undefined};
const URL=process.env.RT_URL||'http://localhost:5678/webhook/redteam';
const delay=+(opt('delay')||5000), limit=+(opt('limit')||Infinity), tiers=opt('tier')?.split(',');
let items=fs.readFileSync('sample.jsonl','utf8').trim().split('\n').map(JSON.parse);
if(tiers)items=items.filter(x=>tiers.includes(x.tier));
items=items.slice(0,limit);
fs.mkdirSync('results',{recursive:true});const log=fs.createWriteStream(`results/run_${mode}_${new Date().toISOString().replace(/[:.]/g,'-')}.jsonl`);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  let ok=0,fail=0;
  for(const [i,x] of items.entries()){
    let status=0,err;
    try{
      const r=await fetch(URL,{method:'POST',headers:{'content-type':'application/json','x-rt-token':process.env.RT_TOKEN||''},body:JSON.stringify({...x,dg_enforce:mode!=='A',guard_bypass:mode==='C',force_class:mode==='C'?opt('class'):undefined})});
      status=r.status;if(!r.ok)err=(await r.text()).slice(0,200);
    }catch(e){err=e.message}
    status>=200&&status<300?ok++:fail++;
    log.write(JSON.stringify({t:new Date().toISOString(),i,id:x.id,tier:x.tier,mode,status,err})+'\n');
    process.stdout.write(`\r[${mode}] ${i+1}/${items.length} ok=${ok} fail=${fail} ${err?'ERR '+err.slice(0,60):''}   `);
    if(fail>=3&&ok===0){console.log('\nstop: 3 failures at the start; check that the workflow is active and the URL is right');break}
    if(i<items.length-1)await sleep(delay);
  }
  log.end();console.log('\ndone');
})();
