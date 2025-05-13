
```
BidPilot_new
├─ .dockerignore
├─ .editorconfig
├─ README.MD
├─ backend
│  ├─ README.MD
│  ├─ apps
│  │  ├─ __init__.py
│  │  ├─ _tools
│  │  │  ├─ LLM_services
│  │  │  │  ├─ _Template.py
│  │  │  │  ├─ _batch_llm_services.py
│  │  │  │  ├─ _generic_llm_services.py
│  │  │  │  ├─ _llm_data_types.py
│  │  │  │  ├─ llm_service.py
│  │  │  │  ├─ notebook
│  │  │  │  │  ├─ LLMtest.ipynb
│  │  │  │  │  └─ django_setup.py
│  │  │  │  └─ temp_old
│  │  │  │     ├─ _01_outline_llm_analyzer.py
│  │  │  │     └─ _02_docx_get_more_titles.py
│  │  │  ├─ doc_structurer
│  │  │  │  ├─ _01_doc_node_creater.py
│  │  │  │  ├─ _02_tree_level_builder.py
│  │  │  │  ├─ _03_tree_builder.py
│  │  │  │  ├─ __init__.py
│  │  │  │  ├─ doc_tree_retriever.py
│  │  │  │  └─ notebook
│  │  │  │     └─ doc_tree_pipeline.ipynb
│  │  │  └─ docx_parser
│  │  │     ├─ _00_utils.py
│  │  │     ├─ _01_xml_loader.py
│  │  │     ├─ _02_xml_parser.py
│  │  │     ├─ _03_element_extractor.py
│  │  │     ├─ _04_tiptap_converter.py
│  │  │     ├─ __init__.py
│  │  │     ├─ notebooks
│  │  │     │  ├─ 01_xml_loading.ipynb
│  │  │     │  ├─ 02_xml_parsing.ipynb
│  │  │     │  ├─ 03_element_extraction.ipynb
│  │  │     │  ├─ 04_tiptap_converter.ipynb
│  │  │     │  ├─ django_setup.py
│  │  │     │  └─ pipeline.ipynb
│  │  │     └─ pipeline.py
│  │  ├─ authentication
│  │  │  ├─ __init__.py
│  │  │  ├─ admin.py
│  │  │  ├─ apps.py
│  │  │  ├─ middlewares.py
│  │  │  ├─ migrations
│  │  │  │  ├─ 0001_initial.py
│  │  │  │  └─ __init__.py
│  │  │  ├─ models.py
│  │  │  ├─ serializers.py
│  │  │  ├─ services.py
│  │  │  ├─ sms_service.py
│  │  │  ├─ tests.py
│  │  │  ├─ urls.py
│  │  │  └─ views.py
│  │  ├─ chat
│  │  │  ├─ __init__.py
│  │  │  ├─ admin.py
│  │  │  ├─ apps.py
│  │  │  ├─ context_providers.py
│  │  │  ├─ migrations
│  │  │  │  ├─ 0001_initial.py
│  │  │  │  └─ __init__.py
│  │  │  ├─ models.py
│  │  │  ├─ pipelines.py
│  │  │  ├─ serializers.py
│  │  │  ├─ services.py
│  │  │  ├─ tasks.py
│  │  │  ├─ tests.py
│  │  │  ├─ urls.py
│  │  │  └─ views.py
│  │  ├─ doc_analysis
│  │  │  ├─ LLM_services
│  │  │  │  ├─ _01_outline_llm_analyzer.py
│  │  │  │  ├─ _02_docx_get_more_titles.py
│  │  │  │  ├─ _Template.py
│  │  │  │  ├─ _batch_llm_services.py
│  │  │  │  ├─ _generic_llm_services.py
│  │  │  │  ├─ _llm_data_types.py
│  │  │  │  ├─ llm_service.py
│  │  │  │  └─ notebook
│  │  │  │     ├─ LLMtest.ipynb
│  │  │  │     └─ django_setup.py
│  │  │  ├─ __init__.py
│  │  │  ├─ admin.py
│  │  │  ├─ apps.py
│  │  │  ├─ doc_structurer
│  │  │  │  ├─ _01_doc_node_creater.py
│  │  │  │  ├─ _02_tree_level_builder.py
│  │  │  │  ├─ _03_tree_builder.py
│  │  │  │  ├─ __init__.py
│  │  │  │  ├─ doc_tree_retriever.py
│  │  │  │  └─ notebook
│  │  │  │     └─ doc_tree_pipeline.ipynb
│  │  │  ├─ docx_parser
│  │  │  │  ├─ _00_utils.py
│  │  │  │  ├─ _01_xml_loader.py
│  │  │  │  ├─ _02_xml_parser.py
│  │  │  │  ├─ _03_element_extractor.py
│  │  │  │  ├─ __init__.py
│  │  │  │  ├─ notebooks
│  │  │  │  │  ├─ 01_xml_loading.ipynb
│  │  │  │  │  ├─ 02_xml_parsing.ipynb
│  │  │  │  │  ├─ 03_element_extraction.ipynb
│  │  │  │  │  └─ pipeline.ipynb
│  │  │  │  └─ pipeline.py
│  │  │  ├─ migrations
│  │  │  │  ├─ 0001_initial.py
│  │  │  │  └─ __init__.py
│  │  │  ├─ models.py
│  │  │  ├─ pipeline
│  │  │  │  ├─ __init__.py
│  │  │  │  ├─ base.py
│  │  │  │  ├─ pipeline.py
│  │  │  │  └─ types.py
│  │  │  ├─ serializers.py
│  │  │  ├─ steps
│  │  │  │  ├─ _01_extract_docx_elements.py
│  │  │  │  ├─ _02_outline_analysis.py
│  │  │  │  ├─ _03_outline_improvement.py
│  │  │  │  ├─ _04_build_docxtree.py
│  │  │  │  ├─ _05_more_subtitles.py
│  │  │  │  ├─ __init__.py
│  │  │  │  ├─ _template.py
│  │  │  │  ├─ analysis_requests.py
│  │  │  │  ├─ notebooks
│  │  │  │  │  ├─ django_setup.py
│  │  │  │  │  └─ steps_simulation.ipynb
│  │  │  │  └─ pipelines copy.py
│  │  │  ├─ tests.py
│  │  │  ├─ urls.py
│  │  │  └─ views.py
│  │  ├─ files
│  │  │  ├─ __init__.py
│  │  │  ├─ admin.py
│  │  │  ├─ apps.py
│  │  │  ├─ migrations
│  │  │  │  ├─ 0001_initial.py
│  │  │  │  └─ __init__.py
│  │  │  ├─ models.py
│  │  │  ├─ serializers.py
│  │  │  ├─ storage.py
│  │  │  ├─ tests.py
│  │  │  ├─ urls.py
│  │  │  └─ views.py
│  │  ├─ projects
│  │  │  ├─ __init__.py
│  │  │  ├─ _deprecated
│  │  │  │  ├─ llm_task_analysis.py
│  │  │  │  ├─ models_deprecated.py
│  │  │  │  ├─ services_deprecated
│  │  │  │  │  ├─ 0_old_process
│  │  │  │  │  │  ├─ _01_extract_docx_elements.py
│  │  │  │  │  │  ├─ _02_outline_analysis.py
│  │  │  │  │  │  ├─ _03_outline_improvement.py
│  │  │  │  │  │  ├─ _04_build_docxtree.py
│  │  │  │  │  │  ├─ _05_more_subtitles.py
│  │  │  │  │  │  └─ _template.py
│  │  │  │  │  └─ types
│  │  │  │  │     ├─ __init__.py
│  │  │  │  │     ├─ base_TypesAndHelpers.py
│  │  │  │  │     ├─ type_DocxElements.py
│  │  │  │  │     ├─ type_DocxTree.py
│  │  │  │  │     ├─ type_DocxTreeMoreTitles.py
│  │  │  │  │     ├─ type_ImprovedDocxElements.py
│  │  │  │  │     ├─ type_OutlineAnalysisResult.py
│  │  │  │  │     ├─ type_TiptapDocx.py
│  │  │  │  │     ├─ type_tiptapHelpers.py
│  │  │  │  │     └─ types.py
│  │  │  │  ├─ signals_deprecated.py
│  │  │  │  └─ tasks_deprecated.py
│  │  │  ├─ admin.py
│  │  │  ├─ apps.py
│  │  │  ├─ consumers
│  │  │  │  └─ consumers.py
│  │  │  ├─ middlewares.py
│  │  │  ├─ migrations
│  │  │  │  ├─ 0001_initial.py
│  │  │  │  ├─ 0002_remove_task_prompt_remove_task_related_company_info_and_more.py
│  │  │  │  ├─ 0003_rename_tender_file_extration_projectstage_tender_file_extraction.py
│  │  │  │  ├─ 0004_remove_projectstage_tender_file_extraction_and_more.py
│  │  │  │  ├─ 0005_task_context_tokens_task_final_result_description_and_more.py
│  │  │  │  ├─ 0006_project_outline_l1_project_outline_l2_and_more.py
│  │  │  │  ├─ 0007_project_index_path_map_l1_project_index_path_map_l2_and_more.py
│  │  │  │  ├─ 0008_project_tender_file_extraction_l1_and_more.py
│  │  │  │  ├─ 0009_task_task_level.py
│  │  │  │  ├─ 0010_structuringagentdocument_structuringagentstate.py
│  │  │  │  └─ __init__.py
│  │  │  ├─ models
│  │  │  │  ├─ History.py
│  │  │  │  ├─ Project.py
│  │  │  │  ├─ ProjectStage.py
│  │  │  │  ├─ Structuring.py
│  │  │  │  ├─ Task.py
│  │  │  │  ├─ Template.py
│  │  │  │  └─ __init__.py
│  │  │  ├─ notebook
│  │  │  │  ├─ 0_db.ipynb
│  │  │  │  ├─ LLM_Outline&Positioning.ipynb
│  │  │  │  ├─ LLM_Outline&Positioning_e1.ipynb
│  │  │  │  ├─ LLM_Outline&Positioning_e2.ipynb
│  │  │  │  ├─ LLM_Outline&Positioning_e3.ipynb
│  │  │  │  ├─ LLM_task_container.ipynb
│  │  │  │  ├─ NotebookCacheManager.py
│  │  │  │  ├─ cache_e1
│  │  │  │  │  ├─ t1-招标文件大纲分析
│  │  │  │  │  │  ├─ t1.1-H1层级标题分析
│  │  │  │  │  │  │  ├─ clean_parsed_results.json
│  │  │  │  │  │  │  ├─ formatted_prompts.json
│  │  │  │  │  │  │  ├─ meta.json
│  │  │  │  │  │  │  ├─ prompt_config.json
│  │  │  │  │  │  │  ├─ raw_results.json
│  │  │  │  │  │  │  └─ task_inputs.json
│  │  │  │  │  │  ├─ t1.2-H2-3层级标题分析
│  │  │  │  │  │  │  ├─ clean_parsed_results.json
│  │  │  │  │  │  │  ├─ formatted_prompts.json
│  │  │  │  │  │  │  ├─ meta.json
│  │  │  │  │  │  │  ├─ prompt_config.json
│  │  │  │  │  │  │  ├─ raw_results.json
│  │  │  │  │  │  │  └─ task_inputs.json
│  │  │  │  │  │  ├─ t1.3-添加前言
│  │  │  │  │  │  ├─ t1.4-增强标题分析
│  │  │  │  │  │  │  ├─ formatted_messages_tb.json
│  │  │  │  │  │  │  ├─ meta_tb.json
│  │  │  │  │  │  │  ├─ model_params_tb.json
│  │  │  │  │  │  │  ├─ results.json
│  │  │  │  │  │  │  ├─ results_clean_parsed.json
│  │  │  │  │  │  │  └─ tasks_tb.json
│  │  │  │  │  │  ├─ t1.5-附件分析
│  │  │  │  │  │  │  ├─ formatted_messages_bid.json
│  │  │  │  │  │  │  ├─ meta_bid.json
│  │  │  │  │  │  │  ├─ model_params_bid.json
│  │  │  │  │  │  │  ├─ results.json
│  │  │  │  │  │  │  ├─ results_clean_parsed.json
│  │  │  │  │  │  │  └─ tasks_bid.json
│  │  │  │  │  │  └─ t1.6-附件响应
│  │  │  │  │  │     ├─ formatted_messages_bid.json
│  │  │  │  │  │     ├─ meta_bid.json
│  │  │  │  │  │     ├─ model_params_bid.json
│  │  │  │  │  │     ├─ results.json
│  │  │  │  │  │     ├─ results_clean_parsed.json
│  │  │  │  │  │     └─ tasks_bid.json
│  │  │  │  │  ├─ t2-投标文件编辑格式和要求
│  │  │  │  │  │  ├─ t2.1-相关章节定位
│  │  │  │  │  │  │  ├─ formatted_messages_bid.json
│  │  │  │  │  │  │  ├─ meta_bid.json
│  │  │  │  │  │  │  ├─ model_params_bid.json
│  │  │  │  │  │  │  ├─ results.json
│  │  │  │  │  │  │  ├─ results_clean_parsed.json
│  │  │  │  │  │  │  └─ tasks_bid.json
│  │  │  │  │  │  └─ t2.2-投标文件组成
│  │  │  │  │  │     ├─ formatted_messages_bid.json
│  │  │  │  │  │     ├─ meta_bid.json
│  │  │  │  │  │     ├─ model_params_bid.json
│  │  │  │  │  │     ├─ results.json
│  │  │  │  │  │     ├─ results_clean_parsed.json
│  │  │  │  │  │     └─ tasks_bid.json
│  │  │  │  │  ├─ t3-投标人资格要求
│  │  │  │  │  │  ├─ t3.1-相关章节定位
│  │  │  │  │  │  │  ├─ formatted_messages_bid.json
│  │  │  │  │  │  │  ├─ meta_bid.json
│  │  │  │  │  │  │  ├─ model_params_bid.json
│  │  │  │  │  │  │  ├─ results.json
│  │  │  │  │  │  │  ├─ results_clean_parsed.json
│  │  │  │  │  │  │  └─ tasks_bid.json
│  │  │  │  │  │  ├─ t3.2-投标人资格要求分析
│  │  │  │  │  │  │  ├─ formatted_messages_bid.json
│  │  │  │  │  │  │  ├─ meta_bid.json
│  │  │  │  │  │  │  ├─ model_params_bid.json
│  │  │  │  │  │  │  ├─ results.json
│  │  │  │  │  │  │  └─ tasks_bid.json
│  │  │  │  │  │  ├─ t3.3-投标文件呈现
│  │  │  │  │  │  │  ├─ formatted_messages_bid.json
│  │  │  │  │  │  │  ├─ meta_bid.json
│  │  │  │  │  │  │  ├─ model_params_bid.json
│  │  │  │  │  │  │  ├─ results.json
│  │  │  │  │  │  │  ├─ results_clean_parsed.json
│  │  │  │  │  │  │  └─ tasks_bid.json
│  │  │  │  │  │  └─ t3.4-应用模板
│  │  │  │  │  └─ 招标文件
│  │  │  │  │     ├─ tender_file_extraction.json
│  │  │  │  │     ├─ tender_file_extraction_H1.json
│  │  │  │  │     ├─ tender_file_extraction_H2.json
│  │  │  │  │     ├─ tender_file_extraction_final.json
│  │  │  │  │     └─ tender_file_extraction_final_tb.json
│  │  │  │  ├─ cache_e2
│  │  │  │  │  ├─ bid_writing_positioning
│  │  │  │  │  │  ├─ formatted_messages_bid.json
│  │  │  │  │  │  ├─ meta_bid.json
│  │  │  │  │  │  ├─ model_params_bid.json
│  │  │  │  │  │  └─ tasks_bid.json
│  │  │  │  │  ├─ outline_analysis_L1
│  │  │  │  │  │  ├─ formatted_message.json
│  │  │  │  │  │  ├─ meta_l1.json
│  │  │  │  │  │  ├─ model_params_l1.json
│  │  │  │  │  │  ├─ outline_L1.md
│  │  │  │  │  │  └─ task_l1.json
│  │  │  │  │  ├─ outline_analysis_L2
│  │  │  │  │  │  ├─ formatted_message.json
│  │  │  │  │  │  ├─ meta_l2.json
│  │  │  │  │  │  ├─ model_params_l2.json
│  │  │  │  │  │  ├─ outlines_L2.json
│  │  │  │  │  │  └─ tasks_l2.json
│  │  │  │  │  ├─ outline_analysis_tb
│  │  │  │  │  │  ├─ formatted_messages_tb.json
│  │  │  │  │  │  ├─ meta_tb.json
│  │  │  │  │  │  ├─ model_params_tb.json
│  │  │  │  │  │  ├─ outlines_tb.json
│  │  │  │  │  │  └─ tasks_tb.json
│  │  │  │  │  ├─ positioning
│  │  │  │  │  ├─ tender_file_extraction.json
│  │  │  │  │  ├─ tender_file_extraction_L1.json
│  │  │  │  │  ├─ tender_file_extraction_L2.json
│  │  │  │  │  ├─ tender_file_extraction_L3.json
│  │  │  │  │  └─ tender_file_extraction_L4.json
│  │  │  │  ├─ cache_e3
│  │  │  │  ├─ django_setup.py
│  │  │  │  ├─ redis.ipynb
│  │  │  │  ├─ steps_simulation.ipynb
│  │  │  │  ├─ tiptap2.ipynb
│  │  │  │  ├─ tiptap_ClientTest.ipynb
│  │  │  │  ├─ tiptap_docxTest.ipynb
│  │  │  │  └─ tiptap_testground.ipynb
│  │  │  ├─ serializers
│  │  │  │  ├─ __init__.py
│  │  │  │  ├─ history_serializers.py
│  │  │  │  ├─ project_serializers.py
│  │  │  │  ├─ stage_serializers.py
│  │  │  │  ├─ task_docx_extraction_serializers.py
│  │  │  │  ├─ task_files_upload_serializers.py
│  │  │  │  ├─ task_outline_analysis_serializers.py
│  │  │  │  ├─ task_serializers.py
│  │  │  │  └─ user_serializers.py
│  │  │  ├─ services
│  │  │  │  ├─ LLM_server
│  │  │  │  │  ├─ LLM_task_container.py
│  │  │  │  │  ├─ LLMchain_with_redis_callback.py
│  │  │  │  │  ├─ LLMchain_with_websocket_callback.py
│  │  │  │  │  └─ _llm_data_types.py
│  │  │  │  ├─ RAG
│  │  │  │  ├─ _01_extract_tiptap_docx.py
│  │  │  │  ├─ _02_outline_analysis.py
│  │  │  │  ├─ __init__.py
│  │  │  │  ├─ agents
│  │  │  │  │  ├─ outline_expert.py
│  │  │  │  │  ├─ planning
│  │  │  │  │  │  └─ planning_agent.py
│  │  │  │  │  └─ structuring
│  │  │  │  │     ├─ add_intro_headings.py
│  │  │  │  │     ├─ analyze_l1_headings.py
│  │  │  │  │     ├─ analyze_l2_l3_heading.py
│  │  │  │  │     ├─ cache_manager.py
│  │  │  │  │     ├─ consumers.py
│  │  │  │  │     ├─ docx_extractor.py
│  │  │  │  │     ├─ outline_analyzer.py
│  │  │  │  │     ├─ state.py
│  │  │  │  │     ├─ state_manager.py
│  │  │  │  │     └─ structuring_agent.py
│  │  │  │  ├─ base.py
│  │  │  │  ├─ llm
│  │  │  │  │  ├─ llm_client.py
│  │  │  │  │  ├─ llm_models.py
│  │  │  │  │  ├─ llm_output_processor.py
│  │  │  │  │  └─ llm_service.py
│  │  │  │  ├─ pipeline.py
│  │  │  │  ├─ prompts
│  │  │  │  │  ├─ integrating
│  │  │  │  │  ├─ planning
│  │  │  │  │  ├─ reviewing
│  │  │  │  │  ├─ structuring
│  │  │  │  │  │  ├─ __init__.py
│  │  │  │  │  │  ├─ tender_outlines_L1.py
│  │  │  │  │  │  ├─ tender_outlines_L2.py
│  │  │  │  │  │  └─ tender_outlines_tables.py
│  │  │  │  │  └─ writing
│  │  │  │  ├─ task_service.py
│  │  │  │  └─ tasks_preparation
│  │  │  │     ├─ appendix_templates
│  │  │  │     │  ├─ appendix_analysis.py
│  │  │  │     │  └─ get_appendix_list.py
│  │  │  │     ├─ bid_outlines.py
│  │  │  │     ├─ bid_writing_positioning.py
│  │  │  │     ├─ bidder_qulification
│  │  │  │     │  ├─ bidding_preparation.py
│  │  │  │     │  └─ qualification_analysis.py
│  │  │  │     ├─ find_topic_context_batch.py
│  │  │  │     ├─ find_topics_context.py
│  │  │  │     └─ outline_analysis.py
│  │  │  ├─ signals
│  │  │  │  ├─ __init__.py
│  │  │  │  ├─ handle_history_track.py
│  │  │  │  ├─ handle_taskL1_initialization.py
│  │  │  │  └─ handle_task_status.py
│  │  │  ├─ tasks
│  │  │  │  ├─ __init__.py
│  │  │  │  ├─ docx_extraction_task.py
│  │  │  │  └─ outline_analysis_task.py
│  │  │  ├─ tests
│  │  │  │  └─ test_redis_manager.py
│  │  │  ├─ tests.py
│  │  │  ├─ tiptap
│  │  │  │  ├─ __init__.py
│  │  │  │  ├─ api.py
│  │  │  │  ├─ client.py
│  │  │  │  ├─ docx.py
│  │  │  │  ├─ helpers.py
│  │  │  │  ├─ temp
│  │  │  │  │  ├─ mammoth.ipynb
│  │  │  │  │  ├─ mammoth.py
│  │  │  │  │  └─ pypandoc.py
│  │  │  │  └─ utils.py
│  │  │  ├─ urls.py
│  │  │  ├─ utils
│  │  │  │  └─ redis_manager.py
│  │  │  └─ views
│  │  │     ├─ __init__.py
│  │  │     ├─ history_views.py
│  │  │     ├─ project_views.py
│  │  │     ├─ stage_views.py
│  │  │     ├─ task_docx_extraction_views.py
│  │  │     ├─ task_files_upload_views.py
│  │  │     ├─ task_outline_analysis_views.py
│  │  │     ├─ task_streaming.py
│  │  │     └─ task_views.py
│  │  └─ testground
│  │     ├─ __init__.py
│  │     ├─ admin.py
│  │     ├─ apps.py
│  │     ├─ consumers.py
│  │     ├─ migrations
│  │     │  ├─ 0001_initial.py
│  │     │  └─ __init__.py
│  │     ├─ models.py
│  │     ├─ serializers.py
│  │     ├─ tests.py
│  │     ├─ urls.py
│  │     └─ views.py
│  ├─ bidpilot_functions
│  │  ├─ doc_structurer_package
│  │  │  ├─ __init__.py
│  │  │  ├─ doc_structurer
│  │  │  │  ├─ _01_doc_node_creater.py
│  │  │  │  ├─ _02_tree_level_builder.py
│  │  │  │  ├─ _03_tree_builder.py
│  │  │  │  ├─ __init__.py
│  │  │  │  └─ doc_tree_retriever.py
│  │  │  ├─ enrich_doc_structure
│  │  │  │  ├─ _01_node_pre_screener.py
│  │  │  │  ├─ _02_LLM_analyzer.py
│  │  │  │  └─ _03_llm_header.py
│  │  │  └─ notebook
│  │  │     └─ doc_tree_pipeline.ipynb
│  │  ├─ docx_parser_package
│  │  │  ├─ __init__.py
│  │  │  ├─ docx_parser
│  │  │  │  ├─ _00_utils.py
│  │  │  │  ├─ _01_xml_loader.py
│  │  │  │  ├─ _02_xml_parser.py
│  │  │  │  ├─ _03_element_extractor.py
│  │  │  │  ├─ __init__.py
│  │  │  │  └─ pipeline.py
│  │  │  ├─ notebooks
│  │  │  │  ├─ 01_xml_loading.ipynb
│  │  │  │  ├─ 02_xml_parsing.ipynb
│  │  │  │  ├─ 03_element_extraction.ipynb
│  │  │  │  └─ pipeline.ipynb
│  │  │  └─ readme.md
│  │  └─ llm_structurer_package
│  │     ├─ __init__.py
│  │     ├─ llm_structurer
│  │     │  ├─ _01_header_pre_screener.py
│  │     │  ├─ _02_parts_creator.py
│  │     │  ├─ _03_llm_header.py
│  │     │  ├─ _04_structure_builder.py
│  │     │  ├─ _05_content_retriever.py
│  │     │  └─ __init__.py
│  │     └─ notebooks
│  │        ├─ 01_header_pre_screening.ipynb
│  │        ├─ 02_parts_creating.ipynb
│  │        ├─ 03_llm_heading.ipynb
│  │        ├─ 04_structure_building.ipynb
│  │        └─ 05_content_retrieving.ipynb
│  ├─ config
│  │  ├─ __init__.py
│  │  ├─ asgi.py
│  │  ├─ celery.py
│  │  ├─ routing.py
│  │  ├─ settings.py
│  │  ├─ urls.py
│  │  └─ wsgi.py
│  ├─ logs
│  ├─ manage.py
│  ├─ notebooks
│  │  ├─ 0_db.ipynb
│  │  ├─ 1_auth_tests.ipynb
│  │  ├─ 2_files_tests_COS.ipynb
│  │  ├─ 3_projects_tests.ipynb
│  │  ├─ 4_doc_analysis_test.ipynb
│  │  ├─ 5_1 BasicLayerTest.ipynb
│  │  ├─ 5_2 BusinessLayerTest.ipynb
│  │  ├─ django_setup.py
│  │  ├─ helpers.py
│  │  └─ uploads
│  └─ requirements.txt
├─ dev_plan.md
├─ docker
│  ├─ backend
│  │  ├─ Dockerfile
│  │  ├─ Dockerfile.prod
│  │  ├─ entrypoint.prod.sh
│  │  └─ entrypoint.sh
│  ├─ frontend
│  │  ├─ Dockerfile
│  │  └─ Dockerfile.prod
│  ├─ nginx
│  │  ├─ Dockerfile.prod
│  │  ├─ default.conf
│  │  ├─ default.prod.conf
│  │  ├─ default.test.conf
│  │  ├─ frontend.conf
│  │  └─ ssl
│  │     ├─ fullchain.pem
│  │     └─ privkey.pem
│  └─ tiptap
│     ├─ Dockerfile
│     └─ Dockerfile.prod
├─ docker-compose.prod.yml
├─ docker-compose.run.yml
├─ docker-compose.yml
├─ frontend
│  ├─ .cache
│  ├─ README.md
│  ├─ components.json
│  ├─ eslint.config.js
│  ├─ index.html
│  ├─ package.json
│  ├─ pnpm-lock.yaml
│  ├─ postcss.config.js
│  ├─ public
│  │  └─ vite.svg
│  ├─ src
│  │  ├─ _api
│  │  │  ├─ auth_api.ts
│  │  │  ├─ axios_instance.ts
│  │  │  ├─ chat_api.ts
│  │  │  ├─ files_api.ts
│  │  │  ├─ gph_captcha_api.ts
│  │  │  ├─ playground_api.ts
│  │  │  ├─ projects_api
│  │  │  │  ├─ projectHistory_api.ts
│  │  │  │  ├─ projectStages_api.ts
│  │  │  │  └─ projects_api.ts
│  │  │  ├─ sms_captcha_api.ts
│  │  │  ├─ user_api copy.ts
│  │  │  └─ user_api.ts
│  │  ├─ _hooks
│  │  │  ├─ use-mobile.tsx
│  │  │  ├─ use-toast.ts
│  │  │  ├─ useChat.ts
│  │  │  ├─ useFiles.ts
│  │  │  ├─ useProjects
│  │  │  │  ├─ useProjectStages.ts
│  │  │  │  ├─ useProjects.ts
│  │  │  │  └─ useProjectsHistory.ts
│  │  │  └─ useUnsavedChangeWarning.ts
│  │  ├─ _types
│  │  │  ├─ auth_dt_stru.ts
│  │  │  ├─ chat_dt_stru.ts
│  │  │  ├─ error_dt_stru.ts
│  │  │  ├─ files_dt_stru.ts
│  │  │  ├─ projects_dt_stru
│  │  │  │  ├─ projectHistory_interface.ts
│  │  │  │  ├─ projectStage_interface.ts
│  │  │  │  ├─ projectTasks_interface.ts
│  │  │  │  └─ projects_interface.ts
│  │  │  └─ user_dt_stru.ts
│  │  ├─ assets
│  │  │  ├─ global.scss
│  │  │  ├─ markdown.scss
│  │  │  ├─ shadcn.scss
│  │  │  ├─ tailwind.scss
│  │  │  └─ tiptap.scss
│  │  ├─ components
│  │  │  ├─ MarkdownEditor
│  │  │  │  ├─ MD_test.tsx
│  │  │  │  ├─ MD_testData.ts
│  │  │  │  ├─ MarkdownEditor.tsx
│  │  │  │  └─ preprocess_tool.ts
│  │  │  ├─ TiptapEditor
│  │  │  │  ├─ TE_test.tsx
│  │  │  │  ├─ TE_testData.ts
│  │  │  │  ├─ TableOfContents.tsx
│  │  │  │  ├─ TiptapEditor.tsx
│  │  │  │  └─ ToolBar.tsx
│  │  │  ├─ TiptapEditor_Pro
│  │  │  │  ├─ TiptapEditor_pro.tsx
│  │  │  │  └─ ToC.tsx
│  │  │  ├─ auth
│  │  │  │  ├─ login-form.tsx
│  │  │  │  ├─ login_components
│  │  │  │  │  ├─ AgreementCheckbox.tsx
│  │  │  │  │  ├─ CodeLoginForm.tsx
│  │  │  │  │  ├─ PasswordLoginForm.tsx
│  │  │  │  │  ├─ useGraphicalCaptcha.ts
│  │  │  │  │  ├─ useLoginFormState.ts
│  │  │  │  │  └─ useWeChatLogin.ts
│  │  │  │  ├─ logout.tsx
│  │  │  │  ├─ register-form.tsx
│  │  │  │  ├─ reset-password.tsx
│  │  │  │  ├─ use-captcha-countdown.ts
│  │  │  │  └─ verification-code-input.tsx
│  │  │  ├─ change_history
│  │  │  │  ├─ ChangeHistoryDetail.tsx
│  │  │  │  ├─ ChangeHistoryPage.tsx
│  │  │  │  ├─ ChangeHistoryTable.tsx
│  │  │  │  └─ ProjectHistoryButton.tsx
│  │  │  ├─ chat
│  │  │  │  ├─ ChatPannel.tsx
│  │  │  │  └─ ChatSessionList.tsx
│  │  │  ├─ files
│  │  │  │  ├─ FileHelpers.ts
│  │  │  │  ├─ FilePreview
│  │  │  │  │  ├─ DocxPreview.tsx
│  │  │  │  │  ├─ FilePreview.tsx
│  │  │  │  │  └─ PDFPreview.tsx
│  │  │  │  ├─ FilePreviewDialog.tsx
│  │  │  │  ├─ FileTable.tsx
│  │  │  │  ├─ FileUploadButton.tsx
│  │  │  │  └─ _FileManager.tsx
│  │  │  ├─ layout
│  │  │  │  ├─ app-sidebar.tsx
│  │  │  │  ├─ nav-projects.tsx
│  │  │  │  ├─ nav-user.tsx
│  │  │  │  └─ team-switcher.tsx
│  │  │  ├─ projects
│  │  │  │  ├─ BidTasks
│  │  │  │  ├─ Project
│  │  │  │  │  ├─ _01_ProjectCreate.tsx
│  │  │  │  │  ├─ _02_ProjectsList.tsx
│  │  │  │  │  ├─ _03_ProjectsFilter.tsx
│  │  │  │  │  └─ _ProjectManager.tsx
│  │  │  │  ├─ ProjectLayout
│  │  │  │  │  ├─ ContentArea.tsx
│  │  │  │  │  ├─ DocumentDrawer.tsx
│  │  │  │  │  ├─ ProjectLayout.tsx
│  │  │  │  │  ├─ ProjectNavigation.tsx
│  │  │  │  │  ├─ ProjectStatusAlert.tsx
│  │  │  │  │  ├─ ResizeDivider.tsx
│  │  │  │  │  └─ SplitLayout.tsx
│  │  │  │  ├─ Task
│  │  │  │  │  ├─ AnalysisPanel
│  │  │  │  │  │  ├─ AnalysisPanel.tsx
│  │  │  │  │  │  ├─ test.tsx
│  │  │  │  │  │  └─ testData.ts
│  │  │  │  │  ├─ CompletionPanel
│  │  │  │  │  │  └─ CompletionPanel.tsx
│  │  │  │  │  ├─ ConfigurationPanel
│  │  │  │  │  │  ├─ ConfigurationPanel.tsx
│  │  │  │  │  │  ├─ test.tsx
│  │  │  │  │  │  └─ testData.ts
│  │  │  │  │  ├─ ConfigurationPreview
│  │  │  │  │  │  └─ ConfigurationPreview.tsx
│  │  │  │  │  ├─ ResultPreview
│  │  │  │  │  │  └─ ResultPreview.tsx
│  │  │  │  │  ├─ ReviewPanel
│  │  │  │  │  │  ├─ ReviewPanel.tsx
│  │  │  │  │  │  ├─ test.tsx
│  │  │  │  │  │  └─ testData.ts
│  │  │  │  │  ├─ TaskContainer.tsx
│  │  │  │  │  ├─ hook&APIs.tsx
│  │  │  │  │  │  ├─ streamingApi.ts
│  │  │  │  │  │  ├─ tasksApi.ts
│  │  │  │  │  │  ├─ useStreaming.ts
│  │  │  │  │  │  └─ useTasks.ts
│  │  │  │  │  └─ shared
│  │  │  │  │     └─ StatusBar.tsx
│  │  │  │  └─ TenderAnalysis
│  │  │  │     ├─ DocxExtractionTask
│  │  │  │     │  ├─ DocxExtractionTask.tsx
│  │  │  │     │  ├─ taskDocxExtraction_api.ts
│  │  │  │     │  └─ useTaskDocxExtraction.ts
│  │  │  │     ├─ OutlineAnalysisTask
│  │  │  │     │  ├─ OutlineAnalysisStreamingView.tsx
│  │  │  │     │  ├─ shared
│  │  │  │     │  │  ├─ MarkdownStreamingRenderer.tsx
│  │  │  │     │  │  ├─ MarkdownViewer.tsx
│  │  │  │     │  │  ├─ TiptapEditor_lite.tsx
│  │  │  │     │  │  └─ TiptapEditor_lite2.tsx
│  │  │  │     │  ├─ taskOutlineAnalysis_api.ts
│  │  │  │     │  └─ useTaskOutlineAnalysis.ts
│  │  │  │     ├─ TenderAnalysisPage
│  │  │  │     │  ├─ TaskComponentMap.tsx
│  │  │  │     │  └─ TenderAnalysisPage.tsx
│  │  │  │     ├─ TenderAnalysisPage.tsx
│  │  │  │     └─ TenderFileUpload
│  │  │  │        ├─ TenderFileupload.tsx
│  │  │  │        ├─ taskUploadFile_api.ts
│  │  │  │        └─ useTaskUploadFile.ts
│  │  │  └─ ui
│  │  │     ├─ accordion.tsx
│  │  │     ├─ alert-dialog.tsx
│  │  │     ├─ alert.tsx
│  │  │     ├─ aspect-ratio.tsx
│  │  │     ├─ avatar.tsx
│  │  │     ├─ badge.tsx
│  │  │     ├─ breadcrumb.tsx
│  │  │     ├─ button.tsx
│  │  │     ├─ card.tsx
│  │  │     ├─ checkbox.tsx
│  │  │     ├─ collapsible.tsx
│  │  │     ├─ dialog.tsx
│  │  │     ├─ drawer.tsx
│  │  │     ├─ dropdown-menu.tsx
│  │  │     ├─ input.tsx
│  │  │     ├─ label.tsx
│  │  │     ├─ progress.tsx
│  │  │     ├─ resizable.tsx
│  │  │     ├─ scroll-area.tsx
│  │  │     ├─ select.tsx
│  │  │     ├─ separator.tsx
│  │  │     ├─ sheet.tsx
│  │  │     ├─ sidebar.tsx
│  │  │     ├─ skeleton.tsx
│  │  │     ├─ table.tsx
│  │  │     ├─ tabs.tsx
│  │  │     ├─ textarea.tsx
│  │  │     ├─ toast.tsx
│  │  │     ├─ toaster.tsx
│  │  │     └─ tooltip.tsx
│  │  ├─ contexts
│  │  │  ├─ ConnectionContext.tsx
│  │  │  └─ auth-context.tsx
│  │  ├─ lib
│  │  │  └─ utils.ts
│  │  ├─ main.tsx
│  │  ├─ playground
│  │  │  ├─ MarkdownViewer
│  │  │  └─ TiptapwithAPI
│  │  │     ├─ TiptapEditor.tsx
│  │  │     ├─ TiptapPage.tsx
│  │  │     ├─ tiptap_api.ts
│  │  │     └─ useTiptap.ts
│  │  ├─ routeTree.gen.ts
│  │  ├─ routes
│  │  │  ├─ __root.tsx
│  │  │  ├─ about.lazy.tsx
│  │  │  ├─ auth
│  │  │  │  ├─ forgot-password.tsx
│  │  │  │  ├─ login.tsx
│  │  │  │  ├─ privacy-policy.tsx
│  │  │  │  ├─ register.tsx
│  │  │  │  └─ service-term.tsx
│  │  │  ├─ chat.$sessionId.tsx
│  │  │  ├─ chat.tsx
│  │  │  ├─ company.lazy.tsx
│  │  │  ├─ files_manager.lazy.tsx
│  │  │  ├─ index.lazy.tsx
│  │  │  ├─ playground
│  │  │  │  ├─ _layout.tsx
│  │  │  │  ├─ index.tsx
│  │  │  │  ├─ markdown_editor.tsx
│  │  │  │  ├─ task.tsx
│  │  │  │  └─ tiptap_editor.tsx
│  │  │  ├─ projects
│  │  │  │  ├─ $projectId
│  │  │  │  │  ├─ bid-writing.tsx
│  │  │  │  │  ├─ history
│  │  │  │  │  │  ├─ $historyId.tsx
│  │  │  │  │  │  ├─ index.tsx
│  │  │  │  │  │  ├─ project
│  │  │  │  │  │  │  └─ $historyId.tsx
│  │  │  │  │  │  ├─ stage
│  │  │  │  │  │  │  └─ $historyId.tsx
│  │  │  │  │  │  └─ task
│  │  │  │  │  │     └─ $historyId.tsx
│  │  │  │  │  ├─ index.tsx
│  │  │  │  │  └─ tender-analysis.tsx
│  │  │  │  ├─ $projectId.tsx
│  │  │  │  └─ index.tsx
│  │  │  ├─ projects_manager.lazy.tsx
│  │  │  └─ testground.tsx
│  │  └─ vite-env.d.ts
│  ├─ tailwind.config.js
│  ├─ tsconfig.app.json
│  ├─ tsconfig.json
│  ├─ tsconfig.node.json
│  └─ vite.config.ts
├─ json-server
│  ├─ db.json
│  ├─ dist
│  │  ├─ config.js
│  │  ├─ middleware
│  │  │  ├─ auth copy.js
│  │  │  ├─ auth.js
│  │  │  └─ rate-limit.js
│  │  ├─ server copy.js
│  │  ├─ server.js
│  │  ├─ services
│  │  │  ├─ sms.js
│  │  │  └─ verification.js
│  │  └─ utils
│  │     └─ client.js
│  ├─ generate-hash.js
│  ├─ package.json
│  ├─ pnpm-lock.yaml
│  ├─ src
│  │  ├─ config.ts
│  │  ├─ middleware
│  │  │  ├─ auth copy.ts
│  │  │  ├─ auth.ts
│  │  │  ├─ auth_copy.js
│  │  │  └─ rate-limit.ts
│  │  ├─ server copy.js
│  │  ├─ server copy.ts
│  │  ├─ server.ts
│  │  ├─ services
│  │  │  ├─ sms.ts
│  │  │  └─ verification.ts
│  │  ├─ types
│  │  │  └─ tencentcloud-sdk-nodejs.d.ts
│  │  └─ utils
│  │     └─ client.ts
│  └─ tsconfig.json
├─ notebook
│  └─ python.ipynb
├─ projects_api_mapping.md
├─ pull-images.sh
├─ push-images.sh
├─ run-containers.sh
├─ test.html
├─ tiptap-service
│  ├─ .cache
│  ├─ editor-config.js
│  ├─ markdown-utils.js
│  ├─ package.json
│  ├─ pnpm-lock.yaml
│  └─ server.js
└─ upload-server
   ├─ package.json
   ├─ pnpm-lock.yaml
   ├─ server.js
   └─ uploads
      ├─ 1737001873074-138005162-case11-测试树结构.docx
      ├─ 1737031383905-616495437-case7_投标人须知_纯图版.pdf
      ├─ 1737031386811-20712435-case5_北京铁运投标人须知.docx
      ├─ 1737483651218-763456917-上海市一证通用法人数字证书申请表（企业）0727.pdf
      └─ 1737523326753-280658073-上海市一证通用法人数字证书申请表（企业）0727.pdf

```
```
BidPilot_new
├─ .dockerignore
├─ .editorconfig
├─ README.MD
├─ README.md
├─ backend
│  ├─ README.MD
│  ├─ apps
│  │  ├─ __init__.py
│  │  ├─ _tools
│  │  │  ├─ LLM_services
│  │  │  │  ├─ _Template.py
│  │  │  │  ├─ _batch_llm_services.py
│  │  │  │  ├─ _generic_llm_services.py
│  │  │  │  ├─ _llm_data_types.py
│  │  │  │  ├─ llm_service.py
│  │  │  │  ├─ notebook
│  │  │  │  │  ├─ LLMtest.ipynb
│  │  │  │  │  └─ django_setup.py
│  │  │  │  └─ temp_old
│  │  │  │     ├─ _01_outline_llm_analyzer.py
│  │  │  │     └─ _02_docx_get_more_titles.py
│  │  │  ├─ doc_structurer
│  │  │  │  ├─ _01_doc_node_creater.py
│  │  │  │  ├─ _02_tree_level_builder.py
│  │  │  │  ├─ _03_tree_builder.py
│  │  │  │  ├─ __init__.py
│  │  │  │  ├─ doc_tree_retriever.py
│  │  │  │  └─ notebook
│  │  │  │     └─ doc_tree_pipeline.ipynb
│  │  │  └─ docx_parser
│  │  │     ├─ _00_utils.py
│  │  │     ├─ _01_xml_loader.py
│  │  │     ├─ _02_xml_parser.py
│  │  │     ├─ _03_element_extractor.py
│  │  │     ├─ _04_tiptap_converter.py
│  │  │     ├─ __init__.py
│  │  │     ├─ notebooks
│  │  │     │  ├─ 01_xml_loading.ipynb
│  │  │     │  ├─ 02_xml_parsing.ipynb
│  │  │     │  ├─ 03_element_extraction.ipynb
│  │  │     │  ├─ 04_tiptap_converter.ipynb
│  │  │     │  ├─ django_setup.py
│  │  │     │  └─ pipeline.ipynb
│  │  │     └─ pipeline.py
│  │  ├─ authentication
│  │  │  ├─ __init__.py
│  │  │  ├─ admin.py
│  │  │  ├─ apps.py
│  │  │  ├─ middlewares.py
│  │  │  ├─ migrations
│  │  │  │  ├─ 0001_initial.py
│  │  │  │  └─ __init__.py
│  │  │  ├─ models.py
│  │  │  ├─ serializers.py
│  │  │  ├─ services.py
│  │  │  ├─ sms_service.py
│  │  │  ├─ tests.py
│  │  │  ├─ urls.py
│  │  │  └─ views.py
│  │  ├─ chat
│  │  │  ├─ __init__.py
│  │  │  ├─ admin.py
│  │  │  ├─ apps.py
│  │  │  ├─ context_providers.py
│  │  │  ├─ migrations
│  │  │  │  ├─ 0001_initial.py
│  │  │  │  └─ __init__.py
│  │  │  ├─ models.py
│  │  │  ├─ pipelines.py
│  │  │  ├─ serializers.py
│  │  │  ├─ services.py
│  │  │  ├─ tasks.py
│  │  │  ├─ tests.py
│  │  │  ├─ urls.py
│  │  │  └─ views.py
│  │  ├─ doc_analysis
│  │  │  ├─ LLM_services
│  │  │  │  ├─ _01_outline_llm_analyzer.py
│  │  │  │  ├─ _02_docx_get_more_titles.py
│  │  │  │  ├─ _Template.py
│  │  │  │  ├─ _batch_llm_services.py
│  │  │  │  ├─ _generic_llm_services.py
│  │  │  │  ├─ _llm_data_types.py
│  │  │  │  ├─ llm_service.py
│  │  │  │  └─ notebook
│  │  │  │     ├─ LLMtest.ipynb
│  │  │  │     └─ django_setup.py
│  │  │  ├─ __init__.py
│  │  │  ├─ admin.py
│  │  │  ├─ apps.py
│  │  │  ├─ doc_structurer
│  │  │  │  ├─ _01_doc_node_creater.py
│  │  │  │  ├─ _02_tree_level_builder.py
│  │  │  │  ├─ _03_tree_builder.py
│  │  │  │  ├─ __init__.py
│  │  │  │  ├─ doc_tree_retriever.py
│  │  │  │  └─ notebook
│  │  │  │     └─ doc_tree_pipeline.ipynb
│  │  │  ├─ docx_parser
│  │  │  │  ├─ _00_utils.py
│  │  │  │  ├─ _01_xml_loader.py
│  │  │  │  ├─ _02_xml_parser.py
│  │  │  │  ├─ _03_element_extractor.py
│  │  │  │  ├─ __init__.py
│  │  │  │  ├─ notebooks
│  │  │  │  │  ├─ 01_xml_loading.ipynb
│  │  │  │  │  ├─ 02_xml_parsing.ipynb
│  │  │  │  │  ├─ 03_element_extraction.ipynb
│  │  │  │  │  └─ pipeline.ipynb
│  │  │  │  └─ pipeline.py
│  │  │  ├─ migrations
│  │  │  │  ├─ 0001_initial.py
│  │  │  │  └─ __init__.py
│  │  │  ├─ models.py
│  │  │  ├─ pipeline
│  │  │  │  ├─ __init__.py
│  │  │  │  ├─ base.py
│  │  │  │  ├─ pipeline.py
│  │  │  │  └─ types.py
│  │  │  ├─ serializers.py
│  │  │  ├─ steps
│  │  │  │  ├─ _01_extract_docx_elements.py
│  │  │  │  ├─ _02_outline_analysis.py
│  │  │  │  ├─ _03_outline_improvement.py
│  │  │  │  ├─ _04_build_docxtree.py
│  │  │  │  ├─ _05_more_subtitles.py
│  │  │  │  ├─ __init__.py
│  │  │  │  ├─ _template.py
│  │  │  │  ├─ analysis_requests.py
│  │  │  │  ├─ notebooks
│  │  │  │  │  ├─ django_setup.py
│  │  │  │  │  └─ steps_simulation.ipynb
│  │  │  │  └─ pipelines copy.py
│  │  │  ├─ tests.py
│  │  │  ├─ urls.py
│  │  │  └─ views.py
│  │  ├─ files
│  │  │  ├─ __init__.py
│  │  │  ├─ admin.py
│  │  │  ├─ apps.py
│  │  │  ├─ migrations
│  │  │  │  ├─ 0001_initial.py
│  │  │  │  └─ __init__.py
│  │  │  ├─ models.py
│  │  │  ├─ serializers.py
│  │  │  ├─ storage.py
│  │  │  ├─ tests.py
│  │  │  ├─ urls.py
│  │  │  └─ views.py
│  │  ├─ projects
│  │  │  ├─ __init__.py
│  │  │  ├─ _deprecated
│  │  │  │  ├─ llm_task_analysis.py
│  │  │  │  ├─ models_deprecated.py
│  │  │  │  ├─ services_deprecated
│  │  │  │  │  ├─ 0_old_process
│  │  │  │  │  │  ├─ _01_extract_docx_elements.py
│  │  │  │  │  │  ├─ _02_outline_analysis.py
│  │  │  │  │  │  ├─ _03_outline_improvement.py
│  │  │  │  │  │  ├─ _04_build_docxtree.py
│  │  │  │  │  │  ├─ _05_more_subtitles.py
│  │  │  │  │  │  └─ _template.py
│  │  │  │  │  └─ types
│  │  │  │  │     ├─ __init__.py
│  │  │  │  │     ├─ base_TypesAndHelpers.py
│  │  │  │  │     ├─ type_DocxElements.py
│  │  │  │  │     ├─ type_DocxTree.py
│  │  │  │  │     ├─ type_DocxTreeMoreTitles.py
│  │  │  │  │     ├─ type_ImprovedDocxElements.py
│  │  │  │  │     ├─ type_OutlineAnalysisResult.py
│  │  │  │  │     ├─ type_TiptapDocx.py
│  │  │  │  │     ├─ type_tiptapHelpers.py
│  │  │  │  │     └─ types.py
│  │  │  │  ├─ signals_deprecated.py
│  │  │  │  └─ tasks_deprecated.py
│  │  │  ├─ admin.py
│  │  │  ├─ apps.py
│  │  │  ├─ consumers
│  │  │  │  └─ consumers.py
│  │  │  ├─ middlewares.py
│  │  │  ├─ migrations
│  │  │  │  ├─ 0001_initial.py
│  │  │  │  ├─ 0002_remove_task_prompt_remove_task_related_company_info_and_more.py
│  │  │  │  ├─ 0003_rename_tender_file_extration_projectstage_tender_file_extraction.py
│  │  │  │  ├─ 0004_remove_projectstage_tender_file_extraction_and_more.py
│  │  │  │  ├─ 0005_task_context_tokens_task_final_result_description_and_more.py
│  │  │  │  ├─ 0006_project_outline_l1_project_outline_l2_and_more.py
│  │  │  │  ├─ 0007_project_index_path_map_l1_project_index_path_map_l2_and_more.py
│  │  │  │  ├─ 0008_project_tender_file_extraction_l1_and_more.py
│  │  │  │  ├─ 0009_task_task_level.py
│  │  │  │  ├─ 0010_structuringagentdocument_structuringagentstate.py
│  │  │  │  └─ __init__.py
│  │  │  ├─ models
│  │  │  │  ├─ History.py
│  │  │  │  ├─ Project.py
│  │  │  │  ├─ ProjectStage.py
│  │  │  │  ├─ Structuring.py
│  │  │  │  ├─ Task.py
│  │  │  │  ├─ Template.py
│  │  │  │  └─ __init__.py
│  │  │  ├─ notebook
│  │  │  │  ├─ 0_db.ipynb
│  │  │  │  ├─ LLM_Outline&Positioning.ipynb
│  │  │  │  ├─ LLM_Outline&Positioning_e1.ipynb
│  │  │  │  ├─ LLM_Outline&Positioning_e2.ipynb
│  │  │  │  ├─ LLM_Outline&Positioning_e3.ipynb
│  │  │  │  ├─ LLM_task_container.ipynb
│  │  │  │  ├─ NotebookCacheManager.py
│  │  │  │  ├─ cache_e1
│  │  │  │  │  ├─ t1-招标文件大纲分析
│  │  │  │  │  │  ├─ t1.1-H1层级标题分析
│  │  │  │  │  │  │  ├─ clean_parsed_results.json
│  │  │  │  │  │  │  ├─ formatted_prompts.json
│  │  │  │  │  │  │  ├─ meta.json
│  │  │  │  │  │  │  ├─ prompt_config.json
│  │  │  │  │  │  │  ├─ raw_results.json
│  │  │  │  │  │  │  └─ task_inputs.json
│  │  │  │  │  │  ├─ t1.2-H2-3层级标题分析
│  │  │  │  │  │  │  ├─ clean_parsed_results.json
│  │  │  │  │  │  │  ├─ formatted_prompts.json
│  │  │  │  │  │  │  ├─ meta.json
│  │  │  │  │  │  │  ├─ prompt_config.json
│  │  │  │  │  │  │  ├─ raw_results.json
│  │  │  │  │  │  │  └─ task_inputs.json
│  │  │  │  │  │  ├─ t1.3-添加前言
│  │  │  │  │  │  ├─ t1.4-增强标题分析
│  │  │  │  │  │  │  ├─ formatted_messages_tb.json
│  │  │  │  │  │  │  ├─ meta_tb.json
│  │  │  │  │  │  │  ├─ model_params_tb.json
│  │  │  │  │  │  │  ├─ results.json
│  │  │  │  │  │  │  ├─ results_clean_parsed.json
│  │  │  │  │  │  │  └─ tasks_tb.json
│  │  │  │  │  │  ├─ t1.5-附件分析
│  │  │  │  │  │  │  ├─ formatted_messages_bid.json
│  │  │  │  │  │  │  ├─ meta_bid.json
│  │  │  │  │  │  │  ├─ model_params_bid.json
│  │  │  │  │  │  │  ├─ results.json
│  │  │  │  │  │  │  ├─ results_clean_parsed.json
│  │  │  │  │  │  │  └─ tasks_bid.json
│  │  │  │  │  │  └─ t1.6-附件响应
│  │  │  │  │  │     ├─ formatted_messages_bid.json
│  │  │  │  │  │     ├─ meta_bid.json
│  │  │  │  │  │     ├─ model_params_bid.json
│  │  │  │  │  │     ├─ results.json
│  │  │  │  │  │     ├─ results_clean_parsed.json
│  │  │  │  │  │     └─ tasks_bid.json
│  │  │  │  │  ├─ t2-投标文件编辑格式和要求
│  │  │  │  │  │  ├─ t2.1-相关章节定位
│  │  │  │  │  │  │  ├─ formatted_messages_bid.json
│  │  │  │  │  │  │  ├─ meta_bid.json
│  │  │  │  │  │  │  ├─ model_params_bid.json
│  │  │  │  │  │  │  ├─ results.json
│  │  │  │  │  │  │  ├─ results_clean_parsed.json
│  │  │  │  │  │  │  └─ tasks_bid.json
│  │  │  │  │  │  └─ t2.2-投标文件组成
│  │  │  │  │  │     ├─ formatted_messages_bid.json
│  │  │  │  │  │     ├─ meta_bid.json
│  │  │  │  │  │     ├─ model_params_bid.json
│  │  │  │  │  │     ├─ results.json
│  │  │  │  │  │     ├─ results_clean_parsed.json
│  │  │  │  │  │     └─ tasks_bid.json
│  │  │  │  │  ├─ t3-投标人资格要求
│  │  │  │  │  │  ├─ t3.1-相关章节定位
│  │  │  │  │  │  │  ├─ formatted_messages_bid.json
│  │  │  │  │  │  │  ├─ meta_bid.json
│  │  │  │  │  │  │  ├─ model_params_bid.json
│  │  │  │  │  │  │  ├─ results.json
│  │  │  │  │  │  │  ├─ results_clean_parsed.json
│  │  │  │  │  │  │  └─ tasks_bid.json
│  │  │  │  │  │  ├─ t3.2-投标人资格要求分析
│  │  │  │  │  │  │  ├─ formatted_messages_bid.json
│  │  │  │  │  │  │  ├─ meta_bid.json
│  │  │  │  │  │  │  ├─ model_params_bid.json
│  │  │  │  │  │  │  ├─ results.json
│  │  │  │  │  │  │  └─ tasks_bid.json
│  │  │  │  │  │  ├─ t3.3-投标文件呈现
│  │  │  │  │  │  │  ├─ formatted_messages_bid.json
│  │  │  │  │  │  │  ├─ meta_bid.json
│  │  │  │  │  │  │  ├─ model_params_bid.json
│  │  │  │  │  │  │  ├─ results.json
│  │  │  │  │  │  │  ├─ results_clean_parsed.json
│  │  │  │  │  │  │  └─ tasks_bid.json
│  │  │  │  │  │  └─ t3.4-应用模板
│  │  │  │  │  └─ 招标文件
│  │  │  │  │     ├─ tender_file_extraction.json
│  │  │  │  │     ├─ tender_file_extraction_H1.json
│  │  │  │  │     ├─ tender_file_extraction_H2.json
│  │  │  │  │     ├─ tender_file_extraction_final.json
│  │  │  │  │     └─ tender_file_extraction_final_tb.json
│  │  │  │  ├─ cache_e2
│  │  │  │  │  ├─ bid_writing_positioning
│  │  │  │  │  │  ├─ formatted_messages_bid.json
│  │  │  │  │  │  ├─ meta_bid.json
│  │  │  │  │  │  ├─ model_params_bid.json
│  │  │  │  │  │  └─ tasks_bid.json
│  │  │  │  │  ├─ outline_analysis_L1
│  │  │  │  │  │  ├─ formatted_message.json
│  │  │  │  │  │  ├─ meta_l1.json
│  │  │  │  │  │  ├─ model_params_l1.json
│  │  │  │  │  │  ├─ outline_L1.md
│  │  │  │  │  │  └─ task_l1.json
│  │  │  │  │  ├─ outline_analysis_L2
│  │  │  │  │  │  ├─ formatted_message.json
│  │  │  │  │  │  ├─ meta_l2.json
│  │  │  │  │  │  ├─ model_params_l2.json
│  │  │  │  │  │  ├─ outlines_L2.json
│  │  │  │  │  │  └─ tasks_l2.json
│  │  │  │  │  ├─ outline_analysis_tb
│  │  │  │  │  │  ├─ formatted_messages_tb.json
│  │  │  │  │  │  ├─ meta_tb.json
│  │  │  │  │  │  ├─ model_params_tb.json
│  │  │  │  │  │  ├─ outlines_tb.json
│  │  │  │  │  │  └─ tasks_tb.json
│  │  │  │  │  ├─ positioning
│  │  │  │  │  ├─ tender_file_extraction.json
│  │  │  │  │  ├─ tender_file_extraction_L1.json
│  │  │  │  │  ├─ tender_file_extraction_L2.json
│  │  │  │  │  ├─ tender_file_extraction_L3.json
│  │  │  │  │  └─ tender_file_extraction_L4.json
│  │  │  │  ├─ cache_e3
│  │  │  │  ├─ django_setup.py
│  │  │  │  ├─ redis.ipynb
│  │  │  │  ├─ steps_simulation.ipynb
│  │  │  │  ├─ tiptap2.ipynb
│  │  │  │  ├─ tiptap_ClientTest.ipynb
│  │  │  │  ├─ tiptap_docxTest.ipynb
│  │  │  │  └─ tiptap_testground.ipynb
│  │  │  ├─ serializers
│  │  │  │  ├─ __init__.py
│  │  │  │  ├─ history_serializers.py
│  │  │  │  ├─ project_serializers.py
│  │  │  │  ├─ stage_serializers.py
│  │  │  │  ├─ task_docx_extraction_serializers.py
│  │  │  │  ├─ task_files_upload_serializers.py
│  │  │  │  ├─ task_outline_analysis_serializers.py
│  │  │  │  ├─ task_serializers.py
│  │  │  │  └─ user_serializers.py
│  │  │  ├─ services
│  │  │  │  ├─ LLM_server
│  │  │  │  │  ├─ LLM_task_container.py
│  │  │  │  │  ├─ LLMchain_with_redis_callback.py
│  │  │  │  │  ├─ LLMchain_with_websocket_callback.py
│  │  │  │  │  └─ _llm_data_types.py
│  │  │  │  ├─ RAG
│  │  │  │  ├─ _01_extract_tiptap_docx.py
│  │  │  │  ├─ _02_outline_analysis.py
│  │  │  │  ├─ __init__.py
│  │  │  │  ├─ agents
│  │  │  │  │  ├─ outline_expert.py
│  │  │  │  │  ├─ planning
│  │  │  │  │  │  └─ planning_agent.py
│  │  │  │  │  └─ structuring
│  │  │  │  │     ├─ add_intro_headings.py
│  │  │  │  │     ├─ analyze_l1_headings.py
│  │  │  │  │     ├─ analyze_l2_l3_heading.py
│  │  │  │  │     ├─ cache_manager.py
│  │  │  │  │     ├─ consumers.py
│  │  │  │  │     ├─ docx_extractor.py
│  │  │  │  │     ├─ outline_analyzer.py
│  │  │  │  │     ├─ state.py
│  │  │  │  │     ├─ state_manager.py
│  │  │  │  │     └─ structuring_agent.py
│  │  │  │  ├─ base.py
│  │  │  │  ├─ llm
│  │  │  │  │  ├─ llm_client.py
│  │  │  │  │  ├─ llm_models.py
│  │  │  │  │  ├─ llm_output_processor.py
│  │  │  │  │  └─ llm_service.py
│  │  │  │  ├─ pipeline.py
│  │  │  │  ├─ prompts
│  │  │  │  │  ├─ integrating
│  │  │  │  │  ├─ planning
│  │  │  │  │  ├─ reviewing
│  │  │  │  │  ├─ structuring
│  │  │  │  │  │  ├─ __init__.py
│  │  │  │  │  │  ├─ tender_outlines_L1.py
│  │  │  │  │  │  ├─ tender_outlines_L2.py
│  │  │  │  │  │  └─ tender_outlines_tables.py
│  │  │  │  │  └─ writing
│  │  │  │  ├─ task_service.py
│  │  │  │  └─ tasks_preparation
│  │  │  │     ├─ appendix_templates
│  │  │  │     │  ├─ appendix_analysis.py
│  │  │  │     │  └─ get_appendix_list.py
│  │  │  │     ├─ bid_outlines.py
│  │  │  │     ├─ bid_writing_positioning.py
│  │  │  │     ├─ bidder_qulification
│  │  │  │     │  ├─ bidding_preparation.py
│  │  │  │     │  └─ qualification_analysis.py
│  │  │  │     ├─ find_topic_context_batch.py
│  │  │  │     ├─ find_topics_context.py
│  │  │  │     └─ outline_analysis.py
│  │  │  ├─ signals
│  │  │  │  ├─ __init__.py
│  │  │  │  ├─ handle_history_track.py
│  │  │  │  ├─ handle_taskL1_initialization.py
│  │  │  │  └─ handle_task_status.py
│  │  │  ├─ tasks
│  │  │  │  ├─ __init__.py
│  │  │  │  ├─ docx_extraction_task.py
│  │  │  │  └─ outline_analysis_task.py
│  │  │  ├─ tests
│  │  │  │  └─ test_redis_manager.py
│  │  │  ├─ tests.py
│  │  │  ├─ tiptap
│  │  │  │  ├─ __init__.py
│  │  │  │  ├─ api.py
│  │  │  │  ├─ client.py
│  │  │  │  ├─ docx.py
│  │  │  │  ├─ helpers.py
│  │  │  │  ├─ temp
│  │  │  │  │  ├─ mammoth.ipynb
│  │  │  │  │  ├─ mammoth.py
│  │  │  │  │  └─ pypandoc.py
│  │  │  │  └─ utils.py
│  │  │  ├─ urls.py
│  │  │  ├─ utils
│  │  │  │  └─ redis_manager.py
│  │  │  └─ views
│  │  │     ├─ __init__.py
│  │  │     ├─ history_views.py
│  │  │     ├─ project_views.py
│  │  │     ├─ stage_views.py
│  │  │     ├─ task_docx_extraction_views.py
│  │  │     ├─ task_files_upload_views.py
│  │  │     ├─ task_outline_analysis_views.py
│  │  │     ├─ task_streaming.py
│  │  │     └─ task_views.py
│  │  └─ testground
│  │     ├─ __init__.py
│  │     ├─ admin.py
│  │     ├─ apps.py
│  │     ├─ consumers.py
│  │     ├─ migrations
│  │     │  ├─ 0001_initial.py
│  │     │  └─ __init__.py
│  │     ├─ models.py
│  │     ├─ serializers.py
│  │     ├─ tests.py
│  │     ├─ urls.py
│  │     └─ views.py
│  ├─ bidpilot_functions
│  │  ├─ doc_structurer_package
│  │  │  ├─ __init__.py
│  │  │  ├─ doc_structurer
│  │  │  │  ├─ _01_doc_node_creater.py
│  │  │  │  ├─ _02_tree_level_builder.py
│  │  │  │  ├─ _03_tree_builder.py
│  │  │  │  ├─ __init__.py
│  │  │  │  └─ doc_tree_retriever.py
│  │  │  ├─ enrich_doc_structure
│  │  │  │  ├─ _01_node_pre_screener.py
│  │  │  │  ├─ _02_LLM_analyzer.py
│  │  │  │  └─ _03_llm_header.py
│  │  │  └─ notebook
│  │  │     └─ doc_tree_pipeline.ipynb
│  │  ├─ docx_parser_package
│  │  │  ├─ __init__.py
│  │  │  ├─ docx_parser
│  │  │  │  ├─ _00_utils.py
│  │  │  │  ├─ _01_xml_loader.py
│  │  │  │  ├─ _02_xml_parser.py
│  │  │  │  ├─ _03_element_extractor.py
│  │  │  │  ├─ __init__.py
│  │  │  │  └─ pipeline.py
│  │  │  ├─ notebooks
│  │  │  │  ├─ 01_xml_loading.ipynb
│  │  │  │  ├─ 02_xml_parsing.ipynb
│  │  │  │  ├─ 03_element_extraction.ipynb
│  │  │  │  └─ pipeline.ipynb
│  │  │  └─ readme.md
│  │  └─ llm_structurer_package
│  │     ├─ __init__.py
│  │     ├─ llm_structurer
│  │     │  ├─ _01_header_pre_screener.py
│  │     │  ├─ _02_parts_creator.py
│  │     │  ├─ _03_llm_header.py
│  │     │  ├─ _04_structure_builder.py
│  │     │  ├─ _05_content_retriever.py
│  │     │  └─ __init__.py
│  │     └─ notebooks
│  │        ├─ 01_header_pre_screening.ipynb
│  │        ├─ 02_parts_creating.ipynb
│  │        ├─ 03_llm_heading.ipynb
│  │        ├─ 04_structure_building.ipynb
│  │        └─ 05_content_retrieving.ipynb
│  ├─ config
│  │  ├─ __init__.py
│  │  ├─ asgi.py
│  │  ├─ celery.py
│  │  ├─ routing.py
│  │  ├─ settings.py
│  │  ├─ urls.py
│  │  └─ wsgi.py
│  ├─ logs
│  ├─ manage.py
│  ├─ notebooks
│  │  ├─ 0_db.ipynb
│  │  ├─ 1_auth_tests.ipynb
│  │  ├─ 2_files_tests_COS.ipynb
│  │  ├─ 3_projects_tests.ipynb
│  │  ├─ 4_doc_analysis_test.ipynb
│  │  ├─ 5_1 BasicLayerTest.ipynb
│  │  ├─ 5_2 BusinessLayerTest.ipynb
│  │  ├─ django_setup.py
│  │  ├─ helpers.py
│  │  └─ uploads
│  └─ requirements.txt
├─ dev_plan.md
├─ docker
│  ├─ backend
│  │  ├─ Dockerfile
│  │  ├─ Dockerfile.prod
│  │  ├─ entrypoint.prod.sh
│  │  └─ entrypoint.sh
│  ├─ frontend
│  │  ├─ Dockerfile
│  │  └─ Dockerfile.prod
│  ├─ nginx
│  │  ├─ Dockerfile.prod
│  │  ├─ default.conf
│  │  ├─ default.prod.conf
│  │  ├─ default.test.conf
│  │  ├─ frontend.conf
│  │  └─ ssl
│  │     ├─ fullchain.pem
│  │     └─ privkey.pem
│  └─ tiptap
│     ├─ Dockerfile
│     └─ Dockerfile.prod
├─ docker-compose.prod.yml
├─ docker-compose.run.yml
├─ docker-compose.yml
├─ frontend
│  ├─ .cache
│  ├─ README.md
│  ├─ components.json
│  ├─ eslint.config.js
│  ├─ index.html
│  ├─ package.json
│  ├─ pnpm-lock.yaml
│  ├─ postcss.config.js
│  ├─ public
│  │  └─ vite.svg
│  ├─ src
│  │  ├─ _api
│  │  │  ├─ auth_api.ts
│  │  │  ├─ axios_instance.ts
│  │  │  ├─ chat_api.ts
│  │  │  ├─ files_api.ts
│  │  │  ├─ gph_captcha_api.ts
│  │  │  ├─ playground_api.ts
│  │  │  ├─ projects_api
│  │  │  │  ├─ projectHistory_api.ts
│  │  │  │  ├─ projectStages_api.ts
│  │  │  │  └─ projects_api.ts
│  │  │  ├─ sms_captcha_api.ts
│  │  │  ├─ user_api copy.ts
│  │  │  └─ user_api.ts
│  │  ├─ _hooks
│  │  │  ├─ use-mobile.tsx
│  │  │  ├─ use-toast.ts
│  │  │  ├─ useChat.ts
│  │  │  ├─ useFiles.ts
│  │  │  ├─ useProjects
│  │  │  │  ├─ useProjectStages.ts
│  │  │  │  ├─ useProjects.ts
│  │  │  │  └─ useProjectsHistory.ts
│  │  │  └─ useUnsavedChangeWarning.ts
│  │  ├─ _types
│  │  │  ├─ auth_dt_stru.ts
│  │  │  ├─ chat_dt_stru.ts
│  │  │  ├─ error_dt_stru.ts
│  │  │  ├─ files_dt_stru.ts
│  │  │  ├─ projects_dt_stru
│  │  │  │  ├─ projectHistory_interface.ts
│  │  │  │  ├─ projectStage_interface.ts
│  │  │  │  ├─ projectTasks_interface.ts
│  │  │  │  └─ projects_interface.ts
│  │  │  └─ user_dt_stru.ts
│  │  ├─ assets
│  │  │  ├─ global.scss
│  │  │  ├─ markdown.scss
│  │  │  ├─ shadcn.scss
│  │  │  ├─ tailwind.scss
│  │  │  └─ tiptap.scss
│  │  ├─ components
│  │  │  ├─ MarkdownEditor
│  │  │  │  ├─ MD_test.tsx
│  │  │  │  ├─ MD_testData.ts
│  │  │  │  ├─ MarkdownEditor.tsx
│  │  │  │  └─ preprocess_tool.ts
│  │  │  ├─ TiptapEditor
│  │  │  │  ├─ TE_test.tsx
│  │  │  │  ├─ TE_testData.ts
│  │  │  │  ├─ TableOfContents.tsx
│  │  │  │  ├─ TiptapEditor.tsx
│  │  │  │  └─ ToolBar.tsx
│  │  │  ├─ TiptapEditor_Pro
│  │  │  │  ├─ TiptapEditor_pro.tsx
│  │  │  │  └─ ToC.tsx
│  │  │  ├─ auth
│  │  │  │  ├─ login-form.tsx
│  │  │  │  ├─ login_components
│  │  │  │  │  ├─ AgreementCheckbox.tsx
│  │  │  │  │  ├─ CodeLoginForm.tsx
│  │  │  │  │  ├─ PasswordLoginForm.tsx
│  │  │  │  │  ├─ useGraphicalCaptcha.ts
│  │  │  │  │  ├─ useLoginFormState.ts
│  │  │  │  │  └─ useWeChatLogin.ts
│  │  │  │  ├─ logout.tsx
│  │  │  │  ├─ register-form.tsx
│  │  │  │  ├─ reset-password.tsx
│  │  │  │  ├─ use-captcha-countdown.ts
│  │  │  │  └─ verification-code-input.tsx
│  │  │  ├─ change_history
│  │  │  │  ├─ ChangeHistoryDetail.tsx
│  │  │  │  ├─ ChangeHistoryPage.tsx
│  │  │  │  ├─ ChangeHistoryTable.tsx
│  │  │  │  └─ ProjectHistoryButton.tsx
│  │  │  ├─ chat
│  │  │  │  ├─ ChatPannel.tsx
│  │  │  │  └─ ChatSessionList.tsx
│  │  │  ├─ files
│  │  │  │  ├─ FileHelpers.ts
│  │  │  │  ├─ FilePreview
│  │  │  │  │  ├─ DocxPreview.tsx
│  │  │  │  │  ├─ FilePreview.tsx
│  │  │  │  │  └─ PDFPreview.tsx
│  │  │  │  ├─ FilePreviewDialog.tsx
│  │  │  │  ├─ FileTable.tsx
│  │  │  │  ├─ FileUploadButton.tsx
│  │  │  │  └─ _FileManager.tsx
│  │  │  ├─ layout
│  │  │  │  ├─ app-sidebar.tsx
│  │  │  │  ├─ nav-projects.tsx
│  │  │  │  ├─ nav-user.tsx
│  │  │  │  └─ team-switcher.tsx
│  │  │  ├─ projects
│  │  │  │  ├─ BidTasks
│  │  │  │  ├─ Project
│  │  │  │  │  ├─ _01_ProjectCreate.tsx
│  │  │  │  │  ├─ _02_ProjectsList.tsx
│  │  │  │  │  ├─ _03_ProjectsFilter.tsx
│  │  │  │  │  └─ _ProjectManager.tsx
│  │  │  │  ├─ ProjectLayout
│  │  │  │  │  ├─ ContentArea.tsx
│  │  │  │  │  ├─ DocumentDrawer.tsx
│  │  │  │  │  ├─ ProjectLayout.tsx
│  │  │  │  │  ├─ ProjectNavigation.tsx
│  │  │  │  │  ├─ ProjectStatusAlert.tsx
│  │  │  │  │  ├─ ResizeDivider.tsx
│  │  │  │  │  └─ SplitLayout.tsx
│  │  │  │  ├─ Task
│  │  │  │  │  ├─ AnalysisPanel
│  │  │  │  │  │  ├─ AnalysisPanel.tsx
│  │  │  │  │  │  ├─ test.tsx
│  │  │  │  │  │  └─ testData.ts
│  │  │  │  │  ├─ CompletionPanel
│  │  │  │  │  │  └─ CompletionPanel.tsx
│  │  │  │  │  ├─ ConfigurationPanel
│  │  │  │  │  │  ├─ ConfigurationPanel.tsx
│  │  │  │  │  │  ├─ test.tsx
│  │  │  │  │  │  └─ testData.ts
│  │  │  │  │  ├─ ConfigurationPreview
│  │  │  │  │  │  └─ ConfigurationPreview.tsx
│  │  │  │  │  ├─ ResultPreview
│  │  │  │  │  │  └─ ResultPreview.tsx
│  │  │  │  │  ├─ ReviewPanel
│  │  │  │  │  │  ├─ ReviewPanel.tsx
│  │  │  │  │  │  ├─ test.tsx
│  │  │  │  │  │  └─ testData.ts
│  │  │  │  │  ├─ TaskContainer.tsx
│  │  │  │  │  ├─ hook&APIs.tsx
│  │  │  │  │  │  ├─ streamingApi.ts
│  │  │  │  │  │  ├─ tasksApi.ts
│  │  │  │  │  │  ├─ useStreaming.ts
│  │  │  │  │  │  └─ useTasks.ts
│  │  │  │  │  └─ shared
│  │  │  │  │     └─ StatusBar.tsx
│  │  │  │  └─ TenderAnalysis
│  │  │  │     ├─ DocxExtractionTask
│  │  │  │     │  ├─ DocxExtractionTask.tsx
│  │  │  │     │  ├─ taskDocxExtraction_api.ts
│  │  │  │     │  └─ useTaskDocxExtraction.ts
│  │  │  │     ├─ OutlineAnalysisTask
│  │  │  │     │  ├─ OutlineAnalysisStreamingView.tsx
│  │  │  │     │  ├─ shared
│  │  │  │     │  │  ├─ MarkdownStreamingRenderer.tsx
│  │  │  │     │  │  ├─ MarkdownViewer.tsx
│  │  │  │     │  │  ├─ TiptapEditor_lite.tsx
│  │  │  │     │  │  └─ TiptapEditor_lite2.tsx
│  │  │  │     │  ├─ taskOutlineAnalysis_api.ts
│  │  │  │     │  └─ useTaskOutlineAnalysis.ts
│  │  │  │     ├─ TenderAnalysisPage
│  │  │  │     │  ├─ TaskComponentMap.tsx
│  │  │  │     │  └─ TenderAnalysisPage.tsx
│  │  │  │     ├─ TenderAnalysisPage.tsx
│  │  │  │     └─ TenderFileUpload
│  │  │  │        ├─ TenderFileupload.tsx
│  │  │  │        ├─ taskUploadFile_api.ts
│  │  │  │        └─ useTaskUploadFile.ts
│  │  │  └─ ui
│  │  │     ├─ accordion.tsx
│  │  │     ├─ alert-dialog.tsx
│  │  │     ├─ alert.tsx
│  │  │     ├─ aspect-ratio.tsx
│  │  │     ├─ avatar.tsx
│  │  │     ├─ badge.tsx
│  │  │     ├─ breadcrumb.tsx
│  │  │     ├─ button.tsx
│  │  │     ├─ card.tsx
│  │  │     ├─ checkbox.tsx
│  │  │     ├─ collapsible.tsx
│  │  │     ├─ dialog.tsx
│  │  │     ├─ drawer.tsx
│  │  │     ├─ dropdown-menu.tsx
│  │  │     ├─ input.tsx
│  │  │     ├─ label.tsx
│  │  │     ├─ progress.tsx
│  │  │     ├─ resizable.tsx
│  │  │     ├─ scroll-area.tsx
│  │  │     ├─ select.tsx
│  │  │     ├─ separator.tsx
│  │  │     ├─ sheet.tsx
│  │  │     ├─ sidebar.tsx
│  │  │     ├─ skeleton.tsx
│  │  │     ├─ table.tsx
│  │  │     ├─ tabs.tsx
│  │  │     ├─ textarea.tsx
│  │  │     ├─ toast.tsx
│  │  │     ├─ toaster.tsx
│  │  │     └─ tooltip.tsx
│  │  ├─ contexts
│  │  │  ├─ ConnectionContext.tsx
│  │  │  └─ auth-context.tsx
│  │  ├─ lib
│  │  │  └─ utils.ts
│  │  ├─ main.tsx
│  │  ├─ playground
│  │  │  ├─ MarkdownViewer
│  │  │  └─ TiptapwithAPI
│  │  │     ├─ TiptapEditor.tsx
│  │  │     ├─ TiptapPage.tsx
│  │  │     ├─ tiptap_api.ts
│  │  │     └─ useTiptap.ts
│  │  ├─ routeTree.gen.ts
│  │  ├─ routes
│  │  │  ├─ __root.tsx
│  │  │  ├─ about.lazy.tsx
│  │  │  ├─ auth
│  │  │  │  ├─ forgot-password.tsx
│  │  │  │  ├─ login.tsx
│  │  │  │  ├─ privacy-policy.tsx
│  │  │  │  ├─ register.tsx
│  │  │  │  └─ service-term.tsx
│  │  │  ├─ chat.$sessionId.tsx
│  │  │  ├─ chat.tsx
│  │  │  ├─ company.lazy.tsx
│  │  │  ├─ files_manager.lazy.tsx
│  │  │  ├─ index.lazy.tsx
│  │  │  ├─ playground
│  │  │  │  ├─ _layout.tsx
│  │  │  │  ├─ index.tsx
│  │  │  │  ├─ markdown_editor.tsx
│  │  │  │  ├─ task.tsx
│  │  │  │  └─ tiptap_editor.tsx
│  │  │  ├─ projects
│  │  │  │  ├─ $projectId
│  │  │  │  │  ├─ bid-writing.tsx
│  │  │  │  │  ├─ history
│  │  │  │  │  │  ├─ $historyId.tsx
│  │  │  │  │  │  ├─ index.tsx
│  │  │  │  │  │  ├─ project
│  │  │  │  │  │  │  └─ $historyId.tsx
│  │  │  │  │  │  ├─ stage
│  │  │  │  │  │  │  └─ $historyId.tsx
│  │  │  │  │  │  └─ task
│  │  │  │  │  │     └─ $historyId.tsx
│  │  │  │  │  ├─ index.tsx
│  │  │  │  │  └─ tender-analysis.tsx
│  │  │  │  ├─ $projectId.tsx
│  │  │  │  └─ index.tsx
│  │  │  ├─ projects_manager.lazy.tsx
│  │  │  └─ testground.tsx
│  │  └─ vite-env.d.ts
│  ├─ tailwind.config.js
│  ├─ tsconfig.app.json
│  ├─ tsconfig.json
│  ├─ tsconfig.node.json
│  └─ vite.config.ts
├─ json-server
│  ├─ db.json
│  ├─ dist
│  │  ├─ config.js
│  │  ├─ middleware
│  │  │  ├─ auth copy.js
│  │  │  ├─ auth.js
│  │  │  └─ rate-limit.js
│  │  ├─ server copy.js
│  │  ├─ server.js
│  │  ├─ services
│  │  │  ├─ sms.js
│  │  │  └─ verification.js
│  │  └─ utils
│  │     └─ client.js
│  ├─ generate-hash.js
│  ├─ package.json
│  ├─ pnpm-lock.yaml
│  ├─ src
│  │  ├─ config.ts
│  │  ├─ middleware
│  │  │  ├─ auth copy.ts
│  │  │  ├─ auth.ts
│  │  │  ├─ auth_copy.js
│  │  │  └─ rate-limit.ts
│  │  ├─ server copy.js
│  │  ├─ server copy.ts
│  │  ├─ server.ts
│  │  ├─ services
│  │  │  ├─ sms.ts
│  │  │  └─ verification.ts
│  │  ├─ types
│  │  │  └─ tencentcloud-sdk-nodejs.d.ts
│  │  └─ utils
│  │     └─ client.ts
│  └─ tsconfig.json
├─ notebook
│  └─ python.ipynb
├─ projects_api_mapping.md
├─ pull-images.sh
├─ push-images.sh
├─ run-containers.sh
├─ test.html
├─ tiptap-service
│  ├─ .cache
│  ├─ editor-config.js
│  ├─ markdown-utils.js
│  ├─ package.json
│  ├─ pnpm-lock.yaml
│  └─ server.js
└─ upload-server
   ├─ package.json
   ├─ pnpm-lock.yaml
   ├─ server.js
   └─ uploads
      ├─ 1737001873074-138005162-case11-测试树结构.docx
      ├─ 1737031383905-616495437-case7_投标人须知_纯图版.pdf
      ├─ 1737031386811-20712435-case5_北京铁运投标人须知.docx
      ├─ 1737483651218-763456917-上海市一证通用法人数字证书申请表（企业）0727.pdf
      └─ 1737523326753-280658073-上海市一证通用法人数字证书申请表（企业）0727.pdf

```