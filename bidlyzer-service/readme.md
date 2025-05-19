tests/
├── conftest.py                  # 作用于整个 tests 目录及其子目录
├── unit/
│   ├── conftest.py              # 只作用于 unit 目录及其子目录
│   └── test_logic.py
└── integration/
    ├── conftest.py              # 只作用于 integration 目录及其子目录
    └── test_api.py


 生效规则如下：
tests/conftest.py 中的 fixture、hook 等设置会被所有测试使用；

tests/unit/conftest.py 中的内容 只作用于 unit 子目录内的测试文件；

tests/integration/conftest.py 中的内容 只作用于 integration 子目录内的测试文件。

如果同名 fixture 在上层和下层都有定义，下层的 fixture 会覆盖上层的。