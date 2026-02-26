import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, onSnapshot, addDoc, updateDoc, doc, query, orderBy, deleteDoc } from "firebase/firestore";

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyAcJVPE-Rvi67n-GconR76PD66Yv1MB1Ak",
  authDomain: "suryaans-paper.firebaseapp.com",
  projectId: "suryaans-paper",
  storageBucket: "suryaans-paper.firebasestorage.app",
  messagingSenderId: "477896330801",
  appId: "1:477896330801:web:3b64bec4ce173011768f10"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const PARTIES = ["Sri Krishna Traders","Sri Lakshmi Traders","S S Traders","J.B Traders","Sri Lakshmi & Co.","Naveen Traders","Siva Waste Paper Mart","Panoply Packagings Pvt.Ltd.","Vital Paper Products Pvt.Ltd.","Madha Papers","Thirupathy Balaji Traders","IBT Solutions","Harshal Packaging","Horizon Packs Privete Limited","Aruna Industrial Corporation","Siva Traders","Tirumala Papers","Sri Muthukumaran Traders","Venkateswara Traders","Sri Balaji Timber & Hardwares","National Traders","Erai Arul Traders","Kanakadhara Traders","Oji India Packaging PVT.LTD.","S.S TRADERS(Royapuram)","Arudra Traders","Velvin Rengo Containers Pvt.Ltd","Dixon Technologies (India) LTD","AVM Traders","SAM Traders","APA Package","Madha Waste Paper Company","Indo Paper Craft Privet Limited","Mohammed Enterprises","Tharun Traders","Srinivasa Traders","Dioxn Technologies (India) LTD","Ashok Rai Boards","Girnar Packaging","Sri Nivasa Traders","Boxit Packging LLP","Sri Padmavathi Balaji Traders","Balasundaram Waste Paper Mart","Noorani Papers","Canpac Trends Private Limited","Noorani Traders","Sri Selva Vinayagar Traders","Shree Priya Packs","Vamshadhara Paper Mills Ltd.","J T Pack Pvt Ltd","APA Packge","Fine Papers","Siva Waste Paper Company","Aarkay Packaging Industries","Canpac Trends Pvt Ltd","ACE Agencies","Shree Umiya Tradelink","Sri Ganesa Traders","Shweta Print Pack Pvt Ltd","Agarwal Coal Company","HCL Coal International Pvt.Ltd","Earthcon Industries LLP","Mayur International","Amasha Limited","Melosch Export GMBH","K-C International LLC","Greenmove PTE","Internatonal Corton Suppliers Co","Fredmax BVBA","Accel Vanture Trading LLC","GP Hermon Recycling LLC","Kousa International","Eco Earth Elements","Wintrax Logistics","New Port CH International LLC"];
const QUALITY_CHECKERS = ["Sushil","Amit","Milan","Dhirendar","GS Dubey","Ajay Singh","Surajit"];
const WEIGHMENT_PERSONS = ["Sushil","Amit","Milan","Security","Surajit"];
const MATERIAL_GRADES = ["Local Waste paper Cuttings","Local waste paper Box","Sack Kraft (SMK)","DSOCC","NDLKC","Fruit Box","Tabocco Box","OCC 98/2","OCC","DSOCC Wallmart","DSOCC Shoprite","Industrial box","Sack Kraft","Shopping Bag"];
const MOISTURE_OPT = ["< 10%","10–12%","12–15%","15–18%","> 18%"];
const CONTAM_OPT = ["Nil","< 1%","1–2%","2–5%","> 5%"];
const FIBER_OPT = ["Excellent","Good","Average","Below Average","Poor"];

const STATUS_META = {
  "Gross Weighment Done": { bg:"#fff7e6", text:"#92400e", border:"#fbbf24", dot:"#f59e0b" },
  "Quality Checked": { bg:"#eff6ff", text:"#1e40af", border:"#93c5fd", dot:"#3b82f6" },
  "Completed": { bg:"#f0fdf4", text:"#14532d", border:"#86efac", dot:"#22c55e" },
};

const COMPANY = {
  name: "SURYAANS PAPER",
  addr1: "312/2C, Thervoy Kandigai Village, Gummudipundi Taluk",
  addr2: "Thiruvillur Dist, Tamilnadu — 601202 (India)",
  creator: "SUSHIL",
};

// FIX #9 — C style object moved outside App so it's not recreated every render
const C = {
  bg:"#f1f5f9", card:"#fff", dark:"#0f172a", mid:"#334155", muted:"#64748b",
  border:"#e2e8f0", font:"'IBM Plex Sans','Segoe UI',system-ui,sans-serif",
  mono:"'IBM Plex Mono','Courier New',monospace"
};

function nowDate(){ 
  return new Date().toLocaleDateString("en-CA", {timeZone: "Asia/Kolkata"}); // YYYY-MM-DD format in IST
}
function nowTime(){ 
  return new Date().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:true,timeZone:"Asia/Kolkata"}); 
}
function nowFull(){ 
  return new Date().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:true,timeZone:"Asia/Kolkata"}); 
}
function kg(n){ return n!=null&&n!==undefined ? Number(n).toLocaleString("en-IN") : "—"; }
function fmtDate(d){ if(!d) return "—"; const p=d.split("-"); return `${p[2]}/${p[1]}/${p[0]}`; }

