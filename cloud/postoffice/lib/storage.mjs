// Keep parameter binding and atomic batches when adapting the shared service to libSQL.
export function storage(client) {
  const shape = result => ({results: result.rows.map(row => Object.fromEntries(Object.entries(row))), meta: {changes: result.rowsAffected}});
  const statement = (sql, args=[]) => ({sql,args,bind:(...values)=>statement(sql,values),
    async first(){return (await client.execute({sql,args})).rows[0]||null;},
    async all(){return shape(await client.execute({sql,args}));},
    async run(){return shape(await client.execute({sql,args}));}
  });
  return {prepare:sql=>statement(sql),batch:async statements=>(await client.batch(statements.map(({sql,args})=>({sql,args})),'write')).map(shape)};
}
