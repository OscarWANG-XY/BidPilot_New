from django.db import models

# Create your models here.
class testground(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    tiptap_content = models.TextField()

    def __str__(self):
        return self.name
