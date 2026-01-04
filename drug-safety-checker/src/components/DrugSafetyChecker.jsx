import React, { useState } from 'react';
import { Camera, Upload, AlertCircle, CheckCircle, XCircle, Loader2, Pill } from 'lucide-react';

export default function DrugSafetyChecker() {
  const [drugName, setDrugName] = useState('');
  const [conditions, setConditions] = useState({
    kidney: false,
    bp: false,
    diabetes: false,
    liver: false,
    heart: false,
    pregnancy: false,
    other: ''
  });
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [ocrText, setOcrText] = useState('');

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setLoading(true);
      
      try {
        const reader = new FileReader();
        reader.onload = async (event) => {
          const base64Image = event.target.result.split(',')[1];
          
          // Use Claude API with vision to extract text from image
          const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'claude-sonnet-4-20250514',
              max_tokens: 1000,
              messages: [{
                role: 'user',
                content: [
                  {
                    type: 'image',
                    source: {
                      type: 'base64',
                      media_type: file.type,
                      data: base64Image
                    }
                  },
                  {
                    type: 'text',
                    text: 'Extract the drug/medicine name from this image. If there are multiple drugs, list them all. Only provide the drug names, nothing else.'
                  }
                ]
              }]
            })
          });

          const data = await response.json();
          const extractedText = data.content[0].text;
          setOcrText(extractedText);
          setDrugName(extractedText);
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error('OCR Error:', error);
        alert('Failed to extract text from image. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleConditionChange = (condition) => {
    setConditions(prev => ({
      ...prev,
      [condition]: !prev[condition]
    }));
  };

  const analyzeCompatibility = async () => {
    if (!drugName.trim()) {
      alert('Please enter a drug name or upload an image');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const activeConditions = Object.entries(conditions)
        .filter(([key, value]) => value && key !== 'other')
        .map(([key]) => key);
      
      if (conditions.other) {
        activeConditions.push(conditions.other);
      }

      const conditionsList = activeConditions.length > 0 
        ? activeConditions.join(', ') 
        : 'no specific health conditions';

      const prompt = `Analyze the safety of the drug "${drugName}" for a patient with the following health conditions: ${conditionsList}.

Please provide:
1.⁠ ⁠Safety Assessment: Can the patient safely use this drug? (Safe/Caution/Not Recommended)
2.⁠ ⁠Key Concerns: Any specific interactions or contraindications
3.⁠ ⁠Recommendations: What the patient should know or do
4.⁠ ⁠Monitoring: Any tests or symptoms to watch for

Format your response as JSON with these exact keys: safety_status, key_concerns, recommendations, monitoring_needed`;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: prompt
          }]
        })
      });

      const data = await response.json();
      const analysisText = data.content[0].text;
      
      // Parse JSON response
      let analysis;
      try {
        const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysis = JSON.parse(jsonMatch[0]);
        } else {
          // Fallback parsing
          analysis = {
            safety_status: analysisText.toLowerCase().includes('not recommended') ? 'Not Recommended' :
                          analysisText.toLowerCase().includes('caution') ? 'Caution' : 'Safe',
            key_concerns: analysisText,
            recommendations: 'Please consult with a healthcare professional for personalized advice.',
            monitoring_needed: 'Regular monitoring recommended'
          };
        }
      } catch (e) {
        analysis = {
          safety_status: 'Caution',
          key_concerns: analysisText,
          recommendations: 'Please consult with a healthcare professional for personalized advice.',
          monitoring_needed: 'Regular monitoring recommended'
        };
      }

      setResult(analysis);
    } catch (error) {
      console.error('Analysis Error:', error);
      alert('Failed to analyze drug compatibility. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getSafetyColor = (status) => {
    if (!status) return 'gray';
    const statusLower = status.toLowerCase();
    if (statusLower.includes('safe') && !statusLower.includes('not')) return 'green';
    if (statusLower.includes('caution')) return 'yellow';
    return 'red';
  };

  const getSafetyIcon = (status) => {
    const color = getSafetyColor(status);
    if (color === 'green') return <CheckCircle className="w-12 h-12 text-green-500" />;
    if (color === 'yellow') return <AlertCircle className="w-12 h-12 text-yellow-500" />;
    return <XCircle className="w-12 h-12 text-red-500" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Pill className="w-8 h-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-800">Drug Safety Checker</h1>
          </div>
          
          <p className="text-gray-600 mb-8">
            Check if a medication is safe based on your health conditions. Upload a prescription or enter the drug name manually.
          </p>

          {/* Image Upload Section */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Upload Prescription/Medicine Image
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-400 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label htmlFor="image-upload" className="cursor-pointer">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 10MB</p>
              </label>
              {image && (
                <p className="mt-3 text-sm text-indigo-600 font-medium">
                  ✓ Image uploaded: {image.name}
                </p>
              )}
            </div>
            {ocrText && (
              <div className="mt-3 p-3 bg-indigo-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700">Extracted Text:</p>
                <p className="text-sm text-gray-600 mt-1">{ocrText}</p>
              </div>
            )}
          </div>

          {/* Manual Drug Entry */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Or Enter Drug Name Manually
            </label>
            <input
              type="text"
              value={drugName}
              onChange={(e) => setDrugName(e.target.value)}
              placeholder="e.g., Metformin, Aspirin, Lisinopril"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Health Conditions */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Select Your Health Conditions
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { key: 'kidney', label: 'Kidney Disease' },
                { key: 'bp', label: 'High Blood Pressure' },
                { key: 'diabetes', label: 'Diabetes' },
                { key: 'liver', label: 'Liver Disease' },
                { key: 'heart', label: 'Heart Disease' },
                { key: 'pregnancy', label: 'Pregnancy' }
              ].map(({ key, label }) => (
                <label
                  key={key}
                  className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                    conditions[key]
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={conditions[key]}
                    onChange={() => handleConditionChange(key)}
                    className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium text-gray-700">{label}</span>
                </label>
              ))}
            </div>
            
            <input
              type="text"
              value={conditions.other}
              onChange={(e) => setConditions(prev => ({ ...prev, other: e.target.value }))}
              placeholder="Other conditions (optional)"
              className="w-full mt-3 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Analyze Button */}
          <button
            onClick={analyzeCompatibility}
            disabled={loading || !drugName.trim()}
            className="w-full bg-indigo-600 text-white py-4 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing...
              </>
            ) : (
              'Check Drug Safety'
            )}
          </button>
        </div>

        {/* Results Section */}
        {result && (
          <div className="bg-white rounded-2xl shadow-xl p-8 animate-fade-in">
            <div className="text-center mb-6">
              {getSafetyIcon(result.safety_status)}
              <h2 className="text-2xl font-bold text-gray-800 mt-4">
                Safety Assessment: {result.safety_status}
              </h2>
              <p className="text-gray-600 mt-2">Drug: {drugName}</p>
            </div>

            <div className="space-y-6">
              <div className="bg-gray-50 p-5 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-indigo-600" />
                  Key Concerns
                </h3>
                <p className="text-gray-700 leading-relaxed">{result.key_concerns}</p>
              </div>

              <div className="bg-indigo-50 p-5 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">Recommendations</h3>
                <p className="text-gray-700 leading-relaxed">{result.recommendations}</p>
              </div>

              <div className="bg-yellow-50 p-5 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">Monitoring Needed</h3>
                <p className="text-gray-700 leading-relaxed">{result.monitoring_needed}</p>
              </div>

              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                <p className="text-sm text-red-800">
                  <strong>Disclaimer:</strong> This tool provides general information only and is not a substitute for professional medical advice. Always consult your healthcare provider before starting or stopping any medication.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}