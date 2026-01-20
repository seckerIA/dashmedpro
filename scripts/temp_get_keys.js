
const token = 'sbp_4765cd625e8f6aa5026f7b5e96230e29d1b53c6e';
const projectId = 'adzaqkduxnpckbcuqpmg';

async function main() {
    try {
        const res = await fetch(`https://api.supabase.com/v1/projects/${projectId}/api-keys`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`HTTP ${res.status} ${res.statusText}: ${text}`);
        }
        const data = await res.json();
        console.log(JSON.stringify(data, null, 2));
    } catch (e) {
        console.error(e);
    }
}

main();
