from django.urls import path
from .views import AnalyzeMedicineView

urlpatterns = [
    path('analyze/', AnalyzeMedicineView.as_view(), name='analyze_medicine'),
]