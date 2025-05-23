.PHONY: test test-unit test-integration test-redis test-tiptap test-docx test-all test-all-integration start-test-worker stop-workers

# Celery Worker管理
start-test-worker:
	@echo "🚀 启动Celery测试Worker..."
	@./start_test_worker.sh

stop-workers:
	@echo "🛑 停止所有Celery Worker..."
	@pkill -f "celery.*worker" 2>/dev/null || true
	@echo "✅ 已停止所有Worker"

# 运行特定集成测试
test-redis:
	PYTHONPATH=. REDIS_TEST=true pytest app/core/tests/test_redis_integration.py -v

test-postgres:
	PYTHONPATH=. POSTGRES_TEST=true pytest \
		app/core/tests/test_postgres_integration.py \
		app/core/tests/test_postgres_unit.py -v

test-tiptap:
	PYTHONPATH=. TIPTAP_TEST=true pytest \
		app/clients/tiptap/tests/test_tiptap_client_integration.py \
		app/clients/tiptap/tests/test_tiptap_docx_integration.py \
		app/clients/tiptap/tests/test_tiptap_utils_integration.py \
		app/clients/tiptap/tests/test_tiptap_client_unit.py \
		app/clients/tiptap/tests/test_tiptap_docx_unit.py \
		app/clients/tiptap/tests/test_tiptap_utils_unit.py \
		app/clients/tiptap/tests/test_tiptap_helpers_unit.py -v

test-models:
	PYTHONPATH=. MODEL_TEST=true pytest \
		app/models/tests/test_models_structuring_integration.py \
		app/models/tests/test_models_structuring_interaction_integration.py \
		app/models/tests/test_models_structuring_unit.py -v


test-api:
	PYTHONPATH=. API_TEST=true pytest \
		app/api/tests/test_django_unit.py -v

test-celery:
	PYTHONPATH=. CELERY_TEST=true pytest \
		app/core/tests/test_celery.py -v

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