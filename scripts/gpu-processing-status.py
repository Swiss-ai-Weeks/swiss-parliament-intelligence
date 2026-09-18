"""Read-only progress snapshot; queue position is not completion count."""
import sqlite3,json
from datetime import datetime,timezone
from pathlib import Path
db=sqlite3.connect('file:public-processing.sqlite?mode=ro',uri=True)
states=dict(db.execute('SELECT state,count(*) FROM jobs GROUP BY state').fetchall())
total=len(json.loads(Path('public-session-queue.json').read_text()))
print(json.dumps({'at':datetime.now(timezone.utc).isoformat(),'queueEntries':total,'states':states,'scope':'ASR worker receipts only; not human-reviewed alignment or VSS completion'}))
