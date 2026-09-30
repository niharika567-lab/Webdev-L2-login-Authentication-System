(function(){
  const $=s=>document.querySelector(s);
  const SESSION_MS=5*60*1000;
  const mem={};
  const store={
    get(k){try{const v=localStorage.getItem(k);return v?JSON.parse(v):null}catch(e){return mem[k]||null}},
    set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){mem[k]=v}},
    del(k){try{localStorage.removeItem(k)}catch(e){}delete mem[k]}
  };
  const users=()=>store.get('cv_users')||{};
  const norm=s=>s.trim().toLowerCase();
  let flash=null,tick=null;

  /* ---------- crypto ---------- */
  const toHex=b=>[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');
  const rndSalt=()=>toHex(crypto.getRandomValues(new Uint8Array(16)));
  async function derive(pw,saltHex){
    const salt=Uint8Array.from(saltHex.match(/../g).map(h=>parseInt(h,16)));
    const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(pw),'PBKDF2',false,['deriveBits']);
    return toHex(await crypto.subtle.deriveBits({name:'PBKDF2',salt,iterations:100000,hash:'SHA-256'},key,256));
  }

  /* ---------- identicon from hash ---------- */
  function identicon(hash){
    const b=hash.match(/../g).map(h=>parseInt(h,16));
    const hue=(b[0]*360/255)|0,fg=`hsl(${hue},65%,50%)`,bg=`hsl(${hue},40%,92%)`;
    let r='';
    for(let y=0;y<5;y++)for(let x=0;x<3;x++){
      if(b[y*3+x+2]%2===0){
        r+=`<rect x="${x*20+10}" y="${y*20}" width="20" height="20"/>`;
        if(x<2)r+=`<rect x="${(4-x)*20+10}" y="${y*20}" width="20" height="20"/>`;
      }
    }
    return `<svg viewBox="0 0 120 100" preserveAspectRatio="none"><rect width="120" height="100" fill="${bg}"/><g fill="${fg}">${r}</g></svg>`;
  }

  /* ---------- helpers ---------- */
  function setErr(inputId,errId,text){
    $('#'+errId).textContent=text||'';
    $('#'+inputId).classList.toggle('bad',!!text);
    return !text;
  }
  function msg(id,type,text){const m=$(id);m.className='msg '+(type||'');m.textContent=text||''}
  const pwRules=p=>({len:p.length>=8,num:/\d/.test(p),mix:/[a-z]/.test(p)&&/[A-Z]/.test(p),sym:/[^A-Za-z0-9]/.test(p)});

  /* ---------- session ---------- */
  const getSession=()=>{const s=store.get('cv_session');return s&&s.exp>Date.now()&&users()[s.id]?s:null};
  function logout(reason){
    store.del('cv_session');clearInterval(tick);
    flash=reason||null;
    location.hash='#/login';
    route();
  }

  /* ---------- router with guard ---------- */
  function show(name){
    document.querySelectorAll('.view').forEach(v=>v.classList.remove('show'));
    $('#v-'+name).classList.add('show');
  }
  function route(){
    const r=(location.hash.replace('#/','')||'login');
    const sess=getSession();
    if(r==='dashboard'){
      if(!sess){store.del('cv_session');flash='Please login to access the dashboard.';location.hash='#/login';return}
      return renderDash(sess);
    }
    if(sess&&(r==='login'||r==='register')){location.hash='#/dashboard';return}
    clearInterval(tick);
    if(r==='register'){show('register')}
    else{
      show('login');
      if(flash){msg('#mLog','err',flash);flash=null}else if($('#mLog').className.indexOf('ok')<0)msg('#mLog','');
    }
  }
  function renderDash(sess){
    const u=users()[sess.id];
    show('dashboard');
    $('#dName').textContent=u.id;
    $('#dSince').textContent='Member since '+new Date(u.created).toLocaleDateString();
    $('#ident').innerHTML=identicon(u.hash);
    $('#dRec').textContent=JSON.stringify({id:u.id,salt:u.salt.slice(0,12)+'…',hash:u.hash.slice(0,24)+'…',iterations:100000},null,2);
    clearInterval(tick);
    const upd=()=>{
      const left=sess.exp-Date.now();
      if(left<=0){logout('Session expired. Please login again.');return}
      const s=Math.ceil(left/1000);
      $('#dTimer').textContent=String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');
    };
    upd();tick=setInterval(upd,1000);
  }

  /* ---------- register ---------- */
  $('#rPw').addEventListener('input',e=>{
    const p=e.target.value,r=pwRules(p);
    ['len','num','mix','sym'].forEach(k=>$('#rl-'+k).classList.toggle('on',r[k]));
    const score=Object.values(r).filter(Boolean).length+(p.length>=12?1:0);
    const m=$('#meter');m.style.width=(score/5*100)+'%';
    m.style.background=score<=2?'var(--err)':score<=3?'#d97706':'var(--ok)';
  });
  $('#fReg').addEventListener('submit',async e=>{
    e.preventDefault();
    const id=norm($('#rId').value),pw=$('#rPw').value;
    let ok=setErr('rId','eRId',!id?'Username or email is required.':id.length<3?'Must be at least 3 characters.':/\s/.test(id)?'No spaces allowed.':'');
    const r=pwRules(pw);
    ok=setErr('rPw','ePw',!pw?'Password is required.':!r.len?'Password must be at least 8 characters.':!r.num?'Password must include at least 1 number.':'')&&ok;
    if(!ok)return;
    if(users()[id]){msg('#mReg','err','An account with this username/email already exists.');return}
    const btn=$('#bReg');btn.disabled=true;
    try{
      const salt=rndSalt(),hash=await derive(pw,salt);
      const all=users();all[id]={id,salt,hash,created:Date.now()};store.set('cv_users',all);
      $('#fReg').reset();['len','num','mix','sym'].forEach(k=>$('#rl-'+k).classList.remove('on'));$('#meter').style.width='0';
      msg('#mReg','');msg('#mLog','ok','Account created! Please login.');
      location.hash='#/login';
    }catch(err){msg('#mReg','err','Could not secure your password in this browser.')}
    btn.disabled=false;
  });

  /* ---------- login ---------- */
  $('#fLog').addEventListener('submit',async e=>{
    e.preventDefault();
    const id=norm($('#lId').value),pw=$('#lPw').value;
    let ok=setErr('lId','eLId',id?'':'Username or email is required.');
    ok=setErr('lPw','eLPw',pw?'':'Password is required.')&&ok;
    if(!ok)return;
    const btn=$('#bLog');btn.disabled=true;
    try{
      const u=users()[id];
      const hash=await derive(pw,u?u.salt:'00'.repeat(16)); // same work either way
      if(u&&hash===u.hash){
        store.set('cv_session',{id:u.id,exp:Date.now()+SESSION_MS});
        $('#fLog').reset();msg('#mLog','');
        location.hash='#/dashboard';
      }else msg('#mLog','err','Invalid credentials. Please try again.');
    }catch(err){msg('#mLog','err','Login failed. Please try again.')}
    btn.disabled=false;
  });

  /* ---------- misc ---------- */
  document.querySelectorAll('[data-toggle]').forEach(b=>b.addEventListener('click',()=>{
    const i=$('#'+b.dataset.toggle),h=i.type==='password';
    i.type=h?'text':'password';b.textContent=h?'Hide':'Show';
  }));
  $('#bOut').addEventListener('click',()=>{msg('#mLog','ok','You have been logged out.');logout()});
  window.addEventListener('hashchange',route);
  route();
})();