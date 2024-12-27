# ✨ 拾光集 ✨

**本项目完全基于 Cloudflare 技术栈构建，无需任何服务器即可运行！**  
☁️ **它借助 Google Gemini AI 辅助开发，旨在提供一个轻量级、快速部署的书签管理方案。**  
🤖 虽然代码可能略显简陋，功能也尚不完善，但我们相信通过大家的共同努力，它会变得越来越好。  
💪 欢迎各位开发者积极参与，提出宝贵的意见和建议，一起打造更完善的书签工具！

![image-20241227143600673](https://i0.wp.com/wangwangit001.cachefly.net/wangwangit/image/master/img1/image-20241227143600673.png)

![image-20241227151220696](https://i0.wp.com/wangwangit001.cachefly.net/wangwangit/image/master/img1/image-20241227151220696.png)

## 🌟 功能特性

- 🏷️ **分类管理:** 支持对书签进行分类，方便整理和查找。
- 🔗 **一键添加:**  快速添加你喜欢的网站到你的书签列表。
- ❤️ **点赞/踩:**  喜欢就点赞，不喜欢就踩一下，表达你的真实想法！
- 🗳️ **互相切换:** 支持点赞和点踩之间切换，也可以取消投票。
- 🎨 **简洁界面:** 简约的设计，让你专注于内容，告别杂乱无章。
- 🚀 **极速加载:**  使用 Cloudflare Workers 构建，速度飞快！
- 📱 **响应式设计:** 在手机、平板和电脑上都能完美展示。
- 🖼️ **后台管理:** 提供简单的后台管理页面，方便你管理书签。

## 🛠️ 技术栈

- **Cloudflare Workers:**  用于构建后端逻辑和 API 服务。 ☁️
- **Cloudflare KV:**  用于存储书签数据和投票信息。 🗄️
- **Cloudflare D1:** 用于存储书签的基础数据. 🗄️
- **HTML/CSS/JavaScript:**  用于构建前端用户界面。 💻

## 🗄️ D1 表结构

在 Cloudflare D1 中，你需要创建以下两个表：

1. **sites表**

   ```sql
   CREATE TABLE sites (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       name TEXT NOT NULL,
       url TEXT NOT NULL,
       logo TEXT,
       desc TEXT,
       catelog TEXT NOT NULL,
       create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
       update_time DATETIME DEFAULT CURRENT_TIMESTAMP
   );
   ```

   *   `id`: 自增主键。
   *   `name`: 书签名称，不能为空。
   *   `url`: 书签 URL，不能为空。
   *   `logo`: 书签 Logo，可选。
   *   `desc`: 书签描述，可选。
   *   `catelog`: 书签分类，不能为空。
   *   `create_time`: 创建时间，默认当前时间。
   *   `update_time`: 更新时间，默认当前时间。

2. **pending_sites表**

   ```sql
   CREATE TABLE pending_sites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      logo TEXT,
      desc TEXT,
      catelog TEXT NOT NULL,
      create_time DATETIME DEFAULT CURRENT_TIMESTAMP
   );
   ```

    *   `id`: 自增主键。
    *   `name`: 书签名称，不能为空。
    *   `url`: 书签 URL，不能为空。
    *   `logo`: 书签 Logo，可选。
    *   `desc`: 书签描述，可选。
    *   `catelog`: 书签分类，不能为空。
    *   `create_time`: 创建时间，默认当前时间。

## 🚀 如何使用

1. **配置 KV 命名空间:**

   *   在 Cloudflare 控制台中创建一个 KV 命名空间NAV_KV，用于存储点赞/点踩的数据。

   ![image-20241227143754302](https://i0.wp.com/wangwangit001.cachefly.net/wangwangit/image/master/img1/image-20241227143754302.png)

2. **配置 D1 数据库:**

   *   在 Cloudflare 控制台中创建一个 `D1` 数据库
   *   使用 `D1` 的控制台创建上面的 `sites` 和 `pending_sites` 表。

   ![image-20241227145133659](https://i0.wp.com/wangwangit001.cachefly.net/wangwangit/image/master/img1/image-20241227145133659.png)

3. **访问你的域名:** 复制book.js代码,粘贴到Worker中部署,并且绑定上面创建的KV和D1数据库，通过你的域名即可访问你的书签应用。 🌐

![image-20241227145244891](https://i0.wp.com/wangwangit001.cachefly.net/wangwangit/image/master/img1/image-20241227145244891.png)

4.  **添加书签:**
    *   **前台添加:** 在页面中点击 "新增书签" 按钮，即可提交书签，等待管理员审核. ➕
    *   **后台添加:** 访问 `/admin` 页面，使用用户名 `aaa` 和密码 `bbb` 登录,如 (https://nav.wangwangit.com/admin?name=aaa&password=bbb) ，可以**全局搜索账号密码进行替换**,或者自行优化这一段逻辑!即可管理你的书签，进行添加、删除、修改操作。 ⚙️
5.  **使用书签列表**
    * 可以使用顶部的下拉列表选择不同的书签分类.
    * 点击书签卡片可以访问网站.
    * 点击书签卡片右下角的👍或者👎进行投票,可以重复点击取消,或切换投票.
6.  **开始使用:**  享受你的个性化书签世界！ 🥳

## 🤝 贡献

欢迎大家参与项目！你可以通过以下方式贡献：

- 提交 Issue，报告 Bug 或提出新的功能建议。 🐛
- 提交 Pull Request，贡献代码。 🧑‍💻

## 📜 License

本项目使用 MIT License 开源。 📃

## 🎉 感谢

感谢使用 ✨ 拾光集 ✨，希望这个项目能帮助你更好地管理你的书签！ 🙏

## 🔗 链接

https://github.com/nbuggg/book
