/* demo-admin / assets/app.js — 全局版（非模块） */
(function (global) {
  // 选择器
  const $  = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  // Drawer
  function openDrawer(){ $('.drawer')?.classList.add('open'); }
  function closeDrawer(){ $('.drawer')?.classList.remove('open'); }
  function setDrawer(html){ const body = $('#drawerBody'); if(body) body.innerHTML = html; }

  // Toast
  function toast(msg, type='info', ms=1800){
    const el = document.createElement('div');
    el.textContent = msg;
    el.style.cssText = 'position:fixed;right:16px;top:72px;padding:8px 12px;border-radius:8px;color:#fff;z-index:9999;opacity:.96;';
    const colors = { info:'#111827', success:'#10B981', error:'#EF4444', warn:'#F59E0B' };
    el.style.background = colors[type] || colors.info;
    document.body.appendChild(el); setTimeout(()=>el.remove(), ms);
  }

  // Confirm（用 Drawer 做一个简易确认框）
  function confirmBox({ title='确认操作', content='是否继续？', okText='确定', cancelText='取消' } = {}){
    return new Promise(resolve => {
      setDrawer(`
        <div class="desc">
          <div class="row"><div class="label">${title}</div><div class="value">${content}</div></div>
        </div>
        <div style="margin-top:12px;display:flex;gap:8px">
          <button class="btn primary" id="__ok">${okText}</button>
          <button class="btn" id="__cancel">${cancelText}</button>
        </div>
      `);
      openDrawer();
      $('#__ok')?.addEventListener('click', ()=>{ closeDrawer(); resolve(true); });
      $('#__cancel')?.addEventListener('click', ()=>{ closeDrawer(); resolve(false); });
    });
  }

  // 状态标签
  function renderTag(state, map={}){
    const clsMap = { confirmed:'confirmed', success:'confirmed', ok:'confirmed',
                     pending:'pending', processing:'pending', wait:'pending',
                     failed:'failed', error:'failed', rejected:'failed', inactive:'failed' };
    const text = map[state] || state;
    const cls = clsMap[state] || (['approved','signed','enabled'].includes(state) ? 'confirmed'
                : ['manual_review','paused'].includes(state) ? 'pending'
                : ['rejected','disabled'].includes(state) ? 'failed' : 'pending');
    return `<span class="tag ${cls}">${text}</span>`;
  }
  const tag = renderTag;

  // 格式化
  const fmtMoney   = (n, c='¥') => `${c} ${Number(n||0).toLocaleString('zh-CN')}`;
  const fmtPercent = (n)        => `${(Number(n||0)).toFixed(1)}%`;

  // 分页（内存）
  function paginate(list=[], {page=1, size=20}={}) {
    const total=list.length, start=(page-1)*size, end=start+size;
    return { page, size, total, has_more: end<total, list: list.slice(start,end) };
  }

  // 事件委托
  function on(root, event, selector, handler){
    root.addEventListener(event, e=>{
      const t = e.target.closest(selector);
      if(t && root.contains(t)) handler(e, t);
    });
  }

  // 表单序列化
  function serialize(form){
    const data={}; new FormData(form).forEach((v,k)=>{
      if(data[k]!==undefined){ if(!Array.isArray(data[k])) data[k]=[data[k]]; data[k].push(v); }
      else data[k]=v;
    }); return data;
  }

  // 存储
  const store = {
    get:(k,def=null)=>{ try{ const v=localStorage.getItem(k); return v?JSON.parse(v):def; }catch{return def} },
    set:(k,v)=>{ try{ localStorage.setItem(k, JSON.stringify(v)); }catch{} },
    remove:(k)=>{ try{ localStorage.removeItem(k); }catch{} }
  };

  // 查询串
  const qs = {
    parse:(s=location.search)=>Object.fromEntries(new URLSearchParams(s)),
    stringify:(obj={})=>{ const usp=new URLSearchParams(); Object.entries(obj).forEach(([k,v])=>v!=null&&usp.append(k,v)); return usp.toString(); }
  };

  // 路由高亮
  function activateSidebar(){
    const links = $$('aside .menu a');
    const path  = location.pathname.replace(/\\/g,'/');
    links.forEach(a=>{
      const href=a.getAttribute('href')||''; if(!href) return;
      const name=href.split('/').pop(); const cur=path.split('/').pop();
      if(name && cur && name===cur) a.classList.add('active'); else a.classList.remove('active');
    });
  }

  // 伪下载
  function fakeDownload(filename='export.txt', text='demo export file'){
    const blob=new Blob([text],{type:'text/plain;charset=utf-8'});
    const url=URL.createObjectURL(blob); const a=document.createElement('a');
    a.href=url; a.download=filename; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000);
  }

  // 兜底动作：页面未定义时也不报错
  function ensureGlobals(){
    const defs = {
      okSup:   (id)=> toast(`补件审核通过 · ${id}`,'success'),
      rejSup:  (id)=> toast(`补件审核拒绝 · ${id}`,'error'),
      allow:   (id)=> toast(`已允许撤回 · ${id}`,'success'),
      deny:    (id)=> toast(`已驳回撤回 · ${id}`,'error'),
      pass:    (i)=>  toast(`已通过 · ${i}`,'success'),
      reject:  (i)=>  toast(`已拒绝 · ${i}`,'error'),
      review:  (i)=>  toast(`已转复审 · ${i}`,'success'),
      release: (i)=>  toast(`已释放 · ${i}`,'success'),
      reverse: (i)=>  toast(`已倒扣 · ${i}`,'error'),
      done:    (id)=> toast(`已更新为成功 · ${id}`,'success'),
      edit:    (id)=> toast(`编辑 · ${id}`,'info'),
      blk:     (id)=> toast(`加入黑名单 · ${id}`,'error'),
      toggle:  (id)=> toast(`状态切换 · ${id}`,'success'),
      disable: (id)=> toast(`已禁用 · ${id}`,'error'),
      reset:   (id)=> toast(`已重置密码 · ${id}`,'success'),
      retry:   (id)=> toast(`触发重算 · ${id}`,'success'),
      stop:    (id)=> toast(`任务已停用 · ${id}`,'success'),
      reSend:  (id)=> toast(`已重新发送 · ${id}`,'success'),
      invalidate:(id)=>toast(`已作废 · ${id}`,'error'),
    };
    Object.entries(defs).forEach(([k,fn])=>{
      if(typeof global[k]!=='function') global[k]=fn;
    });
  }

  // 导出一些便捷函数到 window.App，同时也挂到 window 直用
  const App = { $, $$, openDrawer, closeDrawer, setDrawer, toast, confirmBox,
                renderTag, tag, fmtMoney, fmtPercent, paginate, on, serialize,
                store, qs, activateSidebar, fakeDownload,
                ensureGlobals, nowISO: ()=>new Date().toISOString() };

  global.App = App;
  Object.assign(global, App);   // 允许直接使用 $、toast 等

  // 自动执行
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded', activateSidebar);
  }else{ activateSidebar(); }
  ensureGlobals();

})(window);
