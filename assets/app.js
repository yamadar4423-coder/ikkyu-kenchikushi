/* 一級建築士 学習ノート 共通スクリプト */
(function (global) {
"use strict";

/* ============ 保存 ============ */
var APP = 'ikkyu_app';
function rd(k){ try{ return JSON.parse(localStorage.getItem(k)||'{}')||{}; }catch(e){ return {}; } }
function wr(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); return true; }catch(e){ return false; } }
function app(){ return rd(APP); }
function saveApp(o){ return wr(APP,o); }
function today(){ var d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }

/* 試験日（令和9年の公式発表前の暫定値。例年7月第4日曜） */
function examDate(){ return app().exam || '2027-07-25'; }
function daysLeft(){
  var t=new Date(examDate()+'T00:00:00'), n=new Date();
  n.setHours(0,0,0,0);
  return Math.round((t-n)/86400000);
}

/* 学習した日を記録し、連続日数を返す */
function touchDay(){
  var a=app(), d=a.days||[], t=today();
  if(d.indexOf(t)<0){ d.push(t); d.sort(); if(d.length>400) d=d.slice(-400); a.days=d; saveApp(a); }
  return streak();
}
function streak(){
  var d=(app().days||[]).slice().sort(), n=0, cur=new Date(); cur.setHours(0,0,0,0);
  if(d.indexOf(today())<0){ cur.setDate(cur.getDate()-1); }
  for(;;){
    var s=cur.getFullYear()+'-'+String(cur.getMonth()+1).padStart(2,'0')+'-'+String(cur.getDate()).padStart(2,'0');
    if(d.indexOf(s)<0) break;
    n++; cur.setDate(cur.getDate()-1);
  }
  return n;
}

