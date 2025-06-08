from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import numpy as np
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Load the trained model
try:
    model = joblib.load('chronic_disease_model.pkl')
    print("Model loaded successfully")
except Exception as e:
    print(f"Error loading model: {e}")
    model = None

# Mapping chronic disease codes to names
chronic_diag_map = {
    'E11': 'Diabetes',
    'E10': 'Diabetes',
    'I10': 'Hypertension',
    'I25': 'Heart Disease',
    'N18': 'Kidney Disease',
    'J44': 'COPD'
}
def get_chronic_disease_types(patient_data):
    """Extract chronic disease types from diagnosis codes"""
    diseases = set()
    for diag_col in ['diag_1', 'diag_2', 'diag_3']:
        val = patient_data.get(diag_col)
        if val and str(val) != 'nan':
            code = str(val).split('.')[0]
            if code in chronic_diag_map:
                diseases.add(chronic_diag_map[code])
    
    return list(sorted(diseases)) if diseases else []

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': model is not None,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/predict', methods=['POST'])
def predict():
    """Main prediction endpoint"""
    try:
        if model is None:
            return jsonify({
                'error': 'Model not loaded',
                'success': False
            }), 500

        # Get patient data from request
        patient_data = request.json
        
        if not patient_data:
            return jsonify({
                'error': 'No patient data provided',
                'success': False
            }), 400

        # === PATCH — Convert diabetesMed to 0/1 ===
        if 'diabetesMed' in patient_data:
            if str(patient_data['diabetesMed']).lower() in ['yes', '1', 'true']:
                patient_data['diabetesMed'] = 1
            else:
                patient_data['diabetesMed'] = 0

        # === PATCH — Convert numerical fields ===
        int_fields = [
            'time_in_hospital',
            'number_inpatient',
            'number_outpatient',
            'number_emergency',
            'num_lab_procedures',
            'num_procedures',
            'num_medications',
            'age'
        ]

        for field in int_fields:
            if field in patient_data:
                try:
                    patient_data[field] = int(patient_data[field])
                except:
                    patient_data[field] = 0  # fallback default

        # === Convert to DataFrame ===
        df = pd.DataFrame([patient_data])

        # DEBUG — show incoming columns vs model expected
        print("Incoming columns:", df.columns.tolist())
        if hasattr(model, 'feature_names_in_'):
            print("Model expects:", model.feature_names_in_)

            # OPTIONAL: reorder columns to match model
            df = df[model.feature_names_in_]

        # === Make prediction ===
        prediction = model.predict(df)[0]
        prediction_proba = model.predict_proba(df)[0]

        # === Chronic disease types ===
        disease_types = get_chronic_disease_types(patient_data)
        
        # === Confidence ===
        confidence = float(max(prediction_proba))
        
        # === Risk level for UI (unchanged)
        if prediction == 1:
            if confidence > 0.8:
                risk_level = 'High'
            elif confidence > 0.6:
                risk_level = 'Moderate'
            else:
                risk_level = 'Moderate'
        else:
            if confidence > 0.8:
                risk_level = 'Low'
            elif confidence > 0.6:
                risk_level = 'Moderate'
            else:
                risk_level = 'Moderate'

        # === Risk level for Mongoose result.risk field → match your ENUM!
        if prediction == 1:
            if confidence > 0.8:
                result_risk = 'high'
            elif confidence > 0.6:
                result_risk = 'medium'
            else:
                result_risk = 'medium'
        else:
            if confidence > 0.8:
                result_risk = 'low'
            elif confidence > 0.6:
                result_risk = 'medium'
            else:
                result_risk = 'medium'

        # === Response ===
        response = {
            'success': True,
            'prediction': int(prediction),
            'confidence': confidence,
            'risk_level': risk_level,   # for UI
            'result_risk': result_risk, # for Mongoose result.risk field
            'chronic_disease_types': disease_types,
            'probability_scores': {
                'no_risk': float(prediction_proba[0]),
                'chronic_risk': float(prediction_proba[1])
            },
            'timestamp': datetime.now().isoformat(),
            'recommendations': generate_recommendations(prediction, disease_types, confidence)
        }
        
        return jsonify(response)
        
    except Exception as e:
        print(f"Prediction failed: {e}")
        return jsonify({
            'error': f'Prediction failed: {str(e)}',
            'success': False
        }), 500


def generate_recommendations(prediction, disease_types, confidence):
    """Generate medical recommendations based on prediction"""
    recommendations = []
    
    if prediction == 1:  # High risk
        recommendations.append("Schedule regular follow-up appointments")
        recommendations.append("Monitor vital signs closely")
        
        if 'Diabetes' in disease_types:
            recommendations.extend([
                "Monitor blood glucose levels daily",
                "Follow diabetic diet plan",
                "Consider insulin therapy adjustment"
            ])
        
        if 'Heart Disease' in disease_types or 'Heart Failure' in disease_types:
            recommendations.extend([
                "Monitor blood pressure regularly",
                "Limit sodium intake",
                "Consider cardiology consultation"
            ])
        
        if 'Kidney Failure' in disease_types:
            recommendations.extend([
                "Monitor kidney function tests",
                "Adjust medication dosages",
                "Consider nephrology referral"
            ])
            
        if 'Cholesterol' in disease_types:
            recommendations.extend([
                "Follow low-cholesterol diet",
                "Consider statin therapy",
                "Regular lipid panel monitoring"
            ])
    else:  # Low risk
        recommendations.extend([
            "Maintain healthy lifestyle",
            "Regular preventive check-ups",
            "Continue current medication regimen"
        ])
    
    return recommendations

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)
