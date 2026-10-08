// Read-only release gate. Does not create records or change configuration.
const required=['SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY','NEWSLETTER_RATE_LIMIT_SECRET','GIRLHOOD_WITHDRAWAL_PEPPER','GIRLHOOD_RATE_LIMIT_SECRET','CRON_SECRET','GIRLHOOD_ALLOWED_ORIGINS'];
const missing=required.filter(key=>!process.env[key]);
if(missing.length) throw new Error('Missing configuration names: '+missing.join(', '));
for(const key of required.filter(key=>key.includes('SECRET')||key.includes('PEPPER')))if(process.env[key].length<32)throw new Error('Configuration too short: '+key);
if(process.env.GIRLHOOD_SUBMISSIONS_OPEN!=='false')throw new Error('Keep GIRLHOOD_SUBMISSIONS_OPEN=false for release verification.');
const response=await fetch(process.env.SUPABASE_URL+'/rest/v1/rpc/newsletter_backend_ready',{method:'POST',headers:{apikey:process.env.SUPABASE_SERVICE_ROLE_KEY,Authorization:'Bearer '+process.env.SUPABASE_SERVICE_ROLE_KEY,'Content-Type':'application/json'},body:'{}',signal:AbortSignal.timeout(10000)});
if(!response.ok || await response.json()!==true)throw new Error('Newsletter preparation migration or service access is not ready. Do not deploy.');
console.log('PASS required settings and independent newsletter backend. Campaign remains closed. Live campaign flow still requires a test project.');
