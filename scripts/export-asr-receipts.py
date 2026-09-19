"""Snapshot completed public ASR receipts; excludes media, accounts and credentials."""
import json,sqlite3,zipfile,re
from pathlib import Path
from datetime import datetime,timezone
db=sqlite3.connect('file:public-processing.sqlite?mode=ro',uri=True)
jobs=db.execute("SELECT id,session,receipt FROM jobs WHERE state='complete' ORDER BY id").fetchall()
failures=db.execute("SELECT id,error FROM jobs WHERE state='failed' ORDER BY id").fetchall()
included=[];skipped=[]
with zipfile.ZipFile('public-asr-receipts.zip','w',zipfile.ZIP_DEFLATED) as archive:
 for ident,session,receipt in jobs:
  if not re.fullmatch(r'\d+',ident):raise ValueError('INVALID_ID')
  path=Path('session-output')/(ident+'-canary.json')
  if not path.exists():skipped.append(ident);continue
  raw=path.read_bytes();data=json.loads(raw)
  if data.get('sessionId')!=session or not data.get('officialPage'):skipped.append(ident);continue
  archive.writestr(ident+'-canary.json',raw);included.append(ident)
 report={'at':datetime.now(timezone.utc).isoformat(),'included':len(included),'skippedLegacyOrMissing':skipped,'failures':[{'id':i,'error':e} for i,e in failures]}
 archive.writestr('receipt-snapshot.json',json.dumps(report,indent=2))
print(json.dumps(report))
