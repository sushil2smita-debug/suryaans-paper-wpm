import { useState, useEffect, useMemo } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, onSnapshot, addDoc, updateDoc, doc, query, orderBy, deleteDoc, setDoc, getDoc, where, getDocs } from "firebase/firestore";

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

// APP VERSION — bump this number when deploying to force browser cache refresh
const APP_VERSION = "2.5.0";

// Default parties list — only used on FIRST TIME setup, then stored in Firebase
const DEFAULT_PARTIES = ["Sri Krishna Traders","Sri Lakshmi Traders","S S Traders","SVS Traders","J.B Traders","JK Paper Ltd.-Harohalli","JK Paper Ltd.-TVM","Sri Lakshmi & Co.","Naveen Traders","Siva Waste Paper Mart","Panoply Packagings Pvt.Ltd.","Vital Paper Products Pvt.Ltd.","Madha Papers","Thirupathy Balaji Traders","IBT Solutions","Harshal Packaging","Horizon Packs Privete Limited","Aruna Industrial Corporation","Siva Traders","Tirumala Papers","Sri Muthukumaran Traders","Venkateswara Traders","Sri Balaji Timber & Hardwares","National Traders","Erai Arul Traders","Kanakadhara Traders","Oji India Packaging PVT.LTD.","S.S TRADERS(Royapuram)","Arudra Traders","Velvin Rengo Containers Pvt.Ltd","Dixon Technologies (India) LTD","AVM Traders","SAM Traders","APA Package","Madha Waste Paper Company","Indo Paper Craft Privet Limited","Mohammed Enterprises","Tharun Traders","Srinivasa Traders","Dioxn Technologies (India) LTD","Ashok Rai Boards","Girnar Packaging","Sri Nivasa Traders","Boxit Packging LLP","Sri Padmavathi Balaji Traders","Balasundaram Waste Paper Mart","Noorani Papers","Canpac Trends Private Limited","Noorani Traders","Sri Selva Vinayagar Traders","Shree Priya Packs","Vamshadhara Paper Mills Ltd.","J T Pack Pvt Ltd","APA Packge","Fine Papers","Siva Waste Paper Company","Aarkay Packaging Industries","Canpac Trends Pvt Ltd","ACE Agencies","Shree Umiya Tradelink","Sri Ganesa Traders","Shweta Print Pack Pvt Ltd","Agarwal Coal Company","HCL Coal International Pvt.Ltd","Earthcon Industries LLP","Mayur International","Amasha Limited","Melosch Export GMBH","K-C International LLC","Greenmove PTE","Internatonal Corton Suppliers Co","Fredmax BVBA","Accel Vanture Trading LLC","GP Hermon Recycling LLC","Kousa International","Eco Earth Elements","Wintrax Logistics","New Port CH International LLC"];
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
  const [PARTIES, setPARTIES] = useState(DEFAULT_PARTIES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState("dashboard");
  const [form, setForm] = useState(null);
  const [selected, setSelected] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});
  const [notif, setNotif] = useState(null);
  const [tick, setTick] = useState(nowFull());
  const [filterP, setFilterP] = useState("");
  
  // NEW: Advanced filter states
  const [filterParty, setFilterParty] = useState("All");
  const [filterDate, setFilterDate] = useState("");
  const [filterMonth, setFilterMonth] = useState("current");
  
  // NEW: Date Range filter state
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  
  // NEW: Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage] = useState(50); // Show 50 entries per page
  
  // NEW: Daily Summary expand/collapse state
  const [dailySummaryExpanded, setDailySummaryExpanded] = useState(false);
  
  // NEW: Daily Summary selected month (defaults to current month)
  const [dailySummaryMonth, setDailySummaryMonth] = useState("current");
  
  // NEW: Party-wise Daily Summary state
  const [partyWiseExpanded, setPartyWiseExpanded] = useState(false);
  const [partyWiseDate, setPartyWiseDate] = useState(nowDate());
  const [newPartyInput, setNewPartyInput] = useState("");
  const [showManageParties, setShowManageParties] = useState(false);
  // VIEW MODE: if true, load only last 30 days (saves reads for view-only staff)
  const [viewMode, setViewMode] = useState(() => localStorage.getItem("wpm_view_mode") === "true");
  // FIX #2 & #3 — partyFilter state removed; FSel now manages its own filter internally

  useEffect(()=>{ const t=setInterval(()=>setTick(nowFull()),1000); return()=>clearInterval(t); },[]);

  // Load PARTIES from Firebase — live on ALL devices, no redeploy needed
  useEffect(()=>{
    const partiesDocRef = doc(db, "config", "parties");
    const unsub = onSnapshot(partiesDocRef, (snap) => {
      if(snap.exists()){
        const data = snap.data();
        if(data.list && data.list.length > 0){
          setPARTIES([...data.list].sort());
        }
      } else {
        // First time — seed Firebase with default list (no async inside snapshot)
        setDoc(partiesDocRef, { list: DEFAULT_PARTIES }).catch(e => console.error("Could not seed parties:", e));
      }
    }, (error) => {
      console.error("Parties load error:", error);
    });
    return () => unsub();
  }, []);

  useEffect(()=>{
    const todayDate = nowDate();
    const CACHE_KEY = "wpm_history_cache";
    const CACHE_DATE_KEY = "wpm_history_date";

    // STEP 1: Load history — bust old incomplete cache, fetch ALL entries fresh
    const CACHE_VERSION = "v3_all"; // bump this version to force fresh fetch when cache logic changes
    const loadHistory = () => {
      const cachedDate = localStorage.getItem(CACHE_DATE_KEY);
      const cachedData = localStorage.getItem(CACHE_KEY);
      const cachedVersion = localStorage.getItem(CACHE_KEY + "_ver");

      // Only use cache if: same day AND same version (version mismatch = old incomplete cache)
      if(cachedDate === todayDate && cachedData && cachedVersion === CACHE_VERSION){
        // Cache exists and is current version — zero Firebase reads
        try{
          return Promise.resolve(JSON.parse(cachedData));
        }catch(e){
          localStorage.removeItem(CACHE_KEY);
          localStorage.removeItem(CACHE_DATE_KEY);
          localStorage.removeItem(CACHE_KEY + "_ver");
        }
      }

      // First open of day — fetch history from Firebase
      // View Mode ON  → last 30 days only (saves reads for view-only staff)
      // View Mode OFF → all history (needed for entry staff to generate correct IDs)
      const isViewMode = localStorage.getItem("wpm_view_mode") === "true";
      let historyQuery;
      if(isViewMode){
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const cutoff = thirtyDaysAgo.toLocaleDateString("en-CA", {timeZone: "Asia/Kolkata"});
        historyQuery = query(
          collection(db, "entries"),
          where("date", ">=", cutoff),
          where("date", "<", todayDate),
          orderBy("date", "desc")
        );
      } else {
        historyQuery = query(
          collection(db, "entries"),
          where("date", "<", todayDate),
          orderBy("date", "desc")
        );
      }
      return getDocs(historyQuery).then((snap) => {
        const data = snap.docs.map(d => ({ firestoreId: d.id, ...d.data() }))
          .sort((a,b) => (b.date||"").localeCompare(a.date||""));

        // Cache only last 12 months to stay safely under 5MB localStorage limit forever
        // (12mo × 65 vehicles × 25 days × 400 bytes = ~7.4MB max, but real entries are ~180 bytes avg)
        // All data is returned to app — only cache is limited, not what you see
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
        const cacheFrom = twelveMonthsAgo.toLocaleDateString("en-CA", {timeZone: "Asia/Kolkata"});
        const dataToCache = data.filter(d => (d.date||"") >= cacheFrom);

        const saveCache = () => {
          localStorage.setItem(CACHE_KEY, JSON.stringify(dataToCache));
          localStorage.setItem(CACHE_DATE_KEY, todayDate);
          localStorage.setItem(CACHE_KEY + "_ver", CACHE_VERSION); // mark version
        };
        try{
          saveCache();
        }catch(e){
          try{
            // Clear ALL old cache keys and retry
            localStorage.removeItem(CACHE_KEY);
            localStorage.removeItem(CACHE_DATE_KEY);
            localStorage.removeItem(CACHE_KEY + "_ver");
            saveCache();
          }catch(e2){
            console.log("localStorage full, running without cache today:", e2);
          }
        }
        return data; // Return ALL data to the app (not just cached portion)
      });
    };

    // STEP 2: Wait for history FIRST, then start live listener
    let unsubscribe = () => {};
    let unsubscribeSync = () => {};

    loadHistory().then(history => {
      let historyData = history || [];

      // Live listener for TODAY's entries
      unsubscribe = onSnapshot(
        query(collection(db, "entries"), where("date", "==", todayDate)),
        (snapshot) => {
          const todayData = snapshot.docs
            .map(d => ({ firestoreId: d.id, ...d.data() }))
            .sort((a,b) => (b.savedAt||"").localeCompare(a.savedAt||""));
          setEntries([...todayData, ...historyData]);
          setLoading(false);
        },
        (error) => {
          console.error("Firebase error:", error);
          setLoading(false);
        }
      );

      // Listen for edit sync signal — updates specific entry on all devices
      // WITHOUT reloading all history (saves Firebase reads!)
      unsubscribeSync = onSnapshot(
        doc(db, "config", "sync"),
        (snap) => {
          if(!snap.exists()) return;
          const data = snap.data();
          const lastEdit = data?.lastEditAt || "";
          const myLastSeen = localStorage.getItem("wpm_last_sync") || "";
          if(lastEdit && lastEdit !== myLastSeen){
            localStorage.setItem("wpm_last_sync", lastEdit);
            // Only update the specific edited entry in state — no Firebase reads!
            if(data.editedId && data.editedData){
              if(data.type === "new_past_entry"){
                // Add new past entry to state directly
                setEntries(prev => {
                  const exists = prev.find(e => e.firestoreId === data.editedId);
                  if(exists) return prev.map(e => e.firestoreId === data.editedId ? {...e,...data.editedData} : e);
                  return [{...data.editedData, firestoreId: data.editedId}, ...prev];
                });
              } else {
                // Update existing entry
                setEntries(prev => prev.map(e =>
                  e.firestoreId === data.editedId
                    ? {...e, ...data.editedData}
                    : e
                ));
              }
              // Also update localStorage cache
              try{
                const cached = localStorage.getItem("wpm_history_cache");
                if(cached){
                  const arr = JSON.parse(cached);
                  const exists = arr.find(e => e.firestoreId === data.editedId);
                  let updated;
                  if(exists){
                    updated = arr.map(e => e.firestoreId === data.editedId ? {...e,...data.editedData} : e);
                  } else {
                    updated = [{...data.editedData, firestoreId: data.editedId}, ...arr];
                  }
                  localStorage.setItem("wpm_history_cache", JSON.stringify(updated));
                }
              }catch(e){}
            }
          }
        }
      );

    }).catch(e => {
      console.error("History load error:", e);
      setLoading(false);
    });

    return () => { unsubscribe(); unsubscribeSync(); };
  }, []);

  async function saveEntry(entry){
    setSaving(true);
    try{
      let firestoreId;
      if(entry.firestoreId){
        const {firestoreId: fid, ...data} = entry;
        const docRef = doc(db, "entries", fid);
        await updateDoc(docRef, data);
        firestoreId = fid;
      } else {
        const docRef = await addDoc(collection(db, "entries"), entry);
        firestoreId = docRef.id;
      }
      // If entry is for a past date — signal all devices to clear cache
      const todayDate = nowDate();
      if(entry.date && entry.date < todayDate){
        const syncTime = new Date().toISOString();
        await setDoc(doc(db,"config","sync"), {
          lastEditAt: syncTime,
          editedId: firestoreId,
          editedData: entry,
          type: "new_past_entry"
        });
        localStorage.setItem("wpm_last_sync", syncTime);
        // Clear own cache too
        localStorage.removeItem("wpm_history_cache");
        localStorage.removeItem("wpm_history_date");
        localStorage.removeItem("wpm_history_cache_ver");
      }
      return firestoreId;
    } catch(e){
      console.error('Save error:', e);
      showNotif("Failed to save to Firebase","error");
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function addParty(name){
    const trimmed = name.trim();
    if(!trimmed) return showNotif("Party name cannot be empty","error");
    if(PARTIES.map(p=>p.toLowerCase()).includes(trimmed.toLowerCase())) return showNotif("Party already exists","error");
    const newList = [...PARTIES, trimmed].sort();
    try{
      await setDoc(doc(db,"config","parties"),{list:newList});
      showNotif(`✓ Party "${trimmed}" added — live on all devices!`);
    }catch(e){ showNotif("Failed to add party","error"); }
  }

  async function deleteParty(name){
    if(!confirm(`Remove party "${name}" from the list?\n\nExisting entries will not be affected.`)) return;
    const newList = PARTIES.filter(p=>p!==name);
    try{
      await setDoc(doc(db,"config","parties"),{list:newList});
      showNotif(`✓ Party "${name}" removed`);
    }catch(e){ showNotif("Failed to remove party","error"); }
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

  async function saveEdit(){
    if(!selected?.firestoreId) return;
    setSaving(true);
    try{
      const accQty = editData.acceptedQty === "" ? null : parseFloat(editData.acceptedQty);
      const gross = parseFloat(editData.ourGrossWeight)||selected.ourGrossWeight;
      const empty = parseFloat(editData.ourEmptyWeight)||selected.ourEmptyWeight;
      const updates = {
        partyWeight: parseFloat(editData.partyWeight)||selected.partyWeight,
        ourGrossWeight: gross,
        ourEmptyWeight: empty,
        netWeight: gross - empty,
        weightDiff: (gross - empty) - (parseFloat(editData.partyWeight)||selected.partyWeight),
        acceptedQty: accQty,
        materialGrade: editData.materialGrade||selected.materialGrade,
        moisture: editData.moisture||selected.moisture,
        contamination: editData.contamination||selected.contamination,
        fiberQuality: editData.fiberQuality||selected.fiberQuality,
        remarks: editData.remarks||selected.remarks||"",
      };
      await updateDoc(doc(db,"entries",selected.firestoreId), updates);
      // Signal ALL devices about this specific edit
      const syncTime = new Date().toISOString();
      await setDoc(doc(db,"config","sync"), {
        lastEditAt: syncTime,
        editedId: selected.firestoreId,
        editedData: updates
      });
      localStorage.setItem("wpm_last_sync", syncTime);
      // Update selected entry immediately in UI
      const updatedEntry = {...selected,...updates};
      setSelected(updatedEntry);
      // Clear localStorage cache so updated data loads on next open
      localStorage.removeItem("wpm_history_cache");
      localStorage.removeItem("wpm_history_date");
      // Also update entries in state immediately
      setEntries(prev => prev.map(e => e.firestoreId === selected.firestoreId ? updatedEntry : e));
      setEditMode(false);
      showNotif(`✓ Entry ${selected.id} updated successfully`);
    }catch(e){
      console.error("Edit error:",e);
      showNotif("Failed to update entry","error");
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
    setForm({ step:1, id:genId(), date:nowDate(), grossTime:nowTime(), emptyTime:"", vehicleNo:"", partyName:"", partyWeight:"", ourGrossWeight:"", ourEmptyWeight:"", acceptedQty:"", weighmentPerson:"", qualityChecker:"", materialGrade:"", moisture:"", contamination:"", fiberQuality:"", remarks:"" });
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
    const entry={...form,emptyTime:nowTime(),ourEmptyWeight:empty,ourGrossWeight:gross,partyWeight:parseFloat(form.partyWeight),netWeight:net,weightDiff:diff,acceptedQty:form.acceptedQty?parseFloat(form.acceptedQty):null,status:"Completed",savedAt:new Date().toISOString()};
    // FIX #6 — use form.firestoreId directly (set when draft was saved) instead of searching entries
    await saveEntry(entry);
    showNotif(`✓ Entry ${form.id} completed!`);
    setPage("dashboard");
  }

  function resume(entry){
    setForm({...entry,step:entry.status==="Gross Weighment Done"?2:3,ourEmptyWeight:entry.ourEmptyWeight||""});
    setPage("form");
  }

  // Filtering with useMemo to guarantee recalculation on every state change
  const dashFiltered = useMemo(() => {
    let result = [...entries];
    
    // Party filter
    if(filterParty && filterParty !== "All") {
      const target = filterParty.trim().toLowerCase();
      result = result.filter(e => e.partyName && e.partyName.trim().toLowerCase() === target);
    }
    
    // Date Range filter (takes priority over single date and month)
    if(filterDateFrom && filterDateTo) {
      result = result.filter(e => e.date && e.date >= filterDateFrom && e.date <= filterDateTo);
    }
    // Single Date filter (only if no date range)
    else if(filterDate) {
      result = result.filter(e => e.date === filterDate);
    }
    // Month filter (only if no date range and no single date)
    else if(filterMonth !== "all") {
      const monthKey = filterMonth === "current" ? nowDate().slice(0, 7) : filterMonth;
      result = result.filter(e => e.date && e.date.startsWith(monthKey));
    }
    
    // Text search (only when no specific party selected)
    if(filterParty === "All" && filterP) {
      const search = filterP.toLowerCase();
      result = result.filter(e => e.partyName && e.partyName.toLowerCase().includes(search));
    }
    
    return result;
  }, [entries, filterParty, filterDate, filterMonth, filterP, filterDateFrom, filterDateTo]);
  
  // NEW: Pagination calculations
  const totalEntries = dashFiltered.length;
  const totalPages = Math.ceil(totalEntries / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const currentEntries = dashFiltered.slice(startIndex, endIndex);
  
  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterParty, filterDate, filterMonth, filterP, filterDateFrom, filterDateTo]);
  
  // Calculate statistics
  const today = nowDate();
  const currentMonth = today.slice(0, 7); // "2026-02"
  
  // Financial Year calculation (April 1st to March 31st)
  const getCurrentFY = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // 1-12
    
    // If Jan-Mar, FY started last year (e.g., Feb 2026 → FY 2025-26)
    // If Apr-Dec, FY started this year (e.g., May 2026 → FY 2026-27)
    const fyStartYear = month >= 4 ? year : year - 1;
    return `${fyStartYear}-04-01`; // FY start date: 2025-04-01
  };
  
  const fyStartDate = getCurrentFY();
  const fyEntries = entries.filter(e => e.date && e.date >= fyStartDate && e.status === "Completed");
  
  const todayEnt = entries.filter(e => e.date === today);
  const thisMonthEnt = entries.filter(e => e.date && e.date.startsWith(currentMonth) && e.status === "Completed");
  const pendingCount = entries.filter(e => e.status !== "Completed").length;
  
  const totalNetMT = entries.filter(e => e.netWeight).reduce((s, e) => s + e.netWeight, 0) / 1000;
  const todayNetMT = todayEnt.filter(e => e.netWeight).reduce((s, e) => s + e.netWeight, 0) / 1000;
  const thisMonthNetMT = thisMonthEnt.reduce((s, e) => s + (e.netWeight || 0), 0) / 1000;
  const thisYearNetMT = fyEntries.reduce((s, e) => s + (e.netWeight || 0), 0) / 1000;
  
  // Format FY for display (e.g., "FY 2025-26")
  const formatFY = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const fyStartYear = month >= 4 ? year : year - 1;
    const fyEndYear = fyStartYear + 1;
    return `FY ${fyStartYear}-${fyEndYear.toString().slice(2)}`;
  };
  
  // Filtered summary statistics
  const filteredNetMT = dashFiltered.filter(e => e.netWeight).reduce((s, e) => s + e.netWeight, 0) / 1000;
  
  // NEW: Date-wise summary calculation (based on selected month)
  const dateSummary = useMemo(() => {
    // Determine which month to show
    const selectedMonth = dailySummaryMonth === "current" ? currentMonth : dailySummaryMonth;
    
    // Get selected month entries only
    const monthEntries = entries.filter(e => 
      e.date && 
      e.date.startsWith(selectedMonth) && 
      e.status === "Completed"
    );
    
    // Group by date
    const grouped = monthEntries.reduce((acc, entry) => {
      const date = entry.date;
      if (!acc[date]) {
        acc[date] = {
          date: date,
          count: 0,
          totalWeight: 0
        };
      }
      acc[date].count += 1;
      acc[date].totalWeight += (entry.netWeight || 0);
      return acc;
    }, {});
    
    // Convert to array and sort by date (newest first)
    return Object.values(grouped).sort((a, b) => b.date.localeCompare(a.date));
  }, [entries, currentMonth, dailySummaryMonth]);
  
  // Get selected month name for display
  const selectedMonthName = dailySummaryMonth === "current" ? currentMonth : dailySummaryMonth;
  
  // NEW: Party-wise Daily Summary calculation
  const partyWiseSummary = useMemo(() => {
    // Get entries for selected date only (completed entries)
    const dateEntries = entries.filter(e => 
      e.date === partyWiseDate && 
      e.status === "Completed"
    );
    
    // Group by party name
    const grouped = dateEntries.reduce((acc, entry) => {
      const party = entry.partyName || "Unknown";
      if (!acc[party]) {
        acc[party] = {
          partyName: party,
          count: 0,
          totalWeight: 0,
          totalAccepted: 0
        };
      }
      acc[party].count += 1;
      acc[party].totalWeight += (entry.netWeight || 0);
      acc[party].totalAccepted += (entry.acceptedQty || 0);
      return acc;
    }, {});
    
    // Convert to array and sort by total weight (highest first)
    return Object.values(grouped).sort((a, b) => b.totalWeight - a.totalWeight);
  }, [entries, partyWiseDate]);
  
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
        .mobile-text { display: none; }
        .desktop-text { display: inline; }
        @media (max-width: 768px) {
          .desktop-text { display: none !important; }
          .mobile-text { display: inline !important; }
        }
      `}</style>
      {notif&&<div style={{position:"fixed",top:72,right:20,background:notif.type==="success"?"#0f172a":"#dc2626",color:"#fff",padding:"11px 18px",borderRadius:10,fontSize:13,fontWeight:600,zIndex:999,maxWidth:320}}>{notif.type==="success"?"✓ ":"⚠ "}{notif.msg}</div>}
      {saving&&<div style={{position:"fixed",bottom:0,left:0,right:0,background:"#1e40af",color:"#fff",textAlign:"center",padding:"8px",fontSize:12,fontWeight:600}}>🔥 Syncing to Firebase...</div>}

      {/* Manage Parties Panel */}
      {showManageParties&&(
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.5)",zIndex:500,display:"flex",alignItems:"flex-start",justifyContent:"flex-end"}} onClick={()=>setShowManageParties(false)}>
          <div style={{background:"#fff",width:"100%",maxWidth:420,height:"100vh",overflowY:"auto",boxShadow:"-4px 0 24px rgba(0,0,0,0.2)",display:"flex",flexDirection:"column"}} onClick={e=>e.stopPropagation()}>
            <div style={{background:"#0f172a",padding:"18px 20px",display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,zIndex:10}}>
              <div style={{color:"#fff",fontWeight:800,fontSize:15}}>🏢 Manage Parties</div>
              <button onClick={()=>setShowManageParties(false)} style={{background:"none",border:"none",color:"#94a3b8",fontSize:22,cursor:"pointer",lineHeight:1}}>✕</button>
            </div>
            <div style={{padding:"16px"}}>
              <div style={{fontSize:12,color:"#64748b",marginBottom:12,background:"#f0fdf4",border:"1px solid #86efac",borderRadius:8,padding:"10px 12px"}}>
                ✅ Parties are stored in <strong>Firebase</strong> — adding or removing here updates <strong>all devices instantly</strong>, no code change needed.
              </div>
              <div style={{display:"flex",gap:8,marginBottom:16}}>
                <input
                  type="text"
                  placeholder="New party name..."
                  value={newPartyInput}
                  onChange={e=>setNewPartyInput(e.target.value)}
                  onKeyDown={e=>{ if(e.key==="Enter"){ addParty(newPartyInput); setNewPartyInput(""); } }}
                  style={{flex:1,border:"1.5px solid #e2e8f0",borderRadius:8,padding:"9px 12px",fontSize:13,outline:"none"}}
                />
                <button
                  onClick={()=>{ addParty(newPartyInput); setNewPartyInput(""); }}
                  style={{background:"#16a34a",color:"#fff",border:"none",borderRadius:8,padding:"9px 16px",fontSize:13,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}
                >+ Add</button>
              </div>
              <div style={{fontSize:11,color:"#64748b",marginBottom:10,fontWeight:600}}>{PARTIES.length} PARTIES (A–Z)</div>
              <div style={{border:"1px solid #e2e8f0",borderRadius:10,overflow:"hidden"}}>
                {PARTIES.map((p,i)=>(
                  <div key={p} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 12px",borderBottom:i===PARTIES.length-1?"none":"1px solid #f1f5f9",background:i%2===0?"#fff":"#f8fafc"}}>
                    <span style={{fontSize:13,fontWeight:500,color:"#0f172a"}}>{p}</span>
                    <button onClick={()=>deleteParty(p)} style={{background:"none",border:"none",color:"#dc2626",cursor:"pointer",fontSize:16,padding:"2px 6px",borderRadius:4}} title="Remove party">🗑</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <header style={{background:"#0f172a",height:62,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 12px",position:"sticky",top:0,zIndex:200}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:36,height:36,borderRadius:8,background:"linear-gradient(135deg,#dc2626,#991b1b)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>♻</div>
          <div>
            <div style={{color:"#f8fafc",fontWeight:700,fontSize:15}}>
              <span className="desktop-text">{COMPANY.name} — RAWMATERIAL INWARD</span>
              <span className="mobile-text">{COMPANY.name}</span>
            </div>
            <div style={{color:"#64748b",fontSize:10,textTransform:"uppercase"}}>
              <span className="desktop-text">Firebase Live Sync • {entries.length} Entries {viewMode ? "• 👁 View Mode" : ""}</span>
              <span className="mobile-text">{entries.length} Entries</span>
            </div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <button style={navBtn(page==="dashboard")} onClick={()=>setPage("dashboard")}>
            <span className="desktop-text">📊 Dashboard</span>
            <span className="mobile-text">📊</span>
          </button>
          <button style={{...navBtn(false),background:viewMode?"#854d0e":"#1e3a5f",fontSize:11,padding:"6px 10px"}} onClick={()=>{
            const next = !viewMode;
            setViewMode(next);
            localStorage.setItem("wpm_view_mode", next ? "true" : "false");
            // Clear cache so next reload fetches correct data range
            localStorage.removeItem("wpm_history_cache");
            localStorage.removeItem("wpm_history_date");
            localStorage.removeItem("wpm_history_cache_ver");
            window.location.reload();
          }}>
            <span className="desktop-text">{viewMode ? "👁 View Mode ON" : "👁 View Mode OFF"}</span>
            <span className="mobile-text">👁</span>
          </button>
          <button style={{...navBtn(false),background:"#1e3a5f"}} onClick={()=>setShowManageParties(v=>!v)}>
            <span className="desktop-text">🏢 Parties</span>
            <span className="mobile-text">🏢</span>
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
                    {l:"This Year (MT)",v:thisYearNetMT.toFixed(2),c:"#8b5cf6",sub:formatFY()},
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
                  
                  {/* NEW: Date Range Filter */}
                  <div style={{marginBottom:12,padding:"12px",background:"#f8fafc",borderRadius:8,border:`1px solid ${C.border}`}}>
                    <div style={{fontSize:12,fontWeight:700,color:C.mid,marginBottom:8}}>📅 Date Range (Optional)</div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:10}}>
                      <div>
                        <label style={{fontSize:10,fontWeight:600,color:C.mid,marginBottom:3,display:"block"}}>From Date</label>
                        <input 
                          type="date" 
                          value={filterDateFrom} 
                          onChange={e=>setFilterDateFrom(e.target.value)} 
                          style={{...inp,fontSize:12}}
                        />
                      </div>
                      <div>
                        <label style={{fontSize:10,fontWeight:600,color:C.mid,marginBottom:3,display:"block"}}>To Date</label>
                        <input 
                          type="date" 
                          value={filterDateTo} 
                          onChange={e=>setFilterDateTo(e.target.value)} 
                          style={{...inp,fontSize:12}}
                        />
                      </div>
                      {(filterDateFrom || filterDateTo) && (
                        <div style={{display:"flex",alignItems:"flex-end"}}>
                          <button 
                            onClick={()=>{setFilterDateFrom("");setFilterDateTo("");}} 
                            style={{...secondaryBtn,fontSize:11,padding:"8px 12px",height:"fit-content"}}
                          >
                            Clear Range
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div style={{display:"flex",gap:8}}>
                    <button onClick={()=>{setFilterParty("All");setFilterDate("");setFilterMonth("current");setFilterP("");setFilterDateFrom("");setFilterDateTo("");}} style={secondaryBtn}>Clear All Filters</button>
                  </div>
                </div>
                {(filterParty!=="All"||filterDate||filterMonth!=="current"||filterP||filterDateFrom||filterDateTo)&&(
                  <div style={{background:"#eff6ff",border:"2px solid #93c5fd",borderRadius:12,padding:"16px",marginBottom:14}}>
                    <div style={{fontSize:13,fontWeight:700,color:"#1e40af",marginBottom:8}}>📊 Filtered Results</div>
                    <div style={{fontSize:12,color:"#1e40af"}}>
                      {filterParty!=="All"&&<div>• Party: <strong>{filterParty}</strong></div>}
                      {filterDateFrom&&filterDateTo&&<div>• Date Range: <strong>{fmtDate(filterDateFrom)} - {fmtDate(filterDateTo)}</strong></div>}
                      {filterDate&&!filterDateFrom&&!filterDateTo&&<div>• Date: <strong>{fmtDate(filterDate)}</strong></div>}
                      {filterMonth!=="current"&&filterMonth!=="all"&&!filterDateFrom&&!filterDateTo&&<div>• Month: <strong>{formatMonth(filterMonth)}</strong></div>}
                      {filterP&&<div>• Search: <strong>{filterP}</strong></div>}
                      <div style={{marginTop:8,paddingTop:8,borderTop:"1px solid #93c5fd"}}>
                        Total Entries: <strong>{dashFiltered.length}</strong> • 
                        Total Weight: <strong>{filteredNetMT.toFixed(2)} MT</strong>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* NEW: Party-wise Daily Summary Card */}
                <div style={{background:C.card,borderRadius:12,marginBottom:22,overflow:"hidden",border:`2px solid ${C.border}`}}>
                  {/* Header - Always visible */}
                  <div style={{
                    padding:"16px 20px",
                    background: partyWiseExpanded ? "#f8fafc" : "#fff",
                    transition:"background 0.2s"
                  }}>
                    {/* Top row: Title and expand button */}
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <span style={{fontSize:20}}>📊</span>
                        <div style={{fontSize:14,fontWeight:700,color:C.dark}}>
                          Party-wise Daily Summary
                        </div>
                      </div>
                      
                      {/* Expand/Collapse button */}
                      <button
                        onClick={() => setPartyWiseExpanded(!partyWiseExpanded)}
                        style={{
                          background:"none",
                          border:"none",
                          fontSize:20,
                          fontWeight:700,
                          color:C.mid,
                          cursor:"pointer",
                          transform: partyWiseExpanded ? "rotate(180deg)" : "rotate(0deg)",
                          transition:"transform 0.3s",
                          padding:0
                        }}
                      >
                        ▼
                      </button>
                    </div>
                    
                    {/* Second row: Date selector and summary */}
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap"}}>
                      {/* Date selector - DD/MM/YYYY on all devices */}
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <label style={{fontSize:12,fontWeight:600,color:C.mid}}>Date:</label>
                        <div style={{position:"relative",display:"inline-block",minWidth:120}}>
                          {/* DD/MM/YYYY label shown on top */}
                          <div style={{
                            position:"absolute",top:0,left:0,right:0,bottom:0,
                            border:`1px solid ${C.border}`,borderRadius:8,
                            padding:"5px 10px",fontSize:12,fontWeight:600,
                            background:"#fff",display:"flex",alignItems:"center",
                            gap:6,color:C.dark,pointerEvents:"none",zIndex:1
                          }}>
                            <span>{fmtDate(partyWiseDate)}</span>
                            <span style={{fontSize:9,color:C.muted,marginLeft:"auto"}}>▼</span>
                          </div>
                          {/* Real input — fully clickable, sits over label */}
                          <input
                            type="date"
                            value={partyWiseDate}
                            onChange={(e)=>setPartyWiseDate(e.target.value)}
                            style={{
                              display:"block",width:"100%",
                              border:`1px solid ${C.border}`,borderRadius:8,
                              padding:"5px 10px",fontSize:12,
                              cursor:"pointer",background:"transparent",
                              color:"transparent",caretColor:"transparent",
                              position:"relative",zIndex:2,
                              WebkitAppearance:"none",MozAppearance:"none",
                              outline:"none",minWidth:120
                            }}
                          />
                        </div>
                      </div>
                      
                      {/* Summary totals */}
                      {partyWiseSummary.length > 0 && (
                        <div style={{fontSize:12,color:C.mid}}>
                          {partyWiseSummary.reduce((sum, p) => sum + p.count, 0)} vehicles • {" "}
                          {kg(partyWiseSummary.reduce((sum, p) => sum + p.totalWeight, 0))} kg • {" "}
                          {(partyWiseSummary.reduce((sum, p) => sum + p.totalWeight, 0) / 1000).toFixed(3)} MT
                          {partyWiseSummary.reduce((sum, p) => sum + p.totalAccepted, 0) > 0 && (
                            <span style={{color:"#d97706",fontWeight:700}}>
                              {" "}• Acc: {(partyWiseSummary.reduce((sum, p) => sum + p.totalAccepted, 0) / 1000).toFixed(3)} MT
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Expandable content - Shows when expanded */}
                  {partyWiseExpanded && (
                    <div style={{padding:"0 20px 20px 20px",background:"#fff"}}>
                      {partyWiseSummary.length === 0 ? (
                        <div style={{textAlign:"center",padding:"30px 20px",color:C.muted,fontSize:13}}>
                          No completed entries on {fmtDate(partyWiseDate)}
                        </div>
                      ) : (
                        <>
                          {/* Table for party-wise summary - compact for mobile */}
                          <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch",marginTop:12}}>
                            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                              <thead>
                                <tr style={{background:"#f8fafc",borderBottom:`2px solid ${C.border}`}}>
                                  <th style={{padding:"4px 3px",textAlign:"left",fontWeight:700,color:C.mid,fontSize:10,textTransform:"uppercase",width:20}}>#</th>
                                  <th style={{padding:"4px 3px",textAlign:"left",fontWeight:700,color:C.mid,fontSize:10,textTransform:"uppercase"}}>Party Name</th>
                                  <th style={{padding:"4px 3px",textAlign:"center",fontWeight:700,color:C.mid,fontSize:10,textTransform:"uppercase",width:36}}>Veh</th>
                                  <th style={{padding:"4px 3px",textAlign:"right",fontWeight:700,color:C.mid,fontSize:10,textTransform:"uppercase",width:60}}>Net MT</th>
                                  <th style={{padding:"4px 3px",textAlign:"right",fontWeight:700,color:"#b45309",fontSize:10,textTransform:"uppercase",width:60}}>Acc MT</th>
                                </tr>
                              </thead>
                              <tbody>
                                {partyWiseSummary.map((party, index) => (
                                  <tr key={party.partyName} style={{borderBottom: index === partyWiseSummary.length - 1 ? "none" : `1px solid #f1f5f9`}}>
                                    <td style={{padding:"5px 3px",fontWeight:600,color:C.muted,fontSize:11}}>{index + 1}</td>
                                    <td style={{padding:"5px 3px",fontWeight:600,color:C.dark,fontSize:11,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:110}}>{party.partyName}</td>
                                    <td style={{padding:"5px 3px",textAlign:"center",fontWeight:700,color:"#2563eb",fontSize:11}}>({party.count})</td>
                                    <td style={{padding:"5px 3px",textAlign:"right",fontWeight:700,color:"#16a34a",fontFamily:C.mono,fontSize:11,whiteSpace:"nowrap"}}>{(party.totalWeight / 1000).toFixed(3)}</td>
                                    <td style={{padding:"5px 3px",textAlign:"right",fontWeight:700,color:"#d97706",fontFamily:C.mono,fontSize:11,whiteSpace:"nowrap"}}>{party.totalAccepted > 0 ? (party.totalAccepted / 1000).toFixed(3) : "—"}</td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot>
                                <tr style={{borderTop:`2px solid ${C.border}`,background:"#f8fafc"}}>
                                  <td colSpan="2" style={{padding:"5px 3px",fontWeight:700,color:C.dark,fontSize:12}}>Total</td>
                                  <td style={{padding:"5px 3px",textAlign:"center",fontWeight:700,color:"#2563eb",fontSize:12}}>({partyWiseSummary.reduce((sum, p) => sum + p.count, 0)})</td>
                                  <td style={{padding:"5px 3px",textAlign:"right",fontWeight:700,color:"#16a34a",fontFamily:C.mono,fontSize:12,whiteSpace:"nowrap"}}>{(partyWiseSummary.reduce((sum, p) => sum + p.totalWeight, 0) / 1000).toFixed(3)}</td>
                                  <td style={{padding:"5px 3px",textAlign:"right",fontWeight:700,color:"#d97706",fontFamily:C.mono,fontSize:12,whiteSpace:"nowrap"}}>{(partyWiseSummary.reduce((sum, p) => sum + p.totalAccepted, 0) / 1000).toFixed(3)}</td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
                
                {/* NEW: Collapsible Date-wise Summary Card */}
                <div style={{background:C.card,borderRadius:12,marginBottom:22,overflow:"hidden",border:`2px solid ${C.border}`}}>
                  {/* Header - Always visible */}
                  <div style={{
                    padding:"16px 20px",
                    background: dailySummaryExpanded ? "#f8fafc" : "#fff",
                    transition:"background 0.2s"
                  }}>
                    {/* Top row: Title and expand button */}
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <span style={{fontSize:20}}>📅</span>
                        <div style={{fontSize:14,fontWeight:700,color:C.dark}}>
                          Daily Summary
                        </div>
                      </div>
                      
                      {/* Expand/Collapse button */}
                      <button
                        onClick={() => setDailySummaryExpanded(!dailySummaryExpanded)}
                        style={{
                          background:"none",
                          border:"none",
                          fontSize:20,
                          fontWeight:700,
                          color:C.mid,
                          cursor:"pointer",
                          transform: dailySummaryExpanded ? "rotate(180deg)" : "rotate(0deg)",
                          transition:"transform 0.3s",
                          padding:0
                        }}
                      >
                        ▼
                      </button>
                    </div>
                    
                    {/* Second row: Month selector and summary */}
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap"}}>
                      {/* Month selector */}
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <label style={{fontSize:12,fontWeight:600,color:C.mid}}>Month:</label>
                        <select 
                          value={dailySummaryMonth} 
                          onChange={(e) => setDailySummaryMonth(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            ...inp,
                            padding:"6px 10px",
                            fontSize:13,
                            fontWeight:600,
                            cursor:"pointer",
                            minWidth:140
                          }}
                        >
                          <option value="current">{formatMonth(currentMonth)} (Current)</option>
                          {availableMonths.filter(m => m !== currentMonth).map(month => (
                            <option key={month} value={month}>{formatMonth(month)}</option>
                          ))}
                        </select>
                      </div>
                      
                      {/* Summary totals */}
                      {dateSummary.length > 0 && (
                        <div style={{fontSize:12,color:C.mid}}>
                          {dateSummary.reduce((sum, day) => sum + day.count, 0)} vehicles • {" "}
                          {kg(dateSummary.reduce((sum, day) => sum + day.totalWeight, 0))} kg • {" "}
                          {(dateSummary.reduce((sum, day) => sum + day.totalWeight, 0) / 1000).toFixed(2)} MT
                        </div>
                      )}
                      </div>
                    </div>
                  
                  {/* Expandable content - Shows when expanded */}
                  {dailySummaryExpanded && (
                    <div style={{padding:"0 20px 20px 20px",background:"#fff"}}>
                      {dateSummary.length === 0 ? (
                        <div style={{textAlign:"center",padding:"30px 20px",color:C.muted,fontSize:13}}>
                          No completed entries this month yet
                        </div>
                      ) : (
                        <>
                          {/* Table for date summary - compact for mobile */}
                          <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch",marginTop:12}}>
                            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                              <thead>
                                <tr style={{background:"#f8fafc",borderBottom:`2px solid ${C.border}`}}>
                                  <th style={{padding:"6px 8px",textAlign:"left",fontWeight:700,color:C.muted,fontSize:10,textTransform:"uppercase"}}>Date</th>
                                  <th style={{padding:"6px 8px",textAlign:"center",fontWeight:700,color:C.muted,fontSize:10,textTransform:"uppercase",width:52}}>Veh</th>
                                  <th style={{padding:"6px 8px",textAlign:"right",fontWeight:700,color:C.muted,fontSize:10,textTransform:"uppercase"}}>Weight (kg)</th>
                                  <th style={{padding:"6px 8px",textAlign:"right",fontWeight:700,color:C.muted,fontSize:10,textTransform:"uppercase",width:68}}>MT</th>
                                </tr>
                              </thead>
                              <tbody>
                                {dateSummary.map((day, index) => (
                                  <tr key={day.date} style={{borderBottom: index === dateSummary.length - 1 ? "none" : `1px solid #f1f5f9`}}>
                                    <td style={{padding:"7px 8px",fontWeight:600,color:C.dark,whiteSpace:"nowrap",fontSize:12}}>{fmtDate(day.date)}</td>
                                    <td style={{padding:"7px 8px",textAlign:"center",fontWeight:700,color:"#2563eb",fontSize:12}}>{day.count}</td>
                                    <td style={{padding:"7px 8px",textAlign:"right",fontWeight:700,color:"#16a34a",fontFamily:C.mono,fontSize:12,whiteSpace:"nowrap"}}>{kg(day.totalWeight)}</td>
                                    <td style={{padding:"7px 8px",textAlign:"right",fontWeight:700,color:"#16a34a",fontFamily:C.mono,fontSize:11,whiteSpace:"nowrap"}}>{(day.totalWeight/1000).toFixed(2)}</td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot>
                                <tr style={{borderTop:`2px solid ${C.border}`,background:"#f8fafc"}}>
                                  <td style={{padding:"7px 8px",fontWeight:700,color:C.dark,fontSize:12}}>Total</td>
                                  <td style={{padding:"7px 8px",textAlign:"center",fontWeight:700,color:"#2563eb",fontSize:12}}>{dateSummary.reduce((s,d)=>s+d.count,0)}</td>
                                  <td style={{padding:"7px 8px",textAlign:"right",fontWeight:700,color:"#16a34a",fontFamily:C.mono,fontSize:12,whiteSpace:"nowrap"}}>{kg(dateSummary.reduce((s,d)=>s+d.totalWeight,0))}</td>
                                  <td style={{padding:"7px 8px",textAlign:"right",fontWeight:700,color:"#16a34a",fontFamily:C.mono,fontSize:11,whiteSpace:"nowrap"}}>{(dateSummary.reduce((s,d)=>s+d.totalWeight,0)/1000).toFixed(2)}</td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
                
                <div style={{background:C.card,borderRadius:12,padding:"20px"}}>
                  <div style={{fontSize:14,fontWeight:700,marginBottom:14}}>📋 Entries</div>
                  {filterParty==="All"&&<input type="text" style={{...inp,width:"100%",maxWidth:200,marginBottom:14}} placeholder="Search party…" value={filterP} onChange={e=>setFilterP(e.target.value)}/>}
                  {filterParty!=="All"&&<div style={{fontSize:12,color:C.muted,marginBottom:14,fontStyle:"italic"}}>Showing entries for: <strong>{filterParty}</strong></div>}
                  <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
                    <table style={{width:"100%",minWidth:900,borderCollapse:"collapse",fontSize:12.5}}>
                      <thead><tr>{["ID","Date","Vehicle","Party","Net (kg)","Grade","Status","Action"].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
                      <tbody>
                        {currentEntries.length===0&&<tr><td colSpan={8} style={{...td,textAlign:"center",padding:40}}>No entries</td></tr>}
                        {currentEntries.map(e=>(
                          <tr key={e.firestoreId||e.id}>
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
                  
                  {/* NEW: Pagination Controls */}
                  {totalEntries > 0 && (
                    <div style={{marginTop:20,paddingTop:20,borderTop:`2px solid ${C.border}`}}>
                      {/* Status: Showing X-Y of Z entries */}
                      <div style={{fontSize:13,color:C.mid,marginBottom:12,textAlign:"center"}}>
                        Showing <strong>{startIndex + 1}-{Math.min(endIndex, totalEntries)}</strong> of <strong>{totalEntries}</strong> entries
                      </div>
                      
                      {/* Pagination buttons */}
                      <div style={{display:"flex",justifyContent:"center",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                        {/* Previous button */}
                        <button 
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          style={{
                            padding:"8px 16px",
                            borderRadius:8,
                            border:`1.5px solid ${C.border}`,
                            background: currentPage === 1 ? "#f1f5f9" : "#fff",
                            color: currentPage === 1 ? C.muted : C.dark,
                            cursor: currentPage === 1 ? "not-allowed" : "pointer",
                            fontSize:13,
                            fontWeight:600,
                            opacity: currentPage === 1 ? 0.5 : 1
                          }}
                        >
                          ◀ Previous
                        </button>
                        
                        {/* Page numbers */}
                        {Array.from({length: totalPages}, (_, i) => i + 1).map(pageNum => (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            style={{
                              padding:"8px 14px",
                              borderRadius:8,
                              border:`1.5px solid ${currentPage === pageNum ? "#0f172a" : C.border}`,
                              background: currentPage === pageNum ? "#0f172a" : "#fff",
                              color: currentPage === pageNum ? "#fff" : C.dark,
                              cursor:"pointer",
                              fontSize:13,
                              fontWeight: currentPage === pageNum ? 700 : 600,
                              minWidth:40
                            }}
                          >
                            {pageNum}
                          </button>
                        ))}
                        
                        {/* Next button */}
                        <button 
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                          style={{
                            padding:"8px 16px",
                            borderRadius:8,
                            border:`1.5px solid ${C.border}`,
                            background: currentPage === totalPages ? "#f1f5f9" : "#fff",
                            color: currentPage === totalPages ? C.muted : C.dark,
                            cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                            fontSize:13,
                            fontWeight:600,
                            opacity: currentPage === totalPages ? 0.5 : 1
                          }}
                        >
                          Next ▶
                        </button>
                      </div>
                    </div>
                  )}
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
                  
                  {/* Net Weight Display + Accepted Qty */}
                  {form.ourGrossWeight && form.ourEmptyWeight && parseFloat(form.ourEmptyWeight) > 0 && parseFloat(form.ourEmptyWeight) < parseFloat(form.ourGrossWeight) && (
                    <div style={{gridColumn:"1/-1",background:"#0f172a",borderRadius:10,padding:"14px 16px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,alignItems:"center"}}>
                      <div style={{textAlign:"center"}}>
                        <div style={{fontSize:9,color:"#94a3b8",textTransform:"uppercase",marginBottom:4}}>Net Weight</div>
                        <div style={{fontSize:22,fontWeight:800,color:"#86efac",fontFamily:C.mono}}>{kg(parseFloat(form.ourGrossWeight)-parseFloat(form.ourEmptyWeight))}</div>
                        <div style={{fontSize:9,color:"#64748b"}}>kg</div>
                      </div>
                      <div style={{display:"flex",flexDirection:"column",gap:5}}>
                        <label style={{fontSize:11,fontWeight:700,color:"#94a3b8"}}>Accepted Qty (kg)</label>
                        <input
                          style={{...inp,fontWeight:700,fontSize:16,background:"#1e293b",color:"#fbbf24",border:"1.5px solid #334155"}}
                          type="number"
                          placeholder="Enter accepted kg"
                          value={form.acceptedQty}
                          onChange={e=>setForm(f=>({...f,acceptedQty:e.target.value}))}
                        />
                        {form.acceptedQty && (
                          <div style={{fontSize:10,color:"#94a3b8",textAlign:"center"}}>
                            {(parseFloat(form.acceptedQty)/1000).toFixed(3)} MT
                          </div>
                        )}
                      </div>
                    </div>
                  )}

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
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(90px,1fr))",gap:10,marginBottom:20,background:"#0f172a",padding:"16px",borderRadius:10}}>
                {[{l:"Party Wt",v:kg(selected.partyWeight),c:"#f8fafc"},{l:"Gross Wt",v:kg(selected.ourGrossWeight),c:"#93c5fd"},{l:"Empty Wt",v:kg(selected.ourEmptyWeight),c:"#fca5a5"},{l:"Net Wt",v:kg(selected.netWeight),c:"#86efac"},{l:"Accepted Qty",v:selected.acceptedQty!=null?kg(selected.acceptedQty):"—",c:"#fbbf24"}].map(w=>(
                  <div key={w.l} style={{textAlign:"center"}}>
                    <div style={{fontSize:9,color:"#94a3b8",textTransform:"uppercase",marginBottom:4}}>{w.l}</div>
                    <div style={{fontSize:16,fontWeight:800,color:w.c}}>{w.v}</div>
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
                <button style={secondaryBtn} onClick={()=>{setPage("dashboard");setEditMode(false);}}>Close</button>
                {!viewMode&&!editMode&&(
                  <button style={{...actBtn,padding:"10px 20px",fontSize:13,background:"#1e40af"}} onClick={()=>{
                    setEditData({
                      partyWeight:selected.partyWeight||"",
                      ourGrossWeight:selected.ourGrossWeight||"",
                      ourEmptyWeight:selected.ourEmptyWeight||"",
                      acceptedQty:selected.acceptedQty!=null?selected.acceptedQty:"",
                      materialGrade:selected.materialGrade||"",
                      moisture:selected.moisture||"",
                      contamination:selected.contamination||"",
                      fiberQuality:selected.fiberQuality||"",
                      remarks:selected.remarks||"",
                    });
                    setEditMode(true);
                  }}>✏️ Edit</button>
                )}
                {editMode&&(
                  <>
                    <button style={secondaryBtn} onClick={()=>setEditMode(false)}>Cancel</button>
                    <button style={{...greenBtn,padding:"10px 20px",fontSize:13}} onClick={saveEdit}>💾 Save</button>
                  </>
                )}
                {!viewMode&&!editMode&&<button style={{...actBtnRed,padding:"10px 20px",fontSize:13}} onClick={()=>{deleteEntry(selected);setPage("dashboard");}}>🗑 Delete Entry</button>}

              {/* Edit Form */}
              {editMode&&(
                <div style={{marginTop:20,background:"#f8fafc",borderRadius:12,padding:16,border:"2px solid #1e40af"}}>
                  <div style={{fontSize:13,fontWeight:700,color:"#1e40af",marginBottom:14}}>✏️ Edit Entry — {selected.id}</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                    {[
                      {l:"Party Weight (kg)",k:"partyWeight",type:"number"},
                      {l:"Gross Weight (kg)",k:"ourGrossWeight",type:"number"},
                      {l:"Empty Weight (kg)",k:"ourEmptyWeight",type:"number"},
                      {l:"Accepted Qty (kg)",k:"acceptedQty",type:"number"},
                      {l:"Material Grade",k:"materialGrade",type:"text"},
                      {l:"Moisture",k:"moisture",type:"text"},
                      {l:"Contamination",k:"contamination",type:"text"},
                      {l:"Fiber Quality",k:"fiberQuality",type:"text"},
                    ].map(f=>(
                      <div key={f.k}>
                        <label style={{fontSize:10,fontWeight:700,color:"#64748b",textTransform:"uppercase",display:"block",marginBottom:4}}>{f.l}</label>
                        <input
                          type={f.type}
                          value={editData[f.k]}
                          onChange={e=>setEditData(d=>({...d,[f.k]:e.target.value}))}
                          style={{...inp,width:"100%",fontSize:13,fontWeight:600,
                            border:f.k==="acceptedQty"?"2px solid #f59e0b":"1.5px solid #e2e8f0",
                            background:f.k==="acceptedQty"?"#fffbeb":"#fff"
                          }}
                        />
                      </div>
                    ))}
                    <div style={{gridColumn:"1/-1"}}>
                      <label style={{fontSize:10,fontWeight:700,color:"#64748b",textTransform:"uppercase",display:"block",marginBottom:4}}>Remarks</label>
                      <input type="text" value={editData.remarks} onChange={e=>setEditData(d=>({...d,remarks:e.target.value}))} style={{...inp,width:"100%",fontSize:13}}/>
                    </div>
                  </div>
                  {editData.ourGrossWeight&&editData.ourEmptyWeight&&(
                    <div style={{marginTop:12,background:"#0f172a",borderRadius:8,padding:"10px 14px",display:"flex",gap:20,justifyContent:"center"}}>
                      <div style={{textAlign:"center"}}>
                        <div style={{fontSize:9,color:"#94a3b8",textTransform:"uppercase"}}>New Net Weight</div>
                        <div style={{fontSize:18,fontWeight:800,color:"#86efac"}}>{kg(parseFloat(editData.ourGrossWeight)-parseFloat(editData.ourEmptyWeight))} kg</div>
                      </div>
                      {editData.acceptedQty&&(
                        <div style={{textAlign:"center"}}>
                          <div style={{fontSize:9,color:"#94a3b8",textTransform:"uppercase"}}>Accepted Qty</div>
                          <div style={{fontSize:18,fontWeight:800,color:"#fbbf24"}}>{kg(parseFloat(editData.acceptedQty))} kg</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
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
          <div style={{color:"#334155",fontSize:11,marginTop:3}}>By <span style={{color:"#dc2626",fontWeight:700}}>{COMPANY.creator}</span> <span style={{color:"#1e3a5f",fontSize:10}}>v{APP_VERSION}</span></div>
        </div>
      </footer>
    </div>
  );
}
