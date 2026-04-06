const { useState, useEffect, useRef } = React;

const SUPABASE_URL = "https://drsgwtyujltbnflfhaon.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyc2d3dHl1amx0Ym5mbGZoYW9uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0NzYxMDcsImV4cCI6MjA5MTA1MjEwN30.k6mBj1MLYcW87C5-6Ctt8mzuzyq_WzjlhNvMDyNhtMQ";
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const PHASES = ["Menstrual", "Ovulation", "Early Luteal", "Late Luteal", "Period Done", "No Log"];
const PHASE_COLORS = { "Menstrual":"#c0614a","Period Done":"#b08030","Ovulation":"#2a8a68","Early Luteal":"#3a7ab8","Late Luteal":"#6a5fb0","No Log":"#666" };
const MACRO_COLORS = { cal:"#E8704A", protein:"#2DB885", carbs:"#5BA3E8", fat:"#D4921A", fiber:"#9A8FE8", steps:"#E06B8F" };
const DEFAULT_GOALS = { cal: 2064, protein: 166, carbs: 175, fat: 78, fiber: 25, steps: 7500 };

function todayStr() { return new Date().toISOString().slice(0, 10); }
function addDays(s, n) { const d = new Date(s); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }
function dateRange(s, e) { const out = []; let c = new Date(s); const end = new Date(e); while (c <= end) { out.push(c.toISOString().slice(0,10)); c.setDate(c.getDate()+1); } return out; }
function calcTotals(items) { return (items||[]).reduce((a,i)=>({cal:a.cal+(i.cal||0),carbs:a.carbs+(i.carbs||0),protein:a.protein+(i.protein||0),fat:a.fat+(i.fat||0),fiber:a.fiber+(i.fiber||0)}),{cal:0,carbs:0,protein:0,fat:0,fiber:0}); }

function guessPhase(ds, cycleStart, cycleLength, periodLength) {
  if (!cycleStart) return "Ovulation";
  const diff = Math.round((new Date(ds) - new Date(cycleStart)) / 86400000);
  const d = ((diff % cycleLength) + cycleLength) % cycleLength;
  if (d < periodLength) return "Menstrual";
  if (d < periodLength + 1) return "Period Done";
  if (d < 13) return "Ovulation";
  if (d < 18) return "Early Luteal";
  return "Late Luteal";
}

function useDark() {
  const [dark, setDark] = useState(() => window.matchMedia("(prefers-color-scheme: dark)").matches);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const h = e => setDark(e.matches);
    mq.addEventListener("change", h); return () => mq.removeEventListener("change", h);
  }, []);
  return dark;
}

function theme(dark) {
  return {
    bg: dark?"#1c1c1e":"#ffffff", bgSecondary: dark?"#2c2c2e":"#f5f5f5",
    bgTertiary: dark?"#3a3a3c":"#e8e8e8", text: dark?"#f0f0f0":"#1a1a1a",
    textSecondary: dark?"#aaaaaa":"#555555", textTertiary: dark?"#666666":"#999999",
    border: dark?"#3a3a3c":"#dddddd", borderStrong: dark?"#555555":"#bbbbbb",
    inputBg: dark?"#2c2c2e":"#ffffff",
  };
}

function ProgressBar({ label, value, target, unit, color, t }) {
  const pct = Math.min(100, Math.round((value/target)*100));
  return (
    <div style={{marginBottom:14}}>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:14,marginBottom:5}}>
        <span style={{color:t.textSecondary}}>{label}</span>
        <span style={{fontWeight:500,color:t.text}}>{Math.round(value)}{unit} <span style={{color:t.textTertiary,fontWeight:400}}>/ {target}{unit}</span></span>
      </div>
      <div style={{height:8,borderRadius:4,background:t.bgTertiary,overflow:"hidden"}}>
        <div style={{height:"100%",width:`${pct}%`,background:color,borderRadius:4}}/>
      </div>
    </div>
  );
}

