from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import AnalyzeMedicineRequestSerializer
from .services import MedGuardEngine
from .models import ScanLog

class AnalyzeMedicineView(APIView):
    def post(self, request):
        serializer = AnalyzeMedicineRequestSerializer(data=request.data)
        if serializer.is_valid():
            image = serializer.validated_data.get('image')
            text_input = serializer.validated_data.get('text_input')
            conditions = serializer.validated_data.get('conditions', 'None')

            engine = MedGuardEngine()
            
            # 1. OCR Step
            raw_text = ""
            if image:
                raw_text = engine.perform_ocr(image)
            elif text_input:
                raw_text = text_input

            # 2. Entity Extraction Step
            entities = engine.extract_entities(raw_text)
            med_name = entities.get('medicine_name') or "Unknown"
            manuf_name = entities.get('manufacturer') or "Unknown"

            # 3. Risk Assessment
            risk_report = engine.assess_risk(med_name, manuf_name)

            # 4. Medical Insights (RAG)
            insights = engine.get_medical_insights(med_name, conditions)

            # 5. Logging (Async in prod, Sync here)
            ScanLog.objects.create(
                extracted_text=raw_text[:500],
                detected_medicine=med_name,
                risk_level=risk_report['level']
            )

            return Response({
                "status": "success",
                "data": {
                    "detected_info": entities,
                    "risk_analysis": risk_report,
                    "medical_insights": insights
                }
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)