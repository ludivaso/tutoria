import { useState, useRef, useEffect, useCallback } from "react";

function usePWA() {
  useEffect(()=>{
    const manifest={
      name:"TutorIA",short_name:"TutorIA",description:"Tu tutor personal inteligente",
      start_url:"/",display:"standalone",background_color:"#0F0A2E",theme_color:"#7C3AED",
      orientation:"portrait",
      icons:[{src:"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='%237C3AED'/><text y='.9em' font-size='80'>🚀</text></svg>",sizes:"any",type:"image/svg+xml"}],
    };
    const blob=new Blob([JSON.stringify(manifest)],{type:"application/json"});
    const url=URL.createObjectURL(blob);
    let link=document.querySelector("link[rel='manifest']");
    if(!link){link=document.createElement("link");link.rel="manifest";document.head.appendChild(link);}
    link.href=url;
    const metas=[
      ["mobile-web-app-capable","yes"],
      ["apple-mobile-web-app-capable","yes"],
      ["apple-mobile-web-app-status-bar-style","black-translucent"],
      ["apple-mobile-web-app-title","TutorIA"],
      ["theme-color","#7C3AED"],
      ["viewport","width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover"],
    ];
    metas.forEach(([n,c])=>{
      let m=document.querySelector(`meta[name='${n}']`);
      if(!m){m=document.createElement("meta");m.name=n;document.head.appendChild(m);}
      m.content=c;
    });
    document.title="TutorIA";
    return ()=>URL.revokeObjectURL(url);
  },[]);
}

const SB_URL  = "https://xayhewabzzjoxvrtbvys.supabase.co";
const SB_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhheWhld2Fienpqb3h2cnRidnlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NjAzMTYsImV4cCI6MjA4ODUzNjMxNn0.5nY-xdP73MTeV5nAyAM06YYJtJ3wpvZeosWlt5BF4E4";

const sb = {
  headers: (token) => ({
    "Content-Type": "application/json",
    "apikey": SB_ANON,
    "Authorization": `Bearer ${token || SB_ANON}`,
    "Prefer": "return=representation",
  }),
  async signUp(email, password) {
    const r = await fetch(`${SB_URL}/auth/v1/signup`, {
      method:"POST", headers:{"Content-Type":"application/json","apikey":SB_ANON},
      body: JSON.stringify({email,password}),
    });
    return r.json();
  },
  async signIn(email, password) {
    const r = await fetch(`${SB_URL}/auth/v1/token?grant_type=password`, {
      method:"POST", headers:{"Content-Type":"application/json","apikey":SB_ANON},
      body: JSON.stringify({email,password}),
    });
    return r.json();
  },
  async getProfile(token, parentId) {
    const r = await fetch(`${SB_URL}/rest/v1/profiles?parent_id=eq.${parentId}&select=*`, {
      headers: sb.headers(token),
    });
    const data = await r.json();
    return Array.isArray(data) ? data[0] : null;
  },
  async upsertProfile(token, profile) {
    const r = await fetch(`${SB_URL}/rest/v1/profiles`, {
      method:"POST",
      headers:{...sb.headers(token), "Prefer":"resolution=merge-duplicates,return=representation"},
      body: JSON.stringify(profile),
    });
    const data = await r.json();
    return Array.isArray(data) ? data[0] : data;
  },
  async getSessions(token, profileId) {
    const r = await fetch(
      `${SB_URL}/rest/v1/sessions?profile_id=eq.${profileId}&order=created_at.desc&limit=50`,
      { headers: sb.headers(token) }
    );
    return r.json();
  },
  async insertSession(token, session) {
    const r = await fetch(`${SB_URL}/rest/v1/sessions`, {
      method:"POST", headers: sb.headers(token),
      body: JSON.stringify(session),
    });
    return r.json();
  },
  async getSessionsThisMonth(token, profileId) {
    const start = new Date();
    start.setDate(1); start.setHours(0,0,0,0);
    const r = await fetch(
      `${SB_URL}/rest/v1/sessions?profile_id=eq.${profileId}&created_at=gte.${start.toISOString()}&select=id`,
      { headers: sb.headers(token) }
    );
    const data = await r.json();
    return Array.isArray(data) ? data.length : 0;
  },
};

const PLANS = {
  free: {id:"free",name:"Gratis",price:"$0",sessionsPerMonth:5,children:1,voice:"browser",color:"#6B7280",
    features:["5 sesiones al mes","1 perfil de niño","Voz básica del navegador","Sube fotos del libro"]},
  premium: {id:"premium",name:"Premium",price:"$6.99/mes",sessionsPerMonth:Infinity,children:3,voice:"google",color:"#7C3AED",
    features:["Sesiones ilimitadas","Hasta 3 niños","Voz Google Neural2 (alta calidad)","Historial completo","Soporte prioritario"]},
  school: {id:"school",name:"Escuelas",price:"$99/mes",sessionsPerMonth:Infinity,children:Infinity,voice:"google",color:"#059669",
    features:["Niños ilimitados","Múltiples tutores","Reportes por grupo","Integración institucional","Soporte dedicado"]},
};

const GOOGLE_VOICES = {
  es:{male:"es-ES-Neural2-B",female:"es-ES-Neural2-A"},
  en:{male:"en-US-Neural2-D",female:"en-US-Neural2-F"},
  pt:{male:"pt-BR-Neural2-B",female:"pt-BR-Neural2-C"},
  fr:{male:"fr-FR-Neural2-B",female:"fr-FR-Neural2-A"},
  de:{male:"de-DE-Neural2-B",female:"de-DE-Neural2-A"},
  it:{male:"it-IT-Neural2-C",female:"it-IT-Neural2-A"},
  zh:{male:"cmn-CN-Wavenet-B",female:"cmn-CN-Wavenet-A"},
  ja:{male:"ja-JP-Neural2-C",female:"ja-JP-Neural2-B"},
};

const GOOGLE_LANG_CODE = {
  es:"es-ES",en:"en-US",pt:"pt-BR",fr:"fr-FR",
  de:"de-DE",it:"it-IT",zh:"cmn-CN",ja:"ja-JP",
};

let currentAudio = null;