/* ============ テーマ ============ */
function applyTheme(){
  var t=app().theme;
  if(!t){ t = (global.matchMedia && global.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark':'light'; }
  document.documentElement.setAttribute('data-theme', t==='dark'?'dark':'light');
  return t;
}
function toggleTheme(){
  var a=app();
  a.theme = (document.documentElement.getAttribute('data-theme')==='dark')?'light':'dark';
  saveApp(a); applyTheme();
}

/* ============ ステップ定義 ============ */
var STEPS=[
 {id:'S00',n:'0', t:'準備 ― 力学の土台',      s:'単位・つり合い・モーメント・支点・荷重・判別式', h:'structure/mechanics/S00.html', ready:true},
 {id:'S01',n:'1', t:'静定梁の応力',            s:'反力 → Q図・M図の描き方',          h:'structure/mechanics/S01.html', ready:true},
 {id:'S02',n:'2', t:'静定ラーメン・3ヒンジ',   s:'ラーメンのM図、3ヒンジ構造',      h:'structure/mechanics/S02.html', ready:true},
 {id:'S03',n:'3', t:'トラス',                  s:'節点法・切断法・ゼロ部材',        h:'structure/mechanics/S03.html', ready:true},
 {id:'S04',n:'4', t:'断面の性質と応力度',      s:'断面二次モーメント・応力度・コア', h:'structure/mechanics/S04.html'},
 {id:'S05',n:'5', t:'変形',                    s:'たわみ・たわみ角の公式',          h:'structure/mechanics/S05.html'},
 {id:'S06',n:'6', t:'不静定(1) 剛性と分担',    s:'剛比・分配率・水平剛性',          h:'structure/mechanics/S06.html'},
 {id:'S07',n:'7', t:'不静定(2) 解法',          s:'重ね合わせ・たわみ角法・分配法',  h:'structure/mechanics/S07.html'},
 {id:'S08',n:'8', t:'全塑性モーメント・崩壊荷重', s:'Mp・崩壊メカニズム・仮想仕事', h:'structure/mechanics/S08.html'},
 {id:'S09',n:'9', t:'座屈',                    s:'オイラー座屈・座屈長さ',          h:'structure/mechanics/S09.html'},
 {id:'S10',n:'10',t:'振動',                    s:'1質点系の固有周期',               h:'structure/mechanics/S10.html'},
 {id:'S11',n:'11',t:'総合演習',                s:'年度セットで時間を測る',          h:'structure/mechanics/S11.html'}
];

/* ============ 穴埋め ============ */
var curStep=null;

function initBlanks(stepId){
  curStep=stepId;
  var st=rd('ikkyu_'+stepId);
  var secs=document.querySelectorAll('section[data-sec]');
  Array.prototype.forEach.call(secs,function(sec){
    var sid=sec.getAttribute('data-sec');
    Array.prototype.forEach.call(sec.querySelectorAll('.bl'),function(el,i){
      var bid=sid+'-'+(i+1);
      el.setAttribute('data-id',bid);
      var ans=el.getAttribute('data-a');
      el.innerHTML='<span class="q">［ '+(i+1)+' ］</span><span class="a"></span>'+
                   '<span class="mk"><b class="o">○</b><b class="x">×</b></span>';
      el.querySelector('.a').textContent=ans;
      var m=st[bid]; if(m==='o'||m==='x') el.classList.add(m);
      el.addEventListener('click',function(e){
        var t=e.target;
        if(t.classList.contains('o')||t.classList.contains('x')){
          mark(el, t.classList.contains('o')?'o':'x');
          e.stopPropagation(); return;
        }
        el.classList.toggle('open');
      });
    });
    Array.prototype.forEach.call(sec.querySelectorAll('.tools button[data-act]'),function(b){
      b.addEventListener('click',function(){
        var act=b.getAttribute('data-act'), bls=sec.querySelectorAll('.bl');
        if(act==='show') Array.prototype.forEach.call(bls,function(x){x.classList.add('open');});
        if(act==='hide') Array.prototype.forEach.call(bls,function(x){x.classList.remove('open');});
        if(act==='review') startReview(sec);
        if(act==='reset'){
          if(!confirm(sid+' の○×を消しますか？')) return;
          var s=rd('ikkyu_'+curStep);
          Array.prototype.forEach.call(bls,function(x){
            x.classList.remove('o','x','open');
            delete s[x.getAttribute('data-id')];
            if(s.xctx) delete s.xctx[x.getAttribute('data-id')];
          });
          wr('ikkyu_'+curStep,s); refresh();
        }
      });
    });
  });
  refresh();
}

function mark(el,v){
  var s=rd('ikkyu_'+curStep), id=el.getAttribute('data-id');
  el.classList.remove('o','x'); el.classList.add(v);
  s[id]=v;
  s.xctx=s.xctx||{};
  if(v==='x') s.xctx[id]={a:el.getAttribute('data-a'), c:contextText(el)};
  else delete s.xctx[id];
  wr('ikkyu_'+curStep,s);
  refresh();
}

function contextText(el){
  var box=el.closest('li,td,p,.calc')||el.parentElement;
  var cl=box.cloneNode(true), t=cl.querySelector('.bl[data-id="'+el.getAttribute('data-id')+'"]');
  Array.prototype.forEach.call(cl.querySelectorAll('.bl'),function(b){
    b.textContent = (b===t) ? '［ ？ ］' : (b.getAttribute('data-a')||'＿');
  });
  return (cl.textContent||'').replace(/\s+/g,' ').trim().slice(0,220);
}

function refresh(){
  var st=rd('ikkyu_'+curStep), go=0, gt=0;
  Array.prototype.forEach.call(document.querySelectorAll('section[data-sec]'),function(sec){
    var bls=sec.querySelectorAll('.bl'), o=0, x=0;
    Array.prototype.forEach.call(bls,function(b){
      if(b.classList.contains('o')) o++; else if(b.classList.contains('x')) x++;
    });
    var c=sec.querySelector('.cnt');
    if(c) c.textContent='○ '+o+' ／ × '+x+' ／ 全 '+bls.length;
    var rb=sec.querySelector('[data-act="review"]');
    if(rb){ rb.textContent='×だけ復習 ('+x+')'; rb.disabled = x===0; }
    go+=o; gt+=bls.length;
  });
  st.done=go; st.total=gt; wr('ikkyu_'+curStep,st);
  var g=document.getElementById('gprog');
  if(g) g.textContent='穴埋め ○ '+go+'/'+gt+(st.score!=null?('　テスト '+st.score+'/'+(st.qn||5)):'');
}

/* ============ 復習カード ============ */
function startReview(scope){
  var list=[];
  Array.prototype.forEach.call((scope||document).querySelectorAll('.bl.x'),function(b){ list.push(b); });
  if(!list.length){ alert('×を付けた項目がありません。'); return; }
  var i=0;
  var ovl=document.createElement('div'); ovl.className='ovl';
  ovl.innerHTML='<div class="box"><div class="hd"><b></b><button class="cl">閉じる</button></div>'+
                '<div class="ctx"></div><div class="act"></div></div>';
  document.body.appendChild(ovl);
  var hd=ovl.querySelector('.hd b'), ctx=ovl.querySelector('.ctx'), act=ovl.querySelector('.act');
  ovl.querySelector('.cl').addEventListener('click',close);
  ovl.addEventListener('click',function(e){ if(e.target===ovl) close(); });
  function close(){ ovl.remove(); refresh(); }
  function draw(){
    if(i>=list.length){
      hd.textContent='復習おわり';
      ctx.innerHTML='<p>'+list.length+' 件を見直しました。まだ×が残っていれば、もう一度このボタンから回せます。</p>';
      act.innerHTML='<button class="pri">閉じる</button>';
      act.querySelector('button').addEventListener('click',close);
      return;
    }
    var el=list[i];
    hd.textContent='×だけ復習　'+(i+1)+' / '+list.length;
    var box=el.closest('li,td,p,.calc')||el.parentElement;
    var cl=box.cloneNode(true);
    Array.prototype.forEach.call(cl.querySelectorAll('.bl'),function(b){
      if(b.getAttribute('data-id')===el.getAttribute('data-id')) b.innerHTML='<span class="tgt">？</span>';
      else b.innerHTML='<span>'+(b.getAttribute('data-a')||'＿')+'</span>';
    });
    ctx.innerHTML=''; ctx.appendChild(cl);
    act.innerHTML='<button class="pri">答えを見る</button>';
    act.querySelector('button').addEventListener('click',function(){
      var t=ctx.querySelector('.tgt');
      if(t){ t.className='rev'; t.textContent=el.getAttribute('data-a'); }
      act.innerHTML='<button class="ok">できた ○</button><button class="ng">まだ ×</button>';
      act.querySelector('.ok').addEventListener('click',function(){ mark(el,'o'); i++; draw(); });
      act.querySelector('.ng').addEventListener('click',function(){ i++; draw(); });
    });
  }
  draw();
}

/* ============ 確認テスト（数値入力） ============ */
function initQuiz(stepId){
  var ins=document.querySelectorAll('.qz input[type=number]');
  if(!ins.length) return;
  var st=rd('ikkyu_'+stepId);
  Array.prototype.forEach.call(ins,function(inp,i){ if(st['e'+i]!=null) inp.value=st['e'+i]; });
  var g=document.getElementById('grade'), c=document.getElementById('gclear'), out=document.getElementById('score');
  if(g) g.addEventListener('click',function(){
    var s=rd('ikkyu_'+stepId), n=0;
    Array.prototype.forEach.call(ins,function(inp,i){
      var r=inp.parentElement.querySelector('.res');
      var v=parseFloat(inp.value), a=parseFloat(inp.getAttribute('data-a'));
      s['e'+i]=inp.value;
      var ok = inp.value!=='' && Math.abs(v-a)<0.01;
      if(ok) n++;
      if(r){ r.textContent=ok?'○':'×'; r.className='res '+(ok?'o':'x'); }
    });
    s.score=n; s.qn=ins.length; wr('ikkyu_'+stepId,s);
    var pass=Math.ceil(ins.length*0.8);
    if(out) out.textContent='得点 '+n+' / '+ins.length+(n>=pass?'　合格。次のステップへ進めます。':'　A〜C に戻って復習しましょう。');
    refresh();
  });
  if(c) c.addEventListener('click',function(){
    var s=rd('ikkyu_'+stepId);
    Array.prototype.forEach.call(ins,function(inp,i){
      inp.value=''; var r=inp.parentElement.querySelector('.res'); if(r) r.textContent='';
      delete s['e'+i];
    });
    delete s.score; wr('ikkyu_'+stepId,s);
    if(out) out.textContent=''; refresh();
  });
  if(st.score!=null && out) out.textContent='前回の得点 '+st.score+' / '+(st.qn||ins.length);
}

/* ============ 4択 ============ */
function initMC(stepId){
  var mcs=document.querySelectorAll('.mc');
  if(!mcs.length) return;
  var st=rd('ikkyu_'+stepId); st.mc=st.mc||{};
  Array.prototype.forEach.call(mcs,function(mc,qi){
    /* data-a は画面の選択肢番号と同じ 1 始まりで書く */
    var ans=parseInt(mc.getAttribute('data-a'),10)-1;
    var lis=mc.querySelectorAll('.opts li');
    Array.prototype.forEach.call(lis,function(li,oi){
      var inp=li.querySelector('input');
      inp.name='mc'+stepId+'_'+qi;
      if(st.mc['q'+qi]===oi){ inp.checked=true; }
      inp.addEventListener('change',function(){
        var s=rd('ikkyu_'+stepId); s.mc=s.mc||{}; s.mc['q'+qi]=oi; wr('ikkyu_'+stepId,s);
        Array.prototype.forEach.call(lis,function(l){ l.classList.remove('o','x'); });
        li.classList.add(oi===ans?'o':'x');
        if(oi!==ans){
          var c=mc.querySelector('.opts li:nth-child('+(ans+1)+')');
          if(c) c.classList.add('o');
        }
        var d=mc.querySelector('details'); if(d) d.open=true;
      });
    });
    if(st.mc['q'+qi]!=null){
      var sel=st.mc['q'+qi];
      if(lis[sel]) lis[sel].classList.add(sel===ans?'o':'x');
      if(sel!==ans && lis[ans]) lis[ans].classList.add('o');
    }
  });
}

/* ============ チェックリスト ============ */
function initChecklist(stepId){
  var st=rd('ikkyu_'+stepId); st.ck=st.ck||{};
  Array.prototype.forEach.call(document.querySelectorAll('.chk input[type=checkbox]'),function(c,i){
    var id=c.getAttribute('data-ck')||('ck'+i);
    c.setAttribute('data-ck',id);
    if(st.ck[id]) c.checked=true;
    c.addEventListener('change',function(){
      var s=rd('ikkyu_'+stepId); s.ck=s.ck||{};
      if(c.checked) s.ck[id]=1; else delete s.ck[id];
      wr('ikkyu_'+stepId,s);
    });
  });
}

/* ============ タイマー ============ */
function initTimer(){
  Array.prototype.forEach.call(document.querySelectorAll('[data-timer]'),function(host){
    var mins=parseFloat(host.getAttribute('data-timer'))||10;
    var el=document.createElement('div'); el.className='tmr';
    el.innerHTML='<span class="t">'+pad(mins*60)+'</span><button class="go">開始</button><button class="rs">戻す</button>';
    host.appendChild(el);
    var left=mins*60, id=null, t=el.querySelector('.t'), go=el.querySelector('.go');
    function pad(s){ var m=Math.floor(s/60); return String(m).padStart(2,'0')+':'+String(Math.round(s%60)).padStart(2,'0'); }
    function tick(){ left--; t.textContent=pad(Math.max(0,left));
      if(left<=0){ stop(); t.style.color='var(--ng)'; } }
    function stop(){ if(id){clearInterval(id); id=null;} go.textContent='開始'; }
    go.addEventListener('click',function(){
      if(id){ stop(); return; }
      id=setInterval(tick,1000); go.textContent='一時停止';
    });
    el.querySelector('.rs').addEventListener('click',function(){ stop(); left=mins*60; t.textContent=pad(left); t.style.color=''; });
    t.textContent=pad(left);
  });
  function pad(s){ var m=Math.floor(s/60); return String(m).padStart(2,'0')+':'+String(Math.round(s%60)).padStart(2,'0'); }
}

/* ============ 進捗の書き出し・読み込み ============ */
function exportAll(){
  var o={v:1, at:new Date().toISOString(), data:{}};
  for(var i=0;i<localStorage.length;i++){
    var k=localStorage.key(i);
    if(k && k.indexOf('ikkyu_')===0) o.data[k]=localStorage.getItem(k);
  }
  return JSON.stringify(o);
}
function importAll(txt){
  var o;
  try{ o=JSON.parse(txt); }catch(e){ return {ok:false,msg:'読み取れませんでした。テキストが途中で切れていないか確認してください。'}; }
  if(!o || !o.data) return {ok:false,msg:'この教材の進捗データではないようです。'};
  var n=0;
  for(var k in o.data){ if(k.indexOf('ikkyu_')===0){ localStorage.setItem(k,o.data[k]); n++; } }
  return {ok:true,msg:n+' 件を読み込みました。'};
}

/* ============ ヘッダ ============ */
function header(opts){
  var h=document.querySelector('header .hin');
  if(!h) return;
  var b=document.createElement('span'); b.className='hbtns';
  b.innerHTML='<button id="thm" title="表示を切り替え">🌓</button>';
  h.appendChild(b);
  document.getElementById('thm').addEventListener('click',toggleTheme);
  if(opts && opts.step){
    var a=app();
    a.last={step:opts.step, title:opts.title||document.title, url:opts.url||location.pathname.split('/').pop()};
    saveApp(a);
    touchDay();
  }
}

/* ============ 図（SVG） ============ */
var DEFS='<defs>'+
 '<marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="currentColor"/></marker>'+
 '<marker id="ab" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="currentColor"/></marker>'+
 '<marker id="ag" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="currentColor"/></marker>'+
 '</defs>';
function hatch(x1,x2,y,dir){
  var s='<line x1="'+x1+'" y1="'+y+'" x2="'+x2+'" y2="'+y+'" class="gr"/>';
  for(var x=x1;x<x2;x+=6) s+='<line x1="'+x+'" y1="'+y+'" x2="'+(x-5)+'" y2="'+(y+6*dir)+'" class="gr"/>';
  return s;
}
function support(t,x,y){
  if(t==='pin') return '<polygon points="'+x+','+y+' '+(x-11)+','+(y+18)+' '+(x+11)+','+(y+18)+'" class="sp"/>'+hatch(x-18,x+18,y+18,1);
  if(t==='roller') return '<polygon points="'+x+','+y+' '+(x-11)+','+(y+16)+' '+(x+11)+','+(y+16)+'" class="sp"/>'+
    '<circle cx="'+(x-6)+'" cy="'+(y+20)+'" r="3.5" class="sp"/><circle cx="'+(x+6)+'" cy="'+(y+20)+'" r="3.5" class="sp"/>'+hatch(x-18,x+18,y+24,1);
  if(t==='fixL'){ var s='<line x1="'+x+'" y1="'+(y-26)+'" x2="'+x+'" y2="'+(y+26)+'" class="gr" style="stroke-width:2"/>';
    for(var a=y-24;a<=y+24;a+=8) s+='<line x1="'+x+'" y1="'+a+'" x2="'+(x-8)+'" y2="'+(a+8)+'" class="gr"/>'; return s; }
  if(t==='fixR'){ var r='<line x1="'+x+'" y1="'+(y-26)+'" x2="'+x+'" y2="'+(y+26)+'" class="gr" style="stroke-width:2"/>';
    for(var b=y-24;b<=y+24;b+=8) r+='<line x1="'+x+'" y1="'+b+'" x2="'+(x+8)+'" y2="'+(b+8)+'" class="gr"/>'; return r; }
  if(t==='fixB') return '<line x1="'+(x-16)+'" y1="'+y+'" x2="'+(x+16)+'" y2="'+y+'" class="gr" style="stroke-width:2.5"/>'+hatch(x-16,x+16,y,1);
  if(t==='hinge') return '<circle cx="'+x+'" cy="'+y+'" r="5" class="sp"/>';
  return '';
}
/* 梁本体（支点・荷重・寸法）を 1 つの座標系に描く */
function beamLayer(o,sx,Y){
  var s='<line x1="'+sx(0)+'" y1="'+Y+'" x2="'+sx(o.L)+'" y2="'+Y+'" class="bm"/>';
  (o.sup||[]).forEach(function(p){
    s+=support(p.t,sx(p.x),Y);
    if(p.n){ var dx=(p.t==='fixL'?-22:p.t==='fixR'?12:-5), dy=(p.t.indexOf('fix')===0?-30:44);
      s+='<text x="'+(sx(p.x)+dx)+'" y="'+(Y+dy)+'" class="nm">'+p.n+'</text>'; }
  });
  (o.pts||[]).forEach(function(p){ s+='<text x="'+(sx(p.x)-5)+'" y="'+(Y+20)+'" class="nm">'+p.n+'</text>'; });
  (o.loads||[]).forEach(function(l){
    if(l.t==='P'){ var x=sx(l.x);
      s+='<g class="ld" color="var(--ng)"><line x1="'+x+'" y1="'+(Y-52)+'" x2="'+x+'" y2="'+(Y-4)+'" marker-end="url(#ah)"/></g>'+
         '<text x="'+(x+6)+'" y="'+(Y-40)+'" class="lt">'+l.l+'</text>'; }
    if(l.t==='w'){ var a=sx(l.x1), b=sx(l.x2);
      s+='<g class="ld" color="var(--ng)"><line x1="'+a+'" y1="'+(Y-34)+'" x2="'+b+'" y2="'+(Y-34)+'"/>';
      var n=Math.max(2,Math.round((b-a)/22));
      for(var i=0;i<=n;i++){ var xx=a+(b-a)*i/n; s+='<line x1="'+xx+'" y1="'+(Y-34)+'" x2="'+xx+'" y2="'+(Y-4)+'" marker-end="url(#ah)"/>'; }
      s+='</g><text x="'+((a+b)/2-28)+'" y="'+(Y-42)+'" class="lt">'+l.l+'</text>'; }
    if(l.t==='tri'){ var a2=sx(l.x1), b2=sx(l.x2), h=44;
      s+='<g class="ld" color="var(--ng)"><line x1="'+a2+'" y1="'+(Y-4)+'" x2="'+b2+'" y2="'+(Y-4-h)+'"/>';
      var n2=Math.max(2,Math.round((b2-a2)/22));
      for(var j=1;j<=n2;j++){ var x2=a2+(b2-a2)*j/n2, hh=h*j/n2;
        if(hh>10) s+='<line x1="'+x2+'" y1="'+(Y-4-hh)+'" x2="'+x2+'" y2="'+(Y-4)+'" marker-end="url(#ah)"/>'; }
      s+='</g><text x="'+(b2-40)+'" y="'+(Y-54)+'" class="lt">'+l.l+'</text>'; }
    if(l.t==='M'){ var xm=sx(l.x);
      s+='<g class="ld" color="var(--ng)"><path d="M '+(xm-14)+' '+(Y-16)+' A 16 16 0 1 1 '+(xm+14)+' '+(Y-16)+'" marker-end="url(#ah)"/></g>'+
         '<text x="'+(xm+18)+'" y="'+(Y-30)+'" class="lt">'+l.l+'</text>'; }
  });
  (o.react||[]).forEach(function(r){
    var x=sx(r.x);
    if(r.t==='V') s+='<g class="rc" color="var(--acc)"><line x1="'+x+'" y1="'+(Y+58)+'" x2="'+x+'" y2="'+(Y+30)+'" marker-end="url(#ab)"/></g><text x="'+(x+6)+'" y="'+(Y+60)+'" class="rt">'+r.l+'</text>';
    if(r.t==='H') s+='<g class="rc" color="var(--acc)"><line x1="'+(x-40)+'" y1="'+(Y+8)+'" x2="'+(x-10)+'" y2="'+(Y+8)+'" marker-end="url(#ab)"/></g><text x="'+(x-46)+'" y="'+(Y+24)+'" class="rt">'+r.l+'</text>';
    if(r.t==='M') s+='<g class="rc" color="var(--acc)"><path d="M '+(x-14)+' '+(Y-16)+' A 16 16 0 1 1 '+(x+14)+' '+(Y-16)+'" marker-end="url(#ab)"/></g><text x="'+(x+18)+'" y="'+(Y-30)+'" class="rt">'+r.l+'</text>';
  });
  (o.dims||[]).forEach(function(d){
    var a=sx(d[0]), b=sx(d[1]), y=Y+(d[3]||62);
    s+='<g class="dm" color="var(--sub)"><line x1="'+a+'" y1="'+(y-6)+'" x2="'+a+'" y2="'+(y+6)+'"/>'+
       '<line x1="'+b+'" y1="'+(y-6)+'" x2="'+b+'" y2="'+(y+6)+'"/>'+
       '<line x1="'+(a+2)+'" y1="'+y+'" x2="'+(b-2)+'" y2="'+y+'" marker-start="url(#ag)" marker-end="url(#ag)"/></g>'+
       '<text x="'+((a+b)/2-12)+'" y="'+(y-4)+'" class="dt">'+d[2]+'</text>';
  });
  return s;
}

function beam(o){
  var W=o.W||480, H=170, X0=50, X1=W-50, Y=88;
  function sx(x){ return X0+(X1-X0)*x/o.L; }
  return '<svg class="fig" viewBox="0 0 '+W+' '+H+'" width="'+W+'">'+DEFS+beamLayer(o,sx,Y)+'</svg>';
}

/* 応力図。値は「下側引張を +」で渡す。
   Q は + を上に、M は + を下に描く（＝引張側に描く）。 */
function drawDia(d,L,sx,Y,DH,kind){
  var pts=d.pts;
  if(d.fn){ pts=[]; var n=d.n||30; for(var i=0;i<=n;i++){ var xx=L*i/n; pts.push([xx,d.fn(xx)]); } }
  var mx=0;
  pts.forEach(function(p){ mx=Math.max(mx,Math.abs(p[1])); });
  if(mx===0) mx=1;
  var k=(DH*0.34)/mx, flip=(kind==='M')?1:-1;
  function yv(v){ return Y+flip*v*k; }
  var poly=pts.map(function(p){ return sx(p[0])+','+yv(p[1]); }).join(' ');
  var col=(kind==='M')?'var(--acc)':'var(--ng)';
  var s='<g color="'+col+'">';
  s+='<polygon points="'+sx(pts[0][0])+','+Y+' '+poly+' '+sx(pts[pts.length-1][0])+','+Y+'" fill="currentColor" fill-opacity="0.16" stroke="none"/>';
  s+='<polyline points="'+poly+'" fill="none" stroke="currentColor" stroke-width="2.2"/>';
  s+='<line x1="'+sx(0)+'" y1="'+Y+'" x2="'+sx(L)+'" y2="'+Y+'" stroke="currentColor" stroke-width="1.4" stroke-opacity="0.55"/>';
  s+='</g>';
  s+='<text x="6" y="'+(Y+4)+'" class="nm" style="font-size:13px">'+(kind==='M'?'M図':'Q図')+'</text>';
  (d.marks||[]).forEach(function(m){
    var y=yv(m.v)+(flip*m.v>=0?15:-6);
    s+='<text x="'+(sx(m.x)-12)+'" y="'+y+'" style="font-size:12px;font-weight:600;fill:'+col+'">'+m.l+'</text>';
  });
  (d.zero||[]).forEach(function(z){
    s+='<line x1="'+sx(z)+'" y1="'+(Y-DH*0.4)+'" x2="'+sx(z)+'" y2="'+(Y+DH*0.4)+'" stroke="var(--sub)" stroke-width="1" stroke-dasharray="3 3"/>';
  });
  return s;
}

/* 梁と Q図・M図を同じ横位置で重ねて描く */
function beamSet(o){
  var W=o.W||480, X0=56, X1=W-46, DH=118;
  function sx(x){ return X0+(X1-X0)*x/o.L; }
  var yBeam=92, rows=[];
  if(o.Q) rows.push({k:'Q',d:o.Q});
  if(o.M) rows.push({k:'M',d:o.M});
  var H=178+rows.length*DH;
  var s='<svg class="fig" viewBox="0 0 '+W+' '+H+'" width="'+W+'">'+DEFS+beamLayer(o,sx,yBeam);
  rows.forEach(function(r,i){
    var Y=178+DH*i+DH/2;
    s+=drawDia(r.d,o.L,sx,Y,DH,r.k);
  });
  return s+'</svg>';
}

function frame(o){
  var W=200,H=150,x0=50,x1=150,yt=36,yb=112;
  var s='<svg class="fig" viewBox="0 0 '+W+' '+H+'" width="'+W+'">'+DEFS;
  s+='<polyline points="'+x0+','+yb+' '+x0+','+yt+' '+x1+','+yt+' '+x1+','+yb+'" fill="none" class="bm"/>';
  s+=support(o.t==='fix'?'fixB':'pin',x0,yb)+support(o.t==='fix'?'fixB':'pin',x1,yb);
  if(o.hinge) s+=support('hinge',(x0+x1)/2,yt);
  s+='<circle cx="'+x0+'" cy="'+yt+'" r="3" fill="currentColor"/><circle cx="'+x1+'" cy="'+yt+'" r="3" fill="currentColor"/>';
  return s+'</svg>';
}
/* ラーメン（骨組）の図。
   nodes: {A:[x,y],...} 模型座標（y は上が正、単位 m）
   members: [['A','B'],...]
   sup: [{n:'A',t:'pin'|'fix'|'roller'}]
   hinge: [[x,y],...]
   loads: [{t:'P',at:[x,y],d:'down'|'right'|'left',l:'12 kN'},
           {t:'w',from:[x,y],to:[x,y],l:'w'}]
   M: [{m:部材の添字, pts:[[t,v],...], fn:関数, n:分割数}]
      v は部材を p1→p2 に見たときの「左法線」向きを + とする符号つきの値。
      引張側に描くので、どちらが + かは図で確かめること。 */
function frameFig(o){
  var W=o.W||460, nodes=o.nodes, mem=o.members;
  var xs=[], ys=[], key;
  for(key in nodes){ xs.push(nodes[key][0]); ys.push(nodes[key][1]); }
  var minx=Math.min.apply(null,xs), maxx=Math.max.apply(null,xs);
  var miny=Math.min.apply(null,ys), maxy=Math.max.apply(null,ys);
  var mw=Math.max(0.001,maxx-minx), mh=Math.max(0.001,maxy-miny);
  var padL=o.padL||78, padR=o.padR||78, padT=o.padT||72, padB=o.padB||54;
  var k=Math.min((W-padL-padR)/mw, (o.maxH||190)/mh);
  var H=mh*k+padT+padB;
  function px(x){ return padL+(x-minx)*k; }
  function py(y){ return padT+(maxy-y)*k; }
  function P(n){ var p=(typeof n==='string')?nodes[n]:n; return [px(p[0]),py(p[1])]; }

  var s='<svg class="fig" viewBox="0 0 '+W+' '+Math.round(H)+'" width="'+W+'">'+DEFS;

  /* 応力図（部材の下に敷く） */
  (o.M||[]).forEach(function(d){
    var mm=mem[d.m], a=nodes[mm[0]], b=nodes[mm[1]];
    var dx=b[0]-a[0], dy=b[1]-a[1], len=Math.sqrt(dx*dx+dy*dy);
    var ux=dx/len, uy=dy/len, nx=-uy, ny=ux;   /* 左法線 */
    var pts=d.pts;
    if(d.fn){ pts=[]; var nn=d.n||24; for(var i=0;i<=nn;i++){ var t=i/nn; pts.push([t,d.fn(t)]); } }
    var mx=0; pts.forEach(function(p){ mx=Math.max(mx,Math.abs(p[1])); });
    if(mx===0) mx=1;
    var sc=(o.mScale||46)/mx;
    var poly=pts.map(function(p){
      var bx=a[0]+dx*p[0], by=a[1]+dy*p[0];
      return (px(bx)+nx*p[1]*sc)+','+(py(by)-ny*p[1]*sc);
    }).join(' ');
    var A=P(mm[0]), B=P(mm[1]);
    s+='<g color="var(--acc)">'+
       '<polygon points="'+A[0]+','+A[1]+' '+poly+' '+B[0]+','+B[1]+'" fill="currentColor" fill-opacity="0.16" stroke="none"/>'+
       '<polyline points="'+poly+'" fill="none" stroke="currentColor" stroke-width="2.2"/></g>';
    (d.marks||[]).forEach(function(m){
      var bx=a[0]+dx*m.t, by=a[1]+dy*m.t;
      var X=px(bx)+nx*m.v*sc, Y=py(by)-ny*m.v*sc;
      s+='<text x="'+(X+(m.dx||6))+'" y="'+(Y+(m.dy||-5))+'" style="font-size:12px;font-weight:600;fill:var(--acc)">'+m.l+'</text>';
    });
  });

  /* 部材 */
  mem.forEach(function(m){
    var A=P(m[0]), B=P(m[1]);
    s+='<line x1="'+A[0]+'" y1="'+A[1]+'" x2="'+B[0]+'" y2="'+B[1]+'" class="bm"/>';
  });

  /* 剛節点の印 */
  (o.rigid||[]).forEach(function(n){ var A=P(n); s+='<circle cx="'+A[0]+'" cy="'+A[1]+'" r="3.4" fill="currentColor"/>'; });

  /* 支点 */
  (o.sup||[]).forEach(function(p){
    var A=P(p.n);
    if(p.t==='fix'){ s+='<line x1="'+(A[0]-17)+'" y1="'+A[1]+'" x2="'+(A[0]+17)+'" y2="'+A[1]+'" class="gr" style="stroke-width:2.5"/>'+hatch(A[0]-17,A[0]+17,A[1],1); }
    else s+=support(p.t,A[0],A[1]);
    if(p.l) s+='<text x="'+(A[0]-5)+'" y="'+(A[1]+(p.t==='fix'?-10:46))+'" class="nm">'+p.l+'</text>';
  });

  /* ヒンジ */
  (o.hinge||[]).forEach(function(h){ var A=P(h); s+='<circle cx="'+A[0]+'" cy="'+A[1]+'" r="5.2" class="sp"/>'; });

  /* 節点名 */
  (o.labels||[]).forEach(function(t){ var A=P(t.at); s+='<text x="'+(A[0]+(t.dx||-16))+'" y="'+(A[1]+(t.dy||-8))+'" class="nm">'+t.l+'</text>'; });

  /* 荷重 */
  (o.loads||[]).forEach(function(l){
    if(l.t==='P'){
      var A=P(l.at), x1,y1,x2,y2,tx,ty;
      if(l.d==='down'){ x1=A[0]; y1=A[1]-50; x2=A[0]; y2=A[1]-4; tx=A[0]+6; ty=A[1]-38; }
      else if(l.d==='right'){ x1=A[0]-52; y1=A[1]; x2=A[0]-5; y2=A[1]; tx=A[0]-58; ty=A[1]-9; }
      else { x1=A[0]+52; y1=A[1]; x2=A[0]+5; y2=A[1]; tx=A[0]+14; ty=A[1]-9; }
      s+='<g class="ld" color="var(--ng)"><line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" marker-end="url(#ah)"/></g>'+
         '<text x="'+tx+'" y="'+ty+'" class="lt">'+l.l+'</text>';
    }
    if(l.t==='w'){
      var a=P(l.from), b=P(l.to), top=Math.min(a[1],b[1])-32;
      s+='<g class="ld" color="var(--ng)"><line x1="'+a[0]+'" y1="'+top+'" x2="'+b[0]+'" y2="'+top+'"/>';
      var n=Math.max(2,Math.round((b[0]-a[0])/24));
      for(var i=0;i<=n;i++){ var xx=a[0]+(b[0]-a[0])*i/n; s+='<line x1="'+xx+'" y1="'+top+'" x2="'+xx+'" y2="'+(a[1]-4)+'" marker-end="url(#ah)"/>'; }
      s+='</g><text x="'+((a[0]+b[0])/2-24)+'" y="'+(top-8)+'" class="lt">'+l.l+'</text>';
    }
  });

  /* 寸法 */
  (o.dimX||[]).forEach(function(d){
    var a=px(d[0]), b=px(d[1]), y=py(miny)+(d[3]||44);
    s+='<g class="dm" color="var(--sub)"><line x1="'+a+'" y1="'+(y-6)+'" x2="'+a+'" y2="'+(y+6)+'"/><line x1="'+b+'" y1="'+(y-6)+'" x2="'+b+'" y2="'+(y+6)+'"/>'+
       '<line x1="'+(a+2)+'" y1="'+y+'" x2="'+(b-2)+'" y2="'+y+'" marker-start="url(#ag)" marker-end="url(#ag)"/></g>'+
       '<text x="'+((a+b)/2-12)+'" y="'+(y-4)+'" class="dt">'+d[2]+'</text>';
  });
  (o.dimY||[]).forEach(function(d){
    var x=px(minx)-(d[3]||40), a=py(d[0]), b=py(d[1]);
    s+='<g class="dm" color="var(--sub)"><line x1="'+(x-6)+'" y1="'+a+'" x2="'+(x+6)+'" y2="'+a+'"/><line x1="'+(x-6)+'" y1="'+b+'" x2="'+(x+6)+'" y2="'+b+'"/>'+
       '<line x1="'+x+'" y1="'+(a-2)+'" x2="'+x+'" y2="'+(b+2)+'" marker-start="url(#ag)" marker-end="url(#ag)"/></g>'+
       '<text x="'+(x-26)+'" y="'+((a+b)/2)+'" class="dt">'+d[2]+'</text>';
  });
  return s+'</svg>';
}

/* トラスの図。
   nodes: {A:[x,y],...}（模型座標、y は上が正）  members: [['A','B'],...]
   sup: [{n:'A',t:'pin'|'roller'}]  wall: {x, y1, y2}（片持ちトラスの壁）
   loads: [{n:'C',d:'down'|'up'|'left'|'right',l:'8 kN',below:true}]
   force: {部材の添字: 値}  値が + は引張で青、− は圧縮で赤、0 は灰色の破線
   hi: [強調する部材の添字]  cut: [[x,y],[x,y]] 切断線  labels / mlabels: 節点名と部材名 */
function trussFig(o){
  var W=o.W||460, nodes=o.nodes, mem=o.members, key, xs=[], ys=[];
  for(key in nodes){ xs.push(nodes[key][0]); ys.push(nodes[key][1]); }
  var minx=Math.min.apply(null,xs), maxx=Math.max.apply(null,xs);
  var miny=Math.min.apply(null,ys), maxy=Math.max.apply(null,ys);
  var mw=Math.max(0.001,maxx-minx), mh=Math.max(0.001,maxy-miny);
  var padL=o.padL||56, padR=o.padR||56, padT=o.padT||60, padB=o.padB||58;
  var k=Math.min((W-padL-padR)/mw,(o.maxH||170)/mh);
  var H=mh*k+padT+padB;
  function px(x){ return padL+(x-minx)*k; }
  function py(y){ return padT+(maxy-y)*k; }
  function P(n){ var p=(typeof n==='string')?nodes[n]:n; return [px(p[0]),py(p[1])]; }
  var s='<svg class="fig" viewBox="0 0 '+W+' '+Math.round(H)+'" width="'+W+'">'+DEFS;

  if(o.wall){
    var wx=px(o.wall.x)-8, wy1=py(o.wall.y2)-16, wy2=py(o.wall.y1)+16;
    s+='<line x1="'+wx+'" y1="'+wy1+'" x2="'+wx+'" y2="'+wy2+'" class="gr" style="stroke-width:2.4"/>';
    for(var yy=wy1; yy<wy2; yy+=8) s+='<line x1="'+wx+'" y1="'+yy+'" x2="'+(wx-8)+'" y2="'+(yy+8)+'" class="gr"/>';
  }
  mem.forEach(function(m,i){
    var A=P(m[0]), B=P(m[1]), col='var(--figink)', w=3, dash='';
    if(o.force && Object.prototype.hasOwnProperty.call(o.force,i)){
      var f=o.force[i];
      if(Math.abs(f)<1e-9){ col='var(--sub)'; w=2.2; dash=' stroke-dasharray="5 4"'; }
      else if(f>0){ col='var(--acc)'; w=4.2; }
      else { col='var(--ng)'; w=4.2; }
    }
    if(o.hi && o.hi.indexOf(i)>=0) w=6.5;
    s+='<line x1="'+A[0]+'" y1="'+A[1]+'" x2="'+B[0]+'" y2="'+B[1]+'" stroke="'+col+'" stroke-width="'+w+'" stroke-linecap="round"'+dash+'/>';
  });
  if(o.cut){
    var c1=P(o.cut[0]), c2=P(o.cut[1]);
    s+='<line x1="'+c1[0]+'" y1="'+c1[1]+'" x2="'+c2[0]+'" y2="'+c2[1]+'" stroke="var(--warn)" stroke-width="2.4" stroke-dasharray="7 5"/>';
    if(o.cutLabel) s+='<text x="'+(c1[0]+6)+'" y="'+(c1[1]+2)+'" style="font-size:12px;font-weight:700;fill:var(--warn)">'+o.cutLabel+'</text>';
  }
  (o.sup||[]).forEach(function(p){ var A=P(p.n); s+=support(p.t,A[0],A[1]+4); });
  for(key in nodes){ var N=P(key); s+='<circle cx="'+N[0]+'" cy="'+N[1]+'" r="4.6" class="sp"/>'; }
  (o.mlabels||[]).forEach(function(t){
    var m=mem[t.m], A=P(m[0]), B=P(m[1]);
    s+='<text x="'+((A[0]+B[0])/2+(t.dx==null?5:t.dx))+'" y="'+((A[1]+B[1])/2+(t.dy==null?-6:t.dy))+'" style="font-size:12px;font-weight:700;fill:'+(t.c||'var(--figink)')+'">'+t.l+'</text>';
  });
  (o.labels||[]).forEach(function(t){
    var A=P(t.n);
    s+='<text x="'+(A[0]+(t.dx==null?-7:t.dx))+'" y="'+(A[1]+(t.dy==null?-10:t.dy))+'" class="nm">'+t.l+'</text>';
  });
  (o.loads||[]).forEach(function(l){
    var A=P(l.n), x1, y1, x2, y2, tx, ty;
    if(l.d==='down' && l.below){ x1=A[0]; y1=A[1]+8; x2=A[0]; y2=A[1]+46; tx=A[0]+6; ty=A[1]+40; }
    else if(l.d==='down'){ x1=A[0]; y1=A[1]-50; x2=A[0]; y2=A[1]-8; tx=A[0]+6; ty=A[1]-38; }
    else if(l.d==='up'){ x1=A[0]; y1=A[1]+50; x2=A[0]; y2=A[1]+8; tx=A[0]+6; ty=A[1]+40; }
    else if(l.d==='right'){ x1=A[0]-52; y1=A[1]; x2=A[0]-8; y2=A[1]; tx=A[0]-58; ty=A[1]-9; }
    else { x1=A[0]+52; y1=A[1]; x2=A[0]+8; y2=A[1]; tx=A[0]+14; ty=A[1]-9; }
    s+='<g class="ld" color="var(--ng)"><line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" marker-end="url(#ah)"/></g>'+
       '<text x="'+tx+'" y="'+ty+'" class="lt">'+l.l+'</text>';
  });
  (o.dimX||[]).forEach(function(d){
    var a=px(d[0]), b=px(d[1]), y=py(miny)+(d[3]||40);
    s+='<g class="dm" color="var(--sub)"><line x1="'+a+'" y1="'+(y-6)+'" x2="'+a+'" y2="'+(y+6)+'"/><line x1="'+b+'" y1="'+(y-6)+'" x2="'+b+'" y2="'+(y+6)+'"/>'+
       '<line x1="'+(a+2)+'" y1="'+y+'" x2="'+(b-2)+'" y2="'+y+'" marker-start="url(#ag)" marker-end="url(#ag)"/></g>'+
       '<text x="'+((a+b)/2-12)+'" y="'+(y-4)+'" class="dt">'+d[2]+'</text>';
  });
  (o.dimY||[]).forEach(function(d){
    var x=px(o.dimYx==null?minx:o.dimYx)-(d[3]||34), a=py(d[0]), b=py(d[1]);
    s+='<g class="dm" color="var(--sub)"><line x1="'+(x-6)+'" y1="'+a+'" x2="'+(x+6)+'" y2="'+a+'"/><line x1="'+(x-6)+'" y1="'+b+'" x2="'+(x+6)+'" y2="'+b+'"/>'+
       '<line x1="'+x+'" y1="'+(a-2)+'" x2="'+x+'" y2="'+(b+2)+'" marker-start="url(#ag)" marker-end="url(#ag)"/></g>'+
       '<text x="'+(x-26)+'" y="'+((a+b)/2+4)+'" class="dt">'+d[2]+'</text>';
  });
  if(o.legend){
    s+='<text x="8" y="'+(Math.round(H)-8)+'" style="font-size:12px;font-weight:600">'+
       '<tspan fill="var(--acc)">━ 引張</tspan>　<tspan fill="var(--ng)">━ 圧縮</tspan>　<tspan fill="var(--sub)">┅ 0</tspan></text>';
  }
  return s+'</svg>';
}

function fig(id,html){ var el=document.getElementById(id); if(el) el.innerHTML=html; }
function figc(cap,html){ return '<figure>'+html+'<figcaption>'+cap+'</figcaption></figure>'; }
function supFig(t){
  var isF=(t==='fixL'), bx0=isF?40:30, cx=isF?40:80;
  var s='<svg class="fig" viewBox="0 0 160 110" width="160">'+DEFS+
        '<line x1="'+bx0+'" y1="40" x2="'+(bx0+100)+'" y2="40" class="bm"/>'+support(t,cx,40)+'<g class="rc" color="var(--acc)">';
  if(t==='roller') s+='<line x1="80" y1="100" x2="80" y2="72" marker-end="url(#ab)"/></g><text x="88" y="100" class="rt">V</text>';
  else if(t==='pin') s+='<line x1="80" y1="100" x2="80" y2="68" marker-end="url(#ab)"/><line x1="20" y1="52" x2="60" y2="52" marker-end="url(#ab)"/></g>'+
    '<text x="88" y="100" class="rt">V</text><text x="18" y="70" class="rt">H</text>';
  else if(isF) s+='<line x1="60" y1="100" x2="60" y2="52" marker-end="url(#ab)"/><line x1="6" y1="14" x2="46" y2="14" marker-end="url(#ab)"/>'+
    '<path d="M 86 24 A 16 16 0 1 1 114 24" marker-end="url(#ab)"/></g>'+
    '<text x="66" y="100" class="rt">V</text><text x="6" y="10" class="rt">H</text><text x="118" y="22" class="rt">M</text>';
  else s+='</g>';
  return s+'</svg>';
}

/* ============ Service Worker ============ */
function initSW(base){
  if(!('serviceWorker' in navigator) || location.protocol==='file:') return;
  navigator.serviceWorker.register((base||'')+'sw.js').catch(function(){});
}

/* ============ ページ初期化 ============ */
function initStep(stepId,opts){
  applyTheme();
  header({step:stepId, title:(opts&&opts.title)||document.title, url:(opts&&opts.url)});
  initBlanks(stepId);
  initQuiz(stepId);
  initMC(stepId);
  initChecklist(stepId);
  initTimer();
  initSW((opts&&opts.base)||'../../');
}

global.IKKYU={
  rd:rd, wr:wr, app:app, saveApp:saveApp, today:today,
  examDate:examDate, daysLeft:daysLeft, streak:streak, touchDay:touchDay,
  applyTheme:applyTheme, toggleTheme:toggleTheme, header:header,
  STEPS:STEPS, initStep:initStep, initBlanks:initBlanks, initQuiz:initQuiz,
  initMC:initMC, initChecklist:initChecklist, initTimer:initTimer,
  startReview:startReview, exportAll:exportAll, importAll:importAll,
  initSW:initSW, refresh:refresh,
  beam:beam, beamSet:beamSet, beamLayer:beamLayer, frame:frame, frameFig:frameFig, trussFig:trussFig, support:support, fig:fig, figc:figc, supFig:supFig, DEFS:DEFS
};
})(window);
