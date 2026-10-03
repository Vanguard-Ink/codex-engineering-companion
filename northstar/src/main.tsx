import React,{useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import './style.css';
type Task={id:string;title:string;status:string;due_at:string|null;project_name:string;archived:number};
function App(){
  const [signedIn,setSignedIn]=useState(false);
  const [tasks,setTasks]=useState<Task[]>([]);
  const [error,setError]=useState('');
  const [loading,setLoading]=useState(false);
  const [org,setOrg]=useState('org-a');
  useEffect(()=>{if(!signedIn)return;let active=true;setLoading(true);setError('');
    fetch(`/api/orgs/${org}/tasks`).then(async r=>{if(!r.ok)throw Error('Unable to load tasks');return r.json();}).then(data=>{if(active)setTasks(data);}).catch(e=>{if(active)setError(e.message);}).finally(()=>{if(active)setLoading(false);});
    return()=>{active=false;};
  },[signedIn,org]);
  async function login(email:string){setError('');try{const r=await fetch('/api/demo-session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email})});if(!r.ok)throw Error('Demo sign in unavailable');setOrg(email.startsWith('alice')?'org-a':'org-b');setSignedIn(true);}catch(e){setError((e as Error).message);}}
  return <main><header><span className="eyebrow">NORTHSTAR / LOCAL TEACHING EDITION</span><h1>Project work, in view.</h1><p>A small workspace for tasks and project decisions.</p></header>
    {!signedIn?<section aria-label="Demo sign in"><h2>Open a fixture workspace</h2><p>These are fictional accounts on a local demonstration server.</p><button onClick={()=>login('alice@example.test')}>Open Aster Studio</button><button onClick={()=>login('bob@example.test')}>Open Birch Labs</button></section>:<section><div className="toolbar"><h2>{org==='org-a'?'Aster Studio':'Birch Labs'}</h2></div>
    {loading?<p role="status">Loading tasks…</p>:error?<p role="alert">{error}</p>:tasks.length===0?<p>No tasks found.</p>:<ul>{tasks.map(t=><li key={t.id}><div><strong>{t.title}</strong><span>{t.project_name}{t.archived?' · Archived':''}</span></div><div><span className="status">{t.status}</span><time>{t.due_at?new Date(t.due_at).toISOString().slice(0,10):'No deadline'}</time></div></li>)}</ul>}</section>}
    {!signedIn&&error&&<p role="alert">{error}</p>}<footer>Fixture data · Local use only</footer></main>;
}
createRoot(document.getElementById('root')!).render(<App/>);