function FoodTable({ items, t }) {
  if (!items || !items.length) return null;
  const tot = calcTotals(items);
  return (
    <div style={{overflowX:"auto"}}>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
        <thead>
          <tr style={{borderBottom:`0.5px solid ${t.border}`}}>
            {["Item","Cal","Carbs","Pro","Fat","Fiber"].map(h=>(
              <th key={h} style={{textAlign:h==="Item"?"left":"right",padding:"5px",color:t.textSecondary,fontWeight:500,whiteSpace:"nowrap"}}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item,i)=>(
            <tr key={i} style={{borderBottom:`0.5px solid ${t.border}`}}>
              <td style={{padding:"7px 5px",color:t.text,maxWidth:120,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.name}</td>
              <td style={{textAlign:"right",padding:"7px 5px",color:t.text}}>{item.cal}</td>
              <td style={{textAlign:"right",padding:"7px 5px",color:t.text}}>{item.carbs}g</td>
              <td style={{textAlign:"right",padding:"7px 5px",color:t.text}}>{item.protein}g</td>
              <td style={{textAlign:"right",padding:"7px 5px",color:t.text}}>{item.fat}g</td>
              <td style={{textAlign:"right",padding:"7px 5px",color:t.text}}>{item.fiber}g</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{borderTop:`1px solid ${t.borderStrong}`}}>
            <td style={{padding:"7px 5px",fontWeight:500,color:t.text}}>Total</td>
            {[tot.cal,tot.carbs,tot.protein,tot.fat,tot.fiber].map((v,i)=>(
              <td key={i} style={{textAlign:"right",padding:"7px 5px",fontWeight:500,color:t.text}}>{Math.round(v)}{i>0?"g":""}</td>
            ))}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function PhotoPreview({ photos, uploading, onRemove, t }) {
  if (!photos.length && !uploading) return null;
  return (
    <div style={{display:"flex",gap:8,flexWrap:"wrap",padding:"8px 8px 0"}}>
      {photos.map((src,i)=>(
        <div key={i} style={{position:"relative",width:56,height:56}}>
          <img src={`data:image/jpeg;base64,${src}`} style={{width:56,height:56,borderRadius:8,objectFit:"cover",border:`1px solid ${t.border}`}}/>
          <div onClick={()=>onRemove(i)} style={{position:"absolute",top:-5,right:-5,width:18,height:18,borderRadius:9,background:t.bgTertiary,border:`1px solid ${t.border}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:10,color:t.text}}>✕</div>
        </div>
      ))}
      {uploading && (
        <div style={{width:56,height:56,borderRadius:8,border:`1px dashed ${t.border}`,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{width:20,height:20,border:`2px solid ${t.border}`,borderTopColor:t.textSecondary,borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
        </div>
      )}
    </div>
  );
}

function ChatInput({ onSubmit, loading, t }) {
  const [input, setInput] = useState("");
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const handleFiles = e => {
    const files = Array.from(e.target.files); if (!files.length) return;
    setUploading(true);
    Promise.all(files.map(f=>new Promise(res=>{const r=new FileReader();r.onload=ev=>res(ev.target.result.split(",")[1]);r.readAsDataURL(f);}))).then(results=>{setPhotos(p=>[...p,...results]);setUploading(false);});
    e.target.value="";
  };

  const submit = () => {
    if (uploading||loading||(!input.trim()&&!photos.length)) return;
    onSubmit(input.trim(), photos.length?photos:null);
    setInput(""); setPhotos([]);
  };

  const canSend = !uploading && !loading && (input.trim()||photos.length);

  return (
    <div style={{border:`1px solid ${t.border}`,borderRadius:14,background:t.inputBg,overflow:"hidden"}}>
      <PhotoPreview photos={photos} uploading={uploading} onRemove={i=>setPhotos(p=>p.filter((_,j)=>j!==i))} t={t}/>
      {photos.length>0 && <div style={{height:"0.5px",background:t.border}}/>}
      <div style={{display:"flex",alignItems:"flex-end",padding:"4px 4px 4px 8px",gap:6}}>
        <textarea value={input} onChange={e=>setInput(e.target.value)} placeholder="What did you eat?"
          style={{flex:1,border:"none",background:"transparent",fontSize:15,color:t.text,fontFamily:"inherit",resize:"none",minHeight:44,maxHeight:120,outline:"none",padding:"10px 0",lineHeight:1.4}}
          onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();submit();}}}/>
        <button onClick={()=>fileRef.current.click()} style={{width:34,height:34,borderRadius:17,border:`1px solid ${t.border}`,background:t.bgSecondary,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,color:t.textSecondary,fontSize:20}}>+</button>
        <button onClick={submit} disabled={!canSend} style={{width:34,height:34,borderRadius:17,border:"none",background:canSend?"#2DB885":t.bgTertiary,cursor:canSend?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          {loading
            ? <div style={{width:16,height:16,border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
            : <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 13V3M3 8l5-5 5 5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          }
        </button>
      </div>
      <input ref={fileRef} type="file" accept="image/*" multiple style={{display:"none"}} onChange={handleFiles}/>
    </div>
  );
}

function PhaseChip({ phase, onSelect, t }) {
  const [open, setOpen] = useState(false);
  const color = PHASE_COLORS[phase] || "#666";
  return (
    <div style={{position:"relative",display:"inline-block"}}>
      <div onClick={()=>setOpen(o=>!o)} style={{fontSize:12,padding:"3px 10px",borderRadius:10,background:color,color:"#fff",cursor:"pointer",userSelect:"none"}}>
        {phase||"Set phase"} ▾
      </div>
      {open && (
        <div style={{position:"absolute",top:28,right:0,zIndex:20,background:t.inputBg,border:`1px solid ${t.border}`,borderRadius:10,overflow:"hidden",minWidth:150,boxShadow:"0 4px 16px rgba(0,0,0,0.2)"}}>
          {PHASES.map(p=>(
            <div key={p} onClick={()=>{onSelect(p);setOpen(false);}} style={{padding:"10px 14px",fontSize:13,color:t.text,cursor:"pointer",background:p===phase?t.bgSecondary:"transparent",borderBottom:`0.5px solid ${t.border}`,display:"flex",alignItems:"center",gap:8}}>
              <span style={{width:10,height:10,borderRadius:5,background:PHASE_COLORS[p]||"#666",display:"inline-block"}}/>{p}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Onboarding({ onDone, t }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [goals, setGoals] = useState(DEFAULT_GOALS);
  const [cycleLength, setCycleLength] = useState(27);
  const [periodLength, setPeriodLength] = useState(6);
  const [cycleStart, setCycleStart] = useState(todayStr());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const inputStyle = { width:"100%", padding:"12px", borderRadius:10, border:`1px solid ${t.border}`, fontSize:16, background:t.inputBg, color:t.text, fontFamily:"inherit", boxSizing:"border-box" };
  const labelStyle = { fontSize:12, color:t.textSecondary, display:"block", marginBottom:5 };

  const finish = async () => {
    setSaving(true); setError("");
    const { data, error } = await sb.from("users").insert({ goals, cycle_length: cycleLength, period_length: periodLength, cycle_start: cycleStart }).select().single();
    if (error) { setError(error.message); setSaving(false); return; }
    localStorage.setItem("ht_user_id", data.id);
    onDone(data);
    setSaving(false);
  };

  const steps = [
    <div key="0">
      <h2 style={{fontSize:22,fontWeight:600,color:t.text,marginBottom:8}}>Welcome to Health Tracker</h2>
      <p style={{fontSize:15,color:t.textSecondary,marginBottom:32}}>Let's set up your personal goals and cycle info. You can change these anytime in Settings.</p>
      <div style={{marginBottom:16}}>
        <label style={labelStyle}>Your name</label>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Alvita" style={inputStyle}/>
      </div>
      <button onClick={()=>setStep(1)} style={{width:"100%",padding:"14px",borderRadius:10,border:"none",background:"#2DB885",cursor:"pointer",fontSize:15,fontWeight:600,color:"#fff"}}>Continue</button>
    </div>,

    <div key="1">
      <h2 style={{fontSize:20,fontWeight:600,color:t.text,marginBottom:6}}>Daily nutrition goals</h2>
      <p style={{fontSize:13,color:t.textSecondary,marginBottom:20}}>These are your daily targets. Adjust to match your plan.</p>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:24}}>
        {[["Calories (kcal)","cal"],["Protein (g)","protein"],["Carbs (g)","carbs"],["Fat (g)","fat"],["Fiber (g)","fiber"],["Steps","steps"]].map(([lbl,key])=>(
          <div key={key}>
            <label style={labelStyle}>{lbl}</label>
            <input type="number" value={goals[key]} onChange={e=>setGoals(g=>({...g,[key]:Number(e.target.value)}))} style={{...inputStyle,padding:"10px"}}/>
          </div>
        ))}
      </div>
      <div style={{display:"flex",gap:8}}>
        <button onClick={()=>setStep(0)} style={{flex:1,padding:"14px",borderRadius:10,border:`1px solid ${t.border}`,background:"transparent",cursor:"pointer",fontSize:15,color:t.textSecondary}}>Back</button>
        <button onClick={()=>setStep(2)} style={{flex:2,padding:"14px",borderRadius:10,border:"none",background:"#2DB885",cursor:"pointer",fontSize:15,fontWeight:600,color:"#fff"}}>Continue</button>
      </div>
    </div>,

    <div key="2">
      <h2 style={{fontSize:20,fontWeight:600,color:t.text,marginBottom:6}}>Cycle settings</h2>
      <p style={{fontSize:13,color:t.textSecondary,marginBottom:20}}>Used to auto-suggest your menstrual phase each day.</p>
      <div style={{marginBottom:14}}>
        <label style={labelStyle}>Average cycle length (days)</label>
        <input type="number" value={cycleLength} onChange={e=>setCycleLength(Number(e.target.value))} style={inputStyle}/>
      </div>
      <div style={{marginBottom:14}}>
        <label style={labelStyle}>Average period length (days)</label>
        <input type="number" value={periodLength} onChange={e=>setPeriodLength(Number(e.target.value))} style={inputStyle}/>
      </div>
      <div style={{marginBottom:24}}>
        <label style={labelStyle}>When did your last cycle start?</label>
        <input type="date" value={cycleStart} onChange={e=>setCycleStart(e.target.value)} style={inputStyle}/>
      </div>
      {error && <div style={{marginBottom:12,fontSize:13,color:"#c0614a"}}>{error}</div>}
      <div style={{display:"flex",gap:8}}>
        <button onClick={()=>setStep(1)} style={{flex:1,padding:"14px",borderRadius:10,border:`1px solid ${t.border}`,background:"transparent",cursor:"pointer",fontSize:15,color:t.textSecondary}}>Back</button>
        <button onClick={finish} disabled={saving} style={{flex:2,padding:"14px",borderRadius:10,border:"none",background:"#2DB885",cursor:"pointer",fontSize:15,fontWeight:600,color:"#fff"}}>
          {saving?"Setting up...":"Get started"}
        </button>
      </div>
    </div>
  ];

  return (
    <div style={{maxWidth:480,margin:"0 auto",padding:"48px 24px",background:t.bg,minHeight:"100vh"}}>
      <div style={{display:"flex",gap:6,marginBottom:32}}>
        {[0,1,2].map(i=><div key={i} style={{flex:1,height:3,borderRadius:2,background:i<=step?"#2DB885":t.bgTertiary}}/>)}
      </div>
      {steps[step]}
    </div>
  );
}

function App() {
  const dark = useDark();
  const t = theme(dark);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("log");
  const [foodLogs, setFoodLogs] = useState({});
  const [dailyLogs, setDailyLogs] = useState({});
  const today = todayStr();

  useEffect(() => {
    const uid = localStorage.getItem("ht_user_id");
    if (uid) {
      sb.from("users").select("*").eq("id", uid).single().then(({ data }) => {
        if (data) { setUser(data); fetchLogs(uid); }
        else setLoading(false);
      });
    } else setLoading(false);
  }, []);

  const fetchLogs = async (uid) => {
    const [fl, dl] = await Promise.all([
      sb.from("food_logs").select("*").eq("user_id", uid),
      sb.from("daily_logs").select("*").eq("user_id", uid)
    ]);
    const fm = {}; (fl.data||[]).forEach(r => fm[r.date] = r);
    const dm = {}; (dl.data||[]).forEach(r => dm[r.date] = r);
    setFoodLogs(fm); setDailyLogs(dm); setLoading(false);
  };

  const upsertFoodLog = async (date, updates) => {
    const existing = foodLogs[date];
    const payload = { user_id: user.id, date, ...updates, updated_at: new Date().toISOString() };
    let result;
    if (existing?.id) {
      result = await sb.from("food_logs").update(payload).eq("id", existing.id).select().single();
    } else {
      result = await sb.from("food_logs").insert(payload).select().single();
    }
    if (result.data) setFoodLogs(prev => ({ ...prev, [date]: result.data }));
  };

  const upsertDailyLog = async (date, updates) => {
    const existing = dailyLogs[date];
    const payload = { user_id: user.id, date, ...updates, updated_at: new Date().toISOString() };
    let result;
    if (existing?.id) {
      result = await sb.from("daily_logs").update(payload).eq("id", existing.id).select().single();
    } else {
      result = await sb.from("daily_logs").insert(payload).select().single();
    }
    if (result.data) setDailyLogs(prev => ({ ...prev, [date]: result.data }));
  };

  const updateUser = async (updates) => {
    const { data } = await sb.from("users").update(updates).eq("id", user.id).select().single();
    if (data) setUser(data);
  };

  if (loading) return <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:t.bg,color:t.textSecondary,fontSize:14}}>Loading...</div>;
  if (!user) return <Onboarding onDone={u=>{setUser(u);fetchLogs(u.id);}} t={t}/>;

  const goals = user.goals || DEFAULT_GOALS;
  const todayFood = foodLogs[today] || {};
  const todayDaily = dailyLogs[today] || {};
  const currentPhase = todayDaily.menstrual_phase || guessPhase(today, user.cycle_start, user.cycle_length, user.period_length);

  const tabs = [{id:"log",label:"Log"},{id:"daily",label:"Daily"},{id:"progress",label:"Progress"},{id:"cycle",label:"Cycle"},{id:"settings",label:"Settings"}];

  return (
    <div style={{maxWidth:480,margin:"0 auto",padding:"12px 16px 80px",background:t.bg,minHeight:"100vh"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
        <div style={{fontSize:12,color:t.textSecondary}}>{new Date().toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</div>
        <PhaseChip phase={currentPhase} t={t} onSelect={phase=>{
          upsertDailyLog(today, { menstrual_phase: phase });
          if (phase==="Menstrual") {
            for(let i=1;i<user.period_length;i++){const d=addDays(today,i);if(!dailyLogs[d]?.menstrual_phase)upsertDailyLog(d,{menstrual_phase:"Menstrual"});}
            upsertDailyLog(addDays(today,user.period_length),{menstrual_phase:"Period Done"});
          }
        }}/>
      </div>

      {tab==="log" && <FoodLogTab today={today} foodLog={todayFood} goals={goals} upsertFoodLog={upsertFoodLog} t={t}/>}
      {tab==="daily" && <DailyTab today={today} dailyLog={todayDaily} foodLog={todayFood} goals={goals} upsertDailyLog={upsertDailyLog} dailyLogs={dailyLogs} t={t}/>}
      {tab==="progress" && <ProgressTab today={today} foodLogs={foodLogs} dailyLogs={dailyLogs} goals={goals} user={user} t={t}/>}
      {tab==="cycle" && <CycleTab today={today} foodLogs={foodLogs} dailyLogs={dailyLogs} user={user} t={t}/>}
      {tab==="settings" && <SettingsTab user={user} updateUser={updateUser} t={t}/>}

      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,background:t.bg,borderTop:`1px solid ${t.border}`,display:"flex",zIndex:10}}>
        {tabs.map(tb=>(
          <button key={tb.id} onClick={()=>setTab(tb.id)} style={{flex:1,padding:"13px 0 11px",border:"none",background:"transparent",cursor:"pointer",fontSize:12,fontWeight:tab===tb.id?600:400,color:tab===tb.id?t.text:t.textTertiary,borderTop:tab===tb.id?`2px solid ${t.text}`:"2px solid transparent"}}>{tb.label}</button>
        ))}
      </div>
    </div>
  );
}

function FoodLogTab({ today, foodLog, goals, upsertFoodLog, t }) {
  const [stage, setStage] = useState("idle");
  const [pending, setPending] = useState(null);
  const [loading, setLoading] = useState(false);
  const [clarifyQ, setClarifyQ] = useState("");
  const items = foodLog.items || [];
  const totals = calcTotals(items);
  const locked = foodLog.locked;

  const estimate = async (msg, photos, isCorrection=false, prev=null) => {
    setLoading(true); setClarifyQ("");
    const sys = `You are a nutrition estimator for a health tracker app. Users are often in Indonesia/Bali.
If input is VERY vague, respond: {"action":"clarify","questions":"1-2 short questions"}
Otherwise: {"action":"estimate","items":[{"name":"short name","cal":0,"carbs":0,"protein":0,"fat":0,"fiber":0}]}
If correction to previous estimate: adjust accordingly. Know Indonesian/Balinese food well. Numbers only (no units). Valid JSON only, no markdown.`;
    let content;
    if (isCorrection && prev) content = `Previous: ${JSON.stringify(prev)}\nCorrection: ${msg}`;
    else if (photos && photos.length) content = [...photos.map(d=>({type:"image",source:{type:"base64",media_type:"image/jpeg",data:d}})),{type:"text",text:msg||"Estimate nutrition from all food items in these photos."}];
    else content = msg;
    try {
      const res = await fetch("/api/estimate",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,system:sys,messages:[{role:"user",content}]})
      });
      const d = await res.json();
      const text = d.content?.find(c=>c.type==="text")?.text||"";
      const parsed = JSON.parse(text.replace(/```json|```/g,"").trim());
      if (parsed.action==="clarify"){setClarifyQ(parsed.questions);setStage("clarify");}
      else{setPending(parsed.items);setStage("confirm");}
    } catch{setClarifyQ("Couldn't estimate — try describing it differently.");setStage("clarify");}
    setLoading(false);
  };

  const formatDate = new Date(today).toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"});

  if (locked) return (
    <div>
      <div style={{fontSize:16,fontWeight:600,marginBottom:16,color:t.text}}>{formatDate}</div>
      <FoodTable items={items} t={t}/>
      <div style={{marginTop:20}}>
        {[["Calories",totals.cal,goals.cal,"",MACRO_COLORS.cal],["Protein",totals.protein,goals.protein,"g",MACRO_COLORS.protein],["Carbs",totals.carbs,goals.carbs,"g",MACRO_COLORS.carbs],["Fat",totals.fat,goals.fat,"g",MACRO_COLORS.fat],["Fiber",totals.fiber,goals.fiber,"g",MACRO_COLORS.fiber]].map(([l,v,tg,u,c])=>(
          <ProgressBar key={l} label={l} value={v} target={tg} unit={u} color={c} t={t}/>
        ))}
      </div>
      <button onClick={()=>upsertFoodLog(today,{items,locked:false})} style={{marginTop:16,width:"100%",padding:"13px",borderRadius:10,border:`1px solid ${t.border}`,background:"transparent",cursor:"pointer",fontSize:13,color:t.textSecondary}}>Unlock to edit</button>
    </div>
  );

  return (
    <div>
      <div style={{fontSize:16,fontWeight:600,marginBottom:14,color:t.text}}>{formatDate}</div>
      <FoodTable items={items} t={t}/>
      {items.length>0 && (
        <div style={{marginTop:8,display:"flex",flexWrap:"wrap",gap:5,marginBottom:10}}>
          {items.map((item,i)=>(
            <span key={i} onClick={()=>upsertFoodLog(today,{items:items.filter((_,j)=>j!==i),locked:false})} style={{fontSize:12,padding:"4px 10px",borderRadius:20,background:t.bgSecondary,border:`1px solid ${t.border}`,cursor:"pointer",color:t.textSecondary}}>{item.name} ✕</span>
          ))}
        </div>
      )}

      {stage==="confirm" && pending && (
        <div style={{marginTop:14,padding:14,border:`1px solid ${t.border}`,borderRadius:12,background:t.bgSecondary,marginBottom:14}}>
          <div style={{fontSize:14,fontWeight:600,marginBottom:10,color:t.text}}>Does this look right?</div>
          <FoodTable items={pending} t={t}/>
          <div style={{display:"flex",gap:8,marginTop:12}}>
            <button onClick={()=>{upsertFoodLog(today,{items:[...items,...pending],locked:false});setPending(null);setStage("idle");}} style={{flex:1,padding:"12px",borderRadius:10,border:`1px solid ${t.border}`,background:t.bgSecondary,cursor:"pointer",fontSize:14,fontWeight:600,color:t.text}}>Save</button>
            <button onClick={()=>setStage("correct")} style={{flex:1,padding:"12px",borderRadius:10,border:`1px solid ${t.border}`,background:"transparent",cursor:"pointer",fontSize:14,color:t.textSecondary}}>Something's off</button>
          </div>
        </div>
      )}

      {(stage==="clarify"||stage==="correct") && (
        <div style={{marginTop:10,padding:"12px 14px",borderRadius:10,background:t.bgSecondary,fontSize:14,color:t.textSecondary,border:`1px solid ${t.border}`,marginBottom:10}}>
          {stage==="clarify"?clarifyQ:"What should I fix?"}
        </div>
      )}

      <ChatInput onSubmit={(msg,photos)=>{
        if(stage==="correct") estimate(msg,null,true,pending);
        else if(stage==="clarify") estimate(msg,null);
        else estimate(msg,photos);
      }} loading={loading} t={t}/>

      {items.length>0 && (
        <div style={{marginTop:22}}>
          {[["Calories",totals.cal,goals.cal,"",MACRO_COLORS.cal],["Protein",totals.protein,goals.protein,"g",MACRO_COLORS.protein],["Carbs",totals.carbs,goals.carbs,"g",MACRO_COLORS.carbs],["Fat",totals.fat,goals.fat,"g",MACRO_COLORS.fat],["Fiber",totals.fiber,goals.fiber,"g",MACRO_COLORS.fiber]].map(([l,v,tg,u,c])=>(
            <ProgressBar key={l} label={l} value={v} target={tg} unit={u} color={c} t={t}/>
          ))}
          <button onClick={()=>upsertFoodLog(today,{items,locked:true})} style={{marginTop:10,width:"100%",padding:"14px",borderRadius:10,border:`1px solid ${t.border}`,background:t.bgSecondary,cursor:"pointer",fontSize:15,fontWeight:600,color:t.text}}>
            Done for today
          </button>
        </div>
      )}
    </div>
  );
}

function DailyTab({ today, dailyLog, foodLog, goals, upsertDailyLog, dailyLogs, t }) {
  const lastComp = (() => {
    const keys = Object.keys(dailyLogs).filter(k=>k<today&&dailyLogs[k]?.body_comp).sort().reverse();
    return keys.length ? dailyLogs[keys[0]].body_comp : {};
  })();
  const comp = dailyLog.body_comp || lastComp || {};
  const [steps,setSteps]=useState(dailyLog.steps||"");
  const [notes,setNotes]=useState(dailyLog.notes||"");
  const [weight,setWeight]=useState(comp.weight||"");
  const [bf,setBf]=useState(comp.bf||"");
  const [muscle,setMuscle]=useState(comp.muscle||"");
  const [visceral,setVisceral]=useState(comp.visceral||"");
  const [bmr,setBmr]=useState(comp.bmr||"");
  const [saved,setSaved]=useState(false);

  const inputStyle={width:"100%",padding:"12px",borderRadius:10,border:`1px solid ${t.border}`,fontSize:16,background:t.inputBg,color:t.text,fontFamily:"inherit",boxSizing:"border-box"};
  const labelStyle={fontSize:12,color:t.textSecondary,display:"block",marginBottom:5};

  const save = async () => {
    await upsertDailyLog(today,{steps:steps?Number(steps):null,notes,body_comp:{weight,bf,muscle,visceral,bmr}});
    setSaved(true); setTimeout(()=>setSaved(false),2000);
  };

  const totals = calcTotals(foodLog.items);

  return (
    <div>
      <div style={{fontSize:16,fontWeight:600,marginBottom:16,color:t.text}}>{new Date(today).toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long"})}</div>

      <div style={{marginBottom:14,padding:14,borderRadius:12,border:`1px solid ${t.border}`,background:t.bgSecondary}}>
        <div style={{fontSize:13,fontWeight:600,color:t.textSecondary,marginBottom:10}}>Today's snapshot</div>
        <ProgressBar label="Calories" value={totals.cal} target={goals.cal} unit="" color={MACRO_COLORS.cal} t={t}/>
        <ProgressBar label="Protein" value={totals.protein} target={goals.protein} unit="g" color={MACRO_COLORS.protein} t={t}/>
        <ProgressBar label="Steps" value={dailyLog.steps||0} target={goals.steps} unit="" color={MACRO_COLORS.steps} t={t}/>
      </div>

      <div style={{marginBottom:14}}><label style={labelStyle}>Steps</label><input type="number" value={steps} onChange={e=>setSteps(e.target.value)} placeholder="e.g. 7500" style={inputStyle}/></div>
      <div style={{marginBottom:22}}><label style={labelStyle}>Activity notes</label><input value={notes} onChange={e=>setNotes(e.target.value)} placeholder="e.g. Hyrox 4k, strength" style={inputStyle}/></div>

      <div style={{fontSize:13,fontWeight:600,color:t.textSecondary,marginBottom:12}}>Body composition <span style={{fontWeight:400,fontSize:12}}>(auto-filled from last entry)</span></div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:22}}>
        {[["Weight (kg)",weight,setWeight],["Body fat %",bf,setBf],["Muscle %",muscle,setMuscle],["Visceral fat",visceral,setVisceral],["BMR",bmr,setBmr]].map(([lbl,val,setter])=>(
          <div key={lbl}><label style={{...labelStyle,fontSize:11}}>{lbl}</label><input type="number" value={val} onChange={e=>setter(e.target.value)} step="0.1" style={{...inputStyle,fontSize:15,padding:"10px"}}/></div>
        ))}
      </div>
      <button onClick={save} style={{width:"100%",padding:"14px",borderRadius:10,border:`1px solid ${t.border}`,background:saved?"#1a5c3a":t.bgSecondary,cursor:"pointer",fontSize:15,fontWeight:600,color:saved?"#2DB885":t.text}}>
        {saved?"Saved ✓":"Save day"}
      </button>
    </div>
  );
}

function ProgressTab({ today, foodLogs, dailyLogs, goals, user, t }) {
  const [view,setView]=useState("daily");

  const getDays = () => {
    if(view==="daily") return [today];
    if(view==="weekly"){const diff=Math.round((new Date(today)-new Date(user.cycle_start))/86400000);return dateRange(addDays(user.cycle_start,Math.floor(diff/7)*7),today);}
    if(view==="monthly"){const s=new Date(today);s.setDate(1);return dateRange(s.toISOString().slice(0,10),today);}
    if(view==="phase"){const ph=dailyLogs[today]?.menstrual_phase||guessPhase(today,user.cycle_start,user.cycle_length,user.period_length);return Object.keys(dailyLogs).filter(d=>d<=today&&(dailyLogs[d]?.menstrual_phase||guessPhase(d,user.cycle_start,user.cycle_length,user.period_length))===ph).sort();}
    return [today];
  };

  const days=getDays();
  const avg=key=>{const rel=days.filter(d=>foodLogs[d]?.items?.length);return rel.length?rel.reduce((s,d)=>s+calcTotals(foodLogs[d].items)[key],0)/rel.length:0;};
  const avgSteps=()=>{const rel=days.filter(d=>dailyLogs[d]?.steps);return rel.length?rel.reduce((s,d)=>s+dailyLogs[d].steps,0)/rel.length:0;};
  const m={cal:avg("cal"),protein:avg("protein"),carbs:avg("carbs"),fat:avg("fat"),fiber:avg("fiber"),steps:avgSteps()};

  return (
    <div>
      <div style={{display:"flex",gap:6,marginBottom:18}}>
        {["daily","weekly","monthly","phase"].map(v=>(
          <button key={v} onClick={()=>setView(v)} style={{flex:1,padding:"9px 0",borderRadius:20,fontSize:12,border:`1px solid ${v===view?t.borderStrong:t.border}`,background:v===view?t.bgSecondary:"transparent",cursor:"pointer",fontWeight:v===view?600:400,color:v===view?t.text:t.textSecondary}}>
            {v.charAt(0).toUpperCase()+v.slice(1)}
          </button>
        ))}
      </div>
      <div style={{fontSize:12,color:t.textTertiary,marginBottom:16}}>{view==="daily"?"Today":"Daily average"} · {days.length} day{days.length>1?"s":""}</div>
      {[["Calories",m.cal,goals.cal,"",MACRO_COLORS.cal],["Protein",m.protein,goals.protein,"g",MACRO_COLORS.protein],["Carbs",m.carbs,goals.carbs,"g",MACRO_COLORS.carbs],["Fat",m.fat,goals.fat,"g",MACRO_COLORS.fat],["Fiber",m.fiber,goals.fiber,"g",MACRO_COLORS.fiber],["Steps",m.steps,goals.steps,"",MACRO_COLORS.steps]].map(([l,v,tg,u,c])=>(
        <ProgressBar key={l} label={l} value={v} target={tg} unit={u} color={c} t={t}/>
      ))}
    </div>
  );
}

function CycleTab({ today, foodLogs, dailyLogs, user, t }) {
  const cycleStart = user.cycle_start;
  if (!cycleStart) return <div style={{padding:"40px 0",textAlign:"center",color:t.textTertiary}}>Set your cycle start date in Settings.</div>;
  const days = dateRange(cycleStart, today);
  return (
    <div>
      <div style={{fontSize:13,color:t.textSecondary,marginBottom:14}}>Cycle from {new Date(cycleStart).toLocaleDateString("en-GB",{day:"numeric",month:"short"})}</div>
      {days.map(d=>{
        const fl=foodLogs[d]||{};
        const dl=dailyLogs[d]||{};
        const phase=dl.menstrual_phase||guessPhase(d,user.cycle_start,user.cycle_length,user.period_length);
        const cal=calcTotals(fl.items).cal;
        const isToday=d===today;
        return (
          <div key={d} style={{padding:"10px 12px",marginBottom:6,borderRadius:10,border:`1px solid ${isToday?t.borderStrong:t.border}`,background:isToday?t.bgSecondary:t.bg}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
              <span style={{fontSize:14,fontWeight:isToday?600:400,color:t.text}}>{new Date(d).toLocaleDateString("en-GB",{weekday:"short",day:"numeric",month:"short"})}</span>
              <span style={{fontSize:11,padding:"2px 9px",borderRadius:10,background:PHASE_COLORS[phase]||"#555",color:"#fff"}}>{phase}</span>
            </div>
            <div style={{fontSize:13,color:t.textSecondary,display:"flex",gap:14}}>
              <span>{cal?`${cal} cal`:"—"}</span>
              <span>{dl.steps?`${dl.steps} steps`:"—"}</span>
              {dl.notes&&<span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1}}>{dl.notes}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SettingsTab({ user, updateUser, t }) {
  const [goals,setGoals]=useState(user.goals||DEFAULT_GOALS);
  const [cycleLength,setCycleLength]=useState(user.cycle_length||27);
  const [periodLength,setPeriodLength]=useState(user.period_length||6);
  const [cycleStart,setCycleStart]=useState(user.cycle_start||"");
  const [saved,setSaved]=useState(false);

  const inputStyle={width:"100%",padding:"12px",borderRadius:10,border:`1px solid ${t.border}`,fontSize:15,background:t.inputBg,color:t.text,fontFamily:"inherit",boxSizing:"border-box"};
  const labelStyle={fontSize:12,color:t.textSecondary,display:"block",marginBottom:5};

  const save = async () => {
    await updateUser({goals,cycle_length:cycleLength,period_length:periodLength,cycle_start:cycleStart});
    setSaved(true); setTimeout(()=>setSaved(false),2000);
  };

  return (
    <div>
      <div style={{fontSize:16,fontWeight:600,marginBottom:20,color:t.text}}>Settings</div>

      <div style={{fontSize:13,fontWeight:600,color:t.textSecondary,marginBottom:12}}>Daily goals</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:24}}>
        {[["Calories","cal"],["Protein (g)","protein"],["Carbs (g)","carbs"],["Fat (g)","fat"],["Fiber (g)","fiber"],["Steps","steps"]].map(([lbl,key])=>(
          <div key={key}><label style={{...labelStyle,fontSize:11}}>{lbl}</label><input type="number" value={goals[key]} onChange={e=>setGoals(g=>({...g,[key]:Number(e.target.value)}))} style={{...inputStyle,padding:"10px"}}/></div>
        ))}
      </div>

      <div style={{fontSize:13,fontWeight:600,color:t.textSecondary,marginBottom:12}}>Cycle settings</div>
      <div style={{marginBottom:12}}><label style={labelStyle}>Cycle length (days)</label><input type="number" value={cycleLength} onChange={e=>setCycleLength(Number(e.target.value))} style={inputStyle}/></div>
      <div style={{marginBottom:12}}><label style={labelStyle}>Period length (days)</label><input type="number" value={periodLength} onChange={e=>setPeriodLength(Number(e.target.value))} style={inputStyle}/></div>
      <div style={{marginBottom:24}}><label style={labelStyle}>Current cycle start date</label><input type="date" value={cycleStart} onChange={e=>setCycleStart(e.target.value)} style={inputStyle}/></div>

      <button onClick={save} style={{width:"100%",padding:"14px",borderRadius:10,border:`1px solid ${t.border}`,background:saved?"#1a5c3a":t.bgSecondary,cursor:"pointer",fontSize:15,fontWeight:600,color:saved?"#2DB885":t.text}}>
        {saved?"Saved ✓":"Save settings"}
      </button>

      <div style={{marginTop:32,padding:14,borderRadius:12,border:`1px solid ${t.border}`,background:t.bgSecondary}}>
        <div style={{fontSize:13,fontWeight:600,color:t.textSecondary,marginBottom:4}}>Account</div>
        <div style={{fontSize:12,color:t.textTertiary}}>User ID: {user.id}</div>
        <button onClick={()=>{localStorage.removeItem("ht_user_id");window.location.reload();}} style={{marginTop:12,width:"100%",padding:"11px",borderRadius:10,border:`1px solid ${t.border}`,background:"transparent",cursor:"pointer",fontSize:13,color:"#c0614a"}}>Sign out</button>
      </div>
    </div>
  );
}

ReactDOM.render(<App/>, document.getElementById("root"));
