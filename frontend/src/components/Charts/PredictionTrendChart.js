import { Line } from "@ant-design/plots"

const PredictionTrendChart = ({ predictionHistory = [], loading }) => {
  // Filter out items without valid dates or confidence values
  const data = Array.isArray(predictionHistory)
    ? predictionHistory
        .filter((item) => item?.createdAt && item?.confidence !== undefined)
        .map((item) => ({
          date: item.createdAt,
          confidence: (item.confidence || 0) * 100,
        }))
    : []

  const config = {
    data,
    xField: "date",
    yField: "confidence",
    seriesField: "",
    yAxis: {
      label: {
        formatter: (v) => `${v}%`,
      },
    },
    xAxis: {
      tickCount: 5,
    },
    loading,
    animation: {
      appear: {
        animation: "path-in",
        duration: 5000,
      },
    },
  }

  return <Line {...config} />
}

export default PredictionTrendChart
