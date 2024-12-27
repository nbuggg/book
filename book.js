/**
 * 备用随机 SVG 图标
 */
export const fallbackSVGIcons = [
  `<svg width="80" height="80" viewBox="0 0 24 24" fill="#3498db" xmlns="http://www.w3.org/2000/svg">
     <path d="M12 2L2 12h3v8h6v-6h2v6h6v-8h3L12 2z"/>
   </svg>`,
  `<svg width="80" height="80" viewBox="0 0 24 24" fill="#e74c3c" xmlns="http://www.w3.org/2000/svg">
     <circle cx="12" cy="12" r="10"/>
     <path d="M12 7v5l3.5 3.5 1.42-1.42L14 11.58V7h-2z" fill="#fff"/>
   </svg>`,
  `<svg width="80" height="80" viewBox="0 0 24 24" fill="#27ae60" xmlns="http://www.w3.org/2000/svg">
     <path d="M9 21h6v-2H9v2zm3-20C6.48 1 2 5.48 2 11c0 3.84 2.44 7.13 5.88 8.39-.03-.63-.06-1.59.01-2.28.07-.66.45-1.57.53-1.69s-.11-.28-.32-.62c-.21-.35-.33-.5-.45-.85-.33-1.07.21-1.6.45-1.81 1.15-.94 2.08-.36 2.08-.36.91-.63 1.62-1.23 2.35-1.35.25-.04.71.03.84.38.33.89-.15 1.58-.15 1.58.53-.06 1.06-.21 1.66-.52.31-.16.69-.76.84-.79.36-.02.44.59.44.59s.18 1.72-.76 2.74c-.88.95-1.75.84-2.41 1.23.13.56.49 1.18.71 1.75.4 1.1.6 2.66.57 3.59C18.54 18.08 21 14.81 21 11c0-5.52-4.48-10-10-10z"/>
   </svg>`,
  `<svg width="80" height="80" viewBox="0 0 24 24" fill="#f39c12" xmlns="http://www.w3.org/2000/svg">
     <path d="M12 .587l3.668 7.431L24 9.172l-6 5.843 1.416 8.252L12 19.771l-7.416 3.496L6 15.015 0 9.172l8.332-1.154z"/>
   </svg>`,
];


/**
* 随机获取一个 SVG 图标
*/
function getRandomSVG() {
  return fallbackSVGIcons[Math.floor(Math.random() * fallbackSVGIcons.length)];
  }
  
/**
 * 渲染单个网站卡片
 */
