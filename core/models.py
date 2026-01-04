from django.db import models

class Manufacturer(models.Model):
    name = models.CharField(max_length=255, unique=True)
    is_verified = models.BooleanField(default=False)
    trust_score = models.IntegerField(default=50, help_text="Score 0-100 based on regulatory history")

    def __str__(self):
        return f"{self.name} ({'Verified' if self.is_verified else 'Unverified'})"

class Medicine(models.Model):
    brand_name = models.CharField(max_length=255, db_index=True)
    generic_name = models.CharField(max_length=255)
    manufacturer = models.ForeignKey(Manufacturer, on_delete=models.CASCADE)
    description = models.TextField(blank=True)
    
    def __str__(self):
        return f"{self.brand_name} - {self.manufacturer.name}"

class ScanLog(models.Model):
    image = models.ImageField(upload_to='scans/', null=True, blank=True)
    extracted_text = models.TextField(null=True, blank=True)
    detected_medicine = models.CharField(max_length=255, null=True)
    risk_level = models.CharField(max_length=20)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Scan {self.id} - {self.risk_level}"