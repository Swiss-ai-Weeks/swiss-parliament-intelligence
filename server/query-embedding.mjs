// Query-time embeddings on the application server's CPU, with the same multilingual-e5-large weights
// (ONNX export) that indexed the corpus on the H100, so semantic search keeps working without a GPU.
let extractor=null,loading=null;
export const QUERY_MODEL='Xenova/multilingual-e5-large';

export async function loadQueryEmbedder({dtype=process.env.EMBEDDING_DTYPE||'q8'}={}){
 if(extractor)return extractor;
 if(!loading)loading=(async()=>{
  const {pipeline,env}=await import('@huggingface/transformers');
  if(process.env.EMBEDDING_CACHE_DIR)env.cacheDir=process.env.EMBEDDING_CACHE_DIR;
  extractor=await pipeline('feature-extraction',QUERY_MODEL,{dtype});
  return extractor;
 })().catch(error=>{loading=null;throw error;});
 return loading;
}

// E5 expects the "query: " prefix for questions (passages were indexed with "passage: ").
export async function embedQuery(text,options){
 const run=await loadQueryEmbedder(options);
 const out=await run('query: '+String(text).slice(0,2000),{pooling:'mean',normalize:true});
 return Float32Array.from(out.data);
}
