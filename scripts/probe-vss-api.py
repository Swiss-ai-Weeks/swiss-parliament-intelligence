import subprocess,json
code="import urllib.request; print(urllib.request.urlopen('http://localhost:8000/openapi.json').read().decode())"
r=subprocess.run(['docker','exec','vss-agent','/usr/local/bin/python3','-c',code],capture_output=True,text=True,check=True)
j=json.loads(r.stdout)
print(json.dumps({p:{m:{'summary':v.get('summary'),'body':v.get('requestBody')} for m,v in methods.items()} for p,methods in j['paths'].items()},indent=2))
