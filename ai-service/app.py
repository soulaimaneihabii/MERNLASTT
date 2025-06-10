from flask import Flask, request, jsonify, Blueprint
from flask_cors import CORS
import joblib
import pandas as pd
import numpy as np
from datetime import datetime
import time
from pymongo import MongoClient
from bson import ObjectId


app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}}, supports_credentials=True)

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
    return jsonify({
        'status': 'healthy',
        'model_loaded': model is not None,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/predict', methods=['POST'])
def predict():
    try:
        if model is None:
            return jsonify({
                'error': 'Model not loaded',
                'success': False
            }), 500

        patient_data = request.json

        if not patient_data:
            return jsonify({
                'error': 'No patient data provided',
                'success': False
            }), 400

        if 'diabetesMed' in patient_data:
            if str(patient_data['diabetesMed']).lower() in ['yes', '1', 'true']:
                patient_data['diabetesMed'] = 1
            else:
                patient_data['diabetesMed'] = 0

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
                    patient_data[field] = 0

        df = pd.DataFrame([patient_data])

        if hasattr(model, 'feature_names_in_'):
            df = df[model.feature_names_in_]

        prediction = model.predict(df)[0]
        prediction_proba = model.predict_proba(df)[0]

        disease_types = get_chronic_disease_types(patient_data)
        confidence = float(max(prediction_proba))

        result_risk = 'medium'
        risk_level = 'Moderate'

        if prediction == 1:
            if confidence > 0.8:
                risk_level = 'High'
                result_risk = 'high'
            elif confidence > 0.6:
                risk_level = 'Moderate'
                result_risk = 'medium'
        else:
            if confidence > 0.8:
                risk_level = 'Low'
                result_risk = 'low'

        response = {
            'success': True,
            'prediction': int(prediction),
            'confidence': confidence,
            'risk_level': risk_level,
            'result_risk': result_risk,
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
        return jsonify({
            'error': f'Prediction failed: {str(e)}',
            'success': False
        }), 500

def generate_recommendations(prediction, disease_types, confidence):
    recommendations = []

    if prediction == 1:
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
    else:
        recommendations.extend([
            "Maintain healthy lifestyle",
            "Regular preventive check-ups",
            "Continue current medication regimen"
        ])

    return recommendations

# === AI Assistance Endpoint ===
ai_assistant_bp = Blueprint('ai_assistant', __name__)

client = MongoClient("mongodb+srv://soulayemane3:12345678Aa@cluster0.ndrdvsm.mongodb.net/MERN_APP_LATEST?retryWrites=true&w=majority&appName=Cluster0")
db = client["medapp"]
patients = db["patients"]

@ai_assistant_bp.route('/assist', methods=['POST'])
def ai_assist():
    data = request.json
    patient_id = data.get('patient_id')

    patient = patients.find_one({"_id": ObjectId(patient_id)})
    if not patient:
        return jsonify({"success": False, "error": "Patient not found"}), 404

    age = int(patient.get("age", 35))
    gender = patient.get("gender", "Male")
    race = patient.get("race", "White")

    time.sleep(1)  # Simulate delay

    suggested_fields = {
        "age": age,
        "diag_1": "E11.9" if age > 50 else "E10.9",
        "diag_2": "I10" if gender == "Male" else "N18.9",
        "diag_3": "J44.9" if race == "African American" else "None",
        "max_glu_serum": ">300" if age > 60 else ">200" if age > 40 else "Norm",
        "A1Cresult": ">8" if age > 60 else ">7" if age > 45 else "Norm",
        "insulin": "Up" if gender == "Male" and age > 50 else "Steady",
        "metformin": "Up" if race in ["White", "Hispanic"] else "Steady",
        "diabetesMed": "Yes" if age > 30 else "No",
        "time_in_hospital": 7 if age > 60 else 4 if age > 40 else 2,
        "num_lab_procedures": 70 if age > 55 else 50,
        "num_procedures": 3 if age > 50 else 2,
        "num_medications": 12 if gender == "Male" else 10,
        "number_outpatient": 2 if age > 50 else 1,
        "number_emergency": 1 if age > 60 else 0,
        "number_inpatient": 2 if age > 55 else 1,
        "number_diagnoses": 5 if age > 50 else 3
    }

    return jsonify({
        "success": True,
        "data": {
            "patient_id": str(patient_id),
            "suggestedFields": suggested_fields
        }
    })

# Register blueprint
app.register_blueprint(ai_assistant_bp, url_prefix="/api/ai")

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)
