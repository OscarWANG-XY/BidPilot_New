.PHONY: test test-unit test-integration test-redis test-tiptap test-docx test-all test-all-integration

# 运行单元测试
test-unit:
	PYTHONPATH=. pytest tests/unit -v

# 运行特定集成测试
test-redis:
	PYTHONPATH=. REDIS_INTEGRATION_TEST=true pytest tests/integration/test_redis.py -v

test-tiptap:
	PYTHONPATH=. TIPTAP_INTEGRATION_TEST=true pytest tests/integration/test_tiptap_client.py -v

test-docx:
	PYTHONPATH=. DOCX_TEST=true pytest tests/unit/test_docx.py tests/integration/test_docx.py -v

# 使用标记运行所有集成测试
test-integration:
	PYTHONPATH=. ALL_INTEGRATION_TESTS=true pytest -m integration -v

# 按标记运行特定集成测试
test-integration-redis:
	PYTHONPATH=. ALL_INTEGRATION_TESTS=true pytest -m redis -v

test-integration-tiptap:
	PYTHONPATH=. ALL_INTEGRATION_TESTS=true pytest -m tiptap -v

# 运行所有测试
test-all:
	PYTHONPATH=. ALL_INTEGRATION_TESTS=true pytest

# 只运行所有集成测试，排除单元测试
test-all-integration:
	PYTHONPATH=. ALL_INTEGRATION_TESTS=true pytest tests/integration

# 默认测试命令
test: test-unit 