from rest_framework import serializers

class AnalyzeMedicineRequestSerializer(serializers.Serializer):
    image = serializers.ImageField(required=False)
    text_input = serializers.CharField(required=False, max_length=500)
    conditions = serializers.CharField(required=False, max_length=500, help_text="User's existing conditions like Diabetes, BP")

    def validate(self, data):
        if not data.get('image') and not data.get('text_input'):
            raise serializers.ValidationError("Either 'image' or 'text_input' must be provided.")
        return data