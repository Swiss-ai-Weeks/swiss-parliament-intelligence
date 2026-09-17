from pathlib import Path
import shutil,subprocess
p=Path('/home/nvidia/swiss-parliament-intelligence/video-search-and-summarization/deploy/docker/developer-profiles/dev-profile-base/vss-agent/configs/config.yml')
s=p.read_text()
if 'rtvi_embed_base_url:' not in s:
    shutil.copy2(p,p.with_suffix('.before-swiss-embed.yml'))
    s=s.replace('    streaming_ingest:\n','    streaming_ingest:\n      rtvi_embed_base_url: http://127.0.0.1:8017\n      rtvi_embed_model: cosmos-embed1-448p\n      rtvi_embed_chunk_duration: 5\n')
    assert 'rtvi_embed_base_url:' in s
    p.write_text(s)
    subprocess.run(['docker','restart','vss-agent'],check=True)
elif '\n    rtvi_embed_base_url:' in s:
    for field in ['rtvi_embed_base_url','rtvi_embed_model','rtvi_embed_chunk_duration']:
        s=s.replace('\n    '+field+':','\n      '+field+':')
    p.write_text(s)
    subprocess.run(['docker','restart','vss-agent'],check=True)
print('VSS embedding configuration installed')
