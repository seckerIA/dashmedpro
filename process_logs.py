
import json

log_file = r"C:\Users\gusze\.gemini\antigravity\brain\118f066b-927a-40e1-8c09-b4913902c4d2\.system_generated\steps\105\output.txt"
target_slug = "whatsapp-ai-analyze"

try:
    with open(log_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    logs = data.get('result', [])
    filtered_logs = [log for log in logs if target_slug in log.get('event_message', '') or log.get('function_id') == "5d11738b-151e-4a69-8a4f-e18598672ffa"]
    
    # Sort by timestamp descending
    filtered_logs.sort(key=lambda x: x.get('timestamp', 0), reverse=True)
    
    for log in filtered_logs[:20]:
        print(f"Time: {log.get('timestamp')}, Status: {log.get('status_code')}, Message: {log.get('event_message')}")
        if 'error' in log:
            print(f"Error detail: {log['error']}")

except Exception as e:
    print(f"Error processing logs: {e}")
