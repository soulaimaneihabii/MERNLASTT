db.predictions.find({}).forEach((doc) => {
  let result = "Unknown";
  if (doc.result?.risk === "high") result = "High";
  else if (doc.result?.risk === "medium") result = "Moderate";
  else if (doc.result?.risk === "low") result = "Low";

  db.predictions.updateOne({ _id: doc._id }, { $set: { predictionResult: result } });
});
