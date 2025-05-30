import logging
from typing import Dict, List, Tuple, Any, Optional
from app.services.structuring.cache import Cache as StructuringCache

from app.clients.tiptap.helpers import TiptapUtils

logger = logging.getLogger(__name__)

class GetStructureContext:
    """
    获取结构化文档的上下文
    """

    def __init__(self, project_id: str):
        self.project_id = project_id
        self.structuring_cache = StructuringCache(self.project_id)



    # async def get_context(self, document: Dict) -> Dict:



    async def _get_final_document(self) -> Dict:

        # TODO: 需要修改， 目前是intro_document， 需要修改为final_document
        final_document = await self.structuring_cache.get_document('intro_document')

        if final_document is None:
            raise ValueError("final_document not found")
        
        return final_document
