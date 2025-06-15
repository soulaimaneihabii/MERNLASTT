from flask import Flask, request, jsonify, Blueprint
from flask_cors import CORS
import joblib
import pandas as pd
from datetime import datetime
import time
from pymongo import MongoClient
from bson import ObjectId

# === Setup ===
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": ["http://localhost:3000"]}}, supports_credentials=True)

# === Load Model ===
try:
    model = joblib.load('chronic_disease_model.pkl')
    print("✅ Model loaded successfully")
except Exception as e:
    print(f"❌ Error loading model: {e}")
    model = None



# === Chronic Disease Mapping ===
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
        if 'Heart Disease' in disease_types:
            recommendations.extend([
                "Monitor blood pressure regularly",
                "Limit sodium intake",
                "Consider cardiology consultation"
            ])
        if 'Kidney Disease' in disease_types:
            recommendations.extend([
                "Monitor kidney function tests",
                "Adjust medication dosages",
                "Consider nephrology referral"
            ])
    else:
        recommendations.extend([
            "Maintain healthy lifestyle",
            "Regular preventive check-ups",
            "Continue current medication regimen"
        ])
    return recommendations

@app.route('/predict', methods=['POST'])
def predict():
    try:
        if model is None:
            return jsonify({"error": "Model not loaded", "success": False}), 500

        patient_data = request.json
        if not patient_data:
            return jsonify({"error": "No data", "success": False}), 400

        if 'diabetesMed' in patient_data:
            patient_data['diabetesMed'] = 1 if str(patient_data['diabetesMed']).lower() in ['yes', '1', 'true'] else 0

        int_fields = [
            'time_in_hospital', 'number_inpatient', 'number_outpatient', 'number_emergency',
            'num_lab_procedures', 'num_procedures', 'num_medications', 'age'
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

        confidence = float(max(prediction_proba))
        disease_types = get_chronic_disease_types(patient_data)

        risk_level = 'Low'
        result_risk = 'low'
        if prediction == 1 and confidence >= 0.75:
            risk_level, result_risk = 'High', 'high'
        elif prediction == 1 and confidence >= 0.5:
            risk_level, result_risk = 'Moderate', 'medium'
        elif prediction == 1:
            risk_level, result_risk = 'Low', 'low'

        return jsonify({
            "success": True,
            "prediction": int(prediction),
            "confidence": confidence,
            "risk_level": risk_level,
            "result_risk": result_risk,
            "chronic_disease_types": disease_types,
            "probability_scores": {
                "no_risk": float(prediction_proba[0]),
                "chronic_risk": float(prediction_proba[1])
            },
            "timestamp": datetime.now().isoformat(),
            "recommendations": generate_recommendations(prediction, disease_types, confidence)
        })

    except Exception as e:
        return jsonify({"error": str(e), "success": False}), 500

# === AI Suggestions Endpoint ===
client = MongoClient("mongodb+srv://soulayemane3:12345678Aa@cluster0.ndrdvsm.mongodb.net/MERN_APP_LATEST?retryWrites=true&w=majority")
db = client["MERN_APP_LATEST"]
patients = db["patients"]

# Flask Blueprint
ai_assistant_bp = Blueprint('ai_assistant', __name__)

@ai_assistant_bp.route('/assist', methods=['POST'])
def ai_assist():
    data = request.json
    print("🧠 Incoming Flask AI assist request:", data)

    user_id = data.get('user_id')
    if not user_id:
        return jsonify({"success": False, "error": "Missing user_id"}), 400

    try:
        object_user_id = ObjectId(user_id)
    except Exception as e:
        return jsonify({"success": False, "error": f"Invalid user_id: {e}"}), 400

    patient = patients.find_one({"user": object_user_id})
    if not patient:
        return jsonify({"success": False, "error": "Patient not found"}), 404

    # Base data
    age = int(patient.get("age", 35))
    gender = patient.get("gender", "Male")
    race = patient.get("race", "White")

    # Simulate AI suggestions
    suggested_fields = {
        "age": age,
        "diag_1": "E11.9" if age > 50 else "E10.9",
        "diag_2": "I10" if gender == "Male" else "N18.9",
        "diag_3": "J44.9" if race == "African American" else "None",
        "max_glu_serum": ">200" if age > 60 else "Norm",
        "A1Cresult": ">7" if age > 60 else "Norm",
        "insulin": "Up" if gender == "Male" else "Steady",
        "metformin": "Up",
        "diabetesMed": "Yes" if age > 50 else "No",
        "time_in_hospital": 5,
        "num_lab_procedures": 50,
        "num_procedures": 2,
        "num_medications": 12,
        "number_outpatient": 1,
        "number_emergency": 0,
        "number_inpatient": 1,
        "number_diagnoses": 6,
    }

    # Optional: log for debug
    print("🧠 Suggested fields:", suggested_fields)

    return jsonify({
        "success": True,
        "data": {
            "user_id": user_id,
            "suggestedFields": suggested_fields
        }
    })
# === Register Blueprint ===
app.register_blueprint(ai_assistant_bp, url_prefix="/api/ai")

# === Debug Route Logging ===
print("\n🔎 Registered Routes:")
for rule in app.url_map.iter_rules():
    print(f"{rule.endpoint:25s} {rule.methods} {rule}")

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)
