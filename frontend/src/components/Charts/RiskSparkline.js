import React from 'react'
import { LineChart, Line, Tooltip, ResponsiveContainer } from 'recharts'

const RiskSparkline = ({ data = [], width, height, stroke }) => {
  if (!data || data.length === 0) return <span style={{ color: '#bbb' }}>No data</span>

  const formatted = data.map((point, index) => ({
    index,
    score: point.score || 0,
  }))

  return (
    <ResponsiveContainer width={width} height={height}>
      <LineChart data={formatted}>
        <Line
          type="monotone"
          dataKey="score"
          stroke={stroke || '#8884d8'}
          strokeWidth={2}
          dot={false}
        />
        <Tooltip formatter={(val) => val.toFixed(2)} />
      </LineChart>
    </ResponsiveContainer>
  )
}

export default RiskSparkline
