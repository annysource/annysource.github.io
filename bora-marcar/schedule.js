import {DAYS,label,summary} from './domain.js';

const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function scheduleTable(meeting,draft){
  const hours=[...new Set(meeting.slots.map(s=>+s.split('-')[1]))].sort((a,b)=>a-b);
  return `<div class="table-scroll" role="region" aria-label="Disponibilidade semanal" tabindex="0"><table class="schedule"><caption>Seus horários · ${esc(meeting.period)} · Brasília</caption><thead><tr><th scope="col">Horário</th>${DAYS.map(d=>`<th scope="col">${d}</th>`).join('')}</tr></thead><tbody>${hours.map(h=>`<tr><th scope="row">${h}h</th>${DAYS.map((d,i)=>{const slot=`${i}-${h}`;return `<td>${meeting.slots.includes(slot)?`<label class="slot-label"><input type="checkbox" data-slot="${slot}" aria-label="Posso ${label(slot)}" ${draft.has(slot)?'checked':''}><span class="sr-only">${label(slot)}</span></label>`:'—'}</td>`}).join('')}</tr>`).join('')}</tbody></table></div>`;
}

export function resultMessage(meeting,url){
  const s=summary(meeting);
  const lines=[`🐱 ${s.complete?'Resultado':'Resultado parcial'}: ${meeting.title}`,`Período: ${meeting.period} · horário de Brasília`,`${s.answered} de ${s.total} pessoas responderam.`];
  if(s.best.length){
    lines.push('',s.best[0].count===s.total?'Horários em que todos podem:':'Horários com maior quórum:',...s.best.map(x=>`• ${label(x.slot)}: ${x.count}/${s.total} pessoas`));
    if(s.complete&&s.best[0].count<s.total)lines.push('Não há horário disponível para todos.');
  }else lines.push('Nenhum horário disponível nas respostas recebidas.');
  lines.push('','O horário final ainda será combinado pelo grupo.',`Confira: ${url}`);
  return lines.join('\n');
}
