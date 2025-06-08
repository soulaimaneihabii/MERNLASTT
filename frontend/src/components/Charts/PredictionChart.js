import { Bar } from 'react-chartjs-2'
import { Chart, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js'

Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend)

const PredictionChart = ({ data }) => {
  const monthlyCounts = Array(12).fill(0)

  data?.forEach(pred => {
    const date = new Date(pred.createdAt)
    const month = date.getMonth()
    monthlyCounts[month] += 1
  })

  const chartData = {
    labels: [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ],
    datasets: [
      {
        label: 'Nombre de Prédictions',
        data: monthlyCounts,
        backgroundColor: '#6366f1'
      }
    ]
  }

  return <Bar data={chartData} />
}

export default PredictionChart