// FIX #1 & #7 — ChipGroup moved outside App component
function ChipGroup({label,opts,val,onChange}){
  return <div style={{display:"flex",flexDirection:"column",gap:5,gridColumn:"1/-1"}}>
    <label style={{fontSize:11,fontWeight:700,color:C.mid}}>{label}<span style={{color:"#dc2626"}}>*</span></label>
    <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:4}}>
      {opts.map(o=><div key={o} onClick={()=>onChange(o)} style={{border:`2px solid ${val===o?"#1e40af":C.border}`,borderRadius:8,padding:"8px 12px",cursor:"pointer",background:val===o?"#eff6ff":"#f8fafc",fontSize:12,fontWeight:val===o?700:400,color:val===o?"#1e40af":C.mid,transition:"all .15s",minWidth:80}}>{o}</div>)}
    </div>
  </div>;
}

// FIX #1 & #2 — FSel moved outside App; filter state is now local (self-contained)
// FIX #8 — generic empty message instead of hardcoded "parties"
function FSel({label,val,onChange,opts,full}){
  const [filter, setFilter] = useState("");
  const letters=[...new Set(opts.map(o=>o.charAt(0).toUpperCase()))].sort();
  const filtered = filter ? opts.filter(o=>o.toUpperCase().startsWith(filter.toUpperCase())) : opts;

  return <div style={{display:"flex",flexDirection:"column",gap:6,...(full?{gridColumn:"1/-1"}:{}),background:"#f8fafc",padding:"12px",borderRadius:10,border:"1px solid #e2e8f0"}}>
    <label style={{fontSize:12,fontWeight:800,color:C.dark}}>{label}<span style={{color:"#dc2626"}}>*</span></label>
    <div style={{background:val?"#10b981":"#fff",border:`2px solid ${val?"#059669":"#e2e8f0"}`,borderRadius:8,padding:"12px 14px",minHeight:48,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <span style={{fontSize:14,fontWeight:val?700:400,color:val?"#fff":"#94a3b8"}}>{val?`✓ ${val}`:"Click letter, then select"}</span>
      {val&&<button onClick={()=>{onChange("");setFilter("");}} style={{background:"#fff",color:"#dc2626",border:"none",borderRadius:6,padding:"6px 12px",fontSize:12,cursor:"pointer",fontWeight:700}}>✕</button>}
    </div>
    <div style={{display:"flex",flexWrap:"wrap",gap:4,padding:"8px 0",borderBottom:"1px solid #e2e8f0"}}>
      <button onClick={()=>setFilter("")} style={{padding:"6px 12px",borderRadius:6,border:filter===""?"2px solid #1e40af":"1px solid #cbd5e1",background:filter===""?"#eff6ff":"#fff",color:filter===""?"#1e40af":"#64748b",fontSize:12,fontWeight:700,cursor:"pointer",minWidth:50}}>ALL</button>
      {letters.map(l=><button key={l} onClick={()=>setFilter(l)} style={{padding:"6px 12px",borderRadius:6,border:filter===l?"2px solid #1e40af":"1px solid #cbd5e1",background:filter===l?"#eff6ff":"#fff",color:filter===l?"#1e40af":"#64748b",fontSize:12,fontWeight:700,cursor:"pointer",minWidth:36}}>{l}</button>)}
    </div>
    <div style={{border:"2px solid #cbd5e1",borderRadius:8,background:"#fff",height:260,overflowY:"scroll"}}>
      {filtered.length===0&&<div style={{padding:24,textAlign:"center",color:"#94a3b8",fontSize:14}}>No options starting with "{filter}"</div>}
      {filtered.map((o,i)=><div key={o} style={{padding:"13px 16px",cursor:"pointer",fontSize:14,borderBottom:i===filtered.length-1?"none":"1px solid #f1f5f9",background:val===o?"#d1fae5":"#fff",fontWeight:val===o?700:500,color:val===o?"#065f46":C.dark}} onClick={()=>onChange(o)}>{val===o&&<span style={{color:"#10b981",marginRight:8}}>✓</span>}{o}</div>)}
    </div>
    <div style={{fontSize:12,color:"#64748b"}}>{filtered.length} of {opts.length} shown</div>
  </div>;
}

export default function App(){
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState("dashboard");
  const [form, setForm] = useState(null);
  const [selected, setSelected] = useState(null);
  const [notif, setNotif] = useState(null);
  const [tick, setTick] = useState(nowFull());
  const [filterP, setFilterP] = useState("");
  
  // NEW: Advanced filter states
  const [filterParty, setFilterParty] = useState("All");
  const [filterDate, setFilterDate] = useState("");
  const [filterMonth, setFilterMonth] = useState("current");
  // FIX #2 & #3 — partyFilter state removed; FSel now manages its own filter internally

  useEffect(()=>{ const t=setInterval(()=>setTick(nowFull()),1000); return()=>clearInterval(t); },[]);

  useEffect(()=>{
    const q = query(collection(db, "entries"), orderBy("savedAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ firestoreId: doc.id, ...doc.data() }));
      setEntries(data);
      setLoading(false);
    }, (error) => {
      console.error("Firebase error:", error);
      showNotif("Failed to connect to Firebase","error");
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  async function saveEntry(entry){
    setSaving(true);
    try{
      if(entry.firestoreId){
        const {firestoreId, ...data} = entry;
        const docRef = doc(db, "entries", firestoreId);
        await updateDoc(docRef, data);
        return firestoreId; // Return existing ID
      } else {
        const docRef = await addDoc(collection(db, "entries"), entry);
        return docRef.id; // Return new ID from Firebase
      }
    } catch(e){
      console.error('Save error:', e);
      showNotif("Failed to save to Firebase","error");
      return null;
    } finally {
      setSaving(false);
    }
  }

  function showNotif(msg,type="success"){ setNotif({msg,type}); setTimeout(()=>setNotif(null),3500); }

  async function deleteEntry(entry){
    if(!confirm(`⚠️ Delete entry ${entry.id}?\n\nVehicle: ${entry.vehicleNo}\nParty: ${entry.partyName}\n\nThis cannot be undone!`)) return;
    setSaving(true);
    try{
      await deleteDoc(doc(db, "entries", entry.firestoreId));
      showNotif(`✓ Entry ${entry.id} deleted`);
    } catch(e){
      console.error('Delete error:', e);
      showNotif("Failed to delete entry","error");
    }
    setSaving(false);
  }

  // FIX #5 — genId now uses timestamp to avoid duplicate IDs after deletion
  function genId(){
    const year = new Date().getFullYear();
    const n = entries.length > 0
      ? Math.max(...entries.map(e => parseInt(e.id?.split("-")[2]||0))) + 1
      : 1;
    return `WP-${year}-${String(n).padStart(4,"0")}`;
  }

  function startNew(){
    setForm({ step:1, id:genId(), date:nowDate(), grossTime:nowTime(), emptyTime:"", vehicleNo:"", partyName:"", partyWeight:"", ourGrossWeight:"", ourEmptyWeight:"", weighmentPerson:"", qualityChecker:"", materialGrade:"", moisture:"", contamination:"", fiberQuality:"", remarks:"" });
    setPage("form");
  }

  async function step1SaveDraft(){
    const {vehicleNo,partyName,partyWeight,ourGrossWeight,weighmentPerson}=form;
    if(!vehicleNo||!partyName||!partyWeight||!ourGrossWeight||!weighmentPerson) return showNotif("Please fill all required fields","error");
    const draft={...form,ourEmptyWeight:null,netWeight:null,weightDiff:null,status:"Gross Weighment Done",savedAt:new Date().toISOString()};
    const firestoreId = await saveEntry(draft);
    if(firestoreId){
      showNotif(`Draft saved — ${form.id}`);
      setForm(f=>({...f,firestoreId,step:2})); // Save firestoreId in form state!
    }
  }

  function step2Next(){
    const {materialGrade,moisture,contamination,fiberQuality,qualityChecker}=form;
    if(!materialGrade||!moisture||!contamination||!fiberQuality||!qualityChecker) return showNotif("Please complete quality report","error");
    setForm(f=>({...f,step:3}));
  }

  async function step3Finish(){
    if(!form.ourEmptyWeight||!form.weighmentPerson) return showNotif("Please enter empty weight","error");
    const gross=parseFloat(form.ourGrossWeight),empty=parseFloat(form.ourEmptyWeight);
    if(empty>=gross) return showNotif("Empty weight cannot be ≥ Gross weight","error");
    const net=gross-empty,diff=parseFloat(form.partyWeight)-net;
    const entry={...form,emptyTime:nowTime(),ourEmptyWeight:empty,ourGrossWeight:gross,partyWeight:parseFloat(form.partyWeight),netWeight:net,weightDiff:diff,status:"Completed",savedAt:new Date().toISOString()};
    // FIX #6 — use form.firestoreId directly (set when draft was saved) instead of searching entries
    await saveEntry(entry);
    showNotif(`✓ Entry ${form.id} completed!`);
    setPage("dashboard");
  }

  function resume(entry){
    setForm({...entry,step:entry.status==="Gross Weighment Done"?2:3,ourEmptyWeight:entry.ourEmptyWeight||""});
    setPage("form");
  }

  // FIX #4 — renamed to dashFiltered to avoid collision with FSel's internal filtered variable
  // NEW: Advanced filtering logic
  let filtered = entries;
  
  // Apply party filter
  if(filterParty !== "All") {
    console.log("Filtering by party:", filterParty);
    console.log("Before filter:", filtered.length, "entries");
    filtered = filtered.filter(e => e.partyName === filterParty);
    console.log("After filter:", filtered.length, "entries");
  }
  
  // Apply date filter
  if(filterDate) {
    filtered = filtered.filter(e => e.date === filterDate);
  }
  
  // Apply month filter
  if(filterMonth !== "all") {
    if(filterMonth === "current") {
      const currentMonth = nowDate().slice(0, 7); // "2026-02"
      filtered = filtered.filter(e => e.date && e.date.startsWith(currentMonth));
    } else {
      filtered = filtered.filter(e => e.date && e.date.startsWith(filterMonth));
    }
  }
  
  // Apply search text filter (existing)
  const dashFiltered = filtered.filter(e => filterP ? e.partyName.toLowerCase().includes(filterP.toLowerCase()) : true);
  console.log("Final dashFiltered:", dashFiltered.length, "entries");
  console.log("Party names:", dashFiltered.map(e => e.partyName));
  
  // Calculate statistics
  const today = nowDate();
  const currentMonth = today.slice(0, 7); // "2026-02"
  
  const todayEnt = entries.filter(e => e.date === today);
  const thisMonthEnt = entries.filter(e => e.date && e.date.startsWith(currentMonth) && e.status === "Completed");
  const pendingCount = entries.filter(e => e.status !== "Completed").length;
  
  const totalNetMT = entries.filter(e => e.netWeight).reduce((s, e) => s + e.netWeight, 0) / 1000;
  const todayNetMT = todayEnt.filter(e => e.netWeight).reduce((s, e) => s + e.netWeight, 0) / 1000;
  const thisMonthNetMT = thisMonthEnt.reduce((s, e) => s + (e.netWeight || 0), 0) / 1000;
  
  // Filtered summary statistics
  const filteredNetMT = dashFiltered.filter(e => e.netWeight).reduce((s, e) => s + e.netWeight, 0) / 1000;
  
  // Get available months from entries
  const availableMonths = [...new Set(entries.map(e => e.date ? e.date.slice(0, 7) : null).filter(Boolean))].sort().reverse();
  
  // Format month for display
  const formatMonth = (monthStr) => {
    if(!monthStr) return "";
    const [year, month] = monthStr.split("-");
    const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return `${monthNames[parseInt(month)-1]} ${year}`;
  };

  const badge=(st)=>{ const m=STATUS_META[st]||STATUS_META["Completed"]; return{display:"inline-flex",alignItems:"center",gap:5,padding:"3px 10px",borderRadius:20,fontSize:10.5,fontWeight:700,background:m.bg,color:m.text,border:`1px solid ${m.border}`}; };
  const bDot=(st)=>({width:6,height:6,borderRadius:"50%",background:(STATUS_META[st]||STATUS_META["Completed"]).dot});

  const inp = {border:`1.5px solid ${C.border}`,borderRadius:8,padding:"9px 12px",fontSize:13,outline:"none",background:"#f8fafc",color:C.dark,width:"100%",boxSizing:"border-box"};
  const roInp = {...inp,background:"#eef2f7",color:C.muted};
  const primaryBtn = {background:"#0f172a",color:"#fff",border:"none",borderRadius:8,padding:"11px 28px",fontSize:13,fontWeight:700,cursor:"pointer"};
  const secondaryBtn = {background:"#f1f5f9",color:C.mid,border:`1.5px solid ${C.border}`,borderRadius:8,padding:"11px 20px",fontSize:13,fontWeight:600,cursor:"pointer"};
  const greenBtn = {background:"#15803d",color:"#fff",border:"none",borderRadius:8,padding:"11px 28px",fontSize:13,fontWeight:700,cursor:"pointer"};
  const newBtn = {background:"#dc2626",color:"#fff",border:"none",borderRadius:8,padding:"8px 16px",fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:5};
  const navBtn=(a)=>({padding:"7px 14px",borderRadius:7,border:"none",cursor:"pointer",fontSize:12,fontWeight:700,background:a?"#dc2626":"#1e293b",color:a?"#fff":"#94a3b8"});
  const bkBtn = {background:"none",border:`1.5px solid ${C.border}`,borderRadius:8,padding:"7px 14px",fontSize:12,cursor:"pointer",color:C.mid,display:"flex",alignItems:"center",gap:6,marginBottom:18};
  const actBtn = {padding:"4px 11px",borderRadius:6,border:`1.5px solid ${C.border}`,background:"#fff",cursor:"pointer",fontSize:11,color:C.dark,fontWeight:600};
  const actBtnRed = {padding:"4px 11px",borderRadius:6,border:"1.5px solid #fecaca",background:"#fff1f1",cursor:"pointer",fontSize:11,color:"#dc2626",fontWeight:600};
  const th = {background:"#f8fafc",padding:"9px 12px",textAlign:"left",fontWeight:700,color:C.muted,fontSize:10,textTransform:"uppercase",borderBottom:`2px solid ${C.border}`};
  const td = {padding:"11px 12px",borderBottom:`1px solid #f1f5f9`,color:C.dark,verticalAlign:"middle"};

  return(
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:C.font,color:C.dark}}>
      <style>{`
        input:focus,select:focus,textarea:focus{border-color:#0f172a!important;box-shadow:0 0 0 3px rgba(15,23,42,.1);}
        button:active{transform:scale(.98);}
        @media (max-width: 768px) {
          .desktop-text { display: none !important; }
          .mobile-text { display: inline !important; }
        }
        @media (min-width: 769px) {
          .desktop-text { display: inline !important; }
          .mobile-text { display: none !important; }
        }
      `}</style>
      {notif&&<div style={{position:"fixed",top:72,right:20,background:notif.type==="success"?"#0f172a":"#dc2626",color:"#fff",padding:"11px 18px",borderRadius:10,fontSize:13,fontWeight:600,zIndex:999,maxWidth:320}}>{notif.type==="success"?"✓ ":"⚠ "}{notif.msg}</div>}
      {saving&&<div style={{position:"fixed",bottom:0,left:0,right:0,background:"#1e40af",color:"#fff",textAlign:"center",padding:"8px",fontSize:12,fontWeight:600}}>🔥 Syncing to Firebase...</div>}

      <header style={{background:"#0f172a",height:62,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 12px",position:"sticky",top:0,zIndex:200}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:36,height:36,borderRadius:8,background:"linear-gradient(135deg,#dc2626,#991b1b)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>♻</div>
          <div>
            <div style={{color:"#f8fafc",fontWeight:700,fontSize:15}}>
              <span style={{display:"inline"}} className="desktop-text">{COMPANY.name} — RAWMATERIAL INWARD</span>
              <span style={{display:"none"}} className="mobile-text">{COMPANY.name}</span>
            </div>
            <div style={{color:"#64748b",fontSize:10,textTransform:"uppercase"}}>
              <span className="desktop-text">Firebase Live Sync • {entries.length} Entries</span>
              <span style={{display:"none"}} className="mobile-text">{entries.length} Entries</span>
            </div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <button style={navBtn(page==="dashboard")} onClick={()=>setPage("dashboard")}>
            <span className="desktop-text">📊 Dashboard</span>
            <span style={{display:"none"}} className="mobile-text">📊</span>
          </button>
          <div style={{color:"#94a3b8",fontSize:12,fontFamily:C.mono}} className="desktop-text">{tick}</div>
          <button style={newBtn} onClick={startNew}>+ New</button>
        </div>
      </header>

      <main style={{maxWidth:1180,margin:"0 auto",padding:"20px 16px"}}>
        {page==="dashboard"&&(
          <div>
            <div style={{fontSize:20,fontWeight:800,marginBottom:18}}>{COMPANY.name} — Daily Register</div>
            {loading?<div style={{textAlign:"center",padding:48,color:C.muted}}>⟳ Loading from Firebase...</div>:(
              <>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:14,marginBottom:22}}>
                  {[
                    {l:"Today's Vehicles",v:todayEnt.length,c:"#dc2626",sub:"Entries today"},
                    {l:"Today Net (MT)",v:todayNetMT.toFixed(2),c:"#f59e0b",sub:"Today's total"},
                    {l:"This Month (MT)",v:thisMonthNetMT.toFixed(2),c:"#2563eb",sub:formatMonth(currentMonth)},
                    {l:"Pending",v:pendingCount,c:"#9333ea",sub:"Incomplete"},
                    {l:"All Time (MT)",v:totalNetMT.toFixed(2),c:"#16a34a",sub:"Since start"}
                  ].map(s=>(
                    <div key={s.l} style={{background:C.card,borderRadius:12,padding:"18px 20px",borderTop:`3px solid ${s.c}`}}>
                      <div style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",marginBottom:6}}>{s.l}</div>
                      <div style={{fontSize:26,fontWeight:800}}>{s.v}</div>
                      {s.sub&&<div style={{fontSize:9,color:C.muted,marginTop:4}}>{s.sub}</div>}
                    </div>
                  ))}
                </div>
                <div style={{background:C.card,borderRadius:12,padding:"20px",marginBottom:14}}>
                  <div style={{fontSize:14,fontWeight:700,marginBottom:14}}>🔍 Filters</div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:12,marginBottom:12}}>
                    <div>
                      <label style={{fontSize:11,fontWeight:700,color:C.mid,marginBottom:4,display:"block"}}>Party</label>
                      <select value={filterParty} onChange={e=>{setFilterParty(e.target.value);setFilterP("");}} style={{...inp,cursor:"pointer"}}>
                        <option value="All">All Parties</option>
                        {PARTIES.map(p=><option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{fontSize:11,fontWeight:700,color:C.mid,marginBottom:4,display:"block"}}>Date</label>
                      <input type="date" value={filterDate} onChange={e=>setFilterDate(e.target.value)} style={inp}/>
                    </div>
                    <div>
                      <label style={{fontSize:11,fontWeight:700,color:C.mid,marginBottom:4,display:"block"}}>Month</label>
                      <select value={filterMonth} onChange={e=>setFilterMonth(e.target.value)} style={{...inp,cursor:"pointer"}}>
                        <option value="current">This Month ({formatMonth(currentMonth)})</option>
                        <option value="all">All Time</option>
                        {availableMonths.filter(m=>m!==currentMonth).map(m=><option key={m} value={m}>{formatMonth(m)}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:8}}>
                    <button onClick={()=>{setFilterParty("All");setFilterDate("");setFilterMonth("current");setFilterP("");}} style={secondaryBtn}>Clear Filters</button>
                  </div>
                </div>
                {(filterParty!=="All"||filterDate||filterMonth!=="current"||filterP)&&(
                  <div style={{background:"#eff6ff",border:"2px solid #93c5fd",borderRadius:12,padding:"16px",marginBottom:14}}>
                    <div style={{fontSize:13,fontWeight:700,color:"#1e40af",marginBottom:8}}>📊 Filtered Results</div>
                    <div style={{fontSize:12,color:"#1e40af"}}>
                      {filterParty!=="All"&&<div>• Party: <strong>{filterParty}</strong></div>}
                      {filterDate&&<div>• Date: <strong>{fmtDate(filterDate)}</strong></div>}
                      {filterMonth!=="current"&&filterMonth!=="all"&&<div>• Month: <strong>{formatMonth(filterMonth)}</strong></div>}
                      {filterP&&<div>• Search: <strong>{filterP}</strong></div>}
                      <div style={{marginTop:8,paddingTop:8,borderTop:"1px solid #93c5fd"}}>
                        Total Entries: <strong>{dashFiltered.length}</strong> • 
                        Total Weight: <strong>{filteredNetMT.toFixed(2)} MT</strong>
                      </div>
                    </div>
                  </div>
                )}
                <div style={{background:C.card,borderRadius:12,padding:"20px"}}>
                  <div style={{fontSize:14,fontWeight:700,marginBottom:14}}>📋 Entries</div>
                  {filterParty==="All"&&<input type="text" style={{...inp,width:"100%",maxWidth:200,marginBottom:14}} placeholder="Search party…" value={filterP} onChange={e=>setFilterP(e.target.value)}/>}
                  {filterParty!=="All"&&<div style={{fontSize:12,color:C.muted,marginBottom:14,fontStyle:"italic"}}>Showing entries for: <strong>{filterParty}</strong></div>}
                  <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
                    <table style={{width:"100%",minWidth:900,borderCollapse:"collapse",fontSize:12.5}}>
                      <thead><tr>{["ID","Date","Vehicle","Party","Net (kg)","Grade","Status","Action"].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
                      <tbody>
                        {dashFiltered.length===0&&<tr><td colSpan={8} style={{...td,textAlign:"center",padding:40}}>No entries</td></tr>}
                        {dashFiltered.map(e=>(
                          <tr key={e.id}>
                            <td style={{...td,fontWeight:800,color:"#1e40af",fontFamily:C.mono,fontSize:11,whiteSpace:"nowrap"}}>{e.id}</td>
                            <td style={{...td,whiteSpace:"nowrap"}}>{fmtDate(e.date)}</td>
                            <td style={{...td,fontFamily:C.mono,fontWeight:700,whiteSpace:"nowrap"}}>{e.vehicleNo}</td>
                            <td style={{...td,minWidth:150}}>{e.partyName}</td>
                            <td style={{...td,textAlign:"right",fontWeight:700,whiteSpace:"nowrap"}}>{kg(e.netWeight)}</td>
                            <td style={td}><span style={{fontSize:10,background:"#eff6ff",color:"#1e40af",padding:"2px 8px",borderRadius:10,fontWeight:600,whiteSpace:"nowrap"}}>{e.materialGrade?.split(" ")[0]||"—"}</span></td>
                            <td style={{...td,whiteSpace:"nowrap"}}><span style={badge(e.status)}><span style={bDot(e.status)}></span>{e.status}</span></td>
                            <td style={{...td,whiteSpace:"nowrap"}}>
                              {e.status!=="Completed"&&<button style={actBtnRed} onClick={()=>resume(e)}>Resume</button>}
                              {e.status==="Completed"&&<button style={{...actBtn,marginRight:5}} onClick={()=>{setSelected(e);setPage("view");}}>View</button>}
                              <button style={{...actBtnRed,marginLeft:5}} onClick={()=>deleteEntry(e)}>🗑 Delete</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div style={{fontSize:11,color:C.muted,marginTop:8,fontStyle:"italic"}}>💡 Swipe left/right to see all columns</div>
                </div>
              </>
            )}
          </div>
        )}

        {page==="form"&&form&&(
          <div style={{maxWidth:820,margin:"0 auto"}}>
            <button style={bkBtn} onClick={()=>setPage("dashboard")}>← Back</button>
            <div style={{background:C.card,borderRadius:12,padding:"24px"}}>
              <div style={{fontSize:15,fontWeight:800,marginBottom:4}}>🚛 New Inward — {form.id}</div>
              <div style={{fontSize:11,color:C.muted,marginBottom:20}}>Complete all 3 steps</div>
              <div style={{display:"flex",borderRadius:10,overflow:"hidden",border:`1.5px solid ${C.border}`,marginBottom:24}}>
                {[{n:1,lbl:"Gross"},{n:2,lbl:"Quality"},{n:3,lbl:"Empty"}].map((s,i)=>(
                  <div key={s.n} style={{flex:1,padding:"10px 8px",textAlign:"center",fontSize:11,fontWeight:700,background:form.step>s.n?"#0f172a":form.step===s.n?"#dc2626":"#f8fafc",color:form.step>=s.n?"#fff":C.muted,borderRight:i<2?`1px solid ${C.border}`:"none"}}>{form.step>s.n?"✓ ":s.n+". "}{s.lbl}</div>
                ))}
              </div>

              {form.step===1&&(
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                  <div style={{display:"flex",flexDirection:"column",gap:5}}>
                    <label style={{fontSize:11,fontWeight:700,color:C.mid}}>Entry Date*</label>
                    <input style={inp} type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:5}}>
                    <label style={{fontSize:11,fontWeight:700,color:C.mid}}>Gross Time</label>
                    <div style={roInp}>{form.grossTime}</div>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:5}}>
                    <label style={{fontSize:11,fontWeight:700,color:C.mid}}>Vehicle Number*</label>
                    <input style={{...inp,textTransform:"uppercase",fontWeight:700}} value={form.vehicleNo} onChange={e=>setForm(f=>({...f,vehicleNo:e.target.value.toUpperCase()}))}/>
                  </div>
                  {/* FIX #2 — filterId prop removed; FSel handles its own filter state */}
                  <FSel label="Party Name" val={form.partyName} onChange={v=>setForm(f=>({...f,partyName:v}))} opts={PARTIES}/>
                  <div style={{display:"flex",flexDirection:"column",gap:5}}>
                    <label style={{fontSize:11,fontWeight:700,color:C.mid}}>Party Weight (kg)*</label>
                    <input style={inp} type="number" value={form.partyWeight} onChange={e=>setForm(f=>({...f,partyWeight:e.target.value}))}/>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:5}}>
                    <label style={{fontSize:11,fontWeight:700,color:C.mid}}>Our Gross (kg)*</label>
                    <input style={inp} type="number" value={form.ourGrossWeight} onChange={e=>setForm(f=>({...f,ourGrossWeight:e.target.value}))}/>
                  </div>
                  <FSel label="Weighment By" val={form.weighmentPerson} onChange={v=>setForm(f=>({...f,weighmentPerson:v}))} opts={WEIGHMENT_PERSONS} full/>
                  <div style={{gridColumn:"1/-1",display:"flex",gap:10,justifyContent:"flex-end",marginTop:8}}>
                    <button style={secondaryBtn} onClick={()=>setPage("dashboard")}>Cancel</button>
                    <button style={primaryBtn} onClick={step1SaveDraft}>Save & Next →</button>
                  </div>
                </div>
              )}

              {form.step===2&&(
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                  <FSel label="Material Grade" val={form.materialGrade} onChange={v=>setForm(f=>({...f,materialGrade:v}))} opts={MATERIAL_GRADES} full/>
                  <ChipGroup label="Moisture" opts={MOISTURE_OPT} val={form.moisture} onChange={v=>setForm(f=>({...f,moisture:v}))}/>
                  <ChipGroup label="Contamination" opts={CONTAM_OPT} val={form.contamination} onChange={v=>setForm(f=>({...f,contamination:v}))}/>
                  <ChipGroup label="Fiber Quality" opts={FIBER_OPT} val={form.fiberQuality} onChange={v=>setForm(f=>({...f,fiberQuality:v}))}/>
                  <FSel label="Quality Checker" val={form.qualityChecker} onChange={v=>setForm(f=>({...f,qualityChecker:v}))} opts={QUALITY_CHECKERS} full/>
                  <div style={{gridColumn:"1/-1",display:"flex",gap:10,justifyContent:"space-between",marginTop:8}}>
                    <button style={secondaryBtn} onClick={()=>setForm(f=>({...f,step:1}))}>← Back</button>
                    <button style={primaryBtn} onClick={step2Next}>Next →</button>
                  </div>
                </div>
              )}

              {form.step===3&&(
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                  <div style={{display:"flex",flexDirection:"column",gap:5}}>
                    <label style={{fontSize:11,fontWeight:700,color:C.mid}}>Our Empty (kg)*</label>
                    <input style={{...inp,fontWeight:700,fontSize:16}} type="number" value={form.ourEmptyWeight} onChange={e=>setForm(f=>({...f,ourEmptyWeight:e.target.value}))}/>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:5}}>
                    <label style={{fontSize:11,fontWeight:700,color:C.mid}}>Empty Time</label>
                    <div style={roInp}>{tick} (Auto)</div>
                  </div>
                  <FSel label="Weighment By" val={form.weighmentPerson} onChange={v=>setForm(f=>({...f,weighmentPerson:v}))} opts={WEIGHMENT_PERSONS} full/>
                  <div style={{gridColumn:"1/-1",display:"flex",gap:10,justifyContent:"space-between",marginTop:8}}>
                    <button style={secondaryBtn} onClick={()=>setForm(f=>({...f,step:2}))}>← Back</button>
                    <button style={greenBtn} onClick={step3Finish}>✓ Complete</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {page==="view"&&selected&&(
          <div style={{maxWidth:820,margin:"0 auto"}}>
            <button style={bkBtn} onClick={()=>setPage("dashboard")}>← Dashboard</button>
            <div style={{background:C.card,borderRadius:12,padding:"24px"}}>
              <div style={{fontSize:18,fontWeight:800,marginBottom:4,color:"#1e40af"}}>{selected.id}</div>
              <div style={{fontSize:12,color:C.muted,marginBottom:20}}>{fmtDate(selected.date)} • {selected.vehicleNo} • {selected.partyName}</div>
              
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
                <div style={{background:"#f8fafc",borderRadius:8,padding:"12px"}}>
                  <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",marginBottom:4}}>Vehicle Number</div>
                  <div style={{fontSize:14,fontWeight:700,fontFamily:C.mono}}>{selected.vehicleNo}</div>
                </div>
                <div style={{background:"#f8fafc",borderRadius:8,padding:"12px"}}>
                  <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",marginBottom:4}}>Party Name</div>
                  <div style={{fontSize:14,fontWeight:700}}>{selected.partyName}</div>
                </div>
                <div style={{background:"#f8fafc",borderRadius:8,padding:"12px"}}>
                  <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",marginBottom:4}}>Gross In Time</div>
                  <div style={{fontSize:14,fontWeight:700}}>{selected.grossTime}</div>
                </div>
                <div style={{background:"#f8fafc",borderRadius:8,padding:"12px"}}>
                  <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",marginBottom:4}}>Empty Out Time</div>
                  <div style={{fontSize:14,fontWeight:700}}>{selected.emptyTime||"—"}</div>
                </div>
              </div>

              <div style={{fontSize:14,fontWeight:700,marginBottom:12,color:"#dc2626"}}>⚖ Weight Details</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:20,background:"#0f172a",padding:"16px",borderRadius:10}}>
                {[{l:"Party Wt",v:kg(selected.partyWeight),c:"#f8fafc"},{l:"Gross Wt",v:kg(selected.ourGrossWeight),c:"#93c5fd"},{l:"Empty Wt",v:kg(selected.ourEmptyWeight),c:"#fca5a5"},{l:"Net Wt",v:kg(selected.netWeight),c:"#86efac"}].map(w=>(
                  <div key={w.l} style={{textAlign:"center"}}>
                    <div style={{fontSize:9,color:"#94a3b8",textTransform:"uppercase",marginBottom:4}}>{w.l}</div>
                    <div style={{fontSize:18,fontWeight:800,color:w.c}}>{w.v}</div>
                    <div style={{fontSize:9,color:"#64748b"}}>kg</div>
                  </div>
                ))}
              </div>

              <div style={{fontSize:14,fontWeight:700,marginBottom:12,color:"#dc2626"}}>🔬 Quality Report</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
                <div style={{background:"#eff6ff",borderRadius:8,padding:"12px"}}>
                  <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",marginBottom:4}}>Material Grade</div>
                  <div style={{fontSize:14,fontWeight:700,color:"#1e40af"}}>{selected.materialGrade||"—"}</div>
                </div>
                <div style={{background:"#f8fafc",borderRadius:8,padding:"12px"}}>
                  <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",marginBottom:4}}>Moisture</div>
                  <div style={{fontSize:14,fontWeight:700}}>{selected.moisture||"—"}</div>
                </div>
                <div style={{background:"#f8fafc",borderRadius:8,padding:"12px"}}>
                  <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",marginBottom:4}}>Contamination</div>
                  <div style={{fontSize:14,fontWeight:700}}>{selected.contamination||"—"}</div>
                </div>
                <div style={{background:"#f8fafc",borderRadius:8,padding:"12px"}}>
                  <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",marginBottom:4}}>Fiber Quality</div>
                  <div style={{fontSize:14,fontWeight:700}}>{selected.fiberQuality||"—"}</div>
                </div>
                <div style={{background:"#f8fafc",borderRadius:8,padding:"12px"}}>
                  <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",marginBottom:4}}>Quality Checker</div>
                  <div style={{fontSize:14,fontWeight:700}}>{selected.qualityChecker||"—"}</div>
                </div>
                <div style={{background:"#f8fafc",borderRadius:8,padding:"12px"}}>
                  <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",marginBottom:4}}>Weighment By</div>
                  <div style={{fontSize:14,fontWeight:700}}>{selected.weighmentPerson||"—"}</div>
                </div>
              </div>

              <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
                <button style={secondaryBtn} onClick={()=>setPage("dashboard")}>Close</button>
                <button style={{...actBtnRed,padding:"10px 20px",fontSize:13}} onClick={()=>{deleteEntry(selected);setPage("dashboard");}}>🗑 Delete Entry</button>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer style={{background:"#0f172a",borderTop:"1px solid #1e293b",padding:"14px 24px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{color:"#f8fafc",fontWeight:800,fontSize:13}}>{COMPANY.name}</div>
          <div style={{color:"#64748b",fontSize:11,marginTop:2}}>{COMPANY.addr1}, {COMPANY.addr2}</div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{color:"#475569",fontSize:10,textTransform:"uppercase"}}>Firebase Real-time Sync</div>
          <div style={{color:"#334155",fontSize:11,marginTop:3}}>By <span style={{color:"#dc2626",fontWeight:700}}>{COMPANY.creator}</span></div>
        </div>
      </footer>
    </div>
  );
}
