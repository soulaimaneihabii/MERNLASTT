// src/components/charts/RiskTag.js
import React from 'react'
import { Tag } from 'antd'

const RiskTag = ({ score }) => {
  let color = 'default'
  let label = 'Unknown'

  if (score > 0.8) {
    color = 'red'
    label = 'High'
  } else if (score > 0.5) {
    color = 'orange'
    label = 'Medium'
  } else {
    color = 'green'
    label = 'Low'
  }

  return <Tag color={color}>{label}</Tag>
}

export default RiskTag
