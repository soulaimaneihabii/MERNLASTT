// src/components/RiskComponents/RiskSparkline.js
import React from 'react'
import { LineChart, Line } from 'recharts'

const RiskSparkline = ({ data, width = 100, height = 30 }) => {
  const preparedData = (Array.isArray(data) ? data : []).slice(-10).map((d, i) => ({
    index: i,
    score: d.score
  }))

  return (
    <LineChart width={width} height={height} data={preparedData}>
      <Line type="monotone" dataKey="score" stroke="#8884d8" dot={false} />
    </LineChart>
  )
}

export default RiskSparkline