function speakBrowser(text, lang, gender, onStart, onEnd) {
  if (!window.speechSynthesis) { onEnd?.(); return; }
  window.speechSynthesis.cancel();
  const clean = text.replace(/[*_`#]/g,"").replace(/\n+/g," ").trim();
  if(!clean) return;
  const u = new SpeechSynthesisUtterance(clean);
  u.lang  = GOOGLE_LANG_CODE[lang]||"es-ES";
  u.rate  = 0.92;
  u.pitch = gender==="female"?1.1:0.95;
  const voices = window.speechSynthesis.getVoices();
  const match  = voices.find(v=>v.lang.startsWith(u.lang.slice(0,2)));
  if(match) u.voice = match;
  u.onstart = onStart;
  u.onend   = onEnd;
  u.onerror = onEnd;
  onStart?.();
  window.speechSynthesis.speak(u);
}

async function speakGoogle(text, lang, gender, apiKey, onStart, onEnd, onError) {
  if(!apiKey) { onError?.("Sin API Key de Google"); return; }
  if(currentAudio) { currentAudio.pause(); currentAudio=null; }
  const clean = text.replace(/[\u{1F300}-\u{1FAFF}]/gu,"").replace(/[*_`#]/g,"").replace(/\n+/g," ").trim();
  if(!clean) return;
  try {
    onStart?.();
    const r = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,{
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({
        input:{text:clean},
        voice:{languageCode:GOOGLE_LANG_CODE[lang]||"es-ES",name:GOOGLE_VOICES[lang]?.[gender]||"es-ES-Neural2-B",ssmlGender:gender==="female"?"FEMALE":"MALE"},
        audioConfig:{audioEncoding:"MP3",speakingRate:0.95,pitch:gender==="female"?1.5:-1.0},
      }),
    });
    if(r.status===400) throw new Error("API Key inválida");
    if(r.status===403) throw new Error("Activa Cloud Text-to-Speech API en Google Console");
    if(!r.ok) throw new Error(`Error ${r.status}`);
    const d = await r.json();
    if(!d.audioContent) throw new Error("Sin audio en respuesta");
    const bin=atob(d.audioContent), bytes=new Uint8Array(bin.length);
    for(let i=0;i<bin.length;i++) bytes[i]=bin.charCodeAt(i);
    const url=URL.createObjectURL(new Blob([bytes],{type:"audio/mpeg"}));
    const audio=new Audio(url);
    currentAudio=audio;
    audio.onended=()=>{onEnd?.();currentAudio=null;URL.revokeObjectURL(url);};
    audio.onerror=()=>{onError?.("Error al reproducir");onEnd?.();currentAudio=null;};
    audio.play().catch(()=>{onError?.("Toca la pantalla primero para activar audio");onEnd?.();});
  } catch(e) { onError?.(e.message); onEnd?.(); }
}

function ttsSpeak(text,lang,gender,googleKey,onStart,onEnd,onError) {
  if(googleKey) speakGoogle(text,lang,gender,googleKey,onStart,onEnd,onError);
  else speakBrowser(text,lang,gender,onStart,onEnd);
}

const AVATARS_M = ["🧑‍🏫","👨‍🚀","🧙‍♂️","🦸‍♂️","🧑‍🔬"];
const AVATARS_F = ["👩‍🏫","👩‍🚀","🧙‍♀️","🦸‍♀️","👩‍🔬"];
const LANGUAGES = [
  {id:"es",flag:"🇨🇷",native:"Español",  region:"América Latina"},
  {id:"en",flag:"🇺🇸",native:"English",  region:"United States"},
  {id:"pt",flag:"🇧🇷",native:"Português",region:"Brasil"},
  {id:"fr",flag:"🇫🇷",native:"Français", region:"France"},
  {id:"de",flag:"🇩🇪",native:"Deutsch",  region:"Deutschland"},
  {id:"it",flag:"🇮🇹",native:"Italiano", region:"Italia"},
  {id:"zh",flag:"🇨🇳",native:"中文",      region:"中国"},
  {id:"ja",flag:"🇯🇵",native:"日本語",    region:"日本"},
];
const DEFAULT_TUTOR = {es:"Roberto",en:"Alex",pt:"Roberto",fr:"Léo",de:"Max",it:"Marco",zh:"小明",ja:"たろう"};

const L = {
  es:{
    greeting:(c,t)=>`¡Hola ${c}! Soy ${t}, ¡hoy vamos a vivir una aventura!`,
    upload:"¿Qué materia vamos a estudiar?",uploadPh:"Ej: Matemáticas — Fracciones, Cap. 4",
    ctxPh:"Ej: Examen el viernes, pág 45-60",start:t=>`¡Empezar con ${t}! 🚀`,
    reply:t=>`Respóndele a ${t}...`,systemLang:"Habla SIEMPRE en español.",
    q1:"👋 ¡Hola! ¿Cómo te llamas?",q2:"¿Cómo quieres llamar a tu tutor?",
    q3:"¿Qué voz tiene tu tutor?",q4:t=>`¿Cómo se ve ${t}?`,
    cont:"Continuar →",done:(n,t)=>`¡Listo, ${n}! 🚀`
  },
  en:{
    greeting:(c,t)=>`Hi ${c}! I'm ${t}, today we're going on an adventure!`,
    upload:"What subject are we studying?",uploadPh:"E.g.: Math — Fractions, Ch. 4",
    ctxPh:"E.g.: Exam on Friday, pages 45-60",start:t=>`Start with ${t}! 🚀`,
    reply:t=>`Reply to ${t}...`,systemLang:"ALWAYS speak in English.",
    q1:"👋 Hi! What's your name?",q2:"What do you want to call your tutor?",
    q3:"What voice does your tutor have?",q4:t=>`What does ${t} look like?`,
    cont:"Continue →",done:(n,t)=>`Ready, ${n}! 🚀`
  },
  pt:{greeting:(c,t)=>`Olá ${c}! Sou ${t}, hoje vamos viver uma aventura!`,upload:"Que matéria vamos estudar?",uploadPh:"Ex: Matemática — Frações, Cap. 4",ctxPh:"Ex: Prova na sexta, pág 45-60",start:t=>`Começar com ${t}! 🚀`,reply:t=>`Responda a ${t}...`,systemLang:"Fale SEMPRE em português.",q1:"👋 Olá! Como você se chama?",q2:"Como quer chamar seu tutor?",q3:"Que voz tem seu tutor?",q4:t=>`Como é ${t}?`,cont:"Continuar →",done:(n,t)=>`Pronto, ${n}! 🚀`},
  fr:{greeting:(c,t)=>`Bonjour ${c}! Je suis ${t}, aujourd'hui on part à l'aventure!`,upload:"Quelle matière étudions-nous?",uploadPh:"Ex: Maths — Fractions, Ch. 4",ctxPh:"Ex: Examen vendredi, p. 45-60",start:t=>`Commencer avec ${t}! 🚀`,reply:t=>`Réponds à ${t}...`,systemLang:"Parle TOUJOURS en français.",q1:"👋 Salut! Comment tu t'appelles?",q2:"Comment veux-tu appeler ton tuteur?",q3:"Quelle voix a ton tuteur?",q4:t=>`À quoi ressemble ${t}?`,cont:"Continuer →",done:(n,t)=>`C'est parti, ${n}! 🚀`},
  de:{greeting:(c,t)=>`Hallo ${c}! Ich bin ${t}, heute erleben wir ein Abenteuer!`,upload:"Welches Fach lernen wir?",uploadPh:"Z.B.: Mathe — Brüche, Kap. 4",ctxPh:"Z.B.: Prüfung Freitag, S. 45-60",start:t=>`Mit ${t} starten! 🚀`,reply:t=>`Antworte ${t}...`,systemLang:"Sprich IMMER auf Deutsch.",q1:"👋 Hallo! Wie heißt du?",q2:"Wie soll dein Tutor heißen?",q3:"Welche Stimme hat dein Tutor?",q4:t=>`Wie sieht ${t} aus?`,cont:"Weiter →",done:(n,t)=>`Los geht's, ${n}! 🚀`},
  it:{greeting:(c,t)=>`Ciao ${c}! Sono ${t}, oggi viviamo un'avventura!`,upload:"Quale materia studiamo?",uploadPh:"Es: Matematica — Frazioni, Cap. 4",ctxPh:"Es: Esame venerdì, pag. 45-60",start:t=>`Iniziare con ${t}! 🚀`,reply:t=>`Rispondi a ${t}...`,systemLang:"Parla SEMPRE in italiano.",q1:"👋 Ciao! Come ti chiami?",q2:"Come vuoi chiamare il tuo tutor?",q3:"Che voce ha il tuo tutor?",q4:t=>`Com'è ${t}?`,cont:"Continua →",done:(n,t)=>`Pronti, ${n}! 🚀`},
  zh:{greeting:(c,t)=>`你好 ${c}！我是 ${t}，今天我们一起来一场冒险！`,upload:"今天学什么科目？",uploadPh:"例如：数学 — 分数，第4章",ctxPh:"例如：周五考试，第45-60页",start:t=>`和 ${t} 开始！🚀`,reply:t=>`回复 ${t}...`,systemLang:"永远用中文回答。",q1:"👋 你好！你叫什么名字？",q2:"你想叫你的老师什么名字？",q3:"你的老师是什么声音？",q4:t=>`${t}长什么样？`,cont:"继续 →",done:(n,t)=>`出发，${n}！🚀`},
  ja:{greeting:(c,t)=>`こんにちは ${c}！ぼくは ${t}、今日は一緒に冒険しよう！`,upload:"今日は何を勉強しますか？",uploadPh:"例：算数 — 分数、第4章",ctxPh:"例：金曜日にテスト、45〜60ページ",start:t=>`${t} と始める！🚀`,reply:t=>`${t} に返信...`,systemLang:"常に日本語で話してください。",q1:"👋 こんにちは！お名前は？",q2:"先生の名前は？",q3:"先生の声は？",q4:t=>`${t}はどんな見た目？`,cont:"続ける →",done:(n,t)=>`行くよ、${n}！🚀`},
};

function buildSystem(tutorName,childName,subject,lang) {
  const l=L[lang]||L.es;
  return `Your name is ${tutorName}. You are the most passionate personal tutor in the world.
NEVER reveal you are an AI, robot, or language model. You are simply ${tutorName}, the personal tutor of ${childName}.
${l.systemLang}
- Always call ${childName} by name.
- Teach ONLY from the shared book pages/images. Never add external knowledge.
- Use exciting, clear language for a school-age child.
- Use stories, analogies, real-world examples.
- After each explanation, ask ONE question to check understanding.
- If correct: celebrate with energy and emojis!
- If wrong: never make them feel bad. Say "Almost! Let me explain differently..." and retry.
- Adventure tone. Studying IS the adventure.
- Subject: ${subject}.
- Max 4 sentences per reply. Always end with ONE question or invitation.
- First reply: introduce yourself with energy and excitement.`;
}

async function askRoberto(messages,system,apiKey) {
  if(!apiKey) throw new Error("Falta la API Key de Anthropic. Configúrala en el Panel de Padres.");
  const r=await fetch("https://api.anthropic.com/v1/messages",{
    method:"POST",
    headers:{
      "Content-Type":"application/json",
      "x-api-key": apiKey,
      "anthropic-version":"2023-06-01",
      "anthropic-dangerous-direct-browser-access":"true",
    },
    body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,system,messages}),
  });
  const d=await r.json();
  if(d.error) throw new Error(d.error.message);
  return d.content?.[0]?.text||"...";
}

function fileToBase64(file) {
  return new Promise((res,rej)=>{
    const r=new FileReader();
    r.onload=()=>res(r.result.split(",")[1]);
    r.onerror=rej;
    r.readAsDataURL(file);
  });
}

const CSS=`
*{box-sizing:border-box}
body{margin:0;font-family:'Nunito',sans-serif}
::-webkit-scrollbar{width:4px}
::-webkit-scrollbar-thumb{background:rgba(124,58,237,0.4);border-radius:4px}
@keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
@keyframes floatIn{from{opacity:0;transform:scale(0.9)}to{opacity:1;transform:scale(1)}}
@keyframes msgIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.07)}}
@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}
@keyframes twinkle{0%,100%{opacity:0.1}50%{opacity:0.7}}
@keyframes typingDot{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-8px)}}
@keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-7px)}75%{transform:translateX(7px)}}
@keyframes spin{to{transform:rotate(360deg)}}
`;
const BG="linear-gradient(160deg,#0F0A2E 0%,#1A0A4E 40%,#0D1B3E 100%)";
const CARD={background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:18};
const BTN_P={background:"linear-gradient(135deg,#7C3AED,#4F46E5)",border:"none",borderRadius:16,padding:"15px",fontSize:15,fontWeight:900,color:"white",cursor:"pointer",fontFamily:"inherit",width:"100%",transition:"all 0.2s",boxShadow:"0 8px 28px rgba(124,58,237,0.4)"};
const INPUT={width:"100%",boxSizing:"border-box",background:"rgba(255,255,255,0.07)",border:"2px solid rgba(124,58,237,0.3)",borderRadius:14,padding:"13px 16px",fontSize:15,color:"white",outline:"none",fontFamily:"inherit"};

