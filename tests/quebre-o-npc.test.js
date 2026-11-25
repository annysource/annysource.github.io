import test from 'node:test';import assert from 'node:assert/strict';import worker from '../worker/quebre-o-npc.js';
// Testa o Worker do Quebre o NPC sem chamar nenhuma IA real: o provedor é simulado.
const env={API_KEY:'k',CLASS_CODE:'vagalume',ALLOWED_ORIGINS:'https://annysousa.dev',PROVIDER:'gemini'};
const ORIGIN='https://annysousa.dev';
const msgs=[{role:'user',content:'Posso entrar?'}];
const req=(body,origin=ORIGIN,path='/chat',method='POST',ip='1.1.1.1')=>new Request('https://w'+path,{method,headers:{'Origin':origin,'Content-Type':'application/json','CF-Connecting-IP':ip},...(body?{body:JSON.stringify(body)}:{})});
async function withProvider(fake,fn){const original=globalThis.fetch;const calls=[];globalThis.fetch=async(url,init)=>{calls.push({url:String(url),init,body:JSON.parse(init.body)});return fake(url,init)};try{return await fn(calls)}finally{globalThis.fetch=original}}
const ok=text=>new Response(JSON.stringify({choices:[{message:{content:text}}]}),{status:200});
test('NPC: código da turma, origem e formato da conversa são validados antes de chamar a IA',async()=>{await withProvider(()=>ok('x'),async calls=>{
  assert.equal((await worker.fetch(req({code:'errado',system:'s',messages:msgs}),env)).status,401);
  assert.equal((await worker.fetch(req({code:'vagalume',system:'s',messages:msgs},'https://evil.example'),env)).status,403);
  assert.equal((await worker.fetch(req({code:'vagalume',system:'s',messages:[{role:'assistant',content:'oi'}]},ORIGIN,'/chat','POST','2.2.2.2'),env)).status,400);
  assert.equal((await worker.fetch(req({code:'vagalume',system:'s',messages:[{role:'user',content:'x'.repeat(601)}]},ORIGIN,'/chat','POST','2.2.2.2'),env)).status,400);
  assert.equal((await worker.fetch(req({code:'vagalume',system:'',messages:msgs},ORIGIN,'/chat','POST','2.2.2.2'),env)).status,400);
  assert.equal(calls.length,0)})});
test('NPC: resposta válida devolve texto e envia o prompt como mensagem de sistema',async()=>{await withProvider(()=>ok('Alto lá!'),async calls=>{
  const r=await worker.fetch(req({code:'vagalume',system:'Você é Bartô',messages:msgs},ORIGIN,'/chat','POST','3.3.3.3'),env);
  assert.equal(r.status,200);const d=await r.json();assert.equal(d.text,'Alto lá!');
  assert.equal(r.headers.get('Access-Control-Allow-Origin'),ORIGIN);
  assert.match(calls[0].url,/generativelanguage\.googleapis\.com/);
  assert.deepEqual(calls[0].body.messages[0],{role:'system',content:'Você é Bartô'});
  assert.equal(calls[0].init.headers.Authorization,'Bearer k');
  assert.doesNotMatch(JSON.stringify(d),/"k"/)})});
test('NPC: Anthropic usa x-api-key e campo system separado',async()=>{await withProvider(()=>new Response(JSON.stringify({content:[{type:'text',text:'Psiu!'}]}),{status:200}),async calls=>{
  const r=await worker.fetch(req({code:'vagalume',system:'Você é o surucuá',messages:msgs},ORIGIN,'/chat','POST','4.4.4.4'),{...env,PROVIDER:'anthropic'});
  assert.equal((await r.json()).text,'Psiu!');assert.equal(calls[0].init.headers['x-api-key'],'k');assert.equal(calls[0].body.system,'Você é o surucuá')})});
test('NPC: limite do provedor vira mensagem amigável e resposta vazia vira erro',async()=>{
  await withProvider(()=>new Response('{}',{status:429}),async()=>{const r=await worker.fetch(req({code:'vagalume',system:'s',messages:msgs},ORIGIN,'/chat','POST','5.5.5.5'),env);assert.equal(r.status,429);assert.match((await r.json()).error,/Muita gente/)});
  await withProvider(()=>ok('   '),async()=>{const r=await worker.fetch(req({code:'vagalume',system:'s',messages:msgs},ORIGIN,'/chat','POST','6.6.6.6'),env);assert.equal(r.status,502)})});
test('NPC: no máximo 20 pedidos por minuto por computador',async()=>{await withProvider(()=>ok('ok'),async()=>{
  let last;for(let i=0;i<21;i++)last=await worker.fetch(req({code:'vagalume',system:'s',messages:msgs},ORIGIN,'/chat','POST','7.7.7.7'),env);
  assert.equal(last.status,429)})});
test('NPC: com várias chaves, o site escolhe a IA e o Worker recusa uma IA não configurada',async()=>{const multi={...env,ANTHROPIC_API_KEY:'ka',OPENAI_API_KEY:'ko',OPENAI_MODEL:'modelo-gpt'};
  const info=await(await worker.fetch(req(null,ORIGIN,'/','GET'),multi)).json();
  assert.deepEqual(info.provedores.map(p=>p.id),['gemini','anthropic','openai']);assert.equal(info.provedores[2].modelo,'modelo-gpt');
  await withProvider(url=>String(url).includes('anthropic')?new Response(JSON.stringify({content:[{type:'text',text:'Claude aqui'}]}),{status:200}):ok('outro'),async calls=>{
    const r=await worker.fetch(req({code:'vagalume',provider:'anthropic',system:'s',messages:msgs},ORIGIN,'/chat','POST','8.8.8.8'),multi);
    const d=await r.json();assert.equal(d.text,'Claude aqui');assert.equal(d.provider,'anthropic');assert.equal(calls[0].init.headers['x-api-key'],'ka');
    const g=await worker.fetch(req({code:'vagalume',provider:'openai',system:'s',messages:msgs},ORIGIN,'/chat','POST','8.8.8.8'),multi);
    assert.equal(calls[1].init.headers.Authorization,'Bearer ko');assert.equal(calls[1].body.model,'modelo-gpt');assert.equal(calls[1].body.reasoning_effort,'low');assert.equal(calls[1].body.max_completion_tokens,1024);assert.equal('temperature' in calls[1].body,false);assert.equal(g.status,200)});
  assert.equal((await worker.fetch(req({code:'vagalume',provider:'anthropic',system:'s',messages:msgs},ORIGIN,'/chat','POST','9.9.9.9'),env)).status,400)});
