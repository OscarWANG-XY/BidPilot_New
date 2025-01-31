背景：我在开发一个智能招投标管理系统，涉及用户和认证管理，文件管理，招投标任务管理 三个模块。
技术栈：
1. 前端：React + TypeScript + TailwindCSS + Tanstack React Query + Tanstack React Router
2. 后端：Django + Django Rest Framework + Django Storages 
3. 数据库：PostgreSQL 
4. 文件存储：腾讯云COS
进展：
用户和认证管理模块的前后端都已经开发完成，并已经集成。
现在正在开发文件管理模块，文件管理模块的前端已经开发好了；
后端正在开发中，已经构建了django文件管理模块的应用apps/files/

框架性问题：
1. 文件管理模块在后端需要同时使用 PostgreSQL 和 腾讯云COS 是么？
2. 构建文件管理模块后端需要从models.py, serializers.py, views.py, urls.py, 逐步构建么？
3. 腾讯云的COS是通过django来连接管理是么？



逐步开始构建：
我已经初步构建了Django文件管理应用apps/files, 做了腾讯云COS的settings配置, 但尚未开始编写models.py, serializers.py 等模块的代码，以及和腾讯云COS的集成。现在我要开始一步步构建整个模块，从models.py开始。

第一步，让我们先和前端数据结构对齐。一个文件管理系统的数据结构/模型应该包含哪些内容呢？ 
数据结构设计：
1. 暂时用不到的数据就先不放进来，未来添加都相对容易
2. 文件的更新，是指文件重命名等，备注修改等，不包含文件内容本身，文件本身应该采取的是删除和重新上传。
3. 由于项目会引用文件，这是一个典型的多对多的关系问题，建议文件侧和项目侧都保留关联表信息，方便跟踪，查询和管理
4. 文件的访问控制，应该包含读写权限，以及文件的拥有者 (这个和用户和认证管理模块就能关联起来)。
5. 关于pdf文件预览，django后端只需要返回文件的url，前端负责文件的预览。 而对于word, 可有三种方式：
    - 使用第三方服务来实现预览，比如office online, 不过微软应该已经停用
    - 将word文件转换为pdf，然后使用pdf预览， 这个要增加文件转换服务
    - 将word文件转换为html，然后使用html预览， 这个要增加文件转换服务 
6. 在前端，文件的API模拟用了json-server 和 uploadserver, 所以当时的API构建的分离两个端口的。这个点在接到Django后端后，需要重新构建。