function renderSiteCard(site) {
    const logoHTML = site.logo
        ? `<img src="${site.logo}" alt="${site.name}" onerror="this.src='https://via.placeholder.com/80'"/>`
        : getRandomSVG();

    return `
      <a href="${site.url}" target="_blank" class="site-card" data-url="${site.url}" data-id="${site.id}">
        <div class="logo-wrapper">${logoHTML}</div>
        <div class="site-info">
          <div class="site-name">${site.name || '未命名'}</div>
          <div class="site-desc" title="${site.desc || ''}">
            ${site.desc || '暂无描述'}
          </div>
        </div>
         <div class="vote-wrapper">
            <button class="vote-btn like-btn" data-type="like" data-id="${site.id}">
                <span class="like-icon">👍</span>
                 <span class="like-count">${site.likeCount || 0}</span>
            </button>
             <button class="vote-btn dislike-btn" data-type="dislike" data-id="${site.id}">
                <span class="dislike-icon">👎</span>
                <span class="dislike-count">${site.dislikeCount || 0}</span>
            </button>
         </div>
      </a>
    `;
}
  
  /**
  * 处理 API 请求
  */
  const api = {
    async handleRequest(request, env, ctx) {
        const url = new URL(request.url);
        const path = url.pathname.replace('/api', ''); // 去掉 "/api" 前缀
        const method = request.method;
        const id = url.pathname.split('/').pop(); // 获取最后一个路径段，作为 id (例如 /api/config/1)
        try {
            if (path === '/config') {
                switch (method) {
                    case 'GET':
                        return await this.getConfig(request, env, ctx, url);
                    case 'POST':
                        return await this.createConfig(request, env, ctx);
                    default:
                        return this.errorResponse('Method Not Allowed', 405)
                }
            }
            if (path === '/config/submit' && method === 'POST') {
                return await this.submitConfig(request, env, ctx);
            }
            if (path === `/config/${id}` && /^\d+$/.test(id)) {
                switch (method) {
                    case 'PUT':
                        return await this.updateConfig(request, env, ctx, id);
                    case 'DELETE':
                        return await this.deleteConfig(request, env, ctx, id);
                    default:
                        return this.errorResponse('Method Not Allowed', 405)
                }
            }
            if (path === `/pending/${id}` && /^\d+$/.test(id)) {
                switch (method) {
                    case 'PUT':
                        return await this.approvePendingConfig(request, env, ctx, id);
                    case 'DELETE':
                        return await this.rejectPendingConfig(request, env, ctx, id);
                    default:
                        return this.errorResponse('Method Not Allowed', 405)
                }
            }
            if (path === '/config/import' && method === 'POST') {
                return await this.importConfig(request, env, ctx);
            }
            if (path === '/config/export' && method === 'GET') {
                return await this.exportConfig(request, env, ctx);
            }
            if (path === '/pending' && method === 'GET') {
                return await this.getPendingConfig(request, env, ctx, url);
            }
             // 添加处理投票的接口
             if(path === '/vote' && method === 'POST') {
                return await this.handleVote(request, env, ctx);
             }
            return this.errorResponse('Not Found', 404);
        } catch (error) {
            return this.errorResponse(`Internal Server Error: ${error.message}`, 500);
        }
    },
    // 处理投票的接口
    async handleVote(request, env, ctx) {
        try {
            const { siteId, voteType } = await request.json();
            if (!siteId || !voteType || !['like', 'dislike'].includes(voteType)) {
                return this.errorResponse('Invalid params', 400);
            }
            const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
            // 组合唯一键，表示该 IP 对这个网站投过票
            const voteKey = `${ip}-${siteId}`;
    
            // 检查用户是否已投票
            const existingVote = await env.NAV_KV.get(voteKey);
    
    
            // 更新 KV 数据，点赞数、点踩数
             let likeCount = 0;
            let dislikeCount = 0;
            const siteVoteData = await env.NAV_KV.get(siteId);
            if(siteVoteData) {
               const voteData =  JSON.parse(siteVoteData);
               likeCount = voteData.likeCount || 0;
                dislikeCount = voteData.dislikeCount || 0;
            }
    
    
            if (existingVote) {
               if(existingVote === voteType) {
                   // 如果之前投过相同的票，则删除 KV，并更新点赞/点踩计数
                     if(voteType === 'like') {
                         likeCount--;
                     }else {
                         dislikeCount--;
                     }
                   await env.NAV_KV.delete(voteKey);
               } else {
                 // 如果之前投过相反的票，则更新 KV，并更新点赞/点踩计数。
                    if (voteType === 'like') {
                         likeCount++;
                        dislikeCount--;
                    } else {
                         likeCount--;
                        dislikeCount++;
                    }
                   await env.NAV_KV.put(voteKey, voteType);
                }
            } else {
                 // 如果没有投过票，则创建新的投票记录，并更新点赞/点踩计数
                 if(voteType === 'like') {
                     likeCount++;
                 }else {
                     dislikeCount++;
                 }
                await env.NAV_KV.put(voteKey, voteType);
            }
    
            // 保存更新后的点赞数，点踩数
            await env.NAV_KV.put(siteId, JSON.stringify({likeCount, dislikeCount}));
    
            return new Response(JSON.stringify({
                code: 200,
                message: 'Vote submitted successfully',
                likeCount,
                dislikeCount
            }), { headers: { 'Content-Type': 'application/json' } });
        } catch (e) {
            return this.errorResponse(`Failed to handle vote : ${e.message}`, 500);
        }
    },
    
    async getConfig(request, env, ctx, url) {
            const catalog = url.searchParams.get('catalog');
            const page = parseInt(url.searchParams.get('page') || '1', 10);
            const pageSize = parseInt(url.searchParams.get('pageSize') || '10', 10);
            const keyword = url.searchParams.get('keyword');
            const offset = (page - 1) * pageSize;
            try {
                let query = `SELECT * FROM sites ORDER BY create_time DESC LIMIT ? OFFSET ?`;
                let countQuery = `SELECT COUNT(*) as total FROM sites`;
                let queryBindParams = [pageSize, offset];
                let countQueryParams = [];
    
                if (catalog) {
                    query = `SELECT * FROM sites WHERE catelog = ? ORDER BY create_time DESC LIMIT ? OFFSET ?`;
                    countQuery = `SELECT COUNT(*) as total FROM sites WHERE catelog = ?`
                    queryBindParams = [catalog, pageSize, offset];
                    countQueryParams = [catalog];
                }
    
                if (keyword) {
                    const likeKeyword = `%${keyword}%`;
                    query = `SELECT * FROM sites WHERE name LIKE ? OR url LIKE ? OR catelog LIKE ? ORDER BY create_time DESC LIMIT ? OFFSET ?`;
                    countQuery = `SELECT COUNT(*) as total FROM sites WHERE name LIKE ? OR url LIKE ? OR catelog LIKE ?`;
                    queryBindParams = [likeKeyword, likeKeyword, likeKeyword, pageSize, offset];
                    countQueryParams = [likeKeyword, likeKeyword, likeKeyword];
    
                    if (catalog) {
                        query = `SELECT * FROM sites WHERE catelog = ? AND (name LIKE ? OR url LIKE ? OR catelog LIKE ?) ORDER BY create_time DESC LIMIT ? OFFSET ?`;
                        countQuery = `SELECT COUNT(*) as total FROM sites WHERE catelog = ? AND (name LIKE ? OR url LIKE ? OR catelog LIKE ?)`;
                        queryBindParams = [catalog, likeKeyword, likeKeyword, likeKeyword, pageSize, offset];
                        countQueryParams = [catalog, likeKeyword, likeKeyword, likeKeyword];
                    }
                }
    
                const { results } = await env.NAV_DB.prepare(query).bind(...queryBindParams).all();
                const countResult = await env.NAV_DB.prepare(countQuery).bind(...countQueryParams).first();
                const total = countResult ? countResult.total : 0;
    
                 const sitesWithVotes = await Promise.all(results.map(async (site) => {
                    const siteVoteData = await env.NAV_KV.get(String(site.id));
                    let likeCount = 0;
                    let dislikeCount = 0;
                    if(siteVoteData) {
                        const voteData =  JSON.parse(siteVoteData);
                         likeCount = voteData.likeCount || 0;
                        dislikeCount = voteData.dislikeCount || 0;
                    }
                     return { ...site, likeCount, dislikeCount };
                 }));
    
    
                return new Response(
                    JSON.stringify({
                        code: 200,
                        data: sitesWithVotes,
                        total,
                        page,
                        pageSize
                    }),
                    {headers: {'Content-Type': 'application/json'}}
                );
    
            } catch (e) {
                return this.errorResponse(`Failed to fetch config data: ${e.message}`, 500)
            }
        },
      async getPendingConfig(request, env, ctx, url) {
          const page = parseInt(url.searchParams.get('page') || '1', 10);
          const pageSize = parseInt(url.searchParams.get('pageSize') || '10', 10);
          const offset = (page - 1) * pageSize;
          try {
              const { results } = await env.NAV_DB.prepare(`
                      SELECT * FROM pending_sites ORDER BY create_time DESC LIMIT ? OFFSET ?
                  `).bind(pageSize, offset).all();
                const countResult = await env.NAV_DB.prepare(`
                    SELECT COUNT(*) as total FROM pending_sites
                    `).first();
              const total = countResult ? countResult.total : 0;
                return new Response(
                    JSON.stringify({
                      code: 200,
                      data: results,
                        total,
                      page,
                      pageSize
                    }),
                    {headers: {'Content-Type': 'application/json'}}
                );
          } catch (e) {
              return this.errorResponse(`Failed to fetch pending config data: ${e.message}`, 500);
          }
      },
      async approvePendingConfig(request, env, ctx, id) {
          try {
              const { results } = await env.NAV_DB.prepare('SELECT * FROM pending_sites WHERE id = ?').bind(id).all();
              if(results.length === 0) {
                  return this.errorResponse('Pending config not found', 404);
              }
               const config = results[0];
              await env.NAV_DB.prepare(`
                  INSERT INTO sites (name, url, logo, desc, catelog)
                  VALUES (?, ?, ?, ?, ?)
            `).bind(config.name, config.url, config.logo, config.desc, config.catelog).run();
              await env.NAV_DB.prepare('DELETE FROM pending_sites WHERE id = ?').bind(id).run();
  
               return new Response(JSON.stringify({
                  code: 200,
                  message: 'Pending config approved successfully'
              }),{
                  headers: {
                      'Content-Type': 'application/json'
                  }
              })
          }catch(e) {
              return this.errorResponse(`Failed to approve pending config : ${e.message}`, 500);
          }
      },
      async rejectPendingConfig(request, env, ctx, id) {
          try{
              await env.NAV_DB.prepare('DELETE FROM pending_sites WHERE id = ?').bind(id).run();
              return new Response(JSON.stringify({
                  code: 200,
                  message: 'Pending config rejected successfully',
              }), {headers: {'Content-Type': 'application/json'}});
          } catch(e) {
              return this.errorResponse(`Failed to reject pending config: ${e.message}`, 500);
          }
      },
      async submitConfig(request, env, ctx) {
          try{
              const config = await request.json();
              const { name, url, logo, desc, catelog } = config;
  
              if (!name || !url || !catelog ) {
                  return this.errorResponse('Name, URL and Catelog are required', 400);
              }
              await env.NAV_DB.prepare(`
                  INSERT INTO pending_sites (name, url, logo, desc, catelog)
                  VALUES (?, ?, ?, ?, ?)
            `).bind(name, url, logo, desc, catelog).run();
  
            return new Response(JSON.stringify({
              code: 201,
              message: 'Config submitted successfully, waiting for admin approve',
            }), {
                status: 201,
                headers: { 'Content-Type': 'application/json' },
            })
          } catch(e) {
              return this.errorResponse(`Failed to submit config : ${e.message}`, 500);
          }
      },
    
  
    async createConfig(request, env, ctx) {
        try{
            const config = await request.json();
            const { name, url, logo, desc, catelog } = config;
  
            if (!name || !url || !catelog ) {
                return this.errorResponse('Name, URL and Catelog are required', 400);
            }
            const insert = await env.NAV_DB.prepare(`
                  INSERT INTO sites (name, url, logo, desc, catelog)
                  VALUES (?, ?, ?, ?, ?)
            `).bind(name, url, logo, desc, catelog).run();
  
          return new Response(JSON.stringify({
            code: 201,
            message: 'Config created successfully',
            insert
          }), {
              status: 201,
              headers: { 'Content-Type': 'application/json' },
          })
        } catch(e) {
            return this.errorResponse(`Failed to create config : ${e.message}`, 500);
        }
    },
  
    async updateConfig(request, env, ctx, id) {
        try {
            const config = await request.json();
            const { name, url, logo, desc, catelog } = config;
  
          const update = await env.NAV_DB.prepare(`
              UPDATE sites
              SET name = ?, url = ?, logo = ?, desc = ?, catelog = ?, update_time = CURRENT_TIMESTAMP
              WHERE id = ?
          `).bind(name, url, logo, desc, catelog, id).run();
          return new Response(JSON.stringify({
              code: 200,
              message: 'Config updated successfully',
              update
          }), { headers: { 'Content-Type': 'application/json' }});
        } catch (e) {
            return this.errorResponse(`Failed to update config: ${e.message}`, 500);
        }
    },
  
    async deleteConfig(request, env, ctx, id) {
        try{
            const del = await env.NAV_DB.prepare('DELETE FROM sites WHERE id = ?').bind(id).run();
            return new Response(JSON.stringify({
                code: 200,
                message: 'Config deleted successfully',
                del
            }), {headers: {'Content-Type': 'application/json'}});
        } catch(e) {
          return this.errorResponse(`Failed to delete config: ${e.message}`, 500);
        }
    },
    async importConfig(request, env, ctx) {
      try {
        const jsonData = await request.json();
  
        if (!Array.isArray(jsonData)) {
          return this.errorResponse('Invalid JSON data. Must be an array of site configurations.', 400);
        }
  
        const insertStatements = jsonData.map(item =>
              env.NAV_DB.prepare(`
                      INSERT INTO sites (name, url, logo, desc, catelog)
                      VALUES (?, ?, ?, ?, ?)
                `).bind(item.name, item.url, item.logo, item.desc, item.catelog)
          )
  
        // 使用 Promise.all 来并行执行所有插入操作
        await Promise.all(insertStatements.map(stmt => stmt.run()));
  
        return new Response(JSON.stringify({
            code: 201,
            message: 'Config imported successfully'
        }), {
            status: 201,
            headers: {'Content-Type': 'application/json'}
        });
      } catch (error) {
        return this.errorResponse(`Failed to import config : ${error.message}`, 500);
      }
    },
  
    async exportConfig(request, env, ctx) {
      try{
        const { results } = await env.NAV_DB.prepare('SELECT * FROM sites ORDER BY create_time DESC').all();
        return new Response(JSON.stringify({
            code: 200,
            data: results
        }),{
            headers: {
              'Content-Type': 'application/json',
              'Content-Disposition': 'attachment; filename="config.json"'
            }
        });
      } catch(e) {
        return this.errorResponse(`Failed to export config: ${e.message}`, 500)
      }
    },
     errorResponse(message, status) {
        return new Response(JSON.stringify({code: status, message: message}), {
            status: status,
            headers: { 'Content-Type': 'application/json' },
        });
    }
  };
  
  
  /**
  * 处理后台管理页面请求
  */
  const admin = {
    async handleRequest(request, env, ctx) {
      const url = new URL(request.url);
  
      if (url.pathname === '/admin') {
          // 1. 获取 URL 参数
          const params = url.searchParams;
          const name = params.get('name');
          const password = params.get('password');
  
          // 2. 校验密码 (这里使用最简单的硬编码校验，实际应用请用更安全的校验方式)
          if (name === 'aaa' && password === 'bbb') {
              return this.renderAdminPage();
          } else {
              return new Response('Unauthorized', { status: 403 });
          }
      }
      if (url.pathname.startsWith('/static')) {
          return this.handleStatic(request, env, ctx);
      }
      return new Response('Not Found', {status: 404});
  },
     async handleStatic(request, env, ctx) {
        const url = new URL(request.url);
        const filePath = url.pathname.replace('/static/', '');
  
        let contentType = 'text/plain';
        if (filePath.endsWith('.css')) {
           contentType = 'text/css';
        } else if (filePath.endsWith('.js')) {
           contentType = 'application/javascript';
        }
  
        try {
            const fileContent = await this.getFileContent(filePath)
            return new Response(fileContent, {
              headers: { 'Content-Type': contentType }
            });
        } catch (e) {
           return new Response('Not Found', {status: 404});
        }
  
      },
    async getFileContent(filePath) {
        const fileContents = {
           'admin.html': `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>书签管理页面</title>
    <link rel="stylesheet" href="/static/admin.css">
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;700&display=swap" rel="stylesheet">
  </head>
  <body>
    <div class="container">
        <h1></h1>
  
        <div class="import-export">
          <input type="file" id="importFile" accept=".json" style="display:none;">
          <button id="importBtn">导入</button>
          <button id="exportBtn">导出</button>
        </div>
  
        <div class="add-new">
          <input type="text" id="addName" placeholder="Name">
          <input type="text" id="addUrl" placeholder="URL">
          <input type="text" id="addLogo" placeholder="Logo(optional)">
           <input type="text" id="addDesc" placeholder="Description(optional)">
          <input type="text" id="addCatelog" placeholder="Catelog">
          <button id="addBtn">添加</button>
        </div>
        <div id="message" style="display: none;padding:1rem;border-radius: 0.5rem;margin-bottom: 1rem;"></div>
       <div class="tab-wrapper">
            <div class="tab-buttons">
               <button class="tab-button active" data-tab="config">书签列表</button>
               <button class="tab-button" data-tab="pending">待审核列表</button>
            </div>
             <div id="config" class="tab-content active">
                  <div class="table-wrapper">
                      <table id="configTable">
                          <thead>
                              <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>URL</th>
                                <th>Logo</th>
                                <th>Description</th>
                                <th>Catelog</th>
                                <th>Actions</th>
                              </tr>
                          </thead>
                          <tbody id="configTableBody">
                            <!-- data render by js -->
                          </tbody>
                      </table>
                      <div class="pagination">
                            <button id="prevPage" disabled>上一页</button>
                            <span id="currentPage">1</span>/<span id="totalPages">1</span>
                            <button id="nextPage" disabled>下一页</button>
                      </div>
                 </div>
              </div>
             <div id="pending" class="tab-content">
               <div class="table-wrapper">
                 <table id="pendingTable">
                    <thead>
                      <tr>
                          <th>ID</th>
                           <th>Name</th>
                           <th>URL</th>
                          <th>Logo</th>
                          <th>Description</th>
                          <th>Catelog</th>
                          <th>Actions</th>
                      </tr>
                      </thead>
                      <tbody id="pendingTableBody">
                     <!-- data render by js -->
                      </tbody>
                  </table>
                   <div class="pagination">
                    <button id="pendingPrevPage" disabled>上一页</button>
                     <span id="pendingCurrentPage">1</span>/<span id="pendingTotalPages">1</span>
                    <button id="pendingNextPage" disabled>下一页</button>
                  </div>
               </div>
             </div>
          </div>
    </div>
    <script src="/static/admin.js"></script>
  </body>
  </html>`,
            'admin.css': `body {
      font-family: 'Noto Sans SC', sans-serif;
      margin: 0;
      padding: 20px;
      background-color: #f8f9fa; /* 更柔和的背景色 */
      color: #212529; /* 深色文字 */
  }
  .modal {
      display: none;
      position: fixed;
      z-index: 1000;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      overflow: auto;
      background-color: rgba(0, 0, 0, 0.5); /* 半透明背景 */
  }
  .modal-content {
      background-color: #fff; /* 模态框背景白色 */
      margin: 10% auto;
      padding: 20px;
      border: 1px solid #dee2e6; /* 边框 */
      width: 60%;
      border-radius: 8px;
      position: relative;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1); /* 阴影效果 */
  }
  .modal-close {
      color: #6c757d; /* 关闭按钮颜色 */
      position: absolute;
      right: 10px;
      top: 0;
      font-size: 28px;
      font-weight: bold;
      cursor: pointer;
      transition: color 0.2s;
  }
  
  .modal-close:hover,
  .modal-close:focus {
      color: #343a40; /* 悬停时颜色加深 */
      text-decoration: none;
      cursor: pointer;
  }
  .modal-content form {
      display: flex;
      flex-direction: column;
  }
  
  .modal-content form label {
      margin-bottom: 5px;
      font-weight: 500; /* 字重 */
      color: #495057; /* 标签颜色 */
  }
  .modal-content form input {
      margin-bottom: 10px;
      padding: 10px;
      border: 1px solid #ced4da; /* 输入框边框 */
      border-radius: 4px;
      font-size: 1rem;
      outline: none;
      transition: border-color 0.2s;
  }
  .modal-content form input:focus {
      border-color: #80bdff; /* 焦点边框颜色 */
      box-shadow: 0 0 0 0.2rem rgba(0,123,255,.25);
  }
  .modal-content button[type='submit'] {
      margin-top: 10px;
      background-color: #007bff; /* 提交按钮颜色 */
      color: #fff;
      border: none;
      padding: 10px 15px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 1rem;
      transition: background-color 0.3s;
  }
  
  .modal-content button[type='submit']:hover {
      background-color: #0056b3; /* 悬停时颜色加深 */
  }
  .container {
      max-width: 1200px;
      margin: 20px auto;
      background-color: #fff;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  }
  h1 {
      text-align: center;
      margin-bottom: 20px;
      color: #343a40;
  }
  .tab-wrapper {
      margin-top: 20px;
  }
  .tab-buttons {
      display: flex;
      margin-bottom: 10px;
  }
  .tab-button {
      background-color: #e9ecef;
      border: 1px solid #dee2e6;
      padding: 10px 15px;
      border-radius: 4px 4px 0 0;
      cursor: pointer;
      color: #495057; /* tab按钮文字颜色 */
      transition: background-color 0.2s, color 0.2s;
  }
  .tab-button.active {
      background-color: #fff;
      border-bottom: 1px solid #fff;
      color: #212529; /* 选中tab颜色 */
  }
  .tab-button:hover {
      background-color: #f0f0f0;
  }
  .tab-content {
      display: none;
      border: 1px solid #dee2e6;
      padding: 10px;
      border-top: none;
  }
  .tab-content.active {
      display: block;
  }
  
  .import-export {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
      justify-content: flex-end;
  }
  
  .add-new {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
  }
  .add-new > input {
      flex: 1;
  }
  input[type="text"] {
      padding: 10px;
      border: 1px solid #ced4da;
      border-radius: 4px;
      font-size: 1rem;
      outline: none;
      margin-bottom: 5px;
       transition: border-color 0.2s;
  }
  input[type="text"]:focus {
      border-color: #80bdff; /* 焦点边框颜色 */
      box-shadow: 0 0 0 0.2rem rgba(0,123,255,.25);
  }
  button {
      background-color: #6c63ff; /* 主色调 */
      color: #fff;
      border: none;
      padding: 10px 15px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 1rem;
      transition: background-color 0.3s;
  }
  button:hover {
      background-color: #534dc4;
  }
  
  .table-wrapper {
      overflow-x: auto;
  }
  table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
  }
  th, td {
      border: 1px solid #dee2e6;
      padding: 10px;
      text-align: left;
      color: #495057; /* 表格文字颜色 */
  }
  th {
      background-color: #f2f2f2;
      font-weight: 600;
  }
  tr:nth-child(even) {
      background-color: #f9f9f9;
  }
  
  .actions {
      display: flex;
      gap: 5px;
  }
  .actions button {
      padding: 5px 8px;
      font-size: 0.8rem;
  }
  .edit-btn {
      background-color: #17a2b8; /* 编辑按钮颜色 */
  }
  
  .del-btn {
      background-color: #dc3545; /* 删除按钮颜色 */
  }
  .pagination {
      text-align: center;
      margin-top: 20px;
  }
  .pagination button {
      margin: 0 5px;
      background-color: #e9ecef; /* 分页按钮颜色 */
      color: #495057;
      border: 1px solid #ced4da;
  }
  .pagination button:hover {
      background-color: #dee2e6;
  }
  
  .success {
      background-color: #28a745;
      color: #fff;
  }
  .error {
      background-color: #dc3545;
      color: #fff;
  }
    `,
    'admin.js': `
    const configTableBody = document.getElementById('configTableBody');
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');
    const currentPageSpan = document.getElementById('currentPage');
    const totalPagesSpan = document.getElementById('totalPages');
    
    const pendingTableBody = document.getElementById('pendingTableBody');
      const pendingPrevPageBtn = document.getElementById('pendingPrevPage');
      const pendingNextPageBtn = document.getElementById('pendingNextPage');
      const pendingCurrentPageSpan = document.getElementById('pendingCurrentPage');
      const pendingTotalPagesSpan = document.getElementById('pendingTotalPages');
    
    const messageDiv = document.getElementById('message');
    
    const addBtn = document.getElementById('addBtn');
    const addName = document.getElementById('addName');
    const addUrl = document.getElementById('addUrl');
    const addLogo = document.getElementById('addLogo');
    const addDesc = document.getElementById('addDesc');
    const addCatelog = document.getElementById('addCatelog');
    
    const importBtn = document.getElementById('importBtn');
    const importFile = document.getElementById('importFile');
    const exportBtn = document.getElementById('exportBtn');
    
     const tabButtons = document.querySelectorAll('.tab-button');
      const tabContents = document.querySelectorAll('.tab-content');
    
      tabButtons.forEach(button => {
          button.addEventListener('click', () => {
          const tab = button.dataset.tab;
          tabButtons.forEach(b => b.classList.remove('active'));
           button.classList.add('active');
          tabContents.forEach(content => {
             content.classList.remove('active');
              if(content.id === tab) {
                 content.classList.add('active');
               }
            })
        });
      });
    
    
    // 添加搜索框
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = '搜索书签(名称，URL，分类)';
    searchInput.id = 'searchInput';
    searchInput.style.marginBottom = '10px';
    document.querySelector('.add-new').parentNode.insertBefore(searchInput, document.querySelector('.add-new'));
    
    
    let currentPage = 1;
    let pageSize = 10;
    let totalItems = 0;
    let allConfigs = []; // 保存所有配置数据
    let currentSearchKeyword = ''; // 保存当前搜索关键词
    
    let pendingCurrentPage = 1;
      let pendingPageSize = 10;
      let pendingTotalItems = 0;
      let allPendingConfigs = []; // 保存所有待审核配置数据
    
    // 创建编辑模态框
    const editModal = document.createElement('div');
    editModal.className = 'modal';
    editModal.style.display = 'none';
    editModal.innerHTML = \`
      <div class="modal-content">
        <span class="modal-close">×</span>
        <h2>编辑站点</h2>
        <form id="editForm">
          <input type="hidden" id="editId">
          <label for="editName">名称:</label>
          <input type="text" id="editName" required><br>
          <label for="editUrl">URL:</label>
          <input type="text" id="editUrl" required><br>
          <label for="editLogo">Logo(可选):</label>
          <input type="text" id="editLogo"><br>
          <label for="editDesc">描述(可选):</label>
          <input type="text" id="editDesc"><br>
          <label for="editCatelog">分类:</label>
          <input type="text" id="editCatelog" required><br>
          <button type="submit">保存</button>
        </form>
      </div>
    \`;
    document.body.appendChild(editModal);
    
    const modalClose = editModal.querySelector('.modal-close');
    modalClose.addEventListener('click', () => {
      editModal.style.display = 'none';
    });
    
    const editForm = document.getElementById('editForm');
    editForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const id = document.getElementById('editId').value;
      const name = document.getElementById('editName').value;
      const url = document.getElementById('editUrl').value;
      const logo = document.getElementById('editLogo').value;
      const desc = document.getElementById('editDesc').value;
      const catelog = document.getElementById('editCatelog').value;
    
      fetch(\`/api/config/\${id}\`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          url,
          logo,
          desc,
          catelog
        })
      }).then(res => res.json())
        .then(data => {
          if (data.code === 200) {
            showMessage('修改成功', 'success');
            fetchConfigs();
            editModal.style.display = 'none'; // 关闭弹窗
          } else {
            showMessage(data.message, 'error');
          }
        }).catch(err => {
          showMessage('网络错误', 'error');
        })
    });
    
    
    function fetchConfigs(page = currentPage, keyword = currentSearchKeyword) {
        let url = \`/api/config?page=\${page}&pageSize=\${pageSize}\`;
        if(keyword) {
            url = \`/api/config?page=\${page}&pageSize=\${pageSize}&keyword=\${keyword}\`
        }
        fetch(url)
            .then(res => res.json())
            .then(data => {
                if (data.code === 200) {
                    totalItems = data.total;
                    currentPage = data.page;
                    totalPagesSpan.innerText = Math.ceil(totalItems / pageSize);
                    currentPageSpan.innerText = currentPage;
                    allConfigs = data.data; // 保存所有数据
                    renderConfig(allConfigs);
                    updatePaginationButtons();
                } else {
                    showMessage(data.message, 'error');
                }
            }).catch(err => {
            showMessage('网络错误', 'error');
        })
    }
    function renderConfig(configs) {
    configTableBody.innerHTML = '';
     if (configs.length === 0) {
          configTableBody.innerHTML = '<tr><td colspan="7">没有配置数据</td></tr>';
          return
      }
    configs.forEach(config => {
        const row = document.createElement('tr');
         row.innerHTML = \`
           <td>\${config.id}</td>
            <td>\${config.name}</td>
            <td><a href="\${config.url}" target="_blank">\${config.url}</a></td>
            <td>\${config.logo ? \`<img src="\${config.logo}" style="width:30px;" />\` : 'N/A'}</td>
            <td>\${config.desc || 'N/A'}</td>
            <td>\${config.catelog}</td>
            <td class="actions">
              <button class="edit-btn" data-id="\${config.id}">编辑</button>
              <button class="del-btn" data-id="\${config.id}">删除</button>
            </td>
         \`;
        configTableBody.appendChild(row);
    });
      bindActionEvents();
    }
    
    function bindActionEvents() {
     document.querySelectorAll('.edit-btn').forEach(btn => {
          btn.addEventListener('click', function() {
              const id = this.dataset.id;
              handleEdit(id);
          })
     });
    
    document.querySelectorAll('.del-btn').forEach(btn => {
         btn.addEventListener('click', function() {
            const id = this.dataset.id;
             handleDelete(id)
         })
    })
    }
    
    function handleEdit(id) {
         const row = document.querySelector(\`#configTableBody tr:nth-child(\${Array.from(configTableBody.children).findIndex(tr => tr.querySelector('.edit-btn[data-id="'+ id +'"]')) + 1})\`);
      if (!row) return showMessage('找不到数据','error');
      const name = row.querySelector('td:nth-child(2)').innerText;
      const url = row.querySelector('td:nth-child(3) a').innerText;
      const logo = row.querySelector('td:nth-child(4) img')?.src || '';
      const desc = row.querySelector('td:nth-child(5)').innerText === 'N/A' ? '' : row.querySelector('td:nth-child(5)').innerText;
      const catelog = row.querySelector('td:nth-child(6)').innerText;
    
    
      // 填充表单数据
      document.getElementById('editId').value = id;
      document.getElementById('editName').value = name;
      document.getElementById('editUrl').value = url;
      document.getElementById('editLogo').value = logo;
      document.getElementById('editDesc').value = desc;
      document.getElementById('editCatelog').value = catelog;
      editModal.style.display = 'block';
    }
    function handleDelete(id) {
      if(!confirm('确认删除？')) return;
       fetch(\`/api/config/\${id}\`, {
            method: 'DELETE'
        }).then(res => res.json())
           .then(data => {
               if (data.code === 200) {
                   showMessage('删除成功', 'success');
                   fetchConfigs();
               } else {
                   showMessage(data.message, 'error');
               }
           }).catch(err => {
                showMessage('网络错误', 'error');
           })
    }
    function showMessage(message, type) {
      messageDiv.innerText = message;
      messageDiv.className = type;
      messageDiv.style.display = 'block';
      setTimeout(() => {
          messageDiv.style.display = 'none';
      }, 3000);
    }
    
    function updatePaginationButtons() {
      prevPageBtn.disabled = currentPage === 1;
       nextPageBtn.disabled = currentPage >= Math.ceil(totalItems/pageSize)
    }
    
    prevPageBtn.addEventListener('click', () => {
    if(currentPage > 1) {
        fetchConfigs(currentPage -1);
    }
    });
    nextPageBtn.addEventListener('click', () => {
      if (currentPage < Math.ceil(totalItems/pageSize)) {
        fetchConfigs(currentPage + 1);
      }
    });
    
    addBtn.addEventListener('click', () => {
      const name = addName.value;
      const url = addUrl.value;
      const logo = addLogo.value;
      const desc = addDesc.value;
       const catelog = addCatelog.value;
      if(!name ||    !url || !catelog) {
        showMessage('名称,URL,分类 必填', 'error');
        return;
    }
    fetch('/api/config', {        method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
       name,
       url,
       logo,
       desc,
        catelog
    })
    }).then(res => res.json())
    .then(data => {
       if(data.code === 201) {
           showMessage('添加成功', 'success');
          addName.value = '';
          addUrl.value = '';
          addLogo.value = '';
          addDesc.value = '';
           addCatelog.value = '';
           fetchConfigs();
       }else {
          showMessage(data.message, 'error');
       }
    }).catch(err => {
      showMessage('网络错误', 'error');
    })
    });
    
    importBtn.addEventListener('click', () => {
    importFile.click();
    });
    importFile.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
     const reader = new FileReader();
    reader.onload = function(event) {
       try {
           const jsonData = JSON.parse(event.target.result);
             fetch('/api/config/import', {
                 method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                 body: JSON.stringify(jsonData)
            }).then(res => res.json())
               .then(data => {
                    if(data.code === 201) {
                       showMessage('导入成功', 'success');
                        fetchConfigs();
                    } else {
                       showMessage(data.message, 'error');
                    }
               }).catch(err => {
                     showMessage('网络错误', 'error');
            })
    
       } catch (error) {
             showMessage('JSON格式不正确', 'error');
       }
    }
     reader.readAsText(file);
    }
    })
    exportBtn.addEventListener('click', () => {
    fetch('/api/config/export')
    .then(res => res.blob())
    .then(blob => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'config.json';
    document.body.appendChild(a);
    a.click();
     window.URL.revokeObjectURL(url);
     document.body.removeChild(a);
    }).catch(err => {
    showMessage('网络错误', 'error');
    })
    })
    
    // 搜索功能
    searchInput.addEventListener('input', () => {
        currentSearchKeyword = searchInput.value.trim();
        currentPage = 1; // 搜索时重置为第一页
        fetchConfigs(currentPage,currentSearchKeyword);
    });
    
    
    function fetchPendingConfigs(page = pendingCurrentPage) {
            fetch(\`/api/pending?page=\${page}&pageSize=\${pendingPageSize}\`)
                .then(res => res.json())
                .then(data => {
                  if (data.code === 200) {
                         pendingTotalItems = data.total;
                         pendingCurrentPage = data.page;
                         pendingTotalPagesSpan.innerText = Math.ceil(pendingTotalItems/ pendingPageSize);
                          pendingCurrentPageSpan.innerText = pendingCurrentPage;
                         allPendingConfigs = data.data;
                           renderPendingConfig(allPendingConfigs);
                          updatePendingPaginationButtons();
                  } else {
                      showMessage(data.message, 'error');
                  }
                }).catch(err => {
                showMessage('网络错误', 'error');
             })
    }
    
      function renderPendingConfig(configs) {
            pendingTableBody.innerHTML = '';
            if(configs.length === 0) {
                pendingTableBody.innerHTML = '<tr><td colspan="7">没有待审核数据</td></tr>';
                return
            }
          configs.forEach(config => {
              const row = document.createElement('tr');
              row.innerHTML = \`
                <td>\${config.id}</td>
                 <td>\${config.name}</td>
                 <td><a href="\${config.url}" target="_blank">\${config.url}</a></td>
                 <td>\${config.logo ? \`<img src="\${config.logo}" style="width:30px;" />\` : 'N/A'}</td>
                 <td>\${config.desc || 'N/A'}</td>
                 <td>\${config.catelog}</td>
                  <td class="actions">
                      <button class="approve-btn" data-id="\${config.id}">批准</button>
                    <button class="reject-btn" data-id="\${config.id}">拒绝</button>
                  </td>
                \`;
              pendingTableBody.appendChild(row);
          });
          bindPendingActionEvents();
      }
     function bindPendingActionEvents() {
         document.querySelectorAll('.approve-btn').forEach(btn => {
             btn.addEventListener('click', function() {
                 const id = this.dataset.id;
                 handleApprove(id);
             })
         });
        document.querySelectorAll('.reject-btn').forEach(btn => {
              btn.addEventListener('click', function() {
                   const id = this.dataset.id;
                   handleReject(id);
               })
        })
     }
    
    function handleApprove(id) {
       if (!confirm('确定批准吗？')) return;
       fetch(\`/api/pending/\${id}\`, {
             method: 'PUT',
           }).then(res => res.json())
         .then(data => {
              if (data.code === 200) {
                  showMessage('批准成功', 'success');
                  fetchPendingConfigs();
                   fetchConfigs();
              } else {
                   showMessage(data.message, 'error')
               }
          }).catch(err => {
                showMessage('网络错误', 'error');
            })
    }
     function handleReject(id) {
         if (!confirm('确定拒绝吗？')) return;
        fetch(\`/api/pending/\${id}\`, {
               method: 'DELETE'
          }).then(res => res.json())
             .then(data => {
               if(data.code === 200) {
                   showMessage('拒绝成功', 'success');
                  fetchPendingConfigs();
              } else {
                 showMessage(data.message, 'error');
             }
            }).catch(err => {
                  showMessage('网络错误', 'error');
          })
     }
    function updatePendingPaginationButtons() {
        pendingPrevPageBtn.disabled = pendingCurrentPage === 1;
         pendingNextPageBtn.disabled = pendingCurrentPage >= Math.ceil(pendingTotalItems/ pendingPageSize)
     }
    
     pendingPrevPageBtn.addEventListener('click', () => {
         if (pendingCurrentPage > 1) {
             fetchPendingConfigs(pendingCurrentPage - 1);
         }
     });
      pendingNextPageBtn.addEventListener('click', () => {
         if (pendingCurrentPage < Math.ceil(pendingTotalItems/pendingPageSize)) {
             fetchPendingConfigs(pendingCurrentPage + 1)
         }
      });
    
    fetchConfigs();
    fetchPendingConfigs();
    `
  }
  return fileContents[filePath]
  },
  
  async renderAdminPage() {
  const html = await this.getFileContent('admin.html');
  return new Response(html, {
      headers: {'Content-Type': 'text/html; charset=utf-8'}
  });
  }
  };
  
  
  /**
  * 主逻辑：处理请求，返回 HTML
  */
  async function handleRequest(request, env, ctx) {
    const url = new URL(request.url);
    const catalog = url.searchParams.get('catalog');
  
    let sites = [];
    try {
      // 获取所有数据，不带任何条件
      const { results } = await env.NAV_DB.prepare('SELECT * FROM sites ORDER BY create_time').all();
      const sitesWithVotes = await Promise.all(results.map(async (site) => {
        const siteVoteData = await env.NAV_KV.get(String(site.id));
         let likeCount = 0;
        let dislikeCount = 0;
        if(siteVoteData) {
            const voteData =  JSON.parse(siteVoteData);
           likeCount = voteData.likeCount || 0;
            dislikeCount = voteData.dislikeCount || 0;
        }
        return { ...site, likeCount, dislikeCount };
    }));
    sites = sitesWithVotes;
    } catch (e) {
      return new Response(`Failed to fetch data from D1: ${e.message}`, { status: 500 });
    }
  
    if (!sites || sites.length === 0) {
      return new Response('No site configuration found.', { status: 404 });
    }
  
    // 获取所有分类
    const catalogs = Array.from(new Set(sites.map(s => s.catelog)));
  
    // 根据 URL 参数筛选站点
    const currentCatalog = url.searchParams.get('catalog') || catalogs[0];
    const currentSites = sites.filter(s => s.catelog === currentCatalog);
  
    // 完整页面 HTML
    const html = `
  <!DOCTYPE html>
  <html lang="zh-CN">
  <head>
      <meta charset="UTF-8"/>
      <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
      <title>拾光集</title>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;700&display=swap"/>
      <link rel="icon" href="https://www.wangwangit.com/images/head/a.webp" type="image/webp"/>
      <style>
      .github-link {
        position: absolute;
      top: 0.8rem;
      left: 0.8rem;
       display: inline-flex;
       align-items: center;
       color: #fff;
       text-decoration: none;
      font-size: 1.2rem;  /* 增大字号 */
       z-index: 99;
       transition: opacity 0.3s;
    }
 .github-link:hover {
     opacity: 0.8;
  }
      /* 在style标签里添加如下css */
.vote-btn.active {
   color: #6c63ff;
}
      .vote-wrapper {
        position: absolute;
       bottom: 0.5rem;
       left: 0.5rem;
       display: flex;
       gap: 0.5rem;
       align-items: center;
    }
     .vote-btn {
           background: none;
           border: none;
           cursor: pointer;
           display: flex;
           align-items: center;
           font-size: 1.2rem;
           color: #666;
          gap: 0.2rem;
          transition: color 0.2s;
    }
     .vote-btn:hover {
          color: #333;
    }
     .like-icon {
           font-size: 1.3rem;
    }
     .dislike-icon {
           font-size: 1.3rem;
    }
          :root {
              --body-bg: #F3F5F7;      /* 浅色背景，方便阅读 */
              --header-bg: #6c63ff;    /* 带一点渐变或固定色都行，这里用了紫色 */
              --header-color: #fff;
              --primary-text: #333;
              --card-bg: #fff;
              --card-hover: #f8f9fa;
              --title-color: #3c4043;
          }
              /* 新增书签模态框 */
          #addSiteModal {
              display: none;
              position: fixed;
              z-index: 1000;
              left: 0;
              top: 0;
              width: 100%;
              height: 100%;
              overflow: auto;
              background-color: rgba(0, 0, 0, 0.5); /* 半透明背景 */
          }
          .modal-content {
              background-color: #fff;
              margin: 10% auto;
              padding: 20px;
              border: 1px solid #dee2e6;
              width: 60%;
              border-radius: 8px;
              position: relative;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1); /* 阴影 */
          }
          .modal-close {
              color: #6c757d;
              position: absolute;
              right: 10px;
              top: 0;
              font-size: 28px;
              font-weight: bold;
              cursor: pointer;
              transition: color 0.2s;
          }
  
          .modal-close:hover,
          .modal-close:focus {
              color: #343a40;
              text-decoration: none;
              cursor: pointer;
          }
          .modal-content form {
              display: flex;
              flex-direction: column;
          }
  
          .modal-content form label {
              margin-bottom: 5px;
              font-weight: 500; /* 字重 */
              color: #495057;
          }
          .modal-content form input {
              margin-bottom: 10px;
              padding: 10px;
              border: 1px solid #ced4da; /* 输入框边框 */
              border-radius: 4px;
              font-size: 1rem;
              outline: none;
               transition: border-color 0.2s; /* 添加过渡效果 */
          }
            .modal-content form input:focus {
               border-color: #80bdff;
                box-shadow: 0 0 0 0.2rem rgba(0,123,255,.25);
            }
          .modal-content button[type='submit'] {
              margin-top: 10px;
              background-color: #007bff;
              color: #fff;
              border: none;
              padding: 10px 15px;
              border-radius: 4px;
              cursor: pointer;
              font-size: 1rem;
               transition: background-color 0.3s;
          }
  
          .modal-content button[type='submit']:hover {
              background-color: #0056b3;
          }
          #addSiteBtn {
              position: absolute;
              top: 1rem;
              right: 8rem;
              background: #6c63ff;
              color: #fff;
              border: none;
              padding: 0.75rem 1rem;
              border-radius: 4px;
              cursor: pointer;
              font-size: 1rem;
          }
          #addSiteBtn:hover {
              background: #534dc4;
          }
          * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
          }
          body {
              font-family: 'Noto Sans SC', sans-serif;
              background-color: var(--body-bg);
              color: var(--primary-text);
              min-height: 100vh;
              display: flex;
              flex-direction: column;
          }
  
          /* 头部 */
          header {
                    background: var(--header-bg);
                    color: var(--header-color);
                    padding: 1rem;
                    position: relative;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    display: flex;
                    align-items: center;
                     justify-content: center;
                     flex-direction: column; /* 修改 */
                }
                header h1 {
                    margin: 0;
                    font-size: 1.8rem;
                    color: #fff;
                }
                 header span {
                      display:block;
                     font-size: 0.9rem;
                      color: #eee;
                      text-align: center;
                     font-weight: normal;
                       margin-bottom: 0.5rem;
                }
                 .catalog-dropdown {
                    position: absolute;
                     right: 1rem;
                     top:1rem;
                }
          .catalog-dropdown {
              position: absolute;
              right: 1rem;
          }
          .catalog-dropdown select {
              padding: 0.55rem 0.75rem;
              border-radius: 4px;
              border: 1px solid #ccc;
              font-size: 1rem;
              outline: none;
              cursor: pointer;
          }
  
          /* 主体 */
          main {
              width: 100%;
              max-width: 1200px;
              margin: 0 auto;
              padding: 1.5rem;
              flex: 1;
          }
          .sites-container {
              display: grid;
              grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
              gap: 1rem;
          }
  
          /* 卡片样式 */
          .site-card {
              display: flex;
              flex-direction: column;
              text-decoration: none;
              background: var(--card-bg);
              border-radius: 0.5rem;
              box-shadow: 0 1px 3px rgba(0,0,0,0.12);
              transition: background-color 0.2s, transform 0.2s;
              color: var(--primary-text);
              position: relative;
              padding: 1rem;
          }
          .site-card:hover {
              background-color: var(--card-hover);
              transform: translateY(-3px);
          }
  
          /* logo 区域 */
          .logo-wrapper {
              width: 80px;
              height: 80px;
              margin: 0 auto 1rem;
              display: flex;
              align-items: center;
              justify-content: center;
              border-radius: 0.5rem;
              overflow: hidden;
          }
          .logo-wrapper img {
              width: 100%;
              height: 100%;
              object-fit: cover;
          }
  
          /* 文案 */
          .site-info {
              text-align: center;
          }
          .site-name {
              font-weight: 700;
              font-size: 1rem;
              color: var(--title-color);
              margin-bottom: 0.3rem;
          }
          /* 描述信息，默认只显示一行，鼠标悬停时做 tooltip 多行 */
          .site-desc {
              margin: 0 auto;
              max-width: 90%;
              font-size: 0.9rem;
              color: #666;
              display: none; /* 通过 hover 显示 */
              background: rgba(0,0,0,0.8);
              color: #fff;
              padding: 0.5rem 0.75rem;
              border-radius: 0.4rem;
              position: absolute;
              left: 50%;
              bottom: 110%;
              transform: translateX(-50%);
              width: 220px;
              text-align: left;
              line-height: 1.4;
              box-shadow: 0 2px 6px rgba(0,0,0,0.3);
              z-index: 99;
              white-space: normal;
          }
          .site-card:hover .site-desc {
              display: block;
          }
  
          /* 底部 */
          footer {
              background: #fff;
              text-align: center;
              padding: 1rem;
              box-shadow: 0 -2px 4px rgba(0,0,0,0.06);
              font-size: 0.9rem;
              color: #666;
          }
  
          /* 简易提示框（检测不可访问站点之类的） */
          #offlineToast {
              position: fixed;
              right: 1rem;
              top: 1rem;
              background: #dc3545;
              color: #fff;
              padding: 0.75rem 1rem;
              border-radius: 0.5rem;
              box-shadow: 0 2px 4px rgba(0,0,0,0.2);
              display: none;
              z-index: 999;
          }
          /* 新增书签模态框 */
           #addSiteModal {
               display: none;
               position: fixed;
               z-index: 1000;
              left: 0;
                top: 0;
              width: 100%;
               height: 100%;
              overflow: auto;
              background-color: rgba(0, 0, 0, 0.4);
            }
          .modal-content {
              background-color: #fefefe;
               margin: 10% auto;
               padding: 20px;
                border: 1px solid #888;
                width: 60%;
               border-radius: 8px;
              position: relative;
             }
          .modal-close {
              color: #aaa;
              position: absolute;
              right: 10px;
              top: 0;
              font-size: 28px;
                font-weight: bold;
              cursor: pointer;
          }
  
          .modal-close:hover,
          .modal-close:focus {
            color: black;
            text-decoration: none;
            cursor: pointer;
          }
          .modal-content form {
               display: flex;
               flex-direction: column;
          }
  
         .modal-content form label {
             margin-bottom: 5px;
             font-weight: bold;
         }
        .modal-content form input {
              margin-bottom: 10px;
                padding: 10px;
             border: 1px solid #ddd;
              border-radius: 4px;
              font-size: 1rem;
              outline: none;
         }
  
         .modal-content button[type='submit'] {
               margin-top: 10px;
         }
          #addSiteBtn {
              position: absolute;
              top: 1rem;
             right: 8rem;
              background: #6c63ff;
               color: #fff;
               border: none;
               padding: 0.75rem 1rem;header 
               border-radius: 4px;
               cursor: pointer;
                font-size: 1rem;
           }
           #addSiteBtn:hover {
              background: #534dc4;
           }
      </style>
  </head>
  <body>
  <header>
  <a href="https://github.com/nbuggg/book" target="_blank" class="github-link">
  <img src="https://img.shields.io/badge/Github-black?style=social&logo=github" alt="GitHub" style="width: 90px;margin-right: 30px;">
</a>
      <h1>拾光集</h1>
      <span style="display:block;font-size: 0.9rem; color: #eee;text-align: center;font-weight: normal; margin-bottom: 0.5rem;"> 别藏着掖着啦，分享你的网站，一起构建更有趣的网络世界！👉</span>
      <span style="display:block;font-size: 0.9rem; color: #eee;text-align: center;font-weight: normal; margin-bottom: 0.5rem;">
         <!-- 这里添加你的提示文案 -->
         喜欢就亮个赞，踩雷就点个踩，你的每一次互动都是我们前进的动力！
    </span>
        <button id="addSiteBtn">新增书签</button>
      <div class="catalog-dropdown">
          <select onchange="location.href='?catalog=' + this.value;">
              ${catalogs.map(c => `
              <option value="${c}" ${c === currentCatalog ? 'selected' : ''}>${c}</option>
              `).join('')}
          </select>
      </div>
  </header>
   <div id="addSiteModal" class="modal">
        <div class="modal-content">
          <span class="modal-close">×</span>
            <h2>新增书签</h2>
          <form id="addSiteForm">
            <label for="addSiteName">名称:</label>
            <input type="text" id="addSiteName" required><br>
             <label for="addSiteUrl">URL:</label>
              <input type="text" id="addSiteUrl" required><br>
              <label for="addSiteLogo">Logo(可选):</label>
             <input type="text" id="addSiteLogo"><br>
            <label for="addSiteDesc">描述(可选):</label>
               <input type="text" id="addSiteDesc"><br>
              <label for="addSiteCatelog">分类:</label>
              <input type="text" id="addSiteCatelog" required><br>
           <button type="submit">提交</button>
           </form>
       </div>
    </div>
  <main>
      <div class="sites-container">
          ${currentSites.map(renderSiteCard).join('')}
      </div>
  </main>
  
  <footer>
      <p>© 2024 我们都在网络世界里寻找属于自己的星辰，愿你在此找到方向。</p>
  </footer>
  
  <!-- 不可访问站点提示 -->
  <div id="offlineToast"></div>
  
  <script>
      const siteCards = document.querySelectorAll('.site-card');
      const addSiteModal = document.getElementById('addSiteModal');
      const addSiteBtn = document.getElementById('addSiteBtn');
      const modalClose = addSiteModal.querySelector('.modal-close');
       const addSiteForm = document.getElementById('addSiteForm');
    
      // 设置一个 fetch 封装，用来加 10s 超时和 5xx 检测
      function fetchWithTimeout(url, options = {}, timeout = 10000) {
          // 用 Promise.race 实现超时处理
          return Promise.race([
              fetch(url, options),
              new Promise((_, reject) => {
                  setTimeout(() => reject(new Error('Timeout')), timeout);
              })
          ]);
      }
    addSiteBtn.addEventListener('click', () => {
          addSiteModal.style.display = 'block';
      });
      modalClose.addEventListener('click', () => {
           addSiteModal.style.display = 'none';
       });
    
      addSiteForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const name = document.getElementById('addSiteName').value;
        const url = document.getElementById('addSiteUrl').value;
        const logo = document.getElementById('addSiteLogo').value;
        const desc = document.getElementById('addSiteDesc').value;
        const catelog = document.getElementById('addSiteCatelog').value;
    
        fetch('/api/config/submit', {
          method: 'POST',
           headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name,
             url,
             logo,
              desc,
             catelog
          })
        }).then(res => res.json())
          .then(data => {
              if(data.code === 201) {
                 alert('提交成功，等待管理员审核');
                  addSiteModal.style.display = 'none';
                addSiteForm.reset();
            } else {
                 alert(data.message);
              }
            }).catch(err => {
              alert('网络错误');
         })
      })
      async function checkSiteAvailability() {
          const offlineSites = [];
          const fetchPromises = [];
  
          siteCards.forEach(card => {
              const url = card.dataset.url;
  
              // 使用 HEAD 方法, 注意: mode: 'no-cors' 时无法正常读到 status, 如需读进 status >= 500,
              // 需后端或目标站点允许 CORS; 仅做演示
              const p = fetchWithTimeout(url, { method: 'HEAD', mode: 'no-cors' })
                  .then(res => {
                      // 若请求成功但状态码 >= 500，也视为异常
                      // 注意：no-cors 返回的 res.type 可能是 'opaque'，此时取不到 res.status
                      // 这里是演示用法，如需真正判断，可考虑允许 CORS 或在后端检测
                      if( res.type !== 'opaque' ) {
                          if (!res.ok || res.status >= 500) {
                              card.style.border = '2px dashed #dc3545';
                              offlineSites.push(url);
                          }
                      }
                  })
                  .catch(err => {
                      // 包括超时或任意异常都标记为异常
                      card.style.border = '2px dashed #dc3545';
                      offlineSites.push(url);
                  });
  
              fetchPromises.push(p);
          });
  
          await Promise.all(fetchPromises);
  
          if (offlineSites.length > 0) {
              const toast = document.getElementById('offlineToast');
              if (toast) {
                  toast.innerText = \`探索的道路总是崎岖的，有 \${offlineSites.length} 个站点可能需要一些耐心才能到达。\`;
                  toast.style.display = 'block';
                  setTimeout(() => {
                      toast.style.display = 'none';
                  }, 4000);
              }
          }
      }
  
      window.addEventListener('DOMContentLoaded', () => {
        // 使用 setTimeout 将检测移到事件循环的末尾
        setTimeout(() => {
            checkSiteAvailability();
        }, 0);
         bindVoteEvents()
    });

      function bindVoteEvents() {
        const voteButtons = document.querySelectorAll('.vote-btn');
        voteButtons.forEach(button => {
            button.addEventListener('click', async (event) => {
                event.preventDefault();
                const card = button.closest('.site-card');
                const siteId = card.dataset.id;
                const voteType = button.dataset.type;
                const likeButton = card.querySelector('.like-btn');
                const dislikeButton = card.querySelector('.dislike-btn');
                try {
                    const res = await fetch('/api/vote', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            siteId,
                            voteType
                        })
                    });
                    const data = await res.json();
                    if (data.code === 200) {
                        likeButton.querySelector('.like-count').innerText = data.likeCount;
                        dislikeButton.querySelector('.dislike-count').innerText = data.dislikeCount;
    
                        // 取消其他按钮的选中状态
                         if(voteType === 'like') {
                             dislikeButton.classList.remove('active');
                         } else {
                             likeButton.classList.remove('active');
                         }
                           if(button.classList.contains('active')) {
                             button.classList.remove('active');
                           }else {
                                button.classList.add('active');
                           }
    
                    } else {
                        alert(data.message);
                    }
                } catch (e) {
                    alert('网络错误');
                }
            });
        });
    }
  </script>
  </body>
  </html>
  `;
  
    return new Response(html, {
      headers: { 'content-type': 'text/html; charset=utf-8' }
    });
  }
  
  
  export default {
  async fetch(request, env, ctx) {
   // 这里是你之前的fetch逻辑
  const url = new URL(request.url);
  if (url.pathname.startsWith('/api')) {
      return api.handleRequest(request, env, ctx);
  } else if (url.pathname === '/admin' || url.pathname.startsWith('/static')) {
       return admin.handleRequest(request, env, ctx);
  } else {
    return handleRequest(request, env, ctx);
  }
  },
  };