function Stars() {
  const s=useRef(Array.from({length:24},()=>({
    top:Math.random()*100,left:Math.random()*100,
    size:Math.random()*2.5+0.8,dur:Math.random()*3+2,
    delay:Math.random()*4,op:Math.random()*0.5+0.1,
  }))).current;
  return <>{s.map((x,i)=><div key={i} style={{position:"fixed",top:`${x.top}%`,left:`${x.left}%`,width:x.size,height:x.size,borderRadius:"50%",background:"white",opacity:x.op,pointerEvents:"none",animation:`twinkle ${x.dur}s ease ${x.delay}s infinite`}}/>)}</>;
}

function Dots() {
  return <div style={{display:"flex",gap:5,alignItems:"center",padding:"13px 18px"}}>
    {[0,1,2].map(i=><div key={i} style={{width:8,height:8,borderRadius:"50%",background:"#7C3AED",animation:`typingDot 1.2s ease ${i*0.2}s infinite`}}/>)}
  </div>;
}

function Avatar({av,voice,size=44,pulse:p=false}) {
  return <div style={{width:size,height:size,borderRadius:"50%",flexShrink:0,background:voice==="female"?"linear-gradient(135deg,#EC4899,#8B5CF6)":"linear-gradient(135deg,#3B82F6,#7C3AED)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.55,animation:p?"pulse 1.6s ease infinite":"none",boxShadow:p?"0 0 0 4px rgba(124,58,237,0.3)":"none",transition:"box-shadow 0.4s"}}>{av}</div>;
}

function Spinner() {
  return <div style={{width:20,height:20,borderRadius:"50%",border:"3px solid rgba(255,255,255,0.15)",borderTopColor:"#7C3AED",animation:"spin 0.8s linear infinite",margin:"0 auto"}}/>;
}

function PlanBadge({plan}) {
  const p=PLANS[plan]||PLANS.free;
  return <div style={{display:"inline-flex",alignItems:"center",gap:5,padding:"3px 9px",borderRadius:20,background:`${p.color}22`,border:`1px solid ${p.color}55`,fontSize:10,fontWeight:700,color:p.color,letterSpacing:0.5}}>
    {plan==="premium"?"⭐":plan==="school"?"🏫":"🆓"} {p.name.toUpperCase()}
  </div>;
}

function AuthScreen({onAuth}) {
  const [mode,setMode]=useState("login");
  const [email,setEmail]=useState("");
  const [pass,setPass]=useState("");
  const [loading,setLoading]=useState(false);
  const [err,setErr]=useState("");
  const configured = SB_URL!=="https://YOUR_PROJECT.supabase.co";
  const submit = async () => {
    if(!email.trim()||!pass.trim()) return;
    setLoading(true); setErr("");
    try {
      const fn = mode==="signup" ? sb.signUp : sb.signIn;
      const data = await fn(email.trim(), pass.trim());
      if(data.error) { setErr(data.error.message||"Error de autenticación"); setLoading(false); return; }
      const token = data.access_token;
      const userId = data.user?.id;
      if(!token||!userId) { setErr("No se pudo autenticar"); setLoading(false); return; }
      onAuth({token, userId, email:email.trim()});
    } catch(e) {
      setErr("Error de conexión. Verifica la configuración de Supabase.");
      setLoading(false);
    }
  };
  return (
    <div style={{minHeight:"100vh",background:BG,display:"flex",alignItems:"center",justifyContent:"center",padding:24,color:"white",position:"relative",overflow:"hidden"}}>
      <Stars/><style>{CSS}</style>
      <div style={{width:"100%",maxWidth:400,position:"relative",zIndex:1,animation:"fadeUp 0.5s ease"}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{fontSize:52,marginBottom:8}}>🚀</div>
          <div style={{fontSize:30,fontWeight:900,letterSpacing:-1}}>Tutor<span style={{color:"#A78BFA"}}>IA</span></div>
          <div style={{fontSize:11,color:"rgba(255,255,255,0.3)",letterSpacing:3,textTransform:"uppercase",marginTop:3}}>
            {mode==="signup"?"Crear cuenta de padres":"Acceso de padres"}
          </div>
        </div>
        {!configured && (
          <div style={{...CARD,padding:"14px 16px",marginBottom:20,border:"1px solid rgba(234,179,8,0.4)",background:"rgba(234,179,8,0.08)"}}>
            <div style={{fontSize:12,color:"#FCD34D",lineHeight:1.6,fontWeight:600}}>
              ⚠️ Supabase no configurado. Edita las constantes <code>SB_URL</code> y <code>SB_ANON</code> en el código.
              <br/><span style={{color:"rgba(255,255,255,0.4)",fontWeight:400}}>Modo demo activo — datos en memoria.</span>
            </div>
          </div>
        )}
        <div style={{...CARD,padding:24,border:"1px solid rgba(124,58,237,0.25)"}}>
          <div style={{marginBottom:14}}>
            <div style={{fontSize:11,fontWeight:700,color:"rgba(255,255,255,0.4)",marginBottom:7,letterSpacing:1.5,textTransform:"uppercase"}}>Correo electrónico</div>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&submit()}
              placeholder="padre@ejemplo.com" style={{...INPUT,fontSize:14}}/>
          </div>
          <div style={{marginBottom:20}}>
            <div style={{fontSize:11,fontWeight:700,color:"rgba(255,255,255,0.4)",marginBottom:7,letterSpacing:1.5,textTransform:"uppercase"}}>Contraseña</div>
            <input type="password" value={pass} onChange={e=>setPass(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&submit()}
              placeholder="Mínimo 6 caracteres" style={{...INPUT,fontSize:14}}/>
          </div>
          {err && <div style={{padding:"10px 13px",borderRadius:10,background:"rgba(239,68,68,0.12)",border:"1px solid rgba(239,68,68,0.3)",fontSize:12,color:"#FCA5A5",marginBottom:14,lineHeight:1.5}}>⚠️ {err}</div>}
          <button onClick={submit} disabled={loading||!email.trim()||!pass.trim()}
            style={{...BTN_P,opacity:loading||!email.trim()||!pass.trim()?0.4:1,cursor:loading?"wait":"pointer"}}>
            {loading ? <Spinner/> : mode==="signup"?"Crear cuenta":"Ingresar"}
          </button>
          <button onClick={()=>{setMode(m=>m==="login"?"signup":"login");setErr("");}}
            style={{marginTop:12,width:"100%",background:"none",border:"none",color:"rgba(255,255,255,0.35)",fontSize:12,cursor:"pointer",fontFamily:"inherit",padding:8}}>
            {mode==="login"?"¿No tienes cuenta? Regístrate":"¿Ya tienes cuenta? Ingresa"}
          </button>
        </div>
        {!configured && (
          <button onClick={()=>onAuth({token:"demo",userId:"demo-user",email:"demo@tutoria.app",demo:true})}
            style={{marginTop:12,width:"100%",background:"none",border:"1px solid rgba(255,255,255,0.12)",borderRadius:14,padding:12,color:"rgba(255,255,255,0.3)",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>
            Continuar en modo demo →
          </button>
        )}
      </div>
    </div>
  );
}

function PaywallScreen({sessionsUsed,limit,plan,onBack}) {
  return (
    <div style={{minHeight:"100vh",background:BG,display:"flex",alignItems:"center",justifyContent:"center",padding:24,color:"white",position:"relative",overflow:"hidden"}}>
      <Stars/><style>{CSS}</style>
      <div style={{width:"100%",maxWidth:420,position:"relative",zIndex:1,animation:"fadeUp 0.5s ease",textAlign:"center"}}>
        <div style={{fontSize:58,marginBottom:12}}>🔒</div>
        <div style={{fontSize:24,fontWeight:900,marginBottom:6}}>Límite del mes alcanzado</div>
        <div style={{fontSize:13,color:"rgba(255,255,255,0.4)",marginBottom:28,lineHeight:1.6}}>
          Has usado <strong style={{color:"#A78BFA"}}>{sessionsUsed} de {limit} sesiones</strong> del plan gratuito este mes.<br/>
          Actualiza para continuar aprendiendo sin límites.
        </div>
        {Object.values(PLANS).filter(p=>p.id!=="free").map(p=>(
          <div key={p.id} style={{...CARD,padding:"20px 22px",marginBottom:12,textAlign:"left",border:`1px solid ${p.color}40`,animation:"fadeUp 0.4s ease"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <div>
                <div style={{fontSize:17,fontWeight:900}}>{p.name}</div>
                <div style={{fontSize:13,color:p.color,fontWeight:700,marginTop:2}}>{p.price}</div>
              </div>
              {p.id==="premium"&&<div style={{background:"rgba(124,58,237,0.25)",borderRadius:20,padding:"4px 12px",fontSize:10,fontWeight:700,color:"#A78BFA",border:"1px solid rgba(124,58,237,0.4)"}}>⭐ POPULAR</div>}
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:5,marginBottom:16}}>
              {p.features.map(f=><div key={f} style={{fontSize:12,color:"rgba(255,255,255,0.55)",display:"flex",gap:7,alignItems:"flex-start"}}>
                <span style={{color:p.color,fontSize:10,marginTop:2,flexShrink:0}}>✓</span>{f}
              </div>)}
            </div>
            <button style={{...BTN_P,background:`linear-gradient(135deg,${p.color},${p.color}cc)`,boxShadow:`0 6px 20px ${p.color}44`}}>
              {p.id==="school"?"Contactar ventas":"Actualizar ahora →"}
            </button>
          </div>
        ))}
        <button onClick={onBack} style={{marginTop:8,background:"none",border:"none",color:"rgba(255,255,255,0.25)",fontSize:12,cursor:"pointer",fontFamily:"inherit",padding:8}}>
          Volver al inicio
        </button>
      </div>
    </div>
  );
}

function OnboardingScreen({onComplete}) {
  const [step,setStep]=useState(0);
  const [lang,setLang]=useState(null);
  const [childName,setChildName]=useState("");
  const [tutorName,setTutorName]=useState("");
  const [voice,setVoice]=useState("male");
  const [avatar,setAvatar]=useState(AVATARS_M[0]);
  const inputRef=useRef(null);
  const l=L[lang]||L.es;
  const avList=voice==="male"?AVATARS_M:AVATARS_F;
  useEffect(()=>{ if(step>0) setTimeout(()=>inputRef.current?.focus(),120); },[step]);
  const selectLang=id=>{ setLang(id); setTutorName(DEFAULT_TUTOR[id]||"Roberto"); setTimeout(()=>setStep(1),220); };
  const next=()=>{
    if(step===1&&!childName.trim()) return;
    if(step===2&&!tutorName.trim()) return;
    if(step<4) setStep(s=>s+1);
    else onComplete({childName:childName.trim(),tutorName:tutorName.trim(),voice,avatar,lang});
  };
  const qs=["",
    [l.q1,"Tu tutor siempre te llamará por tu nombre."],
    [l.q2,`Sugerimos: ${DEFAULT_TUTOR[lang]||"Roberto"}`],
    [l.q3,"Escucharás su voz en cada sesión."],
    [l.q4?.(tutorName)||"","Elige el personaje de tu tutor."]
  ];
  return (
    <div style={{minHeight:"100vh",background:BG,display:"flex",alignItems:"center",justifyContent:"center",padding:24,color:"white",position:"relative",overflow:"hidden"}}>
      <Stars/><style>{CSS}</style>
      <div style={{width:"100%",maxWidth:440,position:"relative",zIndex:1}}>
        <div style={{textAlign:"center",marginBottom:step===0?30:22,animation:"fadeUp 0.5s ease"}}>
          <div style={{fontSize:50,marginBottom:6}}>🚀</div>
          <div style={{fontSize:28,fontWeight:900,letterSpacing:-1}}>Tutor<span style={{color:"#A78BFA"}}>IA</span></div>
          {step===0&&<div style={{fontSize:11,color:"rgba(255,255,255,0.3)",letterSpacing:3,textTransform:"uppercase",marginTop:3}}>Choose your language / Elige tu idioma</div>}
        </div>
        {step>0&&<div style={{display:"flex",justifyContent:"center",gap:7,marginBottom:26}}>
          {[1,2,3,4].map(i=><div key={i} style={{height:4,width:i===step?30:10,borderRadius:4,background:i<=step?"#7C3AED":"rgba(255,255,255,0.1)",transition:"all 0.35s"}}/>)}
        </div>}
        {step===0&&(
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,animation:"floatIn 0.4s ease"}}>
            {LANGUAGES.map(lg=>(
              <button key={lg.id} onClick={()=>selectLang(lg.id)}
                style={{padding:"15px 13px",borderRadius:18,border:`2px solid ${lang===lg.id?"#7C3AED":"rgba(255,255,255,0.07)"}`,background:lang===lg.id?"rgba(124,58,237,0.22)":"rgba(255,255,255,0.04)",cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:11,textAlign:"left",transition:"all 0.18s"}}
                onMouseEnter={e=>e.currentTarget.style.border="2px solid rgba(124,58,237,0.5)"}
                onMouseLeave={e=>e.currentTarget.style.border=`2px solid ${lang===lg.id?"#7C3AED":"rgba(255,255,255,0.07)"}`}>
                <div style={{fontSize:26}}>{lg.flag}</div>
                <div>
                  <div style={{fontSize:14,fontWeight:800,color:"white"}}>{lg.native}</div>
                  <div style={{fontSize:10,color:"rgba(255,255,255,0.3)",marginTop:1}}>{lg.region}</div>
                </div>
              </button>
            ))}
          </div>
        )}
        {step>0&&(
          <div style={{animation:"floatIn 0.4s ease"}}>
            <div style={{fontSize:21,fontWeight:900,marginBottom:5,lineHeight:1.3}}>{qs[step][0]}</div>
            <div style={{fontSize:13,color:"rgba(255,255,255,0.4)",marginBottom:22,lineHeight:1.6}}>{qs[step][1]}</div>
            {(step===1||step===2)&&<input ref={inputRef} value={step===1?childName:tutorName}
              onChange={e=>step===1?setChildName(e.target.value):setTutorName(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&next()}
              placeholder={step===1?"...":DEFAULT_TUTOR[lang]||"Roberto"} style={INPUT}/>}
            {step===3&&<div style={{display:"flex",gap:12}}>
              {[{id:"male",emoji:"👨",label:lang==="es"?"Masculina":"Male"},{id:"female",emoji:"👩",label:lang==="es"?"Femenina":"Female"}].map(v=>(
                <button key={v.id} onClick={()=>{setVoice(v.id);setAvatar(v.id==="male"?AVATARS_M[0]:AVATARS_F[0]);}}
                  style={{flex:1,padding:"20px 14px",borderRadius:20,border:`2px solid ${voice===v.id?"#7C3AED":"rgba(255,255,255,0.08)"}`,background:voice===v.id?"rgba(124,58,237,0.22)":"rgba(255,255,255,0.04)",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:9,fontFamily:"inherit",transition:"all 0.2s"}}>
                  <div style={{fontSize:36}}>{v.emoji}</div>
                  <div style={{fontSize:14,fontWeight:800,color:"white"}}>{v.label}</div>
                  {voice===v.id&&<div style={{width:7,height:7,borderRadius:"50%",background:"#7C3AED"}}/>}
                </button>
              ))}
            </div>}
            {step===4&&<div>
              <div style={{display:"flex",gap:9,justifyContent:"center",flexWrap:"wrap",marginBottom:20}}>
                {avList.map(av=><button key={av} onClick={()=>setAvatar(av)} style={{width:64,height:64,borderRadius:17,fontSize:32,border:`3px solid ${avatar===av?"#7C3AED":"rgba(255,255,255,0.07)"}`,background:avatar===av?"rgba(124,58,237,0.28)":"rgba(255,255,255,0.04)",cursor:"pointer",fontFamily:"inherit",transition:"all 0.2s",boxShadow:avatar===av?"0 0 18px rgba(124,58,237,0.5)":"none"}}>{av}</button>)}
              </div>
              <div style={{...CARD,padding:"14px 17px",display:"flex",gap:13,alignItems:"center",border:"1px solid rgba(124,58,237,0.35)"}}>
                <Avatar av={avatar} voice={voice} size={48}/>
                <div style={{fontSize:14,fontWeight:800,lineHeight:1.4}}>{l.greeting(childName||"...",tutorName)}</div>
              </div>
            </div>}
          </div>
        )}
        {step>0&&<button onClick={next} disabled={step===1&&!childName.trim()}
          style={{...BTN_P,marginTop:24,opacity:step===1&&!childName.trim()?0.35:1,cursor:step===1&&!childName.trim()?"not-allowed":"pointer"}}>
          {step===4?l.done(childName,tutorName):l.cont}
        </button>}
      </div>
    </div>
  );
}

function UploadScreen({profile,auth,sessionsUsed,onStart,onGoParent}) {
  const [images,setImages]=useState([]);
  const [subject,setSubject]=useState("");
  const [ctx,setCtx]=useState("");
  const [drag,setDrag]=useState(false);
  const fileRef=useRef(null);
  const l=L[profile.lang]||L.es;
  const plan=PLANS[profile.plan||"free"];
  const canStart=images.length>0&&subject.trim();
  const isAtLimit=plan.sessionsPerMonth!==Infinity&&sessionsUsed>=plan.sessionsPerMonth;
  const handleFiles=async files=>{
    const arr=[];
    for(const f of [...files]){
      if(!f.type.startsWith("image/")) continue;
      arr.push({url:URL.createObjectURL(f),b64:await fileToBase64(f),name:f.name});
    }
    setImages(p=>[...p,...arr]);
  };
  return (
    <div style={{minHeight:"100vh",background:BG,fontFamily:"'Nunito',sans-serif",color:"white",padding:"20px 18px",position:"relative",overflow:"hidden"}}>
      <Stars/><style>{CSS}</style>
      <div style={{maxWidth:480,margin:"0 auto",position:"relative",zIndex:1}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24,animation:"fadeUp 0.4s ease"}}>
          <Avatar av={profile.avatar} voice={profile.voice} size={48}/>
          <div style={{flex:1}}>
            <div style={{fontSize:18,fontWeight:900}}>¡Hola, {profile.childName}! 👋</div>
            <div style={{display:"flex",alignItems:"center",gap:8,marginTop:3}}>
              <div style={{fontSize:11,color:"#A78BFA"}}>{profile.tutorName} está listo</div>
              <PlanBadge plan={profile.plan||"free"}/>
            </div>
          </div>
          <button onClick={onGoParent} style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,padding:"6px 11px",color:"rgba(255,255,255,0.3)",fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>👨 Padres</button>
        </div>
        {plan.sessionsPerMonth!==Infinity&&(
          <div style={{...CARD,padding:"11px 16px",marginBottom:16,border:"1px solid rgba(124,58,237,0.2)",display:"flex",justifyContent:"space-between",alignItems:"center",animation:"fadeUp 0.45s ease"}}>
            <div style={{fontSize:12,color:"rgba(255,255,255,0.4)"}}>Sesiones este mes</div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{fontSize:13,fontWeight:800,color:isAtLimit?"#EF4444":"#A78BFA"}}>{sessionsUsed}/{plan.sessionsPerMonth}</div>
              <div style={{width:80,height:4,borderRadius:4,background:"rgba(255,255,255,0.1)",overflow:"hidden"}}>
                <div style={{width:`${Math.min(100,(sessionsUsed/plan.sessionsPerMonth)*100)}%`,height:"100%",background:isAtLimit?"#EF4444":"#7C3AED",borderRadius:4,transition:"width 0.5s"}}/>
              </div>
            </div>
          </div>
        )}
        {isAtLimit?(
          <div style={{...CARD,padding:"28px 22px",textAlign:"center",border:"1px solid rgba(239,68,68,0.3)",animation:"fadeUp 0.5s ease"}}>
            <div style={{fontSize:44,marginBottom:12}}>🔒</div>
            <div style={{fontSize:16,fontWeight:800,marginBottom:6}}>Límite del mes alcanzado</div>
            <div style={{fontSize:12,color:"rgba(255,255,255,0.4)",marginBottom:18,lineHeight:1.6}}>
              Has usado todas tus sesiones gratuitas.<br/>Actualiza para continuar aprendiendo.
            </div>
            <button onClick={onGoParent} style={{...BTN_P}}>Ver planes →</button>
          </div>
        ):(
          <>
            <div style={{marginBottom:13,animation:"fadeUp 0.5s ease"}}>
              <div style={{fontSize:11,fontWeight:700,color:"rgba(255,255,255,0.4)",marginBottom:7,letterSpacing:2,textTransform:"uppercase"}}>{l.upload} *</div>
              <input value={subject} onChange={e=>setSubject(e.target.value)} placeholder={l.uploadPh} style={INPUT}/>
            </div>
            <div style={{marginBottom:18,animation:"fadeUp 0.55s ease"}}>
              <div style={{fontSize:11,fontWeight:700,color:"rgba(255,255,255,0.4)",marginBottom:7,letterSpacing:2,textTransform:"uppercase"}}>Contexto (opcional)</div>
              <input value={ctx} onChange={e=>setCtx(e.target.value)} placeholder={l.ctxPh} style={{...INPUT,border:"2px solid rgba(255,255,255,0.1)"}}/>
            </div>
            <div onDragOver={e=>{e.preventDefault();setDrag(true);}} onDragLeave={()=>setDrag(false)}
              onDrop={e=>{e.preventDefault();setDrag(false);handleFiles(e.dataTransfer.files);}}
              onClick={()=>fileRef.current.click()}
              style={{border:`2px dashed ${drag?"#7C3AED":"rgba(124,58,237,0.35)"}`,borderRadius:20,padding:"26px 20px",textAlign:"center",cursor:"pointer",background:drag?"rgba(124,58,237,0.1)":"rgba(255,255,255,0.03)",transition:"all 0.2s",marginBottom:10,animation:"fadeUp 0.6s ease"}}>
              <div style={{fontSize:42,marginBottom:8}}>📸</div>
              <div style={{fontSize:15,fontWeight:800,marginBottom:4}}>Sube las páginas del libro</div>
              <div style={{fontSize:11,color:"rgba(255,255,255,0.35)",lineHeight:1.7}}>{profile.tutorName} las lee y enseña desde ahí</div>
              <input ref={fileRef} type="file" multiple accept="image/*" onChange={e=>handleFiles(e.target.files)} style={{display:"none"}}/>
            </div>
            <button onClick={()=>{fileRef.current.setAttribute("capture","environment");fileRef.current.click();}}
              style={{width:"100%",marginBottom:14,padding:"12px",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.09)",borderRadius:13,fontSize:12,fontWeight:700,color:"rgba(255,255,255,0.5)",cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:8,animation:"fadeUp 0.65s ease"}}>
              📷 Tomar foto con la cámara
            </button>
            {images.length>0&&<div style={{marginBottom:14,animation:"floatIn 0.3s ease"}}>
              <div style={{fontSize:11,color:"#A78BFA",fontWeight:700,marginBottom:8}}>✅ {images.length} página{images.length>1?"s":""} lista{images.length>1?"s":""}</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6}}>
                {images.map((img,i)=><div key={i} style={{position:"relative",borderRadius:9,overflow:"hidden",aspectRatio:"3/4"}}>
                  <img src={img.url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                  <button onClick={e=>{e.stopPropagation();setImages(p=>p.filter((_,j)=>j!==i));}} style={{position:"absolute",top:3,right:3,width:19,height:19,borderRadius:"50%",background:"rgba(239,68,68,0.9)",border:"none",color:"white",fontSize:9,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
                </div>)}
              </div>
            </div>}
            <button onClick={()=>canStart&&onStart({images,subject,context:ctx})} disabled={!canStart}
              style={{...BTN_P,opacity:canStart?1:0.35,cursor:canStart?"pointer":"not-allowed",animation:"fadeUp 0.7s ease"}}>
              {canStart?l.start(profile.tutorName):"Sube páginas y escribe la materia"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function SessionScreen({profile,session,googleKey,anthropicKey,onEnd}) {
  const [msgs,setMsgs]=useState([]);
  const [input,setInput]=useState("");
  const [thinking,setThinking]=useState(false);
  const [inited,setInited]=useState(false);
  const [muted,setMuted]=useState(false);
  const [speaking,setSpeaking]=useState(false);
  const [startTime]=useState(Date.now());
  const bottomRef=useRef(null);
  const inputRef=useRef(null);
  const system=buildSystem(profile.tutorName,profile.childName,session.subject,profile.lang);
  const l=L[profile.lang]||L.es;
  const doSpeak=useCallback(text=>{
    if(muted) return;
    ttsSpeak(text,profile.lang,profile.voice,googleKey,
      ()=>setSpeaking(true),()=>setSpeaking(false),()=>setSpeaking(false));
  },[muted,profile,googleKey]);
  const buildInitContent=useCallback(()=>{
    const c=[];
    session.images.forEach(img=>c.push({type:"image",source:{type:"base64",media_type:"image/jpeg",data:img.b64}}));
    let t=`These are the book pages for studying ${session.subject}.`;
    if(session.context) t+=` Context: ${session.context}.`;
    t+=` Introduce yourself with energy and begin teaching from these pages.`;
    c.push({type:"text",text:t});
    return c;
  },[session]);
  useEffect(()=>{
    if(inited) return;
    setInited(true); setThinking(true);
    askRoberto([{role:"user",content:buildInitContent()}],system,anthropicKey)
      .then(reply=>{ setMsgs([{role:"assistant",text:reply,id:Date.now()}]); setThinking(false); doSpeak(reply); })
      .catch(()=>{ const fb=l.greeting(profile.childName,profile.tutorName); setMsgs([{role:"assistant",text:fb,id:Date.now()}]); setThinking(false); doSpeak(fb); });
  },[]);
  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:"smooth"}); },[msgs,thinking]);
  const send=async()=>{
    const text=input.trim();
    if(!text||thinking) return;
    setInput("");
    setMsgs(p=>[...p,{role:"user",text,id:Date.now()}]);
    setThinking(true); inputRef.current?.focus();
    const history=[
      {role:"user",content:buildInitContent()},
      ...msgs.map(m=>({role:m.role,content:m.text})),
      {role:"user",content:text},
    ];
    try {
      const reply=await askRoberto(history,system,anthropicKey);
      setMsgs(p=>[...p,{role:"assistant",text:reply,id:Date.now()}]);
      doSpeak(reply);
    } catch {
      const err="¡Ups! Algo salió mal. ¿Puedes repetirlo?";
      setMsgs(p=>[...p,{role:"assistant",text:err,id:Date.now()}]);
    }
    setThinking(false);
  };
  const end=()=>{
    window.speechSynthesis?.cancel();
    if(currentAudio){currentAudio.pause();currentAudio=null;}
    onEnd({
      id:Date.now().toString(),
      date:new Date().toLocaleDateString("es-CR",{weekday:"short",day:"numeric",month:"short"}),
      subject:session.subject,context:session.context,
      pageCount:session.images.length,
      messageCount:msgs.filter(m=>m.role==="user").length,
      points:msgs.filter(m=>m.role==="user").length*10,
      duration:Math.max(1,Math.round((Date.now()-startTime)/60000)),
    },msgs);
  };
  return (
    <div style={{height:"100vh",display:"flex",flexDirection:"column",background:BG,fontFamily:"'Nunito',sans-serif",color:"white",overflow:"hidden"}}>
      <style>{CSS}</style>
      <div style={{padding:"11px 15px",background:"rgba(0,0,0,0.38)",borderBottom:"1px solid rgba(255,255,255,0.06)",display:"flex",alignItems:"center",gap:11,flexShrink:0}}>
        <Avatar av={profile.avatar} voice={profile.voice} size={44} pulse={thinking||speaking}/>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:13,fontWeight:800,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{session.subject}</div>
          <div style={{fontSize:10,marginTop:1,color:speaking?"#34D399":thinking?"#A78BFA":"rgba(255,255,255,0.3)",transition:"color 0.3s"}}>
            {speaking?`🔊 ${profile.tutorName} está hablando...`:thinking?`${profile.tutorName} está pensando...`:`${session.images.length} pág. · sesión activa`}
          </div>
        </div>
        <button onClick={()=>setMuted(m=>!m)} title={muted?"Activar voz":"Silenciar"}
          style={{width:34,height:34,borderRadius:"50%",background:muted?"rgba(239,68,68,0.18)":"rgba(52,211,153,0.12)",border:`1px solid ${muted?"rgba(239,68,68,0.4)":"rgba(52,211,153,0.3)"}`,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          {muted?"🔇":"🔊"}
        </button>
        <button onClick={end} style={{background:"rgba(239,68,68,0.15)",border:"1px solid rgba(239,68,68,0.3)",borderRadius:9,padding:"6px 12px",color:"#FCA5A5",fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"inherit",flexShrink:0}}>Terminar</button>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"16px 15px",display:"flex",flexDirection:"column",gap:12}}>
        {msgs.length===0&&!thinking&&<div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",color:"rgba(255,255,255,0.12)",gap:10}}>
          <div style={{fontSize:48}}>📚</div><div style={{fontSize:13}}>{profile.tutorName} está leyendo las páginas...</div>
        </div>}
        {msgs.map(m=>(
          <div key={m.id} style={{display:"flex",flexDirection:m.role==="assistant"?"row":"row-reverse",gap:8,alignItems:"flex-end",animation:"msgIn 0.3s ease"}}>
            {m.role==="assistant"&&<Avatar av={profile.avatar} voice={profile.voice} size={34}/>}
            <div style={{maxWidth:"80%",background:m.role==="assistant"?"rgba(124,58,237,0.18)":"rgba(255,255,255,0.1)",border:m.role==="assistant"?"1px solid rgba(124,58,237,0.3)":"1px solid rgba(255,255,255,0.12)",borderRadius:m.role==="assistant"?"5px 17px 17px 17px":"17px 5px 17px 17px",padding:"11px 14px",fontSize:13,lineHeight:1.7,whiteSpace:"pre-wrap"}}>{m.text}</div>
          </div>
        ))}
        {thinking&&<div style={{display:"flex",gap:8,alignItems:"flex-end",animation:"msgIn 0.3s ease"}}>
          <Avatar av={profile.avatar} voice={profile.voice} size={34} pulse/>
          <div style={{background:"rgba(124,58,237,0.18)",border:"1px solid rgba(124,58,237,0.3)",borderRadius:"5px 17px 17px 17px"}}><Dots/></div>
        </div>}
        <div ref={bottomRef}/>
      </div>
      <div style={{padding:"11px 15px 20px",background:"rgba(0,0,0,0.42)",borderTop:"1px solid rgba(255,255,255,0.06)",flexShrink:0}}>
        <div style={{display:"flex",gap:8,alignItems:"flex-end"}}>
          <textarea ref={inputRef} value={input} onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}}
            placeholder={l.reply(profile.tutorName)} rows={1}
            style={{flex:1,resize:"none",background:"rgba(255,255,255,0.07)",border:"2px solid rgba(124,58,237,0.3)",borderRadius:13,padding:"11px 14px",fontSize:13,color:"white",outline:"none",fontFamily:"inherit",lineHeight:1.5,maxHeight:88,overflowY:"auto"}}/>
          <button onClick={send} disabled={!input.trim()||thinking}
            style={{width:44,height:44,borderRadius:"50%",flexShrink:0,border:"none",fontSize:17,cursor:input.trim()&&!thinking?"pointer":"not-allowed",background:input.trim()&&!thinking?"linear-gradient(135deg,#7C3AED,#4F46E5)":"rgba(255,255,255,0.06)",transition:"all 0.2s",boxShadow:input.trim()&&!thinking?"0 4px 16px rgba(124,58,237,0.4)":"none"}}>
            {thinking?"⏳":"➤"}
          </button>
        </div>
        <div style={{fontSize:9,color:"rgba(255,255,255,0.15)",marginTop:6,textAlign:"center",letterSpacing:0.5}}>ENTER para enviar · SHIFT+ENTER nueva línea</div>
      </div>
    </div>
  );
}

function SummaryScreen({profile,sd,onNew}) {
  return (
    <div style={{minHeight:"100vh",background:BG,display:"flex",alignItems:"center",justifyContent:"center",padding:24,fontFamily:"'Nunito',sans-serif",color:"white",position:"relative",overflow:"hidden"}}>
      <Stars/><style>{CSS}</style>
      <div style={{width:"100%",maxWidth:380,textAlign:"center",position:"relative",zIndex:1}}>
        <div style={{fontSize:70,marginBottom:12,animation:"bounce 1.2s ease"}}>🏆</div>
        <div style={{fontSize:26,fontWeight:900,marginBottom:4}}>¡Sesión completada!</div>
        <div style={{fontSize:13,color:"#A78BFA",marginBottom:28}}>{profile.childName} estudió <strong style={{color:"white"}}>{sd.subject}</strong> con {profile.tutorName}</div>
        <div style={{...CARD,padding:"20px 18px",marginBottom:20,display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,textAlign:"left",border:"1px solid rgba(124,58,237,0.3)"}}>
          {[{icon:"📚",label:"Páginas",val:sd.pageCount},{icon:"💬",label:"Respuestas",val:sd.messageCount},{icon:"⏱",label:"Minutos",val:sd.duration},{icon:"⭐",label:"Puntos",val:sd.points}].map(s=>(
            <div key={s.label}>
              <div style={{fontSize:22}}>{s.icon}</div>
              <div style={{fontSize:24,fontWeight:900,color:"#A78BFA"}}>{s.val}</div>
              <div style={{fontSize:10,color:"rgba(255,255,255,0.35)"}}>{s.label}</div>
            </div>
          ))}
        </div>
        <button onClick={onNew} style={BTN_P}>📚 Nueva sesión</button>
      </div>
    </div>
  );
}

function ParentDashboard({auth,profile,sessions,onSaveProfile,onBack,onLogout}) {
  const [tab,setTab]=useState("stats");
  const [googleKey,setGoogleKey]=useState(profile?.googleTtsKey||"");
  const [anthropicKey,setAnthropicKey]=useState(profile?.anthropicKey||"");
  const [voiceTier,setVoiceTier]=useState(profile?.googleTtsKey?"google":"free");
  const [testLoad,setTestLoad]=useState(false);
  const [testErr,setTestErr]=useState("");
  const [saved,setSaved]=useState(false);
  const [saving,setSaving]=useState(false);
  const p=PLANS[profile?.plan||"free"];
  const totalPts=sessions.reduce((s,x)=>s+x.points,0);
  const totalMin=sessions.reduce((s,x)=>s+(x.duration||0),0);
  const subjects=sessions.reduce((acc,s)=>{acc[s.subject]=(acc[s.subject]||0)+1;return acc;},{});
  const saveVoice=async()=>{
    setSaving(true);
    const key=voiceTier==="google"?googleKey.trim():"";
    await onSaveProfile({googleTtsKey:key,anthropicKey:anthropicKey.trim()});
    setSaved(true); setSaving(false);
    setTimeout(()=>setSaved(false),2500);
  };
  const testVoice=()=>{
    setTestLoad(true); setTestErr("");
    ttsSpeak(
      `Hola ${profile?.childName||"amigo"}! Soy ${profile?.tutorName||"Roberto"}, hoy vamos a vivir una aventura!`,
      profile?.lang||"es", profile?.voice||"male",
      voiceTier==="google"?googleKey.trim():"",
      ()=>{}, ()=>setTestLoad(false), err=>{setTestErr(err);setTestLoad(false);}
    );
  };
  const TABS=[["stats","📊 Progreso"],["voice","🔊 Voz"],["plan","⭐ Plan"]];
  return (
    <div style={{minHeight:"100vh",background:BG,fontFamily:"'Nunito',sans-serif",color:"white",position:"relative",overflow:"hidden"}}>
      <Stars/><style>{CSS}</style>
      <div style={{background:"rgba(0,0,0,0.42)",borderBottom:"1px solid rgba(255,255,255,0.06)",padding:"14px 18px",position:"relative",zIndex:1}}>
        <div style={{display:"flex",alignItems:"center",gap:11,marginBottom:12}}>
          <button onClick={onBack} style={{background:"none",border:"none",color:"rgba(255,255,255,0.35)",fontSize:17,cursor:"pointer",fontFamily:"inherit",padding:0}}>←</button>
          <div style={{flex:1}}>
            <div style={{fontSize:17,fontWeight:900}}>Panel de Padres</div>
            {profile&&<div style={{fontSize:11,color:"#A78BFA",marginTop:1,display:"flex",gap:6,alignItems:"center"}}>Progreso de {profile.childName} <PlanBadge plan={profile.plan||"free"}/></div>}
          </div>
          <button onClick={onLogout} style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:9,padding:"5px 10px",color:"rgba(255,255,255,0.3)",fontSize:10,cursor:"pointer",fontFamily:"inherit"}}>Salir</button>
        </div>
        <div style={{display:"flex",gap:6}}>
          {TABS.map(([v,lbl])=>(
            <button key={v} onClick={()=>setTab(v)} style={{flex:1,padding:"8px 0",borderRadius:10,border:"none",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s",background:tab===v?"rgba(124,58,237,0.3)":"rgba(255,255,255,0.05)",color:tab===v?"#C4B5FD":"rgba(255,255,255,0.4)"}}>
              {lbl}
            </button>
          ))}
        </div>
      </div>
      <div style={{maxWidth:540,margin:"0 auto",padding:"18px 17px 40px",position:"relative",zIndex:1}}>
        {tab==="stats"&&(
          sessions.length===0?(
            <div style={{textAlign:"center",padding:"60px 20px",color:"rgba(255,255,255,0.2)"}}>
              <div style={{fontSize:50,marginBottom:14}}>📊</div>
              <div style={{fontSize:15,fontWeight:700}}>Aún no hay sesiones</div>
              <div style={{fontSize:12,marginTop:5}}>Cuando {profile?.childName||"tu hijo/a"} estudie, verás el progreso aquí.</div>
            </div>
          ):(
            <>
              <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:11,marginBottom:18}}>
                {[{icon:"⭐",label:"Puntos",val:totalPts,color:"#FCD34D"},{icon:"⏱",label:"Minutos",val:totalMin,color:"#34D399"},{icon:"📚",label:"Sesiones",val:sessions.length,color:"#60A5FA"},{icon:"📄",label:"Páginas",val:sessions.reduce((s,x)=>s+x.pageCount,0),color:"#C084FC"}].map(s=>(
                  <div key={s.label} style={{...CARD,padding:"15px 16px",border:`1px solid ${s.color}22`,animation:"fadeUp 0.4s ease"}}>
                    <div style={{fontSize:22,marginBottom:5}}>{s.icon}</div>
                    <div style={{fontSize:26,fontWeight:900,color:s.color}}>{s.val}</div>
                    <div style={{fontSize:10,color:"rgba(255,255,255,0.35)",marginTop:1}}>{s.label}</div>
                  </div>
                ))}
              </div>
              {Object.keys(subjects).length>0&&<div style={{...CARD,padding:"16px 18px",marginBottom:16,border:"1px solid rgba(124,58,237,0.2)"}}>
                <div style={{fontSize:11,fontWeight:700,color:"rgba(255,255,255,0.4)",letterSpacing:2,textTransform:"uppercase",marginBottom:12}}>Materias</div>
                {Object.entries(subjects).map(([s,c])=>(
                  <div key={s} style={{marginBottom:10}}>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}>
                      <span style={{color:"#E2E8F0",fontWeight:600}}>{s}</span>
                      <span style={{color:"#A78BFA",fontWeight:700}}>{c} sesión{c>1?"es":""}</span>
                    </div>
                    <div style={{background:"rgba(0,0,0,0.3)",borderRadius:4,height:4}}>
                      <div style={{width:`${(c/sessions.length)*100}%`,height:"100%",background:"linear-gradient(90deg,#7C3AED,#4F46E5)",borderRadius:4}}/>
                    </div>
                  </div>
                ))}
              </div>}
              <div style={{fontSize:11,fontWeight:700,color:"rgba(255,255,255,0.4)",letterSpacing:2,textTransform:"uppercase",marginBottom:10}}>Últimas sesiones</div>
              <div style={{display:"flex",flexDirection:"column",gap:9}}>
                {sessions.slice(0,10).map((s,i)=>(
                  <div key={s.id} style={{...CARD,padding:"14px 16px",border:"1px solid rgba(255,255,255,0.07)",animation:`fadeUp ${0.3+i*0.04}s ease`}}>
                    <div style={{display:"flex",alignItems:"center",gap:11}}>
                      <div style={{width:36,height:36,borderRadius:11,background:"rgba(124,58,237,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,flexShrink:0}}>📚</div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:13,fontWeight:800,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.subject}</div>
                        <div style={{fontSize:10,color:"rgba(255,255,255,0.3)",marginTop:1}}>{s.date} · {s.duration||0}min · {s.pageCount} pág.</div>
                      </div>
                      <div style={{fontSize:13,fontWeight:800,color:"#FCD34D",flexShrink:0}}>⭐ {s.points}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )
        )}
        {tab==="voice"&&(
          <div style={{animation:"fadeUp 0.3s ease"}}>
            <div style={{...CARD,padding:"18px 20px",marginBottom:13,border:"1px solid rgba(124,58,237,0.22)"}}>
              <div style={{fontSize:14,fontWeight:800,marginBottom:12}}>🔊 Voz de {profile?.tutorName||"el tutor"}</div>
              <div style={{padding:"13px 14px",borderRadius:12,background:"rgba(124,58,237,0.08)",border:"1px solid rgba(124,58,237,0.25)",marginBottom:16}}>
                <div style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.4)",marginBottom:7,letterSpacing:1.5,textTransform:"uppercase"}}>🤖 API Key de Anthropic (obligatoria)</div>
                <div style={{position:"relative",marginBottom:7}}>
                  <input type="text" value={anthropicKey} onChange={e=>setAnthropicKey(e.target.value)}
                    onPaste={e=>{e.stopPropagation();setAnthropicKey(e.clipboardData.getData("text").trim());e.preventDefault();}}
                    autoCorrect="off" autoCapitalize="none" spellCheck={false}
                    placeholder="sk-ant-..."
                    style={{...INPUT,fontFamily:"monospace",fontSize:11,paddingRight:40}}/>
                  {anthropicKey&&<button onClick={()=>setAnthropicKey("")} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"rgba(255,255,255,0.1)",border:"none",borderRadius:"50%",width:20,height:20,cursor:"pointer",color:"rgba(255,255,255,0.5)",fontSize:10}}>✕</button>}
                </div>
                <div style={{fontSize:9,color:"rgba(255,255,255,0.25)",lineHeight:1.6}}>
                  console.anthropic.com → API Keys → Create Key<br/>
                  <span style={{color:anthropicKey.length>20?"#34D399":"rgba(255,255,255,0.2)",fontWeight:700}}>
                    {anthropicKey.length>20?"✓ API Key lista":"Sin clave — Roberto no puede hablar"}
                  </span>
                </div>
              </div>
              <div style={{display:"flex",gap:8,marginBottom:16}}>
                {[{id:"free",icon:"🎙",label:"Voz gratis",sub:"Navegador · sin límites"},{id:"google",icon:"⚡",label:"Google Neural2",sub:"Alta calidad · 1M chars/mes gratis"}].map(t=>(
                  <button key={t.id} onClick={()=>setVoiceTier(t.id)}
                    style={{flex:1,padding:"13px 9px",borderRadius:14,textAlign:"center",border:`2px solid ${voiceTier===t.id?"#7C3AED":"rgba(255,255,255,0.07)"}`,background:voiceTier===t.id?"rgba(124,58,237,0.22)":"rgba(255,255,255,0.04)",cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s"}}>
                    <div style={{fontSize:20,marginBottom:3}}>{t.icon}</div>
                    <div style={{fontSize:11,fontWeight:800,color:"white"}}>{t.label}</div>
                    <div style={{fontSize:9,color:"rgba(255,255,255,0.35)",marginTop:2,lineHeight:1.4}}>{t.sub}</div>
                    {voiceTier===t.id&&<div style={{width:5,height:5,borderRadius:"50%",background:"#7C3AED",margin:"6px auto 0"}}/>}
                  </button>
                ))}
              </div>
              {voiceTier==="free"&&<div style={{padding:"11px 13px",borderRadius:11,background:"rgba(52,211,153,0.07)",border:"1px solid rgba(52,211,153,0.18)",fontSize:11,color:"rgba(255,255,255,0.5)",lineHeight:1.6}}>
                ✅ Voz del navegador activa. Soporta los 8 idiomas. Cero configuración.
              </div>}
              {voiceTier==="google"&&<div>
                <div style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.4)",marginBottom:7,letterSpacing:1.5,textTransform:"uppercase"}}>API Key de Google Cloud TTS</div>
                <div style={{position:"relative",marginBottom:8}}>
                  <input type="text" value={googleKey} onChange={e=>setGoogleKey(e.target.value)}
                    onPaste={e=>{e.stopPropagation();setGoogleKey(e.clipboardData.getData("text").trim());e.preventDefault();}}
                    autoCorrect="off" autoCapitalize="none" spellCheck={false}
                    placeholder="AIza..."
                    style={{...INPUT,fontFamily:"monospace",fontSize:12,paddingRight:40}}/>
                  {googleKey&&<button onClick={()=>setGoogleKey("")} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"rgba(255,255,255,0.1)",border:"none",borderRadius:"50%",width:20,height:20,cursor:"pointer",color:"rgba(255,255,255,0.5)",fontSize:10}}>✕</button>}
                </div>
                <div style={{fontSize:9,color:"rgba(255,255,255,0.25)",lineHeight:1.6,marginBottom:12}}>
                  console.cloud.google.com → APIs → Cloud Text-to-Speech → Credenciales<br/>
                  <strong style={{color:"rgba(255,255,255,0.4)"}}>1,000,000 caracteres/mes gratis</strong>
                </div>
                <div style={{...CARD,padding:"9px 12px",border:"1px solid rgba(124,58,237,0.2)",fontSize:10,color:"rgba(255,255,255,0.45)"}}>
                  🎙 Voz: <strong style={{color:"#A78BFA"}}>{GOOGLE_VOICES[profile?.lang||"es"]?.[profile?.voice||"male"]}</strong>
                </div>
              </div>}
            </div>
            <div style={{display:"flex",gap:9,marginBottom:11}}>
              <button onClick={testVoice} disabled={testLoad||(voiceTier==="google"&&!googleKey.trim())}
                style={{flex:1,padding:"12px",borderRadius:12,background:"rgba(52,211,153,0.14)",border:"1px solid rgba(52,211,153,0.28)",color:testLoad?"rgba(255,255,255,0.3)":"#6EE7B7",fontSize:12,fontWeight:700,cursor:testLoad||(voiceTier==="google"&&!googleKey.trim())?"not-allowed":"pointer",fontFamily:"inherit"}}>
                {testLoad?"🔊 Reproduciendo...":"▶ Probar voz"}
              </button>
              <button onClick={saveVoice} disabled={saving}
                style={{flex:1,padding:"12px",borderRadius:12,background:saved?"rgba(52,211,153,0.22)":"linear-gradient(135deg,#7C3AED,#4F46E5)",border:saved?"1px solid rgba(52,211,153,0.4)":"none",color:"white",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",transition:"all 0.25s"}}>
                {saving?<Spinner/>:saved?"✅ Guardado":"Guardar"}
              </button>
            </div>
            {testErr&&<div style={{padding:"10px 13px",borderRadius:9,background:"rgba(239,68,68,0.11)",border:"1px solid rgba(239,68,68,0.28)",fontSize:11,color:"#FCA5A5",lineHeight:1.5}}>⚠️ {testErr}</div>}
          </div>
        )}
        {tab==="plan"&&(
          <div style={{animation:"fadeUp 0.3s ease"}}>
            <div style={{...CARD,padding:"16px 18px",marginBottom:16,border:`1px solid ${p.color}35`}}>
              <div style={{fontSize:11,fontWeight:700,color:"rgba(255,255,255,0.4)",letterSpacing:2,textTransform:"uppercase",marginBottom:10}}>Tu plan actual</div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <div>
                  <div style={{fontSize:18,fontWeight:900}}>{p.name}</div>
                  <div style={{fontSize:13,color:p.color,fontWeight:700}}>{p.price}</div>
                </div>
                <PlanBadge plan={profile?.plan||"free"}/>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:5}}>
                {p.features.map(f=><div key={f} style={{fontSize:11,color:"rgba(255,255,255,0.5)",display:"flex",gap:6,alignItems:"flex-start"}}>
                  <span style={{color:p.color,fontSize:10,marginTop:1,flexShrink:0}}>✓</span>{f}
                </div>)}
              </div>
            </div>
            {(profile?.plan||"free")==="free"&&Object.values(PLANS).filter(x=>x.id!=="free").map(pl=>(
              <div key={pl.id} style={{...CARD,padding:"16px 18px",marginBottom:11,border:`1px solid ${pl.color}30`,animation:"fadeUp 0.4s ease"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                  <div>
                    <div style={{fontSize:15,fontWeight:900}}>{pl.name}</div>
                    <div style={{fontSize:12,color:pl.color,fontWeight:700}}>{pl.price}</div>
                  </div>
                  {pl.id==="premium"&&<div style={{background:`${pl.color}22`,borderRadius:20,padding:"3px 10px",fontSize:9,fontWeight:700,color:pl.color,border:`1px solid ${pl.color}44`}}>⭐ POPULAR</div>}
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:4,marginBottom:13}}>
                  {pl.features.map(f=><div key={f} style={{fontSize:11,color:"rgba(255,255,255,0.5)",display:"flex",gap:6}}>
                    <span style={{color:pl.color,fontSize:10,flexShrink:0}}>✓</span>{f}
                  </div>)}
                </div>
                <button style={{...BTN_P,background:`linear-gradient(135deg,${pl.color},${pl.color}bb)`,boxShadow:`0 5px 18px ${pl.color}44`,padding:"12px",fontSize:13}}>
                  {pl.id==="school"?"Contactar ventas →":"Actualizar →"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  usePWA();
  const [auth,setAuth]=useState(null);
  const [profile,setProfile]=useState(null);
  const [sessions,setSessions]=useState([]);
  const [sessionsUsed,setSessUsed]=useState(0);
  const [screen,setScreen]=useState("auth");
  const [session,setSession]=useState(null);
  const [lastSD,setLastSD]=useState(null);
  const [loadingProfile,setLoadingProfile]=useState(false);

  useEffect(()=>{
    if(!auth) return;
    if(auth.demo) { setScreen("onboard"); return; }
    setLoadingProfile(true);
    sb.getProfile(auth.token, auth.userId).then(async p=>{
      if(p) {
        setProfile(p);
        const [sess,used]=await Promise.all([
          sb.getSessions(auth.token, p.id),
          sb.getSessionsThisMonth(auth.token, p.id),
        ]);
        setSessions(Array.isArray(sess)?sess:[]);
        setSessUsed(used);
        setScreen("upload");
      } else {
        setScreen("onboard");
      }
      setLoadingProfile(false);
    }).catch(()=>{ setScreen("onboard"); setLoadingProfile(false); });
  },[auth]);

  const handleAuth=a=>{ setAuth(a); };

  const handleOnboard=async profileData=>{
    const p={...profileData,parent_id:auth?.userId,plan:"free",googleTtsKey:"",anthropicKey:""};
    if(auth&&!auth.demo) {
      const saved=await sb.upsertProfile(auth.token, p);
      setProfile(saved||p);
    } else {
      setProfile({...p,id:"demo-profile"});
    }
    setScreen("upload");
  };

  const handleStartSession=sd=>{
    const plan=PLANS[profile?.plan||"free"];
    if(plan.sessionsPerMonth!==Infinity&&sessionsUsed>=plan.sessionsPerMonth) {
      setScreen("paywall"); return;
    }
    setSession(sd); setScreen("session");
  };

  const handleEndSession=async(sd,msgs)=>{
    setLastSD(sd);
    setSessUsed(u=>u+1);
    const sessionRecord={...sd,profile_id:profile?.id,childName:profile?.childName};
    if(auth&&!auth.demo) {
      await sb.insertSession(auth.token, sessionRecord);
      const sess=await sb.getSessions(auth.token, profile.id);
      setSessions(Array.isArray(sess)?sess:[]);
    } else {
      setSessions(p=>[sessionRecord,...p]);
    }
    setScreen("summary");
  };

  const handleSaveProfile=async(updates)=>{
    const updated={...profile,...updates};
    if(auth&&!auth.demo) {
      const saved=await sb.upsertProfile(auth.token, updated);
      setProfile(saved||updated);
    } else {
      setProfile(updated);
    }
  };

  if(loadingProfile) return (
    <div style={{minHeight:"100vh",background:BG,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16,color:"white",fontFamily:"'Nunito',sans-serif"}}>
      <style>{CSS}</style>
      <div style={{fontSize:48}}>🚀</div>
      <Spinner/>
      <div style={{fontSize:12,color:"rgba(255,255,255,0.3)"}}>Cargando tu perfil...</div>
    </div>
  );

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap" rel="stylesheet"/>
      {screen==="auth"     && <AuthScreen onAuth={handleAuth}/>}
      {screen==="onboard"  && <OnboardingScreen onComplete={handleOnboard}/>}
      {screen==="upload"   && profile && (
        <UploadScreen profile={profile} auth={auth} sessionsUsed={sessionsUsed}
          onStart={handleStartSession}
          onGoParent={()=>setScreen("parent")}/>
      )}
      {screen==="session"  && profile && session && (
        <SessionScreen profile={profile} session={session}
          googleKey={profile.googleTtsKey||""}
          anthropicKey={profile.anthropicKey||""}
          onEnd={handleEndSession}/>
      )}
      {screen==="summary"  && profile && lastSD && (
        <SummaryScreen profile={profile} sd={lastSD} onNew={()=>setScreen("upload")}/>
      )}
      {screen==="parent"   && (
        <ParentDashboard auth={auth} profile={profile} sessions={sessions}
          onSaveProfile={handleSaveProfile}
          onBack={()=>setScreen("upload")}
          onLogout={()=>{setAuth(null);setProfile(null);setSessions([]);setScreen("auth");}}/>
      )}
      {screen==="paywall"  && (
        <PaywallScreen sessionsUsed={sessionsUsed} limit={PLANS[profile?.plan||"free"].sessionsPerMonth}
          plan={profile?.plan||"free"} onBack={()=>setScreen("upload")}/>
      )}
    </>
  );
}
