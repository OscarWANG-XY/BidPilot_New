import os
import pickle
import json
from pathlib import Path

class NotebookCacheManager:
    def __init__(self, cache_dir="cache"):
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(parents=True, exist_ok=True)

    def _get_path(self, name, ext=".pkl"):
        return self.cache_dir / f"{name}{ext}"

    def save(self, name, data):
        """Save data to a pickle file (.pkl)"""
        with open(self._get_path(name, ".pkl"), "wb") as f:
            pickle.dump(data, f)

    def load(self, name):
        """Load data from a pickle file (.pkl)"""
        with open(self._get_path(name, ".pkl"), "rb") as f:
            return pickle.load(f)

    def get_or_run(self, name, func, force=False):
        """Check if the file exists, if not, run function to generate and save data."""
        path = self._get_path(name, ".pkl")
        if not path.exists() or force:
            data = func()
            self.save(name, data)
            return data
        else:
            return self.load(name)

    def save_json(self, name, data):
        """Save data to a JSON file (.json)"""
        with open(self._get_path(name, ".json"), "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

    def load_json(self, name):
        """Load data from a JSON file (.json)"""
        with open(self._get_path(name, ".json"), "r", encoding="utf-8") as f:
            return json.load(f)

    def save_md(self, name, content):
        """Save markdown content to a .md file"""
        path = self._get_path(name, ".md")
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)

    def load_md(self, name):
        """Load markdown content from a .md file"""
        path = self._get_path(name, ".md")
        with open(path, "r", encoding="utf-8") as f:
            return f.read()

