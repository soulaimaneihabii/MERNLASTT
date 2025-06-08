import { Line } from 'react-chartjs-2'
import { Chart, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js'

Chart.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend)

const VitalsChart = ({ data }) => {
  // Example: assume data like { heartRateHistory: [{ date, value }], glucoseHistory: [{ date, value }] }

  const labels = data?.heartRateHistory?.map(h => new Date(h.date).toLocaleDateString()) || []
  const heartRateData = data?.heartRateHistory?.map(h => h.value) || []

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Fréquence Cardiaque (BPM)',
        data: heartRateData,
        borderColor: '#10b981',
        backgroundColor: '#10b981',
        tension: 0.3
      }
    ]
  }

  return <Line data={chartData} />
}

export default VitalsChart
