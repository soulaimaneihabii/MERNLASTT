import React from 'react'
import { Tag } from 'antd'
import { LineChart, Line, ResponsiveContainer, RadialBarChart, RadialBar } from 'recharts'

export const RiskTag = ({ score }) => {
  const pct = Math.round(score * 100)
  const color = score > 0.8 ? 'red' : score > 0.5 ? 'orange' : 'green'
  return <Tag color={color}>{pct}%</Tag>
}

export const RiskSparkline = ({ data }) => (
  <ResponsiveContainer width={100} height={30}>
    <LineChart data={data}>
      <Line type="monotone" dataKey="score" dot={false} stroke="#8884d8" />
    </LineChart>
  </ResponsiveContainer>
)

export const RiskGauge = ({ score }) => {
  const value = Math.round(score * 100)
  return (
    <ResponsiveContainer width={50} height={50}>
      <RadialBarChart
        cx="50%" cy="50%" innerRadius="80%" outerRadius="100%"
        data={[{ value }]}
      >
        <RadialBar dataKey="value" minAngle={15} background clockWise />
      </RadialBarChart>
    </ResponsiveContainer>
  )
}

