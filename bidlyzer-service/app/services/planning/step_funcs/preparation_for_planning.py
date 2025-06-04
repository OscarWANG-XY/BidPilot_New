from app.services.structuring.cache import Cache as structuring_cache
from app.clients.tiptap.client import TiptapClient
from app.clients.tiptap.tools import extract_leaf_chapters
from app.services.planning.profs.checklists_keyinfo import get_checklist_keyinfo




class PreparationForPlanning():
    def __init__(self, project_id: str):
        self.project_id = project_id
        self.cache = structuring_cache(project_id)
        self.tiptap_client = TiptapClient()

    

    async def get_chapters(self):
        final_doc = await self.cache.get_document("intro_document")

        leaf_chapters = extract_leaf_chapters(final_doc)

        chapters_md = []
        postion_chapter_map={}
        for index, chapter in enumerate(leaf_chapters):
            chapter_md = await self.tiptap_client.json_to_markdown(chapter)
            result = {
                "index": index,
                "position": chapter["meta"]["position"],
                "content": chapter_md
            }
            chapters_md.append(result)
            postion_chapter_map[chapter["meta"]["position"]] = chapter["meta"]["title"]

        return chapters_md, postion_chapter_map




    async def get_inspection_checklist(self):
        checklist_keyinfo = get_checklist_keyinfo()
        checklist_json = await TiptapClient().markdown_to_json(checklist_keyinfo)

        return checklist_json